# Workflow Tryout Guide — `x_casemgmt` Case Management POC

> **Audience:** anyone who wants to try the deployed Case Management application on
> `https://dev306625.service-now.com` and see the case lifecycle, role-based access, the external portal, and
> the dashboards in action.
>
> **Instance note.** `dev306625` is the reachable instance, running **Zurich Patch 10**; its Table API answered
> read-only queries on 2026-09-03, and the application is installed, committed and seeded there. Two earlier
> hosts appear in older revisions of this guide and in other documents in this repository and **neither is usable
> now**: `dev379024` (Australia Patch 3) is **retired and is not used** — figures dated to it are dated evidence
> from that host, not current state — and `dev364430` is **stale and returns HTTP 401**. If a step fails with 401
> or lands on a hibernation page, check the host first.
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
| 3 | Associate Person / Organization parties (polymorphic) | ✅ Yes (UI policy). The case form now also shows a **Case Parties** related list with a **New** button, so you can work from either side |
| 4 | Role-based access: manager / agent / viewer | ✅ Yes, on all three tables |
| 5 | External portal: submit a case and look up its status | ✅ **Yes — both pages and both REST endpoints.** §7 walks the pages; §5 keeps the `curl` equivalents |
| 6 | Dashboards: Agent Workspace + Manager View | ✅ **Both render** — Agent Workspace 3 of 3 widgets, Manager View 5 of 5, with the seed data — §8 |

> **Read this before you start, so you do not spend time diagnosing known defects.** Two surfaces of this POC
> do not work, both measured, both packaging defects rather than anything about your instance:
>
> - **The portal pages are no longer among them.** They used to render blank — the page API returned
>   `containers: []` because the Service Portal layout records had never been authored, and a response-envelope
>   bug in both widgets made a successful 201 display "Submission failed". Both are fixed, and both pages now
>   render and work for an anonymous visitor. §7 walks them; §5 keeps the `curl` equivalents, which also work.
> - **Both dashboards now render every widget** — Agent Workspace 3 of 3, Manager View 5 of 5, with the seed
>   data. An earlier revision of this note said they rendered 0 tabs and 0 widgets, which was accurate: each
>   composite block named three child tables this release does not have. Both artifacts were re-authored onto the
>   real chain and re-verified in a browser, for the admin and for each persona. §8 walks the scenario, which is
>   now completable.
> - **The four chart reports now plot the dimension they were designed around.** They used to arrive with no
>   grouping column, so a chart opened directly grouped by the wrong field: the artifacts specified `<group_by>`,
>   but **`group_by` is not a column** on `sys_report` on this release, so the element was discarded on import.
>   The column a chart groups on is `field`, and all four now carry it (register §0.6.1). A second gate had to be
>   closed for a persona to open a report at all — `sys_report.user` must be the literal `GLOBAL` before the read
>   ACL will even consider `roles`. All eight reports now ship both.
> - **The case form now shows its related lists** — *Case Tasks* above *Case Parties*, with the child rows, for
>   every user. `sys_ui_related_list` used to hold 0 rows for this scope and the wrapper measured 0 pixels tall.
>   ⚠️ One caveat if you are installing this yourself rather than using the verification instance: on an instance
>   that rendered the case form *before* the definition arrived, the server's cached related-list set keeps the
>   form empty until *Configure ▸ Related Lists* is opened and **Saved** once (register §4 item 17).
>
> Everything else in this guide was exercised and works.

---

## 1. Sign in and switch between the demo roles

1. Sign in to `https://dev306625.service-now.com` as **`admin`**.
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
  navigator). You should see **at least 10 demo cases** spanning all six statuses and both types. The census at
  the last measurement was **10 cases, 10 tasks and 8 parties** (`CASE0000979`–`CASE0000988`); the extra
  smoke-test case that made it 11 in an earlier revision of this note no longer exists.
- **Tasks:** `x_casemgmt_case_task.list`. **Parties:** `x_casemgmt_case_party.list`.
- The case form shows fields in this order: subject, type, status, priority, description, requester_name,
  requester_email, opened_date, closed_date, assigned_group, assigned_agent. **At the bottom are two Related
  Lists — `Case Tasks` then `Case Parties`** — each listing that case's own children with a **New** button (for
  identities that may create; the viewer correctly gets none). An earlier revision of this bullet said there were
  none, which was accurate before the definition was authored. The standalone lists
  `x_casemgmt_case_task.list` and `x_casemgmt_case_party.list` still work and are the way in if you want to
  filter across cases.

