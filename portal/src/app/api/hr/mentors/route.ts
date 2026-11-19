import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { createMentorByHr, listMentorsForHr } from "@/services/user";

const createMentorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(5).max(30),
  workStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  workEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export async function GET() {
  try {
    const actor = await requireRole("HR");
    return NextResponse.json(await listMentorsForHr(actor));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireRole("HR");
    const input = createMentorSchema.parse(await req.json());
    return NextResponse.json(await createMentorByHr(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
