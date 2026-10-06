@AGENTS.md

# Art Gallery Management System

A full-stack gallery app. Signed-in users browse, filter and sort artworks, and
admins add, edit and remove them. It is built with a React + Vite SPA, an Express
API, PostgreSQL and TypeORM.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

Run from the repo root (npm workspaces: `client`, `server`, `shared`).

- **Create the dev database (one time)**: `createdb -U postgres art_gallery`
- **Dev (client + server)**: `npm run dev`. The client runs on http://localhost:5173 and the API on http://localhost:8000
- **Dev (one side)**: `npm run dev -w client` / `npm run dev -w server`
- **Build**: `npm run build`
- **Production server**: `npm run start -w server`
- **Lint**: `npm run lint`
- **Typecheck (including tests)**: `npm run typecheck`
- **Test (once)**: `npm test`
- **Test (watch)**: `npm run test:watch`
- **Generate migration**: `npm run db:migration:generate -w server -- src/db/migrations/<Name>`
- **Run migrations**: `npm run db:migrate -w server`
- **Show migration status**: `npm run db:migration:show -w server`
- **Revert last migration**: `npm run db:migration:revert -w server`
- **Seed (admin + 4 artworks, idempotent)**: `npm run db:seed -w server`

## Database Rules

The dev database is `art_gallery` on the natively installed PostgreSQL 18
(Windows service, `localhost:5432`). There is no Docker. Connection details are
in `server/.env` (`DATABASE_URL`, gitignored). Machine-specific notes go in
`CLAUDE.local.md` (gitignored; copy `CLAUDE.local.md.example`).

- Only ever connect to the **local development** database. **NEVER** connect to
  or run anything against a production database unless I explicitly name
  "production" in my request.
- Schema changes go through TypeORM migrations only. Never set
  `synchronize: true`, and never alter the schema by hand.
- Never run destructive SQL (`DROP`, `DELETE`, `TRUNCATE`, unconfirmed
  `UPDATE`/`INSERT`), `db:migration:revert`, or `dropdb` without asking me
  first.
- When you run a DB operation, state which database you used.
