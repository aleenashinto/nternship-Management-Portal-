import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { decideExtensionSchema } from "@/lib/validation/projects";
import { decideExtension } from "@/services/assignment";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("MENTOR");
    const { id } = await params;
    const input = decideExtensionSchema.parse(await req.json());
    return NextResponse.json(await decideExtension(actor, id, input));
  } catch (e) {
    return handleError(e);
  }
}
