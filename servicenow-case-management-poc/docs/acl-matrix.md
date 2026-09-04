# ACL Matrix

## Purpose

This document captures the role × table × CRUD authorization matrix for the ServiceNow scoped application POC. Three named scoped roles (`x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`) replace ArkCase's `ApplicationRolesToPrivilegesConfig`-based privilege resolution. Authorization is enforced through table-level ACLs (read, write, create, delete) and field-level ACLs on the sensitive fields `assigned_group` and `assigned_agent`, plus three field-level `query_range` grants on the date columns the dashboards filter by (see [Field-level `query_range` grants](#field-level-query_range-grants-on-the-three-date-columns-qa-finding-f17)). All 29 ACLs live in the `x_casemgmt` scope; no global ACLs are modified.

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

- **No global ACLs touched.** Every ACL is in the `x_casemgmt` scope.
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
