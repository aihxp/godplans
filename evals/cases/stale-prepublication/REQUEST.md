# Stale prepublication evaluation

Use godplans to plan a publicly deployed SaaS service. Launch preparation and
hardening may overlap, but a Critical finding can appear after launch assets
are ready. Public activation must use a fresh prepublication check bound to the
latest hardening content hash or immutable revision. A later hardening change
invalidates the check. Any permitted Critical risk requires owner,
justification, acceptance date, and expiration. This project has a public
release surface.

Take recommended defaults. Produce the complete godplans artifact set under
`.godplans/`, including `PLAN.mdx` and its executable validator companion. Do
not build or publish anything.
