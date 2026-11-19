import { beforeAll, describe, expect, it } from "vitest";
import { actorOf, makeUser, prismaClient, resetDb } from "./helpers";
import { assignMentorToIntern, listActiveMentorsForAssignment, registerIntern } from "@/services/intern";

describe("Phase C: HR intern registration, welcome email & mentor assignment", () => {
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

  it("blocks Admin and Mentor from registering interns (HR only)", async () => {
    await expect(
      registerIntern(actorOf(admin), {
        name: "Blocked Intern",
        email: "blocked@test.local",
        phone1: "1234567890",
        address: "123 Main St",
        educationalQualification: "B.Tech",
        source: "DIRECT",
      }),
    ).rejects.toThrow("Only HR Manager can register interns");

    await expect(
      registerIntern(actorOf(m1), {
        name: "Blocked Intern 2",
        email: "blocked2@test.local",
        phone1: "1234567890",
        address: "123 Main St",
        educationalQualification: "B.Tech",
        source: "DIRECT",
      }),
    ).rejects.toThrow("Only HR Manager can register interns");
  });

  it("registers an intern, sets mustChangePassword=true, creates Ongoing Internship, and dispatches welcome notification+email", async () => {
    const res = await registerIntern(actorOf(hr), {
      name: "Alice Intern",
      email: "alice@test.local",
      phone1: "+91 9876500001",
      phone2: "+91 9876500002",
      address: "42 Tech Park",
      educationalQualification: "M.Sc Data Science",
      source: "DIRECT",
      mentorId: m1.mentorId!,
    });

    expect(res.email).toBe("alice@test.local");
    expect(res.welcomeEmailDispatched).toBe(true);
    expect("tempPassword" in res).toBe(false);

    const prisma = await prismaClient();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: res.userId } });
    expect(user.username).toBe("alice@test.local");
    expect(user.mustChangePassword).toBe(true);

    const internship = await prisma.internship.findUniqueOrThrow({ where: { internId: res.internId } });
    expect(internship.status).toBe("ONGOING");

    const notif = await prisma.notification.findFirst({ where: { recipientId: res.userId, type: "INTERN_WELCOME" } });
    expect(notif).not.toBeNull();

    const emailLog = await prisma.emailLog.findFirst({ where: { recipient: "alice@test.local" } });
    expect(emailLog).not.toBeNull();
  });

  it("derives mentor assigned-intern count automatically and supports reassignment", async () => {
    const prisma = await prismaClient();
    const alice = await prisma.internProfile.findFirstOrThrow({ where: { email: "alice@test.local" } });

    let mentors = await listActiveMentorsForAssignment(actorOf(hr));
    expect(mentors.find((m) => m.id === m1.mentorId)?.assignedInternCount).toBe(1);
    expect(mentors.find((m) => m.id === m2.mentorId)?.assignedInternCount).toBe(0);

    await assignMentorToIntern(actorOf(hr), alice.id, m2.mentorId!);
    mentors = await listActiveMentorsForAssignment(actorOf(hr));
    expect(mentors.find((m) => m.id === m1.mentorId)?.assignedInternCount).toBe(0);
    expect(mentors.find((m) => m.id === m2.mentorId)?.assignedInternCount).toBe(1);
  });
});
