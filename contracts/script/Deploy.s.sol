// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GuardianModule} from "../src/GuardianModule.sol";

/// @notice Déploie l'implémentation partagée GuardianModule (cible de délégation 7702).
///         Le SafeVault est déployé par utilisateur côté app, pas ici.
contract DeployGuardian is Script {
    function run() external returns (GuardianModule impl) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        impl = new GuardianModule();
        vm.stopBroadcast();
        console2.log("GuardianModule impl deployed at:", address(impl));
    }
}
