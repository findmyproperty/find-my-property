import { Skeleton } from "@/components/ui/skeleton";

export function ListingRowSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="aspect-[16/10] w-full md:aspect-[4/3] md:w-48 md:min-h-[144px]" />
        <div className="flex flex-1 flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4 max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-3 w-2/3 max-w-xs" />
          </div>
          <div className="hidden w-44 flex-col items-end gap-2 md:flex">
            <Skeleton className="h-7 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="size-8" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-border p-3 md:hidden">
        <Skeleton className="h-11 rounded-md" />
        <Skeleton className="h-11 rounded-md" />
        <Skeleton className="h-11 rounded-md" />
      </div>
    </div>
  );
}

type ListingGridSkeletonProps = { rows?: number };

export function ListingGridSkeleton({ rows = 4 }: ListingGridSkeletonProps) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <ListingRowSkeleton key={i} />
      ))}
    </div>
  );
}
