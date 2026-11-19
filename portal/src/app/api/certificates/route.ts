import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { listCertificateRequests } from "@/services/certificate";

export async function GET() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    return NextResponse.json(await listCertificateRequests(actor));
  } catch (e) {
    return handleError(e);
  }
}
