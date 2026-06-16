// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SafeVaultFactory} from "../src/SafeVaultFactory.sol";

/// @notice Deploys the SafeVaultFactory (deterministic per-owner SafeVault deployer).
///         Set its address as `VAULT_FACTORY` (.env) and `VITE_VAULT_FACTORY` (site)
///         to enable the gasless in-browser onboarding flow.
contract DeployFactory is Script {
    function run() external returns (SafeVaultFactory factory) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        factory = new SafeVaultFactory();
        vm.stopBroadcast();
        console2.log("SafeVaultFactory deployed at:", address(factory));
    }
}
