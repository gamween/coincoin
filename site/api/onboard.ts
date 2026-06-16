import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseAbi,
  isAddress,
  recoverAuthorizationAddress,
  defineChain,
  type SignedAuthorization,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

/// Gasless onboarding relayer. The browser sends the user's two off-chain signatures (an EIP-7702
/// authorization delegating to the GuardianModule + an EIP-712 Policy for `configureWithSig`). The
/// relayer validates them against the canonical policy, deploys the user's deterministic SafeVault if
/// needed, then submits ONE sponsored type-4 transaction that delegates AND configures. The user
/// pays no gas. The relayer can only ever apply the canonical policy (official keeper + the user's
/// own factory vault) — it cannot delegate an account to arbitrary code or redirect funds.

const CHAIN_ID = 46630;
const GUARDIAN = (process.env.GUARDIAN_IMPL ?? "0x9953BB30cFef2ac842C74417eA6DC661b492E8dA").toLowerCase();
const FACTORY = (process.env.VAULT_FACTORY ?? "0x1ef2B2539fa842A9c7e4EA07790aA6dBc47ec4A5") as `0x${string}`;
const KEEPER = (process.env.KEEPER_ADDRESS ?? "0x627872F35b724222413e7421C9e40A26B2762B9e").toLowerCase();
const RPC = process.env.ROBINHOOD_TESTNET_RPC ?? "https://rpc.testnet.chain.robinhood.com/rpc";
const ORBIT_GAS = 5_000_000n;

const robinhood = defineChain({
  id: CHAIN_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

const FACTORY_ABI = parseAbi([
  "function vaultOf(address owner) view returns (address)",
  "function deploy(address owner) returns (address)",
  "function isDeployed(address owner) view returns (bool)",
]);
const GUARDIAN_ABI = parseAbi([
  "function configureWithSig((address safeVault, address[] keepers) p, uint256 nonce, uint256 deadline, bytes sig)",
]);

type Body = {
  owner: `0x${string}`;
  authorization: SignedAuthorization;
  policy: { safeVault: `0x${string}`; keepers: `0x${string}`[] };
  nonce: string | number;
  deadline: string | number;
  sig: `0x${string}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const relayerKey = process.env.RELAYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!relayerKey) return res.status(500).json({ error: "relayer not configured" });

  let body: Body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body as Body);
  } catch {
    return res.status(400).json({ error: "invalid JSON" });
  }
  const { owner, authorization, policy, nonce, deadline, sig } = body ?? ({} as Body);

  // ── validate ──
  if (!owner || !isAddress(owner)) return res.status(400).json({ error: "bad owner" });
  if (!policy || !isAddress(policy.safeVault) || !Array.isArray(policy.keepers)) return res.status(400).json({ error: "bad policy" });
  if (Number(deadline) <= Math.floor(Date.now() / 1000)) return res.status(400).json({ error: "deadline passed" });
  if (policy.keepers.length !== 1 || policy.keepers[0].toLowerCase() !== KEEPER) {
    return res.status(400).json({ error: "policy must use the canonical keeper" });
  }
  if (!authorization || (authorization.address ?? "").toLowerCase() !== GUARDIAN) {
    return res.status(400).json({ error: "authorization must target the GuardianModule" });
  }
  if (authorization.chainId !== 0 && authorization.chainId !== CHAIN_ID) {
    return res.status(400).json({ error: "authorization chainId mismatch" });
  }

  const pub = createPublicClient({ chain: robinhood, transport: http(RPC) });

  // the policy must point at the user's OWN deterministic factory vault — nothing else
  const expectedVault = (await pub.readContract({ address: FACTORY, abi: FACTORY_ABI, functionName: "vaultOf", args: [owner] })) as `0x${string}`;
  if (policy.safeVault.toLowerCase() !== expectedVault.toLowerCase()) {
    return res.status(400).json({ error: "safeVault is not the caller's factory vault" });
  }
  // the authorization must have been signed by the owner
  try {
    const signer = await recoverAuthorizationAddress({ authorization });
    if (signer.toLowerCase() !== owner.toLowerCase()) return res.status(400).json({ error: "authorization signer mismatch" });
  } catch {
    return res.status(400).json({ error: "unrecoverable authorization" });
  }

  // ── relay (pay gas) ──
  const relayer = privateKeyToAccount(relayerKey);
  const wallet = createWalletClient({ account: relayer, chain: robinhood, transport: http(RPC) });
  try {
    const deployed = (await pub.readContract({ address: FACTORY, abi: FACTORY_ABI, functionName: "isDeployed", args: [owner] })) as boolean;
    if (!deployed) {
      const dtx = await wallet.writeContract({ address: FACTORY, abi: FACTORY_ABI, functionName: "deploy", args: [owner], gas: ORBIT_GAS });
      await pub.waitForTransactionReceipt({ hash: dtx });
    }
    const data = encodeFunctionData({
      abi: GUARDIAN_ABI,
      functionName: "configureWithSig",
      args: [{ safeVault: policy.safeVault, keepers: policy.keepers }, BigInt(nonce), BigInt(deadline), sig],
    });
    const txHash = await wallet.sendTransaction({ to: owner, data, authorizationList: [authorization], gas: ORBIT_GAS } as never);
    return res.status(200).json({ ok: true, txHash, vault: expectedVault });
  } catch (e) {
    return res.status(500).json({ error: "relay failed", detail: (e as Error).message });
  }
}
