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
import { changeLogsApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";

interface FormValues {
  title: string;
  description: string;
  moduleId?: string;
  screenName: string;
  oldBehaviour: string;
  newBehaviour: string;
  reason: string;
  businessRequirement: string;
  ticketNumber: string;
  developerId?: string;
  testerId?: string;
  reviewerId?: string;
  statusId?: string;
}

export function AddChangeLogDialog({ versionId, onCreated }: { versionId: string; onCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { register, handleSubmit, control, reset } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await changeLogsApi.create({ ...values, versionId, date: new Date().toISOString() });
      toast.success("Change log added.");
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to add change log.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Add Change Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Change Log Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input {...register("title", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={2} {...register("description")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Module</Label>
            <Controller control={control} name="moduleId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.MODULE} value={field.value} onChange={field.onChange} allowClear />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Screen Name</Label>
            <Input {...register("screenName")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Old Behaviour</Label>
            <Textarea rows={2} {...register("oldBehaviour")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>New Behaviour</Label>
            <Textarea rows={2} {...register("newBehaviour")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Input {...register("reason")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Business Requirement</Label>
            <Input {...register("businessRequirement")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Ticket Number</Label>
            <Input {...register("ticketNumber")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Controller control={control} name="statusId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.STATUS} value={field.value} onChange={field.onChange} allowClear />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Developer</Label>
            <Controller control={control} name="developerId" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tester</Label>
            <Controller control={control} name="testerId" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reviewer</Label>
            <Controller control={control} name="reviewerId" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Save Change Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
