# OPS-STORAGE-001: production deployment storage

Status: READY_FOR_REVIEW locally. Production deployment verification is pending the normal PR and environment gates.

The production root filesystem reached 100% and the deploy script could not create its temporary Docker config. A manually scoped cleanup of unused local Odyssey and Nexus images reduced usage to 71%. Do not delete production data, remotely published images, or any in-use or rollback image to reclaim space.

Odyssey and Nexus bundle the same storage policy with their existing SSH payload and use it only for their own mirror repository. The preflight warns at 80%, protects all present containers, published candidates and named pins, retains the latest 20 and recent seven calendar days, and removes at most 25 older local references without force. It rechecks free space before registry authentication and image pulling. This is deploy-time warning and cleanup, not continuous host monitoring. No changes to environment approvals, digest validation, data, or service health checks.

Validation: Bash syntax and Actionlint pass. An offline Linux Docker fixture exercises 79%/80%, separate temporary mounts, disk reporting failures, old commit and digest refs, stopped containers, pinned and incoming refs, cross-project scope, retention limits, and insufficient space after Docker refuses removal. No production image was changed by validation. Revert the deployment workflow changes to disable the policy; no application or data migration is required.
