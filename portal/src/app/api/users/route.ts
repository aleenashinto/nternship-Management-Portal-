import { NextResponse } from "next/server";
import { handleError, requireExactRole } from "@/lib/rbac/guard";
import { createStaffSchema, listUsersQuery } from "@/lib/validation/users";
import { createStaff, listStaff } from "@/services/user";

export async function GET(req: Request) {
  try {
    const actor = await requireExactRole("ADMIN");
    const q = listUsersQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
    return NextResponse.json(await listStaff(actor, q.role));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireExactRole("ADMIN");
    const input = createStaffSchema.parse(await req.json());
    return NextResponse.json(await createStaff(actor, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
