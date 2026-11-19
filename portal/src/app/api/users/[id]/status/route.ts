import { NextResponse } from "next/server";
import { handleError, requireExactRole } from "@/lib/rbac/guard";
import { statusSchema } from "@/lib/validation/users";
import { setStaffActive } from "@/services/user";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireExactRole("ADMIN");
    const { id } = await params;
    const { isActive } = statusSchema.parse(await req.json());
    await setStaffActive(actor, id, isActive);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
