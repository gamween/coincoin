# coincoin — Phase 4: Watcher & detection→evacuation loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the service that closes the product loop: detect an on-chain exploit (a real one, replayed on Arbitrum Sepolia), infer that a protected account is exposed, and trigger the keeper to evacuate its funds to its SafeVault — the demo's "magic moment".

**Architecture:** A TypeScript service (`watcher/`) built around pure, testable units: a Defimon-compatible alert schema, an exposure registry (alert → affected protected accounts), a keeper client (encodes + sends `evacuateERC20` via viem), threat sources (a `MockThreatSource` for the Defimon-schema transport, a `ChainThreatSource` that decodes the logs of an exploited protocol), and an orchestrator that wires them together. On the on-chain side, a tiny vulnerable protocol + attacker (Foundry) generates a REAL exploit; only the intelligence *provider* (Defimon) is substituted, not the signal. A demo script orchestrates everything on Arbitrum Sepolia, relying on the Phase 1 contracts already deployed.

**Tech Stack:** Node 22, pnpm, TypeScript, viem 2.x (EIP-7702 + tx), vitest, tsx. Foundry for the scenario contracts. Live GuardianModule: `0x6671b4B73b79c284A710B00ef777d8E65f55200F` (Arbitrum Sepolia, chain 421614).

---

## Dependencies & prerequisites

- **Phase 1 merged** (SafeVault, GuardianModule) — done. GuardianModule impl deployed.
- The root `.env` already contains: `ARBITRUM_SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`. This plan will add (Task 8) `KEEPER_PRIVATE_KEY` and `VICTIM_PRIVATE_KEY` (two throwaway dev wallets).
- No dependency on Defimon (no key): the signal comes from a replayed exploit, transported in the Defimon schema.

## File structure (Phase 4)

```
watcher/
├── package.json              # isolated pnpm/TS project
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── src/
│   ├── threat.ts             # ThreatAlert type (Defimon schema) + parseThreatAlert (validation)
│   ├── registry.ts           # ProtectedAccount + findExposed(alert, accounts)
│   ├── keeper.ts             # buildEvacuateTx + KeeperClient.evacuate(victim, tokens)
│   ├── sources.ts            # ThreatSource interface + MockThreatSource + ChainThreatSource
│   ├── watcher.ts            # runWatcher(source, accounts, keeper) — orchestration
│   ├── abi.ts                # ABI fragments (GuardianModule.evacuateERC20, exploit event)
│   └── config.ts             # env loading + chain constants
├── test/
│   ├── threat.test.ts
│   ├── registry.test.ts
│   ├── keeper.test.ts
│   ├── sources.test.ts
│   └── watcher.test.ts
└── scripts/
    └── demo.ts               # end-to-end runner on Arbitrum Sepolia (Task 8)

contracts/                    # existing Foundry project — Phase 4 adds:
├── src/demo/
│   ├── MockVulnerableProtocol.sol   # protocol with an intentional bug (withdraw without auth)
│   └── Attacker.sol                 # exploits MockVulnerableProtocol
├── test/demo/
│   └── Exploit.t.sol                # proves the exploit
└── script/
    └── SetupDemo.s.sol              # deploys SafeVault + tokens + MockVulnerableProtocol for the demo
```

---

### Task 1: Scaffold the watcher project (TypeScript)

**Files:**
- Create: `watcher/package.json`, `watcher/tsconfig.json`, `watcher/vitest.config.ts`, `watcher/.gitignore`, `watcher/src/config.ts`, `watcher/test/smoke.test.ts`

- [ ] **Step 1: Create `watcher/package.json`**

```json
{
  "name": "coincoin-watcher",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "demo": "tsx scripts/demo.ts"
  },
  "dependencies": {
    "viem": "^2.21.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create `watcher/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"],
    "outDir": "dist"
  },
  "include": ["src", "test", "scripts"]
}
```

- [ ] **Step 3: Create `watcher/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4: Create `watcher/.gitignore`**

