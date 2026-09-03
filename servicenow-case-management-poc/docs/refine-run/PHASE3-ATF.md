# Phase 3 — Execute the ATF suite and the 13-assertion harness (NON-BLOCKING)

Refine PR, Phase 3, work unit **U4**. Directives owned here: **D38** (S1 single-test validation),
**D39** (S2 full suite + 13-assertion harness), **D40** (RESUME CHECK), **D41** (ATF suite
screenshot), **D42** (pass/fail by name), **D43** (classify each failure), **D44** (Phase 3 exit
condition), and **D4** (Phase 3 is not a shipping gate; itemize every failing test/assertion by
name). Phases 0–2 belong to U1/U2/U3 (`PHASE0-1.md`, `PHASE1-REBUILD.md`, `PHASE2.md`); the FINAL
REPORT and the ship decision belong to U5.

Instance `https://dev306625.service-now.com` (Zurich Patch 10). Every `sys_id` below was resolved by
query at the time it was used (`sys_atf_test_suite?nameLIKECase Management`,
`sys_atf_test_suite_test`, `sys_scope?scope=x_casemgmt`, `sys_atf_agent`, `sys_ws_operation`); the
literals are recorded as evidence, not used as inputs. **No credential, cookie or `sysparm_ck` value
appears in this file or in any committed artifact.**

**Entry gate (D1/D37).** `run-state.json` `phase2.exit_condition = "met"` (2026-09-02T20:53:14Z), so
Phase 3 was entered. Phase 2 committed the package cleanly (`state=committed`, "Succeeded 100%",
988 children, 0 collisions, no partial apply) on export 3's byte sequence, so **Phase 2 had already
returned its verdict before this phase began**. Per **D4/OVERRIDE-4** nothing in this document gates
delivery — and nothing in it settles delivery either: the delivery position, including the elected
shipping package and the gate's verdict on its bytes, is [`FINAL-REPORT.md`](./FINAL-REPORT.md) part
(d) and `final.delivery_position` in [`run-state.json`](./run-state.json). §5.5 states what ships.

**Availability.** Instance liveness was confirmed **by content** (a JSON body, not the hibernation
HTML splash) and a read-only API heartbeat (`GET /api/now/table/sys_user?sysparm_limit=1`, 10-minute
independent clock) ran for the whole phase: 21:04:43, 21:14:43, 21:24:43, 21:34:43, 21:44:43,
21:54:44, 22:04:44 — all HTTP 200 (all UTC). **Hibernation events: 0; recovery cycles used: 0 of 3
(0 duration lost).**

**Heartbeat mechanism — required, used, and the deviation, stated for this phase.**
(a) **Required** by directive lines 76–84: the **browser/UI heartbeat** — a rendered navigation to
`home.do` on an independent ~10-minute clock, judged live by content. The **API-context** variant is
the narrow exception, permitted **only** while a Retrieved Update Set record page or a commit-result
page must be preserved — a condition that **never arose in this phase**, which previewed and
committed nothing. (b) **Used:** the API variant, for the whole phase — the seven beats above, on the
run-long loop (`PHASE0-1.md` §2.4). (c) That is a **DEVIATION from directive lines 76–84 in mechanism
selection**, not compliance: with no record or commit-result page to preserve here, the exception did
not apply and the mandated browser/UI heartbeat should have run. (d) **Observed impact: none** — 0
hibernation events, 0 recovery cycles, and both variants are read-only.
(e) **Corrective action:** the mandated browser-context heartbeat was executed in the CR2 remediation
pass against `home.do` in a rendered authenticated session — BEAT 1 `2026-09-03T04:23:34.684Z`,
BEAT 2 `2026-09-03T04:34:04.494Z`, delta 630 s, both judged live by page content, session
"System Administrator"; that pass performed no commit and no PDI write, so the browser→API→browser
transition pair is **not applicable** to it. Full statement: `PHASE0-1.md` §2.4.

---

## 1. RESUME CHECK before running anything (D40)

> *"check the ATF result log for tests already completed before interruption. Any test that was in
> progress (started but no definitive pass/fail recorded) counts as not completed — re-run it, don't
> log it as partial. Resume only with tests that are genuinely un-started or incomplete."*

Performed **before** any test was launched:

| Query | Result |
| --- | --- |
| `sys_atf_test_result` total rows | **20** |
| `sys_atf_test_result` created **after** Phase 2's commit (`sys_created_on > 2026-09-02 20:36:27`) | **0** |
| `sys_atf_test_suite_result` total rows | **1** |

The only pre-existing suite result was `1768f7429307435009aa70d19dba10a4` / **TES0001001**, start
**`2026-09-02 15:33:54Z`**, end **`15:36:27Z`** (both **UTC**, as stored on the suite-result record;
the same two instants render as `08:33:54` and `08:36:27` in the browser's local display, which runs
at **UTC−7**), `status=Success`, `success_count=20`, `failure_count=0`, `error_count=0`,
`skip_count=0`. Normalized to UTC and compared with Phase 2's commit at **`2026-09-02T20:36:27Z`**,
that run **predates the commit by 5 h 02 min 33 s** — not the "roughly twelve hours" an earlier
revision of this record stated, which came from comparing the local-display value against a UTC one.
Either way it measured the *pre-refine converged* instance, not the package-only state now live.

**Resume decision, recorded per test before execution: no test was resumable.** All 20 tests counted
as **not completed** for this run and every one was re-run from scratch. No test was found in a
started-without-definitive-result state, so **nothing was logged as partial**. TES0001001 is retained
in this report only as a *pre-refine comparison baseline* for classification (§5).

---

## 2. S1 — a single test's result reads reliably from the rendered page (D38)

> *"VALIDATE FIRST: open /atf_test_runner.do, run a single test, confirm the result reads reliably
> from the rendered page (poll for async completion)."*

