import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, requireRole } from "@/lib/rbac/guard";

export async function POST() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    await prisma.notification.updateMany({
      where: { recipientId: actor.userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
