import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { readAuthorizedFile } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    const { id } = await params;
    const { file, bytes } = await readAuthorizedFile(actor, id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
