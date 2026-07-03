"use client";

import * as React from "react";
import { usersApi } from "@/lib/api/resources";
import type { User } from "@/lib/api/types";

let cache: User[] | null = null;
let inflight: Promise<User[]> | null = null;

async function loadUsers(): Promise<User[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = usersApi.list({ pageSize: 200, isActive: "true" }).then((res) => {
      cache = res.data;
      return cache;
    });
  }
  return inflight;
}

export function useUsers(): { users: User[]; loading: boolean } {
  const [users, setUsers] = React.useState<User[]>(cache ?? []);
  const [loading, setLoading] = React.useState(!cache);

  React.useEffect(() => {
    let mounted = true;
    if (!cache) {
      loadUsers()
        .then((u) => mounted && setUsers(u))
        .finally(() => mounted && setLoading(false));
    }
    return () => {
      mounted = false;
    };
  }, []);

  return { users, loading };
}
