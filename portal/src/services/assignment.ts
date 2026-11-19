import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { HttpError, internScope, visibleMentorIds, type Actor } from "@/lib/rbac/guard";
import { saveStoredFile } from "@/lib/storage";
import type { z } from "zod";
import type {
  createAssignmentSchema,
  createExtensionSchema,
  decideExtensionSchema,
  evaluateAssignmentSchema,
} from "@/lib/validation/projects";

/**
 * Automatically updates assignments whose dueDate has passed without an accepted submission
 * (i.e. status in ASSIGNED, IN_PROGRESS, REVISION_REQUIRED) to OVERDUE.
 */
export async function refreshOverdueAssignments() {
  const now = new Date();
  await prisma.projectAssignment.updateMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["ASSIGNED", "IN_PROGRESS", "REVISION_REQUIRED"] },
    },
    data: { status: "OVERDUE" },
  });
}

export async function listAssignments(actor: Actor) {
  await refreshOverdueAssignments();
  const scope = await internScope(actor);
  return prisma.projectAssignment.findMany({
    where: { intern: scope },
    include: {
      project: { include: { files: true } },
      intern: { include: { user: { select: { id: true, email: true } }, mentor: { select: { id: true, name: true } } } },
      submissions: { include: { files: true }, orderBy: { version: "desc" } },
      evaluations: { orderBy: { createdAt: "desc" } },
      correctionRequests: { orderBy: { createdAt: "desc" } },
      extensions: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function assignProject(actor: Actor, input: z.infer<typeof createAssignmentSchema>) {
  if (actor.role !== "MENTOR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only a Mentor or Admin can assign projects");
  }

  const [project, intern] = await Promise.all([
    prisma.project.findUnique({ where: { id: input.projectId } }),
    prisma.internProfile.findUnique({ where: { id: input.internId }, include: { user: true } }),
  ]);
  if (!project) throw new HttpError(404, "Project not found");
  if (!intern) throw new HttpError(404, "Intern not found");

  if (actor.role === "MENTOR" && intern.mentorId !== actor.mentorId) {
    throw new HttpError(403, "Mentors may assign projects only to their own assigned interns");
  }

  const assignedDate = input.assignedDate ? new Date(input.assignedDate) : new Date();
  const dueDate = new Date(input.dueDate);
  if (dueDate < assignedDate) throw new HttpError(400, "Due date cannot be earlier than assigned date");

  const assignment = await prisma.projectAssignment.create({
    data: {
      projectId: project.id,
      internId: intern.id,
      assignedDate,
      dueDate,
      status: "ASSIGNED",
    },
    include: { project: true, intern: true },
  });

  await logActivity(actor.userId, "PROJECT_ASSIGNED", "ProjectAssignment", assignment.id, {
    projectId: project.id,
    internId: intern.id,
    dueDate: dueDate.toISOString(),
  });

  await dispatchEvent({
    eventId: `assignment-created:${assignment.id}`,
    recipientId: intern.user.id,
    recipientEmail: intern.user.email,
    type: "PROJECT_ASSIGNED",
    title: `New Project Assigned: ${project.title}`,
    message: `You have been assigned "${project.title}". Due date: ${dueDate.toISOString().slice(0, 10)}.`,
    link: "/intern/assignments",
  });

  return assignment;
}

/**
 * Append-only submission versioning:
 * Calculates next version = max(version) + 1 inside a transaction and NEVER overwrites previous versions.
 */
export async function createSubmission(params: {
  actor: Actor;
  assignmentId: string;
  note?: string;
  files: { originalName: string; mimeType: string; bytes: Buffer }[];
}) {
  const { actor, assignmentId, note, files } = params;
  const assignment = await prisma.projectAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      project: true,
      intern: { include: { user: true, mentor: { include: { user: true } } } },
      submissions: { select: { version: true }, orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");

  if (actor.role === "INTERN" && assignment.internId !== actor.internId) {
    throw new HttpError(403, "You can only submit to your own assignment");
  }
  if (actor.role !== "INTERN" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only the assigned intern can upload a submission");
  }

  const prevVersion = assignment.submissions[0]?.version ?? 0;
  const nextVersion = prevVersion + 1;
  const isResubmission = nextVersion > 1;
  const nextStatus = isResubmission ? "RESUBMITTED" : "SUBMITTED";

  const submission = await prisma.$transaction(async (tx) => {
    const sub = await tx.submission.create({
      data: {
        assignmentId,
        version: nextVersion,
        note: note || null,
      },
    });
    await tx.projectAssignment.update({
      where: { id: assignmentId },
      data: { status: nextStatus },
    });
    await logActivity(
      actor.userId,
      isResubmission ? "PROJECT_RESUBMITTED" : "PROJECT_SUBMITTED",
      "Submission",
      sub.id,
      { assignmentId, version: nextVersion },
      tx,
    );
    return sub;
  });

  for (const f of files) {
    await saveStoredFile({
      actor,
      kind: "SUBMISSION",
      originalName: f.originalName,
      mimeType: f.mimeType,
      bytes: f.bytes,
      submissionId: submission.id,
    });
  }

  if (assignment.intern.mentor?.user) {
    await dispatchEvent({
      eventId: `submission:${submission.id}`,
      recipientId: assignment.intern.mentor.user.id,
      recipientEmail: assignment.intern.mentor.user.email,
      type: isResubmission ? "PROJECT_RESUBMITTED" : "PROJECT_SUBMITTED",
      title: `${isResubmission ? "Resubmission" : "New Submission"} (v${nextVersion}): ${assignment.project.title}`,
      message: `${assignment.intern.name} uploaded submission v${nextVersion} for "${assignment.project.title}".`,
      link: "/mentor/assignments",
    });
  }

  return prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { files: true },
  });
}

/**
 * Mentor evaluates a submission:
 * - Records Evaluation(score 0..100, feedback, decision)
 * - If REVISION_REQUIRED, also creates a CorrectionRequest and sets status=REVISION_REQUIRED
 * - If COMPLETED, sets status=COMPLETED and score on ProjectAssignment
 * - CRITICAL RULE: Project completion NEVER automatically completes the Internship.
 */
export async function evaluateSubmission(
  actor: Actor,
  assignmentId: string,
  input: z.infer<typeof evaluateAssignmentSchema>,
) {
  if (actor.role !== "MENTOR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only a Mentor or Admin can evaluate submissions");
  }

  const assignment = await prisma.projectAssignment.findUnique({
    where: { id: assignmentId },
    include: { project: true, intern: { include: { user: true } } },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");

  if (actor.role === "MENTOR") {
    const visible = await visibleMentorIds(actor);
    if (visible !== "ALL" && (!assignment.intern.mentorId || !visible.includes(assignment.intern.mentorId))) {
      throw new HttpError(403, "Forbidden");
    }
  }

  const submission = await prisma.submission.findFirst({
    where: { id: input.submissionId, assignmentId },
  });
  if (!submission) throw new HttpError(404, "Submission not found for this assignment");

  const nextStatus = input.decision === "COMPLETED" ? "COMPLETED" : "REVISION_REQUIRED";

  const evaluation = await prisma.$transaction(async (tx) => {
    const ev = await tx.evaluation.create({
      data: {
        assignmentId,
        submissionId: submission.id,
        score: input.score,
        feedback: input.feedback,
        decision: input.decision,
        evaluatedById: actor.userId,
      },
    });
    if (input.decision === "REVISION_REQUIRED") {
      await tx.correctionRequest.create({
        data: {
          assignmentId,
          instructions: input.correctionInstructions || input.feedback,
        },
      });
    }
    await tx.projectAssignment.update({
      where: { id: assignmentId },
      data: { status: nextStatus, score: input.score },
    });
    await logActivity(
      actor.userId,
      input.decision === "COMPLETED" ? "ASSIGNMENT_EVALUATED_COMPLETED" : "CORRECTION_REQUESTED",
      "Evaluation",
      ev.id,
      { assignmentId, submissionId: submission.id, score: input.score, decision: input.decision },
      tx,
    );
    return ev;
  });

  await dispatchEvent({
    eventId: `evaluation:${evaluation.id}`,
    recipientId: assignment.intern.user.id,
    recipientEmail: assignment.intern.user.email,
    type: input.decision === "COMPLETED" ? "ASSIGNMENT_COMPLETED" : "CORRECTION_REQUESTED",
    title:
      input.decision === "COMPLETED"
        ? `Project Approved: ${assignment.project.title} (${input.score}/100)`
        : `Correction Requested: ${assignment.project.title}`,
    message:
      input.decision === "COMPLETED"
        ? `Your submission for "${assignment.project.title}" has been approved with a score of ${input.score}/100.\nFeedback: ${input.feedback}`
        : `Your mentor requested corrections on "${assignment.project.title}" (Score: ${input.score}/100).\nInstructions: ${input.correctionInstructions || input.feedback}`,
    link: "/intern/assignments",
  });

  return evaluation;
}

export async function requestExtension(actor: Actor, input: z.infer<typeof createExtensionSchema>) {
  const assignment = await prisma.projectAssignment.findUnique({
    where: { id: input.assignmentId },
    include: {
      project: true,
      intern: { include: { user: true, mentor: { include: { user: true } } } },
    },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");

  if (actor.role === "INTERN" && assignment.internId !== actor.internId) {
    throw new HttpError(403, "You can only request an extension for your own assignment");
  }

  const requestedDate = new Date(input.requestedDate);
  if (requestedDate <= assignment.dueDate) {
    throw new HttpError(400, "Requested extension date must be after the current due date");
  }

  const ext = await prisma.extensionRequest.create({
    data: {
      assignmentId: assignment.id,
      reason: input.reason,
      requestedDate,
      status: "PENDING",
    },
  });

  await logActivity(actor.userId, "EXTENSION_REQUESTED", "ExtensionRequest", ext.id, {
    assignmentId: assignment.id,
    requestedDate: requestedDate.toISOString(),
  });

  if (assignment.intern.mentor?.user) {
    await dispatchEvent({
      eventId: `extension-requested:${ext.id}`,
      recipientId: assignment.intern.mentor.user.id,
      recipientEmail: assignment.intern.mentor.user.email,
      type: "EXTENSION_SUBMITTED",
      title: `Extension Request: ${assignment.intern.name}`,
      message: `${assignment.intern.name} requested a deadline extension for "${assignment.project.title}" to ${requestedDate.toISOString().slice(0, 10)}.\nReason: ${input.reason}`,
      link: "/mentor/extensions",
    });
  }

  return ext;
}

export async function decideExtension(
  actor: Actor,
  extensionId: string,
  input: z.infer<typeof decideExtensionSchema>,
) {
  if (actor.role !== "MENTOR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only a Mentor or Admin can decide extension requests");
  }

  const ext = await prisma.extensionRequest.findUnique({
    where: { id: extensionId },
    include: { assignment: { include: { project: true, intern: { include: { user: true } } } } },
  });
  if (!ext) throw new HttpError(404, "Extension request not found");
  if (ext.status !== "PENDING") throw new HttpError(400, "Extension request already decided");

  if (actor.role === "MENTOR" && ext.assignment.intern.mentorId !== actor.mentorId) {
    throw new HttpError(403, "Forbidden");
  }

  const approvedDate =
    input.decision === "APPROVED"
      ? input.approvedDate
        ? new Date(input.approvedDate)
        : ext.requestedDate
      : null;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.extensionRequest.update({
      where: { id: extensionId },
      data: {
        status: input.decision,
        approvedDate,
        decidedById: actor.userId,
        decidedAt: new Date(),
      },
    });
    if (input.decision === "APPROVED" && approvedDate) {
      await tx.projectAssignment.update({
        where: { id: ext.assignmentId },
        data: {
          dueDate: approvedDate,
          status: ext.assignment.status === "OVERDUE" && approvedDate > new Date() ? "IN_PROGRESS" : ext.assignment.status,
        },
      });
    }
    await logActivity(
      actor.userId,
      input.decision === "APPROVED" ? "EXTENSION_APPROVED" : "EXTENSION_REJECTED",
      "ExtensionRequest",
      ext.id,
      { assignmentId: ext.assignmentId, approvedDate: approvedDate?.toISOString() ?? null },
      tx,
    );
    return u;
  });

  await dispatchEvent({
    eventId: `extension-decided:${ext.id}`,
    recipientId: ext.assignment.intern.user.id,
    recipientEmail: ext.assignment.intern.user.email,
    type: input.decision === "APPROVED" ? "EXTENSION_APPROVED" : "EXTENSION_REJECTED",
    title: `Extension ${input.decision === "APPROVED" ? "Approved" : "Rejected"}: ${ext.assignment.project.title}`,
    message:
      input.decision === "APPROVED"
        ? `Your deadline extension for "${ext.assignment.project.title}" has been approved. Revised due date: ${approvedDate?.toISOString().slice(0, 10)}.`
        : `Your deadline extension request for "${ext.assignment.project.title}" was rejected.`,
    link: "/intern/assignments",
  });

  return updated;
}

export async function listExtensions(actor: Actor) {
  const scope = await internScope(actor);
  return prisma.extensionRequest.findMany({
    where: { assignment: { intern: scope } },
    include: {
      assignment: {
        include: {
          project: { select: { id: true, title: true } },
          intern: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
