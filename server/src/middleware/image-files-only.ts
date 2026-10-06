import type { RequestHandler } from 'express';
import { hasImageExtension } from '../utils/image-slug.js';

/**
 * Lets only image files through to the static handler. Anything else dropped into the images
 * folder (an `.html` page, a script, an SVG) would otherwise be served from the API's origin.
 * The check runs on the still-encoded path, so an encoded extension (`x.%6Apg`) fails closed.
 * Everything else leaves the router and ends in the JSON 404.
 */
export const imageFilesOnly: RequestHandler = (req, _res, next) => {
  next(hasImageExtension(req.path) ? undefined : 'router');
};
