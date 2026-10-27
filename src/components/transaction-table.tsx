"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useCredential } from "@/lib/credential-context";
import { StageBadge } from "./stage-badge";
import {
  formatDate,
  formatMoney,
  formatPrice,
  formatRole,
  formatSide,
  startCase,
  transactionAltName,
  transactionLocation,
  transactionStatus,
  transactionTitle,
} from "@/lib/tms-format";
import type { Transaction } from "@/lib/types";

type Names = { people: Record<string, string>; users: Record<string, string> };

export function TransactionTable() {
  const { tmsSelected, tmsError, loading } = useCredential();

  if (loading) {
    return <div className="text-sm text-secondary py-8">Loading TMS connections...</div>;
  }

  if (!tmsSelected) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-secondary text-sm">
          {tmsError || "No TMS credential selected."}{" "}
          {!tmsError && (
            <>
              Select one from the sidebar, or{" "}
              <Link href="/tms-integrations" className="text-primary hover:underline">connect one in TMS Integrations</Link>.
            </>
          )}
        </p>
      </div>
    );
  }

  return <TransactionList key={tmsSelected.id} credentialId={tmsSelected.id} />;
}

function TransactionList({ credentialId }: { credentialId: string }) {
  const router = useRouter();
  const { authHeaders } = useCredential();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [names, setNames] = useState<Names>({ people: {}, users: {} });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");

  const [loadingMore, setLoadingMore] = useState(false);

  const authKey = JSON.stringify(authHeaders);

  const fetchPage = useCallback(
    (offset: number) =>
      fetch(`/api/transactions?offset=${offset}`, { headers: { ...JSON.parse(authKey), "x-credential-id": credentialId } })
        .then(async (res) => {
          const body = await res.json();
          if (!res.ok) throw new Error(body.error || "Failed to fetch transactions");
          return body as { data: Transaction[]; names?: Names; _metadata?: { total?: number } };
        })
        .then((body) => {
          setTransactions((prev) => (offset === 0 ? body.data : [...prev, ...body.data]));
          setNames((prev) => ({
            people: { ...prev.people, ...body.names?.people },
            users: { ...prev.users, ...body.names?.users },
          }));
          setTotal(body._metadata?.total ?? body.data.length);
        }),
    [credentialId, authKey]
  );

  useEffect(() => {
    fetchPage(0)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetchPage]);

  function loadMore() {
    setLoadingMore(true);
    fetchPage(transactions.length)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMore(false));
  }

  const statusTabs = useMemo(() => {
    const statuses = new Set<string>();
    transactions.forEach((t) => { const s = transactionStatus(t); if (s) statuses.add(s); });
    return ["All", ...Array.from(statuses).sort()];
  }, [transactions]);

  const filtered = activeTab === "All" ? transactions : transactions.filter((t) => transactionStatus(t) === activeTab);

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-secondary text-sm">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-error text-sm break-words">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {statusTabs.length > 1 && (
        <div className="flex items-center gap-0 border-b border-border overflow-x-auto">
          {statusTabs.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === s ? "text-primary" : "text-secondary hover:text-foreground"
              }`}
            >
              {startCase(s)}
              {activeTab === s && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      )}
      <div className="bg-surface rounded-xl border border-border overflow-x-auto mt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Transaction", "Type", "Status", "Clients", "Agent", "Price", "Commission", "Closing"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-secondary">
                  {transactions.length === 0
                    ? "No transactions yet. A newly connected TMS can take a few minutes to finish its first sync."
                    : `No transactions with status "${startCase(activeTab)}".`}
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const status = transactionStatus(t);
                const title = transactionTitle(t);
                const location = transactionLocation(t);
                const side = formatSide(t.sideRepresented);
                const subtitle = [
                  t.property?.address?.street ? transactionAltName(t) : null,
                  location,
                  t.property?.mlsNumber ? `MLS ${t.property.mlsNumber}` : null,
                ].filter(Boolean).join(" · ");
                const clients = (t.peopleParticipants || [])
                  .map((p) => ({ name: names.people[p.personId], role: p.roles?.[0] }))
                  .filter((p) => p.name);
                const agents = (t.userParticipants || []).map((u) => names.users[u.userId]).filter(Boolean);
                return (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/transactions/${t.id}`)}
                    className="border-b border-border last:border-0 hover:bg-background/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/transactions/${t.id}`} className="hover:text-primary transition-colors">
                        <div className="font-medium text-sm">{title}</div>
                        {subtitle && <div className="text-xs text-secondary">{subtitle}</div>}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-secondary whitespace-nowrap">
                      <div>{t.transactionType ? startCase(t.transactionType) : "—"}</div>
                      {side && <div className="text-xs text-secondary/70">{side}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      {status ? <StageBadge stage={startCase(status)} /> : <span className="text-xs text-secondary">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {clients.length === 0 ? (
                        <span className="text-xs text-secondary">—</span>
                      ) : (
                        <>
                          <div>{clients[0].name}{clients[0].role && <span className="text-xs text-secondary"> · {formatRole(clients[0].role)}</span>}</div>
                          {clients.length > 1 && <div className="text-xs text-secondary">+{clients.length - 1} more</div>}
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-secondary">
                      {agents.length === 0 ? "—" : agents.length === 1 ? agents[0] : `${agents[0]} +${agents.length - 1}`}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-[family-name:var(--font-geist-mono)] whitespace-nowrap">{formatPrice(t.property?.price)}</td>
                    <td className="px-5 py-3.5 text-sm text-secondary font-[family-name:var(--font-geist-mono)] whitespace-nowrap">{formatMoney(t.totalCommissionAmount)}</td>
                    <td className="px-5 py-3.5 text-sm text-secondary font-[family-name:var(--font-geist-mono)] whitespace-nowrap">{formatDate(t.closingDate)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-secondary">
        <span>
          Showing {filtered.length.toLocaleString()} of {activeTab === "All" ? total.toLocaleString() : `${transactions.length.toLocaleString()} loaded`} transactions
          {activeTab !== "All" && transactions.length < total ? ` (${total.toLocaleString()} total)` : ""}
        </span>
        {transactions.length < total && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground hover:border-secondary/40 transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
