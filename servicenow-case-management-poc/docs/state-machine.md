# Case State Machine

## Purpose

This document captures the case lifecycle state-machine for the ServiceNow scoped application POC. Cases progress through six statuses (Draft → Open → In Progress → Pending → Resolved → Closed) with three blocking-error rules that prevent invalid transitions. The state-machine is implemented as two Flow Designer flows (one per case type: General Inquiry and Complaint), with reusable subflows for shared transition validations. The implementation strictly mirrors the transition matrix from AAP Section 0.5.5; verbatim error messages MUST appear on the form when invalid transitions are attempted.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

## State Diagram

The Mermaid state diagram below visualizes all six states and the legal transitions. The diagram is illustrative; the textual transition matrix in the next section is the contract.

```mermaid
stateDiagram-v2
    [*] --> Draft: case created (auto-default)
    Draft --> Open: assigned_group set
    Open --> InProgress: assigned_agent set, member of assigned_group
    InProgress --> Pending: prompt for pending_reason
    Pending --> InProgress: clear pending_reason
    InProgress --> Resolved: all child tasks Closed
    Resolved --> Closed: caller has case_manager role; auto-set closed_date
    Closed --> [*]: terminal

    note right of Draft
        Default initial state for any new case.
        Set by JPA @PrePersist semantic on legacy
        side; set by table default + business rule
        on ServiceNow side.
    end note

    note right of Pending
        pending_reason field is required
        when entering Pending state.
        Choices: Awaiting Info,
        Awaiting Third Party, Other.
    end note

    note right of Resolved
        Validation: all linked
        x_casemgmt_case_task records
        must have status = Closed.
    end note

    note right of Closed
        Terminal state. closed_date is
        auto-populated. No transitions out.
    end note
```

## Transition Matrix

The following table is preserved verbatim from AAP Section 0.5.5 and serves as the canonical implementation contract for the two Flow Designer flows (`general_inquiry_state_machine` and `complaint_state_machine`).

| From | To | Required condition | Blocking-error behavior on failure |
| --- | --- | --- | --- |
| Draft | Open | assigned_group populated | Surface form-level error |
| Open | In Progress | assigned_agent populated AND member of assigned_group | Surface form-level error |
| In Progress | Pending | None; sets pending_reason (Awaiting Info / Awaiting Third Party / Other) | n/a |
| Pending | In Progress | None; clears pending_reason | n/a |
| In Progress | Resolved | All linked x_casemgmt_case_task records have status = Closed | Surface "All tasks must be closed before resolving this case." |
| Resolved | Closed | Caller has x_casemgmt_case_manager role; auto-set closed_date | Surface form-level error |
| Any → Draft | (none) | PROHIBITED | Surface "Cases cannot be returned to Draft." |
| Closed → * | (none) | PROHIBITED — terminal state | Surface "Closed cases are terminal and cannot be modified." |

## Per-Status Descriptions

### Draft

The default initial state for any new case. Set by the table-level default value on `x_casemgmt_case.status` and reinforced by the `set_opened_date` business rule. Cases submitted via the external Experience Portal also start in Draft. From Draft, the only legal transition is Draft → Open, which requires `assigned_group` to be populated.

### Open

A case that has been triaged to a working group but not yet picked up by an individual agent. The `assigned_group` reference is populated, but `assigned_agent` may still be empty. The legal forward transition is Open → In Progress, which requires `assigned_agent` to be populated AND for that agent to be a member of `assigned_group`.

### In Progress

A case actively being worked by an agent. Both `assigned_group` and `assigned_agent` are populated. From In Progress, three legal transitions exist: In Progress → Pending (when external input is awaited), In Progress → Resolved (when all child tasks are closed), or back to a previous state if the agent un-assigns (which is NOT modeled — the matrix prohibits backward transitions to Draft).

### Pending

A case whose progress is blocked awaiting external input. Setting Pending requires populating `pending_reason` (one of: `Awaiting Info`, `Awaiting Third Party`, `Other`). The only legal forward transition is Pending → In Progress, which clears `pending_reason`. The transition is enabled by the `clear_pending_reason_on_inprogress` business rule.

### Resolved

A case where the agent has completed all work but the manager has not yet closed it. Entering Resolved requires that ALL child `x_casemgmt_case_task` records have `status = Closed` — enforced by the `validate_resolved_transition` subflow with verbatim error message `"All tasks must be closed before resolving this case."`. The only legal forward transition is Resolved → Closed, which is gated to the `x_casemgmt_case_manager` role.

