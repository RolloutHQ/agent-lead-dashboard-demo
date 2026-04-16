"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCredential } from "@/lib/credential-context";
import { StageBadge } from "@/components/stage-badge";
import { ActivityTimeline } from "@/components/activity-timeline";
import type { Person, CrmUser, Call, Note, TextMessage, EmailMessage, ActivityItem } from "@/lib/types";

function formatAppKey(appKey: string): string {
  return appKey.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function activityRecency(iso: string): "active" | "inactive" {
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (days <= 30) return "active";
  return "inactive";
}

const recencyConfig = {
  active: { label: "Active", color: "text-success", bg: "bg-success/10", border: "border-success/20", dot: "bg-success", ring: "ring-success/20" },
  inactive: { label: "Inactive", color: "text-secondary", bg: "bg-secondary/5", border: "border-border", dot: "bg-secondary/40", ring: "ring-secondary/10" },
} as const;

const activityTypeIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  call: {
    label: "Phone Call",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
  note: {
    label: "Note",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
  },
  text: {
    label: "Text Message",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  email: {
    label: "Email",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
};

function getContactValue(item: { value: string } | string): string {
  return typeof item === "string" ? item : item.value;
}

function toIso(v: string | number | undefined): string {
  if (v == null) return "";
  if (typeof v === "number") {
    return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  }
  if (/^\d+$/.test(v)) {
    const n = Number(v);
    return new Date(n < 1e12 ? n * 1000 : n).toISOString();
  }
  return v;
}

function normalizeActivities(data: {
  calls?: Call[];
  notes?: Note[];
  textMessages?: TextMessage[];
  emailMessages?: EmailMessage[];
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const c of data.calls || []) {
    const dir = c.isIncoming ? "Incoming" : "Outgoing";
    const dur = c.duration ? ` (${Math.ceil(c.duration / 60)} min)` : "";
    items.push({
      id: c.id,
      type: "call",
      title: `${dir} Call${dur}`,
      description: c.outcome || c.note || `${c.fromNumber || ""} → ${c.toNumber || ""}`.trim(),
      timestamp: toIso(c.created),
      personId: c.personId,
      userId: c.userId,
    });
  }

  for (const n of data.notes || []) {
    items.push({
      id: n.id,
      type: "note",
      title: n.subject || "Note",
      description: n.body?.slice(0, 140) || "",
      timestamp: toIso(n.created),
      personId: n.personId,
      userId: n.createdByUserId,
    });
  }

  for (const t of data.textMessages || []) {
    items.push({
      id: t.id,
      type: "text",
      title: "Text Message",
      description: t.body?.slice(0, 140) || `${t.fromNumber || ""} → ${t.toNumber || ""}`.trim(),
      timestamp: toIso(t.created),
      personId: t.personId,
    });
  }

  for (const e of data.emailMessages || []) {
    items.push({
      id: e.id,
      type: "email",
      title: e.subject || "Email",
      description: e.body?.slice(0, 140) || "",
      timestamp: toIso(e.created),
      personId: e.personId,
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { selected, loading: credLoading, authHeaders } = useCredential();
  const [person, setPerson] = useState<Person | null>(null);
  const [agent, setAgent] = useState<CrmUser | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected || !id) return;
    setLoading(true);
    setError(null);

    const headers = { ...authHeaders, "x-credential-id": selected.id };

    Promise.all([
      fetch(`/api/people/${id}`, { headers }).then((r) => {
        if (!r.ok) throw new Error("Failed to load lead");
        return r.json();
      }),
      fetch(`/api/activities?personId=${id}`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([personData, activityData]) => {
        setPerson(personData.person || null);
        setAgent(personData.assignedAgent || null);
        setActivities(activityData ? normalizeActivities(activityData) : []);
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
          {/* Last Activity Status Card */}
          {(() => {
            const lastAct = activities[0];
            const lastTimestamp = lastAct?.timestamp || person.lastActivity;
            const lastType = lastAct?.type || person.lastActivityType;
            const recency = lastTimestamp ? activityRecency(lastTimestamp) : "inactive";
            const config = recencyConfig[recency];
            const typeInfo = lastType ? activityTypeIcons[lastType] : null;

            // Count activities by type
            const counts: Record<string, number> = {};
            for (const a of activities) {
              counts[a.type] = (counts[a.type] || 0) + 1;
            }

            return (
              <div className={`rounded-xl border p-5 ${config.bg} ${config.border}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg} ${config.color} ring-1 ${config.ring}`}>
                      {typeInfo?.icon ?? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${config.color}`}>
                          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                        <span className="relative group">
                          <svg className="w-3.5 h-3.5 text-secondary/50 cursor-help" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-foreground bg-surface border border-border rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10">
                            A lead is <strong>Active</strong> if there has been any activity<br />(call, text, note, or email) within the last 30 days.
                          </span>
                        </span>
                        {lastTimestamp && (
                          <span className="text-xs text-secondary font-[family-name:var(--font-geist-mono)]">
                            {formatRelativeTime(lastTimestamp)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        {lastTimestamp ? (
                          <>
                            Last {typeInfo?.label ?? lastType ?? "activity"} on{" "}
                            {new Date(lastTimestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                          </>
                        ) : (
                          "No activity recorded for this lead"
                        )}
                      </div>
                    </div>
                  </div>
                  {activities.length > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-secondary">{activities.length} total</div>
                    </div>
                  )}
                </div>

                {/* Activity type breakdown */}
                {Object.keys(counts).length > 0 && (
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
                    {Object.entries(counts).map(([type, count]) => {
                      const info = activityTypeIcons[type];
                      return (
                        <div key={type} className="flex items-center gap-1.5 text-xs text-secondary">
                          <span className="opacity-60">{info?.icon}</span>
                          <span>{count} {info?.label ?? type}{count !== 1 ? "s" : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

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

          {/* Activity Timeline */}
          {activities.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-secondary uppercase tracking-wider mb-3">Activity</h2>
              <ActivityTimeline activities={activities} />
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
