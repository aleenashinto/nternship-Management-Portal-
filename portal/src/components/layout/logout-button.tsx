"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
      className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      Log out
    </button>
  );
}
