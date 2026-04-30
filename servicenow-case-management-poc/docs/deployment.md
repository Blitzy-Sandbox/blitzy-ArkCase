# Deployment

## Purpose

This document captures the four-step deployment procedure for the ServiceNow scoped application POC, mapped 1:1 to Validation Gate 7 (Update Set integrity) defined in [`validation-gates.md`](./validation-gates.md). It is non-negotiable: every step MUST complete cleanly before delivery, and the Update Set XML MUST re-import on a fresh PDI with zero preview errors. The four steps — Export, Verify, Confirm, Deliver — are preserved verbatim from AAP Section 0.7.2 (User Example — Deployment steps) and are reproduced as quoted text within each section below so that any human operator (or future build agent) can execute the deployment using only this document plus the cross-referenced manual round-trip-verify procedure.

The placeholder string `x_[scope]_` is preserved as written throughout this repository; the actual scope identifier is auto-assigned by the ServiceNow Personal Developer Instance (PDI) when the scoped application is created. No other token replaces this placeholder.

## Pre-Deployment Checklist

The following prerequisites MUST hold before starting the export step. They align with AAP Section 0.7.2 (Pre-build instance verification) and Section 0.7.1 (Round-trip-verify rule). If any item below is unchecked, do NOT proceed — resolve the underlying issue first, then re-run this checklist.

