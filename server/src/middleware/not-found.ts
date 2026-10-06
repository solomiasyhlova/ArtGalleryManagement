import { ERROR_CODES } from '@art-gallery/shared';
import type { RequestHandler } from 'express';
import { HttpError } from '../utils/http-error.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.path} not found`));
};
