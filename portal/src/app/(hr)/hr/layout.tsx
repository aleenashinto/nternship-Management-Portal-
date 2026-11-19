import { redirect } from "next/navigation";
import { getActor } from "@/lib/rbac/guard";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const nav: NavItem[] = [
  { href: "/hr", label: "Dashboard" },
  { href: "/hr/interns", label: "Interns" },
  { href: "/hr/certificates", label: "Certificates" },
];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  // Defence in depth: the proxy also gates this area; Admin may enter every area.
  if (actor.role !== "HR" && actor.role !== "ADMIN") redirect("/");
  return <AppShell nav={nav} title="HR Manager">{children}</AppShell>;
}
