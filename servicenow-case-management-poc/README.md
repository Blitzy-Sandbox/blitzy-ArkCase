# ServiceNow Case Management POC

A proof-of-concept ServiceNow scoped application that re-platforms a subset of ArkCase's case-management functional domain onto the ServiceNow Now Platform.

This subdirectory contains the ServiceNow scoped application, delivered as a **single self-contained Update Set XML** at `update-set/x_casemgmt_case_management_update_set.xml`, accompanied by serialized record-definition artifacts and supporting documentation under this same subdirectory. It targets a ServiceNow Personal Developer Instance (PDI); it has been built and verified on `dev379024`, running **Australia Patch 3**. It is fully isolated from the existing ArkCase Maven reactor at the repository root — the rest of the repo is read-only context. The concrete scope identifier `x_casemgmt` is used consistently throughout these documents and every artifact under this subdirectory.

> **The package is self-contained; the *installation* is not self-completing, and this POC is not finished.** Committing the Update Set does **not** by itself yield a working application, and three things are open. Read this before planning around it:
>
> 1. **Two manual post-import steps are mandatory** — the physical table schema (Defect C) and the 27 ACL role-link records (Defect 9). The package ships the remediation body as a Fix Script but **ships no trigger and nothing that auto-executes**; an operator must run `scripts/post_import_remediation.js` from *System Definition → Scripts - Background* with **"In scope" = Global**.
> 2. **Three user-facing surfaces do not work**: both portal **pages** render blank, both **dashboards** render no tabs and no widgets, and the case form has **no related lists**. The portal **REST endpoints** do work.
> 3. **Running the ATF suite needs an instance setting** (`sn_atf.runner.enabled = true`) that is deliberately not captured into the package, plus a browser-attached client runner.
>
> **Now closed, and previously listed here as open:** the clean-slate round trip **has** been run on the bytes that ship — 913 blocks, 3,618,378 bytes, SHA-256 `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e`. Measured progression **41 → 298 → 0** preview problems, then `state=committed`, with the file byte-unchanged by the trip. AAP §0.7.1's zero-preview-error gate is therefore **met on the deliverable**. Detail in [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).
>
> Every one of these is measured, not estimated. [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) is the authoritative current-state record and the place to start.

## Refactoring Objective

The POC delivers seven enumerated capabilities, replacing specific ArkCase modules with ServiceNow-native equivalents:

- **Case lifecycle** — `x_casemgmt_case` table replicates `acm-case-file-plugin`'s `CaseFile` entity (12 fields).
- **Task domain** — `x_casemgmt_case_task` table replicates `acm-task-plugin`'s `AcmTask` (6 fields).
- **Polymorphic party association** — `x_casemgmt_case_party` collapses `acm-person-plugin`'s `PersonAssociation` and `PersonOrganizationAssociation` (5 fields, single-table polymorphism with a `party_type` choice).
- **Role/privilege subsystem** — three scoped roles (`x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`) replacing `acm-services/acm-service-users` `ApplicationRolesConfig` and `acm-admin-plugin` `RolesPrivilegesService`.
- **Case state-machine** — two Flow Designer flows (one per case type: General Inquiry, Complaint) replacing the Activiti BPMN + `ChangeCaseFileStateService` stack.
- **External requester intake portal** — ServiceNow Experience Portal with two unauthenticated pages (case submission + case status lookup) replacing `acm-service-portal-gateway`'s anonymous-submission pattern.
- **Reporting surfaces** — two ServiceNow dashboards (Agent Workspace + Manager View) backed by eight reports, replacing the Pentaho/Solr aggregates.

This is **partial functional parity, not API compatibility**. ArkCase's REST APIs (`/api/latest/plugin/casefile/...`, `/api/latest/plugin/admin/rolesprivileges/...`, etc.) are explicitly NOT preserved; consumers use the ServiceNow platform's auto-generated Table API and the Experience Portal page services instead.

## Out of Scope

The following ArkCase capabilities are explicitly NOT replicated by this POC:

