# External grading

This evaluation breaks the sibling-rubric loop. Judges receive one neutral
brief, two arm-blind plans, and `RUBRIC.md`. The criteria contain no godplans
requirement ids and do not descend from its domain modules.

Run at least five plan pairs through at least two judges from outside the
planning model family:

```bash
node scripts/eval-external.js \
  --matrix evals/results/RUN \
  --source-profile codex \
  --judge claude=evals/runners/claude-grade.sh \
  --judge gemini=evals/runners/gemini-grade.sh \
  --output evals/external/results/RUN
```

The runner receives `PACKET.md` and an output `GRADE.json` path. It must disable
godplans and sibling skills for the judging turn. The included adapters use
their host CLI's existing authentication and record the available
customization-isolation mode. The coordinator validates totals, unblinds only
after both grades exist, and publishes treatment and control means, preference
counts, raw grades, and mean absolute inter-rater score gap.

No provider credential is required by this repository. Maintainers may replace
the included adapters with any host runner that satisfies the two-argument
contract.

Five pairs and two raters are minimum evidence, not a statistical guarantee.
Publish the packets, blinding map, raw JSON grades, runner metadata, and summary
together.
