// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRulesEngine} from "./IRulesEngine.sol";

/// @title RulesEngineV1
/// @notice Deterministic, stateless detector for the most common wallet-drain pattern: a
///         blanket token approval to an attacker's sweeper. It flags the four selectors a
///         drainer reaches for to grant itself spending power:
///           - `approve(spender, amount)`           with amount >= the "infinite" ceiling
///           - `increaseAllowance(spender, added)`  with added  >= the ceiling
///           - `permit(owner, spender, value, ...)` with value  >= the ceiling (EIP-2612)
///           - `setApprovalForAll(operator, true)`  (blanket NFT approval)
///         and returns the flagged spender so the GuardianModule can honour a per-account
///         trustlist before blocking. It does NOT catch Permit2, multicall/batched calls,
///         direct `transfer`/`transferFrom`, or a sub-ceiling approve — those are roadmap.
contract RulesEngineV1 is IRulesEngine {
    bytes4 internal constant APPROVE = 0x095ea7b3; // approve(address,uint256)
    bytes4 internal constant INCREASE_ALLOWANCE = 0x39509351; // increaseAllowance(address,uint256)
    bytes4 internal constant PERMIT = 0xd505accf; // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    bytes4 internal constant SET_APPROVAL_FOR_ALL = 0xa22cb465; // setApprovalForAll(address,bool)

    /// @dev "Infinite" ceiling: any allowance at or above `type(uint128).max` (~3.4e38) is far
    ///      beyond any real token's supply, so it captures the de-facto infinite-approval values
    ///      (`type(uint256).max`, `2^256-1`, `2^200`, …) without flagging normal amounts. Approvals
    ///      between a realistic max and this ceiling are intentionally allowed (documented limit).
    uint256 internal constant UNLIMITED = type(uint128).max;

    uint16 public constant DANGER = 100;

    function score(address, uint256, bytes calldata data)
        external
        pure
        returns (uint16, address)
    {
        if (data.length < 68) return (0, address(0)); // < selector + 2 words: nothing to flag
        bytes4 sel = bytes4(data[:4]);

        if (sel == SET_APPROVAL_FOR_ALL) {
            (address operator, bool approved) = abi.decode(data[4:68], (address, bool));
            return approved ? (DANGER, operator) : (0, address(0));
        }

        if (sel == APPROVE || sel == INCREASE_ALLOWANCE) {
            (address spender, uint256 amount) = abi.decode(data[4:68], (address, uint256));
            return amount >= UNLIMITED ? (DANGER, spender) : (0, address(0));
        }

        if (sel == PERMIT && data.length >= 4 + 7 * 32) {
            // owner, spender, value, (deadline, v, r, s) — read the first three static words.
            (, address spender, uint256 value) = abi.decode(data[4:100], (address, address, uint256));
            return value >= UNLIMITED ? (DANGER, spender) : (0, address(0));
        }

        return (0, address(0));
    }
}
