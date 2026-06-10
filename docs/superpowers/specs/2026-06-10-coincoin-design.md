# coincoin — Design & Spec

- **Date** : 2026-06-10
- **Auteur** : Sofiane (+ Claude)
- **Événement** : Arbitrum Open House London — Buildathon online (soumission **14 juin 2026**), Founder House IRL Londres 10-12 juillet
- **Tracks visés** : Open / General · Sécurité · (bonus) Robinhood Chain
- **Statut** : design validé, spec en cours → plan d'implémentation
- **Repo** : https://github.com/gamween/coincoin

> 🦆 **coincoin** — le pare-feu onchain qui crie « coin coin ! » quand on essaie de te vider, et qui met tes fonds à l'abri tout seul. Le canari dans la mine, version self-custody, sur Arbitrum.

---

## 0. TL;DR

**coincoin** est un pare-feu onchain **self-custodial** pour particuliers, sur Arbitrum. Il protège **à la fois tes actifs au repos dans le wallet ET tes fonds déposés dans des protocoles DeFi**, en **évacuant / sortant automatiquement** tes fonds dès qu'une menace vérifiable est détectée — dans la fenêtre de réaction que laissent les hacks non-atomiques.

La différence clé avec ce qui a existé (Harpie, fermé en 2025) : on **enforce au niveau du compte** via EIP-7702 / hooks ERC-7579 (pas un fragile front-run racing), on **réagit à un flux de menaces live** (Defimon) couplé à un **moteur de règles Stylus**, et on **couvre les positions DeFi** — l'angle mort que Harpie n'a jamais pu adresser.

---

## 1. Le problème (récurrent, sourcé)

Deux familles de pertes, toutes deux **récurrentes et documentées** (web + channels Telegram Defendor/Defimon lus le 10 juin 2026).

### 1.1 Compromission de wallets individuels
- **$83,85M volés à 106 106 victimes** en 2025 par wallet drainers / phishing (Scam Sniffer). En *baisse* de 83% mais loin d'être réglé : perte moyenne **$790/victime**, et les campagnes se multiplient en volume.
- **Permit-based attacks** = 38% des pertes >$1M. **EIP-7702 malveillant** : nouveau vecteur post-Pectra (2 cas en août 2025 = $2,54M ; **>90% des délégations 7702 onchain sont des sweepers**).
- Vus dans Telegram : **297 wallets vidés / $500K** (fuite de clé), **fake Axiom app → 207 users / $147K**, **fake Uniswap Google ad / $400K**.

### 1.2 Fonds déposés dans des protocoles exploités
- **Renegade.fi** ($209K, mai 2026, **Arbitrum + Stylus**, `initialize()` pendant exploitable 354 jours), **StakeDAO** (clé deployer, Arbitrum), **Sharwa.finance** ($33K, Arbitrum, oracle spot sans TWAP). Tous dans Telegram.
- **Insight Defimon** (déterminant) : *« beaucoup de hacks ne sont pas atomiques ; en reconstruisant 10 timelines, les fenêtres entre la 1ʳᵉ tx malveillante et le drain total vont de 4 minutes à 5 jours. »* → **il existe une fenêtre de réponse** que personne n'outille côté utilisateur.

### 1.3 Le constat
Une fois ta clé/approval compromise **ou** un protocole où tu es déposé attaqué, **aucun outil grand public n'agit pour toi automatiquement** dans cette fenêtre. La prévention pré-signature (Blockaid, Kerberus, Revoke.cash) bloque une *mauvaise signature* mais ne fait rien **après** la compromission ni pour tes **positions**.

---

## 2. Pourquoi maintenant (et pourquoi ça n'existe pas)

