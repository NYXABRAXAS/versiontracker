import { Badge } from "@/components/ui/badge";
import type { MasterItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function MasterBadge({ item, className }: { item?: MasterItem | null; className?: string }) {
  if (!item) return <span className="text-muted-foreground text-xs">-</span>;
  return (
    <Badge
      variant="outline"
      className={cn("border", className)}
      style={
        item.colorHex
          ? { backgroundColor: `${item.colorHex}1a`, borderColor: `${item.colorHex}55`, color: item.colorHex }
          : undefined
      }
    >
      {item.name}
    </Badge>
  );
}
