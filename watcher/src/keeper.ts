import { encodeFunctionData, type WalletClient } from "viem";
import { guardianAbi } from "./abi";

/// Déclenche les actions d'urgence. Le keeper appelle la fonction SUR L'ADRESSE DU COMPTE
/// PROTÉGÉ (délégué via 7702) : le code GuardianModule s'exécute alors dans le contexte du
/// compte, et `msg.sender == keeper` satisfait `onlySelfOrKeeper`.
export class KeeperClient {
  constructor(private readonly wallet: Pick<WalletClient, "sendTransaction">) {}

  async evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`> {
    const data = encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] });
    return (await this.wallet.sendTransaction({ to: victim, data } as any)) as `0x${string}`;
  }
}
