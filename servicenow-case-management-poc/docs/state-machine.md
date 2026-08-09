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

## Per-Status Descriptions

### Draft

The default initial state for any new case. Set by the table-level default value on `x_casemgmt_case.status` and reinforced by the `set_opened_date` business rule. Cases submitted via the external Experience Portal also start in Draft. From Draft, the only legal transition is Draft → Open, which requires `assigned_group` to be populated.

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

### Closed

Terminal state. Entering Closed requires the caller to have the `x_casemgmt_case_manager` role. The transition auto-populates `closed_date = gs.nowDateTime()` via the `set_closed_date` business rule. NO transitions are permitted from Closed; any attempt to modify a Closed case raises the verbatim error `"Closed cases are terminal and cannot be modified."` (enforced by the `block_terminal_closed` business rule).

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

The three "VERBATIM" rows in the table above MUST surface the EXACT error text on the form — character-for-character match with AAP Sections 0.5.5 and 0.7.4. The remaining messages come from `CaseTransitionValidator` and reach the form unaltered, because `enforce_forward_transitions` passes the validator's `error` string straight to `gs.addErrorMessage()` rather than restating it. A blocked save also renders ServiceNow's stock `Invalid update` banner alongside the specific message; that is normal `setAbortAction(true)` behavior.

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
  That was a silent bypass of the AAP §0.5.5 rule, it was caught by assertion A10 of the transition-logic
  regression harness, and it is fixed.

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
- [`../flows/general_inquiry_state_machine.xml`](../flows/general_inquiry_state_machine.xml) — General Inquiry flow
- [`../flows/complaint_state_machine.xml`](../flows/complaint_state_machine.xml) — Complaint flow
- [`../flows/sub_flows/`](../flows/sub_flows/) — five subflows
- [`../script_includes/x_casemgmt_CaseTransitionValidator.xml`](../script_includes/x_casemgmt_CaseTransitionValidator.xml) — reusable transition guards
- [`../business_rules/`](../business_rules/) — six business rules

