// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SafeVault} from "../src/SafeVault.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";
import {MockVulnerableProtocol} from "../src/demo/MockVulnerableProtocol.sol";

/// @notice Déploie le décor de la démo end-to-end sur la chaîne cible (Robinhood
///         Chain Testnet par défaut, ou Arbitrum Sepolia) : un token de test, le
///         protocole vulnérable, et le SafeVault de la victime. La victime
///         (VICTIM_ADDRESS) reçoit des tokens au repos ; la délégation 7702 et le
///         `configure` sont faits côté script TS (onboard.ts).
contract SetupDemo is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address victim = vm.envAddress("VICTIM_ADDRESS");

        vm.startBroadcast(pk);
        MockERC20 token = new MockERC20("Demo USD", "dUSD");
        MockVulnerableProtocol proto = new MockVulnerableProtocol(token);
        SafeVault vault = new SafeVault(victim);

        // La victime détient des fonds AU REPOS (cible de l'évacuation).
        token.mint(victim, 500e18);
        // Le déployeur dépose dans le protocole (qui se fera drainer).
        token.mint(deployer, 1_000e18);
        token.approve(address(proto), 1_000e18);
        proto.deposit(1_000e18);
        vm.stopBroadcast();

        console2.log("dUSD token:        ", address(token));
        console2.log("VulnerableProto:   ", address(proto));
        console2.log("Victim SafeVault:  ", address(vault));
    }
}
