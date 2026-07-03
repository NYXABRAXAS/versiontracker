"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MasterSelect } from "@/components/shared/master-select";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import { deploymentsApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";

interface FormValues {
  environmentId: string;
  durationMinutes?: string;
  result: string;
  rollback: boolean;
  remarks: string;
}

const RESULTS = ["SUCCESS", "FAILED", "PARTIAL", "ROLLED_BACK"];

export function AddDeploymentDialog({ versionId, onCreated }: { versionId: string; onCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { register, handleSubmit, control, reset } = useForm<FormValues>({ defaultValues: { result: "SUCCESS", rollback: false } });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await deploymentsApi.create({ ...values, versionId, durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined });
      toast.success("Deployment recorded.");
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to record deployment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Rocket /> Record Deployment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Deployment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Environment</Label>
            <Controller control={control} name="environmentId" rules={{ required: true }} render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.ENVIRONMENT} value={field.value} onChange={field.onChange as any} />} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Result</Label>
              <Controller
                control={control}
                name="result"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESULTS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" {...register("durationMinutes")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Controller control={control} name="rollback" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            <Label>This was a rollback deployment</Label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Remarks</Label>
            <Textarea rows={2} {...register("remarks")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Save Deployment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
