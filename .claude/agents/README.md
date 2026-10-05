# Review Subagents

Custom subagents are your **review layer**: focused auditors you invoke after a
chunk of work or before `/feature complete`. They run in their own context and
report findings without editing (mostly) your code.

These are intentionally **project-shaped**: a good auditor references your real
file paths and stack, so they are best written (or adapted) per project rather
than copied blind. `code-scanner.md` in this folder is already adapted to this
project's stack (React + Vite / Express / TypeORM / PostgreSQL).

Agents that tend to earn their keep:

- **code-scanner** — general pass for security / performance / quality / modularity
  on the code you just changed. (Included.)
- **auth-auditor** — deep security pass on auth + account flows (the parts your
  auth library does NOT do for you: hashing, verification/reset tokens, session
  checks). This project has real auth (JWT cookie + user/admin roles), so it is
  worth adding.
- **refactor-scanner** — folder-scoped DRY / extraction hunt (`server/src/services`,
  `client/src/components`, `client/src/hooks`, ...). Add once there is enough
  code to have duplication.
- **ui-reviewer** — inspects the *rendered* page via Playwright MCP for visual /
  responsive / a11y defects. Add for UI-heavy work; needs the dev server running.

To add one: drop a `name.md` here with frontmatter (`name`, `description`,
`tools`, `model`) and a precise scope + methodology. The sharper the scope and
the more it names real paths, the fewer false positives you get.
