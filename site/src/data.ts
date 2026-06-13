// Single source of content for the coincoin presentation site.
// Copy is locked to the brand voice (English UI; "COIN COIN !" is verbatim).

export const GITHUB_URL = "https://github.com/gamween/coincoin";
export const DOCS_URL = "/docs.html";
export const CONTACT_URL = "/contact.html";
export const LICENSE = "MIT";

// On-chain proof. The GuardianModule is verifiable on a public explorer; the live demo
// runs the same code on Robinhood Chain Testnet (chain 46630).
export const DEPLOY_PROOF = {
  contract: "GuardianModule",
  address: "0x6671b4B73b79c284A710B00ef777d8E65f55200F",
  network: "Arbitrum Sepolia",
  explorer: "https://sepolia.arbiscan.io/address/0x6671b4B73b79c284A710B00ef777d8E65f55200F",
};

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

// Interactive walkthrough steps (the Stepper in How it works). End-to-end: detect → sweep → safe.
export const STEPPER_STEPS = [
  {
    key: "alerts",
    title: "ALERTS",
    icon: "/icons/alerts.png",
    body: "A live threat feed watches the chain in bounded block windows. ChainThreatSource polls on-chain Drained logs in ≤10-block slices (respecting RPC caps) and decodes them into alerts. No mock data — it reacts to a real exploit event, not a guess about a bad signature.",
  },
  {
    key: "keeper",
    title: "KEEPER",
    icon: "/icons/keeper.png",
    body: "On a verified detection — and only then — a bounded keeper fires the rescue. It is not a custodian and is never trusted with your money. It can trigger exactly one action: evacuate to the vault you configured. Nothing else is on the list.",
  },
  {
    key: "eoa",
    title: "EOA / GUARDIAN",
    icon: "/icons/eoa.png",
    body: "Your own wallet temporarily runs the GuardianModule code via EIP-7702. The keeper calls evacuateERC20 on your EOA; under 7702 the Guardian logic executes inside your account's own context (onlySelfOrKeeper). You hold the keys the entire time.",
  },
  {
    key: "vault",
    title: "VAULT",
    icon: "/icons/vault.png",
    body: "Your exposed balances sweep into your own SafeVault. The keeper can only ever push funds in — only you, the owner, can withdraw them back out. One hard-wired destination: your vault, and no other address is reachable.",
  },
  {
    key: "safe",
    title: "SAFE",
    icon: "/icons/vault.png",
    body: "COIN COIN ! Funds safe — the duck did its job. The whole delegation is revocable in a single transaction, so you are never locked in. The calm duck goes back to watching your wallets.",
  },
] as const;

export type TermTone = "cmd" | "muted" | "normal" | "warn" | "danger" | "success";
export type TermLine = { text: string; tone: TermTone };
export type ProcTerminal = {
  title: string;
  command: string;
  role: string;
  accent: "danger" | "success";
  lines: TermLine[];
};

// Two genuinely separate OS processes, faithful to the real watcher/scripts and the live
// Robinhood Chain Testnet (chain 46630) demo addresses. The attacker fires; the guardian,
// watching independently, detects the same on-chain Drained log and evacuates.
export const ATTACKER_TERMINAL: ProcTerminal = {
  title: "ATTACKER",
  command: "pnpm exploit",
  role: "The only simulated actor — drains a deliberately-vulnerable demo protocol, emitting a real on-chain Drained log.",
  accent: "danger",
  lines: [
    { text: "$ pnpm exploit", tone: "cmd" },
    { text: "[exploit] protocol balance before: 500000000000000000000", tone: "muted" },
    { text: "→ calling emergencyWithdraw() on 0x177B…c1Db (dUSD protocol)…", tone: "normal" },
    { text: "→ tx sent · awaiting receipt on Robinhood Chain Testnet (46630)…", tone: "normal" },
    { text: "[exploit] 💥 drained 500000000000000000000 from 0x177B…c1Db", tone: "danger" },
    { text: "          attacker 0xdae8…F728 · Drained(attacker, amount) emitted", tone: "danger" },
    { text: "→ protocol balance now 0. exploit complete.", tone: "muted" },
    { text: "$ ▮", tone: "muted" },
  ],
};

export const GUARDIAN_TERMINAL: ProcTerminal = {
  title: "COINCOIN",
  command: "pnpm watch",
  role: "The product — a long-running daemon that never holds your key. It watches the chain on its own and reacts.",
  accent: "success",
  lines: [
    { text: "$ pnpm watch", tone: "cmd" },
    { text: "[coincoin] 👁  watch — monitoring 0x177B…c1Db on Robinhood Chain Testnet", tone: "normal" },
    { text: "           keeper 0x6278…2B9e · victim key never held", tone: "muted" },
    { text: "→ scanning Drained logs in bounded windows (≤10 blocks, RPC cap)…", tone: "muted" },
    { text: "→ caught up to head · idle, polling…", tone: "muted" },
    { text: "→ new Drained log decoded → CRITICAL drain alert (attacker 0xdae8…F728)", tone: "warn" },
    { text: "[coincoin] 🦆 COIN COIN ! threat on 0x177b…c1db → evacuating 0xFD0A…Ea89", tone: "danger" },
    { text: "→ keeper signs evacuateERC20([0x759E…22ac]) → victim EOA (7702 context)", tone: "normal" },
    { text: "[coincoin] ✅ evacuated to 0xF60c…Fe7A — confirmed on-chain", tone: "success" },
    { text: "→ 500 dUSD now safe in the victim's own SafeVault · daemon still watching", tone: "success" },
  ],
};

// Index (in GUARDIAN_TERMINAL.lines) of the evacuation success line — triggers the green payoff.
export const GUARDIAN_SUCCESS_INDEX = 8;

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
export const CHAINS: {
  name: string;
  note: string;
  primary?: boolean;
  address?: string;
  explorer?: string;
}[] = [
  {
    name: "Robinhood Chain Testnet",
    note: "live demo · chain 46630 · Arbitrum Orbit · EIP-7702 confirmed",
    primary: true,
  },
  {
    name: "Arbitrum Sepolia",
    note: "GuardianModule deployed · verifiable on Arbiscan",
    address: DEPLOY_PROOF.address,
    explorer: DEPLOY_PROOF.explorer,
  },
];
