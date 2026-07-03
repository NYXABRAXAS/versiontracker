"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MasterBadge } from "@/components/shared/master-badge";
import { MasterSelect } from "@/components/shared/master-select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { changeLogsApi } from "@/lib/api/resources";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import type { ChangeLog } from "@/lib/api/types";
import { formatDate, fullName } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";
import Link from "next/link";

export default function ChangeLogsPage() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [moduleId, setModuleId] = React.useState<string>();
  const [statusId, setStatusId] = React.useState<string>();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [data, setData] = React.useState<ChangeLog[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const params = React.useMemo(() => ({ page, pageSize, search: debouncedSearch || undefined, moduleId, statusId }), [page, pageSize, debouncedSearch, moduleId, statusId]);

  React.useEffect(() => {
    setLoading(true);
    changeLogsApi
      .list(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const columns: ColumnDef<ChangeLog>[] = [
    {
      accessorKey: "title",
      header: "Title",
      meta: { label: "Title" },
      cell: ({ row }) => (
        <Link href={`/versions/${row.original.versionId}`} className="font-medium text-primary hover:underline">
          {row.original.title}
        </Link>
      ),
    },
    { accessorFn: (r) => r.version?.versionNumber, id: "version", header: "Version", meta: { label: "Version" } },
    { accessorFn: (r) => r.module?.name, id: "module", header: "Module", meta: { label: "Module" } },
    { accessorKey: "screenName", header: "Screen", meta: { label: "Screen" } },
    { accessorFn: (r) => fullName(r.developer), id: "developer", header: "Developer", meta: { label: "Developer" } },
    { accessorKey: "status", header: "Status", meta: { label: "Status" }, cell: ({ row }) => <MasterBadge item={row.original.status} /> },
    { accessorKey: "date", header: "Date", meta: { label: "Date" }, cell: ({ row }) => formatDate(row.original.date) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Change Logs" description="Every change recorded across all releases." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Change Logs" }]} />
      <Card>
        <CardContent className="flex flex-wrap gap-3 py-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search title, ticket, screen…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-48">
            <MasterSelect typeCode={MASTER_TYPE_CODES.MODULE} value={moduleId} onChange={(v) => { setModuleId(v); setPage(1); }} placeholder="Module" allowClear />
          </div>
          <div className="w-48">
            <MasterSelect typeCode={MASTER_TYPE_CODES.STATUS} value={statusId} onChange={(v) => { setStatusId(v); setPage(1); }} placeholder="Status" allowClear />
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} emptyMessage="No change log entries found." />
    </div>
  );
}
