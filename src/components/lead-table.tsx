"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useCredential } from "@/lib/credential-context";
import { StageBadge } from "./stage-badge";
import type { Person } from "@/lib/types";

function getEmail(person: Person): string {
  const e = person.emails?.[0];
  if (!e) return "";
  return typeof e === "string" ? e : e.value;
}

function getPhone(person: Person): string {
  const p = person.phones?.[0];
  if (!p) return "";
  return typeof p === "string" ? p : p.value;
}

function getDisplayName(person: Person): string {
  if (person.name) return person.name;
  const parts = [person.firstName, person.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown";
}

export function LeadTable() {
  const { selected, loading: credLoading, authHeaders } = useCredential();
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setActiveTab("All");
    fetch("/api/people", {
      headers: { ...authHeaders, "x-credential-id": selected.id },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch leads");
        return res.json();
      })
      .then((data) => {
        setPeople(data.data || []);
        setTotal(data._metadata?.total || data.data?.length || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  // Build stage tabs dynamically from the data
  const stageTabs = useMemo(() => {
    const stages = new Set<string>();
    people.forEach((p) => { if (p.stage) stages.add(p.stage); });
    return ["All", ...Array.from(stages).sort()];
  }, [people]);

  const filtered = activeTab === "All"
    ? people
    : people.filter((p) => p.stage === activeTab);

  if (credLoading) {
    return <div className="text-sm text-secondary py-8">Loading credentials...</div>;
  }

  if (!selected) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-secondary text-sm">No CRM credential selected. Select one from the sidebar to view leads.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-secondary text-sm">Loading leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-error text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {stageTabs.length > 1 && (
        <div className="flex items-center gap-0 border-b border-border mb-0 overflow-x-auto">
          {stageTabs.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === s
                  ? "text-primary"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              {s}
              {activeTab === s && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
      <div className="bg-surface rounded-xl border border-border overflow-hidden mt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Lead</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Contact</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Stage</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Source</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-secondary">
                  No leads found{activeTab !== "All" ? ` in "${activeTab}" stage` : ""}.
                </td>
              </tr>
            ) : (
              filtered.map((lead) => {
                const email = getEmail(lead);
                const phone = getPhone(lead);
                const contact = email || phone || "—";
                return (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/leads/${lead.id}`} className="hover:text-primary transition-colors">
                        <div className="font-medium text-sm">{getDisplayName(lead)}</div>
                        {(lead.contactTypes?.length ?? 0) > 0 && (
                          <div className="text-xs text-secondary">{lead.contactTypes!.join(", ")}</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-secondary">
                      <div>{contact}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.stage ? <StageBadge stage={lead.stage} /> : <span className="text-xs text-secondary">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-secondary">{lead.source || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-secondary font-[family-name:var(--font-geist-mono)]">
                      {lead.created ? new Date(lead.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-secondary">
        Showing {filtered.length} of {total.toLocaleString()} total leads
      </div>
    </div>
  );
}
