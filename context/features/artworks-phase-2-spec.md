# Artworks API - Create, Update & Delete (admin)

## Overview

Add the admin-only write endpoints `POST /artworks`, `PUT /artworks/:id` and `DELETE /artworks/:id`, with the validation rules from the task PDF.

## Requirements

- Shared `artworkInputSchema`:
  - **title**: trimmed string, 1–99 characters
  - **artist**: trimmed string, 1–50 characters
  - **type**: one of `ARTWORK_TYPES`
  - **price**: number, finite, > 0, at most 2 decimal places, ≤ 9,999,999,999.99 (fits `numeric(12,2)`)
  - **availability**: optional boolean, default `true`
  - **imageUrl**: optional `http(s)` URL ≤ 2048 characters. An empty string → `null`
- All three routes use `requireAuth` → `requireRole('admin')`, then `validate({ body })` where there is a body:
  - `POST /artworks` → 201 `Artwork`
  - `PUT /artworks/:id` → 200 `Artwork`, or 404. A full replacement: omitted `availability` → `true` and omitted `imageUrl` → `null`
  - `DELETE /artworks/:id` → 204, or 404
- Malformed UUID → 404, same as `GET`
- No cookie → 401. Role `user` → 403
- Unit tests:
  - input schema edge cases: 99 vs 100 characters, whitespace-only title, price `0` / `-1` / `"4500"` / `10.999`, unknown type, `javascript:` URL
  - service: create / update / delete, including the 404 paths

## Files to Modify

- `shared/src/schemas/artwork.ts` (+ test) - `artworkInputSchema`, `ArtworkInput`
- `server/src/services/artworks.service.ts` (+ test) - `create`, `update`, `remove`
- `server/src/controllers/artworks.controller.ts`
- `server/src/routes/artworks.routes.ts`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- Price must be a JSON number. `"4500"` (a string) is a 400, not coerced, which matches the PDF's "numeric only"
- Trim before the length checks, so `"   "` fails as "required"
- `z.url()` alone accepts protocols like `javascript:`. Restrict the protocol to `http:` / `https:`
- Middleware order is `requireAuth` → `requireRole` → `validate`, so a `user` gets a 403 rather than validation details
- `PUT` is a full replacement, not a merge. Return the reloaded row with the fresh `updatedAt` (`@UpdateDateColumn`)
- `DELETE` returns 204 with no body

## Testing

1. Log in as admin (`cookies.txt`) and create the PDF example:

```bash
curl -i -b cookies.txt -X POST http://localhost:8000/artworks \
  -H "Content-Type: application/json" \
  -d '{"title":"Sunset Over the Ocean","artist":"Claude Monet","type":"painting","price":4500,"availability":true}'
```

→ 201 with an `id`
2. `{"title":"","artist":"","type":"pottery","price":-5}` → 400 with details for all four fields
3. A 100-character title → 400. A 99-character title → 201
4. `PUT` with a full body → 200 with the changed fields. `PUT` on an unknown id → 404
5. `DELETE` → 204. The same `DELETE` again → 404
6. Log in as a regular user (`user-cookies.txt`) → `POST` / `PUT` / `DELETE` all → 403
7. No cookie → 401
8. `npm test` passes

## References

- Zod API: https://zod.dev/api
- Endpoint contract: overview → Routing Map → API routes
