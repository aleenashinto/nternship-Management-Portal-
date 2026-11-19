import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { HttpError, type Actor } from "@/lib/rbac/guard";
import type { z } from "zod";
import type { createStaffSchema, updateStaffSchema } from "@/lib/validation/users";

export function generatePassword() {
  // 16 chars, guaranteed to satisfy the password policy (upper, lower, digit).
  const raw = crypto.randomBytes(12).toString("base64url");
  return `${raw}Aa1`.slice(0, 16);
}

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new HttpError(403, "Only Admin can manage staff accounts");
}

const staffSelect = {
  id: true, role: true, username: true, email: true, isActive: true, createdAt: true,
  hrProfile: { select: { name: true } },
  mentorProfile: { select: { id: true, name: true, phone: true, workStartTime: true, workEndTime: true, _count: { select: { interns: true } } } },
} satisfies Prisma.UserSelect;

export async function listStaff(actor: Actor, role?: "HR" | "MENTOR") {
  assertAdmin(actor);
  const users = await prisma.user.findMany({
    where: { role: role ?? { in: ["HR", "MENTOR"] } },
    select: staffSelect,
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });
  return users.map((u) => ({
    id: u.id,
    role: u.role,
    email: u.email,
    isActive: u.isActive,
    createdAt: u.createdAt,
    name: u.hrProfile?.name ?? u.mentorProfile?.name ?? "",
    phone: u.mentorProfile?.phone ?? null,
    workStartTime: u.mentorProfile?.workStartTime ?? null,
    workEndTime: u.mentorProfile?.workEndTime ?? null,
    // derived automatically, never stored
    assignedInterns: u.mentorProfile?._count.interns ?? null,
  }));
}

export async function createStaff(actor: Actor, input: z.infer<typeof createStaffSchema>) {
  assertAdmin(actor);
  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { role: input.role, username: input.email, email: input.email, passwordHash, mustChangePassword: true },
      });
      if (input.role === "HR") {
        await tx.hRProfile.create({ data: { userId: u.id, name: input.name } });
      } else {
        await tx.mentorProfile.create({
          data: { userId: u.id, name: input.name, phone: input.phone, workStartTime: input.workStartTime, workEndTime: input.workEndTime },
        });
      }
      await logActivity(actor.userId, "USER_CREATED", "User", u.id, { role: input.role, email: input.email }, tx);
      return u;
    });
    // Shown to the Admin exactly once; only the hash is stored.
    return { id: user.id, email: user.email, role: user.role, tempPassword };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw e;
  }
}

export async function updateStaff(actor: Actor, id: string, input: z.infer<typeof updateStaffSchema>) {
  assertAdmin(actor);
  const user = await prisma.user.findUnique({ where: { id }, include: { hrProfile: true, mentorProfile: true } });
  if (!user || (user.role !== "HR" && user.role !== "MENTOR")) throw new HttpError(404, "Staff account not found");
  const mentorOnly = input.phone !== undefined || input.workStartTime !== undefined || input.workEndTime !== undefined;
  if (mentorOnly && user.role !== "MENTOR") throw new HttpError(400, "Phone and working hours apply to mentors only");

  try {
    await prisma.$transaction(async (tx) => {
      if (input.email) await tx.user.update({ where: { id }, data: { email: input.email, username: input.email } });
      if (user.role === "HR" && input.name) await tx.hRProfile.update({ where: { userId: id }, data: { name: input.name } });
      if (user.role === "MENTOR") {
        const { name, phone, workStartTime, workEndTime } = input;
        await tx.mentorProfile.update({ where: { userId: id }, data: { name, phone, workStartTime, workEndTime } });
      }
      await logActivity(actor.userId, "USER_UPDATED", "User", id, { fields: Object.keys(input) }, tx);
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw e;
  }
}

export async function setStaffActive(actor: Actor, id: string, isActive: boolean) {
  assertAdmin(actor);
  if (id === actor.userId) throw new HttpError(400, "You cannot deactivate your own account");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || (user.role !== "HR" && user.role !== "MENTOR")) throw new HttpError(404, "Staff account not found");
  await prisma.user.update({ where: { id }, data: { isActive } });
  await logActivity(actor.userId, isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", "User", id);
}

/** Admin resets a staff password; returns the new temporary password once. */
export async function resetStaffPassword(actor: Actor, id: string) {
  assertAdmin(actor);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || (user.role !== "HR" && user.role !== "MENTOR")) throw new HttpError(404, "Staff account not found");
  const tempPassword = generatePassword();
  await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(tempPassword, 12), mustChangePassword: true } });
  await logActivity(actor.userId, "USER_PASSWORD_RESET", "User", id);
  return { tempPassword };
}

