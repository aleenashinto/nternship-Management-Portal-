import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { createPresentationSchema, listPresentations, schedulePresentation } from "@/services/presentation";

export async function GET() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    return NextResponse.json(await listPresentations(actor));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireRole("MENTOR");
    const input = createPresentationSchema.parse(await req.json());
    return NextResponse.json(await schedulePresentation(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
