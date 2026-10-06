import type { Artwork } from '@art-gallery/shared';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function artworkQuery(id: string) {
  return queryOptions({
    queryKey: ['artwork', id],
    queryFn: () => api.get<Artwork>(`/artworks/${encodeURIComponent(id)}`),
  });
}

/** One artwork. An unknown or malformed id fails with a 404, which isn't retried. */
export function useArtwork(id: string) {
  return useQuery(artworkQuery(id));
}
