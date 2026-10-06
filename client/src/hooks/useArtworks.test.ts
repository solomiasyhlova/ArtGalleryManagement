import { describe, expect, it } from 'vitest';
import { artworksPath } from './useArtworks';

describe('artworksPath', () => {
  it('returns the bare path without params', () => {
    expect(artworksPath({})).toBe('/artworks');
  });

  it('adds every set param', () => {
    expect(
      artworksPath({ price: 'asc', artist: 'Monet', type: 'painting', page: 2, limit: 12 }),
    ).toBe('/artworks?price=asc&artist=Monet&type=painting&page=2&limit=12');
  });

  it('leaves out undefined and empty values', () => {
    expect(artworksPath({ price: undefined, artist: '', page: 1 })).toBe('/artworks?page=1');
  });

  it('encodes the artist', () => {
    expect(artworksPath({ artist: 'Smith & Co 50%' })).toBe('/artworks?artist=Smith+%26+Co+50%25');
  });
});
