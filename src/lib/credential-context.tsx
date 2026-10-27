"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSetup } from "./setup-context";
import type { Credential } from "./rollout";

interface CredentialContextValue {
  credentials: Credential[];
  selected: Credential | null;
  setSelected: (c: Credential | null) => void;
  tmsCredentials: Credential[];
  tmsSelected: Credential | null;
  setTmsSelected: (c: Credential | null) => void;
  tmsError: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  authHeaders: Record<string, string>;
}

const CredentialContext = createContext<CredentialContextValue>({
  credentials: [],
  selected: null,
  setSelected: () => {},
  tmsCredentials: [],
  tmsSelected: null,
  setTmsSelected: () => {},
  tmsError: null,
  loading: true,
  error: null,
  refresh: () => {},
  authHeaders: {},
});

const STORAGE_KEY = "lead-dashboard-selected-credential-id";
const TMS_STORAGE_KEY = "lead-dashboard-selected-tms-credential-id";

function readStored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}

function pickSaved(list: Credential[], key: string): Credential | null {
  const savedId = readStored(key);
  const next = list.find((c) => c.id === savedId) || list[0] || null;
  writeStored(key, next?.id ?? null);
  return next;
}

export function CredentialProvider({ children }: { children: ReactNode }) {
  const { clientId, clientSecret, consumerKey } = useSetup();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selected, setSelectedState] = useState<Credential | null>(null);
  const [tmsCredentials, setTmsCredentials] = useState<Credential[]>([]);
  const [tmsSelected, setTmsSelectedState] = useState<Credential | null>(null);
  const [tmsError, setTmsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders: Record<string, string> = {
    "x-rollout-client-id": clientId || "",
    "x-rollout-client-secret": clientSecret || "",
    "x-rollout-consumer-key": consumerKey || "",
  };

  const setSelected = useCallback((c: Credential | null) => {
    setSelectedState(c);
    writeStored(STORAGE_KEY, c?.id ?? null);
  }, []);

  const setTmsSelected = useCallback((c: Credential | null) => {
    setTmsSelectedState(c);
    writeStored(TMS_STORAGE_KEY, c?.id ?? null);
  }, []);

  const refresh = useCallback(() => {
    if (!clientId || !clientSecret || !consumerKey) return;
    const headers = {
      "x-rollout-client-id": clientId,
      "x-rollout-client-secret": clientSecret,
      "x-rollout-consumer-key": consumerKey,
    };
    const load = (category: "crm" | "tms") =>
      fetch(`/api/credentials?category=${category}`, { headers }).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${category.toUpperCase()} credentials`);
        return res.json() as Promise<Credential[]>;
      });
    const errorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : "Unknown error");

    Promise.allSettled([load("crm"), load("tms")]).then(([crm, tms]) => {
      setCredentials(crm.status === "fulfilled" ? crm.value : []);
      setSelectedState(crm.status === "fulfilled" ? pickSaved(crm.value, STORAGE_KEY) : null);
      setError(crm.status === "rejected" ? errorMessage(crm.reason) : null);

      setTmsCredentials(tms.status === "fulfilled" ? tms.value : []);
      setTmsSelectedState(tms.status === "fulfilled" ? pickSaved(tms.value, TMS_STORAGE_KEY) : null);
      setTmsError(tms.status === "rejected" ? errorMessage(tms.reason) : null);

      setLoading(false);
    });
  }, [clientId, clientSecret, consumerKey]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <CredentialContext.Provider
      value={{
        credentials,
        selected,
        setSelected,
        tmsCredentials,
        tmsSelected,
        setTmsSelected,
        tmsError,
        loading,
        error,
        refresh,
        authHeaders,
      }}
    >
      {children}
    </CredentialContext.Provider>
  );
}

export function useCredential() {
  return useContext(CredentialContext);
}
