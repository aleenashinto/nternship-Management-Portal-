import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { decideCertificateRequest, decideCertificateSchema } from "@/services/certificate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("HR");
    const { id } = await params;
    const input = decideCertificateSchema.parse(await req.json());
    return NextResponse.json(await decideCertificateRequest(actor, id, input));
  } catch (e) {
    return handleError(e);
  }
}
