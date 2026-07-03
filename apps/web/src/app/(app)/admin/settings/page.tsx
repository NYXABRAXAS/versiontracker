"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Database, HardDriveDownload, Loader2, Play, Save, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { settingsApi, backupApi, healthApi } from "@/lib/api/resources";
import { apiUrl, uploadUrl, ApiError } from "@/lib/api/client";
import type { SystemSettings } from "@/lib/api/types";
import { formatBytes, formatDateTime } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const { register, handleSubmit, reset, watch, setValue } = useForm<any>();

  const load = React.useCallback(() => {
    setLoading(true);
    settingsApi
      .get()
      .then((s) => {
        setSettings(s);
        reset(s);
      })
      .finally(() => setLoading(false));
  }, [reset]);

  React.useEffect(() => load(), [load]);

  const onSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const updated = await settingsApi.update(values);
      setSettings(updated);
      toast.success("Settings updated.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update settings.");
    } finally {
      setSubmitting(false);
    }
  };

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      await settingsApi.uploadLogo(file);
      toast.success("Logo updated.");
      load();
    } catch {
      toast.error("Unable to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="System Settings" description="Company profile, SMTP, password policy and application configuration." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Settings" }]} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
          <TabsTrigger value="security">Security & Policy</TabsTrigger>
          <TabsTrigger value="backup">Backups</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Company Name</Label>
                  <Input {...register("companyName")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Company Email</Label>
                  <Input type="email" {...register("companyEmail")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Company Phone</Label>
                  <Input {...register("companyPhone")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Company Address</Label>
                  <Input {...register("companyAddress")} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-3">
                    {settings.companyLogoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={uploadUrl(settings.companyLogoUrl)} alt="Logo" className="h-10 rounded border bg-white p-1" />
                    )}
                    <Button type="button" variant="outline" size="sm" disabled={logoUploading} asChild>
                      <label>
                        {logoUploading ? <Loader2 className="animate-spin" /> : <Upload />}
                        Upload Logo
                        <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                      </label>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>SMTP Host</Label>
                  <Input {...register("smtpHost")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>SMTP Port</Label>
                  <Input type="number" {...register("smtpPort")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>SMTP User</Label>
                  <Input {...register("smtpUser")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>From Address</Label>
                  <Input {...register("smtpFrom")} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={watch("smtpSecure")} onCheckedChange={(v) => setValue("smtpSecure", v)} />
                  <Label>Use TLS/SSL</Label>
                </div>
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  {settings.smtpPasswordSet ? "An SMTP password is configured." : "No SMTP password configured."} The actual sending credential
                  is set via the <code>SMTP_PASSWORD</code> environment variable on the server for security and is never stored or displayed in the browser.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password Policy & Session</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Minimum Password Length</Label>
                  <Input type="number" {...register("passwordMinLength")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Password Expiry (days, optional)</Label>
                  <Input type="number" {...register("passwordExpiryDays")} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={watch("passwordRequireUppercase")} onCheckedChange={(v) => setValue("passwordRequireUppercase", v)} />
                  <Label>Require Uppercase</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={watch("passwordRequireNumber")} onCheckedChange={(v) => setValue("passwordRequireNumber", v)} />
                  <Label>Require Number</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={watch("passwordRequireSymbol")} onCheckedChange={(v) => setValue("passwordRequireSymbol", v)} />
                  <Label>Require Symbol</Label>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" {...register("sessionTimeoutMinutes")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Max Upload Size (MB)</Label>
                  <Input type="number" {...register("maxUploadSizeMb")} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Save />}
              Save Settings
            </Button>
          </div>
        </form>

        <TabsContent value="backup">
          <BackupPanel />
        </TabsContent>
        <TabsContent value="health">
          <HealthPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BackupPanel() {
  const [history, setHistory] = React.useState<any[]>([]);
  const [running, setRunning] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    backupApi
      .list()
      .then((h: any) => setHistory(h))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => load(), [load]);

  const onRun = async () => {
    setRunning(true);
    try {
      await backupApi.run();
      toast.success("Backup completed.");
      load();
    } catch {
      toast.error("Backup failed. Check that pg_dump is available on the server.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Database Backups</CardTitle>
        <Button size="sm" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="animate-spin" /> : <Play />}
          Run Backup Now
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Started</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No backups yet. Scheduled backups run automatically, or trigger one now.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.fileName}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === "SUCCESS" ? "success" : b.status === "RUNNING" ? "warning" : "destructive"}>{b.status}</Badge>
                    </TableCell>
                    <TableCell>{formatBytes(b.sizeBytes)}</TableCell>
                    <TableCell>{formatDateTime(b.startedAt)}</TableCell>
                    <TableCell>
                      {b.status === "SUCCESS" && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={apiUrl(backupApi.downloadUrl(b.id))}>
                            <HardDriveDownload />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Restoring a backup is a destructive operation and is intentionally not exposed as a one-click button here — see docs/BACKUP_RESTORE.md for the
          guided restore procedure.
        </p>
      </CardContent>
    </Card>
  );
}

function HealthPanel() {
  const [health, setHealth] = React.useState<any>(null);

  React.useEffect(() => {
    healthApi.get().then(setHealth);
  }, []);

  if (!health) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4" /> System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">API Status</span>
          <Badge variant={health.status === "ok" ? "success" : "destructive"} className="w-fit">
            {health.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Database</span>
          <Badge variant={health.database === "ok" ? "success" : "destructive"} className="w-fit">
            {health.database.toUpperCase()}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Uptime</span>
          <span>{Math.floor(health.uptimeSeconds / 60)} minutes</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Memory Usage</span>
          <span>
            {health.memory.usedMb} MB used / {health.memory.freeSystemMb} MB free of {health.memory.totalSystemMb} MB
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