### Closed

Terminal state. Entering Closed requires the caller to have the `x_casemgmt_case_manager` role. The transition auto-populates `closed_date = gs.nowDateTime()` via the `set_closed_date` business rule. NO transitions are permitted from Closed; any attempt to modify a Closed case raises the verbatim error `"Closed cases are terminal and cannot be modified."` (enforced by the `block_terminal_closed` business rule).

## Per-Transition Implementation Map

This section maps each transition row in the matrix to the specific subflow and/or business rule that enforces it. Each transition is enforced in two places: the OnUpdate trigger of the parent flow (`general_inquiry_state_machine` or `complaint_state_machine`), and supporting business rules where appropriate.

| Transition | Validation Subflow | Supporting Business Rule(s) | Verbatim Error Message |
| --- | --- | --- | --- |
| Draft → Open | `validate_open_transition.xml` | (none) | `"Form-level error: assigned_group is required to open this case."` (form error, not verbatim) |
| Open → In Progress | `validate_inprogress_transition.xml` | `validate_assigned_agent_membership.xml` | `"Form-level error: assigned_agent must be a member of assigned_group."` (form error, not verbatim) |
| In Progress → Pending | `validate_pending_transition.xml` | (none — pending_reason prompted) | n/a |
| Pending → In Progress | (handled by parent flow conditions) | `clear_pending_reason_on_inprogress.xml` | n/a |
| In Progress → Resolved | `validate_resolved_transition.xml` | (none) | `"All tasks must be closed before resolving this case."` (VERBATIM) |
| Resolved → Closed | `validate_closed_transition.xml` | `set_closed_date.xml` | `"Form-level error: Resolved → Closed requires case_manager role."` (form error, not verbatim) |
| Any → Draft | (none) | `block_draft_backtransition.xml` | `"Cases cannot be returned to Draft."` (VERBATIM) |
| Closed → * | (none) | `block_terminal_closed.xml` | `"Closed cases are terminal and cannot be modified."` (VERBATIM) |

The three "VERBATIM" rows in the table above MUST surface the EXACT error text on the form — character-for-character match with AAP Sections 0.5.5 and 0.7.4.

## UI Action Visibility Per Transition

The state-machine transitions are surfaced in the internal user UI as form buttons (UI Actions) on the `x_casemgmt_case` form. Each UI Action is gated by a visibility condition that re-implements the role-based authorization model from the ACL matrix (see [`acl-matrix.md`](./acl-matrix.md)) plus the source-status precondition for the transition.

| UI Action | File | Visible to Role(s) | Source Status | Server-Side Validator Call |
| --- | --- | --- | --- | --- |
| **Open** | `x_casemgmt_case_open.xml` | `x_casemgmt_case_manager` only | `Draft` | `CaseTransitionValidator.canTransitionToOpen(current)` |
| **Start Progress** | `x_casemgmt_case_start_progress.xml` | `x_casemgmt_case_manager` AND assigned `x_casemgmt_case_agent` | `Open` | `CaseTransitionValidator.canTransitionToInProgress(current)` |
| **Set Pending** | `x_casemgmt_case_set_pending.xml` | `x_casemgmt_case_manager` AND assigned `x_casemgmt_case_agent` | `In Progress` | (no validator call — `pending_reason` is captured via UI prompt) |
| **Resume** | `x_casemgmt_case_resume.xml` | `x_casemgmt_case_manager` AND assigned `x_casemgmt_case_agent` | `Pending` | (no validator call — clears `pending_reason` via cooperating BR) |
| **Resolve** | `x_casemgmt_case_resolve.xml` | `x_casemgmt_case_manager` AND assigned `x_casemgmt_case_agent` | `In Progress` | `CaseTransitionValidator.canTransitionToResolved(current)` (verbatim error) |
| **Close** | `x_casemgmt_case_close.xml` | `x_casemgmt_case_manager` only (`form_style=destructive`) | `Resolved` | `CaseTransitionValidator.canTransitionToClosed(current)` |

### Design Decision: Open Button — Manager Only

The **Open** UI Action is intentionally restricted to `x_casemgmt_case_manager` (rather than allowing both `case_manager` and `case_agent`) because `assigned_group` is itself a manager-restricted field per the ACL matrix:

