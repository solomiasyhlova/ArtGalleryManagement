# Current Feature

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

Not Started

## Goals

<!-- Bullet points of what success looks like. Filled by `/feature load`. -->

## Notes

<!-- Additional context, constraints, or details from the spec. -->

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Setup - Workspaces & Tooling (setup-phase-1): npm workspaces (`shared`), strict TS base config, ESLint flat config + Prettier, Vitest projects, `@art-gallery/shared` constants. TypeScript pinned to `~6.0.3` because typescript-eslint 8.x supports only `<6.1.0`
- Setup - Express Server Skeleton (setup-phase-2): `server` workspace (Express 5, helmet, credentialed CORS, cookies, `GET /health`), Zod-validated env with fail-fast, `HttpError` + `notFound` + `errorHandler` (body-parser 4xx keep their status as `VALIDATION_ERROR`, unknown → 500 without internals), `validate` middleware (Zod 4 per-field details, `res.locals.validated`), shared `ERROR_CODES` / `ApiErrorBody`. Split `tsconfig.json` (type-checks tests) / `tsconfig.build.json` (emit), new `npm run typecheck`. Toolchain now requires npm 12 (npm 11 dropped native optional deps on install) and Node `^22.22.2 || ^24.15.0 || >=26`; `.gitattributes` forces LF. `tsx watch` picks up `shared/dist` changes without `--include`
- Setup - Database (setup-phase-3): TypeORM 1.1.1 + `pg` against the local `art_gallery` DB. `AppDataSource` (`synchronize: false`, dev-only logging, `connectTimeoutMS: 5000`, forward-slash migrations glob from `import.meta.dirname`), `DATABASE_URL` in the Zod env. Server connects before `listen` and exits with the error code + message on failure; `GET /health` runs `SELECT 1` (503 `db: "down"`). `db:*` scripts run the hoisted TypeORM CLI (`../node_modules/typeorm/cli.js`) via `tsx --env-file-if-exists=.env`; transactional `seed.ts` runner (no steps yet); `numericTransformer` for money columns. Tests for the transformer and health route (mocked `AppDataSource`). Gotcha for auth-phase-1: generated migrations use a value `import { MigrationInterface, QueryRunner }`, which fails `verbatimModuleSyntax`. Switch it to `import type` before the first `db:migrate`
