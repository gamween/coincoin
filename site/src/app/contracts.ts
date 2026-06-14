import { robinhood } from "./chain";

export const EXPLORER = robinhood.blockExplorers.default.url;

/// On-chain addresses on Robinhood Chain Testnet (deployments/robinhood-testnet.json).
/// The guardian *storage* lives at each protected EOA (it's a 7702 delegate), so the app
/// reads the guardian view functions at the connected address — not at the impl address.
export const ADDR = {
  /// GuardianModule implementation (the 7702 delegate target).
  guardianImpl: "0x6671b4B73b79c284A710B00ef777d8E65f55200F",
  /// Demo dUSD token used in the end-to-end scenario.
  token: "0x759E3Febe2F4034cBfA61A70A4349a1C201c22ac",
  /// RulesEngineV1 — deploy on Robinhood and paste its address here to enable the firewall
  /// controls from the dashboard. Empty = firewall management shown read-only / disabled.
  rulesEngine: "" as `0x${string}` | "",
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
