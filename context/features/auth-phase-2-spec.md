# Auth API - Registration

## Overview

Let new visitors create an account through `POST /auth/register`. Registration always creates a `user` (never an admin) and signs the new user in immediately.

## Requirements

- Add `registerSchema` to `shared/src/schemas/auth.ts`
- Add `register()` to the auth service
- Create the registration route at `/auth/register`
- Map duplicate emails to 409, including the concurrent-insert race
- Unit tests for the schema and the service

## Registration API Route

`POST /auth/register`

- Accept: name, email, password, confirmPassword
- Validate with `registerSchema`:
  - name: trimmed, 1–50
  - email: valid, ≤ 254, lower-cased
  - password: 8–72
  - passwords must match (error on `confirmPassword`)
- Check whether the user already exists → 409 `EMAIL_TAKEN` with `details.email`
- Hash the password with bcrypt (cost 12)
- Create the user with role `user`, whatever the body says
- Set the auth cookie and return 201 `User`

## Files to Create

1. `shared/src/schemas/auth.test.ts`

## Files to Modify

- `shared/src/schemas/auth.ts` - `registerSchema` + `RegisterInput` type
- `server/src/services/auth.service.ts` (+ test) - `register()`
- `server/src/controllers/auth.controller.ts` - `register` handler
- `server/src/routes/auth.routes.ts` - `POST /register`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- A `role` in the body must be ignored. `z.object` strips unknown keys by default; never use `.passthrough()` / `z.looseObject` here
- Put the match check in `.refine` / `.superRefine` with `path: ['confirmPassword']`, so the client can show the error under the right field
- Zod 4 has a top-level `z.email()` (`z.string().email()` is deprecated). Check the installed version
- The service receives `{ name, email, password }` only; `confirmPassword` never reaches the DB layer
- Two simultaneous registrations can pass the "exists?" check together. Catch Postgres unique violation `23505` on insert and map it to the same 409
- Email uniqueness is case-insensitive because emails are lower-cased before lookup and insert

## Testing

1. Register:

```bash
curl -i -c cookies.txt -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"Test@Example.com","password":"password123","confirmPassword":"password123"}'
```

→ 201, cookie set, `email` is `test@example.com` and `role` is `user`
2. The same request again → 409 `EMAIL_TAKEN`
3. Mismatched passwords → 400 with `details.confirmPassword`
4. Body with `"role":"admin"` → the account is created as `user`
5. `curl -b cookies.txt http://localhost:8000/auth/me` → the new user
6. `POST /auth/login` with the new credentials → 200
7. `npm test` passes (schema: mismatch, short password, bad email, `role` stripped; service: 409 path, forced role, no hash returned)

## References

- Zod refinements: https://zod.dev/api#refinements
- PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
