# Validation Gates

## Purpose

This document captures the seven validation gates that the scoped application MUST pass before delivery. Each gate corresponds to a critical capability surface and has a specific pass condition; every gate MUST be exercised on a fresh PDI before the Update Set is committed. Failure on any gate blocks delivery — no out-of-scope workarounds are permitted (per AAP Section 0.7.2 Minimal-Change Clause).

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

This file is the central reference for:

1. The verbatim 7-row validation table from AAP Section 0.7.3.
2. How each gate maps to the other documentation files in `docs/` (cross-reference).
3. What it means for a gate to "pass" (Pass Condition column).
4. The order in which gates SHOULD be checked (so failures are caught early).

This is a synthesis document. It links to the per-capability design documents under `docs/` and the deployment runbook under `docs/deployment.md` rather than duplicating their content. When a verifier needs the underlying design contract for a gate, they SHOULD follow the Cross-Reference Document link in that gate's sub-section.

## The Seven Gates

The following table is preserved verbatim from AAP Section 0.7.3 and serves as the canonical pass/fail criteria for delivery. The Criterion and Pass Condition columns MUST be evaluated character-for-character as written; partial passes, skipped checks, or warnings rebranded as passes are NOT acceptable.

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| Data model | All 3 custom tables created with correct fields and types | Zero missing mandatory fields |
| Workflow | All state transitions enforced for both case types | Invalid transitions return blocking error; task-closure check blocks Resolved transition |
| ACLs | Role-based access enforced | case_viewer cannot write; case_agent cannot access unassigned cases; case_manager has full access |
| Portal — submission | Case created from unauthenticated portal submission | Case appears in internal list with Draft status and correct case number |
| Portal — lookup | Status lookup returns correct data for valid case number | Correct status/subject/opened_date returned; "not found" message for invalid number |
| Dashboards | Both dashboards render with synthetic data | All widgets display data; no broken report references |
| Update Set | Scoped app exported | Update Set loads without errors on a fresh PDI instance |

## Per-Gate Detail

Each gate below follows the same shape: the verbatim Criterion and Pass Condition, a numbered Detailed Verification Procedure that a human verifier can execute on the PDI without any further design context, the Cross-Reference Document under `docs/` that defines the design contract this gate exercises, and a Failure Mode that explains what to do when the gate fails. Per AAP Section 0.7.2 Minimal-Change Clause: when any gate fails and the resolution would require adding a module, workflow, table, portal page, integration, or other artifact beyond the AAP-defined scope, **stop and report the specific gap — do not substitute an out-of-scope workaround.**

### Gate 1 — Data Model

- **Criterion:** All 3 custom tables created with correct fields and types
- **Pass Condition:** Zero missing mandatory fields
- **Detailed Verification Procedure:**
    1. Open ServiceNow → System Definition → Tables → filter `Name CONTAINS x_casemgmt_case`. Confirm exactly 3 records: `x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`.
    2. Open each table and verify the field set matches `docs/data-model.md` verbatim — `x_casemgmt_case` has 14 fields (12 user-prompt-specified plus `pending_reason` plus the virtual `duration_to_close` Function Field), `x_casemgmt_case_task` has 6, `x_casemgmt_case_party` has 5 — 25 fields total.
    3. For each Mandatory column in `data-model.md`, confirm the dictionary entry has `mandatory = true`.
    4. For each Choice column, confirm the choices on the choice list match the Choice Values column verbatim.
    5. For each Reference column, confirm the reference target matches verbatim (`sys_user_group`, `sys_user`, `core_company`, `x_casemgmt_case`).
    6. Confirm the auto-numbering format on `x_casemgmt_case.number` is `CASE0000001` (7-digit zero-padded) and the field is Read-only.
- **Cross-Reference Document:** [`data-model.md`](./data-model.md)
- **Failure Mode:** If any mandatory field is missing or has a wrong type, fix the dictionary entry in the source application and re-export the Update Set. Do NOT add fields beyond the AAP-specified set. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires adding fields outside the AAP-defined data model, stop and report — do not substitute.

### Gate 2 — Workflow

