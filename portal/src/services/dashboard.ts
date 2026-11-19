import { prisma } from "@/lib/db";
import { internScope, type Actor } from "@/lib/rbac/guard";
import { refreshOverdueAssignments } from "@/services/assignment";

export async function getAdminDashboardData() {
  await refreshOverdueAssignments();
  const [
    totalHr,
    totalMentors,
    totalInterns,
    activeInternships,
    completedInternships,
    totalProjects,
    assignments,
    pendingCertificates,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "HR", isActive: true } }),
    prisma.user.count({ where: { role: "MENTOR", isActive: true } }),
    prisma.internProfile.count(),
    prisma.internship.count({ where: { status: "ONGOING" } }),
    prisma.internship.count({
      where: { status: { in: ["COMPLETED", "CERTIFICATE_PENDING", "CERTIFICATE_APPROVED"] } },
    }),
    prisma.project.count(),
    prisma.projectAssignment.findMany({ select: { status: true, score: true } }),
    prisma.certificateRequest.count({ where: { status: "PENDING" } }),
  ]);

  const completedAssignments = assignments.filter((a) => a.status === "COMPLETED");
  const scored = assignments.filter((a) => a.score !== null);
  const avgScore =
    scored.length > 0 ? Math.round((scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) * 10) / 10 : 0;

  const statusBreakdown = [
    { name: "Completed", value: completedAssignments.length },
    {
      name: "In Progress / Assigned",
      value: assignments.filter((a) => ["ASSIGNED", "IN_PROGRESS"].includes(a.status)).length,
    },
    {
      name: "Submitted / Review",
      value: assignments.filter((a) => ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"].includes(a.status)).length,
    },
    { name: "Revision Required", value: assignments.filter((a) => a.status === "REVISION_REQUIRED").length },
    { name: "Overdue", value: assignments.filter((a) => a.status === "OVERDUE").length },
  ];

  return {
    kpis: {
      totalHr,
      totalMentors,
      totalInterns,
      activeInternships,
      completedInternships,
      totalProjects,
      totalAssignments: assignments.length,
      completedAssignments: completedAssignments.length,
      pendingCertificates,
      avgScore,
    },
    statusBreakdown,
  };
}

export async function getHrDashboardData() {
  await refreshOverdueAssignments();
  const [
    totalInterns,
    totalMentors,
    activeInterns,
    internsWithoutMentors,
    assignments,
    internshipsCompleted,
    pendingCertRequests,
    mentors,
  ] = await Promise.all([
    prisma.internProfile.count(),
    prisma.mentorProfile.count({ where: { user: { isActive: true } } }),
    prisma.internship.count({ where: { status: "ONGOING" } }),
    prisma.internProfile.count({ where: { mentorId: null } }),
    prisma.projectAssignment.findMany({ select: { status: true } }),
    prisma.internship.count({
      where: { status: { in: ["COMPLETED", "CERTIFICATE_PENDING", "CERTIFICATE_APPROVED"] } },
    }),
    prisma.certificateRequest.findMany({
      where: { status: "PENDING" },
      include: { internship: { include: { intern: { include: { mentor: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentorProfile.findMany({
      include: { _count: { select: { interns: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    kpis: {
      totalInterns,
      totalMentors,
      activeInterns,
      internsWithoutMentors,
      totalProjectsAssigned: assignments.length,
      completedProjects: assignments.filter((a) => a.status === "COMPLETED").length,
      pendingProjects: assignments.filter((a) =>
        ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "RESUBMITTED", "REVISION_REQUIRED"].includes(a.status),
      ).length,
      overdueProjects: assignments.filter((a) => a.status === "OVERDUE").length,
      internshipsCompleted,
      pendingCertificateApprovals: pendingCertRequests.length,
    },
    mentorDistribution: mentors.map((m) => ({ name: m.name, interns: m._count.interns })),
    pendingCertRequests,
  };
}

export async function getMentorDashboardData(actor: Actor) {
  await refreshOverdueAssignments();
  const scope = await internScope(actor);
  const [interns, assignments, upcomingPresentations] = await Promise.all([
    prisma.internProfile.findMany({
      where: scope,
      include: {
        internship: true,
        assignments: { select: { status: true, score: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.projectAssignment.findMany({
      where: { intern: scope },
      select: { status: true },
    }),
    prisma.presentation.count({
      where: {
        intern: scope,
        status: { in: ["SCHEDULED", "RESCHEDULED"] },
      },
    }),
  ]);

  return {
    kpis: {
      assignedInterns: interns.length,
      activeInternships: interns.filter((i) => !i.internship || i.internship.status === "ONGOING").length,
      completedInternships: interns.filter(
        (i) => i.internship && i.internship.status !== "ONGOING" && i.internship.status !== "NOT_STARTED",
      ).length,
      projectsAssigned: assignments.length,
      projectsCompleted: assignments.filter((a) => a.status === "COMPLETED").length,
      projectsPending: assignments.filter((a) => ["ASSIGNED", "IN_PROGRESS"].includes(a.status)).length,
      projectsOverdue: assignments.filter((a) => a.status === "OVERDUE").length,
      awaitingEvaluation: assignments.filter((a) => ["SUBMITTED", "UNDER_REVIEW"].includes(a.status)).length,
      pendingCorrectionReviews: assignments.filter((a) => a.status === "RESUBMITTED").length,
      upcomingPresentations,
    },
    internProgress: interns.map((i) => ({
      id: i.id,
      name: i.name,
      completed: i.assignments.filter((a) => a.status === "COMPLETED").length,
      pending: i.assignments.filter((a) => a.status !== "COMPLETED").length,
    })),
  };
}
