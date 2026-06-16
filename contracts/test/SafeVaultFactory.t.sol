// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SafeVaultFactory} from "../src/SafeVaultFactory.sol";
import {SafeVault} from "../src/SafeVault.sol";

contract SafeVaultFactoryTest is Test {
    SafeVaultFactory factory;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        factory = new SafeVaultFactory();
    }

    function test_VaultOfMatchesDeployedAddress() public {
        address predicted = factory.vaultOf(alice);
        assertEq(predicted.code.length, 0, "should not exist yet");
        address deployed = factory.deploy(alice);
        assertEq(deployed, predicted, "deployed address must equal vaultOf");
        assertGt(deployed.code.length, 0, "vault should have code");
    }

    function test_DeployedVaultIsOwnedByOwner() public {
        address vault = factory.deploy(alice);
        assertEq(SafeVault(payable(vault)).owner(), alice, "vault owner must be the user");
    }

    function test_DeployIsIdempotent() public {
        address first = factory.deploy(alice);
        address second = factory.deploy(alice); // must not revert
        assertEq(first, second, "second deploy returns the same vault");
    }

    function test_IsDeployedReflectsState() public {
        assertFalse(factory.isDeployed(alice));
        factory.deploy(alice);
        assertTrue(factory.isDeployed(alice));
    }

    function test_DistinctOwnersGetDistinctVaults() public {
        assertTrue(factory.vaultOf(alice) != factory.vaultOf(bob), "vaults must differ per owner");
    }
}
