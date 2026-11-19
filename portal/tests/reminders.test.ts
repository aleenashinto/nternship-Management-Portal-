import { beforeAll, describe, expect, it } from "vitest";
import { actorOf, makeUser, prismaClient, resetDb } from "./helpers";
import { createProject } from "@/services/project";
import { assignProject, decideExtension, requestExtension } from "@/services/assignment";
import { runDailyDeadlineReminders } from "@/lib/cron/reminders";

describe("Phase H: Daily deadline reminders use current approved due date and never duplicate", () => {
  let m1: Awaited<ReturnType<typeof makeUser>>;
  let i1: Awaited<ReturnType<typeof makeUser>>;

  beforeAll(async () => {
    await resetDb();
    m1 = await makeUser("MENTOR");
    i1 = await makeUser("INTERN", { mentorId: m1.mentorId! });
  });

  it("uses the revised due date after extension approval and is idempotent on repeat runs", async () => {
    const prisma = await prismaClient();
    const project = await createProject(actorOf(m1), {
      title: "SQL Analytics Cohort",
      toolsUsed: ["SQL"],
      instructions: "Write cohort queries",
    });

    const assignment = await assignProject(actorOf(m1), {
      projectId: project.id,
      internId: i1.internId!,
      assignedDate: "2026-11-10",
      dueDate: "2026-11-20",
    });

    // Intern requests extension to 2026-11-25 and mentor approves
    const ext = await requestExtension(actorOf(i1), {
      assignmentId: assignment.id,
      reason: "Extra validation needed",
      requestedDate: "2026-11-25",
    });
    await decideExtension(actorOf(m1), ext.id, {
      decision: "APPROVED",
      approvedDate: "2026-11-25",
    });

    // Running reminders on 2026-11-19 (the day before the OLD due date 2026-11-20) must send 0 reminders
    const runOld = await runDailyDeadlineReminders(new Date("2026-11-19T09:00:00Z"));
    expect(runOld.checked).toBe(0);
    expect(runOld.sentCount).toBe(0);

    // Running reminders on 2026-11-24 (the day before the REVISED due date 2026-11-25) sends 1 reminder
    const runRevised1 = await runDailyDeadlineReminders(new Date("2026-11-24T09:00:00Z"));
    expect(runRevised1.checked).toBe(1);
    expect(runRevised1.sentCount).toBe(1);
    expect(runRevised1.deduplicatedCount).toBe(0);

    // Re-running on the same day must deduplicate (0 new emails/notifications)
    const runRevised2 = await runDailyDeadlineReminders(new Date("2026-11-24T14:00:00Z"));
    expect(runRevised2.checked).toBe(1);
    expect(runRevised2.sentCount).toBe(0);
    expect(runRevised2.deduplicatedCount).toBe(1);

    const notifs = await prisma.notification.findMany({
      where: { recipientId: i1.user.id, type: "DEADLINE_REMINDER" },
    });
    expect(notifs.length).toBe(1);
  });
});
