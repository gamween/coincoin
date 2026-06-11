// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

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

    function test_SelfCanReconfigure() public {
        vm.prank(address(guardian));
        guardian.configure(vault, keeper);
        address newVault = address(0xBEEF);
        address newKeeper = address(0xCAFE);
        vm.prank(address(guardian));
        guardian.configure(newVault, newKeeper);
        assertEq(guardian.safeVault(), newVault);
        assertEq(guardian.keeper(), newKeeper);
    }

    function test_ConfigureRejectsZeroKeeper() public {
        vm.prank(address(guardian));
        vm.expectRevert(GuardianModule.ZeroAddress.selector);
        guardian.configure(vault, address(0));
    }
}

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

    function test_EvacuateRevertsIfNotConfigured() public {
        GuardianModule fresh = new GuardianModule();
        address[] memory tokens = new address[](1);
        tokens[0] = address(tokenA);
        vm.prank(address(fresh));
        vm.expectRevert(GuardianModule.NotConfigured.selector);
        fresh.evacuateERC20(tokens);
    }

    function test_EmptyArrayIsNoop() public {
        address[] memory tokens = new address[](0);
        vm.prank(keeper);
        guardian.evacuateERC20(tokens);
        assertEq(tokenA.balanceOf(address(guardian)), 100e18);
    }

    function test_RevertingTokenSkippedNotBlocked() public {
        RevertingERC20 bad = new RevertingERC20();
        bad.mint(address(guardian), 10e18);
        address[] memory tokens = new address[](3);
        tokens[0] = address(tokenA);
        tokens[1] = address(bad);
        tokens[2] = address(tokenB);

        vm.prank(keeper);
        guardian.evacuateERC20(tokens);

        // Les tokens sains sont évacués malgré le token qui revert.
        assertEq(tokenA.balanceOf(vault), 100e18);
        assertEq(tokenB.balanceOf(vault), 50e18);
        // Le token toxique reste sur le compte, mais n'a pas bloqué l'évacuation.
        assertEq(bad.balanceOf(address(guardian)), 10e18);
    }
}

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

contract RevertingERC20 is MockERC20 {
    constructor() MockERC20("Bad", "BAD") {}

    function transfer(address, uint256) public pure override returns (bool) {
        revert("blacklisted");
    }
}
