"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface SetupContextValue {
  clientId: string | null;
  clientSecret: string | null;
  consumerKey: string;
  isConfigured: boolean;
  saveApiKeys: (clientId: string, clientSecret: string) => void;
  setConsumerKey: (key: string) => void;
  clear: () => void;
}

const SetupContext = createContext<SetupContextValue>({
  clientId: null,
  clientSecret: null,
  consumerKey: "user123",
  isConfigured: false,
  saveApiKeys: () => {},
  setConsumerKey: () => {},
  clear: () => {},
});

const API_STORAGE_KEY = "rdc-rollout-api-keys";
const CONSUMER_STORAGE_KEY = "rdc-rollout-consumer-key";

export function SetupProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [consumerKey, setConsumerKeyState] = useState("user123");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(API_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setClientId(parsed.clientId || null);
        setClientSecret(parsed.clientSecret || null);
      } catch { /* ignore */ }
    }
    const storedKey = localStorage.getItem(CONSUMER_STORAGE_KEY);
    if (storedKey) setConsumerKeyState(storedKey);
    setHydrated(true);
  }, []);

  const saveApiKeys = useCallback((id: string, secret: string) => {
    setClientId(id);
    setClientSecret(secret);
    localStorage.setItem(API_STORAGE_KEY, JSON.stringify({ clientId: id, clientSecret: secret }));
  }, []);

  const setConsumerKey = useCallback((key: string) => {
    setConsumerKeyState(key);
    localStorage.setItem(CONSUMER_STORAGE_KEY, key);
    // Clear selected credential when consumer key changes since credentials are user-scoped
    localStorage.removeItem("rdc-selected-credential-id");
  }, []);

  const clear = useCallback(() => {
    setClientId(null);
    setClientSecret(null);
    setConsumerKeyState("user123");
    localStorage.removeItem(API_STORAGE_KEY);
    localStorage.removeItem(CONSUMER_STORAGE_KEY);
    localStorage.removeItem("rdc-selected-credential-id");
  }, []);

  const isConfigured = hydrated && !!clientId && !!clientSecret;

  if (!hydrated) return null;

  return (
    <SetupContext.Provider value={{ clientId, clientSecret, consumerKey, isConfigured, saveApiKeys, setConsumerKey, clear }}>
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup() {
  return useContext(SetupContext);
}
