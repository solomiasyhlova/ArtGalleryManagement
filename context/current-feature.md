# Current Feature: Auth API - User Model, Login & Session (auth-phase-1)

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Bullet points of what success looks like. Filled by `/feature load`. -->

- `bcrypt`, `jsonwebtoken`, `ms` (+ `@types/*`) installed in `server`
- `User` entity (`server/src/entities/User.ts`): table `users`, `user_role` enum (default `user`), unique lower-cased `email`, `passwordHash` with `select: false`; registered in `data-source.ts`
- `CreateUsers` migration generated, reviewed and run against the local `art_gallery` DB
- Shared `loginSchema` (email, password 1–72) and public `User` type (`id, name, email, role, createdAt, updatedAt`, no hash) in `shared/src/schemas/auth.ts`, exported from `shared/src/index.ts`
- `utils/jwt.ts`: `signToken({ sub, role })` / `verifyToken(token)`, HS256 pinned on verify
- `utils/auth-cookie.ts`: `setAuthCookie(res, token)` / `clearAuthCookie(res)`; cookie `token`, `httpOnly`, `sameSite: 'lax'`, `secure` in production, `path: '/'`, `maxAge` = `ms(JWT_EXPIRES_IN)`; clear uses identical options
- `services/auth.service.ts`: `login(email, password)` (generic 401 "Invalid email or password", dummy-hash compare for unknown emails), `getUserById(id)`, `toPublicUser(user)`
- Routes mounted at `/auth`: `POST /auth/login` (validated, 200 `User` + cookie), `POST /auth/logout` (204, cookie cleared), `GET /auth/me` (`requireAuth`, 200 `User`)
- `requireAuth` middleware: missing/invalid token or deleted user → 401 `UNAUTHENTICATED`; sets `res.locals.user`
- `requireRole('admin')` middleware: role mismatch → 403 `FORBIDDEN`
- `server/src/types/express.d.ts` types `res.locals.user`
- `seedAdmin()` in `server/src/db/seeds/admin.seed.ts` (bcrypt cost 12, only if the email doesn't exist), registered in `seed.ts`; running the seed twice leaves exactly one admin
- Env: `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` in `config/env.ts` and `server/.env.example`
- Unit tests for `requireAuth`, `requireRole` and `auth.service.login` (DB, bcrypt, jsonwebtoken mocked); `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass
- Manual curl checks from the spec pass (login cookie flags, `/auth/me` with/without cookie, wrong password vs unknown email identical 401, logout → 204 then 401)

## Notes

<!-- Additional context, constraints, or details from the spec. -->

- Spec: `context/features/auth-phase-1-spec.md`. Registration (`POST /auth/register`) is **auth-phase-2**, not this phase
- Verify installed versions / current docs (Context7) for `jsonwebtoken`, `bcrypt`, `ms`, TypeORM 1.1.1 and Express 5 before writing code
- `user` is reserved in Postgres → `@Entity('users')`
- `passwordHash` is `select: false`; login re-adds it with `addSelect`. Never return it in a response
- Lower-case + trim email before lookup and insert
- bcrypt reads only the first 72 bytes → passwords capped at 72 in schemas
- Unknown email and wrong password return the identical message; run `bcrypt.compare` against a dummy hash when the user is missing (timing)
- `jwt.verify(token, secret, { algorithms: ['HS256'] })`, always pin the algorithm
- `JWT_EXPIRES_IN` (e.g. `1d`) feeds both `expiresIn` and the cookie `maxAge` (via `ms`), so they never drift
- `clearCookie` must reuse the same `path` / `sameSite` / `secure` options
- `bcrypt` is native: if install fails on Windows, check Node support and **ask before switching libraries**
- Gotcha from setup-phase-3: generated migrations use a value `import { MigrationInterface, QueryRunner }`, which fails `verbatimModuleSyntax`. Change it to `import type` before the first `db:migrate`
- DB operations run only against the local dev DB `art_gallery`; state the DB used
- PowerShell: use `curl.exe`, not `curl` (alias for `Invoke-WebRequest`)
- `JWT_SECRET` generation: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`; `ADMIN_PASSWORD` must be set in the local `server/.env`

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Setup - Workspaces & Tooling (setup-phase-1): npm workspaces (`shared`), strict TS base config, ESLint flat config + Prettier, Vitest projects, `@art-gallery/shared` constants. TypeScript pinned to `~6.0.3` because typescript-eslint 8.x supports only `<6.1.0`
- Setup - Express Server Skeleton (setup-phase-2): `server` workspace (Express 5, helmet, credentialed CORS, cookies, `GET /health`), Zod-validated env with fail-fast, `HttpError` + `notFound` + `errorHandler` (body-parser 4xx keep their status as `VALIDATION_ERROR`, unknown → 500 without internals), `validate` middleware (Zod 4 per-field details, `res.locals.validated`), shared `ERROR_CODES` / `ApiErrorBody`. Split `tsconfig.json` (type-checks tests) / `tsconfig.build.json` (emit), new `npm run typecheck`. Toolchain now requires npm 12 (npm 11 dropped native optional deps on install) and Node `^22.22.2 || ^24.15.0 || >=26`; `.gitattributes` forces LF. `tsx watch` picks up `shared/dist` changes without `--include`
- Setup - Database (setup-phase-3): TypeORM 1.1.1 + `pg` against the local `art_gallery` DB. `AppDataSource` (`synchronize: false`, dev-only logging, `connectTimeoutMS: 5000`, forward-slash migrations glob from `import.meta.dirname`), `DATABASE_URL` in the Zod env. Server connects before `listen` and exits with the error code + message on failure; `GET /health` runs `SELECT 1` (503 `db: "down"`). `db:*` scripts run the hoisted TypeORM CLI (`../node_modules/typeorm/cli.js`) via `tsx --env-file-if-exists=.env`; transactional `seed.ts` runner (no steps yet); `numericTransformer` for money columns. Tests for the transformer and health route (mocked `AppDataSource`). Gotcha for auth-phase-1: generated migrations use a value `import { MigrationInterface, QueryRunner }`, which fails `verbatimModuleSyntax`. Switch it to `import type` before the first `db:migrate`
- Setup - Client (setup-phase-4): `@art-gallery/client` workspace (Vite 8, React 19) on 5173 with `strictPort`, in the root `dev` / `build`. Tailwind v4 via `@tailwindcss/vite` (no tailwind/postcss config). `@/*` alias via `paths` **without `baseUrl`** (deprecated in TS 6); client tsconfigs extend `tsconfig.base.json`. shadcn 4 (`radix-nova`, Radix base) with button/input/label/badge/skeleton/dropdown-menu/sonner; `cn()` now comes from shadcn's `cn` npm package (`lib/utils.ts` re-exports it, generated components import `cn` directly; our code uses `@/lib/utils`). Hex tokens (base palette, `--success`, `--footer*`, `--type-*`) via `@theme inline`; `.dark` block, chart/sidebar vars, Geist font and `next-themes` removed; `@custom-variant dark` **kept** so generated `dark:` classes never follow the OS; toaster pinned to `theme="light"`. Poppins 400–700 as `--font-sans`. `formatPrice()` + tests, client Vitest project (Node env, `@` alias). create-vite 9 ships oxlint: replaced by `react-hooks` + `react-refresh` (Vite preset) in the root ESLint config, `react-refresh` off for `components/ui`. Known `npm audit` high (`braces`) comes only via the `shadcn` CLI (tooling, not bundled); don't run `audit fix --force` (downgrades shadcn to 1.0)
- Setup - App Shell (setup-phase-5): **React Router 8.4** is installed (the spec says v7). Data mode with `createBrowserRouter` in `router.tsx`; `RouterProvider` now comes from `react-router/dom`, everything else from `react-router` (`react-router-dom` is gone in v8). An `AppLayout` route (Header / `main` + `Outlet` / Footer; sticky footer via `min-h-dvh flex flex-col` + `flex-1`) wraps the `/`, `/login`, `/register` placeholders and `*` → `NotFoundPage`. Header: `Palette` + wordmark, empty user-menu slot. Footer social links are inline stroke SVGs because **lucide 1.x has no brand icons**. TanStack Query 5.104: `queryClient` with `staleTime` 30s and exported `shouldRetry` (one retry, never on 401/403/404). `lib/api.ts`: client-local `ApiError` (status, code, message, details; not from `shared` for now), `credentials: 'include'`, `Content-Type` only with a body, 204 → `undefined`, non-standard error bodies → `UNKNOWN_ERROR`, fetch failure → `NETWORK_ERROR` (status 0). It **throws on import if `VITE_API_URL` is missing** (at runtime, not build time), so the client Vitest project sets `test.env.VITE_API_URL`. `vite-env.d.ts` types the env var; local `client/.env` copied from `.env.example`. The `GalleryPage` placeholder shows the `/health` status. Verified in a real browser with Playwright (installed in the scratchpad, system Chrome): happy path, 404 flow, 375px, a real 503 with Postgres stopped and a real network failure with the API stopped. No-retry on 401/403/404 is unit-tested only until an endpoint can return them
