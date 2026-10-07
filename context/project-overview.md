# Art Gallery Management System Project Specifications

> Source: Techstack "Trainee Full-Stack JS Test Task" PDF. Both the frontend
> (SPA) and the backend (Web API) are implemented, so the client reads and writes
> through the real API instead of LocalStorage. Items marked **(extension)** go
> beyond the PDF and were agreed separately.

## Problem (Core Idea)

Gallery administrators need a simple way to manage and display art pieces in a
virtual gallery. Signed-in users browse the collection and filter and sort it.
Admins also add, edit and remove artworks. All changes persist in PostgreSQL, so
the gallery keeps its state across page reloads and sessions.

## Users

| Role      | How they get access                          | Can do                                                                          |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| **Guest** | Not signed in                                | Only `/login` and `/register`. Every other route redirects to `/login`.         |
| **User**  | Self-registration (`POST /auth/register`)    | View the gallery, filter, sort, paginate and open artwork details.              |
| **Admin** | Created by the seed script from env vars     | Everything a user can do, plus **add**, **edit** and **delete** artworks.       |

- Registration always creates a `user`. There is no promotion endpoint or UI.
- Role checks run on the **server** (authoritative) and in the **client** (hides
  admin-only controls; this is UX only and never a security boundary).

## Core Features

### A. Authentication & Authorization (extension)

- Register with name, email and password. Log in, log out, and restore the
  session on page load (`GET /auth/me`).
- Session: a signed JWT in an **httpOnly cookie**. JavaScript cannot read the token.
- The whole app requires login. A `401` from the API sends the user to `/login`
  and returns them to the page they were on after login.
- Admin-only actions return `403` from the API when a `user` attempts them.

### B. View Art Listings (PDF §1)

- Responsive grid of artwork cards. Each card shows the image, title, artist,
  type badge, price and availability badge.
