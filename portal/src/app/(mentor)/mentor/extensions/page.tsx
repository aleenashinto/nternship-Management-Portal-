import { requireRole } from "@/lib/rbac/guard";
import { listExtensions } from "@/services/assignment";
import { MentorExtensionsManager } from "./mentor-extensions-manager";

export const dynamic = "force-dynamic";

export default async function MentorExtensionsPage() {
  const actor = await requireRole("MENTOR");
  const rows = await listExtensions(actor);
  return <MentorExtensionsManager initial={JSON.parse(JSON.stringify(rows))} />;
}
