// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRulesEngine} from "./IRulesEngine.sol";

/// @dev Minimal Aave V3 Pool surface used by the DeFi-position exit. The real Pool
///      (mainnet 0x794a61358D6845594F94dc1DB02A252b5b4814aD) matches this ABI;
///      `amount == type(uint256).max` withdraws the full position.
interface IAaveV3Pool {
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

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

    // Local firewall (proactive layer): outgoing calls routed through execute() are scored by
    // the rules engine and reverted at the account level when a drain pattern is flagged.
    address public rulesEngine;
    uint16 public blockThreshold; // 0 = firewall off; otherwise block at/above this score
    mapping(address => bool) public trustedSpender;

    event Configured(address indexed safeVault, address indexed keeper);

    error NotAuthorized();
    error ZeroAddress();
    error VaultLocked();

    /// @dev Only the account itself (self-call, including via a 7702 UserOp) can configure.
    modifier onlySelf() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }

    /// @notice First call sets the safe vault (the trust anchor) and the keeper.
    /// @dev The destination vault is FROZEN on first configure: under EIP-7702 "self" is
    ///      the very EOA whose key the firewall exists to defend, so allowing a later
    ///      self-call to re-point the vault would let a leaked key redirect funds to an
    ///      attacker (turning "worst case = annoyance" into theft). Keeper rotation stays
    ///      open (pass the same safeVault with a new keeper); a different vault reverts.
    function configure(address safeVault_, address keeper_) external onlySelf {
        if (safeVault_ == address(0) || keeper_ == address(0)) revert ZeroAddress();
        if (configured) {
            if (safeVault_ != safeVault) revert VaultLocked();
        } else {
            safeVault = safeVault_;
            configured = true;
        }
        keeper = keeper_;
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

    event Exited(address indexed pool, address indexed asset, uint256 amount);
    event ExitFailed(address indexed pool, address indexed asset);

    /// @notice Pulls the account's full deposited position for each underlying out of an
    ///         Aave V3 pool, back into the account. The freed underlying then sits at rest
    ///         on the account and is swept to the safeVault by evacuateERC20 — the
    ///         "Harpie blind spot": funds DEPOSITED in a protocol, not just at rest.
    /// @dev BOUNDED surface: the only effect is `Pool.withdraw(asset, max, address(this))`,
    ///      so the keeper can only un-deposit your own funds back to your own account —
    ///      never to an arbitrary address. The pool is a plain external callee (CALL, not
    ///      delegatecall) and is granted no allowance, so passing a hostile pool address is
    ///      inert. EMERGENCY path: a pool/asset that reverts is SKIPPED (ExitFailed) instead
    ///      of blocking the batch.
    function exitAaveV3(address pool, address[] calldata underlyings)
        external
        onlySelfOrKeeper
        nonReentrant
    {
        if (!configured) revert NotConfigured();
        for (uint256 i; i < underlyings.length; ++i) {
            (bool ok, bytes memory ret) = pool.call(
                abi.encodeCall(IAaveV3Pool.withdraw, (underlyings[i], type(uint256).max, address(this)))
            );
            if (ok) {
                uint256 amount = ret.length >= 32 ? abi.decode(ret, (uint256)) : 0;
                emit Exited(pool, underlyings[i], amount);
            } else {
                emit ExitFailed(pool, underlyings[i]);
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

    // ─── Local firewall: proactive, account-level blocking of obvious drains ───

    event RulesConfigured(address indexed rulesEngine, uint16 threshold);
    event SpenderTrusted(address indexed spender, bool trusted);
    event Blocked(address indexed to, uint16 score, address indexed spender);
    event Executed(address indexed to, uint256 value);

    error CallBlocked(uint16 score, address spender);

    /// @notice Configure the local rules engine + the score at which a call is blocked.
    /// @dev threshold == 0 turns the firewall off. The engine is a stateless scorer (an
    ///      IRulesEngine; a Stylus impl can drop in behind the same ABI later).
    function setRules(address rulesEngine_, uint16 threshold_) external onlySelf {
        rulesEngine = rulesEngine_;
        blockThreshold = threshold_;
        emit RulesConfigured(rulesEngine_, threshold_);
    }

    /// @notice Allowlist a spender so a deliberate approval to a contract you trust isn't blocked.
    function trustSpender(address spender, bool trusted) external onlySelf {
        trustedSpender[spender] = trusted;
        emit SpenderTrusted(spender, trusted);
    }

    /// @notice Route an outgoing call through the firewall. A flagged drain pattern (e.g. an
    ///         unlimited approval / blanket NFT approval to an untrusted spender) reverts at the
    ///         account level — the malicious signature never lands.
    /// @dev onlySelf: this is the account's OWN execution entrypoint (EIP-7702 / 4337 style), so
    ///      it grants the keeper nothing and adds no surface the EOA didn't already have — it only
    ///      interposes the rules check. Protection holds for calls ROUTED THROUGH here; a direct
    ///      top-level EOA tx bypasses it (opt-in per call). `value` is funded from the account's own
    ///      balance (it need not equal msg.value). NOTE: rulesEngine/trustedSpender are NOT reset on
    ///      re-delegation — call setRules after delegating to a fresh GuardianModule.
    function execute(address to, uint256 value, bytes calldata data)
        external
        payable
        onlySelf
        nonReentrant
        returns (bytes memory)
    {
        if (blockThreshold != 0 && rulesEngine != address(0)) {
            (uint16 s, address spender) = IRulesEngine(rulesEngine).score(to, value, data);
            if (s >= blockThreshold && !(spender != address(0) && trustedSpender[spender])) {
                emit Blocked(to, s, spender);
                revert CallBlocked(s, spender);
            }
        }
        (bool ok, bytes memory ret) = to.call{value: value}(data);
        if (!ok) {
            assembly {
                revert(add(ret, 0x20), mload(ret))
            }
        }
        emit Executed(to, value);
        return ret;
    }
}
