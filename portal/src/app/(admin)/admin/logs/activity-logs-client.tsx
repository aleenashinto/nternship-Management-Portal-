"use client";

import { useState } from "react";

type LogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  createdAt: string;
  user: { username: string; role: string } | null;
};

export function ActivityLogsClient({ initial }: { initial: LogRow[] }) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");

  const entityTypes = Array.from(new Set(initial.map((l) => l.entityType))).sort();
  const filtered = initial.filter((l) => {
    if (entityFilter !== "ALL" && l.entityType !== entityFilter) return false;
    if (!query) return true;
    const text = `${l.action} ${l.entityType} ${l.user?.username ?? ""} ${JSON.stringify(l.metadata ?? {})}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Activity & Audit Logs</h1>
        <p className="text-sm text-gray-500">
          Every account action, mentor assignment, project update, submission, evaluation, presentation, note, and certificate decision is recorded.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by user, action, or metadata..."
          className="w-full max-w-sm rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
        />
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="ALL">All Entity Types</option>
          {entityTypes.map((et) => (
            <option key={et} value={et}>{et}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-50 uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No matching activity logs.</td></tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-gray-900">{l.user?.username ?? "system"}</span>{" "}
                  {l.user?.role && <span className="text-gray-400">({l.user.role})</span>}
                </td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-700">{l.action}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-700">
                  {l.entityType} {l.entityId && <span className="font-mono text-gray-400">#{l.entityId.slice(-6)}</span>}
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">
                  {l.metadata ? JSON.stringify(l.metadata) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
