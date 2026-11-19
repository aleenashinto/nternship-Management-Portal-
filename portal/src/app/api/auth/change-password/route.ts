import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getActor, handleError, HttpError } from "@/lib/rbac/guard";
import { changePasswordSchema } from "@/lib/validation/auth";
import { setSessionCookies } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  try {
    // Intentionally uses getActor (not requireRole): this endpoint must work while mustChangePassword is set.
    const actor = await getActor();
    if (!actor) throw new HttpError(401, "Not authenticated");
    const { currentPassword, newPassword } = changePasswordSchema.parse(await req.json());

    const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new HttpError(400, "Current password is incorrect");
    if (currentPassword === newPassword) throw new HttpError(400, "New password must differ from the current one");

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12), mustChangePassword: false },
    });
    await setSessionCookies({ sub: user.id, role: user.role, mcp: false });
    await logActivity(user.id, "PASSWORD_CHANGED", "User", user.id);
    return NextResponse.json({ role: user.role });
  } catch (e) {
    return handleError(e);
  }
}
