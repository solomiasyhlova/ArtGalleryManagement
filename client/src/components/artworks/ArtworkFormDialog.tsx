import {
  artworkInputSchema,
  type Artwork,
  type ArtworkFormInput,
  type ArtworkInput,
} from '@art-gallery/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RefObject } from 'react';
import { useForm, type DefaultValues } from 'react-hook-form';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/form/SubmitButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isNotFound, useArtworkMutations } from '@/hooks/useArtworkMutations';
import { useReturnFocus } from '@/hooks/useReturnFocus';
import { applyFieldErrors, getErrorMessage, hasFieldDetails } from '@/lib/form-errors';
import { ArtworkForm } from './ArtworkForm';

const FIELDS = ['title', 'artist', 'type', 'price', 'availability', 'imageUrl'] as const;

const EMPTY_VALUES: DefaultValues<ArtworkFormInput> = {
  title: '',
  artist: '',
  availability: true,
  imageUrl: '',
};

function toFormValues(artwork: Artwork): ArtworkFormInput {
  const { title, artist, type, price, availability, imageUrl } = artwork;
  return { title, artist, type, price, availability, imageUrl: imageUrl ?? '' };
}

interface ArtworkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The artwork to edit. Without one, the dialog adds a new artwork. */
  artwork?: Artwork;
  /** Gets focus on close when the element that opened the dialog is gone. */
  returnFocusFallback?: RefObject<HTMLElement | null>;
}

export function ArtworkFormDialog({
  open,
  onOpenChange,
  artwork,
  returnFocusFallback,
}: ArtworkFormDialogProps) {
  const { createArtwork, updateArtwork } = useArtworkMutations();
  const focusHandlers = useReturnFocus(returnFocusFallback);
  const isPending = artwork ? updateArtwork.isPending : createArtwork.isPending;

  function save(input: ArtworkInput, onError: (error: unknown) => void) {
    const callbacks = { onSuccess: () => onOpenChange(false), onError };
    if (artwork) updateArtwork.mutate({ id: artwork.id, input }, callbacks);
    else createArtwork.mutate(input, callbacks);
  }

  return (
    // Stays open while saving, so the result always has a dialog to land in.
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent
        {...focusHandlers}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{artwork ? 'Edit Artwork' : 'Add New Artwork'}</DialogTitle>
          <DialogDescription>
            {artwork
              ? `Update the details of "${artwork.title}".`
              : 'Fill in the details of the new artwork.'}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form starts from fresh values every time. */}
        <ArtworkFormBody
          artwork={artwork}
          isPending={isPending}
          onSave={save}
          onGone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ArtworkFormBodyProps {
  artwork: Artwork | undefined;
  isPending: boolean;
  onSave: (input: ArtworkInput, onError: (error: unknown) => void) => void;
  /** The edited artwork was deleted meanwhile (the mutation has already said so). */
  onGone: () => void;
}

function ArtworkFormBody({ artwork, isPending, onSave, onGone }: ArtworkFormBodyProps) {
  const form = useForm<ArtworkFormInput, unknown, ArtworkInput>({
    resolver: zodResolver(artworkInputSchema),
    defaultValues: artwork ? toFormValues(artwork) : EMPTY_VALUES,
    mode: 'onTouched',
  });

  // Toasts for other errors come from `useArtworkMutations`; field errors belong to the form.
  const onSubmit = form.handleSubmit((values) =>
    onSave(values, (error) => {
      if (isNotFound(error)) onGone();
      else if (hasFieldDetails(error) && !applyFieldErrors(error, form.setError, FIELDS)) {
        toast.error(getErrorMessage(error));
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <ArtworkForm control={form.control} />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={isPending}>
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton isPending={isPending}>
          {artwork ? 'Save changes' : 'Add Artwork'}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
