"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GlobalSearch } from "./global-search";
import { NotificationsBell } from "./notifications-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { SidebarNav } from "./sidebar";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
        <Menu />
      </Button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1">
        <NotificationsBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
