import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { imageFilesOnly } from './image-files-only.js';

function run(path: string) {
  const next = vi.fn() as NextFunction & ReturnType<typeof vi.fn>;
  imageFilesOnly({ path } as Request, {} as Response, next);
  return next;
}

describe('imageFilesOnly', () => {
  it.each(['/abstract-vibrance.jpg', '/a.jpeg', '/a.png', '/a.webp', '/a.avif', '/A.JPG'])(
    'passes %s on to the static handler',
    (path) => {
      expect(run(path)).toHaveBeenCalledWith(undefined);
    },
  );

  it.each([
    '/evil.html',
    '/evil.js',
    '/logo.svg',
    '/notes.txt',
    '/.gitkeep',
    '/',
    '/jpg',
    '/a.jpg.html',
    '/a.%6Apg',
    '/a.jpg%2Ehtml',
  ])('sends %s out of the router', (path) => {
    expect(run(path)).toHaveBeenCalledWith('router');
  });
});
