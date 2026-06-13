# coincoin — Phase 5: Real on-chain detection + Robinhood demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mocked detection with a real daemon that watches the on-chain `Drained` logs (`ChainThreatSource`), and make the whole thing configurable to run on Robinhood Chain Testnet (chain 46630).

**Architecture:** We add a real threat source (`ChainThreatSource`) that polls `getLogs` via an injected fetcher (testable without a live chain) and reuses the existing `decodeExploitLog`. `config.ts` becomes env-driven (default Robinhood). Three separate scripts replace `demo.ts`: `onboard` (7702 delegation + configure, one-time), `watch` (the daemon), `exploit` (the attacker = deployer, the only simulated actor). `runWatcher` is hardened (per-account try/catch). No Solidity change: the Phase 4 contracts are redeployed as is on Robinhood.

**Tech Stack:** Node 22, pnpm, TypeScript, viem 2.52 (EIP-7702 + getLogs), vitest, tsx. Foundry (deployment only, existing scripts). Source spec: `docs/superpowers/specs/2026-06-12-phase5-chain-detection-robinhood-design.md`.

---

## Prerequisites & context

- **Phase 4 merged** (on `main`): `watcher/` with `threat.ts`, `registry.ts`, `keeper.ts`/`abi.ts`, `sources.ts` (`ThreatSource`/`MockThreatSource`/`decodeExploitLog`/`DrainedLog`), `watcher.ts` (`runWatcher`), `config.ts`; contracts `MockVulnerableProtocol`/`Attacker` + forge scripts `DeployGuardian` (`contracts/script/Deploy.s.sol`) and `SetupDemo` (`contracts/script/SetupDemo.s.sol`).
- **7702 confirmed on Robinhood** (ArbOS 61). Nothing is deployed there: we redeploy the contracts (no new Solidity code).
- **viem 2.52** installed: `signAuthorization` is a wallet action by default, `executor:"self"` required for 7702 self-execution (acquired in Phase 4).
- **Runtime addresses** read from `../.env` (gitignored): `CHAIN`, `ROBINHOOD_TESTNET_RPC`/`ARBITRUM_SEPOLIA_RPC`, `GUARDIAN_IMPL` (override), `DEMO_TOKEN`/`DEMO_PROTO`/`DEMO_VAULT`, `DEPLOYER_PRIVATE_KEY`/`VICTIM_PRIVATE_KEY`/`VICTIM_ADDRESS`/`KEEPER_PRIVATE_KEY`.

## File structure (Phase 5)

```
watcher/
├── src/
│   ├── config.ts        # MODIFIED: + env-driven resolveChainConfig()
│   ├── sources.ts       # MODIFIED: + DrainedLogFetcher + ChainThreatSource
│   └── watcher.ts       # MODIFIED: runWatcher per-account try/catch
├── test/
│   ├── config.test.ts   # CREATED: resolveChainConfig
│   ├── sources.test.ts  # MODIFIED: + ChainThreatSource tests
│   └── watcher.test.ts  # MODIFIED: + resilience test
├── scripts/
│   ├── onboard.ts       # CREATED: 7702 delegation + configure (one-time)
│   ├── watch.ts         # CREATED: daemon (ChainThreatSource -> runWatcher)
│   ├── exploit.ts       # CREATED: attacker (deployer) drains the protocol
│   └── demo.ts          # REMOVED (replaced by the 3 above)
├── package.json         # MODIFIED: watch/onboard/exploit scripts (removes demo)
└── README.md            # MODIFIED: Robinhood deployment + multi-terminal flow
.env.example             # MODIFIED: + CHAIN, GUARDIAN_IMPL, ROBINHOOD_TESTNET_RPC
```

---

### Task 1: Harden `runWatcher` (per-account try/catch)

**Files:**
- Modify: `watcher/src/watcher.ts`
- Test: `watcher/test/watcher.test.ts`

- [ ] **Step 1: Add the resilience test (`watcher/test/watcher.test.ts`)**

Add this test AT THE END of the existing `describe("runWatcher", ...)` (before the `describe`'s closing brace):

```typescript
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
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd watcher && pnpm vitest run test/watcher.test.ts`
Expected: FAIL — the rejected `evacuate` propagates out of `runWatcher` (rejected promise / the 2nd call never reached).

- [ ] **Step 3: Modify `watcher/src/watcher.ts`**

Replace the body of the `for` loop in `runWatcher` with a version that has a per-account try/catch. The full file becomes:

```typescript
import { findExposed, type ProtectedAccount } from "./registry";
import type { ThreatSource } from "./sources";

export interface Keeper {
  evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`>;
}

