import { Skeleton } from '@/components/ui/skeleton';

/** Same box as `ArtworkCard`, so the grid doesn't jump when the data arrives. */
export function ArtworkCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-border bg-card shadow-sm">
      <Skeleton className="m-3 mb-0 aspect-4/3" />
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-14" />
        </div>
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-4xl" />
          <Skeleton className="h-5 w-20 rounded-4xl" />
        </div>
      </div>
    </div>
  );
}
