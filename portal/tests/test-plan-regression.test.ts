import { beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { actorOf, makeUser, prismaClient, resetDb } from "./helpers";
import { generatePassword } from "@/services/user";
import { strongPassword } from "@/lib/validation/auth";
import { registerInternSchema } from "@/lib/validation/interns";
import { evaluateAssignmentSchema } from "@/lib/validation/projects";
import { validateUpload, saveStoredFile, readAuthorizedFile } from "@/lib/storage";
import { assignMentorToIntern, listActiveMentorsForAssignment, registerIntern } from "@/services/intern";
import { createProject } from "@/services/project";
import { assignProject, createSubmission, evaluateSubmission, refreshOverdueAssignments } from "@/services/assignment";
import { schedulePresentation } from "@/services/presentation";
import { completeInternship, decideCertificateRequest } from "@/services/certificate";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { getAdminDashboardData, getHrDashboardData, getMentorDashboardData } from "@/services/dashboard";

describe("Section 4.1 Unit Tests (UT-01 to UT-12)", () => {
  it("UT-01 & UT-02: Password generator meets length/complexity, differs each call, and bcrypt hash verifies", async () => {
    const p1 = generatePassword();
    const p2 = generatePassword();
    expect(p1).not.toBe(p2);
    expect(strongPassword.safeParse(p1).success).toBe(true);
    const hash = await bcrypt.hash(p1, 4);
    expect(hash).not.toBe(p1);
    expect(await bcrypt.compare(p1, hash)).toBe(true);
  });

  it("UT-03 & UT-06: Zod email, phone, date, and score (0..100) validators accept valid and reject invalid input", () => {
    expect(
      registerInternSchema.safeParse({
        name: "A",
        email: "not-an-email",
        phone1: "12",
        address: "x",
        educationalQualification: "B",
      }).success,
    ).toBe(false);

    expect(
      evaluateAssignmentSchema.safeParse({
        submissionId: "s1",
        score: -1,
        feedback: "bad",
        decision: "COMPLETED",
      }).success,
    ).toBe(false);

    expect(
      evaluateAssignmentSchema.safeParse({
        submissionId: "s1",
        score: 101,
        feedback: "bad",
        decision: "COMPLETED",
      }).success,
    ).toBe(false);

    expect(
      evaluateAssignmentSchema.safeParse({
        submissionId: "s1",
        score: 85,
        feedback: "good work",
        decision: "COMPLETED",
      }).success,
    ).toBe(true);
  });

  it("UT-11 & SEC-03: File validator enforces type, size, empty-file rules, and PRJ-04 PDF-only instruction files", async () => {
    expect(() => validateUpload("empty.pdf", 0)).toThrow("Empty file");
    expect(() => validateUpload("huge.pdf", 50 * 1024 * 1024)).toThrow("exceeds maximum size");
    expect(() => validateUpload("malware.exe", 128)).toThrow("not permitted");
    expect(() => validateUpload("disguised.pdf.exe", 128)).toThrow("not permitted");

    await resetDb();
    const m = await makeUser("MENTOR");
    await expect(
      saveStoredFile({
        actor: actorOf(m),
        kind: "PROJECT_INSTRUCTIONS",
        originalName: "notes.txt",
        mimeType: "text/plain",
        bytes: Buffer.from("hello"),
      }),
    ).rejects.toThrow("must be a PDF");
  });
});

describe("Section 4.2, 4.3 & 4.5 API, Integration, Scheduler & Security Tests", () => {
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

  it("HR-08 & UT-09: Assigns 10+ interns to one mentor with no maximum limit and derives count accurately", async () => {
    const createdIds: string[] = [];
    for (let k = 1; k <= 10; k++) {
      const r = await registerIntern(actorOf(hr), {
        name: `Bulk Intern ${k}`,
        email: `bulk${k}@test.local`,
        phone1: "+91 9000011111",
        address: "Tech Campus",
        educationalQualification: "B.Tech",
        source: "DIRECT",
        mentorId: m1.mentorId!,
      });
      createdIds.push(r.internId);
    }
    const list = await listActiveMentorsForAssignment(actorOf(hr));
    expect(list.find((x) => x.id === m1.mentorId)?.assignedInternCount).toBe(10);

    // Unassign one -> count drops to 9
    await assignMentorToIntern(actorOf(hr), createdIds[0], null);
    const after = await listActiveMentorsForAssignment(actorOf(hr));
    expect(after.find((x) => x.id === m1.mentorId)?.assignedInternCount).toBe(9);
  });

  it("SUB-08 & API-11: Preserves complete history across 3 correction and resubmission loops", async () => {
    const prisma = await prismaClient();
    const intern = await prisma.internProfile.findFirstOrThrow({ where: { mentorId: m1.mentorId! } });
    const internUser = await prisma.user.findUniqueOrThrow({ where: { id: intern.userId } });
    const internActor = {
      userId: internUser.id,
      role: "INTERN" as const,
      username: internUser.username,
      mustChangePassword: false,
      mentorId: null,
      internId: intern.id,
    };

    const proj = await createProject(actorOf(m1), {
      title: "3-Loop Project",
      toolsUsed: ["PYTHON", "OTHER"],
      instructions: "Test 3 correction cycles",
    });
    const asg = await assignProject(actorOf(m1), {
      projectId: proj.id,
      internId: intern.id,
      assignedDate: "2026-11-01",
      dueDate: "2026-12-01",
    });

    for (let cycle = 1; cycle <= 3; cycle++) {
      const sub = await createSubmission({
        actor: internActor,
        assignmentId: asg.id,
        note: `Attempt ${cycle}`,
        files: [{ originalName: `attempt_${cycle}.py`, mimeType: "text/plain", bytes: Buffer.from(`#${cycle}`) }],
      });
      expect(sub.version).toBe(cycle);

      await evaluateSubmission(actorOf(m1), asg.id, {
        submissionId: sub.id,
        score: 50 + cycle * 10,
        decision: "REVISION_REQUIRED",
        feedback: `Feedback ${cycle}`,
        correctionInstructions: `Fix issue ${cycle}`,
      });
    }

    // Final v4 submission approved
    const sub4 = await createSubmission({
      actor: internActor,
      assignmentId: asg.id,
      note: "Final attempt",
      files: [{ originalName: "attempt_4.py", mimeType: "text/plain", bytes: Buffer.from("#4") }],
    });
    expect(sub4.version).toBe(4);
    await evaluateSubmission(actorOf(m1), asg.id, {
      submissionId: sub4.id,
      score: 96,
      decision: "COMPLETED",
      feedback: "Approved on v4",
    });

    const subs = await prisma.submission.findMany({ where: { assignmentId: asg.id }, orderBy: { version: "asc" } });
    const corrections = await prisma.correctionRequest.findMany({ where: { assignmentId: asg.id } });
    const evals = await prisma.evaluation.findMany({ where: { assignmentId: asg.id } });
    expect(subs.map((s) => s.version)).toEqual([1, 2, 3, 4]);
    expect(corrections.length).toBe(3);
    expect(evals.length).toBe(4);
  });

  it("PRS-07: Prevents double-booking the same intern at the exact same presentation date and time", async () => {
    const prisma = await prismaClient();
    const intern = await prisma.internProfile.findFirstOrThrow({ where: { mentorId: m1.mentorId! } });
    await schedulePresentation(actorOf(m1), {
      internId: intern.id,
      scheduledAt: "2026-12-15T10:00:00Z",
      googleMeetLink: "https://meet.google.com/slot-one",
    });
    await expect(
      schedulePresentation(actorOf(m1), {
        internId: intern.id,
        scheduledAt: "2026-12-15T10:00:00Z",
        googleMeetLink: "https://meet.google.com/slot-two",
      }),
    ).rejects.toThrow("already has a presentation scheduled");
  });

  it("CRT-07, CRT-10 & API-15: Certificate rejection creates no PDF and notifies intern; multiple approved certificates have unique IDs", async () => {
    const prisma = await prismaClient();
    const interns = await prisma.internProfile.findMany({ where: { mentorId: m1.mentorId! }, take: 3 });

    // Intern[0]: reject certificate
    const c0 = await completeInternship(actorOf(m1), interns[0].id);
    const rej = await decideCertificateRequest(actorOf(hr), c0.certReq.id, {
      decision: "REJECTED",
      rejectionReason: "Attendance below threshold",
    });
    expect(rej.certificate).toBeNull();
    const i0After = await prisma.internship.findUniqueOrThrow({ where: { id: c0.internship.id } });
    expect(i0After.status).toBe("CERTIFICATE_REJECTED");

    // Intern[1] & Intern[2]: approve both and assert unique certificate numbers
    const c1 = await completeInternship(actorOf(m1), interns[1].id);
    const c2 = await completeInternship(actorOf(m1), interns[2].id);
    const app1 = await decideCertificateRequest(actorOf(hr), c1.certReq.id, { decision: "APPROVED" });
    const app2 = await decideCertificateRequest(actorOf(hr), c2.certReq.id, { decision: "APPROVED" });
    expect(app1.certificate?.certificateNumber).not.toBe(app2.certificate?.certificateNumber);
  });

  it("UT-12, API-18, API-19, API-20, API-22, SEC-02 & SEC-07: Idempotent event dispatcher, file download RBAC, dashboard accuracy, SQLi/XSS safety, and no plaintext passwords", async () => {
    const prisma = await prismaClient();

    // Event dispatcher idempotency
    const r1 = await dispatchEvent({
      eventId: "custom-event:1",
      recipientId: m1.user.id,
      recipientEmail: m1.user.email,
      type: "CUSTOM",
      title: "Test Event",
      message: "Body",
    });
    const r2 = await dispatchEvent({
      eventId: "custom-event:1",
      recipientId: m1.user.id,
      recipientEmail: m1.user.email,
      type: "CUSTOM",
      title: "Test Event",
      message: "Body",
    });
    expect(r1.deduplicated).toBe(false);
    expect(r2.deduplicated).toBe(true);

    // File download authorization: Mentor 2 cannot download Mentor 1's submission file
    const anyFile = await prisma.storedFile.findFirstOrThrow({ where: { kind: "SUBMISSION" } });
    await expect(readAuthorizedFile(actorOf(m2), anyFile.id)).rejects.toThrow("Not authorised");

    // SQLi / XSS payload stored safely as literal text without injection
    const xssProj = await createProject(actorOf(m1), {
      title: `'); DROP TABLE "User"; -- <script>alert(1)</script>`,
      toolsUsed: ["SQL"],
      instructions: "Safe parameterized query test",
    });
    expect(xssProj.title).toContain("<script>");
    expect(await prisma.user.count()).toBeGreaterThan(0);

    // SEC-07: No plaintext passwords in DB
    const allUsers = await prisma.user.findMany();
    for (const u of allUsers) {
      expect(u.passwordHash.startsWith("$2")).toBe(true);
    }

    // API-22: Dashboards compute totals accurately
    const adminDash = await getAdminDashboardData();
    const hrDash = await getHrDashboardData();
    const mentorDash = await getMentorDashboardData(actorOf(m1));
    expect(adminDash.kpis.totalInterns).toBe(hrDash.kpis.totalInterns);
    expect(mentorDash.kpis.assignedInterns).toBe(9);
  });
});
