"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TemplateEditorClient({ initial }: { initial: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      await api("/api/settings/certificate-template", { method: "PUT", json: fd });
      toast.success("Certificate template updated");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certificate PDF Template</h1>
        <p className="text-sm text-gray-500">
          Configure the organisation name, program title, body wording, signatory, and brand accent colour used when generating PDF certificates.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6">
        <label className="block text-xs font-semibold text-gray-700">
          Organisation Name *
          <input name="organisation" required defaultValue={initial.organisation} className={field} />
        </label>
        <label className="block text-xs font-semibold text-gray-700">
          Program Title *
          <input name="programTitle" required defaultValue={initial.programTitle} className={field} />
        </label>
        <label className="block text-xs font-semibold text-gray-700">
          Completion Body Text *
          <input name="bodyText" required defaultValue={initial.bodyText} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-gray-700">
            Authorised Signatory Name *
            <input name="signatoryName" required defaultValue={initial.signatoryName} className={field} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Signatory Designation *
            <input name="signatoryTitle" required defaultValue={initial.signatoryTitle} className={field} />
          </label>
        </div>
        <label className="block text-xs font-semibold text-gray-700">
          Accent Hex Colour *
          <input name="accentColor" required pattern="^#[0-9a-fA-F]{6}$" defaultValue={initial.accentColor} className={field} />
        </label>
        <button disabled={busy} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          {busy ? "Saving..." : "Save Template"}
        </button>
      </form>
    </div>
  );
}
