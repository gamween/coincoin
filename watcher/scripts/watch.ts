import { config } from "dotenv";
config({ path: "../.env" });
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig, ORBIT_TX_GAS } from "../src/config";
import { exploitEventAbi } from "../src/abi";
import { ChainThreatSource, type DrainedLog, type DrainedLogFetcher } from "../src/sources";
import { KeeperClient } from "../src/keeper";
import { runWatcher } from "../src/watcher";
import type { ProtectedAccount } from "../src/registry";

/// Monitoring daemon (the PRODUCT): continuously watches the `Drained` logs of the
/// monitored protocol and evacuates the victim's at-rest funds as soon as an exploit
/// is detected. DOES NOT HOLD the victim's key: reads VICTIM_ADDRESS and signs the
/// evacuation with the keeper key (`onlySelfOrKeeper`). Stops on SIGINT (Ctrl-C).
async function main() {
  const cfg = resolveChainConfig();
  const victimAddress = process.env.VICTIM_ADDRESS as `0x${string}` | undefined;
  if (!victimAddress) throw new Error("watch: VICTIM_ADDRESS missing");
  const keeperKey = process.env.KEEPER_PRIVATE_KEY;
  if (!keeperKey) throw new Error("watch: KEEPER_PRIVATE_KEY missing");
  const keeper = privateKeyToAccount(keeperKey as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const keeperWallet = createWalletClient({ account: keeper, chain: cfg.chain, transport });

  const fetcher: DrainedLogFetcher = {
    currentBlock: () => pub.getBlockNumber(),
    getDrainedLogs: async ({ protocols, fromBlock, toBlock }) => {
      const logs = await pub.getLogs({
        address: protocols,
        event: exploitEventAbi[0],
        fromBlock,
        toBlock,
      });
      return logs
        .filter((l) => l.blockNumber !== null && l.transactionHash !== null)
        .map(
          (l): DrainedLog => ({
            address: l.address,
            transactionHash: l.transactionHash as `0x${string}`,
            blockNumber: l.blockNumber as bigint,
            args: {
              attacker: l.args.attacker as `0x${string}`,
              amount: l.args.amount as bigint,
            },
          }),
        );
    },
  };

  const account: ProtectedAccount = {
    address: victimAddress,
    safeVault: cfg.vault,
    watchedProtocols: [cfg.proto],
    tokens: [cfg.token],
  };

  const controller = new AbortController();
  process.on("SIGINT", () => {
    console.log("\n[coincoin] 🛑 stopping the watcher…");
    controller.abort();
  });

  console.log(
    `[coincoin] 👁️  watch — monitoring ${cfg.proto} on ${cfg.chain.name} (keeper ${keeper.address})…`,
  );
  await runWatcher({
    source: new ChainThreatSource({ fetcher, protocols: [cfg.proto], signal: controller.signal }),
    accounts: [account],
    keeper: new KeeperClient(keeperWallet, ORBIT_TX_GAS),
  });
  console.log("[coincoin] watcher stopped.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