- Document management, file attachments, redaction (no `acm-content-management`, `acm-tool-integration-alfresco`, `acm-plugin-ecm-file`).
- FOIA deadline tracking and compliance workflows.
- Email notifications (disabled on the PDI; no SMTP, notification rules, or templates configured).
- Correspondence management.
- Time tracking and cost tracking.
- External-system integrations (Alfresco CMIS, Outlook/Exchange EWS, Pentaho BI, OnlyOffice, ZyLAB, Ephesoft, AWS Comprehend Medical, AWS Transcribe, LDAP/AD SSO).
- Data migration from ArkCase (zero rows are read from the ArkCase MySQL database; all seed data is fabricated).
- Global-scope changes (no edits to `sys_user`, `sys_user_group`, `sys_user_role` outside the three scoped roles created here, `core_company`, `task`, `incident`, or any out-of-the-box ServiceNow tables) — with **one disclosed and approved exception**: the installer Fix Script `x_casemgmt Post-Import Remediation` is authored in the **global** scope, because the `GlideTableDescriptor` and `GlideSecurityManager` calls it needs are refused in scoped execution. It is installer wiring rather than application configuration, and the commit engine rewrites it into `x_casemgmt` anyway. See Build Constraints item 1 and [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.7](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). The global tables `sys_user`, `sys_user_group`, `sys_user_role` and `core_company` receive **data** inserts only, never schema changes.
- ServiceNow Store applications (none are installed; the build relies exclusively on the platform's standard low-code tooling shipped with the PDI).
- Any module, workflow, portal page, table, or integration beyond the defined POC scope.

## Repository Relationship

All output for this POC is confined to `servicenow-case-management-poc/`. All files and folders **outside this subdirectory** are read-only context and MUST NOT be modified, renamed, or deleted by any build agent.

The protected items at the repository root and at `acm-*` paths are:

- Top-level files: `pom.xml`, `README.md` (the existing ArkCase project README, distinct from this README), `LICENSE.txt`, `.gitlab-ci.yml`, `.gitlab-ci-release.yml`, `acm-checkstyle-checks.xml`, `jacoco-summary.sh`.
- Top-level directories: `acm-core-api/`, `acm-forms/`, `acm-jmeter/`, `acm-plugins/`, `acm-services/`, `acm-standard-applications/`, `acm-tool-integrations/`, `acm-user-interface/`, `acm-web/`.

### Read-Only Semantic References

The following ArkCase locations were consulted as semantic source-of-truth when designing the scoped application. They were never modified, renamed, or deleted:

- `acm-plugins/acm-default-plugins/acm-case-file-plugin/` — Case domain (`CaseFile.java`, `ChangeCaseFileStateService`, `CaseFileTasksService`, etc.).
- `acm-plugins/acm-default-plugins/acm-task-plugin/` — Task domain (`AcmTask.java`).
- `acm-plugins/acm-default-plugins/acm-person-plugin/` — Party domain (`PersonAssociation.java`, `PersonOrganizationAssociation.java`).
- `acm-plugins/acm-default-plugins/acm-admin-plugin/` — Roles/privileges service.
- `acm-services/acm-service-users/` — Application roles configuration.
- `acm-services/acm-service-portal-gateway/` — Portal-gateway anonymous-submission pattern.
- `acm-standard-applications/arkcase/` — AngularJS UI shell for UX semantic reference.

## Directory Layout

Every directory is listed below with its exact file count, so the tree can be diffed against the working copy (`187` files in total, README included).

```plaintext
servicenow-case-management-poc/
├── README.md                          (this file — overview and entry point)
├── update-set/                    [1] x_casemgmt_case_management_update_set.xml — THE deliverable
│                                      (913 blocks · 3,618,378 bytes)
├── app/                           [1] app/sys_app/x_casemgmt_case_management.xml — the scoped
│                                      application record. There is no separate sys_scope
│                                      artifact: the platform derives sys_scope from sys_app
│                                      on commit, so shipping one would duplicate it.
├── tables/                        [3] case, case_task, case_party (sys_db_object)
├── dictionary/                   [25] every field on the three tables (sys_dictionary)
├── choices/                       [7] every Choice list (sys_choice)
├── numbers/                       [3] auto-numbering counters (sys_number)
├── roles/                         [3] the three scoped roles (sys_user_role)
├── acl/                          [26] table-level + field-level ACLs (sys_security_acl).
│                                      The 27 sys_security_acl_role LINK rows that grant these
│                                      to the roles are a different table and are created by
│                                      the post-import remediation script, not by these files.
├── flows/                         [9] 2 parent flows + 5 subflows + 1 Custom Action
│   ├── general_inquiry_state_machine.xml
│   ├── complaint_state_machine.xml
│   ├── custom_actions/                x_casemgmt_transition_guard_action.xml — the Custom
│   │                                  Action that returns the transition verdict to a flow
│   └── sub_flows/                     validate_open / validate_inprogress / validate_pending /
│                                      validate_resolved / validate_closed, plus
│                                      shared_flow_logic_block.xml (sys_hub_flow_block, the
│                                      shared logic block the five subflows reuse)
├── script_includes/               [2] CaseTransitionValidator + CasePortalService
├── business_rules/                [7] before-insert / before-update guards. The two that
│                                      matter most: x_casemgmt_enforce_forward_transitions
│                                      (order 250 — calls the subflow and raises the blocking
│                                      form error) and x_casemgmt_set_closed_date (order 500 —
│                                      the only writer of closed_date).
├── ui_policy/                     [1] case_party conditional person/organization fields
├── ui_action/                     [6] the state-transition buttons
├── portal/                       [10] portal record + 2 pages + 3 widgets + 2 scripted REST
│                                      endpoints + supporting records. The REST endpoints work;
│                                      the two pages render blank (see docs/PDI_LIMITATIONS…).
├── dashboards/                    [2] Agent Workspace + Manager View. Both currently render
│                                      with no tabs and no widgets (see docs/PDI_LIMITATIONS…).
├── reports/                       [8] the eight reports the dashboards are meant to show
├── seed-data/                     [35] synthetic demo data: 3 users, 1 group, 3 role
│                                      assignments, 10 cases, tasks, parties
├── atf/                          [21] the Automated Test Framework suite: 20 test definitions
│                                      (ATF 01-20) + x_casemgmt_atf_test_suite.xml. These
│                                      serialize to 761 of the package's 913 blocks.
├── docs/                         [11] see the Documentation Index below
└── scripts/                       [5] post_import_remediation.js — the mandatory Global
                                       post-import script (Defect C + Defect 9)
                                       sys_script_fix_x_casemgmt_post_import_remediation.xml —
                                       the Fix Script wrapper that carries that body inside
                                       the Update Set (it does NOT auto-run)
                                       seed_demo_data.js — idempotent demo-data seeder
                                       transition_logic_regression_assertions.js — server-side
                                       regression assertions for the transition guards
                                       round_trip_verify.md — the re-import/preview procedure
```

Each subfolder corresponds to a category of ServiceNow record definitions or supporting artifacts:

- `update-set/` holds the single final Update Set XML deliverable that gets imported into a fresh PDI.
- `app/` holds the scoped-application record (`sys_app`).
- `tables/`, `dictionary/`, `choices/`, `numbers/` define the three custom tables, their fields, choice lists, and auto-numbering counters.
- `roles/` and `acl/` define the three scoped roles and their table-level and field-level ACLs.
- `flows/`, `script_includes/`, `business_rules/`, `ui_policy/`, `ui_action/` implement the case state-machine transition rules and form behavior.
- `portal/` holds the Experience Portal record, pages, widgets, and scripted REST endpoints powering external case submission and lookup.
- `dashboards/` and `reports/` define the two POC dashboards and their eight underlying reports.
- `seed-data/` contains synthetic demo data that exercises every status, both case types, and the full ACL matrix.
- `atf/` holds the 20 automated tests and the suite that assert the data model, the ACL matrix, the transition rules, and the portal REST contracts.
- `docs/` and `scripts/` hold supporting documentation and operational scripts.

## Data Model Quick Reference

Detailed schemas live in `docs/data-model.md`. This section is a one-glance summary.

**`x_casemgmt_case`** (12 fields):

| Field | Type | Constraints |
| --- | --- | --- |
| `number` | Auto-number | Read-only, format `CASE0000001` |
| `type` | Choice | General Inquiry, Complaint — extensible |
| `status` | Choice | Draft, Open, In Progress, Pending, Resolved, Closed |
| `priority` | Choice | Low, Medium, High, Critical |
| `subject` | String(255) | Mandatory |
| `description` | String(4000) | Mandatory |
| `opened_date` | DateTime | Auto-set on creation |
| `closed_date` | DateTime | Auto-set on Close transition |
| `assigned_group` | Reference → `sys_user_group` | Mandatory on Open transition |
| `assigned_agent` | Reference → `sys_user` | Optional; must be member of `assigned_group` |
| `requester_name` | String(100) | Mandatory — captures external requester |
| `requester_email` | String(100) | Optional |

A non-displayed `pending_reason` (Choice: Awaiting Info, Awaiting Third Party, Other) field also exists on the same table and is set/cleared by the state-machine flows during the Pending state. A virtual `duration_to_close` Function Field (`glide_duration` typed; computed at query time as `glidefunction:datediff(closed_date,opened_date)`) also exists on the same table; it is read-only, hidden from the form/list views, and consumed exclusively by the Manager View "Average Time to Close" widget per AAP Section 0.4.4. See `docs/data-model.md` for the full additional-fields rationale.

**`x_casemgmt_case_task`** (6 fields):

| Field | Type | Constraints |
| --- | --- | --- |
| `case` | Reference → `x_casemgmt_case` | Mandatory |
| `subject` | String(255) | Mandatory |
| `type` | Choice | Investigation, Review, Follow-up, Other |
| `status` | Choice | Open, In Progress, Closed |
| `assigned_to` | Reference → `sys_user` | Mandatory |
| `due_date` | Date | Mandatory |

**`x_casemgmt_case_party`** (5 fields):

| Field | Type | Constraints |
| --- | --- | --- |
| `case` | Reference → `x_casemgmt_case` | Mandatory |
| `party_type` | Choice | Person, Organization |
| `person` | Reference → `sys_user` | Conditional: required if `party_type = Person` |
| `organization` | Reference → `core_company` | Conditional: required if `party_type = Organization` |
| `role_label` | String(100) | Mandatory (e.g., Requester, Respondent, Witness) |

## Build Constraints (Non-Negotiable)

1. **Scoped-namespace exclusivity** — every artifact lives in the auto-assigned `x_casemgmt` namespace; zero global-scope writes are permitted, with **one disclosed exception** that is approved app-installer wiring rather than application configuration: the Fix Script `x_casemgmt Post-Import Remediation`. It is authored global because it calls `GlideTableDescriptor` and `GlideSecurityManager`, which the platform refuses in scoped execution — and it is rewritten into `x_casemgmt` by the commit engine anyway, which is exactly why the remediation cannot run automatically. A second global record, the auto-execute Business Rule `x_casemgmt Post-Import Bootstrap`, was built and has been **removed**: it could not succeed for the same scope-rewrite reason, and its condition fired on the commit of *any* retrieved Update Set rather than only this application's, so activating it would have dispatched privileged, partly destructive remediation on unrelated deployments. See [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §9.4. No other record in the package is global-scoped, and no out-of-the-box table receives a schema change; the global tables `sys_user`, `sys_user_group`, `sys_user_role` and `core_company` receive **data** inserts only.
2. **Zero hardcoded `sys_id`s** — anywhere; every cross-reference uses `GlideRecord` lookups by stable human-readable keys (`name`, `user_name`, `number`, `role_label`).
3. **No PII** — synthetic demo data only; no real names, email addresses, phone numbers, or organization names.
4. **Email-disabled** — no SMTP, notification rules, or email templates configured (notifications are disabled on the PDI).
5. **Single Update Set deliverable** — the final scoped application is exported as one XML at `update-set/x_casemgmt_case_management_update_set.xml`. **The constraint is met, and AAP §0.7.1's zero-preview-error gate is now proven on the bytes that ship.** The shipping file — 913 blocks / 3,618,378 bytes / SHA-256 `7272edfc…` — was taken through a complete teardown → upload → preview → commit: **41** preview problems against the already-populated instance, **298** on the first clean-slate pass (all of them the teardown's own deletions captured as newer local updates), and **0 problems of any type** once that capture was purged at source, confirmed by the platform's own `unresolvedProblems=false` predicate, then `state=committed`. The file on disk is byte-unchanged by the trip. An earlier 916-block revision (3,448,009 bytes, SHA-256 `32a064d6…`) reached the same zero result and is retained as history. Detail in [§0.3 of the limitations register](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).
6. **Flow-Designer-exclusive workflow** — all transition logic lives in Flow Designer (with helper Script Includes and Business Rules at the entity level); no direct background scripts for workflow state management.
7. **Repository minimality** — output confined to `servicenow-case-management-poc/`; the existing ArkCase repository structure is read-only context and is not refactored in place.
8. **Tooling restriction** — App Engine Studio, Flow Designer, and UI Builder only; no paid Store applications; no alternative authoring path.

