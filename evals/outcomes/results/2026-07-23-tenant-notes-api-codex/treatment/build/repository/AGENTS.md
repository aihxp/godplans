# Pillars 1.1.0

1. Read this loader before changing the repository.
2. Load every pillar whose `always_load` value is `true`.
3. Normalize the task to lowercase ASCII words and phrases.
4. Load a task-routed pillar when one of its triggers matches a complete word
   or phrase; substring matches inside another word do not count.
5. Recursively load `must_read_with`, then consult `see_also` only when needed.
6. Apply the most specific loaded rule and update its owning pillar when a hard
   constraint or decision changes.

| State | Required action |
|---|---|
| Present | Load and apply the pillar. |
| Missing required floor | Pause; restore the pillar before product work. |
| Missing routed pillar | Record the gap and use the always-loaded context. |
| Deferred | Do not invent guidance before its named trigger. |
| Excluded | Keep the concern out of scope unless scope is explicitly changed. |

Structured exclusions: UI has no rendered surface; deploy and launch have no
public target; LLM has no model call; SEO has no crawlable content;
notifications and billing have no product flow; async and cache have no
workload need; integrations would violate local offline execution.
