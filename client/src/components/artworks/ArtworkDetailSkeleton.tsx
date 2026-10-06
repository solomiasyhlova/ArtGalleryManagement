import { Skeleton } from '@/components/ui/skeleton';

/** Same layout as `ArtworkDetails`, so the page doesn't jump when the data arrives. */
export function ArtworkDetailSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading artwork…
      </p>
      <div aria-hidden="true" className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-4/3 rounded-lg" />
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <Skeleton className="h-10 w-36" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-72 max-w-full" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
