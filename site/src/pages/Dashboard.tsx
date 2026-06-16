import { useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { isAddress, zeroAddress, type Address } from "viem";
import { robinhood } from "../app/chain";
import { ADDR, EXPLORER, erc20Abi, guardianAbi, safeVaultAbi } from "../app/contracts";
import { fmtUnits, short } from "../app/format";
import { Pill, PageHeader } from "../components/ui";

const REFRESH = { refetchInterval: 8000 } as const;

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const onRobinhood = chainId === robinhood.id;

  // Optional read-only override: paste any address (or deep-link with ?a=0x…) to inspect
  // its protection without connecting.
  const [inspect, setInspect] = useState(() =>
    typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("a") ?? ""),
  );
  const target = (isAddress(inspect) ? (inspect as Address) : address) as Address | undefined;
  const isSelf = !!address && !!target && address.toLowerCase() === target.toLowerCase();
  const canWrite = isConnected && onRobinhood && isSelf;

  // ── Guardian state, read at the EOA (a 7702 delegate stores at the account) ──
  const g = { address: target, abi: guardianAbi } as const;
  const state = useReadContracts({
    allowFailure: true,
    contracts: target
      ? [
          { ...g, functionName: "configured" },
          { ...g, functionName: "safeVault" },
          { ...g, functionName: "keeper" },
          { ...g, functionName: "rulesEngine" },
          { ...g, functionName: "blockThreshold" },
        ]
      : [],
    query: { enabled: !!target, ...REFRESH },
  });
  const [cR, vR, kR, rR, tR] = state.data ?? [];
  const configured = cR?.status === "success" && cR.result === true;
  const safeVault = vR?.status === "success" ? (vR.result as Address) : undefined;
  const keeper = kR?.status === "success" ? (kR.result as Address) : undefined;
  const rulesEngine = rR?.status === "success" ? (rR.result as Address) : undefined;
  const threshold = tR?.status === "success" ? Number(tR.result) : 0;
  const firewallOn = !!rulesEngine && rulesEngine !== zeroAddress && threshold > 0;

  // ── Token balances (the demo dUSD) at the account and in the vault ──
  const token = ADDR.token as Address;
  const bals = useReadContracts({
    allowFailure: true,
    contracts: target
      ? [
          { address: token, abi: erc20Abi, functionName: "symbol" },
          { address: token, abi: erc20Abi, functionName: "decimals" },
          { address: token, abi: erc20Abi, functionName: "balanceOf", args: [target] },
          { address: token, abi: erc20Abi, functionName: "balanceOf", args: [safeVault ?? zeroAddress] },
        ]
      : [],
    query: { enabled: !!target, ...REFRESH },
  });
  const sym = (bals.data?.[0]?.result as string) ?? "dUSD";
  const dec = Number(bals.data?.[1]?.result ?? 18);
  const atRest = bals.data?.[2]?.result as bigint | undefined;
  const inVault = bals.data?.[3]?.result as bigint | undefined;

  // ── Writes ──
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [trustAddr, setTrustAddr] = useState("");

  const trusted = useReadContract({
    address: target,
    abi: guardianAbi,
    functionName: "trustedSpender",
    args: [isAddress(trustAddr) ? (trustAddr as Address) : zeroAddress],
    query: { enabled: !!target && isAddress(trustAddr) },
  });

  async function run(label: string, fn: () => Promise<`0x${string}`>) {
    setErr(null);
    setTx(null);
    setBusy(label);
    try {
      setTx(await fn());
    } catch (e) {
      const m = e as { shortMessage?: string; message?: string };
      setErr(m.shortMessage || m.message || "transaction rejected");
    } finally {
      setBusy(null);
    }
  }

  const panic = () =>
    run("panic", () =>
      writeContractAsync({ address: target!, abi: guardianAbi, functionName: "evacuateERC20", args: [[token]], chainId: robinhood.id }),
    );
  const withdraw = () =>
    run("withdraw", () =>
      writeContractAsync({ address: safeVault!, abi: safeVaultAbi, functionName: "withdrawERC20", args: [token, address!, inVault ?? 0n], chainId: robinhood.id }),
    );
  const enableFirewall = () =>
    run("enable", () =>
      writeContractAsync({ address: target!, abi: guardianAbi, functionName: "setRules", args: [ADDR.rulesEngine as Address, 100], chainId: robinhood.id }),
    );
  const disableFirewall = () =>
    run("disable", () =>
      writeContractAsync({ address: target!, abi: guardianAbi, functionName: "setRules", args: [(rulesEngine ?? zeroAddress) as Address, 0], chainId: robinhood.id }),
    );
  const trust = () =>
    run("trust", () =>
      writeContractAsync({ address: target!, abi: guardianAbi, functionName: "trustSpender", args: [trustAddr as Address, true], chainId: robinhood.id }),
    );

  const injected = connectors[0];

  return (
    <>
      <PageHeader breadcrumb="app" maxWidthClass="max-w-[1100px]">
        {isConnected && !onRobinhood && (
          <button onClick={() => switchChain({ chainId: robinhood.id })} className="btn-ghost !px-4 !py-2 !text-[13px]">
            Switch to Robinhood
          </button>
        )}
        {isConnected ? (
          <button onClick={() => disconnect()} className="btn-ghost !px-4 !py-2 !text-[13px]">
            {short(address)} · Disconnect
          </button>
        ) : (
          <button onClick={() => injected && connect({ connector: injected })} disabled={connecting} className="btn-comic !px-5 !py-2.5">
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </PageHeader>

      <main className="relative z-10 mx-auto w-full max-w-[1100px] px-5 pb-24 pt-12 sm:px-8">
        <Pill tone="info" className="mb-5">DASHBOARD</Pill>
        <h1 className="display text-[clamp(30px,6vw,52px)] leading-[0.95] text-text-primary text-stroke">
          Your <span className="text-primary">protection</span>
        </h1>
        <p className="mt-5 max-w-2xl font-body text-body-lg text-text-muted">
          Connect on Robinhood Chain to see your account's protection, manage the firewall, and rescue
          your funds. Or paste any address below to inspect it read-only.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input
            value={inspect}
            onChange={(e) => setInspect(e.target.value.trim())}
            placeholder="Inspect any 0x… address (read-only)"
            className="w-full max-w-md rounded-md border-[3px] border-border bg-near-black px-4 py-2.5 font-mono text-body-sm text-text-primary outline-none focus:border-border-soft sm:w-auto"
          />
          {inspect && !isAddress(inspect) && <span className="font-body text-caption text-danger">not an address</span>}
          {target && !isSelf && <Pill tone="info">read-only</Pill>}
        </div>

        {!target ? (
          <div className="comic-card mt-10 p-8 text-center">
            <p className="font-body text-body-lg text-text-primary">Connect your wallet or paste an address to begin.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* ── Protection status ── */}
            <div className={`comic-card p-7 ${configured ? "!border-success glow-green" : "!border-warning"}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="display text-[18px] text-text-primary">Status</h2>
                <Pill tone={configured ? "safe" : "threat"}>{configured ? "PROTECTED" : "NOT ONBOARDED"}</Pill>
              </div>
              <dl className="mt-5 grid gap-3 font-body text-body-sm">
                <Row label="Account" value={short(target)} href={`${EXPLORER}/address/${target}`} />
                <Row label="Safe vault" value={configured ? short(safeVault) : "—"} href={safeVault ? `${EXPLORER}/address/${safeVault}` : undefined} />
                <Row label="Keeper" value={configured ? short(keeper) : "—"} />
                <Row label="Firewall" value={firewallOn ? `ON · block ≥ ${threshold}` : "OFF"} />
              </dl>
              {!configured && (
                <p className="mt-5 font-body text-body-sm text-text-muted">
                  This account isn't delegated yet. Onboard once from the CLI:{" "}
                  <code className="font-mono text-primary">pnpm onboard</code> — then it shows up here.
                </p>
              )}
            </div>

            {/* ── Vault ── */}
            <div className="comic-card p-7">
              <h2 className="display text-[18px] text-text-primary">Vault</h2>
              <div className="mt-5 grid grid-cols-2 gap-5">
                <Stat label={`At rest (${sym})`} value={fmtUnits(atRest, dec)} tone="danger" />
                <Stat label={`In your vault (${sym})`} value={fmtUnits(inVault, dec)} tone="success" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={panic}
                  disabled={!canWrite || !configured || !(atRest && atRest > 0n) || busy === "panic"}
                  className="btn-comic !border-danger !bg-danger !text-text-primary disabled:opacity-40"
                >
                  {busy === "panic" ? "Rescuing…" : "🦆 Panic — move to vault"}
                </button>
                <button
                  onClick={withdraw}
                  disabled={!canWrite || !(inVault && inVault > 0n) || busy === "withdraw"}
                  className="btn-ghost disabled:opacity-40"
                >
                  {busy === "withdraw" ? "Withdrawing…" : "Withdraw vault → wallet"}
                </button>
              </div>
            </div>

            {/* ── Firewall ── */}
            <div className="comic-card p-7 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="display text-[18px] text-text-primary">Firewall</h2>
                <Pill tone={firewallOn ? "safe" : "info"}>{firewallOn ? "ON" : "OFF"}</Pill>
              </div>
              <p className="mt-3 font-body text-body-sm text-text-muted">
                Blocks unlimited approvals / blanket NFT approvals to untrusted spenders, at the account
                level. Trust a contract so deliberate approvals to it still go through.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {firewallOn ? (
                  <button onClick={disableFirewall} disabled={!canWrite || busy === "disable"} className="btn-ghost disabled:opacity-40">
                    {busy === "disable" ? "…" : "Disable firewall"}
                  </button>
                ) : (
                  <button
                    onClick={enableFirewall}
                    disabled={!canWrite || !ADDR.rulesEngine || busy === "enable"}
                    className="btn-comic disabled:opacity-40"
                    title={ADDR.rulesEngine ? "" : "Deploy RulesEngineV1 and set its address in app/contracts.ts"}
                  >
                    {busy === "enable" ? "Enabling…" : "Enable firewall"}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={trustAddr}
                    onChange={(e) => setTrustAddr(e.target.value.trim())}
                    placeholder="Trust a spender 0x…"
                    className="w-64 rounded-md border-[3px] border-border bg-near-black px-3 py-2 font-mono text-caption text-text-primary outline-none focus:border-border-soft"
                  />
                  {isAddress(trustAddr) && (
                    <Pill tone={trusted.data ? "safe" : "info"}>{trusted.data ? "trusted" : "untrusted"}</Pill>
                  )}
                  <button onClick={trust} disabled={!canWrite || !isAddress(trustAddr) || busy === "trust"} className="btn-ghost !px-4 !py-2 !text-[13px] disabled:opacity-40">
                    {busy === "trust" ? "…" : "Trust"}
                  </button>
                </div>
              </div>
              {!ADDR.rulesEngine && (
                <p className="mt-4 font-body text-caption text-text-muted">
                  To enable from here, deploy <code className="font-mono text-primary">RulesEngineV1</code> on Robinhood and set its address in
                  <code className="font-mono text-primary"> app/contracts.ts</code>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* tx / error feedback */}
        {(tx || err) && (
          <div className={`mt-6 comic-card !shadow-bevel-sm p-4 ${err ? "!border-danger" : "!border-success"}`}>
            {err ? (
              <p className="font-body text-body-sm text-danger">⚠ {err}</p>
            ) : (
              <p className="font-body text-body-sm text-success">
                ✓ Submitted ·{" "}
                <a href={`${EXPLORER}/tx/${tx}`} target="_blank" rel="noreferrer" className="font-mono underline">
                  {short(tx ?? undefined)}
                </a>
              </p>
            )}
          </div>
        )}

        {!isSelf && target && (
          <p className="mt-6 font-body text-caption text-text-muted">
            Read-only view. Connect as this account on Robinhood Chain to act on it.
          </p>
        )}
      </main>
    </>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-surface pb-2">
      <dt className="text-text-muted">{label}</dt>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="font-mono text-info hover:underline">
          {value}
        </a>
      ) : (
        <dd className="font-mono text-text-primary">{value}</dd>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "danger" | "success" }) {
  return (
    <div>
      <div className="font-body text-caption uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`mt-1 numeric text-[clamp(22px,4vw,32px)] ${tone === "danger" ? "text-danger" : "text-success"}`}>{value}</div>
    </div>
  );
}