- **Criterion:** All state transitions enforced for both case types
- **Pass Condition:** Invalid transitions return blocking error; task-closure check blocks Resolved transition
- **Detailed Verification Procedure:**
    1. Open Flow Designer → filter by name `x_casemgmt_*state_machine`. Confirm both flows are Active (not Draft).
    2. As `x_casemgmt_demo_manager` user, create a new General Inquiry case in Draft status; attempt to set status to Open WITHOUT setting `assigned_group`. Verify a blocking form-level error appears.
    3. Set `assigned_group` and re-attempt the Open transition. Verify success.
    4. Attempt In Progress transition WITHOUT setting `assigned_agent`. Verify blocking error.
    5. Set `assigned_agent` to a user that is NOT a member of `assigned_group`. Verify blocking error.
    6. Set `assigned_agent` to a valid group member. Verify success.
    7. Create a child task on the case with `status = Open`. Attempt In Progress → Resolved transition. Verify error: `"All tasks must be closed before resolving this case."` (verbatim).
    8. Close the child task. Re-attempt Resolved transition. Verify success.
    9. As `x_casemgmt_demo_agent` (non-manager), attempt Resolved → Closed transition. Verify blocking form-level error.
    10. As `x_casemgmt_demo_manager`, attempt Resolved → Closed. Verify success and that `closed_date` is auto-populated.
    11. Attempt to set status back to Draft from any non-Draft state. Verify error: `"Cases cannot be returned to Draft."` (verbatim).
    12. Attempt to update a Closed case. Verify error: `"Closed cases are terminal and cannot be modified."` (verbatim).
    13. Repeat the entire procedure for a Complaint case to confirm both flows enforce the same rules.
- **Cross-Reference Document:** [`state-machine.md`](./state-machine.md)
- **Failure Mode:** If any transition rule fails, fix the corresponding subflow in `flows/sub_flows/` and re-export. Do NOT add transitions beyond the AAP-specified set. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires a transition or workflow not defined in AAP Section 0.5.5, stop and report — do not substitute.

### Gate 3 — ACLs

- **Criterion:** Role-based access enforced
- **Pass Condition:** case_viewer cannot write; case_agent cannot access unassigned cases; case_manager has full access
- **Detailed Verification Procedure:**
    1. Impersonate `x_casemgmt_demo_viewer`. Open the case list. Confirm all cases visible.
    2. Open any case → attempt to edit any field → confirm the form is read-only (no Save button or all fields disabled).
    3. Impersonate `x_casemgmt_demo_agent`. Open the case list. Confirm only cases where `assigned_agent = self` OR `assigned_group` contains self are visible.
    4. Open an assigned case → confirm fields are editable.
    5. Attempt to write to `assigned_group` field — confirm field is read-only (manager-only).
    6. Open an unassigned case via direct URL — confirm 403 / "Security constraints prevent access" message.
    7. Impersonate `x_casemgmt_demo_manager`. Open the case list. Confirm all cases visible and editable.
    8. Edit `assigned_group` and `assigned_agent` — confirm both fields are writable.
    9. Delete a Draft demo case — confirm success.
    10. Repeat steps for `case_task` and `case_party` tables to confirm the same matrix is enforced.
- **Cross-Reference Document:** [`acl-matrix.md`](./acl-matrix.md)
- **Failure Mode:** If any role has incorrect access, fix the ACL records in `acl/` and re-export. Do NOT modify global ACLs. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires altering global ACLs or adding roles beyond the three AAP-defined scoped roles, stop and report — do not substitute.

### Gate 4 — Portal Submission

