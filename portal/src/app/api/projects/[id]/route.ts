import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { updateProjectSchema } from "@/lib/validation/projects";
import { updateProject } from "@/services/project";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("MENTOR");
    const { id } = await params;
    const input = updateProjectSchema.parse(await req.json());
    return NextResponse.json(await updateProject(actor, id, input));
  } catch (e) {
    return handleError(e);
  }
}
