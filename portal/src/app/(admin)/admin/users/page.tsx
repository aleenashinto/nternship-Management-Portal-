import { requireExactRole } from "@/lib/rbac/guard";
import { listStaff } from "@/services/user";
import { StaffManager } from "./staff-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const actor = await requireExactRole("ADMIN");
  const rows = await listStaff(actor);
  return <StaffManager initial={JSON.parse(JSON.stringify(rows))} selfId={actor.userId} />;
}