function assertHrOrAdmin(actor: Actor) {
  if (actor.role !== "HR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only HR Manager or Admin can manage mentors");
  }
}

export async function listMentorsForHr(actor: Actor) {
  assertHrOrAdmin(actor);
  const mentors = await prisma.mentorProfile.findMany({
    include: {
      user: { select: { id: true, email: true, username: true, isActive: true, createdAt: true } },
      interns: { select: { id: true, name: true, email: true, educationalQualification: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return mentors.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.name,
    email: m.user.email,
    phone: m.phone,
    workStartTime: m.workStartTime,
    workEndTime: m.workEndTime,
    isActive: m.user.isActive,
    assignedInterns: m.interns,
    assignedInternCount: m.interns.length,
  }));
}

export async function createMentorByHr(
  actor: Actor,
  input: { name: string; email: string; phone: string; workStartTime: string; workEndTime: string },
) {
  assertHrOrAdmin(actor);
  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  try {
    const created = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { role: "MENTOR", username: input.email, email: input.email, passwordHash, mustChangePassword: true },
      });
      const m = await tx.mentorProfile.create({
        data: {
          userId: u.id,
          name: input.name,
          phone: input.phone,
          workStartTime: input.workStartTime,
          workEndTime: input.workEndTime,
        },
      });
      await logActivity(actor.userId, "MENTOR_CREATED", "MentorProfile", m.id, { email: input.email }, tx);
      return { u, m };
    });
    return { id: created.m.id, userId: created.u.id, email: created.u.email, tempPassword };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw e;
  }
}

export async function updateMentorByHr(
  actor: Actor,
  mentorId: string,
  input: { name?: string; email?: string; phone?: string; workStartTime?: string; workEndTime?: string },
) {
  assertHrOrAdmin(actor);
  const mentor = await prisma.mentorProfile.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new HttpError(404, "Mentor not found");
  await prisma.$transaction(async (tx) => {
    if (input.email) {
      await tx.user.update({
        where: { id: mentor.userId },
        data: { email: input.email, username: input.email },
      });
    }
    await tx.mentorProfile.update({
      where: { id: mentorId },
      data: {
        name: input.name,
        phone: input.phone,
        workStartTime: input.workStartTime,
        workEndTime: input.workEndTime,
      },
    });
    await logActivity(actor.userId, "MENTOR_UPDATED", "MentorProfile", mentorId, { fields: Object.keys(input) }, tx);
  });
}

export async function deleteMentorByHr(actor: Actor, mentorId: string) {
  assertHrOrAdmin(actor);
  const mentor = await prisma.mentorProfile.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new HttpError(404, "Mentor not found");
  await prisma.$transaction(async (tx) => {
    await tx.internProfile.updateMany({ where: { mentorId }, data: { mentorId: null } });
    await tx.project.deleteMany({ where: { createdByMentorId: mentorId } });
    await tx.mentorNote.deleteMany({ where: { mentorId } });
    await tx.user.delete({ where: { id: mentor.userId } });
    await logActivity(actor.userId, "MENTOR_DELETED", "MentorProfile", mentorId, undefined, tx);
  });
}
