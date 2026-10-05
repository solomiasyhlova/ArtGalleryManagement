# Setup - Express Server Skeleton

## Overview

Add the `server` workspace: an Express API on port 8000 with env validation, security middleware, the error contract from the overview and a Zod validation middleware. No database yet.

## Requirements

- Add `server` to root workspaces and to the root `dev` script
- Scripts: `dev` (`tsx watch`), `build` (`tsc`), `start` (`node dist/index.js`), `test` (`vitest run`)
- `config/env.ts`: load `.env`, Zod-parse `process.env`, and fail fast with a readable message. Vars for now: `PORT`, `NODE_ENV`, `CLIENT_URL`
- `app.ts` exports `createApp()` (testable, no `listen`) with:
  - `helmet()`, `cors({ origin: env.CLIENT_URL, credentials: true })`, `express.json()`, `cookieParser()`
  - routes, then `notFound`, then `errorHandler`
- `GET /health` → 200 `{ "status": "ok" }`
- `HttpError(status, code, message, details?)` class
- `errorHandler`:
  - `HttpError` → `{ error: { code, message, details? } }`
  - malformed JSON body → 400 `VALIDATION_ERROR`
  - anything else → 500 `INTERNAL_ERROR`, logged, and the response never includes the stack
- `notFound` → 404 `NOT_FOUND` for unknown routes
- `validate({ body?, query?, params? })`: parses with Zod. On failure → 400 `VALIDATION_ERROR` with per-field `details`. Parsed values go to `res.locals.validated`
- `shared/src/types.ts`: `ApiErrorBody` type and `ERROR_CODES` constant
- Unit tests for `errorHandler`, `notFound` and `validate`

## Files to Create

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

## Files to Modify

- `package.json` - add workspace, add server to `dev`
- `shared/src/index.ts` - export types

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- Express 5 forwards rejected promises from async handlers to `next` automatically, so no wrapper library is needed. Verify the installed major version
- In Express 5, `req.query` is a getter and can't be reassigned. Store parsed data in `res.locals.validated` instead of `req.query = parsed`
- The error handler must take 4 parameters `(err, req, res, next)` and be registered last
- Malformed JSON from `express.json()` arrives as an error with `type === 'entity.parse.failed'`. Map it to 400
- `cors` with `credentials: true` needs an explicit origin, never `*`
- Zod 4 changed error formatting (`z.flattenError(err)` instead of `err.flatten()`). Check the installed version
- Load `.env` with Node's `--env-file=.env` (tsx passes it through) or `dotenv`
- If `tsx watch` doesn't restart when `shared/dist` changes, add `--include ../shared/dist`

## Environment Variables

```
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## Testing

1. `npm run dev` - server logs that it is listening on 8000
2. `curl http://localhost:8000/health` → `{"status":"ok"}`
3. `curl -i http://localhost:8000/nope` → 404 with the error shape
4. Malformed body:

```bash
curl -i -X POST http://localhost:8000/health \
  -H "Content-Type: application/json" \
  -d '{bad'
```

→ 400 `VALIDATION_ERROR`
5. Remove `CLIENT_URL` from `.env` → server refuses to start with a clear message
6. `npm test` - middleware tests pass

## References

- Express 5 migration: https://expressjs.com/en/guide/migrating-5.html
- Express error handling: https://expressjs.com/en/guide/error-handling.html
- Zod error formatting: https://zod.dev/error-formatting
- Helmet: https://helmetjs.github.io/
