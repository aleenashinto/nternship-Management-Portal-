import { prisma } from "@/lib/db";
import { requireExactRole } from "@/lib/rbac/guard";
import { ActivityLogsClient } from "./activity-logs-client";

export const dynamic = "force-dynamic";

export default async function AdminActivityLogsPage() {
  await requireExactRole("ADMIN");
  const logs = await prisma.activityLog.findMany({
    include: { user: { select: { username: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  return <ActivityLogsClient initial={JSON.parse(JSON.stringify(logs))} />;
}
