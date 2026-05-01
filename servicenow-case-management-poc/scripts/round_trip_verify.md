# Round-Trip Verification Procedure

Manual verification gate for the Update Set fresh-PDI re-import (AAP Section 0.7.3, Gate 7)

## Purpose

This document captures the manual procedure an operator follows on a **fresh ServiceNow PDI** to verify that the exported scoped-application Update Set XML re-imports without preview errors. Per AAP Section 0.7.1, **zero preview errors** are required before the Update Set may be committed. This is the final integration gate (Gate 7) and blocks delivery if it fails. The operator should expect this procedure to take 20–45 minutes end-to-end (preview alone can take 1–5 minutes; commit another 1–3 minutes; post-commit re-verification of Gates 1–6 takes the remainder).

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

## Prerequisites

Before starting this procedure, all of the following MUST hold. If ANY prerequisite is missing, **stop and resolve it before proceeding** (AAP Section 0.7.2 Minimal-Change Clause: do not substitute out-of-scope workarounds).

- The exported Update Set XML exists at `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` (per AAP Section 0.4.1).
- On the **source PDI**, all of Validation Gates 1–6 have passed (per [`../docs/validation-gates.md`](../docs/validation-gates.md)).
- On the **source PDI**, both Flow Designer flows (`general_inquiry_state_machine` and `complaint_state_machine`) are **Active** (not Draft).
- On the **source PDI**, all 10+ demo cases are visible in the case list spanning all 6 statuses (Draft, Open, In Progress, Pending, Resolved, Closed) and both case types (General Inquiry, Complaint), per AAP Section 0.7.4 minimum demo-data thresholds.
- The seed data was committed via [`./seed_demo_data.js`](./seed_demo_data.js) and is captured in the same Update Set OR is packaged as a Fix Script in the Update Set so that seed data is generated on import. Document which approach was used so the verifier knows whether seed data is expected to appear automatically post-commit or whether the seed script must be re-run on the verification PDI after commit.
- A **fresh, separate PDI** is available with an admin account ready (the verification PDI must NOT be the same instance as the source PDI). Re-importing on the source PDI does not exercise the portability gate and is not a valid round-trip-verify.
- Admin login to the verification PDI succeeds (URL + admin username + admin password verified). Per AAP Section 0.7.2 Pre-build instance verification: if login fails, **stop and report — do not proceed**.
- Network connectivity allows the operator to upload an XML file of approximately 0.5–5 MB to the verification PDI without timeout.
- The operator has access to the source PDI for re-export in the event a preview error is discovered.

## Procedure Outline

The procedure has **four phases**. Each phase has a numbered checklist. Failure at any phase requires returning to the source PDI and re-exporting; do not attempt to patch the verification PDI directly.

1. **Upload** the Update Set XML to the verification PDI.
2. **Preview** the Update Set and verify zero errors.
3. **Commit** the Update Set after a clean preview.
4. **Re-verify** all six functional gates (Gates 1–6) on the verification PDI.

## Phase 1 — Upload the Update Set XML

- [ ] Log in to the **verification PDI** as `admin`. Confirm the home page loads.
- [ ] Navigate to **System Update Sets → Retrieved Update Sets** (left navigator search: "Retrieved Update Sets").
- [ ] In the Related Links panel at the top of the list, click **Import Update Set from XML**.
- [ ] On the import form, click **Choose File** and select `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` from the local filesystem.
- [ ] Click **Upload**. Wait for the upload to complete (typically a few seconds for an Update Set under 5 MB).
- [ ] Verify the page navigates to the imported Retrieved Update Set record.
- [ ] Confirm the record's **State** is **Loaded**.
- [ ] Confirm the record's **Application** field shows `x_casemgmt Case Management` (the scoped application name).
- [ ] Confirm the record's **Description** field is non-empty.

### Pass Criteria for Phase 1

- State = Loaded.
- Application name matches the scoped application (`x_casemgmt Case Management`).
- No upload error message displayed.

### If Phase 1 Fails

- **Upload-time error "Invalid XML"** → the XML file is corrupt; re-export from the source PDI.
- **Upload completes but State = Failed** → the XML references a missing parent record (e.g., scope record); verify the source Update Set captured `sys_app/x_casemgmt_case_management.xml` and `sys_scope/x_casemgmt.xml`.
- **Upload completes but Application field is empty** → the scope record was not captured; re-export from the source PDI with the scope record explicitly added to the Update Set.

## Phase 2 — Preview the Update Set

- [ ] On the Retrieved Update Set record, click **Preview Update Set** (top-right or Related Links).
- [ ] Wait for the preview to complete (1–5 minutes typically; longer for larger Update Sets).
- [ ] When preview completes, the page refreshes and shows a **Preview Problems** related list at the bottom.
- [ ] Inspect the Preview Problems related list:
    - Filter by Status field if needed.
    - Count rows where Status ≠ "Skipped" AND Severity is "Error".
