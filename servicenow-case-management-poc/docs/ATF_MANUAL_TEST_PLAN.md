# Manual ATF Test Plan — `x_casemgmt` Case Management POC

## Status of this document — read this first

**Automated ATF generation held on this build. The primary deliverable for Section 3 is a real, running suite, not this plan.**

A working suite exists and was executed on the live PDI:

| Fact | Value |
| --- | --- |
| Suite name | `x_casemgmt Case Management POC` (`sys_atf_test_suite`, scope `x_casemgmt`) |
| Tests | 20 (`ATF 01` … `ATF 20`), 180 `sys_atf_step` rows, 540 step-input rows |
| Serialized artifacts | `servicenow-case-management-poc/atf/*.xml` (21 files) |
| Folded into the package | **761 of the package's 913** `<sys_update_xml>` blocks in `update-set/x_casemgmt_case_management_update_set.xml` (3,594,744 bytes, SHA-256 `b5b624ab…`) — the suite is the single largest thing in the deliverable |
| Last full-suite verdict | **`TES0001015` — 20 Success / 0 Failure / 0 Error / 0 Skipped, with 180 of 180 step results Success**, in about 4 minutes, leaving **zero test residue** behind. `sys_id c557b49a93e28b10830ef82bdd03d638`. Corroborated the same four ways: the *Failed Tests in Suite* list is empty, the rolled-up failure / error / skip counts are all `0`, a step-level sweep returns 180 / 180 Success, and no child result carries a `first_failing_step` |
| Last **serialized-import** verdict | **`TES0001014` — also 20 / 0 / 0 / 0 with 180 of 180 steps, in 5 m 44 s** (`sys_id f2f7770a93ea4b10830ef82bdd03d680`). This is the run that proves the records survive **export and re-import**, because it was executed immediately after all 761 records were re-applied from the shipped artifacts. It is **not** the current result: it was taken on a **pre-security revision** of the deliverable, before the changes that removed the bootstrap trigger and narrowed cross-scope access. The three form tests in that run genuinely drove a browser — `UI Batches Executed` went `0 → 3`. **These are two separate claims and this document keeps them separate:** `TES0001015` says the suite passes on the application as it stands; `TES0001014` says the suite survives serialization. Neither says both at once, and the gap — a serialized re-load followed by a suite run, on the bytes that ship — is open work, recorded as item 2 of [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §10.0](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) |
| Previous verdicts, and what they found | Every one of these is **history**, kept because each identifies a real defect and how it was caught. `TES0001013` was **19 / 1**: `ATF 03` failed at step 8 with `FAILURE: Unable to find record '…' in table 'x_casemgmt_case'` — a defect in the *test's own construction*, since ATF's native `Record Update` step must locate a row before it can attempt a write, and the assigned-only read ACL had already hidden that row from the impersonated agent. `TES0001006` was also **19 / 1**, for the unrelated `ATF 07` child-table ACL defect (`current.case` could not compile — `case` is a JavaScript reserved word). An intermediate revision scored **16 / 4**, the four being `ATF 07` plus the three form tests `ATF 15` / `16` / `17`. **All of those root causes are fixed and the final suite is green** — see §8 |
| Can the suite fail? | Yes, and not only by construction. Deliberate inverted controls exist per area — field-set equality, the `status` default, the four RBAC assertions, the `opened_date` exact-value comparison, pinned-number uniqueness, and the cleanup residue assertions (each was inverted, observed to fail with a precise message, and restored). Stronger still, `TES0001013` was an **unplanned real failure**: the suite caught it, attributed it to the exact step, reported it verbatim, and went green once the step was corrected |
| Do the records survive serialization + re-import? | Yes — measured, on the revision current at the time. All **761** records were re-applied from the shipped artifacts through the platform's own payload loader with 0 load errors, and all **540** step-input values were confirmed byte-identical afterwards by md5 per `(document_key, variable)` — 540 identical, 0 different, 0 missing. `TES0001014` immediately followed, so that verdict belongs to the serialized package and not merely to what was authored in the UI. (The earlier `TES0001006` run established the same property at 763 records / 542 inputs, before `ATF 03` step 8 was rebuilt — which is where the superseded 763 / 542 figures come from.) **What has not been repeated since:** the same re-load-then-run on the **current** package bytes. |

So the **D3.3 fallback condition did not fire**: ATF did *not* degrade the way Flow Designer did in Defect F. Nothing in this document should be read as "automated generation didn't hold".

This plan is shipped anyway, for three concrete uses:

1. **A UI-build recipe.** Everything below is what a human would click in the ATF UI (`All → Automated Test Framework → Tests`) to build the same coverage from nothing — useful for extending the suite, for rebuilding a single test, or for an instance where importing serialized ATF records is not desirable.
2. **A standing fallback.** If a future target instance refuses the serialized records (see *§7 Known structural risk*), this plan is the recovery path. It is costed **once**, in §6, and §6 is the only figure to quote; earlier drafts of this document carried a second, larger total in the body, which is withdrawn. See the note at the head of §6 for what the figure covers and what it excludes.
3. **A specification of intent.** Each scenario states the exact expected values — including the five verbatim strings — independently of how any one test is wired.

Where the shipped test differs from the recipe here, the difference is called out inline, with the reason.

---

## 1. Scope of the plan

Three scenarios, matching the three areas Section 3 names:

| Scenario | Area | Shipped tests |
| --- | --- | --- |
| **A** | Data model + ACL RBAC matrix (AAP §0.5.6, §0.5.7) | `ATF 01` – `ATF 07` |
| **B** | State-machine transition matrix, prohibited transitions, task-closure gate, verbatim messages (AAP §0.5.5) | `ATF 08` – `ATF 17` |
| **C** | Portal contracts — submit, lookup valid, lookup invalid, field whitelist | `ATF 18` – `ATF 20` |

Referenced contracts live in `docs/data-model.md`, `docs/acl-matrix.md`, `docs/state-machine.md` and `docs/portal-pages.md`. This plan does not restate them; it states what to assert.

---

## 2. Prerequisites before building or running anything

> ### ⚠️ A committed Update Set is NOT a runnable application — P1 is two steps, not one
>
> **Every test in this suite fails, and most fail meaninglessly, if the post-import remediation has not been run.**
> A commit alone leaves the three tables as dictionary metadata with **no physical storage** (so every insert
> fails with `invalid table name` and the whole of Scenario A collapses) and leaves the 26 ACLs with **0 of their
> 27 `sys_security_acl_role` link rows** (so on a high-security instance every ACL evaluates to *deny* and the
> RBAC assertions measure nothing but the absence of grants). Do not attempt to interpret a red suite until P1a
> and P1b below both hold.

