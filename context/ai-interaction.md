# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Verify it works in the browser. Add/maintain unit tests (`npm test`) for any server services, middleware, shared schemas or utilities you touch — see [Testing](#testing). Run `npm run build` and fix any errors
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after build passes and everything works
7. **Merge** - Merge to main
8. **Delete Branch** - Delete branch after merge
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md and add to history

Do NOT commit without permission and until the build passes. If build fails, fix the issues first.

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Testing

We use [Vitest](https://vitest.dev) for unit tests. Each workspace has its own
`vitest.config.ts` (`server/` and `shared/` use the Node environment). The root
`npm test` runs every workspace.

- **Scope: logic only.** Do NOT write React component/UI tests; those aren't
  worth the maintenance here yet. Test:
  - `shared/src/schemas/**`: validation rules (title ≤ 99, artist ≤ 50, price > 0,
    enum types, query params)
  - `server/src/services/**`: business logic (filter/sort/pagination building,
    not-found handling, auth register/login)
  - `server/src/middleware/**`: `requireAuth`, `requireRole`, `validate`, `errorHandler`
  - `server/src/utils/**` and `client/src/lib/**`: pure helpers (price
    formatting, query-string parsing, JWT/cookie helpers)
- Co-locate tests next to the code as `*.test.ts` (e.g. `server/src/services/artworks.service.test.ts`).
- Keep tests true units, with **no real database, network, or auth**. Mock
  collaborators: the TypeORM repository / `AppDataSource`
  (`vi.mock("../db/data-source", …)`), `vi.mock("bcrypt", …)`,
  `vi.mock("jsonwebtoken", …)`. Define mock objects with `vi.hoisted()` so the
  hoisted `vi.mock` factory can reference them.
- For middleware, pass hand-built `req` / `res` / `next` mocks. Don't start the server.
- Import test helpers explicitly from `vitest` (no globals).

Commands (from the repo root):

- `npm test` runs the suite once in all workspaces (CI-style).
- `npm run test:watch` runs watch mode while developing.
- `npm test -w server` (or `-w shared`, `-w client`) runs one workspace.

Run `npm test` before committing alongside `npm run build` and `npm run typecheck`
(the build excludes `*.test.ts`, and Vitest does not type-check).

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)
