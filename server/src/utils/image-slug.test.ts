import { describe, expect, it } from 'vitest';
import { hasImageExtension, imageUrl, indexImageFiles, toImageSlug } from './image-slug.js';

describe('hasImageExtension', () => {
  it.each(['a.jpg', 'a.jpeg', 'a.png', 'a.webp', 'a.avif', 'A.JPG', '/images/a.Png'])(
    'accepts %s',
    (name) => {
      expect(hasImageExtension(name)).toBe(true);
    },
  );

  it.each(['a.gif', 'a.svg', 'a.html', 'a.jpg.html', 'jpg', '.jpg', '.gitkeep', ''])(
    'rejects %j',
    (name) => {
      expect(hasImageExtension(name)).toBe(false);
    },
  );
});

describe('toImageSlug', () => {
  it.each([
    ['Abstract Vibrance', 'abstract-vibrance'],
    ['Tranquil Lake', 'tranquil-lake'],
    ['  Bronze   Reverie  ', 'bronze-reverie'],
    ['Élan (No. 2)', 'elan-no-2'],
    ['Crème brûlée', 'creme-brulee'],
    ['--already-a-slug--', 'already-a-slug'],
    ['Untitled #7', 'untitled-7'],
    ['夜', ''],
    ['', ''],
  ])('%j → %j', (value, slug) => {
    expect(toImageSlug(value)).toBe(slug);
  });
});

describe('indexImageFiles', () => {
  it('maps image files to the slug of their name', () => {
    const { files, duplicates } = indexImageFiles([
      'abstract-vibrance.jpg',
      'Tranquil Lake.PNG',
      'bronze_reverie.webp',
    ]);

    expect(Object.fromEntries(files)).toEqual({
      'abstract-vibrance': 'abstract-vibrance.jpg',
      'tranquil-lake': 'Tranquil Lake.PNG',
      'bronze-reverie': 'bronze_reverie.webp',
    });
    expect(duplicates.size).toBe(0);
  });

  it.each(['a.jpg', 'a.jpeg', 'a.png', 'a.webp', 'a.avif', 'a.JPG'])('accepts %s', (fileName) => {
    expect(indexImageFiles([fileName]).files.get('a')).toBe(fileName);
  });

  it('ignores other files, dotfiles and names without a slug', () => {
    const { files } = indexImageFiles(['.gitkeep', 'notes.txt', 'a.gif', 'jpg', '夜.jpg', '.jpg']);

    expect(files.size).toBe(0);
  });

  it('uses the first file in sorted order for a duplicate slug and reports all candidates', () => {
    const { files, duplicates } = indexImageFiles(['a.png', 'A.webp', 'a.jpg']);

    expect(files.get('a')).toBe('A.webp');
    expect(duplicates.get('a')).toEqual(['A.webp', 'a.jpg', 'a.png']);
  });

  it('does not change the input array', () => {
    const fileNames = ['b.jpg', 'a.jpg'];

    indexImageFiles(fileNames);

    expect(fileNames).toEqual(['b.jpg', 'a.jpg']);
  });
});

describe('imageUrl', () => {
  it('joins the public URL, route and file name', () => {
    expect(imageUrl('http://localhost:8000', '/images', 'abstract-vibrance.jpg')).toBe(
      'http://localhost:8000/images/abstract-vibrance.jpg',
    );
  });

  it('percent-encodes the file name', () => {
    expect(imageUrl('http://localhost:8000', '/images', 'Tranquil Lake #2?.jpg')).toBe(
      'http://localhost:8000/images/Tranquil%20Lake%20%232%3F.jpg',
    );
  });
});
