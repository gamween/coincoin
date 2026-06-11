// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Protocole de DÉMO volontairement vulnérable : `emergencyWithdraw` n'a aucun
///         contrôle d'accès et envoie tout le solde à l'appelant. Représente un protocole
///         où des utilisateurs ont déposé des fonds, puis se fait drainer (exploit réel).
contract MockVulnerableProtocol {
    IERC20 public immutable token;
    mapping(address => uint256) public deposits;

    event Drained(address indexed attacker, uint256 amount);

    constructor(IERC20 token_) {
        token = token_;
    }

    function deposit(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }

    /// @dev BUG VOLONTAIRE : pas d'auth, vide tout le contrat vers msg.sender.
    function emergencyWithdraw() external {
        uint256 bal = token.balanceOf(address(this));
        token.transfer(msg.sender, bal);
        emit Drained(msg.sender, bal);
    }
}
