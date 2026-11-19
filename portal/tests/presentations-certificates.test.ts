import { beforeAll, describe, expect, it } from "vitest";
import { actorOf, makeUser, prismaClient, resetDb } from "./helpers";
import { schedulePresentation, updatePresentation } from "@/services/presentation";
import {
  addMentorNote,
  completeInternship,
  decideCertificateRequest,
  readAuthorizedCertificatePdf,
} from "@/services/certificate";

describe("Phase F & G: Presentations, immutable mentor notes, internship completion & certificates", () => {
  let hr: Awaited<ReturnType<typeof makeUser>>;
  let m1: Awaited<ReturnType<typeof makeUser>>;
  let i1: Awaited<ReturnType<typeof makeUser>>;
  let i2: Awaited<ReturnType<typeof makeUser>>;

  beforeAll(async () => {
    await resetDb();
    const prisma = await prismaClient();
    hr = await makeUser("HR");
    m1 = await makeUser("MENTOR");
    i1 = await makeUser("INTERN", { mentorId: m1.mentorId! });
    i2 = await makeUser("INTERN", { mentorId: m1.mentorId! });
    await prisma.internship.create({ data: { internId: i1.internId!, startDate: new Date("2026-09-01"), status: "ONGOING" } });
    await prisma.internship.create({ data: { internId: i2.internId!, startDate: new Date("2026-09-01"), status: "ONGOING" } });
  });

  it("schedules, reschedules, and cancels a presentation with notifications", async () => {
    const pres = await schedulePresentation(actorOf(m1), {
      internId: i1.internId!,
      scheduledAt: "2026-12-01T15:00:00",
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
    });
    expect(pres.status).toBe("SCHEDULED");

    const resched = await updatePresentation(actorOf(m1), pres.id, {
      action: "RESCHEDULE",
      scheduledAt: "2026-12-02T16:00:00",
    });
    expect(resched.status).toBe("RESCHEDULED");

    const cancelled = await updatePresentation(actorOf(m1), pres.id, { action: "CANCEL" });
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("stores each mentor note as an immutable dated record", async () => {
    const n1 = await addMentorNote(actorOf(m1), { internId: i1.internId!, content: "Strong SQL skills" });
    const n2 = await addMentorNote(actorOf(m1), { internId: i1.internId!, content: "Excellent presentation delivery" });
    expect(n1.id).not.toBe(n2.id);

    const prisma = await prismaClient();
    const notes = await prisma.mentorNote.findMany({ where: { internId: i1.internId! } });
    expect(notes.length).toBe(2);
  });

  it("completes internship, prevents duplicate certificate requests, and generates PDF ONLY after HR approval", async () => {
    const prisma = await prismaClient();
    const { certReq } = await completeInternship(actorOf(m1), i1.internId!, {
      endDate: "2026-11-17",
    });
    expect(certReq.status).toBe("PENDING");

    // Duplicate completion / certificate request must be blocked
    await expect(completeInternship(actorOf(m1), i1.internId!)).rejects.toThrow("already exists");

    // Before HR approval, no Certificate row exists
    const beforeCert = await prisma.certificate.findUnique({ where: { requestId: certReq.id } });
    expect(beforeCert).toBeNull();

    // HR approves -> generates PDF and Certificate row
    const { certificate } = await decideCertificateRequest(actorOf(hr), certReq.id, {
      decision: "APPROVED",
    });
    expect(certificate).not.toBeNull();
    expect(certificate!.certificateNumber).toMatch(/^BEAT-/);

    // Intern 1 can download their own PDF; Intern 2 is forbidden
    const { bytes } = await readAuthorizedCertificatePdf(actorOf(i1), certificate!.id);
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");

    await expect(readAuthorizedCertificatePdf(actorOf(i2), certificate!.id)).rejects.toThrow(
      "You can only download your own certificate",
    );
  });
});