## State-Machine Quick Reference

The full transition matrix and narrative live in `docs/state-machine.md`. The eight transition rows below are the canonical contract for both Flow Designer flows (General Inquiry and Complaint).

| From | To | Required condition | Blocking-error behavior on failure |
| --- | --- | --- | --- |
| Draft | Open | `assigned_group` populated | Surface form-level error |
| Open | In Progress | `assigned_agent` populated AND member of `assigned_group` | Surface form-level error |
| In Progress | Pending | None; sets `pending_reason` (Awaiting Info / Awaiting Third Party / Other) | n/a |
| Pending | In Progress | None; clears `pending_reason` | n/a |
| In Progress | Resolved | All linked `x_casemgmt_case_task` records have `status = Closed` | Surface "All tasks must be closed before resolving this case." |
| Resolved | Closed | Caller has `x_casemgmt_case_manager` role; auto-set `closed_date` | Surface form-level error |
| Any → Draft | (none) | PROHIBITED | Surface "Cases cannot be returned to Draft." |
| Closed → * | (none) | PROHIBITED — terminal state | Surface "Closed cases are terminal and cannot be modified." |

## Roles & ACLs Quick Reference

The full role × table × CRUD matrix and the "Assigned only" definition live in `docs/acl-matrix.md`.

| Role | Create | Read | Write | Delete |
| --- | --- | --- | --- | --- |
| `x_casemgmt_case_manager` | ✅ | ✅ All | ✅ All | ✅ |
| `x_casemgmt_case_agent` | ✅ | ✅ Assigned only | ✅ Assigned only | ❌ |
| `x_casemgmt_case_viewer` | ❌ | ✅ All | ❌ | ❌ |

