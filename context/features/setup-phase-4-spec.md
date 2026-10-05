# Setup - Client (Vite, Tailwind v4 & shadcn/ui)

## Overview

Add the `client` workspace: a Vite + React + TypeScript app styled with Tailwind v4 and shadcn/ui, using the light theme tokens and Poppins font from the overview. It renders a placeholder page only.

## Requirements

- Scaffold with `npm create vite@latest client -- --template react-ts`, then add `client` to the root workspaces and the root `dev` script
- Remove the Vite demo content (`App.css`, logos, counter)
- Dev server on port 5173 with `strictPort: true`
- Tailwind v4 via the `@tailwindcss/vite` plugin. `client/src/index.css` starts with `@import "tailwindcss"`
- `@/*` → `src/*` alias in `tsconfig.json`, `tsconfig.app.json` and `vite.config.ts`
- `npx shadcn@latest init`, then add `button`, `input`, `label`, `badge`, `skeleton`, `dropdown-menu`, `sonner`. Later phases add the components they need
- Replace the shadcn default colors with the tokens from the overview's **Type Reference**:
  - the base palette
  - `--success`, `--footer`, `--footer-foreground`
  - `--type-*` accents
  - all exposed through `@theme inline`, so `bg-primary`, `bg-footer` and `border-type-painting` work
- Poppins via `@fontsource/poppins` (400/500/600/700), set as `--font-sans`
- `lib/format.ts` `formatPrice()` with unit tests
- `client/vitest.config.ts` (Node env, `@` alias)
- Placeholder `App.tsx`: "Explore Our Collection" heading and a primary `Button`, to check the theme visually

## Files to Create

1. `client/` - Vite scaffold
2. `client/components.json` - shadcn config (generated)
3. `client/src/index.css` - Tailwind import, tokens, `@theme inline`, base layer
4. `client/src/components/ui/*` - shadcn components (generated)
5. `client/src/lib/utils.ts` - `cn()` (generated)
6. `client/src/lib/format.ts` + `format.test.ts`
7. `client/vitest.config.ts`
8. `client/.env.example`

## Files to Modify

- `package.json` (root) - workspace + `dev`
- `client/vite.config.ts` - Tailwind plugin, alias, port
- `client/tsconfig.json`, `client/tsconfig.app.json` - alias
- `eslint.config.js` (root) - React Hooks / React Refresh rules for `client/`

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- Tailwind v4 needs no `tailwind.config.js` and no PostCSS config when using `@tailwindcss/vite`. Don't create either
- shadcn's Vite guide needs the `@/*` alias in **both** `tsconfig.json` and `tsconfig.app.json`, or `init` can't detect it
- `shadcn init` writes default oklch colors into `index.css`. Replace the values with our hex tokens but keep shadcn's variable names, so generated components keep working
- Light theme only: delete the generated `.dark { ... }` block
- The Vite scaffold ships its own `eslint.config.js`. Merge it into the root config instead of keeping two
- `formatPrice` uses `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, trailingZeroDisplay: 'stripIfInteger' })`, giving `$5,500` and `$4,500.50`

## Environment Variables

```
VITE_API_URL=http://localhost:8000
```

## Testing

1. `npm run dev` - client on http://localhost:5173 and server on 8000
2. The page shows a Poppins heading and a black primary button
3. In DevTools, `--primary` resolves to `#111111`. A test element with `border-type-painting` shows blue
4. No `tailwind.config.*` or `postcss.config.*` file exists
5. `npm test` - `formatPrice` tests pass (`5500` → `$5,500`, `4500.5` → `$4,500.50`)
6. `npm run build` - all workspaces build

## References

- Tailwind v4 with Vite: https://tailwindcss.com/docs/installation/using-vite
- shadcn/ui Vite installation: https://ui.shadcn.com/docs/installation/vite
- shadcn/ui theming: https://ui.shadcn.com/docs/theming
- Fontsource Poppins: https://fontsource.org/fonts/poppins/install
