import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { ARTWORK_TYPES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';
import { artworkInputSchema, artworkQuerySchema } from './artwork.js';

function fieldIssues(schema: z.ZodType, input: unknown): Record<string, string[] | undefined> {
  const result = schema.safeParse(input);
  if (result.success) throw new Error('Expected the input to be invalid');
  const fieldErrors: Record<string, string[] | undefined> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

const issuesFor = (input: unknown) => fieldIssues(artworkQuerySchema, input);

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

describe('artworkInputSchema', () => {
  const valid = {
    title: 'Sunset Over the Ocean',
    artist: 'Claude Monet',
    type: 'painting',
    price: 4500,
    availability: true,
  };

  const inputIssues = (overrides: Record<string, unknown>) =>
    fieldIssues(artworkInputSchema, { ...valid, ...overrides });

  it('accepts the PDF example and fills in a null imageUrl', () => {
    expect(artworkInputSchema.parse(valid)).toEqual({ ...valid, imageUrl: null });
  });

  it('defaults an omitted availability to true', () => {
    expect(artworkInputSchema.parse({ ...valid, availability: undefined }).availability).toBe(true);
  });

  it('keeps availability false', () => {
    expect(artworkInputSchema.parse({ ...valid, availability: false }).availability).toBe(false);
  });

  it('reports every missing field', () => {
    expect(fieldIssues(artworkInputSchema, {})).toEqual({
      title: ['Title is required'],
      artist: ['Artist is required'],
      type: [`Type must be one of: ${ARTWORK_TYPES.join(', ')}`],
      price: ['Price is required'],
    });
  });

  it('reports the spec example with four invalid fields', () => {
    expect(
      Object.keys(
        fieldIssues(artworkInputSchema, { title: '', artist: '', type: 'pottery', price: -5 }),
      ),
    ).toEqual(['title', 'artist', 'type', 'price']);
  });

  it('trims the title and artist', () => {
    expect(
      artworkInputSchema.parse({ ...valid, title: '  Sunset ', artist: ' Monet  ' }),
    ).toMatchObject({ title: 'Sunset', artist: 'Monet' });
  });

  it.each(['', '   ', '\t\n'])('rejects the blank title %j as required', (title) => {
    expect(inputIssues({ title })).toEqual({ title: ['Title is required'] });
  });

  it('accepts a 99-character title and rejects 100', () => {
    expect(artworkInputSchema.parse({ ...valid, title: 'a'.repeat(99) }).title).toHaveLength(99);
    expect(inputIssues({ title: 'a'.repeat(100) })).toEqual({
      title: ['Title must be at most 99 characters'],
    });
  });

  it('counts the title length after trimming', () => {
    expect(artworkInputSchema.parse({ ...valid, title: ` ${'a'.repeat(99)} ` }).title).toHaveLength(
      99,
    );
  });

  it('accepts a 50-character artist and rejects 51', () => {
    expect(artworkInputSchema.parse({ ...valid, artist: 'a'.repeat(50) }).artist).toHaveLength(50);
    expect(inputIssues({ artist: 'a'.repeat(51) })).toEqual({
      artist: ['Artist must be at most 50 characters'],
    });
  });

  it.each(['   ', ''])('rejects the blank artist %j as required', (artist) => {
    expect(inputIssues({ artist })).toEqual({ artist: ['Artist is required'] });
  });

  it.each(ARTWORK_TYPES)('accepts type=%s', (type) => {
    expect(artworkInputSchema.parse({ ...valid, type }).type).toBe(type);
  });

  it.each(['pottery', 'Painting', '', null])('rejects type=%j', (type) => {
    expect(inputIssues({ type })).toEqual({
      type: [`Type must be one of: ${ARTWORK_TYPES.join(', ')}`],
    });
  });

  it.each([0.01, 10.5, 4500.5, 2.03, 0.07, 9_999_999_999.99])('accepts price=%d', (price) => {
    expect(artworkInputSchema.parse({ ...valid, price }).price).toBe(price);
  });

  it.each([
    [0, 'Price must be greater than 0'],
    [-1, 'Price must be greater than 0'],
    [10.999, 'Price can have at most 2 decimal places'],
    [0.001, 'Price can have at most 2 decimal places'],
    [10_000_000_000, 'Price must be at most 9,999,999,999.99'],
  ])('rejects price=%d', (price, message) => {
    expect(inputIssues({ price })).toEqual({ price: [message] });
  });

  it.each(['4500', '', null, true, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the non-number price %j without coercing it',
    (price) => {
      expect(inputIssues({ price })).toEqual({ price: ['Price must be a number'] });
    },
  );

  it.each(['true', 1, null])('rejects availability=%j', (availability) => {
    expect(inputIssues({ availability })).toEqual({
      availability: ['Availability must be true or false'],
    });
  });

  it.each([
    'https://example.com/a.jpg',
    'http://localhost:8000/images/abstract-vibrance.jpg',
    'HTTPS://EXAMPLE.COM/A.JPG',
  ])('accepts imageUrl=%j', (imageUrl) => {
    expect(artworkInputSchema.parse({ ...valid, imageUrl }).imageUrl).toBe(imageUrl);
  });

  it('trims the imageUrl', () => {
    expect(
      artworkInputSchema.parse({ ...valid, imageUrl: ' https://example.com/a.jpg ' }).imageUrl,
    ).toBe('https://example.com/a.jpg');
  });

  it.each(['', '   ', null, undefined])('turns imageUrl=%j into null', (imageUrl) => {
    expect(artworkInputSchema.parse({ ...valid, imageUrl }).imageUrl).toBeNull();
  });

  it.each([
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'ftp://example.com/a.jpg',
    'file:///etc/passwd',
    'http:example.com',
    'not a url',
    '/images/a.jpg',
  ])('rejects imageUrl=%j', (imageUrl) => {
    expect(inputIssues({ imageUrl })).toEqual({
      imageUrl: ['Image URL must be a valid http(s) URL'],
    });
  });

  it('accepts an imageUrl of 2048 characters and rejects 2049', () => {
    const base = 'https://example.com/';
    const url = (length: number) => base + 'a'.repeat(length - base.length);
    expect(artworkInputSchema.parse({ ...valid, imageUrl: url(2048) }).imageUrl).toHaveLength(2048);
    expect(inputIssues({ imageUrl: url(2049) })).toEqual({
      imageUrl: ['Image URL must be at most 2048 characters'],
    });
  });

  it('rejects a non-string imageUrl', () => {
    expect(inputIssues({ imageUrl: 42 })).toEqual({ imageUrl: ['Image URL must be a string'] });
  });

  it('strips unknown keys such as id and createdAt', () => {
    const parsed = artworkInputSchema.parse({ ...valid, id: 'x', createdAt: '2026-01-01' });
    expect(parsed).not.toHaveProperty('id');
    expect(parsed).not.toHaveProperty('createdAt');
  });

  it.each([null, 'text', []])('rejects the non-object body %j', (body) => {
    expect(artworkInputSchema.safeParse(body).success).toBe(false);
  });
});
