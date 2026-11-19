import { NextResponse } from "next/server";
import { getActor, handleError, HttpError } from "@/lib/rbac/guard";

export async function GET() {
  try {
    const actor = await getActor();
    if (!actor) throw new HttpError(401, "Not authenticated");
    return NextResponse.json(actor);
  } catch (e) {
    return handleError(e);
  }
}
