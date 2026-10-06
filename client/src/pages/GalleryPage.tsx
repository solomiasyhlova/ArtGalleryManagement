import type { Artwork, Paginated } from '@art-gallery/shared';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { ArtworkCardMenu } from '@/components/artworks/ArtworkCardMenu';
import { ArtworkFormDialog } from '@/components/artworks/ArtworkFormDialog';
import { ArtworkGrid } from '@/components/artworks/ArtworkGrid';
import { ArtworkToolbar } from '@/components/artworks/ArtworkToolbar';
import { DeleteArtworkDialog } from '@/components/artworks/DeleteArtworkDialog';
import { GalleryPagination } from '@/components/artworks/GalleryPagination';
import { Button } from '@/components/ui/button';
import { useArtworks } from '@/hooks/useArtworks';
import { useAuth } from '@/hooks/useAuth';
import { useGalleryParams } from '@/hooks/useGalleryParams';

/** The artwork stays set while a dialog closes, so its content doesn't change mid-animation. */
interface DialogState {
  open: boolean;
  artwork?: Artwork;
}

interface FormDialogState extends DialogState {
  /** A new key per opening, so the form always starts fresh (even during the exit animation). */
  key: number;
}

/** A page past the last one, e.g. from an edited URL. An empty result (`totalPages: 0`) never is. */
function isPastLastPage({ meta }: Paginated<Artwork>): boolean {
  return meta.totalPages > 0 && meta.page > meta.totalPages;
}

export function GalleryPage() {
  const { params, hasFilters, setFilters, setArtist, clearFilters, pageSearch } =
    useGalleryParams();
  const { data, error, refetch, isFetching, isPlaceholderData } = useArtworks(params);
  const { isAdmin } = useAuth();
  const gridRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [formDialog, setFormDialog] = useState<FormDialogState>({ open: false, key: 0 });
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({ open: false });

  const openForm = (artwork?: Artwork) =>
    setFormDialog((state) => ({ open: true, artwork, key: state.key + 1 }));

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
      {/* Focusable from script only: where focus lands after a dialog whose card was deleted. */}
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold outline-none">
        Explore Our Collection
      </h1>
      <ArtworkToolbar
        filters={params}
        hasFilters={hasFilters}
        onFiltersChange={setFilters}
        onArtistChange={setArtist}
        onClear={clearFilters}
        actions={
          isAdmin && (
            <Button className="w-full sm:w-auto" onClick={() => openForm()}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Add New Artwork
            </Button>
          )
        }
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
          cardActions={
            isAdmin
              ? (artwork) => (
                  <ArtworkCardMenu
                    artwork={artwork}
                    onEdit={openForm}
                    onDelete={(target) => setDeleteDialog({ open: true, artwork: target })}
                  />
                )
              : undefined
          }
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
      {isAdmin && (
        <>
          <ArtworkFormDialog
            key={formDialog.key}
            open={formDialog.open}
            onOpenChange={(open) => setFormDialog((state) => ({ ...state, open }))}
            artwork={formDialog.artwork}
            returnFocusFallback={headingRef}
          />
          <DeleteArtworkDialog
            open={deleteDialog.open}
            onOpenChange={(open) => setDeleteDialog((state) => ({ ...state, open }))}
            artwork={deleteDialog.artwork}
            returnFocusFallback={headingRef}
          />
        </>
      )}
    </section>
  );
}
