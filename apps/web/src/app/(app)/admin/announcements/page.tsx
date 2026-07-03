"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { announcementsApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import type { Announcement } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

const PRIORITY_VARIANT: Record<string, "outline" | "warning" | "destructive"> = { INFO: "outline", WARNING: "warning", CRITICAL: "destructive" };

export default function AnnouncementsPage() {
  const [items, setItems] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    announcementsApi
      .list()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => load(), [load]);

  const onToggle = async (a: Announcement) => {
    await announcementsApi.update(a.id, { isActive: !a.isActive });
    load();
  };

  const onDelete = async (a: Announcement) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await announcementsApi.remove(a.id);
    toast.success("Announcement deleted.");
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Announcements"
        description="Company-wide notices shown to every user."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Announcements" }]}
        actions={
          <Protected module="ANNOUNCEMENTS" action="create">
            <CreateAnnouncementDialog open={open} onOpenChange={setOpen} onCreated={load} />
          </Protected>
        }
      />

      {loading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={PRIORITY_VARIANT[a.priority] ?? "outline"}>{a.priority}</Badge>
                    <span className="font-medium">{a.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                  <span className="text-xs text-muted-foreground">Posted {formatDateTime(a.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Protected module="ANNOUNCEMENTS" action="edit">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={a.isActive} onCheckedChange={() => onToggle(a)} />
                      <Label className="text-xs">Active</Label>
                    </div>
                  </Protected>
                  <Protected module="ANNOUNCEMENTS" action="delete">
                    <Button variant="ghost" size="icon" onClick={() => onDelete(a)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </Protected>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateAnnouncementDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [priority, setPriority] = React.useState("INFO");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await announcementsApi.create({ title, message, priority });
      toast.success("Announcement posted.");
      setTitle("");
      setMessage("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to post announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Message</Label>
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Post
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
