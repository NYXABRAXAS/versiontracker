"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { newPassword: "", confirmPassword: "" } });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await authApi.resetPassword(params.token, values.newPassword);
      toast.success("Password reset successfully. Please sign in.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Set a new password</CardTitle>
        <CardDescription>Choose a strong password you haven&apos;t used before.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" {...form.register("newPassword")} />
            {form.formState.errors.newPassword && <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
            {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Reset Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
