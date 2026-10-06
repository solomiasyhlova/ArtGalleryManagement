import { z } from 'zod';
import { ARTWORK_TYPES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';

export const PRICE_SORTS = ['asc', 'desc'] as const;

export type PriceSort = (typeof PRICE_SORTS)[number];

export const TITLE_MAX_LENGTH = 99;

export const ARTIST_MAX_LENGTH = 50;

export const IMAGE_URL_MAX_LENGTH = 2048;

/** The largest value that fits the `numeric(12,2)` price column. */
export const PRICE_MAX = 9_999_999_999.99;

const TYPE_ERROR = `Type must be one of: ${ARTWORK_TYPES.join(', ')}`;

// `protocol` alone, not `z.httpUrl()`: its hostname rule needs a TLD and would reject `localhost` images.
const httpUrlSchema = z
  .url({ protocol: z.regexes.httpProtocol, error: 'Image URL must be a valid http(s) URL' })
  .max(IMAGE_URL_MAX_LENGTH, `Image URL must be at most ${IMAGE_URL_MAX_LENGTH} characters`);

/**
 * Body of `POST /artworks` and `PUT /artworks/:id`. `PUT` is a full replacement, so an
 * omitted `availability` becomes `true` and an omitted or empty `imageUrl` becomes `null`.
 * `price` must be a JSON number: `"4500"` is rejected, not coerced.
 */
export const artworkInputSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`),
  artist: z
    .string({ error: 'Artist is required' })
    .trim()
    .min(1, 'Artist is required')
    .max(ARTIST_MAX_LENGTH, `Artist must be at most ${ARTIST_MAX_LENGTH} characters`),
  type: z.enum(ARTWORK_TYPES, {
    error: (issue) => (issue.input === undefined ? 'Type is required' : TYPE_ERROR),
  }),
  // An empty number input reads as `NaN` in the form (`valueAsNumber`), so it counts as missing.
  price: z
    .number({
      error: (issue) =>
        issue.input === undefined || Number.isNaN(issue.input)
          ? 'Price is required'
          : 'Price must be a number',
    })
    .positive('Price must be greater than 0')
    .multipleOf(0.01, 'Price can have at most 2 decimal places')
    .max(PRICE_MAX, `Price must be at most ${PRICE_MAX.toLocaleString('en-US')}`),
  availability: z.boolean({ error: 'Availability must be true or false' }).default(true),
  imageUrl: z
    .string({ error: 'Image URL must be a string' })
    .trim()
    .pipe(z.union([z.literal(''), httpUrlSchema]))
    .nullish()
    .transform((value) => value || null),
});

export type ArtworkInput = z.infer<typeof artworkInputSchema>;

/** What the artwork form holds before parsing: `availability` may be missing, `imageUrl` may be `''`. */
export type ArtworkFormInput = z.input<typeof artworkInputSchema>;

/** Query params arrive as strings, so `page` and `limit` are coerced to numbers. */
export const artworkQuerySchema = z.object({
  price: z.enum(PRICE_SORTS, { error: 'Price sort must be "asc" or "desc"' }).optional(),
  artist: z
    .string({ error: 'Artist must be a single value' })
    .trim()
    .max(ARTIST_MAX_LENGTH, `Artist must be at most ${ARTIST_MAX_LENGTH} characters`)
    .optional(),
  type: z.enum(ARTWORK_TYPES, { error: TYPE_ERROR }).optional(),
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
