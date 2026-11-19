# Release checklist

Run development checks locally before transferring the patch to the production checkout.

1. `bun run preflight` checks formatting, lint, types and unit tests.
2. Playwright for the journey you changed. Reading work includes `tests/e2e/article-reading-list.spec.ts` and the library specs under `tests/e2e/library-*.spec.ts`.
3. `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage` checks frontend operation paths and methods against the pinned Nexus revision. For a change that depends on a new Nexus endpoint, regenerate the snapshot from a successful Nexus OpenAPI integration run. Use `node scripts/pin-openapi-operations.mjs <nexus-openapi.json> <40-character-nexus-sha>` and review the resulting contract diff. See [the contract README](../../contracts/README.md).
4. New visitor copy exists in both `messages/en.json` and `messages/zh.json`.
5. A route that is still a demo keeps its `Demo` label. A dashboard view without an API keeps the sample or not-connected label.
6. Update the module note in `docs/07-modules/` when a boundary changes.

Do not commit `.env` or credentials. Sync the work to the server, then commit there.

## Release and deployment

- Release Please opens or updates a version PR from `main`. The repository's **Allow GitHub Actions to create and approve pull requests** setting permits the bot to open its PR. The workflow only creates and updates PRs. A human with repository permission reviews and merges them.
- When GitHub displays **Approve workflows to run** on a Release Please PR, a maintainer must release those workflow runs and review the results before approving the changes. If the release workflow fails or CI never queues, check its logs and its repository Actions permissions before re-running **Release PR** on `main`.
- Use the latest published tag to reconcile release metadata. The manifest and `package.json` should agree. Release Please can reuse its existing release branch when it creates the PR. Review the generated version and changelog before merge.
- The production workflow builds an immutable image and publishes signed provenance and an SPDX SBOM for its digest in GHCR. Aliyun receives the identical digest without inline attestation manifests due to its registry limitation. The deployment job waits for a production environment approval.
- After approval, the job pulls the exact Aliyun digest, verifies the OCI revision label, and checks the container's health and the revision served by `https://easylove.top/healthz/odyssey`. A failed switch attempts to restore the previous local image. The retained `ghcr.io/leewio/odyssey-web:rollback` tag identifies the prior image for a maintainer to recover manually if needed.
