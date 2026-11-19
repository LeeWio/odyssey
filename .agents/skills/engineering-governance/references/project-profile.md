# Odyssey project profile

- **Repository:** `LeeWio/odyssey`, target branch currently `main` in the local checkout. Confirm protection and default branch through GitHub before relying on them.
- **Instructions:** read `AGENTS.md`, `docs/00-project-rules.md`, relevant design/architecture docs, and module-local instructions before editing.
- **Stack:** Next.js, React, TypeScript, Bun `1.3.14`, HeroUI v3, Tailwind utilities, Motion, Vitest, and Playwright.
- **Design constraints:** HeroUI is the baseline. Query the connected HeroUI MCP before changing HeroUI components. Follow the project rule to use Tailwind utilities and keep CSS-file changes out of UI work.
- **Release and deploy:** Release Please maintains a version PR. Its merge triggers tag and GitHub Release creation. Production deployment is a separate workflow with a GitHub Environment approval, digest verification, revision-aware health checks, and rollback. See the repository's release checklist.
- **CI evidence:** `.github/workflows/ci.yml` runs preflight, scoped Chromium Playwright checks, production build, Lighthouse, and an OpenAPI operation check against a pinned Nexus revision. `security.yml` audits the resolved Bun graph. `pr-lint.yml` checks PR titles, `codeql.yml` runs static analysis, and `review.yml` posts advisory ESLint findings.
- **Protection:** `Enterprise Main Protection` targets `main`. Query GitHub for current required checks, bypass actors, reviewer rules, and merge methods before relying on any specific settings. GitHub Environment approval and PR approval are separate.
- **Repository templates:** Use `.github/pull_request_template.md` and consult `.github/CODEOWNERS`. CODEOWNERS requests review. Check the GitHub ruleset for the approval requirements actually enforced.
- **Git convention:** recent history uses Conventional Commit-style subjects. The local `AGENTS.md` requires commit and push operations on the production checkout at `/srv/blog/apps/web`, so do not commit or push from this local copy unless the user explicitly changes that instruction.
- **Secrets:** `.env.local`, `.env.production`, HeroUI tokens, and deployment credentials are sensitive. Never include them in diffs or reports.

The profile describes observed repository facts. Recheck them when the checkout or branch changes.
