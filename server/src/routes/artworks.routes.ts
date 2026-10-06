import { artworkQuerySchema } from '@art-gallery/shared';
import { Router } from 'express';
import * as artworksController from '../controllers/artworks.controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../middleware/validate.js';

export const artworksRouter = Router();

artworksRouter.get(
  '/',
  requireAuth,
  validate({ query: artworkQuerySchema }),
  artworksController.list,
);
artworksRouter.get('/:id', requireAuth, artworksController.getById);