> ### Do not go looking for specific case numbers
>
> **Case numbers are allocated by the instance counter when the seed script runs, so they differ on every
> install** — and on the verification instance the counter has moved a long way past the seed data (a case
> created during testing was numbered `CASE0000590`). The numbers `CASE0000013`–`CASE0000022` that earlier
> revisions of this guide used as fixtures were simply what one particular seeding run produced. They are kept
> below **only as illustrations of the shape of the dataset**.
>
> **Pick your own fixtures by attribute instead.** Every step in this guide needs a case in a particular state,
> not a particular number:
>
> | You need | Filter the case list on |
> |---|---|
> | a Draft case | `status = Draft` |
> | an Open case with a group but no agent | `status = Open` |
> | an In Progress case **with an open task** | `status = In Progress`, then check `x_casemgmt_case_task.list` for `Case = <that case>` and `Status != Closed` |
> | a Pending case | `status = Pending` |
> | a Resolved case | `status = Resolved` |
> | a Closed case (for the terminal-state test) | `status = Closed` |
> | a Complaint rather than a General Inquiry | add `type = Complaint` to any of the above |
>
> Note the numbers you actually find and use those throughout. Where a step below names a number, substitute
> yours.

### Demo data map — *illustrative shape, not literal numbers*

The numbers in this table come from one historical seeding run. **What matters is the distribution**: all six
statuses covered, both types present, a mix of unassigned / group-only / group+agent, and open tasks on exactly
the cases that need them to exercise the task-closure gate. Reproduce that shape from your own list.

| Case *(illustrative)* | Status | Type | Assignment | Has open task? |
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
| In Progress → Pending | sets `pending_reason` (Awaiting Info / Awaiting Third Party / Other) | ✅ **The flow and its subflow are active and published, and the guard runs synchronously** — but this transition has **no blocking precondition** by design (AAP §0.5.5 says "None; sets `pending_reason`"), so nothing is refused here. `pending_reason` is supplied by the **Set Pending UI Action**, which prompts for it and re-validates it server-side | Use the **Set Pending** button and pick a reason. If you change `status` to Pending by editing the field directly instead, the save succeeds and `pending_reason` stays empty — that is the specified behaviour, not a fault |
| Pending → In Progress | clears `pending_reason` | ✅ **Yes** (Business Rule clears it) | Just change status back to In Progress; watch `pending_reason` clear |
| In Progress → Resolved | **all** linked tasks `Closed` | ✅ **Blocked** — see Scenario 2 | Message on the form: "All tasks must be closed before resolving this case." |
| Resolved → Closed | caller has `x_casemgmt_case_manager`; auto-set `closed_date` | ✅ Both enforced — a non-manager is **blocked** with "Only case managers can close cases.", and for a manager `closed_date` is auto-set (Business Rule) | As a manager, move to Closed and confirm `closed_date`; then Impersonate **Demo Agent** on a `Resolved` case and confirm the block |
| **Any → Draft** | PROHIBITED | ✅ **Blocked** | Try setting a non-Draft case back to Draft → blocked with **"Cases cannot be returned to Draft."** |
| **Closed → anything** | PROHIBITED (terminal) | ✅ **Blocked** | Open any case with `status = Closed` and try to change status → blocked with **"Closed cases are terminal and cannot be modified."** |
| **Any edit to a Closed case** | PROHIBITED (terminal means the row, not just its status) | ✅ **Blocked** | On a Closed case change **only** `priority` and Save → same message. Pressing Save with nothing edited is accepted — the no-op is the one save a Closed case still allows |
| **Any edge not in this table** — e.g. `Draft → Closed`, `Draft → Resolved`, `Open → Closed`, `Pending → Resolved`, `Resolved → Open` | PROHIBITED (the table is the whole graph) | ✅ **Blocked** | On a fresh Draft case set `status` straight to *Closed* → blocked with **"A case cannot go from Draft to Closed. From Draft the only valid next status is Open."**, and the case is still Draft after a reload |

**Quick proof of the guards that DO work:**
- Open **any Closed case** (filter `status = Closed`), change status to *In Progress*, Save → you get
  **"Closed cases are terminal and cannot be modified."** and the change is rejected. Change only its
  `priority` instead and Save → the same message, because a Closed row is immutable and not merely
  status-frozen.
- Create a case, leave it in **Draft**, set `status` directly to *Closed* and Save → you get
  **"A case cannot go from Draft to Closed. From Draft the only valid next status is Open."** The case is
  still Draft after a reload and `closed_date` is still empty.
- Open **any Open case** (filter `status = Open`), change status to *Draft*, Save → you get
  **"Cases cannot be returned to Draft."**
