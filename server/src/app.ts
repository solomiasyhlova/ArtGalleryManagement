import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { IMAGES_ROUTE } from './config/paths.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { artworksRouter } from './routes/artworks.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { imagesRouter } from './routes/images.routes.js';

export function createApp(): Express {
  const app = express();

  // `same-site`, not helmet's `same-origin`: the client (another port) loads /images from here.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(IMAGES_ROUTE, imagesRouter);
  app.use(express.json());
  app.use(cookieParser());

  app.use(healthRouter);
  app.use('/auth', authRouter);
  app.use('/artworks', artworksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