export interface WatcherDeps {
  source: ThreatSource;
  accounts: ProtectedAccount[];
  keeper: Keeper;
}

/// Wires the loop: each alert → exposed accounts → evacuation of their tokens.
/// Daemon-safe: an evacuation that fails is logged and DOES NOT INTERRUPT the loop
/// (the other exposed accounts are still processed, the watcher stays alive).
export async function runWatcher({ source, accounts, keeper }: WatcherDeps): Promise<void> {
  await source.start(async (alert) => {
    const exposed = findExposed(alert, accounts);
    for (const acc of exposed) {
      console.log(`[coincoin] 🦆 COIN COIN ! threat on ${alert.exploit_address} → evacuating ${acc.address}`);
      try {
        const hash = await keeper.evacuate(acc.address, acc.tokens);
        console.log(`[coincoin] ✅ evacuated to ${acc.safeVault} (tx ${hash})`);
      } catch (err) {
        console.error(`[coincoin] ⚠️ evacuation failed for ${acc.address}:`, err);
      }
    }
  });
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd watcher && pnpm vitest run test/watcher.test.ts`
Expected: PASS (3 tests: the 2 existing ones + the new one).

- [ ] **Step 5: Commit**

```bash
git add watcher/src/watcher.ts watcher/test/watcher.test.ts
git commit -m "feat(watcher): harden runWatcher with per-account evacuation try/catch"
```

---

### Task 2: env-driven `config.ts` (`resolveChainConfig`)

**Files:**
- Modify: `watcher/src/config.ts`
- Test: `watcher/test/config.test.ts`

- [ ] **Step 1: Write the failing test (`watcher/test/config.test.ts`)**

```typescript
import { describe, it, expect } from "vitest";
import { resolveChainConfig, GUARDIAN_IMPL, ROBINHOOD_TESTNET, arbitrumSepolia } from "../src/config";

const base = {
  ROBINHOOD_TESTNET_RPC: "https://rh.example/rpc",
  ARBITRUM_SEPOLIA_RPC: "https://arb.example/rpc",
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
    expect(cfg.guardianImpl).toBe(GUARDIAN_IMPL); // constant fallback
  });

  it("selects Arbitrum Sepolia when CHAIN=arbitrumSepolia", () => {
    const cfg = resolveChainConfig({ ...base, CHAIN: "arbitrumSepolia" });
    expect(cfg.chainKey).toBe("arbitrumSepolia");
    expect(cfg.chain.id).toBe(arbitrumSepolia.id);
    expect(cfg.rpcUrl).toBe("https://arb.example/rpc");
  });

  it("uses GUARDIAN_IMPL override when provided", () => {
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
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd watcher && pnpm vitest run test/config.test.ts`
Expected: FAIL — `resolveChainConfig` doesn't exist yet (export not found).

- [ ] **Step 3: Modify `watcher/src/config.ts`** (full file)

```typescript
import { defineChain, type Chain } from "viem";
import { arbitrumSepolia } from "viem/chains";

export { arbitrumSepolia };

/// Address of the GuardianModule implementation deployed on Arbitrum Sepolia.
/// Used as a fallback when `GUARDIAN_IMPL` is not provided in env.
export const GUARDIAN_IMPL = "0x6671b4B73b79c284A710B00ef777d8E65f55200F" as const;

export const ROBINHOOD_TESTNET = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com/rpc"] } },
});

export type ChainKey = "robinhood" | "arbitrumSepolia";

