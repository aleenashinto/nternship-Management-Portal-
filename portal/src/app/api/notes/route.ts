import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { addMentorNote, createNoteSchema } from "@/services/certificate";

export async function POST(req: Request) {
  try {
    const actor = await requireRole("MENTOR");
    const input = createNoteSchema.parse(await req.json());
    return NextResponse.json(await addMentorNote(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
