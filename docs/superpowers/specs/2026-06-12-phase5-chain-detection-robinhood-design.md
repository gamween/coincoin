# coincoin — Phase 5 : Détection on-chain réelle + démo sur Robinhood Chain — Design

> Statut : design validé (brainstorming). Prochaine étape : writing-plans.
> Date : 2026-06-12. Track buildathon : **Robinhood Chain** (Arbitrum Open House London).

## Goal

Rendre la boucle de détection **réelle** et la faire tourner sur la chaîne de la track.

Aujourd'hui (Phase 4), `demo.ts` envoie lui-même l'exploit, récupère le reçu, puis **fabrique l'alerte à partir de ce reçu** : la détection est court-circuitée. On veut un **daemon de surveillance** qui observe la chaîne indépendamment, détecte le vrai log d'exploit, et déclenche l'évacuation — le seul acteur simulé étant l'attaquant. Et on cible **Robinhood Chain Testnet** (chain 46630), où tout reste à déployer.

## Contexte & faits établis

- **7702 confirmé sur Robinhood** : chaîne Arbitrum Orbit (`nitro/v3.11.0-rc.4`), **ArbOS 61** (Arb Sepolia est ArbOS 60). EIP-7702 actif depuis ArbOS 40. Base fee ~0,01 gwei → 0,0233 ETH/wallet largement suffisant.
- **Rien n'est déployé sur Robinhood** : l'impl GuardianModule (`0x6671b4B73b79c284A710B00ef777d8E65f55200F`) n'existe que sur Arb Sepolia. Les contrats Solidity ne changent pas — on redéploie tels quels.
- **Wallets** (rôles cohérents avec Arb Sepolia) : deployer `0xdae8992a9b5Fe850bE63781d1c2e65a3e496F728`, victim `0xFD0AFe0E91CBb9EBEB181060441a54E19300Ea89`, keeper `0x627872F35b724222413e7421C9e40A26B2762B9e`. Fundés sur Arb Sepolia, **à funder sur Robinhood** (action utilisateur).
- **Réutilisé tel quel** : `decodeExploitLog`, `exploitEventAbi`/`DrainedLog`, `ThreatSource`/`MockThreatSource`, `findExposed`, `KeeperClient`, `runWatcher`, contrats `MockVulnerableProtocol`/`Attacker`, scripts forge `DeployGuardian`/`SetupDemo`.

## Décisions de design (issues du brainstorming)

1. **Cycle de vie : daemon pur, arrêt manuel.** `ChainThreatSource` surveille en continu et ne se résout jamais en marche normale ; on l'arrête au `SIGINT` (Ctrl-C).
2. **Orchestration : split réaliste multi-terminal.** Points d'entrée séparés : `pnpm watch` (daemon = le produit), `pnpm exploit` (déclenche l'attaque), `pnpm onboard` (délégation 7702 + configure, one-time).
3. **Funding : les 3 rôles sur Robinhood.** deployer déploie, victim = compte protégé, keeper = keeper. **Attaquant = deployer** (et non le keeper) → trace on-chain lisible (attaquant ≠ sauveteur ≠ victime).
4. **Détection : approche B — boucle `getLogs` avec injection de dépendance.** Curseur de bloc explicite, robuste sur tout RPC Orbit, testable unitairement sans chaîne live, cohérent avec le style DI du reste. `decodeExploitLog` se branche tel quel.

## Architecture

### Unité 1 — `config.ts` (étendu, pilotage par env)

But : rendre la chaîne et les adresses configurables, défaut Robinhood, **sans casser l'import** (le smoke test et les tests unitaires importent ce module).

- Conserver les exports statiques actuels : `arbitrumSepolia`, `ROBINHOOD_TESTNET` (désormais **utilisé**), et `GUARDIAN_IMPL` (constante Arb Sepolia, gardée comme fallback + pour le smoke test).
- Ajouter `resolveChainConfig()` : lit l'env et retourne un objet résolu, **appelé par les scripts uniquement** (pas au top-level, donc import sans effet de bord et sans throw) :
  ```ts
  interface ResolvedConfig {
    chain: Chain;               // robinhood (défaut) | arbitrumSepolia, via env CHAIN
    rpcUrl: string;             // ROBINHOOD_TESTNET_RPC | ARBITRUM_SEPOLIA_RPC selon CHAIN
    guardianImpl: `0x${string}`;// env GUARDIAN_IMPL || constante Arb Sepolia
    token: `0x${string}`;       // env DEMO_TOKEN
    proto: `0x${string}`;       // env DEMO_PROTO
    vault: `0x${string}`;       // env DEMO_VAULT
  }
  ```
  `resolveChainConfig()` **throw** si une adresse requise (`DEMO_*`) manque ou si le RPC de la chaîne sélectionnée est absent — erreur claire au lancement des scripts, jamais à l'import.

