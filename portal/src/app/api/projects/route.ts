import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { createProjectSchema } from "@/lib/validation/projects";
import { createProject, listProjects } from "@/services/project";

export async function GET() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    return NextResponse.json(await listProjects(actor));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireRole("MENTOR");
    const body = await req.json();
    const input = createProjectSchema.parse(body);
    return NextResponse.json(await createProject(actor, input, body.mentorId), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