```text
node_modules/
dist/
```

- [ ] **Step 5: Create `watcher/src/config.ts`** (chain constants, no secret)

```typescript
import { defineChain } from "viem";
import { arbitrumSepolia } from "viem/chains";

export { arbitrumSepolia };

/// Address of the deployed GuardianModule implementation (the 7702 delegation target).
export const GUARDIAN_IMPL = "0x6671b4B73b79c284A710B00ef777d8E65f55200F" as const;

export const ROBINHOOD_TESTNET = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com/rpc"] } },
});
```

- [ ] **Step 6: Create the smoke test `watcher/test/smoke.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { GUARDIAN_IMPL } from "../src/config";

describe("smoke", () => {
  it("exposes the deployed guardian impl address", () => {
    expect(GUARDIAN_IMPL).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
```

- [ ] **Step 7: Install and run**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm install && pnpm test
```
Expected: 1 test passes (`smoke`). (pnpm creates `pnpm-lock.yaml`.)

- [ ] **Step 8: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/package.json watcher/tsconfig.json watcher/vitest.config.ts watcher/.gitignore watcher/src/config.ts watcher/test/smoke.test.ts watcher/pnpm-lock.yaml
git commit -m "chore(watcher): scaffold TypeScript service (viem + vitest)"
```

---

### Task 2: Threat alert schema (Defimon-compatible)

**Files:**
- Create: `watcher/src/threat.ts`, `watcher/test/threat.test.ts`

- [ ] **Step 1: Write the failing test (`watcher/test/threat.test.ts`)**

```typescript
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
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/threat.test.ts`
Expected: FAIL — module `../src/threat` not found.

- [ ] **Step 3: Write `watcher/src/threat.ts`**

```typescript
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/// Subset of the Defimon `/ws/confirmed_attacks` schema (fields used by coincoin).
export interface ThreatAlert {
  network: string;
  severity: Severity;
  attack_type: string;
  transaction_hash: string;
  exploit_address: `0x${string}`; // targeted contract (the exploited protocol)
  attacker_address: `0x${string}`;
  block_number: number;
  victim_protocol?: string;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string" || v.length === 0) throw new Error(`alert: missing/invalid ${key}`);
  return v;
}

function requireAddress(obj: Record<string, unknown>, key: string): `0x${string}` {
  const v = requireString(obj, key);
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) throw new Error(`alert: ${key} is not an address`);
  return v.toLowerCase() as `0x${string}`;
}

export function parseThreatAlert(raw: unknown): ThreatAlert {
  if (typeof raw !== "object" || raw === null) throw new Error("alert: not an object");
  const obj = raw as Record<string, unknown>;
  const severity = requireString(obj, "severity");
  if (!SEVERITIES.includes(severity as Severity)) throw new Error(`alert: unknown severity ${severity}`);
  return {
    network: requireString(obj, "network"),
    severity: severity as Severity,
    attack_type: requireString(obj, "attack_type"),
    transaction_hash: requireString(obj, "transaction_hash"),
    exploit_address: requireAddress(obj, "exploit_address"),
    attacker_address: requireAddress(obj, "attacker_address"),
    block_number: typeof obj.block_number === "number" ? obj.block_number : 0,
    victim_protocol: typeof obj.victim_protocol === "string" ? obj.victim_protocol : undefined,
  };
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/threat.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/threat.ts watcher/test/threat.test.ts
git commit -m "feat(watcher): Defimon-compatible threat alert schema + validation"
```

---

### Task 3: Exposure registry (alert → affected protected accounts)

**Files:**
- Create: `watcher/src/registry.ts`, `watcher/test/registry.test.ts`

- [ ] **Step 1: Write the failing test (`watcher/test/registry.test.ts`)**

```typescript
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
    watchedProtocols: ["0xAAAA000000000000000000000000000000000000"], // exposed (different case)
    tokens: ["0xcccc000000000000000000000000000000000000"],
  },
  {
    address: "0x2222222222222222222222222222222222222222",
    safeVault: "0x8888888888888888888888888888888888888888",
    watchedProtocols: ["0xdddd000000000000000000000000000000000000"], // not exposed
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
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/registry.test.ts`
Expected: FAIL — module `../src/registry` not found.

