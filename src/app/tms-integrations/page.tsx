import { RolloutConnections } from "@/components/rollout-connections";

export default function TmsIntegrationsPage() {
  return (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          TMS Integrations
        </h1>
        <p className="text-secondary text-sm mt-1">
          Connect and manage your transaction management integrations via Rollout
        </p>
      </div>
      <RolloutConnections category="tms" />
    </div>
  );
}