- The field-level ACL `x_casemgmt_case_assigned_group_field_acl` permits writes ONLY by `case_manager` (see [`acl-matrix.md`](./acl-matrix.md) "Field-Level ACLs"). Agents cannot write `assigned_group`.
- The Draft → Open transition's required precondition is `assigned_group populated` (AAP Section 0.5.5 row 1).
- Therefore the act of placing a case in a state where it CAN transition to Open is, by ACL definition, a manager-only operation. Agents have no path to set the `assigned_group` field, so making them visible on a button that requires that field's value would be UX-misleading: they would see the button on cases the manager has populated, but pre-population is the manager's domain.
- Functionally, agents become first-class participants on the case starting at Open → In Progress (the **Start Progress** button), where the ACL "Assigned only" condition gives them write access via the assigned_agent / assigned_group dot-walks. From that point through Resolve, agents share the action surface with managers.

This decision intentionally departs from a simpler "all transitions visible to both roles" model. The trade-off favors UX clarity (the button only appears when the operator has authority to use it) over surface uniformity. The behavioral effect is identical to a hypothetical "agents see the button but every click fails the validator" model — in both cases agents cannot drive Draft → Open. The chosen design simply removes the misleading button.

The departure is intentional and is preserved here as the canonical design rationale. The rule lives in ONE place — the `<roles>` and `<condition>` fields of `x_casemgmt_case_open.xml` — and is not duplicated in the Script Include `CaseTransitionValidator` (which performs the same check whether or not the UI Action is visible). This means the rule can be relaxed in a future iteration (allowing agents to see the button) by editing only the UI Action's visibility metadata, without touching any other artifact.

## Subflow Specifications

Each transition is encapsulated as a reusable subflow under `../flows/sub_flows/` (subdirectory created in a subsequent checkpoint). Subflows are called from both case-type flows (`general_inquiry_state_machine` and `complaint_state_machine`) so that the validation logic exists in exactly one place per transition.

### validate_open_transition

- **Trigger:** called from parent flow when `previous.status == Draft AND current.status == Open`
- **Validation:** `current.assigned_group` is non-null
- **Pass:** continue OnUpdate
- **Fail:** Throw Error → form-level message indicating `assigned_group` is required

### validate_inprogress_transition

- **Trigger:** called from parent flow when `previous.status == Open AND current.status == In Progress`
- **Validation 1:** `current.assigned_agent` is non-null
- **Validation 2:** `current.assigned_agent` is a member of `current.assigned_group` (verified via `sys_user_grmember` query)
- **Pass:** continue OnUpdate
- **Fail:** Throw Error → form-level message indicating `assigned_agent` membership requirement

### validate_pending_transition

- **Trigger:** called from parent flow when `previous.status == In Progress AND current.status == Pending`
- **Validation:** `current.pending_reason` is non-null (prompt user to set if missing)
- **Pass:** continue OnUpdate
- **Fail:** Throw Error → form-level message indicating `pending_reason` is required

### validate_resolved_transition

- **Trigger:** called from parent flow when `previous.status == In Progress AND current.status == Resolved`
- **Validation:** GlideRecord query against `x_casemgmt_case_task` where `case == current.sys_id AND status != Closed` returns ZERO rows
- **Pass:** continue OnUpdate
- **Fail:** Throw Error with VERBATIM message `"All tasks must be closed before resolving this case."`
- **Implementation note:** Use `new x_casemgmt.CaseTransitionValidator().canTransitionToResolved(current.sys_id)` from the Script Include to centralize the logic

### validate_closed_transition

- **Trigger:** called from parent flow when `previous.status == Resolved AND current.status == Closed`
- **Validation 1:** caller (`gs.getUser()`) has the role `x_casemgmt_case_manager` via `gs.hasRole('x_casemgmt_case_manager')`
- **Pass:** continue OnUpdate; the `set_closed_date` business rule will populate `closed_date = gs.nowDateTime()`
- **Fail:** Throw Error → form-level message indicating manager role required

## Business Rule Specifications

Business rules complement the Flow Designer flows by providing pre-save guards that fire on EVERY update (not just on status change). They enforce the absolute prohibitions (Any → Draft, Closed → *) and the auto-population rules (`opened_date`, `closed_date`). Business rules are essential as a dual-layer defense — flows guard only the OnUpdate trigger context, while business rules guard direct Table API writes, scripted REST calls, background scripts, and any other code path that writes to `x_casemgmt_case`.

### set_opened_date

