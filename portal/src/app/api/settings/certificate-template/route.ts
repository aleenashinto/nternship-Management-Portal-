import { NextResponse } from "next/server";
import { handleError, requireExactRole } from "@/lib/rbac/guard";
import { getOrCreateTemplate, updateTemplate, updateTemplateSchema } from "@/services/certificate";

export async function GET() {
  try {
    await requireExactRole("ADMIN");
    return NextResponse.json(await getOrCreateTemplate());
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireExactRole("ADMIN");
    const input = updateTemplateSchema.parse(await req.json());
    return NextResponse.json(await updateTemplate(actor, input));
  } catch (e) {
    return handleError(e);
  }
}