- [ ] Confirm the count is **zero**.

### Pass Criteria for Phase 2

- **Zero rows** in the Preview Problems list with Severity = Error AND Status ≠ Skipped.
- Warning-only rows are acceptable IF they are platform-default warnings (e.g., "Found in update set but not in target") that do not block the commit.
- In doubt, treat any non-zero error count as **fail** and return to the source PDI.

### Common Preview Problem Categories

The most frequent failure mode in this gate is **hard-coded `sys_id` references** that do not resolve on a fresh PDI. Per AAP Section 0.7.1, NO `sys_id` literals are permitted anywhere in the Update Set. Search every flow, ACL, business rule, script include, and seed record for literal hex `sys_id` values (32-character hexadecimal) and replace with `GlideRecord` lookups by the appropriate human-readable key. The reference resolution rules per AAP Section 0.5.2 are:

- User references → `sys_user.user_name`
- Group references → `sys_user_group.name`
- Role references → `sys_user_role.name`
- Company references → `core_company.name`
- Case references → `x_casemgmt_case.number`
- Role-label references → `x_casemgmt_case_party.role_label`

| Symptom (Preview Problem text) | Likely Cause | Remediation |
| --- | --- | --- |
| `"Could not find a record in <table> for ..."` | A reference field in a flow / ACL / seed record points at a sys_id that exists on the source PDI but not on the verification PDI. | Open the offending source record on the source PDI; replace the sys_id reference with a `GlideRecord` lookup by `name` / `user_name` / `number` / `role_label` (per AAP Section 0.5.2 reference resolution rules); re-export. |
| `"Found in update set but missing in target"` | A child artifact (subflow, choice list, dictionary entry) was referenced by another artifact but was not itself captured in the Update Set. | On the source PDI, open the Update Set's Customer Updates list; verify the missing artifact's table appears; if not, manually add the artifact to the Update Set and re-export. |
| `"Has been changed by ... in the target instance"` | A global-scope record was modified, violating the "no global-scope writes" constraint (AAP Section 0.7.1). | Identify the global record on the source PDI and revert the change; the scoped application MUST live entirely in `x_casemgmt` namespace. |
| `"Skipped — newer version in target"` | The verification PDI already had this record (e.g., a re-run of the same Update Set). | Acceptable on re-runs; reset the verification PDI for a clean test if rigor is required. |
| `"Choices missing for field ..."` | A `sys_choice` record was not captured in the Update Set. | On the source PDI, add the missing choice record to the Update Set via the Customer Updates list; re-export. |
| `"Cannot find application ..."` | The `sys_app/x_casemgmt_case_management.xml` record was not the first record in the Update Set. | Verify the scope record is present and correctly identified; the scope record MUST come before all other records (per AAP Section 0.5.2 dependency-ordering). |

### If Phase 2 Fails

1. Capture screenshots of the Preview Problems list for the build agent's record.
2. Identify the underlying cause for each error using the table above.
3. Return to the **source PDI** (NOT the verification PDI).
4. Fix the offending source record(s) per the remediation column.
5. Re-export the Update Set XML to the same path: `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`.
6. Restart this procedure from Phase 1.

Per AAP Section 0.7.2 (User Example — Deployment steps, Step 2): "If preview errors exist, resolve them in the source application before re-exporting."

## Phase 3 — Commit the Update Set

Only proceed if Phase 2 completed with zero preview errors. Committing applies all changes to the verification PDI permanently (subject to the standard back-out procedure documented in [`../docs/deployment.md`](../docs/deployment.md) Rollback Procedure).

- [ ] On the Retrieved Update Set record, click **Commit Update Set** (top-right).
- [ ] Confirm the prompt and click **OK**.
- [ ] Wait for commit to complete (1–3 minutes typically).
- [ ] When commit completes, verify the **State** field shows **Committed**.
- [ ] Confirm no commit-time errors appear (the platform shows a banner if any error occurred during the commit phase).

### Pass Criteria for Phase 3

- State = Committed.
- No commit-time error banner displayed.

### If Phase 3 Fails

- Commit-time errors are usually database-constraint violations or scoped-app initialization issues.
- Use the **Back out** action on the Retrieved Update Set record to reverse the commit.
- Return to the source PDI to investigate; this typically indicates a deeper integrity issue not caught by preview.

## Phase 4 — Re-Verify Gates 1–6 on the Verification PDI

The Update Set is committed but not yet **delivered**. The final step is to re-run each functional gate on the verification PDI to confirm the application behaves identically to the source PDI. This catches any subtle deployment differences (missing seed data, broken references, role assignment gaps).

