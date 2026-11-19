"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";

type AssignmentItem = {
  id: string;
  assignedDate: string;
  dueDate: string;
  status: string;
  score: number | null;
  project: {
    title: string;
    toolsUsed: string[];
    instructions: string;
    dataSourceText: string | null;
    files: { id: string; originalName: string; kind: string }[];
  };
  submissions: { id: string; version: number; note: string | null; submittedAt: string; files: { id: string; originalName: string }[] }[];
  evaluations: { id: string; score: number; feedback: string; decision: string; createdAt: string }[];
  correctionRequests: { id: string; instructions: string; createdAt: string }[];
  extensions: { id: string; reason: string; requestedDate: string; approvedDate: string | null; status: string }[];
};

const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

export function InternAssignmentsView({ initial }: { initial: AssignmentItem[] }) {
  const router = useRouter();
  const [submittingFor, setSubmittingFor] = useState<AssignmentItem | null>(null);
  const [extendingFor, setExtendingFor] = useState<AssignmentItem | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmitFiles(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!submittingFor) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api(`/api/assignments/${submittingFor.id}/submissions`, { method: "POST", body: fd });
      toast.success("Submission uploaded (new version recorded)");
      setSubmittingFor(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onRequestExtension(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!extendingFor) return;
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      await api("/api/extensions", {
        method: "POST",
        json: { assignmentId: extendingFor.id, reason: fd.reason, requestedDate: fd.requestedDate },
      });
      toast.success("Extension request submitted to mentor");
      setExtendingFor(null);
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
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Projects</h1>
        <p className="text-sm text-gray-500">
          View project instructions, upload versioned submissions, review mentor feedback & corrections, or request deadline extensions.
        </p>
      </div>

      {initial.length === 0 && (
        <div className="rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
          No projects assigned yet.
        </div>
      )}

      {initial.map((a) => (
        <div key={a.id} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{a.project.title}</h2>
              <p className="text-xs text-gray-500">
                Assigned {new Date(a.assignedDate).toLocaleDateString()} · Current Due Date:{" "}
                <b>{new Date(a.dueDate).toLocaleDateString()}</b>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {a.score !== null && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Score: {a.score}/100
                </span>
              )}
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                {a.status}
              </span>
            </div>
          </div>

          <p className="whitespace-pre-line text-sm text-gray-700">{a.project.instructions}</p>

          {a.project.files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {a.project.files.map((f) => (
                <a key={f.id} href={`/api/files/${f.id}`} className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  Download {f.originalName}
                </a>
              ))}
            </div>
          )}

          {a.correctionRequests.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <b>Correction Requested:</b> {a.correctionRequests[0].instructions}
            </div>
          )}

          {a.submissions.length > 0 && (
            <div className="space-y-1 text-xs">
              <b className="text-gray-700">Submission History:</b>
              {a.submissions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                  <span>v{s.version} — {new Date(s.submittedAt).toLocaleString()} {s.note && `(${s.note})`}</span>
                  <div className="space-x-2">
                    {s.files.map((f) => (
                      <a key={f.id} href={`/api/files/${f.id}`} className="font-semibold text-brand-600 hover:underline">
                        {f.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {a.extensions.length > 0 && (
            <div className="space-y-1 text-xs">
              <b className="text-gray-700">Extension Requests:</b>
              {a.extensions.map((ex) => (
                <div key={ex.id} className="rounded-lg bg-gray-50 px-3 py-1.5">
                  Requested {new Date(ex.requestedDate).toLocaleDateString()} — <b>{ex.status}</b>
                  {ex.approvedDate && ` (Approved: ${new Date(ex.approvedDate).toLocaleDateString()})`}
                </div>
              ))}
            </div>
          )}

          {a.status !== "COMPLETED" && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setSubmittingFor(a)}
                className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {a.submissions.length > 0 ? "Upload Resubmission (New Version)" : "Upload Submission"}
              </button>
              <button
                onClick={() => setExtendingFor(a)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Request Deadline Extension
              </button>
            </div>
          )}
        </div>
      ))}

      <Modal open={submittingFor !== null} onClose={() => setSubmittingFor(null)} title="Upload Project Submission">
        <form onSubmit={onSubmitFiles} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Submission Files *
            <input name="files" type="file" multiple required className="mt-1 block w-full text-xs text-gray-600" />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Submission Notes
            <textarea name="note" rows={3} className={field} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSubmittingFor(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              {busy ? "Uploading..." : "Submit"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={extendingFor !== null} onClose={() => setExtendingFor(null)} title="Request Deadline Extension">
        <form onSubmit={onRequestExtension} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Requested New Due Date *
            <input name="requestedDate" type="date" required className={field} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Reason for Extension *
            <textarea name="reason" required minLength={5} rows={3} className={field} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setExtendingFor(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              {busy ? "Sending..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
