import { requireRole } from "@/lib/rbac/guard";
import { getInternDetail } from "@/services/intern";
import { MentorInternProfileClient } from "./mentor-intern-profile-client";

export const dynamic = "force-dynamic";

export default async function MentorInternDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("MENTOR");
  const { id } = await params;
  const intern = await getInternDetail(actor, id);
  const isOwnMentor = actor.role === "ADMIN" || intern.mentorId === actor.mentorId;
  return <MentorInternProfileClient intern={JSON.parse(JSON.stringify(intern))} isOwnMentor={isOwnMentor} />;
}
