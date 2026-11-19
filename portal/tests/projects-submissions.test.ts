import { beforeAll, describe, expect, it } from "vitest";
import { actorOf, makeUser, prismaClient, resetDb } from "./helpers";
import { createProject, updateProject } from "@/services/project";
import {
  assignProject,
  createSubmission,
  decideExtension,
  evaluateSubmission,
  refreshOverdueAssignments,
  requestExtension,
} from "@/services/assignment";

describe("Phase D & E: Reusable projects, assignments, submission versioning, evaluations & extensions", () => {
  let m1: Awaited<ReturnType<typeof makeUser>>;
  let m2: Awaited<ReturnType<typeof makeUser>>;
  let i1: Awaited<ReturnType<typeof makeUser>>;
  let i2: Awaited<ReturnType<typeof makeUser>>;

  beforeAll(async () => {
    await resetDb();
    const prisma = await prismaClient();
    m1 = await makeUser("MENTOR");
    m2 = await makeUser("MENTOR");
    i1 = await makeUser("INTERN", { mentorId: m1.mentorId! });
    i2 = await makeUser("INTERN", { mentorId: m1.mentorId! });
    await prisma.internship.create({ data: { internId: i1.internId!, startDate: new Date(), status: "ONGOING" } });
    await prisma.internship.create({ data: { internId: i2.internId!, startDate: new Date(), status: "ONGOING" } });
  });

  it("allows mentor to edit only their own projects and reuse one project across multiple interns", async () => {
    const project = await createProject(actorOf(m1), {
      title: "Customer Churn Analytics",
      toolsUsed: ["PYTHON", "SQL", "TABLEAU"],
      instructions: "Build churn model and dashboard",
      dataSourceText: "db.analytics.local/churn",
    });

    await expect(updateProject(actorOf(m2), project.id, { title: "Hijack" })).rejects.toThrow(
      "Mentors may edit only their own projects",
    );

    const a1 = await assignProject(actorOf(m1), {
      projectId: project.id,
      internId: i1.internId!,
      assignedDate: "2026-11-01",
      dueDate: "2026-11-25",
    });
    const a2 = await assignProject(actorOf(m1), {
      projectId: project.id,
      internId: i2.internId!,
      assignedDate: "2026-11-02",
      dueDate: "2026-11-30",
    });
    expect(a1.id).not.toBe(a2.id);
    expect(a1.projectId).toBe(project.id);
    expect(a2.projectId).toBe(project.id);
  });

  it("versions submissions append-only (never overwrites) and Completing a project does NOT complete the internship", async () => {
    const prisma = await prismaClient();
    const assignment = await prisma.projectAssignment.findFirstOrThrow({ where: { internId: i1.internId! } });

    const sub1 = await createSubmission({
      actor: actorOf(i1),
      assignmentId: assignment.id,
      note: "Initial submission",
      files: [{ originalName: "solution_v1.py", mimeType: "text/plain", bytes: Buffer.from("print('v1')") }],
    });
    expect(sub1.version).toBe(1);

    // Mentor requests corrections on v1
    await evaluateSubmission(actorOf(m1), assignment.id, {
      submissionId: sub1.id,
      score: 65,
      decision: "REVISION_REQUIRED",
      feedback: "Add precision-recall curve",
      correctionInstructions: "Include PR curve and confusion matrix",
    });

    const afterRev = await prisma.projectAssignment.findUniqueOrThrow({ where: { id: assignment.id } });
    expect(afterRev.status).toBe("REVISION_REQUIRED");

    // Intern uploads resubmission -> creates v2, keeping v1 intact
    const sub2 = await createSubmission({
      actor: actorOf(i1),
      assignmentId: assignment.id,
      note: "Added PR curve",
      files: [{ originalName: "solution_v2.py", mimeType: "text/plain", bytes: Buffer.from("print('v2')") }],
    });
    expect(sub2.version).toBe(2);

    const allSubs = await prisma.submission.findMany({
      where: { assignmentId: assignment.id },
      orderBy: { version: "asc" },
    });
    expect(allSubs.map((s) => s.version)).toEqual([1, 2]);
    expect(allSubs[0].id).toBe(sub1.id);

    // Mentor marks v2 COMPLETED
    await evaluateSubmission(actorOf(m1), assignment.id, {
      submissionId: sub2.id,
      score: 94,
      decision: "COMPLETED",
      feedback: "Great work",
    });

    const completedAssignment = await prisma.projectAssignment.findUniqueOrThrow({ where: { id: assignment.id } });
    expect(completedAssignment.status).toBe("COMPLETED");
    expect(completedAssignment.score).toBe(94);

    // Critical rule: Project completion NEVER automatically completes the Internship
    const internship = await prisma.internship.findUniqueOrThrow({ where: { internId: i1.internId! } });
    expect(internship.status).toBe("ONGOING");
    expect(internship.completionDate).toBeNull();
  });

  it("marks past-due assignments OVERDUE and updates assignment deadline when extension is approved", async () => {
    const prisma = await prismaClient();
    const project = await prisma.project.findFirstOrThrow();
    const pastDue = await assignProject(actorOf(m1), {
      projectId: project.id,
      internId: i2.internId!,
      assignedDate: "2026-10-01",
      dueDate: "2026-10-10",
    });

    await refreshOverdueAssignments();
    const overdueRow = await prisma.projectAssignment.findUniqueOrThrow({ where: { id: pastDue.id } });
    expect(overdueRow.status).toBe("OVERDUE");

    // Intern requests extension to a future date
    const ext = await requestExtension(actorOf(i2), {
      assignmentId: pastDue.id,
      reason: "Awaiting dataset access",
      requestedDate: "2026-12-20",
    });
    expect(ext.status).toBe("PENDING");

    await decideExtension(actorOf(m1), ext.id, {
      decision: "APPROVED",
      approvedDate: "2026-12-22",
    });

    const updatedAssignment = await prisma.projectAssignment.findUniqueOrThrow({ where: { id: pastDue.id } });
    expect(updatedAssignment.dueDate.toISOString().slice(0, 10)).toBe("2026-12-22");
  });
});
