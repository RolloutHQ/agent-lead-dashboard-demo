"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCredential } from "@/lib/credential-context";
import { StageBadge } from "@/components/stage-badge";
import type { Person, CrmUser } from "@/lib/types";

function formatAppKey(appKey: string): string {
  return appKey.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getContactValue(item: { value: string } | string): string {
  return typeof item === "string" ? item : item.value;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { selected, loading: credLoading } = useCredential();
  const [person, setPerson] = useState<Person | null>(null);
  const [agent, setAgent] = useState<CrmUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected || !id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/people/${id}`, {
      headers: { "x-credential-id": selected.id },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load lead");
        return r.json();
      })
      .then((data) => {
        setPerson(data.person || null);
        setAgent(data.assignedAgent || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected, id]);

  if (credLoading || loading) {
    return (
      <div className="max-w-[1200px]">
        <BackLink />
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="max-w-[1200px]">
        <BackLink />
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-error text-sm">{error || "Lead not found"}</p>
        </div>
      </div>
    );
  }

  const displayName = person.name || [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unknown";
  const emails = (person.emails || []).map(getContactValue).filter(Boolean);
  const phones = (person.phones || []).map(getContactValue).filter(Boolean);
  const addresses = person.addresses?.filter((a) => a.city || a.state || a.street) || [];
  const hasContactInfo = emails.length > 0 || phones.length > 0 || addresses.length > 0;
  const hasAssignment = agent || person.assignedUserId;

  return (
    <div className="max-w-[1200px]">
      <BackLink />

      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          {displayName}
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {person.stage && <StageBadge stage={person.stage} />}
          {(person.contactTypes?.length ?? 0) > 0 && (
            <span className="text-xs text-secondary">{person.contactTypes!.join(", ")}</span>
          )}
          <span className="text-xs text-secondary font-[family-name:var(--font-geist-mono)]">
            {selected ? formatAppKey(selected.appKey) : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: Overview */}
        <div className="col-span-2 space-y-6">
          {/* Lead Summary */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-medium text-secondary uppercase tracking-wider mb-4">Lead Overview</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {person.stage && (
                <div>
                  <dt className="text-xs text-secondary">Stage</dt>
                  <dd className="text-sm font-medium mt-0.5">{person.stage}</dd>
                </div>
              )}
              {person.source && (
                <div>
                  <dt className="text-xs text-secondary">Source</dt>
                  <dd className="text-sm mt-0.5">{person.source}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-secondary">Created</dt>
                <dd className="text-sm font-[family-name:var(--font-geist-mono)] mt-0.5">
                  {person.created ? new Date(person.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Last Updated</dt>
                <dd className="text-sm font-[family-name:var(--font-geist-mono)] mt-0.5">
                  {person.updated ? new Date(person.updated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </dd>
              </div>
              {person.lastActivity && (
                <div>
                  <dt className="text-xs text-secondary">Last Activity</dt>
                  <dd className="text-sm font-[family-name:var(--font-geist-mono)] mt-0.5">
                    {new Date(person.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </dd>
                </div>
              )}
              {person.lastActivityType && (
                <div>
                  <dt className="text-xs text-secondary">Activity Type</dt>
                  <dd className="text-sm mt-0.5">{person.lastActivityType}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {person.tags?.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-xs font-medium text-secondary uppercase tracking-wider mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {person.tags.map((t) => (
                  <span key={t} className="text-xs bg-background px-3 py-1 rounded-full text-foreground border border-border">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All Emails */}
          {emails.length > 1 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-xs font-medium text-secondary uppercase tracking-wider mb-3">All Email Addresses</h2>
              <div className="space-y-1.5">
                {emails.map((e) => (
                  <div key={e} className="text-sm">{e}</div>
                ))}
              </div>
            </div>
          )}

          {/* All Phones */}
          {phones.length > 1 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h2 className="text-xs font-medium text-secondary uppercase tracking-wider mb-3">All Phone Numbers</h2>
              <div className="space-y-1.5">
                {phones.map((p) => (
                  <div key={p} className="text-sm font-[family-name:var(--font-geist-mono)]">{p}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {hasContactInfo && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-xs font-medium text-secondary uppercase tracking-wider mb-4">Contact Info</h3>
              <dl className="space-y-3">
                {emails[0] && (
                  <div>
                    <dt className="text-xs text-secondary">Email</dt>
                    <dd className="text-sm">{emails[0]}</dd>
                  </div>
                )}
                {phones[0] && (
                  <div>
                    <dt className="text-xs text-secondary">Phone</dt>
                    <dd className="text-sm font-[family-name:var(--font-geist-mono)]">{phones[0]}</dd>
                  </div>
                )}
                {addresses[0] && (
                  <div>
                    <dt className="text-xs text-secondary">Address</dt>
                    <dd className="text-sm">
                      {[addresses[0].street, addresses[0].city, addresses[0].state, addresses[0].code]
                        .filter(Boolean)
                        .join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {hasAssignment && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-xs font-medium text-secondary uppercase tracking-wider mb-4">Assignment</h3>
              <dl className="space-y-3">
                {agent && (
                  <>
                    <div>
                      <dt className="text-xs text-secondary">Assigned Agent</dt>
                      <dd className="text-sm font-medium">
                        {agent.name || [agent.firstName, agent.lastName].filter(Boolean).join(" ")}
                      </dd>
                    </div>
                    {agent.email && (
                      <div>
                        <dt className="text-xs text-secondary">Agent Email</dt>
                        <dd className="text-sm">{agent.email}</dd>
                      </div>
                    )}
                  </>
                )}
                {!agent && person.assignedUserId && (
                  <div>
                    <dt className="text-xs text-secondary">Assigned User ID</dt>
                    <dd className="text-sm font-[family-name:var(--font-geist-mono)] text-secondary">{person.assignedUserId.slice(0, 16)}...</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-secondary">CRM</dt>
                  <dd className="text-sm">{selected ? formatAppKey(selected.appKey) : "—"}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="text-xs font-medium text-secondary uppercase tracking-wider mb-4">Record Info</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-secondary">Rollout ID</dt>
                <dd className="text-sm font-[family-name:var(--font-geist-mono)] text-secondary break-all">{person.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Credential</dt>
                <dd className="text-sm font-[family-name:var(--font-geist-mono)] text-secondary break-all">{selected?.id || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-foreground transition-colors mb-6"
    >
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 4l-4 4 4 4" />
      </svg>
      Back to Dashboard
    </Link>
  );
}
