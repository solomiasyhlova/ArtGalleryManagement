import type { Artwork, ArtworkQuery, Paginated } from '@art-gallery/shared';
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Filters, sort and page for `GET /artworks`. Omitted values use the API defaults. */
export type ArtworkListParams = Partial<ArtworkQuery>;

/** `/artworks` plus the set params as a query string. Empty strings are left out. */
export function artworksPath(params: ArtworkListParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/artworks?${query}` : '/artworks';
}

export function artworksQuery(params: ArtworkListParams) {
  return queryOptions({
    queryKey: ['artworks', params],
    queryFn: () => api.get<Paginated<Artwork>>(artworksPath(params)),
  });
}

/** Keeps showing the previous result while new params load, so paging doesn't flash skeletons. */
export function useArtworks(params: ArtworkListParams = {}) {
  return useQuery({ ...artworksQuery(params), placeholderData: keepPreviousData });
}
