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

    function test_OwnerCanWithdrawEth() public {
        vm.deal(address(vault), 2 ether);
        address payable dest = payable(address(0xDE57));
        vm.prank(owner);
        vault.withdrawETH(dest, 1.5 ether);
        assertEq(dest.balance, 1.5 ether);
        assertEq(address(vault).balance, 0.5 ether);
    }

    function test_NonOwnerCannotWithdrawEth() public {
        vm.deal(address(vault), 1 ether);
        vm.prank(attacker);
        vm.expectRevert();
        vault.withdrawETH(payable(attacker), 1 ether);
    }

    function test_RenounceOwnershipDisabled() public {
        vm.prank(owner);
        vm.expectRevert(bytes("SafeVault: renounce disabled"));
        vault.renounceOwnership();
    }
}
