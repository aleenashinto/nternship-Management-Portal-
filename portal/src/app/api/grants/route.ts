import { NextResponse } from "next/server";
import { handleError, requireExactRole } from "@/lib/rbac/guard";
import { createGrant, createGrantSchema, deleteGrantSchema, listGrants, revokeGrant } from "@/services/grant";

export async function GET() {
  try {
    const actor = await requireExactRole("ADMIN");
    return NextResponse.json(await listGrants(actor));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireExactRole("ADMIN");
    const input = createGrantSchema.parse(await req.json());
    return NextResponse.json(await createGrant(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const actor = await requireExactRole("ADMIN");
    const { id } = deleteGrantSchema.parse(await req.json());
    await revokeGrant(actor, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
