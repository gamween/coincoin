// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title GuardianModule
/// @notice Logique guardian déléguée à un compte via EIP-7702. Exécutée dans le
///         contexte du compte : `address(this)` == le compte protégé, qui détient
///         les fonds. La configuration est réservée au compte lui-même ; les actions
///         d'urgence sont ouvertes au compte ou au keeper borné. Les fonds ne partent
///         QUE vers le `safeVault` enregistré.
contract GuardianModule {
    using SafeERC20 for IERC20; // utilisé par evacuateERC20 (Task 5)

    address public safeVault;
    address public keeper;
    bool public configured;

    event Configured(address indexed safeVault, address indexed keeper);

    error NotAuthorized();
    error ZeroAddress();

    /// @dev Seul le compte lui-même (self-call, y compris via une UserOp 7702) peut configurer.
    modifier onlySelf() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }

    /// @dev La reconfiguration par le compte lui-même est intentionnelle (le compte est
    ///      l'autorité suprême) ; la vérification d'intention revient à la couche signing/UX.
    function configure(address safeVault_, address keeper_) external onlySelf {
        if (safeVault_ == address(0) || keeper_ == address(0)) revert ZeroAddress();
        safeVault = safeVault_;
        keeper = keeper_;
        configured = true;
        emit Configured(safeVault_, keeper_);
    }
}
