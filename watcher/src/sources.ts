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

export interface DrainedLogFetcher {
  /// Logs `Drained` émis par l'un des `protocols` depuis `fromBlock` (inclus).
  getDrainedLogs(args: { protocols: `0x${string}`[]; fromBlock: bigint }): Promise<DrainedLog[]>;
  /// Numéro du dernier bloc connu.
  currentBlock(): Promise<bigint>;
}

export interface ChainThreatSourceOpts {
  fetcher: DrainedLogFetcher;
  protocols: `0x${string}`[];
  fromBlock?: bigint;
  pollIntervalMs?: number;
  signal?: AbortSignal;
}

/// Attend `ms`, ou se résout immédiatement si `signal` est (ou devient) aborté.
function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/// Source de menace RÉELLE : surveille en continu les logs `Drained` on-chain et
/// émet une alerte (schéma Defimon) pour chaque exploit détecté. Daemon : ne se
/// résout qu'à l'`AbortSignal`. Sémantique at-least-once (curseur = dernier bloc
/// vu + 1) ; les logs sans `blockNumber` sont filtrés en amont par le fetcher.
export class ChainThreatSource implements ThreatSource {
  private readonly fetcher: DrainedLogFetcher;
  private readonly protocols: `0x${string}`[];
  private readonly fromBlock?: bigint;
  private readonly pollIntervalMs: number;
  private readonly signal?: AbortSignal;

  constructor(opts: ChainThreatSourceOpts) {
    this.fetcher = opts.fetcher;
    this.protocols = opts.protocols;
    this.fromBlock = opts.fromBlock;
    this.pollIntervalMs = opts.pollIntervalMs ?? 4000;
    this.signal = opts.signal;
  }

  async start(onAlert: AlertHandler): Promise<void> {
    let cursor = this.fromBlock ?? (await this.fetcher.currentBlock());
    while (!this.signal?.aborted) {
      try {
        const logs = await this.fetcher.getDrainedLogs({ protocols: this.protocols, fromBlock: cursor });
        const sorted = [...logs].sort((a, b) =>
          a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0,
        );
        for (const log of sorted) {
          await onAlert(decodeExploitLog(log));
        }
        if (sorted.length > 0) {
          cursor = sorted[sorted.length - 1].blockNumber + 1n;
        }
      } catch (err) {
        console.warn("[coincoin] ⚠️ getLogs a échoué, nouvelle tentative au prochain tick:", err);
      }
      await abortableSleep(this.pollIntervalMs, this.signal);
    }
  }
}
