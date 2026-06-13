// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Minimal Aave-V3-shaped lending pool for the demo. `supply` pulls the
///         underlying and records the depositor's position; `withdraw(asset, amount, to)`
///         returns it (`amount == type(uint256).max` → the full position), mirroring
///         IPool.withdraw. This lets the guardian's `exitAaveV3` pull a deposited
///         position back to the account deterministically — no testnet liquidity or
///         aToken fauceting needed. The real Aave V3 Pool matches the same `withdraw` ABI.
contract MockAavePool {
    /// asset => depositor => amount supplied
    mapping(address => mapping(address => uint256)) public deposited;

    event Supplied(address indexed asset, address indexed onBehalfOf, uint256 amount);
    event Withdrawn(address indexed asset, address indexed user, uint256 amount, address to);

    /// @dev Aave V3 signature `supply(asset, amount, onBehalfOf, referralCode)`.
    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        deposited[asset][onBehalfOf] += amount;
        emit Supplied(asset, onBehalfOf, amount);
    }

    /// @dev Mirrors `IPool.withdraw`: `amount == type(uint256).max` withdraws the full
    ///      position. Returns the amount actually withdrawn.
    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        uint256 bal = deposited[asset][msg.sender];
        uint256 amt = amount > bal ? bal : amount; // max (or over-ask) → full position
        deposited[asset][msg.sender] = bal - amt;
        IERC20(asset).transfer(to, amt);
        emit Withdrawn(asset, msg.sender, amt, to);
        return amt;
    }
}
