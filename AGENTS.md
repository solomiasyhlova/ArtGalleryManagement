<!-- BEGIN:framework-agent-rules -->
# This is NOT the React / Express / TypeORM you know

The library versions in this repo (React, React Router, Vite, Express,
TypeORM, Tailwind CSS v4, shadcn/ui, TanStack Query, Zod) may have **breaking
changes** since your training cutoff. APIs, conventions, and file structure can
all differ from what you remember.

Before writing code against a framework or library:

- Check the installed version in the relevant workspace `package.json`
  (`client/`, `server/`, `shared/`) and in the root lockfile.
- Read the installed docs first when they ship in the package, or fetch that
  exact version's docs (Context7 MCP / a targeted web search) before relying on
  remembered APIs. Known traps: Express 5 vs 4 (async errors, path syntax),
  React Router library vs framework mode, Tailwind v4 CSS-first config, and
  Zod 4 vs 3.
- Heed deprecation notices in build/lint output. When a pattern looks unusual,
  do NOT assume it is wrong. Verify against the installed version first.
<!-- END:framework-agent-rules -->
