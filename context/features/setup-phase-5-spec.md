# Setup - App Shell (Router, Providers & Layout)

## Overview

Build the client app shell: routing, TanStack Query, the typed API client, and the header and footer from the mockup. Pages stay placeholders; auth guards come in auth-phase-3.

## Requirements

- React Router in data mode (`createBrowserRouter` + `RouterProvider`). Routes:
  - `/` → `GalleryPage` placeholder
  - `/login` and `/register` → placeholders
  - `*` → `NotFoundPage`
  - `/artworks/:id` is added in artwork-detail
- `AppLayout` route: `Header`, `<main>` with `<Outlet />`, `Footer`. The footer sticks to the bottom on short pages
- `Header` (white, bottom border):
  - lucide `Palette` icon and the "ArtGalleryManager" wordmark, linking to `/`
  - an empty right-hand slot for the user menu (auth-phase-3)
- `Footer` (`bg-footer text-footer-foreground`):
  - the wordmark and the tagline "Your go-to platform for managing and exploring exquisite art pieces."
  - social icon links (Facebook, X, Instagram) with an `aria-label` each
- `QueryClientProvider`: `staleTime` 30s, and `retry` once except for 401/403/404
- `<Toaster />` (sonner) mounted once
- `lib/api.ts`: `api.get/post/put/delete<T>(path, body?)`
  - `fetch(VITE_API_URL + path, { credentials: 'include' })`, with JSON in and out
  - 204 → `undefined`
  - non-2xx → throws an `ApiError` (status, code, message, details) parsed from the shared error shape
  - network failure → `ApiError` with code `NETWORK_ERROR`
- `GalleryPage` placeholder: "Explore Our Collection" and the API status from `GET /health` via `useQuery`, to prove the wiring
- `NotFoundPage`: a message and a link back to the gallery
- Unit tests for `lib/api.ts` (mocked `fetch`)

## Files to Create

1. `client/src/router.tsx`
2. `client/src/App.tsx` - providers + `RouterProvider`
3. `client/src/lib/query-client.ts`
4. `client/src/lib/api.ts` + `api.test.ts`
5. `client/src/components/layout/AppLayout.tsx`
6. `client/src/components/layout/Header.tsx`
7. `client/src/components/layout/Footer.tsx`
8. `client/src/pages/GalleryPage.tsx` (placeholder)
9. `client/src/pages/LoginPage.tsx`, `client/src/pages/RegisterPage.tsx` (placeholders)
10. `client/src/pages/NotFoundPage.tsx`

## Files to Modify

- `client/src/main.tsx` - render `App`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- React Router v7: import from `react-router`, not `react-router-dom`. Use data mode, not framework mode: no `react-router.config.ts` and no React Router Vite plugin
- TanStack Query v5 only accepts the object signature `useQuery({ queryKey, queryFn })`. Mutations use `isPending`, not `isLoading`
- `credentials: 'include'` must be on every request, or the auth cookie is never sent
- lucide's brand icons (Facebook, Instagram, Twitter) are deprecated. Use them if the installed version still has them; otherwise use small inline SVGs
- For a sticky footer, use `min-h-dvh flex flex-col` on the layout and `flex-1` on `<main>`

## Testing

1. `/` shows the header, "Explore Our Collection", "API: ok" and the dark footer
2. `/whatever` shows `NotFoundPage` inside the layout, and its link returns to `/`
3. Stop the server → the placeholder shows the API error state
4. At 375px width there's no horizontal scroll, and the header and footer wrap cleanly
5. `npm test` - `api.ts` tests pass (2xx JSON, 204, error body → `ApiError`, network failure)

## References

- React Router modes: https://reactrouter.com/start/modes
- TanStack Query (React): https://tanstack.com/query/latest/docs/framework/react/overview
- shadcn Sonner: https://ui.shadcn.com/docs/components/sonner
