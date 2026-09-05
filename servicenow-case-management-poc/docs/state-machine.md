# Case State Machine

## Purpose

This document captures the case lifecycle state-machine for the ServiceNow scoped application POC. Cases progress through six statuses (Draft → Open → In Progress → Pending → Resolved → Closed) with three blocking-error rules that prevent invalid transitions. The state-machine is implemented as two Flow Designer flows (one per case type: General Inquiry and Complaint), with reusable subflows for shared transition validations. Because a Flow Designer record trigger fires only *after* the database write commits, a flow cannot by itself refuse a save; the subflows are therefore also invoked synchronously by the before-update business rule `enforce_forward_transitions` (order 250), which is what aborts the update and puts the blocking message on the form. The implementation strictly mirrors the transition matrix from AAP Section 0.5.5; verbatim error messages MUST appear on the form when invalid transitions are attempted.

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
        pending_reason is captured by the
        Set Pending UI Action, which prompts
        for it and re-validates it server-side.
        It is NOT a blocking precondition of
        the transition: a status change made
        any other way is not refused for a
        missing pending_reason.
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

### The matrix is the complete set of legal edges, and the edge itself is enforced

The six rows above are not merely a list of preconditions attached to target statuses — they are the **whole
graph**, and every status change is checked against it. A change whose *source* status has no row leading to the
proposed *target* status is refused with a form-level error, even when the target's own precondition happens to be
satisfiable:

| Attempted | Result |
| --- | --- |
| `Draft → In Progress`, `Draft → Resolved`, `Draft → Closed` | Blocked |
| `Open → Resolved`, `Open → Closed` | Blocked |
| `Pending → Resolved` | Blocked |
| `Resolved → In Progress`, `Resolved → Open` | Blocked |

The message names the attempted edge and the legal alternative, e.g. `Draft → Closed` surfaces
`A case cannot go from Draft to Closed. From Draft the only valid next status is Open.` and `In Progress` (the
one state with two successors) surfaces `From In Progress the valid next statuses are Pending or Resolved.`

Why this matters beyond tidiness: a skip edge does not merely bypass a rule, it bypasses **every** rule between
the two states. `Draft → Closed` in one save skipped the `assigned_group` requirement of Open, the
agent-membership requirement of In Progress and the task-closure gate of Resolved, and landed the case in the
terminal state with `closed_date` **empty**, because `set_closed_date` (order 500) keys on the `Resolved → Closed`
edge — which in turn silently removed the case from the "Average Time to Close" aggregate. AAP §0.7.3 Gate 2
requires "All state transitions enforced for both case types", and that is only true if the edge is validated and
not just the destination.

Where it is implemented: `x_casemgmt.CaseTransitionValidator.validateTransitionEdge(previousStatus, newStatus)`
holds the adjacency list, and `enforce_forward_transitions` (order 250) consults it as its **first** step, before
any target-precondition work. Keeping the graph in the Script Include means the Business Rule layer, the five
subflows and the `Case Transition Guard` Custom Action all answer the question from one definition. An INSERT is
never judged against the graph (seed data and the portal legitimately create rows directly at a given status),
and a save that does not change `status` is not a transition at all.

### "Closed cannot be modified" means the whole row, not only its status

Row 8's message says a Closed case "cannot be modified", and that is now literally what happens.
`block_terminal_closed` (order 100) asks two questions of a row whose committed status is `Closed`: is the status
being moved out of Closed, and — if not — is any of the case's own columns being rewritten? Either one surfaces
the same verbatim message and aborts the save. Previously only the first was asked, so an edit that left `status`
alone and changed `priority`, `subject`, or cleared `assigned_agent` committed silently on a Closed case, through
the form and through the Table API alike.

Two deliberate exclusions keep the guard honest rather than obstructive:

- **A genuine no-op save is still allowed.** Opening a Closed case and pressing Update without editing anything
  changes no compared column, so it succeeds as the no-op it is. `sys_mod_count` and `sys_updated_on` are not
  compared, precisely so that they cannot turn a no-op into a rejection.
- **`duration_to_close` is not compared**, being a virtual function field computed at query time and unwritable
  by definition.

This is a data-integrity guard on the terminal state, not an authorization decision: who may write the row at all
remains a question for the scoped ACLs in [`../acl/`](../acl/). Deletion is likewise unaffected — the guard is a
before-**update** rule.

## Per-Status Descriptions

### Draft

The default initial state for any new case. Set by the table-level default value on `x_casemgmt_case.status` and reinforced by the `set_opened_date` business rule. Cases submitted via the external Experience Portal also start in Draft. From Draft, the only legal transition is Draft → Open, which requires `assigned_group` to be populated — and that exclusivity is enforced, not merely described: `Draft → In Progress`, `Draft → Resolved` and `Draft → Closed` are each refused by the edge check in `enforce_forward_transitions` with `A case cannot go from Draft to <target>. From Draft the only valid next status is Open.`

### Open

A case that has been triaged to a working group but not yet picked up by an individual agent. The `assigned_group` reference is populated, but `assigned_agent` may still be empty. The legal forward transition is Open → In Progress, which requires `assigned_agent` to be populated AND for that agent to be a member of `assigned_group`.

### In Progress

A case actively being worked by an agent. Both `assigned_group` and `assigned_agent` are populated. From In Progress, three legal transitions exist: In Progress → Pending (when external input is awaited), In Progress → Resolved (when all child tasks are closed), or back to a previous state if the agent un-assigns (which is NOT modeled — the matrix prohibits backward transitions to Draft).

### Pending

A case whose progress is blocked awaiting external input.

