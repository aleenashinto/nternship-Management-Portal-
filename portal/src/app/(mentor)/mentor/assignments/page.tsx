import { requireRole } from "@/lib/rbac/guard";
import { listAssignments } from "@/services/assignment";
import { listInterns } from "@/services/intern";
import { listProjects } from "@/services/project";
import { MentorAssignmentsManager } from "./mentor-assignments-manager";

export const dynamic = "force-dynamic";

export default async function MentorAssignmentsPage() {
  const actor = await requireRole("MENTOR");
  const [assignments, projects, interns] = await Promise.all([
    listAssignments(actor),
    listProjects(actor),
    listInterns(actor),
  ]);
  const ownInterns = actor.role === "ADMIN" ? interns : interns.filter((i) => i.mentorId === actor.mentorId);
  return (
    <MentorAssignmentsManager
      initialAssignments={JSON.parse(JSON.stringify(assignments))}
      projects={JSON.parse(JSON.stringify(projects))}
      interns={JSON.parse(JSON.stringify(ownInterns))}
    />
  );
}