export interface ResolvedConfig {
  chainKey: ChainKey;
  chain: Chain;
  rpcUrl: string;
  guardianImpl: `0x${string}`;
  token: `0x${string}`;
  proto: `0x${string}`;
  vault: `0x${string}`;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function requireAddressEnv(env: NodeJS.ProcessEnv, key: string): `0x${string}` {
  const v = env[key];
  if (!v || !ADDRESS_RE.test(v)) {
    throw new Error(`config: ${key} missing or invalid (expected a 0x… address)`);
  }
  return v as `0x${string}`;
}

/// Resolves the chain config from the environment. Called by the SCRIPTS only
/// (never at the top level): throws if a required value is missing, but importing
/// the module stays side-effect-free. `env` is injectable (tests).
export function resolveChainConfig(env: NodeJS.ProcessEnv = process.env): ResolvedConfig {
  const chainKey: ChainKey = env.CHAIN === "arbitrumSepolia" ? "arbitrumSepolia" : "robinhood";
  const chain = chainKey === "arbitrumSepolia" ? arbitrumSepolia : ROBINHOOD_TESTNET;
  const rpcEnvKey = chainKey === "arbitrumSepolia" ? "ARBITRUM_SEPOLIA_RPC" : "ROBINHOOD_TESTNET_RPC";
  const rpcUrl = env[rpcEnvKey];
  if (!rpcUrl) throw new Error(`config: ${rpcEnvKey} missing for chain ${chainKey}`);
  const guardianImpl =
    env.GUARDIAN_IMPL && ADDRESS_RE.test(env.GUARDIAN_IMPL)
      ? (env.GUARDIAN_IMPL as `0x${string}`)
      : GUARDIAN_IMPL;
  return {
    chainKey,
    chain,
    rpcUrl,
    guardianImpl,
    token: requireAddressEnv(env, "DEMO_TOKEN"),
    proto: requireAddressEnv(env, "DEMO_PROTO"),
    vault: requireAddressEnv(env, "DEMO_VAULT"),
  };
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd watcher && pnpm vitest run test/config.test.ts`
Expected: PASS (5 tests). Also verify that `test/smoke.test.ts` still passes (`GUARDIAN_IMPL` import unchanged): `cd watcher && pnpm vitest run test/smoke.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add watcher/src/config.ts watcher/test/config.test.ts
git commit -m "feat(watcher): env-driven chain config (resolveChainConfig, default Robinhood)"
```

---

### Task 3: `ChainThreatSource` (real on-chain detection)

**Files:**
- Modify: `watcher/src/sources.ts`
- Test: `watcher/test/sources.test.ts`

- [ ] **Step 1: Add the failing tests (`watcher/test/sources.test.ts`)**

First, replace THE THREE EXISTING IMPORT LINES at the top of the file (the `vitest` import, the `../src/sources` one, the `../src/threat` one) with exactly these three lines (adds `vi`, `ChainThreatSource`, `DrainedLogFetcher`; do not duplicate the existing imports):

```typescript
import { describe, it, expect, vi } from "vitest";
import { MockThreatSource, decodeExploitLog, ChainThreatSource, type DrainedLogFetcher } from "../src/sources";
import type { ThreatAlert } from "../src/threat";
```

Then add this block AT THE END of the file:

```typescript
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
      controller.abort(); // stops the daemon after the 1st alert
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
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd watcher && pnpm vitest run test/sources.test.ts`
Expected: FAIL — `ChainThreatSource` / `DrainedLogFetcher` not found.

- [ ] **Step 3: Modify `watcher/src/sources.ts`** — add AT THE END of the file (after `decodeExploitLog`):

```typescript

export interface DrainedLogFetcher {
  /// `Drained` logs emitted by one of the `protocols` since `fromBlock` (inclusive).
  getDrainedLogs(args: { protocols: `0x${string}`[]; fromBlock: bigint }): Promise<DrainedLog[]>;
  /// Number of the last known block.
  currentBlock(): Promise<bigint>;
}

export interface ChainThreatSourceOpts {
  fetcher: DrainedLogFetcher;
  protocols: `0x${string}`[];
  fromBlock?: bigint;
  pollIntervalMs?: number;
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

/// REAL threat source: continuously watches the on-chain `Drained` logs and emits
/// an alert (Defimon schema) for each detected exploit. Daemon: resolves only on the
/// `AbortSignal`. At-least-once semantics (cursor = last block seen + 1); logs without
/// a `blockNumber` are filtered upstream by the fetcher.
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
        console.warn("[coincoin] ⚠️ getLogs failed, retrying on the next tick:", err);
      }
      await abortableSleep(this.pollIntervalMs, this.signal);
    }
  }
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd watcher && pnpm vitest run test/sources.test.ts`
Expected: PASS (the 2 existing tests + the 2 new `ChainThreatSource` ones).

- [ ] **Step 5: Run the whole suite + typecheck**

Run: `cd watcher && pnpm test && pnpm exec tsc --noEmit`
Expected: all tests pass (smoke + threat + registry + keeper + sources + watcher + config); tsc with no error.

- [ ] **Step 6: Commit**

```bash
git add watcher/src/sources.ts watcher/test/sources.test.ts
git commit -m "feat(watcher): ChainThreatSource — real on-chain Drained-log detection daemon"
```

---

### Task 4: `onboard.ts` script (7702 delegation + configure, one-time)

**Files:**
- Create: `watcher/scripts/onboard.ts`

- [ ] **Step 1: Write `watcher/scripts/onboard.ts`**

```typescript
import "dotenv/config";
import { createWalletClient, createPublicClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig } from "../src/config";

