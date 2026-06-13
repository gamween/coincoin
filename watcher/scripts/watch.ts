import "dotenv/config";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig } from "../src/config";
import { exploitEventAbi } from "../src/abi";
import { ChainThreatSource, type DrainedLog, type DrainedLogFetcher } from "../src/sources";
import { KeeperClient } from "../src/keeper";
import { runWatcher } from "../src/watcher";
import type { ProtectedAccount } from "../src/registry";

/// Daemon de surveillance (le PRODUIT) : observe en continu les logs `Drained` du
/// protocole surveillé et évacue les fonds au repos de la victime dès qu'un exploit
/// est détecté. NE DÉTIENT PAS la clé de la victime : lit VICTIM_ADDRESS et signe
/// l'évacuation avec la clé keeper (`onlySelfOrKeeper`). Arrêt par SIGINT (Ctrl-C).
async function main() {
  const cfg = resolveChainConfig();
  const victimAddress = process.env.VICTIM_ADDRESS as `0x${string}` | undefined;
  if (!victimAddress) throw new Error("watch: VICTIM_ADDRESS manquant");
  const keeperKey = process.env.KEEPER_PRIVATE_KEY;
  if (!keeperKey) throw new Error("watch: KEEPER_PRIVATE_KEY manquant");
  const keeper = privateKeyToAccount(keeperKey as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const keeperWallet = createWalletClient({ account: keeper, chain: cfg.chain, transport });

  const fetcher: DrainedLogFetcher = {
    currentBlock: () => pub.getBlockNumber(),
    getDrainedLogs: async ({ protocols, fromBlock }) => {
      const logs = await pub.getLogs({
        address: protocols,
        event: exploitEventAbi[0],
        fromBlock,
        toBlock: "latest",
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
    console.log("\n[coincoin] 🛑 arrêt du watcher…");
    controller.abort();
  });

  console.log(
    `[coincoin] 👁️  watch — surveillance de ${cfg.proto} sur ${cfg.chain.name} (keeper ${keeper.address})…`,
  );
  await runWatcher({
    source: new ChainThreatSource({ fetcher, protocols: [cfg.proto], signal: controller.signal }),
    accounts: [account],
    keeper: new KeeperClient(keeperWallet),
  });
  console.log("[coincoin] watcher arrêté.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
