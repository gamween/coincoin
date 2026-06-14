# coincoin — Design & Spec

- **Date**: 2026-06-10
- **Author**: Sofiane (+ Claude)
- **Event**: Arbitrum Open House London — Buildathon online (submission **June 14, 2026**), Founder House IRL London July 10-12
- **Targeted tracks**: Open / General · Security · (bonus) Robinhood Chain
- **Status**: original design vision (see banner) — shipped scope is narrower
- **Repo**: https://github.com/gamween/coincoin

> ⚠️ **This document is the original design vision (June 10), not the shipped scope.**
> **Built today:** the EIP-7702 `GuardianModule` (ERC-20 sweep, approval revocation, `exitAaveV3`
> DeFi-position exit, frozen vault), `SafeVault`, and a TypeScript watcher doing real on-chain
> detection → exit → evacuate, live on Robinhood Chain. **Not built (roadmap):** `PreAuthRegistry`,
> the Stylus/Solidity `RulesEngine` + per-tx hook, the ERC-7579/Safe path, GMX V2, ZeroDev, the real
> Defimon WS feed, and the Next.js dashboard. The present tense below describes the *intended* product;
> see the repo **README → Status** for what actually runs.

> 🦆 **coincoin** — the onchain firewall that shouts "coin coin !" when someone tries to drain you, and moves your funds to safety on its own. The canary in the coal mine, self-custody edition, on Arbitrum.

---

## 0. TL;DR

**coincoin** is a **self-custodial** onchain firewall for individuals, on Arbitrum. It protects **both your assets at rest in the wallet AND your funds deposited in DeFi protocols**, by **automatically evacuating / exiting** your funds as soon as a verifiable threat is detected — within the reaction window left by non-atomic hacks.

The key difference from what has existed before (Harpie, shut down in 2025): we **enforce at the account level** via EIP-7702 / ERC-7579 hooks (not a fragile front-run race), we **react to a live threat feed** (Defimon) coupled with a **Stylus rules engine**, and we **cover DeFi positions** — the blind spot Harpie was never able to address.

---

## 1. The problem (recurring, sourced)

Two families of losses, both **recurring and documented** (web + Defendor/Defimon Telegram channels read on June 10, 2026).

### 1.1 Compromise of individual wallets
- **$83.85M stolen from 106,106 victims** in 2025 by wallet drainers / phishing (Scam Sniffer). *Down* 83% but far from solved: average loss **$790/victim**, and campaigns keep multiplying in volume.
- **Permit-based attacks** = 38% of losses >$1M. **Malicious EIP-7702**: a new post-Pectra vector (2 cases in August 2025 = $2.54M; **>90% of onchain 7702 delegations are sweepers**).
- Seen in Telegram: **297 wallets drained / $500K** (key leak), **fake Axiom app → 207 users / $147K**, **fake Uniswap Google ad / $400K**.

### 1.2 Funds deposited in exploited protocols
- **Renegade.fi** ($209K, May 2026, **Arbitrum + Stylus**, `initialize()` left exploitable for 354 days), **StakeDAO** (deployer key, Arbitrum), **Sharwa.finance** ($33K, Arbitrum, spot oracle with no TWAP). All in Telegram.
- **Defimon insight** (decisive): *"many hacks are not atomic; reconstructing 10 timelines, the windows between the 1st malicious tx and the full drain range from 4 minutes to 5 days."* → **there is a response window** that nobody tools on the user side.

### 1.3 The takeaway
Once your key/approval is compromised **or** a protocol you're deposited in is attacked, **no consumer-grade tool acts for you automatically** within that window. Pre-signature prevention (Blockaid, Kerberus, Revoke.cash) blocks a *bad signature* but does nothing **after** the compromise nor for your **positions**.

---

## 2. Why now (and why it doesn't exist)

