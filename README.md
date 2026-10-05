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

Prerequisites: Node.js (LTS) and PostgreSQL running locally.

```bash
npm install
createdb -U postgres art_gallery     # one-time: create the database
cp server/.env.example server/.env   # set DATABASE_URL, JWT_SECRET and ADMIN_* values
cp client/.env.example client/.env
npm run db:migrate -w server         # create the schema
npm run db:seed -w server            # admin account + 4 starter artworks
npm run dev                          # client :5173, API :8000
```

Open http://localhost:5173 and log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `server/.env`, or register a regular user account.

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

Invalid input returns `400` with field-level details. See
[context/project-overview.md](context/project-overview.md) for the full
specification: the data model, validation rules, error format and UI.

## Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm run dev`        | Run client and server in dev mode |
| `npm run build`      | Build all workspaces            |
| `npm run lint`       | Lint all workspaces             |
| `npm test`           | Run unit tests once             |
| `npm run test:watch` | Run tests in watch mode         |
