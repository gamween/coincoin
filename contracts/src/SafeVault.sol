// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SafeVault
/// @notice Coffre détenu par l'utilisateur. Le GuardianModule ne peut qu'y POUSSER
///         des fonds (transferts entrants standards) ; seul l'owner peut en RETIRER.
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

    receive() external payable {}
}
