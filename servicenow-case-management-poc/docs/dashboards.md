# Dashboards

## Purpose

This document captures the widget inventory and data-source specification for the two dashboards delivered by this POC: Agent Workspace and Manager View. Both dashboards are built natively in ServiceNow using the platform's standard Reports + Dashboards tooling — no Pentaho, no Solr, no external BI engine. Each widget is backed by a single Report record under [`../reports/`](../reports/). Each dashboard is access-controlled to the appropriate scoped role.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

## Common Conventions

The following conventions apply to every widget and every dashboard delivered by this POC. They derive from AAP Sections 0.5.1 and 0.7.4 and are non-negotiable.

- All widgets target the scoped tables `x_casemgmt_case` and `x_casemgmt_case_task`. No widget queries any global ServiceNow table directly.
- All Report records live in [`../reports/x_casemgmt_*.xml`](../reports/) and are uniquely identified by the report `name` (not by `sys_id`).
- All Dashboard records live in [`../dashboards/pa_dashboards_x_casemgmt_*.xml`](../dashboards/) and reference their constituent reports by Report record `name` (not by `sys_id`), per AAP Section 0.5.2 reference resolution rules.
- Filter conditions reference the current user via `javascript:gs.getUserID()`, their groups via `javascript:gs.getUser().getMyGroups()` and their login via `javascript:gs.getUserName()` — no hard-coded user `sys_id`s. This is the platform-standard self-personalization pattern. Each such value must be a single expression; a multi-statement `javascript:` body evaluates to empty on this release.
- **Report execution does not apply row-level read ACLs.** Any widget whose audience is confined to a subset of the rows must carry that confinement in its own filter. Measured for QA finding F5 on the Agent Workspace donut; see Widget 3 below.
- Date filters use `javascript:gs.daysAgoStart(N)` for relative-date filtering — no hard-coded dates. This guarantees the dashboards remain accurate without manual reconfiguration.
- Group-by uses the choice-field display label (e.g., status display label "In Progress" — not the internal value "in_progress"). This keeps chart legends human-readable.
- All widgets render with synthetic seed data committed via [`../scripts/seed_demo_data.js`](../scripts/seed_demo_data.js). No PII appears in any rendered chart or list.
- Dashboards use the platform default theme; no custom CSS, no custom branding (per AAP Section 0.7.2).
- No widget depends on any ServiceNow Store application. Every widget is built from the standard Reports + Dashboards toolset bundled with the PDI release.

## Agent Workspace Dashboard

### Overview

The Agent Workspace Dashboard provides a personal operational view for individual case agents. Every one of its three widgets is scoped to the viewing user: the cases and tasks assigned to them, plus a status breakdown of their own case portfolio that gives at-a-glance situational awareness.

### Access

- Visible to: `x_casemgmt_case_manager`, `x_casemgmt_case_agent`
- The `x_casemgmt_case_viewer` role is NOT bound to this dashboard. Per AAP Section 0.5.6 the viewer is a read-only audit role with no operational dashboard assignment; viewers retain platform-wide list/form read access governed by the ACL matrix in [`acl-matrix.md`](./acl-matrix.md).
- Filtered behavior: All widgets that say "My ..." use `javascript:gs.getUserID()` so the dashboard self-personalizes per logged-in user. Because case_agent users are the natural audience for "My open cases" and "My overdue tasks", the dashboard is bound to `x_casemgmt_case_agent` and `x_casemgmt_case_manager` only.
- **How that binding is actually materialized.** Two records per role, not one, and neither is the field whose name suggests it:
    - `pa_dashboards_permissions` — the dashboard's **share list**. One row per grantee with `type=1` (Role), `role` pointing at the scoped role, and `read=true`. This is the table that decides whether a user may open the dashboard at all; with no row for a user's roles the platform refuses with "The … dashboard has not been shared with you."
    - `pa_dashboards.restrict_to_roles` — the **gate the renderer quotes** when it refuses, verbatim: "… is restricted to following roles: …". It ships from the platform pre-populated with `pa_viewer,pa_contributor`, so leaving it alone locks out every identity that does not hold a base Performance Analytics role. It is set here to this application's own scoped roles instead, which is what lets a `x_casemgmt_case_agent` open the dashboard without being granted a base PA role.
    - `pa_dashboards.roles` is set to the same values for consistency, but note its label is **"Requires Roles"**: it *narrows*, it does not grant. Setting it alone changes nothing.
  An earlier revision of this document described the binding as "two `pa_dashboard_role` records". **There is no `pa_dashboard_role` table on this release** — that element was silently discarded on import, which is why the dashboards were unreachable. See [`validation-gates.md`](./validation-gates.md) Gate 6 for the measured chain.

