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
- Setup - Client (setup-phase-4): `@art-gallery/client` workspace (Vite 8, React 19) on 5173 with `strictPort`, in the root `dev` / `build`. Tailwind v4 via `@tailwindcss/vite` (no tailwind/postcss config). `@/*` alias via `paths` **without `baseUrl`** (deprecated in TS 6); client tsconfigs extend `tsconfig.base.json`. shadcn 4 (`radix-nova`, Radix base) with button/input/label/badge/skeleton/dropdown-menu/sonner; `cn()` now comes from shadcn's `cn` npm package (`lib/utils.ts` re-exports it, generated components import `cn` directly; our code uses `@/lib/utils`). Hex tokens (base palette, `--success`, `--footer*`, `--type-*`) via `@theme inline`; `.dark` block, chart/sidebar vars, Geist font and `next-themes` removed; `@custom-variant dark` **kept** so generated `dark:` classes never follow the OS; toaster pinned to `theme="light"`. Poppins 400–700 as `--font-sans`. `formatPrice()` + tests, client Vitest project (Node env, `@` alias). create-vite 9 ships oxlint: replaced by `react-hooks` + `react-refresh` (Vite preset) in the root ESLint config, `react-refresh` off for `components/ui`. Known `npm audit` high (`braces`) comes only via the `shadcn` CLI (tooling, not bundled); don't run `audit fix --force` (downgrades shadcn to 1.0)
- Setup - App Shell (setup-phase-5): **React Router 8.4** is installed (the spec says v7). Data mode with `createBrowserRouter` in `router.tsx`; `RouterProvider` now comes from `react-router/dom`, everything else from `react-router` (`react-router-dom` is gone in v8). An `AppLayout` route (Header / `main` + `Outlet` / Footer; sticky footer via `min-h-dvh flex flex-col` + `flex-1`) wraps the `/`, `/login`, `/register` placeholders and `*` → `NotFoundPage`. Header: `Palette` + wordmark, empty user-menu slot. Footer social links are inline stroke SVGs because **lucide 1.x has no brand icons**. TanStack Query 5.104: `queryClient` with `staleTime` 30s and exported `shouldRetry` (one retry, never on 401/403/404). `lib/api.ts`: client-local `ApiError` (status, code, message, details; not from `shared` for now), `credentials: 'include'`, `Content-Type` only with a body, 204 → `undefined`, non-standard error bodies → `UNKNOWN_ERROR`, fetch failure → `NETWORK_ERROR` (status 0). It **throws on import if `VITE_API_URL` is missing** (at runtime, not build time), so the client Vitest project sets `test.env.VITE_API_URL`. `vite-env.d.ts` types the env var; local `client/.env` copied from `.env.example`. The `GalleryPage` placeholder shows the `/health` status. Verified in a real browser with Playwright (installed in the scratchpad, system Chrome): happy path, 404 flow, 375px, a real 503 with Postgres stopped and a real network failure with the API stopped. No-retry on 401/403/404 is unit-tested only until an endpoint can return them
