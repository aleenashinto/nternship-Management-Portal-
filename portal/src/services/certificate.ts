import crypto from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { generateCertificatePdfBytes } from "@/lib/pdf/certificate";
import { HttpError, internScope, visibleMentorIds, type Actor } from "@/lib/rbac/guard";
import { storage } from "@/lib/storage";

export const createNoteSchema = z.object({
  internId: z.string().min(1),
  content: z.string().trim().min(2).max(2000),
});

export const completeInternshipSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const decideCertificateSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().trim().max(1000).optional(),
});

export const updateTemplateSchema = z.object({
  programTitle: z.string().trim().min(3).max(200),
  organisation: z.string().trim().min(2).max(160),
  bodyText: z.string().trim().min(5).max(300),
  signatoryName: z.string().trim().min(2).max(120),
  signatoryTitle: z.string().trim().min(2).max(120),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

/**
 * Adds an immutable, dated MentorNote record (never overwrites previous notes).
 */
export async function addMentorNote(actor: Actor, input: z.infer<typeof createNoteSchema>) {
  if (actor.role !== "MENTOR" || !actor.mentorId) {
    throw new HttpError(403, "Only a Mentor can add dated mentor notes");
  }
  const intern = await prisma.internProfile.findUnique({ where: { id: input.internId } });
  if (!intern) throw new HttpError(404, "Intern not found");
  if (intern.mentorId !== actor.mentorId) {
    throw new HttpError(403, "Mentors may add notes only for their own assigned interns");
  }

  const note = await prisma.mentorNote.create({
    data: {
      internId: intern.id,
      mentorId: actor.mentorId,
      content: input.content,
    },
    include: { mentor: { select: { name: true } } },
  });
  await logActivity(actor.userId, "MENTOR_NOTE_ADDED", "MentorNote", note.id, { internId: intern.id });
  return note;
}

/**
 * Mentor marks an internship completed:
 * - Records startDate, endDate, completionDate, completedByMentorId
 * - Automatically creates ONE CertificateRequest (enforced by unique constraint on internshipId)
 * - Notifies all active HR Managers via the unified event dispatcher
 */
export async function completeInternship(
  actor: Actor,
  internId: string,
  input: z.infer<typeof completeInternshipSchema> = {},
) {
  if (actor.role !== "MENTOR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only a Mentor or Admin can mark an internship completed");
  }

  const intern = await prisma.internProfile.findUnique({
    where: { id: internId },
    include: { internship: { include: { certificateRequest: true } }, user: true },
  });
  if (!intern) throw new HttpError(404, "Intern not found");
  if (actor.role === "MENTOR" && intern.mentorId !== actor.mentorId) {
    throw new HttpError(403, "Mentors may complete internships only for their own interns");
  }

  if (intern.internship?.certificateRequest) {
    throw new HttpError(409, "Internship is already completed and a certificate request already exists");
  }

  const now = new Date();
  const startDate = input.startDate ? new Date(input.startDate) : intern.internship?.startDate ?? now;
  const endDate = input.endDate ? new Date(input.endDate) : now;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.upsert({
        where: { internId: intern.id },
        update: {
          startDate,
          endDate,
          completionDate: now,
          completedByMentorId: actor.mentorId,
          status: "CERTIFICATE_PENDING",
        },
        create: {
          internId: intern.id,
          startDate,
          endDate,
          completionDate: now,
          completedByMentorId: actor.mentorId,
          status: "CERTIFICATE_PENDING",
        },
      });

      const certReq = await tx.certificateRequest.create({
        data: {
          internshipId: internship.id,
          status: "PENDING",
        },
      });

      await logActivity(actor.userId, "INTERNSHIP_COMPLETED", "Internship", internship.id, {
        internId: intern.id,
        certificateRequestId: certReq.id,
      }, tx);

      return { internship, certReq };
    });

    const hrUsers = await prisma.user.findMany({ where: { role: "HR", isActive: true } });
    for (const hr of hrUsers) {
      await dispatchEvent({
        eventId: `cert-request:${result.certReq.id}`,
        recipientId: hr.id,
        recipientEmail: hr.email,
        type: "CERTIFICATE_REQUEST_GENERATED",
        title: `Certificate Approval Pending: ${intern.name}`,
        message: `${intern.name}'s internship has been marked completed by their mentor. A certificate request is awaiting HR review.`,
        link: "/hr/certificates",
      });
    }

    return result;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Duplicate certificate request is not allowed");
    }
    throw e;
  }
}

/**
 * HR Manager reviews and approves or rejects a CertificateRequest.
 * ONLY after HR approval is the Certificate record + PDF generated and emailed to the intern.
 */
