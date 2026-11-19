"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";

type ExtRow = {
  id: string;
  reason: string;
  requestedDate: string;
  approvedDate: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  assignment: {
    id: string;
    project: { title: string };
    intern: { name: string; email: string };
  };
};

export function MentorExtensionsManager({ initial }: { initial: ExtRow[] }) {
  const router = useRouter();
  const [deciding, setDeciding] = useState<ExtRow | null>(null);
  const [approvedDate, setApprovedDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(ext: ExtRow, decision: "APPROVED" | "REJECTED", dateOverride?: string) {
    setBusy(true);
    try {
      await api(`/api/extensions/${ext.id}/decide`, {
        method: "POST",
        json: { decision, approvedDate: dateOverride },
      });
      toast.success(`Extension ${decision.toLowerCase()}`);
      setDeciding(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Deadline Extension Requests</h1>
        <p className="text-sm text-gray-500">
          Approve (sets revised due date & updates assignment deadline) or reject intern extension requests.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Intern & Project</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Requested Date</th>
              <th className="px-4 py-3">Approved Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initial.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No extension requests.</td></tr>
            )}
            {initial.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{r.assignment.intern.name}</div>
                  <div className="text-xs text-gray-500">{r.assignment.project.title}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{r.reason}</td>
                <td className="px-4 py-3 text-xs">{new Date(r.requestedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs">{r.approvedDate ? new Date(r.approvedDate).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{r.status}</span>
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  {r.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => {
                          setDeciding(r);
                          setApprovedDate(r.requestedDate.slice(0, 10));
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => decide(r, "REJECTED")}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={deciding !== null} onClose={() => setDeciding(null)} title="Approve Deadline Extension">
        <div className="space-y-3">
          <p className="text-xs text-gray-600">
            Confirm or adjust the revised due date for <b>{deciding?.assignment.intern.name}</b>:
          </p>
          <input
            type="date"
            value={approvedDate}
            onChange={(e) => setApprovedDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeciding(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              disabled={busy}
              onClick={() => deciding && decide(deciding, "APPROVED", approvedDate)}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Approve & Update Deadline
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
