import { z } from 'zod';
import { ARTWORK_TYPES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';

export const PRICE_SORTS = ['asc', 'desc'] as const;

export type PriceSort = (typeof PRICE_SORTS)[number];

export const ARTIST_MAX_LENGTH = 50;

/** Query params arrive as strings, so `page` and `limit` are coerced to numbers. */
export const artworkQuerySchema = z.object({
  price: z.enum(PRICE_SORTS, { error: 'Price sort must be "asc" or "desc"' }).optional(),
  artist: z
    .string({ error: 'Artist must be a single value' })
    .trim()
    .max(ARTIST_MAX_LENGTH, `Artist must be at most ${ARTIST_MAX_LENGTH} characters`)
    .optional(),
  type: z
    .enum(ARTWORK_TYPES, { error: `Type must be one of: ${ARTWORK_TYPES.join(', ')}` })
    .optional(),
  page: z.coerce
    .number({ error: 'Page must be a number' })
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number({ error: 'Limit must be a number' })
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(MAX_PAGE_SIZE, `Limit must be at most ${MAX_PAGE_SIZE}`)
    .default(DEFAULT_PAGE_SIZE),
});

export type ArtworkQuery = z.infer<typeof artworkQuerySchema>;