### Unité 2 — `ChainThreatSource` (dans `sources.ts`)

`implements ThreatSource`. Dépendance injectée via une interface étroite (testabilité, pas de couplage dur à viem) :

```ts
export interface DrainedLogFetcher {
  getDrainedLogs(args: { protocols: `0x${string}`[]; fromBlock: bigint }): Promise<DrainedLog[]>;
  currentBlock(): Promise<bigint>;
}

export interface ChainThreatSourceOpts {
  fetcher: DrainedLogFetcher;
  protocols: `0x${string}`[];
  fromBlock?: bigint;       // défaut : currentBlock() au démarrage
  pollIntervalMs?: number;  // défaut : 4000
  signal?: AbortSignal;     // arrêt du daemon
}

export class ChainThreatSource implements ThreatSource {
  constructor(opts: ChainThreatSourceOpts) {}
  async start(onAlert: AlertHandler): Promise<void> { /* boucle */ }
}
```

Boucle `start` :
1. `cursor = opts.fromBlock ?? await fetcher.currentBlock()`.
2. Tant que non-aborté :
   - `try` : `logs = await fetcher.getDrainedLogs({ protocols, fromBlock: cursor })` ; pour chaque log (ordre bloc croissant) : `await onAlert(decodeExploitLog(log))` ; si `logs.length`, `cursor = max(blockNumber) + 1n`.
   - `catch` : `console.warn` (hoquet RPC), **curseur inchangé**, on retente au prochain tick.
   - `await sleep(pollIntervalMs)` **respectant l'`AbortSignal`** (réveil immédiat si aborté).
3. Se résout uniquement quand l'`AbortSignal` est déclenché (sortie propre).

Sémantique **at-least-once** (curseur = dernier bloc vu + 1) ; un reorg profond pourrait dupliquer/rater — acceptable pour une démo testnet (noté). Les logs sans `blockNumber` (pending) sont ignorés par l'adaptateur. `MockThreatSource` reste inchangé (transport de test / autres usages).

### Unité 3 — `scripts/watch.ts` (`pnpm watch`, le daemon)

- `dotenv`, `resolveChainConfig()`.
- `publicClient` (chaîne active) ; `keeperWallet` (compte `KEEPER_PRIVATE_KEY`).
- Adaptateur `DrainedLogFetcher` au-dessus de `publicClient.getLogs({ address, event: drainedEvent, fromBlock, toBlock: 'latest' })` (event = fragment `Drained` de `exploitEventAbi`) + `publicClient.getBlockNumber()`.
- Registre = le compte protégé : `{ address: VICTIM_ADDRESS, safeVault: vault, watchedProtocols: [proto], tokens: [token] }`.
- **Le daemon ne détient JAMAIS la clé privée de la victime** : il lit `VICTIM_ADDRESS` (env) et signe l'évacuation avec la clé keeper uniquement (propriété de sécurité : `onlySelfOrKeeper` autorise le keeper). Seul `onboard.ts` utilise `VICTIM_PRIVATE_KEY`.
- `keeper = new KeeperClient(keeperWallet)`.
- `AbortController` ; handler `SIGINT` → `abort()` + log de sortie.
- `runWatcher({ source: new ChainThreatSource({ fetcher, protocols: [proto], signal }), accounts: [compte], keeper })`.
- Bannière de démarrage : `👁️  coincoin watch — surveillance de <proto> sur <chain>…`. Les logs « 🦆 COIN COIN ! » / « ✅ évacué » viennent déjà de `runWatcher`.

### Unité 4 — `scripts/exploit.ts` (`pnpm exploit`, seul acteur simulé)

- `attacker = DEPLOYER_PRIVATE_KEY` (≠ keeper).
- Envoie `emergencyWithdraw()` à `proto`, attend le reçu, log `💥 drain` + hash + montant (lecture solde proto avant/après ou event `Drained`).

### Unité 5 — `scripts/onboard.ts` (`pnpm onboard`, one-time)

- `victim = VICTIM_PRIVATE_KEY`.
- `signAuthorization({ contractAddress: guardianImpl, executor: "self" })` + self-send `configure(vault, keeper.address)` avec `authorizationList: [auth]`, attend le reçu. Extrait du `demo.ts` step 1 actuel (avec le fix `executor:"self"` déjà acquis).

