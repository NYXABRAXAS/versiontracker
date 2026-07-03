"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auditLogsApi } from "@/lib/api/resources";
import { apiUrl } from "@/lib/api/client";
import type { AuditLog } from "@/lib/api/types";
import { formatDateTime, fullName } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

const ACTION_VARIANT: Record<string, "success" | "destructive" | "warning" | "outline"> = {
  CREATE: "success",
  DELETE: "destructive",
  UPDATE: "warning",
  LOGIN_FAILED: "destructive",
  REJECT: "destructive",
};

export default function AuditLogsPage() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [data, setData] = React.useState<AuditLog[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const params = React.useMemo(() => ({ page, pageSize, search: debouncedSearch || undefined }), [page, pageSize, debouncedSearch]);

  React.useEffect(() => {
    setLoading(true);
    auditLogsApi
      .list(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const columns: ColumnDef<AuditLog>[] = [
    { accessorKey: "createdAt", header: "Timestamp", meta: { label: "Timestamp" }, cell: ({ row }) => formatDateTime(row.original.createdAt) },
    { accessorFn: (r) => fullName(r.actor), id: "actor", header: "Actor", meta: { label: "Actor" } },
    {
      accessorKey: "action",
      header: "Action",
      meta: { label: "Action" },
      cell: ({ row }) => <Badge variant={ACTION_VARIANT[row.original.action] ?? "outline"}>{row.original.action.replaceAll("_", " ")}</Badge>,
    },
    { accessorKey: "entityType", header: "Entity", meta: { label: "Entity" } },
    { accessorKey: "description", header: "Description", meta: { label: "Description" }, cell: ({ row }) => <span className="line-clamp-1 max-w-sm">{row.original.description}</span> },
    { accessorKey: "ipAddress", header: "IP Address", meta: { label: "IP Address" } },
  ];

  const exportHref = (format: string) => apiUrl(auditLogsApi.exportUrl({ ...params, format }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of every login, create, update, delete and export action."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Audit Logs" }]}
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
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <Card>
        <CardContent className="py-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search description or entity id…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} emptyMessage="No audit entries found." />
    </div>
  );
}