- [ ] **Step 3: Write `watcher/src/registry.ts`**

```typescript
import type { ThreatAlert } from "./threat";

export interface ProtectedAccount {
  address: `0x${string}`;       // the delegated EOA (protected account)
  safeVault: `0x${string}`;     // its evacuation destination
  watchedProtocols: `0x${string}`[]; // protocols it is exposed to
  tokens: `0x${string}`[];      // tokens to evacuate from the account
}

/// Protected accounts exposed to the protocol targeted by the alert (case-insensitive comparison).
export function findExposed(alert: ThreatAlert, accounts: ProtectedAccount[]): ProtectedAccount[] {
  const target = alert.exploit_address.toLowerCase();
  return accounts.filter((acc) =>
    acc.watchedProtocols.some((p) => p.toLowerCase() === target),
  );
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/registry.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/registry.ts watcher/test/registry.test.ts
git commit -m "feat(watcher): exposure registry (alert -> exposed protected accounts)"
```

---

### Task 4: Keeper client (encodes + sends `evacuateERC20`)

**Files:**
- Create: `watcher/src/abi.ts`, `watcher/src/keeper.ts`, `watcher/test/keeper.test.ts`

- [ ] **Step 1: Write `watcher/src/abi.ts`** (ABI fragment, no test of its own — covered by keeper.test)

```typescript
export const guardianAbi = [
  {
    type: "function",
    name: "evacuateERC20",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokens", type: "address[]" }],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeApprovals",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokens", type: "address[]" },
      { name: "spenders", type: "address[]" },
    ],
    outputs: [],
  },
] as const;

/// Event emitted by the demo vulnerable protocol during the drain (see contracts/src/demo).
export const exploitEventAbi = [
  {
    type: "event",
    name: "Drained",
    inputs: [
      { name: "attacker", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
```

- [ ] **Step 2: Write the failing test (`watcher/test/keeper.test.ts`)**

The keeper correctly encodes the call and sends it to the protected account's address (the 7702 delegate), with an injected mock WalletClient.

```typescript
import { describe, it, expect, vi } from "vitest";
import { encodeFunctionData } from "viem";
import { KeeperClient } from "../src/keeper";
import { guardianAbi } from "../src/abi";

describe("KeeperClient.evacuate", () => {
  it("sends evacuateERC20(tokens) to the protected account address", async () => {
    const sendTransaction = vi.fn().mockResolvedValue("0xhash");
    const fakeWallet = { sendTransaction } as any;
    const keeper = new KeeperClient(fakeWallet);

    const victim = "0x1111111111111111111111111111111111111111" as const;
    const tokens = ["0xcccc000000000000000000000000000000000000"] as `0x${string}`[];

    const hash = await keeper.evacuate(victim, tokens);

    expect(hash).toBe("0xhash");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
    const arg = sendTransaction.mock.calls[0][0];
    expect(arg.to).toBe(victim); // ⚠️ the target is the delegated account, NOT the impl
    expect(arg.data).toBe(
      encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] }),
    );
  });
});
```

- [ ] **Step 3: Run it to see the failure**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/keeper.test.ts`
Expected: FAIL — module `../src/keeper` not found.

- [ ] **Step 4: Write `watcher/src/keeper.ts`**

```typescript
import { encodeFunctionData, type WalletClient } from "viem";
import { guardianAbi } from "./abi";

/// Triggers the emergency actions. The keeper calls the function ON THE PROTECTED
/// ACCOUNT'S ADDRESS (delegated via 7702): the GuardianModule code then runs in the
/// account's context, and `msg.sender == keeper` satisfies `onlySelfOrKeeper`.
export class KeeperClient {
  constructor(private readonly wallet: Pick<WalletClient, "sendTransaction">) {}