"Assigned only" = cases where `assigned_agent = current user OR assigned_group contains current user`. Field-level ACLs further restrict writes on `assigned_group` (manager only) and `assigned_agent` (manager + assigned agent).

## Deliverables

- **Update Set XML:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`.
- **Portal URL:** `[instance URL]/x_casemgmt_case_portal` — this is the actual `<url_suffix>` declared in [`portal/sp_portal_x_casemgmt_case_portal.xml`](portal/sp_portal_x_casemgmt_case_portal.xml). AAP Section 0.7.2 verbatim wording uses the generic placeholder `[instance URL]/x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time"); this Deliverables line uses the actual implementation slug so a verifier can navigate directly without further lookup. See [`docs/portal-pages.md`](docs/portal-pages.md) for the full discrepancy explanation. **The URL resolves anonymously with no login wall, but both pages currently render blank** — see Current Status below.
- **Dashboards:** Agent Workspace + Manager View records are in the package and **do install**, but they **cannot render** — both were observed with **0 tabs and 0 widgets**, showing the platform's empty state, "Add widgets using the widget picker." The cause is packaging, not the reports: each dashboard's composite block names **three child tables that do not exist on this release** — `pa_tab` (the real table is `pa_tabs`), `pa_dashboard_widgets` (`pa_widgets`), and `pa_dashboard_role` — so the tab, all 8 widget placements (3 on Agent Workspace, 5 on Manager View) and the role grants are all silently dropped on commit. See Current Status below.
- **Synthetic seed data:** at least 10 demo cases spanning all six statuses and both case types, plus 3 demo users (one per role) and 1 demo group. The packaged seed rows require one preparatory step before the seed script can populate them correctly — see Current Status below.

