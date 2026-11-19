import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, requireRole } from "@/lib/rbac/guard";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    const { id } = await params;
    await prisma.notification.updateMany({
      where: { id, recipientId: actor.userId },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
