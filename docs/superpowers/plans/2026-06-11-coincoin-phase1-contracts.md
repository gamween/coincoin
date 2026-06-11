# coincoin — Phase 1 : Fondation contrats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire le cœur on-chain de coincoin : un `GuardianModule` qui, exécuté dans le contexte d'un compte (via EIP-7702 ou self-call), peut — sur déclenchement par le compte lui-même ou un keeper borné — évacuer ses ERC-20 et révoquer ses approvals vers un `SafeVault` que seul le propriétaire contrôle.

**Architecture:** Projet Foundry (Solidity + OpenZeppelin) à la racine sous `contracts/`. Deux contrats : `SafeVault` (coffre `Ownable`, push-in / owner-only-out) et `GuardianModule` (logique déléguée 7702 : `configure` réservé au compte lui-même, `evacuateERC20` / `revokeApprovals` réservés au compte ou au keeper). Tests TDD avec `forge test`, dont un test d'intégration EIP-7702 via les cheatcodes Foundry. Déploiement sur Arbitrum Sepolia via `forge script`.

**Tech Stack:** Foundry (forge 1.4.2), Solidity ^0.8.24, OpenZeppelin Contracts, EIP-7702, Arbitrum Sepolia (chain 421614).

---

## Découpage en phases (vue d'ensemble)

Ce plan = **Phase 1** uniquement. Chaque phase produit un livrable testable autonome. Les phases 2-5 auront leur propre plan (à étoffer le moment venu) :

- **Phase 1 (ce plan)** — Fondation contrats : `SafeVault` + `GuardianModule` (configure / evacuate / revoke) + intégration 7702 + déploiement. *Livrable : un compte délégué peut s'auto-évacuer vers son vault, déclenché par lui-même ou un keeper borné.*
- **Phase 2** — Moteur de règles Stylus (Rust) + hook ERC-7579 : blocage local automatique des tx de drain. *Livrable : une tx malveillante est revertée au niveau du compte.*
- **Phase 3** — Exit adapters : `AaveV3ExitAdapter` + `GmxV2ExitAdapter` (réels sur Arbitrum Sepolia). *Livrable : sortie automatique d'une position Aave/GMX.*
- **Phase 4** — Watcher TypeScript : émetteur de menaces au schéma Defimon (piloté par un vrai exploit rejoué sur testnet) → déclenche l'évacuation pré-autorisée via relayer ZeroDev. *Livrable : un exploit on-chain déclenche une évacuation de bout en bout.*
- **Phase 5** — Dashboard Next.js : onboarding (délégation 7702), statut, bouton panique, journal, retrait du vault. *Livrable : le produit utilisable end-to-end + démo.*

---

## Structure de fichiers (Phase 1)

```
contracts/
├── foundry.toml                  # config Foundry + remappings + profil arbitrum_sepolia
├── remappings.txt                # @openzeppelin/ → lib/openzeppelin-contracts/
├── src/
│   ├── SafeVault.sol             # coffre Ownable : reçoit des fonds, seul l'owner retire
│   └── GuardianModule.sol        # logique guardian déléguée (7702) : configure/evacuate/revoke
├── test/
│   ├── mocks/MockERC20.sol       # ERC20 de test avec mint public
│   ├── SafeVault.t.sol           # tests du coffre
│   ├── GuardianModule.t.sol      # tests configure/evacuate/revoke + access control
│   └── Guardian7702.t.sol        # test d'intégration délégation EIP-7702
└── script/
    └── Deploy.s.sol              # script de déploiement Arbitrum Sepolia
```

---

### Task 1 : Scaffolder le projet Foundry

**Files:**
- Create: `contracts/foundry.toml`
- Create: `contracts/remappings.txt`
- Create: `contracts/.gitignore`

