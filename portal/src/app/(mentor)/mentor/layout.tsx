import { redirect } from "next/navigation";
import { getActor } from "@/lib/rbac/guard";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const nav: NavItem[] = [
  { href: "/mentor", label: "Dashboard" },
  { href: "/mentor/interns", label: "My interns" },
  { href: "/mentor/projects", label: "Projects" },
  { href: "/mentor/assignments", label: "Assignments" },
  { href: "/mentor/extensions", label: "Extensions" },
  { href: "/mentor/presentations", label: "Presentations" },
];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  // Defence in depth: the proxy also gates this area; Admin may enter every area.
  if (actor.role !== "MENTOR" && actor.role !== "ADMIN") redirect("/");
  return <AppShell nav={nav} title="Mentor">{children}</AppShell>;
}
