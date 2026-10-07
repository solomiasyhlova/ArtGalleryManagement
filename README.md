# Art Gallery Management System

A full-stack app for managing and displaying artworks in a virtual gallery.
Signed-in users browse the collection and filter it by artist and type, or sort it
by price. Admins can also add, edit and delete artworks.

Built as the Techstack Trainee Full-Stack JS test task. Both the frontend and the
backend parts are implemented.

## Live Demo

**https://art-gallery-sttn.onrender.com/**

| Role  | Email                 | Password   |
| ----- | --------------------- | ---------- |
| Admin | `admin@gallery.local` | `ADMIN123` |

Log in as the admin to add, edit and delete artworks, or register your own account
to browse, filter and sort the gallery as a regular user. It runs on Render's free
plan, so after 15 minutes without traffic the first request can take about a minute
while the service wakes up.

## Tech Stack

- **Client:** React + Vite, TypeScript, React Router, TanStack Query, React Hook
  Form, Tailwind CSS v4, shadcn/ui
- **Server:** Express, TypeScript, TypeORM, PostgreSQL, JWT (httpOnly cookie) auth
- **Shared:** Zod schemas and types used by both sides
- **Tooling:** npm workspaces, Vitest, ESLint, Prettier

## Getting Started

Prerequisites:

- Node.js `^22.22.2`, `^24.15.0` or `>=26`, with **npm 12 or newer** (`npm install -g npm@latest`)
- PostgreSQL running locally (its `bin` folder on `PATH` for `createdb`)

```bash
npm install
createdb -U postgres art_gallery     # one-time: create the database
cp server/.env.example server/.env   # set DATABASE_URL, JWT_SECRET and ADMIN_PASSWORD
cp client/.env.example client/.env
npm run db:migrate -w server         # create the schema
npm run db:seed -w server            # admin account + 4 starter artworks with pictures
npm run dev                          # client :5173, API :8000
```

Open http://localhost:5173 and log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `server/.env`, or register a regular user account.

The seed is idempotent: it creates the admin only if that email is free, inserts the
artworks only into an empty table, and links each artwork without a picture to the
file in `server/public/images/` named after its title (`tranquil-lake.jpg` →
"Tranquil Lake"). The API serves those files at `/images/<file>`.

### Production

In production one Node process serves both the API and the built client from a
single origin. With `NODE_ENV=production` the server also serves `client/dist`:
hashed `/assets/*` files are cached for a year, and a browser navigation (a `GET`
that prefers HTML) to any other path gets `index.html`. API calls send
`Accept: application/json`, so `/artworks/:id` returns the page on a reload and
JSON to the client.

```bash
VITE_API_URL=https://gallery.example.com npm run build   # baked into the client
npm run db:migrate:prod -w server    # compiled migrations, no tsx needed
npm run db:seed:prod -w server
npm run start -w server
```

Set `NODE_ENV=production`, and set `CLIENT_URL`, `PUBLIC_URL` and `VITE_API_URL`
to the same public origin. Production cookies are `Secure`, so serve it over HTTPS.
Set `PUBLIC_URL` before the first seed, because the stored image URLs start with it.

## Deploy to Render

[`render.yaml`](render.yaml) is a Render Blueprint for the free plan. It defines one
free Web Service (`art-gallery`) and one free Postgres database (`art-gallery-db`)
in Frankfurt. Both parts run on one service because `onrender.com` is a public
suffix: two `*.onrender.com` subdomains are different sites, so the `lax` auth
cookie would never reach a separately hosted API.

1. Push the repository to GitHub. In the Render dashboard, choose **New →
   Blueprint** and select the repository.
2. Enter the values Render asks for:
   - `ADMIN_PASSWORD`: 8–72 characters. The admin logs in as `admin@gallery.local`.
   - `CLIENT_URL`, `PUBLIC_URL` and `VITE_API_URL`: all three are the service URL,
     e.g. `https://art-gallery.onrender.com`.
3. Apply the Blueprint. The build installs with npm 12 and builds every workspace.
   Each start applies pending migrations and runs the seed (both are idempotent),
   then starts the server. `/health` is the health check.

`JWT_SECRET` is generated, and `DATABASE_URL` comes from the database (its internal
URL). Render provides `PORT`. [`.node-version`](.node-version) pins Node.

If the name is taken, Render adds a suffix to the service URL (e.g.
`art-gallery-abcd.onrender.com`). Check the real URL on the service page. If it
differs, set the three URL variables to it and redeploy. If the first start already
seeded the pictures with the wrong `PUBLIC_URL`, fix the stored `image_url` values
in the database by hand, because the seed only fills empty ones.

**Redeploying:** every push to the default branch deploys automatically. Use
**Manual Deploy** to deploy on demand. `VITE_API_URL` is compiled into the client,
so a change to it needs a new build, not just a restart.

**Free-plan limits** (fine for a short demo):

- The service sleeps after 15 minutes without traffic, and the next request takes
  about a minute to wake it.
- 750 instance hours per month and 512 MB RAM.
- 5 GB of outbound bandwidth per month on the Hobby workspace.
- The free database has 1 GB of storage and no backups. It **expires 30 days**
  after creation and is deleted after a further 14-day grace period.

## API

Base URL: `http://localhost:8000` in development, the
[demo URL](https://art-gallery-sttn.onrender.com) in production.

| Method | Path             | Access |
| ------ | ---------------- | ------ |
| POST   | `/auth/register` | public |
| POST   | `/auth/login`    | public |
| POST   | `/auth/logout`   | public |
| GET    | `/auth/me`       | user   |
| GET    | `/artworks?price=asc\|desc&artist=&type=&page=&limit=` | user |
| GET    | `/artworks/:id`  | user   |
| POST   | `/artworks`      | admin  |
| PUT    | `/artworks/:id`  | admin  |
| DELETE | `/artworks/:id`  | admin  |
| GET    | `/images/:file`  | public |
| GET    | `/health`        | public |

Invalid input returns `400` with field-level details. See
[context/project-overview.md](context/project-overview.md) for the full
specification: the data model, validation rules, error format and UI.

## Scripts

Run from the repository root.

| Command                                | Description                                         |
| -------------------------------------- | --------------------------------------------------- |
| `npm run dev`                          | Run the client and the server in dev mode           |
| `npm run build`                        | Build all workspaces                                |
| `npm run start -w server`              | Start the built server                              |
| `npm run typecheck`                    | Type-check all workspaces, tests included           |
| `npm run lint`                         | Lint all workspaces                                 |
| `npm run format` / `format:check`      | Format with Prettier / check the formatting         |
| `npm test`                             | Run the unit tests once                             |
| `npm run test:watch`                   | Run the unit tests in watch mode                    |
| `npm run db:migrate -w server`         | Apply pending migrations                            |
| `npm run db:migration:show -w server`  | List migrations and whether they have run           |
| `npm run db:migration:revert -w server`| Revert the last migration                           |
| `npm run db:migration:generate -w server -- src/db/migrations/<Name>` | Generate a migration from entity changes |
| `npm run db:seed -w server`            | Seed the admin, the starter artworks and pictures   |
| `npm run db:migrate:prod -w server` / `db:seed:prod` | Migrate / seed from the built `dist` (production) |
