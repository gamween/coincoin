# 🦆 coincoin

> The onchain firewall that shouts "coin coin !" when someone tries to drain you — and moves your funds to safety all on its own.

**coincoin** is a **self-custodial** onchain firewall for retail users, on **Arbitrum**. It protects **both your assets at rest in the wallet AND your funds deposited in DeFi protocols**, by automatically evacuating / withdrawing your funds as soon as a verifiable threat is detected — within the reaction window that non-atomic hacks leave open.

A project for the **[Arbitrum Open House London](https://arbitrum-london.hackquest.io/)** buildathon (submission June 14, 2026).

## The problem

- **$83.85M stolen from 106,106 victims** in 2025 via wallet drainers / phishing (Scam Sniffer). Attackers are even already using **EIP-7702** to drain (90%+ of 7702 delegations are sweepers).
- On the protocol side, exploits leave a **non-atomic response window** (4 min → 5 days, Defimon data) that nobody tools up on the user side.
- Pre-signature prevention (Blockaid, Revoke.cash…) blocks a bad signature, but **does nothing after a compromise nor for your positions**.

## The approach

Where **Harpie** (shut down in 2025, for business reasons) had to run a fragile *front-run racing*, coincoin:

- **enforces at the account level** via **EIP-7702** (the primitive arrived *after* Harpie);
- **reacts to a real on-chain threat signal** within the non-atomic response window;
- **covers DeFi positions** (**auto-exit Aave V3** — real-ABI, fork-verified against live Aave) — the blind spot Harpie could never address;
- stays **100% non-custodial**: you keep your keys, the keeper can only evacuate to **your own** Safe Vault.

We turn the attackers' weapon against them: the same EIP-7702 delegation they use to drain, we use to protect.

## Stack

Solidity + OpenZeppelin + Foundry · EIP-7702 guardian + Aave V3 exit · TypeScript watcher (viem). The EIP-7702 guardian, ERC-20 sweep and on-chain detection loop run **live on Robinhood Chain testnet** (Arbitrum Orbit, chain 46630).

## Docs

Original design vision (broader than the shipped scope — see **Status** for what's live): [`docs/superpowers/specs/2026-06-10-coincoin-design.md`](docs/superpowers/specs/2026-06-10-coincoin-design.md)

Brand kit (design system in UI tokens: palette, fonts, components, mascot): [`docs/brand/BRAND.md`](docs/brand/BRAND.md)

## Status

**Live, end-to-end** on Robinhood Chain testnet (chain 46630, Arbitrum Orbit):

- ✅ `GuardianModule` (EIP-7702 delegate) — bounded keeper, **frozen vault** (a leaked key can't redirect funds), ERC-20 sweep + approval revocation.
- ✅ **Signed policy (PreAuthRegistry, folded)** — the account sets a policy (safe vault + a multi-keeper set) directly or via an **EIP-712 signature a relayer submits**, so onboarding can be **gasless**. The vault is frozen on first config; rotating the keeper set revokes the old keepers; a leaked keeper key can't change the policy. *(Asset/protocol scoping in the policy is roadmap.)*
- ✅ `SafeVault` (owner-only withdrawal) + watcher with **real on-chain threat detection** → exit + evacuate, no human in the loop.
- ✅ **DeFi position auto-exit** — `exitAaveV3` pulls funds *deposited in a protocol* back to the account, then sweeps to your vault (**Harpie's blind spot, covered**). It's **fork-verified against the live Aave V3 Pool on Arbitrum One** (`test/AaveRealFork.t.sol`) and unit-tested against a `MockAavePool`. Not run on Robinhood itself — **Aave V3 isn't deployed there** — but it's the same code path proven against real Aave.
- ✅ **Local firewall** (proactive layer) — outgoing calls routed through `execute()` are scored by a stateless `RulesEngine` and **reverted at the account level** when they grant spending power to an *untrusted* spender: an unlimited `approve`, `increaseAllowance`, EIP-2612 `permit`, or a blanket NFT `setApprovalForAll`. `IRulesEngine` is Stylus-ready. **Honest limits:** it only protects calls *routed through* `execute` (a direct top-level EOA tx bypasses it), and covers those four approval vectors — **not** Permit2, multicall/batched calls, or direct `transfer`/`transferFrom`.
- 🔭 Roadmap: policy asset/protocol scoping · broader rules (Permit2 / multicall / transfer heuristics) · GMX V2 exit · Stylus rules engine.

Run it: see [`docs/superpowers/specs`](docs/superpowers/specs) and `watcher/` (`pnpm onboard` → `pnpm watch`). Tests: `forge test` (contracts) · `pnpm test` (watcher).
