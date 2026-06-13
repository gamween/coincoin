import { describe, it, expect, vi } from "vitest";
import { runWatcher } from "../src/watcher";
import { MockThreatSource } from "../src/sources";
import type { ProtectedAccount } from "../src/registry";
import type { ThreatAlert } from "../src/threat";

const alert: ThreatAlert = {
  network: "arbitrum",
  severity: "CRITICAL",
  attack_type: "drain",
  transaction_hash: "0x1",
  exploit_address: "0xaaaa000000000000000000000000000000000000",
  attacker_address: "0xbbbb000000000000000000000000000000000000",
  block_number: 1,
};

const exposed: ProtectedAccount = {
  address: "0x1111111111111111111111111111111111111111",
  safeVault: "0x9999999999999999999999999999999999999999",
  watchedProtocols: ["0xaaaa000000000000000000000000000000000000"],
  tokens: ["0xcccc000000000000000000000000000000000000"],
};
const safe: ProtectedAccount = { ...exposed, address: "0x2222222222222222222222222222222222222222", watchedProtocols: ["0xdddd000000000000000000000000000000000000"] };

describe("runWatcher", () => {
  it("evacuates only the exposed account's tokens when an alert fires", async () => {
    const evacuate = vi.fn().mockResolvedValue("0xhash");
    await runWatcher({
      source: new MockThreatSource([alert]),
      accounts: [exposed, safe],
      keeper: { evacuate },
    });
    expect(evacuate).toHaveBeenCalledTimes(1);
    expect(evacuate).toHaveBeenCalledWith(exposed.address, exposed.tokens);
  });

  it("does nothing when no account is exposed", async () => {
    const evacuate = vi.fn();
    await runWatcher({
      source: new MockThreatSource([{ ...alert, exploit_address: "0xffff000000000000000000000000000000000000" }]),
      accounts: [exposed, safe],
      keeper: { evacuate },
    });
    expect(evacuate).not.toHaveBeenCalled();
  });

  it("continues evacuating other exposed accounts when one evacuation fails", async () => {
    const evacuate = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("0xhash");
    const exposed2: ProtectedAccount = {
      ...exposed,
      address: "0x3333333333333333333333333333333333333333",
    };
    await runWatcher({
      source: new MockThreatSource([alert]),
      accounts: [exposed, exposed2],
      keeper: { evacuate },
    });
    expect(evacuate).toHaveBeenCalledTimes(2);
    expect(evacuate).toHaveBeenNthCalledWith(1, exposed.address, exposed.tokens);
    expect(evacuate).toHaveBeenNthCalledWith(2, exposed2.address, exposed2.tokens);
  });
});
