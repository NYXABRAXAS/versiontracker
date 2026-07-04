"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user && !user.mustChangePassword) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        LOS Version Portal
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="text-center text-xs text-muted-foreground max-w-md">
        Centralized release tracking for the Loan Origination System across Development, QA, UAT and Production.
      </p>
    </div>
  );
}
