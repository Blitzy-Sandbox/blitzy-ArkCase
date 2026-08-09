# Deployment

## Purpose

This document captures the four-step deployment procedure for the ServiceNow scoped application POC, mapped 1:1 to Validation Gate 7 (Update Set integrity) defined in [`validation-gates.md`](./validation-gates.md). It is non-negotiable: every step MUST complete cleanly before delivery, and the Update Set XML MUST re-import on a fresh PDI with zero preview errors. The four steps — Export, Verify, Confirm, Deliver — are preserved verbatim from AAP Section 0.7.2 (User Example — Deployment steps) and are reproduced as quoted text within each section below so that any human operator (or future build agent) can execute the deployment using only this document plus the cross-referenced manual round-trip-verify procedure.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

> **Status of the zero-preview-error requirement stated above.** It has been met on the 913-block,
> **3,618,378-byte**, SHA-256
> `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e` revision. The bytes that ship today are
> 913 blocks, **3,643,389 bytes**, SHA-256 `89638c17…` — the same file with 9 payloads re-synced by the
> QA-remediation pass, measured preview-neutral against the revision below by a matched A/B preview (identical
> problem signatures, 0 descriptions present in one and not the other). This procedure was run end to
> end: **41** preview problems against an already-populated instance, **298** on the first pass after a proven
> teardown (all `Found a local update that is newer than this one` — the teardown's own deletions captured as
> local updates), and **0 problems of any type** once that local capture was purged at source, confirmed through
> the platform's own `unresolvedProblems=false` predicate, then committed to `state=committed`. An earlier
> 916-block revision (3,448,009 bytes, SHA-256 `32a064d6…`) reached the same zero result and is retained as
> history in [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.10](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md); §0.3 of that
> document is the current record. **Verify the digest before you upload, so you know which artifact you are
> testing** — and note that a bare commit is not sufficient on its own: the §9.5 install sequence below is
> mandatory, because the commit creates the table metadata without physical storage.

## Pre-Deployment Checklist

The following prerequisites MUST hold before starting the export step. They align with AAP Section 0.7.2 (Pre-build instance verification) and Section 0.7.1 (Round-trip-verify rule). If any item below is unchecked, do NOT proceed — resolve the underlying issue first, then re-run this checklist.

