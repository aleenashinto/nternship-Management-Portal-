import { NextResponse } from "next/server";
import type { FileKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { handleError, HttpError, requireRole } from "@/lib/rbac/guard";
import { saveStoredFile } from "@/lib/storage";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("MENTOR");
    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new HttpError(404, "Project not found");
    if (actor.role !== "ADMIN" && project.createdByMentorId !== actor.mentorId) {
      throw new HttpError(403, "Mentors may upload files only to their own projects");
    }

    const fd = await req.formData();
    const file = fd.get("file");
    const kindRaw = String(fd.get("kind") ?? "PROJECT_DATA");
    const kind: FileKind = kindRaw === "PROJECT_INSTRUCTIONS" ? "PROJECT_INSTRUCTIONS" : "PROJECT_DATA";

    if (!(file instanceof File)) throw new HttpError(400, "No file uploaded");
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await saveStoredFile({
      actor,
      kind,
      originalName: file.name,
      mimeType: file.type,
      bytes,
      projectId: project.id,
    });
    return NextResponse.json(stored, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
