# Contributing

Thanks for taking a look. coincoin is an experimental, testnet-only research prototype — contributions, bug reports, and ideas are welcome.

## Layout

| Path | Stack | What |
|---|---|---|
| `contracts/` | Solidity + Foundry | GuardianModule (EIP-7702), RulesEngineV1, SafeVault, mocks |
| `watcher/` | TypeScript + viem | detection → rescue daemon (CLI) |
| `site/` | Vite + React + Tailwind | landing page + `/app` dashboard |
| `video/` | Remotion | pitch + demo videos |

## Setup

Prerequisites: [Foundry](https://getfoundry.sh), Node ≥ 22, [pnpm](https://pnpm.io).

```bash
git clone --recursive https://github.com/gamween/coincoin.git   # Foundry deps are git submodules
cd coincoin
# already cloned without --recursive? run:
git submodule update --init --recursive
```

## Run the checks (do this before opening a PR)

```bash
cd contracts && forge build && forge test          # set ARBITRUM_ONE_RPC to also run the Aave fork test
cd ../watcher && pnpm install && pnpm test
cd ../site    && pnpm install && pnpm build && pnpm lint
```

CI (`.github/workflows/ci.yml`) runs the same matrix on every PR — it must be green to merge.

## Conventions

- **TypeScript** is strict; **Solidity** is `0.8.24`, written test-first with Foundry.
- **English only** in code, comments, and docs.
- **Conventional Commits** for messages (`feat:`, `fix:`, `chore:`, `docs:`, …).
- Keep changes focused; add or update tests for behavior changes.
- Never commit secrets — `.env` is gitignored; use disposable testnet keys only.

## Security

Found a vulnerability? Please follow the private disclosure process in [SECURITY.md](SECURITY.md).