export async function decideCertificateRequest(
  actor: Actor,
  requestId: string,
  input: z.infer<typeof decideCertificateSchema>,
) {
  if (actor.role !== "HR" && actor.role !== "ADMIN") {
    throw new HttpError(403, "Only HR Manager or Admin can approve or reject certificates");
  }

  const reqRow = await prisma.certificateRequest.findUnique({
    where: { id: requestId },
    include: {
      certificate: true,
      internship: { include: { intern: { include: { user: true } } } },
    },
  });
  if (!reqRow) throw new HttpError(404, "Certificate request not found");
  if (reqRow.status !== "PENDING") throw new HttpError(400, "Certificate request has already been decided");

  const intern = reqRow.internship.intern;
  const now = new Date();

  if (input.decision === "REJECTED") {
    const reason = input.rejectionReason || "Incomplete internship requirements";
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.certificateRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", decidedById: actor.userId, decidedAt: now, rejectionReason: reason },
      });
      await tx.internship.update({
        where: { id: reqRow.internshipId },
        data: { status: "CERTIFICATE_REJECTED" },
      });
      await logActivity(actor.userId, "CERTIFICATE_REJECTED", "CertificateRequest", requestId, { reason }, tx);
      return r;
    });

    await dispatchEvent({
      eventId: `cert-rejected:${requestId}`,
      recipientId: intern.user.id,
      recipientEmail: intern.user.email,
      type: "CERTIFICATE_REJECTED",
      title: "Certificate Request Rejected",
      message: `Your internship certificate request was rejected by HR.\nReason: ${reason}`,
      link: "/intern/certificate",
    });

    return { request: updated, certificate: null };
  }

  // APPROVED path -> generate PDF from Admin-configurable template
  const template = await getOrCreateTemplate();
  const certNum = `BEAT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

  const pdfBytes = await generateCertificatePdfBytes({
    internName: intern.name,
    programTitle: template.programTitle,
    organisation: template.organisation,
    bodyText: template.bodyText,
    startDate: reqRow.internship.startDate,
    endDate: reqRow.internship.endDate ?? now,
    issueDate: now,
    certificateNumber: certNum,
    signatoryName: template.signatoryName,
    signatoryTitle: template.signatoryTitle,
    accentColor: template.accentColor,
  });

  const relPath = `certificates/${certNum}.pdf`;
  await storage.put(relPath, pdfBytes);

  const { updatedReq, certificate } = await prisma.$transaction(async (tx) => {
    const r = await tx.certificateRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", decidedById: actor.userId, decidedAt: now },
    });
    await tx.internship.update({
      where: { id: reqRow.internshipId },
      data: { status: "CERTIFICATE_APPROVED" },
    });
    const cert = await tx.certificate.create({
      data: {
        requestId,
        certificateNumber: certNum,
        pdfPath: relPath,
        issueDate: now,
      },
    });
    await logActivity(actor.userId, "CERTIFICATE_APPROVED", "Certificate", cert.id, {
      certificateNumber: certNum,
      internId: intern.id,
    }, tx);
    return { updatedReq: r, certificate: cert };
  });

  await dispatchEvent({
    eventId: `cert-approved:${certificate.id}`,
    recipientId: intern.user.id,
    recipientEmail: intern.user.email,
    type: "CERTIFICATE_APPROVED",
    title: "Your Internship Certificate is Ready!",
    message: `Congratulations ${intern.name}! Your internship completion certificate (${certNum}) has been approved and issued. You can download it from the portal or the attached PDF.`,
    link: "/intern/certificate",
    attachments: [{ filename: `${certNum}.pdf`, content: pdfBytes }],
  });

  return { request: updatedReq, certificate };
}

export async function listCertificateRequests(actor: Actor) {
  const scope = await internScope(actor);
  return prisma.certificateRequest.findMany({
    where: { internship: { intern: scope } },
    include: {
      certificate: true,
      internship: {
        include: {
          intern: {
            include: {
              mentor: { select: { id: true, name: true } },
              _count: { select: { assignments: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function readAuthorizedCertificatePdf(actor: Actor, certificateId: string) {
  const cert = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { request: { include: { internship: { include: { intern: true } } } } },
  });
  if (!cert) throw new HttpError(404, "Certificate not found");

  const intern = cert.request.internship.intern;
  if (actor.role === "INTERN" && intern.id !== actor.internId) {
    throw new HttpError(403, "You can only download your own certificate");
  }
  if (actor.role === "MENTOR") {
    const visible = await visibleMentorIds(actor);
    if (visible !== "ALL" && (!intern.mentorId || !visible.includes(intern.mentorId))) {
      throw new HttpError(403, "Forbidden");
    }
  }

  const bytes = await storage.get(cert.pdfPath);
  return { cert, bytes };
}

export async function getOrCreateTemplate() {
  return prisma.certificateTemplate.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export async function updateTemplate(actor: Actor, input: z.infer<typeof updateTemplateSchema>) {
  if (actor.role !== "ADMIN") throw new HttpError(403, "Only Admin can configure the certificate template");
  const updated = await prisma.certificateTemplate.upsert({
    where: { id: "default" },
    update: input,
    create: { id: "default", ...input },
  });
  await logActivity(actor.userId, "CERTIFICATE_TEMPLATE_UPDATED", "CertificateTemplate", "default");
  return updated;
}
