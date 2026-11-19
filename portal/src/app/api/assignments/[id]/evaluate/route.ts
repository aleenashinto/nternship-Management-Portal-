import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { evaluateAssignmentSchema } from "@/lib/validation/projects";
import { evaluateSubmission } from "@/services/assignment";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("MENTOR");
    const { id } = await params;
    const input = evaluateAssignmentSchema.parse(await req.json());
    return NextResponse.json(await evaluateSubmission(actor, id, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
