"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CertificatesTableClient({ initial, canDecide }: { initial: any[]; canDecide: boolean }) {
  const router = useRouter();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(id: string, decision: "APPROVED" | "REJECTED", rejectionReason?: string) {
    setBusy(true);
    try {
      await api(`/api/certificates/requests/${id}/decide`, {
        method: "POST",
        json: { decision, rejectionReason },
      });
      toast.success(decision === "APPROVED" ? "Certificate approved, PDF generated & emailed!" : "Certificate request rejected");
      setRejectingId(null);
      setReason("");
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
        <h1 className="text-2xl font-bold text-gray-900">Certificate Requests & Issued Certificates</h1>
        <p className="text-sm text-gray-500">
          Review completed internships, approve to generate the PDF certificate and email the intern, or reject with a reason.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Intern</th>
              <th className="px-4 py-3">Mentor</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Certificate ID</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initial.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No certificate requests yet.</td></tr>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {initial.map((r: any) => {
              const intern = r.internship.intern;
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{intern.name}</div>
                    <div className="text-xs text-gray-500">{intern.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{intern.mentor?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(r.internship.startDate).toLocaleDateString()} –{" "}
                    {r.internship.endDate ? new Date(r.internship.endDate).toLocaleDateString() : "Present"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      {r.status}
                    </span>
                    {r.rejectionReason && <div className="mt-1 text-[11px] text-red-600">{r.rejectionReason}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.certificate?.certificateNumber ?? "-"}</td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    {canDecide && r.status === "PENDING" && (
                      <>
                        <button
                          disabled={busy}
                          onClick={() => decide(r.id, "APPROVED")}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Approve & Issue PDF
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => setRejectingId(r.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.certificate && (
                      <a
                        href={`/api/certificates/${r.certificate.id}/download`}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Download PDF
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={rejectingId !== null} onClose={() => setRejectingId(null)} title="Reject Certificate Request">
        <div className="space-y-3">
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-full rounded-xl border border-gray-200 p-3 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setRejectingId(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              disabled={busy}
              onClick={() => rejectingId && decide(rejectingId, "REJECTED", reason)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