Headless ATF is impossible here — `sn_atf.runner.enabled=true` but `sn_atf.headless.enabled=false`
and cannot be enabled on a PDI — so the **client runner in a real rendered tab is the only route**.

**How it was run.** Logged in at `/login.do` (credential read from the environment, never a literal,
never printed or screenshotted). Tab 1 held `/atf_test_runner.do` open for the whole task; tab 2
opened the named test and launched its **"Run Test"** UI action.

The runner rendered, verbatim: `Client Test Runner` · `Waiting for a test to run` ·
`Your connection status is [ Connected ]` · `Currently executing as [ System Administrator ]` ·
`UI Batches Executed [ 0 ]` · `Execution Frame`. Attachment was independently corroborated by ~120
sequential `POST /xmlhttp.do` **200** long-polls with no gap.

**Test run:** `ATF 01 - Data model: case, task and party schema per AAP 0.5.7`
(`4779cf2ff32768ffd2afaee103133709`), name verified byte-for-byte on the form. Result record created:
`sys_atf_test_result` **`c4c78d5e938f435009aa70d19dba10f9`**.

**Polling.** Definitive ~2 s after the click (`start_time 21:20:29Z` → `end_time 21:20:30Z`,
`run_time 1 Second`), then 13 further live DOM re-reads at 5-second intervals (~60 s) confirmed steady
state — far inside D44's 5-minute cap, so the **"unable to execute"** rule was not triggered.

**Read back from the rendered page:**

| # | Step | Status as rendered | Text as rendered |
| --- | --- | --- | --- |
| 1 | Run Server Side Script | Success | `fixture setup: checks=1 failures=0` |
| 2 | Record Validation | Success | `Successfully validated record 'cfdc67741a52236340f593d0229635a8' in table 'x_casemgmt_case'` |
| 3 | Run Server Side Script | **Failure** | the assertion text below |
| 4 | Run Server Side Script | Skipped | `This step did not execute due to a failure in a previous step` |
| 5 | Run Server Side Script | Skipped | `This step did not execute due to a failure in a previous step` |

Overall verdict as rendered: `Test failed` / bar `Failed at 100%` /
`Step with order: 3 failed or threw an error` / `2. Rollback → Succeeded 100%`.

Failure text, verbatim:

```
x_casemgmt_case schema (AAP 0.5.7): checks=81 failures=5 :: case.type choices expected[General
Inquiry,Complaint] actual[] | case.status choices expected[Draft,Open,In Progress,Pending,Resolved,
Closed] actual[] | case.priority choices expected[Low,Medium,High,Critical] actual[] |
case.pending_reason choices expected[Awaiting Info,Awaiting Third Party,Other] actual[] | Draft is
the first selectable status choice expected[Draft] actual[undefined]
```

### How the page read was confirmed reliable — REST cross-check

| Attribute | Rendered page | `sys_atf_test_result` by REST | Agree? |
| --- | --- | --- | --- |
| Test name | `ATF 01 - Data model: case, task and party schema per AAP 0.5.7` | `test_name` identical | ✅ |
| Verdict | `Test failed` / `Failure` | `status = failure` | ✅ |
| Failing step | step order 3, `Run Server Side Script` | `first_failing_step 9cc7cd5e938f435009aa70d19dba1016` | ✅ |
| Failure text | as quoted above | `output` **byte-identical** | ✅ |
| Step outcomes | success, success, failure, skipped, skipped | `sys_atf_test_result_step` returns the same 5 rows, same order, same statuses | ✅ |
| Times | `14:20:29 → 14:20:30` (display TZ) | `21:20:29Z → 21:20:30Z` | ✅ same instant |

