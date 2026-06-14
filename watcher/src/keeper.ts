import { encodeFunctionData, type WalletClient } from "viem";
import { guardianAbi } from "./abi";

/// Waits for the tx to land and reports its status (subset of viem's PublicClient).
export interface ReceiptConfirmer {
  waitForTransactionReceipt(args: { hash: `0x${string}` }): Promise<{ status: "success" | "reverted" }>;
}

/// Triggers the emergency actions. The keeper calls the function ON THE PROTECTED
/// ACCOUNT'S ADDRESS (delegated via 7702): the GuardianModule code then runs in the
/// account's context, and `msg.sender == keeper` satisfies `onlySelfOrKeeper`.
export class KeeperClient {
  /// `gas`: explicit limit for Orbit chains (see ORBIT_TX_GAS). `confirmer`: when provided,
  /// each action waits for its receipt and throws if the tx reverted — so a logged success
  /// genuinely means the rescue landed on-chain.
  constructor(
    private readonly wallet: Pick<WalletClient, "sendTransaction">,
    private readonly gas?: bigint,
    private readonly confirmer?: ReceiptConfirmer,
  ) {}

  private async send(victim: `0x${string}`, data: `0x${string}`): Promise<`0x${string}`> {
    const tx = { to: victim, data, ...(this.gas !== undefined ? { gas: this.gas } : {}) };
    const hash = (await this.wallet.sendTransaction(tx as any)) as `0x${string}`;
    if (this.confirmer) {
      const receipt = await this.confirmer.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(`tx ${hash} reverted`);
    }
    return hash;
  }

  async evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`> {
    return this.send(victim, encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] }));
  }

  /// Pulls the account's deposited Aave V3 position back to the account (the underlying
  /// then sits at rest and is swept by `evacuate`). Same target discipline as evacuate:
  /// the tx goes to the delegated account, so the guardian code runs in its context.
  async exitAaveV3(
    victim: `0x${string}`,
    pool: `0x${string}`,
    underlyings: `0x${string}`[],
  ): Promise<`0x${string}`> {
    return this.send(victim, encodeFunctionData({ abi: guardianAbi, functionName: "exitAaveV3", args: [pool, underlyings] }));
  }
}
