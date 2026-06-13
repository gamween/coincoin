import type { ThreatAlert } from "./threat";

export interface ProtectedAccount {
  address: `0x${string}`;       // the delegated EOA (protected account)
  safeVault: `0x${string}`;     // its evacuation destination
  watchedProtocols: `0x${string}`[]; // protocols where it is exposed
  tokens: `0x${string}`[];      // tokens to evacuate from the account
}

/// Protected accounts exposed to the protocol targeted by the alert (case-insensitive comparison).
export function findExposed(alert: ThreatAlert, accounts: ProtectedAccount[]): ProtectedAccount[] {
  const target = alert.exploit_address.toLowerCase();
  return accounts.filter((acc) =>
    acc.watchedProtocols.some((p) => p.toLowerCase() === target),
  );
}
