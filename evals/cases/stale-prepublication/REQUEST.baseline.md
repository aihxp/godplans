# Prepublication gating plan

Write a thorough implementation plan for a publicly deployed SaaS service.
Launch preparation and hardening may overlap, but a Critical finding can appear
after launch assets are ready. Public activation must use a fresh
prepublication check bound to the latest hardening content hash or immutable
revision, and a later hardening change invalidates the check. Any permitted
Critical risk requires an owner, a justification, an acceptance date, and an
expiration.

Decide sensible defaults yourself rather than asking. Write your plan to
`PLAN.md`. Do not build or publish anything.
