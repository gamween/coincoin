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

    function test_DelegatedEoaSelfConfigureRejectsOthers() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        address attacker = address(0xBAD);
        vm.prank(attacker);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        GuardianModule(user).configure(vault, attacker);
    }
}
