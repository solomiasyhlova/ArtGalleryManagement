import { useMemo } from 'react';
import { useSearchParams, type NavigateOptions } from 'react-router';
import {
  hasActiveFilters,
  parseGalleryParams,
  serializeGalleryParams,
  type GalleryFilters,
} from '@/lib/gallery-params';

/**
 * Gallery filters, sort and page from the URL query string. Invalid values are ignored, and
 * every change rewrites the query from the parsed values, so they never reach the API.
 */
export function useGalleryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseGalleryParams(searchParams), [searchParams]);

  /**
   * Changes filters or the sort and goes back to page 1. Pushes a history entry by default.
   * The page keeps its scroll position (`<ScrollRestoration>` would jump to the top).
   */
  function setFilters(changes: GalleryFilters, options?: NavigateOptions) {
    setSearchParams(serializeGalleryParams({ ...params, ...changes, page: 1 }), {
      preventScrollReset: true,
      ...options,
    });
  }

  /**
   * Applies the artist search. Starting a search pushes one history entry and refining it
   * replaces that entry, so Back steps over the search as a whole instead of each keystroke.
   */
  function setArtist(value: string) {
    const artist = value.trim() || undefined;
    if (artist === params.artist) return;
    setFilters({ artist }, { replace: params.artist !== undefined });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { preventScrollReset: true });
  }

  /** The query string (with `?`) of `page` under the current filters, for links. */
  function pageSearch(page: number): string {
    const search = serializeGalleryParams({ ...params, page }).toString();
    return search ? `?${search}` : '';
  }

  return {
    params,
    hasFilters: hasActiveFilters(params),
    setFilters,
    setArtist,
    clearFilters,
    pageSearch,
  };
}
