import { defineChain } from "viem";
import { arbitrumSepolia } from "viem/chains";

export { arbitrumSepolia };

/// Adresse de l'implémentation GuardianModule déployée (cible de délégation 7702).
export const GUARDIAN_IMPL = "0x6671b4B73b79c284A710B00ef777d8E65f55200F" as const;

export const ROBINHOOD_TESTNET = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com/rpc"] } },
});
