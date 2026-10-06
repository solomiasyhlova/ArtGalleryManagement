import { Router } from 'express';
import { AppDataSource } from '../db/data-source.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  try {
    await AppDataSource.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});