- **When:** Before-Insert on `x_casemgmt_case`
- **Action:** `current.opened_date = gs.nowDateTime();`

### set_closed_date

- **When:** Before-Update on `x_casemgmt_case` AND `previous.status == Resolved AND current.status == Closed`
- **Action:** `current.closed_date = gs.nowDateTime();`

### block_draft_backtransition

- **When:** Before-Update on `x_casemgmt_case` AND `previous.status != Draft AND current.status == Draft`
- **Action:** `gs.addErrorMessage("Cases cannot be returned to Draft."); current.setAbortAction(true);`
- **Verbatim text:** `"Cases cannot be returned to Draft."` (per AAP Section 0.7.4)

### block_terminal_closed

- **When:** Before-Update on `x_casemgmt_case` AND `previous.status == Closed`
- **Action:** `gs.addErrorMessage("Closed cases are terminal and cannot be modified."); current.setAbortAction(true);`
- **Verbatim text:** `"Closed cases are terminal and cannot be modified."` (per AAP Section 0.7.4)

### validate_assigned_agent_membership

- **When:** Before-Update on `x_casemgmt_case` AND `current.assigned_agent` is non-empty
- **Action:** GlideRecord query `sys_user_grmember` where `user == current.assigned_agent AND group == current.assigned_group`. If zero rows, abort with form-level error.

### clear_pending_reason_on_inprogress

- **When:** Before-Update on `x_casemgmt_case` AND `previous.status == Pending AND current.status == In Progress`
- **Action:** `current.pending_reason = '';`

## Script Include: CaseTransitionValidator

A reusable Script Include centralizes the transition guard logic so it can be called from both case-type flows AND from business rules without duplication. This is the ServiceNow-native equivalent of ArkCase's `ChangeCaseFileStateService`.

```javascript
// File: ../script_includes/x_casemgmt_CaseTransitionValidator.xml
var CaseTransitionValidator = Class.create();
CaseTransitionValidator.prototype = {
    initialize: function() {},

    /**
     * Returns true if the case has zero open child tasks; false otherwise.
     * Used by validate_resolved_transition subflow.
     */
    canTransitionToResolved: function(caseSysId) {
        var taskGr = new GlideRecord('x_casemgmt_case_task');
        taskGr.addQuery('case', caseSysId);
        // Choice value is Title Case 'Closed' per ../choices/sys_choice_case_task_status.xml
        taskGr.addQuery('status', '!=', 'Closed');
        taskGr.setLimit(1);
        taskGr.query();
        return !taskGr.next();
    },

    /**
     * Returns true if the current user has the case_manager role; false otherwise.
     * Used by validate_closed_transition subflow.
     */
    canTransitionToClosed: function() {
        return gs.hasRole('x_casemgmt_case_manager');
    },

    /**
     * Returns true if the assigned_agent is a member of assigned_group; false otherwise.
     * Used by validate_inprogress_transition subflow and validate_assigned_agent_membership business rule.
     */
    isAgentMemberOfGroup: function(agentSysId, groupSysId) {
        if (!agentSysId || !groupSysId) return false;
        var memGr = new GlideRecord('sys_user_grmember');
        memGr.addQuery('user', agentSysId);
        memGr.addQuery('group', groupSysId);
        memGr.setLimit(1);
        memGr.query();
        return memGr.next();
    },

    type: 'CaseTransitionValidator'
};
```

The Script Include uses NO hard-coded `sys_id`s; all references are passed in as parameters or resolved via `gs.hasRole(<roleName>)`. This compliance with AAP Section 0.7.2 ("No-hardcoded-`sys_id` constraint") ensures the Update Set is portable to any fresh PDI.

## Source-Side Semantic Mapping

This section documents how the ServiceNow state-machine semantically corresponds to ArkCase's Activiti BPMN + `ChangeCaseFileStateService` + queue pipeline stack. None of the ArkCase code is reused — it is read-only context.

