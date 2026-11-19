"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const HOME: Record<string, string> = { ADMIN: "/admin", HR: "/hr", MENTOR: "/mentor", INTERN: "/intern" };

export default function ChangePasswordPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("newPassword") !== fd.get("confirm")) return setError("Passwords do not match");
    setBusy(true);
    setError("");
    try {
      const r = await api<{ role: string }>("/api/auth/change-password", {
        method: "POST",
        json: { currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") },
      });
      toast.success("Password updated");
      router.replace(HOME[r.role]);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm";
  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-white to-brand-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-3xl border border-brand-100 bg-white p-8 shadow-xl">
        <h1 className="text-xl font-bold text-gray-900">Set a new password</h1>
        <p className="text-xs text-gray-500">For security you must change your temporary password before continuing.</p>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</p>}
        <label className="block text-xs font-semibold text-gray-700">Current (temporary) password
          <input name="currentPassword" type="password" required autoComplete="current-password" className={field} /></label>
        <label className="block text-xs font-semibold text-gray-700">New password
          <input name="newPassword" type="password" required autoComplete="new-password" className={field} />
          <span className="font-normal text-gray-400">10+ characters with upper, lower case and a digit</span></label>
        <label className="block text-xs font-semibold text-gray-700">Confirm new password
          <input name="confirm" type="password" required autoComplete="new-password" className={field} /></label>
        <button disabled={busy} className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy ? "Saving..." : "Update password"}
        </button>
      </form>
    </main>
  );
}
