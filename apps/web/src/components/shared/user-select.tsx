"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/lib/hooks/use-users";

export function UserSelect({
  value,
  onChange,
  placeholder = "Select…",
  allowClear = true,
  disabled,
}: {
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}) {
  const { users, loading } = useUsers();

  return (
    <Select value={value ?? undefined} onValueChange={(v) => onChange(v === "__clear__" ? undefined : v)} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="__clear__" className="text-muted-foreground">
            Unassigned
          </SelectItem>
        )}
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.firstName} {u.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