- [ ] **Step 1 : Initialiser Foundry dans `contracts/`**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin
forge init contracts --no-git --no-commit
rm -f contracts/src/Counter.sol contracts/test/Counter.t.sol contracts/script/Counter.s.sol
```
Expected: arborescence `contracts/{src,test,script,lib}` créée, `lib/forge-std` présent.

- [ ] **Step 2 : Installer OpenZeppelin Contracts**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts
forge install OpenZeppelin/openzeppelin-contracts --no-git --no-commit
```
Expected: `lib/openzeppelin-contracts/` présent.

- [ ] **Step 3 : Écrire `contracts/foundry.toml`**

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 200
evm_version = "cancun"
fs_permissions = [{ access = "read", path = "./"}]

[rpc_endpoints]
arbitrum_sepolia = "${ARBITRUM_SEPOLIA_RPC}"
robinhood_testnet = "${ROBINHOOD_TESTNET_RPC}"
```

- [ ] **Step 4 : Écrire `contracts/remappings.txt`**

```text
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

- [ ] **Step 5 : Écrire `contracts/.gitignore`**

```text
out/
cache/
broadcast/
```

- [ ] **Step 6 : Vérifier que la compilation passe à vide**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build
```
Expected: `Compiler run successful` (aucun contrat applicatif encore, mais lib OZ compile).

- [ ] **Step 7 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/foundry.toml contracts/remappings.txt contracts/.gitignore contracts/lib contracts/src contracts/test contracts/script 2>/dev/null
git add contracts
git commit -m "chore(contracts): scaffold Foundry + OpenZeppelin"
```

---

### Task 2 : `MockERC20` (helper de test)

**Files:**
- Create: `contracts/test/mocks/MockERC20.sol`

- [ ] **Step 1 : Écrire le mock ERC20 avec mint public**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build
```
Expected: `Compiler run successful`.

- [ ] **Step 3 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/test/mocks/MockERC20.sol
git commit -m "test(contracts): add MockERC20 helper"
```

---

### Task 3 : `SafeVault` — coffre push-in / owner-only-out

**Files:**
- Create: `contracts/src/SafeVault.sol`
- Test: `contracts/test/SafeVault.t.sol`

- [ ] **Step 1 : Écrire le test qui échoue**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SafeVault} from "../src/SafeVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SafeVaultTest is Test {
    SafeVault vault;
    MockERC20 token;
    address owner = address(0xA11CE);
    address attacker = address(0xBAD);

    function setUp() public {
        vault = new SafeVault(owner);
        token = new MockERC20("Test", "TST");
        token.mint(address(vault), 1_000e18);
    }

    function test_OwnerCanWithdraw() public {
        vm.prank(owner);
        vault.withdrawERC20(IERC20(address(token)), owner, 400e18);
        assertEq(token.balanceOf(owner), 400e18);
        assertEq(token.balanceOf(address(vault)), 600e18);
    }

    function test_NonOwnerCannotWithdraw() public {
        vm.prank(attacker);
        vm.expectRevert();
        vault.withdrawERC20(IERC20(address(token)), attacker, 1e18);
    }

    function test_ReceivesEth() public {
        vm.deal(address(this), 1 ether);
        (bool ok,) = address(vault).call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(address(vault).balance, 1 ether);
    }
}
```

- [ ] **Step 2 : Lancer le test pour confirmer qu'il échoue**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract SafeVaultTest -vv
```
Expected: FAIL — `SafeVault` introuvable (le fichier source n'existe pas).

- [ ] **Step 3 : Écrire l'implémentation minimale**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SafeVault
/// @notice Coffre détenu par l'utilisateur. Le GuardianModule ne peut qu'y POUSSER
///         des fonds (transferts entrants standards) ; seul l'owner peut en RETIRER.
contract SafeVault is Ownable {
    using SafeERC20 for IERC20;

    constructor(address owner_) Ownable(owner_) {}

    function withdrawERC20(IERC20 token, address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }

    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        (bool ok,) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    receive() external payable {}
}
```

- [ ] **Step 4 : Lancer le test pour confirmer qu'il passe**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract SafeVaultTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/SafeVault.sol contracts/test/SafeVault.t.sol
git commit -m "feat(contracts): SafeVault (push-in, owner-only-out)"
```

---

### Task 4 : `GuardianModule.configure` — réservé au compte lui-même

**Files:**
- Create: `contracts/src/GuardianModule.sol`
- Test: `contracts/test/GuardianModule.t.sol`

- [ ] **Step 1 : Écrire le test qui échoue**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";

contract GuardianModuleConfigureTest is Test {
    GuardianModule guardian;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);
    address attacker = address(0xBAD);

    function setUp() public {
        guardian = new GuardianModule();
    }

    function test_SelfCanConfigure() public {
        // En 7702, le compte exécute son propre code : msg.sender == address(this).
        vm.prank(address(guardian));
        guardian.configure(vault, keeper);
        assertEq(guardian.safeVault(), vault);
        assertEq(guardian.keeper(), keeper);
        assertTrue(guardian.configured());
    }

    function test_NonSelfCannotConfigure() public {
        vm.prank(attacker);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.configure(vault, keeper);
    }

    function test_ConfigureRejectsZeroAddresses() public {
        vm.prank(address(guardian));
        vm.expectRevert(GuardianModule.ZeroAddress.selector);
        guardian.configure(address(0), keeper);
    }
}
```

- [ ] **Step 2 : Lancer le test pour confirmer qu'il échoue**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleConfigureTest -vv
```
Expected: FAIL — `GuardianModule` introuvable.

