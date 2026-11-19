import { requireRole } from "@/lib/rbac/guard";
import { getMentorDashboardData } from "@/services/dashboard";
import { SimpleBarChart } from "@/components/charts/dashboard-charts";

export const dynamic = "force-dynamic";

export default async function MentorDashboardPage() {
  const actor = await requireRole("MENTOR");
  const { kpis, internProgress } = await getMentorDashboardData(actor);

  const cards = [
    { label: "Assigned Interns", value: kpis.assignedInterns },
    { label: "Active Internships", value: kpis.activeInternships },
    { label: "Completed Internships", value: kpis.completedInternships },
    { label: "Projects Assigned", value: kpis.projectsAssigned },
    { label: "Projects Completed", value: kpis.projectsCompleted },
    { label: "Projects Pending", value: kpis.projectsPending },
    { label: "Projects Overdue", value: kpis.projectsOverdue },
    { label: "Awaiting Evaluation", value: kpis.awaitingEvaluation },
    { label: "Pending Correction Reviews", value: kpis.pendingCorrectionReviews },
    { label: "Upcoming Presentations", value: kpis.upcomingPresentations },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
        <p className="text-sm text-gray-500">
          Scoped to your assigned interns: project evaluation queue, upcoming presentations, and intern-wise progress.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-700">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="mb-2 text-base font-bold text-gray-900">Intern-wise Project Progress</h2>
        <SimpleBarChart
          data={internProgress}
          xKey="name"
          bars={[
            { key: "completed", label: "Completed Projects", color: "#10B981" },
            { key: "pending", label: "Active / Pending Projects", color: "#4B3A9B" },
          ]}
        />
      </div>
    </div>
  );
}
