# Workflow Tryout Guide — `x_casemgmt` Case Management POC

> **Audience:** anyone who wants to try the deployed Case Management application on
> `https://dev364430.service-now.com` and see the case lifecycle, role-based access, the external portal, and
> the dashboards in action.
>
> **Honesty note:** wherever a behavior depends on the Flow Designer flows, this guide says so explicitly.
> The seven flows were re-authored natively and now execute, and the four *forward* transition preconditions
> are enforced and blocking on the form (see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`, §3). Two things to expect
> when a transition is refused: a blocked save renders **two** banners — the specific rule message plus
> ServiceNow's stock `Invalid update` — and the redisplayed form briefly echoes the value you submitted.
> **Reload the record** to see the true, unchanged state; the echoed value was never written. Saves also take
> roughly 8–10 seconds, because the guard runs a Flow Designer subflow synchronously.

---

## 0. What you can exercise

| # | Scenario | Works as specified? |
|---|---|---|
| 1 | Drive a case through all six states in the internal UI | ✅ Yes — every transition guard is enforced; see per-transition notes |
| 2 | Tasks linked to a case; "resolve blocked until tasks closed" | ✅ Yes — enforced and blocking on the form |
| 3 | Associate Person / Organization parties (polymorphic) | ✅ Yes (UI policy) |
| 4 | Role-based access: manager / agent / viewer | ✅ Yes (validated) |
| 5 | External portal: submit a case and look up its status | ✅ Yes |
| 6 | Dashboards: Agent Workspace + Manager View | ✅ Records + data present |

---

## 1. Sign in and switch between the demo roles

1. Sign in to `https://dev364430.service-now.com` as **`admin`**.
2. The three demo users have **no passwords set**, so you cannot log in as them directly. Instead use
   **Impersonate** (the standard ServiceNow way to experience another user's access):
   - Click your **profile/avatar menu** (top-right) → **Impersonate user**.
   - Enter one of:
     - `x_casemgmt_demo_manager` — has role `x_casemgmt_case_manager` (full access)
     - `x_casemgmt_demo_agent` — has role `x_casemgmt_case_agent` (assigned-only); member of group `x_casemgmt_demo_team`
     - `x_casemgmt_demo_viewer` — has role `x_casemgmt_case_viewer` (read-only)
   - To stop, open the profile menu again → **End impersonation**.

> Tip: keep one browser tab as `admin` for setup and a second (incognito) tab for impersonation, so you don't
> lose your admin session.

---

## 2. Find the application and its data

- **All cases:** in the Filter Navigator, type `x_casemgmt_case.list` (or open **Case Management** in the app
  navigator). You should see **10 demo cases**, `CASE0000013`–`CASE0000022`.
- **Tasks:** `x_casemgmt_case_task.list`. **Parties:** `x_casemgmt_case_party.list`.
- The case form shows fields in this order: subject, type, status, priority, description, requester_name,
  requester_email, opened_date, closed_date, assigned_group, assigned_agent — with **Related Lists** for
  Tasks and Parties at the bottom.

### Demo data map

| Case | Status | Type | Assignment | Has open task? |
|---|---|---|---|---|
| CASE0000013 | Draft | General Inquiry | unassigned | – |
| CASE0000014 | Open | General Inquiry | group only | – |
| CASE0000015 | In Progress | General Inquiry | group + agent | **yes** |
| CASE0000016 | Pending | General Inquiry | group + agent | **yes** |
| CASE0000017 | Resolved | General Inquiry | group + agent | no |
| CASE0000018 | Closed | General Inquiry | – | – |
| CASE0000019 | Open | Complaint | group only | – |
| CASE0000020 | In Progress | Complaint | group + agent | **yes** |
| CASE0000021 | Resolved | Complaint | group + agent | no |
| CASE0000022 | Closed | Complaint | – | – |

Choice values: **type** = General Inquiry, Complaint · **status** = Draft, Open, In Progress, Pending,
Resolved, Closed · **priority** = Low, Medium, High, Critical · **task type** = Investigation, Review,
Follow-up, Other · **task status** = Open, In Progress, Closed · **party_type** = Person, Organization.

---

## 3. Scenario 1 — Drive a case through the lifecycle (as `admin` or `x_casemgmt_demo_manager`)

Create a new case (**New** on the case list) with at least: subject, description, requester_name, type,
priority. Save — it gets a `CASE…` number and `opened_date` is set automatically (Business Rule). Then change
**status** and **Save** at each step. The intended state machine (AAP §0.5.5):

| Transition | Intended precondition | **Enforced at runtime?** | How to satisfy / what to expect |
|---|---|---|---|
| Draft → Open | `assigned_group` populated | ✅ **Blocked** with "Required field assigned_group is empty." | Set `assigned_group = x_casemgmt_demo_team` |
| Open → In Progress | `assigned_agent` set **and** member of group | ✅ **Blocked** in both cases — an **empty** agent gives "Assigned agent must be set and must be a member of the assigned group." (order-250 guard), and an agent **not** in the group is also blocked by `validate_assigned_agent_membership` | Set `assigned_agent = Demo Agent` (a member of `x_casemgmt_demo_team`) |
| In Progress → Pending | sets `pending_reason` (Awaiting Info / Awaiting Third Party / Other) | The set-on-Pending is a flow action (not running) — **set `pending_reason` manually** | Choose a `pending_reason` value yourself |
| Pending → In Progress | clears `pending_reason` | ✅ **Yes** (Business Rule clears it) | Just change status back to In Progress; watch `pending_reason` clear |
| In Progress → Resolved | **all** linked tasks `Closed` | ✅ **Blocked** — see Scenario 2 | Message on the form: "All tasks must be closed before resolving this case." |
| Resolved → Closed | caller has `x_casemgmt_case_manager`; auto-set `closed_date` | ✅ Both enforced — a non-manager is **blocked** with "Only case managers can close cases.", and for a manager `closed_date` is auto-set (Business Rule) | As a manager, move to Closed and confirm `closed_date`; then Impersonate **Demo Agent** on a `Resolved` case and confirm the block |
| **Any → Draft** | PROHIBITED | ✅ **Blocked** | Try setting a non-Draft case back to Draft → blocked with **"Cases cannot be returned to Draft."** |
| **Closed → anything** | PROHIBITED (terminal) | ✅ **Blocked** | Open `CASE0000018` (Closed) and try to change status → blocked with **"Closed cases are terminal and cannot be modified."** |

**Quick proof of the guards that DO work:**
- Open `CASE0000018` (Closed), change status to *In Progress*, Save → you get **"Closed cases are terminal and
  cannot be modified."** and the change is rejected.
- Open `CASE0000014` (Open), change status to *Draft*, Save → you get **"Cases cannot be returned to Draft."**
- On any case, set `assigned_group = x_casemgmt_demo_team` and `assigned_agent` to a user **not** in that
  group, Save → you get **"Assigned agent must be a member of the assigned group."**

---

## 4. Scenario 2 — Tasks and the resolve-blocking rule

1. Open `CASE0000015` (In Progress). In the **Tasks** related list you'll see at least one task with status
   `Open` or `In Progress`.
2. **Expected behavior:** changing the case **Status** to `Resolved` while a task is still open is blocked
   with **"All tasks must be closed before resolving this case."**
3. **Try it.** Set Status to `Resolved` and click **Update**. Allow 8–10 seconds. You should see two red
   banners: the message above, and ServiceNow's stock `Invalid update`.
4. **Confirm nothing was written.** The redisplayed form will show `Resolved` — that is the value you
   submitted being echoed back, not a saved value. **Reload the record**: Status reads `In Progress` again.
   (This echo is why the form itself is not proof of persistence; a reload or a REST read is.)
5. Now close the open task (set each task `status = Closed`) and set the case to `Resolved` again. This time it
   saves, no banner appears, and after a reload Status reads `Resolved`. The two attempts differ only in the
   task's status, which is the gate under test.
6. The logic lives in the `x_casemgmt.CaseTransitionValidator` Script Include
   (`canTransitionToResolved` counts open child tasks via `getOpenTaskCountForCase` and returns the verbatim
   message). The order-250 business rule `enforce_forward_transitions` runs the
   `validate_resolved_transition` subflow synchronously and passes that message to
   `gs.addErrorMessage()`, so the string on your screen comes from the Script Include unaltered. To see the
   verdict directly, run as admin in a background script (scope `82b99028…`):
   ```javascript
   var v = new x_casemgmt.CaseTransitionValidator();
   // a case sys_id with an open task -> {ok:false, error:"All tasks must be closed before resolving this case."}
   ```
7. To confirm the flow itself ran, open **Flow Designer → Flow Executions** (`sys_flow_context`) and look for
   a `Validate Resolved Transition` row in state `COMPLETE` timestamped at your attempt. A successful case
   transition additionally produces a parent-flow context (`General Inquiry State Machine` or
   `Complaint State Machine`); a *blocked* attempt produces none, because the write never committed.

---

## 5. Scenario 3 — Parties (Person / Organization polymorphism)

1. Open any case → **Parties** related list → **New**.
2. Set **party_type**:
   - Choose **Person** → the **person** field (→ `sys_user`) becomes visible/required and **organization** is
     hidden (UI Policy `x_casemgmt_case_party_conditional_fields`).
   - Choose **Organization** → the **organization** field (→ `core_company`) becomes visible/required and
     **person** is hidden.
3. Set **role_label** (e.g., `Requester`, `Respondent`, `Witness`) and Save.
4. The demo data already includes a mix of Person and Organization parties (companies *Synthetic Org Alpha* /
   *Synthetic Org Beta*).

---

## 6. Scenario 4 — Role-based access (manager / agent / viewer)

Impersonate each demo user (Section 1) and observe the access posture (validated against AAP §0.5.6):

| As… | Create | Read | Write | Delete | What you'll see |
|---|---|---|---|---|---|
| `x_casemgmt_demo_manager` | ✅ | ✅ all | ✅ all | ✅ | Full access; **New** button present; can edit any case; can change `assigned_group`/`assigned_agent`. |
| `x_casemgmt_demo_agent` | ✅ | only **assigned** | only **assigned** | ❌ | Can create; sees/edits only cases where they are the `assigned_agent` **or** a member of `assigned_group` (e.g., `x_casemgmt_demo_team` cases); **no Delete**; cannot change `assigned_group` (manager-only field). |
| `x_casemgmt_demo_viewer` | ❌ | ✅ all | ❌ | ❌ | Read-only — can open and view every case but has no **New**, no **Save**, no **Delete**. |

- **Field-level check (as agent):** open a case you're assigned to — you can edit most fields, but
  `assigned_group` is read-only (manager-only). You can change `assigned_agent` only on a case where you are
  currently the assigned agent (self-handoff), not grab an unassigned case.
- **Assigned-only check (as agent):** the demo agent is a member of `x_casemgmt_demo_team`, so they can see
  the team's cases (e.g., `CASE0000014`–`CASE0000022` that use that group) but **not** the unassigned
  `CASE0000013`.

---

## 7. Scenario 5 — External portal (no login required)

Open the public portal (incognito window, **not** logged in):

**`https://dev364430.service-now.com/x_casemgmt_case_portal`**

### 7.1 Submit a case
1. Go to the **Submit a Case** page.
2. Fill in **subject**, **type**, **description**, **requester_name**, and optionally **requester_email**.
3. Submit → you get a confirmation showing the new **case number** and the message
   **"Your case has been submitted"**. The case is created internally with status **Draft**.
   (Internally verifiable: the new `CASE…` number appears in `x_casemgmt_case.list` with Draft status.)

### 7.2 Look up a case status
1. Go to the **Case Status** page.
2. Enter a valid case number (e.g., one you just submitted, or `CASE0000017`) → it returns only
   **status, subject, and opened_date** (no internal fields such as assignment, description, or
   requester data are exposed).
3. Enter an unknown number (e.g., `CASE9999999`) → it returns **"No case found with that number."**

### 7.3 The same via API (optional)
```bash
SN="https://dev364430.service-now.com"
# submit (anonymous) -> 201 {number, "Your case has been submitted"}
curl -s -H "Content-Type: application/json" -X POST \
  -d '{"subject":"Portal demo","type":"Complaint","description":"demo","requester_name":"Jane Public"}' \
  "$SN/api/x_casemgmt/case_submit"
# lookup -> 200 {status, subject, opened_date}  |  unknown -> 404 "No case found with that number."
curl -s "$SN/api/x_casemgmt/case_status_lookup?number=CASE0000017"
```

> Please delete any cases you create while testing so the demo dataset stays tidy.

---

## 8. Scenario 6 — Dashboards

Open **Self-Service → Dashboards** (or `$pa_dashboard.do`) and select:

- **Agent Workspace** (`x_casemgmt_agent_workspace`): *My open cases* (list), *My overdue tasks* (list),
  *Case count by status* (donut). The "my" lists are user-relative — impersonate `x_casemgmt_demo_agent` to
  populate them with the agent's assigned cases/tasks.
- **Manager View** (`x_casemgmt_manager_view`): *All cases by status* (bar), *All cases by type* (donut),
  *All cases by priority* (bar), *Average time to close* (single score), *Cases opened in last 30 days*
  (single score).

All 8 backing reports exist over the populated tables (10 cases / 10 tasks), so the widgets have data to
render. Report titles: *Case Count by Status, Average Time to Close, Cases Opened in Last 30 Days, My Overdue
Tasks, All Cases by Status, My Open Cases, All Cases by Type, All Cases by Priority*.

---

## 9. Reference — verbatim messages

| When | Message |
|---|---|
| Resolve attempted with an open task (intended; logic in Script Include) | `All tasks must be closed before resolving this case.` |
| Any → Draft attempted (enforced) | `Cases cannot be returned to Draft.` |
| Edit/transition a Closed case attempted (enforced) | `Closed cases are terminal and cannot be modified.` |
| Agent not in the assigned group (enforced when an agent is set) | `Assigned agent must be a member of the assigned group.` |
| Portal lookup, unknown number (enforced) | `No case found with that number.` |
| Portal submit, success (enforced) | `Your case has been submitted` |

---

## 10. Cleanup

If you created test cases/tasks/parties while trying things out, delete them (as `admin`) so the demo set
returns to the original 10 cases (`CASE0000013`–`CASE0000022`). End any impersonation session via the profile
menu → **End impersonation**.
