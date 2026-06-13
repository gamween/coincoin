// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GuardianModule} from "../src/GuardianModule.sol";

/// @notice Deploys the shared GuardianModule implementation (the 7702 delegation target).
///         The SafeVault is deployed per user on the app side, not here.
contract DeployGuardian is Script {
    function run() external returns (GuardianModule impl) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        impl = new GuardianModule();
        vm.stopBroadcast();
        console2.log("GuardianModule impl deployed at:", address(impl));
    }
}
