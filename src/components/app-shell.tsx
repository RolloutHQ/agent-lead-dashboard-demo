"use client";

import { SetupProvider, useSetup } from "@/lib/setup-context";
import { CredentialProvider } from "@/lib/credential-context";
import { SetupScreen } from "./setup-screen";
import { Sidebar } from "./sidebar";
import type { ReactNode } from "react";

function AppContent({ children }: { children: ReactNode }) {
  const { isConfigured } = useSetup();

  if (!isConfigured) {
    return <SetupScreen />;
  }

  return (
    <CredentialProvider>
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </CredentialProvider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SetupProvider>
      <AppContent>{children}</AppContent>
    </SetupProvider>
  );
}
