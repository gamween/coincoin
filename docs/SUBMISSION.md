# coincoin — submission guide

> Self-contained pre-submission status + checklist. Buildathon: **Arbitrum Open House London** (submission June 14, 2026), Robinhood Chain track.

## One-liner
A **self-custodial onchain firewall**: it detects a real on-chain threat and **moves your funds to your own vault on its own**, within the non-atomic response window — protecting funds **at rest AND deposited in DeFi** (the blind spot Harpie never covered). The same EIP-7702 primitive attackers use to drain, turned into defense.

## Verified (ground truth)
- **90 tests pass**: 65 Foundry (incl. `AaveRealFork` — exits a real 1 WETH position on the **live Aave V3 Pool on Arbitrum One**) + 25 watcher (vitest). Site builds + lints clean.
- **Audit verdict: the problem is genuinely solved end-to-end — not theater.** The five pillars (real 7702 delegation + self-config, real on-chain detection, reactive rescue to the user's own vault, proactive firewall, non-custodial bounds) are real in code + tests.
- Run: `forge test` (set `ARBITRUM_ONE_RPC=…` to include the live-Aave fork; otherwise 64 pass / 1 skip) · `cd watcher && pnpm test`.

## Honest live-vs-built split (IMPORTANT — keep it accurate)
**Live on Robinhood Chain testnet (chain 46630) right now** — the GuardianModule deployed there (`0x6671…200F`) is an *earlier* build:
- ✅ EIP-7702 delegation + self-config, ERC-20 sweep, approval revocation
- ✅ Real on-chain **detection → evacuation** loop (the watcher) — verifiable on-chain

**Built + fully tested in source, but NOT in the deployed Robinhood bytecode yet:**
- Frozen vault · signed multi-keeper policy (PreAuthRegistry / `configureWithSig`) · `exitAaveV3` (DeFi exit) · local firewall (`execute` + `RulesEngineV1`)
- → **Redeploy to make them live on Robinhood** (see below). Until then, don't claim them "live on Robinhood" — say "built + tested; redeploy to activate."

## Make everything live on Robinhood (redeploy runbook)
```bash
cd contracts && set -a && source ../.env && set +a
forge script script/Deploy.s.sol:DeployGuardian    --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast   # new GuardianModule → note address
forge script script/DeployRules.s.sol:DeployRules  --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast   # RulesEngineV1 → note address
forge script script/SetupDemo.s.sol:SetupDemo      --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast   # token + proto + vault + MockAavePool
# .env: GUARDIAN_IMPL=<new>, DEMO_TOKEN/DEMO_PROTO/DEMO_VAULT/DEMO_AAVE_POOL=<printed>
# site/.env: VITE_RULES_ENGINE=<RulesEngineV1>
cd ../watcher && pnpm onboard     # re-delegate the victim to the NEW impl + configure (frozen vault, keeper)
```
Then update `deployments/robinhood-testnet.json` (new GuardianModule + RulesEngineV1 + MockAavePool), `pnpm build` the site, and the dashboard firewall controls work. After that, the "built + tested" group above is genuinely live on Robinhood → tighten the README Status wording.

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
6. (If redeployed) firewall reverting a malicious `setApprovalForAll`; the Aave exit.
7. `pnpm revoke` — one tx removes the delegation. 100% non-custodial, never locked in.

## HackQuest submission checklist
- [x] Public repo: https://github.com/gamween/coincoin
- [x] Deployed on an Arbitrum chain (Robinhood Orbit 46630) + verifiable contract (`deployments/`, Arbiscan-verified `0x6671…200F`)
- [x] MIT `LICENSE`
- [x] Problem statement + sources (README, `/docs.html`)
- [x] Robinhood Chain track positioning
- [ ] **Demo video** (record per the script above — biggest remaining item)
- [ ] **Deploy the site** (`cd site && pnpm build`, host `dist/` on Vercel/Netlify) → put the live URL + `/app` + repo on the HackQuest entry
- [ ] (Recommended) **Redeploy** the latest contracts to Robinhood so the firewall / DeFi exit / signed policy are live too
- [ ] Confirm the X handle on the site (`site/src/data.ts` `CONTACTS.x`)
