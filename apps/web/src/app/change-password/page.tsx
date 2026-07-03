"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading, refresh, logout } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  React.useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed. Please sign in again.");
      await logout();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        LOS Version Portal
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">
            {user?.mustChangePassword ? "You must set a new password" : "Change your password"}
          </CardTitle>
          <CardDescription>
            {user?.mustChangePassword
              ? "For security, you need to set a new password before continuing."
              : "Update your account password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...form.register("currentPassword")} />
              {form.formState.errors.currentPassword && <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...form.register("newPassword")} />
              {form.formState.errors.newPassword && <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
