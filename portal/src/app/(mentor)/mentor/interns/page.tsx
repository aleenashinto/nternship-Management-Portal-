import { requireRole } from "@/lib/rbac/guard";
import { listInterns } from "@/services/intern";

export const dynamic = "force-dynamic";

export default async function MentorInternsListPage() {
  const actor = await requireRole("MENTOR");
  const interns = await listInterns(actor);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assigned Interns</h1>
        <p className="text-sm text-gray-500">
          Scoped to your assigned interns (plus any Admin-authorised cross-mentor access grants).
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Intern</th>
              <th className="px-4 py-3">Qualification</th>
              <th className="px-4 py-3">Primary Mentor</th>
              <th className="px-4 py-3">Internship Status</th>
              <th className="px-4 py-3">Assignments</th>
              <th className="px-4 py-3 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {interns.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No interns assigned yet.</td></tr>
            )}
            {interns.map((i) => (
              <tr key={i.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{i.name}</div>
                  <div className="text-xs text-gray-500">{i.email} · {i.phone1}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{i.educationalQualification}</td>
                <td className="px-4 py-3 text-xs">{i.mentor?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    {i.internship?.status ?? "ONGOING"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{i._count.assignments}</td>
                <td className="px-4 py-3 text-right">
                  <a href={`/mentor/interns/${i.id}`} className="text-xs font-semibold text-brand-600 hover:underline">
                    Open Full Profile →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
