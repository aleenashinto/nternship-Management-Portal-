import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { readAuthorizedCertificatePdf } from "@/services/certificate";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    const { id } = await params;
    const { cert, bytes } = await readAuthorizedCertificatePdf(actor, id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cert.certificateNumber}.pdf"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
