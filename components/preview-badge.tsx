import { Badge } from "@/components/ui/badge";

/** Marks UI that shows sample data and is not backed by the database yet. */
export function PreviewBadge() {
  return (
    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
      Preview — demo data, not connected to the database
    </Badge>
  );
}
