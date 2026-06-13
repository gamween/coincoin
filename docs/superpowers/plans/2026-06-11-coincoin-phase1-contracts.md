# coincoin — Phase 1: Contracts Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build coincoin's on-chain core: a `GuardianModule` that, executed in the context of an account (via EIP-7702 or a self-call), can — when triggered by the account itself or a bounded keeper — evacuate its ERC-20s and revoke its approvals to a `SafeVault` that only the owner controls.

**Architecture:** Foundry project (Solidity + OpenZeppelin) at the root under `contracts/`. Two contracts: `SafeVault` (an `Ownable` vault, push-in / owner-only-out) and `GuardianModule` (7702 delegated logic: `configure` reserved to the account itself, `evacuateERC20` / `revokeApprovals` reserved to the account or the keeper). TDD tests with `forge test`, including an EIP-7702 integration test via the Foundry cheatcodes. Deployment to Arbitrum Sepolia via `forge script`.

**Tech Stack:** Foundry (forge 1.4.2), Solidity ^0.8.24, OpenZeppelin Contracts, EIP-7702, Arbitrum Sepolia (chain 421614).

---

## Phase breakdown (overview)

This plan = **Phase 1** only. Each phase produces a standalone testable deliverable. Phases 2-5 will have their own plan (to be fleshed out when the time comes):

- **Phase 1 (this plan)** — Contracts foundation: `SafeVault` + `GuardianModule` (configure / evacuate / revoke) + 7702 integration + deployment. *Deliverable: a delegated account can self-evacuate to its vault, triggered by itself or a bounded keeper.*
- **Phase 2** — Stylus rules engine (Rust) + ERC-7579 hook: automatic local blocking of drain txs. *Deliverable: a malicious tx is reverted at the account level.*
- **Phase 3** — Exit adapters: `AaveV3ExitAdapter` + `GmxV2ExitAdapter` (real ones on Arbitrum Sepolia). *Deliverable: automatic exit of an Aave/GMX position.*
- **Phase 4** — TypeScript watcher: a Defimon-schema threat emitter (driven by a real exploit replayed on testnet) → triggers the pre-authorized evacuation via the ZeroDev relayer. *Deliverable: an on-chain exploit triggers an end-to-end evacuation.*
- **Phase 5** — Next.js dashboard: onboarding (7702 delegation), status, panic button, log, vault withdrawal. *Deliverable: the product usable end-to-end + demo.*

---

## File structure (Phase 1)

```
contracts/
├── foundry.toml                  # Foundry config + remappings + arbitrum_sepolia profile
├── remappings.txt                # @openzeppelin/ → lib/openzeppelin-contracts/
├── src/
│   ├── SafeVault.sol             # Ownable vault: receives funds, only the owner withdraws
│   └── GuardianModule.sol        # delegated guardian logic (7702): configure/evacuate/revoke
├── test/
│   ├── mocks/MockERC20.sol       # test ERC20 with public mint
│   ├── SafeVault.t.sol           # vault tests
│   ├── GuardianModule.t.sol      # configure/evacuate/revoke tests + access control
│   └── Guardian7702.t.sol        # EIP-7702 delegation integration test
└── script/
    └── Deploy.s.sol              # Arbitrum Sepolia deployment script
```

---

### Task 1: Scaffold the Foundry project

**Files:**
- Create: `contracts/foundry.toml`
- Create: `contracts/remappings.txt`
- Create: `contracts/.gitignore`

- [ ] **Step 1: Initialize Foundry in `contracts/`**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin
forge init contracts --no-git --no-commit
rm -f contracts/src/Counter.sol contracts/test/Counter.t.sol contracts/script/Counter.s.sol
```
Expected: `contracts/{src,test,script,lib}` tree created, `lib/forge-std` present.

- [ ] **Step 2: Install OpenZeppelin Contracts**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts
forge install OpenZeppelin/openzeppelin-contracts --no-git --no-commit
```
Expected: `lib/openzeppelin-contracts/` present.

- [ ] **Step 3: Write `contracts/foundry.toml`**

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

- [ ] **Step 4: Write `contracts/remappings.txt`**

```text
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

- [ ] **Step 5: Write `contracts/.gitignore`**

```text
out/
cache/
broadcast/
```

- [ ] **Step 6: Verify that compilation passes on an empty project**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build
```
Expected: `Compiler run successful` (no application contract yet, but the OZ lib compiles).

- [ ] **Step 7: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/foundry.toml contracts/remappings.txt contracts/.gitignore contracts/lib contracts/src contracts/test contracts/script 2>/dev/null
git add contracts
git commit -m "chore(contracts): scaffold Foundry + OpenZeppelin"
```

---

### Task 2: `MockERC20` (test helper)

**Files:**
- Create: `contracts/test/mocks/MockERC20.sol`

- [ ] **Step 1: Write the ERC20 mock with a public mint**

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

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build
```
Expected: `Compiler run successful`.

