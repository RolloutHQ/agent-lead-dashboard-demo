"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useCredential } from "@/lib/credential-context";
import { StageBadge } from "@/components/stage-badge";
import {
  formatAppKey,
  formatDate,
  formatMoney,
  formatPrice,
  formatRate,
  realDate,
  transactionAltName,
  formatRole,
  formatSide,
  personName,
  startCase,
  transactionLocation,
  transactionStatus,
  transactionTitle,
  userName,
} from "@/lib/tms-format";
import type { Transaction, TmsPerson, TmsUser, TransactionNote, TransactionDocument } from "@/lib/types";

type Optional<T> = { available: true; items: T[] } | { available: false; reason: string };

interface DetailResponse {
  transaction: Transaction;
  people: TmsPerson[];
  users: TmsUser[];
  notes: Optional<TransactionNote>;
  documents: Optional<TransactionDocument>;
}

const DAY = 86400000;

function contactValue(item: { value: string } | string | undefined): string {
  if (!item) return "";
  return typeof item === "string" ? item : item.value;
}

function unavailableMessage(reason: string, what: string, tmsName: string): string {
  if (/not supported/i.test(reason)) return `${tmsName} doesn't provide ${what} through Rollout.`;
  if (/configured to not sync/i.test(reason)) return `${startCase(what)} sync is turned off for this ${tmsName} connection.`;
  return reason;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tmsSelected, loading } = useCredential();

  if (loading) return <Shell><Message text="Loading transaction details..." /></Shell>;
  if (!tmsSelected) return <Shell><Message text="No TMS credential selected. Select one from the sidebar." error /></Shell>;

  return <TransactionDetail key={`${tmsSelected.id}:${id}`} id={id} credentialId={tmsSelected.id} appKey={tmsSelected.appKey} />;
}

