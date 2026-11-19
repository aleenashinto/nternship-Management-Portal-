import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { HttpError, internScope, type Actor } from "@/lib/rbac/guard";
import { generatePassword } from "@/services/user";
import type { z } from "zod";
import type { registerInternSchema, updateInternSchema } from "@/lib/validation/interns";

export async function listInterns(actor: Actor) {
  const scope = await internScope(actor);
  const interns = await prisma.internProfile.findMany({
    where: scope,
    include: {
      user: { select: { id: true, username: true, isActive: true, mustChangePassword: true, createdAt: true } },
      mentor: { select: { id: true, name: true, phone: true } },
      internship: { select: { id: true, status: true, startDate: true, endDate: true, completionDate: true } },
      _count: { select: { assignments: true, notes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return interns;
}

export async function getInternDetail(actor: Actor, internId: string) {
  const scope = await internScope(actor);
  const intern = await prisma.internProfile.findFirst({
    where: { AND: [scope, { id: internId }] },
    include: {
      user: { select: { id: true, username: true, email: true, isActive: true, createdAt: true } },
      mentor: { select: { id: true, name: true, phone: true, workStartTime: true, workEndTime: true } },
      internship: {
        include: {
          certificateRequest: { include: { certificate: true } },
        },
      },
      assignments: {
        include: {
          project: true,
          submissions: { include: { files: true }, orderBy: { version: "desc" } },
          evaluations: { orderBy: { createdAt: "desc" } },
          correctionRequests: { orderBy: { createdAt: "desc" } },
          extensions: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { assignedDate: "desc" },
      },
      presentations: { include: { assignment: { include: { project: true } } }, orderBy: { scheduledAt: "desc" } },
      notes: {
        include: { mentor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!intern) throw new HttpError(404, "Intern not found or access denied");
  return intern;
}

export async function registerIntern(actor: Actor, input: z.infer<typeof registerInternSchema>) {
  // Rule: Admin cannot create interns; only HR Manager registers interns.
  if (actor.role !== "HR") {
    throw new HttpError(403, "Only HR Manager can register interns");
  }

  const mentorId = input.mentorId ? input.mentorId : null;
  if (mentorId) {
    const m = await prisma.mentorProfile.findUnique({ where: { id: mentorId } });
    if (!m) throw new HttpError(404, "Selected mentor not found");
  }

  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const startDate = input.startDate ? new Date(input.startDate) : new Date();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          role: "INTERN",
          username: input.email,
          email: input.email,
          passwordHash,
          mustChangePassword: true,
        },
      });
      const profile = await tx.internProfile.create({
        data: {
          userId: u.id,
          name: input.name,
          email: input.email,
          phone1: input.phone1,
          phone2: input.phone2 || null,
          address: input.address,
          educationalQualification: input.educationalQualification,
          source: input.source,
          mentorId,
        },
      });
      await tx.internship.create({
        data: {
          internId: profile.id,
          startDate,
          status: "ONGOING",
        },
      });
      await logActivity(actor.userId, "INTERN_REGISTERED", "InternProfile", profile.id, {
        email: input.email,
        mentorId,
      }, tx);
      return { user: u, profile };
    });

    await dispatchEvent({
      eventId: `intern-welcome:${created.profile.id}`,
      recipientId: created.user.id,
      recipientEmail: created.user.email,
      type: "INTERN_WELCOME",
      title: "Welcome to Beat Internship Portal",
      message: `Hello ${input.name},\nYour internship account has been created.\nUsername: ${input.email}\nTemporary password: ${tempPassword}\nPlease sign in and change your password on first login.`,
      link: "/intern",
    });

    return {
      internId: created.profile.id,
      userId: created.user.id,
      email: created.user.email,
      welcomeEmailDispatched: true,
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw e;
  }
}

export async function assignMentorToIntern(actor: Actor, internId: string, mentorId: string | null) {
  if (actor.role !== "HR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only HR Manager or Admin can assign mentors");
  }
  const intern = await prisma.internProfile.findUnique({ where: { id: internId } });
  if (!intern) throw new HttpError(404, "Intern not found");

  if (mentorId) {
    const mentor = await prisma.mentorProfile.findUnique({ where: { id: mentorId } });
    if (!mentor) throw new HttpError(404, "Mentor not found");
  }

  const updated = await prisma.internProfile.update({
    where: { id: internId },
    data: { mentorId },
    include: { mentor: { select: { id: true, name: true } } },
  });

  await logActivity(
    actor.userId,
    intern.mentorId ? "MENTOR_REASSIGNED" : "MENTOR_ASSIGNED",
    "InternProfile",
    internId,
    { previousMentorId: intern.mentorId, newMentorId: mentorId },
  );
  return updated;
}

export async function listActiveMentorsForAssignment(actor: Actor) {
  if (actor.role !== "HR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }
  const mentors = await prisma.mentorProfile.findMany({
    where: { user: { isActive: true } },
    include: {
      user: { select: { email: true } },
      _count: { select: { interns: true } },
    },
    orderBy: { name: "asc" },
  });
  return mentors.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.user.email,
    phone: m.phone,
    workStartTime: m.workStartTime,
    workEndTime: m.workEndTime,
    assignedInternCount: m._count.interns,
  }));
}

export async function updateInternByHr(
  actor: Actor,
  internId: string,
  input: z.infer<typeof updateInternSchema>,
) {
  if (actor.role !== "HR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only HR Manager or Admin can edit interns");
  }
  const intern = await prisma.internProfile.findUnique({ where: { id: internId } });
  if (!intern) throw new HttpError(404, "Intern not found");

  const nextMentorId =
    input.mentorId === undefined ? undefined : input.mentorId ? input.mentorId : null;

  await prisma.$transaction(async (tx) => {
    if (input.email) {
      await tx.user.update({
        where: { id: intern.userId },
        data: { email: input.email, username: input.email },
      });
    }
    await tx.internProfile.update({
      where: { id: internId },
      data: {
        name: input.name,
        email: input.email,
        phone1: input.phone1,
        phone2: input.phone2 === undefined ? undefined : input.phone2 || null,
        address: input.address,
        educationalQualification: input.educationalQualification,
        source: input.source,
        mentorId: nextMentorId,
      },
    });
    await logActivity(actor.userId, "INTERN_UPDATED", "InternProfile", internId, {
      fields: Object.keys(input),
    }, tx);
  });
}

export async function deleteInternByHr(actor: Actor, internId: string) {
  if (actor.role !== "HR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only HR Manager or Admin can delete interns");
  }
  const intern = await prisma.internProfile.findUnique({
    where: { id: internId },
    include: { internship: { include: { certificateRequest: true } }, assignments: true },
  });
  if (!intern) throw new HttpError(404, "Intern not found");

  await prisma.$transaction(async (tx) => {
    if (intern.internship?.certificateRequest) {
      await tx.certificate.deleteMany({ where: { requestId: intern.internship.certificateRequest.id } });
      await tx.certificateRequest.delete({ where: { id: intern.internship.certificateRequest.id } });
    }
    if (intern.internship) {
      await tx.internship.delete({ where: { id: intern.internship.id } });
    }
    const aIds = intern.assignments.map((a) => a.id);
    if (aIds.length > 0) {
      await tx.evaluation.deleteMany({ where: { assignmentId: { in: aIds } } });
      await tx.correctionRequest.deleteMany({ where: { assignmentId: { in: aIds } } });
      await tx.extensionRequest.deleteMany({ where: { assignmentId: { in: aIds } } });
      await tx.submission.deleteMany({ where: { assignmentId: { in: aIds } } });
    }
    await tx.presentation.deleteMany({ where: { internId } });
    await tx.projectAssignment.deleteMany({ where: { internId } });
    await tx.mentorNote.deleteMany({ where: { internId } });
    await tx.user.delete({ where: { id: intern.userId } });
    await logActivity(actor.userId, "INTERN_DELETED", "InternProfile", internId, undefined, tx);
  });
}