- [ ] **Step 3 : Écrire l'implémentation minimale**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title GuardianModule
/// @notice Logique guardian déléguée à un compte via EIP-7702. Exécutée dans le
///         contexte du compte : `address(this)` == le compte protégé, qui détient
///         les fonds. La configuration est réservée au compte lui-même ; les actions
///         d'urgence sont ouvertes au compte ou au keeper borné. Les fonds ne partent
///         QUE vers le `safeVault` enregistré.
contract GuardianModule {
    using SafeERC20 for IERC20;

    address public safeVault;
    address public keeper;
    bool public configured;

    event Configured(address indexed safeVault, address indexed keeper);

    error NotAuthorized();
    error ZeroAddress();

    /// @dev Seul le compte lui-même (self-call, y compris via une UserOp 7702) peut configurer.
    modifier onlySelf() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }

    function configure(address safeVault_, address keeper_) external onlySelf {
        if (safeVault_ == address(0) || keeper_ == address(0)) revert ZeroAddress();
        safeVault = safeVault_;
        keeper = keeper_;
        configured = true;
        emit Configured(safeVault_, keeper_);
    }
}
```

- [ ] **Step 4 : Lancer le test pour confirmer qu'il passe**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleConfigureTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/GuardianModule.sol contracts/test/GuardianModule.t.sol
git commit -m "feat(contracts): GuardianModule.configure (self-only)"
```

---

### Task 5 : `GuardianModule.evacuateERC20` — sweep vers le vault

**Files:**
- Modify: `contracts/src/GuardianModule.sol`
- Modify: `contracts/test/GuardianModule.t.sol`

- [ ] **Step 1 : Ajouter le test qui échoue**

Ajouter ce contrat de test à la fin de `contracts/test/GuardianModule.t.sol` :

