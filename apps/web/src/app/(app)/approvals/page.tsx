"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { approvalsApi } from "@/lib/api/resources";
import type { ApprovalRequest } from "@/lib/api/types";
import { formatDateTime, fullName } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive"> = { PENDING: "warning", APPROVED: "success", REJECTED: "destructive" };

export default function ApprovalsPage() {
  const [status, setStatus] = React.useState("PENDING");
  const [items, setItems] = React.useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    approvalsApi
      .list(status)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [status]);

  React.useEffect(() => load(), [load]);

  const onApprove = async (id: string) => {
    const comments = prompt("Comments (optional):") ?? undefined;
    try {
      await approvalsApi.approve(id, comments);
      toast.success("Approved.");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to approve.");
    }
  };

  const onReject = async (id: string) => {
    const comments = prompt("Reason for rejection:") ?? undefined;
    try {
      await approvalsApi.reject(id, comments);
      toast.success("Rejected.");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to reject.");
    }
  };

  const entityHref = (a: ApprovalRequest) => (a.entityType === "VERSION" ? `/versions/${a.entityId}` : "#");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Approvals" description="Maker-checker approval workflow for releases, bug fixes and deployments." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Approvals" }]} />

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={status}>
          {loading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No {status.toLowerCase()} requests.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                        <Link href={entityHref(a)} className="font-medium text-primary hover:underline">
                          {a.action.replaceAll("_", " ")} — {a.entityType}
                        </Link>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Requested by {fullName(a.requestedBy)} · {formatDateTime(a.requestedAt)}
                      </span>
                      {a.comments && <p className="text-sm text-muted-foreground">&ldquo;{a.comments}&rdquo;</p>}
                    </div>
                    {a.status === "PENDING" && (
                      <Protected module="APPROVALS" action="approve">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => onApprove(a.id)}>
                            <Check className="text-success" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onReject(a.id)}>
                            <X className="text-destructive" /> Reject
                          </Button>
                        </div>
                      </Protected>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
