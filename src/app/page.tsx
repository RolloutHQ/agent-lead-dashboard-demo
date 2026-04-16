import { KpiCards } from "@/components/kpi-cards";
import { LeadTable } from "@/components/lead-table";

export default function DashboardPage() {
  return (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          Lead Performance Overview
        </h1>
        <p className="text-secondary text-sm mt-1">
          Monitoring delivered leads across all connected CRMs
        </p>
      </div>
      <div className="mb-8">
        <KpiCards />
      </div>
      <div>
        <h2 className="text-xl font-semibold font-[family-name:var(--font-dm-sans)] mb-4">
          Delivered Leads
        </h2>
        <LeadTable />
      </div>
    </div>
  );
}
