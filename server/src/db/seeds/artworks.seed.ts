import type { EntityManager } from 'typeorm';
import { Artwork } from '../../entities/Artwork.js';

type StarterArtwork = Pick<Artwork, 'title' | 'artist' | 'type' | 'price' | 'availability'>;

/** Listed newest first, the order the gallery shows them in by default. */
const STARTER_ARTWORKS: StarterArtwork[] = [
  {
    title: 'Abstract Vibrance',
    artist: 'Alex Johnson',
    type: 'painting',
    price: 5500,
    availability: true,
  },
  {
    title: 'Tranquil Lake',
    artist: 'Maria Gonzalez',
    type: 'painting',
    price: 3500,
    availability: true,
  },
  {
    title: 'Geometric Harmony',
    artist: 'Liam Smith',
    type: 'digital',
    price: 11000,
    availability: false,
  },
  {
    title: 'Bronze Reverie',
    artist: 'Elena Petrova',
    type: 'sculpture',
    price: 8200,
    availability: true,
  },
];

/** Inserts the 4 starter artworks, but only into an empty table. */
export async function seedArtworks(manager: EntityManager): Promise<void> {
  const artworks = manager.getRepository(Artwork);

  if (await artworks.exists()) {
    console.info('  artworks table is not empty, skipped');
    return;
  }

  // `now()` is the same for every row in a transaction, so space the timestamps a second apart.
  // Otherwise the default "newest first" order would fall back to the random ids.
  const now = Date.now();
  await artworks.insert(
    STARTER_ARTWORKS.map((artwork, index) => {
      const timestamp = new Date(now - index * 1000);
      return { ...artwork, createdAt: timestamp, updatedAt: timestamp };
    }),
  );
  console.info(`  inserted ${STARTER_ARTWORKS.length} artworks`);
}