/// One-time: the victim delegates (EIP-7702) to GuardianModule and self-configures
/// (safeVault + keeper). `executor:"self"` because the victim signs AND sends the tx.
/// Requires VICTIM_PRIVATE_KEY, KEEPER_PRIVATE_KEY (to derive the keeper address),
/// and the chain config (CHAIN, RPC, GUARDIAN_IMPL, DEMO_VAULT).
async function main() {
  const cfg = resolveChainConfig();
  const victim = privateKeyToAccount(process.env.VICTIM_PRIVATE_KEY as `0x${string}`);
  const keeper = privateKeyToAccount(process.env.KEEPER_PRIVATE_KEY as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const wallet = createWalletClient({ account: victim, chain: cfg.chain, transport });

  console.log(`[onboard] 7702 delegation of ${victim.address} → ${cfg.guardianImpl} on ${cfg.chain.name}…`);
  const auth = await wallet.signAuthorization({
    account: victim,
    contractAddress: cfg.guardianImpl,
    executor: "self",
  });
  const configureData = encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "configure",
        stateMutability: "nonpayable",
        inputs: [
          { name: "safeVault_", type: "address" },
          { name: "keeper_", type: "address" },
        ],
        outputs: [],
      },
    ],
    functionName: "configure",
    args: [cfg.vault, keeper.address],
  });
  const tx = await wallet.sendTransaction({
    to: victim.address,
    data: configureData,
    authorizationList: [auth],
  } as any);
  await pub.waitForTransactionReceipt({ hash: tx });
  console.log(`[onboard] ✅ delegated + configured (vault=${cfg.vault}, keeper=${keeper.address}) tx=${tx}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Typecheck (without running — no keys/funds required)**

Run: `cd watcher && pnpm exec tsc --noEmit`
Expected: no type error. (If `signAuthorization`/`executor`/`authorizationList` produces an error on the installed viem version, STOP and report the exact error — the API was validated for viem 2.52.)

- [ ] **Step 3: Commit**

```bash
git add watcher/scripts/onboard.ts
git commit -m "feat(watcher): onboard script (7702 delegate + configure)"
```

---

### Task 5: `watch.ts` script (the daemon)

**Files:**
- Create: `watcher/scripts/watch.ts`

- [ ] **Step 1: Write `watcher/scripts/watch.ts`**

```typescript
import "dotenv/config";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig } from "../src/config";
import { exploitEventAbi } from "../src/abi";
import { ChainThreatSource, type DrainedLog, type DrainedLogFetcher } from "../src/sources";
import { KeeperClient } from "../src/keeper";
import { runWatcher } from "../src/watcher";
import type { ProtectedAccount } from "../src/registry";

