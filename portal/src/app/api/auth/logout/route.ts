import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/auth/session";
import { getActor, handleError } from "@/lib/rbac/guard";
import { logActivity } from "@/lib/activity";

export async function POST() {
  try {
    const actor = await getActor();
    if (actor) await logActivity(actor.userId, "LOGOUT", "User", actor.userId);
    await clearSessionCookies();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
