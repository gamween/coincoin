import "dotenv/config";
import { createWalletClient, createPublicClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig } from "../src/config";

/// One-time : la victime délègue (EIP-7702) vers GuardianModule et s'auto-configure
/// (safeVault + keeper). `executor:"self"` car la victime signe ET envoie la tx.
/// Nécessite VICTIM_PRIVATE_KEY, KEEPER_PRIVATE_KEY (pour dériver l'adresse keeper),
/// et la config de chaîne (CHAIN, RPC, GUARDIAN_IMPL, DEMO_VAULT).
async function main() {
  const cfg = resolveChainConfig();
  const victimKey = process.env.VICTIM_PRIVATE_KEY;
  if (!victimKey) throw new Error("onboard: VICTIM_PRIVATE_KEY manquant");
  const keeperKey = process.env.KEEPER_PRIVATE_KEY;
  if (!keeperKey) throw new Error("onboard: KEEPER_PRIVATE_KEY manquant");
  const victim = privateKeyToAccount(victimKey as `0x${string}`);
  const keeper = privateKeyToAccount(keeperKey as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const wallet = createWalletClient({ account: victim, chain: cfg.chain, transport });

  console.log(`[onboard] délégation 7702 de ${victim.address} → ${cfg.guardianImpl} sur ${cfg.chain.name}…`);
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
  } as any);
  await pub.waitForTransactionReceipt({ hash: tx });
  console.log(`[onboard] ✅ délégué + configuré (vault=${cfg.vault}, keeper=${keeper.address}) tx=${tx}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
