import "dotenv/config";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/portal_test?schema=public";
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-1234";

export async function prismaClient() {
  const { prisma } = await import("@/lib/db");
  return prisma;
}

export async function resetDb() {
  const prisma = await prismaClient();
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`,
  );
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

let n = 0;
export async function makeUser(role: Role, extra: { mentorId?: string } = {}) {
  const prisma = await prismaClient();
  n += 1;
  const email = `${role.toLowerCase()}${n}@test.local`;
  const user = await prisma.user.create({
    data: { role, username: email, email, passwordHash: await bcrypt.hash("Passw0rd!Test", 4) },
  });
  if (role === "MENTOR") {
    const m = await prisma.mentorProfile.create({
      data: { userId: user.id, name: `Mentor ${n}`, phone: "1", workStartTime: "09:00", workEndTime: "17:00" },
    });
    return { user, mentorId: m.id, internId: null as string | null };
  }
  if (role === "INTERN") {
    const i = await prisma.internProfile.create({
      data: {
        userId: user.id, name: `Intern ${n}`, phone1: "1", email, address: "x",
        educationalQualification: "BSc", mentorId: extra.mentorId ?? null,
      },
    });
    return { user, mentorId: null as string | null, internId: i.id };
  }
  return { user, mentorId: null as string | null, internId: null as string | null };
}

export function actorOf(u: { user: { id: string; role: Role; username: string }; mentorId: string | null; internId: string | null }) {
  return { userId: u.user.id, role: u.user.role, username: u.user.username, mustChangePassword: false, mentorId: u.mentorId, internId: u.internId };
}
