import { NextResponse } from "next/server";
import { handleError, requireExactRole } from "@/lib/rbac/guard";
import { resetStaffPassword } from "@/services/user";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireExactRole("ADMIN");
    const { id } = await params;
    return NextResponse.json(await resetStaffPassword(actor, id));
  } catch (e) {
    return handleError(e);
  }
}
