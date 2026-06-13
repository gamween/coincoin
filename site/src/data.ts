// Single source of content for the coincoin presentation site.
// Copy is locked to the brand voice (English UI; "COIN COIN !" is verbatim).

export const GITHUB_URL = "https://github.com/gamween/coincoin";
export const DOCS_URL = "/docs.html";

// Contacts (footer). X handle pending confirmation from the owner.
export const CONTACTS = {
  github: "https://github.com/gamween",
  x: "https://x.com/gamween",
  telegram: "https://t.me/dvb_fianso",
};
export const OWNER_NAME = "Sofiane";

export const NAV_LINKS = [
  { label: "The problem", href: "#problem" },
  { label: "The flip", href: "#flip" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Live demo", href: "#demo" },
  { label: "Architecture", href: "#architecture" },
  { label: "Stack", href: "#stack" },
] as const;

// Problem stats are rendered with animated CountUp in Problem.tsx (numeric values live there).

export const PROBLEM_BULLETS = [
  "Pre-signature checks (Blockaid, Revoke.cash) block a bad signature — but go quiet after a wallet is compromised.",
  "They protect funds at rest in your wallet, not the positions you've deposited into DeFi.",
  "Harpie tried to cover this with fragile front-run racing. It shut down in 2025.",
] as const;

export const PIPELINE = [
  { key: "alerts", label: "ALERTS", body: "A live threat feed watches the chain for verifiable exploit events." },
  { key: "keeper", label: "KEEPER", body: "On a real detection, a bounded keeper fires the rescue. It can't do anything else." },
  { key: "guardian", label: "EOA / GUARDIAN", body: "Your wallet runs the GuardianModule code via EIP-7702." },
  { key: "vault", label: "VAULT", body: "Funds land in your own SafeVault. Only you can withdraw them out." },
] as const;

export const GUARANTEES = [
  { label: "ONLY YOUR VAULT", body: "The keeper has exactly one destination: your vault. It can't reach any other address." },
  { label: "REVOCABLE", body: "Remove the delegation in one transaction. You're never locked in." },
] as const;

export type TermLine = { text: string; tone: "prompt" | "muted" | "info" | "alert" | "success" };

// Mirrors the real daemon run on Robinhood Chain Testnet. UI copy around the terminal is English.
export const TERMINAL_LINES: TermLine[] = [
  { text: "$ pnpm watch", tone: "prompt" },
  { text: "→ coincoin is watching. Scanning for threats in bounded block windows…", tone: "info" },
  { text: "# (in another terminal)", tone: "muted" },
  { text: "$ pnpm exploit", tone: "prompt" },
  { text: "→ attacker draining the vulnerable demo protocol… tx sent.", tone: "info" },
  { text: "# back in the watcher — it catches the real Drained log on its own:", tone: "muted" },
  { text: "🦆 COIN COIN ! threat detected → evacuating 0xFD0A…Ea89", tone: "alert" },
  { text: "→ evacuated to 0xF60c…Fe7A (7702 guardian context)", tone: "success" },
  { text: "✓ done. Funds safe. The duck did its job.", tone: "success" },
];

// Index of the line that triggers the green "funds safe" payoff (counters + glow).
export const TERMINAL_SUCCESS_INDEX = 7;

export const ARCH_UNITS = [
  {
    name: "GuardianModule.sol",
    tag: "Solidity",
    body: "The EIP-7702 delegate target. Callable only by you or the keeper (onlySelfOrKeeper). Its evacuateERC20(tokens) sweeps your balances to the safe vault you set. Revocable anytime.",
  },
  {
    name: "SafeVault.sol",
    tag: "Solidity",
    body: "Yours alone. The keeper can only push funds in. Only you, the owner, can ever withdraw funds out.",
  },
  {
    name: "ChainThreatSource",
    tag: "TypeScript",
    body: "Polls Drained logs in ≤10-block windows (respecting RPC caps) and decodes them into Defimon-shaped alerts.",
  },
  {
    name: "KeeperClient",
    tag: "TypeScript",
    body: "Encodes and sends evacuateERC20 to the delegated EOA. Under EIP-7702, the Guardian code runs inside the account's own context.",
  },
  {
    name: "runWatcher",
    tag: "TypeScript",
    body: "The wiring: threat source → find exposed accounts → evacuate.",
  },
] as const;

export const COMMANDS = [
  {
    cmd: "pnpm onboard",
    badge: "ONE-TIME SETUP",
    body: "The victim delegates her EOA to the GuardianModule via EIP-7702, then configures it — her safe vault and the keeper. Done once.",
  },
  {
    cmd: "pnpm watch",
    badge: "THE PRODUCT",
    body: "The long-running daemon. It scans the chain in bounded block windows for a protocol's on-chain Drained exploit event. Real detection — no mock. Stop it with Ctrl-C.",
  },
  {
    cmd: "pnpm exploit",
    badge: "THE ONLY SIMULATED ACTOR",
    body: "An attacker drains a deliberately-vulnerable demo protocol. A real on-chain exploit transaction — the one thing here that's staged.",
  },
] as const;

export const STACK_LIVE = ["Solidity", "OpenZeppelin", "Foundry", "TypeScript", "viem (EIP-7702 + tx)", "vitest"];
export const STACK_PLANNED = [
  "Stylus (Rust/WASM) rules engine — planned",
  "ZeroDev (ERC-4337 / ERC-7579) — planned",
  "Aave V3 / GMX auto-exit — roadmap",
];
export const CHAINS = [
  { name: "Arbitrum Sepolia", note: "deployed" },
  { name: "Robinhood Chain Testnet", note: "deployed · chain 46630 · Arbitrum Orbit · EIP-7702 confirmed" },
];