| Fact | Implication |
|------|-------------|
| **Harpie** ("the on-chain firewall") did auto-evacuation via front-running, on Arbitrum, backed by Coinbase/OpenSea… | …but **shut down in March 2025** for a **business reason** ("could not create a sustainable business model"), **not** a technical one. Market validated, leader gone. |
| **EIP-7702** activated on **May 7, 2025** (Pectra) — *after* Harpie shut down | The primitive that makes an existing EOA capable of running guardian code **did not exist** for Harpie → it was doomed to front-run racing. We have it. |
| **ERC-7579** (modular circuit-breaker hooks) matured 2024-2026, **Stylus** mainnet since Sept. 2024, **agent-ready threat feed** (Defimon) in 2026 | None of these building blocks were available in Harpie's era. |
| **No living product** covers the scope (Webacy = semi-manual panic button; MetaMask Agent Wallet = pre-tx prevention). **Auto-exit of DeFi positions on exploit = nobody.** | A genuinely open niche. |

**The narrative reversal**: attackers already use EIP-7702 to *drain* (delegation → sweeper). coincoin uses **the same primitive on defense** (delegation → guardian). We turn their own weapon around.

---

## 3. Product view

The user connects their wallet, **delegates their account** to coincoin's GuardianDelegate (EIP-7702) or installs the modules (ERC-7579), chooses a **Safe Vault** they own, selects the **protocols to watch**, sets their **thresholds**, and **pre-authorizes** (EIP-712 signature) the exact set of emergency actions.

Then coincoin runs in the background:
- **Continuously**: an account-level hook evaluates every outgoing transfer through the Stylus rules engine and **blocks** obvious drain patterns.
- **On threat**: a watcher plugged into the Defimon feed detects that a protocol the user is exposed to is being attacked, and executes the pre-authorized **position exit + sweep**, toward the Safe Vault, within the response window.

Everything is **non-custodial**: the user keeps their keys, can revoke the delegation at any time (delegate → `address(0)`), and the keeper can **only** trigger the pre-authorized emergency actions toward the **user's own vault** — never toward an arbitrary address.

---

## 4. Essential features (full MVP scope)

1. **Onboarding & protected account**
   - EIP-7702 delegation to `GuardianDelegate` (EOA path), **or** installation of `GuardianHook` + `GuardianExecutor` (ERC-7579 smart account path: Safe/Kernel).
   - 1-click revocation (delegation reset).
2. **Safe Vault** — minimal contract *owned by user*; the Guardian can **push** into it, only the user can **withdraw**.
3. **PreAuthRegistry** — per-user policy (EIP-712 signature): covered assets, destination vault, watched protocols, thresholds, authorized keeper(s). Strictly bounds what the keeper can do.
4. **Stylus rules engine (RulesEngine)** — evaluates cheaply onchain: anomaly score of an outgoing tx (amount to a never-seen address, `approve`/`setApprovalForAll` to an unverified contract, drain pattern) and protocol exploit conditions.
5. **Two-layer detection**
   - **Local**: ERC-7579 hook / 7702 logic → account-level **revert** on a triggered rule (always works, zero external dependency).
   - **External**: watcher subscribed to Defimon `/ws/confirmed_attacks` (filter `arbitrum`) → triggers the pre-authorized evacuation.
