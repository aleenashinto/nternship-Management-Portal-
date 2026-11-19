import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { updatePresentation, updatePresentationSchema } from "@/services/presentation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("MENTOR");
    const { id } = await params;
    const input = updatePresentationSchema.parse(await req.json());
    return NextResponse.json(await updatePresentation(actor, id, input));
  } catch (e) {
    return handleError(e);
  }
}
