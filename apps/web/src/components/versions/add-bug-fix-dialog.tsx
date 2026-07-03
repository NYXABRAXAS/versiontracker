"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MasterSelect } from "@/components/shared/master-select";
import { UserSelect } from "@/components/shared/user-select";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import { bugFixesApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";

interface FormValues {
  issue: string;
  rootCause: string;
  ticketNumber: string;
  moduleId?: string;
  environmentId?: string;
  statusId?: string;
  severityId?: string;
  priorityId?: string;
  fixedById?: string;
  testedById?: string;
  remarks: string;
}

export function AddBugFixDialog({ versionId, onCreated }: { versionId: string; onCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { register, handleSubmit, control, reset } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await bugFixesApi.create({ ...values, versionId });
      toast.success("Bug fix logged.");
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to log bug fix.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Log Bug Fix
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Log Bug Fix</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Issue</Label>
            <Textarea rows={2} {...register("issue", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Root Cause</Label>
            <Textarea rows={2} {...register("rootCause")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Module</Label>
            <Controller control={control} name="moduleId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.MODULE} value={field.value} onChange={field.onChange} allowClear />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Environment</Label>
            <Controller control={control} name="environmentId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.ENVIRONMENT} value={field.value} onChange={field.onChange} allowClear />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Severity</Label>
            <Controller control={control} name="severityId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.SEVERITY} value={field.value} onChange={field.onChange} allowClear />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Controller control={control} name="priorityId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.PRIORITY} value={field.value} onChange={field.onChange} allowClear />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Controller control={control} name="statusId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.STATUS} value={field.value} onChange={field.onChange} allowClear />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Ticket Number</Label>
            <Input {...register("ticketNumber")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fixed By</Label>
            <Controller control={control} name="fixedById" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tested By</Label>
            <Controller control={control} name="testedById" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Remarks</Label>
            <Textarea rows={2} {...register("remarks")} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Save Bug Fix
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
