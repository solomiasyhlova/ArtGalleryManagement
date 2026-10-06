import { describe, expect, it } from 'vitest';
import { cameFromGallery, FROM_GALLERY_STATE } from './location-state';

describe('cameFromGallery', () => {
  it('recognizes the state of a gallery card link', () => {
    expect(cameFromGallery(FROM_GALLERY_STATE)).toBe(true);
  });

  it.each([null, undefined, 'fromGallery', {}, { fromGallery: 'true' }, { fromGallery: 1 }])(
    'rejects %o (opened directly, after a login redirect, or from elsewhere)',
    (state) => {
      expect(cameFromGallery(state)).toBe(false);
    },
  );
});