| ServiceNow Artifact | ArkCase Source Concept | Notes |
| --- | --- | --- |
| `general_inquiry_state_machine.xml` (flow) | Activiti BPMN process definition for general-inquiry case lifecycle | Replaces BPMN with declarative Flow Designer flow filtered on `type=General Inquiry` |
| `complaint_state_machine.xml` (flow) | Activiti BPMN process definition for complaint case lifecycle | Replaces BPMN with declarative Flow Designer flow filtered on `type=Complaint` |
| `validate_resolved_transition.xml` (subflow) | `CaseFileTasksService.aggregateTasks()` | Replaces with GlideRecord query against `x_casemgmt_case_task` |
| `validate_closed_transition.xml` (subflow) | `ChangeCaseFileStateService.changeState()` role check | Replaces with `gs.hasRole('x_casemgmt_case_manager')` |
| `set_opened_date.xml` (business rule) | `CaseFileQueueHandler.handleQueue()` (sets status to ACTIVE on save) | Replaces with native business rule on insert |
| `set_closed_date.xml` (business rule) | `Disposition.closeDate` field on the disposition entity | Replaces with native auto-populate business rule |
| `block_draft_backtransition.xml` (business rule) | (no direct ArkCase equivalent — ArkCase allowed Draft as historical state) | New POC rule per AAP Section 0.5.5 |
| `block_terminal_closed.xml` (business rule) | (no direct ArkCase equivalent — ArkCase had soft-close semantics) | New POC rule per AAP Section 0.5.5 |
| `CaseTransitionValidator.xml` (Script Include) | `ChangeCaseFileStateService.java` | Replaces Spring service with platform Script Include |

## Verification

The following verification gate row is reproduced verbatim from AAP Section 0.7.3 and applies to this state-machine implementation:

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| Workflow | All state transitions enforced for both case types | Invalid transitions return blocking error; task-closure check blocks Resolved transition |

For a complete pass/fail framework see [`validation-gates.md`](./validation-gates.md) Gate 2 (Workflow). The numbered procedure below operationalizes the gate against the seeded synthetic users and a freshly committed Update Set:

1. As `x_casemgmt_demo_manager`, create a General Inquiry case (defaults to Draft)
2. Attempt Draft → Open without `assigned_group` → form-level error
3. Set `assigned_group` and re-attempt → success
4. Attempt Open → In Progress without `assigned_agent` → form-level error
5. Set `assigned_agent` to a non-group-member user → form-level error
6. Set `assigned_agent` to a valid group member → success
7. Add an Open child task; attempt In Progress → Resolved → verbatim error: `"All tasks must be closed before resolving this case."`
8. Close the child task; re-attempt → success
9. As `x_casemgmt_demo_agent`, attempt Resolved → Closed → form-level error
10. As `x_casemgmt_demo_manager`, attempt Resolved → Closed → success; `closed_date` auto-populated
11. Attempt to set status to Draft from any other state → verbatim error: `"Cases cannot be returned to Draft."`
12. Attempt to update a Closed case → verbatim error: `"Closed cases are terminal and cannot be modified."`
13. Repeat the entire procedure with a Complaint case

## Constraints

The following constraints are mandatory and derived from AAP Sections 0.7.1 and 0.7.2:

- **Flow-Designer-exclusive workflow** — all transition logic is in Flow Designer + Business Rules; no direct background scripts
- **Verbatim error messages** — three messages MUST appear character-for-character: `"All tasks must be closed before resolving this case."`, `"Cases cannot be returned to Draft."`, `"Closed cases are terminal and cannot be modified."`
- **Two flows, one per case type** — General Inquiry and Complaint have separate flows even though they enforce identical rules; this is per AAP Section 0.5.5
- **No hard-coded `sys_id`s** — all role checks via `gs.hasRole(<roleName>)`; all GlideRecord queries use field values resolved at runtime
- **Form-level error surfacing** — invalid transitions MUST surface errors on the form via `gs.addErrorMessage()` and `setAbortAction(true)` — silent failures are unacceptable

## Cross-References

- [`data-model.md`](./data-model.md) — schema reference for the fields used in transition guards (`status`, `assigned_group`, `assigned_agent`, `pending_reason`, `closed_date`)
- [`acl-matrix.md`](./acl-matrix.md) — explains why Resolved → Closed requires the `case_manager` role
- [`validation-gates.md`](./validation-gates.md) — Gate 2 (Workflow)
- `../flows/general_inquiry_state_machine.xml` — General Inquiry flow (created in a subsequent checkpoint)
- `../flows/complaint_state_machine.xml` — Complaint flow (created in a subsequent checkpoint)
- `../flows/sub_flows/` — five subflows (created in a subsequent checkpoint)
- `../script_includes/x_casemgmt_CaseTransitionValidator.xml` — reusable transition guards (created in a subsequent checkpoint)
- `../business_rules/` — six business rules (created in a subsequent checkpoint)

