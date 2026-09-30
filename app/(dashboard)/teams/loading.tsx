import { Skeleton } from "@/components/ui/skeleton";

export default function TeamsLoading() {
  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