### Unité 6 — Déploiement Robinhood (zéro code nouveau)

Réutilise `DeployGuardian` (impl) puis `SetupDemo` (token + proto + vault + mint), lancés avec `--rpc-url $ROBINHOOD_TESTNET_RPC --broadcast`. On reporte les adresses dans `.env` : `GUARDIAN_IMPL`, `DEMO_TOKEN`, `DEMO_PROTO`, `DEMO_VAULT`.

### Unité 7 — `runWatcher` (petit durcissement) + retrait de `demo.ts`

- `runWatcher` : envelopper l'évacuation **par compte** dans un `try/catch` (log de l'échec, on continue) au lieu du fail-fast actuel — une évacuation ratée ne doit pas tuer le daemon (point déjà relevé en revue Phase 4).
- Supprimer `scripts/demo.ts` et le script npm `demo` ; ajouter `watch`/`exploit`/`onboard`. Le fix « attente fixe 4 s » disparaît de fait (le daemon réagit en temps réel).

## Flux de démo (multi-terminal)

1. **Déploiement** (forge, Robinhood) : `DeployGuardian` → `SetupDemo` ; reporter les adresses dans `.env`.
2. `pnpm onboard` — la victime délègue (7702) + `configure(vault, keeper)`. Une fois.
3. **Terminal A** : `pnpm watch` → `👁️ surveillance de PROTO…`.
4. **Terminal B** : `pnpm exploit` → `💥` l'attaquant draine le protocole (vrai log on-chain).
5. **Terminal A** s'allume : `🦆 COIN COIN !` → évacue les fonds **au repos** de la victime vers son SafeVault. `Ctrl-C` pour arrêter.

## Gestion d'erreur

- **`getLogs` échoue** : attrapé, `console.warn`, curseur inchangé, retry au tick suivant (le daemon ne crashe pas, ne saute pas de blocs).
- **`evacuate` throw** : attrapé **par compte** dans `runWatcher`, loggé, le daemon continue.
- **Adresses/RPC manquants** : `resolveChainConfig()` throw au lancement du script avec un message clair (jamais à l'import).
- **Reorg** : at-least-once assumé pour la démo (noté).

## Stratégie de test

- **`ChainThreatSource` (unitaire, sans chaîne live)** : `DrainedLogFetcher` fake. (a) un log `Drained` canned au 1er poll puis vide → `onAlert` appelé une fois avec l'alerte décodée correcte (adresses en minuscules, `block_number` exact) ; (b) `AbortSignal` déclenché → `start()` se résout, plus d'appel. Curseur avancé correctement entre polls.
- **`runWatcher` résilience** : `evacuate` throw sur un compte → l'exception est avalée (loggée), le daemon ne propage pas ; les comptes exposés suivants sont quand même tentés.
- **Non-régression** : `MockThreatSource`, `threat`, `registry`, `keeper`, `smoke` restent verts.
- **Typecheck** : `pnpm exec tsc --noEmit` propre (watch/exploit/onboard inclus).
- **Solidity** : `forge test` 26/26 inchangé (aucun changement de contrat).

## Definition of Done

- [ ] `ChainThreatSource` implémenté + testé ; suite watcher verte (incl. nouveaux tests + résilience `runWatcher`).
- [ ] `pnpm exec tsc --noEmit` propre ; `forge test` 26/26.
- [ ] `config.ts` piloté par env (défaut Robinhood), import sans effet de bord.
- [ ] Scripts `watch`/`exploit`/`onboard` écrits ; `demo.ts` retiré ; `package.json` à jour.
- [ ] `README` mis à jour : déploiement Robinhood + flux multi-terminal.
- [ ] `.env.example` : ajout `CHAIN`, `GUARDIAN_IMPL` (override), rappel `ROBINHOOD_TESTNET_RPC`.
- [ ] Aucun secret commité.

## Prérequis (action utilisateur, hors code)

- Funder **deployer + victim + keeper** sur Robinhood (faucet/bridge).
- Lancer les déploiements forge sur Robinhood et reporter les adresses dans `.env`.
- L'exécution live (`onboard` → `watch` → `exploit`) est faite par l'humain une fois fundé/déployé.

## Hors scope (Phase 5)

- Intégration du vrai flux Defimon (WS) — `decodeExploitLog`/le schéma restent compatibles pour l'ajouter plus tard.
- Multi-comptes / multi-protocoles à grande échelle, persistance du curseur, gestion fine des reorgs.
- Adapters Aave/GMX (positions déposées) — Phase 3 séparée.
