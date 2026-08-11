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

## Measured Status

The table above is the frozen AAP criteria and is reproduced verbatim; it is deliberately left unaltered. The
table below is the **measured outcome** of those criteria on `https://dev379024.service-now.com` (Australia
Patch 3). Every entry is an observation, not an expectation. Where a gate's outcome depends on an operational
step, that is stated rather than folded into a pass.

**Read the evidence attribution carefully — the measurements come from three different runs, and they are not
interchangeable:**

- **The clean-instance round trip** ([`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md))
  established the install behaviour and the zero-preview-error result. It was run on the 913-block /
  3,618,378-byte / SHA-256 `7272edfc…` revision — **not on the bytes that ship today**, which is why the
  Update Set gate below is a conditional pass rather than an outright one. An earlier run of the same procedure
  on the **916-block `32a064d6…`** revision (3,448,009 bytes) is retained in §9.10 as history; the two are
  separate measurements and neither describes today's file.
- **The preview of the 925-block `e49a7654…` revision** is a third, separate measurement: that file uploaded as
  a fresh retrieved update set and previewed against an instance that already holds the schema and this
  application's change history. It yields **31 problems, all
  `Found a local update that is newer than this one`, and zero `Could not find a record` problems**. It does
  **not** include a teardown or a commit, so it cannot be cited as a clean-slate result.
- **On the bytes that ship — 926 blocks / 3,781,097 bytes / `7292a6fe…` — no preview has been run at all.** The
  delta from `e49a7654…` is 13 re-synced payloads (8 `sys_report`, 2 `Dashboard`, 3 `sp_widget`) and 1 added block
  (the case form's Related Lists definition). What was measured on the shipping bytes instead: every one of those
  14 records deployed live and read back field-for-field identical to its artifact, every table and column they
  name confirmed to exist in `sys_db_object` / `sys_dictionary`, all 926 payloads parsing, and the runtime outcome
  of each change verified in a browser. See
  [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3c](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).
- **Later verification runs on the committed application** produced the workflow, ACL, REST and ATF results.
  These were taken against the live application after remediation, not from the import.
- **Browser observation** produced the portal-page, dashboard and related-list results.

Each row below names which of the three it rests on.

| Gate | Measured status | Evidence |
| --- | --- | --- |
| Data model | ⚠️ **PASS only after remediation** | A clean commit yields table metadata with **no physical storage** (REST 403, zero `sys_choice` rows, inserts fail with `invalid table name`). After the §9.5 remediation: 3 physical tables (21/14/13 columns), 24 choice rows, all 7 choice lists rendering their exact option labels, and the three list views rendering as real data grids with zero banners and zero console errors. |
| Workflow | ✅ **PASS** | Two distinct pieces of evidence, deliberately kept apart. **(a) Breadth — the U1 enforcement pass:** all 13 transition-logic assertions covering every row of the AAP §0.5.5 matrix (both case types, both prohibited transitions, the task-closure gate, the date stamping, the `pending_reason` lifecycle) pass under the order-250 `enforce_forward_transitions` Business Rule; re-measured after every subsequent change at **13 / 13**, per assertion, byte-identical expected vs actual (§9.7). **(b) Depth on the form, one dedicated run after the round trip:** clicking the real **Resolve** UI Action on a case with an open child task was blocked, no write occurred (`sys_mod_count` unchanged), and the form displayed `All tasks must be closed before resolving this case.` — codepoint-verified, 52 ASCII characters, terminating U+002E. (b) proves the message reaches the form for one transition; (a) proves the matrix. All 7 flows are `active=true`, `status=published`. |
| ACLs | ⚠️ **PASS on all three tables after remediation** — qualified only because the remediation is manual | A clean commit gives 26 ACLs with **0 of 27** `sys_security_acl_role` link rows; after running `scripts/post_import_remediation.js` in Global, **27 of 27**. The matrix is then correct on the case table by impersonation: manager 14/14 with Delete, agent 9/14 without Delete, viewer 14/14 read-only. Both halves of "Assigned only" proven, including group-only visibility and record-level denial by direct URL. **The child-table defect is fixed:** the agent's `case_task` / `case_party` read+write conditions previously could not compile (`current.case` — `case` is a JS reserved word) and denied every row; the mirror is now enforced correctly and **ATF 06 and ATF 07 both pass** in the final suite run. |
| Portal — submission | ✅ **PASS — REST contract and portal page** | Anonymous `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE…","message":"Your case has been submitted"}`, row lands `status=Draft` with `sys_created_by=guest`. **The page works too:** as a Guest (`window.NOW.user_display_name === "Guest"`, `x-is-logged-in: false`) it renders one form with the five controls `subject` / `type` / `description` / `requester_name` / `requester_email`, keeps Submit disabled while the form is invalid, and on submit replaces the form with a confirmation panel carrying the verbatim `Your case has been submitted` and the returned case number. 0 console errors, no request ≥ 400. The blank page recorded here in earlier revisions was two defects — no `sp_container`/`sp_row`/`sp_column`/`sp_instance` layout records, and both widgets reading `response.data.<field>` where a Scripted REST body is nested under `result` — both now fixed (§9.6 E8-P). |
| Portal — lookup | ✅ **PASS — REST contract and portal page** | GET valid → exactly `{status, subject, opened_date}`, all seven internal fields absent from body and raw response. GET unknown → **404** with `No case found with that number.`, byte-identical to the required literal. **The page works too:** it renders one case-number input and a result panel with exactly three labelled values (Status / Subject / Opened Date, 3 `dt`/`dd` pairs); a whitelist audit of the rendered page for the seven internal field names returned zero matches; an unknown number replaces the panel with an alert whose `innerText` is the required literal, codepoint-verified at 31 characters; and a stored `<img src=x onerror=…>` subject renders as text (`&lt;img` in the raw HTML, 0 images, no script execution). |
| Dashboards | ✅ **PASS — both dashboards, admin and every entitled persona** | Browser-observed after the two packaging defects behind the earlier FAIL were fixed. **Agent Workspace renders 3 of 3 widgets, Manager View 5 of 5**, one tab each, and the empty-state string "Add widgets using the widget picker." is programmatically **absent** from both. Values were read from each chart's per-point accessibility labels rather than estimated from pixels: status 2/2/2/2/1/1 across Closed / In Progress / Open / Resolved / Draft / Pending; type General Inquiry 6 (60%) and Complaint 4 (40%); priority High 3, Medium 3, Critical 2, Low 2; Average Time to Close `16 Days 0 Hours 0 Minutes` and Cases Opened in Last 30 Days `10`, both returned by `SingleScoreRunProcessor` with `"STATUS":"SUCCESS"`. **Persona access is enforced as designed:** the manager opens both; the agent opens Agent Workspace and reads exactly its own three cases in *My Open Cases* (a DOM-wide `CASE\d{7}` scan returns only those three, so row-level scoping holds) and is correctly refused Manager View; the viewer is correctly refused, which is the documented design in [`dashboards.md`](./dashboards.md) rather than a defect. 0 console errors and 0 responses ≥ 400 on all five loads. **What the earlier FAIL was:** each dashboard's composite named three child tables that do not exist on this release — `pa_tab`, `pa_dashboard_widgets` and `pa_dashboard_role` — so the tab, all 8 widget placements and the role grants were dropped on commit; and all 8 `sys_report` rows committed with no grouping column because `group_by` is not a `sys_report` column at all (the column is `field`). Both are fixed in the artifacts and their payloads; see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.5 and §0.6.1 for the full forensic record. |
| Update Set | ⚠️ **CONDITIONAL PASS — zero problems of any type on a genuine clean slate (measured on the earlier `7272edfc…` revision); zero *reference* problems on the shipping bytes previewed against an instance that already holds the schema and the application history, with the remaining problems being that instance's own change history** | **Clean slate (earlier revision).** On the **913-block / 3,618,378-byte / SHA-256 `7272edfc…`** file: **before = 41 errors** previewed against the already-populated instance (20 local-update collisions + 18 `x_casemgmt_case`/`case` + 3 `core_company`/`organization` reference problems); then, after a staged teardown proven complete (scope query `[]`, every application census counter 0, all three tables moving from HTTP 200 to HTTP 400), an upload with the child `sys_update_xml` count asserted at **exactly 913**; **298** problems on the first clean-slate preview, every one `Found a local update that is newer than this one` — the teardown's own deletions captured locally; and **after = 0 problems of any type** once that local capture was purged at source. Checked against the platform's own predicate rather than assumed: `state=previewed`, `unresolvedProblems=false`, `shouldDisplay=true`. Then committed, `previewed → committing → committed`. **Progression 41 → 298 → 0.** **Populated instance (the case that used to fail).** The same procedure on the 913-block `89638c17…` revision left **21 package-intrinsic reference problems** — 18 × `Could not find a record in x_casemgmt_case for column case` and 3 × `Could not find a record in core_company for column organization` — because the 28 seed rows carried their parent key in the reference element **body**, and preview accepts only a sys_id there. **Shipping bytes.** After the seed rows were re-shaped (parent key in the `display_value` attribute with an empty body for `x_casemgmt_case` and `core_company`; deterministic pinned numbers `CASE9000001-10` / `TASK9000001-10` / `PARTY9000001-08`), the **925-block / 3,698,577-byte / `e49a7654…`** file was uploaded as a fresh retrieved update set (925 children asserted) and previewed against the same populated instance: **31 problems, all `Found a local update that is newer than this one`, and ZERO `Could not find a record` problems — 63 → 0.** Every one of the 31 targets was confirmed to hold a local `sys_update_version` in state `current`, so all 31 are this instance's own history; **no seed-data record appears among them.** **Not claimed:** these bytes have not been re-run through a full teardown trip, and **Commit was withheld** because the verification instance is shared. The install footprint also remains: a bare commit creates no physical storage, so the documented §9.5 sequence — two commits with a Global remediation run between and after them — is still required, and it completed with `verified=true`, `acl_links_total=27`, `errors=0`. The earlier **916-block `32a064d6…`** result (42 → 0) is retained in §9.2/§9.10 as the history of that revision. |

> **Net: 4 gates pass outright · 3 pass only with a qualification · 0 fail** — 4 + 3 + 0 = 7.
>
> | Verdict | Gates |
> | --- | --- |
> | ✅ Pass outright (4) | Workflow · Portal — submission *(REST contract **and** page)* · Portal — lookup *(REST contract **and** page)* · Dashboards *(both, admin and every entitled persona)* |
> | ⚠️ Qualified (3) | Data model *(needs the manual remediation)* · ACLs *(needs the manual remediation)* · Update Set *(zero problems of any type measured on the earlier `7272edfc…` revision; zero `Could not find a record` problems on the 925-block `e49a7654…` revision with 31 local-history collisions remaining and commit withheld; **no preview run on the shipping 926-block bytes** — §0.3b, §0.3c)* |
> | ❌ Fail (0) | none |
>
> **On the count.** This is the conservative reading, and it is the one every document in this deliverable
> quotes. Gates 1 and 3 carry **the same single qualification** — the documented manual post-import remediation,
> which is an approved installer step rather than a defect in the data model or the ACL design — so a reader who
> counts that step as part of a normal install will read gates 1, 2, 3, 4, 5 and 6 as outright passes and arrive
> at **6 pass · 1 qualified · 0 fail**. Both accountings describe the identical measured state. The progression of
> this line across revisions is `2+3+1` (wrong — sums to six), `2+4+1`, `1+5+1`, `3+3+1` and now **`4+3+0`**; the
> last change is gate 6 alone. Any count that fails to sum to 7 is wrong on its face.
>
> **What the qualifications mean, because "qualified" must not be read as "fine".** Data model and ACLs are
> correct once an operator has run the Global remediation script, and **incorrect until then** — until that run
> the three tables are metadata with no physical storage and all 26 ACLs have zero role links, which denies
> everything. The Update Set gate's qualification is about *which bytes carry which proof*, not about a defect:
> the zero-problems-of-any-type result belongs to the `7272edfc…` revision, the zero-reference-problems result to
> `e49a7654…`, and **no preview has been run on the shipping `7292a6fe…` bytes at all**. An earlier revision of
> this paragraph said the two portal gates *"pass at the contract level and fail at the surface level … a human
> visiting either portal page sees a blank screen"*; that was true when written and is **withdrawn** — the
> Service Portal layout records were authored and both pages render and work anonymously.
>
> The application logic is sound; the package is not self-installing. The install procedure that does work, and
> the residual manual footprint per defect, are in §9.5 of the limitations register. **The portal pages and both
> dashboards are now usable on this instance**, and the two further AAP requirements outside these seven gates
> that were previously measured as failing are now measured as passing:
>
> - **§0.4.4's related lists** for `case_task` and `case_party` were never authored — `sys_ui_related_list` held
>   0 rows for this scope and the case form's related-lists wrapper measured 0 pixels tall. The definition now
>   ships as [`../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml`](../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml)
>   and the wrapper measures **227 px** with two sections, *Case Tasks* above *Case Parties*, each showing its
>   child rows — identically for admin, the agent and the viewer, which is what proves the definition is a base
>   definition applying to every user. One caveat is worth knowing before diagnosing it twice: the definition is
>   cached server side, so if the form was ever rendered before the definition existed, the lists stay invisible
>   until that cache is invalidated. Step 12 of [`deployment.md`](./deployment.md) Step 3 records the symptom and
>   the remedy.
> - **The chart reports' grouping column** arrived empty because `group_by` is **not a column** on `sys_report` on
>   this release, so the element was discarded on import; the column a chart groups on is `field` (register §0.6.1).
>   All four chart reports now carry `field` and plot the intended dimension.
>
> **Regression gate (outside the seven).** The 13 transition-logic assertions that were passing before this
> pass were re-measured afterwards with the same harness, run verbatim: **13 / 13 before, 13 / 13 after**, per
> assertion, with byte-identical expected and actual values — see §9.7 of the limitations register.
>
> **ATF gate (outside the seven).** The final suite run on the committed instance, `TES0001015`, scores
> **20 / 20 tests Success and 180 / 180 step results Success** — 0 Failure, 0 Error, 0 Skipped, ~4 minutes, no
> test residue left behind. An earlier *series* of runs, `TES0001010`–`TES0001012`, scored **16 Success / 4
> Failure** — `ATF 07` (the child-table ACL condition) plus the three form tests `ATF 15` / `ATF 16` / `ATF 17`;
> both root causes are fixed and that result is history rather than status. **`TES0001014` scored 20 / 0 / 0 / 0**
> with 180 of 180 steps Success and is the last verdict taken against a fresh re-load of the shipped `atf/*.xml`
> artifacts — the project's only serialized-import proof; it is a separate claim from `TES0001015`, which proves
> the live assets, and the two are not interchangeable (see
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §8.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)). Running the suite requires
> `sn_atf.runner.enabled = true` and a browser-attached client runner — see
> [`ATF_MANUAL_TEST_PLAN.md`](./ATF_MANUAL_TEST_PLAN.md).

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
    1. Open Flow Designer and filter by **Application = `x_casemgmt Case Management`**, which is the reliable
       way to list them. The two parent flows are named **`general_inquiry_state_machine`** and
       **`complaint_state_machine`** internally, and **General Inquiry State Machine** / **Complaint State
       Machine** on screen — note there is **no `x_casemgmt_` prefix on flow names**, so a name filter of
       `x_casemgmt_*state_machine` matches nothing. Searching the name for `state_machine` works. Confirm both
       are **Active** and **Published**, not Draft. The same filter shows the five subflows they call:
       `validate_open_transition`, **`validate_in_progress_transition`** (note the underscores — the repository
       file is `validate_inprogress_transition.xml`), `validate_pending_transition`,
       `validate_resolved_transition`, `validate_closed_transition`. All seven were last measured
       `active=true`, `status=published`.
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
    12. Attempt to update a Closed case — first a field-only edit (change `priority`, leave `status` untouched), then a status change out of Closed. Verify both raise `"Closed cases are terminal and cannot be modified."` (verbatim), and that pressing Update with nothing edited is still accepted (the no-op is the only save a Closed case permits).
    13. Attempt an edge that is not in the matrix. On a fresh Draft case set `status` straight to `Closed`. Verify the form-level error `A case cannot go from Draft to Closed. From Draft the only valid next status is Open.`, that `status` is still `Draft` after a genuine reload, and that `closed_date` is still empty. Repeat for `Open → Closed`, `Pending → Resolved` and `Resolved → Open`; all eight skip/backward edges must be refused, because Gate 2's criterion is *all* state transitions enforced, not only the six the matrix lists preconditions for.
    14. Repeat the entire procedure for a Complaint case to confirm both flows enforce the same rules.
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
- **What actually happens today:** steps 2 and 6 both pass. Agent Workspace renders 3 of 3 widgets and Manager
  View 5 of 5, one tab each, with the seed data, 0 console errors and 0 responses ≥ 400. Step 4's drill-in works
  because *My Open Cases* renders a real list frame with record links. Note that step 3's "or a clean No data
  message" branch is the correct outcome for the two "My …" widgets when the signed-in user has no assignments:
  the manager legitimately sees a populated list frame reading "No records to display", while the agent sees
  exactly its own three cases.
- **Two packaging defects had to be fixed to get here, and both are recorded in full because the symptom pointed
  away from the cause:**
    1. Each dashboard's composite named three child tables that **do not exist on this release** — `pa_tab`,
       `pa_dashboard_widgets` and `pa_dashboard_role` — so the tab, all 8 widget placements and the role grants
       were silently dropped on commit, and a dashboard with no tab can render no widgets. The real wiring is
       `sys_portal_page` → `sys_grid_canvas` → `pa_tabs` → `pa_m2m_dashboard_tabs`, plus one
       `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` triple per widget. Supplying only a tab
       is provably insufficient: the platform auto-created one on first view and both dashboards stayed blank.
    2. The chart reports arrived with **no grouping column** although the artifacts specified one, because
       `group_by` is not a `sys_report` column at all — the column a chart groups on is `field` (register §0.6.1).
- **Getting a dashboard to open for a non-admin persona took three further gates, none of them obvious from the
  refusal text, so they are named here:** `sys_report.user` must be `GLOBAL` before the report read ACL's role
  branch is even evaluated; `sys_report.roles` then narrows which roles may read; and the dashboard itself is
  gated by `pa_dashboards_permissions` (the share list, one row per role) **and** by
  `pa_dashboards.restrict_to_roles`, which is the field the renderer quotes when it refuses. The similarly-named
  `pa_dashboards.roles` is labelled "Requires Roles" and only narrows — it grants nothing. There is no per-widget
  `report_view` gate on this application's content: that message was verified absent on every dashboard load, and
  verified as a true negative rather than an unobserved one, because the same personas do receive it on the
  platform's own `task`-table homepage widgets in the same session.
- **Failure Mode:** if a future revision regresses this, fix the artifacts and their payloads and re-export —
  **not** by hand-building the dashboards on the instance, which would leave the deliverable still broken. Per
  AAP Section 0.7.2 Minimal-Change Clause, if a gap requires adding widgets beyond the eight reports defined in
  [`dashboards.md`](./dashboards.md), stop and report — do not substitute.

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
- **Status of this procedure:** it has been executed end-to-end on the 913-block / 3,618,378-byte /
  `7272edfc…` revision, reaching **0 preview problems of any type** — verified through the platform's
  own `unresolvedProblems=false` / `shouldDisplay=true` predicate — and then `state=committed`. The measured
  progression was **41 → 298 → 0**: 41 against the already-populated instance, 298 on the first clean-slate
  preview (all of them the teardown's own deletions captured as newer local updates), and 0 once that local
  capture was purged at source. It was also executed earlier, with the same zero result, on the **916-block
  `32a064d6…`** revision. **On the 925-block `e49a7654…` revision steps 1-4 only were
  executed** — upload as a fresh retrieved update set with the child count asserted at 925, then preview:
  **31 problems, all `Found a local update that is newer than this one`, zero `Could not find a record`.**
  Steps 5-8 (teardown, commit, re-run the gates) were **not** performed on those bytes because the
  verification instance is shared with other work and committing would have mutated a live application.
  **On the bytes that ship — 926 blocks / `7292a6fe…` — not even steps 1-4 have been run;** §0.3c of the
  limitations register states what was measured instead and bounds the difference.
  Step 8 was carried out on the `7272edfc…` install: all of gates 1–6 were re-measured on the
freshly installed instance, and their outcomes are the ones in the Measured Status table above. Note that
  steps 7–8 require the §9.5 install sequence — a bare commit leaves the three tables without physical storage.
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

> **Current standing against this Definition of Done.** It is **not** fully met, and the Measured Status table
> above records exactly where. Against the success criteria reproduced in this section: cases can be created,
> assigned, progressed through every state and closed **via the internal UI**, and a case can now also be
> submitted and tracked **via the external portal** — both pages render and work anonymously since their
> Service Portal layout records were authored and the widgets' response-envelope bug was fixed; tasks and
> parties work and case resolution is correctly
> blocked until all linked tasks are closed; ACLs are enforced as specified **on all three tables**, the agent
> role's task and party conditions having been fixed and confirmed by ATF 06 and 07 passing; the **2 dashboards
> are not operational** on this instance; and the scoped application **is** exported as a single complete Update
> Set, which previewed with zero errors — **on an earlier revision's bytes, not the ones that ship**. The
> outstanding work is enumerated in priority order in
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §10](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md), where re-running the round
> trip on the shipping bytes is item 1.

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