| Fait | Implication |
|------|-------------|
| **Harpie** (« the on-chain firewall ») faisait l'évacuation auto par front-running, sur Arbitrum, soutenu Coinbase/OpenSea… | …mais a **fermé en mars 2025** pour **raison business** (« could not create a sustainable business model »), **pas** technique. Marché validé, leader parti. |
| **EIP-7702** activé le **7 mai 2025** (Pectra) — *après* la fermeture de Harpie | La primitive qui rend un EOA existant capable d'exécuter du code guardian **n'existait pas** pour Harpie → il était condamné au front-run racing. Nous l'avons. |
| **ERC-7579** (hooks circuit-breaker modulaires) mûri 2024-2026, **Stylus** mainnet depuis sept. 2024, **flux de menaces agent-ready** (Defimon) en 2026 | Aucune de ces briques n'était disponible à l'époque de Harpie. |
| **Aucun produit vivant** ne couvre le scope (Webacy = panic button semi-manuel ; MetaMask Agent Wallet = prévention pré-tx). L'**auto-exit de positions DeFi sur exploit = personne.** | Créneau réellement ouvert. |

**Le retournement narratif** : les attaquants utilisent déjà EIP-7702 pour *drainer* (délégation → sweeper). coincoin utilise **la même primitive en défense** (délégation → guardian). On retourne leur arme.

---

## 3. Vue produit

L'utilisateur connecte son wallet, **délègue son compte** au GuardianDelegate de coincoin (EIP-7702) ou installe les modules (ERC-7579), choisit un **Safe Vault** lui appartenant, sélectionne les **protocoles à surveiller**, règle ses **seuils**, et **pré-autorise** (signature EIP-712) l'ensemble exact des actions d'urgence.

Ensuite, coincoin tourne en arrière-plan :
- **En continu** : un hook au niveau du compte évalue chaque sortie via le moteur de règles Stylus et **bloque** les patterns de drain évidents.
- **Sur menace** : un watcher branché sur le flux Defimon détecte qu'un protocole où l'utilisateur est exposé est attaqué, et exécute l'**exit de position + sweep** pré-autorisé, vers le Safe Vault, dans la fenêtre de réponse.

Tout est **non-custodial** : l'utilisateur garde ses clés, peut révoquer la délégation à tout instant (delegate → `address(0)`), et le keeper ne peut **que** déclencher les actions d'urgence pré-autorisées vers le **vault de l'utilisateur lui-même** — jamais vers une adresse arbitraire.

---

## 4. Features essentielles (scope complet du MVP)

1. **Onboarding & compte protégé**
   - Délégation EIP-7702 vers `GuardianDelegate` (chemin EOA), **ou** installation `GuardianHook` + `GuardianExecutor` (chemin smart account ERC-7579 : Safe/Kernel).
   - Révocation en 1 clic (reset délégation).
2. **Safe Vault** — contrat minimal *owned by user* ; le Guardian peut y **pousser**, seul l'utilisateur peut **retirer**.
3. **PreAuthRegistry** — politique par utilisateur (signature EIP-712) : actifs couverts, vault de destination, protocoles surveillés, seuils, keeper(s) autorisé(s). Borne strictement ce que le keeper peut faire.
4. **Moteur de règles Stylus (RulesEngine)** — évalue à bas coût onchain : score d'anomalie d'une tx sortante (montant vers adresse jamais vue, `approve`/`setApprovalForAll` vers contrat non vérifié, motif de drain) et conditions d'exploit protocole.
5. **Détection à 2 couches**
   - **Locale** : hook ERC-7579 / logique 7702 → **revert** au niveau du compte sur règle déclenchée (marche toujours, zéro dépendance externe).
   - **Externe** : watcher abonné à Defimon `/ws/confirmed_attacks` (filtre `arbitrum`) → déclenche l'évacuation pré-autorisée.
