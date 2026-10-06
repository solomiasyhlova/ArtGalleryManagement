import path from 'node:path';
import express, { Router } from 'express';
import { CLIENT_DIST_DIR } from '../config/paths.js';
import { spaFallback } from '../middleware/spa-fallback.js';

/**
 * The built client, served from the API's origin in production. Vite's `/assets` file names carry
 * a content hash, so they can be cached for good; anything else uses the default caching.
 */
export const clientRouter = Router();

clientRouter.use(
  '/assets',
  express.static(path.join(CLIENT_DIST_DIR, 'assets'), {
    index: false,
    maxAge: '365d',
    immutable: true,
  }),
);
clientRouter.use(express.static(CLIENT_DIST_DIR, { index: false }));
clientRouter.use(spaFallback(path.join(CLIENT_DIST_DIR, 'index.html')));
