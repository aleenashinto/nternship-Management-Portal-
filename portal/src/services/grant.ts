import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { HttpError, type Actor } from "@/lib/rbac/guard";

export const createGrantSchema = z
  .object({
    ownerId: z.string().min(1),
    granteeId: z.string().min(1),
  })
  .refine((v) => v.ownerId !== v.granteeId, "A mentor already has access to their own interns");

export const deleteGrantSchema = z.object({ id: z.string().min(1) });

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new HttpError(403, "Only Admin can manage mentor access grants");
}

export async function listGrants(actor: Actor) {
  assertAdmin(actor);
  const [grants, mentors] = await Promise.all([
    prisma.mentorAccessGrant.findMany({
      include: {
        owner: { include: { user: { select: { email: true } } } },
        grantee: { include: { user: { select: { email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentorProfile.findMany({
      include: { user: { select: { email: true, isActive: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    grants: grants.map((g) => ({
      id: g.id,
      ownerId: g.ownerId,
      ownerName: g.owner.name,
      ownerEmail: g.owner.user.email,
      granteeId: g.granteeId,
      granteeName: g.grantee.name,
      granteeEmail: g.grantee.user.email,
      createdAt: g.createdAt,
    })),
    mentors: mentors.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.user.email,
      isActive: m.user.isActive,
    })),
  };
}

export async function createGrant(actor: Actor, input: z.infer<typeof createGrantSchema>) {
  assertAdmin(actor);
  const [owner, grantee] = await Promise.all([
    prisma.mentorProfile.findUnique({ where: { id: input.ownerId } }),
    prisma.mentorProfile.findUnique({ where: { id: input.granteeId } }),
  ]);
  if (!owner || !grantee) throw new HttpError(404, "Mentor not found");
  try {
    const grant = await prisma.mentorAccessGrant.create({
      data: { ownerId: input.ownerId, granteeId: input.granteeId, createdBy: actor.userId },
    });
    await logActivity(actor.userId, "MENTOR_GRANT_CREATED", "MentorAccessGrant", grant.id, {
      ownerId: input.ownerId,
      granteeId: input.granteeId,
    });
    return grant;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "This access grant already exists");
    }
    throw e;
  }
}

export async function revokeGrant(actor: Actor, id: string) {
  assertAdmin(actor);
  const grant = await prisma.mentorAccessGrant.findUnique({ where: { id } });
  if (!grant) throw new HttpError(404, "Grant not found");
  await prisma.mentorAccessGrant.delete({ where: { id } });
  await logActivity(actor.userId, "MENTOR_GRANT_REVOKED", "MentorAccessGrant", id, {
    ownerId: grant.ownerId,
    granteeId: grant.granteeId,
  });
}
