# Monorepo governance plan

Write a thorough implementation plan for a monorepo with shared root guidance
and an independently governed `packages/web` application. The root scope owns
repository and release rules. The web scope overrides local UI guidance and
excludes a root-routed observability concern because the hosting platform owns
package telemetry. Keep known but unauthored privacy guidance discoverable.

Decide sensible defaults yourself rather than asking. Write your plan to
`PLAN.md`. Do not build the repository.
