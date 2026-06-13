// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockAavePool} from "../src/demo/MockAavePool.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @notice The DeFi-position exit: the guardian pulls a deposited Aave V3 position back
///         to the account, which is then swept to the user's vault. This is the half of
///         the thesis Harpie never covered — funds DEPOSITED in a protocol, not at rest.
contract AaveExitTest is Test {
    GuardianModule guardian;
    MockAavePool pool;
    MockERC20 token;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);
    address attacker = address(0xBAD);

    function setUp() public {
        guardian = new GuardianModule();
        pool = new MockAavePool();
        token = new MockERC20("Dollar", "dUSD");

        // The account (== address(guardian) under 7702) deposited 500 dUSD into the pool.
        token.mint(address(guardian), 500e18);
        vm.startPrank(address(guardian));
        token.approve(address(pool), type(uint256).max);
        pool.supply(address(token), 500e18, address(guardian), 0);
        guardian.configure(vault, keeper);
        vm.stopPrank();
    }

    function test_KeeperExitsPositionBackToAccount() public {
        assertEq(pool.deposited(address(token), address(guardian)), 500e18);
        assertEq(token.balanceOf(address(guardian)), 0);

        address[] memory underlyings = new address[](1);
        underlyings[0] = address(token);
        vm.prank(keeper);
        guardian.exitAaveV3(address(pool), underlyings);

        // The whole position came back to the account as the underlying.
        assertEq(pool.deposited(address(token), address(guardian)), 0);
        assertEq(token.balanceOf(address(guardian)), 500e18);
    }

    function test_ExitThenEvacuateEndToEnd() public {
        address[] memory underlyings = new address[](1);
        underlyings[0] = address(token);

        // 1) exit the deposited position back to the account…
        vm.prank(keeper);
        guardian.exitAaveV3(address(pool), underlyings);
        // 2) …then sweep the freed underlying to the user's vault.
        vm.prank(keeper);
        guardian.evacuateERC20(underlyings);

        assertEq(token.balanceOf(vault), 500e18);
        assertEq(token.balanceOf(address(guardian)), 0);
        assertEq(pool.deposited(address(token), address(guardian)), 0);
    }

    function test_SelfCanExit() public {
        address[] memory underlyings = new address[](1);
        underlyings[0] = address(token);
        vm.prank(address(guardian));
        guardian.exitAaveV3(address(pool), underlyings);
        assertEq(token.balanceOf(address(guardian)), 500e18);
    }

    function test_AttackerCannotExit() public {
        address[] memory underlyings = new address[](1);
        underlyings[0] = address(token);
        vm.prank(attacker);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.exitAaveV3(address(pool), underlyings);
    }

    function test_ExitRevertsIfNotConfigured() public {
        GuardianModule fresh = new GuardianModule();
        address[] memory underlyings = new address[](1);
        underlyings[0] = address(token);
        vm.prank(address(fresh));
        vm.expectRevert(GuardianModule.NotConfigured.selector);
        fresh.exitAaveV3(address(pool), underlyings);
    }

    function test_RevertingPoolSkippedNotBlocked() public {
        RevertingPool bad = new RevertingPool();
        address[] memory underlyings = new address[](1);
        underlyings[0] = address(token);

        // A pool whose withdraw reverts is skipped (ExitFailed), not fatal.
        vm.prank(keeper);
        guardian.exitAaveV3(address(bad), underlyings);

        // The real position is untouched and can still be exited afterwards.
        vm.prank(keeper);
        guardian.exitAaveV3(address(pool), underlyings);
        assertEq(token.balanceOf(address(guardian)), 500e18);
    }
}

/// @notice EIP-7702 end-to-end: a real EOA delegates to the GuardianModule, has a
///         deposited Aave position, and the keeper exits + sweeps it to the vault.
contract Aave7702Test is Test {
    GuardianModule impl;
    MockAavePool pool;
    MockERC20 token;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);

    uint256 userPk = 0xA11CE;
    address user;

    function setUp() public {
        impl = new GuardianModule();
        pool = new MockAavePool();
        token = new MockERC20("Dollar", "dUSD");
        user = vm.addr(userPk);

        // The user deposited 500 dUSD into the pool from their own EOA.
        token.mint(user, 500e18);
        vm.startPrank(user);
        token.approve(address(pool), type(uint256).max);
        pool.supply(address(token), 500e18, user, 0);
        vm.stopPrank();
    }

    function test_DelegatedEoaExitsAndEvacuates() public {
        // EOA delegates to the GuardianModule and configures itself.
        vm.signAndAttachDelegation(address(impl), userPk);
        vm.prank(user);
        GuardianModule(user).configure(vault, keeper);

        address[] memory underlyings = new address[](1);
        underlyings[0] = address(token);

        // Keeper exits the position then sweeps to the vault — all from the EOA.
        vm.prank(keeper);
        GuardianModule(user).exitAaveV3(address(pool), underlyings);
        vm.prank(keeper);
        GuardianModule(user).evacuateERC20(underlyings);

        assertEq(token.balanceOf(vault), 500e18);
        assertEq(token.balanceOf(user), 0);
        assertEq(pool.deposited(address(token), user), 0);
    }
}

/// @dev A pool whose withdraw always reverts (to test the skip-and-emit path).
contract RevertingPool {
    function withdraw(address, uint256, address) external pure returns (uint256) {
        revert("pool down");
    }
}
