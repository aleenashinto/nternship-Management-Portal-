import { redirect } from "next/navigation";
import { getActor } from "@/lib/rbac/guard";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "HR and Mentors" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/template", label: "Certificate template" },
  { href: "/admin/grants", label: "Access grants" },
  { href: "/admin/logs", label: "Activity logs" },
];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  // Defence in depth: the proxy also gates this area; Admin may enter every area.
  if (actor.role !== "ADMIN") redirect("/");
  return <AppShell nav={nav} title="Admin">{children}</AppShell>;
}
