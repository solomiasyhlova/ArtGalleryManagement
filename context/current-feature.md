# Current Feature: Setup - Client (Vite, Tailwind v4 & shadcn/ui)

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Bullet points of what success looks like. Filled by `/feature load`. -->

- `client` workspace scaffolded with `npm create vite@latest client -- --template react-ts`, added to the root workspaces and the root `dev` script (client + server together)
- Vite demo content removed (`App.css`, logos, counter)
- Dev server on port 5173 with `strictPort: true`
- Tailwind v4 via `@tailwindcss/vite`; `client/src/index.css` starts with `@import "tailwindcss"`. No `tailwind.config.*` or `postcss.config.*`
- `@/*` → `src/*` alias in `tsconfig.json`, `tsconfig.app.json` and `vite.config.ts`
- shadcn/ui initialized (`components.json`, `lib/utils.ts` `cn()`), with `button`, `input`, `label`, `badge`, `skeleton`, `dropdown-menu`, `sonner` added
- shadcn default colors replaced by the overview's hex tokens (base palette, `--success`, `--footer`, `--footer-foreground`, `--type-*` accents), all exposed via `@theme inline` so `bg-primary`, `bg-footer`, `border-type-painting` work
- Poppins (`@fontsource/poppins` 400/500/600/700) set as `--font-sans`
- `lib/format.ts` `formatPrice()` with unit tests (`5500` → `$5,500`, `4500.5` → `$4,500.50`)
- `client/vitest.config.ts` (Node env, `@` alias), picked up by root `npm test`
- `client/.env.example` with `VITE_API_URL=http://localhost:8000`
- Root `eslint.config.js` extended with React Hooks / React Refresh rules for `client/` (scaffold's own ESLint config merged, not kept)
- Placeholder `App.tsx`: "Explore Our Collection" heading and a primary `Button`
- `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` pass for all workspaces

## Notes

<!-- Additional context, constraints, or details from the spec. -->

- Verify current Vite / Tailwind v4 / shadcn conventions with Context7 or the official docs before configuring (see `AGENTS.md`)
- shadcn's Vite guide needs the `@/*` alias in **both** `tsconfig.json` and `tsconfig.app.json`, or `init` can't detect it
- `shadcn init` writes oklch colors into `index.css`: replace the values with our hex tokens but keep shadcn's variable names so generated components keep working
- Light theme only: delete the generated `.dark { ... }` block
- `formatPrice` uses `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, trailingZeroDisplay: 'stripIfInteger' })`
- Never hard-code hex values in components; tokens only
- Verification: Poppins heading + black primary button render; `--primary` resolves to `#111111` in DevTools; a test element with `border-type-painting` shows blue
- References: https://tailwindcss.com/docs/installation/using-vite · https://ui.shadcn.com/docs/installation/vite · https://ui.shadcn.com/docs/theming · https://fontsource.org/fonts/poppins/install

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Setup - Workspaces & Tooling (setup-phase-1): npm workspaces (`shared`), strict TS base config, ESLint flat config + Prettier, Vitest projects, `@art-gallery/shared` constants. TypeScript pinned to `~6.0.3` because typescript-eslint 8.x supports only `<6.1.0`
- Setup - Express Server Skeleton (setup-phase-2): `server` workspace (Express 5, helmet, credentialed CORS, cookies, `GET /health`), Zod-validated env with fail-fast, `HttpError` + `notFound` + `errorHandler` (body-parser 4xx keep their status as `VALIDATION_ERROR`, unknown → 500 without internals), `validate` middleware (Zod 4 per-field details, `res.locals.validated`), shared `ERROR_CODES` / `ApiErrorBody`. Split `tsconfig.json` (type-checks tests) / `tsconfig.build.json` (emit), new `npm run typecheck`. Toolchain now requires npm 12 (npm 11 dropped native optional deps on install) and Node `^22.22.2 || ^24.15.0 || >=26`; `.gitattributes` forces LF. `tsx watch` picks up `shared/dist` changes without `--include`
- Setup - Database (setup-phase-3): TypeORM 1.1.1 + `pg` against the local `art_gallery` DB. `AppDataSource` (`synchronize: false`, dev-only logging, `connectTimeoutMS: 5000`, forward-slash migrations glob from `import.meta.dirname`), `DATABASE_URL` in the Zod env. Server connects before `listen` and exits with the error code + message on failure; `GET /health` runs `SELECT 1` (503 `db: "down"`). `db:*` scripts run the hoisted TypeORM CLI (`../node_modules/typeorm/cli.js`) via `tsx --env-file-if-exists=.env`; transactional `seed.ts` runner (no steps yet); `numericTransformer` for money columns. Tests for the transformer and health route (mocked `AppDataSource`). Gotcha for auth-phase-1: generated migrations use a value `import { MigrationInterface, QueryRunner }`, which fails `verbatimModuleSyntax`. Switch it to `import type` before the first `db:migrate`
