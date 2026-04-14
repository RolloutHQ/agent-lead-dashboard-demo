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
          <div className="mt-1 space-y-1.5">
            <input
              type="text"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleKeySubmit(); if (e.key === "Escape") { setEditingKey(false); setKeyDraft(consumerKey); } }}
              className="w-full bg-white/10 text-white text-sm rounded-lg px-2.5 py-1 border border-white/20 outline-none focus:border-white/40 font-[family-name:var(--font-geist-mono)]"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleKeySubmit} className="text-xs text-success hover:text-white transition-colors">
                Save
              </button>
              <button onClick={() => { setEditingKey(false); setKeyDraft(consumerKey); }} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Cancel
              </button>
            </div>
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
          <div className="relative mt-1">
            <select
              value={selected?.id || ""}
              onChange={(e) => {
                const cred = credentials.find((c) => c.id === e.target.value);
                setSelected(cred || null);
              }}
              className="w-full bg-white/10 text-white text-sm rounded-lg pl-2.5 pr-8 py-1.5 border border-white/20 outline-none hover:border-white/30 focus:border-white/40 transition-colors appearance-none cursor-pointer"
            >
              {credentials.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1A1A26] text-white">
                  {c.label || c.appKey} — {c.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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