## Current Status

All statements below were measured on `https://dev379024.service-now.com` (Australia Patch 3). Nothing here is
projected.

**The package**

- **Identity:** `update-set/x_casemgmt_case_management_update_set.xml` — **913 update blocks, 3,618,378 bytes,
  SHA-256 `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e`**. Quote these numbers and no
  others; earlier revisions carried different ones.
- **Round-trip status: CLOSED — measured on the bytes above.** Teardown proven complete (scope query `[]`, every
  application census counter 0, all three tables moving from HTTP 200 to HTTP 400), upload with the child
  `sys_update_xml` count asserted at **exactly 913**, then preview problems **by type**: **41** against the
  already-populated instance → **298** on the first clean-slate pass, every one
  `Found a local update that is newer than this one` (the teardown's own deletions) → **0 of any type** once that
  local capture was purged at source, checked against the platform's own `state=previewed` /
  `unresolvedProblems=false` / `shouldDisplay=true` predicate rather than assumed. Then
  `previewed → committing → committed`. The SHA-256 re-computed from the file afterwards is unchanged. AAP
  §0.7.1's gate is therefore **met on what ships**. The earlier 916-block revision (3,448,009 bytes,
  SHA-256 `32a064d6…`) reached the same zero result and is kept as history, not as the current status.
