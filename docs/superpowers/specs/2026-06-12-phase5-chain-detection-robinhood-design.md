# coincoin — Phase 5: Real on-chain detection + demo on Robinhood Chain — Design

> Status: design validated (brainstorming). Next step: writing-plans.
> Date: 2026-06-12. Buildathon track: **Robinhood Chain** (Arbitrum Open House London).

## Goal

Make the detection loop **real** and run it on the track's chain.

Today (Phase 4), `demo.ts` sends the exploit itself, retrieves the receipt, then **builds the alert from that receipt**: detection is short-circuited. We want a **monitoring daemon** that watches the chain independently, detects the real exploit log, and triggers the evacuation — the only simulated actor being the attacker. And we target **Robinhood Chain Testnet** (chain 46630), where everything remains to be deployed.

## Context & established facts

- **7702 confirmed on Robinhood**: an Arbitrum Orbit chain (`nitro/v3.11.0-rc.4`), **ArbOS 61** (Arb Sepolia is ArbOS 60). EIP-7702 active since ArbOS 40. Base fee ~0.01 gwei → 0.0233 ETH/wallet is more than enough.
- **Nothing is deployed on Robinhood**: the GuardianModule impl (`0x6671b4B73b79c284A710B00ef777d8E65f55200F`) exists only on Arb Sepolia. The Solidity contracts don't change — we redeploy them as is.
- **Wallets** (roles consistent with Arb Sepolia): deployer `0xdae8992a9b5Fe850bE63781d1c2e65a3e496F728`, victim `0xFD0AFe0E91CBb9EBEB181060441a54E19300Ea89`, keeper `0x627872F35b724222413e7421C9e40A26B2762B9e`. Funded on Arb Sepolia, **to be funded on Robinhood** (user action).
- **Reused as is**: `decodeExploitLog`, `exploitEventAbi`/`DrainedLog`, `ThreatSource`/`MockThreatSource`, `findExposed`, `KeeperClient`, `runWatcher`, contracts `MockVulnerableProtocol`/`Attacker`, forge scripts `DeployGuardian`/`SetupDemo`.

## Design decisions (from the brainstorming)

1. **Lifecycle: pure daemon, manual stop.** `ChainThreatSource` watches continuously and never resolves during normal operation; we stop it on `SIGINT` (Ctrl-C).
2. **Orchestration: realistic multi-terminal split.** Separate entry points: `pnpm watch` (daemon = the product), `pnpm exploit` (triggers the attack), `pnpm onboard` (7702 delegation + configure, one-time).
3. **Funding: the 3 roles on Robinhood.** deployer deploys, victim = protected account, keeper = keeper. **Attacker = deployer** (not the keeper) → readable on-chain trace (attacker ≠ rescuer ≠ victim).
4. **Detection: approach B — `getLogs` loop with dependency injection.** Explicit block cursor, robust on any Orbit RPC, unit-testable without a live chain, consistent with the DI style of the rest. `decodeExploitLog` plugs in as is.

## Architecture

### Unit 1 — `config.ts` (extended, env-driven)

Purpose: make the chain and addresses configurable, default to Robinhood, **without breaking the import** (the smoke test and unit tests import this module).

