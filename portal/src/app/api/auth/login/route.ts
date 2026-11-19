import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handleError, HttpError } from "@/lib/rbac/guard";
import { loginSchema } from "@/lib/validation/auth";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { setSessionCookies } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";

// Pre-computed hash so unknown usernames cost the same as wrong passwords (timing safety).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function POST(req: Request) {
  try {
    const { username, password } = loginSchema.parse(await req.json());
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = `login:${ip}:${username.toLowerCase()}`;
    const rl = rateLimit(key, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }] },
    });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok || !user.isActive) {
      await logActivity(user?.id ?? null, "LOGIN_FAILED", "User", user?.id ?? null, { username });
      throw new HttpError(401, "Invalid credentials");
    }

    resetRateLimit(key);
    await setSessionCookies({ sub: user.id, role: user.role, mcp: user.mustChangePassword });
    await logActivity(user.id, "LOGIN", "User", user.id);
    return NextResponse.json({ role: user.role, mustChangePassword: user.mustChangePassword });
  } catch (e) {
    return handleError(e);
  }
}
