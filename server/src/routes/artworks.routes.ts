import { artworkInputSchema, artworkQuerySchema } from '@art-gallery/shared';
import { Router } from 'express';
import * as artworksController from '../controllers/artworks.controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';

export const artworksRouter = Router();

// Role before validation, so a `user` gets a 403 instead of the body's validation details.
const requireAdmin = [requireAuth, requireRole('admin')];

artworksRouter.get(
  '/',
  requireAuth,
  validate({ query: artworkQuerySchema }),
  artworksController.list,
);
artworksRouter.get('/:id', requireAuth, artworksController.getById);
artworksRouter.post(
  '/',
  requireAdmin,
  validate({ body: artworkInputSchema }),
  artworksController.create,
);
artworksRouter.put(
  '/:id',
  requireAdmin,
  validate({ body: artworkInputSchema }),
  artworksController.update,
);
artworksRouter.delete('/:id', requireAdmin, artworksController.remove);
