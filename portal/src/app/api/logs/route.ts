import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, requireExactRole } from "@/lib/rbac/guard";

export async function GET(req: Request) {
  try {
    await requireExactRole("ADMIN");
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? undefined;
    const entityType = url.searchParams.get("entityType") ?? undefined;

    const logs = await prisma.activityLog.findMany({
      where: {
        ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
        ...(entityType ? { entityType } : {}),
      },
      include: { user: { select: { username: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(logs);
  } catch (e) {
    return handleError(e);
  }
}
