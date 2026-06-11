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
}