- Source PDI is accessible and admin login succeeds at `[instance URL]`. If login fails, stop and report — do not proceed.
- Validation Gates 1–6 have all passed on the source PDI (see [`validation-gates.md`](./validation-gates.md)).
- All seed data has been committed via the seed script in [`../scripts/seed_demo_data.js`](../scripts/seed_demo_data.js) and is visible in the case list. At minimum: 10 demo cases spanning all 6 statuses (Draft, Open, In Progress, Pending, Resolved, Closed) and both case types (General Inquiry, Complaint), 3 demo users (one per role), 1 demo group, and an open + closed task mix on selected demo cases.
- Both Flow Designer flows (`general_inquiry_state_machine` and `complaint_state_machine`) are **Active** (not Draft).
- Both dashboards (Agent Workspace, Manager View) render with synthetic data, with no broken report references.
- Portal pages submit + lookup correctly on the source PDI: the submission page returns an auto-generated case number in `CASE0000001` format; the lookup page returns `status`/`subject`/`opened_date` for valid case numbers and the verbatim text `"No case found with that number."` for invalid ones.
- No hard-coded `sys_id` literals exist in any Update Set artifact. Search via Studio → Find: regex `[a-f0-9]{32}` across the scoped application; zero matches inside flow scripts, ACL conditions, business rules, script includes, scripted REST handlers, UI policies, UI actions, and seed records.
- All artifacts are in scope `x_[scope]` (no global-scope writes). Verify by filtering `sys_app=x_[scope] Case Management` on every record type listed in the [Step 1](#step-1-export-the-update-set) artifact inventory.
- The current Update Set (top-right Update Set picker) is the scoped application Update Set, not the Default or another in-flight set. All in-progress edits since the last export must be on this Update Set.
- The browser is signed in as an admin user on the source PDI, with permission to mark Update Sets Complete and to export them.

## Step 1: Export the Update Set

Per AAP Section 0.7.2: "Navigate to System Update Sets → Local Update Sets. Locate the scoped application Update Set. Set status to Complete. Export as XML."

### Detailed Sub-Procedure

1. On the source PDI, navigate to **System Update Sets** → **Local Update Sets**.
2. Locate the Update Set whose application matches the scoped application (filter `Application = x_[scope] Case Management`). If multiple Update Sets exist for this application, identify the one containing every artifact enumerated below — there should be exactly one.
3. Confirm the Update Set contains the expected artifacts. The inventory below mirrors the directory layout in AAP Section 0.4.1 and the file-by-file transformation map in AAP Section 0.5.1. A missing artifact at this stage means the export will fail Step 2 (preview).

   - **1 sys_app + 1 sys_scope record** — the scoped-application metadata records.
   - **3 sys_db_object table records** — `x_[scope]_case`, `x_[scope]_case_task`, `x_[scope]_case_party`.
   - **All sys_dictionary records for the 23 fields total (12 + 6 + 5)** — covering every field on every custom table per [`data-model.md`](./data-model.md). The case table contributes 12 user-prompt fields plus a `pending_reason` choice field; the case_task table contributes 6 fields; the case_party table contributes 5 fields.
   - **All sys_choice records for every Choice field** — `case.type`, `case.status`, `case.priority`, `case.pending_reason`, `case_task.type`, `case_task.status`, `case_party.party_type`.
   - **3 sys_user_role records** — `x_[scope]_case_manager`, `x_[scope]_case_agent`, `x_[scope]_case_viewer`.
   - **All sys_security_acl records** — one per role × table × CRUD combination plus field-level ACLs on `assigned_group` and `assigned_agent` and parallel ACLs on `case_task` and `case_party`. See [`acl-matrix.md`](./acl-matrix.md) for the full inventory.
   - **2 sys_hub_flow records + their subflows** — `general_inquiry_state_machine`, `complaint_state_machine`, plus `validate_open_transition`, `validate_inprogress_transition`, `validate_pending_transition`, `validate_resolved_transition`, `validate_closed_transition` under `flows/sub_flows/`.
   - **2 Script Includes** — `x_[scope]_CaseTransitionValidator` and `x_[scope]_CasePortalService`.
   - **6 Business Rules** — `block_draft_backtransition`, `block_terminal_closed`, `set_opened_date`, `set_closed_date`, `validate_assigned_agent_membership`, `clear_pending_reason_on_inprogress`.
   - **1 UI Policy** — `case_party_conditional_fields` (shows `person` when `party_type=Person`; shows `organization` when `party_type=Organization`).
   - **1 sp_portal record + 2 pages + 3 widgets + 2 sys_ws_definition records** — the Experience Portal record, the case-submit and case-status pages, the submission/lookup/confirmation widgets, and the two scripted REST endpoints (`/api/x_[scope]/case_submit`, `/api/x_[scope]/case_status_lookup`).
   - **2 pa_dashboards records + 8 sys_report records** — Agent Workspace, Manager View, plus the eight reports enumerated in [`dashboards.md`](./dashboards.md).
   - **All seed data records** — under the scoped tables (`x_[scope]_case`, `x_[scope]_case_task`, `x_[scope]_case_party`) plus role-to-user assignments. User and group references resolve by `user_name` and `name` lookup respectively (no `sys_id` literals).

4. Set the Update Set state to **Complete**. The simplest path is the top-right Update Set picker → **Complete**, which prompts for confirmation; click **OK**. Once Complete, no further changes can be added to this Update Set without back-out.
5. Click **Export to XML** on the Update Set form (Related Links panel). The browser will download a single XML file. Save the resulting file to `servicenow-case-management-poc/update-set/x_[scope]_case_management_update_set.xml`. This is the canonical deliverable file path defined by AAP Sections 0.3.1 and 0.4.1; do not save under any other name or location.

### Notes

- The exported file MUST be the only Update Set XML in the [`../update-set/`](../update-set/) subdirectory. Do not include intermediate or partial exports — overwrite previous exports rather than versioning them in-place.
- If the export downloads multiple files (this can happen when the Update Set is unusually large), the export operation has split the artifact. This is a hard failure for this POC because the AAP requires a **single** Update Set deliverable. Resolve by reducing the Update Set scope to only the scoped application and re-exporting.

## Step 2: Verify Update Set Integrity

Per AAP Section 0.7.2: "Re-import the exported XML on the same instance via System Update Sets → Retrieved Update Sets → Upload. Preview the Update Set. Zero errors required before proceeding. If preview errors exist, resolve them in the source application before re-exporting."

### Detailed Sub-Procedure

1. Navigate to **System Update Sets** → **Retrieved Update Sets**.
2. Click **Import Update Set from XML** in the Related Links panel.
3. Upload the exported XML file from Step 1.
4. Open the imported record. State should be **Loaded**. If the state is anything else (e.g., **Failed to load**), open the Update Set log and resolve the underlying parse or schema issue on the source PDI, then restart from Step 1.
5. Click **Preview Update Set**. Wait for preview to complete; this can take 1–5 minutes depending on the size of the Update Set and the load on the PDI.
6. Examine the **Preview Problems** list:
   - Zero rows = pass. Proceed to Step 3.
   - One or more rows = **fail**. Do not commit. Resolve the underlying issue in the source application and restart from Step 1.

### Common Preview Problem Categories and Remediation

The remediation guidance below covers the most frequent preview-problem patterns observed when round-tripping a scoped application. The first category, **"Could not find a record"**, is by far the most common failure mode and accounts for the majority of preview-error reports.

- **"Could not find a record"** — typically caused by hard-coded `sys_id` references that do not exist on the destination instance. The source-application fix is to replace the literal `sys_id` with a `GlideRecord` lookup by a stable human-readable key per AAP Section 0.5.2 reference resolution rules. Lookup keys by record type:
  - User references → `sys_user.user_name`
  - Group references → `sys_user_group.name`
  - Role references → `sys_user_role.name`
  - Company references → `core_company.name`
  - Case references → `x_[scope]_case.number`
  - Role-label references → `x_[scope]_case_party.role_label`
  Re-export the Update Set after the source-side fix and restart Step 2.
- **"Found in update set but missing"** — a referenced artifact was not captured in the Update Set. Verify the Update Set scope is `x_[scope]` and that the missing record is included in the source Update Set's collected records. The cause is usually that a record was edited under the Default Update Set rather than under the scoped application Update Set, or that the referenced record lives outside the scoped application (which would be an out-of-scope global-scope write — investigate and remove). Re-export the Update Set after the fix and restart Step 2.
- **"Has been changed by..."** — there is a global-scope conflict. The Update Set attempts to modify a record that is also being modified by a record outside the scoped application. Verify no global-scope writes exist in the Update Set per AAP Section 0.3.2 ("Global scope changes of any kind"). The remediation is to remove the conflicting modifications from the Update Set on the source PDI; if the conflict is intrinsic to the scoped-app design, the design has violated the scoped-namespace exclusivity rule and must be reworked.
- **"Skip"** rows in the preview — these are not errors but indicate the destination already has a newer version of the record. For a fresh PDI verification, every row should be **Insert** or **Update**, not **Skip**. If skips appear on a fresh PDI, the destination is not actually fresh — start over with a clean PDI.

For the comprehensive manual round-trip verification procedure, see [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md).

## Step 3: Confirm Deployed State

Per AAP Section 0.7.2: "After successful preview, commit the Update Set. Verify the following are present and functional post-commit: all 3 custom tables visible in App Engine Studio; Both Flow Designer flows active (not draft); Experience Portal accessible at `[instance URL]/x_[scope]_portal` (or equivalent portal URL); Both dashboards accessible to users with correct roles; Synthetic demo data visible in case list."

### Detailed Sub-Procedure

1. Click **Commit Update Set**. Wait for commit to complete. Commit can take 1–3 minutes; do not navigate away from the page until commit completes successfully.
2. Open **App Engine Studio** (Now Platform → All → App Engine Studio). Confirm the scoped application appears in the Apps list. Open the application and confirm 3 tables are listed:
   - `x_[scope]_case`
   - `x_[scope]_case_task`
   - `x_[scope]_case_party`
3. Open **Flow Designer** (Now Platform → All → Process Automation → Flow Designer). Filter by application `x_[scope] Case Management`. Confirm both flows show **Active** state (not Draft):
   - `general_inquiry_state_machine`
   - `complaint_state_machine`
   Subflows under `flows/sub_flows/` should also be Active.
4. Open the Experience Portal at `[instance URL]/x_[scope]_portal` (or the equivalent portal URL chosen at portal-record creation time). Open the URL in a private/incognito browser window so that no admin session interferes — both pages must work anonymously.
5. Confirm both pages render anonymously:
   - The case submission page (5 input fields: subject, type, description, requester_name, requester_email).
   - The case status lookup page (1 input field: case number).
6. Submit a test case via the submission page. Use synthetic input only (no real names, no real email addresses). Confirm the auto-generated case number is returned in `CASE0000001` format on the confirmation panel.
7. Look up the test case via the status lookup page using the case number returned in step 6. Confirm `status`, `subject`, `opened_date` are returned, and that no internal fields (`assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email`) are exposed.
8. Test the "not found" path with case number `CASE9999999`. Confirm the literal text `"No case found with that number."` (verbatim) appears.
9. Log in as `x_[scope]_demo_agent`. Open Performance Analytics → Dashboards → **Agent Workspace**. Confirm all 3 widgets render with synthetic data:
   - My Open Cases (list)
   - My Overdue Tasks (list)
   - Case Count by Status (donut)
10. Log in as `x_[scope]_demo_manager`. Open the **Manager View** dashboard. Confirm all 5 widgets render:
    - All Cases by Status (bar)
    - All Cases by Type (donut)
    - All Cases by Priority (bar)
    - Average Time to Close (single-score)
    - Cases Opened in Last 30 Days (single-score)
11. Open the case list (`x_[scope]_case.list`). Confirm at least 10 demo cases are visible spanning all 6 statuses (Draft, Open, In Progress, Pending, Resolved, Closed) and both case types (General Inquiry, Complaint). Open one demo case, scroll to Related Lists, and confirm the case_task and case_party related lists render with seed records.

If any of steps 2–11 fails, do not proceed to Step 4. Instead, follow the [Rollback Procedure](#rollback-procedure) below, address the underlying issue on the source PDI, and restart from Step 1.

## Step 4: Deliver

Per AAP Section 0.7.2: "Provide the exported Update Set XML file path and the portal URL as final deliverables alongside confirmation that all validation gates passed."

### Detailed Sub-Procedure

1. Confirm the exported XML file is at `servicenow-case-management-poc/update-set/x_[scope]_case_management_update_set.xml` (the canonical path from AAP Sections 0.3.1 and 0.4.1).
2. Note the actual portal URL (e.g., `https://devXXXXXX.service-now.com/x_[scope]_portal`). The host portion is the actual PDI hostname assigned at PDI provisioning; the path portion is the portal URL chosen at portal-record creation time.
3. Compile a delivery summary that includes:
   - **Update Set XML path:** `servicenow-case-management-poc/update-set/x_[scope]_case_management_update_set.xml`.
   - **Portal URL:** the actual `https://devXXXXXX.service-now.com/x_[scope]_portal` URL recorded in step 2.
   - **Validation gates:** confirmation that all 7 validation gates passed (see [`validation-gates.md`](./validation-gates.md)).
   - **Demo users:** the three demo users and their assigned roles:
     - `x_[scope]_demo_manager` → `x_[scope]_case_manager`
     - `x_[scope]_demo_agent` → `x_[scope]_case_agent`
     - `x_[scope]_demo_viewer` → `x_[scope]_case_viewer`
   - **Sample case number:** at least one case number from the seed data (e.g., the case generated in [Step 3](#step-3-confirm-deployed-state) sub-step 6, or a known seed case from [`../seed-data/cases/`](../seed-data/cases/)).

This is the **final** deliverable. Per AAP Section 0.7.1, no additional artifacts beyond what is enumerated in AAP Section 0.3.1 are produced; per AAP Section 0.7.2 (Minimal-Change Clause), no additional capabilities are added.

## Rollback Procedure

If post-commit verification fails, the Update Set commit can be reversed using the platform's standard back-out procedure. Rollback is a recovery path, not a routine step — it should be invoked only when [Step 3](#step-3-confirm-deployed-state) sub-steps 2–11 reveal a failure that cannot be addressed without reverting the commit.

### Detailed Sub-Procedure

1. Navigate to **System Update Sets** → **Retrieved Update Sets**.
2. Open the committed Update Set record.
3. Click **Back out**. Confirm the action.
4. Wait for back-out completion. Like commit, back-out can take 1–3 minutes; do not navigate away from the page until completion.
5. Re-run the impacted validation gate(s) in [`validation-gates.md`](./validation-gates.md) to confirm the back-out is clean. At minimum, re-run Gate 1 (data model) and Gate 7 (Update Set integrity) — back-out should restore the destination PDI to a state where the scoped application's tables, ACLs, flows, and seed data are no longer present.
6. Resolve the underlying issue on the source PDI and restart from [Step 1](#step-1-export-the-update-set).

### Notes

- Back-out reverses the records introduced or modified by the committed Update Set. It does not delete subsequent edits made on the destination PDI after commit; those edits remain and may now reference records that no longer exist. To avoid orphaned references, do not edit scoped-application records on the verification PDI between commit and back-out.
- If back-out itself fails (e.g., due to dependent records added after commit), the cleanest recovery is to provision a fresh PDI and re-run the deployment from [Step 1](#step-1-export-the-update-set) on the new PDI, treating the original PDI as a corrupted target.

## Constraints & Reminders

The following constraints apply throughout deployment. They derive from AAP Sections 0.7.1 and 0.7.2 and are non-negotiable.

- **Single Update Set deliverable** — the scoped application MUST be exported as a SINGLE Update Set, not split across multiple. If the export operation produces multiple files, treat that as a hard failure and reduce the Update Set scope on the source PDI before re-exporting.
- **No hard-coded `sys_id`s** — every cross-reference is resolved by `GlideRecord` lookup against a stable human-readable key (`name`, `user_name`, `number`, `role_label`). The pre-deployment `[a-f0-9]{32}` regex sweep enforces this gate before export.
- **Scoped-namespace exclusivity** — every artifact lives in the auto-assigned `x_[scope]` namespace; zero global-scope changes. If a preview problem reveals a global-scope write, the design has violated the rule and must be reworked on the source PDI.
- **Email-disabled** — the build did NOT configure SMTP, notification rules, or email templates. Post-deploy SMTP testing is N/A; do not attempt to verify email delivery as part of [Step 3](#step-3-confirm-deployed-state).
- **Tooling restriction** — App Engine Studio + Flow Designer + UI Builder only; no Store app installs as part of deployment. Do not install any ServiceNow Store application during deployment, even if a preview problem appears to be solvable that way.
- **Repository minimality** — the deployment artifacts live exclusively under `servicenow-case-management-poc/`; the rest of the repository is unmodified. Do not modify, rename, or delete files outside this subdirectory under any circumstances during deployment.
- **No PII** — synthetic data only; no real names, email addresses, phone numbers, or organization names appear in the seed data, the test submissions made in [Step 3](#step-3-confirm-deployed-state), or any delivery artifact.
- **Minimal-Change Clause** — if a deployment problem can only be fixed by adding scope beyond the AAP, **stop and report** the specific gap. Do not substitute out-of-scope workarounds; do not add modules, workflows, portal pages, tables, or integrations beyond the defined scope.
- **Pre-build instance verification** — before starting [Step 1](#step-1-export-the-update-set), verify admin login succeeds at `[instance URL]`. If login fails, stop and report; do not proceed with deployment.

## Cross-References

- [`validation-gates.md`](./validation-gates.md) — Gate 7 (Update Set) is what this document operationalizes; the Pre-Deployment Checklist references Gates 1–6 as prerequisites.
- [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md) — manual procedure for the fresh-PDI re-import preview gate referenced by [Step 2](#step-2-verify-update-set-integrity).
- [`../scripts/seed_demo_data.js`](../scripts/seed_demo_data.js) — idempotent server-side seed script used for post-commit data verification in [Step 3](#step-3-confirm-deployed-state) sub-step 11.
- [`../update-set/`](../update-set/) — destination directory for the exported XML; only one file (`x_[scope]_case_management_update_set.xml`) lives here.
- [`../README.md`](../README.md) — overall POC overview with quick deployment summary; this file is the authoritative detailed walkthrough referenced from there.
- [`./data-model.md`](./data-model.md) — schema reference for the 23 fields verified in [Step 1](#step-1-export-the-update-set) sub-step 3.
- [`./state-machine.md`](./state-machine.md) — transition matrix and blocking-error messages exercised by the seed data in [Step 3](#step-3-confirm-deployed-state) sub-step 11.
- [`./acl-matrix.md`](./acl-matrix.md) — role × table × CRUD matrix verified by impersonating the three demo users in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
- [`./portal-pages.md`](./portal-pages.md) — wireframe-level specs for the submission and lookup pages exercised in [Step 3](#step-3-confirm-deployed-state) sub-steps 5–8.
- [`./dashboards.md`](./dashboards.md) — widget inventory for both dashboards verified in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
