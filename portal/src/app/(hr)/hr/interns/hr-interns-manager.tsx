"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";

type InternRow = {
  id: string; name: string; email: string; phone1: string; phone2: string | null;
  address: string; educationalQualification: string; source: "DIRECT" | "OTHER";
  mentorId: string | null;
  mentor: { id: string; name: string } | null;
  internship: { status: string; startDate: string } | null;
  _count: { assignments: number };
};

type MentorOption = {
  id: string; name: string; email: string; assignedInternCount: number;
};

const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

export function HRInternsManager({
  initialInterns,
  mentors,
  canCreate,
}: {
  initialInterns: InternRow[];
  mentors: MentorOption[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [openReg, setOpenReg] = useState(false);
  const [assigning, setAssigning] = useState<InternRow | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [welcomeCreds, setWelcomeCreds] = useState<null | { email: string }>(null);

  const filtered = initialInterns.filter((i) =>
    `${i.name} ${i.email} ${i.educationalQualification}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      const res = await api<{ email: string }>("/api/interns", {
        method: "POST",
        json: fd,
      });
      setOpenReg(false);
      setWelcomeCreds(res);
      toast.success("Intern registered & welcome email dispatched");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onAssignMentor(e: React.FormEvent) {
    e.preventDefault();
    if (!assigning) return;
    setBusy(true);
    try {
      await api(`/api/interns/${assigning.id}/assign-mentor`, {
        method: "POST",
        json: { mentorId: selectedMentor || null },
      });
      toast.success("Mentor assignment updated");
      setAssigning(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Intern Registry & Mentor Allocation</h1>
          <p className="text-sm text-gray-500">
            Register interns (auto-creates login & sends welcome email) and assign or reassign mentors with no upper cap.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setOpenReg(true)}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Register Intern
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, qualification..."
          className="w-full max-w-sm rounded-xl border border-gray-200 px-3.5 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          {mentors.map((m) => (
            <span key={m.id} className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
              {m.name}: <b>{m.assignedInternCount}</b> interns
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Intern</th>
              <th className="px-4 py-3">Qualification & Source</th>
              <th className="px-4 py-3">Assigned Mentor</th>
              <th className="px-4 py-3">Internship Status</th>
              <th className="px-4 py-3">Projects</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No interns found.</td></tr>
            )}
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{i.name}</div>
                  <div className="text-xs text-gray-500">{i.email} · {i.phone1}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-800">{i.educationalQualification}</div>
                  <div className="text-xs text-gray-400">{i.source}</div>
                </td>
                <td className="px-4 py-3">
                  {i.mentor ? (
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      {i.mentor.name}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {i.internship?.status ?? "ONGOING"}
                  </span>
                </td>
                <td className="px-4 py-3">{i._count.assignments}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setAssigning(i);
                      setSelectedMentor(i.mentorId ?? "");
                    }}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    {i.mentor ? "Reassign Mentor" : "Assign Mentor"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={openReg} onClose={() => setOpenReg(false)} title="Register New Intern">
        <form onSubmit={onRegister} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-700">
              Full Name *
              <input name="name" required minLength={2} className={field} />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Email (becomes username) *
              <input name="email" type="email" required className={field} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-700">
              Primary Phone *
              <input name="phone1" required minLength={5} className={field} />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Secondary Phone (optional)
              <input name="phone2" className={field} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-gray-700">
            Residential Address *
            <input name="address" required minLength={3} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-700">
              Educational Qualification *
              <input name="educationalQualification" required placeholder="e.g. B.Tech CS / MBA" className={field} />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Source *
              <select name="source" defaultValue="DIRECT" className={field}>
                <option value="DIRECT">DIRECT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-semibold text-gray-700">
            Assign Mentor (optional)
            <select name="mentorId" defaultValue="" className={field}>
              <option value="">-- Assign Later --</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.assignedInternCount} active interns)
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenReg(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? "Registering..." : "Register & Send Welcome Email"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={assigning !== null} onClose={() => setAssigning(null)} title={`Assign Mentor for ${assigning?.name}`}>
        <form onSubmit={onAssignMentor} className="space-y-4">
          <label className="block text-xs font-semibold text-gray-700">
            Select Mentor
            <select value={selectedMentor} onChange={(e) => setSelectedMentor(e.target.value)} className={field}>
              <option value="">-- Unassigned --</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.assignedInternCount} currently assigned)
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAssigning(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              {busy ? "Saving..." : "Save Mentor Assignment"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={welcomeCreds !== null} onClose={() => setWelcomeCreds(null)} title="Intern Account Created">
        <p className="text-sm text-gray-600">
          The intern profile and login account have been created. A strong random initial password was generated and sent directly to{" "}
          <b>{welcomeCreds?.email}</b> via welcome email (forced password change on first login).
        </p>
        <div className="mt-4 flex justify-end">
          <button onClick={() => setWelcomeCreds(null)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
