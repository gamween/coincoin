// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SafeVault
/// @notice Vault owned by the user. The GuardianModule can only PUSH funds into it
///         (standard incoming transfers); only the owner can WITHDRAW from it.
contract SafeVault is Ownable {
    using SafeERC20 for IERC20;

    constructor(address owner_) Ownable(owner_) {}

    function withdrawERC20(IERC20 token, address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }

    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        (bool ok,) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    /// @dev Disabled: renouncing ownership would brick the vault (funds lost).
    function renounceOwnership() public view override onlyOwner {
        revert("SafeVault: renounce disabled");
    }

    receive() external payable {}
}
