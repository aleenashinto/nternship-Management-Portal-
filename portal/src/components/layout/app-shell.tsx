import { redirect } from "next/navigation";
import { getActor } from "@/lib/rbac/guard";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/layout/logout-button";

export type NavItem = { href: string; label: string };

export async function AppShell({ children, nav, title }: { children: React.ReactNode; nav: NavItem[]; title: string }) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  const unread = await prisma.notification.count({ where: { recipientId: actor.userId, isRead: false } });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-brand-100 bg-brand-50/60 p-4 md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/beat-logo.png" alt="Beat" className="mb-1 h-9 w-auto" />
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-wider text-brand-600">{title}</p>
        <nav aria-label="Primary" className="space-y-1">
          {nav.map((n) => (
            <a key={n.href} href={n.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-100 hover:text-brand-700">
              {n.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
          <span className="text-sm font-semibold text-gray-700 md:hidden">Beat Portal</span>
          <span className="hidden text-sm text-gray-500 md:block">{actor.username}</span>
          <div className="flex items-center gap-3">
            <a href="/notifications" className="relative rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-brand-50">
              Notifications
              {unread > 0 && (
                <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
              )}
            </a>
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">{actor.role}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 bg-white p-6">{children}</main>
      </div>
    </div>
  );
}
