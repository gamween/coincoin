export const guardianAbi = [
  {
    type: "function",
    name: "evacuateERC20",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokens", type: "address[]" }],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeApprovals",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokens", type: "address[]" },
      { name: "spenders", type: "address[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "exitAaveV3",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pool", type: "address" },
      { name: "underlyings", type: "address[]" },
    ],
    outputs: [],
  },
] as const;

/// Event emitted by the vulnerable demo protocol on drain (see contracts/src/demo).
export const exploitEventAbi = [
  {
    type: "event",
    name: "Drained",
    inputs: [
      { name: "attacker", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
