// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAaveV3PoolSupply {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
}

/// @notice Proof that exitAaveV3 works against the REAL Aave V3 — not just MockAavePool.
///         Forks Arbitrum One, supplies real WETH into the canonical Aave V3 Pool from the
///         account, then exits the position through the guardian. Self-skips when
///         ARBITRUM_ONE_RPC is unset, so the normal suite stays green without a fork.
///
///         Run: ARBITRUM_ONE_RPC=<arbitrum-mainnet-rpc> forge test --match-contract AaveRealFork -vv
contract AaveRealForkTest is Test {
    // Canonical Aave V3 on Arbitrum One.
    address constant AAVE_POOL = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    address constant WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;

    function test_ExitRealAaveV3OnArbitrumOne() public {
        string memory rpc = vm.envOr("ARBITRUM_ONE_RPC", string(""));
        if (bytes(rpc).length == 0) {
            emit log("ARBITRUM_ONE_RPC unset - skipping real-Aave fork test");
            vm.skip(true);
            return;
        }
        vm.createSelectFork(rpc);

        GuardianModule guardian = new GuardianModule();
        address keeper = address(0xCEEE);
        address vault = address(0xFA17);
        uint256 amount = 1 ether; // 1 WETH

        // The account (== address(guardian) under 7702) deposits into the REAL Aave pool.
        deal(WETH, address(guardian), amount);
        vm.startPrank(address(guardian));
        IERC20(WETH).approve(AAVE_POOL, type(uint256).max);
        IAaveV3PoolSupply(AAVE_POOL).supply(WETH, amount, address(guardian), 0);
        guardian.configure(vault, keeper);
        vm.stopPrank();

        // After supply, the idle WETH is gone — it's now an aWETH position inside Aave.
        assertEq(IERC20(WETH).balanceOf(address(guardian)), 0, "WETH should be deposited");

        // The keeper exits the position through the guardian — against the REAL Aave Pool.
        address[] memory underlyings = new address[](1);
        underlyings[0] = WETH;
        vm.prank(keeper);
        guardian.exitAaveV3(AAVE_POOL, underlyings);

        // The full WETH position came back to the account (same block → ~no interest).
        assertApproxEqAbs(IERC20(WETH).balanceOf(address(guardian)), amount, 1e10, "position not returned");
    }
}
