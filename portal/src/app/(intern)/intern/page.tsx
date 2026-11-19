import { requireRole } from "@/lib/rbac/guard";
import { getInternDetail } from "@/services/intern";

export const dynamic = "force-dynamic";

export default async function InternProfileDashboardPage() {
  const actor = await requireRole("INTERN");
  if (!actor.internId) {
    return <p className="text-sm text-gray-500">No intern profile linked to this account.</p>;
  }
  const intern = await getInternDetail(actor, actor.internId);
  const completedProjects = intern.assignments.filter((a) => a.status === "COMPLETED").length;
  const allExtensions = intern.assignments.flatMap((a) =>
    a.extensions.map((ex) => ({ ...ex, projectTitle: a.project.title })),
  );
  const certReq = intern.internship?.certificateRequest ?? null;

  return (
    <div className="space-y-6">
      {/* Top Personal & Internship Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-700 to-brand-900 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{intern.name}</h1>
            <p className="mt-1 text-xs text-brand-100">
              {intern.email} · {intern.phone1} {intern.phone2 ? `/ ${intern.phone2}` : ""} · {intern.address}
            </p>
            <p className="mt-1 text-xs text-brand-100">
              Qualification: <b>{intern.educationalQualification}</b> ({intern.source})
            </p>
          </div>
          {certReq?.certificate && (
            <a
              href={`/api/certificates/${certReq.certificate.id}/download`}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-800 shadow-md hover:bg-brand-50"
            >
              Download Certificate ({certReq.certificate.certificateNumber})
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="rounded-xl bg-white/15 px-3 py-1.5 font-semibold">
            Assigned Mentor:{" "}
            {intern.mentor
              ? `${intern.mentor.name} (${intern.mentor.phone} · ${intern.mentor.workStartTime}-${intern.mentor.workEndTime})`
              : "Pending Allocation"}
          </span>
          <span className="rounded-xl bg-white/15 px-3 py-1.5 font-semibold">
            Internship Start Date:{" "}
            {intern.internship ? new Date(intern.internship.startDate).toLocaleDateString() : "-"}
            {intern.internship?.endDate
              ? ` · End Date: ${new Date(intern.internship.endDate).toLocaleDateString()}`
              : ""}
          </span>
          <span className="rounded-xl bg-white/15 px-3 py-1.5 font-semibold">
            Project Completion: {completedProjects} of {intern.assignments.length} projects completed
          </span>
          <span className="rounded-xl bg-emerald-400/20 px-3 py-1.5 font-bold text-emerald-100">
            Overall Internship Status: {intern.internship?.status ?? "ONGOING"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 text-xs text-gray-700">
        <b>Important Distinction:</b> Completing individual project assignments does <i>not</i> automatically complete
        your overall internship. Your assigned mentor explicitly marks your overall internship completed once all
        program requirements and presentations are fulfilled.
      </div>

      {/* Projects, Statuses & Scores Summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Assigned Projects & Evaluation Scores</h2>
          <a href="/intern/assignments" className="text-xs font-semibold text-brand-600 hover:underline">
            Manage Submissions & Extensions →
          </a>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {intern.assignments.length === 0 && <p className="text-xs text-gray-400">No projects assigned yet.</p>}
          {intern.assignments.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-100 p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm text-gray-900">{a.project.title}</b>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-700">{a.status}</span>
              </div>
              <p className="mt-1 text-gray-500">
                Assigned {new Date(a.assignedDate).toLocaleDateString()} · Due{" "}
                <b>{new Date(a.dueDate).toLocaleDateString()}</b>
                {a.score !== null ? ` · Score: ${a.score}/100` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Presentations & Extension Requests Side by Side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Presentation Schedule</h2>
            <a href="/intern/presentations" className="text-xs font-semibold text-brand-600 hover:underline">
              View All →
            </a>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            {intern.presentations.length === 0 && <p className="text-gray-400">No presentations scheduled.</p>}
            {intern.presentations.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div>
                  <b className="text-gray-900">{p.assignment?.project.title ?? "Internship Presentation"}</b>
                  <div className="text-gray-500">{new Date(p.scheduledAt).toLocaleString()}</div>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-semibold text-brand-700">{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-bold text-gray-900">Extension Requests Tracking</h2>
          <div className="mt-3 space-y-2 text-xs">
            {allExtensions.length === 0 && <p className="text-gray-400">No extension requests submitted.</p>}
            {allExtensions.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div>
                  <b className="text-gray-900">{ex.projectTitle}</b>
                  <div className="text-gray-500">
                    Requested {new Date(ex.requestedDate).toLocaleDateString()} — {ex.reason}
                  </div>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-semibold text-brand-700">
                  {ex.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mentor Remarks / Dated Notes */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-bold text-gray-900">Mentor Remarks & Dated Notes</h2>
        <div className="mt-3 space-y-2">
          {intern.notes.length === 0 && <p className="text-xs text-gray-400">No mentor notes yet.</p>}
          {intern.notes.map((n) => (
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
    </div>
  );
}