**How `pending_reason` gets populated, stated precisely** — because two things that sound alike are not the same
here. The **Set Pending UI Action** ([`../ui_action/x_casemgmt_case_set_pending.xml`](../ui_action/x_casemgmt_case_set_pending.xml))
prompts the user for one of the three allowed values, writes it with `g_form.setValue('pending_reason', reason)`,
and its server half re-validates the submitted value against
[`../choices/sys_choice_case_pending_reason.xml`](../choices/sys_choice_case_pending_reason.xml) before saving.
**That UI Action is the only writer of `pending_reason`.** The `validate_pending_transition` subflow, by contrast,
**has no blocking precondition and sets nothing** — it returns a permitting verdict for every well-formed case,
because AAP §0.5.5 defines the In Progress → Pending transition as "None; sets `pending_reason`". So a status
change to Pending driven through the button always carries a reason, while one driven any other way is **not
refused** for lacking one. Earlier revisions of this document said `pending_reason` was "required when entering
Pending", which overstated it and contradicted this document's own per-subflow section.

The only legal forward transition out is Pending → In Progress, which clears `pending_reason` via the
`clear_pending_reason_on_inprogress` business rule (order 400).

### Resolved

A case where the agent has completed all work but the manager has not yet closed it. Entering Resolved requires that ALL child `x_casemgmt_case_task` records have `status = Closed` — enforced by the `validate_resolved_transition` subflow with verbatim error message `"All tasks must be closed before resolving this case."`. The only legal forward transition is Resolved → Closed, which is gated to the `x_casemgmt_case_manager` role.

