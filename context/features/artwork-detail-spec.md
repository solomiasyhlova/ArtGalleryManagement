# Artwork Detail Page

## Overview

Add `/artworks/:id`: a full view of one artwork from `GET /artworks/:id`, with Edit and Delete for admins. This is also the final polish pass before handing in.

## Requirements

- `/artworks/:id` route inside `ProtectedRoute`
- `useArtwork(id)` → `['artwork', id]`
- Layout:
  - a "← Back to gallery" link at the top
  - two columns at `lg` (large 4:3 image on the left, details on the right), stacked on mobile
- Details:
  - title (`h1`), "By {artist}" and a large price
  - `TypeBadge`, plus `AvailabilityBadge` with an explanation: "Available for purchase" / "On display for exhibition only"
  - the date added (`createdAt`, formatted)
- Admin only: Edit (opens `ArtworkFormDialog` in edit mode) and Delete (`DeleteArtworkDialog`). After deleting, navigate to `/` with a toast
- Loading skeleton. 404 → an "Artwork not found" state with a link to the gallery. Other errors → retry
- `document.title` = `"{title} · ArtGalleryManager"`
- Final polish: the README setup steps match the real scripts

## Files to Create

1. `client/src/pages/ArtworkDetailPage.tsx`
2. `client/src/hooks/useArtwork.ts`
3. `client/src/components/artworks/ArtworkDetails.tsx`
4. `client/src/components/artworks/ArtworkDetailSkeleton.tsx`

## Files to Modify

- `client/src/router.tsx` - detail route
- `client/src/hooks/useArtworkMutations.ts` - `onDeleted` callback, cache removal
- `README.md` - verify the setup steps and scripts

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- After a delete on this page, `removeQueries(['artwork', id])` before navigating. Otherwise a refetch fires and 404s
- 404s are not retried (configured in setup-phase-5), so the not-found state appears immediately
- Back link: `navigate(-1)` keeps the gallery's filters when the user came from the gallery. If `location.key === 'default'` (the page was opened directly), link to `/` instead
- `useParams()` types `id` as possibly `undefined`, so guard it

## Testing

1. Click a card → the detail page shows all fields. Back returns to the gallery with its filters intact
2. Open a detail URL in a new tab → it loads directly (after the login redirect if signed out)
3. `/artworks/00000000-0000-0000-0000-000000000000` and `/artworks/3` → "Artwork not found"
4. As admin, Edit → the changes show on the detail page and in the gallery
5. As admin, Delete → back on the gallery with a toast, and the artwork is gone
6. As a user: no Edit or Delete
7. At 375px the layout stacks with no horizontal scroll
8. Fresh run-through: follow the README from `npm install` to login, and every command works
9. `npm run build`, `npm run lint` and `npm test` all pass

## References

- React Router `useParams`: https://reactrouter.com/api/hooks/useParams
- TanStack Query `QueryClient` (`removeQueries`): https://tanstack.com/query/latest/docs/reference/QueryClient
