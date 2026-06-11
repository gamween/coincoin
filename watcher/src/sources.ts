import { parseThreatAlert, type ThreatAlert } from "./threat";

export type AlertHandler = (alert: ThreatAlert) => void | Promise<void>;

export interface ThreatSource {
  start(onAlert: AlertHandler): Promise<void>;
}

/// Source de transport au schéma Defimon : rejoue des alertes connues (démo / tests).
/// C'est le SEUL élément simulé du système ; le contenu provient d'un vrai exploit on-chain.
export class MockThreatSource implements ThreatSource {
  constructor(private readonly alerts: ThreatAlert[]) {}
  async start(onAlert: AlertHandler): Promise<void> {
    for (const a of this.alerts) await onAlert(a);
  }
}

/// Forme minimale d'un log `Drained` décodé par viem.
export interface DrainedLog {
  address: string;
  transactionHash: string;
  blockNumber: bigint;
  args: { attacker: string; amount: bigint };
}

/// Transforme un vrai log d'exploit on-chain en alerte au schéma Defimon.
export function decodeExploitLog(log: DrainedLog): ThreatAlert {
  return parseThreatAlert({
    network: "arbitrum",
    severity: "CRITICAL",
    attack_type: "drain",
    transaction_hash: log.transactionHash,
    exploit_address: log.address,
    attacker_address: log.args.attacker,
    block_number: Number(log.blockNumber),
  });
}
