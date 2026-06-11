import { describe, it, expect } from "vitest";
import { MockThreatSource, decodeExploitLog } from "../src/sources";
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
