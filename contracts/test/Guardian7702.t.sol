// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @notice Verifies the EIP-7702 flow: an EOA delegates its code to the GuardianModule,
///         then the keeper triggers the evacuation from the EOA to the vault.
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

        // 2) The EOA configures itself (self-call): under 7702, a UserOp from the account
        //    has msg.sender == address(this) == user. We simulate this self-call with prank(user).
        vm.prank(user);
        GuardianModule(user).configure(vault, keeper);

        // 2b) The delegated storage indeed lives at the EOA's address (not at impl).
        assertEq(GuardianModule(user).safeVault(), vault);
        assertEq(GuardianModule(user).keeper(), keeper);
        assertTrue(GuardianModule(user).configured());

        // 3) The keeper triggers the evacuation from the EOA.
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        vm.prank(keeper);
        GuardianModule(user).evacuateERC20(tokens);

        // 4) The EOA's funds are in the vault.
        assertEq(token.balanceOf(vault), 100e18);
        assertEq(token.balanceOf(user), 0);
    }

    function test_DelegatedEoaSelfConfigureRejectsOthers() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        address attacker = address(0xBAD);
        vm.prank(attacker);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        GuardianModule(user).configure(vault, attacker);
    }
}
