import { artworkQuerySchema, type ArtworkType, type PriceSort } from '@art-gallery/shared';

/** Gallery state kept in the URL (`?artist=&type=&price=&page=`). */
export interface GalleryParams {
  artist?: string;
  type?: ArtworkType;
  price?: PriceSort;
  page: number;
}

export type GalleryFilters = Omit<GalleryParams, 'page'>;

const { artist, type, price, page } = artworkQuerySchema.shape;

interface ParamSchema<T> {
  safeParse(value: unknown): { success: boolean; data?: T };
}

/** The value if it passes `schema`, else `undefined`. A missing param stays `undefined`. */
function parseParam<T>(schema: ParamSchema<T>, value: string | null): T | undefined {
  if (value === null) return undefined;
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

/**
 * Reads the gallery params one at a time with the shared query schema, so one bad value
 * (`?type=pottery`, `?page=-1`) is dropped without discarding the others.
 */
export function parseGalleryParams(search: URLSearchParams): GalleryParams {
  return {
    artist: parseParam(artist, search.get('artist')) || undefined,
    type: parseParam(type, search.get('type')),
    price: parseParam(price, search.get('price')),
    page: parseParam(page, search.get('page')) ?? 1,
  };
}

/** The query string for `params`. Empty values and page 1 are left out. */
export function serializeGalleryParams(params: GalleryParams): URLSearchParams {
  const search = new URLSearchParams();
  const artistValue = params.artist?.trim();
  if (artistValue) search.set('artist', artistValue);
  if (params.type) search.set('type', params.type);
  if (params.price) search.set('price', params.price);
  if (params.page > 1) search.set('page', String(params.page));
  return search;
}

export function hasActiveFilters(filters: GalleryFilters): boolean {
  return Boolean(filters.artist || filters.type || filters.price);
}
