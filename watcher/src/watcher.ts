import { findExposed, type ProtectedAccount } from "./registry";
import type { ThreatSource } from "./sources";

export interface Keeper {
  evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`>;
  /// Optional: unwind a deposited Aave V3 position back to the account before sweeping.
  exitAaveV3?(
    victim: `0x${string}`,
    pool: `0x${string}`,
    underlyings: `0x${string}`[],
  ): Promise<`0x${string}`>;
}

export interface WatcherDeps {
  source: ThreatSource;
  accounts: ProtectedAccount[];
  keeper: Keeper;
}

/// Wires the loop: each alert → exposed accounts → exit their DeFi positions, then sweep.
/// Daemon-safe: a failed exit/evacuation is logged and DOES NOT INTERRUPT the loop (the
/// other positions and accounts are still processed, the watcher stays alive).
export async function runWatcher({ source, accounts, keeper }: WatcherDeps): Promise<void> {
  await source.start(async (alert) => {
    const exposed = findExposed(alert, accounts);
    for (const acc of exposed) {
      console.log(`[coincoin] 🦆 COIN COIN ! threat on ${alert.exploit_address} → rescuing ${acc.address}`);

      // 1) Exit deposited DeFi positions first (the funds come back to the account).
      if (keeper.exitAaveV3) {
        for (const pos of acc.aavePositions ?? []) {
          try {
            const hash = await keeper.exitAaveV3(acc.address, pos.pool, pos.underlyings);
            console.log(`[coincoin] ↩️  exited Aave position on ${pos.pool} (tx ${hash})`);
          } catch (err) {
            console.error(`[coincoin] ⚠️ Aave exit failed for ${acc.address} on ${pos.pool}:`, err);
          }
        }
      }

      // 2) Sweep everything at rest (incl. the just-freed underlying) to the safe vault.
      try {
        const hash = await keeper.evacuate(acc.address, acc.tokens);
        console.log(`[coincoin] ✅ evacuated to ${acc.safeVault} (tx ${hash})`);
      } catch (err) {
        console.error(`[coincoin] ⚠️ evacuation failed for ${acc.address}:`, err);
      }
    }
  });
}