**No disagreement on any attribute — the rendered page read is RELIABLE, so D38's gate is satisfied
and D39 was authorized to proceed.** (Had they disagreed, the record would have been preferred and the
discrepancy recorded; that did not arise.) The run is inside the D40 window (21:20:29Z is after Phase
2's commit at 20:36:27Z), so it is a genuine this-run result.

**Two deviations, root-caused rather than assumed** — recorded because they change how the suite must
be run:

1. **No "Pick a Browser" dialog appeared for this test, and that is correct.** All five of ATF 01's
   steps are server-side, so ATF ran one server batch — the dialog said so literally
   (`1. Executing Server - Independent steps with order 1 - 5`) — and never queued a UI batch, so
   there was nothing to ask and no pre-selected option to accept. The machinery was healthy, not
   broken: `GET /scripts/PickABrowser/PickABrowserUtil.jsx` returned **200** on that click.
   Consistently `UI Batches Executed` stayed at `0`. The suite *does* contain client/UI steps, so the
   dialog was expected there — and it appeared (§3).
2. **The pre-observed agent row `e7c7bfce93c3435009aa70d19dba10e3` never came online**; it is a stale
   row from a dead session. The platform registered a **new** agent row for the live session. One
   `sys_atf_agent` row per distinct browser session is normal platform behaviour, so the live agent
   must be read rather than assumed.

| Screenshot (absolute path) | Caption |
| --- | --- |
| `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase3-single-test-result.png` | **"Phase 3 — S1 single-test result read from the rendered page: ATF 01, Status Failure, failing step 3, all five step outcomes"** |

Supporting captures in the same directory: `phase3-runner-tab-idle.png` (runner attached, "Waiting for
a test to run" / "Connected"), `atf01_form_loaded.png`, `run_test_dialog_no_pick_a_browser.png`,
`runner_poll_01_after_launch.png`, `atf_test_result_list_top.png`. Per **INTERP-6** these are cited by
path and caption; the PNG binaries are **not** committed.

---

## 3. S2 — the full 20-test / 180-step suite (D39)

> *"If validated, run the full 20-test/180-step suite and 13-assertion harness the same way."*

**Scope resolved by query, not trusted as literals.** `sys_atf_test_suite?nameLIKECase Management` →
**`x_casemgmt Case Management POC`** (`8e8c6de584ba8f081439ad5ee09ad1a1`, active).
`sys_atf_test_suite_test` → exactly **20** active member tests (orders 100–2000). `sys_atf_step` for
those 20 tests → exactly **180** rows. So the "20-test / 180-step" figure was confirmed on the
instance before the run.

**Launch.** The client runner was opened **first** and kept open, then the suite's **"Run Test
Suite"** UI action was clicked on its form (Name verified as `x_casemgmt Case Management POC`).

The **"Pick a Browser" dialog appeared this time**, exactly as S1 predicted. Verbatim: title
**"Pick a Browser"**; body *"The test you have selected includes client-side steps. Choose a browser
to run the test."*; radio 1 **pre-selected** = **"Chrome  151.0.0.0 (Linux ) (Current session)"**
(agent `52cc8d1a93cf435009aa70d19dba1083`); radio 2 unchecked = "Cloud Runner - Configure an admin
user to run tests using the Cloud Runner"; buttons "Cancel" /
"Run Test Suite". **The pre-selected current session was accepted unchanged.**

**Impersonation.** ATF drove it itself — the runner showed
`Currently executing as [ Demo Manager ]` and syslog recorded
`Impersonation end: Demo Manager (x_casemgmt_demo_manager)`. **No impersonation modal ever blocked**,
so the `user_name` + ArrowDown + Enter workaround was not needed and no self-initiated impersonation
occurred. `UI Batches Executed` incremented **0 → 1 → 2 → 3**, one per UI/form test (ATF 15/16/17),
with the Execution Frame provably driving a real case form
(`/x_casemgmt_case.do?…&sysparm_from_atf_test_runner=true`). The runner never disconnected; ~390 xhr
requests all 2xx. Nothing else impersonated or wrote on the instance for the duration.

**Definitive final state** reached ~1 minute after launch: `Failed at 100%` / `Suite failed`, all 20
test lines resolved.

### Authoritative suite result (REST), which agrees with the page exactly

| Field | Value |
| --- | --- |
| `sys_atf_test_suite_result` | **`0b7d459a93cf435009aa70d19dba10be`** (number **TES0001002**) |
| `test_suite` | `8e8c6de584ba8f081439ad5ee09ad1a1` |
| `status` | **failure** |
| `start_time` → `end_time` | **2026-09-02 21:45:31Z → 21:47:35Z** |
| `run_time` | **00:02:04** |
| success / failure / error / skip | **14 / 6 / 0 / 0** (rolled-up counts identical) |
| child `sys_atf_test_result` rows | **20** |
| Page pager | `Showing rows 1 to 20 of 20` — no pagination; `Failed Tests in Suite (6)` tab corroborates |

**Steps executed: 180 of 180** across the 20 tests. **Unable to execute: 0** — every test produced a
definitive verdict, so D44's 5-minute-per-test rule never triggered.

| Screenshot (absolute path) | Caption |
| --- | --- |
| `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase3-atf-suite-results.png` | **"Phase 3 — ATF suite results screen showing the final pass/fail summary"** (D41) |

Supporting captures in the same directory: `06_pick_a_browser_dialog.png` (current session
pre-selected), `09_progress_dialog_final_suite_failed.png` ("Failed at 100% / Suite failed"),
`04_atf_test_runner_connected.png`, `08_runner_ui_batches_2.png`,
`11_runner_final_connected_ui_batches_3.png`, `12_suite_result_summary_closeup.png`,
`13_per_test_rows_atf17_to_atf07.png`, `14_per_test_rows_atf06_to_atf01_and_pager.png`,
`10_suite_results_list_newest_first.png`, `05_suite_form_before_launch.png`. PNG binaries are **not**
committed (INTERP-6).

---

## 4. S3 — pass/fail **by name**, one row per test (D42, D4)

All 20 rows below. Verdicts are the authoritative `sys_atf_test_result.status` values for suite result
TES0001002, and they match the rendered page row-for-row. **No aggregate stands in for a name, and no
failure is omitted or averaged over.** Classification is explained in §5.

| # | Test name | Verdict | Failing step | Failing step / assertion text | Class | Fix attempts | Next steps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | ATF 01 - Data model: case, task and party schema per AAP 0.5.7 | **fail** | order **3**, `Run Server Side Script` | `x_casemgmt_case schema (AAP 0.5.7): checks=81 failures=5 :: case.type choices expected[General Inquiry,Complaint] actual[] \| case.status choices expected[Draft,Open,In Progress,Pending,Resolved,Closed] actual[] \| case.priority choices expected[Low,Medium,High,Critical] actual[] \| case.pending_reason choices expected[Awaiting Info,Awaiting Third Party,Other] actual[] \| Draft is the first selectable status choice expected[Draft] actual[undefined]` — steps 1–2 success, **steps 4–5 skipped, so this test's task and party schema assertions are UNVERIFIED, not passing** | **(c)** | 0 | Human decision on the choice-list delivery option (§5.4), then re-run this test |
| 02 | ATF 02 - RBAC: x_casemgmt_case_manager has full CRUD (AAP 0.5.6) | pass | — | — | n/a | 0 | none |
| 03 | ATF 03 - RBAC: x_casemgmt_case_agent create, ASSIGNED-ONLY read/write, no delete | pass | — | — | n/a | 0 | none |
| 04 | ATF 04 - RBAC: x_casemgmt_case_viewer is read-only across all cases | pass | — | — | n/a | 0 | none |
| 05 | ATF 05 - Field-level ACLs on assigned_group and assigned_agent | pass | — | — | n/a | 0 | none |
| 06 | ATF 06 - RBAC mirror on x_casemgmt_case_task and x_casemgmt_case_party (manager, viewer) | pass | — | — | n/a | 0 | none |
| 07 | ATF 07 - RBAC: agent ASSIGNED-ONLY read/write on task and party (AAP 0.5.6 mirror) | pass | — | — | n/a | 0 | none |
| 08 | ATF 08 - Transition Draft to Open requires assigned_group | pass | — | — | n/a | 0 | none |
| 09 | ATF 09 - Transition Open to In Progress requires an assigned_agent in the assigned_group | pass | — | — | n/a | 0 | none |
| 10 | ATF 10 - In Progress to Pending sets pending_reason, Pending to In Progress clears it | **fail** | order **7**, `Run Server Side Script` | `pending_reason choice set: checks=2 failures=1 :: pending_reason choices expected[Awaiting Info,Awaiting Third Party,Other] actual[]` — steps 1–6 succeeded, **including `Impersonated Demo Manager` and both status updates and validations, so the Pending ↔ In Progress transitions themselves worked**; step 8 skipped | **(c)** | 0 | Same decision as ATF 01, then re-run |
| 11 | ATF 11 - Task-closure gate blocks In Progress to Resolved with the verbatim message | pass | — | — | n/a | 0 | none |
| 12 | ATF 12 - Resolved to Closed requires the manager role and auto-sets closed_date | pass | — | — | n/a | 0 | none |
| 13 | ATF 13 - Prohibited transition: any status back to Draft | pass | — | — | n/a | 0 | none |
| 14 | ATF 14 - Prohibited transition: Closed is terminal | pass | — | — | n/a | 0 | none |
| 15 | ATF 15 - Form: resolving a case with an open task is blocked on the form | **fail** | order **4**, `Set Field Values` | `FAILURE: Unable to set field 'status' to value 'Resolved'. Value 'Resolved' is not currently a valid choice` — steps 1–3 success (fixture, `Impersonated Demo Manager`, `Successfully opened the 'x_casemgmt_case' form`); steps 5–7 skipped, so the on-form blocking-message assertion is **UNVERIFIED** | **(c)** | 0 | Same decision as ATF 01, then re-run |
| 16 | ATF 16 - Form: returning a case to Draft is blocked on the form | **fail** | order **4**, `Set Field Values` | `FAILURE: Unable to set field 'status' to value 'Draft'. Value 'Draft' is not currently a valid choice` — steps 1–3 success; steps 5–7 skipped, on-form assertion **UNVERIFIED** | **(c)** | 0 | Same decision as ATF 01, then re-run |
| 17 | ATF 17 - Form: a Closed case cannot be moved out of the terminal state on the form | **fail** | order **4**, `Set Field Values` | `FAILURE: Unable to set field 'status' to value 'In Progress'. Value 'In Progress' is not currently a valid choice` — steps 1–3 success; steps 5–7 skipped, on-form assertion **UNVERIFIED** | **(c)** | 0 | Same decision as ATF 01, then re-run |
| 18 | ATF 18 - Portal contract: anonymous submit returns 201 with the new case number | **fail** | order **3**, `Assert Status Code` | step 2: `The HTTP request has been sent to the endpoint 'https://dev306625.service-now.com/api/x_casemgmt/case_submit'. The response code is '400 Bad Request'.` → step 3: `The response status code doesn't match the specified operation for expected status code: '201', actual status code: '400'`; steps 4–10 skipped, so the returned-case-number assertions are **UNVERIFIED** | **(c)** | 0 | Same decision as ATF 01, then re-run |
| 19 | ATF 19 - Portal contract: lookup of a valid number returns only status, subject, opened_date | pass | — | all 10 steps success; step 2 read back `anonymous 200 body: {"result":{"status":"Open","subject":"ATF-PORTAL-19 lookup fixture","opened_date":"2026-09-02 21:47:31"}}` with `opened_date compared exactly` | n/a | 0 | none |
| 20 | ATF 20 - Portal contract: lookup of an unknown number returns 404 with the verbatim message | pass | — | — | n/a | 0 | none |

**Totals: 20 tests = 14 pass + 6 fail + 0 unable to execute.** Failures by name: **ATF 01, ATF 10,
ATF 15, ATF 16, ATF 17, ATF 18**.

---

## 5. S4 — every failure classified, with evidence, and the action taken (D43, D5, D6)

### 5.1 One shared root cause behind all six failures

The `sys_choice` rows for the three scoped tables **do not exist on the instance**, while the
dictionary still declares the four `x_casemgmt_case` fields choice-typed:

| Probe | Result |
| --- | --- |
| `sys_choice` where `nameIN x_casemgmt_case,x_casemgmt_case_task,x_casemgmt_case_party` | **0 rows** |
| `sys_choice` where `nameSTARTSWITH x_casemgmt` | **0 rows** |
| `GET /api/now/table/sys_choice/3e7609e334c65bf732756bc25d9f21c2` (a sys_id the package itself carries) | **HTTP 404** `No Record found` |

How that single absence produces each of the six failures:

- **ATF 01, ATF 10** assert the choice lists directly and read `actual[]`.
- **ATF 15, 16, 17** cannot set `status` on the **form** because, with no `sys_choice` rows,
  `Resolved` / `Draft` / `In Progress` are literally not valid choices — that is the platform's own
  message.
- **ATF 18's 400 is the same cause, not an independent one.** Read from source rather than inferred:
  `sys_ws_operation` `886ad7128907a6351ea04b210c27029e` ("Case Submit POST", `relative_path /`,
  `requires_authentication=false`) delegates to `x_casemgmt.CasePortalService.submitCase()`, whose
  `_caseTypeChoices()` queries `sys_choice` for `name=x_casemgmt_case`, `element=type`,
  `inactive=false`, and whose `_resolveCaseTypeChoice()` returns `null` when that list is empty. The
  Script Include's own comment states the intent verbatim: *"When the choice list cannot be read at
  all (it has not been created on this instance yet) the value is refused rather than stored
  unchecked: refusing is the fail-closed answer, and the choice list is a Gate 1 requirement, so its
  absence is an installation fault rather than a reason to relax the contract."* So a valid
  `General Inquiry` is refused and the handler answers **HTTP 400**. No platform exception appears in
  syslog because the 400 is deliberate, not a crash.

### 5.2 Was it caused by this PR? The evidence says no

1. **The table/role-link swap did not touch the choice payloads — verified here, not taken on
   trust.** Every `<sys_update_xml>` block was extracted from both packages and the `<payload>` CDATA
   hashed. All **7** `sys_choice` payloads are **byte-identical** between the rebuilt package (988
   captured blocks) and the retained `…FALLBACK.xml` (926 blocks):
   `sys_choice_3e7609e3…`, `469743ab…`, `4c80901f…`, `6224e4af…`, `8980a8a9…`, `c509a1c2…`,
   `db2d244d…`. The payloads are also well formed and correct
   (`name=x_casemgmt_case`, `element=type`, `value`/`label` `General Inquiry`, `inactive=false`,
   `sequence 100`, scope `x_casemgmt`).
2. **The package already behaved this way before this PR.** Its own
   `docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` records the "Package-alone state" as
   *"scope 1, `sys_db_object` 3, `sys_dictionary` 25, **`sys_choice` 0** (Defect C), `sys_number` 3,
   roles 3, ACLs 26, **acl_role links 0** (Defect 9) …"*, and elsewhere that the choice lists
   *"were absent (persisted across 6 commit attempts and a full app-delete teardown + re-establish
   cycle)"*. The documented mechanism is that the physical DDL is emitted by the platform's
   after-insert Business Rule **"Synch Dictionary and Table"** (order 500) on `sys_db_object`, which
   the Update Set apply engine (`GlideUpdateManager2`) suppresses.
3. **The pre-refine live instance had choices only because the remediation crutch created them** —
   `scripts/post_import_remediation.js` reports `choices_created=24`. **INTERP-10 forbade that crutch
   in Phase 2** (`remediation_script_run=false`, `second_commit=false`), so this run is the first time
   the package-alone residual is visible on a live instance.
4. **The commit did not skip them.** All 7 choice children of retrieved set
   `0b3b7452934f435009aa70d19dba100d` carry `action=INSERT_OR_UPDATE` with an **empty disposition**
   (not skipped, not collided) and `type = Choice List` — the engine reported applying them and the
   rows still do not exist.

**Conclusion: the absence is a pre-existing package property — the residual half of the package's own
documented Defect C — not something the table/role-link swap introduced.**

### 5.3 Genuinely new information (D44): the rebuild fixed two of the three package-alone defects

D44 requires treating these results as new information rather than as re-confirming a known-good
state. Comparing the package's documented package-alone state with this run's verified post-commit
state:

| Package-alone defect | Documented pre-refine | **This run, after the native rebuild** | Verdict |
| --- | --- | --- | --- |
| ACL → role links (**Defect 9**) | `acl_role links 0` of an expected 27 | **27/27** (manager 14 / agent 10 / viewer 3), with **no** remediation run | **FIXED** |
| Physical storage (**Defect C**, storage half) | `sys_db_object` metadata with no physical storage; REST 403; inserts fail `invalid table name` | three tables **HTTP 200**, dictionary **21 / 14 / 13** | **FIXED** |
| Choice rows (**Defect C**, residual) | `sys_choice 0` | `sys_choice 0` | **REMAINS** |

That is precisely D2's stated objective — *"physical storage provisioning and role-link capture side
effects fire correctly"* — delivered for storage and role links, with the choice rows as the one
remaining gap. The suite corroborates it from the other direction: **every test that exercises the
logic by script passed** — ATF 08, 09, 11, 12, 13, 14 (transitions), ATF 02–07 (the entire RBAC/ACL
matrix, which can only pass because the 27 role links exist), ATF 19 and 20 (the lookup contract). So
schema, ACLs, role links, transition logic and the lookup contract are all **confirmed working on this
instance**; what is missing is choice **data**.

### 5.4 Classification: all six are class **(c)** — pre-existing and a judgment call

Against the policy at directive lines 31–35:

- **Not (a) "caused by this PR (a regression)"** — the failing behavior is not touched by the
  table/role-link swap, and the shipped artifact's choice payloads are byte-identical to the package
  that shipped before (§5.2).
- **Not (b) "pre-existing and unambiguous — fix it"** — (b) means one narrowly scoped change to the
  single artifact at fault. No such change is available here. The three candidate remedies are all
  delivery-level decisions rather than mechanical corrections:

| Option | What it would mean | Why it is a decision, not a mechanical fix |
| --- | --- | --- |
| **1. Amend the package** so the choice lists self-converge on a first-time commit | The artifact at fault is `update-set/x_casemgmt_case_management_update_set.xml` | That file is **explicitly out of this unit's scope**, and any change to it makes Phase 2's verified checksum **stale** (INTERP-9/D36), requiring a full Phase 2 re-run (S1–S6) that belongs to U3 |
| **2. Keep the documented manual step** — run `scripts/post_import_remediation.js` from Global after commit (§9.5), which creates `choices_created=24` | This is what the pre-refine instance did | It reinstates the very crutch whose elimination is D2's objective; **INTERP-10** classifies running it as a *fix attempt* that does not produce a clean state; it rebuilds tables instance-wide, far beyond "one narrowly scoped change"; and the **shipped package would still not self-converge** |
| **3. Hand-create the 24 `sys_choice` rows** | Would turn the suite green immediately | It would **mask** the package-alone defect while the shipped package is unchanged — which **D4 forbids** ("never omit or average over"). Recorded as available but **not recommended** |

Choosing between "ship with a documented manual remediation step" and "change and re-verify the
package" is a business/delivery judgment call that also collides with the checksum gate and with Phase
2's ownership. **D5(c) therefore governs: not decided unilaterally, shipped anyway, flagged for human
decision.**

**The alternative reading, stated rather than buried.** Measured against the pre-refine *live
instance* — which had choice rows via remediation, and where this same suite passed 20/20 at
`2026-09-02 15:33:54Z` (`08:33:54` in the browser's UTC−7 local display) — a reviewer could reasonably
call this a regression of the live environment. Both readings
are recorded here and the decision is left to the human. What is not in dispute: **the shipped
artifact is not worse**, because its choice payloads are byte-identical to the package that shipped
before.

### 5.5 Action taken, and the checksum consequence of it (INTERP-9 / D36)

**Fixes applied: none.** Class (c) mandates no unilateral fix, and the only artifact at fault is
outside this unit's scope. The consequences, stated plainly:

| Question | Answer |
| --- | --- |
| Was any fix applied? | **No** |
| Was the package XML changed? | **No, not by this phase** — `update-set/x_casemgmt_case_management_update_set.xml` was untouched here, as was `…FALLBACK.xml`. A later pass re-sequenced its `sys_update_xml` blocks into AAP §0.5.2 dependency order, changing no payload, and the re-verification pass after it elected the untouched fallback onto the deliverable path and retained the re-sequenced bytes at `…_update_set.REBUILT-DEPENDENCY-ORDERED.xml` |
| Is Phase 2's verified checksum stale? | **Yes — but not through anything this phase did.** Phase 2's verified checksum is `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`, the digest of export 3's bytes, and at the end of this phase the deliverable still hashed to exactly that (re-asserted in §7). The later pass re-sequenced the file's block order into `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`. Under D36 the package changed after the S6 sum, which makes the recorded checksum **stale** and puts a full Phase 2 **S1–S6 re-run on the `90ee0249…` bytes owed** — not performed by this phase, and not by the CR1 pass that made the change |
| Was Phase 2 re-run? | **Not by this phase, and not required by anything this phase did.** It is owed on the retained rebuilt bytes for the reason in the row above, it has not been performed, and it is equally unperformed on the elected fallback that now ships |
| What ships? | **The elected fallback.** The deliverable path holds the original unmodified package — 926 payload blocks, 3,781,097 bytes, `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, byte-identical to `…FALLBACK.xml` — elected under OVERRIDE-2 / directive **D3** on the unmet-exit-condition path and labelled as **not** carrying this round's native-rebuild fix (0 `sys_documentation` rows, 0 `sys_security_acl_role` rows, 25 hand-authored `sys_dictionary` rows), so an importer must run `scripts/post_import_remediation.js` for the physical schema and the 27 ACL-role links. The S1–S6 gate is **NOT MET** for those elected bytes and for the retained rebuilt package `90ee0249…` alike, and **MET** for export 3's sequence only: electing settles the shipping decision, not the gate. **This phase presented nothing unverified** — while it ran, the deliverable was export 3's Phase-2-verified byte sequence, and **the ATF suite ran against the rebuilt content as committed on the instance**, not against the elected fallback. The delivery position is [`FINAL-REPORT.md`](./FINAL-REPORT.md) part (d), [`PHASE2.md`](./PHASE2.md) §7.1, and `final.delivery_position` in [`run-state.json`](./run-state.json) |

**D6 two-attempt cap: 0 of 2 attempts consumed.** No class (a) or actionable class (b) issue arose, so
no fix-and-re-verify loop was entered; nothing was abandoned mid-loop and nothing hit the cap.

### 5.6 The four known pre-existing defects — how they actually behaved

Treated as pre-existing and **not** attributed to this PR. **None of them caused an ATF failure:**

| Known defect | Behaviour in this run |
| --- | --- |
| `opened_date` empty on 8 of 10 seeded cases | **Did not cause any failure.** ATF 19 **passed**, because it builds its own fixture (`ATF-PORTAL-19 lookup fixture`) with an explicit `opened_date` and compares it exactly — step 2 read back `{"status":"Open","subject":"ATF-PORTAL-19 lookup fixture","opened_date":"2026-09-02 21:47:31"}`. The defect remains real in the seed data but the suite does not exercise it |
| Case form rendering the raw column name `duration_to_close` as a label | Cosmetic; asserted by no test — no failure |
| "Case Count by Status" donut rendering no legend/data labels | Cosmetic; asserted by no test — no failure |
| Package docs citing the retired host `dev379024` | Documentation; asserted by no test — no failure |

Every **other** failure was classified on its own observed evidence, exactly as D44 requires; nothing
was waved through as re-confirming a known-good state.

---

## 6. The 13-assertion harness (D39, INTERP-8)

**How it was run.** `servicenow-case-management-poc/scripts/transition_logic_regression_assertions.js`
was executed from the background-script runner **with the application scope set to `x_casemgmt`**
(`sys_scope` `82b99028936f74320d74d6f88357a5af`, resolved by query). A global-scope run cannot
instantiate the package-private `x_casemgmt.CaseTransitionValidator`, and `gs.print()` is forbidden in
scope, which is why the harness writes a single `syslog` line. The runner used an **interactive
form-login** session (`GET /login.do` → 72-char `sysparm_ck` → `POST /login.do` with `user_name`,
`user_password`, `sysparm_ck`, `sys_action=sysverb_login` → `/login_redirect.do`), and on Zurich P10
`/sys.scripts.do` emits no `g_ck`, so the hidden input named `sysparm_ck` was scraped. The platform
answered *"Script completed in scope x_casemgmt"*. Started 2026-09-02T22:05:07Z; the line was written
at **22:05:09Z** (`syslog.sys_created_on`, UTC as the Table API returns it).

**Read back with INTERP-8's exact query**
(`GET /api/now/table/syslog?sysparm_query=messageSTARTSWITHU1ASSERT^ORDERBYDESCsys_created_on&sysparm_limit=1`).
The complete line is 2,684 characters and is held byte-for-byte in
[`run-state.json`](./run-state.json) → `phase3.harness.raw_syslog_line`; it is also reproduced in
full, without ellipsis, in [`FINAL-REPORT.md`](./FINAL-REPORT.md) part (e). What follows is an
**abbreviated excerpt, not the whole line and not a verbatim reproduction of it**: every character
shown is byte-exact, the first `…` stands for A1's `expected`/`actual` values and for assertions A2
through A12 in their entirety, and the second stands for A13's label and values. Each elided
assertion is listed in full in the per-assertion table underneath.

```
U1ASSERT|TOTAL=13 PASSED=13 FAILED=0 |CLEANUP tasks=4 cases=7 remainingCases=10 |PASS A1 … ||| PASS A13 …
```

**A pass is the literal `TOTAL=13 PASSED=13 FAILED=0`, and that is exactly what was recorded.**

### Per-assertion labels — all 13

| Assertion | Label | Result |
| --- | --- | --- |
| A1 | `canTransitionToOpen blocks empty assigned_group (verbatim)` — expected/actual `{"ok":false,"error":"Required field assigned_group is empty."}` | **PASS** |
| A2 | `canTransitionToOpen allows populated assigned_group` — `{"ok":true}` | **PASS** |
| A3 | `canTransitionToInProgress blocks empty assigned_agent (verbatim)` — `"Assigned agent must be set and must be a member of the assigned group."` | **PASS** |
| A4 | `canTransitionToInProgress blocks agent not in assigned_group (verbatim)` — same verbatim message | **PASS** |
| A5 | `canTransitionToInProgress allows agent who is a member of assigned_group` — `{"ok":true}` | **PASS** |
| A6 | `canTransitionToResolved blocks while 1 child task is Open (verbatim)` — `"All tasks must be closed before resolving this case."` | **PASS** |
| A7 | `canTransitionToResolved allows once every child task is Closed` — `{"ok":true}` | **PASS** |
| A8 | `canTransitionToClosed allows a caller holding x_casemgmt_case_manager` — `{"ok":true}\|callerHasManagerRole=true` | **PASS** |
| A9 | `canTransitionToClosed blocks a caller without the manager role (verbatim)` — `"Only case managers can close cases."\|idUnknown=true` | **PASS** |
| A10 | `validateNoBacktransition blocks any -> Draft (verbatim)` — `"Cases cannot be returned to Draft."` | **PASS** |
| A11 | `validateNoBacktransition blocks Closed -> * (verbatim)` — `"Closed cases are terminal and cannot be modified."` | **PASS** |
| A12 | `isAgentInGroup true for a member, false for a non-member` — expected/actual `true/false` | **PASS** |
| A13 | `getOpenTaskCountForCase counts every non-Closed child task` — expected `2`, actual `2` | **PASS** |

Every label carries matching `expected=`/`actual=` JSON. **Failing assertions to itemize by name:
none — 0 of 13 failed.**

### Baseline comparison

| | Aggregate | Cleanup | When (**UTC**) |
| --- | --- | --- | --- |
| Pre-refine baseline | `TOTAL=13 PASSED=13 FAILED=0` | `tasks=4 cases=7 remainingCases=11` | 2026-09-02 15:24:30Z |
| **This run** | **`TOTAL=13 PASSED=13 FAILED=0`** | `tasks=4 cases=7 remainingCases=10` | 2026-09-02 22:05:09Z |

Both "When" values are the `syslog.sys_created_on` of the harness's own `U1ASSERT|` line as the Table
API returns it — **UTC**, not a browser-local display value — so the two rows are directly comparable
without normalization. Neither is compared against any other timestamp in this record.

**Identical aggregate — no regression in the transition-logic contract.** The only delta is
`remainingCases` 11 → 10, which is **expected per OVERRIDE-3**: the two extra portal-created cases
were destroyed with the tables in Phase 2, so only the 10 cases the package carries remain. That is a
fixture-count observation, not an assertion change.

This is also decisive classification evidence: **the validator logic is intact**, so the ATF failures
in §5 are an absence of choice *data*, not a logic defect.

**No residue.** ATF's own rollback completed cleanly (`Rollback completed successfully after 1
attempt(s)`; `recovered delete records: 2, modified records: 3, inserted records: 37, number of
exceptions: 0`) and the harness deleted its own fixtures. Post-run state: cases **10**, tasks **10**,
parties **8**, `U1BASE-*` fixtures **0**, scoped `sys_security_acl_role` links still **27**.

---

## 7. Validation owned by this phase

| Gate | Command | Result |
| --- | --- | --- |
| XML well-formedness | `find servicenow-case-management-poc -name '*.xml' -print0 \| xargs -0 -n1 xmllint --noout` | **no output** (175 files at the time of this phase; 212 today) |
| JS syntax | `find servicenow-case-management-poc -name '*.js' -print0 \| xargs -0 -n1 node --check` | **no output** (3 files at the time of this phase; **4 today** — the CR6 pass added `scripts/pre_delete_collateral_guard.js`, which passes the same gate) |
| `run-state.json` parses | `python3 -c "json.load(...)"` | **parses** |
| **Package checksum unchanged by this phase** | `sha256sum update-set/x_casemgmt_case_management_update_set.xml` | **`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** — **equal to `phase2.verified_checksum`**, asserted explicitly because this phase changed nothing in the package. (The file was re-sequenced after this phase into `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`, which is retained at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, and the deliverable path now holds the **elected fallback** `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`; under D36 the re-sequencing makes the recorded checksum stale and the S1–S6 re-run on those bytes owed — §5.5) |
| No binaries staged | `git status` | no PNG/video staged; `blitzy/screenshots/*.png` remain untracked |

---

## 8. Phase 3 EXIT CONDITION (D44)

> *"Full suite executed with every result captured and classified — a 100% pass rate is NOT required.
> The package ships based on Phase 2's result regardless of this phase's outcome; this becomes the
> known-issues section of the final report. … If a test's result can't be read after 5 minutes of
> polling, mark it 'unable to execute' and continue with the rest."*

| Clause | Evidence | Verdict |
| --- | --- | --- |
| Full suite executed | Suite result **TES0001002** (`0b7d459a93cf435009aa70d19dba10be`), all **20** member tests run, **180 of 180** steps, launched by the "Run Test Suite" UI action through the client runner with the current session accepted in "Pick a Browser" (§3) | **met** |
| Every result captured | 20 child `sys_atf_test_result` rows; one row per test **by name** in §4 with failing step and verbatim assertion text for all 6 failures; page and REST agree row-for-row | **met** |
| Every result classified | All 6 failures classified **(c)** with cited evidence, options and next steps (§5); the 14 passes marked n/a | **met** |
| 100% pass rate not required | 14 pass / 6 fail is reported as-is; **nothing omitted or averaged over** (D4) | **satisfied** |
| Per-test 5-minute unreadability rule | Never triggered — every test produced a definitive verdict; **unable to execute = 0** | **n/a, satisfied** |
| 13-assertion harness | Run in the `x_casemgmt` scope; `U1ASSERT\|TOTAL=13 PASSED=13 FAILED=0`, all 13 labels PASS, identical to baseline (§6) | **met** |
| Failures treated as new information | The rebuild's fix of Defect 9 and of Defect C's storage half is recorded as new evidence, and the choice residual is judged on its own observed evidence rather than as re-confirming a known-good state (§5.3) | **met** |

**PHASE 3 EXIT CONDITION: MET — 2026-09-02T22:10:59Z (UTC).**

Phase 3 is **informational only**. The byte sequence Phase 2 verified —
`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` — cleared Phase 2's gate on that
sequence, and **this phase neither gates nor settles delivery** (D4/OVERRIDE-4). **This phase applied
no fix and changed no artifact**, so nothing here made that checksum stale. It was made stale
afterwards: the CR1 pass re-sequenced the deliverable's block order into
`90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`, for which the S1–S6 gate is **NOT
MET** and the run is owed and unperformed. The re-verification pass then **elected the untouched
fallback** as the shipping package under OVERRIDE-2 / directive D3, so the deliverable holds
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` — labelled as not carrying this
round's fix — while the re-sequenced bytes are retained at
`…_update_set.REBUILT-DEPENDENCY-ORDERED.xml`. The gate stays **NOT MET** for both (§5.5, and
[`FINAL-REPORT.md`](./FINAL-REPORT.md) part (d) for the position).

### Known issues handed to the FINAL REPORT (U5), by name

1. **ATF 01, ATF 10, ATF 15, ATF 16, ATF 17, ATF 18** — six named failures, one shared root cause
   (`sys_choice` rows absent for the three scoped tables), all class **(c)**, **0 fix attempts**, and
   for each of ATF 01/15/16/17/18 the later steps were **skipped**, so their downstream assertions are
   **unverified rather than passing**. Awaiting a human decision between Option 1 (amend the package,
   then re-run Phase 2 for a **new** verified checksum before that package may ship) and Option 2
   (accept the verified package and keep §9.5's documented post-commit remediation as the install
   procedure, saying so plainly in the install docs). Option 3 (hand-populating the 24 rows) is
   available but **not recommended** — it masks the package-alone defect. Re-running the six named
   tests is the re-verification step once an option is chosen.

   **Amendment — 2026-09-03, after the settled election.** The Option 1 / Option 2 wording above is
   the handoff **as it was written on 2026-09-02** and is kept as the record of it. It is no longer
   current advice, because "the verified package" in it names a byte sequence that is not on disk.
   Three sequences must be kept apart, and only the first has ever cleared a gate:

   - **Export 3, `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** — the
     historical verification and the only complete round trip of this run: uploaded onto a clean
     instance, previewed to **0 `type=error` and 0 `type=warning`**, committed at
     `2026-09-02T20:53:14Z`. It survives in git history; **no file on disk holds these bytes**, so it
     cannot be the package a reader ships today.
   - **The elected fallback, `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`** —
     what actually ships, at `update-set/x_casemgmt_case_management_update_set.xml`, byte-identical to
     `…FALLBACK.xml` (both confirmed by `sha256sum`). **No preview of any kind was ever run on these
     bytes**, so it is unverified rather than verified, and it does not carry this round's native
     rebuild — `scripts/post_import_remediation.js` is required with it.
   - **The retained rebuild, `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`** —
     at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, never
     uploaded, previewed or committed; static corroboration only, and a full Phase-2 S1–S6 run on its
     own exact bytes is owed before it may be promoted.

   So Option 2 today reads: **ship the elected fallback labelled as unverified**, with §9.5's
   post-commit remediation as the install procedure — not "accept the verified package".

2. **`opened_date` empty on 8 of 10 seeded cases** — pre-existing, unchanged, and **not** exercised by
   the suite (ATF 19 passed on its own fixture). Carried forward as a known issue, not as a Phase 3
   failure.

**Positive findings worth carrying forward:** the native rebuild fixed **Defect 9** (`acl_role links`
0 → **27/27**) and the storage half of **Defect C** (three tables physical, dictionary 21/14/13) with
**no** remediation run, and the transition-logic contract is intact (**13/13**, identical to the
pre-refine baseline). The full RBAC/ACL matrix, all script-path transitions, and the portal lookup
contract all pass on this instance.
