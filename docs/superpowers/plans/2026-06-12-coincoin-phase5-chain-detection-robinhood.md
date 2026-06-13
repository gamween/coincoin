# coincoin — Phase 5 : Détection on-chain réelle + démo Robinhood — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la détection mockée par un vrai daemon qui surveille les logs `Drained` on-chain (`ChainThreatSource`), et rendre l'ensemble configurable pour tourner sur Robinhood Chain Testnet (chain 46630).

**Architecture:** On ajoute une source de menace réelle (`ChainThreatSource`) qui poll `getLogs` via un fetcher injecté (testable sans chaîne live) et réutilise le `decodeExploitLog` existant. `config.ts` devient piloté par env (défaut Robinhood). Trois scripts séparés remplacent `demo.ts` : `onboard` (délégation 7702 + configure, one-time), `watch` (le daemon), `exploit` (l'attaquant = deployer, seul acteur simulé). `runWatcher` est durci (try/catch par compte). Aucun changement Solidity : les contrats Phase 4 sont redéployés tels quels sur Robinhood.

**Tech Stack:** Node 22, pnpm, TypeScript, viem 2.52 (EIP-7702 + getLogs), vitest, tsx. Foundry (déploiement uniquement, scripts existants). Spec source : `docs/superpowers/specs/2026-06-12-phase5-chain-detection-robinhood-design.md`.

---

## Pré-requis & contexte

- **Phase 4 mergée** (sur `main`) : `watcher/` avec `threat.ts`, `registry.ts`, `keeper.ts`/`abi.ts`, `sources.ts` (`ThreatSource`/`MockThreatSource`/`decodeExploitLog`/`DrainedLog`), `watcher.ts` (`runWatcher`), `config.ts` ; contrats `MockVulnerableProtocol`/`Attacker` + scripts forge `DeployGuardian` (`contracts/script/Deploy.s.sol`) et `SetupDemo` (`contracts/script/SetupDemo.s.sol`).
- **7702 confirmé sur Robinhood** (ArbOS 61). Rien n'y est déployé : on redéploie les contrats (aucun code Solidity nouveau).
- **viem 2.52** installé : `signAuthorization` est une action wallet par défaut, `executor:"self"` requis pour l'auto-exécution 7702 (acquis en Phase 4).
- **Adresses runtime** lues depuis `../.env` (gitignoré) : `CHAIN`, `ROBINHOOD_TESTNET_RPC`/`ARBITRUM_SEPOLIA_RPC`, `GUARDIAN_IMPL` (override), `DEMO_TOKEN`/`DEMO_PROTO`/`DEMO_VAULT`, `DEPLOYER_PRIVATE_KEY`/`VICTIM_PRIVATE_KEY`/`VICTIM_ADDRESS`/`KEEPER_PRIVATE_KEY`.

## Structure de fichiers (Phase 5)

```
watcher/
├── src/
│   ├── config.ts        # MODIFIE : + resolveChainConfig() piloté par env
│   ├── sources.ts       # MODIFIE : + DrainedLogFetcher + ChainThreatSource
│   └── watcher.ts       # MODIFIE : runWatcher try/catch par compte
├── test/
│   ├── config.test.ts   # CREE : resolveChainConfig
│   ├── sources.test.ts  # MODIFIE : + tests ChainThreatSource
│   └── watcher.test.ts  # MODIFIE : + test résilience
├── scripts/
│   ├── onboard.ts       # CREE : délégation 7702 + configure (one-time)
│   ├── watch.ts         # CREE : daemon (ChainThreatSource -> runWatcher)
│   ├── exploit.ts       # CREE : attaquant (deployer) draine le protocole
│   └── demo.ts          # SUPPRIME (remplacé par les 3 ci-dessus)
├── package.json         # MODIFIE : scripts watch/onboard/exploit (retire demo)
└── README.md            # MODIFIE : déploiement Robinhood + flux multi-terminal
.env.example             # MODIFIE : + CHAIN, GUARDIAN_IMPL, ROBINHOOD_TESTNET_RPC
```

---

### Task 1 : Durcir `runWatcher` (try/catch par compte)

**Files:**
- Modify: `watcher/src/watcher.ts`
- Test: `watcher/test/watcher.test.ts`

- [ ] **Step 1 : Ajouter le test de résilience (`watcher/test/watcher.test.ts`)**

Ajouter ce test À LA FIN du `describe("runWatcher", ...)` existant (avant l'accolade fermante du `describe`) :

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

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd watcher && pnpm vitest run test/watcher.test.ts`
Expected: FAIL — l'`evacuate` rejeté se propage hors de `runWatcher` (promesse rejetée / 2e appel jamais atteint).

- [ ] **Step 3 : Modifier `watcher/src/watcher.ts`**

Remplacer le corps de la boucle `for` dans `runWatcher` par une version avec try/catch par compte. Le fichier complet devient :

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
/// Daemon-safe : une évacuation qui échoue est loggée et N'INTERROMPT PAS la boucle
/// (les autres comptes exposés sont quand même traités, le watcher reste vivant).
export async function runWatcher({ source, accounts, keeper }: WatcherDeps): Promise<void> {
  await source.start(async (alert) => {
    const exposed = findExposed(alert, accounts);
    for (const acc of exposed) {
      console.log(`[coincoin] 🦆 COIN COIN ! menace sur ${alert.exploit_address} → évacuation de ${acc.address}`);
      try {
        const hash = await keeper.evacuate(acc.address, acc.tokens);
        console.log(`[coincoin] ✅ évacué vers ${acc.safeVault} (tx ${hash})`);
      } catch (err) {
        console.error(`[coincoin] ⚠️ évacuation échouée pour ${acc.address}:`, err);
      }
    }
  });
}
```

- [ ] **Step 4 : Lancer pour voir le succès**

Run: `cd watcher && pnpm vitest run test/watcher.test.ts`
Expected: PASS (3 tests : les 2 existants + le nouveau).

- [ ] **Step 5 : Commit**

```bash
git add watcher/src/watcher.ts watcher/test/watcher.test.ts
git commit -m "feat(watcher): harden runWatcher with per-account evacuation try/catch"
```

---

### Task 2 : `config.ts` piloté par env (`resolveChainConfig`)

**Files:**
- Modify: `watcher/src/config.ts`
- Test: `watcher/test/config.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue (`watcher/test/config.test.ts`)**

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
    expect(cfg.guardianImpl).toBe(GUARDIAN_IMPL); // fallback constante
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

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd watcher && pnpm vitest run test/config.test.ts`
Expected: FAIL — `resolveChainConfig` n'existe pas encore (export introuvable).

- [ ] **Step 3 : Modifier `watcher/src/config.ts`** (fichier complet)

```typescript
import { defineChain, type Chain } from "viem";
import { arbitrumSepolia } from "viem/chains";

export { arbitrumSepolia };

/// Adresse de l'implémentation GuardianModule déployée sur Arbitrum Sepolia.
/// Sert de fallback quand `GUARDIAN_IMPL` n'est pas fourni en env.
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
    throw new Error(`config: ${key} manquant ou invalide (attendu une adresse 0x…)`);
  }
  return v as `0x${string}`;
}

/// Résout la config de chaîne depuis l'environnement. Appelée par les SCRIPTS
/// uniquement (jamais au top-level) : throw si une valeur requise manque, mais
/// l'import du module reste sans effet de bord. `env` est injectable (tests).
export function resolveChainConfig(env: NodeJS.ProcessEnv = process.env): ResolvedConfig {
  const chainKey: ChainKey = env.CHAIN === "arbitrumSepolia" ? "arbitrumSepolia" : "robinhood";
  const chain = chainKey === "arbitrumSepolia" ? arbitrumSepolia : ROBINHOOD_TESTNET;
  const rpcEnvKey = chainKey === "arbitrumSepolia" ? "ARBITRUM_SEPOLIA_RPC" : "ROBINHOOD_TESTNET_RPC";
  const rpcUrl = env[rpcEnvKey];
  if (!rpcUrl) throw new Error(`config: ${rpcEnvKey} manquant pour la chaîne ${chainKey}`);
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

- [ ] **Step 4 : Lancer pour voir le succès**

Run: `cd watcher && pnpm vitest run test/config.test.ts`
Expected: PASS (5 tests). Vérifier aussi que `test/smoke.test.ts` passe toujours (import `GUARDIAN_IMPL` inchangé) : `cd watcher && pnpm vitest run test/smoke.test.ts` → PASS.

- [ ] **Step 5 : Commit**

```bash
git add watcher/src/config.ts watcher/test/config.test.ts
git commit -m "feat(watcher): env-driven chain config (resolveChainConfig, default Robinhood)"
```

---

### Task 3 : `ChainThreatSource` (détection on-chain réelle)

**Files:**
- Modify: `watcher/src/sources.ts`
- Test: `watcher/test/sources.test.ts`

- [ ] **Step 1 : Ajouter les tests qui échouent (`watcher/test/sources.test.ts`)**

D'abord, remplacer LES TROIS LIGNES D'IMPORT existantes en haut du fichier (l'import de `vitest`, celui de `../src/sources`, celui de `../src/threat`) par exactement ces trois lignes (ajoute `vi`, `ChainThreatSource`, `DrainedLogFetcher` ; ne pas dupliquer les imports existants) :

```typescript
import { describe, it, expect, vi } from "vitest";
import { MockThreatSource, decodeExploitLog, ChainThreatSource, type DrainedLogFetcher } from "../src/sources";
import type { ThreatAlert } from "../src/threat";
```

Puis ajouter ce bloc À LA FIN du fichier :

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
      controller.abort(); // arrête le daemon après la 1re alerte
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

- [ ] **Step 2 : Lancer pour voir l'échec**

Run: `cd watcher && pnpm vitest run test/sources.test.ts`
Expected: FAIL — `ChainThreatSource` / `DrainedLogFetcher` introuvables.

- [ ] **Step 3 : Modifier `watcher/src/sources.ts`** — ajouter À LA FIN du fichier (après `decodeExploitLog`) :

```typescript

export interface DrainedLogFetcher {
  /// Logs `Drained` émis par l'un des `protocols` depuis `fromBlock` (inclus).
  getDrainedLogs(args: { protocols: `0x${string}`[]; fromBlock: bigint }): Promise<DrainedLog[]>;
  /// Numéro du dernier bloc connu.
  currentBlock(): Promise<bigint>;
}

export interface ChainThreatSourceOpts {
  fetcher: DrainedLogFetcher;
  protocols: `0x${string}`[];
  fromBlock?: bigint;
  pollIntervalMs?: number;
  signal?: AbortSignal;
}

/// Attend `ms`, ou se résout immédiatement si `signal` est (ou devient) aborté.
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

/// Source de menace RÉELLE : surveille en continu les logs `Drained` on-chain et
/// émet une alerte (schéma Defimon) pour chaque exploit détecté. Daemon : ne se
/// résout qu'à l'`AbortSignal`. Sémantique at-least-once (curseur = dernier bloc
/// vu + 1) ; les logs sans `blockNumber` sont filtrés en amont par le fetcher.
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
        console.warn("[coincoin] ⚠️ getLogs a échoué, nouvelle tentative au prochain tick:", err);
      }
      await abortableSleep(this.pollIntervalMs, this.signal);
    }
  }
}
```

- [ ] **Step 4 : Lancer pour voir le succès**

Run: `cd watcher && pnpm vitest run test/sources.test.ts`
Expected: PASS (les 2 tests existants + les 2 nouveaux de `ChainThreatSource`).

- [ ] **Step 5 : Lancer toute la suite + typecheck**

Run: `cd watcher && pnpm test && pnpm exec tsc --noEmit`
Expected: tous les tests passent (smoke + threat + registry + keeper + sources + watcher + config) ; tsc sans erreur.

- [ ] **Step 6 : Commit**

```bash
git add watcher/src/sources.ts watcher/test/sources.test.ts
git commit -m "feat(watcher): ChainThreatSource — real on-chain Drained-log detection daemon"
```

---

### Task 4 : Script `onboard.ts` (délégation 7702 + configure, one-time)

**Files:**
- Create: `watcher/scripts/onboard.ts`

- [ ] **Step 1 : Écrire `watcher/scripts/onboard.ts`**

```typescript
import "dotenv/config";
import { createWalletClient, createPublicClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChainConfig } from "../src/config";

