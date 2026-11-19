import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { updateInternSchema } from "@/lib/validation/interns";
import { deleteInternByHr, getInternDetail, updateInternByHr } from "@/services/intern";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    const { id } = await params;
    return NextResponse.json(await getInternDetail(actor, id));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("HR");
    const { id } = await params;
    const input = updateInternSchema.parse(await req.json());
    await updateInternByHr(actor, id, input);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("HR");
    const { id } = await params;
    await deleteInternByHr(actor, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
