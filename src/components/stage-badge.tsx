// Predefined colors for known stages, with a hash-based fallback for unknown ones
const stageStyles: Record<string, string> = {
  "New": "bg-stage-new/10 text-stage-new",
  "New Leads": "bg-stage-new/10 text-stage-new",
  "NEW": "bg-stage-new/10 text-stage-new",
  "Contacted": "bg-stage-contacted/10 text-stage-contacted",
  "Qualified": "bg-stage-qualified/10 text-stage-qualified",
  "Under Contract": "bg-stage-under-contract/10 text-stage-under-contract",
  "Closed Won": "bg-stage-closed-won/10 text-stage-closed-won",
  "Closed": "bg-stage-closed-won/10 text-stage-closed-won",
  "Lost": "bg-stage-lost/10 text-stage-lost",
  "Hot": "bg-error/10 text-error",
  "Warm": "bg-warning/10 text-warning",
  "Cold": "bg-stage-contacted/10 text-stage-contacted",
  "Showing": "bg-stage-qualified/10 text-stage-qualified",
  "Prospect": "bg-stage-new/10 text-stage-new",
  "OPEN": "bg-success/10 text-success",
};

export function StageBadge({ stage }: { stage: string }) {
  const style = stageStyles[stage] || "bg-secondary/10 text-secondary";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {stage}
    </span>
  );
}
