# Published build-outcome result

This is one directional build-outcome evaluation of the godplans 1.9.0 release
candidate. It tests the central claim against a strong no-skill control: does
building from a godplans plan leave fewer expensive audit findings?

## Environment

| Field | Value |
|---|---|
| Date | 2026-07-23 |
| Case | `tenant-notes-api` |
| Planning, building, and audit model | `gpt-5.6-sol` |
| Codex CLI | 0.145.0 |
| godaudits | 2.12.0 |
| Audit capability | static |
| Audit arm identity | hidden |

The runners used their normal authenticated host CLI. No provider credential
was required by godplans or the coordinator. The configured default model was
resolved from the run host and recorded in every `RUNNER.txt`.

## Method

The treatment planner loaded the project-local godplans skill. The control
planner ran in an isolated home with no skills and received a neutral,
de-branded request. Both plans went to the same fresh no-skill builder with the
same model family and reasoning setting. The case verifier then ran against
both repositories.

For audit, each built repository was copied into a fresh anonymous workspace.
The plan and arm label were absent. The same fresh godaudits 2.12.0 static pass
audited each artifact. The final comparison uses open Critical and High
findings from the validated audit state.

## Result

| Arm | Verify | Critical | High | Critical plus High | All active |
|---|---|---:|---:|---:|---:|
| godplans treatment | pass | 0 | 1 | 1 | 9 |
| no-skill control | pass | 1 | 4 | 5 | 15 |

The treatment delta is -4 Critical plus High findings. Both artifacts passed
their implementation verifier, so the result does not come from a broken or
incomplete control build.

The control's Critical finding was a missing storage-enforced tenant boundary.
Its four High findings covered token rotation and revocation, unredacted
exception logging, repository and CI provenance, and missing agent memory for
the API, auth, and data boundaries. The treatment's only High finding was
missing version-control and CI provenance. Both evaluated copies lacked Git
history, and neither build emitted CI, so this remains a shared limitation of
the artifacts and setup.

The treatment audit scored 93/100 with an `audit-proof` verdict. The control
scored 79/100 with a `needs work` verdict. Those scores are secondary. The
predeclared primary outcome is the Critical plus High count.

## Cost

| Arm | Stage | Input | Cached input | Output | Input plus output |
|---|---|---:|---:|---:|---:|
| treatment | plan | 11,186,539 | 10,933,248 | 49,486 | 11,236,025 |
| treatment | build | 2,189,967 | 2,082,560 | 35,232 | 2,225,199 |
| control | plan | 152,557 | 114,432 | 10,259 | 162,816 |
| control | build | 691,970 | 630,272 | 25,218 | 717,188 |

The cumulative CLI-reported plan cost was 69.01 times the control, and the
combined plan plus build cost was 15.30 times the control. Most treatment input
was cached, but the absolute cost is still the clearest remaining weakness.
This result supports the risk-reduction claim for this case while also making
the context-cost tradeoff impossible to hide.

## Interpretation and limits

This run is direct evidence for one security-sensitive API case and one model
family. It is not evidence that every project, model, or builder will improve.
The audit is a blinded static model judgment, not a runtime security
certification. Agent outputs are stochastic, and a repeat run may differ.

The full ten-case, three-family matrix and the blind external n=5 grading
anchor remain publication requirements for broad claims. Until those runs
exist, the defensible statement is narrow: in this matched case, the godplans
arm passed the same verifier and had four fewer open Critical plus High
findings than the no-skill control.

## Raw artifacts

- `SUMMARY.json` and `SUMMARY.md`: generated comparison and token totals.
- `treatment/` and `control/`: plans, built repositories, verifier logs,
  complete audits, runner metadata, and CLI event logs.
- `treatment/audit/AUDIT.json` and `control/audit/AUDIT.json`: canonical audit
  states used for the primary outcome.
