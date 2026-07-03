"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const user = await authApi.login(values.email, values.password, values.rememberMe);
      await refresh();
      toast.success(`Welcome back, ${user.firstName}!`);
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(searchParams.get("next") || "/dashboard");
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sign in to your account</CardTitle>
        <CardDescription>Use your company email and password to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" placeholder="you@company.com" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="rememberMe" onCheckedChange={(v) => form.setValue("rememberMe", !!v)} />
            <Label htmlFor="rememberMe" className="font-normal text-sm">
              Remember me for 30 days
            </Label>
          </div>
          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting && <Loader2 className="animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
