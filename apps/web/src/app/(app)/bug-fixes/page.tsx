"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MasterBadge } from "@/components/shared/master-badge";
import { MasterSelect } from "@/components/shared/master-select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { bugFixesApi } from "@/lib/api/resources";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import type { BugFix } from "@/lib/api/types";
import { fullName } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function BugFixesPage() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [severityId, setSeverityId] = React.useState<string>();
  const [statusId, setStatusId] = React.useState<string>();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [data, setData] = React.useState<BugFix[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const params = React.useMemo(() => ({ page, pageSize, search: debouncedSearch || undefined, severityId, statusId }), [page, pageSize, debouncedSearch, severityId, statusId]);

  React.useEffect(() => {
    setLoading(true);
    bugFixesApi
      .list(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const columns: ColumnDef<BugFix>[] = [
    {
      accessorKey: "bugCode",
      header: "Bug",
      meta: { label: "Bug" },
      cell: ({ row }) => (
        <Link href={row.original.versionId ? `/versions/${row.original.versionId}` : "#"} className="font-medium text-primary hover:underline">
          {row.original.bugCode}
        </Link>
      ),
    },
    { accessorKey: "issue", header: "Issue", meta: { label: "Issue" }, cell: ({ row }) => <span className="line-clamp-1 max-w-sm">{row.original.issue}</span> },
    { accessorFn: (r) => r.module?.name, id: "module", header: "Module", meta: { label: "Module" } },
    { accessorKey: "severity", header: "Severity", meta: { label: "Severity" }, cell: ({ row }) => <MasterBadge item={row.original.severity} /> },
    { accessorKey: "priority", header: "Priority", meta: { label: "Priority" }, cell: ({ row }) => <MasterBadge item={row.original.priority} /> },
    { accessorKey: "status", header: "Status", meta: { label: "Status" }, cell: ({ row }) => <MasterBadge item={row.original.status} /> },
    { accessorFn: (r) => fullName(r.fixedBy), id: "fixedBy", header: "Fixed By", meta: { label: "Fixed By" } },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Bug Fixes" description="Defects tracked and resolved across every release." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bug Fixes" }]} />
      <Card>
        <CardContent className="flex flex-wrap gap-3 py-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search issue, ticket, bug code…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-48">
            <MasterSelect typeCode={MASTER_TYPE_CODES.SEVERITY} value={severityId} onChange={(v) => { setSeverityId(v); setPage(1); }} placeholder="Severity" allowClear />
          </div>
          <div className="w-48">
            <MasterSelect typeCode={MASTER_TYPE_CODES.STATUS} value={statusId} onChange={(v) => { setStatusId(v); setPage(1); }} placeholder="Status" allowClear />
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} emptyMessage="No bug fixes found." />
    </div>
  );
}