| # | Prerequisite | How |
| --- | --- | --- |
| P1a | The application is committed | Commit `update-set/x_casemgmt_case_management_update_set.xml` |
| P1b | **The post-import remediation has been run and reports success** | Follow the seven-step primary procedure in [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) — the remediation runs at its **step 4** and again at its **step 6**, from *Scripts - Background* with **"In scope" = Global**. Nothing in the package does this for you: it contains **no auto-execute record of any kind**, and a Fix Script does not self-run. |
| P1c | **Verify both halves before running the suite** | (i) **Physical tables:** `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` returns **HTTP 200**, and an in-scope `GlideRecord` insert succeeds rather than failing `invalid table name`. All three tables must be physical — 21 / 14 / 13 columns, 24 choice rows. (ii) **Exactly 27 ACL role links:** `sys_security_acl_role` filtered on `sys_scope.scope=x_casemgmt` must return **27** rows, distributed **manager 14 / agent 10 / viewer 3**. Zero means the remediation has not run; any number other than 27 means it has not converged. |
| P2 | **`sn_atf.runner.enabled` = `true`** | `All → System Properties → All Properties`, filter `sn_atf.runner.enabled`. **This is an instance setting, not an application artifact — it is deliberately NOT in the Update Set**, because importing an application should not silently enable test execution on someone's instance. Without it every run aborts. |
| P3 | Demo identities exist | `x_casemgmt_demo_manager`, `x_casemgmt_demo_agent`, `x_casemgmt_demo_viewer`, group `x_casemgmt_demo_team`. The packaged seed rows arrive with `number` empty on the 10 demo cases, so the practical route is to delete those and run `scripts/seed_demo_data.js` **in scope** — step 7 of the primary procedure. |
| P4 | **A browser-attached client runner — required, not optional, on this instance** | `sn_atf.headless.enabled` is **`false` on `dev379024` and could not be enabled there**, so client-side steps cannot run unattended. Open `/atf_test_runner.do?sysparm_nostack=true` in a second browser tab **before** launching the suite, leave it open, then press **Run Test** and select that browser under "Pick a Browser". The three form-level tests (`ATF 15`-`17`) need it; the server-side tests do not, but the suite as a whole will stall waiting for a runner if one is not registered. |
| P5 | Headless execution | **Unverified.** `sn_atf.headless.enabled` is `false` here and enabling it was not possible, so no claim is made about headless behaviour on any instance. If you enable it elsewhere, treat the result as new evidence and disclose the change. |

> Side effect to expect: enabling `sn_atf.runner.enabled` causes the platform's own business rule *Enable/Disable scheduled tests* to also set `sn_atf.schedule.enabled` to `true` ("Enabled scheduled suites because test execution was enabled"). That is the platform's behaviour, not a configuration choice.

---

## 3. Platform facts that will otherwise cost you hours

These were all established empirically on this instance (ServiceNow *Australia*). They change how the tests must be written.

