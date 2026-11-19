"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ConfirmDialog, Modal } from "@/components/ui/modal";

export type StaffRow = {
  id: string; role: "HR" | "MENTOR"; name: string; email: string; isActive: boolean;
  phone: string | null; workStartTime: string | null; workEndTime: string | null; assignedInterns: number | null;
};

const input = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

export function StaffManager({ initial, selfId }: { initial: StaffRow[]; selfId: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | "HR" | "MENTOR">("ALL");
  const [formFor, setFormFor] = useState<null | "new" | StaffRow>(null);
  const [role, setRole] = useState<"HR" | "MENTOR">("MENTOR");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | { row: StaffRow; action: "deactivate" | "reset" }>(null);
  const [secret, setSecret] = useState<null | { email: string; password: string }>(null);

  const rows = initial.filter((r) => filter === "ALL" || r.role === filter);
  const editing = formFor && formFor !== "new" ? formFor : null;

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      if (editing) {
        const body: Record<string, string> = { name: fd.name, email: fd.email };
        if (editing.role === "MENTOR") Object.assign(body, { phone: fd.phone, workStartTime: fd.workStartTime, workEndTime: fd.workEndTime });
        await api(`/api/users/${editing.id}`, { method: "PATCH", json: body });
        toast.success("Account updated");
      } else {
        const body = role === "HR"
          ? { role, name: fd.name, email: fd.email }
          : { role, name: fd.name, email: fd.email, phone: fd.phone, workStartTime: fd.workStartTime, workEndTime: fd.workEndTime };
        const r = await api<{ email: string; tempPassword: string }>("/api/users", { method: "POST", json: body });
        setSecret({ email: r.email, password: r.tempPassword });
        toast.success(`${role === "HR" ? "HR Manager" : "Mentor"} created`);
      }
      setFormFor(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setActive(row: StaffRow, isActive: boolean) {
    setBusy(true);
    try {
      await api(`/api/users/${row.id}/status`, { method: "POST", json: { isActive } });
      toast.success(isActive ? "Account activated" : "Account deactivated");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  async function resetPassword(row: StaffRow) {
    setBusy(true);
    try {
      const r = await api<{ tempPassword: string }>(`/api/users/${row.id}/reset-password`, { method: "POST" });
      setSecret({ email: row.email, password: r.tempPassword });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Managers and Mentors</h1>
          <p className="text-sm text-gray-500">Create accounts, edit details, and activate or deactivate access.</p>
        </div>
        <button
          onClick={() => { setRole("MENTOR"); setFormFor("new"); }}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + New account
        </button>
      </div>

      <div role="tablist" aria-label="Filter by role" className="mb-4 inline-flex rounded-xl bg-brand-50 p-1">
        {(["ALL", "HR", "MENTOR"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"}`}>
            {f === "ALL" ? "All" : f === "HR" ? "HR Managers" : "Mentors"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Interns</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No accounts yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3 font-semibold text-gray-900">{r.name}</td>
                <td className="px-4 py-3">{r.role === "HR" ? "HR Manager" : "Mentor"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {r.email}
                  {r.phone && <div className="text-xs text-gray-400">{r.phone} · {r.workStartTime}-{r.workEndTime}</div>}
                </td>
                <td className="px-4 py-3">{r.assignedInterns ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <button onClick={() => setFormFor(r)} className="text-xs font-semibold text-brand-600 hover:underline">Edit</button>
                  <button onClick={() => setConfirm({ row: r, action: "reset" })} className="text-xs font-semibold text-gray-600 hover:underline">Reset password</button>
                  {r.isActive ? (
                    <button disabled={r.id === selfId} onClick={() => setConfirm({ row: r, action: "deactivate" })}
                      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40">Deactivate</button>
                  ) : (
                    <button onClick={() => setActive(r, true)} className="text-xs font-semibold text-emerald-700 hover:underline">Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={formFor !== null} onClose={() => setFormFor(null)} title={editing ? `Edit ${editing.name}` : "New account"}>
        <form onSubmit={submitForm} className="space-y-3">
          {!editing && (
            <label className="block text-xs font-semibold text-gray-700">Role
              <select value={role} onChange={(e) => setRole(e.target.value as "HR" | "MENTOR")} className={input}>
                <option value="MENTOR">Mentor (Team Lead)</option>
                <option value="HR">HR Manager</option>
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-gray-700">Full name
            <input name="name" required minLength={2} defaultValue={editing?.name} className={input} /></label>
          <label className="block text-xs font-semibold text-gray-700">Email (also the username)
            <input name="email" type="email" required defaultValue={editing?.email} className={input} /></label>
          {(editing ? editing.role === "MENTOR" : role === "MENTOR") && (
            <>
              <label className="block text-xs font-semibold text-gray-700">Phone
                <input name="phone" required minLength={5} defaultValue={editing?.phone ?? ""} className={input} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-gray-700">Work start
                  <input name="workStartTime" type="time" required defaultValue={editing?.workStartTime ?? "09:00"} className={input} /></label>
                <label className="block text-xs font-semibold text-gray-700">Work end
                  <input name="workEndTime" type="time" required defaultValue={editing?.workEndTime ?? "17:30"} className={input} /></label>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormFor(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">Cancel</button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        destructive={confirm?.action === "deactivate"}
        busy={busy}
        title={confirm?.action === "deactivate" ? "Deactivate account?" : "Reset password?"}
        message={
          confirm?.action === "deactivate"
            ? `${confirm.row.name} will be signed out and unable to log in until reactivated. Their data is kept.`
            : `A new temporary password will be generated for ${confirm?.row.name}. They must change it at next login.`
        }
        confirmLabel={confirm?.action === "deactivate" ? "Deactivate" : "Reset password"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && (confirm.action === "deactivate" ? setActive(confirm.row, false) : resetPassword(confirm.row))}
      />

      <Modal open={secret !== null} onClose={() => setSecret(null)} title="Temporary password">
        <p className="text-sm text-gray-600">Share this with <b>{secret?.email}</b>. It is shown only once and must be changed at first login.</p>
        <code className="mt-3 block select-all rounded-xl bg-brand-50 px-4 py-3 text-center font-mono text-base text-brand-800">{secret?.password}</code>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => { navigator.clipboard.writeText(secret?.password ?? ""); toast.success("Copied"); }}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm">Copy</button>
          <button onClick={() => setSecret(null)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Done</button>
        </div>
      </Modal>
    </div>
  );
}
