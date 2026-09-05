# ACL Matrix

## Purpose

This document captures the role × table × CRUD authorization matrix for the ServiceNow scoped application POC. Three named scoped roles (`x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`) replace ArkCase's `ApplicationRolesToPrivilegesConfig`-based privilege resolution. Authorization is enforced through table-level ACLs (read, write, create, delete) and field-level ACLs on the sensitive fields `assigned_group` and `assigned_agent`, plus three field-level `query_range` grants on the date columns the dashboards filter by (see [Field-level `query_range` grants](#field-level-query_range-grants-on-the-three-date-columns-qa-finding-f17)). All 29 ACLs live in the `x_casemgmt` scope; no global ACLs are modified.

**One part of the matrix is not delivered at runtime, and it is not the ACLs' fault.** The `organization` column on `x_casemgmt_case_party` references the out-of-box global table `core_company`, whose `read` operation is role-gated to roles none of the three scoped roles holds — so Organization parties are unusable for every scoped role, including `case_manager`, and are reachable only by an `admin`. The full measured account, the three candidate remedies, the AAP section that blocks each of them and the exact records a human would have to authorise are in [Organization parties are not usable by any of the three scoped roles](#organization-parties-are-not-usable-by-any-of-the-three-scoped-roles-qa4-issue-5--blocked-awaiting-human-authorization). Read that section before relying on the `case_manager` "Read All / Write All / Create" cells below.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

## Role × CRUD Matrix

The following table is preserved verbatim from AAP Section 0.5.6 and serves as the canonical authorization contract for the three custom tables (`x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`).

| Role | Create | Read | Write | Delete |
| --- | --- | --- | --- | --- |
| x_casemgmt_case_manager | ✅ | ✅ All | ✅ All | ✅ |
| x_casemgmt_case_agent | ✅ | ✅ Assigned only | ✅ Assigned only | ❌ |
| x_casemgmt_case_viewer | ❌ | ✅ All | ❌ | ❌ |

"Assigned only" = cases where `assigned_agent` = current user OR `assigned_group` contains current user.

ACLs MUST be defined at table level AND field level for sensitive fields (`assigned_group`, `assigned_agent`). ACLs MUST be scoped — no global ACL modifications.

## "Assigned only" Definition

The "Assigned only" qualifier on the `case_agent` row of the matrix means an agent's read and write access is restricted to cases where the agent is either the directly-assigned agent OR a member of the assigned group. This is the only scope-narrowing condition in the matrix; managers and viewers see all cases.

### Logical expression

```
assigned_agent == current_user OR assigned_group ∈ current_user_group_membership
```

### ACL Condition Script

The canonical implementation pattern below appears in every "Assigned only" ACL record (`x_casemgmt_case_read_agent_assigned`, `x_casemgmt_case_write_agent_assigned`, and the parent-case-aware variants on `case_task` and `case_party`).

```javascript
// ACL condition script for x_casemgmt_case_read_agent_assigned and *_write_agent_assigned
(function() {
    if (current.assigned_agent == gs.getUserID()) {
        return true;
    }
    var grpGr = new GlideRecord('sys_user_grmember');
    grpGr.addQuery('user', gs.getUserID());
    grpGr.addQuery('group', current.assigned_group);
    grpGr.query();
    return grpGr.next();
})();
```

This script uses NO hard-coded `sys_id`s — both lookups resolve through `gs.getUserID()` and the foreign-key value on `current.assigned_group` (which itself was resolved by `name` lookup at seed time per AAP Section 0.5.2 reference resolution rules).

### "Assigned only" — the create-path limbs (QA finding F4)

AAP Section 0.5.6 grants `x_casemgmt_case_agent` **Create ✅** on the same matrix row that restricts its Read and Write to "Assigned only". Those two statements collide on the insert path, because a case an agent creates is necessarily **unassigned at the moment it is created**:

- `assigned_group` is manager-only (field-level ACL [`../acl/x_casemgmt_case_assigned_group_field_acl.xml`](../acl/)), so an agent cannot self-assign a group on insert; and
- nothing populates `assigned_agent` during an insert the agent drives.

Evaluated literally against that half-built row, the "Assigned only" predicate returns false, which produced the two halves of QA finding F4:

