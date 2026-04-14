"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSetup } from "./setup-context";
import type { Credential } from "./rollout";

interface CredentialContextValue {
  credentials: Credential[];
  selected: Credential | null;
  setSelected: (c: Credential | null) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  authHeaders: Record<string, string>;
}

const CredentialContext = createContext<CredentialContextValue>({
  credentials: [],
  selected: null,
  setSelected: () => {},
  loading: true,
  error: null,
  refresh: () => {},
  authHeaders: {},
});

const STORAGE_KEY = "rdc-selected-credential-id";

export function CredentialProvider({ children }: { children: ReactNode }) {
  const { clientId, clientSecret, consumerKey } = useSetup();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selected, setSelectedState] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders: Record<string, string> = {
    "x-rollout-client-id": clientId || "",
    "x-rollout-client-secret": clientSecret || "",
    "x-rollout-consumer-key": consumerKey || "",
  };

  const setSelected = useCallback((c: Credential | null) => {
    setSelectedState(c);
    if (c) {
      localStorage.setItem(STORAGE_KEY, c.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!clientId || !clientSecret || !consumerKey) return;
    setLoading(true);
    setError(null);
    setSelectedState(null);
    try {
      const res = await fetch("/api/credentials", {
        headers: {
          "x-rollout-client-id": clientId,
          "x-rollout-client-secret": clientSecret,
          "x-rollout-consumer-key": consumerKey,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch credentials");
      const data: Credential[] = await res.json();
      setCredentials(data);

      if (data.length > 0) {
        const savedId = localStorage.getItem(STORAGE_KEY);
        const saved = savedId ? data.find((c) => c.id === savedId) : null;
        setSelectedState(saved || data[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [clientId, clientSecret, consumerKey]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <CredentialContext.Provider value={{ credentials, selected, setSelected, loading, error, refresh, authHeaders }}>
      {children}
    </CredentialContext.Provider>
  );
}

export function useCredential() {
  return useContext(CredentialContext);
}
