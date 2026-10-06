# Current Feature: Setup - Express Server Skeleton

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

Complete

## Goals

<!-- Bullet points of what success looks like. Filled by `/feature load`. -->

- `server` added to root `workspaces` and to the root `dev` script
- `server` scripts: `dev` (`tsx watch`), `build` (`tsc`), `start` (`node dist/index.js`), `test` (`vitest run`)
- `config/env.ts` loads `.env`, Zod-parses `process.env` (`PORT`, `NODE_ENV`, `CLIENT_URL`) and fails fast with a readable message
- `app.ts` exports `createApp()` (no `listen`) with `helmet()`, `cors({ origin: env.CLIENT_URL, credentials: true })`, `express.json()`, `cookieParser()`, then routes, then `notFound`, then `errorHandler`
- `GET /health` → 200 `{ "status": "ok" }`
- `HttpError(status, code, message, details?)` class
- `errorHandler`:
  - `HttpError` → `{ error: { code, message, details? } }`
  - malformed JSON body → 400 `VALIDATION_ERROR`
  - anything else → 500 `INTERNAL_ERROR`, logged, never includes the stack
- `notFound` → 404 `NOT_FOUND` for unknown routes
- `validate({ body?, query?, params? })` parses with Zod; failure → 400 `VALIDATION_ERROR` with per-field `details`; parsed values go to `res.locals.validated`
- `shared/src/types.ts`: `ApiErrorBody` type and `ERROR_CODES` constant, exported from `shared/src/index.ts`
- Unit tests for `errorHandler`, `notFound` and `validate`
- Files to create:
  1. `server/package.json`
  2. `server/tsconfig.json`
  3. `server/vitest.config.ts`
  4. `server/.env.example`
  5. `server/src/index.ts` - read env, `createApp().listen(PORT)`
  6. `server/src/app.ts` - `createApp()`
  7. `server/src/config/env.ts`
  8. `server/src/utils/http-error.ts`
  9. `server/src/middleware/error-handler.ts` + `error-handler.test.ts`
  10. `server/src/middleware/not-found.ts`
  11. `server/src/middleware/validate.ts` + `validate.test.ts`
  12. `server/src/routes/health.routes.ts`
  13. `shared/src/types.ts`
- Files to modify: `package.json` (workspace + `dev`), `shared/src/index.ts` (export types)
- Verification:
  1. `npm run dev` - server logs that it is listening on 8000
  2. `curl http://localhost:8000/health` → `{"status":"ok"}`
  3. `curl -i http://localhost:8000/nope` → 404 with the error shape
  4. `curl -i -X POST http://localhost:8000/health -H "Content-Type: application/json" -d '{bad'` → 400 `VALIDATION_ERROR`
  5. Remove `CLIENT_URL` from `.env` → server refuses to start with a clear message
  6. `npm test` - middleware tests pass

## Notes

<!-- Additional context, constraints, or details from the spec. -->

- Spec: `context/features/setup-phase-2-spec.md`. No database yet
- Use Context7 to verify the newest config and conventions
- Express 5 forwards rejected promises from async handlers to `next`, so no wrapper library is needed. Verify the installed major version
- Express 5 `req.query` is a getter and can't be reassigned. Store parsed data in `res.locals.validated`
- The error handler must take 4 parameters `(err, req, res, next)` and be registered last
- Malformed JSON from `express.json()` arrives as an error with `type === 'entity.parse.failed'`. Map it to 400
- `cors` with `credentials: true` needs an explicit origin, never `*`
- Zod 4 changed error formatting (`z.flattenError(err)` instead of `err.flatten()`). Check the installed version
- Load `.env` with Node's `--env-file=.env` (tsx passes it through) or `dotenv`
- If `tsx watch` doesn't restart when `shared/dist` changes, add `--include ../shared/dist`
- Toolchain: npm 11.x drops platform-specific optional deps (rolldown/esbuild native bindings) on `npm install`; npm 12 fixes it. Root `engines` is now `node ^22.22.2 || ^24.15.0 || >=26.0.0` (npm 12's own range) and `npm >=12`. esbuild's postinstall is approved in root `allowScripts`
- `.gitattributes` forces LF checkouts (`core.autocrlf=true` on this machine produced CRLF, which Prettier flags)
- `tsx watch` restarts on `shared/dist` changes without `--include`
- `errorHandler` maps every body-parser client error (4xx with `expose: true`: malformed JSON, 413 too large, 415 charset) to `VALIDATION_ERROR` with its own status, instead of a 500
- Each workspace has `tsconfig.json` (all of `src`, tests included, used by the editor and `typecheck`) and `tsconfig.build.json` (excludes `*.test.ts`, used by `build` / `dev`). Root `npm run typecheck` checks every workspace
- `server/.env` (gitignored):
  ```
  PORT=8000
  NODE_ENV=development
  CLIENT_URL=http://localhost:5173
  ```
- References:
  - Express 5 migration: https://expressjs.com/en/guide/migrating-5.html
  - Express error handling: https://expressjs.com/en/guide/error-handling.html
  - Zod error formatting: https://zod.dev/error-formatting
  - Helmet: https://helmetjs.github.io/

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Setup - Workspaces & Tooling (setup-phase-1): npm workspaces (`shared`), strict TS base config, ESLint flat config + Prettier, Vitest projects, `@art-gallery/shared` constants. TypeScript pinned to `~6.0.3` because typescript-eslint 8.x supports only `<6.1.0`
