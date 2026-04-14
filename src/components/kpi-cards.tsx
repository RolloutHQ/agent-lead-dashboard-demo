"use client";

import { useEffect, useState } from "react";
import { useCredential } from "@/lib/credential-context";
import type { Person } from "@/lib/types";

function formatAppKey(appKey: string): string {
  return appKey
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function KpiCards() {
  const { selected, authHeaders } = useCredential();
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!selected) return;
    fetch("/api/people", {
      headers: { ...authHeaders, "x-credential-id": selected.id },
    })
      .then((res) => res.json())
      .then((data) => {
        setPeople(data.data || []);
        setTotal(data._metadata?.total || data.data?.length || 0);
      })
      .catch(() => {});
  }, [selected]);

  const withStage = people.filter((p) => p.stage).length;
  const withContact = people.filter(
    (p) => (p.emails?.length > 0) || (p.phones?.length > 0)
  ).length;
  const stagePercent = people.length > 0 ? ((withStage / people.length) * 100).toFixed(0) : "0";
  const contactPercent = people.length > 0 ? ((withContact / people.length) * 100).toFixed(0) : "0";

  const kpis = [
    {
      label: "Total Leads",
      value: total.toLocaleString(),
      sub: `${people.length} loaded`,
      icon: LeadsIcon,
    },
    {
      label: "With Stage",
      value: withStage.toLocaleString(),
      sub: `${stagePercent}% of loaded leads`,
      icon: StageIcon,
    },
    {
      label: "With Contact Info",
      value: withContact.toLocaleString(),
      sub: `${contactPercent}% have email or phone`,
      icon: ContactIcon,
    },
    {
      label: "Connected CRM",
      value: selected ? formatAppKey(selected.appKey) : "—",
      sub: selected ? `Since ${new Date(selected.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "No credential selected",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`rounded-xl border px-5 py-4 ${
            kpi.highlight
              ? "bg-primary text-white border-primary"
              : "bg-surface border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-medium tracking-wide uppercase ${
                kpi.highlight ? "text-white/80" : "text-secondary"
              }`}
            >
              {kpi.label}
            </span>
            {kpi.icon && (
              <kpi.icon
                className={`w-4 h-4 ${
                  kpi.highlight ? "text-white/60" : "text-secondary"
                }`}
              />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
              {kpi.value}
            </span>
          </div>
          <span
            className={`text-xs mt-1 block ${
              kpi.highlight ? "text-white/60" : "text-secondary"
            }`}
          >
            {kpi.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

function LeadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
    </svg>
  );
}

function StageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 2" />
    </svg>
  );
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M2 4l6 4.5L14 4" />
    </svg>
  );
}
