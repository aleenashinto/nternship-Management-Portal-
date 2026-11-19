import { beforeAll, describe, expect, it } from "vitest";
import { actorOf, makeUser, prismaClient, resetDb } from "./helpers";
import { createStaff, listStaff, resetStaffPassword, setStaffActive, updateStaff } from "@/services/user";
import { createGrant, listGrants, revokeGrant } from "@/services/grant";
import { createStaffSchema } from "@/lib/validation/users";

describe("Phase B: Admin staff management & cross-mentor grants", () => {
  let admin: Awaited<ReturnType<typeof makeUser>>;
  let hr: Awaited<ReturnType<typeof makeUser>>;
  let m1: Awaited<ReturnType<typeof makeUser>>;
  let m2: Awaited<ReturnType<typeof makeUser>>;

  beforeAll(async () => {
    await resetDb();
    admin = await makeUser("ADMIN");
    hr = await makeUser("HR");
    m1 = await makeUser("MENTOR");
    m2 = await makeUser("MENTOR");
  });

  it("rejects non-Admin from listing or creating staff", async () => {
    await expect(listStaff(actorOf(hr))).rejects.toThrow("Only Admin");
    await expect(
      createStaff(actorOf(hr), { role: "HR", name: "Unauthorized HR", email: "unauth@test.local" }),
    ).rejects.toThrow("Only Admin");
  });

  it("prevents Admin schema from accepting INTERN role", () => {
    const res = createStaffSchema.safeParse({ role: "INTERN", name: "Intern", email: "i@test.local" });
    expect(res.success).toBe(false);
  });

  it("allows Admin to create, update, deactivate, activate, and reset password of HR and Mentor accounts", async () => {
    const createdHr = await createStaff(actorOf(admin), {
      role: "HR",
      name: "New HR Manager",
      email: "newhr@test.local",
    });
    expect(createdHr.tempPassword.length).toBeGreaterThanOrEqual(10);

    const createdMentor = await createStaff(actorOf(admin), {
      role: "MENTOR",
      name: "New Mentor",
      email: "newmentor@test.local",
      phone: "+91 9876543210",
      workStartTime: "09:30",
      workEndTime: "18:00",
    });

    await updateStaff(actorOf(admin), createdMentor.id, {
      name: "Updated Mentor",
      workEndTime: "18:30",
    });

    const staff = await listStaff(actorOf(admin));
    const found = staff.find((s) => s.id === createdMentor.id);
    expect(found?.name).toBe("Updated Mentor");
    expect(found?.workEndTime).toBe("18:30");
    expect(found?.assignedInterns).toBe(0);

    await setStaffActive(actorOf(admin), createdMentor.id, false);
    const prisma = await prismaClient();
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: createdMentor.id } });
    expect(dbUser.isActive).toBe(false);

    await setStaffActive(actorOf(admin), createdMentor.id, true);
    const reset = await resetStaffPassword(actorOf(admin), createdMentor.id);
    expect(reset.tempPassword.length).toBeGreaterThanOrEqual(10);
  });

  it("allows Admin to create and revoke cross-mentor access grants", async () => {
    const grant = await createGrant(actorOf(admin), { ownerId: m1.mentorId!, granteeId: m2.mentorId! });
    const listed = await listGrants(actorOf(admin));
    expect(listed.grants.some((g) => g.id === grant.id)).toBe(true);

    // Duplicate should throw 409
    await expect(
      createGrant(actorOf(admin), { ownerId: m1.mentorId!, granteeId: m2.mentorId! }),
    ).rejects.toThrow("already exists");

    await revokeGrant(actorOf(admin), grant.id);
    const after = await listGrants(actorOf(admin));
    expect(after.grants.some((g) => g.id === grant.id)).toBe(false);
  });
});
