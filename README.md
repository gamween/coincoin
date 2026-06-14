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

Solidity + OpenZeppelin + Foundry · EIP-7702 guardian + Aave V3 exit · TypeScript watcher (viem). The **full** EIP-7702 guardian (sweep, frozen vault, signed policy, Aave exit), the `RulesEngine` firewall and the on-chain detection → rescue loop run **live on Robinhood Chain testnet** (Arbitrum Orbit, chain 46630).

## Docs

Original design vision (broader than the shipped scope — see **Status** for what's live): [`docs/superpowers/specs/2026-06-10-coincoin-design.md`](docs/superpowers/specs/2026-06-10-coincoin-design.md)

Brand kit (design system in UI tokens: palette, fonts, components, mascot): [`docs/brand/BRAND.md`](docs/brand/BRAND.md)

## Status

**Built & fully tested — 90 tests** (65 Foundry incl. a real-Aave fork on Arbitrum One, 25 watcher):

- ✅ `GuardianModule` (EIP-7702 delegate) — **frozen vault** (a leaked key can't redirect funds), bounded keeper, ERC-20 sweep + approval revocation.
- ✅ **Signed policy (PreAuthRegistry, folded)** — set a policy (safe vault + multi-keeper set) directly or via an **EIP-712 signature a relayer submits** (gasless onboarding). Vault frozen on first config; rotating the keeper set revokes the old keepers; a leaked keeper key can't change the policy. *(Asset/protocol scoping is roadmap.)*
- ✅ **DeFi position auto-exit** — `exitAaveV3` pulls funds *deposited in a protocol* back to the account, then sweeps to your vault (**Harpie's blind spot, covered**). **Fork-verified against the live Aave V3 Pool on Arbitrum One** (`test/AaveRealFork.t.sol`); unit-tested vs `MockAavePool` (Aave V3 isn't on Robinhood) — same code path, proven on real Aave.
- ✅ **Local firewall** (proactive layer) — calls routed through `execute()` are scored by a stateless `RulesEngine` and **reverted at the account level** for an unlimited `approve` / `increaseAllowance` / EIP-2612 `permit` / blanket `setApprovalForAll` to an *untrusted* spender. Stylus-ready. **Limits:** only protects calls routed through `execute`; covers those four vectors — not Permit2, multicall, or direct transfers.
- ✅ `SafeVault` (owner-only withdrawal) + watcher (**real on-chain detection** → exit → evacuate, receipt-confirmed) + a dashboard dApp (`site` → `/app`).

**Live on Robinhood Chain testnet (chain 46630) right now:** the **full GuardianModule** — EIP-7702 delegation + self-config, ERC-20 sweep, approval revocation, **frozen vault**, **signed multi-keeper policy**, **`exitAaveV3` DeFi exit** and the **local firewall** (`RulesEngineV1`) — is deployed, and the end-to-end **detection → Aave exit → evacuation** loop has been run on-chain: funds at rest *and* a deposited DeFi position rescued to the user's own vault in one keeper-driven sequence (no human in the loop). Addresses in [`deployments/robinhood-testnet.json`](deployments/robinhood-testnet.json) — GuardianModule [`0xd0d3…3b77`](https://explorer.testnet.chain.robinhood.com/address/0xd0d301Aeaa7AA5Ced16C927030f131c9Cb083b77), RulesEngineV1 `0xc20A…bc52`. Aave V3 isn't deployed on this chain, so the live exit runs against a `MockAavePool`; the exit code is additionally **fork-verified against the real Aave V3 Pool on Arbitrum One**.

- 🔭 Roadmap: policy asset/protocol scoping · broader rules (Permit2 / multicall / transfer heuristics) · GMX V2 exit · Stylus rules engine.

Run it: [`watcher/README.md`](watcher/README.md) (`pnpm onboard` → `pnpm watch`). Tests: `forge test` (contracts; set `ARBITRUM_ONE_RPC` to include the live-Aave fork) · `pnpm test` (watcher).