- Source PDI is accessible and admin login succeeds at `[instance URL]`. If login fails, stop and report — do not proceed.
- Validation Gates 1–6 have all passed on the source PDI (see [`validation-gates.md`](./validation-gates.md)).
- All seed data has been committed via the seed script in [`../scripts/seed_demo_data.js`](../scripts/seed_demo_data.js) and is visible in the case list. At minimum: 10 demo cases spanning all 6 statuses (Draft, Open, In Progress, Pending, Resolved, Closed) and both case types (General Inquiry, Complaint), 3 demo users (one per role), 1 demo group, and an open + closed task mix on selected demo cases.
- All 7 Flow Designer flows are **Active** *and* **Published** (not Draft) — the 2 parent flows `general_inquiry_state_machine` and `complaint_state_machine` and the 5 `validate_*_transition` subflows. Confirm both columns: a flow that is active but unpublished does not enforce. Equally important, confirm the before-update Business Rule **`x_casemgmt_enforce_forward_transitions` (order 250)** is present and active — it is what converts a subflow's refusal into a blocking form error, and without it the flows run but nothing blocks.
- Both dashboards (Agent Workspace, Manager View) render with synthetic data, with no broken report references. **This item cannot be checked on the verification instance and is a known failure.** Both `pa_dashboards` records commit and open, but each renders **0 tabs and 0 widgets** with the platform's empty state, "Add widgets using the widget picker." Each composite block names **three child tables that do not exist on this release** — `pa_tab` (real name `pa_tabs`), `pa_dashboard_widgets` (`pa_widgets`) and `pa_dashboard_role` — so the tab, all 8 widget placements and the role grants are dropped on commit. Renaming one element is **not** sufficient; supplying a tab was tested and the dashboards stayed blank. Separately, all 8 `sys_report` records commit with an **empty `group_by`** although the artifacts specify one, so the charts would not aggregate as designed even once placed. See [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.5 and §0.6](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).
- Portal submission and lookup behave correctly on the source PDI. **On the verification instance this holds at the REST layer only, and the two portal pages render blank** (the page API returns `containers: []`; their Service Portal layout records were never authored). Verify the contract with the endpoints directly: anonymous `POST /api/x_casemgmt/case_submit` returns **201** with an auto-generated number in `CASE0000001` format, `GET /api/x_casemgmt/case_status_lookup?number=<valid>` returns exactly `status` / `subject` / `opened_date`, and an unknown number returns **404** with the verbatim text `No case found with that number.`
- No hard-coded `sys_id` literals exist in any Update Set artifact. Search via Studio → Find: regex `[a-f0-9]{32}` across the scoped application; zero matches inside flow scripts, ACL conditions, business rules, script includes, scripted REST handlers, UI policies, UI actions, and seed records.
- All artifacts are in scope `x_casemgmt`, with **exactly one disclosed and approved exception** — the installer Fix Script `x_casemgmt Post-Import Remediation`, which is authored **global** because the `GlideTableDescriptor` and `GlideSecurityManager` calls it needs are refused in scoped execution. See the Rules Compliance note at the end of this document for the full rationale. Verify by filtering `sys_app=x_casemgmt Case Management` on every record type listed in the [Step 1](#step-1-export-the-update-set) artifact inventory; the Fix Script is the only record expected to differ, and global tables must show **data** inserts only, never schema changes.
- The current Update Set (top-right Update Set picker) is the scoped application Update Set, not the Default or another in-flight set. All in-progress edits since the last export must be on this Update Set.
- The browser is signed in as an admin user on the source PDI, with permission to mark Update Sets Complete and to export them.

## Step 1: Export the Update Set

Per AAP Section 0.7.2: "Navigate to System Update Sets → Local Update Sets. Locate the scoped application Update Set. Set status to Complete. Export as XML."

### Detailed Sub-Procedure

1. On the source PDI, navigate to **System Update Sets** → **Local Update Sets**.
2. Locate the Update Set whose application matches the scoped application (filter `Application = x_casemgmt Case Management`). If multiple Update Sets exist for this application, identify the one containing every artifact enumerated below — there should be exactly one.
3. Confirm the Update Set contains the expected artifacts. The inventory below mirrors the directory layout in AAP Section 0.4.1 and the file-by-file transformation map in AAP Section 0.5.1. A missing artifact at this stage means the export will fail Step 2 (preview).

   - **1 sys_app record** — `app/sys_app/x_casemgmt_case_management.xml`. There is deliberately **no standalone `sys_scope` artifact**: the platform derives the `sys_scope` row from the application record on commit, so shipping one would duplicate it. Earlier revisions of this inventory listed "1 sys_app + 1 sys_scope"; that artifact was removed.
   - **3 sys_db_object table records** — `x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`.
   - **All sys_dictionary records for the 25 fields total (14 + 6 + 5)** — covering every field on every custom table per [`data-model.md`](./data-model.md). The case table contributes 12 user-prompt fields plus a `pending_reason` choice field plus a `duration_to_close` virtual Function Field (14 total); the case_task table contributes 6 fields; the case_party table contributes 5 fields.
   - **All sys_choice records for every Choice field** — `case.type`, `case.status`, `case.priority`, `case.pending_reason`, `case_task.type`, `case_task.status`, `case_party.party_type`.
   - **3 sys_user_role records** — `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`.
   - **All sys_security_acl records** — one per role × table × CRUD combination plus field-level ACLs on `assigned_group` and `assigned_agent` and parallel ACLs on `case_task` and `case_party`. See [`acl-matrix.md`](./acl-matrix.md) for the full inventory.
   - **7 sys_hub_flow records** — the 2 parent flows `general_inquiry_state_machine` and `complaint_state_machine`, plus the 5 subflows `validate_open_transition`, `validate_inprogress_transition`, `validate_pending_transition`, `validate_resolved_transition`, `validate_closed_transition` under `flows/sub_flows/`. (Note: the fourth subflow's **instance** internal name is `validate_in_progress_transition`, with underscores, while the repository file is `validate_inprogress_transition.xml`.)
   - **1 Custom Action + 1 shared flow logic block** — `flows/custom_actions/x_casemgmt_transition_guard_action.xml` (`sys_hub_action_type_base`), which returns the transition verdict to a flow, and `flows/sub_flows/shared_flow_logic_block.xml` (`sys_hub_flow_block`), the shared logic block the five subflows reuse.
   - **2 Script Includes** — `x_casemgmt_CaseTransitionValidator` and `x_casemgmt_CasePortalService`.
   - **7 Business Rules**, in execution order — `block_terminal_closed` (100, before-update), `set_opened_date` (100, before-insert), `block_draft_backtransition` (200), **`enforce_forward_transitions` (250)**, `validate_assigned_agent_membership` (300, insert + update), `clear_pending_reason_on_inprogress` (400), `set_closed_date` (500). The order-250 rule is the one that invokes the transition subflow and turns its verdict into a blocking form error; the order-500 rule is the only writer of `closed_date`. Earlier revisions of this inventory listed six and omitted `enforce_forward_transitions`.
   - **6 UI Actions** — the state-transition buttons under `ui_action/`.
   - **1 Fix Script** — `x_casemgmt Post-Import Remediation`, carrying the post-import remediation body verbatim. It is authored **global** by design (see the note in Step 2) and **does not execute by itself**.
   - **761 ATF records** — 20 test definitions, 180 test steps, 540 step inputs (539 `sys_variable_value` + 1 variable value), 1 test suite and 20 suite-member links. This is by far the largest part of the package: 761 of its 913 blocks.
   - **1 UI Policy** — `case_party_conditional_fields` (shows `person` when `party_type=Person`; shows `organization` when `party_type=Organization`).
   - **1 sp_portal record + 2 pages + 3 widgets + 2 sys_ws_definition records** — the Experience Portal record, the case-submit and case-status pages, the submission/lookup/confirmation widgets, and the two scripted REST endpoints (`/api/x_casemgmt/case_submit`, `/api/x_casemgmt/case_status_lookup`).
   - **2 pa_dashboards records + 8 sys_report records** — Agent Workspace, Manager View, plus the eight reports enumerated in [`dashboards.md`](./dashboards.md).
   - **All seed data records** — under the scoped tables (`x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`) plus role-to-user assignments. User and group references resolve by `user_name` and `name` lookup respectively (no `sys_id` literals).

4. Set the Update Set state to **Complete**. The simplest path is the top-right Update Set picker → **Complete**, which prompts for confirmation; click **OK**. Once Complete, no further changes can be added to this Update Set without back-out.
5. Click **Export to XML** on the Update Set form (Related Links panel). The browser will download a single XML file. Save the resulting file to `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`. This is the canonical deliverable file path defined by AAP Sections 0.3.1 and 0.4.1; do not save under any other name or location.

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
  - Case references → `x_casemgmt_case.number`
  - Role-label references → `x_casemgmt_case_party.role_label`
  Re-export the Update Set after the source-side fix and restart Step 2.
- **"Found in update set but missing"** — a referenced artifact was not captured in the Update Set. Verify the Update Set scope is `x_casemgmt` and that the missing record is included in the source Update Set's collected records. The cause is usually that a record was edited under the Default Update Set rather than under the scoped application Update Set, or that the referenced record lives outside the scoped application (which would be an out-of-scope global-scope write — investigate and remove). Re-export the Update Set after the fix and restart Step 2.
- **"Has been changed by..."** — there is a global-scope conflict. The Update Set attempts to modify a record that is also being modified by a record outside the scoped application. Verify no global-scope writes exist in the Update Set per AAP Section 0.3.2 ("Global scope changes of any kind"). The remediation is to remove the conflicting modifications from the Update Set on the source PDI; if the conflict is intrinsic to the scoped-app design, the design has violated the scoped-namespace exclusivity rule and must be reworked.
- **"Skip"** rows in the preview — these are not errors but indicate the destination already has a newer version of the record. For a fresh PDI verification, every row should be **Insert** or **Update**, not **Skip**. If skips appear on a fresh PDI, the destination is not actually fresh — start over with a clean PDI.

For the comprehensive manual round-trip verification procedure, see [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md).

## Step 3: Confirm Deployed State

Per AAP Section 0.7.2: "After successful preview, commit the Update Set. Verify the following are present and functional post-commit: all 3 custom tables visible in App Engine Studio; Both Flow Designer flows active (not draft); Experience Portal accessible at `[instance URL]/x_casemgmt_portal` (or equivalent portal URL); Both dashboards accessible to users with correct roles; Synthetic demo data visible in case list."

> **This walkthrough is the deliverable's idealized path and a commit alone does not reach it.** A clean-instance
> round trip established that after commit the three tables exist as metadata with **no physical storage**, the
> 26 ACLs have **0 of 27** role links, the dashboards' child records do not commit, and the portal pages render
> blank.
>
> **Nothing in the current package fires on its own.** It contains **no auto-execute record of any kind** — no
> Business Rule, no scheduled job, no trigger. The remediation body ships as the Fix Script `x_casemgmt
> Post-Import Remediation`, and a Fix Script does not self-run; running it from the Fix Script UI executes it in
> the application scope and fails. An earlier revision did ship an auto-execute Business Rule, and it was
> measured firing and then failing (121 errors, all `GlideTableDescriptor`/`GlideSecurityManager is not allowed
> in scoped applications`) because the commit engine rewrites the dispatched record's scope; it has been removed,
> also because its condition matched the commit of *any* retrieved Update Set. **An operator must run the
> remediation by hand, in scope Global.**
>
> Use [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) — its seven-step primary
> procedure — as the authoritative install procedure, with
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.5](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) for the per-defect
> evidence, and treat the sub-steps below as the verification checklist to run *afterwards*. Note also that the
> install requires the Update Set to be committed a **second** time, because rebuilding the tables cascades the
> ACLs away.
>
> **Three of the sub-steps below cannot pass on the verification instance, and that is expected:** step 5 (the
> portal pages render blank — use the REST endpoints instead, steps 6-8 in `curl` form), steps 9-10 (both
> dashboards render 0 tabs and 0 widgets), and the related-lists clause of step 11 (no `sys_ui_related_list` row
> exists for the scope, and the form's related-lists wrapper measures 0 pixels tall). Each is a packaging defect
> recorded in `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.5-§0.6, not something a different install sequence
> fixes.

### Detailed Sub-Procedure

1. Click **Commit Update Set**. Wait for commit to complete. Commit can take 1–3 minutes; do not navigate away from the page until commit completes successfully.
2. Open **App Engine Studio** (Now Platform → All → App Engine Studio). Confirm the scoped application appears in the Apps list. Open the application and confirm 3 tables are listed:
   - `x_casemgmt_case`
   - `x_casemgmt_case_task`
   - `x_casemgmt_case_party`
3. Open **Flow Designer** (Now Platform → All → Process Automation → Flow Designer). Filter by **application `x_casemgmt Case Management`** — filtering by a name pattern such as `x_casemgmt_*state_machine` matches nothing, because flow names carry no scope prefix. Confirm both parent flows are **Active** *and* **Published** (not Draft):
   - `general_inquiry_state_machine`
   - `complaint_state_machine`
   All five subflows must also be Active and Published: `validate_open_transition`, `validate_in_progress_transition`, `validate_pending_transition`, `validate_resolved_transition`, `validate_closed_transition`. Then confirm the before-update Business Rule **`x_casemgmt_enforce_forward_transitions` (order 250)** is present and active — the flows decide, but that rule is what blocks the write and puts the message on the form.
4. Open the Experience Portal at `[instance URL]/x_casemgmt_case_portal`. The slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml); the AAP verbatim wording quoted in the section above uses the generic placeholder `x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time"). Open the URL in a private/incognito browser window so that no admin session interferes — both pages must work anonymously.
5. Confirm both pages render anonymously:
   - The case submission page (5 input fields: subject, type, description, requester_name, requester_email).
   - The case status lookup page (1 input field: case number).
6. Submit a test case via the submission page. Use synthetic input only (no real names, no real email addresses). Confirm the auto-generated case number is returned in `CASE0000001` format on the confirmation panel.
7. Look up the test case via the status lookup page using the case number returned in step 6. Confirm `status`, `subject`, `opened_date` are returned, and that no internal fields (`assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email`) are exposed.
8. Test the "not found" path with case number `CASE9999999`. Confirm the literal text `"No case found with that number."` (verbatim) appears.
9. Log in as `x_casemgmt_demo_agent`. Open Performance Analytics → Dashboards → **Agent Workspace**. Confirm all 3 widgets render with synthetic data:
   - My Open Cases (list)
   - My Overdue Tasks (list)
   - Case Count by Status (donut)
10. Log in as `x_casemgmt_demo_manager`. Open the **Manager View** dashboard. Confirm all 5 widgets render:
    - All Cases by Status (bar)
    - All Cases by Type (donut)
    - All Cases by Priority (bar)
    - Average Time to Close (single-score)
    - Cases Opened in Last 30 Days (single-score)
11. Open the case list (`x_casemgmt_case.list`). Confirm at least 10 demo cases are visible spanning all 6 statuses (Draft, Open, In Progress, Pending, Resolved, Closed) and both case types (General Inquiry, Complaint). Open one demo case, scroll to Related Lists, and confirm the case_task and case_party related lists render with seed records.

If any of steps 2–11 fails, do not proceed to Step 4. Instead, follow the [Rollback Procedure](#rollback-procedure) below, address the underlying issue on the source PDI, and restart from Step 1.

## Step 4: Deliver

Per AAP Section 0.7.2: "Provide the exported Update Set XML file path and the portal URL as final deliverables alongside confirmation that all validation gates passed."

### Detailed Sub-Procedure

1. Confirm the exported XML file is at `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` (the canonical path from AAP Sections 0.3.1 and 0.4.1).
2. Note the actual portal URL (e.g., `https://devXXXXXX.service-now.com/x_casemgmt_case_portal`). The host portion is the actual PDI hostname assigned at PDI provisioning; the path portion is the portal URL chosen at portal-record creation time and matches the `<url_suffix>` value in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml). The AAP verbatim wording uses the generic placeholder `x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time").
3. Compile a delivery summary that includes:
   - **Update Set XML path:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`.
   - **Portal URL:** the actual `https://devXXXXXX.service-now.com/x_casemgmt_case_portal` URL recorded in step 2.
   - **Validation gates:** confirmation that all 7 validation gates passed (see [`validation-gates.md`](./validation-gates.md)).
   - **Demo users:** the three demo users and their assigned roles:
     - `x_casemgmt_demo_manager` → `x_casemgmt_case_manager`
     - `x_casemgmt_demo_agent` → `x_casemgmt_case_agent`
     - `x_casemgmt_demo_viewer` → `x_casemgmt_case_viewer`
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
- **Scoped-namespace exclusivity** — every artifact lives in the auto-assigned `x_casemgmt` namespace; zero global-scope changes, with **one disclosed exception**: the Fix Script `x_casemgmt Post-Import Remediation` is authored global because it calls `GlideTableDescriptor` and `GlideSecurityManager`, which are refused in scoped execution. It is installer wiring, not application configuration, and the commit engine rewrites it into `x_casemgmt` regardless (see [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §9.4). The auto-execute Business Rule `x_casemgmt Post-Import Bootstrap` that once accompanied it has been **removed** from the package — it could not succeed, and its trigger condition was not confined to this application's Update Set. Apart from that one Fix Script, if a preview problem reveals a global-scope write, the design has violated the rule and must be reworked on the source PDI. Global tables receive **data** inserts only — never schema changes.
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
- [`../update-set/`](../update-set/) — destination directory for the exported XML; only one file (`x_casemgmt_case_management_update_set.xml`) lives here.
- [`../README.md`](../README.md) — overall POC overview with quick deployment summary; this file is the authoritative detailed walkthrough referenced from there.
- [`./data-model.md`](./data-model.md) — schema reference for the 25 fields verified in [Step 1](#step-1-export-the-update-set) sub-step 3.
- [`./state-machine.md`](./state-machine.md) — transition matrix and blocking-error messages exercised by the seed data in [Step 3](#step-3-confirm-deployed-state) sub-step 11.
- [`./acl-matrix.md`](./acl-matrix.md) — role × table × CRUD matrix verified by impersonating the three demo users in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
- [`./portal-pages.md`](./portal-pages.md) — wireframe-level specs for the submission and lookup pages exercised in [Step 3](#step-3-confirm-deployed-state) sub-steps 5–8.
- [`./dashboards.md`](./dashboards.md) — widget inventory for both dashboards verified in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
