"use client";

import { useEffect, useState, useCallback } from "react";
import { useCredential } from "@/lib/credential-context";

interface CrmUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Stage {
  id: string;
  name: string;
}

type Status =
  | { step: "idle" }
  | { step: "creating"; message: string }
  | { step: "verifying"; message: string }
  | { step: "assigning"; message: string }
  | { step: "success"; message: string; personId: string }
  | { step: "error"; message: string };

const DUMMY_LEADS = [
  { firstName: "Jordan", lastName: "Rivera", email: "jordan.rivera@example.com", phone: "555-201-4433", source: "Zillow" },
  { firstName: "Taylor", lastName: "Chen", email: "taylor.chen@example.com", phone: "555-318-7792", source: "Realtor.com" },
  { firstName: "Morgan", lastName: "Patel", email: "morgan.patel@example.com", phone: "555-442-1168", source: "Referral" },
  { firstName: "Casey", lastName: "Thompson", email: "casey.thompson@example.com", phone: "555-659-3301", source: "Website" },
  { firstName: "Alex", lastName: "Nguyen", email: "alex.nguyen@example.com", phone: "555-773-5540", source: "Open House" },
];

function formatAppKey(appKey: string): string {
  return appKey.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function CreateLeadPage() {
  const { selected, loading: credLoading, authHeaders } = useCredential();

  const [agents, setAgents] = useState<CrmUser[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");

  const [status, setStatus] = useState<Status>({ step: "idle" });

  // Pre-fill with random dummy lead
  const fillDummy = useCallback(() => {
    const lead = DUMMY_LEADS[Math.floor(Math.random() * DUMMY_LEADS.length)];
    setFirstName(lead.firstName);
    setLastName(lead.lastName);
    setEmail(lead.email);
    setPhone(lead.phone);
    setSource(lead.source);
  }, []);

  // Load agents and stages when credential changes
  useEffect(() => {
    if (!selected) return;
    setLoadingData(true);
    Promise.all([
      fetch("/api/users", { headers: { ...authHeaders, "x-credential-id": selected.id } }).then((r) => r.json()),
      fetch("/api/stages", { headers: { ...authHeaders, "x-credential-id": selected.id } }).then((r) => r.json()),
    ])
      .then(([usersData, stagesData]) => {
        const usersList = usersData.data || [];
        setAgents(usersList);
        setStages(stagesData.data || []);
        if (usersList.length > 0) setSelectedAgentId(usersList[0].id);
      })
      .catch(() => {
        setAgents([]);
        setStages([]);
      })
      .finally(() => setLoadingData(false));
  }, [selected]);

  // Auto-fill dummy data on mount
  useEffect(() => {
    fillDummy();
  }, [fillDummy]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const headers: Record<string, string> = {
      ...authHeaders,
      "Content-Type": "application/json",
      "x-credential-id": selected.id,
    };

    // Step 1: Create the lead
    setStatus({ step: "creating", message: "Creating lead in CRM..." });

    const body: Record<string, unknown> = {
      firstName,
      lastName,
      emails: [{ value: email, type: "primary", isPrimary: true }],
      phones: [{ value: phone, type: "mobile", isPrimary: true }],
      source,
      assignedUserId: selectedAgentId || undefined,
      stageId: selectedStageId || undefined,
    };

    let createRes: Response;
    try {
      createRes = await fetch("/api/people", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch {
      setStatus({ step: "error", message: "Network error while creating lead." });
      return;
    }

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({ error: "Unknown error" }));
      setStatus({ step: "error", message: `Failed to create lead: ${err.error || createRes.statusText}` });
      return;
    }

    const created = await createRes.json();
    const personId = created.id;

    if (!personId) {
      setStatus({ step: "error", message: "Lead created but no ID returned from CRM." });
      return;
    }

    // Step 2: Verify the lead exists and check agent assignment
    setStatus({ step: "verifying", message: `Lead created (${personId}). Verifying assignment...` });

    let verifyRes: Response;
    try {
      verifyRes = await fetch(`/api/people/${personId}`, { headers });
    } catch {
      setStatus({
        step: "success",
        message: `Lead created (${personId}) but could not verify — the CRM may take a moment to sync.`,
        personId,
      });
      return;
    }

    if (!verifyRes.ok) {
      setStatus({
        step: "success",
        message: `Lead created (${personId}) but verification returned ${verifyRes.status}. The CRM may take a moment to sync.`,
        personId,
      });
      return;
    }

    const verified = await verifyRes.json();
    const person = verified.person;
    const agentAssigned = person?.assignedUserId === selectedAgentId;

    if (agentAssigned || !selectedAgentId) {
      const agentName = verified.assignedAgent
        ? verified.assignedAgent.name || `${verified.assignedAgent.firstName} ${verified.assignedAgent.lastName}`
        : null;
      setStatus({
        step: "success",
        message: agentName
          ? `Lead "${firstName} ${lastName}" created and assigned to ${agentName}.`
          : `Lead "${firstName} ${lastName}" created successfully.`,
        personId,
      });
      return;
    }

    // Step 3: Agent not assigned during creation — assign via PUT
    setStatus({ step: "assigning", message: `Agent not assigned during creation. Assigning via update...` });

    let assignRes: Response;
    try {
      assignRes = await fetch(`/api/people/${personId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ assignedUserId: selectedAgentId }),
      });
    } catch {
      setStatus({
        step: "success",
        message: `Lead created (${personId}) but agent assignment failed due to a network error.`,
        personId,
      });
      return;
    }

    if (!assignRes.ok) {
      setStatus({
        step: "success",
        message: `Lead created (${personId}) but agent assignment update returned ${assignRes.status}.`,
        personId,
      });
      return;
    }

    const selectedAgent = agents.find((a) => a.id === selectedAgentId);
    const agentLabel = selectedAgent
      ? selectedAgent.name || `${selectedAgent.firstName} ${selectedAgent.lastName}`
      : "selected agent";

    setStatus({
      step: "success",
      message: `Lead "${firstName} ${lastName}" created and assigned to ${agentLabel} (via update).`,
      personId,
    });
  }

  const isSubmitting = status.step === "creating" || status.step === "verifying" || status.step === "assigning";

  return (
    <div className="max-w-[720px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          Create Lead
        </h1>
        <p className="text-secondary text-sm mt-1">
          {selected
            ? `Create a new lead in ${formatAppKey(selected.appKey)} and assign to an agent`
            : "Select a credential to create a lead"}
        </p>
      </div>

      {credLoading || loadingData ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">Loading...</p>
        </div>
      ) : !selected ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">No CRM credential selected.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Lead Information Card */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold font-[family-name:var(--font-dm-sans)]">
                Lead Information
              </h2>
              <button
                type="button"
                onClick={fillDummy}
                className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Randomize dummy data
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <label className="flex-1 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-secondary uppercase tracking-wider">First Name</span>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-secondary uppercase tracking-wider">Last Name</span>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </label>
              </div>

              <div className="flex gap-4">
                <label className="flex-1 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-secondary uppercase tracking-wider">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-secondary uppercase tracking-wider">Phone</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">Source</span>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Zillow, Referral, Website"
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </label>
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-dm-sans)] mb-5">
              Assignment
            </h2>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">Assign to Agent</span>
                {agents.length === 0 ? (
                  <p className="text-sm text-secondary">No agents found for this CRM.</p>
                ) : (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">— No agent —</option>
                    {agents.map((agent) => {
                      const name = agent.name || [agent.firstName, agent.lastName].filter(Boolean).join(" ") || "Unknown";
                      return (
                        <option key={agent.id} value={agent.id}>
                          {name}{agent.email ? ` (${agent.email})` : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
              </label>

              {stages.length > 0 && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-secondary uppercase tracking-wider">Stage</span>
                  <select
                    value={selectedStageId}
                    onChange={(e) => setSelectedStageId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">— Default stage —</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          {/* Status Banner */}
          {status.step !== "idle" && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                status.step === "error"
                  ? "bg-error/5 border-error/20 text-error"
                  : status.step === "success"
                  ? "bg-success/5 border-success/20 text-success"
                  : "bg-primary/5 border-primary/20 text-foreground"
              }`}
            >
              <div className="flex items-start gap-3">
                {isSubmitting && (
                  <svg className="w-4 h-4 mt-0.5 shrink-0 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                )}
                {status.step === "success" && (
                  <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M5.5 8l2 2 3.5-3.5" />
                  </svg>
                )}
                {status.step === "error" && (
                  <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5v3.5M8 10.5v.5" />
                  </svg>
                )}
                <div>
                  <p className="font-medium">{status.message}</p>
                  {"personId" in status && (
                    <p className="mt-1 text-xs font-[family-name:var(--font-geist-mono)] opacity-70">
                      ID: {status.personId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || agents.length === 0}
              className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Lead"}
            </button>

            {status.step === "success" && (
              <button
                type="button"
                onClick={() => {
                  fillDummy();
                  setStatus({ step: "idle" });
                }}
                className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-background transition-colors"
              >
                Create Another
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
