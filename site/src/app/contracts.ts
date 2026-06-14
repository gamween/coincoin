import { robinhood } from "./chain";

export const EXPLORER = robinhood.blockExplorers.default.url;

/// On-chain addresses on Robinhood Chain Testnet (deployments/robinhood-testnet.json).
/// The guardian *storage* lives at each protected EOA (it's a 7702 delegate), so the app
/// reads the guardian view functions at the connected address — not at the impl address.
export const ADDR = {
  /// GuardianModule implementation (the 7702 delegate target).
  guardianImpl: "0xd0d301Aeaa7AA5Ced16C927030f131c9Cb083b77",
  /// Demo dUSD token used in the end-to-end scenario.
  token: "0xC32C2eB815F1413ee2c7A68d2EFf3760d828841E",
  /// RulesEngineV1 — deploy on Robinhood (script/DeployRules.s.sol) and set its address as
  /// VITE_RULES_ENGINE to enable the firewall controls. Empty = the Enable button stays off.
  rulesEngine: ((import.meta.env.VITE_RULES_ENGINE as string | undefined) ?? "") as `0x${string}` | "",
} as const;

export const guardianAbi = [
  { type: "function", name: "configured", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "safeVault", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "keeper", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "rulesEngine", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "blockThreshold", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  {
    type: "function",
    name: "trustedSpender",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "evacuateERC20",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokens", type: "address[]" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setRules",
    stateMutability: "nonpayable",
    inputs: [
      { name: "rulesEngine_", type: "address" },
      { name: "threshold_", type: "uint16" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "trustSpender",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "trusted", type: "bool" },
    ],
    outputs: [],
  },
] as const;

export const safeVaultAbi = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "function",
    name: "withdrawERC20",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;
