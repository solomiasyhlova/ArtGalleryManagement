import {
  ERROR_CODES,
  type ArtworkInput,
  type ArtworkQuery,
  type Artwork as PublicArtwork,
  type Paginated,
} from '@art-gallery/shared';
import { z } from 'zod';
import { AppDataSource } from '../db/data-source.js';
import { Artwork } from '../entities/Artwork.js';
import { escapeLike } from '../utils/escape-like.js';
import { HttpError } from '../utils/http-error.js';

const artworks = () => AppDataSource.getRepository(Artwork);

// Any 8-4-4-4-12 hex id. Postgres rejects other strings with `22P02`, which would surface as a 500.
const idSchema = z.guid();

function artworkNotFound(): HttpError {
  return new HttpError(404, ERROR_CODES.NOT_FOUND, 'Artwork not found');
}

function assertValidId(id: string): void {
  if (!idSchema.safeParse(id).success) throw artworkNotFound();
}

export function toPublicArtwork(artwork: Artwork): PublicArtwork {
  return {
    id: artwork.id,
    title: artwork.title,
    artist: artwork.artist,
    type: artwork.type,
    price: artwork.price,
    availability: artwork.availability,
    imageUrl: artwork.imageUrl,
    createdAt: artwork.createdAt.toISOString(),
    updatedAt: artwork.updatedAt.toISOString(),
  };
}

/**
 * Filters, sorts and paginates on the database. Every ordering ends with `createdAt DESC, id`,
 * so rows with equal prices or timestamps never repeat or go missing between pages.
 */
export async function listArtworks({
  price,
  artist,
  type,
  page,
  limit,
}: ArtworkQuery): Promise<Paginated<PublicArtwork>> {
  const query = artworks().createQueryBuilder('artwork');

  if (artist) {
    query.andWhere('artwork.artist ILIKE :artist', { artist: `%${escapeLike(artist)}%` });
  }
  if (type) {
    query.andWhere('artwork.type = :type', { type });
  }
  if (price) {
    query.orderBy('artwork.price', price === 'asc' ? 'ASC' : 'DESC');
  }
  query.addOrderBy('artwork.createdAt', 'DESC').addOrderBy('artwork.id', 'ASC');

  const [rows, total] = await query
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: rows.map(toPublicArtwork),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getArtworkById(id: string): Promise<PublicArtwork> {
  assertValidId(id);

  const artwork = await artworks().findOneBy({ id });
  if (!artwork) throw artworkNotFound();
  return toPublicArtwork(artwork);
}

/** `save` returns the row with the generated id and timestamps (Postgres `RETURNING`). */
export async function createArtwork(input: ArtworkInput): Promise<PublicArtwork> {
  const repository = artworks();
  return toPublicArtwork(await repository.save(repository.create(input)));
}

/**
 * Full replacement: every field is written, so omitted optional fields fall back to the schema
 * defaults instead of keeping old values. A single `UPDATE` (not find + `save`, which would
 * insert a row deleted in between) sets `updated_at`, then the row is reloaded with it.
 */
export async function updateArtwork(id: string, input: ArtworkInput): Promise<PublicArtwork> {
  assertValidId(id);

  const { affected } = await artworks().update({ id }, input);
  if (!affected) throw artworkNotFound();

  const artwork = await artworks().findOneBy({ id });
  if (!artwork) throw artworkNotFound();
  return toPublicArtwork(artwork);
}

export async function deleteArtwork(id: string): Promise<void> {
  assertValidId(id);

  const { affected } = await artworks().delete({ id });
  if (!affected) throw artworkNotFound();
}
