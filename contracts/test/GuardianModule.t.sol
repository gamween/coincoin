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
