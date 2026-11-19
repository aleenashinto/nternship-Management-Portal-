import { requireRole } from "@/lib/rbac/guard";
import { listMentorsForHr } from "@/services/user";
import { HRMentorsManager } from "./hr-mentors-manager";

export const dynamic = "force-dynamic";

export default async function HRMentorsPage() {
  const actor = await requireRole("HR");
  const rows = await listMentorsForHr(actor);
  return <HRMentorsManager initial={JSON.parse(JSON.stringify(rows))} />;
}
