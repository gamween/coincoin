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
    uint256 private _locked; // guard de réentrance (0 = libre, 1 = occupé)

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

    event Evacuated(address indexed token, uint256 amount);
    event EvacuationFailed(address indexed token);

    error NotConfigured();
    error Reentrancy();

    modifier nonReentrant() {
        if (_locked != 0) revert Reentrancy();
        _locked = 1;
        _;
        _locked = 0;
    }

    modifier onlySelfOrKeeper() {
        if (msg.sender != address(this) && msg.sender != keeper) revert NotAuthorized();
        _;
    }

    /// @notice Balaie la totalité du solde de chaque token vers le safeVault.
    /// @dev Chemin d'URGENCE : un token qui revert (blacklist, pause, token malveillant)
    ///      est SAUTÉ (event EvacuationFailed) au lieu de bloquer toute l'évacuation.
    ///      Un keeper qui rappelle après coup est un no-op (soldes à zéro) : intentionnel.
    function evacuateERC20(address[] calldata tokens) external onlySelfOrKeeper nonReentrant {
        if (!configured) revert NotConfigured();
        address vault_ = safeVault; // cache : une seule SLOAD, immuable pendant la boucle
        for (uint256 i; i < tokens.length; ++i) {
            uint256 bal;
            try IERC20(tokens[i]).balanceOf(address(this)) returns (uint256 b) {
                bal = b;
            } catch {
                emit EvacuationFailed(tokens[i]);
                continue;
            }
            if (bal == 0) continue;
            (bool ok, bytes memory ret) =
                tokens[i].call(abi.encodeCall(IERC20.transfer, (vault_, bal)));
            // Sémantique SafeERC20 : succès si call ok ET (pas de retour [USDT] OU retour true).
            if (ok && (ret.length == 0 || (ret.length >= 32 && abi.decode(ret, (bool))))) {
                emit Evacuated(tokens[i], bal);
            } else {
                emit EvacuationFailed(tokens[i]);
            }
        }
    }

    event ApprovalRevoked(address indexed token, address indexed spender);

    error LengthMismatch();

    /// @notice Remet à zéro les allowances passées (utilise forceApprove pour les
    ///         tokens non standard type USDT).
    function revokeApprovals(address[] calldata tokens, address[] calldata spenders)
        external
        onlySelfOrKeeper
    {
        if (tokens.length != spenders.length) revert LengthMismatch();
        for (uint256 i; i < tokens.length; ++i) {
            IERC20(tokens[i]).forceApprove(spenders[i], 0);
            emit ApprovalRevoked(tokens[i], spenders[i]);
        }
    }
}
