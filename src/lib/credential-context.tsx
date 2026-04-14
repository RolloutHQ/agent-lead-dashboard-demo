"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Credential } from "./rollout";

interface CredentialContextValue {
  credentials: Credential[];
  selected: Credential | null;
  setSelected: (c: Credential | null) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const CredentialContext = createContext<CredentialContextValue>({
  credentials: [],
  selected: null,
  setSelected: () => {},
  loading: true,
  error: null,
  refresh: () => {},
});

const STORAGE_KEY = "rdc-selected-credential-id";

export function CredentialProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selected, setSelectedState] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const setSelected = useCallback((c: Credential | null) => {
    setSelectedState(c);
    if (c) {
      localStorage.setItem(STORAGE_KEY, c.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credentials");
      if (!res.ok) throw new Error("Failed to fetch credentials");
      const data: Credential[] = await res.json();
      setCredentials(data);

      if (!initialized && data.length > 0) {
        const savedId = localStorage.getItem(STORAGE_KEY);
        const saved = savedId ? data.find((c) => c.id === savedId) : null;
        setSelectedState(saved || data[0]);
        setInitialized(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <CredentialContext.Provider value={{ credentials, selected, setSelected, loading, error, refresh }}>
      {children}
    </CredentialContext.Provider>
  );
}

export function useCredential() {
  return useContext(CredentialContext);
}
