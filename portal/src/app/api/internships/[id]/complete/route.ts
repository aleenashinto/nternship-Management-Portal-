import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { completeInternship, completeInternshipSchema } from "@/services/certificate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("MENTOR");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const input = completeInternshipSchema.parse(body);
    return NextResponse.json(await completeInternship(actor, id, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
