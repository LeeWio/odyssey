# Release checklist

Run development checks locally before transferring the patch to the production checkout.

1. `bun run preflight` checks formatting, lint, types and unit tests.
2. Playwright for the journey you changed. Reading work includes `tests/e2e/article-reading-list.spec.ts` and the library specs under `tests/e2e/library-*.spec.ts`.
3. `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage` checks frontend operation paths and methods against the pinned Nexus revision. For a change that depends on a new Nexus endpoint, regenerate the snapshot from a successful Nexus OpenAPI integration run. Use `node scripts/pin-openapi-operations.mjs <nexus-openapi.json> <40-character-nexus-sha>` and review the resulting contract diff. See [the contract README](../../contracts/README.md).
4. New visitor copy exists in both `messages/en.json` and `messages/zh.json`.
5. A route that is still a demo keeps its `Demo` label. A dashboard view without an API keeps the sample or not-connected label.
6. Update the module note in `docs/07-modules/` when a boundary changes.

Do not commit `.env` or credentials. Sync the work to the server, then commit there.

## Browser checks

- `bun run test:e2e:smoke` runs the tagged critical browser journeys with no retries. GitHub runs it on pull requests with a ten-minute job limit.
- `bun run test:e2e` runs the full suite. GitHub runs it nightly at 19:17 UTC and supports manual runs from **Full Browser E2E**. Download its Playwright report or `e2e-timing.json` to compare failures, retries and durations. The full suite runs independently of deployment.
- An ordinary local or CI run starts a loopback-only API fixture before Next.js. Use the shared article fixtures for server-rendered routes and retain browser route mocks for scenario-specific client reads and writes. If you set `PLAYWRIGHT_BASE_URL` to reuse a running app, start the fixture with `bun tests/e2e/fixtures/api.ts` and set `API_URL=http://127.0.0.1:3181` when starting the app.

## Release and deployment

- Release Please opens or updates a version PR from `main`. The repository's **Allow GitHub Actions to create and approve pull requests** setting permits the bot to open its PR. The workflow only creates and updates PRs. Review and merge the release PR through the active GitHub gates using an authorized identity.
- When GitHub displays **Approve workflows to run** on a Release Please PR, a maintainer must release those workflow runs and review the results before approving the changes. If the release workflow fails or CI never queues, check its logs and its repository Actions permissions before re-running **Release PR** on `main`.
- Use the latest published tag to reconcile release metadata. The manifest and `package.json` should agree. Release Please can reuse its existing release branch when it creates the PR. Review the generated version and changelog before merge.
- The production workflow builds an immutable image and publishes signed provenance and an SPDX SBOM for its digest in GHCR. Aliyun receives the identical digest without inline attestation manifests due to its registry limitation. The deployment job waits for a production environment approval. It verifies the SSH host against `SERVER_SSH_FINGERPRINT` and uses a temporary Docker config for registry authentication.
- Before creating the Docker config or pulling the image, the deploy job warns at 80% filesystem usage. If Docker storage is under pressure, it removes up to 25 eligible old local references from the Odyssey mirror, oldest first. It keeps the newest 20 images, all images from the last seven calendar days, and all current, pinned, rollback, or incoming images. The cleanup does not affect registry copies, containers, or volumes.
- The job rechecks disk space after cleaning and stops before the pull if Docker storage has less than 1 GiB available or a required filesystem has no free space. The warning runs during deployment; it does not replace continuous host monitoring.
- After approval, the job pulls the exact Aliyun digest, verifies the OCI revision label, and checks the container's health and the revision served by `https://easylove.top/healthz/odyssey`. A failed switch attempts to restore the previous local image. The retained `ghcr.io/leewio/odyssey-web:rollback` tag identifies the prior image for a maintainer to recover manually if needed.
