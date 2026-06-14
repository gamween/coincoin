// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {RulesEngineV1} from "../src/RulesEngineV1.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract RulesEngineV1Test is Test {
    RulesEngineV1 engine;
    address token = address(0x7011);
    address spender = address(0x5DEADE);

    function setUp() public {
        engine = new RulesEngineV1();
    }

    function _approve(address s, uint256 amount) internal pure returns (bytes memory) {
        return abi.encodeCall(IERC20.approve, (s, amount));
    }

    function _setApprovalForAll(address op, bool ok) internal pure returns (bytes memory) {
        return abi.encodeWithSignature("setApprovalForAll(address,bool)", op, ok);
    }

    function test_FlagsUnlimitedApprove() public view {
        (uint16 s, address sp) = engine.score(token, 0, _approve(spender, type(uint256).max));
        assertEq(s, engine.DANGER());
        assertEq(sp, spender);
    }

    function test_AllowsLimitedApprove() public view {
        (uint16 s, address sp) = engine.score(token, 0, _approve(spender, 1_000e18));
        assertEq(s, 0);
        assertEq(sp, address(0));
    }

    function test_FlagsSetApprovalForAll() public view {
        (uint16 s, address sp) = engine.score(token, 0, _setApprovalForAll(spender, true));
        assertEq(s, engine.DANGER());
        assertEq(sp, spender);
    }

    function test_AllowsRevokeApprovalForAll() public view {
        (uint16 s,) = engine.score(token, 0, _setApprovalForAll(spender, false));
        assertEq(s, 0);
    }

    function test_AllowsPlainTransfer() public view {
        (uint16 s,) = engine.score(token, 0, abi.encodeCall(IERC20.transfer, (spender, 1e18)));
        assertEq(s, 0);
    }

    function test_AllowsEmptyData() public view {
        (uint16 s,) = engine.score(token, 1 ether, "");
        assertEq(s, 0);
    }

    function test_FlagsUnlimitedIncreaseAllowance() public view {
        bytes memory data =
            abi.encodeWithSignature("increaseAllowance(address,uint256)", spender, type(uint256).max);
        (uint16 s, address sp) = engine.score(token, 0, data);
        assertEq(s, engine.DANGER());
        assertEq(sp, spender);
    }

    function test_FlagsUnlimitedPermit() public view {
        bytes memory data = abi.encodeWithSignature(
            "permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
            address(0xDEAD),
            spender,
            type(uint256).max,
            uint256(0),
            uint8(0),
            bytes32(0),
            bytes32(0)
        );
        (uint16 s, address sp) = engine.score(token, 0, data);
        assertEq(s, engine.DANGER());
        assertEq(sp, spender);
    }

    function test_FlagsHugeApproveAboveCeiling() public view {
        (uint16 s,) = engine.score(token, 0, _approve(spender, 2 ** 200)); // attacker's "not quite max"
        assertEq(s, engine.DANGER());
    }

    function test_AllowsApproveBelowCeiling() public view {
        (uint16 s,) = engine.score(token, 0, _approve(spender, uint256(type(uint128).max) - 1));
        assertEq(s, 0);
    }
}

