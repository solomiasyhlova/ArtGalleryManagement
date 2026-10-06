import path from 'node:path';

// `src/config` (tsx) and `dist/config` (node) sit at the same depth, so this resolves to
// `server/public/images` in both, whatever the working directory is.
export const IMAGES_DIR = path.resolve(import.meta.dirname, '../../public/images');

/** The URL path the images folder is served under. */
export const IMAGES_ROUTE = '/images';
