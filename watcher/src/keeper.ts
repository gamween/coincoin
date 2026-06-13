import { encodeFunctionData, type WalletClient } from "viem";
import { guardianAbi } from "./abi";

/// Déclenche les actions d'urgence. Le keeper appelle la fonction SUR L'ADRESSE DU COMPTE
/// PROTÉGÉ (délégué via 7702) : le code GuardianModule s'exécute alors dans le contexte du
/// compte, et `msg.sender == keeper` satisfait `onlySelfOrKeeper`.
export class KeeperClient {
  /// `gas` optionnel : limite explicite pour les chaînes Orbit (cf. ORBIT_TX_GAS).
  constructor(
    private readonly wallet: Pick<WalletClient, "sendTransaction">,
    private readonly gas?: bigint,
  ) {}

  async evacuate(victim: `0x${string}`, tokens: `0x${string}`[]): Promise<`0x${string}`> {
    const data = encodeFunctionData({ abi: guardianAbi, functionName: "evacuateERC20", args: [tokens] });
    const tx = { to: victim, data, ...(this.gas !== undefined ? { gas: this.gas } : {}) };
    return (await this.wallet.sendTransaction(tx as any)) as `0x${string}`;
  }
}