- **Initial data:** the seed script inserts **4 artworks**, so the gallery is not
  empty on first launch (PDF: "The first 4 artworks should be presented when the
  application launches").
- Loading skeletons, empty state ("No artworks match your filters") and error
  state with a retry button.

### C. Sorting & Filtering (PDF §2)

- **Sort by price:** lowest→highest (`asc`) and highest→lowest (`desc`). With no
  sort selected, the default order is newest first.
- **Filter by artist:** a text search, case-insensitive partial match, debounced
  by 300 ms.
- **Filter by type:** a select that lists the predefined types plus "All types".
- Filters, sort and page number live in the **URL query string**, so they survive
  a reload and can be shared as a link.
- Sorting and filtering run **on the server** (`GET /artworks` query params), not
  on the client.

### D. Pagination (extension)

- `GET /artworks?page=&limit=`. The default `limit` is 12 and the maximum is 50.
- Pagination controls sit under the grid. Changing a filter or the sort resets the
  page to 1.

### E. Artwork Detail Page (extension)

- `/artworks/:id` uses `GET /artworks/:id`. It shows a large image and all fields.
- Admins see **Edit** and **Delete** buttons there.
- An unknown id shows a "not found" state with a link back to the gallery.

### F. Add New Artwork (PDF §3), admin only

- The **"Add New Artwork"** button opens a **modal dialog** with the artwork form.
- Fields and validation (the shared Zod schema used by client and server):
  - **Title:** required, trimmed, 1–99 characters
  - **Artist:** required, trimmed, 1–50 characters
  - **Type:** required, one of the predefined types (select)
  - **Price:** required, numeric only, greater than 0, at most 2 decimal places
  - **Availability:** boolean switch. On means "For sale" and off means
    "Exhibition only". The default is `true`.
  - **Image URL (extension):** optional, a valid `http(s)` URL, at most 2048 characters
- Inline field errors. The submit button is disabled while the request is pending.
  A success toast is shown and the list refreshes.

### G. Edit Artwork (PDF optional `PUT`), admin only

- The same form dialog, pre-filled. It opens from the detail page and from the
  card menu.
- `PUT` is a **full replacement** with exactly the same validation as `POST`.

### H. Delete Artwork (PDF §4), admin only

- Every card (and the detail page) has a delete button. A confirmation dialog
  shows the artwork title before deleting.
- Toast on success. Deleting from the detail page navigates back to the gallery.
- Note: the mockup shows one global "Remove Artwork" button. The PDF text says
  "each listing has a delete button", and we follow the text.

## Data Model (rough draft)

All tables use UUID primary keys. The API exposes `id` as a `string`, matching the
PDF model. Schema changes go through **TypeORM migrations** only. Table names are
`artworks` and `users` (`user` is a reserved word in Postgres).

### `ArtworkType` (enum)

`painting` · `sculpture` · `photography` · `drawing` · `print` · `digital`

Defined once in `shared/` as `ARTWORK_TYPES` (a `const` array) and reused by the
Postgres enum, the Zod schema and the UI select. See the
[Type Reference](#type-reference-ui-colors) for labels and colors.

### `Artwork`

| Field          | TS type        | Postgres column                         | Notes                                            |
| -------------- | -------------- | --------------------------------------- | ------------------------------------------------ |
| `id`           | `string`       | `uuid` PK, `gen_random_uuid()`          |                                                  |
| `title`        | `string`       | `varchar(99)` NOT NULL                  |                                                  |
| `artist`       | `string`       | `varchar(50)` NOT NULL, indexed         | `ILIKE` filter                                   |
| `type`         | `ArtworkType`  | `artwork_type` enum NOT NULL, indexed   |                                                  |
| `price`        | `number`       | `numeric(12,2)` NOT NULL, `CHECK > 0`   | TypeORM **transformer** maps string → `number`   |
| `availability` | `boolean`      | `boolean` NOT NULL DEFAULT `true`       | `true` = for sale, `false` = exhibition only     |
| `imageUrl`     | `string\|null` | `varchar(2048)` NULL                    | **extension**; absolute `http(s)` URL (local pictures: `${PUBLIC_URL}/images/<file>`); a placeholder is shown when null |
| `createdAt`    | `string` (ISO) | `timestamptz` DEFAULT `now()`           | default sort                                     |
| `updatedAt`    | `string` (ISO) | `timestamptz` DEFAULT `now()`           |                                                  |

### `User` (extension)

| Field          | TS type          | Postgres column                    | Notes                                       |
| -------------- | ---------------- | ---------------------------------- | ------------------------------------------- |
| `id`           | `string`         | `uuid` PK                          |                                             |
| `name`         | `string`         | `varchar(50)` NOT NULL             |                                             |
| `email`        | `string`         | `varchar(254)` UNIQUE NOT NULL     | stored lower-cased                          |
| `passwordHash` | `string`         | `varchar(72)` NOT NULL             | bcrypt; **never** returned by the API       |
| `role`         | `'user'\|'admin'`| `user_role` enum DEFAULT `'user'`  |                                             |
| `createdAt`    | `string` (ISO)   | `timestamptz`                      |                                             |
| `updatedAt`    | `string` (ISO)   | `timestamptz`                      |                                             |

No relations between `User` and `Artwork` (ownership or audit) are needed for this scope.

### Seed data (`npm run db:seed`, idempotent)

- **Admin:** created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`, but
  only if no user with that email exists.
- **4 artworks**, inserted only when the `artwork` table is empty:

| Title             | Artist          | Type        | Price  | Availability |
| ----------------- | --------------- | ----------- | ------ | ------------ |
| Abstract Vibrance | Alex Johnson    | painting    | 5500   | true         |
| Tranquil Lake     | Maria Gonzalez  | painting    | 3500   | true         |
| Geometric Harmony | Liam Smith      | digital     | 11000  | false        |
| Bronze Reverie    | Elena Petrova   | sculpture   | 8200   | true         |

- **Artwork images (extension):** pictures live in `server/public/images/` and are served
  at `GET /images/<file>` (image extensions only; anything else is a 404). The seed gives every artwork **without** an image the picture
  whose file name matches its title slug (`abstract-vibrance.jpg` → "Abstract Vibrance").
  Keep pictures ≤ 1600px wide and roughly ≤ 500 KB.

## Tech Stack

| Layer            | Choice                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------- |
| Language         | **TypeScript** (strict) everywhere                                                      |
| Repo layout      | npm **workspaces** monorepo: `client/`, `server/`, `shared/`                            |
| Frontend         | **React** + **Vite**                                                                    |
| Routing (client) | **React Router**                                                                        |
| Server state     | **TanStack Query** (caching, invalidation after mutations)                              |
| Forms            | **React Hook Form** + `@hookform/resolvers/zod`                                         |
| Styling          | **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.*`) + **shadcn/ui**        |
| Icons / toasts   | `lucide-react` · `sonner`                                                               |
| Font             | Poppins (`@fontsource/poppins`), matching the mockup                                    |
| Backend          | **Express** (TypeScript, run with `tsx` in dev)                                         |
| Database         | **PostgreSQL** (native local install, no Docker; connected via `DATABASE_URL`)          |
| ORM              | **TypeORM**. **Migrations only; `synchronize: false` always.**                          |
| Validation       | **Zod**. The schemas live in `shared/` and are used by the API and the forms.           |
| Auth             | `bcrypt` (cost 12) · `jsonwebtoken` (HS256) · `cookie-parser`                           |
| Security         | `helmet` (CORP `same-site` for `/images`) · `cors` (origin = `CLIENT_URL`, `credentials: true`) |
| Testing          | **Vitest**: shared schemas, server services, controllers and middleware (DB mocked)     |
| Lint / format    | ESLint + Prettier                                                                       |

> Exact versions are pinned in each `package.json`. Check the installed versions
> before relying on remembered APIs (see `AGENTS.md`).

### Ports & environment

- API: `http://localhost:8000` (the port used in the PDF examples)
- Client: `http://localhost:5173` (Vite)

`server/.env`: `PORT`, `DATABASE_URL` (e.g.
`postgres://postgres:<password>@localhost:5432/art_gallery`), `JWT_SECRET`, `JWT_EXPIRES_IN` (e.g. `1d`),
`CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `NODE_ENV`, `PUBLIC_URL` (optional,
default `http://localhost:$PORT`; the base of stored image URLs)
`client/.env`: `VITE_API_URL=http://localhost:8000`

### Deployment

- **Render, free plan** (`render.yaml`): one Web Service plus one Postgres. With
  `NODE_ENV=production` the API also serves `client/dist` from the **same origin**.
  `*.onrender.com` subdomains are cross-site, which would break the `lax` cookie.
- **SPA fallback by `Accept`**: after `/images` and `/health`, a `GET`/`HEAD` that
  prefers HTML gets `index.html` (`no-cache`). API calls send `Accept:
  application/json`, so `/artworks/:id` serves the page on a reload and JSON to the
  client.
- Hashed `/assets/*` are `immutable`, and CSP `img-src` allows `https:` for
  external image URLs.
- The start command runs `db:migrate:prod` and `db:seed:prod` (compiled `dist`, no
  `tsx`) before the server starts.

## Architecture Notes

### Repository structure

```
/
├─ shared/src/
│  ├─ constants.ts          # ARTWORK_TYPES, USER_ROLES, PAGE_SIZE limits
│  ├─ schemas/artwork.ts    # artworkInputSchema, artworkQuerySchema
│  ├─ schemas/auth.ts       # registerSchema, loginSchema
│  └─ types.ts              # Artwork, User, Paginated<T>, ApiError (z.infer-based)
├─ server/src/
│  ├─ index.ts              # bootstrap: init DataSource, listen
│  ├─ app.ts                # express app: helmet, cors, json, cookies, routes (incl. /images), errors
│  ├─ config/env.ts         # Zod-validated process.env
│  ├─ config/paths.ts       # IMAGES_DIR (server/public/images), IMAGES_ROUTE
│  ├─ db/data-source.ts     # TypeORM DataSource
│  ├─ db/migrations/        # generated migrations
│  ├─ db/seed.ts            # admin + 4 artworks + artwork images
│  ├─ entities/             # Artwork.ts, User.ts
│  ├─ routes/               # auth, artworks, images, client (prod: client/dist + SPA fallback)
│  ├─ controllers/          # HTTP in/out only
│  ├─ services/             # business logic + repository access
│  ├─ middleware/           # requireAuth, requireRole, validate, errorHandler, notFound, imageFilesOnly, spaFallback
│  └─ utils/                # HttpError, jwt helpers, cookie options, escapeLike, image slugs
├─ server/public/images/    # artwork pictures served at /images (extension)
└─ client/src/
   ├─ main.tsx, App.tsx     # providers (QueryClient, Router, AuthProvider, Toaster)
   ├─ router.tsx            # route table + guards
   ├─ index.css             # Tailwind import + @theme tokens
   ├─ pages/                # GalleryPage, ArtworkDetailPage, LoginPage, RegisterPage, NotFoundPage
   ├─ components/ui/        # shadcn/ui generated components
   ├─ components/layout/    # Header, Footer, ProtectedRoute, GuestOnlyRoute, AdminOnly
   ├─ components/artworks/  # ArtworkCard, ArtworkGrid, ArtworkToolbar, ArtworkFormDialog,
   │                        # DeleteArtworkDialog, TypeBadge, AvailabilityBadge, Pagination
   ├─ hooks/                # useAuth, useArtworks, useArtwork, useArtworkMutations, useQueryParams
   └─ lib/                  # api.ts (fetch wrapper), format.ts (price), utils.ts (cn)
```

### Server request flow

`route → requireAuth → requireRole('admin')? → validate(schema) → controller → service → TypeORM repository`

- **Controllers** contain no business logic. **Services** contain no `req`/`res`.
- **Validation**: the `validate` middleware parses `body`, `query` or `params` with
  Zod. On failure it returns **400** with per-field details. Unknown body keys are
  stripped. Parsed values go to `res.locals.validated`, because Express 5's
  `req.query` can't be reassigned.
- **Errors**: services throw `HttpError(status, code, message)`. One `errorHandler`
  formats every error, and unknown errors become a 500 without a stack trace in
  production.
- **Error shape**:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body", "details": { "price": ["Must be greater than 0"] } } }
  ```
  Codes: `VALIDATION_ERROR` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 ·
  `NOT_FOUND` 404 · `EMAIL_TAKEN` 409 · `INTERNAL_ERROR` 500
- A malformed UUID in `:id` → **404** (treated as "not found", never a DB error).

### Auth design

- Login and register set the cookie `token`: `httpOnly`, `sameSite: 'lax'`,
  `secure` in production, `path: '/'`, `maxAge` = JWT expiry. The JWT payload is
  `{ sub: userId, role }`.
- `requireAuth` verifies the JWT and loads the user. If the user no longer exists
  it returns 401. `requireRole('admin')` returns 403.
- `localhost:5173` and `localhost:8000` are **same-site** (port is ignored), so a
  `lax` cookie works in dev with `fetch(..., { credentials: 'include' })`.
- Login failures always return the same generic message ("Invalid email or
  password").
- Passwords: 8–72 characters (bcrypt input limit). `passwordHash` is excluded from
  every response.
- No refresh tokens in this scope. When the JWT expires, the next request returns
  401 and the client redirects to login.

### `GET /artworks` query semantics

| Param    | Values                  | Behavior                                          | Invalid → |
| -------- | ----------------------- | ------------------------------------------------- | --------- |
| `price`  | `asc` \| `desc`         | `ORDER BY price`, then `createdAt DESC, id`       | 400       |
| `artist` | string (≤ 50)           | `artist ILIKE %value%` (wildcards escaped)        | 400       |
| `type`   | `ArtworkType`           | exact match                                       | 400       |
| `page`   | int ≥ 1, default 1      |                                                   | 400       |
| `limit`  | int 1–50, default 12    |                                                   | 400       |

Response: `{ "data": Artwork[], "meta": { "page": 1, "limit": 12, "total": 4, "totalPages": 1 } }`

### Client data flow

- `lib/api.ts`: a typed `fetch` wrapper with `credentials: 'include'`. It parses
  the error shape into an `ApiError`, and on 401 it clears the auth state.
- `AuthProvider`: calls `GET /auth/me` on mount and exposes `{ user, isAdmin,
  login, register, logout }`. The route guards render a spinner until this check
  finishes.
- Query keys: `['artworks', { price, artist, type, page, limit }]` and
  `['artwork', id]`. Every create, update or delete invalidates `['artworks']` (and
  the matching `['artwork', id]`).
- Server field errors (400 `details`) are mapped back onto the form with
  `setError`.

## Routing Map

### Client routes (React Router)

| Path             | Page                | Access                | Notes                                                                    |
| ---------------- | ------------------- | --------------------- | ------------------------------------------------------------------------ |
| `/login`         | `LoginPage`         | guest only            | Signed-in users are redirected to `/`. Supports a `?redirect=` return path. |
| `/register`      | `RegisterPage`      | guest only            | Logs the user in on success and goes to `/`.                             |
| `/`              | `GalleryPage`       | user, admin           | URL state: `?price=&artist=&type=&page=`                                 |
| `/artworks/:id`  | `ArtworkDetailPage` | user, admin           | Edit and Delete buttons for admins.                                      |
| `*`              | `NotFoundPage`      | any                   |                                                                          |

Modals are component state, not routes:

- **Add artwork**: `ArtworkFormDialog` in create mode, opened from `/` (admin).
- **Edit artwork**: `ArtworkFormDialog` in edit mode, opened from the card menu or `/artworks/:id` (admin).
- **Delete confirm**: `DeleteArtworkDialog`, opened from the card or `/artworks/:id` (admin).

### API routes (Express, `http://localhost:8000`)

| Method   | Path              | Auth | Role  | Body / Query                            | Success           | Errors              |
| -------- | ----------------- | ---- | ----- | --------------------------------------- | ----------------- | ------------------- |
| `POST`   | `/auth/register`  | —    | —     | `{ name, email, password }`             | 201 `User` + cookie | 400, 409          |
| `POST`   | `/auth/login`     | —    | —     | `{ email, password }`                   | 200 `User` + cookie | 400, 401          |
| `POST`   | `/auth/logout`    | —    | —     | —                                       | 204, cookie cleared |                   |
| `GET`    | `/auth/me`        | ✔    | any   | —                                       | 200 `User`        | 401                 |
| `GET`    | `/artworks`       | ✔    | any   | `?price&artist&type&page&limit`         | 200 `Paginated<Artwork>` | 400, 401     |
| `GET`    | `/artworks/:id`   | ✔    | any   | —                                       | 200 `Artwork`     | 401, 404            |
| `POST`   | `/artworks`       | ✔    | admin | `ArtworkInput`                          | 201 `Artwork`     | 400, 401, 403       |
| `PUT`    | `/artworks/:id`   | ✔    | admin | `ArtworkInput` (full replace)           | 200 `Artwork`     | 400, 401, 403, 404  |
| `DELETE` | `/artworks/:id`   | ✔    | admin | —                                       | 204               | 401, 403, 404       |
| `GET`    | `/health`         | —    | —     | —                                       | 200 `{ status: "ok" }` |                |
| `GET`    | `/images/:file`   | —    | —     | —                                       | 200 image (static) | 404                |

`ArtworkInput` = `{ title, artist, type, price, availability?, imageUrl? }`.
Example from the PDF:

```json
{ "title": "Sunset Over the Ocean", "artist": "Claude Monet", "type": "painting", "price": 4500, "availability": true }
```

## Type Reference (UI colors)

The light theme matches the mockup (white surfaces, black primary buttons, dark
footer). Tokens are defined in `client/src/index.css`, using shadcn/ui variable
names exposed through Tailwind v4's `@theme inline`. **Never hard-code hex values
in components; always use the tokens.**

### Base palette

| Token                    | Hex       | Used for                                       |
| ------------------------ | --------- | ---------------------------------------------- |
| `--background`           | `#FFFFFF` | page background                                |
| `--foreground`           | `#0A0A0A` | body text, headings                            |
| `--card`                 | `#FFFFFF` | artwork cards, dialogs                         |
| `--card-foreground`      | `#0A0A0A` |                                                |
| `--muted`                | `#F4F4F5` | skeletons, image placeholder, input bg         |
| `--muted-foreground`     | `#71717A` | "By: Artist", meta text, placeholders          |
| `--border` / `--input`   | `#E4E4E7` | card borders, inputs, dividers                 |
| `--ring`                 | `#A1A1AA` | focus rings                                    |
| `--primary`              | `#111111` | primary buttons ("Add New Artwork", submit)    |
| `--primary-foreground`   | `#FAFAFA` |                                                |
| `--secondary`            | `#F4F4F5` | secondary / ghost buttons                      |
| `--secondary-foreground` | `#18181B` |                                                |
| `--destructive`          | `#DC2626` | delete buttons, confirm-delete, error text     |
| `--success`              | `#16A34A` | "For sale" badge dot, success toasts           |
| `--footer`               | `#1C1C1C` | footer background                              |
| `--footer-foreground`    | `#FAFAFA` | footer text and icons                          |

### Artwork type colors

Each type has an accent that colors the **card border** (2px) and the **type
badge**. These colors come from the mockup's green and blue card outlines. Badges
always include the text label, so color is never the only signal.

| `type` value  | Label        | Accent token          | Accent (border) | Badge bg  | Badge text |
| ------------- | ------------ | --------------------- | --------------- | --------- | ---------- |
| `painting`    | Painting     | `--type-painting`     | `#2563EB`       | `#EFF6FF` | `#1D4ED8`  |
| `sculpture`   | Sculpture    | `--type-sculpture`    | `#D97706`       | `#FFFBEB` | `#B45309`  |
| `photography` | Photography  | `--type-photography`  | `#7C3AED`       | `#F5F3FF` | `#6D28D9`  |
| `drawing`     | Drawing      | `--type-drawing`      | `#0D9488`       | `#F0FDFA` | `#0F766E`  |
| `print`       | Print        | `--type-print`        | `#E11D48`       | `#FFF1F2` | `#BE123C`  |
| `digital`     | Digital Art  | `--type-digital`      | `#334155`       | `#F8FAFC` | `#1E293B`  |

The `type → { label, colorClass }` map lives in one place
(`components/artworks/TypeBadge.tsx` or a `lib/artwork-types.ts`) and is keyed off
`ARTWORK_TYPES`. Adding a type means adding one row to this map.

### Availability

| `availability` | Label           | Style                                                  |
| -------------- | --------------- | ------------------------------------------------------ |
| `true`         | For sale        | `--success` dot + text on `#F0FDF4`                    |
| `false`        | Exhibition only | `--muted-foreground` dot + text on `--muted`           |

## UI / UX

The mockup in the PDF ("ArtGalleryManager") is the reference.

### Layout

- **Header** (white, bottom border): palette icon and **"ArtGalleryManager"**
  wordmark on the left. User menu on the right: name, role badge (`Admin`/`User`)
  and Log out.
- **Main**: the heading **"Explore Our Collection"**, then the toolbar, the grid
  and the pagination.
- **Toolbar**: artist search input ("Search by artist…"), type select, "Sort by"
  select (Price: Low → High / High → Low), a "Clear filters" link when any filter
  is active, and **"Add New Artwork"** (primary, admin only).
- **Grid**: 1 column under 640px, 2 at `sm`, 3 at `lg`, 4 at `xl`, with a 24px gap.
- **Footer** (`--footer`, dark): "ArtGalleryManager" plus the tagline *"Your go-to
  platform for managing and exploring exquisite art pieces."* on the left, and
  social icons (Facebook, X, Instagram) on the right.

### Artwork card

- Rounded `lg` corners, white background, 2px border in the type accent color,
  subtle shadow that lifts on hover. The whole card links to `/artworks/:id`.
- Image at a 4:3 ratio with `object-cover`. With no `imageUrl` (or when the image
  fails to load), a `--muted` placeholder shows the type icon.
- Row 1: **title** (semibold, one line, truncated) and **price** right-aligned
  (bold, `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, trailingZeroDisplay: 'stripIfInteger' })`
  → `$5,500`, `$4,500.50`).
- Row 2: "By: {artist}" in `--muted-foreground`, small.
- Row 3: type badge and availability badge.
- Admin only: a kebab menu (Edit / Delete) in the top-right corner of the image.
  It is rendered as a sibling of the card link (not nested inside it), so opening
  it never triggers card navigation.

### Forms & dialogs

- shadcn `Dialog` with fields Title, Artist, Type (`Select`), Price (number input
  with `$` prefix, `min > 0`, step 0.01), Availability (`Switch`, with the helper
  text "For sale / Exhibition only") and Image URL (with a live preview thumbnail).
- Validation runs on blur and on submit. Errors show under each field in
  `--destructive`.
- Delete confirmation is an `AlertDialog`: "Delete "{title}"? This cannot be
  undone." The confirm button uses the destructive style.
- Feedback: `sonner` toasts for create, update, delete and API errors.

### Auth pages

- A centered card on `--muted` with the logo, form, primary submit button and a
  link to the other page ("No account? Register" / "Have an account? Log in").

### Accessibility & responsiveness

- Mobile first. The toolbar stacks vertically under `sm`.
- All interactive elements are keyboard reachable with a visible `--ring` focus
  ring. Dialogs trap focus (shadcn/Radix).
- Images have `alt="{title} by {artist}"`. Icon-only buttons have `aria-label`.
- Text contrast meets WCAG AA on all tokens above.
- Light theme only for this scope (it matches the mockup).

## Roadmap

Each step is a feature spec in `context/features/`. Run them in order with
`/feature load <name>`, for example `/feature load setup-phase-1-spec`.

| #  | Spec                       | Scope                                                                  |
| -- | -------------------------- | ---------------------------------------------------------------------- |
| 1  | `setup-phase-1-spec`       | npm workspaces, TS/ESLint/Prettier/Vitest, `shared` package constants  |
| 2  | `setup-phase-2-spec`       | Express skeleton: env, helmet/cors/cookies, error contract, `validate` |
| 3  | `setup-phase-3-spec`       | TypeORM + local Postgres, migration and seed scripts                   |
| 4  | `setup-phase-4-spec`       | Vite client, Tailwind v4, shadcn/ui, theme tokens, Poppins             |
| 5  | `setup-phase-5-spec`       | Router, TanStack Query, `lib/api.ts`, Header/Footer, 404 page          |
| 6  | `auth-phase-1-spec`        | `User` entity, login/logout/me, JWT cookie, `requireAuth`/`requireRole`, admin seed |
| 7  | `auth-phase-2-spec`        | `POST /auth/register`                                                  |
| 8  | `auth-phase-3-spec`        | Login/register pages, route guards, header user menu                   |
| 9  | `artworks-phase-1-spec`    | `Artwork` entity, 4-artwork seed, `GET /artworks` (+ filters/sort/pages), `GET /artworks/:id` |
| 10 | `artwork-images-spec`      | **(extension)** `server/public/images` served at `/images`, seed links pictures by title slug |
| 11 | `artworks-phase-2-spec`    | Admin `POST` / `PUT` / `DELETE /artworks`                              |
| 12 | `gallery-phase-1-spec`     | Gallery grid, cards, type and availability badges                      |
| 13 | `gallery-phase-2-spec`     | Toolbar filters/sort, URL state, pagination                            |
| 14 | `gallery-phase-3-spec`     | Admin add/edit dialog, delete confirmation, mutations                  |
| 15 | `artwork-detail-spec`      | `/artworks/:id` page, final polish                                     |

## Status

Finished and deployed. Every roadmap step is implemented, and the app runs on
Render's free plan at https://art-gallery-sttn.onrender.com/.
