import { NextResponse } from "next/server";
import { handleError, HttpError, requireRole } from "@/lib/rbac/guard";
import { createSubmission } from "@/services/assignment";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("INTERN");
    const { id } = await params;
    const fd = await req.formData();
    const note = String(fd.get("note") ?? "");
    const uploaded = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (uploaded.length === 0) throw new HttpError(400, "At least one submission file is required");

    const files = await Promise.all(
      uploaded.map(async (f) => ({
        originalName: f.name,
        mimeType: f.type,
        bytes: Buffer.from(await f.arrayBuffer()),
      })),
    );
    const sub = await createSubmission({ actor, assignmentId: id, note, files });
    return NextResponse.json(sub, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
