# Artwork Images - Local Folder

## Overview

Serve artwork pictures from a folder on the API server, so dropping image files into
`server/public/images/` is enough to show them. The seed links each picture to the starter
artwork whose title matches the filename (`abstract-vibrance.jpg` → "Abstract Vibrance").
New artworks still take an image URL in the form, which can point at this folder.

**(extension)**: agreed separately, not in the PDF. Runs after `artworks-phase-1-spec`.

## Requirements

- Folder `server/public/images/` (committed with a `.gitkeep`). Pictures dropped there are
  committed too, because the seed depends on them. Keep each one at most 1600px wide and
  roughly ≤ 500 KB (the 4 starters were resized with
  `npx sharp-cli -i <files> -o <dir> --autoOrient --mozjpeg -q 80 resize 1600`: 37 MB → 800 KB)
- Express serves it at `GET /images/<file>`:
  - `express.static` with `index: false`, `dotfiles: 'ignore'`, `fallthrough: true` (a missing
    file → the normal JSON 404 from `notFound`)
  - mounted before `notFound`, no `requireAuth` (`<img>` loads are plain GETs; the pictures
    aren't secret)
- Helmet: `crossOriginResourcePolicy: { policy: 'same-site' }`. Helmet's default `same-origin`
  blocks the image load from `localhost:5173` (same-site, different origin)
- Env: `PUBLIC_URL` (optional `z.url()`, default `http://localhost:${PORT}`), the base used to
  build absolute image URLs
- `imageUrl` stays an absolute `http(s)` URL (`${PUBLIC_URL}/images/<file>`), so the phase-2
  `imageUrl` validation, the edit-dialog round trip and `<img src>` all work unchanged
- New seed step `seedArtworkImages()` (after `seedArtworks`):
  - lists `server/public/images/` for `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`
  - slug of a title: lower-case, every run of non-alphanumerics → `-`, trimmed `-`
    (`"Abstract Vibrance"` → `abstract-vibrance`)
  - sets `imageUrl` only where it **is null** and a file with that slug exists, so it never
    overwrites an image an admin set. Idempotent
  - logs each match and each artwork with no picture
  - two files with the same slug (`a.jpg` + `a.png`) → pick the first in sorted order and log a
    warning
- Unit tests: `toImageSlug`, the file → artwork matching (pure function over a filename list and
  titles), env default for `PUBLIC_URL`

## Files to Create

1. `server/public/images/.gitkeep`
2. `server/src/utils/image-slug.ts` + test
3. `server/src/db/seeds/artwork-images.seed.ts` (+ a test for the pure matching part)

## Files to Modify

- `server/src/app.ts` - helmet CORP option, `/images` static route
- `server/src/config/env.ts` (+ test) - `PUBLIC_URL`
- `server/.env.example` - `PUBLIC_URL`
- `server/src/db/seed.ts` - run `seedArtworkImages`
- `context/project-overview.md` - Data Model note on `imageUrl`, repository structure, roadmap row

## Key Gotchas

- The folder path comes from `import.meta.dirname`, so it works from `src/` (tsx) and `dist/`
  (`node`): resolve to `server/public/images` in both cases, not relative to `process.cwd()`
- The existing dev DB already has the 4 artworks with `imageUrl = null`. Running the new seed
  step **updates** them: ask before running it against `art_gallery`
- Absolute URLs tie stored data to `PUBLIC_URL`. Changing the port later means re-pointing the
  rows (acceptable for this scope; a relative-path design would need phase-2 schema changes)
- Filenames with spaces or Unicode: the URL must percent-encode the filename
  (`encodeURIComponent`)

## Testing

1. Drop `abstract-vibrance.jpg` into `server/public/images/` → `curl -I http://localhost:8000/images/abstract-vibrance.jpg`
   → 200 with an image content type and `Cross-Origin-Resource-Policy: same-site`
2. `curl http://localhost:8000/images/missing.jpg` → 404 JSON; `/images/../.env` → 404
3. `npm run db:seed -w server` → each starter with a matching picture gets the URL (all 4 when
   every picture is in the folder); the others are logged as having no picture. A second run
   changes nothing
4. `GET /artworks` shows the absolute `imageUrl`; the gallery card (gallery-phase-1) shows the
   picture
5. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass
