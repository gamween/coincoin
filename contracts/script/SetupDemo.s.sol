// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SafeVault} from "../src/SafeVault.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";
import {MockVulnerableProtocol} from "../src/demo/MockVulnerableProtocol.sol";
import {MockAavePool} from "../src/demo/MockAavePool.sol";

/// @notice Sets up the end-to-end demo on the target chain (Robinhood
///         Chain Testnet by default, or Arbitrum Sepolia): a test token, the
///         vulnerable protocol, the victim's SafeVault, and an Aave-V3-shaped pool
///         holding a deposited position for the victim (the DeFi half of the thesis).
///         The victim (VICTIM_ADDRESS) receives idle tokens; the 7702 delegation and
///         the `configure` call are done on the TS script side (onboard.ts).
contract SetupDemo is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address victim = vm.envAddress("VICTIM_ADDRESS");

        vm.startBroadcast(pk);
        MockERC20 token = new MockERC20("Demo USD", "dUSD");
        MockVulnerableProtocol proto = new MockVulnerableProtocol(token);
        SafeVault vault = new SafeVault(victim);
        MockAavePool aave = new MockAavePool();

        // The victim holds IDLE funds at rest (the sweep target).
        token.mint(victim, 500e18);
        // The deployer deposits into the protocol (which will get drained).
        token.mint(deployer, 1_000e18);
        token.approve(address(proto), 1_000e18);
        proto.deposit(1_000e18);
        // The victim also has a DEPOSITED Aave position (the exit target): the deployer
        // supplies onBehalfOf the victim so the position is credited to the victim.
        token.mint(deployer, 300e18);
        token.approve(address(aave), 300e18);
        aave.supply(address(token), 300e18, victim, 0);
        vm.stopBroadcast();

        console2.log("dUSD token:        ", address(token));
        console2.log("VulnerableProto:   ", address(proto));
        console2.log("Victim SafeVault:  ", address(vault));
        console2.log("MockAavePool:      ", address(aave));
    }
}
