import { describe, expect, it } from 'vitest';
import { hasActiveFilters, parseGalleryParams, serializeGalleryParams } from './gallery-params';

const parse = (query: string) => parseGalleryParams(new URLSearchParams(query));

describe('parseGalleryParams', () => {
  it('defaults to page 1 without params', () => {
    expect(parse('')).toEqual({ page: 1 });
  });

  it('reads every valid param', () => {
    expect(parse('artist=liam&type=painting&price=desc&page=3')).toEqual({
      artist: 'liam',
      type: 'painting',
      price: 'desc',
      page: 3,
    });
  });

  it('drops invalid values without discarding the others', () => {
    expect(parse('type=pottery&page=-1&artist=liam')).toEqual({ artist: 'liam', page: 1 });
    expect(parse('price=cheapest&type=digital')).toEqual({ type: 'digital', page: 1 });
  });

  it.each(['0', '-1', '1.5', 'abc', ''])('falls back to page 1 for page=%s', (value) => {
    expect(parse(`page=${value}`).page).toBe(1);
  });

  it('trims the artist and drops a blank one', () => {
    expect(parse('artist=%20liam%20').artist).toBe('liam');
    expect(parse('artist=%20%20').artist).toBeUndefined();
  });

  it('drops an artist longer than 50 characters', () => {
    expect(parse(`artist=${'a'.repeat(50)}`).artist).toHaveLength(50);
    expect(parse(`artist=${'a'.repeat(51)}`).artist).toBeUndefined();
  });

  it('is case-sensitive like the API', () => {
    expect(parse('type=Painting&price=ASC')).toEqual({ page: 1 });
  });

  it('uses the first of repeated params', () => {
    expect(parse('type=print&type=painting')).toMatchObject({ type: 'print' });
  });
});

describe('serializeGalleryParams', () => {
  it('leaves out empty values and page 1', () => {
    expect(serializeGalleryParams({ artist: '  ', page: 1 }).toString()).toBe('');
  });

  it('writes every set value', () => {
    expect(
      serializeGalleryParams({
        artist: 'liam',
        type: 'painting',
        price: 'asc',
        page: 2,
      }).toString(),
    ).toBe('artist=liam&type=painting&price=asc&page=2');
  });

  it('trims and encodes the artist', () => {
    expect(serializeGalleryParams({ artist: ' Smith & Co ', page: 1 }).toString()).toBe(
      'artist=Smith+%26+Co',
    );
  });

  it('round-trips through parseGalleryParams', () => {
    const params = { artist: 'Elena P', type: 'sculpture', price: 'desc', page: 4 } as const;
    expect(parseGalleryParams(serializeGalleryParams(params))).toEqual(params);
  });
});

describe('hasActiveFilters', () => {
  it('is false without filters or sort', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ artist: '' })).toBe(false);
  });

  it.each([{ artist: 'liam' }, { type: 'print' as const }, { price: 'asc' as const }])(
    'is true for %o',
    (filters) => {
      expect(hasActiveFilters(filters)).toBe(true);
    },
  );
});
