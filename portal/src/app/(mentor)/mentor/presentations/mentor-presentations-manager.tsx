"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";

type PresRow = {
  id: string;
  scheduledAt: string;
  googleMeetLink: string;
  status: "SCHEDULED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED";
  intern: { id: string; name: string; email: string };
  assignment: { id: string; project: { title: string } } | null;
};

const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

export function MentorPresentationsManager({
  initial,
  interns,
  assignments,
}: {
  initial: PresRow[];
  interns: { id: string; name: string; email: string }[];
  assignments: { id: string; internId: string; project: { title: string } }[];
}) {
  const router = useRouter();
  const [openNew, setOpenNew] = useState(false);
  const [rescheduling, setRescheduling] = useState<PresRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const scheduledAt = `${fd.get("date")}T${fd.get("time")}:00`;
    setBusy(true);
    try {
      await api("/api/presentations", {
        method: "POST",
        json: {
          internId: String(fd.get("internId")),
          assignmentId: String(fd.get("assignmentId") ?? ""),
          scheduledAt,
          googleMeetLink: String(fd.get("googleMeetLink")),
        },
      });
      toast.success("Presentation scheduled & intern notified");
      setOpenNew(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(presId: string, action: "RESCHEDULE" | "CANCEL" | "COMPLETE", extra: Record<string, string> = {}) {
    setBusy(true);
    try {
      await api(`/api/presentations/${presId}`, {
        method: "PATCH",
        json: { action, ...extra },
      });
      toast.success(`Presentation ${action.toLowerCase()}d`);
      setRescheduling(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onRescheduleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rescheduling) return;
    const fd = new FormData(e.currentTarget);
    const scheduledAt = `${fd.get("date")}T${fd.get("time")}:00`;
    await onUpdate(rescheduling.id, "RESCHEDULE", {
      scheduledAt,
      googleMeetLink: String(fd.get("googleMeetLink")),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presentation Scheduling</h1>
          <p className="text-sm text-gray-500">
            Schedule, reschedule, cancel, or mark presentations completed with Google Meet links.
          </p>
        </div>
        <button onClick={() => setOpenNew(true)} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          + Schedule Presentation
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Intern & Project</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Google Meet</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initial.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No presentations scheduled.</td></tr>
            )}
            {initial.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{p.intern.name}</div>
                  <div className="text-xs text-gray-500">{p.assignment?.project.title ?? "General Internship Review"}</div>
                </td>
                <td className="px-4 py-3 text-xs">{new Date(p.scheduledAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs">
                  <a href={p.googleMeetLink} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">
                    Join Meet
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{p.status}</span>
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  {p.status !== "CANCELLED" && p.status !== "COMPLETED" && (
                    <>
                      <button onClick={() => setRescheduling(p)} className="text-xs font-semibold text-brand-600 hover:underline">
                        Reschedule
                      </button>
                      <button onClick={() => onUpdate(p.id, "COMPLETE")} className="text-xs font-semibold text-emerald-700 hover:underline">
                        Complete
                      </button>
                      <button onClick={() => onUpdate(p.id, "CANCEL")} className="text-xs font-semibold text-red-600 hover:underline">
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Schedule Presentation">
        <form onSubmit={onSchedule} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Intern *
            <select name="internId" required className={field}>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.email})</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Project Assignment (optional)
            <select name="assignmentId" defaultValue="" className={field}>
              <option value="">-- General Presentation --</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.project.title}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-700">
              Date *
              <input name="date" type="date" required className={field} />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Time *
              <input name="time" type="time" required defaultValue="15:00" className={field} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-gray-700">
            Google Meet Link *
            <input name="googleMeetLink" type="url" required placeholder="https://meet.google.com/..." className={field} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenNew(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Schedule
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={rescheduling !== null} onClose={() => setRescheduling(null)} title="Reschedule Presentation">
        <form onSubmit={onRescheduleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-700">
              New Date *
              <input name="date" type="date" required defaultValue={rescheduling?.scheduledAt.slice(0, 10)} className={field} />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              New Time *
              <input name="time" type="time" required defaultValue="15:00" className={field} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-gray-700">
            Google Meet Link *
            <input name="googleMeetLink" type="url" required defaultValue={rescheduling?.googleMeetLink} className={field} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRescheduling(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
