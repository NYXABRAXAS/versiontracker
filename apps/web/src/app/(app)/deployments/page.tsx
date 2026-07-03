"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { MasterBadge } from "@/components/shared/master-badge";
import { MasterSelect } from "@/components/shared/master-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { deploymentsApi } from "@/lib/api/resources";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import type { DeploymentRecord } from "@/lib/api/types";
import { formatDateTime, fullName } from "@/lib/utils";

const RESULT_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  SUCCESS: "success",
  FAILED: "destructive",
  PARTIAL: "warning",
  ROLLED_BACK: "warning",
};

export default function DeploymentsPage() {
  const [environmentId, setEnvironmentId] = React.useState<string>();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [data, setData] = React.useState<DeploymentRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const params = React.useMemo(() => ({ page, pageSize, environmentId }), [page, pageSize, environmentId]);

  React.useEffect(() => {
    setLoading(true);
    deploymentsApi
      .list(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const columns: ColumnDef<DeploymentRecord>[] = [
    {
      accessorFn: (r) => r.version?.versionNumber,
      id: "version",
      header: "Version",
      meta: { label: "Version" },
      cell: ({ row }) => (
        <Link href={`/versions/${row.original.versionId}`} className="font-medium text-primary hover:underline">
          {row.original.version?.versionNumber}
        </Link>
      ),
    },
    { accessorFn: (r) => r.version?.releaseName, id: "releaseName", header: "Release", meta: { label: "Release" } },
    { accessorKey: "environment", header: "Environment", meta: { label: "Environment" }, cell: ({ row }) => <MasterBadge item={row.original.environment} /> },
    { accessorKey: "deployedAt", header: "Deployed At", meta: { label: "Deployed At" }, cell: ({ row }) => formatDateTime(row.original.deployedAt) },
    { accessorFn: (r) => fullName(r.deployedBy), id: "deployedBy", header: "Deployed By", meta: { label: "Deployed By" } },
    { accessorKey: "durationMinutes", header: "Duration", meta: { label: "Duration" }, cell: ({ row }) => (row.original.durationMinutes ? `${row.original.durationMinutes} min` : "-") },
    {
      accessorKey: "result",
      header: "Result",
      meta: { label: "Result" },
      cell: ({ row }) => (
        <Badge variant={RESULT_VARIANT[row.original.result] ?? "outline"}>
          {row.original.result} {row.original.rollback && "(Rollback)"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Deployment History" description="Full pipeline history from Development through Production." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Deployments" }]} />
      <Card>
        <CardContent className="flex flex-wrap gap-3 py-4">
          <div className="w-48">
            <MasterSelect typeCode={MASTER_TYPE_CODES.ENVIRONMENT} value={environmentId} onChange={(v) => { setEnvironmentId(v); setPage(1); }} placeholder="Environment" allowClear />
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} emptyMessage="No deployments recorded yet." />
    </div>
  );
}
