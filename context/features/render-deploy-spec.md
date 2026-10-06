# Deploy to Render (Free Plan)

## Overview

Deploy the app to Render's free Hobby plan for a short-lived demo. One free **Web Service** serves both the API and the built React app from a single origin. A free **Render Postgres** database backs it. Nothing paid is used, and local development is unchanged.

Why one service, not a Static Site plus an API service: `onrender.com` is on the Public Suffix List, so `x.onrender.com` and `y.onrender.com` are **different sites**. The `sameSite: 'lax'` auth cookie would never be sent, and helmet's CORP `same-site` would block `/images`. `sameSite: 'none'` doesn't help either, because browsers increasingly block third-party cookies.

## Requirements

### Server serves the client in production

- When `NODE_ENV === 'production'`, the API also serves the Vite build in `client/dist`. In dev nothing changes (Vite on 5173, API on 8000).
- Static files come from `client/dist` with `index: false`:
  - `/assets/*` (hashed names) are sent with `Cache-Control: public, max-age=31536000, immutable`.
  - Other files (favicon, etc.) use the default caching.
- **SPA fallback by content negotiation.** Only `GET`/`HEAD` requests that prefer HTML (`req.accepts(['json', 'html']) === 'html'`) get `client/dist/index.html`, sent with `Cache-Control: no-cache`.
  - This middleware is mounted **after** `/images` and **before** the API routes, so a reload of `/artworks/:id` returns the page, not the API's JSON.
  - `lib/api.ts` sends `Accept: application/json`, so API calls never match.
  - curl, health checks and `<img>` requests (`*/*`) resolve to `json` and keep today's behavior.
- An unknown path opened in the browser gets `index.html`, and the client's `NotFoundPage` handles it. Non-HTML requests still get the JSON 404.
- `CLIENT_DIST_DIR` is defined in `config/paths.ts`, next to `IMAGES_DIR` (same `import.meta.dirname` trick, valid from `src` and `dist`).

### Helmet CSP

- Add `https:` to `img-src` (`'self' data: https:`). Once the API serves the page, its CSP applies to it, and admin-entered image URLs plus the form's live preview come from other hosts.
- Keep the other helmet defaults (`script-src 'self'`, `upgrade-insecure-requests`, ...). Verify that the built `index.html` has no inline script.

### Migrations and seed without `tsx`

- Free instances have **no pre-deploy command**, so migrations and the seed run in the **start command**. Both are idempotent.
- `tsx` is a devDependency, and the `db:*` scripts run TypeScript sources. Add scripts that run the compiled output instead:
  - `db:migrate:prod`: `node --env-file-if-exists=.env ../node_modules/typeorm/cli.js migration:run -d dist/db/data-source.js`
  - `db:seed:prod`: `node --env-file-if-exists=.env dist/db/seed.js`
- Start command: `npm run db:migrate:prod -w server && npm run db:seed:prod -w server && npm run start -w server`

### Render Blueprint (`render.yaml`)

- `databases`: `art-gallery-db`, `plan: free`, `databaseName: art_gallery`, same `region` as the service (e.g. `frankfurt`).
- `services`: one `type: web`, `runtime: node`, `plan: free`, same `region`, `healthCheckPath: /health`.
  - `buildCommand`: `npx -y npm@12 ci --include=dev && npm run build`
  - `startCommand`: as above
- `envVars`:
  - `NODE_ENV=production`
  - `DATABASE_URL` from `fromDatabase` (`property: connectionString`, the internal URL)
  - `JWT_SECRET` with `generateValue: true`
  - `JWT_EXPIRES_IN=1d`
  - `ADMIN_EMAIL`, `ADMIN_NAME`
  - `ADMIN_PASSWORD`, `CLIENT_URL`, `PUBLIC_URL`, `VITE_API_URL` with `sync: false` (entered in the dashboard; the last three are all `https://<service>.onrender.com`)
- `PORT` is not set: Render provides it, and `env.ts` already reads it.

### Node version

- Add `.node-version` pinned to the local version (`24.21.0`). Render's default for new services is `24.14.1`, which doesn't satisfy `engines` (`^24.15.0`).

### Docs

- README: a "Deploy to Render" section covering the Blueprint, which values to enter, free-plan limits and how to redeploy. Replace the generic production paragraph so it describes the single-origin setup.
- `project-overview.md`: one deployment note (single origin on Render, SPA fallback by `Accept`).

## Files to Create

1. `render.yaml`
2. `.node-version`
3. `server/src/middleware/spa-fallback.ts` (+ `spa-fallback.test.ts`)
4. `server/src/routes/client.routes.ts` (static `client/dist` + fallback, production only)

## Files to Modify

