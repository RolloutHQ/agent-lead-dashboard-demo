import type { Transaction, TmsPerson, TmsUser } from "./types";

const currencyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatMoney(n?: number | null): string {
  return n == null ? "—" : currencyFormat.format(n);
}

export function formatPrice(n?: number | null): string {
  return n ? currencyFormat.format(n) : "—";
}

// Some TMSs (e.g. zipForm) store "no date" as year 0001.
export function realDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1900 ? null : iso;
}

export function formatDate(iso?: string | null): string {
  const valid = realDate(iso);
  return valid ? new Date(valid).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export function formatRate(rate?: number | null): string | null {
  if (!rate) return null;
  const pct = rate > 0 && rate < 1 ? rate * 100 : rate;
  return `${Number(pct.toFixed(3))}%`;
}

export function startCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAppKey(appKey: string): string {
  return appKey === "zipform" ? "zipForm Plus" : startCase(appKey);
}

const SIDE_LABELS: Record<string, string> = {
  listing: "Listing side",
  buying: "Buying side",
  both: "Both sides",
};

export function formatSide(side?: string | null): string | null {
  if (!side) return null;
  return SIDE_LABELS[side.toLowerCase()] ?? `${startCase(side)} side`;
}

export function formatRole(role: string): string {
  return startCase(role.replace(/^co-/, "co "));
}

export function personName(p: TmsPerson): string {
  return p.name || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed contact";
}

export function userName(u: TmsUser): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Unnamed agent";
}

export function transactionTitle(t: Transaction): string {
  return t.property?.address?.street || t.transactionName || "Untitled transaction";
}

export function transactionAltName(t: Transaction): string | null {
  const name = t.transactionName?.trim();
  const street = t.property?.address?.street?.trim();
  if (!name || !street) return null;
  const streetNumber = street.split(/\s+/)[0].toLowerCase();
  return name.toLowerCase().startsWith(streetNumber) ? null : name;
}

export function transactionLocation(t: Transaction): string {
  const a = t.property?.address;
  return [a?.city, [a?.state, a?.code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

export function transactionStatus(t: Transaction): string | null {
  return t.status || t.stage || null;
}
