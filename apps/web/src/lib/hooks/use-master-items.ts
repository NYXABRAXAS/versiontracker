"use client";

import * as React from "react";
import { mastersApi } from "@/lib/api/resources";
import type { MasterItem } from "@/lib/api/types";

const cache = new Map<string, MasterItem[]>();
const listeners = new Map<string, Set<() => void>>();

async function fetchAndCache(code: string): Promise<MasterItem[]> {
  const items = await mastersApi.itemsByCode(code);
  cache.set(code, items);
  listeners.get(code)?.forEach((fn) => fn());
  return items;
}

export function useMasterItems(code: string): { items: MasterItem[]; loading: boolean; refresh: () => void } {
  const [items, setItems] = React.useState<MasterItem[]>(cache.get(code) ?? []);
  const [loading, setLoading] = React.useState(!cache.has(code));

  React.useEffect(() => {
    let mounted = true;
    if (!listeners.has(code)) listeners.set(code, new Set());
    const onUpdate = () => {
      if (mounted) setItems(cache.get(code) ?? []);
    };
    listeners.get(code)!.add(onUpdate);

    if (!cache.has(code)) {
      setLoading(true);
      fetchAndCache(code)
        .catch(() => setItems([]))
        .finally(() => mounted && setLoading(false));
    }

    return () => {
      mounted = false;
      listeners.get(code)?.delete(onUpdate);
    };
  }, [code]);

  const refresh = React.useCallback(() => {
    fetchAndCache(code).catch(() => undefined);
  }, [code]);

  return { items, loading, refresh };
}
