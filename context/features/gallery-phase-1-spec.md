# Gallery - Artwork Grid & Cards

## Overview

Replace the placeholder gallery with the real artwork list from `GET /artworks`, rendered as the card grid from the mockup. No filters yet.

## Requirements

- `useArtworks(params)`: `useQuery({ queryKey: ['artworks', params], queryFn })`
- `GalleryPage`: the "Explore Our Collection" heading and `ArtworkGrid`
- `ArtworkGrid`:
  - 1 column, 2 at `sm`, 3 at `lg`, 4 at `xl`, with a 24px gap
  - Loading: 8 skeleton cards
  - Empty: "No artworks yet"
  - Error: a message and a "Try again" button (`refetch`)
- `ArtworkCard`, which links to `/artworks/:id` (the route arrives in artwork-detail):
  - 2px border in the type's accent color, `rounded-lg`, a shadow that lifts on hover
  - 4:3 image with `object-cover`, `loading="lazy"` and `alt="{title} by {artist}"`
  - with no `imageUrl` or a failed load → a muted placeholder with the type icon
  - Row 1: title (truncated) and price on the right (`formatPrice`)
  - Row 2: "By: {artist}" in muted text
  - Row 3: `TypeBadge` and `AvailabilityBadge`
- `lib/artwork-types.ts`: map `type → { label, icon, borderClass, badgeClass }` using the colors from the overview's Type Reference
- `TypeBadge`: label + type colors
- `AvailabilityBadge`: "For sale" with a success-colored dot, "Exhibition only" with a muted dot

## Files to Create

1. `client/src/hooks/useArtworks.ts`
2. `client/src/lib/artwork-types.ts` + test (every `ARTWORK_TYPES` entry has a mapping)
3. `client/src/components/artworks/ArtworkGrid.tsx`
4. `client/src/components/artworks/ArtworkCard.tsx`
5. `client/src/components/artworks/ArtworkCardSkeleton.tsx`
6. `client/src/components/artworks/ArtworkImage.tsx` - image + fallback
7. `client/src/components/artworks/TypeBadge.tsx`
8. `client/src/components/artworks/AvailabilityBadge.tsx`

## Files to Modify

- `client/src/pages/GalleryPage.tsx`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- Tailwind only generates classes it finds as complete strings in the source. `` `border-type-${type}` `` will not exist, so put the full literal class strings in `artwork-types.ts`
- Type the map as `Record<ArtworkType, …>`, so adding a type to `ARTWORK_TYPES` is a compile error until it's mapped
- For the image fallback, keep a `failed` flag in state. Don't swap `src` to another URL that might fail too and loop
- Color is never the only signal: badges always show their text label

## Testing

1. Log in → the 4 seeded artworks show, with the right borders (painting blue, digital slate, sculpture amber) and badges
2. Prices read `$5,500`, `$3,500`, `$11,000`
3. DevTools "Slow 4G" throttling → skeletons appear while loading
4. Stop the server → the error state with "Try again". Restart the server, retry → the grid loads
5. Create an artwork via the API with `"imageUrl":"https://example.com/missing.jpg"` → the placeholder with the type icon shows
6. Widths of 375 / 768 / 1280 / 1536px → 1 / 2 / 3 / 4 columns
7. The empty state is covered in gallery-phase-2 (a filter with no matches)
8. `npm test` passes

## References

- TanStack Query `useQuery`: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
- Tailwind class detection: https://tailwindcss.com/docs/detecting-classes-in-source-files
- shadcn Badge / Skeleton: https://ui.shadcn.com/docs/components/badge
