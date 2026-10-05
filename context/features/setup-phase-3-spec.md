# Setup - Database (TypeORM + PostgreSQL)

## Overview

Connect the server to the local `art_gallery` PostgreSQL database with TypeORM, and wire up the migration and seed scripts. There are no entities yet; the first migration comes with auth-phase-1.

## Requirements

- Create the database once: `createdb -U postgres art_gallery`
- Install `typeorm`, `pg` and `reflect-metadata`
- `db/data-source.ts` exports `AppDataSource`:
  - `type: 'postgres'` and `url: env.DATABASE_URL`
  - `synchronize: false` and `migrationsRun: false`
  - `logging` only in development
  - `entities: []` (explicit class imports) and a `migrations` path
- `index.ts`: `await AppDataSource.initialize()` before `listen`. Exit with a clear message if the DB is unreachable
- `GET /health` runs `SELECT 1`:
  - success → `{ "status": "ok", "db": "up" }`
  - failure → 503 `{ "status": "error", "db": "down" }`
- Scripts in `server/package.json`: `db:migration:generate`, `db:migration:create`, `db:migrate`, `db:migration:show`, `db:migration:revert`, `db:seed`
- `db/seed.ts` runner: initialize the DataSource, run seed steps in order (empty list for now), then destroy the connection. Exits non-zero on failure
- `db/transformers.ts`: `numericTransformer` (DB string ↔ JS number) for money columns, with unit tests

## Files to Create

1. `server/src/db/data-source.ts`
2. `server/src/db/migrations/.gitkeep`
3. `server/src/db/seed.ts`
4. `server/src/db/transformers.ts` + `transformers.test.ts`

## Files to Modify

- `server/src/config/env.ts` - add `DATABASE_URL`
- `server/src/index.ts` - `import 'reflect-metadata'`, initialize the DB before listening
- `server/src/routes/health.routes.ts` - DB check
- `server/package.json` - deps and `db:*` scripts
- `server/tsconfig.json` - `experimentalDecorators`, `emitDecoratorMetadata`
- `server/.env.example`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- `synchronize: false` always. Schema changes only happen through migrations
- tsx and Vitest compile with esbuild, which does **not** emit decorator metadata. Always give columns an explicit `type` (`@Column({ type: 'varchar', length: 99 })`), so TypeORM never relies on reflected types
- `import 'reflect-metadata'` once, at the very top of `index.ts` and `seed.ts`
- Run the TypeORM CLI through tsx (`tsx <path>/typeorm/cli.js migration:run -d src/db/data-source.ts`). With workspaces, `typeorm` is usually hoisted to the root `node_modules`, so check the real path
- The data source file passed to `-d` must export exactly one `DataSource`
- Avoid `__dirname` (it doesn't exist in ESM) and backslash paths in globs (they break on Windows). Use explicit entity imports, and build the migrations glob from `import.meta.dirname` with forward slashes
- `pg` returns `numeric` as a string, which is why `numericTransformer` exists
- The `postgres` password lives only in `server/.env`, never in committed files

## Environment Variables

```
DATABASE_URL=postgres://postgres:<password>@localhost:5432/art_gallery
```

## Testing

1. `createdb -U postgres art_gallery` (once)
2. `npm run dev` - server logs that the DB is connected, then that it is listening
3. `curl http://localhost:8000/health` → `{"status":"ok","db":"up"}`
4. Wrong password in `DATABASE_URL` → server exits with a clear error
5. `npm run db:migration:show -w server` - runs without errors (no migrations yet)
6. `npm run db:seed -w server` - runs and exits cleanly
7. `npm test` - transformer tests pass (`"4500.00"` → `4500`, `4500.5` → `"4500.5"`, `null` stays `null`)

## References

- TypeORM docs (Data Source options, Migrations, Using CLI): https://typeorm.io
- node-postgres type parsing: https://node-postgres.com/features/types
