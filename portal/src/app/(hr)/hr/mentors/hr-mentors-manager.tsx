"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ConfirmDialog, Modal } from "@/components/ui/modal";

type MentorRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  workStartTime: string;
  workEndTime: string;
  isActive: boolean;
  assignedInternCount: number;
  assignedInterns: { id: string; name: string; email: string; educationalQualification: string }[];
};

const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

export function HRMentorsManager({ initial }: { initial: MentorRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formFor, setFormFor] = useState<null | "new" | MentorRow>(null);
  const [viewing, setViewing] = useState<MentorRow | null>(null);
  const [deleting, setDeleting] = useState<MentorRow | null>(null);
  const [secret, setSecret] = useState<null | { email: string; tempPassword: string }>(null);
  const [busy, setBusy] = useState(false);

  const editing = formFor && formFor !== "new" ? formFor : null;
  const rows = initial.filter((m) => `${m.name} ${m.email} ${m.phone}`.toLowerCase().includes(search.toLowerCase()));

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/hr/mentors/${editing.id}`, { method: "PATCH", json: fd });
        toast.success("Mentor updated");
      } else {
        const res = await api<{ email: string; tempPassword: string }>("/api/hr/mentors", {
          method: "POST",
          json: fd,
        });
        setSecret(res);
        toast.success("Mentor account created");
      }
      setFormFor(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/hr/mentors/${deleting.id}`, { method: "DELETE" });
      toast.success("Mentor deleted");
      setDeleting(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Mentor Accounts & Allocation</h1>
          <p className="text-sm text-gray-500">
            Add, view, update, and delete Team Leads/Mentors, shift timings, and assigned intern allocations.
          </p>
        </div>
        <button
          onClick={() => setFormFor("new")}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add Mentor
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search mentors by name, email, or phone..."
        className="w-full max-w-sm rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Mentor Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Working Hours</th>
              <th className="px-4 py-3">Assigned Interns</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No mentors found.</td></tr>
            )}
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  <div>{m.email}</div>
                  <div className="text-gray-400">{m.phone}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  {m.workStartTime} – {m.workEndTime}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    {m.assignedInternCount} Assigned
                  </span>
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <button onClick={() => setViewing(m)} className="text-xs font-semibold text-gray-700 hover:underline">
                    View
                  </button>
                  <button onClick={() => setFormFor(m)} className="text-xs font-semibold text-brand-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => setDeleting(m)} className="text-xs font-semibold text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={formFor !== null} onClose={() => setFormFor(null)} title={editing ? `Update ${editing.name}` : "Add Mentor"}>
        <form onSubmit={onSave} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Full Name *
            <input name="name" required minLength={2} defaultValue={editing?.name ?? ""} className={field} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Email (Username) *
            <input name="email" type="email" required defaultValue={editing?.email ?? ""} className={field} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Phone *
            <input name="phone" required minLength={5} defaultValue={editing?.phone ?? ""} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-700">
              Work Start *
              <input name="workStartTime" type="time" required defaultValue={editing?.workStartTime ?? "09:00"} className={field} />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Work End *
              <input name="workEndTime" type="time" required defaultValue={editing?.workEndTime ?? "17:30"} className={field} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormFor(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              {busy ? "Saving..." : editing ? "Update Mentor" : "Create Mentor"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={viewing !== null} onClose={() => setViewing(null)} title="Mentor Details & Assigned Interns">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 space-y-1">
              <div className="text-base font-bold text-gray-900">{viewing.name}</div>
              <div className="text-xs text-gray-600">
                <b>Email:</b> {viewing.email} · <b>Phone:</b> {viewing.phone}
              </div>
              <div className="text-xs text-gray-600">
                <b>Working Hours:</b> {viewing.workStartTime} – {viewing.workEndTime}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Assigned Interns ({viewing.assignedInterns.length})
              </h3>
              {viewing.assignedInterns.length === 0 ? (
                <p className="text-xs text-gray-400">No interns currently assigned.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {viewing.assignedInterns.map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs">
                      <div>
                        <b className="text-gray-900">{i.name}</b>
                        <div className="text-gray-500">{i.email}</div>
                      </div>
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">
                        {i.educationalQualification}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleting !== null}
        destructive
        busy={busy}
        title="Delete Mentor Account?"
        message={`Delete mentor ${deleting?.name}? Any interns assigned to this mentor will be marked unassigned so they can be reallocated.`}
        confirmLabel="Confirm Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={onDelete}
      />

      {/* Temporary Password Modal */}
      <Modal open={secret !== null} onClose={() => setSecret(null)} title="Temporary Password Generated">
        <p className="text-sm text-gray-600">
          Share this initial password with <b>{secret?.email}</b> (forced change on first login):
        </p>
        <code className="mt-3 block select-all rounded-xl bg-brand-50 px-4 py-3 text-center font-mono text-base text-brand-800">
          {secret?.tempPassword}
        </code>
      </Modal>
    </div>
  );
}
