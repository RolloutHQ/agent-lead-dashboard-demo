import { TransactionTable } from "@/components/transaction-table";

export default function TransactionsPage() {
  return (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          Transactions
        </h1>
        <p className="text-secondary text-sm mt-1">
          All transactions across connected transaction management systems
        </p>
      </div>
      <TransactionTable />
    </div>
  );
}
