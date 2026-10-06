import express, { Router } from 'express';
import { IMAGES_DIR } from '../config/paths.js';
import { imageFilesOnly } from '../middleware/image-files-only.js';

/** Public artwork pictures. Missing files, dotfiles and non-images fall through to the 404. */
export const imagesRouter = Router();

imagesRouter.use(imageFilesOnly, express.static(IMAGES_DIR, { index: false, dotfiles: 'ignore' }));
