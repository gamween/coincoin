// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title GuardianModule
/// @notice Guardian logic delegated to an account via EIP-7702. Executed in the
///         account's context: `address(this)` == the protected account, which holds
///         the funds. Configuration is restricted to the account itself; emergency
///         actions are open to the account or the bounded keeper. Funds only ever
///         move to the registered `safeVault`.
contract GuardianModule {
    address public safeVault;
    address public keeper;
    bool public configured;
    uint256 private _locked; // reentrancy guard (0 = free, 1 = busy)

    event Configured(address indexed safeVault, address indexed keeper);

    error NotAuthorized();
    error ZeroAddress();

    /// @dev Only the account itself (self-call, including via a 7702 UserOp) can configure.
    modifier onlySelf() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }

    /// @dev Reconfiguration by the account itself is intentional (the account is
    ///      the ultimate authority); intent verification is left to the signing/UX layer.
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

    /// @notice Sweeps the entire balance of each token to the safeVault.
    /// @dev EMERGENCY path: a token that reverts (blacklist, pause, malicious token)
    ///      is SKIPPED (EvacuationFailed event) instead of blocking the whole evacuation.
    ///      A keeper that calls again afterwards is a no-op (zero balances): intentional.
    function evacuateERC20(address[] calldata tokens) external onlySelfOrKeeper nonReentrant {
        if (!configured) revert NotConfigured();
        address vault_ = safeVault; // cache: a single SLOAD, immutable during the loop
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
            // SafeERC20 semantics: success if call ok AND (no return value [USDT] OR returns true).
            if (ok && (ret.length == 0 || (ret.length >= 32 && abi.decode(ret, (bool))))) {
                emit Evacuated(tokens[i], bal);
            } else {
                emit EvacuationFailed(tokens[i]);
            }
        }
    }

    event ApprovalRevoked(address indexed token, address indexed spender);
    event ApprovalRevokeFailed(address indexed token, address indexed spender);

    error LengthMismatch();

    /// @notice Resets the given allowances to zero.
    /// @dev EMERGENCY path, symmetric to evacuateERC20: a pair that fails
    ///      (toxic token, address with no code) is SKIPPED (ApprovalRevokeFailed event)
    ///      instead of blocking the batch. Deliberately NO `configured` guard:
    ///      cutting an allowance is a defensive action with no fund movement,
    ///      useful even before the vault is configured.
    function revokeApprovals(address[] calldata tokens, address[] calldata spenders)
        external
        onlySelfOrKeeper
        nonReentrant
    {
        if (tokens.length != spenders.length) revert LengthMismatch();
        for (uint256 i; i < tokens.length; ++i) {
            if (tokens[i].code.length == 0) {
                emit ApprovalRevokeFailed(tokens[i], spenders[i]);
                continue;
            }
            (bool ok, bytes memory ret) =
                tokens[i].call(abi.encodeCall(IERC20.approve, (spenders[i], 0)));
            // SafeERC20 semantics: success if call ok AND (no return value [USDT] OR returns true).
            if (ok && (ret.length == 0 || (ret.length >= 32 && abi.decode(ret, (bool))))) {
                emit ApprovalRevoked(tokens[i], spenders[i]);
            } else {
                emit ApprovalRevokeFailed(tokens[i], spenders[i]);
            }
        }
    }
}
