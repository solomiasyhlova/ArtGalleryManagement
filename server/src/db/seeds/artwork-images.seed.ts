import { readdir } from 'node:fs/promises';
import { IsNull, type EntityManager } from 'typeorm';
import { env } from '../../config/env.js';
import { IMAGES_DIR, IMAGES_ROUTE } from '../../config/paths.js';
import { Artwork } from '../../entities/Artwork.js';
import { imageUrl, indexImageFiles, toImageSlug } from '../../utils/image-slug.js';

/**
 * Gives every artwork without an image the picture in `server/public/images` whose file name
 * matches its title (`abstract-vibrance.jpg` → "Abstract Vibrance"). Never replaces an image an
 * admin already set.
 */
export async function seedArtworkImages(manager: EntityManager): Promise<void> {
  const { files, duplicates } = indexImageFiles(await readdir(IMAGES_DIR));
  for (const [slug, names] of duplicates) {
    console.warn(`  several pictures match "${slug}" (${names.join(', ')}), using ${names[0]}`);
  }

  const artworks = manager.getRepository(Artwork);
  const withoutImage = await artworks.find({
    where: { imageUrl: IsNull() },
    order: { createdAt: 'DESC', id: 'ASC' },
  });
  if (!withoutImage.length) {
    console.info('  every artwork already has an image, skipped');
    return;
  }

  for (const { id, title } of withoutImage) {
    const slug = toImageSlug(title);
    const fileName = files.get(slug);
    if (!fileName) {
      console.info(`  "${title}": no picture named ${slug}.*`);
      continue;
    }
    await artworks.update(
      { id, imageUrl: IsNull() },
      { imageUrl: imageUrl(env.PUBLIC_URL, IMAGES_ROUTE, fileName) },
    );
    console.info(`  "${title}" → ${fileName}`);
  }
}
