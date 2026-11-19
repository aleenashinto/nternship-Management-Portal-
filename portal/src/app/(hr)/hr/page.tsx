import { requireRole } from "@/lib/rbac/guard";
import { getHrDashboardData } from "@/services/dashboard";
import { listMentorsForHr } from "@/services/user";
import { SimpleBarChart } from "@/components/charts/dashboard-charts";
import { CertificatesTableClient } from "./certificates/certificates-table-client";
import { HRMentorsManager } from "./mentors/hr-mentors-manager";

export const dynamic = "force-dynamic";

export default async function HRDashboardPage() {
  const actor = await requireRole("HR");
  const [{ kpis, mentorDistribution, pendingCertRequests }, mentors] = await Promise.all([
    getHrDashboardData(),
    listMentorsForHr(actor),
  ]);

  const cards = [
    { label: "Total Interns", value: kpis.totalInterns },
    { label: "Total Mentors", value: kpis.totalMentors },
    { label: "Active Interns", value: kpis.activeInterns },
    { label: "Interns Without Mentors", value: kpis.internsWithoutMentors },
    { label: "Total Projects Assigned", value: kpis.totalProjectsAssigned },
    { label: "Completed Projects", value: kpis.completedProjects },
    { label: "Pending Projects", value: kpis.pendingProjects },
    { label: "Overdue Projects", value: kpis.overdueProjects },
    { label: "Internships Completed", value: kpis.internshipsCompleted },
    { label: "Pending Certificate Approvals", value: kpis.pendingCertificateApprovals },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Manager Dashboard</h1>
        <p className="text-sm text-gray-500">
          Intern onboarding, mentor-wise intern distribution, project KPIs, and dedicated certification section.
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
        <h2 className="mb-2 text-base font-bold text-gray-900">Mentor-wise Intern Distribution</h2>
        <SimpleBarChart
          data={mentorDistribution}
          xKey="name"
          bars={[{ key: "interns", label: "Assigned Interns", color: "#4B3A9B" }]}
        />
      </div>

      {/* Mentors Table & Add Mentor Section directly on HR Dashboard */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <HRMentorsManager initial={JSON.parse(JSON.stringify(mentors))} />
      </div>

      {/* Dedicated Certification Section */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50/30 p-6">
        <CertificatesTableClient initial={JSON.parse(JSON.stringify(pendingCertRequests))} canDecide />
      </div>
    </div>
  );
}