- **Criterion:** Case created from unauthenticated portal submission
- **Pass Condition:** Case appears in internal list with Draft status and correct case number
- **Detailed Verification Procedure:**
    1. Log out of the PDI. Open the portal URL `[instance URL]/x_casemgmt_case_portal` in an incognito browser window. The slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml); AAP Section 0.7.2 verbatim wording uses the generic placeholder `[instance URL]/x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time"). See [`portal-pages.md`](./portal-pages.md) for full discussion.
    2. Navigate to the Case Submission page.
    3. Fill in the 5 fields: subject, type (General Inquiry), description, requester_name, requester_email.
    4. Click Submit. Confirm a confirmation panel appears displaying the auto-generated case number in `CASE0000001` format.
    5. Log in as `x_casemgmt_demo_manager`. Open the case list. Find the case by the returned number.
    6. Confirm `status = Draft`, `subject` matches submitted value, `requester_name` matches submitted value, and `opened_date` is set.
    7. Confirm internal fields (`assigned_group`, `assigned_agent`, `closed_date`) are NOT populated.
- **Cross-Reference Document:** [`portal-pages.md`](./portal-pages.md)
- **Failure Mode:** If submission fails or the case doesn't appear, fix the scripted REST endpoint in `portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml` and re-export. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires adding portal pages, fields, or anonymous endpoints beyond those defined in [`portal-pages.md`](./portal-pages.md), stop and report — do not substitute.

### Gate 5 — Portal Lookup

- **Criterion:** Status lookup returns correct data for valid case number
- **Pass Condition:** Correct status/subject/opened_date returned; "not found" message for invalid number
- **Detailed Verification Procedure:**
    1. Log out of the PDI. Open the portal URL in an incognito browser window.
    2. Navigate to the Case Status Lookup page.
    3. Enter the case number returned from the Gate 4 submission test. Click Lookup.
    4. Confirm the result panel displays exactly three fields: `status`, `subject`, `opened_date`. Confirm NO other fields are exposed (no `assigned_group`, no `assigned_agent`, no `description`, no `closed_date`, no `requester_*`).
    5. Enter an invalid case number (e.g., `CASE9999999`). Click Lookup.
    6. Confirm the literal text `"No case found with that number."` (verbatim) is displayed.
- **Cross-Reference Document:** [`portal-pages.md`](./portal-pages.md)
- **Failure Mode:** If the lookup exposes internal fields or returns wrong text, fix the scripted REST endpoint in `portal/rest/sys_ws_definition_x_casemgmt_case_status_lookup.xml` and re-export. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires exposing additional fields on the lookup page, stop and report — do not substitute; the user prompt explicitly limits the lookup to `status`, `subject`, and `opened_date`.

### Gate 6 — Dashboards

- **Criterion:** Both dashboards render with synthetic data
- **Pass Condition:** All widgets display data; no broken report references
- **Detailed Verification Procedure:**
    1. Impersonate `x_casemgmt_demo_agent`. Navigate to Performance Analytics → Dashboards → Agent Workspace.
    2. Confirm all 3 widgets render: My open cases (list), My overdue tasks (list), Case count by status (donut).
    3. Confirm each widget displays at least one row of synthetic data (or a clean "No data" message — but NOT a "Report not found" or 500 error).
    4. Click each list widget item to drill into the underlying record. Confirm navigation works.
    5. Impersonate `x_casemgmt_demo_manager`. Navigate to Manager View dashboard.
    6. Confirm all 5 widgets render: cases by status (bar), cases by type (donut), cases by priority (bar), avg time-to-close (single-score), cases-opened-30-days (single-score).
    7. Confirm each widget shows synthetic-data values consistent with the seed data.
- **Cross-Reference Document:** [`dashboards.md`](./dashboards.md)
- **Failure Mode:** If a widget fails to render, the underlying report record is broken. Fix the report XML in `reports/` and the dashboard reference in `dashboards/` and re-export. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires adding widgets beyond the eight reports defined in [`dashboards.md`](./dashboards.md), stop and report — do not substitute.

### Gate 7 — Update Set

- **Criterion:** Scoped app exported
- **Pass Condition:** Update Set loads without errors on a fresh PDI instance
- **Detailed Verification Procedure:**
    1. On the source PDI: System Update Sets → Local Update Sets → locate the scoped application Update Set → set status to Complete → Export to XML.
    2. Provision a fresh PDI (or use a separate clean instance).
    3. On the verification PDI: System Update Sets → Retrieved Update Sets → Upload XML → select the exported file.
    4. Click Preview. Wait for preview to complete.
    5. Confirm zero preview errors. Skipped or warning rows are NOT acceptable as passes.
    6. If preview errors exist, return to source PDI, fix the underlying records, re-export, and restart this procedure.
    7. Click Commit. Wait for commit to complete.
    8. Re-run all of Gates 1–6 on the verification PDI to confirm the application is fully functional after a fresh install.
- **Cross-Reference Document:** [`deployment.md`](./deployment.md) and [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md)
- **Failure Mode:** Update Set integrity is the final gate; failure here blocks delivery. The most common cause is hard-coded `sys_id` references — search every flow, ACL, business rule, and seed record for literal `sys_id` values and replace with `GlideRecord` lookups by name/user_name/number/role_label. Per AAP Section 0.7.2 Minimal-Change Clause, if the preview reports errors that would require modifying global tables, installing Store applications, or adding scope-external artifacts to resolve, stop and report — do not substitute.

## Recommended Verification Order

The seven gates SHOULD be exercised in the order listed below. The order is a hint to verifiers, not a contract: each gate's Pass Condition is independently authoritative, but running them in this sequence ensures that early failures (e.g., a missing dictionary field) surface before time is spent on later gates that depend on the schema being correct. Re-running a later gate after fixing an earlier gate is expected.

1. **Gate 1 (Data model)** — foundational; nothing works without correct schema. Run first because Gates 2–6 all read from the three custom tables, and a missing field manifests as a broken downstream gate that is harder to diagnose than a missing dictionary entry.
2. **Gate 3 (ACLs)** — required for impersonation tests in later gates. Run before Gate 2 because Gate 2's Step 9 (non-manager attempts Resolved → Closed) needs role membership to be enforced correctly to produce the expected blocking error.
3. **Gate 2 (Workflow)** — depends on schema (Gate 1) and ACLs (Gate 3) being correct. The flows are filtered by case `type`, so both General Inquiry and Complaint must be exercised.
4. **Gate 4 (Portal submission)** — depends on schema (Gate 1) and the case table. Note: Gate 4 does NOT depend on Gate 3 because the portal endpoint runs as a privileged user with a whitelisted field set; it is verifying a different access path than the impersonation tests.
5. **Gate 5 (Portal lookup)** — depends on Gate 4 having created at least one demo case via the portal so that there is a case number to look up. The "not found" case (`CASE9999999`) does not depend on Gate 4 succeeding, but the positive-path step does.
6. **Gate 6 (Dashboards)** — depends on synthetic seed data being committed (the demo cases, tasks, and parties), which means the seed script has run successfully and the demo cases are visible in the case list. Run after the workflow tests to ensure the seed-data status mix is intact (some Closed cases for `avg_time_to_close`, etc.).
7. **Gate 7 (Update Set)** — final integration gate; runs the entire Gates 1–6 suite on a fresh PDI to confirm the application is fully functional after a clean install. This gate is non-substitutable: a successful round-trip on a fresh PDI is the ultimate evidence of integrity.

If any gate fails, return to the corresponding source artifact, apply the fix, re-export the Update Set on the source PDI, and re-run the failed gate plus every subsequent gate to confirm no regression. Do NOT mark a later gate as passed if an earlier gate failed and was not re-verified.

## Definition of Done

The scoped application is delivered as Done when every Gate above passes AND every success criterion below holds. The bullet list reproduces AAP Section 0.7.2 (User Example — Success criteria) verbatim:

- Cases created, assigned, progressed through all defined states, and closed via both internal UI and external portal
- Tasks created, linked to cases, assigned, and closed — case resolution blocked until all linked tasks are closed
- People and Organizations associated to cases as typed parties
- ACLs enforced: `case_viewer` read-only, `case_agent` read/write on assigned cases, `case_manager` full access
- 2 dashboards operational: agent workspace and manager view
- Scoped application exported as a complete Update Set

In addition, every Gate's Pass Condition (column 3 of the Seven Gates table above) MUST hold on a fresh PDI after the Update Set has been re-imported and committed. The exported Update Set XML file path and the portal URL MUST be delivered as final artifacts alongside confirmation that all seven validation gates passed (see [`deployment.md`](./deployment.md) Step 4: Deliver).

## Cross-References

The documents below are the design contracts that each Gate exercises. A verifier MUST consult the corresponding document to interpret a gate's verification procedure when ambiguity arises.

- [`data-model.md`](./data-model.md) — Gate 1 (the three-table schema with field/type/constraint matrices)
- [`state-machine.md`](./state-machine.md) — Gate 2 (the transition matrix and the four blocking-error messages)
- [`acl-matrix.md`](./acl-matrix.md) — Gate 3 (the role × table × CRUD matrix and the "Assigned only" definition)
- [`portal-pages.md`](./portal-pages.md) — Gates 4 and 5 (submission page fields, lookup page fields, "No case found with that number." text)
- [`dashboards.md`](./dashboards.md) — Gate 6 (Agent Workspace + Manager View widget inventory and report references)
- [`deployment.md`](./deployment.md) — Gate 7 (Export → Verify → Confirm → Deliver runbook)
- [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md) — manual procedure for Gate 7 (fresh-PDI re-import preview verification)
- [`../README.md`](../README.md) — overall POC overview and deliverable index
