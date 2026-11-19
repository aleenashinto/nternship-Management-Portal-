import { prisma } from "@/lib/db";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { refreshOverdueAssignments } from "@/services/assignment";

/**
 * Daily deadline reminder job (9:00 AM):
 * - First refreshes any assignments that have become OVERDUE
 * - Finds assignments due tomorrow (next calendar day in UTC) using the CURRENT approved dueDate
 *   whose status is not yet submitted/completed
 * - Dispatches both an in-portal notification and an email via the idempotent event dispatcher
 *   using eventId = `due-reminder:${assignment.id}:${dueYmd}` so re-running never duplicates.
 */
export async function runDailyDeadlineReminders(referenceDate: Date = new Date()) {
  await refreshOverdueAssignments();

  const tomorrowStart = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate() + 1, 0, 0, 0),
  );
  const tomorrowEnd = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate() + 2, 0, 0, 0),
  );
  const dueYmd = tomorrowStart.toISOString().slice(0, 10);

  const dueTomorrow = await prisma.projectAssignment.findMany({
    where: {
      dueDate: { gte: tomorrowStart, lt: tomorrowEnd },
      status: { in: ["ASSIGNED", "IN_PROGRESS", "REVISION_REQUIRED"] },
    },
    include: {
      project: true,
      intern: { include: { user: true } },
    },
  });

  let sentCount = 0;
  let deduplicatedCount = 0;

  for (const a of dueTomorrow) {
    const res = await dispatchEvent({
      eventId: `due-reminder:${a.id}:${dueYmd}`,
      recipientId: a.intern.user.id,
      recipientEmail: a.intern.user.email,
      type: "DEADLINE_REMINDER",
      title: `Reminder: "${a.project.title}" is due tomorrow (${dueYmd})`,
      message: `Hello ${a.intern.name},\nThis is a reminder that your project "${a.project.title}" is due tomorrow (${dueYmd}). Please upload your submission or request an extension if needed.`,
      link: "/intern/assignments",
    });
    if (res.deduplicated) deduplicatedCount += 1;
    else sentCount += 1;
  }

  return { checked: dueTomorrow.length, sentCount, deduplicatedCount, dueYmd };
}
