import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { getInternDetail } from "@/services/intern";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    const { id } = await params;
    return NextResponse.json(await getInternDetail(actor, id));
  } catch (e) {
    return handleError(e);
  }
}
