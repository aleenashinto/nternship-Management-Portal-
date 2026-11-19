import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/rbac/guard";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationsClient } from "./notifications-client";

export const dynamic = "force-dynamic";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  HR: "/hr",
  MENTOR: "/mentor",
  INTERN: "/intern",
};

export default async function NotificationsPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  const rows = await prisma.notification.findMany({
    where: { recipientId: actor.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AppShell
      title={`${actor.role} Notifications`}
      nav={[{ href: ROLE_HOME[actor.role], label: "← Back to Dashboard" }, { href: "/notifications", label: "Notification Centre" }]}
    >
      <NotificationsClient initial={JSON.parse(JSON.stringify(rows))} />
    </AppShell>
  );
}
