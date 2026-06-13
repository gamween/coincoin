import { parseThreatAlert, type ThreatAlert } from "./threat";

export type AlertHandler = (alert: ThreatAlert) => void | Promise<void>;

export interface ThreatSource {
  start(onAlert: AlertHandler): Promise<void>;
}

/// Defimon-shaped transport source: replays known alerts (demo / tests).
/// It is the ONLY simulated element of the system; the content comes from a real on-chain exploit.
export class MockThreatSource implements ThreatSource {
  constructor(private readonly alerts: ThreatAlert[]) {}
  async start(onAlert: AlertHandler): Promise<void> {
    for (const a of this.alerts) await onAlert(a);
  }
}

/// Minimal shape of a `Drained` log decoded by viem.
export interface DrainedLog {
  address: string;
  transactionHash: string;
  blockNumber: bigint;
  args: { attacker: string; amount: bigint };
}

/// Transforms a real on-chain exploit log into a Defimon-shaped alert.
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
  /// `Drained` logs emitted by one of the `protocols` in the window [`fromBlock`, `toBlock`] (inclusive).
  getDrainedLogs(args: { protocols: `0x${string}`[]; fromBlock: bigint; toBlock: bigint }): Promise<DrainedLog[]>;
  /// Number of the latest known block.
  currentBlock(): Promise<bigint>;
}

export interface ChainThreatSourceOpts {
  fetcher: DrainedLogFetcher;
  protocols: `0x${string}`[];
  fromBlock?: bigint;
  pollIntervalMs?: number;
  /// Max size of a `getLogs` window (in blocks, inclusive). RPCs cap this
  /// range (Alchemy free = 10); we catch up to the head in windows ≤ this size.
  maxBlockRange?: number;
  signal?: AbortSignal;
}

/// Waits `ms`, or resolves immediately if `signal` is (or becomes) aborted.
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

/// REAL threat source: continuously watches the on-chain `Drained` logs and
/// emits an alert (Defimon shape) for each detected exploit. Daemon: only resolves
/// on the `AbortSignal`. On each tick, catches up from the cursor to the head in
/// bounded windows (≤ `maxBlockRange`, to respect the RPC caps on `getLogs`), then
/// advances the cursor — at-least-once semantics; logs without a `blockNumber` are
/// filtered out upstream by the fetcher.
export class ChainThreatSource implements ThreatSource {
  private readonly fetcher: DrainedLogFetcher;
  private readonly protocols: `0x${string}`[];
  private readonly fromBlock?: bigint;
  private readonly pollIntervalMs: number;
  private readonly maxBlockRange: number;
  private readonly signal?: AbortSignal;

  constructor(opts: ChainThreatSourceOpts) {
    this.fetcher = opts.fetcher;
    this.protocols = opts.protocols;
    this.fromBlock = opts.fromBlock;
    this.pollIntervalMs = opts.pollIntervalMs ?? 4000;
    this.maxBlockRange = opts.maxBlockRange ?? 10;
    this.signal = opts.signal;
  }

  async start(onAlert: AlertHandler): Promise<void> {
    let cursor = this.fromBlock ?? (await this.fetcher.currentBlock());
    const span = BigInt(this.maxBlockRange);
    while (!this.signal?.aborted) {
      try {
        const head = await this.fetcher.currentBlock();
        // Catch up to the head in windows ≤ maxBlockRange (RPC getLogs cap).
        while (cursor <= head && !this.signal?.aborted) {
          const windowEnd = cursor + span - 1n;
          const toBlock = windowEnd < head ? windowEnd : head;
          const logs = await this.fetcher.getDrainedLogs({ protocols: this.protocols, fromBlock: cursor, toBlock });
          const sorted = [...logs].sort((a, b) =>
            a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0,
          );
          for (const log of sorted) {
            await onAlert(decodeExploitLog(log));
          }
          cursor = toBlock + 1n;
        }
      } catch (err) {
        console.warn("[coincoin] ⚠️ getLogs failed, retrying on the next tick:", err);
      }
      await abortableSleep(this.pollIntervalMs, this.signal);
    }
  }
}
