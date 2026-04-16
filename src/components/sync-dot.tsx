const dotStyles = {
  synced: "bg-success",
  pending: "bg-warning",
  error: "bg-error",
  disconnected: "bg-secondary",
};

const labels = {
  synced: "Live",
  pending: "Pending",
  error: "Error",
  disconnected: "Disconnected",
};

export function SyncDot({ status }: { status: keyof typeof dotStyles }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  );
}
