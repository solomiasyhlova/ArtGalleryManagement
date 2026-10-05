# Coding Standards

Stack: React + Vite SPA (`client/`), Express API (`server/`), shared Zod schemas
and types (`shared/`), PostgreSQL + TypeORM, Tailwind CSS v4 + shadcn/ui.
TypeScript everywhere. See @context/project-overview.md for the full picture.

## TypeScript

- Strict mode enabled in every workspace
- No `any` types. Use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful
- Domain types (`Artwork`, `User`, `ArtworkInput`, `Paginated<T>`, `ApiError`) come
  from `shared/` (via `z.infer`). Do not redeclare them in `client/` or `server/`

## Shared (`shared/`)

- Single source of truth for Zod schemas, inferred types and constants
  (`ARTWORK_TYPES`, `USER_ROLES`, pagination limits)
- No runtime dependencies other than Zod. No Node-only or browser-only APIs
- Validation rules change here once, never separately in client and server

## React (`client/`)

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused. One job per component
- Extract reusable logic into custom hooks (`client/src/hooks/`)
- Server state goes through **TanStack Query** (`useQuery` / `useMutation`). No
  manual `fetch` in `useEffect`, and no copying server data into `useState`
- All HTTP calls go through `client/src/lib/api.ts` (typed wrapper,
  `credentials: 'include'`). Components never call `fetch` directly
- Forms use **React Hook Form** with `zodResolver(sharedSchema)`
- Filter, sort and page state lives in the URL query string (`useSearchParams`)
- Role checks in the UI (`isAdmin`) only hide controls. They are never a
  security boundary; the API enforces roles
- Pages are routed with **React Router** in `client/src/router.tsx`

## Express (`server/`)

- Layering: `routes → middleware → controllers → services → TypeORM repositories`
  - **Routes**: wire paths to middleware and controllers only
  - **Controllers**: read the validated request, call a service, send the
    response. No business logic, no repository access
  - **Services**: business logic and data access. No `req` / `res`
- Every protected route uses `requireAuth`. Every mutation of artworks also
  uses `requireRole('admin')`
- Validate `body`, `query` and `params` with the `validate(schema)` middleware
  using the shared Zod schemas. Never trust unvalidated input
- Use the correct HTTP status codes (201 create, 204 delete/logout, 400, 401,
  403, 404, 409)
- Read env vars only through `server/src/config/env.ts` (Zod-validated). No
  `process.env` elsewhere
- Never return `passwordHash` or other secrets in a response

## Tailwind CSS v4

**CRITICAL**: This stack uses Tailwind CSS v4, which uses CSS-based configuration.

- **DO NOT** create `tailwind.config.ts` or `tailwind.config.js` files (those are for v3)
- All theme configuration is done in CSS in `client/src/index.css`, using the
  `@theme` / `@theme inline` directives
- Use CSS custom properties for colors, spacing, etc. The token names and values
  are in the Type Reference section of @context/project-overview.md
- No JavaScript-based config

Example v4 configuration:

```css
@import "tailwindcss";

:root {
  --primary: #111111;
  --type-painting: #2563eb;
}

@theme inline {
  --color-primary: var(--primary);
  --color-type-painting: var(--type-painting);
}
```

## File Organization

- Pages: `client/src/pages/PageName.tsx`
- Components: `client/src/components/[feature]/ComponentName.tsx`
- shadcn/ui components: `client/src/components/ui/` (generated, edit sparingly)
- Hooks: `client/src/hooks/useThing.ts`
- Client utils: `client/src/lib/[utility].ts`
- Server routes: `server/src/routes/[feature].routes.ts`
- Server controllers: `server/src/controllers/[feature].controller.ts`
- Server services: `server/src/services/[feature].service.ts`
- Entities: `server/src/entities/EntityName.ts`
- Middleware: `server/src/middleware/[name].ts`
- Migrations: `server/src/db/migrations/` (generated)
- Shared schemas: `shared/src/schemas/[feature].ts`

## Naming

- Components and pages: PascalCase (`ArtworkCard.tsx`)
- Entities: PascalCase singular (`Artwork.ts`), table names snake_case
- Server files: kebab-case with a role suffix (`artworks.service.ts`)
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)
- Zod schemas: camelCase with a `Schema` suffix (`artworkInputSchema`)

## Styling

- Tailwind CSS for all styling
- Use shadcn/ui components where applicable
- No inline styles. No hard-coded hex values in components; use tokens
- Light theme only (it matches the mockup). Don't add dark mode unless the spec changes
- Merge conditional classes with `cn()` from `client/src/lib/utils.ts`

## Database

- Use TypeORM for all database operations. Use raw SQL only inside migrations or
  when the QueryBuilder can't express the query, and always parameterize it
- **`synchronize: false` always.** Every schema change is a migration:
  1. Change the entity
  2. `npm run db:migration:generate -- src/db/migrations/<Name>`
  3. Review the generated SQL
  4. `npm run db:migrate`
- Never edit a migration that has already been run. Write a new one
- Run `npm run db:migration:show` before committing to verify migrations are in sync
- Production deployments must run migrations before the server starts
- Use `numeric` for money, with a transformer to `number`
- Escape `%` and `_` in user input passed to `ILIKE`
- Seed data lives in `server/src/db/seed.ts` and must be idempotent

## Data Fetching

- Client → API only: TanStack Query hooks call `lib/api.ts`, and `lib/api.ts`
  calls Express
- Sorting, filtering and pagination happen on the server, not in the browser
- Mutations invalidate the affected query keys (`['artworks']`, `['artwork', id]`)
- Validate all inputs with Zod, on the client (forms) and the server (middleware)

## Error Handling

- Services throw `HttpError(status, code, message, details?)`. Controllers never
  build error responses themselves
- One `errorHandler` middleware produces the error shape
  `{ error: { code, message, details? } }`. Unknown errors become a 500 without
  internal details
- Async route handlers must forward errors to `next` (Express 5 does this for
  rejected promises; verify the installed version)
- The client maps `ApiError` to user-friendly toasts (`sonner`), and maps 400
  `details` to form field errors

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible
- No `console.log` in committed code (the server may use a small logger for
  startup and errors)
