"use client";

import * as React from "react";
import { GitCompare, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { versionsApi, comparisonApi } from "@/lib/api/resources";
import type { Version } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default function CompareVersionsPage() {
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [versionAId, setVersionAId] = React.useState<string>();
  const [versionBId, setVersionBId] = React.useState<string>();
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    versionsApi.list({ pageSize: 100, sortBy: "releaseDate" }).then((res) => setVersions(res.data));
  }, []);

  const onCompare = async () => {
    if (!versionAId || !versionBId) return;
    setLoading(true);
    try {
      setResult(await comparisonApi.compare(versionAId, versionBId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Compare Versions" description="Highlight added, removed and modified changes between two releases." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Versions", href: "/versions" }, { label: "Compare" }]} />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div className="flex flex-col gap-1.5 w-64">
            <label className="text-xs text-muted-foreground">Version A</label>
            <Select value={versionAId} onValueChange={setVersionAId}>
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.versionNumber} — {v.releaseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 w-64">
            <label className="text-xs text-muted-foreground">Version B</label>
            <Select value={versionBId} onValueChange={setVersionBId}>
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.versionNumber} — {v.releaseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onCompare} disabled={!versionAId || !versionBId || loading}>
            {loading ? <Loader2 className="animate-spin" /> : <GitCompare />}
            Compare
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Differences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground border-b pb-2 mb-2">
                <span>Field</span>
                <span>{result.versionA.versionNumber}</span>
                <span>{result.versionB.versionNumber}</span>
              </div>
              {result.fieldDiffs.map((f: any) => (
                <div key={f.field} className={cn("grid grid-cols-3 gap-2 py-1.5 text-sm border-b last:border-0", f.changed && "bg-warning/10")}>
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="truncate">{String(f.valueA ?? "-")}</span>
                  <span className="truncate">{String(f.valueB ?? "-")}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="success">Added</Badge> Features in {result.versionB.versionNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {result.changeLogSummary.addedFeatures.length === 0 && <p className="text-muted-foreground">None</p>}
                {result.changeLogSummary.addedFeatures.map((c: any) => (
                  <div key={c.id} className="rounded-md border p-2">
                    {c.title}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="destructive">Removed</Badge> from {result.versionA.versionNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {result.changeLogSummary.removedFeatures.length === 0 && <p className="text-muted-foreground">None</p>}
                {result.changeLogSummary.removedFeatures.map((c: any) => (
                  <div key={c.id} className="rounded-md border p-2">
                    {c.title}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="warning">Modified</Badge> Features
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {result.changeLogSummary.modifiedFeatures.length === 0 && <p className="text-muted-foreground">None</p>}
                {result.changeLogSummary.modifiedFeatures.map((c: any) => (
                  <div key={c.id} className="rounded-md border p-2">
                    {c.title}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Bug Fixes in {result.versionB.versionNumber} ({result.bugFixSummary.totalB} total, {result.bugFixSummary.totalA} in {result.versionA.versionNumber})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {result.bugFixSummary.fixedInB.length === 0 && <p className="text-muted-foreground">No unique bug fixes.</p>}
              {result.bugFixSummary.fixedInB.map((b: any) => (
                <div key={b.id} className="rounded-md border p-2">
                  <span className="font-medium">{b.bugCode}</span>: {b.issue}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
