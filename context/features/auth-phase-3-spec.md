# Auth UI - Login, Register, Guards & User Menu

## Overview

Replace the placeholder auth pages with real forms, put the whole gallery behind login, and show the signed-in user with a logout option in the header.

## Requirements

### AuthProvider / `useAuth`

- On mount, query `GET /auth/me` (`['auth', 'me']`). A 401 means `user = null`, which is not an error
- Exposes `{ user, isAdmin, isPending, login, register, logout }`
- `login` / `register` write the returned user into the query cache
- `logout` calls the API, runs `queryClient.clear()` and navigates to `/login`
- Global 401: when any query or mutation fails with 401, set `['auth', 'me']` to `null` (QueryCache / MutationCache `onError`), so the guards redirect

### Route guards

- `ProtectedRoute` wraps `/` and everything except the auth pages:
  - while pending → full-page spinner
  - no user → `<Navigate to="/login?redirect=<path+search>" replace />`
- `GuestOnlyRoute` wraps `/login` and `/register`. Signed-in users → `/`
- The `redirect` param only accepts internal paths (starts with `/`, not `//`); anything else → `/`

### Login Page (`/login`)

- Email and password fields (React Hook Form + `loginSchema`)
- Submit → `POST /auth/login`. On success, go to `redirect` or `/`
- 401 → form-level error "Invalid email or password"
- Link "No account? Register"

### Register Page (`/register`)

- Name, email, password and confirm password fields (`registerSchema`)
- Submit → `POST /auth/register`. On success the user is already signed in → go to `/`
- 409 → error under email. Other 400 `details` → `setError` on the matching fields
- Link "Have an account? Log in"

### Header user menu

- Right side of the header: avatar with initials, name, and a role badge (`Admin` / `User`)
- Clicking it opens a dropdown (shadcn `DropdownMenu`) showing the email and a "Log out" item
- Hidden when signed out

## Notes

### Auth page layout

- A centered card on `bg-muted` with the logo, form, a full-width submit button (disabled with a spinner while pending) and the switch link, as in the overview's UI/UX section

### Initials

- `getInitials(name)`: first letters of the first two words, upper-cased ("Gallery Admin" → "GA"). One word → one letter
- A reusable `UserAvatar` component renders them

## Files to Create

1. `client/src/hooks/useAuth.tsx` - `AuthProvider` + `useAuth`
2. `client/src/components/layout/ProtectedRoute.tsx`
3. `client/src/components/layout/GuestOnlyRoute.tsx`
4. `client/src/components/layout/UserMenu.tsx`
5. `client/src/components/layout/UserAvatar.tsx`
6. `client/src/components/auth/AuthCard.tsx`
7. `client/src/lib/initials.ts` + test
8. `client/src/lib/safe-redirect.ts` + test

## Files to Modify

- `client/src/pages/LoginPage.tsx`, `client/src/pages/RegisterPage.tsx`
- `client/src/router.tsx` - guards
- `client/src/components/layout/Header.tsx` - `UserMenu`
- `client/src/App.tsx` - `AuthProvider`
- `client/src/lib/query-client.ts` - global 401 handling

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- Guards must wait for `/auth/me` to finish. Redirecting while it's pending makes the login page flash on every reload
- A 401 from `/auth/me` is the normal signed-out state, so don't show an error toast for it
- `queryClient.clear()` on logout, so the next user never sees cached data
- Add shadcn's form components (`form` or the newer `field`, depending on the installed version) and check the docs for the current React Hook Form pattern
- The `isAdmin` UI check is for UX only; the API already enforces roles

## Testing

1. Signed out, go to `/` → redirected to `/login?redirect=%2F`
2. Signed out, go to `/?type=painting` → after login, lands on `/?type=painting`
3. Wrong password → "Invalid email or password", and the fields keep their values
4. Log in as admin → the header shows "GA", the name and an `Admin` badge
5. Reload → still signed in, with no flash of the login page
6. Visit `/login` while signed in → redirected to `/`
7. Register a new account → lands on `/` as `User`. Registering the same email again shows an error under email
8. Mismatched passwords → error under confirm password, and no request is sent
9. Log out → `/login`, and the back button doesn't show the gallery
10. `/login?redirect=https://evil.com` → after login, goes to `/`
11. `npm test` passes

## References

- React Router `Navigate`: https://reactrouter.com/api/components/Navigate
- React Hook Form `useForm`: https://react-hook-form.com/docs/useform
- Zod resolver: https://github.com/react-hook-form/resolvers
- shadcn Dropdown Menu: https://ui.shadcn.com/docs/components/dropdown-menu
