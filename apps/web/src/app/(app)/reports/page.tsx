"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { reportsApi } from "@/lib/api/resources";
import { apiUrl } from "@/lib/api/client";

const REPORT_TYPES = [
  { value: "release", label: "Release Report" },
  { value: "developer", label: "Developer Report" },
  { value: "qa", label: "QA Report" },
  { value: "product", label: "Product Report" },
  { value: "module", label: "Module Report" },
  { value: "environment", label: "Environment Report" },
  { value: "deployment", label: "Deployment Report" },
  { value: "version-history", label: "Version History" },
  { value: "bug-summary", label: "Bug Summary" },
  { value: "monthly", label: "Monthly Report" },
  { value: "quarterly", label: "Quarterly Report" },
  { value: "yearly", label: "Yearly Report" },
];

function cell(row: Record<string, any>, key: string): string {
  const value = key.split(".").reduce<any>((acc, k) => (acc == null ? acc : acc[k]), row);
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleDateString();
  return String(value);
}

export default function ReportsPage() {
  const [type, setType] = React.useState("release");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [report, setReport] = React.useState<{ title: string; columns: { key: string; label: string }[]; rows: Record<string, any>[] } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const run = React.useCallback(() => {
    setLoading(true);
    reportsApi
      .build(type, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then(setReport)
      .finally(() => setLoading(false));
  }, [type, dateFrom, dateTo]);

  React.useEffect(() => run(), [run]);

  const exportHref = (format: string) => apiUrl(reportsApi.exportUrl(type, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, format }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Reports"
        description="Release, developer, QA, product, module, environment, deployment and periodic reports."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={exportHref("excel")}>Excel (.xlsx)</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={exportHref("csv")}>CSV</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={exportHref("pdf")}>PDF</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div className="flex flex-col gap-1.5 w-56">
            <Label className="text-xs text-muted-foreground">Report Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button onClick={run} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Run Report
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          {loading ? (
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
          ) : !report || report.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data for this report.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.columns.map((c) => (
                      <TableHead key={c.key}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row, i) => (
                    <TableRow key={i}>
                      {report.columns.map((c) => (
                        <TableCell key={c.key}>{cell(row, c.key)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
