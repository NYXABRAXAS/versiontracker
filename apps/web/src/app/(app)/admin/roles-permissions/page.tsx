"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { rolesApi } from "@/lib/api/resources";
import type { Permission, Role } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

export default function RolesPermissionsPage() {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [catalog, setCatalog] = React.useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>();
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const loadRoles = React.useCallback(async () => {
    const [r, c] = await Promise.all([rolesApi.list(), rolesApi.permissionCatalog()]);
    setRoles(r);
    setCatalog(c);
    return r;
  }, []);

  React.useEffect(() => {
    loadRoles()
      .then((r) => {
        if (r.length) setSelectedRoleId(r[0].id);
      })
      .finally(() => setLoading(false));
  }, [loadRoles]);

  React.useEffect(() => {
    if (!selectedRoleId) return;
    rolesApi.get(selectedRoleId).then((role) => {
      setSelectedCodes(new Set(role.rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`)));
    });
  }, [selectedRoleId]);

  const modules = Array.from(new Set(catalog.map((p) => p.module)));
  const actionsForModule = (module: string) => catalog.filter((p) => p.module === module).map((p) => p.action);

  const toggle = (module: string, action: string) => {
    const code = `${module}:${action}`;
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const onSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await rolesApi.setPermissions(selectedRoleId, Array.from(selectedCodes));
      toast.success("Permissions updated.");
      loadRoles();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Roles & Permissions"
        description="Fine-grained module-level permission matrix for each role."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Roles & Permissions" }]}
        actions={
          <Protected module="ROLES" action="create">
            <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={loadRoles} />
          </Protected>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit">
          <CardContent className="flex flex-col gap-1 py-3">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                  r.id === selectedRoleId ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  {r.name}
                </span>
                {r.isSystem && <Badge variant={r.id === selectedRoleId ? "outline" : "secondary"} className="text-[10px]">System</Badge>}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            {selectedRole && (
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedRole.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                </div>
                <Protected module="ROLES" action="edit">
                  <Button size="sm" onClick={onSave} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    Save Permissions
                  </Button>
                </Protected>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>View</TableHead>
                    <TableHead>Create</TableHead>
                    <TableHead>Edit</TableHead>
                    <TableHead>Delete</TableHead>
                    <TableHead>Approve</TableHead>
                    <TableHead>Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => {
                    const available = actionsForModule(module);
                    return (
                      <TableRow key={module}>
                        <TableCell className="font-medium">{module.replaceAll("_", " ")}</TableCell>
                        {["view", "create", "edit", "delete", "approve", "export"].map((action) => (
                          <TableCell key={action}>
                            {available.includes(action) ? (
                              <Checkbox checked={selectedCodes.has(`${module}:${action}`)} onCheckedChange={() => toggle(module, action)} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreateRoleDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rolesApi.create({ code: name, name, description });
      toast.success("Role created.");
      setName("");
      setDescription("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to create role.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Role Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
