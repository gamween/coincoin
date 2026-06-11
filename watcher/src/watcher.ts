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

/// Câble la boucle : chaque alerte → comptes exposés → évacuation de leurs tokens.
export async function runWatcher({ source, accounts, keeper }: WatcherDeps): Promise<void> {
  await source.start(async (alert) => {
    const exposed = findExposed(alert, accounts);
    for (const acc of exposed) {
      console.log(`[coincoin] 🦆 COIN COIN ! menace sur ${alert.exploit_address} → évacuation de ${acc.address}`);
      const hash = await keeper.evacuate(acc.address, acc.tokens);
      console.log(`[coincoin] ✅ évacué vers ${acc.safeVault} (tx ${hash})`);
    }
  });
}
