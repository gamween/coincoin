// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {SafeVault} from "./SafeVault.sol";

/// @title SafeVaultFactory
/// @notice Deploys one SafeVault per owner at a deterministic CREATE2 address. The
///         address is therefore known (counterfactual) BEFORE deployment, which is
///         what the gasless onboarding flow needs: the user signs an EIP-712 policy
///         against `vaultOf(user)`, then a relayer deploys the vault and configures
///         the guardian in one sponsored transaction.
contract SafeVaultFactory {
    event VaultDeployed(address indexed owner, address vault);

    /// @dev One vault per owner → the salt is the owner address.
    function _salt(address owner) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(owner)));
    }

    /// @dev Init code = SafeVault creation bytecode + abi-encoded constructor arg (owner).
    function _initCode(address owner) internal pure returns (bytes memory) {
        return abi.encodePacked(type(SafeVault).creationCode, abi.encode(owner));
    }

    /// @notice The deterministic SafeVault address for `owner`, deployed or not.
    function vaultOf(address owner) public view returns (address) {
        return Create2.computeAddress(_salt(owner), keccak256(_initCode(owner)));
    }

    /// @notice Whether `owner`'s SafeVault has already been deployed.
    function isDeployed(address owner) external view returns (bool) {
        return vaultOf(owner).code.length != 0;
    }

    /// @notice Deploy `owner`'s SafeVault if it doesn't exist yet; returns its address.
    ///         Idempotent: a second call just returns the existing vault.
    function deploy(address owner) external returns (address vault) {
        vault = vaultOf(owner);
        if (vault.code.length == 0) {
            address deployed = Create2.deploy(0, _salt(owner), _initCode(owner));
            require(deployed == vault, "factory: address mismatch");
            emit VaultDeployed(owner, vault);
        }
    }
}
