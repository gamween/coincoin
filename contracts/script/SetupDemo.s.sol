// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SafeVault} from "../src/SafeVault.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";
import {MockVulnerableProtocol} from "../src/demo/MockVulnerableProtocol.sol";

/// @notice Sets up the end-to-end demo on the target chain (Robinhood
///         Chain Testnet by default, or Arbitrum Sepolia): a test token, the
///         vulnerable protocol, and the victim's SafeVault. The victim
///         (VICTIM_ADDRESS) receives idle tokens; the 7702 delegation and the
///         `configure` call are done on the TS script side (onboard.ts).
contract SetupDemo is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address victim = vm.envAddress("VICTIM_ADDRESS");

        vm.startBroadcast(pk);
        MockERC20 token = new MockERC20("Demo USD", "dUSD");
        MockVulnerableProtocol proto = new MockVulnerableProtocol(token);
        SafeVault vault = new SafeVault(victim);

        // The victim holds IDLE funds (the evacuation target).
        token.mint(victim, 500e18);
        // The deployer deposits into the protocol (which will get drained).
        token.mint(deployer, 1_000e18);
        token.approve(address(proto), 1_000e18);
        proto.deposit(1_000e18);
        vm.stopBroadcast();

        console2.log("dUSD token:        ", address(token));
        console2.log("VulnerableProto:   ", address(proto));
        console2.log("Victim SafeVault:  ", address(vault));
    }
}
