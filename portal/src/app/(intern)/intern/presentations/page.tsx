import { requireRole } from "@/lib/rbac/guard";
import { listPresentations } from "@/services/presentation";

export const dynamic = "force-dynamic";

export default async function InternPresentationsPage() {
  const actor = await requireRole("INTERN");
  const rows = await listPresentations(actor);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Scheduled Presentations</h1>
        <p className="text-sm text-gray-500">Live schedule of upcoming and past project presentations.</p>
      </div>
      <div className="space-y-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
            No presentations scheduled yet.
          </div>
        )}
        {rows.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5">
            <div>
              <h2 className="font-bold text-gray-900">{p.assignment?.project.title ?? "Internship Presentation"}</h2>
              <p className="text-xs text-gray-500">{new Date(p.scheduledAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{p.status}</span>
              {p.status !== "CANCELLED" && (
                <a
                  href={p.googleMeetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Join Google Meet
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
