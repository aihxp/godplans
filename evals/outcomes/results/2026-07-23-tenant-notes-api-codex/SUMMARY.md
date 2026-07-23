# Build-outcome evaluation: tenant-notes-api

| Arm | Verify | Critical | High | Critical plus High | All active findings |
|---|---|---:|---:|---:|---:|
| treatment | pass | 0 | 1 | 1 | 9 |
| control | pass | 1 | 4 | 5 | 15 |

Critical plus High delta (treatment minus control): -4.

| Arm | Plan tokens | Build tokens | Reported total tokens |
|---|---:|---:|---:|
| treatment | 11,236,025 | 2,225,199 | 13,461,224 |
| control | 162,816 | 717,188 | 880,004 |

Token totals are cumulative CLI-reported input plus output. Cached input is retained separately in SUMMARY.json.