```solidity
contract GuardianModuleEvacuateTest is Test {
    GuardianModule guardian;
    MockERC20 tokenA;
    MockERC20 tokenB;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);
    address attacker = address(0xBAD);

    function setUp() public {
        guardian = new GuardianModule();
        tokenA = new MockERC20("A", "A");
        tokenB = new MockERC20("B", "B");
        // Le compte (== address(guardian) en 7702) détient les fonds.
        tokenA.mint(address(guardian), 100e18);
        tokenB.mint(address(guardian), 50e18);
        vm.prank(address(guardian));
        guardian.configure(vault, keeper);
    }

    function test_KeeperCanEvacuateAllTokens() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(tokenA);
        tokens[1] = address(tokenB);

        vm.prank(keeper);
        guardian.evacuateERC20(tokens);

        assertEq(tokenA.balanceOf(vault), 100e18);
        assertEq(tokenB.balanceOf(vault), 50e18);
        assertEq(tokenA.balanceOf(address(guardian)), 0);
    }

    function test_SelfCanEvacuate() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(tokenA);
        vm.prank(address(guardian));
        guardian.evacuateERC20(tokens);
        assertEq(tokenA.balanceOf(vault), 100e18);
    }

    function test_AttackerCannotEvacuate() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(tokenA);
        vm.prank(attacker);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.evacuateERC20(tokens);
    }
}
```

Et ajouter l'import du mock en haut du fichier (sous l'import de `GuardianModule`) :

```solidity
import {MockERC20} from "./mocks/MockERC20.sol";
```

- [ ] **Step 2 : Lancer le test pour confirmer qu'il échoue**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleEvacuateTest -vv
```
Expected: FAIL — `evacuateERC20` n'existe pas (`Member "evacuateERC20" not found`).

- [ ] **Step 3 : Implémenter `evacuateERC20`**

Ajouter dans `contracts/src/GuardianModule.sol` : (a) le modifier `onlySelfOrKeeper`, (b) l'erreur `NotConfigured`, (c) l'event `Evacuated`, (d) la fonction. Insérer après la fonction `configure` :

```solidity
    event Evacuated(address indexed token, uint256 amount);

    error NotConfigured();

    modifier onlySelfOrKeeper() {
        if (msg.sender != address(this) && msg.sender != keeper) revert NotAuthorized();
        _;
    }

    /// @notice Balaie la totalité du solde de chaque token vers le safeVault.
    function evacuateERC20(address[] calldata tokens) external onlySelfOrKeeper {
        if (!configured) revert NotConfigured();
        for (uint256 i; i < tokens.length; ++i) {
            uint256 bal = IERC20(tokens[i]).balanceOf(address(this));
            if (bal > 0) {
                IERC20(tokens[i]).safeTransfer(safeVault, bal);
                emit Evacuated(tokens[i], bal);
            }
        }
    }
```

- [ ] **Step 4 : Lancer le test pour confirmer qu'il passe**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleEvacuateTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/GuardianModule.sol contracts/test/GuardianModule.t.sol
git commit -m "feat(contracts): GuardianModule.evacuateERC20 (sweep to vault, self/keeper)"
```

---

### Task 6 : `GuardianModule.revokeApprovals` — couper les allowances dangereuses

**Files:**
- Modify: `contracts/src/GuardianModule.sol`
- Modify: `contracts/test/GuardianModule.t.sol`

- [ ] **Step 1 : Ajouter le test qui échoue**

Ajouter ce contrat de test à la fin de `contracts/test/GuardianModule.t.sol` :

```solidity
contract GuardianModuleRevokeTest is Test {
    GuardianModule guardian;
    MockERC20 token;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);
    address spender = address(0x5DEADE);
    address attacker = address(0xBAD);

    function setUp() public {
        guardian = new GuardianModule();
        token = new MockERC20("A", "A");
        // Le compte a une allowance dangereuse encore active.
        vm.prank(address(guardian));
        token.approve(spender, type(uint256).max);
        vm.prank(address(guardian));
        guardian.configure(vault, keeper);
    }

    function test_KeeperCanRevokeApproval() public {
        assertEq(token.allowance(address(guardian), spender), type(uint256).max);

        address[] memory tokens = new address[](1);
        address[] memory spenders = new address[](1);
        tokens[0] = address(token);
        spenders[0] = spender;

        vm.prank(keeper);
        guardian.revokeApprovals(tokens, spenders);

        assertEq(token.allowance(address(guardian), spender), 0);
    }

    function test_AttackerCannotRevoke() public {
        address[] memory tokens = new address[](1);
        address[] memory spenders = new address[](1);
        tokens[0] = address(token);
        spenders[0] = spender;
        vm.prank(attacker);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.revokeApprovals(tokens, spenders);
    }

    function test_RevokeRejectsLengthMismatch() public {
        address[] memory tokens = new address[](2);
        address[] memory spenders = new address[](1);
        vm.prank(keeper);
        vm.expectRevert(GuardianModule.LengthMismatch.selector);
        guardian.revokeApprovals(tokens, spenders);
    }
}
```

