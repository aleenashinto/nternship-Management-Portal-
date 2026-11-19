import { requireRole } from "@/lib/rbac/guard";
import { listProjects } from "@/services/project";
import { MentorProjectsManager } from "./mentor-projects-manager";

export const dynamic = "force-dynamic";

export default async function MentorProjectsPage() {
  const actor = await requireRole("MENTOR");
  const projects = await listProjects(actor);
  return <MentorProjectsManager initial={JSON.parse(JSON.stringify(projects))} actorMentorId={actor.mentorId} isAdmin={actor.role === "ADMIN"} />;
}
