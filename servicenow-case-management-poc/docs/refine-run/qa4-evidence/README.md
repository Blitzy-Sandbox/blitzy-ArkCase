# QA4 remediation — retained raw evidence (2026-09-09 / 2026-09-10)

This directory exists to discharge QA finding **F12**, whose defect was that an earlier round's
pre-import (Step 5b) zero-state was recorded only as normalised prose: the verbatim requests, statuses
and bodies had been written to an agent scratch directory that no longer existed, so the one pass that
makes a gate meaningful could not be independently verified. Everything here is therefore committed to
the repository rather than described in a report, and every figure is **re-runnable** rather than
asserted — the predicate definitions that produced it are in `predicates/`.

Each capture records the exact URL, a UTC timestamp, the HTTP status, the response body (truncated at
4,000 characters) and the predicate that was asserted against it.

## Files

| File | What it is |
| --- | --- |
| `qa4-gate-evidence.jsonl` | The primary bundle: one JSON object per predicate, appended in execution order across the whole remediation. Phases are named in the `phase` field — the pre-import zero-state passes (`step5b_*`), the preview and commit gates (`step5c_*`), the post-commit censuses, the Step 8 teardown (`step8_*`) and the consolidation regression (`phase6_*`). The final line, `label: ZERO_STATE_STATEMENT`, carries the directive's required closing statement with the counts it rests on. |
| `qa4-f01-residue-census.json` | Finding **F01**'s provable before/after. Six snapshots of the same predicate set — application installed, after the scope teardown, after the residue deletion, after the browser evidence capture, final, and the consolidation re-check — with row identities retained for the small classes and a URL histogram for the bulk class. The `f01_predicate_sum` per snapshot reads 1245 → 996 → 129 → 2 → 0 → 0. |
| `global_totals_pre.json` / `global_totals_post.json` | Whole-table row totals for 52 platform tables, captured with the application installed and again after the teardown and residue cleanup. Their difference is the evidence that the cleanup removed the application's own footprint and nothing else: `sys_metadata_delete` returns to its exact prior total, while `syslog` and `sys_audit` only grow. |
| `final_export_verification.txt` | Off-instance verification of the exported package: block and record inventory, descriptor fields, dangling-reference profile, and the checks run against each candidate export. |
| `canonical_sha256.txt` | The delivered package's SHA-256, recorded at the moment the canonical path was written. |
| `predicates/zero_state.py` | The 47 zero-state predicates the directive requires, as executed. Selection is **positive** — this task's records are matched by their own creation date and this package's name — so anything pre-existing was never in the measured set. |
| `predicates/residue.py` | The residue predicate set behind `qa4-f01-residue-census.json`, including the `preserve_*` counters for the ATF results, attachments and log rows that must survive a teardown. |
| `predicates/census.py` | The 55-predicate post-commit census: schema, choices, ACLs and role links, flows, scripts, reports, dashboards, portal, REST endpoints, ATF assets, seed data and the derived persona grants. |
| `predicates/global_totals.py` | The whole-table totals collector behind the two `global_totals_*.json` files. |
| `predicates/evidence.py` | The capture helper that writes `qa4-gate-evidence.jsonl`. |
| `predicates/anal3.py` | The package analyser: payload-block and record-class inventory, and the reference profile used to distinguish records the package declares from records it expects the platform to already hold. |

## Reproducing any figure

The scripts read the instance URL and credentials from the environment
(`SERVICENOW_INSTANCE_ADMIN_URL`, `SERVICENOW_INSTANCE_ADMIN_USERNAME`,
`SERVICENOW_INSTANCE_ADMIN_PASSWORD`) and contain no credentials of their own. `zero_state.py` and
`residue.py` take a phase label and a bundle path; `census.py` additionally takes the retrieved
update-set descriptor. `anal3.py` runs offline against the package XML and needs no instance at all.

## One thing this evidence deliberately does not contain

The instance these captures were taken from was returned to a zero-state by design once the gate and
the tests were complete — *instance zero-state confirmed at 2026-09-10T10:20:32Z, no residue
remaining*. Re-running the instance-facing predicates today will therefore reproduce the **final**
state (everything at zero), not the intermediate ones. The intermediate states are what this directory
preserves, which is the whole reason it is committed. The durable artifact is the XML at
`update-set/x_casemgmt_case_management_update_set.xml`, whose identity is recorded in
`canonical_sha256.txt`.
