"use client";

import { useState } from "react";
import { useCredential } from "@/lib/credential-context";
import { useSetup } from "@/lib/setup-context";

export function CredentialSelector() {
  const { credentials, selected, setSelected, loading, error, refresh } = useCredential();
  const { consumerKey, setConsumerKey, clear } = useSetup();
  const [editingKey, setEditingKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState(consumerKey);

  function handleKeySubmit() {
    if (keyDraft.trim() && keyDraft.trim() !== consumerKey) {
      setConsumerKey(keyDraft.trim());
    }
    setEditingKey(false);
  }

  return (
    <div className="space-y-3">
      {/* Consumer Key */}
      <div>
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Consumer Key</span>
        {editingKey ? (
          <div className="flex gap-1.5 mt-1">
            <input
              type="text"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleKeySubmit(); if (e.key === "Escape") { setEditingKey(false); setKeyDraft(consumerKey); } }}
              className="flex-1 bg-white/10 text-white text-sm rounded-lg px-2.5 py-1 border border-white/20 outline-none focus:border-white/40 font-[family-name:var(--font-geist-mono)]"
              autoFocus
            />
            <button onClick={handleKeySubmit} className="text-xs text-success hover:text-white transition-colors px-1.5">
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setKeyDraft(consumerKey); setEditingKey(true); }}
            className="mt-1 w-full text-left bg-white/10 text-white text-sm rounded-lg px-2.5 py-1 border border-white/10 hover:border-white/20 transition-colors font-[family-name:var(--font-geist-mono)] truncate"
          >
            {consumerKey}
          </button>
        )}
      </div>

      {/* CRM Credential Selector */}
      <div>
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">CRM Credential</span>
        {loading ? (
          <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
            <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
            Loading...
          </div>
        ) : error ? (
          <div className="mt-1">
            <div className="flex items-center gap-2 text-xs text-error">
              <span className="w-2 h-2 rounded-full bg-error" />
              Error
            </div>
            <button onClick={refresh} className="text-xs text-white/40 hover:text-white mt-1 transition-colors">
              Retry
            </button>
          </div>
        ) : credentials.length === 0 ? (
          <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
            <span className="w-2 h-2 rounded-full bg-warning" />
            No credentials
          </div>
        ) : (
          <select
            value={selected?.id || ""}
            onChange={(e) => {
              const cred = credentials.find((c) => c.id === e.target.value);
              setSelected(cred || null);
            }}
            className="mt-1 w-full bg-white/10 text-white text-sm rounded-lg px-2.5 py-1.5 border border-white/10 outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
          >
            {credentials.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#1A1A26] text-white">
                {c.label || c.appKey} — {c.id.slice(0, 8)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Disconnect */}
      <button
        onClick={clear}
        className="w-full text-xs text-white/30 hover:text-white/60 transition-colors text-left mt-2"
      >
        Disconnect
      </button>
    </div>
  );
}