/// Monitoring daemon (the PRODUCT): continuously watches the `Drained` logs of the
/// monitored protocol and evacuates the victim's funds at rest as soon as an exploit
/// is detected. DOES NOT HOLD the victim's key: reads VICTIM_ADDRESS and signs the
/// evacuation with the keeper key (`onlySelfOrKeeper`). Stopped by SIGINT (Ctrl-C).
async function main() {
  const cfg = resolveChainConfig();
  const victimAddress = process.env.VICTIM_ADDRESS as `0x${string}` | undefined;
  if (!victimAddress) throw new Error("watch: VICTIM_ADDRESS missing");
  const keeper = privateKeyToAccount(process.env.KEEPER_PRIVATE_KEY as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const keeperWallet = createWalletClient({ account: keeper, chain: cfg.chain, transport });

  const fetcher: DrainedLogFetcher = {
    currentBlock: () => pub.getBlockNumber(),
    getDrainedLogs: async ({ protocols, fromBlock }) => {
      const logs = await pub.getLogs({
        address: protocols,
        event: exploitEventAbi[0],
        fromBlock,
        toBlock: "latest",
      });
      return logs
        .filter((l) => l.blockNumber !== null && l.transactionHash !== null)
        .map(
          (l): DrainedLog => ({
            address: l.address,
            transactionHash: l.transactionHash as `0x${string}`,
            blockNumber: l.blockNumber as bigint,
            args: {
              attacker: l.args.attacker as `0x${string}`,
              amount: l.args.amount as bigint,
            },
          }),
        );
    },
  };

  const account: ProtectedAccount = {
    address: victimAddress,
    safeVault: cfg.vault,
    watchedProtocols: [cfg.proto],
    tokens: [cfg.token],
  };

  const controller = new AbortController();
  process.on("SIGINT", () => {
    console.log("\n[coincoin] 🛑 stopping the watcher…");
    controller.abort();
  });

  console.log(
    `[coincoin] 👁️  watch — watching ${cfg.proto} on ${cfg.chain.name} (keeper ${keeper.address})…`,
  );
  await runWatcher({
    source: new ChainThreatSource({ fetcher, protocols: [cfg.proto], signal: controller.signal }),
    accounts: [account],
    keeper: new KeeperClient(keeperWallet),
  });
  console.log("[coincoin] watcher stopped.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Typecheck (without running)**

Run: `cd watcher && pnpm exec tsc --noEmit`
Expected: no type error. (In particular, `pub.getLogs({ address: protocols, event: exploitEventAbi[0] })` must type `l.args.attacker`/`l.args.amount`. If there's an error, STOP and report.)

- [ ] **Step 3: Commit**

```bash
git add watcher/scripts/watch.ts
git commit -m "feat(watcher): watch daemon wires ChainThreatSource -> runWatcher"
```

---

### Task 6: `exploit.ts` script (the attacker = deployer)

**Files:**
- Create: `watcher/scripts/exploit.ts`

- [ ] **Step 1: Write `watcher/scripts/exploit.ts`**

```typescript
import "dotenv/config";
import { createPublicClient, createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig } from "../src/config";

const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "a", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/// SIMULATED actor (the only one): the attacker (= deployer, ≠ keeper) drains the
/// vulnerable protocol via `emergencyWithdraw()`. Produces a REAL on-chain `Drained`
/// log that the `watch` daemon detects independently.
async function main() {
  const cfg = resolveChainConfig();
  const attacker = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const wallet = createWalletClient({ account: attacker, chain: cfg.chain, transport });

  const before = await pub.readContract({
    address: cfg.token,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: [cfg.proto],
  });
  console.log(`[exploit] protocol balance before: ${before}`);

  const data = encodeFunctionData({
    abi: [{ type: "function", name: "emergencyWithdraw", stateMutability: "nonpayable", inputs: [], outputs: [] }],
    functionName: "emergencyWithdraw",
    args: [],
  });
  const tx = await wallet.sendTransaction({ to: cfg.proto, data } as any);
  await pub.waitForTransactionReceipt({ hash: tx });

  const after = await pub.readContract({
    address: cfg.token,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: [cfg.proto],
  });
  console.log(`[exploit] 💥 drained ${before - after} from ${cfg.proto} (attacker ${attacker.address}) tx=${tx}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Typecheck (without running)**

Run: `cd watcher && pnpm exec tsc --noEmit`
Expected: no type error.

- [ ] **Step 3: Commit**

```bash
git add watcher/scripts/exploit.ts
git commit -m "feat(watcher): exploit script (attacker drains protocol, real Drained log)"
```

---

### Task 7: Remove `demo.ts`, update `package.json`, `README.md`, `.env.example`

**Files:**
- Delete: `watcher/scripts/demo.ts`
- Modify: `watcher/package.json`, `watcher/README.md`, `.env.example`

- [ ] **Step 1: Remove the old all-in-one runner**

Run: `git rm watcher/scripts/demo.ts`

- [ ] **Step 2: Update the scripts in `watcher/package.json`**

Replace the `"scripts"` block with:

```json
  "scripts": {
    "test": "vitest run",
    "onboard": "tsx scripts/onboard.ts",
    "watch": "tsx scripts/watch.ts",
    "exploit": "tsx scripts/exploit.ts"
  },
```

- [ ] **Step 3: Rewrite `watcher/README.md`** (full content)

````markdown
# coincoin watcher

Detection→evacuation service: a daemon watches on-chain exploits (`Drained` logs)
and triggers the evacuation of a protected account's funds (an EOA delegated via
EIP-7702) to its SafeVault.

Tests: `pnpm test`.

## Target chain

`CHAIN` (in `../.env`) selects the target: `robinhood` (default, chain 46630)
or `arbitrumSepolia`. The deployed contracts' addresses are read from `../.env`
(`GUARDIAN_IMPL`, `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`).

## Deployment (Robinhood Chain Testnet)

Prerequisites: deployer + victim + keeper funded with Robinhood gas; `../.env` filled
(`ROBINHOOD_TESTNET_RPC`, `DEPLOYER_PRIVATE_KEY`, `VICTIM_PRIVATE_KEY`,
`VICTIM_ADDRESS`, `KEEPER_PRIVATE_KEY`).

```bash
cd ../contracts && set -a && source ../.env && set +a
# 1) shared GuardianModule impl
forge script script/Deploy.s.sol:DeployGuardian --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast
# 2) demo setup (token + vulnerable protocol + victim's SafeVault)
forge script script/SetupDemo.s.sol:SetupDemo --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast
```

Record in `../.env`: `GUARDIAN_IMPL` (the impl from step 1), then `DEMO_TOKEN`,
`DEMO_PROTO`, `DEMO_VAULT` (step 2).

## End-to-end demo (multi-terminal)

```bash
# Once: the victim delegates (7702) + configures their guardian
pnpm onboard

# Terminal A — the monitoring daemon (the product)
pnpm watch        # 👁️  watching <PROTO>…

# Terminal B — the attacker drains the protocol (the only simulated actor)
pnpm exploit      # 💥 drain → real on-chain Drained log
```

Terminal A detects the log independently, prints "🦆 COIN COIN !" and evacuates
the victim's funds at rest to their SafeVault. `Ctrl-C` to stop the daemon.
````

- [ ] **Step 4: Update `.env.example`**

Read `.env.example`, then ADD (if absent) these keys at the end:

```text

# ── Phase 5: target chain + on-chain detection ──
# robinhood (default, chain 46630) | arbitrumSepolia
CHAIN=robinhood
ROBINHOOD_TESTNET_RPC=
# GuardianModule impl on the target chain (empty => Arb Sepolia constant fallback)
GUARDIAN_IMPL=
```

(If `ROBINHOOD_TESTNET_RPC` already exists in `.env.example`, do not duplicate it.)

- [ ] **Step 5: Verify the full suite + typecheck**

Run: `cd watcher && pnpm test && pnpm exec tsc --noEmit`
Expected: all tests pass; tsc clean; `scripts/demo.ts` no longer exists.

- [ ] **Step 6: Commit**

```bash
git add watcher/package.json watcher/README.md .env.example
git commit -m "chore(watcher): replace demo.ts with watch/onboard/exploit + Robinhood docs"
```

---

## Definition of Done (Phase 5)

- [ ] `cd watcher && pnpm test`: all tests pass (smoke, threat, registry, keeper, sources **+ ChainThreatSource**, watcher **+ resilience**, config).
- [ ] `cd watcher && pnpm exec tsc --noEmit`: no type error (scripts included).
- [ ] `cd contracts && forge test`: 26/26 unchanged (no Solidity change).
- [ ] `config.ts` env-driven (default Robinhood), side-effect-free import.
- [ ] `watch`/`onboard`/`exploit` scripts present; `demo.ts` removed; `package.json` up to date.
- [ ] `README` (multi-terminal flow + Robinhood deployment) and `.env.example` up to date.
- [ ] No secret committed.
- [ ] **Live run (human, after Robinhood funding)**: deploy → `pnpm onboard` → `pnpm watch` (terminal A) → `pnpm exploit` (terminal B) → "COIN COIN" + victim's funds at rest = 0, vault credited.

**Next:** Phase 3 (Aave V3 / GMX V2 adapters to evacuate the DEPOSITED positions); integration of the real Defimon feed (WS) alongside `ChainThreatSource`; Phase 5bis (dashboard).