- [ ] **Step 2 : Lancer le test pour confirmer qu'il échoue**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleRevokeTest -vv
```
Expected: FAIL — `revokeApprovals` / `LengthMismatch` n'existent pas.

- [ ] **Step 3 : Implémenter `revokeApprovals`**

Ajouter dans `contracts/src/GuardianModule.sol` : (a) l'erreur `LengthMismatch`, (b) l'event `ApprovalRevoked`, (c) la fonction. Insérer après `evacuateERC20` :

```solidity
    event ApprovalRevoked(address indexed token, address indexed spender);

    error LengthMismatch();

    /// @notice Remet à zéro les allowances passées (utilise forceApprove pour les
    ///         tokens non standard type USDT).
    function revokeApprovals(address[] calldata tokens, address[] calldata spenders)
        external
        onlySelfOrKeeper
    {
        if (tokens.length != spenders.length) revert LengthMismatch();
        for (uint256 i; i < tokens.length; ++i) {
            IERC20(tokens[i]).forceApprove(spenders[i], 0);
            emit ApprovalRevoked(tokens[i], spenders[i]);
        }
    }
```

- [ ] **Step 4 : Lancer le test pour confirmer qu'il passe**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleRevokeTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5 : Lancer toute la suite**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test -vv
```
Expected: PASS — tous les tests (SafeVault + Guardian configure/evacuate/revoke).

- [ ] **Step 6 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/GuardianModule.sol contracts/test/GuardianModule.t.sol
git commit -m "feat(contracts): GuardianModule.revokeApprovals (self/keeper)"
```

---

### Task 7 : Test d'intégration EIP-7702 (cheatcode Foundry)

**But :** prouver que, délégué à un EOA réel via 7702, le `GuardianModule` s'exécute dans le contexte de cet EOA et peut l'évacuer. Utilise `vm.signAndAttachDelegation` (Foundry).

**Files:**
- Create: `contracts/test/Guardian7702.t.sol`

- [ ] **Step 1 : Écrire le test d'intégration qui échoue**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @notice Vérifie le flux EIP-7702 : un EOA délègue son code au GuardianModule,
///         puis le keeper déclenche l'évacuation de l'EOA vers le vault.
contract Guardian7702Test is Test {
    GuardianModule impl; // implémentation déléguée (code partagé)
    MockERC20 token;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);

    // EOA utilisateur avec clé connue (pour signer la délégation 7702).
    uint256 userPk = 0xA11CE;
    address user;

    function setUp() public {
        impl = new GuardianModule();
        token = new MockERC20("A", "A");
        user = vm.addr(userPk);
        token.mint(user, 100e18); // l'utilisateur détient des fonds sur son EOA
    }

    function test_DelegatedEoaCanBeEvacuatedByKeeper() public {
        // 1) L'EOA délègue son code au GuardianModule via EIP-7702.
        vm.signAndAttachDelegation(address(impl), userPk);

        // 2) L'EOA se configure lui-même (self-call) : depuis 7702, une UserOp du compte
        //    a msg.sender == address(this) == user. On simule ce self-call avec prank(user).
        vm.prank(user);
        GuardianModule(user).configure(vault, keeper);

        // 3) Le keeper déclenche l'évacuation de l'EOA.
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        vm.prank(keeper);
        GuardianModule(user).evacuateERC20(tokens);

        // 4) Les fonds de l'EOA sont au coffre.
        assertEq(token.balanceOf(vault), 100e18);
        assertEq(token.balanceOf(user), 0);
    }
}
```

