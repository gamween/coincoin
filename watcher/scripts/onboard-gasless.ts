import { config } from "dotenv";
config({ path: "../.env" });
import { createWalletClient, createPublicClient, http, encodeFunctionData, parseAbi } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { resolveChainConfig, ORBIT_TX_GAS } from "../src/config";

/// End-to-end proof of the GASLESS onboarding path — the exact flow the browser does, but with a
/// local key standing in for the wallet's two signatures:
///   1) a FRESH EOA (zero balance — it never sends a tx) signs the EIP-712 Policy via the STANDARD
///      viem signTypedData (identical to a wallet's signTypedData), and signs the 7702 authorization;
///   2) the RELAYER pays gas: deploys the user's SafeVault via the factory, then submits ONE type-4
///      tx (to: user, authorizationList: [auth], data: configureWithSig(...)) — delegating AND
///      configuring in one sponsored transaction.
/// If this succeeds, the contract's EIP-712 encoding is wallet-compatible and the relayer flow works.
const FACTORY_ABI = parseAbi([
  "function vaultOf(address owner) view returns (address)",
  "function deploy(address owner) returns (address)",
  "function isDeployed(address owner) view returns (bool)",
]);
const GUARDIAN_ABI = parseAbi([
  "function configureWithSig((address safeVault, address[] keepers) p, uint256 nonce, uint256 deadline, bytes sig)",
  "function configured() view returns (bool)",
  "function safeVault() view returns (address)",
  "function isKeeper(address) view returns (bool)",
]);

async function main() {
  const cfg = resolveChainConfig();
  const factory = process.env.VAULT_FACTORY as `0x${string}` | undefined;
  const relayerKey = process.env.RELAYER_PRIVATE_KEY as `0x${string}` | undefined;
  const keeperKey = process.env.KEEPER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!factory) throw new Error("gasless: VAULT_FACTORY missing");
  if (!relayerKey) throw new Error("gasless: RELAYER_PRIVATE_KEY missing");
  if (!keeperKey) throw new Error("gasless: KEEPER_PRIVATE_KEY missing");
  const keeper = privateKeyToAccount(keeperKey).address;
  const relayer = privateKeyToAccount(relayerKey);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });

  // ── 1) the user (a fresh, unfunded EOA — only signs) ──
  const user = privateKeyToAccount(generatePrivateKey());
  const userWallet = createWalletClient({ account: user, chain: cfg.chain, transport });
  const vault = await pub.readContract({ address: factory, abi: FACTORY_ABI, functionName: "vaultOf", args: [user.address] });
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  console.log(`[gasless] user ${user.address} (0 gas) · vault ${vault} · keeper ${keeper}`);

  // EIP-712 Policy signature (standard signTypedData — what the wallet will do in-browser)
  const sig = await userWallet.signTypedData({
    account: user,
    domain: { name: "coincoin GuardianModule", version: "1", chainId: cfg.chain.id, verifyingContract: user.address },
    types: {
      Policy: [
        { name: "safeVault", type: "address" },
        { name: "keepers", type: "address[]" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Policy",
    message: { safeVault: vault, keepers: [keeper], nonce: 0n, deadline },
  });

  // EIP-7702 authorization (relayer-sponsored → executor is NOT self; nonce = the EOA's nonce = 0)
  const authorization = await userWallet.signAuthorization({
    account: user,
    contractAddress: cfg.guardianImpl,
    chainId: cfg.chain.id,
    nonce: 0,
  });

  // ── 2) the relayer pays gas ──
  const relayerWallet = createWalletClient({ account: relayer, chain: cfg.chain, transport });
  if (!(await pub.readContract({ address: factory, abi: FACTORY_ABI, functionName: "isDeployed", args: [user.address] }))) {
    const dtx = await relayerWallet.writeContract({ address: factory, abi: FACTORY_ABI, functionName: "deploy", args: [user.address], gas: ORBIT_TX_GAS });
    await pub.waitForTransactionReceipt({ hash: dtx });
    console.log(`[gasless] relayer deployed vault (tx ${dtx})`);
  }
  const data = encodeFunctionData({
    abi: GUARDIAN_ABI,
    functionName: "configureWithSig",
    args: [{ safeVault: vault, keepers: [keeper] }, 0n, deadline, sig],
  });
  const tx = await relayerWallet.sendTransaction({ to: user.address, data, authorizationList: [authorization], gas: ORBIT_TX_GAS } as never);
  const rcpt = await pub.waitForTransactionReceipt({ hash: tx });
  if (rcpt.status !== "success") throw new Error(`[gasless] configure tx reverted: ${tx}`);
  console.log(`[gasless] relayer submitted delegate+configure (tx ${tx})`);

  // ── verify ──
  const g = { address: user.address, abi: GUARDIAN_ABI } as const;
  const [configured, sv, isK] = await Promise.all([
    pub.readContract({ ...g, functionName: "configured" }),
    pub.readContract({ ...g, functionName: "safeVault" }),
    pub.readContract({ ...g, functionName: "isKeeper", args: [keeper] }),
  ]);
  const ok = configured === true && sv.toLowerCase() === vault.toLowerCase() && isK === true;
  console.log(`[gasless] verify → configured=${configured} safeVault=${sv} isKeeper=${isK}`);
  if (!ok) throw new Error("[gasless] verification failed");
  console.log("[gasless] ✅ gasless onboarding works end-to-end (user paid 0 gas)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
