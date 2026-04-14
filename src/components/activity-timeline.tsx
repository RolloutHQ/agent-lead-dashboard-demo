import type { ActivityItem } from "@/lib/types";

const typeConfig: Record<string, { icon: typeof PhoneIcon; color: string }> = {
  call: { icon: PhoneIcon, color: "text-stage-contacted bg-stage-contacted/10" },
  note: { icon: NoteIcon, color: "text-stage-qualified bg-stage-qualified/10" },
  text: { icon: TextIcon, color: "text-success bg-success/10" },
  email: { icon: EmailIcon, color: "text-stage-under-contract bg-stage-under-contract/10" },
  stage_change: { icon: StageIcon, color: "text-primary bg-primary/10" },
};

export function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="space-y-0">
        {activities.map((activity, i) => {
          const config = typeConfig[activity.type] || typeConfig.note;
          const isLast = i === activities.length - 1;
          return (
            <div key={activity.id} className="flex gap-4 relative">
              {!isLast && (
                <div className="absolute left-[15px] top-[36px] bottom-0 w-px bg-border" />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                <config.icon className="w-4 h-4" />
              </div>
              <div className={`flex-1 ${isLast ? "" : "pb-5"}`}>
                <div className="font-medium text-sm">{activity.title}</div>
                <div className="text-sm text-secondary mt-0.5">{activity.description}</div>
                <div className="text-xs text-secondary/70 mt-1 font-[family-name:var(--font-geist-mono)]">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2h3l1.5 3.5L5.5 7c.7 1.5 1.8 2.8 3.3 3.5l1.5-2 3.5 1.5v3c0 .6-.4 1-1 1C6.5 14 2 9.5 2 3c0-.6.4-1 1-1z" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="2" width="10" height="12" rx="1" />
      <path d="M6 5h4M6 8h4M6 11h2" />
    </svg>
  );
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="9" rx="2" />
      <path d="M5 7h6M5 9.5h3" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M2 4l6 4.5L14 4" />
    </svg>
  );
}

function StageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
    </svg>
  );
}
