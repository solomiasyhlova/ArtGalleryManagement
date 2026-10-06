import type { Artwork } from '@art-gallery/shared';
import type { RefObject } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { isNotFound, useArtworkMutations } from '@/hooks/useArtworkMutations';
import { useReturnFocus } from '@/hooks/useReturnFocus';

interface DeleteArtworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kept while the dialog closes, so its text doesn't change during the exit animation. */
  artwork: Artwork | undefined;
  /** Gets focus on close when the element that opened the dialog is gone (the deleted card's menu). */
  returnFocusFallback?: RefObject<HTMLElement | null>;
  /** Runs once the artwork is deleted, e.g. to leave its detail page. */
  onDeleted?: () => void;
}

export function DeleteArtworkDialog({
  open,
  onOpenChange,
  artwork,
  returnFocusFallback,
  onDeleted,
}: DeleteArtworkDialogProps) {
  const { deleteArtwork } = useArtworkMutations({ onDeleted });
  const focusHandlers = useReturnFocus(returnFocusFallback);
  const { isPending } = deleteArtwork;

  function confirm() {
    if (!artwork) return;
    deleteArtwork.mutate(artwork.id, {
      onSuccess: () => onOpenChange(false),
      // Already gone: nothing left to confirm. The mutation has said so in a toast.
      onError: (error) => {
        if (isNotFound(error)) onOpenChange(false);
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent {...focusHandlers}>
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-break-word">
            Delete "{artwork?.title}"?
          </AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            // Keep the dialog open until the request settles.
            onClick={(event) => {
              event.preventDefault();
              confirm();
            }}
            disabled={isPending}
            aria-busy={isPending}
            className="bg-destructive text-primary-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40"
          >
            {isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
