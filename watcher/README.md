# coincoin watcher

Service de détection→évacuation : un daemon surveille les exploits on-chain (logs
`Drained`) et déclenche l'évacuation des fonds d'un compte protégé (EOA délégué via
EIP-7702) vers son SafeVault.

Tests : `pnpm test`.

## Chaîne cible

`CHAIN` (dans `../.env`) sélectionne la cible : `robinhood` (défaut, chain 46630)
ou `arbitrumSepolia`. Les adresses des contrats déployés sont lues depuis `../.env`
(`GUARDIAN_IMPL`, `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`).

## Déploiement (Robinhood Chain Testnet)

Pré-requis : deployer + victim + keeper fundés en gas Robinhood ; `../.env` rempli
(`ROBINHOOD_TESTNET_RPC`, `DEPLOYER_PRIVATE_KEY`, `VICTIM_PRIVATE_KEY`,
`VICTIM_ADDRESS`, `KEEPER_PRIVATE_KEY`).

```bash
cd ../contracts && set -a && source ../.env && set +a
# 1) impl GuardianModule partagée
forge script script/Deploy.s.sol:DeployGuardian --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast
# 2) décor de démo (token + protocole vulnérable + SafeVault de la victime)
forge script script/SetupDemo.s.sol:SetupDemo --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast
```

Reporter dans `../.env` : `GUARDIAN_IMPL` (impl du step 1), puis `DEMO_TOKEN`,
`DEMO_PROTO`, `DEMO_VAULT` (step 2).

## Démo end-to-end (multi-terminal)

```bash
# Une fois : la victime délègue (7702) + configure son guardian
pnpm onboard

# Terminal A — le daemon de surveillance (le produit)
pnpm watch        # 👁️  surveillance de <PROTO>…

# Terminal B — l'attaquant draine le protocole (seul acteur simulé)
pnpm exploit      # 💥 drain → vrai log Drained on-chain
```

Le Terminal A détecte le log indépendamment, affiche « 🦆 COIN COIN ! » et évacue
les fonds au repos de la victime vers son SafeVault. `Ctrl-C` pour arrêter le daemon.
