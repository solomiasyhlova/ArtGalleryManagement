import type { Artwork, Paginated } from '@art-gallery/shared';
import { useRef } from 'react';
import { Navigate } from 'react-router';
import { ArtworkGrid } from '@/components/artworks/ArtworkGrid';
import { ArtworkToolbar } from '@/components/artworks/ArtworkToolbar';
import { GalleryPagination } from '@/components/artworks/GalleryPagination';
import { useArtworks } from '@/hooks/useArtworks';
import { useGalleryParams } from '@/hooks/useGalleryParams';

/** A page past the last one, e.g. from an edited URL. An empty result (`totalPages: 0`) never is. */
function isPastLastPage({ meta }: Paginated<Artwork>): boolean {
  return meta.totalPages > 0 && meta.page > meta.totalPages;
}

export function GalleryPage() {
  const { params, hasFilters, setFilters, setArtist, clearFilters, pageSearch } =
    useGalleryParams();
  const { data, error, refetch, isFetching, isPlaceholderData } = useArtworks(params);
  const gridRef = useRef<HTMLDivElement>(null);

  // A page past the end is shown as loading while it redirects to the last page.
  const result = data && !isPastLastPage(data) ? data : undefined;

  function scrollToGrid() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gridRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  return (
    <section className="space-y-6">
      {data && !isPlaceholderData && isPastLastPage(data) && (
        <Navigate replace to={{ search: pageSearch(data.meta.totalPages) }} />
      )}
      <h1 className="text-3xl font-semibold">Explore Our Collection</h1>
      <ArtworkToolbar
        filters={params}
        hasFilters={hasFilters}
        onFiltersChange={setFilters}
        onArtistChange={setArtist}
        onClear={clearFilters}
      />
      <div ref={gridRef} className="scroll-mt-6 space-y-8">
        <ArtworkGrid
          artworks={result?.data}
          isStale={isPlaceholderData}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        {result && (
          <GalleryPagination
            page={params.page}
            totalPages={result.meta.totalPages}
            pageSearch={pageSearch}
            onNavigate={scrollToGrid}
          />
        )}
      </div>
    </section>
  );
}
