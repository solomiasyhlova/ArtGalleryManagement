# Current Feature: Setup - Workspaces & Tooling

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

Complete

## Goals

<!-- Bullet points of what success looks like. Filled by `/feature load`. -->

- Root `package.json` with `"private": true` and `"workspaces"` listing only existing workspaces (`shared` now; `server` in setup-phase-2, `client` in setup-phase-4)
- ESM everywhere (`"type": "module"` in each `package.json`)
- `tsconfig.base.json` with `strict: true` and common options; each workspace extends it
- `shared` package `@art-gallery/shared` builds with `tsc` to `dist/` and exports:
  - `ARTWORK_TYPES = ['painting', 'sculpture', 'photography', 'drawing', 'print', 'digital'] as const` and the `ArtworkType` union
  - `USER_ROLES = ['user', 'admin'] as const` and the `UserRole` union
  - `DEFAULT_PAGE_SIZE = 12`, `MAX_PAGE_SIZE = 50`
- ESLint (flat config, typescript-eslint) + Prettier at the root
- Vitest: root `vitest.config.ts` with `test.projects` globbing `{shared,server,client}/vitest.config.ts`, plus `shared/vitest.config.ts` (Node env)
- Root scripts: `dev`, `build`, `lint`, `format`, `test` (`vitest run`), `test:watch` (`vitest`)
- `dev` uses `concurrently` (only `shared` in watch mode for now); `build` builds `shared` first
- Files to create:
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
- Verification:
  1. `npm install` at the root - one lockfile at the root, `node_modules/@art-gallery/shared` is a link
  2. `npm run build` - `shared/dist/` contains `index.js` and `index.d.ts`
  3. `npm test` - smoke test passes
  4. `npm run lint` and `npm run format` - no errors

## Notes

<!-- Additional context, constraints, or details from the spec. -->

- Spec: `context/features/setup-phase-1-spec.md`. No app code yet
- Use Context7 to verify the newest config and conventions
- `shared` is consumed from `dist/`, so it must be built before server or client run. `build` builds it first, and `dev` runs `tsc -w` for it
- `shared` runs in Node from `dist/`, so it must be valid ESM: `module: NodeNext` and `.js` extensions on relative imports (`export * from './constants.js'`)
- Declare the arrays `as const`, so `(typeof ARTWORK_TYPES)[number]` is a union rather than `string`
- ESLint 9+ uses flat config only (`eslint.config.js`). Don't create `.eslintrc`
- Scripts must be cross-platform (Windows): no `rm -rf`; use `tsc --build --clean` or `rimraf`
- References:
  - npm workspaces: https://docs.npmjs.com/cli/using-npm/workspaces
  - typescript-eslint: https://typescript-eslint.io/getting-started
  - Vitest projects: https://vitest.dev/guide/projects

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Setup - Workspaces & Tooling (setup-phase-1): npm workspaces (`shared`), strict TS base config, ESLint flat config + Prettier, Vitest projects, `@art-gallery/shared` constants. TypeScript pinned to `~6.0.3` because typescript-eslint 8.x supports only `<6.1.0`
