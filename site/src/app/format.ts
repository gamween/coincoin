export const short = (a?: string): string => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

/// Format a bigint token amount (in base units) to a human string with up to `max` decimals.
export function fmtUnits(value: bigint | undefined, decimals = 18, max = 4): string {
  if (value === undefined) return "—";
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, max).replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${fracStr ? "." + fracStr : ""}`;
}
