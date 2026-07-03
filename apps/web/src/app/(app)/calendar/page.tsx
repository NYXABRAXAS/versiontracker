"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calendarApi } from "@/lib/api/resources";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [cursor, setCursor] = React.useState(new Date());
  const [releases, setReleases] = React.useState<any[]>([]);
  const [freezeWindows, setFreezeWindows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [freezeOpen, setFreezeOpen] = React.useState(false);

  const from = startOfMonth(cursor);
  const to = endOfMonth(cursor);

  const load = React.useCallback(() => {
    setLoading(true);
    calendarApi
      .get(isoDate(from), isoDate(to))
      .then((res: any) => {
        setReleases(res.releases);
        setFreezeWindows(res.freezeWindows);
      })
      .finally(() => setLoading(false));
  }, [from.getTime(), to.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => load(), [load]);

  const days: Date[] = [];
  const firstWeekday = from.getDay();
  for (let i = 0; i < firstWeekday; i++) days.push(new Date(NaN));
  for (let d = 1; d <= to.getDate(); d++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  const releasesByDay = new Map<string, any[]>();
  for (const r of releases) {
    const key = (r.releaseDate ?? r.deploymentDate)?.slice(0, 10);
    if (!key) continue;
    if (!releasesByDay.has(key)) releasesByDay.set(key, []);
    releasesByDay.get(key)!.push(r);
  }

  const isFrozen = (d: Date) => {
    if (Number.isNaN(d.getTime())) return false;
    const t = d.getTime();
    return freezeWindows.some((f) => t >= new Date(f.startDate).setHours(0, 0, 0, 0) && t <= new Date(f.endDate).setHours(23, 59, 59, 999));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Release Calendar"
        description="Scheduled releases and deployment freeze windows."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Release Calendar" }]}
        actions={
          <Protected module="CALENDAR" action="create">
            <FreezeWindowDialog open={freezeOpen} onOpenChange={setFreezeOpen} onCreated={load} />
          </Protected>
        }
      />

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between pb-3">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft />
            </Button>
            <span className="font-semibold">{cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight />
            </Button>
          </div>

          {loading && <p className="pb-2 text-xs text-muted-foreground">Loading releases…</p>}

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground pb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const key = Number.isNaN(d.getTime()) ? `blank-${i}` : isoDate(d);
              const dayReleases = releasesByDay.get(key) ?? [];
              const frozen = isFrozen(d);
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 rounded-md border p-1.5 text-xs flex flex-col gap-1",
                    Number.isNaN(d.getTime()) && "border-transparent",
                    frozen && "bg-destructive/10 border-destructive/30",
                  )}
                >
                  {!Number.isNaN(d.getTime()) && (
                    <>
                      <span className="font-medium">{d.getDate()}</span>
                      {frozen && <Badge variant="destructive" className="w-fit text-[10px]">Freeze</Badge>}
                      {dayReleases.slice(0, 3).map((r) => (
                        <Link key={r.id} href={`/versions/${r.id}`} className="truncate rounded bg-primary/10 px-1 py-0.5 text-primary hover:bg-primary/20">
                          {r.versionNumber}
                        </Link>
                      ))}
                      {dayReleases.length > 3 && <span className="text-muted-foreground">+{dayReleases.length - 3} more</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {freezeWindows.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="mb-2 text-sm font-semibold">Active Freeze Windows This Month</h3>
            <div className="flex flex-col gap-2">
              {freezeWindows.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>
                    <span className="font-medium">{f.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(f.startDate).toLocaleDateString()} – {new Date(f.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {f.environment && <Badge variant="outline">{f.environment.name}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FreezeWindowDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await calendarApi.createFreezeWindow({ title, description, startDate, endDate });
      toast.success("Freeze window created.");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to create freeze window.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add Freeze Window
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Release Freeze Window</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
