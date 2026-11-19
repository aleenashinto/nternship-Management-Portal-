import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "ipm_session";
export const CSRF_COOKIE = "ipm_csrf";
const MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionPayload = { sub: string; role: Role; mcp: boolean };

const DEFAULT_SECRET = "beat-internship-portal-vercel-default-session-secret-2026";

function secret() {
  const s = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
    ? process.env.SESSION_SECRET
    : DEFAULT_SECRET;
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload) {
  return new SignJWT({ role: p.role, mcp: p.mcp })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { sub: String(payload.sub), role: payload.role as Role, mcp: Boolean(payload.mcp) };
  } catch {
    return null;
  }
}

export async function setSessionCookies(p: SessionPayload) {
  const jar = await cookies();
  const secure = Boolean(process.env.VERCEL) || (process.env.APP_URL ?? "").startsWith("https://");
  jar.set(SESSION_COOKIE, await signSession(p), {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: MAX_AGE_SECONDS,
  });
  // Double-submit CSRF token: readable by JS, echoed in x-csrf-token header.
  jar.set(CSRF_COOKIE, crypto.randomUUID(), {
    httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}