1. the table-level **write** ACL is evaluated once per column during an insert, so every field value the agent supplied was discarded and the row landed as a blank shell while the create ACL still admitted it (measured: an agent-created case with `subject`, `description`, `requester_name` and `type` all empty); and
2. the table-level **read** ACL then hid the row from the agent who had just created it (form load answered "Security constraints prevent access to requested page"; the row was absent from the agent's list).

Both defects were reproduced and re-verified on the rendered form. A third symptom of the same root cause surfaced during that re-verification: because the read ACL is evaluated per column when the platform renders a form, and a **New** form's row has not been inserted yet, the agent was rendered a case form with **zero fields** and could reach a usable form only by submitting the blank one and working on the redisplay. The two ACLs therefore carry three limbs between them, and only three:

| ACL record | Limb added | Why it is the minimum |
| --- | --- | --- |
| [`x_casemgmt_case_write_agent_assigned`](../acl/x_casemgmt_case_write_agent_assigned.xml) | `current.isNewRecord()` | True only while the row is being inserted. "Assigned only" is a statement about which **existing** records an agent may reach, and is logically inapplicable to a record that does not exist yet — the same reasoning the create ACL already records for running unconditionally. Field values supplied by the agent now persist. |
| [`x_casemgmt_case_read_agent_assigned`](../acl/x_casemgmt_case_read_agent_assigned.xml) | `current.isNewRecord()` | The read ACL is evaluated per column when the platform renders a form, including the **New** form. Without this limb the agent was rendered a case form with **zero fields** (measured on the rendered form; `g_form.getEditableFields()` was empty and the app's own client script logged "bound 0 of 4 mandatory field control(s); not on form or not readable: subject, status, description, requester_name"), and could only reach a usable form by submitting the blank one and working on the redisplay — which consumed a case number. AAP Section 0.7.4 requires cases to be creatable "via both internal UI and external portal", so seeing the form one is filling in is part of the Create grant. The limb exposes no stored data: a not-yet-inserted row holds only the defaults and the caller's own keystrokes. |
| [`x_casemgmt_case_read_agent_assigned`](../acl/x_casemgmt_case_read_agent_assigned.xml) | `current.sys_created_by == gs.getUserName()` | A Create grant that yields a record its author cannot read is not a working grant. `sys_created_by` is written once by the platform during the insert and is read-only afterwards (no ACL in this application grants write on it and it appears on no form layout), so this limb can only ever expose a record **the same user created**. |

**Exactly what the extension does and does not widen.** It is an extension of Section 0.5.6's verbatim "Assigned only" definition and is recorded here as such:

- Every already-inserted case the agent did **not** author is still governed solely by the two verbatim limbs. All package-seeded cases carry `sys_created_by = admin` and every anonymous portal case carries `sys_created_by = guest`, so the creator limb reaches none of them. AAP Section 0.7.3 Gate 3 ("case_agent cannot access unassigned cases") continues to hold: measured after the change, the agent's readable set was exactly its 11 assigned cases, and the two unassigned seeded Draft cases answered HTTP 404 "Record doesn't exist or ACL restricts the record retrieval" over the Table API.
- `isNewRecord()` grants nothing on the update path, and the two field-level ACLs still evaluate on the insert, so an agent inserting a case still cannot set `assigned_group`.
- Content of a created row is not an ACL concern and is enforced independently by [`../business_rules/x_casemgmt_validate_case_mandatory_fields.xml`](../business_rules/) (order 50), which refuses an insert with an empty `subject`, `description` or `requester_name` and names the offending field.
- **Write on the agent's own creation is deliberately NOT granted.** After the insert completes, a case the agent created but that no manager has assigned yet is readable to its author and not writable by it (measured: `PATCH` → HTTP 403 `ACL Exception Update Failed due to security constraints`). Section 0.5.6's Write cell says "Assigned only" without a creator exemption, and an agent can supply every field it needs in the insert itself, so no creator limb is added to the write ACL beyond the insert path. Once a manager sets `assigned_group` or `assigned_agent`, the ordinary "Assigned only" grant applies and the agent can edit the case.

## Per-Role Narrative

### x_casemgmt_case_manager

Full operational authority over the case domain. Can create, read, update, and delete cases, tasks, and parties. Can write to `assigned_group` and `assigned_agent` on any case (including reassigning). Has the authority to perform the Resolved → Closed transition (the only role that can).

**Granted privileges:**

- **Create:** all three tables (`x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`)
- **Read:** all rows on all three tables
- **Write:** all rows + all fields including `assigned_group` and `assigned_agent`
- **Delete:** all three tables (only role with delete authority)
- **Resolved → Closed transition:** authorized by `validate_closed_transition` subflow's role check

**Typical operations:**

- Reassign cases between agents/groups
- Close cases that have been resolved
- Delete demo/draft cases that are no longer needed
- View the Manager View dashboard

### x_casemgmt_case_agent

Operational authority scoped to the agent's own assignments. Can create cases (typically on behalf of internal stakeholders), but only read and write cases where the agent is the directly-assigned agent OR a member of the assigned group. Cannot delete. Cannot edit `assigned_group`. Can edit `assigned_agent` only on cases they are the assigned agent for.

**Granted privileges:**

- **Create:** `x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`
- **Read:** scoped by "Assigned only" condition, plus the records the agent created itself (see "Assigned only — the create-path limbs" above)
- **Write:** scoped by "Assigned only" condition, plus the insert path itself (`current.isNewRecord()`), so field values supplied on create persist; field-level ACL prevents writing `assigned_group`
- **Delete:** none
- **Resolved → Closed:** NOT authorized (validate_closed_transition rejects)

**Typical operations:**

- Open Draft → Open transition (after `assigned_group` is set by manager)
- In Progress, Pending, Resolved transitions on assigned cases
- Add tasks and parties to assigned cases
- View the Agent Workspace dashboard

### x_casemgmt_case_viewer

Read-only authority across all cases. Auditor-style role for users who need visibility but not authorship. Cannot perform any state transitions, cannot create or modify any record.

**Granted privileges:**

- **Create:** none
- **Read:** all rows on all three tables (no assignment filter)
- **Write:** none
- **Delete:** none
- State transitions: NOT authorized (form is effectively read-only)

**Typical operations:**

- Browse the case list and individual case forms in read-only mode. Measured: the viewer reads all 10 seed cases,
  all 10 tasks and all 8 parties; inline edit is refused by the platform with "Security prevents writing to this
  field"; no **New** button renders on any of the three lists; every field on the case form is read-only; and no
  state-transition UI Action is present.
- Inspect the related lists on a case form (Case Tasks, Case Parties), read-only. The related-list definition is
  a base definition with an empty `sys_user`, so it applies to the viewer exactly as it does to the manager and
  the agent — verified rendering identically for all three.
- **The viewer has no dashboard.** An earlier revision of this document listed "View the Agent Workspace
  dashboard" here. That was wrong and has been retracted: the viewer is deliberately not bound to either
  dashboard, as recorded under Access in [`dashboards.md`](./dashboards.md), and AAP Section 0.4.4 names only
  `case_manager` and `case_agent` as the audiences for the aggregate views. Opening either dashboard as the
  viewer is refused, and that refusal is the design. The viewer's read-all grant is over the record data, not
  over the operational dashboards.

## Field-Level ACLs

Per AAP Section 0.5.6, field-level ACLs MUST be authored on the sensitive fields `assigned_group` and `assigned_agent` to prevent agents and viewers from modifying these even when they have table-level write access.

| Field | Read | Write Restricted To | ACL Record File |
| --- | --- | --- | --- |
| `x_casemgmt_case.assigned_group` | All authenticated roles | `x_casemgmt_case_manager` only | [`../acl/x_casemgmt_case_assigned_group_field_acl.xml`](../acl/) |
| `x_casemgmt_case.assigned_agent` | All authenticated roles | `x_casemgmt_case_manager` AND any `x_casemgmt_case_agent` who is on the case per "Assigned only" (the stored `assigned_agent` is the caller **or** the stored `assigned_group` contains the caller) | [`../acl/x_casemgmt_case_assigned_agent_field_acl.xml`](../acl/) |

**Related rules:**

- Field-level ACLs run in addition to (NOT instead of) table-level ACLs.
- The `assigned_group` field-level ACL prevents an agent from reassigning their own case to a different group. It stays manager-only: AAP Section 0.5.1 states "write restricted to manager" for this column, and the agent can neither set nor clear it, so it carries no one-way door.
- The `assigned_agent` field-level ACL allows any agent the stored row places on the case — the stored `assigned_agent` is the caller, **or** the stored `assigned_group` contains the caller — to update the field (reassign to a peer in the same group, hand off, or take an unassigned case out of their own group's queue), and the manager can always override.

**Why the `assigned_agent` grant reads both "Assigned only" limbs (QA finding F6).** Both limbs are evaluated against the **stored** row. An earlier revision granted only on the `assigned_agent == caller` limb, which produced a one-way door: an assigned agent could **clear** `assigned_agent` (the stored value was still theirs when the ACL ran) but could never **re-populate** it (the stored value was now empty), so an agent could permanently orphan a case from their own queue and only a manager could recover it. Measured on CASE9000003: clear → HTTP 200 and the value gone; re-populate → HTTP 200 with the value silently discarded; after the group limb was added, re-populate → HTTP 200 with the value stored.

**Why no business rule reports a denied field write.** A field-level denial is a silent drop by platform design: the request still returns HTTP 200 (or a normal form save) with that one column discarded. A temporary before-update probe on `x_casemgmt_case` measured that the ACL engine strips the value **before** business rules run — on one request the denied column reported `changes() === false` while an allowed column on the same request reported `changes() === true`, and when *every* submitted column was denied the update was abandoned outright and no before-rule ran at all. A guard rule that aborts with "you may not write this field" therefore cannot exist: there is nothing for it to observe. The restriction is instead communicated **before** the write on the surface AAP Section 0.7.1 cares about — the form renders `assigned_group` (and `assigned_agent`, where not granted) read-only and greyed for the agent, and the platform refuses inline list edits with "Security prevents writing to this field". Callers using the Table API directly receive the platform-standard silent drop, and the two limbs above ensure the drop no longer costs an agent access to their own case.

### Field-level `query_range` grants on the three date columns (QA finding F17)

Three further field-level ACLs exist that are not part of AAP Section 0.5.6's read/write/create/delete matrix, because they govern a different operation. The platform has a distinct ACL operation named **`query_range`** which decides whether a **range** predicate on a column — `BETWEEN`, `>`, `<`, `>=`, `<=`, and the relative-date operators the list filter builds — may participate in the query's `WHERE` clause. It does not decide which rows come back: that remains entirely the business of each role's `read` ACL, so an agent filtering by date still sees only the cases "Assigned only" grants them.

| ACL | Operation | Granted to | Record file |
| --- | --- | --- | --- |
| `x_casemgmt_case.opened_date` | `query_range` | all three scoped roles | [`../acl/x_casemgmt_case_query_range_opened_date.xml`](../acl/x_casemgmt_case_query_range_opened_date.xml) |
| `x_casemgmt_case.closed_date` | `query_range` | all three scoped roles | [`../acl/x_casemgmt_case_query_range_closed_date.xml`](../acl/x_casemgmt_case_query_range_closed_date.xml) |
| `x_casemgmt_case_task.due_date` | `query_range` | all three scoped roles | [`../acl/x_casemgmt_case_task_query_range_due_date.xml`](../acl/x_casemgmt_case_task_query_range_due_date.xml) |

These three take the scope from **26 ACLs to 29**, and from **27 `sys_security_acl_role` link rows to 36** (three roles on each new ACL). Both figures are what `scripts/post_import_remediation.js` now asserts.

**The operation is stored as a reference, and this package ships the name rather than the sys_id.** `read`, `write`, `create` and `delete` each have a `sys_security_operation` row whose `sys_id` equals its `name`, so an ACL payload carrying the literal string imports correctly. `query_range` does not — its row is a random sys_id — so a payload carrying the literal `query_range` imports as an **unresolvable reference**, and an ACL whose operation does not resolve grants nothing. AAP Section 0.7.2 forbids shipping the sys_id, so the artifacts keep the readable name and `post_import_remediation.js` resolves it after import by querying `sys_security_operation` by name, before the security-cache flush. Its verification step re-reads the three rows from the database and fails the run if any is still unresolved.

**What re-verification established, and what it did not.** The reported symptom — an "Operator not available for security reasons" banner when a date range was applied to a scoped list — is gone: eight list renders across all three personas, with and without range filters, produced no banner of any kind, and range queries returned correct results for every persona. But the causal link to these ACLs was tested and **not** established. A differential probe compared range predicates on a column that has a `query_range` ACL against range predicates on a column that has none (`sys_created_on`) inside the same impersonated session: both behaved identically for both the manager and the agent, and the predicates were genuinely evaluated rather than dropped (a `number > CASE9000005` filter returned exactly the five matching rows; a `subject > M` filter returned exactly the three subjects that sort after "M"). So these three ACLs are retained as an **explicit scoped grant** for the columns the AAP's own dashboards filter by date, not as a proven repair. The most probable original cause is an ACL/dictionary cache inconsistency left by the native table and role-link rebuild that this checkpoint was exercising — any ACL write flushes that cache, which is consistent with the symptom clearing.

**An earlier claim in these records was wrong and is corrected here.** The three ACL artifacts originally stated that zero `query_range` ACLs existed instance-wide. That was an artifact of querying `sys_security_acl` by `name`; querying by the resolved operation reference finds **seven** out-of-box ones — `sys_one_extend_eval_applicability.*`, `on_call_escalation_con_attempt.*`, `ast_contract.starts`, `*.*`, `sn_actsub_activitytype_template_field.*`, `sys_portal_preferences.*` and `asmt_assessment_instance_question.*` — including four `*.*` rows that deny or conditionally allow `query_range` platform-wide. The artifacts' own headers now carry the correction in full.

## UI Action Visibility Tied to ACL Matrix

The role × CRUD matrix above governs database-level authorization (read, write, create, delete). At the form-action layer, the `x_casemgmt_case` form surfaces six UI Actions (one per state transition) whose visibility conditions enforce the SAME role gating as the ACLs, plus the source-status precondition for the transition. The full per-transition mapping appears in [`state-machine.md`](./state-machine.md) "UI Action Visibility Per Transition"; the relevant role gating is summarized below.

| UI Action | Visible to Role(s) | Rationale |
| --- | --- | --- |
| **Open** (Draft → Open) | `x_casemgmt_case_manager` only | The Open transition's precondition is `assigned_group populated`. The field-level ACL on `assigned_group` already restricts writes to `case_manager`, so the only role that can establish the precondition is `case_manager`. Surfacing the Open button to `case_agent` would be UX-misleading: agents have no path to set `assigned_group`, so they would see a button they cannot drive. |
| **Start Progress** (Open → In Progress) | `case_manager` AND assigned `case_agent` | First transition where agents become first-class participants — the "Assigned only" ACL condition gives the assigned agent write access on their own case. |
| **Set Pending** (In Progress → Pending) | `case_manager` AND assigned `case_agent` | Same role surface as Start Progress. |
| **Resume** (Pending → In Progress) | `case_manager` AND assigned `case_agent` | Same role surface as Start Progress. |
| **Resolve** (In Progress → Resolved) | `case_manager` AND assigned `case_agent` | Same role surface as Start Progress. |
| **Close** (Resolved → Closed) | `x_casemgmt_case_manager` only | AAP Section 0.5.5 row 6 explicitly requires `case_manager` role for Resolved → Closed. The UI Action also uses `form_style=destructive` to communicate the terminal nature of the transition. |

### Design Decision: Open Button — Manager Only

The choice to restrict the **Open** UI Action to `x_casemgmt_case_manager` (instead of mirroring the role surface used by Start Progress, Set Pending, Resume, and Resolve) is an intentional UX-clarity decision:

1. **Field-level ACL alignment.** Writing `assigned_group` is a manager-only operation per the field-level ACL `x_casemgmt_case_assigned_group_field_acl`. Without an `assigned_group` value, the Open transition's precondition cannot be satisfied. Therefore the only role whose privileges include "set the precondition AND fire the transition" is `case_manager`.
2. **No security delta.** If the Open button were visible to agents, every agent click would reach the server-side `CaseTransitionValidator.canTransitionToOpen(current)` check and either fail (if `assigned_group` is unset) or succeed only when a manager has pre-populated `assigned_group`. The behavioral effect on the database is identical: agents cannot drive Draft → Open without a manager's preceding action.
3. **UX cleanliness.** Hiding the button on cases an agent cannot complete the action on is consistent with ServiceNow's standard UI-Action visibility pattern (`<condition>` + `<roles>`) where buttons are gated to the audience that can use them.
4. **No drift from AAP.** AAP Section 0.5.5 row 1 specifies the precondition (`assigned_group populated`) and the failure-handling behavior (`Surface form-level error`) but does NOT specify which role(s) may invoke the transition. The role-restriction is therefore a design choice within the AAP envelope, and the chosen restriction (`case_manager` only) is consistent with the field-level ACL.

The departure from a hypothetical "all transitions visible to both manager and agent" model is documented here and in `state-machine.md`; the rule lives canonically in the `<roles>` and `<condition>` fields of `x_casemgmt_case_open.xml` and can be relaxed in a future iteration without touching any other artifact.

### The stock list "Delete" affordance is offered to every role (QA finding F7)

QA finding F7 (LOW, non-blocking) records that **Delete is offered in the list menu to the `x_casemgmt_case_agent` and `x_casemgmt_case_viewer` personas** even though the server refuses the operation. Both halves were re-measured under impersonation:

**Enforcement holds.** There is exactly one `delete`-operation ACL per table (`x_casemgmt_case` `704775b2c264cae37cdc984ee173d307`, `x_casemgmt_case_task` `6c1bd40bcab435a7951bfeb732cd90e0`, `x_casemgmt_case_party` `1f8bdcb79b5060d68ca63d034186c83a`), each `type=record`, `active=true`, `admin_overrides=true`, **empty condition and empty script**, and each linked to exactly one role: `x_casemgmt_case_manager`. Under ServiceNow's grant model with `glide.sm.default_mode = deny`, that denies delete to every other role. Measured: `DELETE /api/now/table/<table>/<sys_id>` returns `HTTP 403 {"error":{"message":"Operation Failed","detail":"ACL Exception Delete Failed due to security constraints"}}` for the agent on all three tables and for the viewer on all three tables, while the manager gets `HTTP 204` on all three. A UI delete attempt on a real row destroyed nothing (the row survived a cache-ignoring reload).

**Where the affordance comes from.** It is *not* in the per-row context menu — for both personas and all three tables that menu contains only `Show Matching`, `Filter Out`, `Copy URL to Clipboard`, `Assign Tag ▸`. It appears in the **"Actions on selected rows"** dropdown, and its markup identifies it unambiguously as the stock **global** record:

```html
<option value="75a1fcce0a0a0b3400d6ed99cf8a87e0" action_name="delete_checked"
        gsft_check_condition="true" gsft_base_label="Delete" table="global"
        href="confirmAndDeleteFromList()">Delete</option>
```

`sys_ui_action 75a1fcce0a0a0b3400d6ed99cf8a87e0` ("Delete", `action_name=delete_checked`, `table=global`, `list_choice=true`, `sys_scope=global`, condition `current.canDelete() && current.getTableName() != "cmdb_retirement_custom_definitions"`). Because the option carries `gsft_check_condition="true"`, the platform renders it unconditionally and defers the authorization check to selection time: choosing it fires `POST /xmlhttp.do sysparm_processor=AJAXActionSecurity`, which correctly answers `can_execute="false"` for these personas — and the stock list client then aborts **silently**: no confirmation dialog, no banner, nothing in `#output_messages`, `.outputmsg`, `.outputmsg_error`, `[role=alert]`, `.notification` or `.alert`; the dropdown simply resets to its placeholder. (By contrast the same list refuses inline editing *visibly*, with `Security prevents writing to this field`.)

**Why no fix ships here.** Both the option and the silent abort live in global platform artifacts, and AAP Section 0.3.2 verbatim prohibits **"Global scope changes of any kind"** while Section 0.7.2 requires **"zero global-scope writes"**. No scoped remedy exists on this release either: `sys_ui_list_control` has no delete-omitting attribute (its only omit-flags are `omit_new_button`, `omit_edit_button`, `omit_links`, `omit_filters`, `omit_count`, `omit_drilldown_link`, `omit_if_empty`) and holds **no rows** for the three scoped tables; the scoped app's own six `sys_ui_action` rows are all `form_button` transitions with `list_choice=false`. A hypothetical scoped `list_choice` action named `Delete` on each table would also (a) depend on unverified table-vs-global action precedence, (b) risk suppressing the affordance for `x_casemgmt_case_manager`, whose Delete grant Section 0.5.6 requires, and (c) exceed AAP Section 0.3.1, which admits `ui_action/` artifacts "only those needed for state transitions". The finding is therefore **bounded by the AAP Section 0.3.2 exception**: reported, with enforcement re-verified, and not worked around. The remediation a platform owner would apply is to make the stock list client surface the `can_execute="false"` answer as a visible message (or to gate the global option on `canDelete()` at render time) — a global change outside this application's scope.

## Mirror Patterns: case_task and case_party

The role × CRUD matrix is mirrored on the `x_casemgmt_case_task` and `x_casemgmt_case_party` tables, with one additional rule: write/read access is governed by the parent case's "Assigned only" condition. Tasks and parties are children of a case; if the agent cannot access the parent case, they cannot access its child records.

### case_task ACL pattern

- `x_casemgmt_case_manager` — full create/read/write/delete on all tasks
- `x_casemgmt_case_agent` — create/read/write only on tasks where the parent case is "Assigned only" (i.e., `current.case.assigned_agent == gs.getUserID() OR current.case.assigned_group ∈ current_user_group_membership`)
- `x_casemgmt_case_viewer` — read all tasks; no write/create/delete

### case_party ACL pattern

- `x_casemgmt_case_manager` — full create/read/write/delete on all parties
- `x_casemgmt_case_agent` — create/read/write only on parties where the parent case is "Assigned only"
- `x_casemgmt_case_viewer` — read all parties; no write/create/delete

The "parent case is Assigned only" check uses `current.case.assigned_agent` and `current.case.assigned_group` — i.e., dot-walks through the reference field. No hard-coded `sys_id`s.

### Organization parties are not usable by any of the three scoped roles (QA4 Issue 5 — BLOCKED, awaiting human authorization)

**The scoped ACLs on `x_casemgmt_case_party` are correct and are not the cause.** All eight of them target the table `x_casemgmt_case_party` with an empty condition or the "Assigned only" script, none of them mentions `core_company`, and no field-level ACL exists on `x_casemgmt_case_party.organization` anywhere on the instance. What blocks the Organization branch sits one table away: AAP Section 0.5.7 fixes that branch's reference target verbatim as

```
organization | Reference -> core_company | Conditional: required if party_type = Organization
```

and `core_company` is an out-of-box **global** table whose `read` operation is role-gated to roles that none of the three scoped roles holds, contains, or can be granted without a change the AAP forbids. A reference field whose target table the caller may not read is not rendered as an error by the platform — it is **omitted from the form and stripped from the payload**, which is why the symptom looks like a missing field rather than a denial.

This widens the read-only symptom already disclosed as **ADV-1** in [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) (§0.9 ADV-1, §4 item 19, and the N8 rediscovery) into the **create and update** paths as well, and it is recorded here because this is the document that states the manager's grant.

#### What a `case_manager` can and cannot do with an Organization party today

| Operation on an Organization party | Outcome today | How established |
| --- | --- | --- |
| Read the party row's own columns (`number`, `case`, `party_type`, `role_label`) | **Works.** `read` on `x_casemgmt_case_party` is granted to all three roles | Measured |
| Read the `organization` value | **Denied.** The column is absent from the rendered form and blank in the case form's Parties related list | Measured on the rendered form — `qa4-ui-party-organization-manager.png` shows PARTY9000002 rendering only Number / Party Type / Case / Role Label, against `qa4-ui-party-organization-admin.png` where `admin` sees the required *Synthetic Org Alpha*. The matching API behaviour — the column stripped from the payload, and `GET /api/now/table/core_company` answering **403** for each persona — was measured under impersonation and is recorded as ADV-1 |
| Select a company on a new or existing party | **Impossible.** No control renders at all, so there is nothing to type into | Measured on the rendered form — `qa4-ui-manager-new-party-organization-no-org-field.png` shows a **New** Case Party with Party Type = Organization, no Organization control, and **Submit** offered. The underlying denial on the company endpoint was measured in the QA4 pass and as ADV-1 |
| Create an Organization party from the form | **Refused server-side; nothing is stored.** [`../business_rules/x_casemgmt_validate_case_party_integrity.xml`](../business_rules/x_casemgmt_validate_case_party_integrity.xml) reaches its conditional-requiredness branch, calls `gs.addErrorMessage('Organization is required when Party Type is Organization.')` and `current.setAbortAction(true)` | Code path; the deployed `sys_script` is byte-identical to the packaged one (SHA-256 `ac92564a7c3dd26195603d6fe48e8b6a2f84481cf6231d2e51619ca2508e0b44` on both sides), `active=true`, `when=before`, `action_insert=true`, `action_update=true` |
| Create or update one over the Table API by supplying a company `sys_id` directly | **Would be accepted** — no field-level ACL denies `organization`, and the integrity rule resolves the target with plain `GlideRecord`, which applies no ACLs — but the manager **has no authorized path to obtain a `sys_id`**, since discovering one requires the same `core_company` read, and AAP Section 0.7.2 forbids shipping one | Derived from the ACL inventory and the rule's code path; not measured, because exercising it requires a write to the shared instance |
| Update an existing Organization party's other columns | **Succeeds, and the stored company survives.** A field absent from the form submission is never applied, so `current.getValue('organization')` reads the stored value and the requiredness branch passes | Derived from the same code path; not measured for the same reason |
| Delete an Organization party | **Works** — `delete` on the party table is granted to `case_manager` | Measured for the table (see the F7 section above) |
| Everything above, for a **Person** party | **Fully usable.** `sys_user` read is not role-gated on this instance | Measured |

`x_casemgmt_case_agent` and `x_casemgmt_case_viewer` are affected identically on every read row, and the agent additionally on every create/update row: none of the three holds a gating role, so the outcome is a property of the role set and not of the matrix cell.

#### Measured evidence (read-only Table API as `admin`, 2026-09-05T17:30Z)

| Fact | Observed value |
| --- | --- |
| ACLs on `core_company` | **8**, every one `sys_scope=Global`: `create`, `delete`, `read` ×2, `write`, `query_range` ×2 (one on `core_company`, one on `core_company.*`), `report_view` |
| Roles on read ACL `00df2becff3722103ad8ffffffffffeb` (`admin_overrides=false`) | `ai_user_admin` |
| Roles on read ACL `8109a169c0a801666217a6825787c7ff` (`admin_overrides=true`) | `contract_manager`, `inventory_user`, `itil`, `model_manager`, `problem_task_analyst`, `service_viewer`, `sn_gf.goal_user_read`, `sn_problem_read`, `user_admin` |
| Roles on the two `query_range` ACLs | `public` — so `public` gates *range predicates*, **never** `read`. The application's own roles are absent from every `core_company` role link (24 link rows in total) |
| Same-specificity ACL semantics, demonstrated rather than assumed | `admin` holds `user_admin` but **not** `ai_user_admin`, and `admin` reads `core_company` — so two read ACLs at the same specificity are **any-pass**, and an *additional* read ACL can therefore grant the operation without editing either existing row |
| Roles held by the three demo personas (`sys_user_has_role` filtered on `user.user_name`) | Exactly **3** grant rows: `x_casemgmt_demo_manager → x_casemgmt_case_manager`, `x_casemgmt_demo_agent → x_casemgmt_case_agent`, `x_casemgmt_demo_viewer → x_casemgmt_case_viewer`, all `inherited=false` |
| Role containment | `sys_user_role_contains` returns **0** rows for `x_casemgmt*`, and `includes_roles` is empty on all three role definitions — so no persona inherits a gating role transitively |
| The Person branch, for contrast | `sys_user` read is governed by ACL `936dc648eb3630003623666cd206fecc` with **zero** `sys_security_acl_role` links (no role required) and `cfa2be6167230200fba9f1d557415a3a` linked to `public`, which every user holds |
| Cross-scope addressability of `core_company` | `sys_db_object.read_access=true` — a **scoped script** may address the table; the block is the *caller's* read ACL, not cross-scope access |
| The dictionary row, unchanged and correct | `organization` → `internal_type=reference`, `reference=core_company`, `mandatory=false`, no reference qualifier — exactly Section 0.5.7 |
| The UI Policy the platform cannot honour | `507da6cb683691d5a09285ab09297b22` (`party_type=Organization`) sets `organization` `mandatory=true, visible=true`; a UI Policy cannot make mandatory a control that is not on the form, which is precisely why **Submit** is offered on a party that can never be saved |
| Data affected | **3 of the 11** party rows are Organization parties — `PARTY9000002` (*Synthetic Org Alpha*, CASE9000003), `PARTY9000005` (*Synthetic Org Beta*, CASE9000005), `PARTY9000007` (*Synthetic Org Alpha*, CASE9000008). All three read as blank for every persona |
| ACLs authored on `core_company` by this application | **Zero.** No ACL in scope `x_casemgmt` targets any global table |

Screenshot artifacts, by absolute path:

- `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa4-ui-party-organization-manager.png` — PARTY9000002 on the Case Party form as `x_casemgmt_demo_manager`: no Organization field.
- `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa4-ui-party-organization-admin.png` — the same record as `admin`: Organization required and populated with *Synthetic Org Alpha*.
- `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa4-ui-manager-new-party-organization-no-org-field.png` — a **New** Case Party as the manager with Party Type = Organization: no Organization control, Submit offered.

#### The stored data cannot be corrupted by this, and that part is closed

The one half of this finding that is fixable inside the application was already closed and has been re-verified line by line: the polymorphic contract is enforced **server-side**, not only on the form. The requiredness branch of [`../business_rules/x_casemgmt_validate_case_party_integrity.xml`](../business_rules/x_casemgmt_validate_case_party_integrity.xml) reads the value the row *would carry after* the write (`current.getValue`), is not narrowed to changed fields, and runs on `action_insert` **and** `action_update`, so an Organization party with an empty `organization` is refused on every path — the rendered form, the classic form POST, and the Table API alike — whether or not the client ever drew the control. No half-built Organization party can reach the table as a side effect of the missing field.

Two consequences of that refusal are recorded here rather than papered over:

- **The refusal is honest but unsatisfiable from the manager's screen.** The message names the field to supply — `Organization is required when Party Type is Organization.` — and that field is not on their form, so a manager who follows the instruction has nowhere to follow it to. The message is deliberately left as it is: it states the true reason the write was refused, and rewording it to describe an authorization limitation would move a security explanation into a data-integrity rule while changing nothing about what the user can actually do. The dead end is a symptom of the gap below, and it disappears when the gap is closed.
- **A refused submit still consumes a party number.** `sys_number` allocates on form render, so the New form in the screenshot above had already taken `PARTY0000095` before the refusal. This is stock platform numbering behaviour, not a defect in this application.

#### Three candidate remedies, and the AAP section that blocks each

| # | Remedy | What it would actually take | Blocked by |
| --- | --- | --- | --- |
| 1 | **Grant the three scoped roles `read` on `core_company`** via one *additional* ACL | One new `sys_security_acl` (`name=core_company`, `operation=read`) plus three `sys_security_acl_role` links. Because same-specificity read ACLs are any-pass — demonstrated above — no existing row is edited and nothing already granted is narrowed. It must be authored with `security_admin` elevated through the UI (elevation is impossible over REST) and it lands in the **Global** scope | **AAP Section 0.3.2**, which prohibits "Global scope changes of any kind" and names `core_company` explicitly among the tables that must not be edited; and **AAP Section 0.7.2**, whose scoped-namespace constraint permits "zero global-scope writes" |
| 2 | **Grant the demo personas an out-of-box role that already carries the read** (`itil`, `user_admin`, `service_viewer`, …) | Three `sys_user_has_role` rows. Trivial to apply, and by far the widest blast radius: `itil` alone carries read/write across most of the platform's operational tables, so the personas would stop being a faithful test of the application's own authorization | **AAP Section 0.5.6**, which fixes the role surface at exactly three scoped roles with exactly the CRUD cells in the matrix above, and **AAP Section 0.7.3 Gate 3**, which measures role-based access against those three roles. **AAP Section 0.3.2** also excludes edits to `sys_user_role` beyond the three scoped roles |
| 3 | **Re-point `organization` at a scoped proxy table** (e.g. `x_casemgmt_organization`) that the scoped ACLs can govern | One new table, its dictionary and ACLs, a data copy or re-seed of the referenced companies, and a dictionary change on `x_casemgmt_case_party.organization` | **AAP Section 0.5.7**, which states the reference target verbatim as `core_company`, reinforced by **Section 0.7.1** ("Preserve the user-prompt's data-model field set verbatim — no additions, no renames, no type relaxations"); and **Section 0.3.2**'s Minimal-Change Clause, which forbids adding tables beyond the defined scope |

**Recommended remedy: #1, narrowed by condition.** It is the smallest authorization delta that makes Section 0.5.7's Organization branch work: one operation, on one table, for exactly the three roles the matrix already grants `read` on the party table, leaving both the role surface of Section 0.5.6 and the schema of Section 0.5.7 exactly as the AAP fixes them. Remedy 2 buys the same read at the cost of the very matrix Gate 3 exists to measure, and remedy 3 buys it by contradicting the schema the AAP quotes verbatim — so both trade a documented limitation for an undocumented deviation, which is a worse outcome than the limitation. Remedy 1's whole cost is that it is a Global write, which is exactly why it needs a human's explicit authorization rather than an agent's judgement.

**A narrowed variant exists, and the human authorizing this has to choose between the two knowingly.** Instead of granting read on the whole company directory, the new ACL can carry a condition script that grants read only on the companies the application itself already references — resolved by query, with no hard-coded `sys_id`:

```javascript
// Narrowed variant of remedy #1: grant core_company read only for companies an
// x_casemgmt_case_party row already references. No hard-coded sys_id. `current`
// is the core_company row the ACL is being evaluated against.
(function() {
    var partyGr = new GlideRecord('x_casemgmt_case_party');
    partyGr.addQuery('organization', current.sys_id);
    partyGr.setLimit(1);
    partyGr.query();
    return partyGr.hasNext();
})();
```

The trade-off is not cosmetic and must not be glossed over. The narrowed variant makes the **three existing** Organization parties readable and their company names visible, but it does **not** restore the create path: the reference picker can only offer rows the caller may read, so a company that no party references yet stays invisible and a *new* Organization party still cannot be given one. It also evaluates one query per company row the caller reads. So:

- choose the **unconditional** grant to deliver Section 0.5.7's Organization branch in full — read *and* create — at the cost of making the company directory readable to anyone holding a scoped role; or
- choose the **narrowed** grant to fix only the read symptom (ADV-1) while leaving the create half of this finding open, and record it as a partial remedy.

The recommendation is the unconditional grant, because a partial remedy leaves the AAP requirement partly undelivered and leaves this section open either way. What the unconditional grant would expose was measured: `core_company` holds **179** rows on this instance, of which exactly **2** belong to this POC (`Synthetic Org Alpha`, `Synthetic Org Beta`) and the remainder are the platform's out-of-box vendor/company demo directory (`ACME *`, `Apple`, `Cisco`, `Dell Inc.`, …). It contains no customer or personal data, so the read exposure is a policy question about global scope — which is real, and is why a human must authorise it — rather than a data-sensitivity question.

**The exact records a human would have to authorise for remedy #1:**

| Record | Table | Values |
| --- | --- | --- |
| 1 new ACL | `sys_security_acl` | `name=core_company`, `operation=read`, `type=record`, `active=true`, `admin_overrides=true`, `sys_scope=Global`; `condition` empty, or the narrowing script above |
| 3 new role links | `sys_security_acl_role` | that ACL × `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer` — one per role that Section 0.5.6 grants `read` on `x_casemgmt_case_party` |
| Session prerequisite | — | `security_admin` **elevated through the UI** user menu (ServiceNow does not allow elevation over REST), then a security-cache flush before re-testing |
| Packaging consequence | — | Four Global-scope payloads would join a package that today contains none, so the "zero global-scope writes" statement in Section 0.7.2 would have to be amended with the authorization, not quietly broken |

Re-verification once authorised, in this order: impersonate `x_casemgmt_demo_manager`, open PARTY9000002 and confirm the Organization field renders with *Synthetic Org Alpha*; open a **New** Case Party, set Party Type = Organization and confirm the control renders, is marked mandatory by UI Policy `507da6cb683691d5a09285ab09297b22`, and that a company can be selected and saved; confirm the Parties related list on CASE9000003 shows the company; then repeat the read half as `x_casemgmt_demo_agent` on an assigned case and as `x_casemgmt_demo_viewer`, and re-run Gate 3 to confirm nothing else widened.

#### Status

**Until one of those remedies is authorised, Organization parties on this application are usable only by a user holding `admin` (or one of the nine roles on the `core_company` read ACL).** AAP Section 0.5.7's party model is therefore **not fully delivered for the three scoped roles**: its Organization branch is readable and writable by no role the application defines, and AAP Section 0.5.6's unqualified `case_manager` cells — Read All, Write All, Create — are not delivered on the `organization` column. Section 0.5.6's Person branch, the eight party ACLs, the dictionary row, the conditional UI Policies and the server-side exactly-one-of invariant are all intact and verified; the gap is exactly and only the authorization to read the reference target. It is open, it is a HIGH-severity functional and security finding, and it stays open in these records until a human authorises one of the three remedies above.

## Source-Side Semantic Mapping

This section documents how the three ServiceNow scoped roles semantically correspond to ArkCase's `ApplicationRolesToPrivilegesConfig`-based privilege resolution. None of the ArkCase code is reused — it is read-only context.

| ServiceNow Role | ArkCase Source Concept | Notes |
| --- | --- | --- |
| `x_casemgmt_case_manager` | `ROLE_ARKCASE_CASE_MANAGER` (entry in `ApplicationRolesConfig.application.roles` mapped to all case-CRUD privileges in `ApplicationRolesToPrivilegesConfig`) | Replaces the ArkCase role with a ServiceNow scoped role + table-level ACLs |
| `x_casemgmt_case_agent` | A composite of `ROLE_ARKCASE_CASE_AGENT`-style role with `assigned_only` privilege filtering historically enforced through queue/participant logic | Replaces ArkCase's queue/participant filtering with the scripted ACL condition `assigned_agent == current_user OR assigned_group ∈ current_user_groups` |
| `x_casemgmt_case_viewer` | `ROLE_ARKCASE_CASE_VIEWER` (read-only role in ApplicationRolesConfig) | Replaces with read-only scoped role |
| Field-level ACL on `assigned_group` | `RolesPrivilegesService` URL-method privilege mapping that historically restricted assigned-group writes to admin/manager URLs | Replaces with native field-level ACL |
| Field-level ACL on `assigned_agent` | Same as above for assigned-agent writes | Replaces with native field-level ACL |
| ACL condition script | `ApplicationPluginPrivilegesConfig.getPluginPrivileges()` URL-pattern → privilege resolution via `AcmPluginUrlPrivilege` | Replaces with `gs.getUserID()` and `sys_user_grmember` query |

## Verification

The following row is preserved verbatim from AAP Section 0.7.3.

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| ACLs | Role-based access enforced | case_viewer cannot write; case_agent cannot access unassigned cases; case_manager has full access |

Verification procedure (cross-reference [`validation-gates.md`](./validation-gates.md) Gate 3):

1. Impersonate `x_casemgmt_demo_viewer`. Open the case list. Confirm all cases visible. Open any case. Confirm form is read-only.
2. Impersonate `x_casemgmt_demo_agent`. Open the case list. Confirm only assigned cases visible. Open assigned case. Confirm fields are editable except `assigned_group`. Attempt to access an unassigned case via direct URL. Confirm 403 / "Security constraints prevent access" message.
3. Impersonate `x_casemgmt_demo_manager`. Open the case list. Confirm all cases visible. Edit `assigned_group` and `assigned_agent` on any case. Confirm both writable. Delete a Draft demo case. Confirm success.
4. Repeat the matrix tests on `x_casemgmt_case_task` and `x_casemgmt_case_party` to confirm the mirror pattern.

## Constraints

The following ACL constraints from AAP Section 0.7.1 are non-negotiable:

- **No global ACLs touched.** Every ACL is in the `x_casemgmt` scope. This constraint is the reason the Organization branch of `x_casemgmt_case_party` is undelivered rather than repaired — the repair is a `core_company` read grant, which is a global write. It is an **open, unauthorised** item, not a closed decision: see [Organization parties are not usable by any of the three scoped roles](#organization-parties-are-not-usable-by-any-of-the-three-scoped-roles-qa4-issue-5--blocked-awaiting-human-authorization).
- **No hard-coded `sys_id`s.** ACL conditions resolve current user via `gs.getUserID()` and group membership via `sys_user_grmember` query — never literal sys_ids.
- **No global role assignments outside the three scoped roles.** Demo users get only the three new roles via the seed data.
- **No other roles are introduced.** ArkCase's other roles (admin, supervisor, etc.) are NOT replicated.

## Cross-References

- [`data-model.md`](./data-model.md) — schema reference for the fields gated by ACLs
- [`state-machine.md`](./state-machine.md) — describes how `validate_closed_transition` checks for the manager role
- [`validation-gates.md`](./validation-gates.md) — Gate 3 (ACLs)
- [`../roles/`](../roles/) — three role records: `sys_user_role_x_casemgmt_case_manager.xml`, `sys_user_role_x_casemgmt_case_agent.xml`, `sys_user_role_x_casemgmt_case_viewer.xml`
- [`../acl/`](../acl/) — all ACL records (table-level and field-level)
- [`../seed-data/role_assignments/`](../seed-data/role_assignments/) — `sys_user_has_role_x_casemgmt_*.xml` records assigning roles to demo users
- [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) — ADV-1 (§0.9), §4 item 19 and the N8 rediscovery record the read-side symptom of the `core_company` gap; the create/update side and the remedy analysis are in [Organization parties are not usable by any of the three scoped roles](#organization-parties-are-not-usable-by-any-of-the-three-scoped-roles-qa4-issue-5--blocked-awaiting-human-authorization) above
- [`../business_rules/x_casemgmt_validate_case_party_integrity.xml`](../business_rules/x_casemgmt_validate_case_party_integrity.xml) — the server-side backstop that refuses an Organization party with an empty `organization` on both the insert and the update path, independently of what the form rendered
