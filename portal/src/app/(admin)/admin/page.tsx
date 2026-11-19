import { requireExactRole } from "@/lib/rbac/guard";
import { getAdminDashboardData } from "@/services/dashboard";
import { StatusPieChart } from "@/components/charts/dashboard-charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireExactRole("ADMIN");
  const { kpis, statusBreakdown } = await getAdminDashboardData();

  const cards = [
    { label: "Total HR Managers", value: kpis.totalHr },
    { label: "Total Mentors", value: kpis.totalMentors },
    { label: "Total Interns", value: kpis.totalInterns },
    { label: "Active Internships", value: kpis.activeInternships },
    { label: "Completed Internships", value: kpis.completedInternships },
    { label: "Reusable Projects", value: kpis.totalProjects },
    { label: "Completed Assignments", value: `${kpis.completedAssignments} / ${kpis.totalAssignments}` },
    { label: "Pending Cert Approvals", value: kpis.pendingCertificates },
    { label: "Average Evaluation Score", value: `${kpis.avgScore} / 100` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Executive Dashboard</h1>
        <p className="text-sm text-gray-500">
          Platform-wide internship lifecycle metrics, completion statistics, and overall performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-700">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="mb-2 text-base font-bold text-gray-900">Project Assignment Status Breakdown</h2>
        <StatusPieChart data={statusBreakdown} />
      </div>
    </div>
  );
}