/// One-time : la victime délègue (EIP-7702) vers GuardianModule et s'auto-configure
/// (safeVault + keeper). `executor:"self"` car la victime signe ET envoie la tx.
/// Nécessite VICTIM_PRIVATE_KEY, KEEPER_PRIVATE_KEY (pour dériver l'adresse keeper),
/// et la config de chaîne (CHAIN, RPC, GUARDIAN_IMPL, DEMO_VAULT).
async function main() {
  const cfg = resolveChainConfig();
  const victim = privateKeyToAccount(process.env.VICTIM_PRIVATE_KEY as `0x${string}`);
  const keeper = privateKeyToAccount(process.env.KEEPER_PRIVATE_KEY as `0x${string}`);

  const transport = http(cfg.rpcUrl);
  const pub = createPublicClient({ chain: cfg.chain, transport });
  const wallet = createWalletClient({ account: victim, chain: cfg.chain, transport });

  console.log(`[onboard] délégation 7702 de ${victim.address} → ${cfg.guardianImpl} sur ${cfg.chain.name}…`);
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
  console.log(`[onboard] ✅ délégué + configuré (vault=${cfg.vault}, keeper=${keeper.address}) tx=${tx}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2 : Typecheck (sans exécuter — pas de clés/funds requis)**

Run: `cd watcher && pnpm exec tsc --noEmit`
Expected: aucune erreur de type. (Si `signAuthorization`/`executor`/`authorizationList` produit une erreur sur la version viem installée, S'ARRÊTER et reporter l'erreur exacte — l'API a été validée pour viem 2.52.)

- [ ] **Step 3 : Commit**

```bash
git add watcher/scripts/onboard.ts
git commit -m "feat(watcher): onboard script (7702 delegate + configure)"
```

---

### Task 5 : Script `watch.ts` (le daemon)

**Files:**
- Create: `watcher/scripts/watch.ts`

- [ ] **Step 1 : Écrire `watcher/scripts/watch.ts`**

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

/// Daemon de surveillance (le PRODUIT) : observe en continu les logs `Drained` du
/// protocole surveillé et évacue les fonds au repos de la victime dès qu'un exploit
/// est détecté. NE DÉTIENT PAS la clé de la victime : lit VICTIM_ADDRESS et signe
/// l'évacuation avec la clé keeper (`onlySelfOrKeeper`). Arrêt par SIGINT (Ctrl-C).
async function main() {
  const cfg = resolveChainConfig();
  const victimAddress = process.env.VICTIM_ADDRESS as `0x${string}` | undefined;
  if (!victimAddress) throw new Error("watch: VICTIM_ADDRESS manquant");
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
    console.log("\n[coincoin] 🛑 arrêt du watcher…");
    controller.abort();
  });

  console.log(
    `[coincoin] 👁️  watch — surveillance de ${cfg.proto} sur ${cfg.chain.name} (keeper ${keeper.address})…`,
  );
  await runWatcher({
    source: new ChainThreatSource({ fetcher, protocols: [cfg.proto], signal: controller.signal }),
    accounts: [account],
    keeper: new KeeperClient(keeperWallet),
  });
  console.log("[coincoin] watcher arrêté.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2 : Typecheck (sans exécuter)**

Run: `cd watcher && pnpm exec tsc --noEmit`
Expected: aucune erreur de type. (En particulier `pub.getLogs({ address: protocols, event: exploitEventAbi[0] })` doit typer `l.args.attacker`/`l.args.amount`. Si erreur, S'ARRÊTER et reporter.)

- [ ] **Step 3 : Commit**

```bash
git add watcher/scripts/watch.ts
git commit -m "feat(watcher): watch daemon wires ChainThreatSource -> runWatcher"
```

---

### Task 6 : Script `exploit.ts` (l'attaquant = deployer)

**Files:**
- Create: `watcher/scripts/exploit.ts`

- [ ] **Step 1 : Écrire `watcher/scripts/exploit.ts`**

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

/// Acteur SIMULÉ (le seul) : l'attaquant (= deployer, ≠ keeper) draine le protocole
/// vulnérable via `emergencyWithdraw()`. Produit un VRAI log `Drained` on-chain que
/// le daemon `watch` détecte indépendamment.
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
  console.log(`[exploit] solde du protocole avant: ${before}`);

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
  console.log(`[exploit] 💥 drainé ${before - after} depuis ${cfg.proto} (attaquant ${attacker.address}) tx=${tx}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2 : Typecheck (sans exécuter)**

Run: `cd watcher && pnpm exec tsc --noEmit`
Expected: aucune erreur de type.

- [ ] **Step 3 : Commit**

```bash
git add watcher/scripts/exploit.ts
git commit -m "feat(watcher): exploit script (attacker drains protocol, real Drained log)"
```

---

### Task 7 : Retirer `demo.ts`, mettre à jour `package.json`, `README.md`, `.env.example`

**Files:**
- Delete: `watcher/scripts/demo.ts`
- Modify: `watcher/package.json`, `watcher/README.md`, `.env.example`

- [ ] **Step 1 : Supprimer l'ancien runner all-in-one**

Run: `git rm watcher/scripts/demo.ts`

- [ ] **Step 2 : Mettre à jour les scripts dans `watcher/package.json`**

Remplacer le bloc `"scripts"` par :

```json
  "scripts": {
    "test": "vitest run",
    "onboard": "tsx scripts/onboard.ts",
    "watch": "tsx scripts/watch.ts",
    "exploit": "tsx scripts/exploit.ts"
  },
```

- [ ] **Step 3 : Réécrire `watcher/README.md`** (contenu complet)

````markdown
# coincoin watcher

Service de détection→évacuation : un daemon surveille les exploits on-chain (logs
`Drained`) et déclenche l'évacuation des fonds d'un compte protégé (EOA délégué via
EIP-7702) vers son SafeVault.

Tests : `pnpm test`.

## Chaîne cible

`CHAIN` (dans `../.env`) sélectionne la cible : `robinhood` (défaut, chain 46630)
ou `arbitrumSepolia`. Les adresses des contrats déployés sont lues depuis `../.env`
(`GUARDIAN_IMPL`, `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`).

## Déploiement (Robinhood Chain Testnet)

Pré-requis : deployer + victim + keeper fundés en gas Robinhood ; `../.env` rempli
(`ROBINHOOD_TESTNET_RPC`, `DEPLOYER_PRIVATE_KEY`, `VICTIM_PRIVATE_KEY`,
`VICTIM_ADDRESS`, `KEEPER_PRIVATE_KEY`).

```bash
cd ../contracts && set -a && source ../.env && set +a
# 1) impl GuardianModule partagée
forge script script/Deploy.s.sol:DeployGuardian --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast
# 2) décor de démo (token + protocole vulnérable + SafeVault de la victime)
forge script script/SetupDemo.s.sol:SetupDemo --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast
```

Reporter dans `../.env` : `GUARDIAN_IMPL` (impl du step 1), puis `DEMO_TOKEN`,
`DEMO_PROTO`, `DEMO_VAULT` (step 2).

## Démo end-to-end (multi-terminal)

```bash
# Une fois : la victime délègue (7702) + configure son guardian
pnpm onboard

# Terminal A — le daemon de surveillance (le produit)
pnpm watch        # 👁️  surveillance de <PROTO>…

# Terminal B — l'attaquant draine le protocole (seul acteur simulé)
pnpm exploit      # 💥 drain → vrai log Drained on-chain
```

Le Terminal A détecte le log indépendamment, affiche « 🦆 COIN COIN ! » et évacue
les fonds au repos de la victime vers son SafeVault. `Ctrl-C` pour arrêter le daemon.
````

- [ ] **Step 4 : Mettre à jour `.env.example`**

Lire `.env.example`, puis AJOUTER (s'ils sont absents) ces clés à la fin :

```text

# ── Phase 5 : chaîne cible + détection on-chain ──
# robinhood (défaut, chain 46630) | arbitrumSepolia
CHAIN=robinhood
ROBINHOOD_TESTNET_RPC=
# Impl GuardianModule sur la chaîne cible (vide => fallback constante Arb Sepolia)
GUARDIAN_IMPL=
```

(Si `ROBINHOOD_TESTNET_RPC` existe déjà dans `.env.example`, ne pas le dupliquer.)

- [ ] **Step 5 : Vérifier la suite complète + typecheck**

Run: `cd watcher && pnpm test && pnpm exec tsc --noEmit`
Expected: tous les tests passent ; tsc propre ; `scripts/demo.ts` n'existe plus.

- [ ] **Step 6 : Commit**

```bash
git add watcher/package.json watcher/README.md .env.example
git commit -m "chore(watcher): replace demo.ts with watch/onboard/exploit + Robinhood docs"
```

---

## Definition of Done (Phase 5)

- [ ] `cd watcher && pnpm test` : tous les tests passent (smoke, threat, registry, keeper, sources **+ ChainThreatSource**, watcher **+ résilience**, config).
- [ ] `cd watcher && pnpm exec tsc --noEmit` : pas d'erreur de type (scripts inclus).
- [ ] `cd contracts && forge test` : 26/26 inchangé (aucun changement Solidity).
- [ ] `config.ts` piloté par env (défaut Robinhood), import sans effet de bord.
- [ ] Scripts `watch`/`onboard`/`exploit` présents ; `demo.ts` retiré ; `package.json` à jour.
- [ ] `README` (flux multi-terminal + déploiement Robinhood) et `.env.example` à jour.
- [ ] Aucun secret commité.
- [ ] **Exécution live (humain, après funding Robinhood)** : déployer → `pnpm onboard` → `pnpm watch` (terminal A) → `pnpm exploit` (terminal B) → « COIN COIN » + fonds au repos de la victime = 0, vault crédité.

**Next:** Phase 3 (adapters Aave V3 / GMX V2 pour évacuer les positions DÉPOSÉES) ; intégration du vrai flux Defimon (WS) en parallèle de `ChainThreatSource` ; Phase 5bis (dashboard).
