import { defineChain, type Chain } from "viem";
import { arbitrumSepolia } from "viem/chains";

export { arbitrumSepolia };

/// Address of the GuardianModule implementation deployed on Arbitrum Sepolia.
/// Used as a fallback when `GUARDIAN_IMPL` is not provided via env.
export const GUARDIAN_IMPL = "0x6671b4B73b79c284A710B00ef777d8E65f55200F" as const;

/// Explicit gas limit for the txs sent via viem. On Arbitrum Orbit chains
/// (Robinhood, chain 46630), auto-estimation underestimates the L1 data cost
/// → "intrinsic gas too low". We force a generous limit (Orbit gas ~0.02 gwei,
/// so a high limit only costs the gas ACTUALLY consumed).
export const ORBIT_TX_GAS = 5_000_000n;

export const ROBINHOOD_TESTNET = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com/rpc"] } },
});

export type ChainKey = "robinhood" | "arbitrumSepolia";

export interface ResolvedConfig {
  chainKey: ChainKey;
  chain: Chain;
  rpcUrl: string;
  guardianImpl: `0x${string}`;
  token: `0x${string}`;
  proto: `0x${string}`;
  vault: `0x${string}`;
  /// Optional Aave-V3-shaped pool holding a deposited position to exit on threat
  /// (DEMO_AAVE_POOL). When set, the watcher unwinds it before sweeping.
  aavePool?: `0x${string}`;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function requireAddressEnv(env: NodeJS.ProcessEnv, key: string): `0x${string}` {
  const v = env[key];
  if (!v || !ADDRESS_RE.test(v)) {
    throw new Error(`config: ${key} missing or invalid (expected a 0x… address)`);
  }
  return v as `0x${string}`;
}

/// Resolves the chain config from the environment. Called by the SCRIPTS
/// only (never at the top level): throws if a required value is missing, but
/// importing the module stays side-effect free. `env` is injectable (tests).
export function resolveChainConfig(env: NodeJS.ProcessEnv = process.env): ResolvedConfig {
  const chainKey: ChainKey = env.CHAIN === "arbitrumSepolia" ? "arbitrumSepolia" : "robinhood";
  const chain = chainKey === "arbitrumSepolia" ? arbitrumSepolia : ROBINHOOD_TESTNET;
  const rpcEnvKey = chainKey === "arbitrumSepolia" ? "ARBITRUM_SEPOLIA_RPC" : "ROBINHOOD_TESTNET_RPC";
  const rpcUrl = env[rpcEnvKey];
  if (!rpcUrl) throw new Error(`config: ${rpcEnvKey} missing for the ${chainKey} chain`);
  const guardianImpl =
    env.GUARDIAN_IMPL && ADDRESS_RE.test(env.GUARDIAN_IMPL)
      ? (env.GUARDIAN_IMPL as `0x${string}`)
      : GUARDIAN_IMPL;
  return {
    chainKey,
    chain,
    rpcUrl,
    guardianImpl,
    token: requireAddressEnv(env, "DEMO_TOKEN"),
    proto: requireAddressEnv(env, "DEMO_PROTO"),
    vault: requireAddressEnv(env, "DEMO_VAULT"),
    aavePool:
      env.DEMO_AAVE_POOL && ADDRESS_RE.test(env.DEMO_AAVE_POOL)
        ? (env.DEMO_AAVE_POOL as `0x${string}`)
        : undefined,
  };
}
