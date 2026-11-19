import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { assignMentorSchema } from "@/lib/validation/interns";
import { assignMentorToIntern } from "@/services/intern";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("HR");
    const { id } = await params;
    const { mentorId } = assignMentorSchema.parse(await req.json());
    return NextResponse.json(await assignMentorToIntern(actor, id, mentorId));
  } catch (e) {
    return handleError(e);
  }
}
