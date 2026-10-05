# Setup - Workspaces & Tooling

## Overview

Create the npm workspaces monorepo with shared TypeScript, lint, format and test tooling, plus the `shared` package that client and server will both import. No app code yet.

## Requirements

- Root `package.json` with `"private": true` and `"workspaces"`. List only workspaces that exist: `shared` now, `server` is added in setup-phase-2 and `client` in setup-phase-4
- ESM everywhere (`"type": "module"` in each `package.json`)
- `tsconfig.base.json` with `strict: true` and common options. Each workspace extends it
- `shared` package named `@art-gallery/shared`. It builds with `tsc` to `dist/` and exports:
  - `ARTWORK_TYPES = ['painting', 'sculpture', 'photography', 'drawing', 'print', 'digital'] as const` and the `ArtworkType` union
  - `USER_ROLES = ['user', 'admin'] as const` and the `UserRole` union
  - `DEFAULT_PAGE_SIZE = 12`, `MAX_PAGE_SIZE = 50`
- ESLint (flat config, typescript-eslint) + Prettier at the root
- Vitest: root `vitest.config.ts` with `test.projects` globbing `{shared,server,client}/vitest.config.ts`, and a `shared/vitest.config.ts` (Node env)
- Root scripts: `dev`, `build`, `lint`, `format`, `test` (`vitest run`), `test:watch` (`vitest`)
- `dev` uses `concurrently` (only `shared` in watch mode for now). `build` builds `shared` first

## Files to Create

1. `package.json` - workspaces, root scripts, dev deps (typescript, eslint, typescript-eslint, prettier, concurrently, vitest)
2. `tsconfig.base.json` - strict shared compiler options
3. `eslint.config.js` - flat config + `eslint-config-prettier`
4. `.prettierrc` - formatting rules
5. `vitest.config.ts` - root projects config
6. `shared/package.json` - `exports` → `dist/index.js` + types, `build` / `dev` (`tsc -w`) / `test` scripts
7. `shared/tsconfig.json` - extends base, `outDir: dist`, `declaration: true`
8. `shared/vitest.config.ts`
9. `shared/src/constants.ts` - constants above
10. `shared/src/index.ts` - barrel export
11. `shared/src/constants.test.ts` - smoke test

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- `shared` is consumed from `dist/`, so it must be built before server or client run. `build` builds it first, and `dev` runs `tsc -w` for it
- `shared` runs in Node from `dist/`, so it must be valid ESM: use `module: NodeNext` and `.js` extensions on relative imports (`export * from './constants.js'`)
- Declare the arrays `as const`, so `(typeof ARTWORK_TYPES)[number]` is a union rather than `string`
- ESLint 9+ uses flat config only (`eslint.config.js`). Don't create `.eslintrc`
- Scripts must be cross-platform (Windows): no `rm -rf`; use `tsc --build --clean` or `rimraf`

## Testing

1. `npm install` at the root - one lockfile at the root, `node_modules/@art-gallery/shared` is a link
2. `npm run build` - `shared/dist/` contains `index.js` and `index.d.ts`
3. `npm test` - smoke test passes
4. `npm run lint` and `npm run format` - no errors

## References

- npm workspaces: https://docs.npmjs.com/cli/using-npm/workspaces
- typescript-eslint: https://typescript-eslint.io/getting-started
- Vitest projects: https://vitest.dev/guide/projects
