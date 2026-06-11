# coincoin — Phase 4 : Watcher & boucle de détection→évacuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire le service qui ferme la boucle produit : détecter un exploit on-chain (vrai, rejoué sur Arbitrum Sepolia), en déduire qu'un compte protégé est exposé, et déclencher le keeper pour évacuer ses fonds vers son SafeVault — la « magic moment » de la démo.

**Architecture:** Un service TypeScript (`watcher/`) construit autour d'unités pures testables : un schéma d'alerte compatible Defimon, un registre d'exposition (alerte → comptes protégés concernés), un client keeper (encode + envoie `evacuateERC20` via viem), des sources de menace (une `MockThreatSource` pour le transport au schéma Defimon, une `ChainThreatSource` qui décode les logs d'un protocole exploité), et un orchestrateur qui les câble. Côté on-chain, un mini protocole vulnérable + attaquant (Foundry) génère un VRAI exploit ; seul le *fournisseur* d'intelligence (Defimon) est substitué, pas le signal. Un script de démo orchestre tout sur Arbitrum Sepolia en s'appuyant sur les contrats Phase 1 déjà déployés.

**Tech Stack:** Node 22, pnpm, TypeScript, viem 2.x (EIP-7702 + tx), vitest, tsx. Foundry pour les contrats de scénario. GuardianModule live : `0x6671b4B73b79c284A710B00ef777d8E65f55200F` (Arbitrum Sepolia, chain 421614).

---

## Dépendances & pré-requis

- **Phase 1 mergée** (SafeVault, GuardianModule) — fait. GuardianModule impl déployée.
- `.env` à la racine contient déjà : `ARBITRUM_SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`. Ce plan ajoutera (Task 8) `KEEPER_PRIVATE_KEY` et `VICTIM_PRIVATE_KEY` (deux wallets de dev jetables).
- Pas de dépendance à Defimon (pas de clé) : le signal vient d'un exploit rejoué, transporté au schéma Defimon.

## Structure de fichiers (Phase 4)

```
watcher/
├── package.json              # projet pnpm/TS isolé
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── src/
│   ├── threat.ts             # type ThreatAlert (schéma Defimon) + parseThreatAlert (validation)
│   ├── registry.ts           # ProtectedAccount + findExposed(alert, accounts)
│   ├── keeper.ts             # buildEvacuateTx + KeeperClient.evacuate(victim, tokens)
│   ├── sources.ts            # ThreatSource interface + MockThreatSource + ChainThreatSource
│   ├── watcher.ts            # runWatcher(source, accounts, keeper) — orchestration
│   ├── abi.ts                # fragments ABI (GuardianModule.evacuateERC20, exploit event)
│   └── config.ts             # chargement env + constantes chaîne
├── test/
│   ├── threat.test.ts
│   ├── registry.test.ts
│   ├── keeper.test.ts
│   ├── sources.test.ts
│   └── watcher.test.ts
└── scripts/
    └── demo.ts               # runner end-to-end sur Arbitrum Sepolia (Task 8)

contracts/                    # projet Foundry existant — Phase 4 ajoute :
├── src/demo/
│   ├── MockVulnerableProtocol.sol   # protocole avec bug volontaire (withdraw sans auth)
│   └── Attacker.sol                 # exploite MockVulnerableProtocol
├── test/demo/
│   └── Exploit.t.sol                # prouve l'exploit
└── script/
    └── SetupDemo.s.sol              # déploie SafeVault + tokens + MockVulnerableProtocol pour la démo
```

---

### Task 1 : Scaffolder le projet watcher (TypeScript)

**Files:**
- Create: `watcher/package.json`, `watcher/tsconfig.json`, `watcher/vitest.config.ts`, `watcher/.gitignore`, `watcher/src/config.ts`, `watcher/test/smoke.test.ts`

- [ ] **Step 1 : Créer `watcher/package.json`**

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

- [ ] **Step 2 : Créer `watcher/tsconfig.json`**

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

- [ ] **Step 3 : Créer `watcher/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4 : Créer `watcher/.gitignore`**

```text
node_modules/
dist/
```

- [ ] **Step 5 : Créer `watcher/src/config.ts`** (constantes de chaîne, sans secret)

```typescript
import { defineChain } from "viem";
import { arbitrumSepolia } from "viem/chains";

export { arbitrumSepolia };

/// Adresse de l'implémentation GuardianModule déployée (cible de délégation 7702).
export const GUARDIAN_IMPL = "0x6671b4B73b79c284A710B00ef777d8E65f55200F" as const;

