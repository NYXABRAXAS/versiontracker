"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  Download,
  Edit,
  Loader2,
  Mail,
  Printer,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { MasterBadge } from "@/components/shared/master-badge";
import { AttachmentsPanel } from "@/components/shared/attachments-panel";
import { AddChangeLogDialog } from "@/components/versions/add-change-log-dialog";
import { AddBugFixDialog } from "@/components/versions/add-bug-fix-dialog";
import { AddDeploymentDialog } from "@/components/versions/add-deployment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { versionsApi, bookmarksApi, releaseNotesApi } from "@/lib/api/resources";
import { apiUrl } from "@/lib/api/client";
import type { Version } from "@/lib/api/types";
import { formatDate, formatDateTime, fullName } from "@/lib/utils";

export default function VersionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [version, setVersion] = React.useState<Version | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [bookmarked, setBookmarked] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    versionsApi
      .get(params.id)
      .then(setVersion)
      .finally(() => setLoading(false));
  }, [params.id]);

  React.useEffect(() => load(), [load]);

  React.useEffect(() => {
    bookmarksApi.list().then((list) => setBookmarked(list.some((v) => v.id === params.id)));
  }, [params.id]);

  const onToggleBookmark = async () => {
    const res = await bookmarksApi.toggle(params.id);
    setBookmarked(res.bookmarked);
    toast.success(res.bookmarked ? "Added to favourites." : "Removed from favourites.");
  };

  const onDelete = async () => {
    if (!confirm("Delete this version? This can be viewed later by administrators via the audit trail, but will be removed from active lists.")) return;
    await versionsApi.remove(params.id);
    toast.success("Version deleted.");
    router.push("/versions");
  };

  if (loading || !version) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={version.releaseName}
        description={`${version.versionNumber} · ${version.product.name}`}
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Versions", href: "/versions" }, { label: version.versionNumber }]}
        actions={
          <>
            <Button variant="outline" size="icon" onClick={onToggleBookmark} title="Toggle favourite">
              {bookmarked ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()} title="Print">
              <Printer />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download /> Release Notes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={apiUrl(releaseNotesApi.exportUrl(version.id, "pdf"))}>PDF</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={apiUrl(releaseNotesApi.exportUrl(version.id, "word"))}>Word (.docx)</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={apiUrl(releaseNotesApi.exportUrl(version.id, "excel"))}>Excel (.xlsx)</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={apiUrl(releaseNotesApi.exportUrl(version.id, "csv"))}>CSV</a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={async () => {
                    const email = prompt("Send release notes to (comma-separated emails):");
                    if (!email) return;
                    await releaseNotesApi.email(version.id, email.split(",").map((s) => s.trim()));
                    toast.success("Release notes emailed.");
                  }}
                >
                  <Mail className="mr-1 size-4" /> Email Release Notes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Protected module="VERSIONS" action="edit">
              <Button variant="outline" asChild>
                <Link href={`/versions/${version.id}/edit`}>
                  <Edit /> Edit
                </Link>
              </Button>
            </Protected>
            <Protected module="VERSIONS" action="delete">
              <Button variant="outline" onClick={onDelete}>
                <Trash2 className="text-destructive" />
              </Button>
            </Protected>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <MasterBadge item={version.environment} />
        <MasterBadge item={version.releaseType} />
        <MasterBadge item={version.status} />
        {version.priority && <MasterBadge item={version.priority} />}
        {version.severity && <MasterBadge item={version.severity} />}
        {version.breakingChanges && <Badge variant="destructive">Breaking Changes</Badge>}
        {version.rollbackAvailable && <Badge variant="warning">Rollback Available</Badge>}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="changelogs">Change Logs ({version.changeLogs?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="bugfixes">Bug Fixes ({version.bugFixes?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="deployments">Deployment History</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Release Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Info label="Release Title" value={version.releaseTitle} />
                <Info label="Client" value={version.client?.name} />
                <Info label="Module" value={version.module?.name} />
                <Info label="Release Date" value={formatDate(version.releaseDate)} />
                <Info label="Deployment Date" value={formatDate(version.deploymentDate)} />
                <Info label="Ticket Number" value={version.ticketNumber} />
                <Info label="Sprint" value={version.sprintNumber} />
                <Info label="Estimated / Actual Hours" value={`${version.estimatedHours ?? "-"} / ${version.actualHours ?? "-"}`} />
                <div className="col-span-2">
                  <Info label="Description" value={version.releaseDescription} block />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>People & Source Control</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Info label="Developer" value={fullName(version.developer)} />
                <Info label="Tester" value={fullName(version.tester)} />
                <Info label="Approved By" value={version.approvedBy ? fullName(version.approvedBy) : "Pending"} />
                <Info label="Git Branch" value={version.gitBranch} />
                <Info label="Git Commit" value={version.gitCommitId} />
                <Info label="Build Number" value={version.buildNumber} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Window</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Info label="Window Start" value={formatDateTime(version.deploymentWindowStart)} />
                <Info label="Window End" value={formatDateTime(version.deploymentWindowEnd)} />
                <Info label="Downtime" value={version.downtimeMinutes ? `${version.downtimeMinutes} minutes` : "None"} />
                <Info label="Rollback Version" value={version.rollbackVersion?.versionNumber} />
                <div className="col-span-2">
                  <Info label="Deployment Notes" value={version.deploymentNotes} block />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Changes</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm">
                <Info label="Database Changes" value={version.databaseChanges} block />
                <Info label="API Changes" value={version.apiChanges} block />
                <Info label="Configuration Changes" value={version.configurationChanges} block />
                <Info label="Backward Compatible" value={version.backwardCompatible ? "Yes" : "No"} />
              </CardContent>
            </Card>

            {(version.releaseNotes || version.remarks) && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Release Notes & Remarks</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  {version.releaseNotes && <div className="whitespace-pre-wrap">{version.releaseNotes}</div>}
                  {version.remarks && <p className="text-muted-foreground">{version.remarks}</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="changelogs">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Protected module="CHANGE_LOGS" action="create">
                <AddChangeLogDialog versionId={version.id} onCreated={load} />
              </Protected>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(version.changeLogs ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No change log entries yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {(version.changeLogs ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-xs whitespace-normal">{c.title}</TableCell>
                      <TableCell>{c.module?.name ?? "-"}</TableCell>
                      <TableCell>{fullName(c.developer)}</TableCell>
                      <TableCell>
                        <MasterBadge item={c.status} />
                      </TableCell>
                      <TableCell>{formatDate(c.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bugfixes">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Protected module="BUG_FIXES" action="create">
                <AddBugFixDialog versionId={version.id} onCreated={load} />
              </Protected>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bug</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fixed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(version.bugFixes ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No bug fixes recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {(version.bugFixes ?? []).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.bugCode}</TableCell>
                      <TableCell className="max-w-xs whitespace-normal">{b.issue}</TableCell>
                      <TableCell>
                        <MasterBadge item={b.severity} />
                      </TableCell>
                      <TableCell>
                        <MasterBadge item={b.status} />
                      </TableCell>
                      <TableCell>{fullName(b.fixedBy)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deployments">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Protected module="DEPLOYMENTS" action="create">
                <AddDeploymentDialog versionId={version.id} onCreated={load} />
              </Protected>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Environment</TableHead>
                    <TableHead>Deployed At</TableHead>
                    <TableHead>Deployed By</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(version.deploymentHistory ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No deployments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {(version.deploymentHistory ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <MasterBadge item={d.environment} />
                      </TableCell>
                      <TableCell>{formatDateTime(d.deployedAt)}</TableCell>
                      <TableCell>{fullName(d.deployedBy)}</TableCell>
                      <TableCell>{d.durationMinutes ? `${d.durationMinutes} min` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={d.result === "SUCCESS" ? "success" : d.result === "FAILED" ? "destructive" : "warning"}>{d.result}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentsPanel entityType="VERSION" entityId={version.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value, block }: { label: string; value?: React.ReactNode; block?: boolean }) {
  return (
    <div className={block ? "flex flex-col gap-0.5" : "flex flex-col gap-0.5 min-w-0"}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={block ? "whitespace-pre-wrap" : "truncate"}>{value || "-"}</span>
    </div>
  );
}