### Widgets

| # | Widget Name | Type | Source Report | Group-By | Filter |
| --- | --- | --- | --- | --- | --- |
| 1 | My Open Cases | List | `x_casemgmt_my_open_cases.xml` | (none) | `assigned_agent = javascript:gs.getUserID() AND status NOT IN (Resolved, Closed)` |
| 2 | My Overdue Tasks | List | `x_casemgmt_my_overdue_tasks.xml` | (none) | `assigned_to = javascript:gs.getUserID() AND due_date < javascript:gs.daysAgoStart(0) AND status != Closed` |
| 3 | Case Count by Status | Donut | `x_casemgmt_case_count_by_status.xml` | `status` | `assigned_agent = javascript:gs.getUserID() OR assigned_group IN javascript:gs.getUser().getMyGroups() OR sys_created_by = javascript:gs.getUserName()` — the viewing user's own portfolio (see Widget 3) |

#### Widget 1: My Open Cases

- **Type:** List report
- **Source Report:** [`../reports/x_casemgmt_my_open_cases.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case`
- **Filter Condition:** `assigned_agent = javascript:gs.getUserID() AND status NOT IN (Resolved, Closed)`
- **Default Sort:** none (the report's `<format/>` element is empty; users can sort columns interactively at view time)
- **Display Columns (in this order):** `number`, `subject`, `priority`, `status`, `opened_date` — exactly matching the report's `<field_list>number,subject,priority,status,opened_date</field_list>` element
- **User Action:** clicking a row opens the case form

#### Widget 2: My Overdue Tasks

- **Type:** List report
- **Source Report:** [`../reports/x_casemgmt_my_overdue_tasks.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case_task`
- **Filter Condition:** `assigned_to = javascript:gs.getUserID() AND due_date < javascript:gs.daysAgoStart(0) AND status != Closed`
- **Default Sort:** none (the report's `<format/>` element is empty; users can sort columns interactively at view time)
- **Display Columns (in this order):** `subject`, `case`, `due_date`, `status` — exactly matching the report's `<field_list>subject,case,due_date,status</field_list>` element
- **User Action:** clicking a row opens the task form

#### Widget 3: Case Count by Status

- **Type:** **Donut** chart — the source report ships `<type>donut</type>`, which is what AAP Section 0.4.4 and Section 0.5.1 both specify. Earlier revisions shipped `<type>pie</type>` and claimed the two were "interchangeable on the Reports + Dashboards stack"; that was **measured false and is withdrawn**. `donut` is a real `sys_report.type` value on this release (the active choice list offers `pie`, `donut` and `semi_donut`, and out-of-box reports use `donut`), and the type on the *report* is what decides the rendering — there is no widget-level promotion of a pie into a donut. Rendered as `pie`, the chart painted a solid disc: the Highcharts series carried no `innerSize` and the slice path's inner arc collapsed to `A 0 0 0 0 1 …`. Rendered as `donut` it carries `innerSize: "70%"` and a real inner arc (measured `innerR` 67.795 against `r` 96.85 in the dashboard widget, and 98.98 against 141.4 when the report is opened on its own — a 70% hole at both sizes).
- **Source Report:** [`../reports/x_casemgmt_case_count_by_status.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case`
- **Group-By:** `status`
- **Aggregate:** `COUNT(sys_id)`
- **Filter Condition:** `assigned_agent=javascript:gs.getUserID()^ORassigned_groupINjavascript:gs.getUser().getMyGroups()^ORsys_created_by=javascript:gs.getUserName()`
- **Slice Labels:** Draft, Open, In Progress, Pending, Resolved, Closed
- **User Action:** clicking a slice opens a filtered case list

**Why this widget is filtered (QA finding F5).** An earlier revision shipped this report with an empty filter and described it as "unfiltered by design — the whole team's backlog", on the assumption that the table-level read ACL would narrow the aggregate for an agent. **That assumption is measured false: report execution does not apply row-level read ACLs.** Under the `x_casemgmt_demo_agent` persona the donut aggregated every case on the instance and disclosed the status distribution of records the same persona is refused on every other surface (the form answers "Security constraints prevent access to requested page"; the Table API answers HTTP 404). Only counts leaked — no subject, number or other record content — but the number of cases sitting in each lifecycle stage is exactly what an "Assigned only" grant withholds.

The filter now mirrors the three limbs of the agent read ACL ([`../acl/x_casemgmt_case_read_agent_assigned.xml`](../acl/)), so the donut totals precisely what the viewer can open. Two implementation notes worth keeping:

- Each limb must be a **single expression**. Measured on this instance, a `javascript:` filter value written as an IIFE or as a multi-statement body evaluates to empty, and an empty value on the `=` operator silently degrades to "field is empty" — a filter written that way would quietly answer the wrong question. `gs.getUserID()`, `gs.getUser().getMyGroups()` and `gs.getUserName()` are all single expressions and were each verified to evaluate under impersonation.
- No hard-coded `sys_id` is introduced: the user, their group memberships and their user_name are resolved at execution time, per AAP Section 0.7.2.

**Where the AAP tension lands.** Section 0.5.1's transformation table describes this row only as a "Donut grouped by status" and mentions no filter, which is how the empty filter was first justified. Section 0.5.6 confines `case_agent` to "Read ✅ Assigned only" and Section 0.7.3 Gate 3 states it verbatim ("case_agent cannot access unassigned cases"), and Section 0.4.4 puts this widget on the **Agent Workspace** beside two per-viewer "My …" lists. A descriptive sentence in the transformation table cannot widen an access-control mandate, so the per-viewer reading is the one that satisfies the normative requirements. The portfolio-wide aggregate the AAP does call for is untouched: the Manager View keeps the deliberately unfiltered "All Cases by Status" bar chart, on a dashboard shared only with `x_casemgmt_case_manager`. The widget's title remains "Case Count by Status" exactly as Section 0.4.4 names it.

**Consequence for the manager, stated plainly.** The Agent Workspace is shared with `x_casemgmt_case_manager` too, so a manager holding no assignments now sees an empty donut *on this dashboard* — the same outcome its two sibling "My …" widgets already produce for that persona, and the reason Section 0.4.4 gives the manager a separate Manager View.

## Manager View Dashboard

### Overview

The Manager View Dashboard provides a portfolio-wide operational view for case managers. It surfaces aggregate statistics across all cases (status, type, priority distributions) plus two single-score KPIs (average time-to-close and cases-opened-30-days) for trend awareness.

### Access

- Visible to: `x_casemgmt_case_manager` only (agents and viewers do not have access)
- Filtered behavior: ALL widgets show portfolio-wide aggregates — no `current user` filter on any widget. Managers have full read access per the role × CRUD matrix in [`acl-matrix.md`](./acl-matrix.md), so the aggregate counts reflect every case in the system.

### Widgets

| # | Widget Name | Type | Source Report | Group-By / Aggregate | Filter |
| --- | --- | --- | --- | --- | --- |
| 1 | All Cases by Status | Bar (+ accessible data grid) | `x_casemgmt_all_cases_by_status.xml` | `status` | (none) |
| 2 | All Cases by Type | Donut | `x_casemgmt_all_cases_by_type.xml` | `type` | (none) |
| 3 | All Cases by Priority | Bar (+ accessible data grid) | `x_casemgmt_all_cases_by_priority.xml` | `priority` | (none) |
| 4 | Average Time to Close | Single Score | `x_casemgmt_avg_time_to_close.xml` | `AVG(duration_to_close)` (Function Field; see Widget 4 details) | `status = Closed` |
| 5 | Cases Opened (Last 30 Days) | Single Score | `x_casemgmt_cases_opened_30d.xml` | `COUNT(sys_id)` | `opened_date >= javascript:gs.daysAgoStart(30)` |

#### Widget 1: All Cases by Status

- **Type:** Bar chart
- **Source Report:** [`../reports/x_casemgmt_all_cases_by_status.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case`
- **Group-By:** `status`
- **Aggregate:** `COUNT(sys_id)`
- **Bar Order:** Draft, Open, In Progress, Pending, Resolved, Closed (status display order from [`data-model.md`](./data-model.md))
- **User Action:** clicking a bar opens a filtered case list
- **`display_grid = true`** — the report also renders an accessible HTML data table under the chart. See [Accessible values for the two bar widgets (QA finding F8)](#accessible-values-for-the-two-bar-widgets-qa-finding-f8).

#### Widget 2: All Cases by Type

- **Type:** **Donut** chart — the source report ships `<type>donut</type>`, which is what AAP Section 0.4.4 and Section 0.5.1 both specify. Earlier revisions shipped `<type>pie</type>` and claimed the two were "interchangeable on the Reports + Dashboards stack"; that was **measured false and is withdrawn**. `donut` is a real `sys_report.type` value on this release (the active choice list offers `pie`, `donut` and `semi_donut`, and out-of-box reports use `donut`), and the type on the *report* is what decides the rendering — there is no widget-level promotion of a pie into a donut. Rendered as `pie`, the chart painted a solid disc: the Highcharts series carried no `innerSize` and the slice path's inner arc collapsed to `A 0 0 0 0 1 …`. Rendered as `donut` it carries `innerSize: "70%"` and a real inner arc (measured `innerR` 67.795 against `r` 96.85 in the dashboard widget, and 98.98 against 141.4 when the report is opened on its own — a 70% hole at both sizes).
- **Source Report:** [`../reports/x_casemgmt_all_cases_by_type.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case`
- **Group-By:** `type`
- **Aggregate:** `COUNT(sys_id)`
- **Slice Labels:** General Inquiry, Complaint
- **User Action:** clicking a slice opens a filtered case list

#### Widget 3: All Cases by Priority

- **Type:** Bar chart
- **Source Report:** [`../reports/x_casemgmt_all_cases_by_priority.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case`
- **Group-By:** `priority`
- **Aggregate:** `COUNT(sys_id)`
- **Bar Order:** Low, Medium, High, Critical
- **User Action:** clicking a bar opens a filtered case list
- **`display_grid = true`** — the report also renders an accessible HTML data table under the chart. See [Accessible values for the two bar widgets (QA finding F8)](#accessible-values-for-the-two-bar-widgets-qa-finding-f8).

#### Accessible values for the two bar widgets (QA finding F8)

Both bar widgets ship `display_grid = true` on their source report. This is an **accessibility remedy, not a cosmetic choice**, and it is the only in-scope one available.

**The defect.** Measured on the rendered Manager View, every bar of both charts announces `100.0%` to assistive technology while its hover tooltip carries the true share:

| Chart | Announced to AT (verbatim) | Announced in the tooltip (verbatim) |
| --- | --- | --- |
| All Cases by Status | `1. Draft, 7, 100.0%` · `2. Closed, 2, 100.0%` · `3. In Progress, 2, 100.0%` · `4. Open, 2, 100.0%` · `5. Resolved, 2, 100.0%` · `6. Pending, 1, 100.0%` | `Draft = 7 (43.75%)` · `Closed = 2 (12.5%)` · `In Progress = 2 (12.5%)` · `Open = 2 (12.5%)` · `Resolved = 2 (12.5%)` · `Pending = 1 (6.25%)` |
| All Cases by Priority | `1. Medium, 7, 100.0%` · `2. High, 4, 100.0%` · `3. Low, 3, 100.0%` · `4. Critical, 2, 100.0%` | `Medium = 7 (43.75%)` · `High = 4 (25%)` · `Low = 3 (18.75%)` · `Critical = 2 (12.5%)` |

The counts are never wrong. The cause is that the platform sets `accessibility.point.valueDescriptionFormat = "{index}. {point.name}, {point.y}, {point.percentage:.1f}%"` for every chart, and Highcharts computes `point.percentage` **per stack** — on a non-stacked column series each point is its own stack, so `point.percentage === 100` for every bar (measured: `y=7 percentage=100 total=7`, `y=2 percentage=100 total=2`, …). ServiceNow's tooltip formatter divides by the report total instead, hence the discrepancy. The "All Cases by Type" donut of the same data announces correctly (`1. General Inquiry, 10, 62.5%`) because a pie series shares one stack.

**What is NOT done.** The QA report's suggested fix — render the two charts as donuts — is unavailable: AAP Section 0.4.4 and Section 0.5.1 both mandate a **bar chart** for "All cases by status" and "All cases by priority". The chart type stays `bar` (verified after the change: Highcharts `series[0].type === "column"`, widget bootstrap `repParams.chart_type === "bar"`).

**What IS done.** `display_grid` is a stock, additive `sys_report` boolean ("Display grid") with out-of-the-box precedent on this instance (4 of the 182 `type=bar` reports enable it). With it enabled each bar widget renders `table.chart_legend.display-grid-table` — a real `<thead>`, `th scope="col"` headers, `th scope="row"` row headers, a bold total row — which is **not** inside any `aria-hidden="true"` ancestor and computes to `display:table; visibility:visible` with non-zero offsets, so assistive technology can read it. Its "Percentage of Count" column carries the correct shares:

| Status | Case Count | Percentage of Count |     | Priority | Case Count | Percentage of Count |
| --- | --- | --- | --- | --- | --- | --- |
| Draft | 7 | 43.75% |  | Medium | 7 | 43.75% |
| Closed | 2 | 12.5% |  | High | 4 | 25% |
| In Progress | 2 | 12.5% |  | Low | 3 | 18.75% |
| Open | 2 | 12.5% |  | Critical | 2 | 12.5% |
| Resolved | 2 | 12.5% |  | **Total** | **16** | **100%** |
| Pending | 1 | 6.25% |  |  |  |  |
| **Total** | **16** | **100%** |  |  |  |  |

(16 cases were present at measurement time: the 13 package rows plus three transient QA fixtures, since deleted.)

**Re-measured at the package baseline** once those fixtures were removed, which is what a fresh install shows: the Status grid reads Draft 4 / 30.77%, Closed 2 / 15.38%, In Progress 2 / 15.38%, Open 2 / 15.38%, Resolved 2 / 15.38%, Pending 1 / 7.69%, **Total 13 / 100%**, and the Priority grid reads Medium 5 / 38.46%, High 4 / 30.77%, Critical 2 / 15.38%, Low 2 / 15.38%, **Total 13 / 100%** — both matching a direct `GlideAggregate`-equivalent count of the three tables. The two grid elements measure 353 × 228 px and 353 × 173 px, their element ids embed their source report's sys_id, and the per-bar announcements are unchanged (`1. Draft, 4, 100.0%` … `4. Low, 2, 100.0%`) while the donut of the same data still announces correctly (`61.5%` / `38.5%`), which is the residue below.

**Residue, bounded by AAP Section 0.3.2.** The grid gives assistive technology a correct route to the values; it does not rewrite the point description. Re-measured after the change, the bars still announce the same `100.0%` strings and the screen-reader information region is unchanged (`Bar chart with 6 bars.` / `The chart has 1 Y axis displaying Case Count. Range: 0 to 8.` / `End of interactive chart.`). Correcting the announcement means editing `accessibility.point.valueDescriptionFormat` for column series inside the platform's own charting bundle (`GlideV2ChartingIncludes.jsx` / `chart_includes.cssx`) — a **global** artifact, and AAP Section 0.3.2 prohibits "Global scope changes of any kind" while Section 0.7.2 requires "zero global-scope writes". No scoped `sys_report` column overrides that template on this release: `custom_config` carries only chart `transforms` in every out-of-box row, `style_config` is empty on every report on the instance, `show_chart_total` is enabled by none of the 182 bar reports, and the widget's Highcharts context menu offers only "Save as PNG" / "Save as JPEG" (no "View data table" item). Two measured caveats on the grid itself: it declares no `role` and no caption, so it is announced as an unlabeled table next to the chart; and it sits below the chart inside the widget's `overflow:auto` body (client height 305px vs scroll height 538px), so a sighted user must scroll within the widget to reach it and there is no chart-vs-grid toggle.

#### Widget 4: Average Time to Close

- **Type:** Single Score
- **Source Report:** [`../reports/x_casemgmt_avg_time_to_close.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case`
- **Filter Condition:** `status = Closed`
- **Aggregate:** `AVG` over the `duration_to_close` Function Field
- **Aggregation Source:** `duration_to_close` — a non-stored Duration **Function Field** defined in [`../dictionary/x_casemgmt_case_duration_to_close.xml`](../dictionary/x_casemgmt_case_duration_to_close.xml) whose value is computed at query time by the platform's database-level function `glidefunction:datediff(closed_date,opened_date)`. Its dictionary row must carry **`virtual = false`**: it shipped with `virtual = true`, which makes the platform look for a `virtual_type` script provider that does not exist, and the column returned **empty for every Closed case** — so this widget had nothing to average. With `virtual = false` the field returns real durations (`CASE0000984` → `18 Days`, `CASE0000988` → `14 Days`, measured). Function fields differ from "Calculated Value" fields in that they execute as native database operators (and therefore CAN be used as a `sys_report` aggregation source), whereas calculated fields execute in JavaScript per row at read time and cannot be reported on. This is why the Function Field approach is used here.
- **Display Format:** Human-readable Duration (e.g., "5 Days 03:42:11"). The platform renders `glide_duration` AVG values as a formatted interval; no client-side translation from seconds is required.
- **No-Data Behavior:** When zero cases satisfy `status = Closed` (e.g., on a fresh PDI before the seed-data Update Set segment commits), the widget renders the platform's empty-state placeholder. After at least one Closed seed case has both `opened_date` and `closed_date` populated, the widget renders the real AVG.
- **AAP Compliance:** Per AAP Section 0.4.4 the widget is required to display "Average time to close (computed as `closed_date - opened_date` over Closed cases)" — the Function Field implementation performs exactly that computation at query time. Per AAP Section 0.5.1 dictionary inventory wildcard `servicenow-case-management-poc/dictionary/x_casemgmt_case_*.xml`, the new Function Field dictionary entry is in scope. Per AAP Section 0.7.2 Minimal-Change Clause, the field does NOT introduce a new module, workflow, portal page, parent table, or external integration — it is a query-time derivation from existing AAP-enumerated columns. Per AAP Section 0.7.3 Validation Gate 6, this widget now displays data and the Gate passes for 8 of 8 dashboard widgets.

#### Widget 5: Cases Opened (Last 30 Days)

- **Type:** Single Score
- **Source Report:** [`../reports/x_casemgmt_cases_opened_30d.xml`](../reports/)
- **Underlying Table:** `x_casemgmt_case`
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

1. Impersonate `x_casemgmt_demo_agent` → open Agent Workspace dashboard → confirm 3 widgets render with seed data
2. Impersonate `x_casemgmt_demo_manager` → open Manager View dashboard → confirm all 5 widgets render with seed data. Widget 4 (Average Time to Close) renders a Duration AVG computed across the Closed seed cases via the `duration_to_close` Function Field. If zero Closed seed cases have populated `closed_date`, the widget renders the platform's empty-state placeholder until seed data is loaded.
3. Confirm no widget shows "Report not found" or 500 error. All eight dashboard widgets reference reports that exist, are well-formed, and have valid aggregation sources — Validation Gate 6 ("All widgets display data; no broken report references") passes.
4. Click into each list-widget row to confirm drill-through navigation works
5. Click into each chart slice/bar to confirm filtered-list drill-through works

### Measured outcome of that procedure

Run in a browser against the verification instance with the seeded 10 cases / 10 tasks / 8 parties. Chart values
were read from each chart's per-point accessibility labels rather than estimated from pixels.

| Persona | Dashboard | Result |
| --- | --- | --- |
| `x_casemgmt_demo_manager` | Manager View | **5 of 5 widgets.** Status bar Draft 1, Open 2, In Progress 2, Pending 1, Resolved 2, Closed 2 · Type donut General Inquiry 6 (60%), Complaint 4 (40%) · Priority bar High 3, Medium 3, Critical 2, Low 2 · Average Time to Close **16 Days 0 Hours 0 Minutes** (the mean of an 18-day and a 14-day closed case) · Cases Opened in Last 30 Days **10** |
| `x_casemgmt_demo_manager` | Agent Workspace | **3 of 3 widgets.** The two "My …" lists render real list frames with their column headers and "No records to display", which is the correct outcome for a manager holding no assignments. Case Count by Status drew the six-slice donut when the report was unfiltered; since the QA-F5 re-scoping it renders the manager's own portfolio, which for a manager holding no assignments is empty — consistent with the other two widgets on this dashboard |
| `x_casemgmt_demo_agent` | Agent Workspace | **3 of 3 widgets.** *My Open Cases* lists exactly the three cases this agent is assigned and that are not Resolved or Closed; a DOM-wide scan for case numbers returns only those three, so the row-level "Assigned only" ACL is visibly in force. *My Overdue Tasks* renders an empty list frame, correct because every open seed task is due in the future |
| `x_casemgmt_demo_agent` | Manager View | **Correctly refused** — "has not been shared with you". The agent holds no `pa_dashboards_permissions` row on this dashboard |
| `x_casemgmt_demo_viewer` | either | **Correctly refused.** This is the documented design recorded under Access above, not a defect |

The empty-state string "Add widgets using the widget picker." is programmatically absent from both dashboards, and
both render with 0 console errors and 0 network responses ≥ 400. Note that each dashboard's `<h1>` shows its
internal name (`x_casemgmt_agent_workspace`, `x_casemgmt_manager_view`) because `pa_dashboards` has **no** `title`
column on this release — cosmetic, and not something a caption in an artifact can change.

## Cross-References

- [`data-model.md`](./data-model.md) — schema reference for the fields used in widgets
- [`acl-matrix.md`](./acl-matrix.md) — explains why the Manager View is restricted to `case_manager` role
- [`validation-gates.md`](./validation-gates.md) — Gate 6 (Dashboards)
- [`../dashboards/`](../dashboards/) — `pa_dashboards_x_casemgmt_agent_workspace.xml` and `pa_dashboards_x_casemgmt_manager_view.xml`
- [`../reports/`](../reports/) — eight `x_casemgmt_*.xml` report records
- [`../dictionary/x_casemgmt_case_duration_to_close.xml`](../dictionary/x_casemgmt_case_duration_to_close.xml) — Function Field that powers Widget 4 (`AVG(duration_to_close)`) on the Manager View dashboard
- [`../seed-data/`](../seed-data/) — synthetic data the dashboards render