export const ROBINHOOD_TESTNET = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com/rpc"] } },
});
```

- [ ] **Step 6 : Créer le test de fumée `watcher/test/smoke.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { GUARDIAN_IMPL } from "../src/config";

describe("smoke", () => {
  it("exposes the deployed guardian impl address", () => {
    expect(GUARDIAN_IMPL).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
```

- [ ] **Step 7 : Installer et lancer**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm install && pnpm test
```
Expected: 1 test passe (`smoke`). (pnpm crée `pnpm-lock.yaml`.)

- [ ] **Step 8 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/package.json watcher/tsconfig.json watcher/vitest.config.ts watcher/.gitignore watcher/src/config.ts watcher/test/smoke.test.ts watcher/pnpm-lock.yaml
git commit -m "chore(watcher): scaffold TypeScript service (viem + vitest)"
```

---

### Task 2 : Schéma d'alerte de menace (compatible Defimon)

**Files:**
- Create: `watcher/src/threat.ts`, `watcher/test/threat.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue (`watcher/test/threat.test.ts`)**

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

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/threat.test.ts`
Expected: FAIL — module `../src/threat` introuvable.

- [ ] **Step 3 : Écrire `watcher/src/threat.ts`**

```typescript
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/// Sous-ensemble du schéma Defimon `/ws/confirmed_attacks` (champs utilisés par coincoin).
export interface ThreatAlert {
  network: string;
  severity: Severity;
  attack_type: string;
  transaction_hash: string;
  exploit_address: `0x${string}`; // contrat ciblé (le protocole exploité)
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

- [ ] **Step 4 : Lancer pour voir le succès**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/threat.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/threat.ts watcher/test/threat.test.ts
git commit -m "feat(watcher): Defimon-compatible threat alert schema + validation"
```

---

### Task 3 : Registre d'exposition (alerte → comptes protégés concernés)

**Files:**
- Create: `watcher/src/registry.ts`, `watcher/test/registry.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue (`watcher/test/registry.test.ts`)**

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
```

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/registry.test.ts`
Expected: FAIL — module `../src/registry` introuvable.

- [ ] **Step 3 : Écrire `watcher/src/registry.ts`**

```typescript
import type { ThreatAlert } from "./threat";

export interface ProtectedAccount {
  address: `0x${string}`;       // l'EOA délégué (compte protégé)
  safeVault: `0x${string}`;     // sa destination d'évacuation
  watchedProtocols: `0x${string}`[]; // protocoles où il est exposé
  tokens: `0x${string}`[];      // tokens à évacuer du compte
}

/// Comptes protégés exposés au protocole ciblé par l'alerte (comparaison insensible à la casse).
export function findExposed(alert: ThreatAlert, accounts: ProtectedAccount[]): ProtectedAccount[] {
  const target = alert.exploit_address.toLowerCase();
  return accounts.filter((acc) =>
    acc.watchedProtocols.some((p) => p.toLowerCase() === target),
  );
}
```

- [ ] **Step 4 : Lancer pour voir le succès**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/registry.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/registry.ts watcher/test/registry.test.ts
git commit -m "feat(watcher): exposure registry (alert -> exposed protected accounts)"
```

---

### Task 4 : Client keeper (encode + envoie `evacuateERC20`)

**Files:**
- Create: `watcher/src/abi.ts`, `watcher/src/keeper.ts`, `watcher/test/keeper.test.ts`

- [ ] **Step 1 : Écrire `watcher/src/abi.ts`** (fragment ABI, pas de test propre — couvert par keeper.test)

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

/// Event émis par le protocole vulnérable de démo lors du drain (voir contracts/src/demo).
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

- [ ] **Step 2 : Écrire le test qui échoue (`watcher/test/keeper.test.ts`)**

Le keeper encode correctement l'appel et l'envoie à l'adresse du compte protégé (le délégué 7702), avec un WalletClient injecté simulé.

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
    expect(arg.to).toBe(victim); // ⚠️ la cible est le compte délégué, PAS l'impl
    expect(arg.data).toBe(
      encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] }),
    );
  });
});
```

- [ ] **Step 3 : Lancer pour voir l'échec**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/keeper.test.ts`
Expected: FAIL — module `../src/keeper` introuvable.

- [ ] **Step 4 : Écrire `watcher/src/keeper.ts`**

```typescript
import { encodeFunctionData, type WalletClient } from "viem";
import { guardianAbi } from "./abi";

/// Déclenche les actions d'urgence. Le keeper appelle la fonction SUR L'ADRESSE DU COMPTE
/// PROTÉGÉ (délégué via 7702) : le code GuardianModule s'exécute alors dans le contexte du
/// compte, et `msg.sender == keeper` satisfait `onlySelfOrKeeper`.
export class KeeperClient {
  constructor(private readonly wallet: Pick<WalletClient, "sendTransaction">) {}

  async evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`> {
    const data = encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] });
    return (await this.wallet.sendTransaction({ to: victim, data } as any)) as `0x${string}`;
  }
}
```

- [ ] **Step 5 : Lancer pour voir le succès**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/keeper.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/abi.ts watcher/src/keeper.ts watcher/test/keeper.test.ts
git commit -m "feat(watcher): keeper client encodes+sends evacuateERC20 to the delegated account"
```

---

### Task 5 : Sources de menace (mock transport + détecteur on-chain)

**Files:**
- Create: `watcher/src/sources.ts`, `watcher/test/sources.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue (`watcher/test/sources.test.ts`)**

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

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/sources.test.ts`
Expected: FAIL — module `../src/sources` introuvable.

- [ ] **Step 3 : Écrire `watcher/src/sources.ts`**

```typescript
import { parseThreatAlert, type ThreatAlert } from "./threat";

export type AlertHandler = (alert: ThreatAlert) => void | Promise<void>;

export interface ThreatSource {
  start(onAlert: AlertHandler): Promise<void>;
}

/// Source de transport au schéma Defimon : rejoue des alertes connues (démo / tests).
/// C'est le SEUL élément simulé du système ; le contenu provient d'un vrai exploit on-chain.
export class MockThreatSource implements ThreatSource {
  constructor(private readonly alerts: ThreatAlert[]) {}
  async start(onAlert: AlertHandler): Promise<void> {
    for (const a of this.alerts) await onAlert(a);
  }
}

/// Forme minimale d'un log `Drained` décodé par viem.
export interface DrainedLog {
  address: string;
  transactionHash: string;
  blockNumber: bigint;
  args: { attacker: string; amount: bigint };
}

/// Transforme un vrai log d'exploit on-chain en alerte au schéma Defimon.
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

- [ ] **Step 4 : Lancer pour voir le succès**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/sources.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/sources.ts watcher/test/sources.test.ts
git commit -m "feat(watcher): threat sources (mock transport + on-chain exploit-log decoder)"
```

---

### Task 6 : Orchestrateur (source → exposition → keeper)

**Files:**
- Create: `watcher/src/watcher.ts`, `watcher/test/watcher.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue (`watcher/test/watcher.test.ts`)**

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

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/watcher.test.ts`
Expected: FAIL — module `../src/watcher` introuvable.

- [ ] **Step 3 : Écrire `watcher/src/watcher.ts`**

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

/// Câble la boucle : chaque alerte → comptes exposés → évacuation de leurs tokens.
export async function runWatcher({ source, accounts, keeper }: WatcherDeps): Promise<void> {
  await source.start(async (alert) => {
    const exposed = findExposed(alert, accounts);
    for (const acc of exposed) {
      console.log(`[coincoin] 🦆 COIN COIN ! menace sur ${alert.exploit_address} → évacuation de ${acc.address}`);
      const hash = await keeper.evacuate(acc.address, acc.tokens);
      console.log(`[coincoin] ✅ évacué vers ${acc.safeVault} (tx ${hash})`);
    }
  });
}
```

- [ ] **Step 4 : Lancer pour voir le succès**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm vitest run test/watcher.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5 : Lancer toute la suite watcher**

Run: `cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm test`
Expected: PASS — tous les tests (smoke + threat + registry + keeper + sources + watcher).

- [ ] **Step 6 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add watcher/src/watcher.ts watcher/test/watcher.test.ts
git commit -m "feat(watcher): orchestrator wires threat source -> exposure -> keeper evacuation"
```

---

### Task 7 : Contrats de scénario (vrai exploit rejouable)

**Files:**
- Create: `contracts/src/demo/MockVulnerableProtocol.sol`, `contracts/src/demo/Attacker.sol`, `contracts/test/demo/Exploit.t.sol`

- [ ] **Step 1 : Écrire le test qui échoue (`contracts/test/demo/Exploit.t.sol`)**

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
        // Une victime a déposé des fonds dans le protocole.
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

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract ExploitTest -vv`
Expected: FAIL — sources `MockVulnerableProtocol` / `Attacker` introuvables.

- [ ] **Step 3 : Écrire `contracts/src/demo/MockVulnerableProtocol.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Protocole de DÉMO volontairement vulnérable : `emergencyWithdraw` n'a aucun
///         contrôle d'accès et envoie tout le solde à l'appelant. Représente un protocole
///         où des utilisateurs ont déposé des fonds, puis se fait drainer (exploit réel).
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

    /// @dev BUG VOLONTAIRE : pas d'auth, vide tout le contrat vers msg.sender.
    function emergencyWithdraw() external {
        uint256 bal = token.balanceOf(address(this));
        token.transfer(msg.sender, bal);
        emit Drained(msg.sender, bal);
    }
}
```

- [ ] **Step 4 : Écrire `contracts/src/demo/Attacker.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockVulnerableProtocol} from "./MockVulnerableProtocol.sol";

