import { requireRole } from "@/lib/rbac/guard";
import { listActiveMentorsForAssignment, listInterns } from "@/services/intern";
import { HRInternsManager } from "./hr-interns-manager";

export const dynamic = "force-dynamic";

export default async function HRInternsPage() {
  const actor = await requireRole("HR");
  const [interns, mentors] = await Promise.all([
    listInterns(actor),
    listActiveMentorsForAssignment(actor),
  ]);
  return (
    <HRInternsManager
      initialInterns={JSON.parse(JSON.stringify(interns))}
      mentors={JSON.parse(JSON.stringify(mentors))}
      canCreate={actor.role === "HR"}
    />
  );
}