6. **Évacuation des actifs du wallet** — sweep ERC-20 / NFT vers le Safe Vault + **révocation des approvals** dangereuses.
7. **Exit de position DeFi** (l'angle mort de Harpie) — adapters :
   - **Aave V3** (Pool `0x794a61358D6845594F94dc1DB02A252b5b4814aD`) : `withdraw` (le Guardian s'exécutant dans le contexte du compte possède les aTokens).
   - **GMX V2** (ExchangeRouter `0x602b805EedddBbD9ddff44A7dcBD46cb07849685`) : `createOrder` market-decrease (2 étapes ; le keeper finalise).
8. **Angle Robinhood Chain** — protéger des **Stock Tokens** (hTSLA, hAMZN…) : sweep de la balance vers le Safe Vault de l'utilisateur (Chain ID **46630**, RPC `https://rpc.testnet.chain.robinhood.com/rpc`).
9. **Dashboard** — statut de protection, positions surveillées, config des règles, **bouton panique** (déclenchement manuel immédiat), journal d'incidents, retrait du vault.
10. **Recovery** — après incident, retrait du Safe Vault vers un wallet frais.

---

## 5. Architecture & composants

```
┌────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js + wagmi/viem + RainbowKit)                       │
│  Onboarding wizard · Dashboard · Panic button · Incident log · Vault │
└───────────────┬───────────────────────────────┬────────────────────┘
                │                                │
        (lecture état)                   (signe pré-auth EIP-712,
                │                         délégation 7702)
                ▼                                ▼
┌────────────────────────────┐      ┌──────────────────────────────────┐
│  WATCHER (TypeScript)      │      │  CONTRATS (Solidity + OZ)         │
│  - Defimon WS subscriber   │      │  GuardianDelegate (7702 impl)     │
│  - mapping attaque→users   │─────▶│  GuardianHook+Executor (7579)     │
│  - relayer (ZeroDev/4337   │ tx   │  SafeVault (user-owned)           │
│    ou tx 7702 sponsorisée) │      │  PreAuthRegistry (EIP-712)        │
└────────────┬───────────────┘      │  ExitAdapters: Aave V3, GMX V2,   │
             │                      │     ERC20 sweeper, RH Stock       │
       (signal menace)             └───────────────┬──────────────────┘
             │                                     │ appelle (sync, cheap)
             ▼                                     ▼
   ┌─────────────────────┐            ┌──────────────────────────────┐
   │  Defimon WebSocket  │            │  RulesEngine (Stylus / Rust) │
   │  /ws/confirmed_…    │            │  scoring anomalie + règles   │
   └─────────────────────┘            └──────────────────────────────┘
```

**Contrats**
- `GuardianDelegate` — implémentation déléguée via EIP-7702 ; expose les fonctions d'urgence (`evacuate`, `exitPosition`, `revokeApprovals`) appelables uniquement par le keeper pré-autorisé ou l'utilisateur, bornées par `PreAuthRegistry`.
- `GuardianHook` + `GuardianExecutor` — variante ERC-7579 pour smart accounts (hook = blocage sync ; executor = actions d'urgence).
- `SafeVault` — destination des fonds évacués ; `onlyOwner` pour retirer.
- `PreAuthRegistry` — stocke/valide la politique signée (EIP-712) : portée des actions, vault, protocoles, seuils, keepers.
- `ExitAdapter` (interface) + impls `AaveV3ExitAdapter`, `GmxV2ExitAdapter`, `Erc20SweepAdapter`, `RobinhoodStockAdapter`.
- `RulesEngine` (**Stylus/Rust**) — fonction pure-ish de scoring appelée par le hook et par le watcher avant action.

**Off-chain**
- `watcher` (TS) — abonnement Defimon WS, index des positions utilisateurs, déclenchement des tx via relayer.
- `frontend` (Next.js) — onboarding, dashboard, panic button, vault.

---

## 6. Data flow

1. **Onboarding** : connexion → délégation 7702 (ou install modules) → choix Safe Vault → sélection protocoles → réglage seuils → **signature EIP-712** de la politique (PreAuthRegistry).
2. **Opération normale** : chaque tx sortante passe par le hook → `RulesEngine` Stylus la score → drain évident **reverté** au niveau du compte.
3. **Événement** : Defimon émet un `confirmed_attack` sur le protocole P (`network: arbitrum`). Le watcher voit que l'utilisateur a une position dans P → soumet **l'exit pré-autorisé** (`AaveV3`/`GMX`) **+ sweep** des actifs au repos, via le relayer, dans la fenêtre.
4. **Mise à l'abri** : les fonds arrivent dans le **Safe Vault** de l'utilisateur. Notification.
5. **Recovery** : l'utilisateur retire le vault vers un wallet frais.

---

## 7. Stack technique & mapping sponsors

| Brique | Techno | Sponsor servi |
|--------|--------|---------------|
| Compte programmable / délégation | EIP-7702, ERC-7579, ERC-4337, **ZeroDev** (bundler/session keys) | **ZeroDev** |
| Contrats sécurité | Solidity + **OpenZeppelin** (modules, libs) | **OpenZeppelin** |
| Moteur de règles onchain | **Stylus** (Rust/WASM) | **Arbitrum / Stylus** |
| Protection RWA | **Robinhood Chain** testnet (Stock Tokens) | **Robinhood Chain** |
| Protection épargnant (thèse) | — | **CFIT** (Centre for Finance, Innovation & Tech) |
| Flux de menaces | Defimon WS (ou mock conforme) | — |
| Front | Next.js, wagmi, viem, RainbowKit | — |
| Déploiement | **Arbitrum Sepolia** (éligibilité) + **Robinhood Chain testnet** | — |
| Infra RPC | **Alchemy** (recommandé par RH Chain) | **Alchemy** |

---

## 8. Sécurité & trust model

- **Non-custodial** : l'utilisateur garde ses clés. La délégation 7702 est **révocable à tout instant** (`delegate → address(0)`), et n'importe qui peut broadcaster la révocation signée (gas sponsorisé).
- **Keeper borné** : le keeper ne peut **que** déclencher les actions pré-autorisées **vers le vault de l'utilisateur lui-même** / sortir **ses** positions. Il **ne peut pas** envoyer de fonds à une adresse arbitraire. **Pire cas si keeper malveillant/compromis** : une évacuation injustifiée (désagrément, pas un vol) — les fonds vont au vault de l'utilisateur.
- **Vault figé** : la destination est fixée à la signature de la politique, et le vault est `onlyOwner`.
- **Guardian minimal & audité** : conformément aux best-practices 7702 (Fireblocks/Halborn), la surface du contrat délégué est minimale et auditée — c'est précisément le « contrat 7702 battle-tested » qui manque aujourd'hui.
- **Garde-fous** : cooldown anti-déclenchement abusif, seuils configurables, double confirmation pour les actions destructrices côté UI.

---

## 9. La démo (théâtrale, ce qui gagne)

Deux wallets côte à côte, **un protégé par coincoin, un non**.
1. **Local rule** : un drainer pousse un `setApprovalForAll` vers un contrat non vérifié → le hook **revert** au niveau du compte (le wallet non protégé, lui, signe et se fait vider).
2. **Position exploit** : on déploie sur **Arbitrum Sepolia** un protocole mock vulnérable + un attaquant ; l'utilisateur y a déposé $Y et a $X au repos. L'attaque part → signal `confirmed_attack` → coincoin **sort la position Aave/mock + sweep** vers le Safe Vault **avant** que le drain n'atteigne l'utilisateur. Le wallet non protégé est vidé.
3. **Robinhood angle** : sur Robinhood testnet, des **hTSLA** menacés sont mis à l'abri dans le vault.
4. **Recovery** : retrait du vault vers un wallet frais.

Métrique d'accroche : *« fonds sauvés vs perdus »*, chrono de la fenêtre de réponse à l'écran.

---

## 10. Direction artistique

**Concept** : le **canari dans la mine** rencontre le **canard qui fait coin-coin**. coincoin est ton alarme vivante : il *couine* (« coin coin ! ») au premier signe de danger et te tire en sécurité. La métaphore sécurité (early-warning) et le nom (onomatopée du canard) fusionnent parfaitement.

- **Mascotte** : un canard-canari cartoon, expressif, décliné en 3 états :
  - **Calme** (veille) — assis tranquille, œil mi-clos.
  - **Alerte** (menace détectée) — bec grand ouvert « COIN COIN ! », plumes hérissées, point d'exclamation rouge.
  - **Héros** (fonds sauvés) — tient une **bouée de sauvetage** / un petit coffre, pouce levé.
- **Palette** :
  - **Jaune canari `#F5D90A`** (primaire — attention/alarme),
  - **Bleu nuit `#0B1B3A`** (fond — cohérent Arbitrum + l'esthétique brick/arcade du buildathon),
  - **Rouge alarme `#FF3B3B`** (états de menace),
  - **Vert safe `#27C93F`** (état « évacué / à l'abri »).
- **Style** : flat illustration audacieuse + clin d'œil **pixel-art rétro-arcade** (la page sponsors du buildathon est en briques façon Mario) — chaleureux mais vigilant : la sécurité qui ne fait pas peur, ce qui sert le positionnement B2C « rendre la self-custody sûre pour tout le monde ».
- **Logo** : silhouette de canard dans un **bouclier**, ou tête de canard stylisée en **cloche d'alarme**.
- **Ton & voix** : amical, un peu malicieux, jamais anxiogène. Micro-copy qui assume le canard (« coincoin veille », « COIN COIN ! on évacue », « tes fonds sont au sec 🦆»).

---

## 11. Hors-scope (YAGNI pour le MVP)

- Pas « tout DeFi » : **2 adapters réels** (Aave V3, GMX V2) + 1 mock + sweep générique + Stock Tokens. Architecture d'adapter extensible, le reste en roadmap.
- **Pas de front-running** de l'attaquant (modèle fragile de Harpie ; le séquenceur Arbitrum le rend peu fiable). On enforce au niveau du compte + on réagit dans la fenêtre non-atomique.
- Pas de détection ML maison : on consomme Defimon (ou mock) + règles déterministes Stylus.
- Pas de multi-keeper décentralisé pour le MVP (1 keeper borné + révocation utilisateur) — décentralisation du watcher = roadmap.

---

## 12. Risques & fallbacks

| Risque | Mitigation / Fallback |
|--------|----------------------|
| Accès Defimon WS indisponible | **Mock** émettant le même schéma (`/ws/confirmed_attacks`) + les règles Stylus locales (toujours fonctionnelles, zéro dépendance). Honnête & documenté. |
| EIP-7702 pas/mal supporté sur Arbitrum Sepolia / RH testnet | Chemin **ERC-7579** (Safe/Kernel) en alternative ; démo sur la chaîne qui supporte le mieux. |
| GMX V2 exécution 2-étapes lente en démo | Démontrer d'abord Aave (1 tx) ; GMX en second / sur enregistrement. |
| Stock Tokens rebasing (multiplier) cassent le sweep | Le sweep déplace la **balance courante** vers le vault de l'utilisateur (même actif, même propriétaire) → pas d'hypothèse sur le multiplier. |
| Scope trop large en solo / 5 jours | Ordre de priorité : (1) Guardian + SafeVault + sweep + local rules, (2) Aave exit + watcher Defimon, (3) GMX, (4) Robinhood, (5) polish démo. |

---

## 13. Déploiement & adresses de référence

- **Arbitrum Sepolia** (déploiement principal, éligibilité buildathon).
- **Robinhood Chain testnet** — Chain ID **46630**, RPC `https://rpc.testnet.chain.robinhood.com/rpc`, faucet `https://faucet.testnet.chain.robinhood.com/add-chain` (0,05 ETH + 5 de chaque Stock Token / 24h). Orbit L2, infra **Alchemy**.
- Adresses mainnet de référence (pour les adapters) : Aave V3 Pool `0x794a61358D6845594F94dc1DB02A252b5b4814aD`, GMX V2 ExchangeRouter `0x602b805EedddBbD9ddff44A7dcBD46cb07849685`.

---

## 14. Ce dont j'ai (potentiellement) besoin de ta part

- **Defimon WS** : une **API key** (`@DecurityHQ`) pour brancher le vrai flux. Sinon je code le mock conforme — dis-moi si tu veux que je tente d'obtenir l'accès ou qu'on parte direct sur le mock.
- **ZeroDev** : un projet / API key (bundler + paymaster) pour les tx sponsorisées et session keys.
- **Alchemy** : une app sur Arbitrum Sepolia + Robinhood testnet (RPC).
- **Comptes faucet** : Arbitrum Sepolia ETH + Robinhood testnet (Stock Tokens).
- Confirmer si tu veux **EIP-7702** comme chemin principal (le plus « 2026 ») ou **ERC-7579/Safe** (plus de tooling éprouvé).

---

## 15. Questions ouvertes

- Defimon couvre `arbitrum` ; couvre-t-il **Robinhood Chain** ? Sinon, sur RH on s'appuie sur les règles locales Stylus uniquement.
- Périmètre exact des « approvals dangereuses » à révoquer auto (toutes vs liste).
- Nom du token/marque secondaire pour le vault (« coincoin Nest » ? à décider en DA).
