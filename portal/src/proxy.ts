import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE, SESSION_COOKIE, verifySession } from "@/lib/auth/session";

const PUBLIC_PAGES = ["/login"];
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin", HR: "/hr", MENTOR: "/mentor", INTERN: "/intern",
};
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXEMPT_API = ["/api/auth/login", "/api/cron/reminders"]; // login has no token yet; cron uses a secret

function json(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    // CSRF: same-origin check on every mutating request ...
    if (MUTATING.has(req.method)) {
      const origin = req.headers.get("origin");
      if (origin && new URL(origin).host !== req.nextUrl.host) return json(403, "Cross-origin request blocked");
      // ... plus double-submit token for authenticated calls.
      if (!CSRF_EXEMPT_API.includes(pathname)) {
        const header = req.headers.get("x-csrf-token");
        const cookie = req.cookies.get(CSRF_COOKIE)?.value;
        if (!header || !cookie || header !== cookie) return json(403, "Invalid CSRF token");
      }
    }
    const open = pathname === "/api/auth/login" || pathname === "/api/cron/reminders";
    if (!open && !session) return json(401, "Not authenticated");
    return NextResponse.next();
  }

  // Pages
  if (PUBLIC_PAGES.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL(session.mcp ? "/change-password" : ROLE_HOME[session.role], req.url));
    }
    return NextResponse.next();
  }
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  // Forced password change on first login
  if (session.mcp && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }
  if (!session.mcp && pathname === "/change-password") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }
  if (pathname === "/") return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));

  // Role gate on page areas (Admin may enter every area). Handlers re-check independently.
  const area = Object.entries(ROLE_HOME).find(([, base]) => pathname === base || pathname.startsWith(base + "/"));
  if (area && session.role !== "ADMIN" && area[0] !== session.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|beat-logo.png).*)"],
};
