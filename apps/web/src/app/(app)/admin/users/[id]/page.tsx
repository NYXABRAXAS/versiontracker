"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MasterSelect } from "@/components/shared/master-select";
import { MultiMasterSelect } from "@/components/shared/multi-master-select";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import { usersApi, rolesApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import type { Role, User } from "@/lib/api/types";

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  employeeCode: string;
  roleId: string;
  departmentId?: string;
  isActive: boolean;
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [environmentIds, setEnvironmentIds] = React.useState<string[]>([]);
  const [moduleIds, setModuleIds] = React.useState<string[]>([]);

  const { register, handleSubmit, control, reset } = useForm<FormValues>();

  React.useEffect(() => {
    Promise.all([usersApi.get(params.id), rolesApi.list()]).then(([u, r]) => {
      setUser(u);
      setRoles(r);
      reset({ firstName: u.firstName, lastName: u.lastName, phone: u.phone ?? "", employeeCode: u.employeeCode ?? "", roleId: u.roleId, departmentId: u.departmentId ?? undefined, isActive: u.isActive });
      setProductIds((u.productAccess ?? []).map((p) => p.product.id));
      setEnvironmentIds((u.environmentAccess ?? []).map((e) => e.environment.id));
      setModuleIds((u.moduleAccess ?? []).map((m) => m.module.id));
      setLoading(false);
    });
  }, [params.id, reset]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await usersApi.update(params.id, { ...values, productIds, environmentIds, moduleIds });
      toast.success("User updated.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update user.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this user? Their historical activity remains in the audit trail.")) return;
    await usersApi.remove(params.id);
    toast.success("User deleted.");
    router.push("/admin/users");
  };

  if (loading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Users", href: "/admin/users" }, { label: user.email }]}
        actions={
          <>
            <Protected module="USERS" action="delete">
              <Button type="button" variant="outline" onClick={onDelete}>
                <Trash2 className="text-destructive" /> Delete
              </Button>
            </Protected>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Save />}
              Save Changes
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>First Name</Label>
              <Input {...register("firstName", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Last Name</Label>
              <Input {...register("lastName", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Employee Code</Label>
              <Input {...register("employeeCode")} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
              <Label>Account Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role & Department</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Department</Label>
              <Controller control={control} name="departmentId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.DEPARTMENT} value={field.value} onChange={field.onChange} allowClear />} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Access</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiMasterSelect typeCode={MASTER_TYPE_CODES.PRODUCT} value={productIds} onChange={setProductIds} />
            <p className="mt-2 text-xs text-muted-foreground">Leave empty to grant visibility across all products.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Environment Access</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiMasterSelect typeCode={MASTER_TYPE_CODES.ENVIRONMENT} value={environmentIds} onChange={setEnvironmentIds} />
            <p className="mt-2 text-xs text-muted-foreground">Leave empty to grant visibility across all environments.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Module Access</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiMasterSelect typeCode={MASTER_TYPE_CODES.MODULE} value={moduleIds} onChange={setModuleIds} />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
