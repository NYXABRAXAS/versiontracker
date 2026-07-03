"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { loginHistoryApi } from "@/lib/api/resources";
import type { LoginHistoryEntry } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function LoginHistoryPage() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [data, setData] = React.useState<LoginHistoryEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const params = React.useMemo(() => ({ page, pageSize, search: debouncedSearch || undefined }), [page, pageSize, debouncedSearch]);

  React.useEffect(() => {
    setLoading(true);
    loginHistoryApi
      .list(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const columns: ColumnDef<LoginHistoryEntry>[] = [
    { accessorKey: "createdAt", header: "Timestamp", meta: { label: "Timestamp" }, cell: ({ row }) => formatDateTime(row.original.createdAt) },
    { accessorKey: "email", header: "Email", meta: { label: "Email" } },
    {
      accessorKey: "success",
      header: "Result",
      meta: { label: "Result" },
      cell: ({ row }) => <Badge variant={row.original.success ? "success" : "destructive"}>{row.original.success ? "Success" : "Failed"}</Badge>,
    },
    { accessorKey: "reason", header: "Reason", meta: { label: "Reason" } },
    { accessorKey: "ipAddress", header: "IP Address", meta: { label: "IP Address" } },
    { accessorKey: "userAgent", header: "Browser", meta: { label: "Browser" }, cell: ({ row }) => <span className="line-clamp-1 max-w-xs text-xs">{row.original.userAgent}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Login History" description="Every successful and failed login attempt." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Login History" }]} />
      <Card>
        <CardContent className="py-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search email…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} emptyMessage="No login history found." />
    </div>
  );
}
