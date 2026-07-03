"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMasterItems } from "@/lib/hooks/use-master-items";

export function MasterSelect({
  typeCode,
  value,
  onChange,
  placeholder = "Select…",
  allowClear,
  disabled,
}: {
  typeCode: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}) {
  const { items, loading } = useMasterItems(typeCode);

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => onChange(v === "__clear__" ? undefined : v)}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="__clear__" className="text-muted-foreground">
            None
          </SelectItem>
        )}
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
