import { NextResponse } from "next/server";
import { handleError, requireExactRole, requireRole } from "@/lib/rbac/guard";
import { registerInternSchema } from "@/lib/validation/interns";
import { listInterns, registerIntern } from "@/services/intern";

export async function GET() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    return NextResponse.json(await listInterns(actor));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    // Only HR Manager can register interns (Admin cannot create interns per Section 3).
    const actor = await requireExactRole("HR");
    const input = registerInternSchema.parse(await req.json());
    return NextResponse.json(await registerIntern(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
