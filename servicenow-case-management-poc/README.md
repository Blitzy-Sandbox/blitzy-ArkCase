# ServiceNow Case Management POC

A proof-of-concept ServiceNow scoped application that re-platforms a subset of ArkCase's case-management functional domain onto the ServiceNow Now Platform.

This subdirectory contains a complete, self-contained ServiceNow scoped application that targets a ServiceNow Personal Developer Instance (PDI) running the latest available release (Yokohama, Zurich, or Australia depending on PDI rollout state at provisioning time). The scoped application is delivered as a single Update Set XML at `update-set/x_casemgmt_case_management_update_set.xml`, accompanied by serialized record-definition artifacts and supporting documentation under this same subdirectory. It is fully isolated from the existing ArkCase Maven reactor at the repository root — the rest of the repo is read-only context. The concrete scope identifier `x_casemgmt` is used consistently throughout these documents and every artifact under this subdirectory.

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
- Global-scope changes (no edits to `sys_user`, `sys_user_group`, `sys_user_role` outside the three scoped roles created here, `core_company`, `task`, `incident`, or any out-of-the-box ServiceNow tables).
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

```plaintext
servicenow-case-management-poc/
├── README.md                    (this file — overview and entry point)
├── update-set/                  (final exported Update Set XML deliverable)
├── app/                         (scoped application + scope records: sys_app, sys_scope)
├── tables/                      (three custom table definitions: sys_db_object)
├── dictionary/                  (every dictionary field entry: sys_dictionary)
├── choices/                     (every Choice list record: sys_choice)
├── numbers/                     (auto-numbering counters for case, task, party)
├── roles/                       (three scoped role records: sys_user_role)
├── acl/                         (table-level + field-level ACLs: sys_security_acl)
├── flows/                       (Flow Designer flows + shared subflows: sys_hub_flow)
├── script_includes/             (reusable Script Includes for transition validation + portal helpers)
├── business_rules/              (Before-insert / before-update business rules)
├── ui_policy/                   (UI Policies for conditional-field visibility)
├── ui_action/                   (UI Actions for state transitions)
├── portal/                      (Service Portal record + pages + widgets + scripted REST endpoints)
├── dashboards/                  (Agent Workspace + Manager View dashboards)
├── reports/                     (eight report records backing the dashboards)
├── seed-data/                   (synthetic demo data: users, group, role assignments, cases, tasks, parties)
├── docs/                        (data model, state machine, ACL matrix, portal pages, dashboards, validation gates, deployment)
└── scripts/                     (idempotent server-side seed script + round-trip-verify procedure)
```

Each subfolder corresponds to a category of ServiceNow record definitions or supporting artifacts:

- `update-set/` holds the single final Update Set XML deliverable that gets imported into a fresh PDI.
- `app/` holds the scoped-application metadata records (`sys_app`, `sys_scope`).
- `tables/`, `dictionary/`, `choices/`, `numbers/` define the three custom tables, their fields, choice lists, and auto-numbering counters.
- `roles/` and `acl/` define the three scoped roles and their table-level and field-level ACLs.
- `flows/`, `script_includes/`, `business_rules/`, `ui_policy/`, `ui_action/` implement the case state-machine transition rules and form behavior.
- `portal/` holds the Experience Portal record, pages, widgets, and scripted REST endpoints powering external case submission and lookup.
- `dashboards/` and `reports/` define the two POC dashboards and their eight underlying reports.
- `seed-data/` contains synthetic demo data that exercises every status, both case types, and the full ACL matrix.
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

A non-displayed `pending_reason` (Choice: Awaiting Info, Awaiting Third Party, Other) field also exists on the same table and is set/cleared by the state-machine flows during the Pending state.

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

1. **Scoped-namespace exclusivity** — every artifact lives in the auto-assigned `x_casemgmt` namespace; zero global-scope writes are permitted.
2. **Zero hardcoded `sys_id`s** — anywhere; every cross-reference uses `GlideRecord` lookups by stable human-readable keys (`name`, `user_name`, `number`, `role_label`).
3. **No PII** — synthetic demo data only; no real names, email addresses, phone numbers, or organization names.
4. **Email-disabled** — no SMTP, notification rules, or email templates configured (notifications are disabled on the PDI).
5. **Single Update Set deliverable** — the final scoped application is exported as one XML at `update-set/x_casemgmt_case_management_update_set.xml` and re-imports on a fresh PDI with zero preview errors.
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
- **Portal URL:** `[instance URL]/x_casemgmt_portal` (or the equivalent portal URL chosen at portal-record creation time).
- **Dashboards:** Agent Workspace + Manager View (visible in the PDI under Performance Analytics → Dashboards after commit).
- **Synthetic seed data:** at least 10 demo cases spanning all six statuses and both case types, plus 3 demo users (one per role) and 1 demo group.

## Install & Deployment

1. **Export Update Set:** Navigate to System Update Sets → Local Update Sets. Locate the scoped application Update Set. Set status to Complete. Export as XML.
2. **Verify Update Set integrity:** Re-import the exported XML on the same instance via System Update Sets → Retrieved Update Sets → Upload. Preview the Update Set. Zero errors required before proceeding. If preview errors exist, resolve them in the source application before re-exporting.
3. **Confirm deployed state:** After successful preview, commit the Update Set. Verify the following are present and functional post-commit: all 3 custom tables visible in App Engine Studio; both Flow Designer flows active (not draft); Experience Portal accessible at `[instance URL]/x_casemgmt_portal` (or equivalent portal URL); both dashboards accessible to users with correct roles; synthetic demo data visible in case list.
4. **Deliver:** Provide the exported Update Set XML file path and the portal URL as final deliverables alongside confirmation that all validation gates passed.

Detailed walkthrough in `docs/deployment.md`. Manual round-trip verification procedure in `scripts/round_trip_verify.md`.

## Validation Gates

Detailed gate definitions live in `docs/validation-gates.md`. The seven gates below are the canonical pass/fail criteria for delivery.

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

Files under `docs/`:

- `docs/data-model.md` — the three-table schema with field/type/constraint tables.
- `docs/state-machine.md` — narrative of the transition matrix and blocking-error messages.
- `docs/acl-matrix.md` — the role × table × CRUD matrix and the "Assigned only" definition.
- `docs/portal-pages.md` — wireframe-level specs for submission and lookup pages.
- `docs/dashboards.md` — widget inventory for both dashboards.
- `docs/validation-gates.md` — the seven-row validation framework with pass criteria.
- `docs/deployment.md` — Update Set export, re-import, preview, and commit walkthrough.

Files under `scripts/`:

- `scripts/seed_demo_data.js` — idempotent server-side seed script (uses `GlideRecord` lookups by `user_name` / `name` / `number`; no hard-coded `sys_id`s).
- `scripts/round_trip_verify.md` — manual procedure for the fresh-PDI re-import preview gate.

## License

The existing top-level repository license file is `LICENSE.txt` (LGPLv3) and applies to the existing ArkCase code. The artifacts under `servicenow-case-management-poc/` are derived semantic re-implementations and not direct ports of any LGPLv3 source code from the ArkCase repository.

No third-party LGPLv3 source code is included or redistributed in this subdirectory.
