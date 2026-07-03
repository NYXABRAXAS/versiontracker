import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardContent className="flex items-center gap-3 px-4 py-4">
        {Icon && (
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: accent ? `${accent}1a` : "var(--muted)", color: accent ?? "var(--muted-foreground)" }}
          >
            <Icon className="size-5" />
          </span>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-xl font-semibold leading-tight truncate">{value}</span>
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
