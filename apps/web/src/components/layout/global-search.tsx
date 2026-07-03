"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = React.useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  return (
    <form onSubmit={onSubmit} className="relative hidden sm:block w-full max-w-sm">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search versions, tickets, developers…"
        className="pl-8"
      />
    </form>
  );
}
