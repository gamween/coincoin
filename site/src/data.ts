// Single source of content for the coincoin presentation site.
// Copy is locked to the brand voice (English UI; "COIN COIN !" is verbatim).

export const GITHUB_URL = "https://github.com/gamween/coincoin";
export const DOCS_URL = "/docs.html";
export const CONTACT_URL = "/contact.html";
export const LICENSE_URL = "/license.html";
export const LICENSE = "MIT";

// On-chain proof. coincoin runs live on Robinhood Chain Testnet (chain 46630), which has
// no public explorer yet — but the GuardianModule shares its address (same deployer +
// nonce) with the Arbiscan-verified deployment, so the source is one click away there.
export const DEPLOY_PROOF = {
  contract: "GuardianModule",
  address: "0x6671b4B73b79c284A710B00ef777d8E65f55200F",
  network: "Robinhood Chain Testnet",
  explorer: "https://sepolia.arbiscan.io/address/0x6671b4B73b79c284A710B00ef777d8E65f55200F",
  explorerLabel: "Verified contract ↗",
};

// Contacts (footer). X handle pending confirmation from the owner.
export const CONTACTS = {
  github: "https://github.com/gamween",
  x: "https://x.com/gamween",
  telegram: "https://t.me/dvb_fianso",
};
export const OWNER_NAME = "Sofiane";

// The three standalone pages — shown in the top-left CardNav dropdown and the footer.
export const NAV_PAGES = [
  { label: "Docs", href: DOCS_URL, blurb: "Read the docs ↗", bg: "#032b73" },
  { label: "Contact", href: CONTACT_URL, blurb: "Get in touch ↗", bg: "#0351a6" },
  { label: "License", href: LICENSE_URL, blurb: "MIT terms ↗", bg: "#036bc8" },
] as const;

// The on-page section index, shown as a FlowingMenu on the landing (replaces the top nav row).
// Each row reveals one of the extracted cutouts on hover. Order matches the scroll order below.
export const FLOW_MENU = [
  { label: "Run it", href: "#run", image: "/duck-hero.png" },
  { label: "The problem", href: "#problem", image: "/hero-thief.png" },
  { label: "The flip", href: "#flip", image: "/hero-duck.png" },
  { label: "How it works", href: "#how-it-works", image: "/duck-calm.png" },
  { label: "Architecture", href: "#architecture", image: "/hero-chest.png" },
  { label: "Stack", href: "#stack", image: "/hero-sparks.png" },
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
// The guardian daemon running live on Robinhood Chain Testnet (chain 46630). This is what
// `pnpm watch` actually logs: it watches the chain itself and evacuates to your vault the
// moment a real threat is detected — it never holds your key.
export const GUARDIAN_TERMINAL: ProcTerminal = {
  title: "coincoin guardian · live",
  command: "pnpm watch",
  role: "A long-running daemon that never holds your key. It watches the chain on its own and reacts.",
  accent: "success",
  lines: [
    { text: "$ pnpm watch", tone: "cmd" },
    { text: "[coincoin] 👁  watch — monitoring your account on Robinhood Chain Testnet (46630)", tone: "normal" },
    { text: "           keeper 0x6278…2B9e · your key is never held", tone: "muted" },
    { text: "→ scanning on-chain threat logs in bounded windows (≤10 blocks, RPC cap)…", tone: "muted" },
    { text: "→ caught up to head · idle, polling every few seconds…", tone: "muted" },
    { text: "→ threat detected on-chain → CRITICAL drain alert decoded", tone: "warn" },
    { text: "[coincoin] 🦆 COIN COIN ! threat detected → evacuating 0xFD0A…Ea89", tone: "danger" },
    { text: "→ keeper signs evacuateERC20([dUSD]) → your EOA (EIP-7702 guardian context)", tone: "normal" },
    { text: "[coincoin] ✅ evacuated to your SafeVault 0xF60c…Fe7A — confirmed on-chain", tone: "success" },
    { text: "→ funds safe in your own vault · daemon still watching. (Ctrl-C to stop)", tone: "success" },
  ],
};

export const ARCH_UNITS = [
  {
    name: "GuardianModule.sol",
    tag: "Solidity",
    body: "The EIP-7702 delegate target, callable only by you or the keeper (onlySelfOrKeeper). evacuateERC20 sweeps at-rest balances; exitAaveV3 unwinds deposited DeFi positions back to you first; revokeApprovals kills dangerous allowances. The vault is frozen on first config — a leaked key can't redirect funds. Revocable anytime.",
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
    badge: "STEP 1 · CONNECT",
    body: "Delegate your EOA to the GuardianModule via EIP-7702, then set your safe vault and keeper. One time.",
  },
  {
    cmd: "pnpm watch",
    badge: "STEP 2 · RUN",
    body: "Run the guardian daemon. It watches the chain in bounded block windows and sweeps your funds to your vault the moment a real threat is detected. Ctrl-C to stop.",
  },
  {
    cmd: "pnpm exploit",
    badge: "OPTIONAL · LOCAL TEST",
    body: "A developer tool to fire a test threat against a throwaway protocol on your own machine, so you can watch the guardian react. Not part of using coincoin.",
  },
] as const;

export const STACK_LIVE = [
  "Solidity",
  "OpenZeppelin",
  "Foundry",
  "EIP-7702 guardian",
  "Aave V3 exit",
  "TypeScript",
  "viem",
  "vitest",
];
export const STACK_PLANNED = [
  "Local rules engine (Solidity → Stylus) — next",
  "GMX V2 position exit — roadmap",
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
    note: "live · chain 46630 · Arbitrum Orbit · EIP-7702 confirmed",
    primary: true,
    address: DEPLOY_PROOF.address,
    explorer: DEPLOY_PROOF.explorer,
  },
];
