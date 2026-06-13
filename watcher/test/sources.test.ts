import { describe, it, expect, vi } from "vitest";
import { MockThreatSource, decodeExploitLog, ChainThreatSource, type DrainedLogFetcher } from "../src/sources";
import type { ThreatAlert } from "../src/threat";

const sample: ThreatAlert = {
  network: "arbitrum",
  severity: "CRITICAL",
  attack_type: "drain",
  transaction_hash: "0x1",
  exploit_address: "0xaaaa000000000000000000000000000000000000",
  attacker_address: "0xbbbb000000000000000000000000000000000000",
  block_number: 1,
};

describe("MockThreatSource", () => {
  it("emits the queued alerts to the handler when started", async () => {
    const received: ThreatAlert[] = [];
    const src = new MockThreatSource([sample]);
    await src.start((a) => { received.push(a); });
    expect(received).toEqual([sample]);
  });
});

describe("decodeExploitLog", () => {
  it("builds a Defimon-shaped alert from a Drained log on the watched protocol", () => {
    const alert = decodeExploitLog({
      address: "0xAAAA000000000000000000000000000000000000",
      transactionHash: "0xdead",
      blockNumber: 42n,
      args: { attacker: "0xBBBB000000000000000000000000000000000000", amount: 1000n },
    });
    expect(alert.exploit_address).toBe("0xaaaa000000000000000000000000000000000000");
    expect(alert.attacker_address).toBe("0xbbbb000000000000000000000000000000000000");
    expect(alert.severity).toBe("CRITICAL");
    expect(alert.block_number).toBe(42);
  });
});

describe("ChainThreatSource", () => {
  const drainedLog = {
    address: "0xAAAA000000000000000000000000000000000000",
    transactionHash: "0xdead",
    blockNumber: 42n,
    args: { attacker: "0xBBBB000000000000000000000000000000000000", amount: 1000n },
  };

  it("emits a decoded alert for each Drained log, then stops on abort", async () => {
    const controller = new AbortController();
    let calls = 0;
    const fetcher: DrainedLogFetcher = {
      currentBlock: async () => 40n,
      getDrainedLogs: async () => {
        calls++;
        return calls === 1 ? [drainedLog] : [];
      },
    };
    const received: ThreatAlert[] = [];
    const src = new ChainThreatSource({
      fetcher,
      protocols: ["0xaaaa000000000000000000000000000000000000"],
      pollIntervalMs: 1,
      signal: controller.signal,
    });
    await src.start(async (a) => {
      received.push(a);
      controller.abort(); // arrête le daemon après la 1re alerte
    });
    expect(received).toHaveLength(1);
    expect(received[0].exploit_address).toBe("0xaaaa000000000000000000000000000000000000");
    expect(received[0].attacker_address).toBe("0xbbbb000000000000000000000000000000000000");
    expect(received[0].block_number).toBe(42);
    expect(received[0].severity).toBe("CRITICAL");
  });

  it("does not call onAlert when there are no logs, and stops on abort", async () => {
    const controller = new AbortController();
    const fetcher: DrainedLogFetcher = {
      currentBlock: async () => 10n,
      getDrainedLogs: async () => [],
    };
    const onAlert = vi.fn();
    const src = new ChainThreatSource({
      fetcher,
      protocols: [],
      pollIntervalMs: 1,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 5);
    await src.start(onAlert);
    expect(onAlert).not.toHaveBeenCalled();
  });
});
