import 'reflect-metadata';
import type { EntityManager } from 'typeorm';
import { logError } from '../utils/log-error.js';
import { AppDataSource } from './data-source.js';
import { seedAdmin } from './seeds/admin.seed.js';
import { seedArtworkImages } from './seeds/artwork-images.seed.js';
import { seedArtworks } from './seeds/artworks.seed.js';

interface SeedStep {
  name: string;
  run: (manager: EntityManager) => Promise<void>;
}

// Each step must be idempotent. They run in order inside one transaction.
const SEED_STEPS: SeedStep[] = [
  { name: 'admin user', run: seedAdmin },
  { name: 'starter artworks', run: seedArtworks },
  { name: 'artwork images', run: seedArtworkImages },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await AppDataSource.transaction(async (manager) => {
      for (const step of SEED_STEPS) {
        console.info(`Seeding ${step.name}...`);
        await step.run(manager);
      }
    });
  } finally {
    await AppDataSource.destroy();
  }
}

try {
  await seed();
  console.info(`Seed complete (${SEED_STEPS.length} steps)`);
} catch (error) {
  logError('Seed failed', error);
  process.exitCode = 1;
}
