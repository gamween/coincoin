import { describe, it, expect } from "vitest";
import { findExposed, type ProtectedAccount } from "../src/registry";
import type { ThreatAlert } from "../src/threat";

const alert: ThreatAlert = {
  network: "arbitrum",
  severity: "CRITICAL",
  attack_type: "x",
  transaction_hash: "0x1",
  exploit_address: "0xaaaa000000000000000000000000000000000000",
  attacker_address: "0xbbbb000000000000000000000000000000000000",
  block_number: 1,
};

const accounts: ProtectedAccount[] = [
  {
    address: "0x1111111111111111111111111111111111111111",
    safeVault: "0x9999999999999999999999999999999999999999",
    watchedProtocols: ["0xAAAA000000000000000000000000000000000000"], // exposé (casse différente)
    tokens: ["0xcccc000000000000000000000000000000000000"],
  },
  {
    address: "0x2222222222222222222222222222222222222222",
    safeVault: "0x8888888888888888888888888888888888888888",
    watchedProtocols: ["0xdddd000000000000000000000000000000000000"], // non exposé
    tokens: ["0xcccc000000000000000000000000000000000000"],
  },
];

describe("findExposed", () => {
  it("returns accounts whose watchedProtocols include the exploited address (case-insensitive)", () => {
    const exposed = findExposed(alert, accounts);
    expect(exposed.map((a) => a.address)).toEqual(["0x1111111111111111111111111111111111111111"]);
  });

  it("returns empty when nobody watches the exploited protocol", () => {
    const exposed = findExposed({ ...alert, exploit_address: "0xffff000000000000000000000000000000000000" }, accounts);
    expect(exposed).toEqual([]);
  });
});
