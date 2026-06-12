# coincoin watcher

Service de détection→évacuation. Tests : `pnpm test`.

## Démo end-to-end (Arbitrum Sepolia)

Pré-requis dans `../.env` : `ARBITRUM_SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`,
`VICTIM_PRIVATE_KEY`, `KEEPER_PRIVATE_KEY` (3 wallets de dev jetables financés au faucet),
et `VICTIM_ADDRESS` = adresse dérivée de `VICTIM_PRIVATE_KEY`.

1. Déployer le décor :
   ```bash
   cd ../contracts && set -a && source ../.env && set +a
   forge script script/SetupDemo.s.sol:SetupDemo --rpc-url "$ARBITRUM_SEPOLIA_RPC" --broadcast
   ```
   Reporter les adresses imprimées dans `../.env` : `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`.
2. Lancer la démo :
   ```bash
   cd ../watcher && pnpm demo
   ```
   Sortie attendue : délégation 7702 → exploit → « COIN COIN ! » → fonds au repos = 0, vault crédité.
