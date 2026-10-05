# Auth API - User Model, Login & Session

## Overview

Add the `User` entity, the login/logout/session endpoints, JWT sessions in an httpOnly cookie, and the `requireAuth` / `requireRole` middleware. The admin account comes from the seed script. Registration is phase 2.

## Requirements

- Install `bcrypt`, `jsonwebtoken` and `ms` (+ `@types/*`)
- `User` entity per the overview's Data Model: table `users`, `user_role` enum, unique lower-cased email, `passwordHash` with `select: false`
- Generate and run the `CreateUsers` migration
- Shared: `loginSchema` (email, password 1–72) and the public `User` type (`id, name, email, role, createdAt, updatedAt`, no hash)
- `utils/jwt.ts`: `signToken({ sub, role })` and `verifyToken(token)` (HS256)
- `utils/auth-cookie.ts`: cookie `token` with `httpOnly`, `sameSite: 'lax'`, `secure` in production, `path: '/'` and `maxAge` = JWT lifetime. Provides `setAuthCookie(res, token)` and `clearAuthCookie(res)`
- `services/auth.service.ts`:
  - `login(email, password)` → public user, or `HttpError(401, 'UNAUTHENTICATED', 'Invalid email or password')`
  - `getUserById(id)`
  - `toPublicUser(user)`
- Routes:
  - `POST /auth/login` (validate `loginSchema`) → 200 `User` + cookie
  - `POST /auth/logout` → 204 + cookie cleared
  - `GET /auth/me` (`requireAuth`) → 200 `User`
- `requireAuth`: reads the cookie, verifies the JWT and loads the user. A missing or invalid token, or a deleted user, → 401. Sets `res.locals.user`
- `requireRole('admin')`: role mismatch → 403 `FORBIDDEN`
- `seedAdmin()`: creates the admin from the `ADMIN_*` env vars (bcrypt cost 12) only if that email doesn't exist yet. Registered in `seed.ts`
- Unit tests: `requireAuth`, `requireRole`, `auth.service.login`

## Files to Create

1. `server/src/entities/User.ts`
2. `server/src/db/migrations/<timestamp>-CreateUsers.ts` (generated)
3. `shared/src/schemas/auth.ts`
4. `server/src/utils/jwt.ts`
5. `server/src/utils/auth-cookie.ts`
6. `server/src/services/auth.service.ts` + test
7. `server/src/controllers/auth.controller.ts`
8. `server/src/routes/auth.routes.ts`
9. `server/src/middleware/require-auth.ts` + test
10. `server/src/middleware/require-role.ts` + test
11. `server/src/db/seeds/admin.seed.ts`
12. `server/src/types/express.d.ts` - types `res.locals.user`

## Files to Modify

- `server/src/db/data-source.ts` - register `User`
- `server/src/config/env.ts`, `server/.env.example` - JWT and admin vars
- `server/src/db/seed.ts` - run `seedAdmin`
- `server/src/app.ts` - mount `/auth`
- `shared/src/index.ts` - export auth schemas and types

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- `user` is a reserved word in Postgres. Name the table `users` (`@Entity('users')`)
- `passwordHash` uses `select: false`, so it is never loaded by accident. Login adds it back with `addSelect`
- bcrypt only uses the first 72 bytes, so schemas cap passwords at 72
- Lower-case and trim the email before both lookup and insert
- Unknown email and wrong password return the identical message. Still run `bcrypt.compare` against a dummy hash when the user doesn't exist, so response timing doesn't reveal which emails exist
- `jwt.verify(token, secret, { algorithms: ['HS256'] })`: always pin the algorithm
- `JWT_EXPIRES_IN` (`1d`) feeds both `expiresIn` and the cookie `maxAge` (milliseconds via `ms`), so the two never drift apart
- `clearCookie` must use the same `path` / `sameSite` / `secure` options as when the cookie was set, or the browser keeps it
- `bcrypt` is a native module. If install fails on Windows, check Node version support and ask before switching libraries
- In PowerShell, use `curl.exe`; plain `curl` is an alias for `Invoke-WebRequest`

## Environment Variables

```
JWT_SECRET=          # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@gallery.local
ADMIN_PASSWORD=
ADMIN_NAME=Gallery Admin
```

## Testing

1. `npm run db:migrate -w server` → `psql -U postgres -d art_gallery -c "\d users"` shows the table
2. `npm run db:seed -w server` twice → exactly one admin row
3. Log in:

```bash
curl -i -c cookies.txt -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gallery.local","password":"<ADMIN_PASSWORD>"}'
```

→ 200 with `Set-Cookie: token=...; HttpOnly; SameSite=Lax`, and the body has no `passwordHash`
4. `curl -b cookies.txt http://localhost:8000/auth/me` → 200 admin user
5. Wrong password and unknown email → both 401 "Invalid email or password"
6. `curl -i http://localhost:8000/auth/me` (no cookie) → 401 `UNAUTHENTICATED`
7. `curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:8000/auth/logout` → 204, and then `/auth/me` → 401
8. `npm test` - new tests pass

## References

- jsonwebtoken: https://github.com/auth0/node-jsonwebtoken
- bcrypt: https://github.com/kelektiv/node.bcrypt.js
- Express `res.cookie`: https://expressjs.com/en/api.html#res.cookie
- TypeORM docs (Entities, Migrations): https://typeorm.io
