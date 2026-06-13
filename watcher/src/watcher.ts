import { findExposed, type ProtectedAccount } from "./registry";
import type { ThreatSource } from "./sources";

export interface Keeper {
  evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`>;
}

export interface WatcherDeps {
  source: ThreatSource;
  accounts: ProtectedAccount[];
  keeper: Keeper;
}

/// Wires the loop: each alert → exposed accounts → evacuation of their tokens.
/// Daemon-safe: a failed evacuation is logged and DOES NOT INTERRUPT the loop
/// (the other exposed accounts are still processed, the watcher stays alive).
export async function runWatcher({ source, accounts, keeper }: WatcherDeps): Promise<void> {
  await source.start(async (alert) => {
    const exposed = findExposed(alert, accounts);
    for (const acc of exposed) {
      console.log(`[coincoin] 🦆 COIN COIN ! threat on ${alert.exploit_address} → evacuating ${acc.address}`);
      try {
        const hash = await keeper.evacuate(acc.address, acc.tokens);
        console.log(`[coincoin] ✅ evacuated to ${acc.safeVault} (tx ${hash})`);
      } catch (err) {
        console.error(`[coincoin] ⚠️ evacuation failed for ${acc.address}:`, err);
      }
    }
  });
}
