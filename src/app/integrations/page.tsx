"use client";

import { useCallback } from "react";
import { RolloutLinkProvider, CredentialsManager } from "@rollout/link-react";
import { useCredential } from "@/lib/credential-context";
import { useSetup } from "@/lib/setup-context";

export default function IntegrationsPage() {
  const { refresh } = useCredential();
  const { clientId, clientSecret, consumerKey } = useSetup();

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
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          CRM Integrations
        </h1>
        <p className="text-secondary text-sm mt-1">
          Connect and manage your CRM integrations via Rollout
        </p>
      </div>

      <div className="rollout-embed bg-surface rounded-xl border border-border p-6">
        <RolloutLinkProvider token={fetchToken}>
          <CredentialsManager
            apiCategories={{ crm: true }}
            shouldRenderConnector={(connector) => connector.appKey !== "cloze-api-key"}
            onCredentialAdded={() => refresh()}
            onCredentialDeleted={() => refresh()}
          />
        </RolloutLinkProvider>
      </div>
    </div>
  );
}
