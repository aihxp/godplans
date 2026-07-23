# Stale-evidence resume plan

Write a thorough implementation plan for a small Node.js service whose manifest
and public contract are planning inputs. The plan may be resumed after those
inputs change outside the task queue. Bind the plan to an explicit source
revision, hashed input evidence, and a validation timestamp. Require a resume to
recheck completed or imported evidence and return stale work to a not-yet-
approved state before any execution continues.

Decide sensible defaults yourself rather than asking. Write your plan to
`PLAN.md`. Do not implement the service.
