"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useMasterItems } from "@/lib/hooks/use-master-items";

export function MultiMasterSelect({
  typeCode,
  value,
  onChange,
}: {
  typeCode: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { items, loading } = useMasterItems(typeCode);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (loading) return <p className="text-xs text-muted-foreground">Loading…</p>;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-sm">
          <Checkbox checked={value.includes(item.id)} onCheckedChange={() => toggle(item.id)} />
          {item.name}
        </label>
      ))}
      {items.length === 0 && <span className="text-xs text-muted-foreground">No items available.</span>}
    </div>
  );
}
