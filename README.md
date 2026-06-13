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

- **enforces at the account level** via **EIP-7702** / **ERC-7579** hooks (the 7702 primitive arrived *after* Harpie);
- **reacts to a live threat feed** (Defimon) coupled with a **Stylus rules engine**;
- **covers DeFi positions** (auto-exit Aave V3 / GMX) — the blind spot Harpie could never address;
- stays **100% non-custodial**: you keep your keys, the keeper can only evacuate to **your own** Safe Vault.

We turn the attackers' weapon against them: the same EIP-7702 delegation they use to drain, we use to protect.

## Stack

Solidity + OpenZeppelin · **Stylus** (Rust/WASM) for the rules engine · **ZeroDev** (ERC-4337 / session keys) · EIP-7702 / ERC-7579 · Next.js + wagmi/viem · deployed on **Arbitrum Sepolia** + **Robinhood Chain testnet**.

## Docs

Full spec & design: [`docs/superpowers/specs/2026-06-10-coincoin-design.md`](docs/superpowers/specs/2026-06-10-coincoin-design.md)

Brand kit (design system in UI tokens: palette, fonts, components, mascot): [`docs/brand/BRAND.md`](docs/brand/BRAND.md)

## Status

**Live, end-to-end** on Arbitrum Sepolia + Robinhood Chain testnet:

- ✅ `GuardianModule` (EIP-7702 delegate) — bounded keeper, **frozen vault** (a leaked key can't redirect funds), ERC-20 sweep + approval revocation.
- ✅ **DeFi position auto-exit (Aave V3)** — `exitAaveV3` pulls funds *deposited in a protocol* back to the account, then sweeps to your vault. **Harpie's blind spot, covered.**
- ✅ `SafeVault` (owner-only withdrawal) + watcher with **real on-chain threat detection** → exit + evacuate, no human in the loop.
- 🔭 Roadmap: signed `PreAuthRegistry` policy · local `RulesEngine` (Solidity now, Stylus-ready) · GMX V2 exit.

Run it: see [`docs/superpowers/specs`](docs/superpowers/specs) and `watcher/` (`pnpm onboard` → `pnpm watch`). Tests: `forge test` (contracts) · `pnpm test` (watcher).
