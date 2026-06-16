import { robinhood } from "./chain";

export const EXPLORER = robinhood.blockExplorers.default.url;

/// On-chain addresses on Robinhood Chain Testnet (deployments/robinhood-testnet.json).
/// The guardian *storage* lives at each protected EOA (it's a 7702 delegate), so the app
/// reads the guardian view functions at the connected address — not at the impl address.
export const ADDR = {
  /// GuardianModule implementation (the 7702 delegate target).
  guardianImpl: "0x9953BB30cFef2ac842C74417eA6DC661b492E8dA",
  /// Demo dUSD token used in the end-to-end scenario.
  token: "0x31052145BBFB8aA9B4e3713a2fD34e57b3A942f3",
  /// RulesEngineV1 — deploy on Robinhood (script/DeployRules.s.sol) and set its address as
  /// VITE_RULES_ENGINE to enable the firewall controls. Empty = the Enable button stays off.
  rulesEngine: ((import.meta.env.VITE_RULES_ENGINE as string | undefined) ?? "") as `0x${string}` | "",
  /// SafeVaultFactory — deterministic per-user SafeVault, for gasless in-browser onboarding.
  factory: ((import.meta.env.VITE_VAULT_FACTORY as string | undefined) ??
    "0x1ef2B2539fa842A9c7e4EA07790aA6dBc47ec4A5") as `0x${string}`,
  /// Canonical coincoin keeper the gasless onboarding policy authorizes.
  keeper: "0x627872F35b724222413e7421C9e40A26B2762B9e" as `0x${string}`,
} as const;

export const factoryAbi = [
  {
    type: "function",
    name: "vaultOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "address" }],
  },
] as const;

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
