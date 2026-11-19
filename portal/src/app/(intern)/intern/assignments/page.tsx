import { requireRole } from "@/lib/rbac/guard";
import { listAssignments } from "@/services/assignment";
import { InternAssignmentsView } from "./intern-assignments-view";

export const dynamic = "force-dynamic";

export default async function InternAssignmentsPage() {
  const actor = await requireRole("INTERN");
  const assignments = await listAssignments(actor);
  return <InternAssignmentsView initial={JSON.parse(JSON.stringify(assignments))} />;
}
