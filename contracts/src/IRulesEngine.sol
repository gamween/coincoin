// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRulesEngine
/// @notice Stateless risk scorer for an outgoing account call. Kept pure (context passed in
///         via calldata, no storage) so a Stylus (Rust/WASM) implementation can drop in behind
///         the same ABI later without changing the GuardianModule.
interface IRulesEngine {
    /// @param to    target of the outgoing call
    /// @param value native value attached
    /// @param data  calldata of the outgoing call
    /// @return score    risk score, 0 = clean (the guardian blocks at/above its threshold)
    /// @return spender  the approval target the rule flagged, or address(0) — lets the guardian
    ///                  honour a per-account trustlist before blocking
    function score(address to, uint256 value, bytes calldata data)
        external
        view
        returns (uint16 score, address spender);
}
