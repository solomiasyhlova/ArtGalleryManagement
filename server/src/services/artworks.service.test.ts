import { DEFAULT_PAGE_SIZE, type ArtworkQuery } from '@art-gallery/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Artwork } from '../entities/Artwork.js';
import { HttpError } from '../utils/http-error.js';
import { getArtworkById, listArtworks, toPublicArtwork } from './artworks.service.js';

const { queryBuilder, repository } = vi.hoisted(() => {
  const queryBuilder = {
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn(),
  };
  return {
    queryBuilder,
    repository: {
      createQueryBuilder: vi.fn(() => queryBuilder),
      findOneBy: vi.fn(),
    },
  };
});

vi.mock('../db/data-source.js', () => ({
  AppDataSource: { getRepository: () => repository },
}));

const ID = '6f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f';

function createArtwork(overrides: Partial<Artwork> = {}): Artwork {
  return Object.assign(
    {
      id: ID,
      title: 'Geometric Harmony',
      artist: 'Liam Smith',
      type: 'digital',
      price: 11000,
      availability: false,
      imageUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
    overrides,
  ) as Artwork;
}

function query(overrides: Partial<ArtworkQuery> = {}): ArtworkQuery {
  return { page: 1, limit: DEFAULT_PAGE_SIZE, ...overrides };
}

describe('artworks.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
  });

  describe('listArtworks', () => {
    it('adds no filters and orders newest first when the query is empty', async () => {
      await listArtworks(query());

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(queryBuilder.orderBy).not.toHaveBeenCalled();
      expect(queryBuilder.addOrderBy.mock.calls).toEqual([
        ['artwork.createdAt', 'DESC'],
        ['artwork.id', 'ASC'],
      ]);
    });

    it('filters by artist with a parameterized, escaped ILIKE pattern', async () => {
      await listArtworks(query({ artist: '50%_off\\' }));

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('artwork.artist ILIKE :artist', {
        artist: '%50\\%\\_off\\\\%',
      });
    });

    it('ignores an empty artist', async () => {
      await listArtworks(query({ artist: '' }));

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('filters by exact type', async () => {
      await listArtworks(query({ type: 'sculpture' }));

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('artwork.type = :type', {
        type: 'sculpture',
      });
    });

    it('combines the artist and type filters', async () => {
      await listArtworks(query({ artist: 'liam', type: 'digital' }));

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['asc', 'ASC'],
      ['desc', 'DESC'],
    ] as const)('sorts by price %s, then newest first and by id', async (price, direction) => {
      await listArtworks(query({ price }));

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('artwork.price', direction);
      expect(queryBuilder.addOrderBy.mock.calls).toEqual([
        ['artwork.createdAt', 'DESC'],
        ['artwork.id', 'ASC'],
      ]);
      expect(queryBuilder.orderBy.mock.invocationCallOrder[0]).toBeLessThan(
        queryBuilder.addOrderBy.mock.invocationCallOrder[0] ?? 0,
      );
    });

    it.each([
      [1, 12, 0],
      [2, 3, 3],
      [5, 50, 200],
    ])('page %i with limit %i skips %i rows', async (page, limit, skip) => {
      await listArtworks(query({ page, limit }));

      expect(queryBuilder.skip).toHaveBeenCalledWith(skip);
      expect(queryBuilder.take).toHaveBeenCalledWith(limit);
    });

    it.each([
      [0, 12, 0],
      [4, 12, 1],
      [4, 3, 2],
      [12, 12, 1],
      [13, 12, 2],
    ])('%i rows with limit %i make %i pages', async (total, limit, totalPages) => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], total]);

      const result = await listArtworks(query({ limit }));

      expect(result.meta).toEqual({ page: 1, limit, total, totalPages });
    });

    it('returns empty data with the real meta for a page past the end', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 4]);

      const result = await listArtworks(query({ page: 9, limit: 3 }));

      expect(result).toEqual({ data: [], meta: { page: 9, limit: 3, total: 4, totalPages: 2 } });
    });

    it('returns public artworks with ISO dates', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[createArtwork()], 1]);

      const result = await listArtworks(query());

      expect(result.data).toEqual([toPublicArtwork(createArtwork())]);
      expect(result.data[0]?.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('getArtworkById', () => {
    it('returns the public artwork', async () => {
      repository.findOneBy.mockResolvedValue(createArtwork());

      const artwork = await getArtworkById(ID);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: ID });
      expect(artwork).toMatchObject({ id: ID, title: 'Geometric Harmony', price: 11000 });
    });

    it('throws 404 when the artwork does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const error = await getArtworkById(ID).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Artwork not found' });
    });

    it.each(['3', 'not-a-uuid', `${ID}0`, ID.replaceAll('-', ''), ''])(
      'throws 404 for the malformed id %j without querying the database',
      async (id) => {
        await expect(getArtworkById(id)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
        expect(repository.findOneBy).not.toHaveBeenCalled();
      },
    );
  });

  describe('toPublicArtwork', () => {
    it('copies the public fields and serializes dates', () => {
      expect(toPublicArtwork(createArtwork({ imageUrl: 'https://example.com/a.jpg' }))).toEqual({
        id: ID,
        title: 'Geometric Harmony',
        artist: 'Liam Smith',
        type: 'digital',
        price: 11000,
        availability: false,
        imageUrl: 'https://example.com/a.jpg',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
    });
  });
});
