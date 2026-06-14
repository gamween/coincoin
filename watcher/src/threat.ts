export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/// Subset of the Defimon `/ws/confirmed_attacks` schema (fields used by coincoin).
export interface ThreatAlert {
  network: string;
  severity: Severity;
  attack_type: string;
  transaction_hash: string;
  exploit_address: `0x${string}`; // targeted contract (the exploited protocol)
  attacker_address: `0x${string}`;
  block_number: number;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string" || v.length === 0) throw new Error(`alert: missing/invalid ${key}`);
  return v;
}

function requireAddress(obj: Record<string, unknown>, key: string): `0x${string}` {
  const v = requireString(obj, key);
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) throw new Error(`alert: ${key} is not an address`);
  return v.toLowerCase() as `0x${string}`;
}

export function parseThreatAlert(raw: unknown): ThreatAlert {
  if (typeof raw !== "object" || raw === null) throw new Error("alert: not an object");
  const obj = raw as Record<string, unknown>;
  const severity = requireString(obj, "severity");
  if (!SEVERITIES.includes(severity as Severity)) throw new Error(`alert: unknown severity ${severity}`);
  return {
    network: requireString(obj, "network"),
    severity: severity as Severity,
    attack_type: requireString(obj, "attack_type"),
    transaction_hash: requireString(obj, "transaction_hash"),
    exploit_address: requireAddress(obj, "exploit_address"),
    attacker_address: requireAddress(obj, "attacker_address"),
    block_number: typeof obj.block_number === "number" ? obj.block_number : 0,
  };
}
