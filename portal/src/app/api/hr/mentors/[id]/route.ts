import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { updateStaffSchema } from "@/lib/validation/users";
import { deleteMentorByHr, updateMentorByHr } from "@/services/user";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("HR");
    const { id } = await params;
    const input = updateStaffSchema.parse(await req.json());
    await updateMentorByHr(actor, id, input);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("HR");
    const { id } = await params;
    await deleteMentorByHr(actor, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