- On any case, set `assigned_group = x_casemgmt_demo_team` and `assigned_agent` to a user **not** in that
  group, Save → you get **"Assigned agent must be a member of the assigned group."**

---

## 4. Scenario 2 — Tasks and the resolve-blocking rule

1. Find an **In Progress** case that has an open task. The quickest route is now the case form itself: open an
   `In Progress` case and read its **Case Tasks** related list, which shows each task's status inline. (The
   task-side route also works and is better for scanning across cases: open `x_casemgmt_case_task.list`, filter
   `Status != Closed`, and note the `Case` value on one of the rows whose case is `In Progress`.)
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

1. Either route works. From the case: open the case and press **New** on its **Case Parties** related list,
   which pre-fills `case` for you. From the party table: open `x_casemgmt_case_party.list` → **New** and set
   **case** yourself. Everything else below is unaffected — the UI Policy runs on the party form itself.
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
  every case whose `assigned_group` is that team, and **not** the unassigned Draft case. Verify it by attribute
  rather than by number: as `admin`, note which cases have `assigned_group = x_casemgmt_demo_team` and which have
  no group; then impersonate the agent and confirm the first set is visible and the second is not — including by
  pasting the unassigned case's URL directly, which must be refused rather than merely hidden from the list.

---

## 7. Scenario 5 — External portal (no login required)

> ### ✅ Both portal pages work — §7.1 and §7.2 are live exercises, and §7.3 is the `curl` equivalent
>
> Earlier revisions of this guide told you to skip straight to the API because both pages came up empty. That
> was a real defect and it is fixed: the pages' Service Portal layout records had never been authored (so the
> page API returned `containers: []`), and both widgets read `response.data.<field>` where a Scripted REST body
> is nested under `result`, which made a successful 201 display "Submission failed". Verified since, anonymously
> in a browser: 5 inputs and a working Submit on the submission page, a confirmation panel carrying the verbatim
> message and the new case number, and a lookup page returning exactly Status / Subject / Opened Date or the
> verbatim not-found literal — with 0 console errors and no request ≥ 400.

Open the public portal (incognito window, **not** logged in):

**`https://dev306625.service-now.com/x_casemgmt_case_portal`**

### 7.1 Submit a case
1. Go to the **Submit a Case** page.
2. Fill in **subject**, **type**, **description**, **requester_name**, and optionally **requester_email**.
3. Submit → you get a confirmation showing the new **case number** and the message
   **"Your case has been submitted"**. The case is created internally with status **Draft**.
   (Internally verifiable: the new `CASE…` number appears in `x_casemgmt_case.list` with Draft status.)

### 7.2 Look up a case status
1. Go to the **Case Status** page.
2. Enter a valid case number → it returns only **status, subject, and opened_date** (no internal fields such as
   assignment, description, or requester data are exposed, and not the number either).
3. Enter an unknown number (e.g., `CASE9999999`) → it returns **"No case found with that number."**

### 7.3 The working route — the anonymous REST endpoints
```bash
SN="${SERVICENOW_INSTANCE_URL:-https://dev306625.service-now.com}"   # your instance; the default is the current validation PDI
# submit (anonymous) -> 201 {number, "Your case has been submitted"}
curl -s -H "Content-Type: application/json" -X POST \
  -d '{"subject":"Portal demo","type":"Complaint","description":"demo","requester_name":"Jane Public"}' \
  "$SN/api/x_casemgmt/case_submit"
# lookup -> 200 with EXACTLY {status, subject, opened_date} and nothing else
# (substitute a number that exists on your instance - e.g. the one the submit call just returned)
curl -s "$SN/api/x_casemgmt/case_status_lookup?number=CASE0000017"
# unknown number -> 404 {"error":"No case found with that number."}
curl -s -w '\nHTTP %{http_code}\n' "$SN/api/x_casemgmt/case_status_lookup?number=CASE9999999"
```

> Please delete any cases you create while testing so the demo dataset stays tidy.

---

## 8. Scenario 6 — Dashboards

