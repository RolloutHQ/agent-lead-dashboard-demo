"use client";

import { useState } from "react";
import { useSetup } from "@/lib/setup-context";

export function SetupScreen() {
  const { saveApiKeys } = useSetup();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) return;

    setTesting(true);
    setError(null);

    try {
      // Test with a default consumer key first
      const res = await fetch("/api/credentials", {
        headers: {
          "x-rollout-client-id": clientId.trim(),
          "x-rollout-client-secret": clientSecret.trim(),
          "x-rollout-consumer-key": "user123",
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Authentication failed (${res.status})`);
      }

      saveApiKeys(clientId.trim(), clientSecret.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white text-lg font-bold font-[family-name:var(--font-dm-sans)]">L</span>
            </div>
            <span className="text-xl font-semibold font-[family-name:var(--font-dm-sans)] tracking-tight text-foreground">
              Lead Dashboard
            </span>
          </div>
          <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight text-foreground">
            Connect to Rollout
          </h1>
          <p className="text-secondary text-sm mt-2">
            Enter your Rollout API credentials to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 space-y-5">
          <div>
            <label htmlFor="clientId" className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">
              Client ID
            </label>
            <input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="019350c5-2b76-778f-..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-secondary/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors font-[family-name:var(--font-geist-mono)]"
            />
          </div>

          <div>
            <label htmlFor="clientSecret" className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">
              Client Secret
            </label>
            <input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Your client secret"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-secondary/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          {error && (
            <div className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={testing || !clientId.trim() || !clientSecret.trim()}
            className="w-full py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? "Connecting..." : "Connect"}
          </button>
        </form>

        <p className="text-xs text-secondary text-center mt-4">
          Credentials are stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
