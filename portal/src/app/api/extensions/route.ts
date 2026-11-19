import { NextResponse } from "next/server";
import { handleError, requireRole } from "@/lib/rbac/guard";
import { createExtensionSchema, decideExtensionSchema } from "@/lib/validation/projects";
import { decideExtension, listExtensions, requestExtension } from "@/services/assignment";

export async function GET() {
  try {
    const actor = await requireRole("ADMIN", "HR", "MENTOR", "INTERN");
    return NextResponse.json(await listExtensions(actor));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireRole("INTERN");
    const input = createExtensionSchema.parse(await req.json());
    return NextResponse.json(await requestExtension(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await requireRole("MENTOR");
    const body = await req.json();
    const input = decideExtensionSchema.parse(body);
    return NextResponse.json(await decideExtension(actor, String(body.id), input));
  } catch (e) {
    return handleError(e);
  }
}
