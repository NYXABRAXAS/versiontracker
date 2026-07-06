"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { KeyRound, Plus, Power, PowerOff, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { usersApi, rolesApi } from "@/lib/api/resources";
import type { User, Role } from "@/lib/api/types";
import { formatDateTime, fullName } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { ApiError } from "@/lib/api/client";

export default function UsersAdminPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [roleId, setRoleId] = React.useState<string>();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [data, setData] = React.useState<User[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    rolesApi.list().then(setRoles);
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    usersApi
      .list({ page, pageSize, search: debouncedSearch || undefined, roleId })
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearch, roleId]);

  React.useEffect(() => load(), [load]);

  const onToggleActive = async (u: User) => {
    try {
      if (u.isActive) await usersApi.disable(u.id);
      else await usersApi.enable(u.id);
      toast.success(u.isActive ? "User disabled." : "User enabled.");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update user.");
    }
  };

  const onResetPassword = async (u: User) => {
    const custom = prompt(
      `Reset password for ${fullName(u)}.\n\nType a new password to set it directly (min 8 chars, uppercase + number + symbol), or leave blank to auto-generate and email one.`,
    );
    if (custom === null) return; // cancelled
    try {
      const res = await usersApi.resetPassword(u.id, custom || undefined);
      if (res.tempPassword) {
        // No SMTP configured - this is the only place this password will ever be visible.
        navigator.clipboard.writeText(res.tempPassword).catch(() => {});
        toast.success(`No email configured - temporary password for ${fullName(u)}: ${res.tempPassword} (copied to clipboard)`, {
          duration: 30000,
        });
      } else if (custom) {
        toast.success(`Password reset to the value you set for ${fullName(u)}.`);
      } else {
        toast.success("Password reset. A temporary password has been emailed.");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to reset password.");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorFn: (r) => fullName(r),
      id: "name",
      header: "Name",
      meta: { label: "Name" },
      cell: ({ row }) => (
        <Link href={`/admin/users/${row.original.id}`} className="font-medium text-primary hover:underline">
          {fullName(row.original)}
        </Link>
      ),
    },
    { accessorKey: "email", header: "Email", meta: { label: "Email" } },
    { accessorFn: (r) => r.role?.name, id: "role", header: "Role", meta: { label: "Role" } },
    { accessorFn: (r) => r.department?.name, id: "department", header: "Department", meta: { label: "Department" } },
    {
      accessorKey: "isActive",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "outline"}>{row.original.isActive ? "Active" : "Disabled"}</Badge>,
    },
    { accessorKey: "lastLoginAt", header: "Last Login", meta: { label: "Last Login" }, cell: ({ row }) => formatDateTime(row.original.lastLoginAt) },
    {
      id: "actions",
      header: "",
      meta: { label: "Actions" },
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Protected module="USERS" action="edit">
            <Button variant="ghost" size="icon" title="Reset password" onClick={() => onResetPassword(row.original)}>
              <KeyRound />
            </Button>
            <Button variant="ghost" size="icon" title={row.original.isActive ? "Disable" : "Enable"} onClick={() => onToggleActive(row.original)}>
              {row.original.isActive ? <PowerOff className="text-destructive" /> : <Power className="text-success" />}
            </Button>
          </Protected>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Users"
        description="Manage portal access, roles and scoped product/environment permissions."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Users" }]}
        actions={
          <Protected module="USERS" action="create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> New User
            </Button>
          </Protected>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap gap-3 py-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or email…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-52">
            <Select value={roleId} onValueChange={(v) => { setRoleId(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        emptyMessage="No users found."
      />

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} roles={roles} onCreated={load} />
    </div>
  );
}
