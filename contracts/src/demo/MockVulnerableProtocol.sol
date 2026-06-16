// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Intentionally vulnerable DEMO protocol: `emergencyWithdraw` has no
///         access control and sends the entire balance to the caller. Represents a protocol
///         where users have deposited funds, then gets drained (a real exploit).
contract MockVulnerableProtocol {
    IERC20 public immutable token;

    event Drained(address indexed attacker, uint256 amount);

    constructor(IERC20 token_) {
        token = token_;
    }

    function deposit(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
    }

    /// @dev INTENTIONAL BUG: no auth, drains the whole contract to msg.sender.
    function emergencyWithdraw() external {
        uint256 bal = token.balanceOf(address(this));
        token.transfer(msg.sender, bal);
        emit Drained(msg.sender, bal);
    }
}
