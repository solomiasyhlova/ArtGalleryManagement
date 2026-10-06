import type { ArtworkInput, ArtworkQuery } from '@art-gallery/shared';
import type { RequestHandler } from 'express';
import * as artworksService from '../services/artworks.service.js';

export const list: RequestHandler = async (_req, res) => {
  const query = res.locals.validated.query as ArtworkQuery;
  res.json(await artworksService.listArtworks(query));
};

export const getById: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await artworksService.getArtworkById(req.params.id));
};

export const create: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as ArtworkInput;
  res.status(201).json(await artworksService.createArtwork(input));
};

export const update: RequestHandler<{ id: string }> = async (req, res) => {
  const input = res.locals.validated.body as ArtworkInput;
  res.json(await artworksService.updateArtwork(req.params.id, input));
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  await artworksService.deleteArtwork(req.params.id);
  res.status(204).end();
};
