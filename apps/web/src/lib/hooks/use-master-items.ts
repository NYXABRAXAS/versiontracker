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

/**
 * Master items are cached per type code across the whole app so every MasterSelect dropdown
 * doesn't refetch on every mount. Nothing invalidated that cache when Admin > Masters
 * created/edited/deleted an item elsewhere, so any already-mounted (or previously visited)
 * dropdown for that type kept showing the stale list until a full page reload. Call this after
 * any masters mutation to push the fresh list out to every subscriber immediately.
 */
export function invalidateMasterItems(code: string): void {
  fetchAndCache(code).catch(() => undefined);
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