| # | Fact | Consequence for the build |
| --- | --- | --- |
| F1 | A step's inputs are **not** stored on `sys_atf_step`. Its `inputs` column is a `glide_var` and is always empty; values live in `sys_variable_value` (`document='sys_atf_step'`, `document_key=<step sys_id>`, `variable=<atf_input_variable sys_id>`). | Irrelevant when clicking in the UI. It is the reason serialized ATF records need each input as its own record — see §7. |
| F2 | `GlideImpersonate` is **blocked in scoped scripts**. | Change identity only with the **Impersonate** step. Never in a script. |
| F3 | `gs.getUser().getUserName()` throws inside a scoped ATF script; `gs.getUser(userName)` cannot fetch another user in a scoped app. | Use `gs.getUserName()` and `gs.getUserID()`. |
| F4 | `case` is a JavaScript reserved word. | Always `gr.getValue('case')` or `gr['case']`, never `gr.case`. (An existing ACL defect is caused by exactly this — see §8.) |
| F5 | `gs.print()` is forbidden in scoped scripts. | Use `gs.info()`. |
| F6 | **`Record Insert` strips an explicit `sys_id`** from *Field values* (it goes through `GlideTemplate`). | You cannot pin a fixture's `sys_id` with `Record Insert`. Either reference the step's output (F7) or create fixtures in a script step with `gr.setNewGuidValue(id)`. |
| F7 | The step-output template `{{step['<sys_id>'].record_id}}` is resolved **by the client runner**, not on the server-side-only path. | In the UI this is the natural way to chain steps and it works when you run through a browser. If you want a test that runs **without** a browser, do not use it — pin fixture ids in a script step instead (that is what the shipped tests do). Inside a script step, `steps('<step sys_id>').record_id` works on both paths. |
| F8 | `Record Update` with *Assert type* = `record_not_updated` **errors** instead of passing when the impersonated role cannot even *read* the row. | Assert "denied on an unreadable row" with `Record Query` + `no_records_match_query`, and/or `GlideRecordSecure` `canRead/canWrite/canCreate/canDelete` inside a script step. |
| F9 | A scoped `GlideRecordSecure` **query** on `x_casemgmt_case_task` still returns every row for the agent — scripted read ACLs are applied per record, not folded into the query. (The case table's agent ACL *does* filter the query.) | Assert per-record `canRead()` on the child tables, not row counts. |
| F10 | `Assert JSON Response Payload Element` takes a **slash** path. | `/result/number`, not `result.number`. The scripted REST services wrap their body in a `result` envelope. |
| F11 | `Send REST Request - Inbound` supports only `basic` and `mutual` auth, and its *Query parameters* are **static**. | With no auth profile configured it sends **no credentials**, and the platform serves it as `guest` — measured: the response carries `X-Is-Logged-In: false` and the row it creates is owned by `guest`, so this step type *does* exercise an unauthenticated caller. What it cannot do is **vary** its request: it cannot read a number produced earlier in the same test, and it cannot be pointed at a second endpoint. Hence: a `Run Server Side Script` companion using `sn_ws.RESTMessageV2` with no credentials for the remaining anonymous probes, and a **pinned, out-of-sequence fixture number `CASE9000019`** for the valid-lookup test so it stays portable to a freshly imported instance whose counter restarts at `CASE0000001`. |
| F12 | ATF rolls back records created by its own steps, by its script steps **and** by the ATF-instrumented `Send REST Request - Inbound` step — the last even when the test's own cleanup step never runs. It does **not** roll back a row created by an HTTP request a *script* makes into the instance with `sn_ws.RESTMessageV2`: that arrives as `guest`, in its own transaction, and the rollback then *reverses* the test's own delete of it, reinstating the row. | No test may create a row that way. `ATF 18`'s anonymous leg is therefore **non-mutating**, and the test asserts its own cleanliness rather than pointing at a sweep. Measured over two consecutive runs: both green, `subject STARTSWITH ATF-PORTAL` → **0 rows**, and the second run's step 1 reporting `pre-existing submissions removed=0`. |
| F13 | A platform business rule ('Generate Description') overwrites `sys_atf_step.description`. | Put per-step documentation in `notes`. |
| F14 | Deleting a `sys_atf_test` cascades away its `sys_atf_test_suite_test` link. | Re-add the test to the suite after any delete-and-rebuild. |

---

## 4. Conventions every scenario follows

- **Resolve by name, never by `sys_id`.** Users by `user_name`, groups/roles by `name`, tables by `name`, cases by `number`. The only 32-char hex literal a test may contain is a record's own `sys_id`.
- **Synthetic data only, uniquely named.** Every fixture subject starts with `ATF-` (e.g. `ATF-A2-manager-crud`), emails are `@example.invalid`. Never touch the 10 demo cases / 10 tasks / 8 parties.
- **Self-contained and order-independent.** Step 1 of every test is a `Run Server Side Script` *fixture setup* step that (a) deletes any stale row with this test's fixture subjects, then (b) inserts what the test needs. The last step re-checks cleanliness. Tests may run in any order, and any single test may be run alone.
- **Fixture identity.** Give each fixture a stable, unique subject and look it up by that subject in later script steps; or, if you are chaining native steps in the UI, use the step-output picker (F7).
- **Assert the message, not the mechanism.** Never assert the existence of a `sys_hub_flow` record or any other implementation artifact — enforcement may legitimately be a Business Rule. Assert the observable status change and the exact message.
- **Verbatim strings are character-exact**, trailing period included:

  | Where | String |
  | --- | --- |
  | Task-closure gate | `All tasks must be closed before resolving this case.` |
  | Back-transition | `Cases cannot be returned to Draft.` |
  | Terminal state | `Closed cases are terminal and cannot be modified.` |
  | Lookup miss | `No case found with that number.` |
  | Submit confirmation | `Your case has been submitted` |

- **Reading the step tables below.** *Step type* is the exact `sys_atf_step_config` name to pick in the UI. *Inputs* names the UI field with its internal element name in brackets, so you can cross-check against a serialized record.

---

## 5. The scenarios

### Scenario A — Data model + ACL RBAC matrix

**Contract under test** (AAP §0.5.6): manager → create ✅, read all ✅, write all ✅, delete ✅. Agent → create ✅, read **assigned only**, write **assigned only**, delete ❌. Viewer → create ❌, read all ✅, write ❌, delete ❌. "Assigned only" = `assigned_agent` is the current user **or** `assigned_group` contains the current user. Field-level: `assigned_group` writable by the manager only; `assigned_agent` writable by the manager **and** the assigned agent. Plus the schema of AAP §0.5.7 and the read-only `CASE0000001` number format.

Build it as **seven** tests. Each is small enough to diagnose on its own.

#### A1 — Schema and numbering (`ATF 01`, 5 steps, ~20 min)

Identity: none needed (runs as the test executor).
Fixture: one case inserted by the script step, subject `ATF-A1-schema`.

| # | Step type | Inputs |
| --- | --- | --- |
| 1 | Run Server Side Script | *Jasmine version* [`jasmine_version`] `3.1`; *Script* [`script`]: purge stale `ATF-A1-%` rows, then insert one case with a pinned id via `gr.setNewGuidValue(...)`. |
| 2 | Record Validation | *Table* [`table`] `x_casemgmt_case`; *Record ID* [`record_id`] the pinned id; *Assert type* [`assert_type`] `record_validated`; *Conditions* [`field_values`] `status=Draft^EQ` |
| 3 | Run Server Side Script | Walk `GlideRecord('sys_dictionary')` for `x_casemgmt_case` and assert, per field: name, `internal_type`, `max_length`, `mandatory`, `read_only`, and `reference` where applicable — `number`(string/40/read-only), `type`(40), `status`(40/mandatory), `priority`(40), `subject`(255/mandatory), `description`(4000/mandatory), `opened_date`(glide_date_time/read-only), `closed_date`(glide_date_time/read-only), `assigned_group`(reference→`sys_user_group`), `assigned_agent`(reference→`sys_user`), `requester_name`(100/mandatory), `requester_email`(100), `pending_reason`(40). |
| 4 | Run Server Side Script | Same for `x_casemgmt_case_task` (`case`→`x_casemgmt_case` mandatory, `subject` 255 mandatory, `type`, `status`, `assigned_to`→`sys_user` mandatory, `due_date` glide_date mandatory) and `x_casemgmt_case_party` (`case` mandatory, `party_type` mandatory, `person`→`sys_user`, `organization`→`core_company`, `role_label` 100 mandatory). Assert each choice set from `sys_choice`: case `type` = General Inquiry, Complaint; `status` = Draft, Open, In Progress, Pending, Resolved, Closed; `priority` = Low, Medium, High, Critical; `pending_reason` = Awaiting Info, Awaiting Third Party, Other; task `type` = Investigation, Review, Follow-up, Other; task `status` = Open, In Progress, Closed; party `party_type` = Person, Organization. |
| 5 | Run Server Side Script | Assert `sys_number` for `x_casemgmt_case` has `prefix='CASE'` and `maximum_digits=7`, assert the fixture's `number` matches `/^CASE\d{7}$/`, then attempt to overwrite `number` and assert it did not change (read-only). Finally purge the fixture. |

Expected: pass. Aggregate many small checks inside one `expect(...)` per script step so one failure names the field that broke.

#### A2 — Manager has full CRUD (`ATF 02`, 10 steps, ~25 min)

Identity: `x_casemgmt_demo_manager`. Fixtures: two cases (`ATF-A2-own`, `ATF-A2-foreign`), the second assigned to nobody.

| # | Step type | Inputs / expectation |
| --- | --- | --- |
| 1 | Run Server Side Script | fixture setup (pinned ids) |
| 2 | Impersonate | *User* [`user`] `x_casemgmt_demo_manager` |
| 3 | Record Insert | *Table* `x_casemgmt_case`; *Enforce security* [`enforce_security`] `1`; *Field values* [`field_values`] `subject=ATF-A2-created^description=…^requester_name=ATF Manager^status=Draft^EQ`; *Assert type* `record_successfully_inserted` |
| 4 | Record Query | *Table* `x_casemgmt_case`; *Enforce security* `1`; *Conditions* `subject=ATF-A2-own^EQ`; *Assert type* `records_match_query` → read of an unassigned-to-them case succeeds (read **all**) |
| 5 | Record Query | same for `ATF-A2-foreign` → `records_match_query` |
| 6 | Record Update | *Record ID* the foreign fixture; *Field values* `priority=High^EQ`; *Enforce security* `1`; *Assert type* `record_successfully_updated` → write **all** |
| 7 | Record Validation | assert `priority=High` persisted |
| 8 | Run Server Side Script | `GlideRecordSecure` on both fixtures: `canCreate/canRead/canWrite/canDelete` all `true` |
| 9 | Record Delete | *Record ID* the foreign fixture; *Enforce security* `1`; *Assert type* `record_successfully_deleted` |
| 10 | Run Server Side Script | assert no `ATF-A2-%` rows remain and the 10 demo cases are untouched |

#### A3 — Agent: create, assigned-only read/write, no delete (`ATF 03`, 11 steps, ~35 min)

Identity: `x_casemgmt_demo_agent`. Fixtures — build all four so "assigned only" is proven in both directions:

| Fixture | `assigned_agent` | `assigned_group` | Agent's expected access |
| --- | --- | --- | --- |
| `ATF-A3-by-agent` | the demo agent | *(empty)* | read ✅ write ✅ |
| `ATF-A3-by-group` | *(empty)* | `x_casemgmt_demo_team` (agent is a member) | read ✅ write ✅ |
| `ATF-A3-unassigned` | *(empty)* | *(empty)* | read ❌ write ❌ |
| `ATF-A3-other-group` | *(empty)* | a second group the agent is **not** in | read ❌ write ❌ |

Steps: fixture setup → Impersonate agent → `Record Insert` (`record_successfully_inserted`, create ✅) → `Record Query` on `ATF-A3-by-agent` (`records_match_query`) → `Record Query` on `ATF-A3-by-group` (`records_match_query`) → `Record Query` on `ATF-A3-unassigned` (**`no_records_match_query`** — the denial; see F8 for why not `Record Update`) → `Record Update` on `ATF-A3-by-agent` (`record_successfully_updated`) → `Record Query` on `ATF-A3-other-group` (`no_records_match_query`) → `Record Delete` on `ATF-A3-by-agent` with *Assert type* `record_not_deleted` (delete ❌) → `Run Server Side Script` asserting `GlideRecordSecure` `canDelete()===false` on every fixture and `canWrite()` true only on the two assigned ones → cleanup script.

#### A4 — Viewer is read-only (`ATF 04`, 8 steps, ~20 min)

Identity: `x_casemgmt_demo_viewer`. Fixtures: two cases, one assigned to the demo team, one unassigned.
Steps: fixture setup → Impersonate viewer → `Record Query` on both (`records_match_query`, read **all**) → `Record Insert` *Assert type* `record_not_inserted` → `Record Update` *Assert type* `record_not_updated` → `Record Delete` *Assert type* `record_not_deleted` → `Run Server Side Script` asserting `canCreate()===false`, `canRead()===true`, `canWrite()===false`, `canDelete()===false` → cleanup.

> This test is the natural place for the Scenario-A negative control: temporarily assert `canWrite()===true` and confirm the runner reports `viewer canWrite expected[true] actual[false]`, then restore.

#### A5 — Field-level ACLs (`ATF 05`, 9 steps, ~25 min)

Fixture: one case assigned to `x_casemgmt_demo_team` with `assigned_agent` = the demo agent.

| # | Step type | Expectation |
| --- | --- | --- |
| 1 | Run Server Side Script | fixture setup |
| 2 | Impersonate | `x_casemgmt_demo_manager` |
| 3 | Record Update | set `assigned_group` → `record_successfully_updated` (manager may write it) |
| 4 | Run Server Side Script | `GlideRecordSecure`: `gr.assigned_group.canWrite()===true`, `gr.assigned_agent.canWrite()===true` |
| 5 | Impersonate | `x_casemgmt_demo_agent` |
| 6 | Run Server Side Script | `assigned_group.canWrite()===false`; `assigned_agent.canWrite()===true` (they are the assigned agent) |
| 7 | Impersonate | `x_casemgmt_demo_viewer` |
| 8 | Run Server Side Script | both `canWrite()===false` |
| 9 | Run Server Side Script | cleanup |

Alternative on a form (needs a browser): **Open an Existing Record** → **Field State Validation** with *Read only* [`read_only`] = `assigned_group` for the agent identity. Equivalent assertion, higher cost.

#### A6 — Task and party mirror, manager + viewer (`ATF 06`, 21 steps, ~35 min)

Fixtures: one parent case, one task, one party (Person) — subjects `ATF-A6-…`.
Manager: insert task, insert party, query both, update both, delete both → all succeed. Viewer: query both succeed; insert/update/delete on both → `record_not_inserted` / `record_not_updated` / `record_not_deleted`. Close with a script step asserting the demo 10/10/8 counts are unchanged.

#### A7 — Agent assigned-only on task and party (`ATF 07`, 6 steps, ~20 min)

Fixtures: a case assigned to the agent, with one child task and one child party; plus a second case assigned to nobody with its own child task and party.
Steps: fixture setup → Impersonate agent → `Run Server Side Script` asserting `GlideRecordSecure` `canRead()`/`canWrite()` is `true` on the children of the assigned case and `false` on the children of the unassigned case (per-record, per F9) → `Record Query` on the assigned children (`records_match_query`) → `Record Query` on the unassigned children (`no_records_match_query`) → cleanup.

> **This test was RED for a period, and is now GREEN.** It asserts the AAP §0.5.6 mirror, and it failed because the application's four scripted child-table ACLs dereferenced `current.case` (F4) — `case` being a JavaScript reserved word — so the conditions could not compile and the agent narrowing denied *every* row. **The ACLs were fixed at the root cause** (`current.getElement('case')`), the test needed no edit, and it passes in the final suite run `TES0001015` alongside `ATF 06`. It was also strengthened rather than relaxed on the way — see §8 and the M5 entry in §9. Kept here as the record of a real defect the suite caught.

---

### Scenario B — State-machine transition matrix

**Contract under test** (AAP §0.5.5): `Draft → Open` requires `assigned_group`. `Open → In Progress` requires `assigned_agent` populated **and** a member of `assigned_group`. `In Progress → Pending` sets `pending_reason` (Awaiting Info / Awaiting Third Party / Other). `Pending → In Progress` clears `pending_reason`. `In Progress → Resolved` requires **all** child `x_casemgmt_case_task` rows `Closed`, else `All tasks must be closed before resolving this case.` `Resolved → Closed` requires the `x_casemgmt_case_manager` role and auto-sets `closed_date`. Any → `Draft` is prohibited: `Cases cannot be returned to Draft.` `Closed → *` is prohibited: `Closed cases are terminal and cannot be modified.`

Build it as **seven server-side tests plus three form-level tests**. The server-side tests are the fast regression net; the form-level tests prove the message reaches the screen.

**The pattern every server-side transition test uses**

1. `Run Server Side Script` — fixture setup: one case pinned at the *from* status with exactly the preconditions the row under test needs.
2. `Impersonate` — `x_casemgmt_demo_manager` unless the row is about a role check.
3. `Record Update` — attempt the transition **without** the precondition; *Assert type* `record_not_updated`.
4. `Record Validation` — assert `status` is still the *from* value (the abort really aborted).
5. `Record Update` — satisfy the precondition and repeat; *Assert type* `record_successfully_updated`.
6. `Record Validation` — assert `status` is now the *to* value.
7. `Run Server Side Script` — call the validator directly and assert `{ok, error}`, including the verbatim message where the row has one: `new x_casemgmt.CaseTransitionValidator().canTransitionToResolved(gr)` etc.
8. `Run Server Side Script` — cleanup + demo-data census.

| Test | Row(s) covered | Fixture | Key assertions | Est. |
| --- | --- | --- | --- | --- |
| **B1** `ATF 08`, 8 steps | `Draft → Open` | Draft case, no `assigned_group` | blocked without a group; succeeds once `assigned_group=x_casemgmt_demo_team`; `canTransitionToOpen()` `ok:false` then `ok:true` | 20 m |
| **B2** `ATF 09`, 10 steps | `Open → In Progress` | Open case with `assigned_group` set | blocked with no `assigned_agent`; blocked with an agent who is **not** a member of the group; succeeds with the demo agent (a member); `isAgentInGroup()` both ways | 25 m |
| **B3** `ATF 10`, 8 steps | `In Progress → Pending`, `Pending → In Progress` | In Progress case | Pending with `pending_reason=Awaiting Info` succeeds and persists; back to In Progress succeeds and `pending_reason` is **empty** | 20 m |
| **B4** `ATF 11`, 10 steps | task-closure gate | In Progress case + **one `Open` child task** | `Resolved` blocked; status still In Progress; `canTransitionToResolved()` returns exactly `All tasks must be closed before resolving this case.`; close the task; `Resolved` now succeeds; `getOpenTaskCountForCase()` 1 → 0 | 30 m |
| **B5** `ATF 12`, 10 steps | `Resolved → Closed` | Resolved case assigned to the demo agent | as the **agent**: blocked, status still Resolved, `canTransitionToClosed(gr, agentId)` `ok:false`; as the **manager**: succeeds and `closed_date` is non-empty | 30 m |
| **B6** `ATF 13`, 8 steps | any → `Draft` | one Open case and one In Progress case | both blocked; `validateNoBacktransition('Open','Draft').error` === `Cases cannot be returned to Draft.` | 20 m |
| **B7** `ATF 14`, 9 steps | `Closed → *` | Closed case | `Closed → In Progress`, `→ Resolved`, `→ Open` and `→ Draft` all blocked; status still Closed; message === `Closed cases are terminal and cannot be modified.` | 25 m |

> Two honest notes on B5 and B7, both discovered while building:
> - `CaseTransitionValidator.canTransitionToClosed()` **used to have** a branch that called `gs.getUser(userName)`, which on this release ignores its argument and returns the *session* user — so a foreign user id was evaluated against the caller's own roles, answering `{ok:true}` for a non-manager. That branch now resolves the grant with a `GlideRecord` query against `sys_user_has_role`, and the register records it as §9.6 **E-GU**, fixed. Asserting each half **under the matching impersonation** is still the better habit and is what the shipped `ATF 12` does.
> - AAP §0.5.5 row 8 is a **transition** row. The shipped guard blocks status changes out of `Closed`; it permits an unrelated field edit on a Closed case. Do not assert that an unrelated field edit is blocked — that is not what the row says.

**The three form-level tests** (`ATF 15`, `ATF 16`, `ATF 17` — 7 steps each, ~30 min each, **require P4**)

One per verbatim message. **Be precise about what these three do and do not establish**, because "form test" is
easily over-read:

| They automatically assert | They do **not** assert |
| --- | --- |
| **Refusal** — the form is submitted to the server and the save is rejected (step 5) | **The rendered text of the error banner.** ATF has no text-on-page assertion for a classic platform form — see M6 in §8 |
| **Persistence** — the stored row's `status` is re-read and is unchanged, so the rejection is real and not cosmetic (step 6) | |
| **The exact message string, character-for-character** — but read from the **server side**, by calling `new x_casemgmt.CaseTransitionValidator()` and comparing `verdict.error` (step 7) | |

So a wording regression **is** caught automatically, because step 7 compares the string the application would emit
against the expected literal byte for byte. What remains manual is confirming that the string reaches the screen —
one observation per message, satisfied by the runner's own step-5 screenshot.

> **⚠️ PREREQUISITE — READ THIS BEFORE BUILDING THESE THREE. Without it, step 3 fails and the recipe below looks
> broken.** `Open an Existing Record` resolves the record through the platform Script Include
> `TestExecutorAjax.validateFormParameters`, **which runs in Global scope** and performs a plain
> `new GlideRecord(<table>).get(<sys_id>)`. If the scoped table refuses cross-scope reads, that lookup fails and the
> step reports `Table 'x_casemgmt_case' does not have a record with id '…'` — which looks exactly like a missing
> fixture and is not one. On `sys_db_object`, **only `access` is a string**; `ws_access`, `read_access`,
> `create_access`, `update_access` and `delete_access` are **boolean**, so a value of `"public"` coerces to `false`
> and refuses every cross-scope read. Set **`ws_access` and `read_access`** to boolean `true` — and **only** those
> two: `create_access`, `update_access` and `delete_access` stay boolean `false`, because this step needs a
> cross-scope **read** and nothing else, and an open write column lets any Global-scope script mutate these tables
> with a plain `GlideRecord`, which is not filtered by the application's ACLs. Then force a table-descriptor rebuild
> by touching the table's **collection** `sys_dictionary` row (the one whose `element` is empty) — writing the
> columns alone flushes the `sys_db_object` catalogue but **not** `syscache_tabledescriptor`, and no amount of
> `GlideSecurityManager` resetting or `/cache.do` flushing substitutes for it. The touch must **change** the stored
> value and then restore it: an update that re-writes the same value is a no-op and flushes nothing (measured).
> The shipped `tables/*.xml` now carry exactly that two-open/three-closed pattern, and
> `scripts/post_import_remediation.js` reconciles all eight columns — opening what must be open and **closing any
> write column it finds open** — and performs the descriptor touch on every run. This is the whole of what once made these three tests fail on a clean instance; see the register §9.6
> **E-ATF15** / **E9**.

| # | Step type | Inputs |
| --- | --- | --- |
| 1 | Run Server Side Script | fixture setup — the case (and for `ATF 15`, its open child task) at the *from* status. **Add a handoff guard:** after inserting, re-read every fixture by `sys_id` with a plain `GlideRecord` and assert it resolves. Step 3 resolves it the same way, through Global-scope `TestExecutorAjax`, so if anything is wrong with the fixture this fails here — precisely and upstream — instead of surfacing later as a misleading "does not have a record with id". Do **not** rely on the fixture's own stale-residue delete having left something behind |
| 2 | Impersonate | `x_casemgmt_demo_manager` |
| 3 | Open an Existing Record | *Table* `x_casemgmt_case`; *Record ID* the pinned fixture id |
| 4 | Set Field Values | *Table* `x_casemgmt_case`; *Field values* `status=Resolved^EQ` (`ATF 16`: `status=Draft`; `ATF 17`: `status=In Progress`) |
| 5 | Submit a Form | *Assert type* [`assert_type`] `form_submitted_to_server` — the submit is expected to be **rejected by the server**, and ATF captures the resulting page |
| 6 | Record Validation | assert the row's `status` is unchanged — i.e. the save really was refused |
| 7 | Run Server Side Script | assert the validator returns the identical verbatim string — `new x_casemgmt.CaseTransitionValidator()`, comparing `verdict.error` character-for-character — **then** clean up and assert the cleanup. Two traps: (a) `stepResult.setOutputMessage()` **overwrites** rather than appends, so accumulate every line you want reported and emit it once at the end, otherwise the message-assertion evidence is silently replaced by the cleanup summary; (b) do not finish with a `chk('cleanup ran','true','true')`-style tautology — check each `deleteRecord()` return value and re-query for residue |

**Manual observation (M6 in §8) — this part is not automated.** ATF cannot assert text on a classic form, so verify
on screen, in the runner's own step-5 screenshot attachment, that the message reads exactly:

- `ATF 15` → `All tasks must be closed before resolving this case.`
- `ATF 16` → `Cases cannot be returned to Draft.`
- `ATF 17` → `Closed cases are terminal and cannot be modified.`

> Expect **two** banners. The form shows the state-machine message *and* the platform's own generic `Invalid update`. The container text reads `Error Message\n<message>\nError Message\nInvalid update`. Assert on the state-machine message; do not treat the generic one as a failure.

> Scenario-B negative control: in B4, delete the trailing period from the expected string. The runner then reports `blocking message is verbatim expected[All tasks must be closed before resolving this case] actual[All tasks must be closed before resolving this case.]` — which is what proves the assertion is character-exact. Restore it afterwards.

---

### Scenario C — Portal contracts

**Contract under test** (`docs/portal-pages.md`): anonymous `POST /api/x_casemgmt/case_submit` with `Content-Type: application/json` → **201**, body carries the new `number` and `Your case has been submitted`, and the created case lands in `Draft`. Anonymous `GET /api/x_casemgmt/case_status_lookup?number=<valid>` → **200** carrying **only** `status`, `subject`, `opened_date`. `GET …?number=CASE9999999` → **404** with exactly `No case found with that number.` Both services wrap the body in a `result` envelope (F10).

#### C1 — Submit returns 201 with a number (`ATF 18`, 10 steps, ~30 min)

| # | Step type | Inputs |
| --- | --- | --- |
| 1 | Run Server Side Script | purge stale `ATF-PORTAL-18 %` cases |
| 2 | Send REST Request - Inbound | *HTTP method* [`http_method`] `post`; *Endpoint* [`end_point`] `/api/x_casemgmt/case_submit`; *Headers* [`headers`] `{"Content-Type":"application/json","Accept":"application/json"}`; *Request body* [`request_body`] `{"subject":"ATF-PORTAL-18 anonymous submission","type":"General Inquiry","description":"…","requester_name":"ATF Requester","requester_email":"atf.requester@example.invalid"}` |
| 3 | Assert Status Code | *Operation* [`response_operation`] `equals`; *Status code* [`status_code`] `201` |
| 4 | Assert JSON Response Payload Element | *Element* [`element_name`] `/result/number`; *Operation* `exists` |
| 5 | Assert JSON Response Payload Element | *Element* `/result/message`; *Operation* `equals`; *Value* [`element_value`] `Your case has been submitted` |
| 6 | Assert Response Payload | *Operation* `contains`; *Body* [`response_body`] `Your case has been submitted` |
| 7 | Assert Response Payload | *Operation* `contains`; *Body* `CASE` |
| 8 | Record Query | *Table* `x_casemgmt_case`; *Conditions* `subject=ATF-PORTAL-18 anonymous submission^EQ`; *Assert type* `records_match_query` |
| 9 | Run Server Side Script | the genuinely anonymous, **non-mutating** leg. `sn_ws.RESTMessageV2` with no credentials POSTs the body `[]`, which must come back `400 {"result":{"error":"Invalid payload."}}` — the handler's own message, which a `401`/`403` from the authenticator could never produce, and a payload shape `submitCase()` rejects before it touches `GlideRecord`; then a credential-free `GET` of the lookup endpoint for the case step 2 submitted must return `200` with exactly `{status, subject, opened_date}` matching the stored row; finally a census proves neither call persisted anything. Shipped output: `checks=12 failures=0` |
| 10 | Run Server Side Script | delete the case step 2 submitted, assert every delete reported success and that no `ATF-PORTAL-18` row survives. Shipped output: `submissions removed=1` / `deletes reporting failure=0` / `residue rows=0`. No post-run sweep — see F12 |

#### C2 — Valid lookup returns only the whitelist (`ATF 19`, 10 steps, ~25 min)

Fixture: a case pinned to number **`CASE9000019`** (out of the auto-number sequence, so the test is portable — F11), subject `ATF-PORTAL-19 lookup fixture`, with `assigned_group`, `assigned_agent`, `description`, `requester_name`, `requester_email` all populated **precisely so their absence from the response is meaningful**.

Steps 1–2: fixture setup — which first checks, read-only, that no row it does not own occupies the fixture `sys_id` or already carries `CASE9000019`, and **refuses to run**, having changed nothing, if one does — and a pre-check that the fixture really carries the internal fields. Step 3: `Send REST Request - Inbound`, *HTTP method* `get`, *Endpoint* `/api/x_casemgmt/case_status_lookup`, *Query parameters* [`query_params`] `{"number":"CASE9000019"}`. Step 4: `Assert Status Code` `equals` `200`. Steps 5–7: `Assert JSON Response Payload Element` `exists` for `/result/status`, `/result/subject`, `/result/opened_date`. Steps 8–9: `Assert Response Payload` **`does_not_contain`** for the forbidden keys. Step 10: a `Run Server Side Script` that parses the body and asserts the **negative whitelist** exhaustively — the response must not contain `assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email` or `sys_id`, as keys *or* as values (check both the key set and the raw text against each populated fixture value), and that the key set is exactly `{status, subject, opened_date}`. Then clean up.

> The shipped step reports `checks=23 failures=0`. Asserting both keys and values is what makes the whitelist claim real: a key could be renamed and still leak the datum.

#### C3 — Unknown number returns 404 verbatim (`ATF 20`, 6 steps, ~20 min)

Fixture: a script step that asserts **no** case with number `CASE9999999` exists (so the 404 is real, not incidental). Then `Send REST Request - Inbound` `get` `/api/x_casemgmt/case_status_lookup` with *Query parameters* `{"number":"CASE9999999"}` → `Assert Status Code` `equals` `404` → `Assert Response Payload` `contains` `No case found with that number.` → `Assert JSON Response Payload Element` `/result/error` `equals` `No case found with that number.` → a closing script step asserting the message is character-exact (compare length and codepoints, not just equality of a trimmed string).

> Scenario-C negative control: change the expected status code to `200`. The runner reports `The response status code doesn't match the specified operation for expected status code: '200', actual status code: '404'`. Restore afterwards.

#### C4 — The genuinely anonymous companion check (~10 min, no ATF)

`Send REST Request - Inbound` sends no credentials and is served as `guest` (F11), so the suite establishes the anonymous contract on its own; this shell companion is **optional corroboration** you can record alongside it. Run it with **no credentials at all**:

```bash
SN=https://<instance>.service-now.com
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$SN/api/x_casemgmt/case_submit" \
  -H 'Content-Type: application/json' \
  -d '{"subject":"ATF-CURL-COMPANION anonymous submission","type":"General Inquiry","description":"anonymous companion check","requester_name":"ATF Requester","requester_email":"atf.requester@example.invalid"}'
# expect 201, body {"result":{"number":"CASE00001xx","message":"Your case has been submitted"}}

curl -s "$SN/api/x_casemgmt/case_status_lookup?number=<the number returned above>"
# expect 200, body {"result":{"status":"Draft","subject":"…","opened_date":"…"}}  — exactly three keys

curl -s -o /dev/null -w '%{http_code}\n' "$SN/api/x_casemgmt/case_status_lookup?number=CASE9999999"
# expect 404, body {"result":{"error":"No case found with that number."}}

curl -s -o /dev/null -w '%{http_code}\n' "$SN/api/now/table/x_casemgmt_case"
# expect 401 - and note WHY. This is authentication and ACL behaviour, NOT a consequence of
# ws_access: the package ships ws_access=true and read_access=true, so the Table API is REACHABLE
# for an authenticated caller with the right role (an admin GET on this URL answers 200). What an
# anonymous caller lacks is a session and any role, so the platform rejects the request before
# ACLs are even consulted. The perimeter that matters is therefore: the two scripted REST
# endpoints are deliberately anonymous, and nothing else is. An earlier revision of this comment
# attributed the 401 to ws_access=false, which was true of an older packaging defect and is no
# longer the case (see PDI_LIMITATIONS_AND_KNOWN_ISSUES.md 9.6 E9).
```

Then delete the `ATF-CURL-COMPANION` case this companion's own POST created. Nothing else needs sweeping: the suite creates nothing outside ATF's rollback context (F12).

---

## 6. Build-time estimate

**This table is the single authoritative estimate for this document.** Earlier drafts also quoted a smaller
"~7 h 15 m" figure in the status section, which double-counted nothing and simply omitted the form-level tests, the
negative controls and suite assembly; it is withdrawn, and the total below is the only figure to quote. The estimate
covers building the coverage **from nothing in the ATF UI**. It excludes: importing the shipped package (minutes,
not hours), the one-off prerequisite work in §2, and the cross-scope table-access prerequisite described with the
form-level tests — which is a packaging fix rather than test-authoring effort.

| Item | Estimate |
| --- | --- |
| Harness prep — P1–P5, confirm identities, one throwaway pass/fail probe | 0 h 30 m |
| Scenario A — A1 20 m, A2 25 m, A3 35 m, A4 20 m, A5 25 m, A6 35 m, A7 20 m | 3 h 00 m |
| Scenario B — B1 20 m, B2 25 m, B3 20 m, B4 30 m, B5 30 m, B6 20 m, B7 25 m | 2 h 50 m |
| Scenario B — the three form-level tests, 30 m each (includes driving the client runner) | 1 h 30 m |
| Scenario C — C1 30 m, C2 25 m, C3 20 m, C4 10 m | 1 h 25 m |
| Suite assembly — one `sys_atf_test_suite`, 20 `sys_atf_test_suite_test` links, one full run | 0 h 20 m |
| Negative controls — one per area, invert, run, restore | 0 h 25 m |
| **Total** | **≈ 10 h 00 m** |

Against the original **16-hour** estimate that is a saving of roughly 6 hours, and the plan is decomposed so it can be delivered incrementally — Scenario A alone is ~3 h and already covers the RBAC matrix end to end. Someone rebuilding only what the shipped suite already contains needs none of this; importing the package is minutes.

### 6.1 Where the shipped suite deviates from the recipe above

The recipe is what a human would build from nothing; the shipped tests were then strengthened past it in specific
places. Each difference is listed here rather than left for a reader to discover by diffing.

| Test | Recipe says | Shipped test does | Why |
| --- | --- | --- | --- |
| `ATF 01` | Assert the §0.5.7 schema field by field | Additionally asserts **exact field-set equality** per table — it enumerates every non-`sys_*` element and compares it as a *set* against the AAP list (case 14, `case_task` 7, `case_party` 6), so an **extra** column fails the test as loudly as a missing one. Its fixture also **omits `status`** so the platform's own default is what gets asserted, rather than the test pre-setting `Draft` and then confirming its own input | Field-by-field assertions cannot detect an undeclared extra column, and a fixture that sets the value it later checks proves nothing about the default |
| `ATF 02`, `ATF 04` | Assert the role can read all cases | Compares **iterated visible sys_id sets** — `GlideRecordSecure` iteration against an authoritative plain-`GlideRecord` set — and asserts the assigned *and* unassigned fixtures are both present | `GlideRecordSecure.getRowCount()` is **not** ACL-filtered (measured: agent `getRowCount=11` while iterating 9), so any `>= N` threshold can pass while the role sees nothing. See register §9.6a P2 |
| `ATF 03` | Step 8 is a `Record Update` with *Assert type* `record_not_updated` | Step 8 is a **`Run Server Side Script`** that attempts the write through `GlideRecordSecure` and asserts the secured API cannot reach the row, `canWrite()` is false, and the stored value is unchanged | ATF's `Record Update` step must **locate** the row before it can attempt a write, and the assigned-only read ACL already hides it — so the native step aborts with `Unable to find record` instead of observing a denial. This was a real suite failure (`TES0001013`) before it was rebuilt. Note also that plain `GlideRecord.update()` **bypasses ACLs** and must never be the vehicle here. See register §9.6a P1 and P4 |
| `ATF 07` | One parent fixture carrying both grant paths | **Five** parents — both-branch, direct-only, group-only, unassigned, and a group the agent is **not** a member of — each with a task and a party child (15 fixtures), asserting positive read/write on both allowed branches and negative read/write/delete on both denied ones | A single fixture carrying both grant paths cannot tell the two apart, and without denied branches the test cannot show the narrowing is real rather than blanket access |
| `ATF 15`, `ATF 16`, `ATF 17` | Step 3 resolves the pinned fixture; step 7 asserts the validator string | Step 1 additionally carries a **handoff guard** (re-reads each fixture by `sys_id` and asserts it resolves) and step 7 asserts the message **character-exactly** before cleaning up. The rendered banner is labelled a manual observation (M6) rather than counted as automated coverage | The guard converts a misleading downstream "does not have a record with id" into a precise upstream failure; the string assertion means a reworded message turns the test red even though ATF cannot read the banner |
| Every test with fixtures | "Clean up at the end" | Cleanup is **asserted**: each `deleteRecord()` return value is checked and every fixture is re-queried by pinned `sys_id` and by prefix, failing the step and naming survivors on residue | The previous `chk('cleanup ran','true','true')` was a tautology that passed even if every delete silently failed — and deletes **do** silently fail in some conditions (register §9.6a P7) |
| `ATF 18` | Anonymous submit returns 201, then clean up | The anonymous leg is **non-mutating**: it POSTs a body the handler must reject (`400`, `Invalid payload.` — proof the endpoint serves an unauthenticated caller and runs its validation for one, since a `401`/`403` would come from the authenticator instead), reads the submitted case back through the anonymous lookup endpoint credential-free, and proves by census that neither call persisted a row. The 201 contract itself is asserted on the ATF-instrumented inbound-REST step, which is *also* served as `guest`. Cleanup then asserts every delete reported success and that no `ATF-PORTAL-18` row survives | Submitting a real case from a *script* put the row outside ATF's rollback context, so the rollback reversed the test's own cleanup delete and every run leaked one publicly lookup-addressable case. A test may not leave mutated state behind; the instrumented step's row, by contrast, is rolled back even if cleanup never runs. See M4 and register §9.6a P6 |
| `ATF 19` | Assert `opened_date` is returned | Asserts `opened_date` **equals the stored value character-for-character**, and that exactly **one** row carries the pinned lookup number — and it **refuses to run**, changing nothing, if a row it does not own carries that number or occupies the fixture `sys_id`, naming the offender instead of deleting it | "Populated" passes on a display-formatted or timezone-converted date (control: stored `17:19:27` vs displayed `10:19:27`), and `lookupCase()` resolves the number with `setLimit(1)` and no `orderBy`, so a duplicate would make the result non-deterministic. The earlier setup deleted every other carrier whatever its `sys_id` — including, by its own comment, a hand-made or imported row — which is data a test does not own and must not destroy |

---

## 7. Known structural risk when ATF records are moved between instances

D3.2 warned that ATF's step configuration is multi-table and might degrade the way Flow Designer did. **It can, and there is exactly one way to get it wrong.** Recorded here because it is the failure a future maintainer will hit:

- A step's inputs live in `sys_variable_value`, not on the step (F1).
- `GlideRecordXMLSerializer` **embeds** those rows as children inside the `sys_atf_step` document.
- The Update Set / XML loader (`GlideUpdateManager2.loadXML()`) **ignores those embedded children.** Re-importing such a payload yields a test with all of its steps and **zero** inputs, which then fails at runtime. Measured verbatim: `AFTER_REIMPORT|test=present|steps=6|inputs=0` → verdict `FAILURE`.
- **The fix, which the shipped `atf/*.xml` files use:** emit each `sys_variable_value` row as its **own** record, immediately after its parent step. Re-import then restores every input and the test runs green — measured on the shipped artifact (`inputs=15` restored, 6/6 steps success), again using the blocks taken straight out of the Update Set in Update Set order (`inputs=34` restored, 10/10 steps success), and finally across the whole package: all 21 artifact files re-applied with 0 load errors and every input value byte-identical afterwards. **Those figures were 763 records / 542 inputs / a 19-1 verdict when first measured; the current package carries 761 records and 540 inputs** (`ATF 03` step 8 was later rebuilt, replacing five native-step inputs with the two a script step takes), and the re-load was re-verified at 761 / 540 with 540 identical, 0 different, 0 missing, followed by a **20 / 0 / 0 / 0** verdict.
- **The same indifference applies to `delete_multiple`.** The platform emits a `<sys_variable_value action="delete_multiple" query="document_key=…"/>` child inside each step document; the loader ignores it exactly as it ignores the input children. The directive *is* honoured as a **top-level** document (measured: a step's inputs went 2 → 0). Because every shipped input row carries a deterministic `sys_id`, a clean-instance import — and any re-import of the package over itself — is exactly idempotent. Importing the package on top of a **natively authored** copy of the same suite instead *adds* a duplicate row per input (measured at the time as 542 → 1035, on the then-current input count of 542; the shipping count is 540), because the pre-existing rows carry platform-generated ids. Delete the scope's ATF tests first, or emit one top-level `delete_multiple` document per step, if you need that case to be idempotent too.

**The check to run after any import** (this is also the check handed to the final packaging unit):

1. `sys_atf_test` where `sys_scope.scope=x_casemgmt` → **20**
2. `sys_atf_step` where `test.sys_scope.scope=x_casemgmt` → **180**
3. `sys_variable_value` where `document=sys_atf_step` and `document_key` is one of those steps → **540**
4. `sys_atf_test_suite` → **1**, named `x_casemgmt Case Management POC`; `sys_atf_test_suite_test` → **20**
5. **Any step with zero input rows is the failure signature.** If it appears, the input records did not load, or loaded before their parent step. A step with *more* rows than it should have means the package was imported over a natively authored copy of the suite (see the `delete_multiple` note above).
6. Set `sn_atf.runner.enabled=true`, register a client runner (P4), and run the suite. **Expect 20 Success / 0 Failure / 0 Error / 0 Skipped, with 180 of 180 step results Success** — that is the final measured verdict (`TES0001015`). Earlier partial results (19/1 for `ATF 03` or `ATF 07`, and 16/4 for `ATF 07` plus `ATF 15`-`17`) all trace to defects since fixed at their root cause; if you see one of them, something in P1a-P1c is incomplete rather than the suite being wrong.
7. `ATF 18` needs no post-run sweep: it creates nothing outside ATF's rollback context and asserts that no `ATF-PORTAL-18` row survives (F12). Confirm with a list on `x_casemgmt_case` where `subject` starts with `ATF-PORTAL` — expect zero rows.

---

## 8. What is covered automatically, and what stays manual

**Covered automatically** — all three areas, by the 20 shipped tests. One thing that is **not** automated is named
explicitly in the state-machine row and again as **M6** below, rather than being folded into a general claim.

| Area | Automated coverage |
| --- | --- |
| Data model + RBAC | Full 3-role × 4-operation matrix on `x_casemgmt_case`, "assigned only" in both directions (`assigned_agent` and `assigned_group`), field-level ACLs on `assigned_group`/`assigned_agent` for all three identities, the mirror on `x_casemgmt_case_task` and `x_casemgmt_case_party`, and the complete §0.5.7 schema including choices, reference targets, the read-only `number` and the `CASE0000001` format |
| State machine | Every row of the §0.5.5 matrix — four forward preconditions, both `pending_reason` side effects, both prohibited transitions, and the task-closure gate proven in both directions — with all three verbatim messages asserted character-exactly **server-side**. `ATF 15/16/17` additionally prove the *behaviour* on a real form end to end: the form is opened, the field is set, the save is submitted and **refused by the server**, and a Record Validation step confirms the stored `status` did not change. What those three do **not** assert is the message as **rendered in the form's error banner** — ATF has no step type that can read text from a classic platform form (see M6). Each of the three instead asserts the exact string server-side, in the same transaction and against the same fixture the form just submitted, so a missing or reworded message turns the test red |
| Portal contracts | Submit → 201 with `number` + `Your case has been submitted` + `Draft` landing + `CASE`-format number; valid lookup → 200 with exactly `{status, subject, opened_date}` and the forbidden keys/values asserted **negatively**; invalid lookup → 404 with the verbatim message |

**Stays manual:**

| # | What | Why | Cost |
| --- | --- | --- | --- |
| M1 | Setting `sn_atf.runner.enabled=true` on any instance where the suite is to run | It is an instance test-harness setting and is deliberately not captured into the Update Set | < 1 min |
| M2 | Opening a client test runner tab for `ATF 15`, `ATF 16`, `ATF 17` | Form-level steps need a browser. `sn_atf.headless.enabled` is `false` and was not changed. | ~2 min per run |
| ~~M3~~ | ~~The genuinely anonymous REST leg (C4)~~ — **not manual; this entry was wrong** | It is true that the `Send REST Request - Inbound` **step type** supports only `basic`/`mutual` auth, but the suite does not rely on that step for the anonymous leg. `ATF 18`, `ATF 19` and `ATF 20` each additionally call the public endpoint from a server-side script through `sn_ws.RESTMessageV2` **with no credentials set at all** — verified by inspection: none of the three contains a `setBasicAuth` or an `Authorization` header. Their step names say so (`genuinely anonymous submit with no credentials`, `genuinely anonymous 404 with no credentials`) and their output records the raw response body. The anonymous path is therefore **automated**, and no `curl` companion is needed to establish it | — |
| ~~M4~~ | ~~Deleting the `x_casemgmt_case` rows whose `subject` starts with `ATF-PORTAL-18` after each `ATF 18` run~~ — ✅ **no longer needed** | The leak came from `ATF 18`'s anonymous leg POSTing a *real* submission through `sn_ws.RESTMessageV2`: an outbound call made from a script is not ATF-instrumented, so that row — inserted by **`guest`**, in its own transaction — sat outside the transaction ATF wraps the test in, and the rollback then reversed the test's own cleanup delete, reinstating it. One row survived every run and repeat runs accumulated them. That leg is now **non-mutating**: it asserts the same anonymous perimeter with a payload the handler must reject (`400 {"result":{"error":"Invalid payload."}}`) plus a read-only credential-free lookup, and proves by census that neither call persisted a row. The only row the test creates now comes from the ATF-instrumented `Send REST Request - Inbound` step, inside the rollback context — which the platform removes even when step 10 is skipped. Measured over two consecutive runs on 2026-08-08 (results `12a928de93628b10830ef82bdd03d686` and `805bac9293a28b10830ef82bdd03d630`): both **Success**, step 9 `checks=12 failures=0`, step 10 `submissions removed=1` / `deletes reporting failure=0` / `residue rows=0`, `subject STARTSWITH ATF-PORTAL` → **0 rows**, and the second run's step 1 reporting `pre-existing submissions removed=0`. One caveat: a row left behind by a run of the **earlier** design is deleted by step 1 and reinstated by the rollback, so any such legacy row must be swept once, by hand | spent |
| ~~M5~~ | ~~Fixing the `current.case` ACL defect so `ATF 07` turns green~~ — ✅ **DONE** | The four scripted child-table ACLs dereferenced the reserved word `case` and could not compile (`missing name after . operator`), denying every row. Fixed with `current.getElement('case')` — chosen over `getValue('case')` because measurement showed it supports every operation the conditions need (`.nil()` and `.getRefRecord()`). The test needed no change and is now green: 58 checks across five parent fixtures, passing in the final suite run `TES0001015` | spent |
| **M6** | **Observing the blocking message in the form's error banner for `ATF 15/16/17`** | **A framework limitation, not an omission.** ATF's `Submit a Form` step config exposes only `form_ui` and `assert_type` — there is no text or message input — and the only text-on-page assertion in the framework, `Assert Text on Page (Custom UI)`, targets the Custom UI DOM rather than the classic platform form these tests drive. The message *string* is asserted character-exactly server-side by each test, so wording regressions are caught automatically; what a human adds is confirmation that it is **displayed**. The runner's own step-5 screenshot attachment is sufficient evidence — on the last run it showed, verbatim, `All tasks must be closed before resolving this case.`, `Cases cannot be returned to Draft.` and `Closed cases are terminal and cannot be modified.`, each accompanied by the platform's generic `Invalid update` banner | ~2 min per run, or none if the runner screenshot is accepted |

`ATF 07` was left in the suite deliberately **red** for a period, rather than deleted or weakened, because it asserted
the documented AAP §0.5.6 behaviour and a suite that hides a real defect to look green is worth less than one that
shows it. The defect it exposed has since been fixed at its root cause (M5) and the test now passes — having been
strengthened rather than relaxed on the way: it went from a single parent fixture carrying both grant paths to five
parents (both-branch, direct-only, group-only, unassigned, and a group the agent is not a member of) with a task and
a party child each, asserting positive read and write on both allowed branches and negative read, write and delete on
both denied ones.
