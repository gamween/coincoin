import { encodeFunctionData, type WalletClient } from "viem";
import { guardianAbi } from "./abi";

/// Triggers the emergency actions. The keeper calls the function ON THE PROTECTED
/// ACCOUNT'S ADDRESS (delegated via 7702): the GuardianModule code then runs in the
/// account's context, and `msg.sender == keeper` satisfies `onlySelfOrKeeper`.
export class KeeperClient {
  /// `gas` optional: explicit limit for Orbit chains (see ORBIT_TX_GAS).
  constructor(
    private readonly wallet: Pick<WalletClient, "sendTransaction">,
    private readonly gas?: bigint,
  ) {}

  async evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`> {
    const data = encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] });
    const tx = { to: victim, data, ...(this.gas !== undefined ? { gas: this.gas } : {}) };
    return (await this.wallet.sendTransaction(tx as any)) as `0x${string}`;
  }

  /// Pulls the account's deposited Aave V3 position back to the account (the underlying
  /// then sits at rest and is swept by `evacuate`). Same target discipline as evacuate:
  /// the tx goes to the delegated account, so the guardian code runs in its context.
  async exitAaveV3(
    victim: `0x${string}`,
    pool: `0x${string}`,
    underlyings: `0x${string}`[],
  ): Promise<`0x${string}`> {
    const data = encodeFunctionData({ abi: guardianAbi, functionName: "exitAaveV3", args: [pool, underlyings] });
    const tx = { to: victim, data, ...(this.gas !== undefined ? { gas: this.gas } : {}) };
    return (await this.wallet.sendTransaction(tx as any)) as `0x${string}`;
  }
}
