"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SidebarNav } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.mustChangePassword) {
      router.push("/change-password");
    }
  }, [loading, user, router]);

  if (loading || !user || user.mustChangePassword) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden lg:block w-64 shrink-0 border-r">
        <div className="sticky top-0 h-screen">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