- [ ] **Step 3: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/test/mocks/MockERC20.sol
git commit -m "test(contracts): add MockERC20 helper"
```

---

### Task 3: `SafeVault` — push-in / owner-only-out vault

**Files:**
- Create: `contracts/src/SafeVault.sol`
- Test: `contracts/test/SafeVault.t.sol`

- [ ] **Step 1: Write the failing test**

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

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract SafeVaultTest -vv
```
Expected: FAIL — `SafeVault` not found (the source file doesn't exist).

- [ ] **Step 3: Write the minimal implementation**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SafeVault
/// @notice Vault owned by the user. The GuardianModule can only PUSH funds into it
///         (standard incoming transfers); only the owner can WITHDRAW from it.
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

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract SafeVaultTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/SafeVault.sol contracts/test/SafeVault.t.sol
git commit -m "feat(contracts): SafeVault (push-in, owner-only-out)"
```

---

### Task 4: `GuardianModule.configure` — reserved to the account itself

**Files:**
- Create: `contracts/src/GuardianModule.sol`
- Test: `contracts/test/GuardianModule.t.sol`

- [ ] **Step 1: Write the failing test**

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
        // In 7702, the account runs its own code: msg.sender == address(this).
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

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleConfigureTest -vv
```
Expected: FAIL — `GuardianModule` not found.

- [ ] **Step 3: Write the minimal implementation**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title GuardianModule
/// @notice Guardian logic delegated to an account via EIP-7702. Executed in the
///         account's context: `address(this)` == the protected account, which holds
///         the funds. Configuration is reserved to the account itself; the emergency
///         actions are open to the account or the bounded keeper. Funds leave ONLY
///         toward the registered `safeVault`.
contract GuardianModule {
    using SafeERC20 for IERC20;

    address public safeVault;
    address public keeper;
    bool public configured;

    event Configured(address indexed safeVault, address indexed keeper);

    error NotAuthorized();
    error ZeroAddress();

    /// @dev Only the account itself (a self-call, including via a 7702 UserOp) can configure.
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

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleConfigureTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/GuardianModule.sol contracts/test/GuardianModule.t.sol
git commit -m "feat(contracts): GuardianModule.configure (self-only)"
```

---

### Task 5: `GuardianModule.evacuateERC20` — sweep to the vault

**Files:**
- Modify: `contracts/src/GuardianModule.sol`
- Modify: `contracts/test/GuardianModule.t.sol`

- [ ] **Step 1: Add the failing test**

Add this test contract at the end of `contracts/test/GuardianModule.t.sol`:

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
        // The account (== address(guardian) under 7702) holds the funds.
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

And add the mock import at the top of the file (below the `GuardianModule` import):

```solidity
import {MockERC20} from "./mocks/MockERC20.sol";
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleEvacuateTest -vv
```
Expected: FAIL — `evacuateERC20` doesn't exist (`Member "evacuateERC20" not found`).

- [ ] **Step 3: Implement `evacuateERC20`**

Add to `contracts/src/GuardianModule.sol`: (a) the `onlySelfOrKeeper` modifier, (b) the `NotConfigured` error, (c) the `Evacuated` event, (d) the function. Insert after the `configure` function:

```solidity
    event Evacuated(address indexed token, uint256 amount);

    error NotConfigured();

    modifier onlySelfOrKeeper() {
        if (msg.sender != address(this) && msg.sender != keeper) revert NotAuthorized();
        _;
    }

    /// @notice Sweeps the full balance of each token to the safeVault.
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

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleEvacuateTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/GuardianModule.sol contracts/test/GuardianModule.t.sol
git commit -m "feat(contracts): GuardianModule.evacuateERC20 (sweep to vault, self/keeper)"
```

---

### Task 6: `GuardianModule.revokeApprovals` — cut off dangerous allowances

**Files:**
- Modify: `contracts/src/GuardianModule.sol`
- Modify: `contracts/test/GuardianModule.t.sol`

- [ ] **Step 1: Add the failing test**

Add this test contract at the end of `contracts/test/GuardianModule.t.sol`:

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
        // The account has a dangerous allowance still active.
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

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleRevokeTest -vv
```
Expected: FAIL — `revokeApprovals` / `LengthMismatch` don't exist.

- [ ] **Step 3: Implement `revokeApprovals`**

Add to `contracts/src/GuardianModule.sol`: (a) the `LengthMismatch` error, (b) the `ApprovalRevoked` event, (c) the function. Insert after `evacuateERC20`:

```solidity
    event ApprovalRevoked(address indexed token, address indexed spender);

    error LengthMismatch();

    /// @notice Resets the given allowances to zero (uses forceApprove for non-standard
    ///         tokens such as USDT).
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

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract GuardianModuleRevokeTest -vv
```
Expected: PASS (3 tests).

- [ ] **Step 5: Run the whole suite**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test -vv
```
Expected: PASS — all tests (SafeVault + Guardian configure/evacuate/revoke).

- [ ] **Step 6: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/src/GuardianModule.sol contracts/test/GuardianModule.t.sol
git commit -m "feat(contracts): GuardianModule.revokeApprovals (self/keeper)"
```

---

### Task 7: EIP-7702 integration test (Foundry cheatcode)

**Purpose:** prove that, delegated to a real EOA via 7702, the `GuardianModule` executes in that EOA's context and can evacuate it. Uses `vm.signAndAttachDelegation` (Foundry).

**Files:**
- Create: `contracts/test/Guardian7702.t.sol`

- [ ] **Step 1: Write the failing integration test**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @notice Verifies the EIP-7702 flow: an EOA delegates its code to the GuardianModule,
///         then the keeper triggers the evacuation of the EOA to the vault.
contract Guardian7702Test is Test {
    GuardianModule impl; // delegated implementation (shared code)
    MockERC20 token;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);

    // User EOA with a known key (to sign the 7702 delegation).
    uint256 userPk = 0xA11CE;
    address user;

    function setUp() public {
        impl = new GuardianModule();
        token = new MockERC20("A", "A");
        user = vm.addr(userPk);
        token.mint(user, 100e18); // the user holds funds on their EOA
    }

    function test_DelegatedEoaCanBeEvacuatedByKeeper() public {
        // 1) The EOA delegates its code to the GuardianModule via EIP-7702.
        vm.signAndAttachDelegation(address(impl), userPk);

        // 2) The EOA configures itself (self-call): from 7702, a UserOp of the account
        //    has msg.sender == address(this) == user. We simulate this self-call with prank(user).
        vm.prank(user);
        GuardianModule(user).configure(vault, keeper);

        // 3) The keeper triggers the EOA's evacuation.
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        vm.prank(keeper);
        GuardianModule(user).evacuateERC20(tokens);

        // 4) The EOA's funds are in the vault.
        assertEq(token.balanceOf(vault), 100e18);
        assertEq(token.balanceOf(user), 0);
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails (or reveals the exact cheatcode API)**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract Guardian7702Test -vvv
```
Expected: either PASS directly (the application code already exists), or a cheatcode error if the signature of `signAndAttachDelegation` differs on forge 1.4.2.

- [ ] **Step 3: If the cheatcode differs, fix the call**

On forge 1.4.2, the API is `vm.signAndAttachDelegation(address implementation, uint256 privateKey)`. If the version requires an explicit nonce, use the variant:
```solidity
vm.signAndAttachDelegation(address(impl), userPk, vm.getNonce(user));
```
Keep only the form that compiles/passes; remove the other.

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge test --match-contract Guardian7702Test -vvv
```
Expected: PASS (1 test) — the delegated EOA was successfully evacuated by the keeper.

- [ ] **Step 5: Commit**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/test/Guardian7702.t.sol
git commit -m "test(contracts): EIP-7702 delegation integration (keeper evacuates delegated EOA)"
```

---

### Task 8: Arbitrum Sepolia deployment script

**Files:**
- Create: `contracts/script/Deploy.s.sol`

- [ ] **Step 1: Write the deployment script**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GuardianModule} from "../src/GuardianModule.sol";

/// @notice Deploys the shared GuardianModule implementation (the 7702 delegation target).
///         The SafeVault is deployed per user on the app side, not here.
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

- [ ] **Step 2: Verify the script compiles (dry-run without broadcast)**

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts && forge build
```
Expected: `Compiler run successful`.

- [ ] **Step 3: (Manual, requires `DEPLOYER_PRIVATE_KEY` in `.env`) Deploy to Arbitrum Sepolia**

Prerequisite: fill `DEPLOYER_PRIVATE_KEY` in `/Users/fianso/Development/hackathons/coincoin/.env` (a throwaway dev wallet funded via the [Arbitrum Sepolia faucet](https://faucet.quicknode.com/arbitrum/sepolia)).

Run:
```bash
cd /Users/fianso/Development/hackathons/coincoin/contracts
set -a && source ../.env && set +a
forge script script/Deploy.s.sol:DeployGuardian --rpc-url "$ARBITRUM_SEPOLIA_RPC" --broadcast
```
Expected: `GuardianModule impl deployed at: 0x...` — note the address for the following phases.

- [ ] **Step 4: Commit the script**

```bash
cd /Users/fianso/Development/hackathons/coincoin
git add contracts/script/Deploy.s.sol
git commit -m "chore(contracts): deploy script for GuardianModule (Arbitrum Sepolia)"
```

---

## Definition of Done (Phase 1)

- [ ] `forge test`: the whole suite passes (SafeVault, configure, evacuate, revoke, 7702 integration).
- [ ] `GuardianModule` deployed on Arbitrum Sepolia, address noted.
- [ ] Trust model verified by the tests: only the account configures itself; only the account or the keeper evacuates; funds go ONLY to `safeVault`; an attacker is rejected.
- [ ] No secret committed (`.env` gitignored).

**Next:** Phase 2 (Stylus rules engine + ERC-7579 hook). To be fleshed out in `docs/superpowers/plans/2026-06-1X-coincoin-phase2-stylus.md`.
