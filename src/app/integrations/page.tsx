"use client";

import { useCredential } from "@/lib/credential-context";

function formatAppKey(appKey: string): string {
  return appKey.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function IntegrationsPage() {
  const { credentials, loading } = useCredential();

  return (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          CRM Integrations
        </h1>
        <p className="text-secondary text-sm mt-1">
          Connected agent CRMs syncing via Rollout Universal API
        </p>
      </div>

      {loading ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">Loading credentials...</p>
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">No CRM credentials connected.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold font-[family-name:var(--font-dm-sans)]">{credentials.length}</span>
            <span className="text-secondary text-sm">connected CRM{credentials.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {credentials.map((cred) => {
              const name = formatAppKey(cred.appKey);
              const connected = new Date(cred.createdAt);
              return (
                <div key={cred.id} className="bg-surface rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                        <span className="text-sm font-bold text-secondary">
                          {cred.appKey.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{name}</div>
                        <div className="text-xs text-secondary font-[family-name:var(--font-geist-mono)]">
                          {cred.appKey}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Connected
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs text-secondary">
                        Connected {connected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-xs text-secondary font-[family-name:var(--font-geist-mono)]">
                        {cred.id.slice(0, 20)}...
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
