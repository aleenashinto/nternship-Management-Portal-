import { requireRole } from "@/lib/rbac/guard";
import { listAssignments } from "@/services/assignment";
import { listInterns } from "@/services/intern";
import { listPresentations } from "@/services/presentation";
import { MentorPresentationsManager } from "./mentor-presentations-manager";

export const dynamic = "force-dynamic";

export default async function MentorPresentationsPage() {
  const actor = await requireRole("MENTOR");
  const [presentations, interns, assignments] = await Promise.all([
    listPresentations(actor),
    listInterns(actor),
    listAssignments(actor),
  ]);
  const ownInterns = actor.role === "ADMIN" ? interns : interns.filter((i) => i.mentorId === actor.mentorId);
  return (
    <MentorPresentationsManager
      initial={JSON.parse(JSON.stringify(presentations))}
      interns={JSON.parse(JSON.stringify(ownInterns))}
      assignments={JSON.parse(JSON.stringify(assignments))}
    />
  );
}
