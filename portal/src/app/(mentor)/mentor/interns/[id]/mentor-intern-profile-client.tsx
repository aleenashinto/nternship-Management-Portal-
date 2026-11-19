"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ConfirmDialog } from "@/components/ui/modal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MentorInternProfileClient({ intern, isOwnMentor }: { intern: any; isOwnMentor: boolean }) {
  const router = useRouter();
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await api("/api/notes", { method: "POST", json: { internId: intern.id, content: noteText } });
      setNoteText("");
      toast.success("Dated mentor note recorded");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onCompleteInternship() {
    setBusy(true);
    try {
      await api(`/api/internships/${intern.id}/complete`, { method: "POST", json: {} });
      toast.success("Internship marked completed & certificate request sent to HR");
      setConfirmComplete(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const canComplete =
    isOwnMentor &&
    (!intern.internship || (intern.internship.status === "ONGOING" && !intern.internship.certificateRequest));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-brand-50/40 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{intern.name}</h1>
          <p className="text-xs text-gray-600">
            {intern.email} · {intern.phone1} {intern.phone2 ? `/ ${intern.phone2}` : ""} · {intern.address}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Qualification: <b>{intern.educationalQualification}</b> ({intern.source}) · Started:{" "}
            <b>{intern.internship ? new Date(intern.internship.startDate).toLocaleDateString() : "-"}</b>
            {intern.internship?.endDate
              ? ` · Completed: ${new Date(intern.internship.endDate).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
            Internship: {intern.internship?.status ?? "ONGOING"}
          </span>
          {canComplete && (
            <button
              onClick={() => setConfirmComplete(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Mark Internship Completed
            </button>
          )}
        </div>
      </div>

      {/* Immutable Dated Mentor Notes */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-bold text-gray-900">Immutable Dated Mentor Notes</h2>
        <p className="text-xs text-gray-500">Each note is stored as its own permanent timestamped record.</p>
        {isOwnMentor && (
          <form onSubmit={onAddNote} className="mt-3 flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write a new dated observation or presentation remark..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
              Add Note
            </button>
          </form>
        )}
        <div className="mt-4 space-y-2">
          {intern.notes.length === 0 && <p className="text-xs text-gray-400">No mentor notes recorded yet.</p>}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {intern.notes.map((n: any) => (
            <div key={n.id} className="rounded-xl bg-gray-50 p-3 text-xs">
              <div className="flex justify-between text-gray-400">
                <b>{n.mentor.name}</b>
                <span>{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-gray-800">{n.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Presentation Schedules */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-bold text-gray-900">Presentation Schedules</h2>
        <div className="mt-3 space-y-2 text-xs">
          {(!intern.presentations || intern.presentations.length === 0) && (
            <p className="text-gray-400">No presentations scheduled for this intern.</p>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {intern.presentations?.map((p: any) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 p-3">
              <div>
                <b className="text-gray-900">{p.assignment?.project?.title ?? "General Internship Presentation"}</b>
                <div className="text-gray-500">{new Date(p.scheduledAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <a href={p.googleMeetLink} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">
                  Google Meet
                </a>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-semibold text-brand-700">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments, Submissions, Scores & Correction History */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-bold text-gray-900">Assigned Projects, Submissions, Corrections & Evaluations</h2>
        <div className="mt-3 space-y-3">
          {intern.assignments.length === 0 && <p className="text-xs text-gray-400">No projects assigned.</p>}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {intern.assignments.map((a: any) => (
            <div key={a.id} className="space-y-2 rounded-xl border border-gray-100 p-4 text-xs">
              <div className="flex justify-between">
                <b className="text-sm text-gray-900">{a.project.title}</b>
                <span className="font-semibold text-brand-700">
                  {a.status} {a.score !== null ? `(${a.score}/100)` : ""}
                </span>
              </div>
              <p className="text-gray-500">
                Assigned {new Date(a.assignedDate).toLocaleDateString()} · Due {new Date(a.dueDate).toLocaleDateString()}
              </p>
              {a.submissions.length > 0 && (
                <div className="space-y-1 pt-1">
                  <b>Submissions ({a.submissions.length} versions):</b>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {a.submissions.map((s: any) => (
                    <div key={s.id} className="text-gray-600">
                      v{s.version} — {new Date(s.submittedAt).toLocaleString()} {s.note ? `(${s.note})` : ""}
                    </div>
                  ))}
                </div>
              )}
              {a.correctionRequests?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <b>Correction History:</b>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {a.correctionRequests.map((c: any) => (
                    <div key={c.id} className="text-amber-700">
                      {new Date(c.createdAt).toLocaleString()} — {c.instructions}
                    </div>
                  ))}
                </div>
              )}
              {a.evaluations?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <b>Evaluation History:</b>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {a.evaluations.map((ev: any) => (
                    <div key={ev.id} className="text-gray-700">
                      {new Date(ev.createdAt).toLocaleString()} — {ev.decision} ({ev.score}/100): {ev.feedback}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmComplete}
        busy={busy}
        title="Mark Internship Completed?"
        message={`This records ${intern.name}'s internship completion date, automatically generates ONE certificate request, and notifies HR for review.`}
        confirmLabel="Confirm Completion"
        onCancel={() => setConfirmComplete(false)}
        onConfirm={onCompleteInternship}
      />
    </div>
  );
}
