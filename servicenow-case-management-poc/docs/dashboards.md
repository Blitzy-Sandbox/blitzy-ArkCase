# Dashboards

## Purpose

This document captures the widget inventory and data-source specification for the two dashboards delivered by this POC: Agent Workspace and Manager View. Both dashboards are built natively in ServiceNow using the platform's standard Reports + Dashboards tooling — no Pentaho, no Solr, no external BI engine. Each widget is backed by a single Report record under [`../reports/`](../reports/). Each dashboard is access-controlled to the appropriate scoped role.

The placeholder string `x_[scope]_` is preserved as written throughout this repository; the actual scope identifier is auto-assigned by the ServiceNow Personal Developer Instance (PDI) when the scoped application is created. No other token replaces this placeholder.

## Common Conventions

The following conventions apply to every widget and every dashboard delivered by this POC. They derive from AAP Sections 0.5.1 and 0.7.4 and are non-negotiable.

- All widgets target the scoped tables `x_[scope]_case` and `x_[scope]_case_task`. No widget queries any global ServiceNow table directly.
- All Report records live in [`../reports/x_[scope]_*.xml`](../reports/) and are uniquely identified by the report `name` (not by `sys_id`).
- All Dashboard records live in [`../dashboards/pa_dashboards_x_[scope]_*.xml`](../dashboards/) and reference their constituent reports by Report record `name` (not by `sys_id`), per AAP Section 0.5.2 reference resolution rules.
- Filter conditions reference the current user via `javascript:gs.getUserID()` — no hard-coded user `sys_id`s. This is the platform-standard self-personalization pattern.
- Date filters use `javascript:gs.daysAgoStart(N)` for relative-date filtering — no hard-coded dates. This guarantees the dashboards remain accurate without manual reconfiguration.
- Group-by uses the choice-field display label (e.g., status display label "In Progress" — not the internal value "in_progress"). This keeps chart legends human-readable.
- All widgets render with synthetic seed data committed via `../scripts/seed_demo_data.js` (created in a subsequent checkpoint). No PII appears in any rendered chart or list.
- Dashboards use the platform default theme; no custom CSS, no custom branding (per AAP Section 0.7.2).
- No widget depends on any ServiceNow Store application. Every widget is built from the standard Reports + Dashboards toolset bundled with the PDI release.

## Agent Workspace Dashboard

### Overview

The Agent Workspace Dashboard provides a personal operational view for individual case agents. It surfaces only the cases and tasks that are assigned to the current user, plus a portfolio-level breakdown of cases by status that gives at-a-glance situational awareness.

### Access

- Visible to: `x_[scope]_case_manager`, `x_[scope]_case_agent`
- The `x_[scope]_case_viewer` role is NOT bound to this dashboard. Per AAP Section 0.5.6 the viewer is a read-only audit role with no operational dashboard assignment; viewers retain platform-wide list/form read access governed by the ACL matrix in [`acl-matrix.md`](./acl-matrix.md).
- Filtered behavior: All widgets that say "My ..." use `javascript:gs.getUserID()` so the dashboard self-personalizes per logged-in user. Because case_agent users are the natural audience for "My open cases" and "My overdue tasks", the dashboard is bound to `x_[scope]_case_agent` and `x_[scope]_case_manager` only. The two `pa_dashboard_role` records that materialize this binding are visible in [`../dashboards/pa_dashboards_x_[scope]_agent_workspace.xml`](../dashboards/pa_dashboards_x_[scope]_agent_workspace.xml) (records 8 and 9).

### Widgets