/// @notice Exploite MockVulnerableProtocol via la fonction non protégée.
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

- [ ] **Step 5 : Lancer pour voir le succès**

Run: `cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract ExploitTest -vv`
Expected: PASS (1 test). Puis `forge test` complet — toujours vert (25 Phase 1 + 1 nouveau).

- [ ] **Step 6 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/demo/MockVulnerableProtocol.sol contracts/src/demo/Attacker.sol contracts/test/demo/Exploit.t.sol
git commit -m "feat(contracts): demo exploit scenario (vulnerable protocol + attacker)"
```

---

### Task 8 : Runner end-to-end sur Arbitrum Sepolia + doc

**But :** orchestrer la démo réelle. Manuel (clés requises). Ce task crée le script et la doc ; l'exécution live est lancée par l'humain.

**Files:**
- Create: `contracts/script/SetupDemo.s.sol`, `watcher/scripts/demo.ts`, `watcher/README.md`
- Modify: `.env.example` (ajout `KEEPER_PRIVATE_KEY`, `VICTIM_PRIVATE_KEY`)

- [ ] **Step 1 : Écrire `contracts/script/SetupDemo.s.sol`** (déploie le décor de démo)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SafeVault} from "../src/SafeVault.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";
import {MockVulnerableProtocol} from "../src/demo/MockVulnerableProtocol.sol";

/// @notice Déploie le décor de la démo end-to-end sur Arbitrum Sepolia :
///         un token de test, le protocole vulnérable, et le SafeVault de la victime.
///         La victime (VICTIM_ADDRESS) reçoit des tokens au repos ; la délégation 7702
///         et le `configure` sont faits côté script TS (demo.ts).
contract SetupDemo is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address victim = vm.envAddress("VICTIM_ADDRESS");

        vm.startBroadcast(pk);
        MockERC20 token = new MockERC20("Demo USD", "dUSD");
        MockVulnerableProtocol proto = new MockVulnerableProtocol(token);
        SafeVault vault = new SafeVault(victim);

        // La victime détient des fonds AU REPOS (cible de l'évacuation).
        token.mint(victim, 500e18);
        // Et des fonds déposés dans le protocole (qui se fera drainer).
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

- [ ] **Step 2 : Écrire `watcher/scripts/demo.ts`** (le runner end-to-end)

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

/// ⚠️ Démo réelle, nécessite dans .env : ARBITRUM_SEPOLIA_RPC, VICTIM_PRIVATE_KEY,
/// KEEPER_PRIVATE_KEY, et les adresses imprimées par SetupDemo (TOKEN, PROTO, VAULT).
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
  console.log("1) Délégation EIP-7702 de la victime vers GuardianModule…");
  // NB: API viem 7702 — vérifier la forme exacte avec la version installée :
  //     `pnpm why viem` puis https://viem.sh/docs/eip7702
  const auth = await victimWallet.signAuthorization({ account: victim, contractAddress: GUARDIAN_IMPL });
  const configureData = encodeFunctionData({
    abi: [{ type: "function", name: "configure", stateMutability: "nonpayable",
            inputs: [{ name: "safeVault_", type: "address" }, { name: "keeper_", type: "address" }], outputs: [] }],
    functionName: "configure",
    args: [VAULT, keeper.address],
  });
  // Self-call : la victime s'envoie le configure (msg.sender == address(this) == victim).
  const delegTx = await victimWallet.sendTransaction({
    to: victim.address, data: configureData, authorizationList: [auth],
  } as any);
  await pub.waitForTransactionReceipt({ hash: delegTx });
  console.log("   ✅ délégué + configuré:", delegTx);

  const balBefore = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [victim.address] });
  const vaultBefore = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [VAULT] });
  console.log(`   Victime au repos: ${balBefore} | Vault: ${vaultBefore}`);

  console.log("2) L'attaquant draine le protocole (vrai exploit on-chain)…");
  const exploitData = encodeFunctionData({
    abi: [{ type: "function", name: "emergencyWithdraw", stateMutability: "nonpayable", inputs: [], outputs: [] }],
    functionName: "emergencyWithdraw", args: [],
  });
  const exploitTx = await keeperWallet.sendTransaction({ to: PROTO, data: exploitData } as any);
  const exploitReceipt = await pub.waitForTransactionReceipt({ hash: exploitTx });
  console.log("   💥 exploit:", exploitTx);

  console.log("3) coincoin détecte et évacue les fonds AU REPOS de la victime…");
  const account: ProtectedAccount = {
    address: victim.address, safeVault: VAULT, watchedProtocols: [PROTO], tokens: [TOKEN],
  };
  const keeperClient = new KeeperClient(keeperWallet);
  // Le signal vient du VRAI exploit (mêmes adresse/tx), transporté au schéma Defimon.
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

  // Laisser le temps à la tx d'évacuation d'être minée.
  await new Promise((r) => setTimeout(r, 4000));
  const balAfter = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [victim.address] });
  const vaultAfter = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [VAULT] });
  console.log(`4) Résultat — Victime au repos: ${balAfter} (était ${balBefore}) | Vault: ${vaultAfter} (était ${vaultBefore})`);
  console.log(balAfter === 0n ? "   🦆 Fonds au sec dans le coffre." : "   ⚠️ évacuation incomplète, voir traces.");
}

const erc20Abi = [{ type: "function", name: "balanceOf", stateMutability: "view",
  inputs: [{ name: "a", type: "address" }], outputs: [{ name: "", type: "uint256" }] }] as const;

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3 : Vérifier que `demo.ts` typecheck (sans l'exécuter)**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/watcher && pnpm exec tsc --noEmit
```
Expected: aucune erreur de type. (Si l'API `signAuthorization` diffère sur la version viem installée, ajuster selon https://viem.sh/docs/eip7702 et re-typer ; documenter l'ajustement.)

