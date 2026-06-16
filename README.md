<div align="center">

<img src="docs/readme/logo.png" alt="coincoin" width="116" />

# coincoin

**An EIP-7702 onchain firewall that detects a live exploit and evacuates your funds — including positions deposited in DeFi — to a vault you control, inside the reaction window non-atomic hacks leave open.**

[![Live demo](https://img.shields.io/badge/live-coincoin--five.vercel.app-000000?style=flat-square)](https://coincoin-five.vercel.app/)
[![Deployed](https://img.shields.io/badge/deployed-Robinhood%20Chain%20testnet%20(46630)-7af7c0?style=flat-square)](#deployed-addresses)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity)](contracts/)
[![Tests](https://img.shields.io/badge/tests-90%20passing-27C93F?style=flat-square)](#testing)
[![License](https://img.shields.io/badge/License-MIT-F5D90A?style=flat-square)](LICENSE)

</div>

> [!WARNING]
> **Experimental, unaudited, testnet only.** This is a research prototype built during a buildathon. Do not use it with funds at risk.

coincoin is a developer-operated guardian for EOAs — a CLI watcher daemon plus a set of EIP-7702 contracts. It targets a specific, technical failure mode: the window during a non-atomic exploit where a wallet is already compromised but the funds are not yet gone, and nothing on the user side acts. It is niche by design.

## Contents

- [The problem](#the-problem)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [What's live vs. roadmap](#whats-live-vs-roadmap)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Deployed addresses](#deployed-addresses)
- [Security & trust model](#security--trust-model)
- [Testing](#testing)
- [Buildathon](#buildathon)
- [License](#license)

## The problem

Wallet security today is almost entirely *pre-signature*: simulate a transaction, flag a bad signature, revoke a stale allowance. None of it helps once a key is compromised, and none of it touches the funds already supplied to a protocol. Two facts define the gap:

- **Drainers went post-signature, and onchain.** In 2025, wallet drainers and phishing took **$83.85M from 106,106 victims** ([Scam Sniffer](https://www.scamsniffer.io/)). Attackers now weaponize **EIP-7702 itself** — 90%+ of onchain 7702 delegations are sweepers that drain on the next inbound transfer.
- **Most protocol exploits are non-atomic.** The interval between the first malicious transaction and the full drain ranges from roughly **4 minutes to 5 days** (Defimon). That interval is a *response window* — and on the user side, nothing reacts inside it.

Pre-signature tools (Blockaid, Revoke.cash) sit at the wrong point in the lifecycle for this. Harpie was the closest prior art — post-compromise protection — but it ran a fragile front-run race against the attacker, never covered deposited positions, and shut down in 2025.

coincoin closes the gap by enforcing at the account level via **EIP-7702** (a primitive that postdates Harpie) and by treating **DeFi positions as first-class**: the assets most protection tools ignore because they aren't sitting in the wallet.

## How it works

Four parts. The product is the watcher daemon and the contracts; there is no required UI.

1. **Delegate (once).** An EOA signs an EIP-7702 authorization pointing at `GuardianModule`, and in the same transaction calls `configure()` to set its policy: a **frozen** safe vault (settable once — a leaked key cannot repoint it) and an authorized **keeper** set. Policies can also be installed from an **EIP-712 signature** a relayer submits (`configureWithSig`), for gasless onboarding.
2. **Watch.** A TypeScript/viem daemon (`ChainThreatSource`) polls `Drained` logs of the monitored protocols directly from chain — no third-party feed, no websocket dependency. It catches up to head in bounded `getLogs` windows.
3. **React.** On a verified threat, the **keeper** — which is cryptographically bounded to two actions and nothing else — calls `exitAaveV3()` to unwind deposited positions back into the account, then `evacuateERC20()` to sweep every token to the safe vault.
4. **Firewall (proactive).** Calls routed through `execute()` are scored by a stateless `RulesEngineV1`; an unlimited `approve` / `increaseAllowance` / EIP-2612 `permit` / blanket `setApprovalForAll` to an untrusted spender reverts at the account level before it lands.

> [!NOTE]
> coincoin is non-custodial by construction. The keeper holds no withdrawal power — it can only move funds *to the vault the owner registered*, and the owner removes the delegation in one transaction (`pnpm revoke`). The keeper never holds the victim's key.

## Architecture

```
   on-chain Drained log
   ─────────────────────────▶  ┌───────────────────────────────┐
                               │  watcher  (ChainThreatSource)  │   TS / viem daemon
                               │  polls getLogs · zero deps     │
                               └───────────────┬───────────────┘
                                               │ threat alert
                                               ▼
   your EOA ──EIP-7702──▶ GuardianModule  ┌───────────────────────────────┐
   (delegate + configure)                 │  keeper  (bounded)             │  can ONLY:
                                          │   1. exitAaveV3()   unwind DeFi │
                                          │   2. evacuateERC20() sweep      │
                                          └───────────────┬───────────────┘
                                                          ▼
                                          ┌───────────────────────────────┐
                                          │  SafeVault  (owner-only)       │
                                          └───────────────────────────────┘

   proactive:  EOA.execute(to, value, data) ─▶ RulesEngineV1.score() ─▶ revert if risk ≥ threshold
```

- **`GuardianModule`** — the EIP-7702 delegate. Holds the policy (frozen vault, keeper set, signed-policy nonce), the sweep/exit logic, and the firewall hook. State lives at each protected EOA, not at the implementation address.
- **`SafeVault`** — owner-only withdrawal destination, deployed per user.
- **`RulesEngineV1`** — stateless risk scorer the firewall calls; designed to be swappable (Stylus is on the roadmap).
- **watcher** — the off-chain operator: detection source, exposure registry, keeper client, and orchestrator, with an end-to-end runner.

## What's live vs. roadmap

Deployed and exercised on **Robinhood Chain testnet (chain 46630)** unless noted.

| Status | Capability |
|---|---|
| ✅ | EIP-7702 delegation + self-config · ERC-20 sweep · approval revocation |
| ✅ | Frozen vault · signed multi-keeper policy (EIP-712 `configureWithSig`) |
| ✅ | Local firewall (`RulesEngineV1`) — unlimited-approval / `permit` / `setApprovalForAll` rules |
| ✅ | Real on-chain detection → rescue loop, run end-to-end (funds at rest **and** a deposited DeFi position rescued in one keeper-driven sequence) |
| ✅ | DeFi-exit engine (`exitAaveV3`) — built and verified against the **live Aave V3 Pool** via an Arbitrum One fork test |
| 🛣️ | **Native Aave V3 integration** — built and ready; goes live the day Aave V3 is deployed on Robinhood Chain. Waiting on availability, not on code. |
| 🛣️ | **GMX V2 position exit** — same pattern, once GMX is available on the target chain |
| 🛣️ | Broader firewall coverage — Permit2, multicall, direct-transfer heuristics |
| 🛣️ | Policy asset/protocol scoping · Stylus rules engine · in-browser 7702 onboarding · security audit |

> [!NOTE]
> Aave V3 and GMX V2 are not deployed on Robinhood Chain testnet, so the live end-to-end run exercises the exit engine against an Aave-V3-shaped lending pool. The exit code itself is verified against the real Aave V3 Pool in the fork test (`AaveRealFork.t.sol`) — it ships against the real protocol the moment one is available on the chain coincoin runs on.

## Tech stack

| Layer | Stack |
|---|---|
| Contracts | Solidity 0.8.24, Foundry, OpenZeppelin, EIP-7702, EIP-712 |
| Watcher | TypeScript, viem, Vitest |
| Chain | Arbitrum Orbit (Robinhood Chain testnet), RPC via Alchemy |
| Frontend | React 19, Vite, Tailwind (landing + `/app` dashboard) |

## Repository structure

```
coincoin/
├── contracts/      Foundry — GuardianModule (EIP-7702), RulesEngineV1, SafeVault, mocks, deploy scripts
├── watcher/        TypeScript/viem detection → rescue daemon (onboard · watch · exploit · revoke)
├── site/           Vite/React/Tailwind landing + /app dashboard
├── deployments/    On-chain address records (robinhood-testnet.json, arbitrum-sepolia.json)
├── docs/           Brand kit, design specs, submission notes
├── video/          Remotion pitch + demo videos (code → MP4)
├── .env.example    Config template (RPC, disposable keys, demo addresses)
└── LICENSE         MIT
```

## Getting started

Reproduce the detection → evacuation loop on Robinhood Chain testnet.

**Prerequisites:** [Foundry](https://getfoundry.sh), Node ≥ 22, [pnpm](https://pnpm.io), a funded testnet wallet.

```bash
git clone --recursive https://github.com/gamween/coincoin.git   # --recursive pulls Foundry deps (submodules)
cd coincoin
cp .env.example .env          # RPC + disposable testnet keys — see .env.example

# contracts: build + test  (already cloned non-recursively? run: git submodule update --init --recursive)
cd contracts && forge test    # set ARBITRUM_ONE_RPC to also run the live-Aave fork test
                              # deployment runbook: watcher/README.md → Deployment

# watcher: the product (run each step in its own terminal)
cd ../watcher && pnpm install
pnpm onboard                  # one-time: EIP-7702 delegation + policy config
pnpm watch                    # the guardian, watching real on-chain logs
pnpm exploit                  # (separate terminal) replay an exploit → real Drained log
                              # → watch detects it and evacuates to the vault
pnpm revoke                   # remove the delegation in one tx
```

> [!WARNING]
> `.env` is gitignored — only `.env.example` ships. Use **disposable testnet keys only**; never commit secrets.

## Deployed addresses

Robinhood Chain testnet (chain `46630`) — [explorer](https://explorer.testnet.chain.robinhood.com/). Full records: [`deployments/robinhood-testnet.json`](deployments/robinhood-testnet.json).

| Contract | Address |
|---|---|
| `GuardianModule` (EIP-7702 guardian) | [`0xd0d301Aeaa7AA5Ced16C927030f131c9Cb083b77`](https://explorer.testnet.chain.robinhood.com/address/0xd0d301Aeaa7AA5Ced16C927030f131c9Cb083b77) |
| `RulesEngineV1` (firewall) | [`0xc20A9d7D38B07a9C74A1fD87A2e25CA1973Cbc52`](https://explorer.testnet.chain.robinhood.com/address/0xc20A9d7D38B07a9C74A1fD87A2e25CA1973Cbc52) |
| `SafeVault` (demo) | [`0x49be3DC48fC0540346A064fCC6Fc94FBaE62f479`](https://explorer.testnet.chain.robinhood.com/address/0x49be3DC48fC0540346A064fCC6Fc94FBaE62f479) |

The `GuardianModule` was also initially deployed and **Arbiscan-verified** on Arbitrum Sepolia at [`0x6671…200F`](https://sepolia.arbiscan.io/address/0x6671b4B73b79c284A710B00ef777d8E65f55200F).

## Security & trust model

Non-custodial by construction, but **experimental and unaudited** — a research prototype on testnet.

**Trust assumptions**

- The owner keeps their key; the guardian is a delegate, not a custodian.
- The safe vault is **frozen** after first config — a leaked key cannot redirect funds elsewhere.
- The keeper is **bounded**: it can only trigger evacuation to the registered vault and revoke approvals. Rotating the keeper set revokes the prior keepers; a leaked keeper key cannot change the policy.
- The delegation is **revocable in one transaction**.

**Known limitations**

- The firewall only protects calls routed through `execute()`, and covers four approval vectors — not Permit2, multicall, or direct transfers (yet — see roadmap).
- Policy asset/protocol scoping is not implemented.
- Native Aave V3 / GMX V2 integration is built and verified but waits on those protocols being deployed on the chain coincoin runs on.

**Responsible disclosure:** report issues privately via [X (@dvb_fianso)](https://x.com/dvb_fianso) or [Telegram](https://t.me/dvb_fianso) before opening a public issue.

## Testing

90 tests, written test-first.

```bash
cd contracts && forge test            # 64 unit/integration tests (+1 fork test, gated on ARBITRUM_ONE_RPC)
ARBITRUM_ONE_RPC=<rpc> forge test     # includes AaveRealFork.t.sol against the live Aave V3 Pool
cd ../watcher && pnpm test            # 25 watcher tests (vitest)
```

`AaveRealFork.t.sol` exits a real position against the **live Aave V3 Pool on Arbitrum One** (forked) — the same code path the guardian runs. The watcher suite covers the alert schema, exposure registry, keeper client, and the end-to-end orchestrator.

## Buildathon

Built for **[Arbitrum Open House London](https://arbitrum-london.hackquest.io/)** — a program by the Arbitrum Foundation. The Online Buildathon ran May 25 – June 14, 2026 (powered by HackQuest); coincoin targets the **Robinhood Chain** track. Sponsor tech used: Robinhood Chain, Alchemy, OpenZeppelin. Build-in-public log: [@dvb_fianso](https://x.com/dvb_fianso).

## License

[MIT](LICENSE) © Sofiane

<div align="center">
<sub><a href="https://coincoin-five.vercel.app/">Live demo</a> · <a href="https://x.com/dvb_fianso">X</a> · <a href="https://t.me/dvb_fianso">Telegram</a></sub>
</div>
