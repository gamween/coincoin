import { defineChain, type Chain } from "viem";
import { arbitrumSepolia } from "viem/chains";

export { arbitrumSepolia };

/// Adresse de l'implémentation GuardianModule déployée sur Arbitrum Sepolia.
/// Sert de fallback quand `GUARDIAN_IMPL` n'est pas fourni en env.
export const GUARDIAN_IMPL = "0x6671b4B73b79c284A710B00ef777d8E65f55200F" as const;

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
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function requireAddressEnv(env: NodeJS.ProcessEnv, key: string): `0x${string}` {
  const v = env[key];
  if (!v || !ADDRESS_RE.test(v)) {
    throw new Error(`config: ${key} manquant ou invalide (attendu une adresse 0x…)`);
  }
  return v as `0x${string}`;
}

/// Résout la config de chaîne depuis l'environnement. Appelée par les SCRIPTS
/// uniquement (jamais au top-level) : throw si une valeur requise manque, mais
/// l'import du module reste sans effet de bord. `env` est injectable (tests).
export function resolveChainConfig(env: NodeJS.ProcessEnv = process.env): ResolvedConfig {
  const chainKey: ChainKey = env.CHAIN === "arbitrumSepolia" ? "arbitrumSepolia" : "robinhood";
  const chain = chainKey === "arbitrumSepolia" ? arbitrumSepolia : ROBINHOOD_TESTNET;
  const rpcEnvKey = chainKey === "arbitrumSepolia" ? "ARBITRUM_SEPOLIA_RPC" : "ROBINHOOD_TESTNET_RPC";
  const rpcUrl = env[rpcEnvKey];
  if (!rpcUrl) throw new Error(`config: ${rpcEnvKey} manquant pour la chaîne ${chainKey}`);
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
  };
}
