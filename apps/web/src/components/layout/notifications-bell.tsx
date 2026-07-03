"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { notificationsApi } from "@/lib/api/resources";
import type { Notification } from "@/lib/api/types";
import { formatDateTime, cn } from "@/lib/utils";

export function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const res = await notificationsApi.list({ pageSize: 8 });
      setItems(res.data);
      setUnreadCount(res.unreadCount);
    } catch {
      // silent - notifications are non-critical chrome
    }
  }, []);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const onMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    load();
  };

  const onItemClick = async (n: Notification) => {
    if (!n.isRead) await notificationsApi.markRead(n.id);
    load();
  };

  return (
    <Popover open={open} onOpenChange={(o) => (setOpen(o), o && load())}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => onItemClick(n)}
              className={cn("flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent", !n.isRead && "bg-accent/40")}
            >
              <span className="font-medium">{n.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
              <span className="text-[10px] text-muted-foreground">{formatDateTime(n.createdAt)}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
