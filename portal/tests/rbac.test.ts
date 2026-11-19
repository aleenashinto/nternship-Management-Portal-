import { beforeAll, describe, expect, it } from "vitest";
import { actorOf, makeUser, prismaClient, resetDb } from "./helpers";
import { internScope, visibleMentorIds } from "@/lib/rbac/guard";
import { signSession, verifySession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

describe("RBAC isolation", () => {
  let m1: Awaited<ReturnType<typeof makeUser>>, m2: Awaited<ReturnType<typeof makeUser>>;
  let i1: Awaited<ReturnType<typeof makeUser>>, i2: Awaited<ReturnType<typeof makeUser>>, i3: Awaited<ReturnType<typeof makeUser>>;

  beforeAll(async () => {
    await resetDb();
    m1 = await makeUser("MENTOR");
    m2 = await makeUser("MENTOR");
    i1 = await makeUser("INTERN", { mentorId: m1.mentorId! });
    i2 = await makeUser("INTERN", { mentorId: m1.mentorId! });
    i3 = await makeUser("INTERN", { mentorId: m2.mentorId! });
  });

  it("mentor only sees own interns", async () => {
    const prisma = await prismaClient();
    const rows = await prisma.internProfile.findMany({ where: await internScope(actorOf(m1)) });
    expect(rows.map((r) => r.id).sort()).toEqual([i1.internId, i2.internId].sort());
    expect(rows.find((r) => r.id === i3.internId)).toBeUndefined();
  });

  it("intern only sees themself", async () => {
    const prisma = await prismaClient();
    const rows = await prisma.internProfile.findMany({ where: await internScope(actorOf(i1)) });
    expect(rows.map((r) => r.id)).toEqual([i1.internId]);
  });

  it("admin and HR see all interns", async () => {
    const prisma = await prismaClient();
    const admin = await makeUser("ADMIN");
    const hr = await makeUser("HR");
    for (const a of [admin, hr]) {
      expect(await prisma.internProfile.count({ where: await internScope(actorOf(a)) })).toBe(3);
    }
  });

  it("admin-granted access lets mentor 2 see mentor 1's interns, and only those", async () => {
    const prisma = await prismaClient();
    await prisma.mentorAccessGrant.create({ data: { ownerId: m1.mentorId!, granteeId: m2.mentorId!, createdBy: "admin" } });
    expect((await visibleMentorIds(actorOf(m2))) as string[]).toEqual(expect.arrayContaining([m1.mentorId!, m2.mentorId!]));
    // grant is directional: mentor 1 does not gain access to mentor 2
    expect(await visibleMentorIds(actorOf(m1))).toEqual([m1.mentorId]);
  });
});

describe("session and rate limit", () => {
  it("rejects tampered tokens", async () => {
    const t = await signSession({ sub: "u1", role: "ADMIN", mcp: false });
    expect((await verifySession(t))?.role).toBe("ADMIN");
    expect(await verifySession(t.slice(0, -2) + "xx")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });

  it("blocks after 5 attempts", () => {
    const k = `t:${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(rateLimit(k, 5, 60000).ok).toBe(true);
    expect(rateLimit(k, 5, 60000).ok).toBe(false);
  });
});
