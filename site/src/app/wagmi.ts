import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhood } from "./chain";

/// Injected (MetaMask / browser) connector on Robinhood Chain Testnet. No WalletConnect
/// projectId needed — the dashboard talks to whatever wallet the browser injects.
export const config = createConfig({
  chains: [robinhood],
  connectors: [injected()],
  transports: { [robinhood.id]: http() },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