  async evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`> {
    const data = encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] });
    return (await this.wallet.sendTransaction({ to: victim, data } as any)) as `0x${string}`;
  }
}
```

- [ ] **Step 5: Run it to see it pass**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/keeper.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/abi.ts watcher/src/keeper.ts watcher/test/keeper.test.ts
git commit -m "feat(watcher): keeper client encodes+sends evacuateERC20 to the delegated account"
```

---

### Task 5: Threat sources (mock transport + on-chain detector)

**Files:**
- Create: `watcher/src/sources.ts`, `watcher/test/sources.test.ts`

- [ ] **Step 1: Write the failing test (`watcher/test/sources.test.ts`)**

```typescript
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
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/sources.test.ts`
Expected: FAIL — module `../src/sources` not found.

- [ ] **Step 3: Write `watcher/src/sources.ts`**

```typescript
import { parseThreatAlert, type ThreatAlert } from "./threat";

export type AlertHandler = (alert: ThreatAlert) => void | Promise<void>;

export interface ThreatSource {
  start(onAlert: AlertHandler): Promise<void>;
}

/// Defimon-schema transport source: replays known alerts (demo / tests).
/// This is the ONLY simulated element of the system; the content comes from a real on-chain exploit.
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

/// Turns a real on-chain exploit log into a Defimon-schema alert.
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
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/sources.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/sources.ts watcher/test/sources.test.ts
git commit -m "feat(watcher): threat sources (mock transport + on-chain exploit-log decoder)"
```

---

### Task 6: Orchestrator (source → exposure → keeper)

**Files:**
- Create: `watcher/src/watcher.ts`, `watcher/test/watcher.test.ts`

- [ ] **Step 1: Write the failing test (`watcher/test/watcher.test.ts`)**

```typescript
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
});
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/watcher.test.ts`
Expected: FAIL — module `../src/watcher` not found.

- [ ] **Step 3: Write `watcher/src/watcher.ts`**

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
export async function runWatcher({ source, accounts, keeper }: WatcherDeps): Promise<void> {
  await source.start(async (alert) => {
    const exposed = findExposed(alert, accounts);
    for (const acc of exposed) {
      console.log(`[coincoin] 🦆 COIN COIN ! threat on ${alert.exploit_address} → evacuating ${acc.address}`);
      const hash = await keeper.evacuate(acc.address, acc.tokens);
      console.log(`[coincoin] ✅ evacuated to ${acc.safeVault} (tx ${hash})`);
    }
  });
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/watcher.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the whole watcher suite**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm test`
Expected: PASS — all tests (smoke + threat + registry + keeper + sources + watcher).

- [ ] **Step 6: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/watcher.ts watcher/test/watcher.test.ts
git commit -m "feat(watcher): orchestrator wires threat source -> exposure -> keeper evacuation"
```

---

### Task 7: Scenario contracts (real replayable exploit)

**Files:**
- Create: `contracts/src/demo/MockVulnerableProtocol.sol`, `contracts/src/demo/Attacker.sol`, `contracts/test/demo/Exploit.t.sol`

- [ ] **Step 1: Write the failing test (`contracts/test/demo/Exploit.t.sol`)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockVulnerableProtocol} from "../../src/demo/MockVulnerableProtocol.sol";
import {Attacker} from "../../src/demo/Attacker.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract ExploitTest is Test {
    MockVulnerableProtocol proto;
    Attacker attacker;
    MockERC20 token;
    address victim = address(0xV1C71);

    function setUp() public {
        token = new MockERC20("USD", "USD");
        proto = new MockVulnerableProtocol(token);
        attacker = new Attacker(proto, token);
        // A victim has deposited funds in the protocol.
        token.mint(victim, 1_000e18);
        vm.startPrank(victim);
        token.approve(address(proto), 1_000e18);
        proto.deposit(1_000e18);
        vm.stopPrank();
    }

    function test_AttackerDrainsProtocolAndEmitsDrained() public {
        assertEq(token.balanceOf(address(proto)), 1_000e18);

        vm.expectEmit(true, false, false, true, address(proto));
        emit MockVulnerableProtocol.Drained(address(attacker), 1_000e18);

        attacker.exploit();

        assertEq(token.balanceOf(address(proto)), 0);
        assertEq(token.balanceOf(address(attacker)), 1_000e18);
    }
}
```