6. **Wallet asset evacuation** — ERC-20 / NFT sweep to the Safe Vault + **revocation of dangerous approvals**.
7. **DeFi position exit** (Harpie's blind spot) — adapters:
   - **Aave V3** (Pool `0x794a61358D6845594F94dc1DB02A252b5b4814aD`): `withdraw` (the Guardian executing in the account's context holds the aTokens).
   - **GMX V2** (ExchangeRouter `0x602b805EedddBbD9ddff44A7dcBD46cb07849685`): `createOrder` market-decrease (2 steps; the keeper finalizes).
8. **Robinhood Chain angle** — protect **Stock Tokens** (hTSLA, hAMZN…): sweep the balance to the user's Safe Vault (Chain ID **46630**, RPC `https://rpc.testnet.chain.robinhood.com/rpc`).
9. **Dashboard** — protection status, watched positions, rules config, **panic button** (immediate manual trigger), incident log, vault withdrawal.
10. **Recovery** — after an incident, withdraw from the Safe Vault to a fresh wallet.

---

## 5. Architecture & components

```
┌────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js + wagmi/viem + RainbowKit)                       │
│  Onboarding wizard · Dashboard · Panic button · Incident log · Vault │
└───────────────┬───────────────────────────────┬────────────────────┘
                │                                │
        (read state)                     (signs EIP-712 pre-auth,
                │                         7702 delegation)
                ▼                                ▼
┌────────────────────────────┐      ┌──────────────────────────────────┐
│  WATCHER (TypeScript)      │      │  CONTRACTS (Solidity + OZ)        │
│  - Defimon WS subscriber   │      │  GuardianDelegate (7702 impl)     │
│  - attack→users mapping    │─────▶│  GuardianHook+Executor (7579)     │
│  - relayer (ZeroDev/4337   │ tx   │  SafeVault (user-owned)           │
│    or sponsored 7702 tx)   │      │  PreAuthRegistry (EIP-712)        │
└────────────┬───────────────┘      │  ExitAdapters: Aave V3, GMX V2,   │
             │                      │     ERC20 sweeper, RH Stock       │
       (threat signal)             └───────────────┬──────────────────┘
             │                                     │ calls (sync, cheap)
             ▼                                     ▼
   ┌─────────────────────┐            ┌──────────────────────────────┐
   │  Defimon WebSocket  │            │  RulesEngine (Stylus / Rust) │
   │  /ws/confirmed_…    │            │  anomaly scoring + rules     │
   └─────────────────────┘            └──────────────────────────────┘
```

**Contracts**
- `GuardianDelegate` — implementation delegated via EIP-7702; exposes the emergency functions (`evacuate`, `exitPosition`, `revokeApprovals`) callable only by the pre-authorized keeper or the user, bounded by `PreAuthRegistry`.
- `GuardianHook` + `GuardianExecutor` — ERC-7579 variant for smart accounts (hook = sync blocking; executor = emergency actions).
- `SafeVault` — destination of evacuated funds; `onlyOwner` for withdrawal.
- `PreAuthRegistry` — stores/validates the signed policy (EIP-712): action scope, vault, protocols, thresholds, keepers.
- `ExitAdapter` (interface) + impls `AaveV3ExitAdapter`, `GmxV2ExitAdapter`, `Erc20SweepAdapter`, `RobinhoodStockAdapter`.
- `RulesEngine` (**Stylus/Rust**) — pure-ish scoring function called by the hook and by the watcher before action.

**Off-chain**
- `watcher` (TS) — Defimon WS subscription, index of user positions, triggering txs via relayer.
- `frontend` (Next.js) — onboarding, dashboard, panic button, vault.

---

## 6. Data flow

1. **Onboarding**: connect → 7702 delegation (or install modules) → choose Safe Vault → select protocols → set thresholds → **EIP-712 signature** of the policy (PreAuthRegistry).
2. **Normal operation**: every outgoing tx passes through the hook → the Stylus `RulesEngine` scores it → an obvious drain is **reverted** at the account level.
3. **Event**: Defimon emits a `confirmed_attack` on protocol P (`network: arbitrum`). The watcher sees that the user has a position in P → submits the **pre-authorized exit** (`AaveV3`/`GMX`) **+ sweep** of the assets at rest, via the relayer, within the window.
4. **Moved to safety**: the funds land in the user's **Safe Vault**. Notification.
5. **Recovery**: the user withdraws the vault to a fresh wallet.

---

## 7. Tech stack & sponsor mapping

| Building block | Tech | Sponsor served |
|--------|--------|---------------|
| Programmable account / delegation | EIP-7702, ERC-7579, ERC-4337, **ZeroDev** (bundler/session keys) | **ZeroDev** |
| Security contracts | Solidity + **OpenZeppelin** (modules, libs) | **OpenZeppelin** |
| Onchain rules engine | **Stylus** (Rust/WASM) | **Arbitrum / Stylus** |
| RWA protection | **Robinhood Chain** testnet (Stock Tokens) | **Robinhood Chain** |
| Saver protection (thesis) | — | **CFIT** (Centre for Finance, Innovation & Tech) |
| Threat feed | Defimon WS (or conformant mock) | — |
| Front | Next.js, wagmi, viem, RainbowKit | — |
| Deployment | **Arbitrum Sepolia** (eligibility) + **Robinhood Chain testnet** | — |
| RPC infra | **Alchemy** (recommended by RH Chain) | **Alchemy** |

---

## 8. Security & trust model

- **Non-custodial**: the user keeps their keys. The 7702 delegation is **revocable at any time** (`delegate → address(0)`), and anyone can broadcast the signed revocation (sponsored gas).
- **Bounded keeper**: the keeper can **only** trigger the pre-authorized actions **toward the user's own vault** / exit **their** positions. It **cannot** send funds to an arbitrary address. **Worst case if the keeper is malicious/compromised**: an unjustified evacuation (an annoyance, not a theft) — the funds go to the user's vault.
- **Frozen vault**: the destination is fixed at policy-signing time, and the vault is `onlyOwner`.
- **Minimal & audited guardian**: in line with 7702 best practices (Fireblocks/Halborn), the delegated contract's surface is minimal and audited — precisely the "battle-tested 7702 contract" that is missing today.
- **Guardrails**: anti-abuse cooldown, configurable thresholds, double confirmation for destructive actions on the UI side.

---

## 9. The demo (theatrical, what wins)

Two wallets side by side, **one protected by coincoin, one not**.
1. **Local rule**: a drainer pushes a `setApprovalForAll` to an unverified contract → the hook **reverts** at the account level (the unprotected wallet, meanwhile, signs and gets drained).
2. **Position exploit**: on **Arbitrum Sepolia** we deploy a vulnerable mock protocol + an attacker; the user has deposited $Y there and has $X at rest. The attack starts → `confirmed_attack` signal → coincoin **exits the Aave/mock position + sweeps** to the Safe Vault **before** the drain reaches the user. The unprotected wallet is drained.
3. **Robinhood angle**: on Robinhood testnet, threatened **hTSLA** are moved to safety in the vault.
4. **Recovery**: withdraw from the vault to a fresh wallet.

Hook metric: *"funds saved vs lost"*, with the response-window timer on screen.

---

## 10. Art direction

**Concept**: the **canary in the coal mine** meets the **duck that goes coin-coin**. coincoin is your living alarm: it *squawks* ("coin coin !") at the first sign of danger and pulls you to safety. The security metaphor (early-warning) and the name (the duck onomatopoeia) merge perfectly.

- **Mascot**: a cartoon canary-duck, expressive, available in 3 states:
  - **Calm** (standby) — sitting quietly, eye half-closed.
  - **Alert** (threat detected) — beak wide open "COIN COIN !", ruffled feathers, red exclamation mark.
  - **Hero** (funds saved) — holding a **life buoy** / a small chest, thumbs up.
- **Palette**:
  - **Canary yellow `#F5D90A`** (primary — attention/alarm),
  - **Midnight blue `#0B1B3A`** (background — consistent with Arbitrum + the buildathon's brick/arcade aesthetic),
  - **Alarm red `#FF3B3B`** (threat states),
  - **Safe green `#27C93F`** ("evacuated / safe" state).
- **Style**: bold flat illustration + a **retro-arcade pixel-art** wink (the buildathon's sponsor page is brick-styled in a Mario-like way) — warm but vigilant: security that isn't scary, which serves the B2C "make self-custody safe for everyone" positioning.
- **Logo**: a duck silhouette inside a **shield**, or a duck head stylized as an **alarm bell**.
- **Tone & voice**: friendly, a bit mischievous, never anxiety-inducing. Micro-copy that owns the duck ("coincoin is watching", "COIN COIN ! evacuating", "your funds are high and dry 🦆").

---

## 11. Out of scope (YAGNI for the MVP)

- Not "all of DeFi": **2 real adapters** (Aave V3, GMX V2) + 1 mock + a generic sweep + Stock Tokens. Extensible adapter architecture, the rest on the roadmap.
- **No front-running** of the attacker (Harpie's fragile model; the Arbitrum sequencer makes it unreliable). We enforce at the account level + react within the non-atomic window.
- No homegrown ML detection: we consume Defimon (or a mock) + deterministic Stylus rules.
- No decentralized multi-keeper for the MVP (1 bounded keeper + user revocation) — decentralizing the watcher = roadmap.

---

## 12. Risks & fallbacks

| Risk | Mitigation / Fallback |
|--------|----------------------|
| Defimon WS access unavailable | **Mock** emitting the same schema (`/ws/confirmed_attacks`) + the local Stylus rules (always functional, zero dependency). Honest & documented. |
| EIP-7702 not/poorly supported on Arbitrum Sepolia / RH testnet | **ERC-7579** path (Safe/Kernel) as an alternative; demo on the chain that supports it best. |
| GMX V2 2-step execution slow in the demo | Demonstrate Aave first (1 tx); GMX second / on a recording. |
| Rebasing Stock Tokens (multiplier) break the sweep | The sweep moves the **current balance** to the user's vault (same asset, same owner) → no assumption about the multiplier. |
| Scope too large solo / in 5 days | Priority order: (1) Guardian + SafeVault + sweep + local rules, (2) Aave exit + Defimon watcher, (3) GMX, (4) Robinhood, (5) demo polish. |

---

## 13. Deployment & reference addresses

- **Arbitrum Sepolia** (main deployment, buildathon eligibility).
- **Robinhood Chain testnet** — Chain ID **46630**, RPC `https://rpc.testnet.chain.robinhood.com/rpc`, faucet `https://faucet.testnet.chain.robinhood.com/add-chain` (0.05 ETH + 5 of each Stock Token / 24h). Orbit L2, **Alchemy** infra.
- Reference mainnet addresses (for the adapters): Aave V3 Pool `0x794a61358D6845594F94dc1DB02A252b5b4814aD`, GMX V2 ExchangeRouter `0x602b805EedddBbD9ddff44A7dcBD46cb07849685`.

---

## 14. What I (potentially) need from you

- **Defimon WS**: an **API key** (`@DecurityHQ`) to plug in the real feed. Otherwise I'll code the conformant mock — tell me whether you want me to try to get access or whether we go straight for the mock.
- **ZeroDev**: a project / API key (bundler + paymaster) for sponsored txs and session keys.
- **Alchemy**: an app on Arbitrum Sepolia + Robinhood testnet (RPC).
- **Faucet accounts**: Arbitrum Sepolia ETH + Robinhood testnet (Stock Tokens).

**✅ Decided (June 11, 2026)**: **EIP-7702 = main path** (the most "2026", turns the attackers' weapon around, supported by ZeroDev on Arbitrum Sepolia chain 421614). ERC-7579/Safe = documented fallback. ZeroDev Kernel is compatible with both 4337 **and** 7702 → it's our account base.

> 💡 External validation: Decurity publishes a research page [rescue-window.decurity.io](https://rescue-window.decurity.io/) on drain windows, and **a 9-figure hedge fund already uses their WebSocket to exit its positions automatically as soon as an attack begins** — exactly our mechanism, but built for a fund (B2B), not for individuals. coincoin = that mechanism, democratized.

---

## 15. Open questions

- Defimon covers `arbitrum`; does it cover **Robinhood Chain**? If not, on RH we rely on the local Stylus rules only.
- Exact scope of the "dangerous approvals" to auto-revoke (all vs a list).
- Name of the secondary token/brand for the vault ("coincoin Nest"? to be decided in art direction).
