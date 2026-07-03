"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { VersionForm } from "@/components/versions/version-form";
import { versionsApi } from "@/lib/api/resources";
import type { Version } from "@/lib/api/types";

export default function EditVersionPage() {
  const params = useParams<{ id: string }>();
  const [version, setVersion] = React.useState<Version | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    versionsApi.get(params.id).then(setVersion).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!version) return <p className="text-sm text-muted-foreground">Version not found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Edit ${version.releaseName}`}
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Versions", href: "/versions" },
          { label: version.versionNumber, href: `/versions/${version.id}` },
          { label: "Edit" },
        ]}
      />
      <VersionForm initial={version} />
    </div>
  );
}
