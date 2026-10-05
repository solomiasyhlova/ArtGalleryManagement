# Artworks API - Model, Seed & Read Endpoints

## Overview

Add the `Artwork` entity, seed the 4 starter artworks, and implement `GET /artworks` (filter, sort, paginate) and `GET /artworks/:id` for signed-in users.

## Requirements

- `Artwork` entity per the overview's Data Model:
  - table `artworks` and the `artwork_type` enum
  - `price numeric(12,2)` with `numericTransformer` and `CHECK (price > 0)`
  - nullable `imageUrl`
  - indexes on `artist` and `type`
- Generate and run the `CreateArtworks` migration
- Shared:
  - `artworkQuerySchema`: `price` asc|desc, `artist` ≤ 50, `type` enum, `page` int ≥ 1 (default 1), `limit` int 1–50 (default 12). Coerced from strings
  - `Artwork` type and `Paginated<T>`
- `GET /artworks` (`requireAuth`, `validate({ query })`):
  - `artist` → `ILIKE '%value%'` with `\`, `%`, `_` escaped
  - `type` → exact match
  - `price=asc|desc` → `ORDER BY price`, then `createdAt DESC, id`
  - no `price` → `createdAt DESC, id`
  - response `{ data, meta: { page, limit, total, totalPages } }`
  - a page past the end → empty `data` with correct `meta`
- `GET /artworks/:id` (`requireAuth`):
  - 200 `Artwork`, or 404 `NOT_FOUND`
  - a malformed UUID → 404, not 400 or 500
- `seedArtworks()`: inserts the 4 artworks from the overview only when the table is empty. Registered in `seed.ts` after `seedAdmin`
- Unit tests: query schema (coercion, invalid sort/type/limit), `escapeLike`, service (filters, ordering, pagination math, 404)

## Files to Create

1. `server/src/entities/Artwork.ts`
2. `server/src/db/migrations/<timestamp>-CreateArtworks.ts` (generated)
3. `shared/src/schemas/artwork.ts` + test - query schema and types (the input schema comes in phase 2)
4. `server/src/utils/escape-like.ts` + test
5. `server/src/services/artworks.service.ts` + test
6. `server/src/controllers/artworks.controller.ts`
7. `server/src/routes/artworks.routes.ts`
8. `server/src/db/seeds/artworks.seed.ts`

## Files to Modify

- `server/src/db/data-source.ts` - register `Artwork`
- `server/src/db/seed.ts` - run `seedArtworks`
- `server/src/app.ts` - mount `/artworks`
- `shared/src/index.ts`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- `pg` returns `numeric` as a string. With `numericTransformer` the API must return `price` as a number
- Query params arrive as strings, so use `z.coerce.number().int()` for `page` / `limit`
- Always use QueryBuilder parameters (`:artist`), never string interpolation. Postgres `ILIKE` treats `\` as its default escape character
- Never pass a non-UUID to `findOneBy({ id })`. Postgres throws `22P02 invalid input syntax for type uuid`, which becomes a 500. Check the id format first and throw 404
- `getManyAndCount()` returns rows and the total in one call. Use `skip` / `take` with the QueryBuilder
- Without the `id` tie-breaker, ordering isn't stable and pages can repeat or skip rows
- Enum column: `type: 'enum', enum: ARTWORK_TYPES, enumName: 'artwork_type'`. An explicit `enumName` keeps the Postgres type name stable across migrations

## Testing

1. `npm run db:migrate -w server` → `\d artworks` shows the table, check constraint and indexes
2. `npm run db:seed -w server` twice → exactly 4 artworks
3. Log in (auth-phase-1, `cookies.txt`), then:

```bash
curl -b cookies.txt "http://localhost:8000/artworks"
curl -b cookies.txt "http://localhost:8000/artworks?price=asc&artist=liam&type=digital"
curl -b cookies.txt "http://localhost:8000/artworks?page=2&limit=3"
```

→ 4 items, newest first; then 1 item (Geometric Harmony); then 1 item with `meta.totalPages: 2`
4. `?price=cheap`, `?type=pottery` and `?limit=500` → 400 with details
5. `?artist=%25` (an encoded `%`) → 0 results, because the wildcard is escaped
6. `GET /artworks/<seeded id>` → 200 with `price` as a number. A random UUID → 404. `/artworks/3` → 404
7. Without the cookie → 401
8. `npm test` passes

## References

- TypeORM docs (Query Builder, enum columns, indices): https://typeorm.io
- PostgreSQL pattern matching (`LIKE` / `ILIKE` escaping): https://www.postgresql.org/docs/current/functions-matching.html
