import 'reflect-metadata';
import type { EntityManager } from 'typeorm';
import { AppDataSource } from './data-source.js';
import { seedAdmin } from './seeds/admin.seed.js';
import { seedArtworks } from './seeds/artworks.seed.js';

interface SeedStep {
  name: string;
  run: (manager: EntityManager) => Promise<void>;
}

// Each step must be idempotent. They run in order inside one transaction.
const SEED_STEPS: SeedStep[] = [
  { name: 'admin user', run: seedAdmin },
  { name: 'starter artworks', run: seedArtworks },
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
  console.error('Seed failed:', error);
  process.exitCode = 1;
}
