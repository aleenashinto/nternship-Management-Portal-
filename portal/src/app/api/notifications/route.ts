import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, requireRole } from "@/lib/rbac/guard";

export async function GET() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    const rows = await prisma.notification.findMany({
      where: { recipientId: actor.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(rows);
  } catch (e) {
    return handleError(e);
  }
}