- Keep the current static exports: `arbitrumSepolia`, `ROBINHOOD_TESTNET` (now **used**), and `GUARDIAN_IMPL` (Arb Sepolia constant, kept as a fallback + for the smoke test).
- Add `resolveChainConfig()`: reads the env and returns a resolved object, **called by the scripts only** (not at the top level, so importing is side-effect-free and doesn't throw):
  ```ts
  interface ResolvedConfig {
    chain: Chain;               // robinhood (default) | arbitrumSepolia, via env CHAIN
    rpcUrl: string;             // ROBINHOOD_TESTNET_RPC | ARBITRUM_SEPOLIA_RPC depending on CHAIN
    guardianImpl: `0x${string}`;// env GUARDIAN_IMPL || Arb Sepolia constant
    token: `0x${string}`;       // env DEMO_TOKEN
    proto: `0x${string}`;       // env DEMO_PROTO
    vault: `0x${string}`;       // env DEMO_VAULT
  }
  ```
  `resolveChainConfig()` **throws** if a required address (`DEMO_*`) is missing or if the RPC of the selected chain is absent — a clear error when launching the scripts, never at import time.

### Unit 2 — `ChainThreatSource` (in `sources.ts`)

`implements ThreatSource`. Dependency injected via a narrow interface (testability, no hard coupling to viem):

```ts
export interface DrainedLogFetcher {
  getDrainedLogs(args: { protocols: `0x${string}`[]; fromBlock: bigint }): Promise<DrainedLog[]>;
  currentBlock(): Promise<bigint>;
}

export interface ChainThreatSourceOpts {
  fetcher: DrainedLogFetcher;
  protocols: `0x${string}`[];
  fromBlock?: bigint;       // default: currentBlock() at startup
  pollIntervalMs?: number;  // default: 4000
  signal?: AbortSignal;     // daemon stop
}

export class ChainThreatSource implements ThreatSource {
  constructor(opts: ChainThreatSourceOpts) {}
  async start(onAlert: AlertHandler): Promise<void> { /* loop */ }
}
```

`start` loop:
1. `cursor = opts.fromBlock ?? await fetcher.currentBlock()`.
2. While not aborted:
   - `try`: `logs = await fetcher.getDrainedLogs({ protocols, fromBlock: cursor })`; for each log (ascending block order): `await onAlert(decodeExploitLog(log))`; if `logs.length`, `cursor = max(blockNumber) + 1n`.
   - `catch`: `console.warn` (RPC hiccup), **cursor unchanged**, we retry on the next tick.
   - `await sleep(pollIntervalMs)` **respecting the `AbortSignal`** (immediate wake-up if aborted).
3. Resolves only when the `AbortSignal` is triggered (clean exit).

**At-least-once** semantics (cursor = last block seen + 1); a deep reorg could duplicate/miss — acceptable for a testnet demo (noted). Logs without a `blockNumber` (pending) are ignored by the adapter. `MockThreatSource` remains unchanged (test transport / other uses).

### Unit 3 — `scripts/watch.ts` (`pnpm watch`, the daemon)

- `dotenv`, `resolveChainConfig()`.
- `publicClient` (active chain); `keeperWallet` (`KEEPER_PRIVATE_KEY` account).
- `DrainedLogFetcher` adapter on top of `publicClient.getLogs({ address, event: drainedEvent, fromBlock, toBlock: 'latest' })` (event = the `Drained` fragment of `exploitEventAbi`) + `publicClient.getBlockNumber()`.
- Registry = the protected account: `{ address: VICTIM_ADDRESS, safeVault: vault, watchedProtocols: [proto], tokens: [token] }`.
- **The daemon NEVER holds the victim's private key**: it reads `VICTIM_ADDRESS` (env) and signs the evacuation with the keeper key only (security property: `onlySelfOrKeeper` authorizes the keeper). Only `onboard.ts` uses `VICTIM_PRIVATE_KEY`.
- `keeper = new KeeperClient(keeperWallet)`.
- `AbortController`; `SIGINT` handler → `abort()` + exit log.
- `runWatcher({ source: new ChainThreatSource({ fetcher, protocols: [proto], signal }), accounts: [account], keeper })`.
- Startup banner: `👁️  coincoin watch — watching <proto> on <chain>…`. The "🦆 COIN COIN !" / "✅ evacuated" logs already come from `runWatcher`.

### Unit 4 — `scripts/exploit.ts` (`pnpm exploit`, the only simulated actor)

- `attacker = DEPLOYER_PRIVATE_KEY` (≠ keeper).
- Sends `emergencyWithdraw()` to `proto`, waits for the receipt, logs `💥 drain` + hash + amount (reading the proto balance before/after, or the `Drained` event).

### Unit 5 — `scripts/onboard.ts` (`pnpm onboard`, one-time)

- `victim = VICTIM_PRIVATE_KEY`.
- `signAuthorization({ contractAddress: guardianImpl, executor: "self" })` + self-send `configure(vault, keeper.address)` with `authorizationList: [auth]`, waits for the receipt. Extracted from the current `demo.ts` step 1 (with the `executor:"self"` fix already acquired).

### Unit 6 — Robinhood deployment (zero new code)

Reuses `DeployGuardian` (impl) then `SetupDemo` (token + proto + vault + mint), launched with `--rpc-url $ROBINHOOD_TESTNET_RPC --broadcast`. We record the addresses in `.env`: `GUARDIAN_IMPL`, `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`.

### Unit 7 — `runWatcher` (small hardening) + removal of `demo.ts`

- `runWatcher`: wrap the **per-account** evacuation in a `try/catch` (log the failure, keep going) instead of the current fail-fast — a failed evacuation must not kill the daemon (a point already raised in the Phase 4 review).
- Remove `scripts/demo.ts` and the `demo` npm script; add `watch`/`exploit`/`onboard`. The "fixed 4s wait" fix disappears de facto (the daemon reacts in real time).

## Demo flow (multi-terminal)

1. **Deployment** (forge, Robinhood): `DeployGuardian` → `SetupDemo`; record the addresses in `.env`.
2. `pnpm onboard` — the victim delegates (7702) + `configure(vault, keeper)`. Once.
3. **Terminal A**: `pnpm watch` → `👁️ watching PROTO…`.
4. **Terminal B**: `pnpm exploit` → `💥` the attacker drains the protocol (real on-chain log).
5. **Terminal A** lights up: `🦆 COIN COIN !` → evacuates the victim's funds **at rest** to their SafeVault. `Ctrl-C` to stop.

## Error handling

- **`getLogs` fails**: caught, `console.warn`, cursor unchanged, retry on the next tick (the daemon doesn't crash, doesn't skip blocks).
- **`evacuate` throws**: caught **per account** in `runWatcher`, logged, the daemon continues.
- **Missing addresses/RPC**: `resolveChainConfig()` throws when launching the script with a clear message (never at import time).
- **Reorg**: at-least-once assumed for the demo (noted).

## Test strategy

- **`ChainThreatSource` (unit, without a live chain)**: fake `DrainedLogFetcher`. (a) one canned `Drained` log on the 1st poll then empty → `onAlert` called once with the correct decoded alert (lowercased addresses, exact `block_number`); (b) `AbortSignal` triggered → `start()` resolves, no more calls. Cursor advanced correctly between polls.
- **`runWatcher` resilience**: `evacuate` throws on one account → the exception is swallowed (logged), the daemon does not propagate; the following exposed accounts are still attempted.
- **Non-regression**: `MockThreatSource`, `threat`, `registry`, `keeper`, `smoke` stay green.
- **Typecheck**: `pnpm exec tsc --noEmit` clean (watch/exploit/onboard included).
- **Solidity**: `forge test` 26/26 unchanged (no contract change).

## Definition of Done

- [ ] `ChainThreatSource` implemented + tested; watcher suite green (incl. new tests + `runWatcher` resilience).
- [ ] `pnpm exec tsc --noEmit` clean; `forge test` 26/26.
- [ ] `config.ts` env-driven (default Robinhood), side-effect-free import.
- [ ] `watch`/`exploit`/`onboard` scripts written; `demo.ts` removed; `package.json` up to date.
- [ ] `README` updated: Robinhood deployment + multi-terminal flow.
- [ ] `.env.example`: add `CHAIN`, `GUARDIAN_IMPL` (override), reminder of `ROBINHOOD_TESTNET_RPC`.
- [ ] No secret committed.

## Prerequisites (user action, outside code)

- Fund **deployer + victim + keeper** on Robinhood (faucet/bridge).
- Run the forge deployments on Robinhood and record the addresses in `.env`.
- The live run (`onboard` → `watch` → `exploit`) is done by the human once funded/deployed.

## Out of scope (Phase 5)

- Integration of the real Defimon feed (WS) — `decodeExploitLog`/the schema remain compatible to add it later.
- Multi-account / multi-protocol at scale, cursor persistence, fine-grained reorg handling.
- Aave/GMX adapters (deposited positions) — a separate Phase 3.
