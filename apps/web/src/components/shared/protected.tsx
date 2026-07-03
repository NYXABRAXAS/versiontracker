"use client";

import { useAuth } from "@/lib/auth-context";

export function Protected({
  module,
  action,
  fallback = null,
  children,
}: {
  module: string;
  action: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, action)) return <>{fallback}</>;
  return <>{children}</>;
}
