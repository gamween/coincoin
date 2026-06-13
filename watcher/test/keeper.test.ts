import { describe, it, expect, vi } from "vitest";
import { encodeFunctionData } from "viem";
import { KeeperClient } from "../src/keeper";
import { guardianAbi } from "../src/abi";

describe("KeeperClient.evacuate", () => {
  it("sends evacuateERC20(tokens) to the protected account address", async () => {
    const sendTransaction = vi.fn().mockResolvedValue("0xhash");
    const fakeWallet = { sendTransaction } as any;
    const keeper = new KeeperClient(fakeWallet);

    const victim = "0x1111111111111111111111111111111111111111" as const;
    const tokens = ["0xcccc000000000000000000000000000000000000"] as `0x${string}`[];

    const hash = await keeper.evacuate(victim, tokens);

    expect(hash).toBe("0xhash");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
    const arg = sendTransaction.mock.calls[0][0];
    expect(arg.to).toBe(victim); // ⚠️ the target is the delegated account, NOT the impl
    expect(arg.data).toBe(
      encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] }),
    );
  });
});

describe("KeeperClient.exitAaveV3", () => {
  it("sends exitAaveV3(pool, underlyings) to the protected account address", async () => {
    const sendTransaction = vi.fn().mockResolvedValue("0xhash");
    const keeper = new KeeperClient({ sendTransaction } as any);

    const victim = "0x1111111111111111111111111111111111111111" as const;
    const pool = "0xaaaa0000000000000000000000000000000000a7" as `0x${string}`;
    const underlyings = ["0xcccc000000000000000000000000000000000000"] as `0x${string}`[];

    const hash = await keeper.exitAaveV3(victim, pool, underlyings);

    expect(hash).toBe("0xhash");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
    const arg = sendTransaction.mock.calls[0][0];
    expect(arg.to).toBe(victim); // target is the delegated account (guardian runs in its context)
    expect(arg.data).toBe(
      encodeFunctionData({ abi: guardianAbi, functionName: "exitAaveV3", args: [pool, underlyings] }),
    );
  });
});
