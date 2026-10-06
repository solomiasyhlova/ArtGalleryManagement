import type { Artwork } from '@art-gallery/shared';
import { CircleAlert, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/form-errors';
import { cn } from '@/lib/utils';
import { ArtworkCard } from './ArtworkCard';
import { ArtworkCardSkeleton } from './ArtworkCardSkeleton';

const SKELETON_COUNT = 8;

interface ArtworkGridProps {
  /** `undefined` until the first successful load. */
  artworks: Artwork[] | undefined;
  /** The artworks are the previous result while new filters or a new page load. */
  isStale: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  error: Error | null;
  onRetry: () => void;
  isRetrying: boolean;
  /** Per-card controls, e.g. the admin menu. */
  cardActions?: (artwork: Artwork) => ReactNode;
}

/** Shows the artworks, or the loading, empty or error state. Data already loaded wins over a later error. */
export function ArtworkGrid({
  artworks,
  isStale,
  hasFilters,
  onClearFilters,
  error,
  onRetry,
  isRetrying,
  cardActions,
}: ArtworkGridProps) {
  if (artworks) {
    return (
      <div
        aria-busy={isStale}
        className={cn('transition-opacity duration-150', isStale && 'opacity-60')}
      >
        {artworks.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
        ) : (
          <GridList>
            {artworks.map((artwork) => (
              <li key={artwork.id}>
                <ArtworkCard artwork={artwork} actions={cardActions?.(artwork)} />
              </li>
            ))}
          </GridList>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
        <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
        <p className="font-medium">Couldn't load the artworks</p>
        <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
        <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? <Spinner aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading artworks…
      </p>
      <GridList>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index} aria-hidden="true">
            <ArtworkCardSkeleton />
          </li>
        ))}
      </GridList>
    </div>
  );
}

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  if (!hasFilters) {
    return <p className="py-16 text-center text-muted-foreground">No artworks yet</p>;
  }
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-muted-foreground">No artworks match your filters</p>
      <Button variant="outline" onClick={onClearFilters}>
        Clear filters
      </Button>
    </div>
  );
}

function GridList({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </ul>
  );
}