function TransactionDetail({ id, credentialId, appKey }: { id: string; credentialId: string; appKey: string }) {
  const { authHeaders } = useCredential();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const authKey = JSON.stringify(authHeaders);

  useEffect(() => {
    fetch(`/api/transactions/${encodeURIComponent(id)}`, {
      headers: { ...JSON.parse(authKey), "x-credential-id": credentialId },
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Failed to load transaction");
        return body as DetailResponse;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, credentialId, authKey]);

  if (loading) return <Shell><Message text="Loading transaction details..." /></Shell>;
  if (error || !data) {
    return (
      <Shell>
        <Message
          error
          text={error?.includes("404") ? "Transaction not found for the selected TMS credential." : error || "Transaction not found"}
        />
      </Shell>
    );
  }

  const { transaction: t, people, users, notes, documents } = data;
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const usersById = new Map(users.map((u) => [u.id, u]));
  const status = transactionStatus(t);
  const side = formatSide(t.sideRepresented);
  const location = transactionLocation(t);
  const tmsName = formatAppKey(appKey);

  const parties = (t.peopleParticipants || []).map((p) => ({ ...p, person: peopleById.get(p.personId) }));
  const agents = (t.userParticipants || []).map((u) => ({ ...u, user: usersById.get(u.userId) }));

  const dates = [
    { label: "Listing", value: t.listingDate },
    { label: "Rep agreement signed", value: t.clientRepAgreementSignedDate },
    { label: "Offer accepted", value: t.acceptanceDate },
    { label: "Escrow closing", value: t.escrowClosingDate },
    { label: "Closing", value: t.closingDate },
    { label: "Expiration", value: t.expirationDate },
  ]
    .map((d) => ({ ...d, value: realDate(d.value) }))
    .filter((d): d is { label: string; value: string } => Boolean(d.value))
    .sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());

  const overview: { label: string; value: ReactNode; mono?: boolean }[] = [
    { label: "Price", value: formatPrice(t.property?.price), mono: true },
    {
      label: "Total commission",
      value: (
        <>
          {formatMoney(t.totalCommissionAmount)}
          {formatRate(t.totalCommissionRate) && <span className="text-secondary"> · {formatRate(t.totalCommissionRate)}</span>}
        </>
      ),
      mono: true,
    },
    ...(t.sellSideCommissionAmount != null || t.sellSideCommissionRate != null
      ? [{ label: "Listing-side commission", value: [formatMoney(t.sellSideCommissionAmount), formatRate(t.sellSideCommissionRate)].filter((v) => v && v !== "—").join(" · ") || "—", mono: true }]
      : []),
    ...(t.buySideCommissionAmount != null || t.buySideCommissionRate != null
      ? [{ label: "Buying-side commission", value: [formatMoney(t.buySideCommissionAmount), formatRate(t.buySideCommissionRate)].filter((v) => v && v !== "—").join(" · ") || "—", mono: true }]
      : []),
    ...(t.property?.mlsNumber ? [{ label: "MLS #", value: t.property.mlsNumber, mono: true }] : []),
    ...(t.titleCompany ? [{ label: "Title company", value: t.titleCompany }] : []),
    ...(t.mortgageCompany ? [{ label: "Mortgage company", value: t.mortgageCompany }] : []),
    ...(t.property?.yearBuilt ? [{ label: "Year built", value: String(t.property.yearBuilt), mono: true }] : []),
    ...(t.source ? [{ label: "Source", value: t.source }] : []),
  ];

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">{transactionTitle(t)}</h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {status && <StageBadge stage={startCase(status)} />}
          {(t.transactionType || side) && (
            <span className="text-xs text-secondary">
              {[t.transactionType && startCase(t.transactionType), side].filter(Boolean).join(" · ")}
            </span>
          )}
          {location && <span className="text-xs text-secondary">{location}</span>}
          <span className="text-xs text-secondary font-[family-name:var(--font-geist-mono)]">{tmsName}</span>
        </div>
        {transactionAltName(t) && <p className="text-sm text-secondary mt-2">{transactionAltName(t)}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClosingCard t={t} now={now} />

          <Card title="Deal Overview">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              {overview.map((row) => (
                <div key={row.label}>
                  <dt className="text-xs text-secondary">{row.label}</dt>
                  <dd className={`text-sm mt-0.5 ${row.mono ? "font-[family-name:var(--font-geist-mono)]" : ""}`}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {dates.length > 0 && (
            <Card title="Key Dates">
              <ol className="relative border-l border-border ml-1.5 space-y-4">
                {dates.map((d) => {
                  const past = new Date(d.value).getTime() <= now;
                  return (
                    <li key={d.label} className="pl-5 relative">
                      <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-surface ${past ? "bg-primary" : "bg-secondary/30"}`} />
                      <div className="text-sm font-medium">{d.label}</div>
                      <div className="text-xs text-secondary font-[family-name:var(--font-geist-mono)]">{formatDate(d.value)}</div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          )}

          {t.description && (
            <Card title="Description">
              <p className="text-sm whitespace-pre-wrap">{t.description}</p>
            </Card>
          )}

          <Card title="Notes">
            {!notes.available ? (
              <p className="text-sm text-secondary">{unavailableMessage(notes.reason, "notes", tmsName)}</p>
            ) : notes.items.length === 0 ? (
              <p className="text-sm text-secondary">No notes on this transaction.</p>
            ) : (
              <ul className="space-y-4">
                {[...notes.items]
                  .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                  .map((n) => {
                    const author = n.createdByUserId ? usersById.get(n.createdByUserId) : undefined;
                    const body = n.body ? (n.isHtml ? stripHtml(n.body) : n.body) : "";
                    return (
                      <li key={n.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-sm font-medium">{n.subject || "Note"}</span>
                          <span className="text-xs text-secondary font-[family-name:var(--font-geist-mono)] shrink-0">{formatDate(n.created)}</span>
                        </div>
                        {author && <div className="text-xs text-secondary">{userName(author)}</div>}
                        {body && <p className="text-sm text-secondary mt-1 whitespace-pre-wrap">{body}</p>}
                      </li>
                    );
                  })}
              </ul>
            )}
          </Card>

          <Card title="Documents">
            {!documents.available ? (
              <p className="text-sm text-secondary">{unavailableMessage(documents.reason, "documents", tmsName)}</p>
            ) : documents.items.length === 0 ? (
              <p className="text-sm text-secondary">No documents on this transaction.</p>
            ) : (
              <ul className="divide-y divide-border">
                {documents.items.map((d) => (
                  <li key={d.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{d.name || "Untitled document"}</div>
                      <div className="text-xs text-secondary">
                        {[d.category, d.status, d.isSigned ? "Signed" : null, formatDate(d.created)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                        Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Clients" small>
            {parties.length === 0 ? (
              <p className="text-sm text-secondary">No clients linked.</p>
            ) : (
              <ul className="space-y-4">
                {parties.map((p) => {
                  const email = contactValue(p.person?.emails?.[0]);
                  const phone = contactValue(p.person?.phones?.[0]);
                  return (
                    <li key={p.personId}>
                      <div className="text-sm font-medium">{p.person ? personName(p.person) : "Unknown contact"}</div>
                      {(p.roles?.length ?? 0) > 0 && <div className="text-xs text-secondary">{p.roles!.map(formatRole).join(", ")}</div>}
                      {email && <div className="text-xs mt-1 break-all">{email}</div>}
                      {phone && <div className="text-xs font-[family-name:var(--font-geist-mono)]">{phone}</div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Agents" small>
            {agents.length === 0 ? (
              <p className="text-sm text-secondary">No agents linked.</p>
            ) : (
              <ul className="space-y-4">
                {agents.map((a) => (
                  <li key={a.userId}>
                    <div className="text-sm font-medium">{a.user ? userName(a.user) : "Unknown agent"}</div>
                    {(a.roles?.length ?? 0) > 0 && <div className="text-xs text-secondary">{a.roles!.map(formatRole).join(", ")}</div>}
                    {a.user?.email && <div className="text-xs mt-1 break-all">{a.user.email}</div>}
                    {a.user?.phone && <div className="text-xs font-[family-name:var(--font-geist-mono)]">{a.user.phone}</div>}
                    {a.totalCommissionAmount != null && (
                      <div className="text-xs text-secondary font-[family-name:var(--font-geist-mono)] mt-1">
                        Commission {formatMoney(a.totalCommissionAmount)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Record Info" small>
            <dl className="space-y-3">
              <InfoRow label="TMS" value={tmsName} />
              <InfoRow label="Created" value={formatDate(t.created)} mono />
              <InfoRow label="Last updated" value={formatDate(t.updated)} mono />
              <InfoRow label="Rollout ID" value={t.id} mono muted />
              <InfoRow label="Credential" value={credentialId} mono muted />
            </dl>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function ClosingCard({ t, now }: { t: Transaction; now: number }) {
  const closing = realDate(t.closingDate) || realDate(t.escrowClosingDate);
  const closingTime = closing ? new Date(closing).getTime() : null;
  const isClosedStatus = /closed|sold|complete/i.test(transactionStatus(t) || "");

  let tone: "success" | "primary" | "muted";
  let headline: string;
  let detail: string;

  if (isClosedStatus || (closingTime && closingTime <= now)) {
    tone = "success";
    headline = "Closed";
    detail = closing ? `Closed on ${formatDate(closing)}` : "Marked closed in the TMS";
  } else if (closingTime) {
    const days = Math.ceil((closingTime - now) / DAY);
    tone = "primary";
    headline = days === 1 ? "Closing tomorrow" : `Closing in ${days} days`;
    detail = `Scheduled for ${formatDate(closing)}`;
  } else {
    tone = "muted";
    headline = "No closing date";
    detail = "No closing date has been set in the TMS yet";
  }

  const accepted = realDate(t.acceptanceDate);
  const start = accepted ? new Date(accepted).getTime() : null;
  const progress =
    start && closingTime && closingTime > start
      ? Math.min(100, Math.max(0, ((now - start) / (closingTime - start)) * 100))
      : null;

  const styles = {
    success: { box: "bg-success/10 border-success/20", text: "text-success", bar: "bg-success" },
    primary: { box: "bg-primary/5 border-primary/20", text: "text-primary", bar: "bg-primary" },
    muted: { box: "bg-secondary/5 border-border", text: "text-secondary", bar: "bg-secondary/40" },
  }[tone];

  return (
    <div className={`rounded-xl border p-5 ${styles.box}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`text-sm font-semibold ${styles.text}`}>{headline}</div>
          <div className="text-xs text-secondary mt-0.5">{detail}</div>
        </div>
        {!!t.property?.price && (
          <div className="text-right">
            <div className="text-lg font-semibold font-[family-name:var(--font-geist-mono)]">{formatPrice(t.property.price)}</div>
            <div className="text-xs text-secondary">Price</div>
          </div>
        )}
      </div>
      {progress != null && tone !== "muted" && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${tone === "success" ? 100 : progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-secondary mt-1.5 font-[family-name:var(--font-geist-mono)]">
            <span>Accepted {formatDate(t.acceptanceDate)}</span>
            <span>Closing {formatDate(closing)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, small, children }: { title: string; small?: boolean; children: ReactNode }) {
  const Heading = small ? "h3" : "h2";
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <Heading className="text-xs font-medium text-secondary uppercase tracking-wider mb-4">{title}</Heading>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-secondary">{label}</dt>
      <dd className={`text-sm break-all ${mono ? "font-[family-name:var(--font-geist-mono)]" : ""} ${muted ? "text-secondary" : ""}`}>{value}</dd>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[1200px]">
      <Link
        href="/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-foreground transition-colors mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 4l-4 4 4 4" />
        </svg>
        Back to Transactions
      </Link>
      {children}
    </div>
  );
}

function Message({ text, error }: { text: string; error?: boolean }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-8 text-center">
      <p className={`text-sm ${error ? "text-error" : "text-secondary"}`}>{text}</p>
    </div>
  );
}
