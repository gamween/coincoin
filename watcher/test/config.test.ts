import { describe, it, expect } from "vitest";
import { resolveChainConfig, ROBINHOOD_TESTNET, arbitrumSepolia } from "../src/config";

const base = {
  ROBINHOOD_TESTNET_RPC: "https://rh.example/rpc",
  ARBITRUM_SEPOLIA_RPC: "https://arb.example/rpc",
  GUARDIAN_IMPL: "0x9876000000000000000000000000000000000000",
  DEMO_TOKEN: "0xcccc000000000000000000000000000000000000",
  DEMO_PROTO: "0xaaaa000000000000000000000000000000000000",
  DEMO_VAULT: "0x9999999999999999999999999999999999999999",
} as NodeJS.ProcessEnv;

describe("resolveChainConfig", () => {
  it("defaults to Robinhood and resolves addresses from env", () => {
    const cfg = resolveChainConfig(base);
    expect(cfg.chainKey).toBe("robinhood");
    expect(cfg.chain.id).toBe(ROBINHOOD_TESTNET.id);
    expect(cfg.rpcUrl).toBe("https://rh.example/rpc");
    expect(cfg.proto).toBe("0xaaaa000000000000000000000000000000000000");
    expect(cfg.guardianImpl).toBe("0x9876000000000000000000000000000000000000");
  });

  it("selects Arbitrum Sepolia when CHAIN=arbitrumSepolia", () => {
    const cfg = resolveChainConfig({ ...base, CHAIN: "arbitrumSepolia" });
    expect(cfg.chainKey).toBe("arbitrumSepolia");
    expect(cfg.chain.id).toBe(arbitrumSepolia.id);
    expect(cfg.rpcUrl).toBe("https://arb.example/rpc");
  });

  it("resolves GUARDIAN_IMPL from env", () => {
    const cfg = resolveChainConfig({ ...base, GUARDIAN_IMPL: "0x1234000000000000000000000000000000000000" });
    expect(cfg.guardianImpl).toBe("0x1234000000000000000000000000000000000000");
  });

  it("throws when a required demo address is missing", () => {
    const { DEMO_PROTO, ...missing } = base as Record<string, string>;
    expect(() => resolveChainConfig(missing as NodeJS.ProcessEnv)).toThrow(/DEMO_PROTO/);
  });

  it("throws when the selected chain's RPC is missing", () => {
    const { ROBINHOOD_TESTNET_RPC, ...missing } = base as Record<string, string>;
    expect(() => resolveChainConfig(missing as NodeJS.ProcessEnv)).toThrow(/ROBINHOOD_TESTNET_RPC/);
  });
});
