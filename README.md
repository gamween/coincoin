# 🦆 coincoin

> Le pare-feu onchain qui crie « coin coin ! » quand on essaie de te vider — et met tes fonds à l'abri tout seul.

**coincoin** est un pare-feu onchain **self-custodial** pour particuliers, sur **Arbitrum**. Il protège **à la fois tes actifs au repos dans le wallet ET tes fonds déposés dans des protocoles DeFi**, en évacuant / sortant automatiquement tes fonds dès qu'une menace vérifiable est détectée — dans la fenêtre de réaction que laissent les hacks non-atomiques.

Projet pour le **[Arbitrum Open House London](https://arbitrum-london.hackquest.io/)** buildathon (soumission 14 juin 2026).

## Le problème

- **$83,85M volés à 106 106 victimes** en 2025 via wallet drainers / phishing (Scam Sniffer). Les attaquants utilisent même déjà **EIP-7702** pour drainer (90%+ des délégations 7702 sont des sweepers).
- Côté protocoles, les exploits laissent une **fenêtre de réponse non-atomique** (4 min → 5 jours, données Defimon) que personne n'outille côté utilisateur.
- La prévention pré-signature (Blockaid, Revoke.cash…) bloque une mauvaise signature, mais **ne fait rien après compromission ni pour tes positions**.

## L'approche

Là où **Harpie** (fermé en 2025, pour raison business) devait courir un fragile *front-run racing*, coincoin :

- **enforce au niveau du compte** via **EIP-7702** / hooks **ERC-7579** (la primitive 7702 est arrivée *après* Harpie) ;
- **réagit à un flux de menaces live** (Defimon) couplé à un **moteur de règles Stylus** ;
- **couvre les positions DeFi** (auto-exit Aave V3 / GMX) — l'angle mort que Harpie n'a jamais pu adresser ;
- reste **100% non-custodial** : tu gardes tes clés, le keeper ne peut qu'évacuer vers **ton propre** Safe Vault.

On retourne l'arme des attaquants : la même délégation EIP-7702 qu'ils utilisent pour drainer, on l'utilise pour protéger.

## Stack

Solidity + OpenZeppelin · **Stylus** (Rust/WASM) pour le moteur de règles · **ZeroDev** (ERC-4337 / session keys) · EIP-7702 / ERC-7579 · Next.js + wagmi/viem · déploiement **Arbitrum Sepolia** + **Robinhood Chain testnet**.

## Docs

Spec & design complets : [`docs/superpowers/specs/2026-06-10-coincoin-design.md`](docs/superpowers/specs/2026-06-10-coincoin-design.md)

## Statut

🚧 En développement — design validé, implémentation à venir.
