"use client";

import { useCredential } from "@/lib/credential-context";

export function CredentialSelector() {
  const { credentials, selected, setSelected, loading, error } = useCredential();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-secondary">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        Loading credentials...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-error">
        <span className="w-2 h-2 rounded-full bg-error" />
        {error}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-secondary">
        <span className="w-2 h-2 rounded-full bg-warning" />
        No credentials found
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/40 uppercase tracking-wider font-medium">CRM</span>
      <select
        value={selected?.id || ""}
        onChange={(e) => {
          const cred = credentials.find((c) => c.id === e.target.value);
          setSelected(cred || null);
        }}
        className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer min-w-[180px]"
      >
        {credentials.map((c) => (
          <option key={c.id} value={c.id} className="bg-[#1A1A26] text-white">
            {c.label || c.appKey} — {c.id.slice(0, 8)}
          </option>
        ))}
      </select>
    </div>
  );
}