- [ ] **Step 4 : Écrire `watcher/README.md`** (procédure de démo)

````markdown
# coincoin watcher

Service de détection→évacuation. Tests : `pnpm test`.

## Démo end-to-end (Arbitrum Sepolia)

Pré-requis dans `../.env` : `ARBITRUM_SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`,
`VICTIM_PRIVATE_KEY`, `KEEPER_PRIVATE_KEY` (3 wallets de dev jetables financés au faucet),
et `VICTIM_ADDRESS` = adresse dérivée de `VICTIM_PRIVATE_KEY`.

1. Déployer le décor :
   ```bash
   cd ../contracts && set -a && source ../.env && set +a
   forge script script/SetupDemo.s.sol:SetupDemo --rpc-url "$ARBITRUM_SEPOLIA_RPC" --broadcast
   ```
   Reporter les adresses imprimées dans `../.env` : `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`.
2. Lancer la démo :
   ```bash
   cd ../watcher && pnpm demo
   ```
   Sortie attendue : délégation 7702 → exploit → « COIN COIN ! » → fonds au repos = 0, vault crédité.
````

- [ ] **Step 5 : Mettre à jour `.env.example`** — ajouter à la fin :

```text

# ── Démo Phase 4 (wallets de dev jetables + adresses imprimées par SetupDemo) ──
VICTIM_PRIVATE_KEY=
VICTIM_ADDRESS=
KEEPER_PRIVATE_KEY=
DEMO_TOKEN=
DEMO_PROTO=
DEMO_VAULT=
```

- [ ] **Step 6 : Vérifier la compilation Foundry du script**

Run: `cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build`
Expected: `Compiler run successful`.

- [ ] **Step 7 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/script/SetupDemo.s.sol watcher/scripts/demo.ts watcher/README.md .env.example
git commit -m "feat(demo): end-to-end runner (7702 delegate -> exploit -> evacuation) + setup script"
```

---

## Definition of Done (Phase 4)

- [ ] `cd watcher && pnpm test` : tous les tests passent (schéma, registre, keeper, sources, orchestrateur).
- [ ] `cd contracts && forge test` : 26/26 (Phase 1 + scénario d'exploit).
- [ ] `pnpm exec tsc --noEmit` : pas d'erreur de type dans le watcher.
- [ ] Procédure de démo documentée ; exécution live laissée à l'humain (clés keeper/victim).
- [ ] Aucun secret commité.

**Next:** Phase 3 (adapters Aave V3 / GMX V2 pour évacuer aussi les positions DÉPOSÉES, pas seulement les fonds au repos) ; Phase 2 (moteur de règles Stylus pour le blocage local) ; Phase 5 (dashboard).