**The task rule gates the `In Progress → Resolved` edge; it is not a standing invariant on the Resolved state.**
AAP §0.5.5 attaches the all-tasks-closed condition to that one row of the matrix, and attaches nothing but the
manager-role check to `Resolved → Closed`. The implementation matches the matrix exactly, and the practical
consequence is worth stating plainly: once a case is Resolved, nothing re-checks its tasks. A new `Open` task
can be created on a Resolved case, an already-closed task can be reopened, and neither touches the case;
`Resolved → Closed` then succeeds with open child work and stamps `closed_date` as usual. Both behaviours were
measured on the instance rather than inferred. Strengthening this into an invariant would mean adding workflow
the AAP does not specify, which the Minimal-Change Clause (§0.7.2) forbids — so it is disclosed, with the full
step-by-step evidence and the shape a future requirement change would take, in
[`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §5](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).

### Closed

Terminal state. Entering Closed requires the caller to have the `x_casemgmt_case_manager` role. The transition auto-populates `closed_date = gs.nowDateTime()` via the `set_closed_date` business rule. NO transitions are permitted from Closed, and no edit to the row's own fields is permitted either: `block_terminal_closed` checks the status move first and then compares the case's own columns, so a change to `status`, `priority`, `subject`, `description`, `assigned_group`, `assigned_agent`, `requester_name`, `requester_email`, `type`, `number`, `opened_date`, `closed_date` or `pending_reason` all raise the verbatim error `"Closed cases are terminal and cannot be modified."`. A save that changes nothing at all is still accepted as the harmless no-op it is (`sys_mod_count` and `sys_updated_on` are excluded from the comparison, as is the virtual `duration_to_close`). Deleting a Closed case is governed by the ACLs, not by this rule.

#### The form states the terminal restriction instead of inviting the edit

Until [`../ui_policy/x_casemgmt_case_closed_readonly.xml`](../ui_policy/x_casemgmt_case_closed_readonly.xml)
existed, a Closed case still rendered all ten of its writable fields as live controls — a text box for Subject, a
select for Status and Priority, a textarea for Description, reference pickers for Assigned Group and Assigned Agent
— so the whole of row 8 rested on `block_terminal_closed` refusing the save *after* the gesture. QA recorded that as
`Issue 17` ("Closed records still expose editable fields and Update, relying on the server guard to reject the
save"), against the Closed demo cases `CASE9000006` and `CASE9000010`.

That UI Policy is now the form-layer half of row 8: condition `status=Closed`, `on_load=true`, `global=true`,
`run_scripts=false`, and one `sys_ui_policy_action` per writable field setting the action table's `disabled`
("Read only") column to `true` for `type`, `status`, `priority`, `subject`, `description`, `requester_name`,
`requester_email`, `assigned_group`, `assigned_agent` and `pending_reason`. `number`, `opened_date`, `closed_date`
and `duration_to_close` need no action — each already carries `read_only=true` in `sys_dictionary`, which is why
they render as static text on the Closed form.

Three properties of that policy matter to this state machine:

- **It enforces nothing, and nothing was moved into it.** `block_terminal_closed` (order 100) remains the
  enforcement layer and is unchanged. A UI Policy runs in the browser, so it says nothing about a write through the
  Table API, from a script, or through a list inline edit — every one of those is still refused by the Business
  Rule with the verbatim message.
- **The no-op save the guard allows is now the only thing Update can do.** With no writable control on the form, a
  Closed case cannot be dirtied through the form, so pressing Update produces the "changed nothing" save that
  `validateClosedRecordUnchanged` deliberately still accepts, and the operator sees no error banner for a gesture
  that changed nothing.
- **`reverse_if_false` is `false`, unlike the companion party policies.** The reverse of "read only" is an explicit
  "make writable", which would be applied to all ten fields on every *non*-Closed case form — including
  `assigned_group` and `assigned_agent`, whose write access AAP Section 0.5.6 restricts through the field-level ACLs
  in [`../acl/`](../acl/). Announcing "writable" to an `x_casemgmt_case_viewer` on the other five statuses would be
  the same defect this policy closes, pointed at the ACL matrix instead of at the terminal state. Nothing is lost by
  leaving the reverse off: a Closed row can never legally leave Closed, and its `status` control is itself read-only
  here, so no in-form reverse is reachable.

## Per-Transition Implementation Map

This section maps each transition row in the matrix to the specific subflow and/or business rule that enforces it. Each transition is evaluated in two places: the record trigger of the parent flow (`general_inquiry_state_machine` or `complaint_state_machine`), which runs after the write commits, and the before-update business rule `enforce_forward_transitions` (order 250), which runs the same subflow synchronously *before* the write and is therefore the component that actually blocks the transition and surfaces the message. Supporting business rules handle the prohibitions and side-effects.

| Transition | Validation Subflow | Supporting Business Rule(s) | Verbatim Error Message |
| --- | --- | --- | --- |
| Draft → Open | `validate_open_transition.xml` | `enforce_forward_transitions.xml` (order 250) | `"Required field assigned_group is empty."` (from `CaseTransitionValidator`) |
| Open → In Progress | `validate_inprogress_transition.xml` | `enforce_forward_transitions.xml` (order 250), `validate_assigned_agent_membership.xml` | `"Assigned agent must be set and must be a member of the assigned group."` (from `CaseTransitionValidator`) |
| In Progress → Pending | `validate_pending_transition.xml` | `enforce_forward_transitions.xml` (order 250) | n/a — no blocking precondition |
| Pending → In Progress | (handled by parent flow conditions) | `clear_pending_reason_on_inprogress.xml` | n/a |
| In Progress → Resolved | `validate_resolved_transition.xml` | `enforce_forward_transitions.xml` (order 250) | `"All tasks must be closed before resolving this case."` (VERBATIM) |
| Resolved → Closed | `validate_closed_transition.xml` | `enforce_forward_transitions.xml` (order 250), `set_closed_date.xml` | `"Only case managers can close cases."` (from `CaseTransitionValidator`) |
| Any → Draft | (none) | `block_draft_backtransition.xml` | `"Cases cannot be returned to Draft."` (VERBATIM) |
| Closed → * | (none) | `block_terminal_closed.xml` | `"Closed cases are terminal and cannot be modified."` (VERBATIM) |
| Any edge not listed above (e.g. `Draft → Closed`) | (none) | `enforce_forward_transitions.xml` (order 250), STEP 0 → `CaseTransitionValidator.validateTransitionEdge()` | `"A case cannot go from <from> to <to>. From <from> the only valid next status is <next>."` |
| Any field edit on a `Closed` row | (none) | `block_terminal_closed.xml` → `CaseTransitionValidator.validateClosedRecordUnchanged()` | `"Closed cases are terminal and cannot be modified."` (VERBATIM) |

The three "VERBATIM" rows in the table above MUST surface the EXACT error text on the form — character-for-character match with AAP Sections 0.5.5 and 0.7.4. The remaining messages come from `CaseTransitionValidator` and reach the form unaltered, because `enforce_forward_transitions` passes the validator's `error` string straight to `gs.addErrorMessage()` rather than restating it. A blocked save also renders ServiceNow's stock `Invalid update` banner alongside the specific message; that is normal `setAbortAction(true)` behavior.

## UI Action Visibility Per Transition

The state-machine transitions are surfaced in the internal user UI as form buttons (UI Actions) on the `x_casemgmt_case` form. Each UI Action is gated by a visibility condition that re-implements the role-based authorization model from the ACL matrix (see [`acl-matrix.md`](./acl-matrix.md)) plus the source-status precondition for the transition.

| UI Action | File | Visible to Role(s) | Source Status | Visibility `condition` | Server-Side Validator Call |
| --- | --- | --- | --- | --- | --- |
| **Open** | `x_casemgmt_case_open.xml` | `x_casemgmt_case_manager` only | `Draft` | inline, 76 chars | `CaseTransitionValidator.canTransitionToOpen(current)` |
| **Start Progress** | `x_casemgmt_case_start_progress.xml` | `x_casemgmt_case_manager` OR assigned `x_casemgmt_case_agent` | `Open` | `canShowAction(current, 'Open')` | `CaseTransitionValidator.canTransitionToInProgress(current)` |
| **Set Pending** | `x_casemgmt_case_set_pending.xml` | `x_casemgmt_case_manager` OR assigned `x_casemgmt_case_agent` | `In Progress` | `canShowAction(current, 'In Progress')` | (no validator call — `pending_reason` is captured via UI prompt) |
| **Resume** | `x_casemgmt_case_resume.xml` | `x_casemgmt_case_manager` OR assigned `x_casemgmt_case_agent` | `Pending` | `canShowAction(current, 'Pending')` | (no validator call — clears `pending_reason` via cooperating BR) |
| **Resolve** | `x_casemgmt_case_resolve.xml` | `x_casemgmt_case_manager` OR assigned `x_casemgmt_case_agent` | `In Progress` | `canShowAction(current, 'In Progress')` | `CaseTransitionValidator.canTransitionToResolved(current)` (verbatim error) |
| **Close** | `x_casemgmt_case_close.xml` | `x_casemgmt_case_manager` only (`form_style=destructive`) | `Resolved` | inline, 79 chars | `CaseTransitionValidator.canTransitionToClosed(current)` |

### Why four of the six conditions are a Script Include call

`sys_dictionary` declares `sys_ui_action.condition` as a `condition_string` with **max_length 254** — a hard platform
limit. The four conditions that also carry the "Assigned only" agent branch were 264–271 characters, so the platform
silently truncated each one **mid-expression** on import (the Resolve condition ended
`…isMemberOf(current.assigned_grou`). A truncated condition cannot evaluate, and the platform's failure mode is to
**fail open with nothing in the server log**: `Start Progress`, `Set Pending`, `Resume` and `Resolve` rendered on
every one of the six statuses for every identity — including the read-only `x_casemgmt_case_viewer`, whose form
carries no Update button at all. The two manager-only conditions fit inside the limit and were correct throughout.

The expression now lives in `x_casemgmt.CaseTransitionValidator.canShowAction(caseGr, requiredStatus)` and each
condition is a 71–78 character call, which cannot be truncated. `canShowAction` implements the same rule the inline
expression did — the case is in the required status AND (the user is a manager OR the user is an agent who is either
the `assigned_agent` or a member of `assigned_group`) — and it fails **closed**, returning false for a missing record
or a missing status.

There is a second reason the condition must carry the whole guard on this release: **`sys_ui_action` has no `roles`
column here.** UI Action role restrictions live in the m2m table `sys_ui_action_role`, so a `<roles>` element in a
serialized `sys_ui_action` payload is inert on import and grants no gating at all. The `condition` is the only guard
the platform honours, which is exactly why it must be short enough to survive import. The "Visible to Role(s)"
column above therefore describes what `canShowAction` (or the inline expression) enforces, not a `<roles>` field.

### Set Pending is the one client-side action, and its submit name matters

Five of the six actions are server-side only (`client=false`). `Set Pending` is a hybrid: its client half prompts for
the `pending_reason`, validates it against the three Choice labels, writes it with `g_form.setValue`, and then submits
the form so the server half can perform the transition. That submit **must** name the action's own `action_name`:

```js
gsftSubmit(null, g_form.getFormElement(), 'x_casemgmt_case_set_pending');
```

An earlier revision passed `'sysverb_x_casemgmt_case_set_pending'`. The `sysverb_` prefix is reserved for the
platform's own stock verbs, so the lookup could never resolve a custom action, the platform answered `Unable to find
UI Action with name 'sysverb_x_casemgmt_case_set_pending' on table 'x_casemgmt_case'`, and the server half never ran
— the button was completely non-functional while its client-side validation kept working convincingly, which is what
made the failure easy to miss. The transition itself was always reachable by editing `status` and `pending_reason`
directly, so the AAP §0.5.5 row 3 rule was met; the button was not.

### Design Decision: Open Button — Manager Only

The **Open** UI Action is intentionally restricted to `x_casemgmt_case_manager` (rather than allowing both `case_manager` and `case_agent`) because `assigned_group` is itself a manager-restricted field per the ACL matrix:

- The field-level ACL `x_casemgmt_case_assigned_group_field_acl` permits writes ONLY by `case_manager` (see [`acl-matrix.md`](./acl-matrix.md) "Field-Level ACLs"). Agents cannot write `assigned_group`.
- The Draft → Open transition's required precondition is `assigned_group populated` (AAP Section 0.5.5 row 1).
- Therefore the act of placing a case in a state where it CAN transition to Open is, by ACL definition, a manager-only operation. Agents have no path to set the `assigned_group` field, so making them visible on a button that requires that field's value would be UX-misleading: they would see the button on cases the manager has populated, but pre-population is the manager's domain.
- Functionally, agents become first-class participants on the case starting at Open → In Progress (the **Start Progress** button), where the ACL "Assigned only" condition gives them write access via the assigned_agent / assigned_group dot-walks. From that point through Resolve, agents share the action surface with managers.

This decision intentionally departs from a simpler "all transitions visible to both roles" model. The trade-off favors UX clarity (the button only appears when the operator has authority to use it) over surface uniformity. The behavioral effect is identical to a hypothetical "agents see the button but every click fails the validator" model — in both cases agents cannot drive Draft → Open. The chosen design simply removes the misleading button.

The departure is intentional and is preserved here as the canonical design rationale. The rule lives in ONE place — the `<condition>` field of `x_casemgmt_case_open.xml` (`current.status == 'Draft' && gs.getUser().hasRole('x_casemgmt_case_manager')`, 76 characters, inline because it fits) — and is not duplicated in the Script Include `CaseTransitionValidator` (which performs the same check whether or not the UI Action is visible). This means the rule can be relaxed in a future iteration (allowing agents to see the button) by switching that one condition to `canShowAction(current, 'Draft')`, without touching any other artifact. The same applies to `Close`, whose 79-character manager-only condition is inline for the same reason. Note that the `<roles>` element in these payloads does **not** contribute to the gate on this release — see the note above on `sys_ui_action_role`.

## Subflow Specifications

Each transition is encapsulated as a reusable subflow under [`../flows/sub_flows/`](../flows/sub_flows/). Subflows are called from both case-type flows (`general_inquiry_state_machine` and `complaint_state_machine`) so that the validation logic exists in exactly one place per transition.

All five subflows share one shape: a single mandatory String input `case_sys_id`; one step invoking the scoped Custom Action [`Case Transition Guard`](../flows/custom_actions/x_casemgmt_transition_guard_action.xml) with a literal `target_status`; and an `Assign Subflow Outputs` step. Each returns two String outputs — `blocked` (`'true'`/`'false'`) and `error_message`. A subflow therefore *reports* a verdict rather than throwing: the caller decides what to do with it. The order-250 business rule is the caller that turns `blocked = 'true'` into `gs.addErrorMessage(error_message)` plus `current.setAbortAction(true)`, which is what the user sees on the form. All guard logic itself lives in `x_casemgmt.CaseTransitionValidator`, reached through the Custom Action, so there is exactly one implementation of each rule.

The Custom Action dispatches **fail-closed**. Its verdict variable carries no optimistic initial value, `Pending` is an explicit allow branch (AAP Section 0.5.5 defines no precondition for `In Progress → Pending`), and a terminal `else` returns `blocked = 'true'` with `error_message = "Unsupported target status."` for any `target_status` outside `Open`, `In Progress`, `Pending`, `Resolved`, `Closed` — including an empty string or a mis-cased variant such as `in progress`. No shipped caller can reach that branch: the five subflows pass fixed literals and the order-250 business rule dispatches through a whitelist map keyed on the same five statuses. It exists so that a mis-wired or future caller is refused and diagnosed instead of silently authorised. A `case_sys_id` that resolves to no row is refused the same way, with `"Case record is missing."`

### validate_open_transition

- **Invoked when:** the target status is `Open` — from the parent flow after commit, and from `enforce_forward_transitions` before the write (`target_status = Open`)
- **Validation:** `CaseTransitionValidator.canTransitionToOpen()` — `assigned_group` is non-null
- **Pass:** `blocked = 'false'`, `error_message = ''`
- **Fail:** `blocked = 'true'`, `error_message = "Required field assigned_group is empty."`

### validate_inprogress_transition

- **Invoked when:** the target status is `In Progress` (`target_status = In Progress`)
- **Validation 1:** `current.assigned_agent` is non-null
- **Validation 2:** `current.assigned_agent` is a member of `current.assigned_group` (verified via `sys_user_grmember` query)
- **Pass:** `blocked = 'false'`, `error_message = ''`
- **Fail:** `blocked = 'true'`, `error_message = "Assigned agent must be set and must be a member of the assigned group."`
- **Implementation note:** both checks live in `CaseTransitionValidator.canTransitionToInProgress()`, which uses `isAgentInGroup()`

### validate_pending_transition

- **Invoked when:** the target status is `Pending` (`target_status = Pending`)
- **Validation:** none that can block — `pending_reason` is captured on the form, and AAP Section 0.5.5 defines no blocking precondition for this transition
- **Pass:** `blocked = 'false'`, `error_message = ''` for every well-formed case
- **Why it exists:** so that all six statuses are routed through one uniform mechanism rather than some being silently unguarded

### validate_resolved_transition

- **Invoked when:** the target status is `Resolved` (`target_status = Resolved`)
- **Validation:** GlideRecord query against `x_casemgmt_case_task` where `case == current.sys_id AND status != Closed` returns ZERO rows
- **Pass:** `blocked = 'false'`, `error_message = ''`
- **Fail:** `blocked = 'true'`, `error_message = "All tasks must be closed before resolving this case."` (VERBATIM)
- **Implementation note:** the query lives in `CaseTransitionValidator.getOpenTaskCountForCase()`, consumed by `canTransitionToResolved()`, so the logic is centralized in the Script Include

### validate_closed_transition

- **Invoked when:** the target status is `Closed` (`target_status = Closed`)
- **Validation:** the acting user holds the role `x_casemgmt_case_manager`
- **Pass:** `blocked = 'false'`, `error_message = ''`; the `set_closed_date` business rule then populates `closed_date`
- **Fail:** `blocked = 'true'`, `error_message = "Only case managers can close cases."`
- **Implementation note:** `CaseTransitionValidator.canTransitionToClosed(caseGr, userId)` is called with `gs.getUserID()`. In a scoped context `gs.getUser(<name>)` ignores its argument and returns the session user, so the acting user must be passed explicitly — this is what makes the check correct under UI **Impersonate**.

## Business Rule Specifications

Business rules complement the Flow Designer flows by providing pre-save guards that fire on EVERY update (not just on status change). They enforce the absolute prohibitions (Any → Draft, Closed → *), the forward-transition preconditions (via `enforce_forward_transitions`, which runs the validation subflows synchronously), and the auto-population rules (`opened_date`, `closed_date`). Business rules are essential because they are the only layer that can *refuse* a write: a flow's record trigger fires after the commit, whereas a `before` business rule can call `setAbortAction(true)`. They also guard direct Table API writes, scripted REST calls, background scripts, and any other code path that writes to `x_casemgmt_case`.

The execution chain on `x_casemgmt_case` is: **100** `block_terminal_closed` → **200** `block_draft_backtransition` → **250** `enforce_forward_transitions` → **300** `validate_assigned_agent_membership` → **400** `clear_pending_reason_on_inprogress` → **500** `set_closed_date`; plus `set_opened_date` on insert. The prohibitions are evaluated before the forward preconditions, so a Closed-case edit or an Any→Draft attempt is refused with its own verbatim message rather than being re-diagnosed as a precondition failure.

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

A reusable Script Include centralizes the transition guard logic so it can be called from both case-type flows
AND from business rules without duplication. This is the ServiceNow-native equivalent of ArkCase's
`ChangeCaseFileStateService`.

**The authoritative source is
[`../script_includes/x_casemgmt_CaseTransitionValidator.xml`](../script_includes/x_casemgmt_CaseTransitionValidator.xml).**
This section documents its *contract* rather than reproducing its body: an earlier revision of this document
carried a pseudocode copy that drifted out of date — it showed boolean returns, a no-argument
`canTransitionToClosed()` and a method named `isAgentMemberOfGroup`, none of which match the delivered code.
Read the artifact for the implementation; read the contract below to call it correctly.

### The contract

Every guard takes the case `GlideRecord` and returns a **verdict object**, never a boolean:

```
{ ok: true }                       // the transition is permitted
{ ok: false, error: '<message>' }  // refused; error is the exact text to show the user
```

| Method | Signature | Refuses when |
| --- | --- | --- |
| `canTransitionToOpen` | `(caseGr)` | `assigned_group` is empty |
| `canTransitionToInProgress` | `(caseGr)` | `assigned_agent` is empty, or is not a member of `assigned_group` (delegated to `isAgentInGroup`) |
| `canTransitionToResolved` | `(caseGr)` | any child `x_casemgmt_case_task` has `status != Closed` — refusal message is the verbatim `All tasks must be closed before resolving this case.` |
| `canTransitionToClosed` | `(caseGr, userId)` | the user identified by `userId` does not hold `x_casemgmt_case_manager` |
| `isAgentInGroup` | `(userSysId, groupSysId)` | — returns a plain `boolean`; it answers a membership question, not a transition question, so a verdict object would add nothing |

A missing or null `caseGr` is itself a refusal — `{ ok: false, error: 'Case record is missing.' }` — so a caller
never has to null-check before asking.

### How the acting user is resolved, and why it is passed explicitly

`canTransitionToClosed` takes the acting user's `sys_id` as its second argument, and the caller supplies it:
the order-250 Business Rule passes `gs.getUserID()`. It is explicit rather than implicit for a reason that was
measured on this platform, not assumed:

- **If `userId` is empty, or equals the current session user**, the role is read from `gs.getUser()`.
- **If `userId` names a *different* user**, the grant is resolved with a `GlideRecord` query against
  `sys_user_has_role` — the platform's own store of *effective* grants, which already accounts for roles
  inherited through groups and through role containment.
- **`gs.getUser(userName)` is not used, and must not be.** On this release it **ignores its argument and returns
  the session user**. An earlier revision of the third branch called
  `gs.getUser(userGr.getValue('user_name')).hasRole(...)` and therefore answered with the *caller's* roles rather
  than the named user's — which let a non-manager pass the Resolved → Closed guard and receive `{ ok: true }`.
  That was a silent bypass of the AAP §0.5.5 rule, it was caught by assertion **A9** of the transition-logic
  regression harness (A9 is the `canTransitionToClosed` non-manager assertion; A10 is the any → Draft assertion —
  see the per-assertion table in
  [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.7](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)), and it is fixed.

The Script Include is `access=package_private`, so nothing outside the application can instantiate it — which is
also why the regression harness has to run **in scope** rather than from Global.

### Where enforcement actually happens

The Script Include decides; it does not block. The blocking is done by the before-update Business Rule
`x_casemgmt_enforce_forward_transitions` at **order 250**, which:

1. calls the matching subflow through `sn_fd.FlowAPI.getRunner()` and reads its `blocked` output;
2. calls the matching `canTransitionTo…` method directly for the in-flight verdict;
3. **cross-checks the two** and logs a server-side discrepancy if the flow's `blocked` disagrees with `!ok`;
4. on refusal, calls `gs.addErrorMessage(verdict.error)` followed by `current.setAbortAction(true)` — the message
   on the form and the cancelled write, respectively;
5. treats an unusable verdict as a refusal: if the guard throws, or returns something that is not a verdict
   object, or returns `ok: false` with an empty `error`, the rule aborts the write with a generic message and logs
   the detail. **Enforcement never depends on the guard succeeding.**

Step 3 is not decoration, and step 2 is the one that decides. A subflow reads the **committed** row, so when the
transition's precondition field is written in the *same* save as the status — `assigned_group` on
`Draft → Open`, `assigned_agent` on `Open → In Progress`, which is the natural gesture on the form — the
subflow sees the field still empty and returns a **false `blocked = true`**. The in-flight evaluation reads
`current`, returns the correct verdict, and wins. Measured on the instance: a case that set the group and then
the agent in-save logged the divergence for both edges, and both saves correctly succeeded; the control case
that set the agent in a *prior* save logged no divergence for the same `Open → In Progress` edge, because the
subflow then read a row that already had the agent. So **for same-transaction field-plus-status saves the
subflow verdict is advisory and discarded, and the Script Include is the authoritative gate** — the flows
execute (their `sys_flow_context` rows complete on every save) but do not decide on that path. The divergence
is logged rather than suppressed so it is visible in `syslog` rather than folklore. Full evidence, including
the verbatim log line and the control, is in
[`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §3.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).

The Script Include uses NO hard-coded `sys_id`s; all references are passed in as parameters or resolved via
`gs.hasRole(<roleName>)` and by query. This complies with AAP Section 0.7.2 ("No-hardcoded-`sys_id` constraint")
and keeps the Update Set portable to any fresh PDI.

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
12. Attempt to change any field on the Closed case (change `priority` only, leaving `status` alone) → verbatim error: `"Closed cases are terminal and cannot be modified."`; then attempt a status change out of Closed → the same verbatim error. Pressing Update with nothing edited is accepted, and is the one save a Closed case still allows
13. Attempt a skip edge on a fresh Draft case — set status straight to `Closed` — → form-level error `A case cannot go from Draft to Closed. From Draft the only valid next status is Open.`, `status` still `Draft` after reload and `closed_date` still empty. `Open → Closed`, `Pending → Resolved` and `Resolved → Open` are refused the same way
14. Repeat the entire procedure with a Complaint case
15. Open `CASE9000006` (Closed, General Inquiry) and `CASE9000010` (Closed, Complaint) as `x_casemgmt_demo_manager` and confirm every field renders read-only — `type`, `status`, `priority`, `subject`, `description`, `requester_name`, `requester_email`, `assigned_group`, `assigned_agent` and `pending_reason` from [`../ui_policy/x_casemgmt_case_closed_readonly.xml`](../ui_policy/x_casemgmt_case_closed_readonly.xml), and `number`, `opened_date`, `closed_date` and `duration_to_close` from their dictionary `read_only` flags. No transition button is present; the reference pickers on `assigned_group`/`assigned_agent` are inert. Then press Update: the save is accepted as a no-op and no error banner appears
16. Confirm the policy is inert on a live case: open a `Draft`, an `Open`, an `In Progress`, a `Pending` and a `Resolved` case and confirm the same ten fields are editable exactly as their dictionary and field-level ACLs dictate — for a manager, for the assigned agent, and for the read-only viewer, whose form must stay read-only. The policy has no reverse actions, so it must not have changed any of those three states

## Known Open Limitations — Terminal-State and Native List Presentation

The items below are **OPEN**. Each was observed at runtime, each was traced, and none of them is closed by the
records this application ships. They are recorded here — the state machine's own document, because the terminal
state is what the first two are about and because this document is the one in scope for the round that traced them
— with the exact change each would need and the rule that puts that change out of reach. The application's general
limitation register is [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md); these
entries belong there too and are cross-referenced rather than duplicated.

The screenshot file names cited are QA evidence held uncommitted under `blitzy/screenshots/` at the repository root.

### L1 — After an aborted transition the action set reflects the rejected status until reload

**Observed** (QA `Issue 17`, first half; `qa4-ui-blocking-1-resolved-open-task-1280.png`): attempting
`In Progress → Resolved` with an open child task is refused with the verbatim
`"All tasks must be closed before resolving this case."` and nothing persists — but the redisplayed form can carry
the *rejected* status in its `status` control, and the buttons drawn beside it are the ones that belong to that
rejected status, until the record is reloaded.

**Traced.** Not caused by any record in this application. All six UI Actions are evaluated **server-side** against
`current` and each requires an exact, single, non-Closed source status — `x_casemgmt_case_open.xml`
(`current.status == 'Draft'`), `x_casemgmt_case_start_progress.xml` (`canShowAction(current, 'Open')`),
`x_casemgmt_case_set_pending.xml` and `x_casemgmt_case_resolve.xml` (`canShowAction(current, 'In Progress')`),
`x_casemgmt_case_resume.xml` (`canShowAction(current, 'Pending')`) and `x_casemgmt_case_close.xml`
(`current.status == 'Resolved'`) — and `CaseTransitionValidator.canShowAction()` returns `false` unless
`caseGr.getValue('status')` equals the requested status exactly. The conditions are correct; what changes after an
abort is their **input**. `setAbortAction(true)` cancels the write but leaves the in-memory `current` holding the
submitted values, and the form the platform renders in response to the aborted submit evaluates the conditions
against that record rather than against a fresh read of the row. A Closed case, which is never the product of an
abort, is unaffected: `qa4-ui-case10-closed-form-1280.png` shows no transition button at all on `CASE9000010`.

**The change that would close it.** Make the visibility predicate read the **persisted** row rather than the
in-flight one: inside `CaseTransitionValidator.canShowAction()`, resolve the case with
`var fresh = new GlideRecord('x_casemgmt_case'); fresh.get(caseGr.getUniqueValue());` and compare
`fresh.getValue('status')`, falling back to `caseGr` when the row does not yet exist (an insert form). The two
inline conditions in `x_casemgmt_case_open.xml` and `x_casemgmt_case_close.xml` would have to move to the same
predicate to stay consistent, and both must remain inside the 254-character `sys_ui_action.condition` limit
documented above, so they would delegate rather than inline the lookup.

**Why it is open.** That is one coordinated change to the shared visibility predicate in
[`../script_includes/x_casemgmt_CaseTransitionValidator.xml`](../script_includes/x_casemgmt_CaseTransitionValidator.xml),
consumed by four UI Actions plus the two inline conditions; the component was not opened by the round that traced
this, and changing four of six call sites while leaving two on the old input would make the six buttons behave
differently from one another — a worse state than one uniform, disclosed behaviour. It cannot be closed from the
client either: reconciling the displayed action set in the browser needs an authoritative read of the persisted
status, which means a `GlideAjax` processor or a display Business Rule seeding `g_scratchpad`, plus a re-evaluation
of each button's role-and-status logic in client script — i.e. the six server-side conditions restated in the
browser, which AAP Section 0.7.2's declarative-mechanism constraint and the single-source-of-truth design of
`CaseTransitionValidator` both refuse. Reloading the record shows the true state and the correct action set; the
persisted row is never wrong.

### L2 — A Closed case still shows the platform's `Update` button

**Observed** (QA `Issue 17`, second half; `qa4-ui-case10-closed-form-1280.png`): `Update` and `Delete` render on a
Closed case.

**Traced.** Both are out-of-the-box `sys_ui_action` records in the **global** scope. Since
[`../ui_policy/x_casemgmt_case_closed_readonly.xml`](../ui_policy/x_casemgmt_case_closed_readonly.xml) makes every
writable control read-only, `Update` can no longer submit a change — it produces the no-op save
`validateClosedRecordUnchanged` explicitly allows — and `Delete` is governed by the delete ACLs in
[`../acl/`](../acl/), which grant it to `x_casemgmt_case_manager` only, exactly as AAP Section 0.5.6 specifies.

**The change that would close it.** Hiding `Update` on this table means either editing the global `Update` UI
Action's condition or shipping a scoped override of it.

**Why it is open.** AAP Section 0.3.2 prohibits global-scope changes of any kind, restated as scoped-namespace
exclusivity in AAP Section 0.7.2. The remedy is out of bounds for this package by rule.

### L3 — Related lists overflow horizontally at 375px with no persistent scroll cue

**Observed** (QA `Issue 15` and the native-list half of QA `Issue 10`;
`qa4-ui-case3-parties-list-375.png`): at a 375px viewport the Case Tasks and Case Parties related lists on the case
form are wider than the column, reachable only through internal horizontal scrolling, and the platform paints no
persistent cue that content continues to the right.

**Traced.** Neither the overflow container nor its (absent) cue is authored by this application: they are the
platform's stock list component and its global stylesheets. The *column count* that provokes the overflow comes from
the **child** tables' own list layouts, not from
[`../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml`](../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml),
whose two entries carry only `related_list`, `position`, `filter`, `order_by` and `list_id` — read back from
`sys_dictionary`, those and the audit columns are the whole of `sys_ui_related_list_entry`, so the record has no
column set and no rendering control to offer. The default list layout for `x_casemgmt_case_party` is
`number, case, organization, party_type, person, role_label` and for `x_casemgmt_case_task` it is
`number, assigned_to, case, due_date, status, subject, type`; the related list renders those minus the relationship
field, which is what exceeds 375px.

**The change that would close it.** Two independent changes, and both are needed for the cue itself: (a) a sticky
first column and a persistent overflow affordance in the list component, which is global CSS and global UI macros;
and (b) if the intent is instead to avoid the overflow, a related-list-specific `sys_ui_list` for each child table
(`name` = child table, `parent` = `x_casemgmt_case`, `relationship` = the reference field) carrying a reduced column
set, which is a new record for `x_casemgmt_case_task` and `x_casemgmt_case_party`.

**Why it is open.** (a) is a global-scope change, prohibited by AAP Section 0.3.2 and AAP Section 0.7.2. (b) would
suppress fields AAP Section 0.4.4 requires to be surfaced on these tables' lists and would need records for tables
this document's owning artifact does not describe; it is a scope decision for the AAP, not a defect fix, and is
recorded here rather than taken.

### L4 — Native list controls are 16–22px, below the 44×44px checkpoint standard

**Observed** (QA `Issue 10`, native-list portion; `qa4-ui-case3-parties-list-375.png`): the list's row links, row
check boxes, column-sort arrows, filter/personalize icons and inline-edit affordances measure 16–22px.

**Traced.** Every one of those controls is emitted by the platform's list renderer and sized by global
stylesheets. The application's own list artifacts —
[`../list_layouts/sys_ui_list_x_casemgmt_case_default.xml`](../list_layouts/sys_ui_list_x_casemgmt_case_default.xml)
and the related-list record above — choose **which** columns and lists appear; they carry no property that
influences how the platform paints a control.

**The change that would close it.** Increase the hit areas in the platform's list stylesheets, or ship a scoped
style sheet that overrides them for these tables.

**Why it is open.** Both are global-scope changes to out-of-the-box components, prohibited by AAP Section 0.3.2, and
AAP Section 0.4.4 mandates the platform's default styling for this application's surfaces.

### L5 — Reference lookup and preview buttons carry `tabindex="-1"`

**Observed** (QA `Issue 10`, native-form portion; `qa4-ui-reference-preview-dialog-1280.png`): the magnifier
(lookup) and ⓘ (preview) buttons beside `assigned_group` and `assigned_agent` are visible, mouse-operable controls
that the keyboard tab sequence skips.

**Traced.** The buttons are emitted by the platform's stock reference-field macro in the global scope. The
single-column form section in
[`../form_layout/sys_ui_section_x_casemgmt_case_default.xml`](../form_layout/sys_ui_section_x_casemgmt_case_default.xml)
guarantees that the stops which *are* reachable are reached in reading order, and it cannot alter that markup. The
same finding is recorded on that artifact as the one part of QA finding F13 it could not fix.

**The change that would close it.** Give those buttons a focusable tab stop and a keyboard activation path in the
reference-field macro.

**Why it is open.** The macro is a global-scope out-of-the-box component; AAP Section 0.3.2 prohibits modifying it.

### L6 — The reference preview extends about 310px below the fold and wraps its labels mid-word

**Observed** (QA `Issue 15`; `qa4-ui-reference-preview-dialog-1280.png`): opening the ⓘ preview on
`assigned_agent` at 1280×900 renders a popover that reaches the right edge of the viewport, continues roughly 310px
below the fold, and breaks its own field labels mid-word (`Departme|nt`, `Notificatio|n`).

**Traced.** The popover, its placement logic and its two-column label grid are the platform's stock
reference-preview dialog; its content is the out-of-the-box `sys_user` form, which is why the labels that wrap are
`sys_user`'s and not this application's. Its anchor is the `assigned_agent` control, which sits at form position 11
— and that position is fixed by AAP Section 0.4.4, which mandates the field order
`subject, type, status, priority, description, requester_name, requester_email, opened_date, closed_date,
assigned_group, assigned_agent`. Moving the reference fields higher up the form to give the popover more room would
violate that order, and at roughly 700px tall the popover overflows a 900px viewport from any anchor on this form.

**The change that would close it.** Constrain and reposition the popover within the viewport, and widen its label
column, in the reference-preview component.

**Why it is open.** That component is global-scope and out-of-the-box (AAP Section 0.3.2), and the alternative of
reordering the form is refused by AAP Section 0.4.4. `Open Record` inside the popover reaches the same data on a
full page, and the preview is not the only path to it — but the popover itself remains as described.

### L7 — Choosing `Closed` in the status list freezes the form until reload

**Observed by design review of** [`../ui_policy/x_casemgmt_case_closed_readonly.xml`](../ui_policy/x_casemgmt_case_closed_readonly.xml),
**disclosed rather than found by QA.** A manager who selects `Closed` from the status choice list on a `Resolved`
case — rather than pressing the `Close` button — trips the policy's condition on that change: the ten fields,
`status` among them, become read-only immediately, so the selection cannot be taken back on screen.

**Traced.** A UI Policy condition is evaluated against the form's current values, and the platform takes `status`
as a watched field from the condition itself; there is no "persisted value" operand available to a UI Policy
condition. `reverse_if_false` does not change this: with the reverse enabled the freeze would be equally
irreversible, because `status` is one of the frozen fields.

**The change that would close it.** Nothing within the UI Policy mechanism. It would take a client-side guard that
distinguishes the on-screen value from the persisted one — the same authoritative-read problem as L1.

**Why it is open, and why the trade is the right way round.** The supported path into Closed is
[`../ui_action/x_casemgmt_case_close.xml`](../ui_action/x_casemgmt_case_close.xml), a server-side action
(`client=false`) that writes `current.status` on the server and never touches the form control. A reload restores
the true state, no data is changed by the freeze, and the alternative — leaving `status` writable on a Closed case —
would reopen QA `Issue 17` on the one field AAP Section 0.5.5 row 8 names explicitly.

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
- [`../flows/general_inquiry_state_machine.xml`](../flows/general_inquiry_state_machine.xml) — General Inquiry flow
- [`../flows/complaint_state_machine.xml`](../flows/complaint_state_machine.xml) — Complaint flow
- [`../flows/sub_flows/`](../flows/sub_flows/) — five subflows
- [`../script_includes/x_casemgmt_CaseTransitionValidator.xml`](../script_includes/x_casemgmt_CaseTransitionValidator.xml) — reusable transition guards
- [`../business_rules/`](../business_rules/) — six business rules
- [`../ui_policy/x_casemgmt_case_closed_readonly.xml`](../ui_policy/x_casemgmt_case_closed_readonly.xml) — the form-layer half of transition-matrix row 8: every writable field of a Closed case rendered read-only, over the unchanged `block_terminal_closed` guard
- [`../ui_action/`](../ui_action/) — the six transition buttons whose visibility conditions this document tabulates