- `server/src/app.ts`: mount the client router in production (after `/images`, before the API), add `img-src https:`
- `server/src/config/paths.ts`: `CLIENT_DIST_DIR`
- `server/package.json`: `db:migrate:prod`, `db:seed:prod`
- `README.md`, `context/project-overview.md`

## Key Gotchas

Check the installed Express 5 / helmet 8 / serve-static behavior and Render's current docs before relying on these.

- **Route collision.** The client route `/artworks/:id` and the API's `GET /artworks/:id` share a path. The `Accept` negotiation above solves it without changing the API contract.
  - The alternative is moving the API under `/api`. It is cleaner, but it changes the PDF's documented URLs, dev `VITE_API_URL`, the README and the overview. Rejected unless preferred.
- **`npm ci` and `NODE_ENV=production`.** Render env vars exist at build time, so plain `npm ci` would skip devDependencies (`tsc`, `vite`). Use `--include=dev`.
- **npm 12.** Node 24 ships npm 11, and the repo requires npm ≥ 12.
  - `npx -y npm@12 ci` must show npm 12 in the first build log.
  - The lockfile already lists the Linux native bindings (`@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu`, `@tailwindcss/oxide-linux-x64-gnu`).
  - Fallback if `npx npm@12` misbehaves: plain `npm ci --include=dev` with npm 11 (only an `engines` warning).
- **`VITE_API_URL` is baked in at build time.** Changing the service URL needs a rebuild, not just a restart. `api.ts` throws on import if it's missing, so a blank value means a blank page.
- **`PUBLIC_URL` must be right before the first start.** The seed stores absolute image URLs and only fills `NULL`s, so a wrong first value sticks until it's fixed by hand.
- **The service URL may differ from the name.** If the name is taken, Render adds a suffix (`art-gallery-abcd.onrender.com`). Enter the real URL in `CLIENT_URL` / `PUBLIC_URL` / `VITE_API_URL` and redeploy.
- **Order in `app.ts`.**
  - `/images` stays first: an image opened directly sends `Accept: text/html` and must still get the file.
  - A missing image opened in the browser falls through to `index.html` (client 404). An `<img>` request still gets the JSON 404.
- **Database rules.** Only the user creates, connects to or changes the Render database. Never point `server/.env` at the External Database URL, and never run anything against it without an explicit "production" request (CLAUDE.md).
- **Free-plan limits**, which are fine for a short demo:
  - Postgres expires **30 days** after creation (+14 days grace, then it's deleted).
  - The web service sleeps after **15 min** idle, and the first request takes about **1 min**.
  - **750** instance hours per month.
  - **5 GB** bandwidth per month on Hobby (then $0.15/GB).
  - **512 MB** RAM.
- **Secure cookies.** These work because Render serves HTTPS. For the local production check, Chrome accepts `Secure` cookies on `http://localhost`.

## Testing

1. **Local production run** against the local `art_gallery` DB:
   - Run `npm run build`, then start the server with `NODE_ENV=production` and `CLIENT_URL` = `PUBLIC_URL` = `VITE_API_URL` = `http://localhost:8000` (the client built with that `VITE_API_URL`).
   - `db:migrate:prod` reports nothing pending, and `db:seed:prod` skips every step (no DB changes).
2. `http://localhost:8000/` serves the app. Log in, then filter, sort and paginate.
3. Reloading `/artworks/:id` shows the detail page. `curl -H "Accept: application/json"` with the auth cookie on the same path returns JSON.
4. Response headers:
   - `/assets/*.js` has `immutable`.
   - `/` has `no-cache`.
   - `/images/abstract-vibrance.jpg` returns the picture, both directly and in cards.
5. An unknown path in the browser shows the client's Not Found page, while `curl /nope` returns the JSON 404.
6. An artwork with an external `https://` image URL shows it, and the form preview loads (no CSP errors in the console).
7. Admin add, edit and delete work. The user account sees no admin controls.
8. Unit tests for `spa-fallback` (HTML navigation → `index.html`; JSON, `*/*`, no `Accept`, non-GET → `next()`). `npm run build`, `npm run lint`, `npm run typecheck` and `npm test` pass.
9. **On Render** (the user creates the Blueprint and enters the secrets):
   - The build log shows npm 12 and the pinned Node.
   - The start log shows migrations and the seed.
   - `/health` returns `ok`.
   - Admin login and CRUD work, and reloading a detail page works.
   - Pictures load.
   - After 15 idle minutes the next request wakes the service.

## References

- Render free plan: https://render.com/docs/free
- Render Blueprint spec: https://render.com/docs/blueprint-spec
- Render Node version: https://render.com/docs/node-version
- Render workspace plans (Hobby limits): https://render.com/docs/new-workspace-plans
- Express `req.accepts`: https://expressjs.com/en/api.html#req.accepts
- helmet CSP: https://helmetjs.github.io/#content-security-policy