- **Nothing in it fires on its own.** The package contains **no record that auto-executes, of any kind** — no
  Business Rule, no scheduled job, no `sys_trigger` row. (It does contain a Fix Script, which is a record; the
  point is that nothing *runs* it.) An earlier revision did ship one (the global Business
  Rule `x_casemgmt Post-Import Bootstrap`); it was **removed**, both because it could not succeed (the commit
  engine rewrites the dispatched record into the application scope, where the APIs it needs are refused) and
  because its condition fired on the commit of *any* retrieved Update Set, which would have dispatched
  privileged, partly destructive remediation onto unrelated deployments. The remediation body still ships, as
  the Fix Script `x_casemgmt Post-Import Remediation`, but a Fix Script does not self-run either.

**Installation is therefore a two-part operation**

Commit, then run `scripts/post_import_remediation.js` from *System Definition → Scripts - Background* with
**"In scope" = Global**. Two defects require it, and neither can be automated on a PDI:

- **Defect C** — the three tables commit as dictionary metadata without physical storage.
- **Defect 9** — the 26 ACLs commit without their **27** `sys_security_acl_role` link rows, so they grant
  nothing until the links exist.

[`docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) carries the numbered
procedure. Do not substitute the Fix Script UI: it executes in the application scope and fails.

**Working — directly observed**

- The three-table data model, and auto-numbering in `CASE0000001` format.
- The full state machine for both case types, with blocking form errors. All **7 flows** are `active=true`
  and `status=published`.
- The role × table × CRUD matrix, including record-level "Assigned only" narrowing and the field-level ACLs on
  `assigned_group` / `assigned_agent` — **on all three tables**. The `case_agent` condition defect that
  previously denied every row on the task and party tables has been fixed and the ATF tests that cover it
  (06, 07) pass.
- The anonymous portal **REST endpoints**: submit returns `201` with the new case number; lookup returns `200`
  with exactly `{status, subject, opened_date}`; an unknown number returns `404` with the verbatim
  `No case found with that number.`
- The 8 report definitions and the demo data (census as re-measured after the §0.3 round trip: **10 cases, 10 tasks, 8 parties** — see §9.8a of the limitations register).
- **The ATF suite is green.** Run `TES0001015`: **20 / 20 tests Success, 180 / 180 step results Success**, zero
  failures, errors or skips, ~4 minutes, no test residue left behind. (An earlier *series* of runs,
  `TES0001010`–`TES0001012`, scored **16 / 4** — `ATF 07` plus the three form tests `ATF 15` / `ATF 16` /
  `ATF 17`; that result predates the fixes and is history, not status. **`TES0001014` scored 20 / 0 / 0 / 0** and
  is the last verdict taken against a fresh re-load of the shipped `atf/*.xml` artifacts — the project's only
  serialized-import proof.)

**Not working — also directly observed**

- **Both portal pages render blank.** All three portal routes return HTTP 200 with no login wall, but the page
  API reports **0 containers** and the rendered pages contain 0 forms, 0 inputs and 0 buttons — verified pure
  white across every pixel, with 0 console errors. A control page on the same portal and session renders its
  widgets normally, so the portal itself is sound: the two pages' Service Portal layout records
  (container / row / column / instance) were never authored. The REST endpoints behind them work.
- **Both dashboards render no tabs and no widgets** — the platform's empty state. Their composite blocks name
  three child tables that do not exist on this release (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`),
  so the tab, all 8 widget placements and the role grants are dropped on commit.
- **All 8 installed reports lost their grouping.** Every report artifact specifies a `group_by`, but all 8
  `sys_report` rows commit with it empty — so, for example, *All Cases by Status* renders grouped by *Assigned
  Agent*. A report-by-report repair, unrelated to the dashboard defect above.
- **The case form has no related lists.** `sys_ui_related_list` holds **0 rows** for this scope, and the form's
  related-lists wrapper measures **exactly 0 pixels** tall. The reference fields make the relationship
  available; the list placements were never authored.

**No regressions.** The 13 transition-logic assertions that passed before this pass were re-measured with the
same harness afterwards: **13 / 13 before, 13 / 13 after**, per assertion.

**Read [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) before deploying.**
**Section 0** of that document is the authoritative current-state record and supersedes any later section it
disagrees with; Section 9.5 is the install procedure, Section 9.6 lists every known defect with its root cause,
and Section 10.0 gives the recommended next steps in priority order. The measured status of each of the seven
validation gates is in [`docs/validation-gates.md`](docs/validation-gates.md#measured-status).

> **Instance note.** The reachable verification instance is `https://dev379024.service-now.com`. The
> `dev364430` host named in some older documentation in this repository is stale and returns HTTP 401.

> **Running the ATF suite needs one instance setting that the package deliberately does not carry.** Set
> `sn_atf.runner.enabled = true` under *sys_properties*, then start the suite from a browser-attached client
> runner (open `/atf_test_runner.do?sysparm_nostack=true` first and select it under "Pick a Browser").
> Headless execution is **off** on `dev379024` and could not be enabled there, so it is unverified. The
> property is instance configuration and is excluded from the package on purpose — importing an app should not
> silently enable test execution on someone's instance.

## Install & Deployment

1. **Export Update Set:** Navigate to System Update Sets → Local Update Sets. Locate the scoped application Update Set. Set status to Complete. Export as XML.
2. **Verify Update Set integrity:** Re-import the exported XML on the same instance via System Update Sets → Retrieved Update Sets → Upload. Preview the Update Set. Zero errors required before proceeding. If preview errors exist, resolve them in the source application before re-exporting.
3. **Confirm deployed state:** After successful preview, commit the Update Set. Verify the following are present and functional post-commit: all 3 custom tables visible in App Engine Studio; both Flow Designer flows active (not draft); Experience Portal accessible at `[instance URL]/x_casemgmt_portal` (or the equivalent portal URL chosen at portal-record creation time — for this implementation the actual portal slug is `x_casemgmt_case_portal`, see [`docs/portal-pages.md`](docs/portal-pages.md)); both dashboards accessible to users with correct roles; synthetic demo data visible in case list.
4. **Deliver:** Provide the exported Update Set XML file path and the portal URL as final deliverables alongside confirmation that all validation gates passed.

> **These four steps are the AAP's deployment contract, reproduced as written. They are not sufficient on this
> instance.** A commit alone leaves the three tables without physical storage and the 26 ACLs without their 27
> role links. Step 3's dashboard check cannot pass either — the dashboards name three child tables that this
> release does not have (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`) — and its portal check will find
> the URL live but the pages blank. Follow
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0 and §9.5](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) for the procedure that
> works — in outline: commit, rebuild the three tables and run `scripts/post_import_remediation.js` in **Global**
> (*Scripts - Background*, "In scope" = Global — **not** the Fix Script UI, which runs in the application scope
> and fails), commit a second time to restore the ACLs the rebuild cascaded away, run the remediation again to
> confirm `verified=true` with exactly 27 role links, then delete the packaged number-less seed rows and run
> `scripts/seed_demo_data.js` in scope. The single-display-field repair that this outline previously listed is
> **no longer a manual step** — the package now ships one display field per table and the remediation verifies
> it.

Detailed walkthrough in `docs/deployment.md`. Manual round-trip verification procedure in `scripts/round_trip_verify.md`.

## Validation Gates

Detailed gate definitions live in `docs/validation-gates.md`. The seven gates below are the canonical pass/fail criteria for delivery, reproduced verbatim from AAP Section 0.7.3. For the **measured** outcome of each gate on the verification instance — **2 pass outright, 4 pass only with a qualification, 1 fails** (2 + 4 + 1 = 7) — see [`docs/validation-gates.md` → Measured Status](docs/validation-gates.md#measured-status). In brief: **Workflow** passes, and **Update Set** passes with zero preview problems of any type measured on the bytes that actually ship. **Data model** and **ACLs** are correct only after the documented manual post-import remediation. **Portal — submission** and **Portal — lookup** pass at the REST-contract level while their pages render blank. **Dashboards** fails. Counting the documented remediation as part of a normal install instead yields 4 pass · 2 qualified · 1 fail; both describe the same measured state, and this deliverable quotes the conservative one throughout.

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| Data model | All 3 custom tables created with correct fields and types | Zero missing mandatory fields |
| Workflow | All state transitions enforced for both case types | Invalid transitions return blocking error; task-closure check blocks Resolved transition |
| ACLs | Role-based access enforced | `case_viewer` cannot write; `case_agent` cannot access unassigned cases; `case_manager` has full access |
| Portal — submission | Case created from unauthenticated portal submission | Case appears in internal list with Draft status and correct case number |
| Portal — lookup | Status lookup returns correct data for valid case number | Correct status / subject / opened_date returned; "No case found with that number." for invalid number |
| Dashboards | Both dashboards render with synthetic data | All widgets display data; no broken report references |
| Update Set | Scoped app exported | Update Set loads without errors on a fresh PDI instance |

## Documentation Index

Read them in this order. The first is authoritative wherever any other document disagrees with it.

| Document | What it is for |
| --- | --- |
| [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) | **The authoritative current-state record.** §0 carries the package identity, what is and is not verified, the open limitations, and the gate rollup. Start here. |
| [`docs/validation-gates.md`](docs/validation-gates.md) | AAP §0.7.3's seven gates with the evidence behind each verdict. |
| [`docs/data-model.md`](docs/data-model.md) | The three tables, field by field, per AAP §0.5.7. |
| [`docs/state-machine.md`](docs/state-machine.md) | The transition matrix per AAP §0.5.5, the blocking-error strings, and how enforcement is wired. |
| [`docs/acl-matrix.md`](docs/acl-matrix.md) | The role × table × CRUD matrix per AAP §0.5.6 and the definition of "Assigned only". |
| [`docs/portal-pages.md`](docs/portal-pages.md) | The submission and lookup surfaces and their exact field whitelists. |
| [`docs/dashboards.md`](docs/dashboards.md) | The widget inventory for both dashboards and the reports behind them. |
| [`docs/deployment.md`](docs/deployment.md) | Export, upload, preview, commit, and post-commit verification. |
| [`docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) | The full operator runbook, including the mandatory post-import remediation procedure. |
| [`docs/ATF_MANUAL_TEST_PLAN.md`](docs/ATF_MANUAL_TEST_PLAN.md) | What each of the 20 ATF tests asserts, and how to run the suite. |
| [`docs/WORKFLOW_TRYOUT_GUIDE.md`](docs/WORKFLOW_TRYOUT_GUIDE.md) | A hands-on walkthrough of the case lifecycle on a live instance. |
| [`scripts/round_trip_verify.md`](scripts/round_trip_verify.md) | The Update Set re-import and preview verification procedure. |

Files under `scripts/`:

- `scripts/post_import_remediation.js` — **the mandatory post-import remediation.** Builds the three tables' physical storage (Defect C) and creates the 27 `sys_security_acl_role` link rows (Defect 9). Run it from *Scripts - Background* with "In scope" = **Global**; it is fail-closed and reports `verified=true` only when both are correct.
- `scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` — the Fix Script record that carries that same body inside the Update Set so it arrives with the app. It does **not** auto-run, and running it from the Fix Script UI fails (application scope).
- `scripts/seed_demo_data.js` — idempotent server-side seed script (uses `GlideRecord` lookups by `user_name` / `name` / `number`; no hard-coded `sys_id`s).
- `scripts/transition_logic_regression_assertions.js` — the 13 server-side assertions over the transition guards, used to prove no regression across changes.
- `scripts/round_trip_verify.md` — manual procedure for the fresh-PDI re-import preview gate.

## License

The existing top-level repository license file is `LICENSE.txt` (LGPLv3) and applies to the existing ArkCase code. The artifacts under `servicenow-case-management-poc/` are derived semantic re-implementations and not direct ports of any LGPLv3 source code from the ArkCase repository.

No third-party LGPLv3 source code is included or redistributed in this subdirectory.
