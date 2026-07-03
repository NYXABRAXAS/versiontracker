"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterBadge } from "@/components/shared/master-badge";
import { searchApi } from "@/lib/api/resources";
import { fullName } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

function SearchInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebounce(q, 400);
  const [results, setResults] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (debouncedQ.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    searchApi
      .search(debouncedQ)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Global Search" description="Search across versions, change logs, bug fixes and users." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Search" }]} />

      <div className="relative max-w-xl">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input autoFocus className="pl-9" placeholder="Search version, developer, ticket, module…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && <Loader2 className="size-6 animate-spin text-muted-foreground" />}

      {results && !loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Versions ({results.versions.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {results.versions.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
              {results.versions.map((v: any) => (
                <Link key={v.id} href={`/versions/${v.id}`} className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent">
                  <span>
                    <span className="font-medium">{v.versionNumber}</span> — {v.releaseName}
                  </span>
                  <MasterBadge item={v.status} />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Logs ({results.changeLogs.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {results.changeLogs.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
              {results.changeLogs.map((c: any) => (
                <Link key={c.id} href={`/versions/${c.version?.id}`} className="rounded-md border p-2 text-sm hover:bg-accent">
                  {c.title}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bug Fixes ({results.bugFixes.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {results.bugFixes.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
              {results.bugFixes.map((b: any) => (
                <Link key={b.id} href={b.version ? `/versions/${b.version.id}` : "#"} className="rounded-md border p-2 text-sm hover:bg-accent">
                  <span className="font-medium">{b.bugCode}</span>: {b.issue}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users ({results.users.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {results.users.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
              {results.users.map((u: any) => (
                <div key={u.id} className="rounded-md border p-2 text-sm">
                  {fullName(u)} <span className="text-muted-foreground">— {u.role?.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<Loader2 className="size-6 animate-spin text-muted-foreground" />}>
      <SearchInner />
    </React.Suspense>
  );
}
