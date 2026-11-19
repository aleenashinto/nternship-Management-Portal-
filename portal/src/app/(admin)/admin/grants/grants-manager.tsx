"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ConfirmDialog } from "@/components/ui/modal";

type GrantRow = {
  id: string; ownerId: string; ownerName: string; ownerEmail: string;
  granteeId: string; granteeName: string; granteeEmail: string; createdAt: string;
};
type MentorItem = { id: string; name: string; email: string; isActive: boolean };

export function GrantsManager({ initial }: { initial: { grants: GrantRow[]; mentors: MentorItem[] } }) {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState(initial.mentors[0]?.id ?? "");
  const [granteeId, setGranteeId] = useState(initial.mentors[1]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<GrantRow | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/grants", { method: "POST", json: { ownerId, granteeId } });
      toast.success("Cross-mentor access granted");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke() {
    if (!revoking) return;
    setBusy(true);
    try {
      await api("/api/grants", { method: "DELETE", json: { id: revoking.id } });
      toast.success("Access grant revoked");
      setRevoking(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cross-Mentor Access Grants</h1>
        <p className="text-sm text-gray-500">
          Authorise a mentor (Grantee) to view the interns assigned to another mentor (Owner).
        </p>
      </div>

      <form onSubmit={onCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-brand-50/40 p-5 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-gray-700">
          Intern Owner (Mentor)
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
            {initial.mentors.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-gray-700">
          Authorised Viewer (Grantee Mentor)
          <select value={granteeId} onChange={(e) => setGranteeId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
            {initial.mentors.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button disabled={busy || initial.mentors.length < 2}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Granting..." : "Grant Access"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Grantee (Can View)</th>
              <th className="px-4 py-3">Owner&apos;s Interns</th>
              <th className="px-4 py-3">Granted On</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initial.grants.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No cross-mentor access grants configured.</td></tr>
            )}
            {initial.grants.map((g) => (
              <tr key={g.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3 font-semibold text-gray-900">{g.granteeName} <span className="font-normal text-xs text-gray-400">({g.granteeEmail})</span></td>
                <td className="px-4 py-3 text-gray-700">{g.ownerName} <span className="text-xs text-gray-400">({g.ownerEmail})</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(g.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setRevoking(g)} className="text-xs font-semibold text-red-600 hover:underline">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={revoking !== null}
        destructive
        busy={busy}
        title="Revoke access grant?"
        message={`${revoking?.granteeName} will no longer be able to view ${revoking?.ownerName}'s interns.`}
        confirmLabel="Revoke"
        onCancel={() => setRevoking(null)}
        onConfirm={onRevoke}
      />
    </div>
  );
}
