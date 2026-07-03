"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/resources";
import type { User } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  permissions: Set<string>;
  hasPermission: (module: string, action: string) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const load = React.useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch (err) {
      setUser(null);
      if (!(err instanceof ApiError) || err.status !== 401) {
        // non-auth errors are logged but do not block the login screen
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const permissions = React.useMemo(() => new Set(user?.permissions ?? []), [user]);
  const hasPermission = React.useCallback((module: string, action: string) => permissions.has(`${module}:${action}`), [permissions]);

  return (
    <AuthContext.Provider value={{ user, loading, permissions, hasPermission, refresh: load, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
