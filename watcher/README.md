# coincoin watcher

Detection→evacuation service: a daemon watches for on-chain exploits (`Drained`
logs) and triggers the evacuation of a protected account's funds (EOA delegated via
EIP-7702) to its SafeVault.

Tests: `pnpm test`.

## Target chain

`CHAIN` (in `../.env`) selects the target: `robinhood` (default, chain 46630)
or `arbitrumSepolia`. The addresses of the deployed contracts are read from `../.env`
(`GUARDIAN_IMPL`, `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`).

## Deployment (Robinhood Chain Testnet)

Prerequisites: deployer + victim + keeper funded with Robinhood gas; `../.env` filled in
(`ROBINHOOD_TESTNET_RPC`, `DEPLOYER_PRIVATE_KEY`, `VICTIM_PRIVATE_KEY`,
`VICTIM_ADDRESS`, `KEEPER_PRIVATE_KEY`).

```bash
# `unset CHAIN`: foundry auto-loads ../.env and reads CHAIN=robinhood as its --chain flag
# (→ "invalid value 'robinhood'"). Run forge/cast from contracts/ with CHAIN unset.
cd ../contracts && set -a && source ../.env && set +a && unset CHAIN
# 1) shared GuardianModule impl
forge script script/Deploy.s.sol:DeployGuardian --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --skip-simulation
# 2) demo setup (token + vulnerable protocol + victim's SafeVault + MockAavePool position)
forge script script/SetupDemo.s.sol:SetupDemo --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --skip-simulation
# 3) local-firewall scorer (lights up the dashboard's firewall controls)
forge script script/DeployRules.s.sol:DeployRules --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --skip-simulation
```

Record in `../.env`: `GUARDIAN_IMPL` (step 1), then `DEMO_TOKEN`, `DEMO_PROTO`,
`DEMO_VAULT`, `DEMO_AAVE_POOL` (step 2), and `RULES_ENGINE` (step 3). With `DEMO_AAVE_POOL`
set, the watcher exits the victim's deposited Aave position before sweeping. To enable the
firewall from the dashboard, set `VITE_RULES_ENGINE` in `site/.env` to the RulesEngineV1
address (step 3) and update `site/src/app/contracts.ts` (`guardianImpl` + `token`), then
`pnpm build` the site — the "Enable firewall" button calls `setRules`.

> ⚠️ **Re-onboarding onto a new build needs a fresh victim.** EIP-7702 storage persists across
> re-delegation, so an EOA already onboarded to an older GuardianModule keeps its `safeVault`,
> and the new build's frozen-vault guard then reverts `configure` with `VaultLocked`. Onboard a
> never-delegated EOA (`cast wallet new`, fund it, re-run `SetupDemo` for it).

## End-to-end demo (multi-terminal)

```bash
# Once: the victim delegates (7702) + configures their guardian
pnpm onboard

# Terminal A — the watcher daemon (the product)
pnpm watch        # 👁️  watching <PROTO>…

# Terminal B — the attacker drains the protocol (the only simulated actor)
pnpm exploit      # 💥 drain → real Drained log on-chain
```

Terminal A detects the log independently, prints "🦆 COIN COIN !" and evacuates
the victim's idle funds to their SafeVault. `Ctrl-C` to stop the daemon.
