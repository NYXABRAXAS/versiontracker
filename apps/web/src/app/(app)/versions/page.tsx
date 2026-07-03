"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Plus, Search, GitCompare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { MasterBadge } from "@/components/shared/master-badge";
import { MasterSelect } from "@/components/shared/master-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table/data-table";
import { versionsApi } from "@/lib/api/resources";
import { apiUrl } from "@/lib/api/client";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import type { Version } from "@/lib/api/types";
import { formatDate, fullName } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function VersionsListPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [productId, setProductId] = React.useState<string | undefined>();
  const [environmentId, setEnvironmentId] = React.useState<string | undefined>();
  const [statusId, setStatusId] = React.useState<string | undefined>();
  const [releaseTypeId, setReleaseTypeId] = React.useState<string | undefined>();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [data, setData] = React.useState<Version[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const params = React.useMemo(
    () => ({ page, pageSize, search: debouncedSearch || undefined, productId, environmentId, statusId, releaseTypeId }),
    [page, pageSize, debouncedSearch, productId, environmentId, statusId, releaseTypeId],
  );

  React.useEffect(() => {
    setLoading(true);
    versionsApi
      .list(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const columns: ColumnDef<Version>[] = [
    {
      accessorKey: "versionNumber",
      header: "Version",
      meta: { label: "Version" },
      cell: ({ row }) => (
        <Link href={`/versions/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.versionNumber}
        </Link>
      ),
    },
    { accessorKey: "releaseName", header: "Release Name", meta: { label: "Release Name" } },
    {
      accessorKey: "product",
      header: "Product",
      meta: { label: "Product" },
      cell: ({ row }) => <MasterBadge item={row.original.product} />,
    },
    {
      accessorKey: "environment",
      header: "Environment",
      meta: { label: "Environment" },
      cell: ({ row }) => <MasterBadge item={row.original.environment} />,
    },
    {
      accessorKey: "releaseType",
      header: "Release Type",
      meta: { label: "Release Type" },
      cell: ({ row }) => <MasterBadge item={row.original.releaseType} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => <MasterBadge item={row.original.status} />,
    },
    {
      accessorKey: "developer",
      header: "Developer",
      meta: { label: "Developer" },
      cell: ({ row }) => fullName(row.original.developer),
    },
    {
      accessorKey: "releaseDate",
      header: "Release Date",
      meta: { label: "Release Date" },
      cell: ({ row }) => formatDate(row.original.releaseDate),
    },
  ];

  const exportHref = (format: string) => apiUrl(versionsApi.exportUrl({ ...params, format }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Versions"
        description="Every release tracked across Development, QA, UAT and Production."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Versions" }]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/versions/compare">
                <GitCompare /> Compare
              </Link>
            </Button>
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
            <Protected module="VERSIONS" action="create">
              <Button onClick={() => router.push("/versions/new")}>
                <Plus /> New Version
              </Button>
            </Protected>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap gap-3 py-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search version, ticket, commit…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-44">
            <MasterSelect typeCode={MASTER_TYPE_CODES.PRODUCT} value={productId} onChange={(v) => { setProductId(v); setPage(1); }} placeholder="Product" allowClear />
          </div>
          <div className="w-44">
            <MasterSelect typeCode={MASTER_TYPE_CODES.ENVIRONMENT} value={environmentId} onChange={(v) => { setEnvironmentId(v); setPage(1); }} placeholder="Environment" allowClear />
          </div>
          <div className="w-44">
            <MasterSelect typeCode={MASTER_TYPE_CODES.STATUS} value={statusId} onChange={(v) => { setStatusId(v); setPage(1); }} placeholder="Status" allowClear />
          </div>
          <div className="w-44">
            <MasterSelect typeCode={MASTER_TYPE_CODES.RELEASE_TYPE} value={releaseTypeId} onChange={(v) => { setReleaseTypeId(v); setPage(1); }} placeholder="Release Type" allowClear />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        onRowClick={(row) => router.push(`/versions/${row.id}`)}
        emptyMessage="No versions match your filters."
      />
    </div>
  );
}