If the seed data was packaged as a Fix Script inside the Update Set, the Fix Script will have already executed during commit and the demo cases/tasks/parties/users/groups should already be present. If the seed data was NOT packaged into the Update Set, run [`./seed_demo_data.js`](./seed_demo_data.js) on the verification PDI as a Background Script before proceeding with the gate re-verification below.

### Gate 1 — Data Model (Re-Verify)

- [ ] Open **System Definition → Tables**. Filter `Name CONTAINS x_casemgmt_case`.
- [ ] Confirm exactly 3 records: `x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`.
- [ ] Open each table and confirm the field set matches [`../docs/data-model.md`](../docs/data-model.md) — `x_casemgmt_case` has 14 fields (12 user-prompt-specified + `pending_reason` + virtual `duration_to_close` Function Field), `x_casemgmt_case_task` has 6, `x_casemgmt_case_party` has 5 — 25 fields total.
- [ ] Confirm `x_casemgmt_case.number` auto-numbering format is `CASE0000001` and the field is Read-only.
- [ ] Confirm reference targets resolve correctly: `assigned_group → sys_user_group`, `assigned_agent → sys_user`, `case_task.case → x_casemgmt_case`, `case_task.assigned_to → sys_user`, `case_party.case → x_casemgmt_case`, `case_party.person → sys_user`, `case_party.organization → core_company`.

### Gate 2 — Workflow (Re-Verify)

- [ ] Open **Flow Designer**. Filter by application `x_casemgmt Case Management`.
- [ ] Confirm both flows are **Active** (not Draft): `general_inquiry_state_machine` and `complaint_state_machine`.
- [ ] As `x_casemgmt_demo_manager`, perform an end-to-end transition test on a General Inquiry case (Draft → Open → In Progress → Resolved → Closed).
- [ ] Verify each invalid transition raises the correct verbatim error per [`../docs/state-machine.md`](../docs/state-machine.md):
    - In Progress → Resolved with open child task: `"All tasks must be closed before resolving this case."`
    - Any → Draft from non-Draft: `"Cases cannot be returned to Draft."`
    - Any update on Closed case: `"Closed cases are terminal and cannot be modified."`
- [ ] Repeat the test on a Complaint case to confirm both flows enforce identical rules.
- [ ] Confirm Pending lifecycle: In Progress → Pending sets `pending_reason`; Pending → In Progress clears `pending_reason`.

### Gate 3 — ACLs (Re-Verify)

- [ ] Impersonate `x_casemgmt_demo_viewer`. Open the case list. Confirm read-only behavior on case forms (no Save button or all fields disabled).
- [ ] Impersonate `x_casemgmt_demo_agent`. Confirm only assigned cases are visible (per [`../docs/acl-matrix.md`](../docs/acl-matrix.md) "Assigned only" rule: `assigned_agent = current user OR assigned_group contains current user`).
- [ ] Impersonate `x_casemgmt_demo_manager`. Confirm full create/read/write/delete on all three tables.
- [ ] Confirm field-level ACLs on `assigned_group` (manager-only write) and `assigned_agent` (manager + assigned agent write).
- [ ] Confirm parallel ACLs on `x_casemgmt_case_task` and `x_casemgmt_case_party` follow the same role × CRUD matrix.

### Gate 4 — Portal Submission (Re-Verify)

