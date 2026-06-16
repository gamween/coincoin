// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @notice The folded PreAuthRegistry: a multi-keeper policy, set directly (configurePolicy)
///         or via an EIP-712 signature a relayer submits (configureWithSig — gasless onboarding).
contract PreAuthPolicyTest is Test {
    GuardianModule guardian;
    MockERC20 token;
    address vault = address(0xFA17);
    address k1 = address(0xCEE1);
    address k2 = address(0xCEE2);

    function setUp() public {
        guardian = new GuardianModule();
        token = new MockERC20("A", "A");
        token.mint(address(guardian), 100e18);
    }

    function _policy(address v, address[] memory ks) internal pure returns (GuardianModule.Policy memory) {
        return GuardianModule.Policy(v, ks);
    }

    function test_MultipleKeepersCanEachEvacuate() public {
        address[] memory ks = new address[](2);
        ks[0] = k1;
        ks[1] = k2;
        vm.prank(address(guardian));
        guardian.configurePolicy(_policy(vault, ks));

        assertTrue(guardian.isKeeper(k1));
        assertTrue(guardian.isKeeper(k2));
        assertEq(guardian.keepers().length, 2);
        assertEq(guardian.keeper(), k1); // primary

        address[] memory t = new address[](1);
        t[0] = address(token);
        vm.prank(k2); // the SECOND keeper can act
        guardian.evacuateERC20(t);
        assertEq(token.balanceOf(vault), 100e18);
    }

    function test_RotationRevokesOldKeepers() public {
        address[] memory ks = new address[](1);
        ks[0] = k1;
        vm.prank(address(guardian));
        guardian.configurePolicy(_policy(vault, ks));

        address[] memory ks2 = new address[](1);
        ks2[0] = k2;
        vm.prank(address(guardian));
        guardian.configurePolicy(_policy(vault, ks2)); // same vault, new keeper set

        assertFalse(guardian.isKeeper(k1)); // old keeper revoked
        assertTrue(guardian.isKeeper(k2));

        address[] memory t = new address[](1);
        t[0] = address(token);
        vm.prank(k1);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.evacuateERC20(t);
    }

    function test_PolicyVaultIsFrozen() public {
        address[] memory ks = new address[](1);
        ks[0] = k1;
        vm.prank(address(guardian));
        guardian.configurePolicy(_policy(vault, ks));
        vm.prank(address(guardian));
        vm.expectRevert(GuardianModule.VaultLocked.selector);
        guardian.configurePolicy(_policy(address(0xBEEF), ks));
    }

    function test_RejectsEmptyKeeperSet() public {
        address[] memory ks = new address[](0);
        vm.prank(address(guardian));
        vm.expectRevert(GuardianModule.NoKeepers.selector);
        guardian.configurePolicy(_policy(vault, ks));
    }

    function test_OnlySelfCanConfigurePolicy() public {
        address[] memory ks = new address[](1);
        ks[0] = k1;
        vm.prank(address(0xBAD));
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.configurePolicy(_policy(vault, ks));
    }

    function test_KeeperCannotConfigure() public {
        address[] memory ks = new address[](1);
        ks[0] = k1;
        vm.prank(address(guardian));
        guardian.configurePolicy(_policy(vault, ks));
        // k1 is now a keeper — but a keeper still cannot touch the policy.
        vm.prank(k1);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.configure(vault, k1);
        vm.prank(k1);
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.configurePolicy(_policy(vault, ks));
    }

    function test_DedupesRepeatedKeepers() public {
        address[] memory ks = new address[](2);
        ks[0] = k1;
        ks[1] = k1; // duplicate
        vm.prank(address(guardian));
        guardian.configurePolicy(_policy(vault, ks));
        assertEq(guardian.keepers().length, 1);
        assertTrue(guardian.isKeeper(k1));
    }
}

