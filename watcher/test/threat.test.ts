import { describe, it, expect } from "vitest";
import { parseThreatAlert } from "../src/threat";

const valid = {
  network: "arbitrum",
  severity: "CRITICAL",
  attack_type: "suspicious_contract_call_with_profit",
  transaction_hash: "0xabc",
  exploit_address: "0x1111111111111111111111111111111111111111",
  attacker_address: "0x2222222222222222222222222222222222222222",
  block_number: 123,
};

describe("parseThreatAlert", () => {
  it("accepts a valid Defimon-shaped alert and normalizes addresses to lowercase", () => {
    const a = parseThreatAlert({ ...valid, exploit_address: "0xAAAA000000000000000000000000000000000000" });
    expect(a.exploit_address).toBe("0xaaaa000000000000000000000000000000000000");
    expect(a.severity).toBe("CRITICAL");
    expect(a.network).toBe("arbitrum");
  });

  it("rejects an alert missing exploit_address", () => {
    const { exploit_address, ...bad } = valid;
    expect(() => parseThreatAlert(bad)).toThrow(/exploit_address/);
  });

  it("rejects an unknown severity", () => {
    expect(() => parseThreatAlert({ ...valid, severity: "WAT" })).toThrow(/severity/);
  });
});
