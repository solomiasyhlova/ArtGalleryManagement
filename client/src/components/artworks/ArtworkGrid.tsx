import type { Artwork } from '@art-gallery/shared';
import { CircleAlert, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/form-errors';
import { ArtworkCard } from './ArtworkCard';
import { ArtworkCardSkeleton } from './ArtworkCardSkeleton';

const SKELETON_COUNT = 8;

interface ArtworkGridProps {
  /** `undefined` until the first successful load. */
  artworks: Artwork[] | undefined;
  error: Error | null;
  onRetry: () => void;
  isRetrying: boolean;
}

/** Shows the artworks, or the loading, empty or error state. Data already loaded wins over a later error. */
export function ArtworkGrid({ artworks, error, onRetry, isRetrying }: ArtworkGridProps) {
  if (artworks) {
    if (artworks.length === 0) {
      return <p className="py-16 text-center text-muted-foreground">No artworks yet</p>;
    }
    return (
      <GridList>
        {artworks.map((artwork) => (
          <li key={artwork.id}>
            <ArtworkCard artwork={artwork} />
          </li>
        ))}
      </GridList>
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

function GridList({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </ul>
  );
}
