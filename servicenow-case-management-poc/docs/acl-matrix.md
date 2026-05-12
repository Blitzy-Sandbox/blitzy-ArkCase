# ACL Matrix

## Purpose

This document captures the role × table × CRUD authorization matrix for the ServiceNow scoped application POC. Three named scoped roles (`x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`) replace ArkCase's `ApplicationRolesToPrivilegesConfig`-based privilege resolution. Authorization is enforced through table-level ACLs (read, write, create, delete) and field-level ACLs on the sensitive fields `assigned_group` and `assigned_agent`. All ACLs live in the `x_casemgmt` scope; no global ACLs are modified.

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
- **Read:** scoped by "Assigned only" condition
- **Write:** scoped by "Assigned only" condition; field-level ACL prevents writing `assigned_group`
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

- View the Agent Workspace dashboard (the "My ..." widgets are empty for a viewer because they have no assignments)
- Browse the case list and individual case forms in read-only mode
- Inspect related lists (tasks, parties)

## Field-Level ACLs

Per AAP Section 0.5.6, field-level ACLs MUST be authored on the sensitive fields `assigned_group` and `assigned_agent` to prevent agents and viewers from modifying these even when they have table-level write access.

| Field | Read | Write Restricted To | ACL Record File |
| --- | --- | --- | --- |
| `x_casemgmt_case.assigned_group` | All authenticated roles | `x_casemgmt_case_manager` only | [`../acl/x_casemgmt_case_assigned_group_field_acl.xml`](../acl/) |
| `x_casemgmt_case.assigned_agent` | All authenticated roles | `x_casemgmt_case_manager` AND assigned `x_casemgmt_case_agent` | [`../acl/x_casemgmt_case_assigned_agent_field_acl.xml`](../acl/) |

**Related rules:**

- Field-level ACLs run in addition to (NOT instead of) table-level ACLs.
- The `assigned_group` field-level ACL prevents an agent from reassigning their own case to a different group.
- The `assigned_agent` field-level ACL allows the assigned agent to update the field if needed (e.g., reassign to peer in same group), but the manager can override.

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
