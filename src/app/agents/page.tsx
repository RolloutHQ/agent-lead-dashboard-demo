"use client";

import { useEffect, useState } from "react";
import { useCredential } from "@/lib/credential-context";

interface CrmUserRow {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

function formatAppKey(appKey: string): string {
  return appKey.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function UsersPage() {
  const { selected, loading: credLoading, authHeaders } = useCredential();
  const [users, setUsers] = useState<CrmUserRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch("/api/users", {
      headers: { ...authHeaders, "x-credential-id": selected.id },
    })
      .then((r) => r.json())
      .then((data) => setUsers(data.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold font-[family-name:var(--font-dm-sans)] tracking-tight">
          CRM Users
        </h1>
        <p className="text-secondary text-sm mt-1">
          {selected
            ? `Users in ${formatAppKey(selected.appKey)}`
            : "Select a credential to view CRM users"}
        </p>
      </div>

      {credLoading || loading ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">Loading users...</p>
        </div>
      ) : !selected ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">No CRM credential selected.</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-secondary text-sm">No users found for this CRM.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const displayName = user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown";
                return (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm">{displayName}</div>
                      <div className="text-xs text-secondary font-[family-name:var(--font-geist-mono)]">{user.id.slice(0, 16)}...</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-secondary">{user.email || "—"}</td>
                    <td className="px-5 py-4 text-sm text-secondary font-[family-name:var(--font-geist-mono)]">{user.phone || "—"}</td>
                    <td className="px-5 py-4">
                      {user.role ? (
                        <span className="text-xs bg-background px-2.5 py-0.5 rounded-full text-secondary border border-border">
                          {user.role}
                        </span>
                      ) : (
                        <span className="text-sm text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {user.status ? (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          user.status.toLowerCase() === "active"
                            ? "bg-success/10 text-success"
                            : "bg-secondary/10 text-secondary"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            user.status.toLowerCase() === "active" ? "bg-success" : "bg-secondary"
                          }`} />
                          {user.status}
                        </span>
                      ) : (
                        <span className="text-sm text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 text-xs text-secondary">
        {users.length} user{users.length !== 1 ? "s" : ""} found
      </div>
    </div>
  );
}
