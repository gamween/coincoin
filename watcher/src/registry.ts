import type { ThreatAlert } from "./threat";

export interface ProtectedAccount {
  address: `0x${string}`;       // l'EOA délégué (compte protégé)
  safeVault: `0x${string}`;     // sa destination d'évacuation
  watchedProtocols: `0x${string}`[]; // protocoles où il est exposé
  tokens: `0x${string}`[];      // tokens à évacuer du compte
}

/// Comptes protégés exposés au protocole ciblé par l'alerte (comparaison insensible à la casse).
export function findExposed(alert: ThreatAlert, accounts: ProtectedAccount[]): ProtectedAccount[] {
  const target = alert.exploit_address.toLowerCase();
  return accounts.filter((acc) =>
    acc.watchedProtocols.some((p) => p.toLowerCase() === target),
  );
}
