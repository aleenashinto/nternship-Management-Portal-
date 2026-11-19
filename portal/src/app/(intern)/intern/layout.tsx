import { redirect } from "next/navigation";
import { getActor } from "@/lib/rbac/guard";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const nav: NavItem[] = [
  { href: "/intern", label: "My profile" },
  { href: "/intern/assignments", label: "My projects" },
  { href: "/intern/presentations", label: "Presentations" },
  { href: "/intern/certificate", label: "Certificate" },
];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  // Defence in depth: the proxy also gates this area; Admin may enter every area.
  if (actor.role !== "INTERN" && actor.role !== "ADMIN") redirect("/");
  return <AppShell nav={nav} title="Intern">{children}</AppShell>;
}
