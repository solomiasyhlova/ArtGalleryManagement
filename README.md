# Art Gallery Management System

A full-stack app for managing and displaying artworks in a virtual gallery.
Signed-in users browse the collection and filter it by artist and type, or sort it
by price. Admins can also add, edit and delete artworks.

Built as the Techstack Trainee Full-Stack JS test task. Both the frontend and the
backend parts are implemented.

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

For a production build, run `npm run build`, then `npm run db:migrate -w server`
and `npm run start -w server` with `NODE_ENV=production` and `CLIENT_URL` set to
the client's origin (production cookies are `Secure`, so serve both over HTTPS). Set
`PUBLIC_URL` to the API's public URL before seeding, so the stored image URLs point
at it. The client build in `client/dist` is a static SPA (built with `VITE_API_URL`
set): serve it with a fallback to `index.html`.

## API

Base URL: `http://localhost:8000`

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