> ### ✅ Both dashboards render — this scenario is completable, and here is what you should see
>
> **Agent Workspace renders 3 of 3 widgets and Manager View 5 of 5**, with the seeded data. Measured values, read
> from the rendered charts' own per-point labels: *All Cases by Status* — Closed 2 / In Progress 2 / Open 2 /
> Resolved 2 / Draft 1 / Pending 1; *All Cases by Type* — General Inquiry 6 (60%) / Complaint 4 (40%);
> *All Cases by Priority* — High 3 / Medium 3 / Critical 2 / Low 2; *Average Time to Close* —
> `16 Days 0 Hours 0 Minutes`; *Cases Opened in Last 30 Days* — `10`. On Agent Workspace, impersonating the demo
> agent, *My Open Cases* lists exactly `CASE0000981`, `CASE0000982` and `CASE0000986`.
>
> **Two refusals are correct, not failures.** The agent is not granted Manager View and the viewer is granted
> neither, so those three pairs answer with the platform's own *"Sorry! / The … dashboard has not been shared with
> you."* That is what the AAP specifies — it names an *agent* workspace and a *manager* view and no viewer
> surface.
>
> *An earlier revision of this section said neither dashboard rendered and the scenario could not be completed.
> That was accurate at the time: each composite block named **three child tables that do not exist on this
> release** — `pa_tab` (the real table is `pa_tabs`), `pa_dashboard_widgets` (`pa_widgets`) and
> `pa_dashboard_role` — so the tab, every widget placement and the role grants were dropped on commit, and
> supplying a tab was proven insufficient because the platform auto-created one on first view and both stayed
> blank. Both artifacts were re-authored onto the real chain (`sys_portal_page` → `sys_grid_canvas` → `pa_tabs`
> → `pa_m2m_dashboard_tabs`, one `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` trio per
> widget, plus `pa_dashboards_permissions` and `restrict_to_roles`), and the four **chart** reports had a second,
> independent defect fixed at the same time: they specified `<group_by>status</group_by>`, but `group_by` **is not
> a column on `sys_report`** on this release (its columns are `field`, `sumfield`, `group` and
> `additional_groupby`), so the element was silently discarded on import and* All Cases by Status *rendered
> grouped by* Assigned Agent. *The column a chart groups on is `field`. A third gate had to be closed before any
> persona could open a report at all: the read ACL evaluates `roles` only when `sys_report.user` is the literal
> `GLOBAL`. See register §0.5 and §0.6.1.*
>
> **You can still open the reports directly** — *Reports → View / Run*, filter on the `x_casemgmt_case` or
> `x_casemgmt_case_task` table — and they render live from the real data, which is a useful cross-check against
> the dashboard widgets.

The dashboards are *intended* to be reached via **Self-Service → Dashboards** (or `$pa_dashboard.do`). One
mechanical note if you go by URL: **`$pa_dashboard.do?sysparm_dashboard=` takes the dashboard's `sys_id`, not
its name** — passing the name renders *"Can't display this dashboard."* / *"The dashboard with ID
`x_casemgmt_agent_workspace` was not found."*, which is easy to misread as the dashboard being absent when both
rows are present and `Active`. Look the sys_id up in `pa_dashboards_list.do?sysparm_query=sys_scope.scope=x_casemgmt`.

- **Agent Workspace** (`x_casemgmt_agent_workspace`): *My open cases* (list), *My overdue tasks* (list),
  *Case count by status* (donut). The "my" lists are user-relative — impersonating `x_casemgmt_demo_agent` is
  what would populate them with the agent's assigned cases and tasks.
- **Manager View** (`x_casemgmt_manager_view`): *All cases by status* (bar), *All cases by type* (donut),
  *All cases by priority* (bar), *Average time to close* (single score), *Cases opened in last 30 days*
  (single score).

All 8 backing reports do exist over the populated tables, so there is data behind them. Report titles: *Case
Count by Status, Average Time to Close, Cases Opened in Last 30 Days, My Overdue Tasks, All Cases by Status, My
Open Cases, All Cases by Type, All Cases by Priority*.

---

## 9. Reference — verbatim messages

| When | Message |
|---|---|
| Resolve attempted with an open task (**enforced and blocking on the form**) | `All tasks must be closed before resolving this case.` |
| Any → Draft attempted (enforced) | `Cases cannot be returned to Draft.` |
| Edit/transition a Closed case attempted (enforced — both a status move out of Closed and a field-only edit) | `Closed cases are terminal and cannot be modified.` |
| A status change that is not an edge of the matrix (enforced) | `A case cannot go from <from> to <to>. From <from> the only valid next status is <next>.` — and for the one state with two successors, `From In Progress the valid next statuses are Pending or Resolved.` |
| Agent not in the assigned group (enforced when an agent is set) | `Assigned agent must be a member of the assigned group.` |
| Portal lookup, unknown number (enforced) | `No case found with that number.` |
| Portal submit, success (enforced) | `Your case has been submitted` |

---

## 10. Cleanup

If you created test cases, tasks or parties while trying things out, delete them (as `admin`) so the demo set
returns to the 10 seeded cases spanning all six statuses and both types. Identify your own additions by
`sys_created_on` or by the subject you typed — not by number range, since numbers are instance-allocated. End any
impersonation session via the profile menu → **End impersonation**.
