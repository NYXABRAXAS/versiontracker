"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/constants";
import { ICON_MAP } from "./icon-map";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <ShieldCheck className="size-4" />
        </span>
        <span className="font-semibold text-sm leading-tight">LOS Version Portal</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => hasPermission(item.module, "view"));
          if (!items.length) return null;
          return (
            <div key={section.title} className="flex flex-col gap-1">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </span>
              {items.map((item) => {
                const Icon = ICON_MAP[item.icon];
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
