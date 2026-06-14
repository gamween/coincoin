# coincoin — submission guide

> Self-contained pre-submission status + checklist. Buildathon: **Arbitrum Open House London** (submission June 14, 2026), Robinhood Chain track.

## One-liner
A **self-custodial onchain firewall**: it detects a real on-chain threat and **moves your funds to your own vault on its own**, within the non-atomic response window — protecting funds **at rest AND deposited in DeFi** (the blind spot Harpie never covered). The same EIP-7702 primitive attackers use to drain, turned into defense.

## Verified (ground truth)
- **90 tests pass**: 65 Foundry (incl. `AaveRealFork` — exits a real 1 WETH position on the **live Aave V3 Pool on Arbitrum One**) + 25 watcher (vitest). Site builds + lints clean.
- **Audit verdict: the problem is genuinely solved end-to-end — not theater.** The five pillars (real 7702 delegation + self-config, real on-chain detection, reactive rescue to the user's own vault, proactive firewall, non-custodial bounds) are real in code + tests.
- Run: `forge test` (set `ARBITRUM_ONE_RPC=…` to include the live-Aave fork; otherwise 64 pass / 1 skip) · `cd watcher && pnpm test`.

## Live status (Robinhood Chain testnet, chain 46630) — everything is LIVE (redeployed 2026-06-14)
The **current GuardianModule** (`0xd0d301Aeaa7AA5Ced16C927030f131c9Cb083b77`) + **RulesEngineV1** (`0xc20A9d7D38B07a9C74A1fD87A2e25CA1973Cbc52`) are deployed and a **fresh victim** (`0xfa142e801447fc359E54e8E797357aA7cBf23368`) is onboarded to them. All addresses in `deployments/robinhood-testnet.json`. Verified on-chain:
- ✅ EIP-7702 delegation + self-config (delegation indicator `0xef0100…d0d301…`), ERC-20 sweep, approval revocation
- ✅ **Frozen vault** — `safeVault()` = the configured vault; reconfiguring to a different vault reverts `VaultLocked`
- ✅ **Signed multi-keeper policy** (`configureWithSig`) · **`exitAaveV3`** (DeFi exit) · **local firewall** (`execute` + `RulesEngineV1`; `score()` returns `100` + the spender for a blanket `setApprovalForAll(…, true)` to an untrusted operator)
- ✅ **End-to-end detection → Aave exit → evacuation, run on-chain:** 500 idle + 300 deposited-in-Aave dUSD rescued to the user's vault (final vault balance 800, victim 0, Aave position 0) in one keeper-driven sequence — no human in the loop.

Keep-accurate caveat: Aave V3 isn't deployed on Robinhood, so the live exit runs against a `MockAavePool`; the exit *code* is additionally **fork-verified against the real Aave V3 Pool on Arbitrum One**. The previous build `0x6671…200F` (delegation + sweep + revoke only) is **superseded**.

## Redeploy runbook (executed 2026-06-14 — kept for reproducibility)
```bash
# ⚠️ Run forge/cast from contracts/ and do NOT export CHAIN (see gotcha 1).
cd contracts && set -a && source ../.env && set +a && unset CHAIN
forge script script/Deploy.s.sol:DeployGuardian    --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --skip-simulation  # GuardianModule → note address
forge script script/DeployRules.s.sol:DeployRules  --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --skip-simulation  # RulesEngineV1 → note address
forge script script/SetupDemo.s.sol:SetupDemo      --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --skip-simulation  # token + proto + vault + MockAavePool
# .env: GUARDIAN_IMPL=<new>, DEMO_TOKEN/DEMO_PROTO/DEMO_VAULT/DEMO_AAVE_POOL=<printed>, RULES_ENGINE=<RulesEngineV1>
# site/.env: VITE_RULES_ENGINE=<RulesEngineV1> ; site/src/app/contracts.ts: guardianImpl + token
cd ../watcher && pnpm onboard     # delegate the victim to the new impl + configure (frozen vault, keeper)
```
Then update `deployments/robinhood-testnet.json` (GuardianModule + RulesEngineV1 + demo block incl. MockAavePool + victim), `pnpm build` the site, and the dashboard firewall controls work.

**Two gotchas learned the hard way (don't skip):**
1. **`CHAIN=robinhood` in `.env` collides with foundry's `--chain`.** foundry auto-loads `.env` from the cwd, so `forge`/`cast` read `CHAIN` and die with `invalid value 'robinhood' for '--chain'`. Run them from `contracts/` (no `.env` there) and don't export `CHAIN`. The watcher scripts DO need `CHAIN=robinhood`, so keep it in `.env`.
2. **EIP-7702 storage persists across re-delegation.** An EOA already onboarded to the OLD build keeps its storage (e.g. `safeVault`); the new build's frozen-vault guard then reverts `configure` with `VaultLocked` (silently — `onboard.ts` used to print a false ✅; it now checks the receipt status). Fix: onboard a **fresh, never-delegated victim** — generate a key (`cast wallet new`), fund it, re-run `SetupDemo` for it (so it gets idle tokens + an Aave position + its own vault), then `pnpm onboard`.

## Deliberate mocks (disclosed — not deception)
- `MockAavePool` — Aave V3 isn't deployed on Robinhood; the **exit code is fork-verified against real Aave on Arbitrum One**.
- `MockVulnerableProtocol` + `Attacker` — the sacrificial target you exploit to emit a real `Drained` log (you can't ethically drain a real protocol).
- `MockThreatSource` — test-only transport; real detection is on-chain `Drained`-log polling (`ChainThreatSource`).

## Not built (roadmap — say so)
Policy asset/protocol scoping · broader rules (Permit2 / multicall / direct-transfer) · GMX V2 exit · Stylus rules engine · in-browser 7702 onboarding (CLI for now) · real Defimon WS feed (current detection is on-chain, zero-dependency).

## Demo video script (~90s — the one MUST left to record)
1. The problem in one line ($83.85M drained in 2025; nobody acts for you in the window).
2. `pnpm watch` — the guardian watching live on Robinhood (real `getLogs`).
3. `pnpm exploit` (separate terminal) — attacker drains the demo protocol → real `Drained` log.
4. Back in watch: **COIN COIN!** threat detected → evacuated to the vault (receipt-confirmed). No human in the loop.
5. Dashboard `/app`: connect / inspect the account → **PROTECTED**, the rescued funds now in the vault.
6. The firewall reverting a malicious `setApprovalForAll`; the live Aave exit (both now deployed on Robinhood).
7. `pnpm revoke` — one tx removes the delegation. 100% non-custodial, never locked in.

## HackQuest submission checklist
- [x] Public repo: https://github.com/gamween/coincoin
- [x] Deployed on an Arbitrum chain (Robinhood Orbit 46630) + verifiable contracts (`deployments/robinhood-testnet.json` → GuardianModule `0xd0d3…3b77` + RulesEngineV1 `0xc20A…bc52`, on the chain explorer)
- [x] MIT `LICENSE`
- [x] Problem statement + sources (README, `/docs.html`)
- [x] Robinhood Chain track positioning
- [ ] **Demo video** (record per the script above — biggest remaining item)
- [ ] **Deploy the site** (`cd site && pnpm build`, host `dist/` on Vercel/Netlify) → put the live URL + `/app` + repo on the HackQuest entry
- [x] **Redeploy** the latest contracts to Robinhood — done 2026-06-14; firewall / DeFi exit / signed policy / frozen vault all live + end-to-end rescue verified on-chain
- [x] Confirm the X handle on the site (`site/src/data.ts` `CONTACTS.x` → `https://x.com/dvb_fianso`)
