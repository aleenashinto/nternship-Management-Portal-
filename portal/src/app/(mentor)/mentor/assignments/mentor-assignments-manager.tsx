"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";

type SubmissionItem = {
  id: string;
  version: number;
  note: string | null;
  submittedAt: string;
  files: { id: string; originalName: string }[];
};

type AssignmentRow = {
  id: string;
  assignedDate: string;
  dueDate: string;
  status: string;
  score: number | null;
  project: { id: string; title: string };
  intern: { id: string; name: string; user: { email: string } };
  submissions: SubmissionItem[];
  evaluations: { id: string; score: number; feedback: string; decision: string; createdAt: string }[];
};

const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

export function MentorAssignmentsManager({
  initialAssignments,
  projects,
  interns,
}: {
  initialAssignments: AssignmentRow[];
  projects: { id: string; title: string }[];
  interns: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [openAssign, setOpenAssign] = useState(false);
  const [evaluating, setEvaluating] = useState<AssignmentRow | null>(null);
  const [decision, setDecision] = useState<"COMPLETED" | "REVISION_REQUIRED">("COMPLETED");
  const [busy, setBusy] = useState(false);

  async function onAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      await api("/api/assignments", { method: "POST", json: fd });
      toast.success("Project assigned & intern notified");
      setOpenAssign(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onEvaluate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!evaluating || evaluating.submissions.length === 0) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api(`/api/assignments/${evaluating.id}/evaluate`, {
        method: "POST",
        json: {
          submissionId: String(fd.get("submissionId")),
          score: Number(fd.get("score")),
          decision,
          feedback: String(fd.get("feedback")),
          correctionInstructions: String(fd.get("correctionInstructions") ?? ""),
        },
      });
      toast.success(decision === "COMPLETED" ? "Submission marked Completed" : "Correction requested");
      setEvaluating(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Assignments & Evaluations</h1>
          <p className="text-sm text-gray-500">
            Assign projects with independent deadlines, review versioned submissions, score out of 100, or request corrections.
          </p>
        </div>
        <button
          onClick={() => setOpenAssign(true)}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Assign Project
        </button>
      </div>

      <div className="space-y-4">
        {initialAssignments.length === 0 && (
          <div className="rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
            No project assignments yet.
          </div>
        )}
        {initialAssignments.map((a) => (
          <div key={a.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-900">{a.project.title}</h2>
                <p className="text-xs text-gray-500">
                  Intern: <b>{a.intern.name}</b> ({a.intern.user.email}) · Assigned{" "}
                  {new Date(a.assignedDate).toLocaleDateString()} · Due{" "}
                  <b>{new Date(a.dueDate).toLocaleDateString()}</b>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.score !== null && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    Score: {a.score}/100
                  </span>
                )}
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {a.status}
                </span>
                {a.submissions.length > 0 && (
                  <button
                    onClick={() => {
                      setDecision("COMPLETED");
                      setEvaluating(a);
                    }}
                    className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Evaluate
                  </button>
                )}
              </div>
            </div>

            {a.submissions.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700">Submission Versions (never overwritten):</p>
                <div className="mt-1.5 space-y-1.5">
                  {a.submissions.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs">
                      <span>
                        <b>v{s.version}</b> ({new Date(s.submittedAt).toLocaleString()}) {s.note && `— ${s.note}`}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {s.files.map((f) => (
                          <a key={f.id} href={`/api/files/${f.id}`} className="font-semibold text-brand-600 hover:underline">
                            {f.originalName}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={openAssign} onClose={() => setOpenAssign(false)} title="Assign Project to Intern">
        <form onSubmit={onAssign} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Project Template *
            <select name="projectId" required className={field}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Intern *
            <select name="internId" required className={field}>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.email})</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-700">
              Assigned Date *
              <input name="assignedDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={field} />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Due Date *
              <input name="dueDate" type="date" required className={field} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenAssign(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              {busy ? "Assigning..." : "Assign Project"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={evaluating !== null} onClose={() => setEvaluating(null)} title={`Evaluate ${evaluating?.project.title}`}>
        {evaluating && (
          <form onSubmit={onEvaluate} className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
              Submission Version
              <select name="submissionId" className={field}>
                {evaluating.submissions.map((s) => (
                  <option key={s.id} value={s.id}>Version {s.version} ({new Date(s.submittedAt).toLocaleString()})</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-gray-700">
                Score (0–100) *
                <input name="score" type="number" min={0} max={100} required defaultValue={evaluating.score ?? 85} className={field} />
              </label>
              <label className="block text-xs font-semibold text-gray-700">
                Decision *
                <select value={decision} onChange={(e) => setDecision(e.target.value as "COMPLETED" | "REVISION_REQUIRED")} className={field}>
                  <option value="COMPLETED">Mark Completed</option>
                  <option value="REVISION_REQUIRED">Request Corrections</option>
                </select>
              </label>
            </div>
            <label className="block text-xs font-semibold text-gray-700">
              Evaluation Feedback *
              <textarea name="feedback" required rows={3} className={field} />
            </label>
            {decision === "REVISION_REQUIRED" && (
              <label className="block text-xs font-semibold text-gray-700">
                Specific Correction Instructions *
                <textarea name="correctionInstructions" required rows={2} className={field} />
              </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEvaluating(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
                Cancel
              </button>
              <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                {busy ? "Saving..." : "Submit Evaluation"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