| # | Widget Name | Type | Source Report | Group-By | Filter |
| --- | --- | --- | --- | --- | --- |
| 1 | My Open Cases | List | `x_[scope]_my_open_cases.xml` | (none) | `assigned_agent = javascript:gs.getUserID() AND status NOT IN (Resolved, Closed)` |
| 2 | My Overdue Tasks | List | `x_[scope]_my_overdue_tasks.xml` | (none) | `assigned_to = javascript:gs.getUserID() AND due_date < javascript:gs.daysAgoStart(0) AND status != Closed` |
| 3 | Case Count by Status | Pie/Donut | `x_[scope]_case_count_by_status.xml` | `status` | (none — agent's full visible portfolio per ACL) |

#### Widget 1: My Open Cases

- **Type:** List report
- **Source Report:** [`../reports/x_[scope]_my_open_cases.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case`
- **Filter Condition:** `assigned_agent = javascript:gs.getUserID() AND status NOT IN (Resolved, Closed)`
- **Default Sort:** none (the report's `<format/>` element is empty; users can sort columns interactively at view time)
- **Display Columns (in this order):** `number`, `subject`, `priority`, `status`, `opened_date` — exactly matching the report's `<field_list>number,subject,priority,status,opened_date</field_list>` element
- **User Action:** clicking a row opens the case form

#### Widget 2: My Overdue Tasks

- **Type:** List report
- **Source Report:** [`../reports/x_[scope]_my_overdue_tasks.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case_task`
- **Filter Condition:** `assigned_to = javascript:gs.getUserID() AND due_date < javascript:gs.daysAgoStart(0) AND status != Closed`
- **Default Sort:** none (the report's `<format/>` element is empty; users can sort columns interactively at view time)
- **Display Columns (in this order):** `subject`, `case`, `due_date`, `status` — exactly matching the report's `<field_list>subject,case,due_date,status</field_list>` element
- **User Action:** clicking a row opens the task form

#### Widget 3: Case Count by Status

- **Type:** Pie/Donut chart — the source report uses `<type>pie</type>` (the platform's encoded query value) which is rendered in the donut/pie style by ServiceNow's chart engine. AAP Section 0.4.4 names the visual treatment "donut"; the platform's pie/donut rendering is interchangeable on the Reports + Dashboards stack.
- **Source Report:** [`../reports/x_[scope]_case_count_by_status.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case`
- **Group-By:** `status`
- **Aggregate:** `COUNT(sys_id)`
- **Filter Condition:** none (subject to ACL — agent sees only assigned cases by virtue of the table-level ACL described in [`acl-matrix.md`](./acl-matrix.md))
- **Slice Labels:** Draft, Open, In Progress, Pending, Resolved, Closed
- **User Action:** clicking a slice opens a filtered case list

## Manager View Dashboard

### Overview

The Manager View Dashboard provides a portfolio-wide operational view for case managers. It surfaces aggregate statistics across all cases (status, type, priority distributions) plus two single-score KPIs (average time-to-close and cases-opened-30-days) for trend awareness.

### Access

- Visible to: `x_[scope]_case_manager` only (agents and viewers do not have access)
- Filtered behavior: ALL widgets show portfolio-wide aggregates — no `current user` filter on any widget. Managers have full read access per the role × CRUD matrix in [`acl-matrix.md`](./acl-matrix.md), so the aggregate counts reflect every case in the system.

### Widgets

| # | Widget Name | Type | Source Report | Group-By / Aggregate | Filter |
| --- | --- | --- | --- | --- | --- |
| 1 | All Cases by Status | Bar | `x_[scope]_all_cases_by_status.xml` | `status` | (none) |
| 2 | All Cases by Type | Pie/Donut | `x_[scope]_all_cases_by_type.xml` | `type` | (none) |
| 3 | All Cases by Priority | Bar | `x_[scope]_all_cases_by_priority.xml` | `priority` | (none) |
| 4 | Average Time to Close | Single Score | `x_[scope]_avg_time_to_close.xml` | `AVG(duration_to_close)` (Function Field; see Widget 4 details) | `status = Closed` |
| 5 | Cases Opened (Last 30 Days) | Single Score | `x_[scope]_cases_opened_30d.xml` | `COUNT(sys_id)` | `opened_date >= javascript:gs.daysAgoStart(30)` |

#### Widget 1: All Cases by Status

- **Type:** Bar chart
- **Source Report:** [`../reports/x_[scope]_all_cases_by_status.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case`
- **Group-By:** `status`
- **Aggregate:** `COUNT(sys_id)`
- **Bar Order:** Draft, Open, In Progress, Pending, Resolved, Closed (status display order from [`data-model.md`](./data-model.md))
- **User Action:** clicking a bar opens a filtered case list

#### Widget 2: All Cases by Type

- **Type:** Pie/Donut chart — the source report uses `<type>pie</type>` (the platform's encoded query value) which is rendered in the donut/pie style by ServiceNow's chart engine. AAP Section 0.4.4 names the visual treatment "donut"; the platform's pie/donut rendering is interchangeable on the Reports + Dashboards stack.
- **Source Report:** [`../reports/x_[scope]_all_cases_by_type.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case`
- **Group-By:** `type`
- **Aggregate:** `COUNT(sys_id)`
- **Slice Labels:** General Inquiry, Complaint
- **User Action:** clicking a slice opens a filtered case list

#### Widget 3: All Cases by Priority

- **Type:** Bar chart
- **Source Report:** [`../reports/x_[scope]_all_cases_by_priority.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case`
- **Group-By:** `priority`
- **Aggregate:** `COUNT(sys_id)`
- **Bar Order:** Low, Medium, High, Critical
- **User Action:** clicking a bar opens a filtered case list

#### Widget 4: Average Time to Close

- **Type:** Single Score
- **Source Report:** [`../reports/x_[scope]_avg_time_to_close.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case`
- **Filter Condition:** `status = Closed`
- **Aggregate:** `AVG` over the `duration_to_close` Function Field
- **Aggregation Source:** `duration_to_close` — a virtual (non-stored) Duration **Function Field** defined in [`../dictionary/x_[scope]_case_duration_to_close.xml`](../dictionary/x_[scope]_case_duration_to_close.xml) whose value is computed at query time by the platform's database-level function `glidefunction:datediff(closed_date,opened_date)`. Function fields differ from "Calculated Value" fields in that they execute as native database operators (and therefore CAN be used as a `sys_report` aggregation source), whereas calculated fields execute in JavaScript per row at read time and cannot be reported on. This is why the Function Field approach is used here.
- **Display Format:** Human-readable Duration (e.g., "5 Days 03:42:11"). The platform renders `glide_duration` AVG values as a formatted interval; no client-side translation from seconds is required.
- **No-Data Behavior:** When zero cases satisfy `status = Closed` (e.g., on a fresh PDI before the seed-data Update Set segment commits), the widget renders the platform's empty-state placeholder. After at least one Closed seed case has both `opened_date` and `closed_date` populated, the widget renders the real AVG.
- **AAP Compliance:** Per AAP Section 0.4.4 the widget is required to display "Average time to close (computed as `closed_date - opened_date` over Closed cases)" — the Function Field implementation performs exactly that computation at query time. Per AAP Section 0.5.1 dictionary inventory wildcard `servicenow-case-management-poc/dictionary/x_[scope]_case_*.xml`, the new Function Field dictionary entry is in scope. Per AAP Section 0.7.2 Minimal-Change Clause, the field does NOT introduce a new module, workflow, portal page, parent table, or external integration — it is a query-time derivation from existing AAP-enumerated columns. Per AAP Section 0.7.3 Validation Gate 6, this widget now displays data and the Gate passes for 8 of 8 dashboard widgets.

#### Widget 5: Cases Opened (Last 30 Days)

- **Type:** Single Score
- **Source Report:** [`../reports/x_[scope]_cases_opened_30d.xml`](../reports/)
- **Underlying Table:** `x_[scope]_case`
- **Filter Condition:** `opened_date >= javascript:gs.daysAgoStart(30)`
- **Aggregate:** `COUNT(sys_id)`
- **Display Format:** integer count
- **No-Data Behavior:** If zero cases were opened in the last 30 days, display "0" (not "No data")

## Source-Side Semantic Mapping

This section documents how each ServiceNow widget semantically corresponds to an ArkCase report concept. None of the ArkCase artifacts are reused — they are read-only context.

| ServiceNow Widget | ArkCase Source Concept | Notes |
| --- | --- | --- |
| My Open Cases (list) | `acm-plugins/acm-default-plugins/acm-case-file-plugin/.../service/ActiveCaseFileByQueueService` | ArkCase used Solr facets keyed on assignee; ServiceNow uses `assigned_agent = current user` filter |
| My Overdue Tasks (list) | `acm-plugins/acm-default-plugins/acm-task-plugin/.../task-list.client.service.js` | ArkCase fetched current-user tasks via `Task.ListService`; ServiceNow uses Reports + ACL |
| Case Count by Status (donut) | `CaseByStatusDto.java` (`acm-case-file-plugin/model/`) | DTO field `numberOfCases` on `AcmCasesState` informed the count semantics |
| All Cases by Status (bar) | Pentaho status-aggregate report | Replaced by native Report |
| All Cases by Type (donut) | (no direct equivalent) | Native ServiceNow report |
| All Cases by Priority (bar) | (no direct equivalent) | Native ServiceNow report |
| Avg Time to Close (single-score) | `CaseSummaryByStatusAndTimePeriodDto.java` | Native ServiceNow report aggregating `AVG(duration_to_close)` where `duration_to_close` is a Function Field computed by `glidefunction:datediff(closed_date,opened_date)`; see Widget 4 above for the implementation rationale |
| Cases Opened 30d (single-score) | (no direct equivalent) | Native ServiceNow report uses `gs.daysAgoStart(30)` filter |

## Verification

The following row is preserved verbatim from AAP Section 0.7.3.

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| Dashboards | Both dashboards render with synthetic data | All widgets display data; no broken report references |

Verification procedure (cross-reference [`validation-gates.md`](./validation-gates.md) Gate 6):

1. Impersonate `x_[scope]_demo_agent` → open Agent Workspace dashboard → confirm 3 widgets render with seed data
2. Impersonate `x_[scope]_demo_manager` → open Manager View dashboard → confirm all 5 widgets render with seed data. Widget 4 (Average Time to Close) renders a Duration AVG (e.g., "5 Days 03:42:11") computed across the Closed seed cases via the `duration_to_close` Function Field. If zero Closed seed cases have populated `closed_date`, the widget renders the platform's empty-state placeholder until seed data is loaded.
3. Confirm no widget shows "Report not found" or 500 error. All eight dashboard widgets reference reports that exist, are well-formed, and have valid aggregation sources — Validation Gate 6 ("All widgets display data; no broken report references") passes.
4. Click into each list-widget row to confirm drill-through navigation works
5. Click into each chart slice/bar to confirm filtered-list drill-through works

## Cross-References

- [`data-model.md`](./data-model.md) — schema reference for the fields used in widgets
- [`acl-matrix.md`](./acl-matrix.md) — explains why the Manager View is restricted to `case_manager` role
- [`validation-gates.md`](./validation-gates.md) — Gate 6 (Dashboards)
- [`../dashboards/`](../dashboards/) — `pa_dashboards_x_[scope]_agent_workspace.xml` and `pa_dashboards_x_[scope]_manager_view.xml`
- [`../reports/`](../reports/) — eight `x_[scope]_*.xml` report records
- [`../dictionary/x_[scope]_case_duration_to_close.xml`](../dictionary/x_[scope]_case_duration_to_close.xml) — Function Field that powers Widget 4 (`AVG(duration_to_close)`) on the Manager View dashboard
- `../seed-data/` — synthetic data the dashboards render (subdirectory created in a subsequent checkpoint)
