import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** The authenticated actor, re-read from the DB on every request (so deactivation is immediate). */
export type Actor = {
  userId: string;
  role: Role;
  username: string;
  mustChangePassword: boolean;
  mentorId: string | null;
  internId: string | null;
};

export async function getActor(): Promise<Actor | null> {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { mentorProfile: { select: { id: true } }, internProfile: { select: { id: true } } },
  });
  if (!user || !user.isActive) return null;
  return {
    userId: user.id,
    role: user.role,
    username: user.username,
    mustChangePassword: user.mustChangePassword,
    mentorId: user.mentorProfile?.id ?? null,
    internId: user.internProfile?.id ?? null,
  };
}

/** Use at the top of every API handler. Throws HttpError(401|403). */
export async function requireRole(...roles: Role[]): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new HttpError(401, "Not authenticated");
  if (actor.mustChangePassword) throw new HttpError(403, "Password change required");
  if (roles.length && actor.role !== "ADMIN" && !roles.includes(actor.role)) {
    throw new HttpError(403, "Forbidden");
  }
  return actor;
}

/** Strict variant: Admin is NOT implicitly allowed (e.g. intern-only or HR-only decisions). */
export async function requireExactRole(...roles: Role[]): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new HttpError(401, "Not authenticated");
  if (actor.mustChangePassword) throw new HttpError(403, "Password change required");
  if (!roles.includes(actor.role)) throw new HttpError(403, "Forbidden");
  return actor;
}

/** Mentor ids whose interns this actor may see: own, plus admin-granted owners. */
export async function visibleMentorIds(actor: Actor): Promise<string[] | "ALL"> {
  if (actor.role === "ADMIN" || actor.role === "HR") return "ALL";
  if (actor.role !== "MENTOR" || !actor.mentorId) return [];
  const grants = await prisma.mentorAccessGrant.findMany({
    where: { granteeId: actor.mentorId },
    select: { ownerId: true },
  });
  return [actor.mentorId, ...grants.map((g) => g.ownerId)];
}

/** Prisma `where` fragment restricting InternProfile rows to what the actor may see. */
export async function internScope(actor: Actor) {
  if (actor.role === "INTERN") return { id: actor.internId ?? "__none__" };
  const ids = await visibleMentorIds(actor);
  return ids === "ALL" ? {} : { mentorId: { in: ids } };
}

export function handleError(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
  }
  if (e && typeof e === "object" && "issues" in e) {
    return NextResponse.json({ error: "Validation failed", details: (e as { issues: unknown }).issues }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
