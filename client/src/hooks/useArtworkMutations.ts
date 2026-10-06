import type { Artwork, ArtworkInput } from '@art-gallery/shared';
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
 * Admin create / update / delete. Each success waits for the lists to refetch before it
 * resolves, so a dialog closes on a gallery that already shows the change.
 */
export function useArtworkMutations() {
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
      await invalidateLists();
      toast.success('Artwork updated');
    },
    onError: (error, { id }) => refreshAfterError(queryClient, id, error),
  });

  const deleteArtwork = useMutation({
    mutationFn: (id: string) => api.delete(`/artworks/${encodeURIComponent(id)}`),
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: ['artwork', id] });
      await invalidateLists();
      toast.success('Artwork deleted');
    },
    onError: (error, id) => refreshAfterError(queryClient, id, error),
  });

  return { createArtwork, updateArtwork, deleteArtwork };
}
