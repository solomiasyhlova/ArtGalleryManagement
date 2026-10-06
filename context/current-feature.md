# Current Feature: Setup - App Shell (Router, Providers & Layout)

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Bullet points of what success looks like. Filled by `/feature load`. -->

- React Router in data mode (`createBrowserRouter` + `RouterProvider`) in `client/src/router.tsx`: `/` → `GalleryPage`, `/login` and `/register` → placeholders, `*` → `NotFoundPage` (`/artworks/:id` comes in artwork-detail)
- `AppLayout` route with `Header`, `<main>` + `<Outlet />` and `Footer`; the footer sticks to the bottom on short pages
- `Header` (white, bottom border): lucide `Palette` icon + "ArtGalleryManager" wordmark linking to `/`, and an empty right-hand slot for the user menu
- `Footer` (`bg-footer text-footer-foreground`): wordmark, tagline "Your go-to platform for managing and exploring exquisite art pieces.", and Facebook / X / Instagram icon links, each with an `aria-label`
- `lib/query-client.ts`: `staleTime` 30s, `retry` once except for 401/403/404
- `App.tsx` mounts `QueryClientProvider`, `RouterProvider` and one `<Toaster />`; `main.tsx` renders `App`
- `lib/api.ts`: `api.get/post/put/delete<T>(path, body?)` over `fetch(VITE_API_URL + path, { credentials: 'include' })`, JSON in/out, 204 → `undefined`, non-2xx → `ApiError` (status, code, message, details) from the shared error shape, network failure → `ApiError` with code `NETWORK_ERROR`
- `GalleryPage` placeholder: "Explore Our Collection" plus the API status from `GET /health` via `useQuery` (ok / error state)
- `NotFoundPage`: a message and a link back to the gallery
- Unit tests for `lib/api.ts` with mocked `fetch`: 2xx JSON, 204, error body → `ApiError`, network failure
- No horizontal scroll at 375px; header and footer wrap cleanly
- `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` pass

## Notes

<!-- Additional context, constraints, or details from the spec. -->

- Spec: `context/features/setup-phase-5-spec.md`. Auth guards come in auth-phase-3; pages stay placeholders
- Verify installed versions first (Context7 / package docs): React Router v7 imports from `react-router`, not `react-router-dom`. Data mode only: no `react-router.config.ts`, no React Router Vite plugin
- TanStack Query v5: object signature `useQuery({ queryKey, queryFn })` only; mutations use `isPending`
- `credentials: 'include'` on every request, or the auth cookie is never sent
- lucide brand icons (Facebook, Instagram, Twitter) are deprecated: use them if the installed version still ships them, otherwise small inline SVGs
- Sticky footer: `min-h-dvh flex flex-col` on the layout, `flex-1` on `<main>`
- Use tokens only (no hex in components); merge classes with `cn()` from `@/lib/utils`

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Setup - Workspaces & Tooling (setup-phase-1): npm workspaces (`shared`), strict TS base config, ESLint flat config + Prettier, Vitest projects, `@art-gallery/shared` constants. TypeScript pinned to `~6.0.3` because typescript-eslint 8.x supports only `<6.1.0`
- Setup - Express Server Skeleton (setup-phase-2): `server` workspace (Express 5, helmet, credentialed CORS, cookies, `GET /health`), Zod-validated env with fail-fast, `HttpError` + `notFound` + `errorHandler` (body-parser 4xx keep their status as `VALIDATION_ERROR`, unknown → 500 without internals), `validate` middleware (Zod 4 per-field details, `res.locals.validated`), shared `ERROR_CODES` / `ApiErrorBody`. Split `tsconfig.json` (type-checks tests) / `tsconfig.build.json` (emit), new `npm run typecheck`. Toolchain now requires npm 12 (npm 11 dropped native optional deps on install) and Node `^22.22.2 || ^24.15.0 || >=26`; `.gitattributes` forces LF. `tsx watch` picks up `shared/dist` changes without `--include`
- Setup - Database (setup-phase-3): TypeORM 1.1.1 + `pg` against the local `art_gallery` DB. `AppDataSource` (`synchronize: false`, dev-only logging, `connectTimeoutMS: 5000`, forward-slash migrations glob from `import.meta.dirname`), `DATABASE_URL` in the Zod env. Server connects before `listen` and exits with the error code + message on failure; `GET /health` runs `SELECT 1` (503 `db: "down"`). `db:*` scripts run the hoisted TypeORM CLI (`../node_modules/typeorm/cli.js`) via `tsx --env-file-if-exists=.env`; transactional `seed.ts` runner (no steps yet); `numericTransformer` for money columns. Tests for the transformer and health route (mocked `AppDataSource`). Gotcha for auth-phase-1: generated migrations use a value `import { MigrationInterface, QueryRunner }`, which fails `verbatimModuleSyntax`. Switch it to `import type` before the first `db:migrate`
- Setup - Client (setup-phase-4): `@art-gallery/client` workspace (Vite 8, React 19) on 5173 with `strictPort`, in the root `dev` / `build`. Tailwind v4 via `@tailwindcss/vite` (no tailwind/postcss config). `@/*` alias via `paths` **without `baseUrl`** (deprecated in TS 6); client tsconfigs extend `tsconfig.base.json`. shadcn 4 (`radix-nova`, Radix base) with button/input/label/badge/skeleton/dropdown-menu/sonner; `cn()` now comes from shadcn's `cn` npm package (`lib/utils.ts` re-exports it, generated components import `cn` directly; our code uses `@/lib/utils`). Hex tokens (base palette, `--success`, `--footer*`, `--type-*`) via `@theme inline`; `.dark` block, chart/sidebar vars, Geist font and `next-themes` removed; `@custom-variant dark` **kept** so generated `dark:` classes never follow the OS; toaster pinned to `theme="light"`. Poppins 400–700 as `--font-sans`. `formatPrice()` + tests, client Vitest project (Node env, `@` alias). create-vite 9 ships oxlint: replaced by `react-hooks` + `react-refresh` (Vite preset) in the root ESLint config, `react-refresh` off for `components/ui`. Known `npm audit` high (`braces`) comes only via the `shadcn` CLI (tooling, not bundled); don't run `audit fix --force` (downgrades shadcn to 1.0)
