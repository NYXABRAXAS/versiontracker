"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MasterSelect } from "@/components/shared/master-select";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import { usersApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeCode: string;
  roleId: string;
  departmentId?: string;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roles: Role[];
  onCreated: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [revealPassword, setRevealPassword] = React.useState<{ email: string; tempPassword: string } | null>(null);
  const { register, handleSubmit, control, reset } = useForm<FormValues>();

  const close = (v: boolean) => {
    if (!v) setRevealPassword(null);
    onOpenChange(v);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const created = await usersApi.create(values);
      reset();
      if (created.tempPassword) {
        // No SMTP configured (or delivery failed) - this is the only place this password will
        // ever be visible, so keep the dialog open and show it instead of silently closing.
        setRevealPassword({ email: created.email, tempPassword: created.tempPassword });
      } else {
        toast.success("User created. A temporary password has been emailed to them.");
        onOpenChange(false);
      }
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  if (revealPassword) {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User created - email could not be sent</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            No outgoing email is configured for this portal, so <strong>{revealPassword.email}</strong> was not notified. Share this
            temporary password with them directly - it will not be shown again.
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
            <span className="flex-1 select-all">{revealPassword.tempPassword}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(revealPassword.tempPassword);
                toast.success("Copied to clipboard.");
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => close(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>First Name</Label>
            <Input {...register("firstName", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Last Name</Label>
            <Input {...register("lastName", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input type="email" {...register("email", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone</Label>
            <Input {...register("phone")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Employee Code</Label>
            <Input {...register("employeeCode")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Controller
              control={control}
              name="roleId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
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
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
