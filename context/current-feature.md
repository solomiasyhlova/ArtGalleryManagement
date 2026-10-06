# Current Feature: Setup - Database (TypeORM + PostgreSQL)

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

Complete

## Goals

<!-- Bullet points of what success looks like. Filled by `/feature load`. -->

- Local `art_gallery` database created once with `createdb -U postgres art_gallery`
- `typeorm`, `pg` and `reflect-metadata` installed in `server`
- `server/src/db/data-source.ts` exports a single `AppDataSource`: `type: 'postgres'`, `url: env.DATABASE_URL`, `synchronize: false`, `migrationsRun: false`, logging only in development, `entities: []` (explicit imports), migrations glob built from `import.meta.dirname` with forward slashes
- `DATABASE_URL` added to the Zod-validated `config/env.ts` and to `server/.env.example`
- `index.ts` imports `reflect-metadata` first and awaits `AppDataSource.initialize()` before `listen`; an unreachable DB exits with a clear message
- `GET /health` runs `SELECT 1`: `200 { status: "ok", db: "up" }` on success, `503 { status: "error", db: "down" }` on failure
- `server/package.json` scripts: `db:migration:generate`, `db:migration:create`, `db:migrate`, `db:migration:show`, `db:migration:revert`, `db:seed` (TypeORM CLI run through tsx)
- `db/seed.ts` runner: imports `reflect-metadata`, initializes the DataSource, runs seed steps in order (empty list for now), destroys the connection, exits non-zero on failure
- `db/transformers.ts` exports `numericTransformer` (DB string ↔ JS number) with unit tests (`"4500.00"` → `4500`, `4500.5` → `"4500.5"`, `null` stays `null`)
- `server/src/db/migrations/.gitkeep` exists; `experimentalDecorators` / `emitDecoratorMetadata` enabled in `server/tsconfig.json`
- `npm run build`, `npm run typecheck`, `npm run lint` and `npm test` pass

## Notes

<!-- Additional context, constraints, or details from the spec. -->

- No entities yet; the first migration arrives with auth-phase-1
- `synchronize: false` always. Schema changes only through migrations
- tsx and Vitest use esbuild, which does not emit decorator metadata: always give columns an explicit `type` so TypeORM never relies on reflected types
- `import 'reflect-metadata'` once, at the very top of `index.ts` and `seed.ts`
- Run the TypeORM CLI via tsx (`tsx <path>/typeorm/cli.js ... -d src/db/data-source.ts`); with workspaces `typeorm` is likely hoisted to root `node_modules`, so check the real path
- The `-d` data source file must export exactly one `DataSource`
- No `__dirname` (ESM) and no backslash globs (break on Windows)
- `pg` returns `numeric` as a string, hence `numericTransformer`
- The `postgres` password lives only in `server/.env`, never in committed files
- Verify current TypeORM config/CLI conventions for the installed version before writing code (see `AGENTS.md`)
- Manual checks: `npm run dev` logs DB connected then listening; `curl http://localhost:8000/health`; wrong password → clear exit; `db:migration:show` and `db:seed` run cleanly
- Files to create: `db/data-source.ts`, `db/migrations/.gitkeep`, `db/seed.ts`, `db/transformers.ts` + `transformers.test.ts`
- Files to modify: `config/env.ts`, `index.ts`, `routes/health.routes.ts`, `server/package.json`, `server/tsconfig.json`, `server/.env.example`
- Installed: `typeorm` 1.1.1 (new major; still legacy decorators + `reflect-metadata`), `pg` 8.23. `typeorm` is hoisted, so the CLI is `../node_modules/typeorm/cli.js`; scripts load `server/.env` via `tsx --env-file-if-exists=.env`
- `migration:generate` writes `import { MigrationInterface, QueryRunner } from "typeorm"`, which fails `verbatimModuleSyntax`. Change it to `import type` (and run Prettier) before the first `db:migrate`
- Seed steps receive an `EntityManager` and all run in one transaction
- Startup DB errors print the error code (`ECONNREFUSED`, `28P01`), because a Postgres with non-English `lc_messages` sends auth errors that `pg` decodes as garbled text (local server is now set to English)

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Setup - Workspaces & Tooling (setup-phase-1): npm workspaces (`shared`), strict TS base config, ESLint flat config + Prettier, Vitest projects, `@art-gallery/shared` constants. TypeScript pinned to `~6.0.3` because typescript-eslint 8.x supports only `<6.1.0`
- Setup - Express Server Skeleton (setup-phase-2): `server` workspace (Express 5, helmet, credentialed CORS, cookies, `GET /health`), Zod-validated env with fail-fast, `HttpError` + `notFound` + `errorHandler` (body-parser 4xx keep their status as `VALIDATION_ERROR`, unknown → 500 without internals), `validate` middleware (Zod 4 per-field details, `res.locals.validated`), shared `ERROR_CODES` / `ApiErrorBody`. Split `tsconfig.json` (type-checks tests) / `tsconfig.build.json` (emit), new `npm run typecheck`. Toolchain now requires npm 12 (npm 11 dropped native optional deps on install) and Node `^22.22.2 || ^24.15.0 || >=26`; `.gitattributes` forces LF. `tsx watch` picks up `shared/dist` changes without `--include`
