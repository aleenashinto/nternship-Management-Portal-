import { NextResponse } from "next/server";
import { handleError, requireExactRole } from "@/lib/rbac/guard";
import { updateStaffSchema } from "@/lib/validation/users";
import { updateStaff } from "@/services/user";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireExactRole("ADMIN");
    const { id } = await params;
    await updateStaff(actor, id, updateStaffSchema.parse(await req.json()));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
