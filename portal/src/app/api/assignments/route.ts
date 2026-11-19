import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { createAssignmentSchema } from "@/lib/validation/projects";
import { assignProject, listAssignments } from "@/services/assignment";

export async function GET() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    return NextResponse.json(await listAssignments(actor));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireRole("MENTOR");
    const input = createAssignmentSchema.parse(await req.json());
    return NextResponse.json(await assignProject(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
