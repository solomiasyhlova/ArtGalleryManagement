import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { artworksRouter } from './routes/artworks.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use(healthRouter);
  app.use('/auth', authRouter);
  app.use('/artworks', artworksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
