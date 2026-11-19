"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const HOME: Record<string, string> = { ADMIN: "/admin", HR: "/hr", MENTOR: "/mentor", INTERN: "/intern" };

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function doLogin(u: string, p: string) {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ role: string; mustChangePassword: boolean }>("/api/auth/login", {
        method: "POST",
        json: { username: u, password: p },
      });
      router.replace(r.mustChangePassword ? "/change-password" : HOME[r.role]);
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await doLogin(username, password);
  }

  const demoAccounts = [
    { label: "Admin", email: "admin@beat.local" },
    { label: "HR Manager", email: "hr@beat.local" },
    { label: "Mentor (Maya)", email: "mentor1@beat.local" },
    { label: "Intern (Aarav)", email: "intern1@beat.local" },
  ];

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-white to-brand-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 px-8 py-8 text-center text-white">
          <div className="mx-auto mb-3 inline-flex rounded-2xl bg-white px-5 py-2 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/beat-logo.png" alt="Beat" className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Internship Portal</h1>
          <p className="mt-1 text-xs text-brand-100">Sign in with your account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-8" noValidate>
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </p>
          )}
          <label className="block text-xs font-semibold text-gray-700">
            Username or email
            <input name="username" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Password
            <input name="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <button disabled={busy}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Signing in..." : "Sign in"}
          </button>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              One-Click Demo Accounts (Passw0rd!Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setUsername(d.email);
                    setPassword("Passw0rd!Demo");
                    doLogin(d.email, "Passw0rd!Demo");
                  }}
                  className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2 text-left text-xs hover:bg-brand-100"
                >
                  <div className="font-bold text-brand-700">{d.label}</div>
                  <div className="truncate text-[10px] text-gray-500">{d.email}</div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
