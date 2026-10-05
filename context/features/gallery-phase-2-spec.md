# Gallery - Filters, Sort & Pagination

## Overview

Add the toolbar (artist search, type filter, price sort) and pagination to the gallery. All of this state lives in the URL and is applied on the server.

## Requirements

### Toolbar (`ArtworkToolbar`)

- Artist search input with a search icon and the placeholder "Search by artist…". Debounced 300ms, max 50 characters
- Type select: "All types" + the `ARTWORK_TYPES` labels
- "Sort by" select:
  - "Newest" (default, no param)
  - "Price: Low → High" (`asc`)
  - "Price: High → Low" (`desc`)
- A "Clear filters" link, shown while any filter or sort is set
- Stacks vertically under `sm`
- Leaves a right-hand slot for the admin "Add New Artwork" button (gallery-phase-3)

### URL state (`useGalleryParams`)

- Reads and writes `?artist=&type=&price=&page=` via `useSearchParams`
- Invalid URL values (`?type=pottery`, `?page=-1`) are ignored and never sent to the API
- Changing a filter or the sort resets `page` to 1 and drops empty params
- Typing in search uses `replace` (no history entry per keystroke). Other changes push a history entry

### Pagination (`GalleryPagination`)

- Below the grid: Previous / numbered pages (with an ellipsis when there are many) / Next. Hidden when `totalPages ≤ 1`
- Changing the page scrolls back to the top of the grid
- `placeholderData: keepPreviousData`, so the grid doesn't flash skeletons between pages. Dim the grid while fetching
- If `page > totalPages` (for example an edited URL, or deleting the last item on a page), go to the last page

### Empty state

- With active filters: "No artworks match your filters" and a "Clear filters" button

## Files to Create

1. `client/src/lib/gallery-params.ts` + test - pure parse/serialize
2. `client/src/hooks/useGalleryParams.ts`
3. `client/src/hooks/useDebouncedValue.ts`
4. `client/src/lib/pagination.ts` + test - page list with ellipsis
5. `client/src/components/artworks/ArtworkToolbar.tsx`
6. `client/src/components/artworks/GalleryPagination.tsx`

## Files to Modify

- `client/src/pages/GalleryPage.tsx`
- `client/src/components/artworks/ArtworkGrid.tsx` - empty state with filters, fetching dim
- `client/src/hooks/useArtworks.ts` - `placeholderData`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- shadcn/Radix `Select` doesn't allow `""` as an item value. Use a sentinel like `"all"` and map it to "no param"
- Keep the search input's own state separate from the URL. Only sync URL → input on external changes (back/forward, Clear filters), or the input lags and the caret jumps
- TanStack Query v5 replaced `keepPreviousData: true` with `placeholderData: keepPreviousData` (an imported helper)
- Parse URL params one at a time with `safeParse`, so one bad param doesn't throw away the others

## Testing

1. Type "liam" → after ~300ms only Geometric Harmony shows, and the URL has `?artist=liam`
2. Type "Painting" → Abstract Vibrance and Tranquil Lake, with `type=painting` in the URL
3. Low → High puts Tranquil Lake ($3,500) first. High → Low puts Geometric Harmony ($11,000) first
4. Reload → the filters, sort and input values are restored. The same URL in a new tab gives the same result
5. Back button steps through filter changes, not individual keystrokes
6. A filter with no matches → "No artworks match your filters", and Clear filters resets everything
7. `/?type=pottery&page=-1` → bad params are ignored and the full list shows
8. With more than 12 artworks (create them via the API): pagination appears, Next/Previous work, `page` is in the URL, and there's no skeleton flash
9. At 375px the toolbar stacks
10. `npm test` passes

## References

- React Router `useSearchParams`: https://reactrouter.com/api/hooks/useSearchParams
- TanStack Query paginated queries: https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries
- shadcn Select: https://ui.shadcn.com/docs/components/select
- shadcn Pagination: https://ui.shadcn.com/docs/components/pagination