- [ ] **Step 2 : Lancer le test pour confirmer qu'il échoue (ou révèle l'API exacte du cheatcode)**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract Guardian7702Test -vvv
```
Expected: soit PASS directement (le code applicatif existe déjà), soit une erreur de cheatcode si la signature de `signAndAttachDelegation` diffère sur forge 1.4.2.

- [ ] **Step 3 : Si le cheatcode diffère, corriger l'appel**

Sur forge 1.4.2, l'API est `vm.signAndAttachDelegation(address implementation, uint256 privateKey)`. Si la version exige un nonce explicite, utiliser la variante :
```solidity
vm.signAndAttachDelegation(address(impl), userPk, vm.getNonce(user));
```
Garder uniquement la forme qui compile/passe ; supprimer l'autre.

- [ ] **Step 4 : Lancer le test pour confirmer qu'il passe**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract Guardian7702Test -vvv
```
Expected: PASS (1 test) — l'EOA délégué a bien été évacué par le keeper.

- [ ] **Step 5 : Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/test/Guardian7702.t.sol
git commit -m "test(contracts): EIP-7702 delegation integration (keeper evacuates delegated EOA)"
```

---

### Task 8 : Script de déploiement Arbitrum Sepolia

**Files:**
- Create: `contracts/script/Deploy.s.sol`

- [ ] **Step 1 : Écrire le script de déploiement**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GuardianModule} from "../src/GuardianModule.sol";

/// @notice Déploie l'implémentation partagée GuardianModule (cible de délégation 7702).
///         Le SafeVault est déployé par utilisateur côté app, pas ici.
contract DeployGuardian is Script {
    function run() external returns (GuardianModule impl) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        impl = new GuardianModule();
        vm.stopBroadcast();
        console2.log("GuardianModule impl deployed at:", address(impl));
    }
}
```

- [ ] **Step 2 : Vérifier que le script compile (dry-run sans broadcast)**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build
```
Expected: `Compiler run successful`.

- [ ] **Step 3 : (Manuel, nécessite `DEPLOYER_PRIVATE_KEY` dans `.env`) Déployer sur Arbitrum Sepolia**

Prérequis : remplir `DEPLOYER_PRIVATE_KEY` dans `/Users/fianso/Development/hackathons/coincoin/.env` (wallet de dev jetable financé via [faucet Arbitrum Sepolia](https://faucet.quicknode.com/arbitrum/sepolia)).

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts
set -a && source ../.env && set +a
forge script script/Deploy.s.sol:DeployGuardian --rpc-url "$ARBITRUM_SEPOLIA_RPC" --broadcast
```
Expected: `GuardianModule impl deployed at: 0x...` — noter l'adresse pour les phases suivantes.

- [ ] **Step 4 : Commit du script**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/script/Deploy.s.sol
git commit -m "chore(contracts): deploy script for GuardianModule (Arbitrum Sepolia)"
```

---

## Definition of Done (Phase 1)

- [ ] `forge test` : toute la suite passe (SafeVault, configure, evacuate, revoke, intégration 7702).
- [ ] `GuardianModule` déployé sur Arbitrum Sepolia, adresse notée.
- [ ] Trust model vérifié par les tests : seul le compte se configure ; seul le compte ou le keeper évacue ; les fonds ne vont QUE vers `safeVault` ; un attaquant est rejeté.
- [ ] Aucun secret commité (`.env` gitignoré).

**Next:** Phase 2 (moteur de règles Stylus + hook ERC-7579). À étoffer dans `docs/superpowers/plans/2026-06-1X-coincoin-phase2-stylus.md`.
