# Stale source evidence evaluation

Use godplans in brownfield mode for a small Node.js service whose manifest and
public contract are planning inputs. The plan may be resumed after those inputs
change outside the task queue. Bind the plan to explicit source revision,
SHA-256 input evidence, and a validation timestamp. Require resume to recheck
completed or imported evidence and return stale work to planning before any
execution continues.

Take recommended defaults. Produce the complete godplans artifact set under
`.godplans/`, including `PLAN.mdx` and its executable validator companion. Do
not implement the service.
