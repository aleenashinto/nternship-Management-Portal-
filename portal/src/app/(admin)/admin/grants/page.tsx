import { requireExactRole } from "@/lib/rbac/guard";
import { listGrants } from "@/services/grant";
import { GrantsManager } from "./grants-manager";

export const dynamic = "force-dynamic";

export default async function AdminGrantsPage() {
  const actor = await requireExactRole("ADMIN");
  const data = await listGrants(actor);
  return <GrantsManager initial={JSON.parse(JSON.stringify(data))} />;
}
