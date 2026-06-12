import "dotenv/config";
import {
  createWalletClient, createPublicClient, http, encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, GUARDIAN_IMPL } from "../src/config";
import { KeeperClient } from "../src/keeper";
import { runWatcher } from "../src/watcher";
import { MockThreatSource } from "../src/sources";
import type { ProtectedAccount } from "../src/registry";

/// ⚠️ Démo réelle, nécessite dans .env : ARBITRUM_SEPOLIA_RPC, VICTIM_PRIVATE_KEY,
/// KEEPER_PRIVATE_KEY, et les adresses imprimées par SetupDemo (TOKEN, PROTO, VAULT).
const RPC = process.env.ARBITRUM_SEPOLIA_RPC!;
const TOKEN = process.env.DEMO_TOKEN as `0x${string}`;
const PROTO = process.env.DEMO_PROTO as `0x${string}`;
const VAULT = process.env.DEMO_VAULT as `0x${string}`;

const victim = privateKeyToAccount(process.env.VICTIM_PRIVATE_KEY as `0x${string}`);
const keeper = privateKeyToAccount(process.env.KEEPER_PRIVATE_KEY as `0x${string}`);

const transport = http(RPC);
const pub = createPublicClient({ chain: arbitrumSepolia, transport });
const victimWallet = createWalletClient({ account: victim, chain: arbitrumSepolia, transport });
const keeperWallet = createWalletClient({ account: keeper, chain: arbitrumSepolia, transport });

async function main() {
  console.log("1) Délégation EIP-7702 de la victime vers GuardianModule…");
  // viem 2.52 : signAuthorization est une action wallet par défaut. executor:"self"
  // est REQUIS ici car la victime signe ET envoie elle-même la tx (le nonce
  // d'autorisation = nonce du compte + 1). Voir https://viem.sh/docs/eip7702.
  const auth = await victimWallet.signAuthorization({
    account: victim,
    contractAddress: GUARDIAN_IMPL,
    executor: "self",
  });
  const configureData = encodeFunctionData({
    abi: [{ type: "function", name: "configure", stateMutability: "nonpayable",
            inputs: [{ name: "safeVault_", type: "address" }, { name: "keeper_", type: "address" }], outputs: [] }],
    functionName: "configure",
    args: [VAULT, keeper.address],
  });
  // Self-call : la victime s'envoie le configure (msg.sender == address(this) == victim).
  const delegTx = await victimWallet.sendTransaction({
    to: victim.address, data: configureData, authorizationList: [auth],
  } as any);
  await pub.waitForTransactionReceipt({ hash: delegTx });
  console.log("   ✅ délégué + configuré:", delegTx);

  const balBefore = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [victim.address] });
  const vaultBefore = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [VAULT] });
  console.log(`   Victime au repos: ${balBefore} | Vault: ${vaultBefore}`);

  console.log("2) L'attaquant draine le protocole (vrai exploit on-chain)…");
  const exploitData = encodeFunctionData({
    abi: [{ type: "function", name: "emergencyWithdraw", stateMutability: "nonpayable", inputs: [], outputs: [] }],
    functionName: "emergencyWithdraw", args: [],
  });
  const exploitTx = await keeperWallet.sendTransaction({ to: PROTO, data: exploitData } as any);
  const exploitReceipt = await pub.waitForTransactionReceipt({ hash: exploitTx });
  console.log("   💥 exploit:", exploitTx);

  console.log("3) coincoin détecte et évacue les fonds AU REPOS de la victime…");
  const account: ProtectedAccount = {
    address: victim.address, safeVault: VAULT, watchedProtocols: [PROTO], tokens: [TOKEN],
  };
  const keeperClient = new KeeperClient(keeperWallet);
  // Le signal vient du VRAI exploit (mêmes adresse/tx), transporté au schéma Defimon.
  await runWatcher({
    source: new MockThreatSource([{
      network: "arbitrum", severity: "CRITICAL", attack_type: "drain",
      transaction_hash: exploitReceipt.transactionHash,
      exploit_address: PROTO.toLowerCase() as `0x${string}`,
      attacker_address: keeper.address.toLowerCase() as `0x${string}`,
      block_number: Number(exploitReceipt.blockNumber),
    }]),
    accounts: [account],
    keeper: keeperClient,
  });

  // Laisser le temps à la tx d'évacuation d'être minée.
  await new Promise((r) => setTimeout(r, 4000));
  const balAfter = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [victim.address] });
  const vaultAfter = await pub.readContract({ address: TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [VAULT] });
  console.log(`4) Résultat — Victime au repos: ${balAfter} (était ${balBefore}) | Vault: ${vaultAfter} (était ${vaultBefore})`);
  console.log(balAfter === 0n ? "   🦆 Fonds au sec dans le coffre." : "   ⚠️ évacuation incomplète, voir traces.");
}

const erc20Abi = [{ type: "function", name: "balanceOf", stateMutability: "view",
  inputs: [{ name: "a", type: "address" }], outputs: [{ name: "", type: "uint256" }] }] as const;

main().catch((e) => { console.error(e); process.exit(1); });
