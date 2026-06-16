import { describe, it, expect } from "vitest";
import { ROBINHOOD_TESTNET } from "../src/config";

describe("smoke", () => {
  it("exposes the Robinhood Chain testnet config", () => {
    expect(ROBINHOOD_TESTNET.id).toBe(46630);
  });
});
