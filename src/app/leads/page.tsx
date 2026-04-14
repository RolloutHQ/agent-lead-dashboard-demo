import { LeadTable } from "@/components/lead-table";

export default function LeadsPage() {
  return (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          All Leads
        </h1>
        <p className="text-secondary text-sm mt-1">
          All delivered leads across connected CRMs
        </p>
      </div>
      <LeadTable />
    </div>
  );
}
