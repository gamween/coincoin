import { describe, it, expect } from "vitest";
import { GUARDIAN_IMPL } from "../src/config";

describe("smoke", () => {
  it("exposes the deployed guardian impl address", () => {
    expect(GUARDIAN_IMPL).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
