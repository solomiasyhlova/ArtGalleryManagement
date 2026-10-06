import type { Artwork, ArtworkInput, Paginated } from '@art-gallery/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { getErrorMessage, hasFieldDetails } from '@/lib/form-errors';

export interface UpdateArtworkVariables {
  id: string;
  input: ArtworkInput;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * The toast for a failed artwork mutation, or `null` when it's reported elsewhere: a 401 sends
 * the user to the login page, and field errors are shown under the form fields.
 */
export function mutationErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError) {
    if (error.status === 401) return null;
    if (error.status === 403) return "You don't have permission";
    if (error.status === 404) return 'This artwork no longer exists';
  }
  if (hasFieldDetails(error)) return null;
  return getErrorMessage(error);
}

function showError(error: unknown) {
  const message = mutationErrorMessage(error);
  if (message) toast.error(message);
}

/**
 * Reports a failed edit or delete. When the artwork no longer exists, it also drops its cached
 * copy and refreshes every list (all filters and pages).
 */
export function refreshAfterError(queryClient: QueryClient, id: string, error: unknown) {
  showError(error);
  if (!isNotFound(error)) return;
  queryClient.removeQueries({ queryKey: ['artwork', id] });
  void queryClient.invalidateQueries({ queryKey: ['artworks'] });
}

/**
 * Applies `edit` to every cached list page holding the artwork. Lists that aren't on screen (e.g.
 * the gallery behind the detail page) are only marked stale by the invalidation, so without this
 * they'd show the old card until their refetch lands. Pages without the artwork stay untouched.
 */
function patchLists(
  queryClient: QueryClient,
  id: string,
  edit: (artworks: Artwork[]) => Artwork[],
) {
  queryClient.setQueriesData<Paginated<Artwork>>({ queryKey: ['artworks'] }, (page) =>
    page?.data.some((artwork) => artwork.id === id)
      ? { ...page, data: edit(page.data) }
      : undefined,
  );
}

/** Puts the saved artwork into the cached lists. Their order and totals wait for the refetch. */
export function replaceInLists(queryClient: QueryClient, saved: Artwork) {
  patchLists(queryClient, saved.id, (artworks) =>
    artworks.map((artwork) => (artwork.id === saved.id ? saved : artwork)),
  );
}

/** Takes the deleted artwork out of the cached lists. Their totals wait for the refetch. */
export function removeFromLists(queryClient: QueryClient, id: string) {
  patchLists(queryClient, id, (artworks) => artworks.filter((artwork) => artwork.id !== id));
}

interface ArtworkMutationsOptions {
  /** Runs after a successful delete, before the artwork's cached copy is dropped. */
  onDeleted?: (id: string) => void;
}

/**
 * Admin create / update / delete. Each success waits for the lists to refetch before it
 * resolves, so a dialog closes on a gallery that already shows the change.
 */
export function useArtworkMutations({ onDeleted }: ArtworkMutationsOptions = {}) {
  const queryClient = useQueryClient();
  const invalidateLists = () => queryClient.invalidateQueries({ queryKey: ['artworks'] });

  const createArtwork = useMutation({
    mutationFn: (input: ArtworkInput) => api.post<Artwork>('/artworks', input),
    onSuccess: async () => {
      await invalidateLists();
      toast.success('Artwork added');
    },
    onError: showError,
  });

  const updateArtwork = useMutation({
    mutationFn: ({ id, input }: UpdateArtworkVariables) =>
      api.put<Artwork>(`/artworks/${encodeURIComponent(id)}`, input),
    onSuccess: async (artwork) => {
      queryClient.setQueryData(['artwork', artwork.id], artwork);
      // Patching marks the lists fresh, so it goes before the invalidation.
      replaceInLists(queryClient, artwork);
      await invalidateLists();
      toast.success('Artwork updated');
    },
    onError: (error, { id }) => refreshAfterError(queryClient, id, error),
  });

  const deleteArtwork = useMutation({
    mutationFn: (id: string) => api.delete(`/artworks/${encodeURIComponent(id)}`),
    onSuccess: async (_, id) => {
      removeFromLists(queryClient, id);
      await invalidateLists();
      toast.success('Artwork deleted');
      // The detail page leaves first: removing a query it still observes would refetch it (a 404).
      onDeleted?.(id);
      queryClient.removeQueries({ queryKey: ['artwork', id] });
    },
    onError: (error, id) => refreshAfterError(queryClient, id, error),
  });

  return { createArtwork, updateArtwork, deleteArtwork };
}
