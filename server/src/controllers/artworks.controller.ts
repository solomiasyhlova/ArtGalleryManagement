import type { ArtworkQuery } from '@art-gallery/shared';
import type { RequestHandler } from 'express';
import * as artworksService from '../services/artworks.service.js';

export const list: RequestHandler = async (_req, res) => {
  const query = res.locals.validated.query as ArtworkQuery;
  res.json(await artworksService.listArtworks(query));
};

export const getById: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await artworksService.getArtworkById(req.params.id));
};
