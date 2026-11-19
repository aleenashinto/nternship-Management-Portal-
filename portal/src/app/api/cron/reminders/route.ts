import { NextResponse } from "next/server";
import { handleError, HttpError, getActor } from "@/lib/rbac/guard";
import { runDailyDeadlineReminders } from "@/lib/cron/reminders";

async function handleCron(req: Request) {
  try {
    const secretHeader = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("authorization");
    const expected = process.env.CRON_SECRET ?? "change-me-cron-secret";
    const actor = await getActor();

    const validSecret = secretHeader === expected || authHeader === `Bearer ${expected}`;
    if (!validSecret && actor?.role !== "ADMIN") {
      throw new HttpError(403, "Valid x-cron-secret / Bearer CRON_SECRET header or Admin session required");
    }

    const result = await runDailyDeadlineReminders();
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}
