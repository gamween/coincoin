// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RulesEngineV1} from "../src/RulesEngineV1.sol";

/// @notice Deploys the stateless RulesEngineV1 (the local-firewall scorer). Set its address as
///         `VITE_RULES_ENGINE` (site) and `RULES_ENGINE` (.env) to enable the firewall controls.
contract DeployRules is Script {
    function run() external returns (RulesEngineV1 engine) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        engine = new RulesEngineV1();
        vm.stopBroadcast();
        console2.log("RulesEngineV1 deployed at:", address(engine));
    }
}