- [ ] **Step 2: Run it to see the failure**

Run: `cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract ExploitTest -vv`
Expected: FAIL — sources `MockVulnerableProtocol` / `Attacker` not found.

- [ ] **Step 3: Write `contracts/src/demo/MockVulnerableProtocol.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice An intentionally vulnerable DEMO protocol: `emergencyWithdraw` has no access
///         control and sends the whole balance to the caller. Represents a protocol where
///         users have deposited funds, then gets drained (a real exploit).
contract MockVulnerableProtocol {
    IERC20 public immutable token;
    mapping(address => uint256) public deposits;

    event Drained(address indexed attacker, uint256 amount);

    constructor(IERC20 token_) {
        token = token_;
    }

    function deposit(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }

    /// @dev INTENTIONAL BUG: no auth, drains the entire contract to msg.sender.
    function emergencyWithdraw() external {
        uint256 bal = token.balanceOf(address(this));
        token.transfer(msg.sender, bal);
        emit Drained(msg.sender, bal);
    }
}
```

- [ ] **Step 4: Write `contracts/src/demo/Attacker.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockVulnerableProtocol} from "./MockVulnerableProtocol.sol";

/// @notice Exploits MockVulnerableProtocol via the unprotected function.
contract Attacker {
    MockVulnerableProtocol public immutable target;
    IERC20 public immutable token;

    constructor(MockVulnerableProtocol target_, IERC20 token_) {
        target = target_;
        token = token_;
    }

    function exploit() external {
        target.emergencyWithdraw();
    }
}
```

- [ ] **Step 5: Run it to see it pass**

Run: `cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract ExploitTest -vv`
Expected: PASS (1 test). Then the full `forge test` — still green (25 Phase 1 + 1 new).

- [ ] **Step 6: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/demo/MockVulnerableProtocol.sol contracts/src/demo/Attacker.sol contracts/test/demo/Exploit.t.sol
git commit -m "feat(contracts): demo exploit scenario (vulnerable protocol + attacker)"
```

---

### Task 8: End-to-end runner on Arbitrum Sepolia + docs

**Purpose:** orchestrate the real demo. Manual (keys required). This task creates the script and the docs; the live run is launched by the human.

**Files:**
- Create: `contracts/script/SetupDemo.s.sol`, `watcher/scripts/demo.ts`, `watcher/README.md`
- Modify: `.env.example` (add `KEEPER_PRIVATE_KEY`, `VICTIM_PRIVATE_KEY`)

- [ ] **Step 1: Write `contracts/script/SetupDemo.s.sol`** (deploys the demo setup)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SafeVault} from "../src/SafeVault.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";
import {MockVulnerableProtocol} from "../src/demo/MockVulnerableProtocol.sol";

/// @notice Deploys the end-to-end demo setup on Arbitrum Sepolia:
///         a test token, the vulnerable protocol, and the victim's SafeVault.
///         The victim (VICTIM_ADDRESS) receives tokens at rest; the 7702 delegation
///         and the `configure` are done on the TS script side (demo.ts).
contract SetupDemo is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address victim = vm.envAddress("VICTIM_ADDRESS");

        vm.startBroadcast(pk);
        MockERC20 token = new MockERC20("Demo USD", "dUSD");
        MockVulnerableProtocol proto = new MockVulnerableProtocol(token);
        SafeVault vault = new SafeVault(victim);

        // The victim holds funds AT REST (the evacuation target).
        token.mint(victim, 500e18);
        // And funds deposited in the protocol (which will be drained).
        token.mint(address(this), 1_000e18);
        token.approve(address(proto), 1_000e18);
        proto.deposit(1_000e18);
        vm.stopBroadcast();

        console2.log("dUSD token:        ", address(token));
        console2.log("VulnerableProto:   ", address(proto));
        console2.log("Victim SafeVault:  ", address(vault));
    }
}
```

