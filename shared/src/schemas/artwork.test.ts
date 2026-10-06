import { describe, expect, it } from 'vitest';
import { ARTWORK_TYPES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';
import { artworkQuerySchema } from './artwork.js';

function issuesFor(input: unknown): Record<string, string[] | undefined> {
  const result = artworkQuerySchema.safeParse(input);
  if (result.success) throw new Error('Expected the query to be invalid');
  const fieldErrors: Record<string, string[] | undefined> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

describe('artworkQuerySchema', () => {
  it('defaults page and limit for an empty query', () => {
    expect(artworkQuerySchema.parse({})).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
  });

  it('coerces page and limit from strings', () => {
    expect(artworkQuerySchema.parse({ page: '3', limit: '25' })).toEqual({ page: 3, limit: 25 });
  });

  it('accepts every filter together', () => {
    expect(
      artworkQuerySchema.parse({ price: 'desc', artist: '  liam ', type: 'digital', page: '2' }),
    ).toEqual({
      price: 'desc',
      artist: 'liam',
      type: 'digital',
      page: 2,
      limit: DEFAULT_PAGE_SIZE,
    });
  });

  it.each(['asc', 'desc'])('accepts price=%s', (price) => {
    expect(artworkQuerySchema.parse({ price }).price).toBe(price);
  });

  it.each(['cheap', 'ASC', ''])('rejects price=%j', (price) => {
    expect(issuesFor({ price })).toEqual({ price: ['Price sort must be "asc" or "desc"'] });
  });

  it.each(ARTWORK_TYPES)('accepts type=%s', (type) => {
    expect(artworkQuerySchema.parse({ type }).type).toBe(type);
  });

  it.each(['pottery', 'Painting', ''])('rejects type=%j', (type) => {
    expect(issuesFor({ type }).type).toHaveLength(1);
  });

  it('accepts an artist of up to 50 characters after trimming', () => {
    expect(artworkQuerySchema.parse({ artist: ` ${'a'.repeat(50)} ` }).artist).toHaveLength(50);
    expect(issuesFor({ artist: 'a'.repeat(51) })).toEqual({
      artist: ['Artist must be at most 50 characters'],
    });
  });

  it('keeps LIKE wildcards in the artist as plain text', () => {
    expect(artworkQuerySchema.parse({ artist: '%_\\' }).artist).toBe('%_\\');
  });

  it.each([
    ['0', 'Limit must be at least 1'],
    ['51', `Limit must be at most ${MAX_PAGE_SIZE}`],
    ['500', `Limit must be at most ${MAX_PAGE_SIZE}`],
    ['2.5', 'Limit must be a whole number'],
    ['ten', 'Limit must be a number'],
  ])('rejects limit=%j', (limit, message) => {
    expect(issuesFor({ limit })).toEqual({ limit: [message] });
  });

  it('accepts limit at both bounds', () => {
    expect(artworkQuerySchema.parse({ limit: '1' }).limit).toBe(1);
    expect(artworkQuerySchema.parse({ limit: '50' }).limit).toBe(MAX_PAGE_SIZE);
  });

  it.each([
    ['0', 'Page must be at least 1'],
    ['-1', 'Page must be at least 1'],
    ['1.5', 'Page must be a whole number'],
    ['abc', 'Page must be a number'],
    ['', 'Page must be at least 1'],
  ])('rejects page=%j', (page, message) => {
    expect(issuesFor({ page })).toEqual({ page: [message] });
  });

  it('rejects repeated params, which Express parses as arrays', () => {
    expect(
      Object.keys(issuesFor({ price: ['asc', 'desc'], artist: ['a', 'b'], page: ['1', '2'] })),
    ).toEqual(['price', 'artist', 'page']);
  });

  it('strips unknown params', () => {
    expect(artworkQuerySchema.parse({ sort: 'title' })).not.toHaveProperty('sort');
  });
});