/// @notice EIP-712 signed policy: the account signs its policy off-chain and a RELAYER submits it
///         — gasless onboarding. Verified in the real 7702 context (verifyingContract == the EOA).
contract PreAuthSigTest is Test {
    GuardianModule impl;
    address vault = address(0xFA17);
    address k1 = address(0xCEE1);
    address relayer = address(0xBEEF);

    uint256 userPk = 0xA11CE;
    address user;

    bytes32 constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 constant POLICY_TYPEHASH =
        keccak256("Policy(address safeVault,address[] keepers,uint256 nonce,uint256 deadline)");

    function setUp() public {
        impl = new GuardianModule();
        user = vm.addr(userPk);
    }

    function _digest(address v, address[] memory ks, uint256 nonce, uint256 deadline) internal view returns (bytes32) {
        bytes32 domainSep = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes("coincoin GuardianModule")), keccak256(bytes("1")), block.chainid, user)
        );
        bytes32[] memory words = new bytes32[](ks.length);
        for (uint256 i; i < ks.length; ++i) words[i] = bytes32(uint256(uint160(ks[i])));
        bytes32 keepersHash = keccak256(abi.encodePacked(words)); // standard EIP-712 address[] hash
        bytes32 structHash = keccak256(abi.encode(POLICY_TYPEHASH, v, keepersHash, nonce, deadline));
        return keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
    }

    function _sign(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _ks() internal view returns (address[] memory ks) {
        ks = new address[](1);
        ks[0] = k1;
    }

    function test_RelayerAppliesSignedPolicy() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(userPk, _digest(vault, _ks(), 0, deadline));

        vm.prank(relayer); // the user pays no gas
        GuardianModule(user).configureWithSig(GuardianModule.Policy(vault, _ks()), 0, deadline, sig);

        assertTrue(GuardianModule(user).configured());
        assertEq(GuardianModule(user).safeVault(), vault);
        assertTrue(GuardianModule(user).isKeeper(k1));
        assertEq(GuardianModule(user).policyNonce(), 1);
    }

    function test_RejectsReplay() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(userPk, _digest(vault, _ks(), 0, deadline));
        vm.prank(relayer);
        GuardianModule(user).configureWithSig(GuardianModule.Policy(vault, _ks()), 0, deadline, sig);
        vm.prank(relayer);
        vm.expectRevert(GuardianModule.BadNonce.selector);
        GuardianModule(user).configureWithSig(GuardianModule.Policy(vault, _ks()), 0, deadline, sig);
    }

    function test_RejectsExpired() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(userPk, _digest(vault, _ks(), 0, deadline));
        vm.warp(deadline + 1);
        vm.prank(relayer);
        vm.expectRevert(GuardianModule.Expired.selector);
        GuardianModule(user).configureWithSig(GuardianModule.Policy(vault, _ks()), 0, deadline, sig);
    }

    function test_RejectsWrongSigner() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory badSig = _sign(0xBADBAD, _digest(vault, _ks(), 0, deadline)); // not the user's key
        vm.prank(relayer);
        vm.expectRevert(GuardianModule.BadSignature.selector);
        GuardianModule(user).configureWithSig(GuardianModule.Policy(vault, _ks()), 0, deadline, badSig);
    }

    function test_RejectsEmptySignature() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        uint256 deadline = block.timestamp + 1 hours;
        vm.prank(relayer);
        vm.expectRevert(); // OZ ECDSA rejects a malformed/empty signature (never recovers to 0)
        GuardianModule(user).configureWithSig(GuardianModule.Policy(vault, _ks()), 0, deadline, hex"");
    }

    function test_VaultFrozenViaSignedPath() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(userPk, _digest(vault, _ks(), 0, deadline));
        vm.prank(relayer);
        GuardianModule(user).configureWithSig(GuardianModule.Policy(vault, _ks()), 0, deadline, sig);

        // A later signed policy with a DIFFERENT vault (nonce now 1) is rejected — vault frozen.
        bytes memory sig2 = _sign(userPk, _digest(address(0xBEEF), _ks(), 1, deadline));
        vm.prank(relayer);
        vm.expectRevert(GuardianModule.VaultLocked.selector);
        GuardianModule(user).configureWithSig(GuardianModule.Policy(address(0xBEEF), _ks()), 1, deadline, sig2);
    }
}
