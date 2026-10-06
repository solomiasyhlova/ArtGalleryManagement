import type { Artwork } from '@art-gallery/shared';
import { CircleAlert, ImageOff, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArtworkDetailSkeleton } from '@/components/artworks/ArtworkDetailSkeleton';
import { ArtworkDetails } from '@/components/artworks/ArtworkDetails';
import { ArtworkFormDialog } from '@/components/artworks/ArtworkFormDialog';
import { BackToGalleryLink } from '@/components/artworks/BackToGalleryLink';
import { DeleteArtworkDialog } from '@/components/artworks/DeleteArtworkDialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useArtwork } from '@/hooks/useArtwork';
import { isNotFound } from '@/hooks/useArtworkMutations';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/form-errors';

const APP_NAME = 'ArtGalleryManager';

export function ArtworkDetailPage() {
  const { id } = useParams();

  return (
    <section className="space-y-6">
      <BackToGalleryLink />
      {/* Keyed by id, so dialog state never carries over to another artwork. */}
      {id ? <ArtworkDetail key={id} id={id} /> : <ArtworkNotFound />}
    </section>
  );
}

/** A 404 wins over cached data (the artwork was deleted meanwhile); other errors don't. */
function ArtworkDetail({ id }: { id: string }) {
  const { data: artwork, error, refetch, isFetching } = useArtwork(id);

  if (isNotFound(error)) return <ArtworkNotFound />;
  if (artwork) return <LoadedArtwork artwork={artwork} />;
  if (error) {
    return <LoadError error={error} onRetry={() => void refetch()} isRetrying={isFetching} />;
  }
  return <ArtworkDetailSkeleton />;
}

interface FormDialogState {
  open: boolean;
  /** A new key per opening, so the form always starts from the current values. */
  key: number;
}

function LoadedArtwork({ artwork }: { artwork: Artwork }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [formDialog, setFormDialog] = useState<FormDialogState>({ open: false, key: 0 });
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Synchronous, so the page is gone before the deleted artwork's cached copy is dropped.
  const leaveDeleted = () => void navigate('/', { replace: true, flushSync: true });

  return (
    <>
      <title>{`${artwork.title} · ${APP_NAME}`}</title>
      <ArtworkDetails
        artwork={artwork}
        headingRef={headingRef}
        actions={
          isAdmin && (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setFormDialog((state) => ({ open: true, key: state.key + 1 }))}
              >
                <Pencil data-icon="inline-start" aria-hidden="true" />
                Edit
              </Button>
              <Button
                size="lg"
                onClick={() => setDeleteOpen(true)}
                // The tinted `destructive` variant is just under AA; this matches the confirm button.
                className="bg-destructive text-primary-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40"
              >
                <Trash2 data-icon="inline-start" aria-hidden="true" />
                Delete
              </Button>
            </div>
          )
        }
      />
      {isAdmin && (
        <>
          <ArtworkFormDialog
            key={formDialog.key}
            open={formDialog.open}
            onOpenChange={(open) => setFormDialog((state) => ({ ...state, open }))}
            artwork={artwork}
            returnFocusFallback={headingRef}
          />
          <DeleteArtworkDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            artwork={artwork}
            returnFocusFallback={headingRef}
            onDeleted={leaveDeleted}
          />
        </>
      )}
    </>
  );
}

function ArtworkNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <title>{`Artwork not found · ${APP_NAME}`}</title>
      <ImageOff className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-3xl font-semibold">Artwork not found</h1>
      <p className="text-muted-foreground">It may have been deleted, or the link is wrong.</p>
      <Button asChild>
        <Link to="/">Browse the gallery</Link>
      </Button>
    </div>
  );
}

interface LoadErrorProps {
  error: Error;
  onRetry: () => void;
  isRetrying: boolean;
}

function LoadError({ error, onRetry, isRetrying }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
      <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
      <p className="font-medium">Couldn't load the artwork</p>
      <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? <Spinner aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
        Try again
      </Button>
    </div>
  );
}