- [ ] Log out of the PDI. Open the portal URL `[verification instance URL]/x_casemgmt_case_portal` in an incognito browser window. The slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml); AAP Section 0.7.2 verbatim wording uses the generic placeholder `x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time"). See [`../docs/portal-pages.md`](../docs/portal-pages.md) for the full discrepancy explanation.
- [ ] Submit a case via the submission page with synthetic values (subject, type=General Inquiry, description, requester_name, requester_email).
- [ ] Confirm the confirmation panel displays the auto-generated case number in `CASE0000001` format.
- [ ] Log in as `x_casemgmt_demo_manager`. Open the case list. Find the new case by number.
- [ ] Confirm `status = Draft`, `subject` and `requester_name` match submitted values, `opened_date` is auto-set, and `assigned_group` / `assigned_agent` / `closed_date` are empty.

### Gate 5 — Portal Lookup (Re-Verify)

- [ ] Log out. Open the portal lookup page in an incognito browser window.
- [ ] Enter the case number from the Gate 4 test. Confirm the result panel shows ONLY: `number`, `status`, `subject`, `opened_date`.
- [ ] Confirm NO internal fields are exposed (no `description`, no `priority`, no `closed_date`, no `assigned_*`, no `requester_*`, no `pending_reason`, no `sys_*` audit fields) per [`../docs/portal-pages.md`](../docs/portal-pages.md).
- [ ] Enter an invalid case number `CASE9999999`. Confirm the literal text `"No case found with that number."` (verbatim) is displayed.

### Gate 6 — Dashboards (Re-Verify)

- [ ] Impersonate `x_casemgmt_demo_agent`. Navigate to **Performance Analytics → Dashboards → Agent Workspace**.
- [ ] Confirm all 3 widgets render with synthetic data: My Open Cases (list), My Overdue Tasks (list), Case Count by Status (donut). See [`../docs/dashboards.md`](../docs/dashboards.md).
- [ ] Click each list-row and chart-slice to confirm drill-through navigation works.
- [ ] Impersonate `x_casemgmt_demo_manager`. Open the **Manager View** dashboard.
- [ ] Confirm all 5 widgets render: All Cases by Status (bar), All Cases by Type (donut), All Cases by Priority (bar), Average Time to Close (single-score), Cases Opened (Last 30 Days) (single-score).
- [ ] Confirm no widget shows "Report not found" or 500 error.

### Gate 7 — Update Set Final Confirmation

- [ ] Open the Retrieved Update Set record on the verification PDI. Confirm State = Committed.
- [ ] Open **System Update Sets → Retrieved Update Sets** list. Confirm the record is the most recently committed one.
- [ ] Confirm the original Update Set XML file at `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` is unchanged (the verification did not modify the source artifact).

## Pass / Fail Decision

### Pass Criteria (All Must Hold)

1. Phase 1 — State = Loaded.
2. Phase 2 — Zero preview errors.
3. Phase 3 — State = Committed.
4. Phase 4 — All six functional gates re-verified on the verification PDI.

### Fail Criteria (Any One Triggers Fail)

1. Any error in Phase 1 upload.
2. ANY non-zero error count in Phase 2 preview.
3. Any error in Phase 3 commit.
4. ANY of Gates 1–6 fails to re-verify on the verification PDI.

### On Fail

1. **Stop**. Do not attempt to patch the verification PDI.
2. Capture screenshots of the failure point for the build agent's record.
3. Return to the **source PDI**.
4. Identify and resolve the underlying issue per the remediation guidance in this document.
5. Re-export the Update Set XML.
6. Restart this procedure from Phase 1.
7. Per AAP Section 0.7.2, **if a capability gap exists that the PDI cannot address, stop and report rather than substitute an out-of-scope workaround.**

## Constraints

- **Round-trip-verify is non-negotiable.** Zero preview errors required before commit.
- **Two PDI rule.** The source PDI and the verification PDI MUST be different instances. Re-importing on the source PDI is not a valid round-trip-verify.
- **No hard-coded `sys_id`s.** The most common cause of preview failures is `sys_id` literals that resolve on the source PDI but not the verification PDI. Every cross-reference in the Update Set MUST resolve via `GlideRecord` lookup by a stable human-readable key (`name`, `user_name`, `number`, `role_label`).
- **Scoped-namespace exclusivity.** All artifacts MUST be in the `x_casemgmt` scope. Global-scope writes will trigger commit-time integrity violations and are prohibited per AAP Section 0.3.2.
- **Email-disabled.** Even though email is disabled on PDIs, the Update Set MUST NOT include any SMTP / notification rule / email template configuration.
- **No Store dependencies.** The verification PDI must be a clean PDI with no extra Store apps installed; if the Update Set required a Store app to commit, that is an out-of-scope workaround and is rejected.
- **No PII.** All synthetic test submissions made during Phase 4 Gate 4 MUST use fabricated synthetic values. Do not enter real names, email addresses, phone numbers, or organization names.
- **Non-destructive on success.** This procedure does not modify the source PDI. The verification PDI is intended to be discarded after verification; the source PDI's Update Set XML at `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` is the canonical deliverable.

## Cross-References

- [`../docs/deployment.md`](../docs/deployment.md) — comprehensive four-step deployment walkthrough; this document is referenced in its Step 2 (Verify Update Set Integrity).
- [`../docs/validation-gates.md`](../docs/validation-gates.md) — Gate 7 (Update Set) detailed verification procedure.
- [`../docs/data-model.md`](../docs/data-model.md) — Gate 1 re-verify reference (the three-table schema verbatim).
- [`../docs/state-machine.md`](../docs/state-machine.md) — Gate 2 re-verify reference (verbatim error messages).
- [`../docs/acl-matrix.md`](../docs/acl-matrix.md) — Gate 3 re-verify reference (role × table × CRUD matrix).
- [`../docs/portal-pages.md`](../docs/portal-pages.md) — Gates 4 and 5 re-verify reference (verbatim "not found" text).
- [`../docs/dashboards.md`](../docs/dashboards.md) — Gate 6 re-verify reference (widget inventory for both dashboards).
- [`./seed_demo_data.js`](./seed_demo_data.js) — idempotent server-side seed script that must run on the verification PDI if seed data was not captured in the Update Set itself.
- [`../update-set/`](../update-set/) — destination directory for the exported XML deliverable.
- [`../README.md`](../README.md) — overall POC overview and entry point.
