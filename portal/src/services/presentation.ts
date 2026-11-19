import { z } from "zod";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { HttpError, internScope, type Actor } from "@/lib/rbac/guard";

export const createPresentationSchema = z.object({
  internId: z.string().min(1),
  assignmentId: z.string().optional().or(z.literal("")),
  scheduledAt: z.string().min(1),
  googleMeetLink: z.string().trim().url("Valid Google Meet URL required"),
});

export const updatePresentationSchema = z.object({
  action: z.enum(["RESCHEDULE", "CANCEL", "COMPLETE"]),
  scheduledAt: z.string().optional(),
  googleMeetLink: z.string().trim().url().optional(),
});

export async function listPresentations(actor: Actor) {
  const scope = await internScope(actor);
  return prisma.presentation.findMany({
    where: { intern: scope },
    include: {
      intern: { select: { id: true, name: true, email: true, mentorId: true } },
      assignment: { include: { project: { select: { id: true, title: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function schedulePresentation(actor: Actor, input: z.infer<typeof createPresentationSchema>) {
  if (actor.role !== "MENTOR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only a Mentor or Admin can schedule presentations");
  }

  const intern = await prisma.internProfile.findUnique({
    where: { id: input.internId },
    include: { user: true },
  });
  if (!intern) throw new HttpError(404, "Intern not found");
  if (actor.role === "MENTOR" && intern.mentorId !== actor.mentorId) {
    throw new HttpError(403, "Mentors may schedule presentations only for their own interns");
  }

  const scheduledAt = new Date(input.scheduledAt);
  const conflict = await prisma.presentation.findFirst({
    where: {
      internId: intern.id,
      scheduledAt,
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
    },
  });
  if (conflict) {
    throw new HttpError(409, "This intern already has a presentation scheduled at the exact same date and time");
  }
  const pres = await prisma.presentation.create({
    data: {
      internId: intern.id,
      assignmentId: input.assignmentId || null,
      scheduledAt,
      googleMeetLink: input.googleMeetLink,
      status: "SCHEDULED",
      createdById: actor.userId,
    },
    include: { assignment: { include: { project: true } } },
  });

  await logActivity(actor.userId, "PRESENTATION_SCHEDULED", "Presentation", pres.id, {
    internId: intern.id,
    scheduledAt: scheduledAt.toISOString(),
  });

  await dispatchEvent({
    eventId: `presentation-scheduled:${pres.id}`,
    recipientId: intern.user.id,
    recipientEmail: intern.user.email,
    type: "PRESENTATION_SCHEDULED",
    title: "Presentation Scheduled",
    message: `Your presentation${pres.assignment ? ` for "${pres.assignment.project.title}"` : ""} is scheduled on ${scheduledAt.toLocaleString()}.\nGoogle Meet: ${pres.googleMeetLink}`,
    link: "/intern/presentations",
  });

  return pres;
}

export async function updatePresentation(
  actor: Actor,
  presentationId: string,
  input: z.infer<typeof updatePresentationSchema>,
) {
  if (actor.role !== "MENTOR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only a Mentor or Admin can update presentations");
  }

  const pres = await prisma.presentation.findUnique({
    where: { id: presentationId },
    include: { intern: { include: { user: true } }, assignment: { include: { project: true } } },
  });
  if (!pres) throw new HttpError(404, "Presentation not found");
  if (actor.role === "MENTOR" && pres.intern.mentorId !== actor.mentorId) {
    throw new HttpError(403, "Forbidden");
  }

  const statusMap = {
    RESCHEDULE: "RESCHEDULED",
    CANCEL: "CANCELLED",
    COMPLETE: "COMPLETED",
  } as const;

  const nextScheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : pres.scheduledAt;
  const nextLink = input.googleMeetLink ?? pres.googleMeetLink;

  const updated = await prisma.presentation.update({
    where: { id: presentationId },
    data: {
      status: statusMap[input.action],
      scheduledAt: nextScheduledAt,
      googleMeetLink: nextLink,
    },
  });

  await logActivity(actor.userId, `PRESENTATION_${statusMap[input.action]}`, "Presentation", pres.id, {
    scheduledAt: nextScheduledAt.toISOString(),
  });

  if (input.action === "RESCHEDULE" || input.action === "CANCEL") {
    await dispatchEvent({
      eventId: `presentation-${input.action.toLowerCase()}:${pres.id}:${updated.updatedAt.getTime()}`,
      recipientId: pres.intern.user.id,
      recipientEmail: pres.intern.user.email,
      type: `PRESENTATION_${statusMap[input.action]}`,
      title: input.action === "RESCHEDULE" ? "Presentation Rescheduled" : "Presentation Cancelled",
      message:
        input.action === "RESCHEDULE"
          ? `Your presentation has been rescheduled to ${nextScheduledAt.toLocaleString()}.\nGoogle Meet: ${nextLink}`
          : `Your scheduled presentation on ${pres.scheduledAt.toLocaleString()} has been cancelled.`,
      link: "/intern/presentations",
    });
  }

  return updated;
}
