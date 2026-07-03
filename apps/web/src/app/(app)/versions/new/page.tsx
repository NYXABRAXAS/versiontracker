import { PageHeader } from "@/components/shared/page-header";
import { VersionForm } from "@/components/versions/version-form";

export default function NewVersionPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create Version"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Versions", href: "/versions" }, { label: "New" }]}
      />
      <VersionForm />
    </div>
  );
}
