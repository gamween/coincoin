import { config } from "dotenv";
config({ path: "../.env" });
import { createPublicClient, createWalletClient, http, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig, ORBIT_TX_GAS } from "../src/config";

/// Revoke the EIP-7702 delegation: re-point the account's code to address(0). One signature
/// and the account is no longer a guardian — proving "revocable anytime", you're never locked
/// in. (The funds were always yours; this just removes the delegated code.)
async function main() {
  const cfg = resolveChainConfig();
  const victimKey = process.env.VICTIM_PRIVATE_KEY;
  if (!victimKey) throw new Error("revoke: VICTIM_PRIVATE_KEY missing");
  const victim = privateKeyToAccount(victimKey as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const wallet = createWalletClient({ account: victim, chain: cfg.chain, transport });

  console.log(`[revoke] removing 7702 delegation from ${victim.address} on ${cfg.chain.name}…`);
  const auth = await wallet.signAuthorization({ account: victim, contractAddress: zeroAddress, executor: "self" });
  const tx = await wallet.sendTransaction({
    to: victim.address,
    data: "0x",
    authorizationList: [auth],
    gas: ORBIT_TX_GAS,
  } as any);
  await pub.waitForTransactionReceipt({ hash: tx });
  console.log(`[revoke] ✅ delegation cleared — the account is no longer delegated. tx=${tx}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
