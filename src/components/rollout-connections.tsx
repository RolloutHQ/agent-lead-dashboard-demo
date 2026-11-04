"use client";

import { useCallback, useEffect, useState } from "react";
import { RolloutLinkProvider, CredentialsManager } from "@rollout/link-react";
import { useCredential } from "@/lib/credential-context";
import { useSetup } from "@/lib/setup-context";

type Category = "crm" | "tms";

// Rollout Link opens the OAuth window itself and fails silently when the browser blocks it.
function usePopupBlocked() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const original = window.open;
    window.open = function (...args: Parameters<typeof window.open>) {
      const popup = original.apply(window, args);
      setBlocked(!popup);
      return popup;
    };
    return () => {
      window.open = original;
    };
  }, []);

  return [blocked, () => setBlocked(false)] as const;
}

export function RolloutConnections({ category }: { category: Category }) {
  const { refresh } = useCredential();
  const { clientId, clientSecret, consumerKey } = useSetup();
  const [popupBlocked, dismissPopupBlocked] = usePopupBlocked();

  const fetchToken = useCallback(() => {
    if (!clientId || !clientSecret) return Promise.resolve("");
    return fetch("/api/rollout-token", {
      headers: {
        "x-rollout-client-id": clientId,
        "x-rollout-client-secret": clientSecret,
        "x-rollout-consumer-key": consumerKey,
      },
    })
      .then((r) => r.json())
      .then((d) => d.token as string);
  }, [clientId, clientSecret, consumerKey]);

  return (
    <>
      {popupBlocked && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-5 py-4 flex items-start justify-between gap-4">
          <div className="text-sm">
            <div className="font-medium">Your browser blocked the sign-in window</div>
            <div className="text-secondary mt-0.5">
              Allow pop-ups for this site (click the blocked pop-up icon at the right of the address bar, then
              &ldquo;Always allow&rdquo;), then click <strong>Connect Account</strong> again.
            </div>
          </div>
          <button onClick={dismissPopupBlocked} className="text-xs text-secondary hover:text-foreground shrink-0">
            Dismiss
          </button>
        </div>
      )}
      <div className="rollout-embed bg-surface rounded-xl border border-border p-6">
        <RolloutLinkProvider token={fetchToken}>
          <CredentialsManager
            apiCategories={{ [category]: true }}
            shouldRenderConnector={category === "crm" ? (connector) => connector.appKey !== "cloze-api-key" : undefined}
            onCredentialAdded={() => refresh()}
            onCredentialDeleted={() => refresh()}
          />
        </RolloutLinkProvider>
      </div>
    </>
  );
}
