import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

const host = process.env.SMTP_HOST ?? "localhost";
const port = Number(process.env.SMTP_PORT ?? 1025);
const user = process.env.SMTP_USER ?? "";
const pass = process.env.SMTP_PASS ?? "";
const from = process.env.MAIL_FROM ?? "Beat Internship Portal <no-reply@beat.local>";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user ? { user, pass } : undefined,
  connectionTimeout: 2500,
});

export type DomainEventInput = {
  eventId: string;
  recipientId: string;
  recipientEmail: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  emailSubject?: string;
  emailHtml?: string;
  attachments?: { filename: string; content: Buffer }[];
};

/**
 * Single idempotent event dispatcher:
 * Creates both an in-portal Notification and sends/logs an Email from the same domain event.
 * Uses unique constraints (eventId, recipientId) and (eventId, recipient) so duplicate calls are no-ops.
 */
export async function dispatchEvent(ev: DomainEventInput) {
  await prisma.notification.upsert({
    where: { eventId_recipientId: { eventId: ev.eventId, recipientId: ev.recipientId } },
    update: {},
    create: {
      eventId: ev.eventId,
      recipientId: ev.recipientId,
      type: ev.type,
      title: ev.title,
      message: ev.message,
      link: ev.link ?? null,
    },
  });

  const existingEmail = await prisma.emailLog.findUnique({
    where: { eventId_recipient: { eventId: ev.eventId, recipient: ev.recipientEmail } },
  });
  if (existingEmail) return { deduplicated: true };

  const subject = ev.emailSubject ?? `[Beat Portal] ${ev.title}`;
  const html =
    ev.emailHtml ??
    `<div style="font-family:sans-serif;max-width:560px;padding:20px;border:1px solid #e8e4f6;border-radius:12px">
      <h2 style="color:#4b3a9b;margin-top:0">${ev.title}</h2>
      <p style="color:#1f1b2e;line-height:1.5">${ev.message.replace(/\n/g, "<br/>")}</p>
      ${ev.link ? `<p><a href="${process.env.APP_URL ?? "http://localhost:3000"}${ev.link}" style="color:#4b3a9b;font-weight:bold">Open in Beat Internship Portal</a></p>` : ""}
    </div>`;

  // In test mode or if SMTP is not reachable, fall back to console/logged transport without failing the domain action.
  if (process.env.NODE_ENV === "test") {
    await prisma.emailLog.create({
      data: { eventId: ev.eventId, recipient: ev.recipientEmail, subject, status: "LOGGED" },
    });
    return { deduplicated: false, status: "LOGGED" };
  }

  try {
    await transporter.sendMail({
      from,
      to: ev.recipientEmail,
      subject,
      html,
      attachments: ev.attachments,
    });
    await prisma.emailLog.create({
      data: { eventId: ev.eventId, recipient: ev.recipientEmail, subject, status: "SENT" },
    });
    return { deduplicated: false, status: "SENT" };
  } catch (err) {
    const msg = (err as Error).message;
    console.info(`[Mail Dev Fallback] To: ${ev.recipientEmail} | Subject: ${subject}\n${ev.message}`);
    await prisma.emailLog.create({
      data: { eventId: ev.eventId, recipient: ev.recipientEmail, subject, status: "LOGGED", error: msg },
    });
    return { deduplicated: false, status: "LOGGED" };
  }
}