- [ ] **Step 2: Write `watcher/scripts/demo.ts`** (the end-to-end runner)

```typescript
import "dotenv/config";
import {
  createWalletClient, createPublicClient, http, parseEther, encodeFunctionData, getContract,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, GUARDIAN_IMPL } from "../src/config";
import { guardianAbi } from "../src/abi";
import { KeeperClient } from "../src/keeper";
import { runWatcher } from "../src/watcher";
import { MockThreatSource } from "../src/sources";
import type { ProtectedAccount } from "../src/registry";

/// ⚠️ Real demo, requires in .env: ARBITRUM_SEPOLIA_RPC, VICTIM_PRIVATE_KEY,
/// KEEPER_PRIVATE_KEY, and the addresses printed by SetupDemo (TOKEN, PROTO, VAULT).
const RPC = process.env.ARBITRUM_SEPOLIA_RPC!;
const TOKEN = process.env.DEMO_TOKEN as `0x${string}`;
const PROTO = process.env.DEMO_PROTO as `0x${string}`;
const VAULT = process.env.DEMO_VAULT as `0x${string}`;

const victim = privateKeyToAccount(process.env.VICTIM_PRIVATE_KEY as `0x${string}`);
const keeper = privateKeyToAccount(process.env.KEEPER_PRIVATE_KEY as `0x${string}`);

const transport = http(RPC);
const pub = createPublicClient({ chain: arbitrumSepolia, transport });
const victimWallet = createWalletClient({ account: victim, chain: arbitrumSepolia, transport });
const keeperWallet = createWalletClient({ account: keeper, chain: arbitrumSepolia, transport });

async function main() {
  console.log("1) EIP-7702 delegation of the victim to GuardianModule…");
  // NB: viem 7702 API — verify the exact shape against the installed version:
  //     `pnpm why viem` then https://viem.sh/docs/eip7702
  const auth = await victimWallet.signAuthorization({ account: victim, contractAddress: GUARDIAN_IMPL });
  const configureData = encodeFunctionData({
    abi: [{ type: "function", name: "configure", stateMutability: "nonpayable",
            inputs: [{ name: "safeVault_", type: "address" }, { name: "keeper_", type: "address" }], outputs: [] }],
    functionName: "configure",
    args: [VAULT, keeper.address],
  });
  // Self-call: the victim sends the configure to itself (msg.sender == address(this) == victim).
  const delegTx = await victimWallet.sendTransaction({
    to: victim.address, data: configureData, authorizationList: [auth],
  } as any);
  await pub.waitForTransactionReceipt({ hash: delegTx });
  console.log("   ✅ delegated + configured:", delegTx);

  const balBefore = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [victim.address] });
  const vaultBefore = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [VAULT] });
  console.log(`   Victim at rest: ${balBefore} | Vault: ${vaultBefore}`);

  console.log("2) The attacker drains the protocol (real on-chain exploit)…");
  const exploitData = encodeFunctionData({
    abi: [{ type: "function", name: "emergencyWithdraw", stateMutability: "nonpayable", inputs: [], outputs: [] }],
    functionName: "emergencyWithdraw", args: [],
  });
  const exploitTx = await keeperWallet.sendTransaction({ to: PROTO, data: exploitData } as any);
  const exploitReceipt = await pub.waitForTransactionReceipt({ hash: exploitTx });
  console.log("   💥 exploit:", exploitTx);

  console.log("3) coincoin detects and evacuates the victim's funds AT REST…");
  const account: ProtectedAccount = {
    address: victim.address, safeVault: VAULT, watchedProtocols: [PROTO], tokens: [TOKEN],
  };
  const keeperClient = new KeeperClient(keeperWallet);
  // The signal comes from the REAL exploit (same address/tx), transported in the Defimon schema.
  await runWatcher({
    source: new MockThreatSource([{
      network: "arbitrum", severity: "CRITICAL", attack_type: "drain",
      transaction_hash: exploitReceipt.transactionHash,
      exploit_address: PROTO.toLowerCase() as `0x${string}`,
      attacker_address: keeper.address.toLowerCase() as `0x${string}`,
      block_number: Number(exploitReceipt.blockNumber),
    }]),
    accounts: [account],
    keeper: keeperClient,
  });

  // Give the evacuation tx time to be mined.
  await new Promise((r) => setTimeout(r, 4000));
  const balAfter = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [victim.address] });
  const vaultAfter = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [VAULT] });
  console.log(`4) Result — Victim at rest: ${balAfter} (was ${balBefore}) | Vault: ${vaultAfter} (was ${vaultBefore})`);
  console.log(balAfter === 0n ? "   🦆 Funds high and dry in the vault." : "   ⚠️ incomplete evacuation, check traces.");
}

const erc20Abi = [{ type: "function", name: "balanceOf", stateMutability: "view",
  inputs: [{ name: "a", type: "address" }], outputs: [{ name: "", type: "uint256" }] }] as const;

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Verify that `demo.ts` typechecks (without running it)**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm exec tsc --noEmit
```
Expected: no type error. (If the `signAuthorization` API differs on the installed viem version, adjust per https://viem.sh/docs/eip7702 and re-type; document the adjustment.)

- [ ] **Step 4: Write `watcher/README.md`** (demo procedure)

````markdown
# coincoin watcher

Detection→evacuation service. Tests: `pnpm test`.

## End-to-end demo (Arbitrum Sepolia)

Prerequisites in `../.env`: `ARBITRUM_SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`,
`VICTIM_PRIVATE_KEY`, `KEEPER_PRIVATE_KEY` (3 throwaway dev wallets funded at the faucet),
and `VICTIM_ADDRESS` = the address derived from `VICTIM_PRIVATE_KEY`.

1. Deploy the setup:
   ```bash
   cd ../contracts && set -a && source ../.env && set +a
   forge script script/SetupDemo.s.sol:SetupDemo --rpc-url "$ARBITRUM_SEPOLIA_RPC" --broadcast
   ```
   Record the printed addresses in `../.env`: `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`.
2. Run the demo:
   ```bash
   cd ../watcher && pnpm demo
   ```
   Expected output: 7702 delegation → exploit → "COIN COIN !" → funds at rest = 0, vault credited.
````

- [ ] **Step 5: Update `.env.example`** — add at the end:

```text

# ── Phase 4 demo (throwaway dev wallets + addresses printed by SetupDemo) ──
VICTIM_PRIVATE_KEY=
VICTIM_ADDRESS=
KEEPER_PRIVATE_KEY=
DEMO_TOKEN=
DEMO_PROTO=
DEMO_VAULT=
```

- [ ] **Step 6: Verify the Foundry compilation of the script**

Run: `cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build`
Expected: `Compiler run successful`.

- [ ] **Step 7: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/script/SetupDemo.s.sol watcher/scripts/demo.ts watcher/README.md .env.example
git commit -m "feat(demo): end-to-end runner (7702 delegate -> exploit -> evacuation) + setup script"
```

---

## Definition of Done (Phase 4)

- [ ] `cd watcher && pnpm test`: all tests pass (schema, registry, keeper, sources, orchestrator).
- [ ] `cd contracts && forge test`: 26/26 (Phase 1 + exploit scenario).
- [ ] `pnpm exec tsc --noEmit`: no type error in the watcher.
- [ ] Demo procedure documented; live run left to the human (keeper/victim keys).
- [ ] No secret committed.

**Next:** Phase 3 (Aave V3 / GMX V2 adapters to also evacuate the DEPOSITED positions, not only the funds at rest); Phase 2 (Stylus rules engine for local blocking); Phase 5 (dashboard).
