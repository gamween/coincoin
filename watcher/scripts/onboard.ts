import { config } from "dotenv";
config({ path: "../.env" });
import { createWalletClient, createPublicClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig, ORBIT_TX_GAS } from "../src/config";

/// One-time: the victim delegates (EIP-7702) to GuardianModule and self-configures
/// (safeVault + keeper). `executor:"self"` because the victim signs AND sends the tx.
/// Requires VICTIM_PRIVATE_KEY, KEEPER_PRIVATE_KEY (to derive the keeper address),
/// and the chain config (CHAIN, RPC, GUARDIAN_IMPL, DEMO_VAULT).
async function main() {
  const cfg = resolveChainConfig();
  const victimKey = process.env.VICTIM_PRIVATE_KEY;
  if (!victimKey) throw new Error("onboard: VICTIM_PRIVATE_KEY missing");
  const keeperKey = process.env.KEEPER_PRIVATE_KEY;
  if (!keeperKey) throw new Error("onboard: KEEPER_PRIVATE_KEY missing");
  const victim = privateKeyToAccount(victimKey as `0x${string}`);
  const keeper = privateKeyToAccount(keeperKey as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const wallet = createWalletClient({ account: victim, chain: cfg.chain, transport });

  console.log(`[onboard] 7702 delegation from ${victim.address} → ${cfg.guardianImpl} on ${cfg.chain.name}…`);
  const auth = await wallet.signAuthorization({
    account: victim,
    contractAddress: cfg.guardianImpl,
    executor: "self",
  });
  const configureData = encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "configure",
        stateMutability: "nonpayable",
        inputs: [
          { name: "safeVault_", type: "address" },
          { name: "keeper_", type: "address" },
        ],
        outputs: [],
      },
    ],
    functionName: "configure",
    args: [cfg.vault, keeper.address],
  });
  const tx = await wallet.sendTransaction({
    to: victim.address,
    data: configureData,
    authorizationList: [auth],
    gas: ORBIT_TX_GAS,
  } as any);
  const receipt = await pub.waitForTransactionReceipt({ hash: tx });
  if (receipt.status !== "success") {
    throw new Error(
      `[onboard] tx reverted (status=${receipt.status}) tx=${tx} — ` +
        `check the GuardianModule impl/vault and that the account isn't locked to a different vault`,
    );
  }
  console.log(`[onboard] ✅ delegated + configured (vault=${cfg.vault}, keeper=${keeper.address}) tx=${tx}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
