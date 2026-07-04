"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MasterSelect } from "@/components/shared/master-select";
import { UserSelect } from "@/components/shared/user-select";
import { MASTER_TYPE_CODES } from "@/lib/constants";
import { versionsApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import type { Version } from "@/lib/api/types";

const schema = z.object({
  versionNumber: z.string().min(1, "Required"),
  releaseName: z.string().min(1, "Required"),
  releaseTitle: z.string().optional(),
  releaseDescription: z.string().optional(),
  releaseDate: z.string().optional(),
  deploymentDate: z.string().optional(),
  releaseTypeId: z.string().min(1, "Required"),
  environmentId: z.string().min(1, "Required"),
  productId: z.string().min(1, "Required"),
  moduleId: z.string().optional(),
  priorityId: z.string().optional(),
  severityId: z.string().optional(),
  statusId: z.string().min(1, "Required"),
  clientId: z.string().optional(),
  developerId: z.string().optional(),
  testerId: z.string().optional(),
  approvedById: z.string().optional(),
  gitCommitId: z.string().optional(),
  gitBranch: z.string().optional(),
  buildNumber: z.string().optional(),
  sprintNumber: z.string().optional(),
  ticketNumber: z.string().optional(),
  estimatedHours: z.union([z.string(), z.number()]).optional(),
  actualHours: z.union([z.string(), z.number()]).optional(),
  deploymentWindowStart: z.string().optional(),
  deploymentWindowEnd: z.string().optional(),
  downtimeMinutes: z.union([z.string(), z.number()]).optional(),
  rollbackAvailable: z.boolean().optional(),
  deploymentNotes: z.string().optional(),
  databaseChanges: z.string().optional(),
  apiChanges: z.string().optional(),
  configurationChanges: z.string().optional(),
  breakingChanges: z.boolean().optional(),
  backwardCompatible: z.boolean().optional(),
  releaseNotes: z.string().optional(),
  remarks: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function toDateInput(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const TAB_ORDER = ["basic", "classification", "people", "git", "deployment", "changes"] as const;

const FIELD_TAB: Record<string, (typeof TAB_ORDER)[number]> = {
  versionNumber: "basic",
  releaseName: "basic",
  releaseTitle: "basic",
  releaseDescription: "basic",
  releaseDate: "basic",
  deploymentDate: "basic",
  productId: "classification",
  environmentId: "classification",
  releaseTypeId: "classification",
  statusId: "classification",
  moduleId: "classification",
  clientId: "classification",
  priorityId: "classification",
  severityId: "classification",
  developerId: "people",
  testerId: "people",
  approvedById: "people",
  sprintNumber: "people",
  ticketNumber: "people",
  estimatedHours: "people",
  actualHours: "people",
  gitCommitId: "git",
  gitBranch: "git",
  buildNumber: "git",
  deploymentWindowStart: "deployment",
  deploymentWindowEnd: "deployment",
  downtimeMinutes: "deployment",
  rollbackAvailable: "deployment",
  deploymentNotes: "deployment",
  databaseChanges: "changes",
  apiChanges: "changes",
  configurationChanges: "changes",
  breakingChanges: "changes",
  backwardCompatible: "changes",
  releaseNotes: "changes",
  remarks: "changes",
};

const TAB_LABEL: Record<(typeof TAB_ORDER)[number], string> = {
  basic: "Basic Info",
  classification: "Classification",
  people: "People",
  git: "Git & Build",
  deployment: "Deployment",
  changes: "Changes & Notes",
};

export function VersionForm({ initial }: { initial?: Version }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<(typeof TAB_ORDER)[number]>("basic");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? ({
          ...initial,
          releaseDate: toDateInput(initial.releaseDate),
          deploymentDate: toDateInput(initial.deploymentDate),
          deploymentWindowStart: toDateInput(initial.deploymentWindowStart),
          deploymentWindowEnd: toDateInput(initial.deploymentWindowEnd),
          moduleId: initial.moduleId ?? undefined,
          priorityId: initial.priorityId ?? undefined,
          severityId: initial.severityId ?? undefined,
          clientId: initial.clientId ?? undefined,
          developerId: initial.developerId ?? undefined,
          testerId: initial.testerId ?? undefined,
          approvedById: initial.approvedById ?? undefined,
        } as unknown as FormValues)
      : {
          productId: "",
          environmentId: "",
          releaseTypeId: "",
          statusId: "",
          moduleId: "",
          clientId: "",
          priorityId: "",
          severityId: "",
          developerId: "",
          testerId: "",
          approvedById: "",
          rollbackAvailable: false,
          breakingChanges: false,
          backwardCompatible: true,
        },
  });

  const onInvalid = (errors: typeof form.formState.errors) => {
    const firstField = Object.keys(errors)[0];
    const tab = firstField ? FIELD_TAB[firstField] : undefined;
    if (tab && tab !== activeTab) setActiveTab(tab);
    toast.error(tab ? `Check the "${TAB_LABEL[tab]}" tab - some required fields are missing.` : "Please fix the highlighted fields.");
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
        actualHours: values.actualHours ? Number(values.actualHours) : undefined,
        downtimeMinutes: values.downtimeMinutes ? Number(values.downtimeMinutes) : undefined,
      };
      if (initial) {
        await versionsApi.update(initial.id, payload);
        toast.success("Version updated.");
        router.push(`/versions/${initial.id}`);
      } else {
        const created = await versionsApi.create(payload);
        toast.success("Version created.");
        router.push(`/versions/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to save version.");
    } finally {
      setSubmitting(false);
    }
  };

  const err = form.formState.errors;
  const tabHasError = (tab: (typeof TAB_ORDER)[number]) => Object.keys(err).some((field) => FIELD_TAB[field] === tab);

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TAB_ORDER)[number])}>
        <TabsList className="flex-wrap h-auto">
          {TAB_ORDER.map((tab) => (
            <TabsTrigger key={tab} value={tab} className={tabHasError(tab) ? "text-destructive" : undefined}>
              {TAB_LABEL[tab]}
              {tabHasError(tab) && " *"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Version Number" error={err.versionNumber?.message}>
                <Input placeholder="e.g. 2.4.0" {...form.register("versionNumber")} />
              </Field>
              <Field label="Release Name" error={err.releaseName?.message}>
                <Input {...form.register("releaseName")} />
              </Field>
              <Field label="Release Title" className="sm:col-span-2">
                <Input {...form.register("releaseTitle")} />
              </Field>
              <Field label="Release Description" className="sm:col-span-2">
                <Textarea rows={3} {...form.register("releaseDescription")} />
              </Field>
              <Field label="Release Date">
                <Input type="date" {...form.register("releaseDate")} />
              </Field>
              <Field label="Deployment Date">
                <Input type="date" {...form.register("deploymentDate")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classification">
          <Card>
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Product" error={err.productId?.message}>
                <Controller control={form.control} name="productId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.PRODUCT} value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Environment" error={err.environmentId?.message}>
                <Controller control={form.control} name="environmentId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.ENVIRONMENT} value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Release Type" error={err.releaseTypeId?.message}>
                <Controller control={form.control} name="releaseTypeId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.RELEASE_TYPE} value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Status" error={err.statusId?.message}>
                <Controller control={form.control} name="statusId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.STATUS} value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Module">
                <Controller control={form.control} name="moduleId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.MODULE} value={field.value} onChange={field.onChange} allowClear />} />
              </Field>
              <Field label="Client">
                <Controller control={form.control} name="clientId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.CLIENT} value={field.value} onChange={field.onChange} allowClear />} />
              </Field>
              <Field label="Priority">
                <Controller control={form.control} name="priorityId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.PRIORITY} value={field.value} onChange={field.onChange} allowClear />} />
              </Field>
              <Field label="Severity">
                <Controller control={form.control} name="severityId" render={({ field }) => <MasterSelect typeCode={MASTER_TYPE_CODES.SEVERITY} value={field.value} onChange={field.onChange} allowClear />} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="people">
          <Card>
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Developer">
                <Controller control={form.control} name="developerId" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Tester">
                <Controller control={form.control} name="testerId" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Approved By">
                <Controller control={form.control} name="approvedById" render={({ field }) => <UserSelect value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Sprint Number">
                <Input {...form.register("sprintNumber")} />
              </Field>
              <Field label="Ticket Number">
                <Input {...form.register("ticketNumber")} />
              </Field>
              <Field label="Estimated Hours">
                <Input type="number" step="0.5" {...form.register("estimatedHours")} />
              </Field>
              <Field label="Actual Hours">
                <Input type="number" step="0.5" {...form.register("actualHours")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="git">
          <Card>
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Git Commit ID">
                <Input {...form.register("gitCommitId")} />
              </Field>
              <Field label="Git Branch">
                <Input {...form.register("gitBranch")} />
              </Field>
              <Field label="Build Number">
                <Input {...form.register("buildNumber")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Deployment Window Start">
                <Input type="date" {...form.register("deploymentWindowStart")} />
              </Field>
              <Field label="Deployment Window End">
                <Input type="date" {...form.register("deploymentWindowEnd")} />
              </Field>
              <Field label="Downtime (minutes)">
                <Input type="number" {...form.register("downtimeMinutes")} />
              </Field>
              <div className="flex items-center gap-2 pt-6">
                <Controller control={form.control} name="rollbackAvailable" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
                <Label>Rollback Available</Label>
              </div>
              <Field label="Deployment Notes" className="sm:col-span-2">
                <Textarea rows={3} {...form.register("deploymentNotes")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <Card>
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Database Changes" className="sm:col-span-2">
                <Textarea rows={2} {...form.register("databaseChanges")} />
              </Field>
              <Field label="API Changes" className="sm:col-span-2">
                <Textarea rows={2} {...form.register("apiChanges")} />
              </Field>
              <Field label="Configuration Changes" className="sm:col-span-2">
                <Textarea rows={2} {...form.register("configurationChanges")} />
              </Field>
              <div className="flex items-center gap-2">
                <Controller control={form.control} name="breakingChanges" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
                <Label>Breaking Changes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller control={form.control} name="backwardCompatible" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
                <Label>Backward Compatible</Label>
              </div>
              <Field label="Release Notes" className="sm:col-span-2">
                <Textarea rows={4} {...form.register("releaseNotes")} />
              </Field>
              <Field label="Remarks" className="sm:col-span-2">
                <Textarea rows={2} {...form.register("remarks")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <Save />}
          {initial ? "Save Changes" : "Create Version"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
