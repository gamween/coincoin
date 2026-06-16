import { useCallback, useState } from "react";
import { useConnectorClient, usePublicClient } from "wagmi";
import { readContract, signTypedData, signAuthorization, waitForTransactionReceipt } from "viem/actions";
import { ADDR, factoryAbi } from "./contracts";
import { robinhood } from "./chain";

export type OnboardStatus = "idle" | "signing" | "relaying" | "done" | "error";

/// Gasless in-browser onboarding: the wallet signs (off-chain, no gas) an EIP-712 Policy and an
/// EIP-7702 authorization; the relayer (/api/onboard) deploys the user's deterministic SafeVault and
/// submits the sponsored delegate+configure transaction. Falls back to the CLI if the wallet can't
/// sign an EIP-7702 authorization yet.
export function useGaslessOnboard(onDone?: () => void) {
  const { data: walletClient } = useConnectorClient();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<OnboardStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const onboard = useCallback(async () => {
    setError(null);
    if (!walletClient?.account || !publicClient) {
      setError("Connect a wallet on Robinhood Chain first.");
      setStatus("error");
      return;
    }
    const owner = walletClient.account.address;
    try {
      setStatus("signing");
      const vault = await readContract(publicClient, {
        address: ADDR.factory,
        abi: factoryAbi,
        functionName: "vaultOf",
        args: [owner],
      });
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // 1) EIP-712 Policy (standard signTypedData)
      const sig = await signTypedData(walletClient, {
        account: walletClient.account,
        domain: { name: "coincoin GuardianModule", version: "1", chainId: robinhood.id, verifyingContract: owner },
        types: {
          Policy: [
            { name: "safeVault", type: "address" },
            { name: "keepers", type: "address[]" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "Policy",
        message: { safeVault: vault, keepers: [ADDR.keeper], nonce: 0n, deadline },
      });

      // 2) EIP-7702 authorization (wallet-support dependent → CLI fallback)
      let auth;
      try {
        auth = await signAuthorization(walletClient, {
          account: walletClient.account,
          contractAddress: ADDR.guardianImpl,
          chainId: robinhood.id,
          nonce: 0,
        });
      } catch {
        setError("This wallet can't sign an EIP-7702 authorization yet. Use the CLI: `pnpm onboard`.");
        setStatus("error");
        return;
      }

      // 3) relayer submits (pays gas)
      setStatus("relaying");
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner,
          authorization: { address: auth.address, chainId: auth.chainId, nonce: auth.nonce, r: auth.r, s: auth.s, yParity: auth.yParity },
          policy: { safeVault: vault, keepers: [ADDR.keeper] },
          nonce: "0",
          deadline: deadline.toString(),
          sig,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; txHash?: `0x${string}`; error?: string };
      if (!res.ok || !json.txHash) throw new Error(json.error ?? "relayer error");
      await waitForTransactionReceipt(publicClient, { hash: json.txHash });
      setStatus("done");
      onDone?.();
    } catch (e) {
      setError((e as Error).message ?? "onboarding failed");
      setStatus("error");
    }
  }, [walletClient, publicClient, onDone]);

  return { onboard, status, error };
}