contract GuardianExecuteTest is Test {
    GuardianModule guardian;
    RulesEngineV1 engine;
    MockERC20 token;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);
    address drainer = address(0xBAD);
    address recipient = address(0x9EC0);

    function setUp() public {
        guardian = new GuardianModule();
        engine = new RulesEngineV1();
        token = new MockERC20("Dollar", "dUSD");
        token.mint(address(guardian), 1_000e18);
        vm.startPrank(address(guardian));
        guardian.configure(vault, keeper);
        guardian.setRules(address(engine), engine.DANGER()); // block at score >= 100
        vm.stopPrank();
    }

    function test_BlocksUnlimitedApproveToUntrustedSpender() public {
        bytes memory data = abi.encodeCall(IERC20.approve, (drainer, type(uint256).max));
        vm.prank(address(guardian));
        vm.expectRevert(abi.encodeWithSelector(GuardianModule.CallBlocked.selector, 100, drainer));
        guardian.execute(address(token), 0, data);
        assertEq(token.allowance(address(guardian), drainer), 0); // approval never landed
    }

    function test_BlocksBlanketNftApproval() public {
        bytes memory data = abi.encodeWithSignature("setApprovalForAll(address,bool)", drainer, true);
        vm.prank(address(guardian));
        vm.expectRevert(abi.encodeWithSelector(GuardianModule.CallBlocked.selector, 100, drainer));
        guardian.execute(address(0xC0FFEE), 0, data);
    }

    function test_AllowsUnlimitedApproveToTrustedSpender() public {
        address dex = address(0x0E0); // a contract the user trusts
        vm.prank(address(guardian));
        guardian.trustSpender(dex, true);

        bytes memory data = abi.encodeCall(IERC20.approve, (dex, type(uint256).max));
        vm.prank(address(guardian));
        guardian.execute(address(token), 0, data);
        assertEq(token.allowance(address(guardian), dex), type(uint256).max);
    }

    function test_AllowsCleanTransfer() public {
        bytes memory data = abi.encodeCall(IERC20.transfer, (recipient, 250e18));
        vm.prank(address(guardian));
        guardian.execute(address(token), 0, data);
        assertEq(token.balanceOf(recipient), 250e18);
    }

    function test_FirewallOffForwardsEverything() public {
        GuardianModule g = new GuardianModule();
        MockERC20 t = new MockERC20("A", "A");
        t.mint(address(g), 1e18);
        vm.startPrank(address(g));
        g.configure(vault, keeper); // no setRules → threshold 0 → firewall off
        bytes memory data = abi.encodeCall(IERC20.approve, (drainer, type(uint256).max));
        g.execute(address(t), 0, data);
        vm.stopPrank();
        assertEq(t.allowance(address(g), drainer), type(uint256).max);
    }

    function test_OnlySelfCanExecute() public {
        bytes memory data = abi.encodeCall(IERC20.transfer, (recipient, 1e18));
        vm.prank(keeper); // the keeper has no execute power
        vm.expectRevert(GuardianModule.NotAuthorized.selector);
        guardian.execute(address(token), 0, data);
    }

    function test_ExecuteBubblesUnderlyingRevert() public {
        // transfer more than the balance → the token reverts; execute bubbles the exact reason.
        bytes memory data = abi.encodeCall(IERC20.transfer, (recipient, 10_000e18));
        vm.prank(address(guardian));
        vm.expectRevert(
            abi.encodeWithSignature(
                "ERC20InsufficientBalance(address,uint256,uint256)",
                address(guardian),
                uint256(1_000e18),
                uint256(10_000e18)
            )
        );
        guardian.execute(address(token), 0, data);
    }
}

/// @notice The headline: a real EOA delegated to the GuardianModule routes a malicious
///         setApprovalForAll through execute — and it reverts at the account level.
contract Guardian7702FirewallTest is Test {
    GuardianModule impl;
    RulesEngineV1 engine;
    address vault = address(0xFA17);
    address keeper = address(0xCEEE);
    address drainer = address(0xBAD);

    uint256 userPk = 0xA11CE;
    address user;

    function setUp() public {
        impl = new GuardianModule();
        engine = new RulesEngineV1();
        user = vm.addr(userPk);
    }

    function test_DelegatedEoaBlocksMaliciousApprovalForAll() public {
        vm.signAndAttachDelegation(address(impl), userPk);
        vm.startPrank(user);
        GuardianModule(user).configure(vault, keeper);
        GuardianModule(user).setRules(address(engine), engine.DANGER());

        bytes memory data = abi.encodeWithSignature("setApprovalForAll(address,bool)", drainer, true);
        vm.expectRevert(abi.encodeWithSelector(GuardianModule.CallBlocked.selector, 100, drainer));
        GuardianModule(user).execute(address(0xC0FFEE), 0, data);
        vm.stopPrank();
    }
}
