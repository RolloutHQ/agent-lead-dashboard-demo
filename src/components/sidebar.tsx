"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CredentialSelector } from "./credential-selector";

const nav = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Leads", href: "/leads", icon: LeadsIcon },
  { label: "Create Lead", href: "/create-lead", icon: CreateLeadIcon },
  { label: "Transactions", href: "/transactions", icon: TransactionsIcon },
  { label: "CRM Users", href: "/agents", icon: AgentsIcon },
  { label: "CRM Integrations", href: "/integrations", icon: IntegrationsIcon },
  { label: "TMS Integrations", href: "/tms-integrations", icon: TmsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 bg-[#1A1A26] text-white flex flex-col h-full min-h-0">
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-white text-sm font-bold font-[family-name:var(--font-dm-sans)]">L</span>
        </div>
        <span className="text-base font-semibold font-[family-name:var(--font-dm-sans)] tracking-tight">
          Lead Dashboard
        </span>
      </div>
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto min-h-0">
        {nav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <CredentialSelector />
      </div>
    </aside>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
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

function AgentsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5" r="2.5" />
      <circle cx="11" cy="5" r="2.5" />
      <path d="M1 14c0-2.8 2.2-4.5 5-4.5" />
      <path d="M15 14c0-2.8-2.2-4.5-5-4.5" />
    </svg>
  );
}

function CreateLeadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="6" r="3" />
      <path d="M2 14c0-3.3 2.7-5 6-5" />
      <path d="M12 10v4M10 12h4" />
    </svg>
  );
}

function TransactionsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 7.5L8 2.5l6 5" />
      <path d="M3.5 6.5V14h9V6.5" />
      <path d="M6.5 14v-3.5h3V14" />
    </svg>
  );
}

function TmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 1h6l3 3v11H4z" />
      <path d="M10 1v3h3" />
      <path d="M6.5 9.5l1.5 1.5 3-3" />
    </svg>
  );
}

function IntegrationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="5" height="8" rx="1" />
      <rect x="10" y="4" width="5" height="8" rx="1" />
      <path d="M6 8h4" />
    </svg>
  );
}
