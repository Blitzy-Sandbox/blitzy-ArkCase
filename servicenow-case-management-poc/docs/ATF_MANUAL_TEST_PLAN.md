# Manual ATF Test Plan — `x_casemgmt` Case Management POC

## Status of this document — read this first

**Automated ATF generation held on this build. The primary deliverable for Section 3 is a real, running suite, not this plan.**

A working suite exists and was executed on the live PDI:

| Fact | Value |
| --- | --- |
| Suite name | `x_casemgmt Case Management POC` (`sys_atf_test_suite`, scope `x_casemgmt`) |
| Tests | 20 (`ATF 01` … `ATF 20`), 180 `sys_atf_step` rows, 540 step-input rows |
| Serialized artifacts | `servicenow-case-management-poc/atf/*.xml` (21 files) |
| Folded into the package | **761 of the package's 926** `<sys_update_xml>` blocks in `update-set/x_casemgmt_case_management_update_set.xml` (3,781,097 bytes, SHA-256 `7292a6fe…`) — the suite is the single largest thing in the deliverable. **One** block of that range has changed since the suite was authored: the `Value` block for `sys_variable_value` `7b1f7b99…` (`ATF 18` step 9), edited at HEAD in both the artifact and the packaged payload, **17 `//` comment lines with no executable change** — the live instance is that one comment revision behind, and the other 539 step-input values are byte-identical to the package. Measured in [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §8.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). An earlier revision of this row said the range was byte-unchanged; that was true of the preceding pass only |
| Last full-suite verdict | **`TES0001002`, 2026-09-02, measured on the package alone — 20 tests, 14 Success / 6 Failure / 0 Error / 0 Skipped, with 180 of 180 steps executed** (`sys_atf_test_suite_result` `0b7d459a93cf435009aa70d19dba10be`; `21:45:31Z → 21:47:35Z`, `run_time 00:02:04`). The six failures, by name, are **`ATF 01`, `ATF 10`, `ATF 15`, `ATF 16`, `ATF 17` and `ATF 18`** — all classification (c), 0 fix attempts, and all one root cause: `sys_choice` rows are absent for the three scoped tables (0 rows; the package's own choice `sys_id` `3e7609e334c65bf732756bc25d9f21c2` answers HTTP 404) while the dictionary keeps the four `case` fields choice-typed, so `status`, `type`, `priority` and `pending_reason` offer no selectable option. Per-failure failing step and verbatim assertion text: [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) §(e). The suite left no residue (ATF rollback clean; census back to 10 cases / 10 tasks / 8 parties). **Run this suite immediately after a bare commit and 14 / 6 is the expected outcome, not a defect in your install; run it after `../scripts/post_import_remediation.js` has created the 24 choice rows and 20 / 20 is.** |
| Last **post-remediation** verdict — historical | **`TES0001015` — 20 Success / 0 Failure / 0 Error / 0 Skipped, with 180 of 180 step results Success**, in about 4 minutes, leaving **zero test residue** behind. `sys_id c557b49a93e28b10830ef82bdd03d638`. **This is historical post-remediation evidence, not the current verdict:** it was taken on an instance where the 24 `sys_choice` rows already existed, which is exactly the condition the 2026-09-02 package-alone run lacked. It is reproduced by `TES0001016` and `TES0001017` (2026-08-10). Both results stand, dated: 20 / 20 with the choice rows present, 14 / 6 without them. Corroborated the same four ways: the *Failed Tests in Suite* list is empty, the rolled-up failure / error / skip counts are all `0`, a step-level sweep returns 180 / 180 Success, and no child result carries a `first_failing_step` |
| Last **serialized-import** verdict | **`TES0001014` — also 20 / 0 / 0 / 0 with 180 of 180 steps, in 5 m 44 s** (`sys_id f2f7770a93ea4b10830ef82bdd03d680`). This is the run that proves the records survive **export and re-import**, because it was executed immediately after all 761 records were re-applied from the shipped artifacts. It is **not** the current result: it was taken on a **pre-security revision** of the deliverable, before the changes that removed the bootstrap trigger and narrowed cross-scope access. The three form tests in that run genuinely drove a browser — `UI Batches Executed` went `0 → 3`. **These are two separate claims and this document keeps them separate:** `TES0001015` says the suite passes on the application as it stands; `TES0001014` says the suite survives serialization. Neither says both at once, and the gap — a serialized re-load followed by a suite run, on the bytes that ship — is open work, recorded as item 2 of [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §10.0](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) |
| **Verdict rows are perishable — re-measure, never cite** | The two rows named above were real when measured, but `sys_atf_test_suite_result` is **not** durable on this shared instance. Re-measured 2026-08-10: **both `TES0001015` (`c557b49a…638`) and `TES0001014` (`f2f7770a…680`) no longer resolve** — a REST `GET` on either answers *"No Record found"*, and all three ATF result tables were empty at that point. Two later runs of the same 20 tests do resolve, each **20 Success / 0 Failure / 0 Error / 0 Skipped with 180 of 180 step results Success**: `TES0001016` (`5ff9036a…6b8`, 2026-08-10 04:56:34) and `TES0001017` (`b5ff076a…6a5`, 2026-08-10 05:22:41, `run_time 00:03:28`). So the *claim* below holds and has been reproduced twice independently — but quote the **measurement method** (the seven checks in §7), not a `TES…` number. Full record in [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §8.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) |
| Previous verdicts, and what they found | Every one of these is **history**, kept because each identifies a real defect and how it was caught. `TES0001013` was **19 / 1**: `ATF 03` failed at step 8 with `FAILURE: Unable to find record '…' in table 'x_casemgmt_case'` — a defect in the *test's own construction*, since ATF's native `Record Update` step must locate a row before it can attempt a write, and the assigned-only read ACL had already hidden that row from the impersonated agent. `TES0001006` was also **19 / 1**, for the unrelated `ATF 07` child-table ACL defect (`current.case` could not compile — `case` is a JavaScript reserved word). An intermediate revision scored **16 / 4**, the four being `ATF 07` plus the three form tests `ATF 15` / `16` / `17`. **All of those root causes are fixed and the final suite is green** — see §8 |
| Can the suite fail? | Yes, and not only by construction. Deliberate inverted controls exist per area — field-set equality, the `status` default, the four RBAC assertions, the `opened_date` exact-value comparison, pinned-number uniqueness, and the cleanup residue assertions (each was inverted, observed to fail with a precise message, and restored). Stronger still, `TES0001013` was an **unplanned real failure**: the suite caught it, attributed it to the exact step, reported it verbatim, and went green once the step was corrected |
| Do the records survive serialization + re-import? | Yes — measured, on the revision current at the time. All **761** records were re-applied from the shipped artifacts through the platform's own payload loader with 0 load errors, and all **540** step-input values were confirmed byte-identical afterwards by md5 per `(document_key, variable)` — 540 identical, 0 different, 0 missing. `TES0001014` immediately followed, so that verdict belongs to the serialized package and not merely to what was authored in the UI. (The earlier `TES0001006` run established the same property at 763 records / 542 inputs, before `ATF 03` step 8 was rebuilt — which is where the superseded 763 / 542 figures come from.) **What has not been repeated since:** the same re-load-then-run on the **current** package bytes. |

So the **D3.3 fallback condition did not fire**: ATF did *not* degrade the way Flow Designer did in Defect F. Nothing in this document should be read as "automated generation didn't hold".

This plan is shipped anyway, for three concrete uses:

1. **A UI-build recipe.** Everything below is what a human would click in the ATF UI (`All → Automated Test Framework → Tests`) to build the same coverage from nothing — useful for extending the suite, for rebuilding a single test, or for an instance where importing serialized ATF records is not desirable.
2. **A standing fallback.** If a future target instance refuses the serialized records (see *§7 Known structural risk*), this plan is the recovery path. It is costed **once**, in §6, and §6 is the only place to take a figure from — but read its opening note first: three of the twenty scenarios have actually been timed and two of those three ran at **2× their line item**, so no claim of a saving against the original 16-hour estimate is made.
3. **A specification of intent.** Each scenario states the exact expected values — including the five verbatim strings — independently of how any one test is wired.

Where the shipped test differs from the recipe here, the difference is called out inline, with the reason, and §6.1 collects them.

> **If you are holding an older copy of this document, throw it away.** Every scenario that touches a record used to instruct you to pin the fixture's `sys_id` in a script step and then type that `sys_id` into the step's `Record` field. **That is not possible in the ATF UI** — the field is read-only and discards a typed `sys_id` without a word of explanation — so most of §5 could not be built as written. The addressing pattern is corrected throughout this revision (§4 *Addressing a fixture row*, and F7 / F15 in §3), and the field labels, choice labels and `Enforce security` defaults in every step table have been re-read off this instance and confirmed on screen.

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
| P6 | **The application scope is set to `x_casemgmt Case Management` before you create anything** | Otherwise the test lands in whatever scope is active and cannot reach the scoped tables. On this release there is **no gear/settings cog** — use the **`Scope selectors`** control (globe glyph) in the right-hand icon cluster of the banner, expand **Application scope**, filter on `Case Management`, and select it. Verify it took: the `Application` field on a new Test record is read-only and must read `x_casemgmt Case Management`. |

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
| F7 | The step-output template `{{step['<sys_id>'].record_id}}` — what the **Data Pill Picker** writes — **is resolved on the server-side-only path as well as through a browser.** *(Corrected. An earlier revision of this row claimed the opposite and told you to pin fixture ids instead; that claim was wrong and it is what made most of §5 unbuildable — see F15.)* | Chaining native steps with the pill is the **primary** UI route and it does **not** force a browser. Measured on this instance: a three-step test (`Record Insert` → `Record Update` with `Record` bound only to the insert step's pill → `Record Query`) ran with **no `Pick a Browser` modal**, phase label `Executing Server - Independent steps with order 1 - 3`, `user_agents` **empty**, verdict **Success 3/3 in 1 second**, and the update provably hit the exact `sys_id` the insert had just created. Inside a script step, `steps('<step sys_id>').record_id` works on both paths. |
| F8 | `Record Update` with *Assert type* = `Record was not updated` (stored `record_not_updated`) **errors** instead of passing when the impersonated role cannot even *read* the row. | Assert "denied on an unreadable row" with `Record Query` + `No records match the query` (stored `no_records_match_query`), and/or `GlideRecordSecure` `canRead/canWrite/canCreate/canDelete` inside a script step. |
| F9 | A scoped `GlideRecordSecure` **query** on `x_casemgmt_case_task` still returns every row for the agent — scripted read ACLs are applied per record, not folded into the query. (The case table's agent ACL *does* filter the query.) | Assert per-record `canRead()` on the child tables, not row counts. |
| F10 | `Assert JSON Response Payload Element` takes a **slash** path. | `/result/number`, not `result.number`. The scripted REST services wrap their body in a `result` envelope. |
| F11 | `Send REST Request - Inbound` supports only `basic` and `mutual` auth (the *Authentication Type* dropdown offers exactly `-- None --`, `Basic Authentication`, `Mutual Authentication`), and its *Query Parameters* are **static**. | With no auth profile configured it sends **no credentials**, and the platform serves it as `guest` — measured: the response carries `X-Is-Logged-In: false` and the row it creates is owned by `guest`, so this step type *does* exercise an unauthenticated caller. What it cannot do is **vary** its request: it cannot read a number produced earlier in the same test, and it cannot be pointed at a second endpoint. Hence: a `Run Server Side Script` companion using `sn_ws.RESTMessageV2` with no credentials for the remaining anonymous probes, and a **pinned, out-of-sequence fixture number `CASE9000019`** for the valid-lookup test so it stays portable to a freshly imported instance whose counter restarts at `CASE0000001`. |
| F12 | ATF rolls back records created by its own steps, by its script steps **and** by the ATF-instrumented `Send REST Request - Inbound` step — the last even when the test's own cleanup step never runs. It does **not** roll back a row created by an HTTP request a *script* makes into the instance with `sn_ws.RESTMessageV2`: that arrives as `guest`, in its own transaction, and the rollback then *reverses* the test's own delete of it, reinstating the row. | No test may create a row that way. `ATF 18`'s anonymous leg is therefore **non-mutating**, and the test asserts its own cleanliness rather than pointing at a sweep. Measured over two consecutive runs: both green, `subject STARTSWITH ATF-PORTAL` → **0 rows**, and the second run's step 1 reporting `pre-existing submissions removed=0`. |
| F13 | A platform business rule ('Generate Description') overwrites `sys_atf_step.description`. | Put per-step documentation in `notes`. |
| F14 | Deleting a `sys_atf_test` cascades away its `sys_atf_test_suite_test` link. | Re-add the test to the suite after any delete-and-rebuild. |
| **F15** | **The mandatory `Record` field (`record_id`) will not take a typed `sys_id` — ever, and it tells you nothing when it refuses.** Its text input is `readOnly`; the only ways in are the magnifier (*Lookup documents using list*), which opens a **Select the document** dialog resolving the target table's **display value**, and the **Data Pill Picker**. Measured 2×2: a non-existent sys_id is **silently discarded**; a **genuinely existing** sys_id (`287b0a92…d613`, i.e. `CASE0000985`) is **also silently discarded** — no autocomplete, no *"no matches"*, no error, no toast, the dialog closes cleanly and the field is simply blank again. The display value `CASE0000985` resolves and the field then reads **`Case: CASE0000985`**. Root cause: the pill writes a template expression into a `sys_mapping.*` companion input, and a typed literal lands in the `record_id` input, which is **not** the carrier of the binding. | **Never write "type the pinned sys_id" in a recipe.** Address a fixture the way §4 *Addressing a fixture row* sets out. This applies to every native step carrying `Record` — `Record Update`, `Record Delete`, `Record Validation`, `Open an Existing Record`. It does **not** apply to `Conditions` / `Field values`, which are plain typed text and happily take `sys_id` `is` `<32-hex>` (which is exactly what the shipped, API-authored tests do). |
| **F16** | **Step forms hide and reshape inputs, so a field you are told to fill can be genuinely absent.** Measured: `Field values` and `Conditions` render **nothing** until `Table` is set; on `Assert JSON Response Payload Element` the `Value` field is **not rendered at all** while `Operation` sits at its default `is not empty` (the rule generalises — any assert step hides its value field on `is not empty`; `Assert Response Payload`'s `Response body` disappears too if you select it); `Send REST Request - Inbound` renders **no body field until `Method` is changed off `GET`**; and `Headers` / `Query Parameters` are **Name + Value row widgets** (⊕ tooltip `Add Row`, ⊖ `Remove Row`, committing on blur), not text boxes you can paste JSON into. | Fill these forms in the order the platform reveals them — `Table` first, then the condition rows; `Method` before the body; `Operation` before the expected value. Decompose any JSON in this document into one widget row per key. A duplicate header name red-borders both rows and raises a pink banner **whose text is empty** (only a screen-reader-only *"Error Message"*) and does **not** block Submit; a row with an empty name is silently dropped on blur. |

---

## 4. Conventions every scenario follows

- **Resolve by name, never by `sys_id` — but "by name" means two different things.** *Inside a script step* resolve users by `user_name`, groups and roles by `name`, tables by `name`, cases by `number` (`userId('x_casemgmt_demo_viewer')` etc.); the only 32-char hex literal a test may contain is one of **its own fixtures'** `sys_id`s. *In a native step's reference control* you must type the **display value**, because the type-ahead queries the display field and nothing else. Measured: `Impersonate` → `User` typed as `x_casemgmt_demo_viewer` returns **no suggestions and no message at all**; on blur the field turns red with a bare **`Invalid reference`** banner. Typed as **`Demo Viewer`** it returns `Showing 1 through 1 of 1` — `Demo Viewer | demo-viewer@example.invalid` — and the field then reads `Demo Viewer`. Typing `Demo` offers all three demo users; typing `x_casemgmt` offers none of them. The display values you need are therefore:

  | Target | Type this in a native step | Not this |
  | --- | --- | --- |
  | the three demo users (`sys_user`, display field `name`) | `Demo Manager` · `Demo Agent` · `Demo Viewer` | `x_casemgmt_demo_manager` … |
  | the demo group (`sys_user_group`, display field `name`) | `x_casemgmt_demo_team` *(here the two coincide)* | — |
  | a case (`x_casemgmt_case`, display field `number`) | `CASE0000985` → shown back as `Case: CASE0000985` | the row's `sys_id` |

  The step's own generated description records both halves, so you can check you picked the right person: *"Impersonate the user: Demo Viewer with user Id: x_casemgmt_demo_viewer"*. Expect an amber advisory on that step — *"Impersonating an existing user may cause unexpected behavior for this test…"* — and on any `Record Update` against an existing row; both are platform advice, not errors, and the shipped suite impersonates deliberately because the ACL matrix is the thing under test.
- **Synthetic data only, uniquely named.** Every fixture subject starts with `ATF-` (e.g. `ATF-A2-manager-crud`), emails are `@example.invalid`. Never touch the 10 demo cases / 10 tasks / 8 parties.
- **Self-contained and order-independent.** Every test begins by disposing of its own stale residue and ends by re-checking cleanliness. Tests may run in any order, and any single test may be run alone.
- **Addressing a fixture row — read this before building any step that carries `Record`.** A `Record` field cannot be typed (F15), and a row that the test creates **at run time does not exist while you are building the step**, so there is nothing for the *Select the document* dialog to resolve either. Three routes work; pick per step type:

  | # | Route | How | Use it when |
  | --- | --- | --- | --- |
  | **R1** | **Create the fixture with a `Record Insert` step and bind later steps to its output pill** — the primary route | Add the fixture as a `Record Insert` step. On each later step, click the round **Data Pill Picker** beside `Record`; the popover offers one row per earlier step — e.g. `Step 1: Record Insert` (`glide_var`) — with a `›` chevron. Drill in and it offers exactly two outputs: **`Record` (`document_id`)**, selectable, and `Table` (`table_name`), greyed out. Click `Record`. The field becomes the chip **`Step 1: Record Insert➛Record`**. It survives save and reload, and it resolves **server-side** — no browser needed (F7). Only steps that *output* a record offer a pill: `Record Insert` does, `Record Update` does **not**, so always bind to the insert step rather than to an intermediate update. A4 below was built end to end through this route and run green — 8 / 8 steps Success, no `Pick a Browser`, `user_agents` empty | Whenever `Record Insert` can produce the row you need. It can: a direct insert at `status` = `Open`, `Pending`, `Resolved` or `Closed` is accepted, because the transition guards are before-**update** rules. Put the insert **before** the `Impersonate` step so the fixture is created by the test executor, not by the identity under test |
  | **R2** | **Assert with `Record Query` conditions instead of `Record Validation`** | `Conditions` is plain typed text, so `Subject` `is` `ATF-B6-open-fixture` **AND** `Status` `is` `Open` with *Assert type* `There is at least one record matching the query` proves exactly what a `Record Validation` on that row would, and needs no `Record` at all. Use `No records match the query` for the negative | Every "assert the row still says X" / "assert it now says Y" step. Cheaper and more portable than R1 |
  | **R3** | **Do the mutation inside a `Run Server Side Script` step through `GlideRecordSecure`** | A script step has only `Jasmine version` and `Test script` — no `Record` — so it can reach a script-created fixture by pinned `sys_id` or by subject. Use `GlideRecordSecure` (**never** plain `GlideRecord.update()`, which bypasses ACLs entirely) and assert `canRead/canWrite/canCreate/canDelete` plus the stored value | When the fixture must be built by a script (several fixtures, or field combinations `Record Insert` cannot express), and for any write **denial** on a row the identity cannot even read — the native step aborts with `Unable to find record` there rather than observing a denial (F8). This is what shipped `ATF 03` step 8 does |

  **Why the shipped tests look different.** Every shipped `Record`-carrying step holds a literal pinned `sys_id`, and they run green — because they were authored through the Table API, which writes `record_id` directly. That path is closed to the UI. If you want the shipped wiring verbatim, import `atf/*.xml`; if you are building in the UI, use R1–R3.
- **Assert the message, not the mechanism.** Never assert the existence of a `sys_hub_flow` record or any other implementation artifact — enforcement may legitimately be a Business Rule. Assert the observable status change and the exact message.
- **Verbatim strings are character-exact**, trailing period included:

  | Where | String |
  | --- | --- |
  | Task-closure gate | `All tasks must be closed before resolving this case.` |
  | Back-transition | `Cases cannot be returned to Draft.` |
  | Terminal state | `Closed cases are terminal and cannot be modified.` |
  | Lookup miss | `No case found with that number.` |
  | Submit confirmation | `Your case has been submitted` |

- **Reading the step tables below.** *Step type* is the exact `sys_atf_step_config` name to pick in the UI. *Inputs* names each field by **the label as rendered on screen**, with its internal element name in brackets so you can cross-check a serialized record — e.g. *Path* [`end_point`]. Choice inputs are given by their **on-screen label** too, not the stored value: the platform shows `is` where the record stores `equals`, `is not empty` where it stores `exists`, and `Record was not updated` where it stores `record_not_updated`. Every label and default in these tables was read off `atf_input_variable` / `sys_choice` on this instance and then confirmed on screen; the mapping that trips people up most is:

  | Rendered label | Internal element | Where |
  | --- | --- | --- |
  | `Record` | `record_id` | Record Update / Delete / Validation, Open an Existing Record |
  | `Field values` | `field_values` | Record Insert / Update / Validation, Set Field Values — field + value, **no operator column** |
  | `Conditions` | `field_values` | `Record Query` **only** — field + operator + value, with *Add Filter Condition* / *Add OR Clause* |
  | `Test script` | `script` | Run Server Side Script |
  | `Method` · `Path` · `Body` · `Query Parameters` · `Headers` | `http_method` · `end_point` · `request_body` · `query_params` · `headers` | Send REST Request - Inbound |
  | `Element path` · `Operation` · `Value` | `element_name` · `response_operation` · `element_value` | Assert JSON Response Payload Element |
  | `Operation` · `Response body` | `response_operation` · `response_body` | Assert Response Payload |
  | `Operation` · `Status code` | `response_operation` · `status_code` | Assert Status Code |

- **`Enforce security` is not consistently defaulted — set it explicitly on every step that means anything.** Measured on the step forms as first rendered: **ticked** on `Record Insert`, `Record Update`, `Record Delete` and `Record Validation`, **unticked** on `Record Query`. An unticked box on an RBAC or transition step turns the whole assertion into a no-op that still reports green, so every such step below states the value it needs. `Record Query` also renders a `Timeout` / `Seconds` control, arriving at `5`, which the other record step types do not show; the failure timeout it sets appears in the step's generated description ("*With a failure timeout of 5 Seconds*").

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
| 1 | Run Server Side Script | *Jasmine version* [`jasmine_version`] `3.1` — mandatory, but it offers **exactly one** option and arrives already selected, so there is nothing to do; *Test script* [`script`]: clear the ~3,865 characters of comment boilerplate the editor arrives with, then purge stale `ATF-A1-%` rows and insert one case with a pinned id via `gr.setNewGuidValue(...)`. **Do not set `status`** — the point of step 2 is to observe the platform's own default. |
| 2 | Record Query | *Table* [`table`] `x_casemgmt_case`; *Conditions* [`field_values`] `Subject` `is` `ATF-A1-schema` **AND** `Status` `is` `Draft`; *Assert type* [`assert_type`] `There is at least one record matching the query`; *Enforce security* [`enforce_security`] leave **unticked** (this step is about the default value, not about access). Route **R2** — a `Record Validation` here would need the `Record` field, which cannot be pointed at a row the script has not created yet (F15). Watch the operator: a string field defaults to `starts with`, so change `Subject` to `is`; a choice field like `Status` already defaults to `is`. |
| 3 | Run Server Side Script | Walk `GlideRecord('sys_dictionary')` for `x_casemgmt_case` and assert, per field: name, `internal_type`, `max_length`, `mandatory`, `read_only`, and `reference` where applicable — `number`(string/40/read-only), `type`(40), `status`(40/mandatory), `priority`(40), `subject`(255/mandatory), `description`(4000/mandatory), `opened_date`(glide_date_time/read-only), `closed_date`(glide_date_time/read-only), `assigned_group`(reference→`sys_user_group`), `assigned_agent`(reference→`sys_user`), `requester_name`(100/mandatory), `requester_email`(100), `pending_reason`(40). |
| 4 | Run Server Side Script | Same for `x_casemgmt_case_task` (`case`→`x_casemgmt_case` mandatory, `subject` 255 mandatory, `type`, `status`, `assigned_to`→`sys_user` mandatory, `due_date` glide_date mandatory) and `x_casemgmt_case_party` (`case` mandatory, `party_type` mandatory, `person`→`sys_user`, `organization`→`core_company`, `role_label` 100 mandatory). Assert each choice set from `sys_choice`: case `type` = General Inquiry, Complaint; `status` = Draft, Open, In Progress, Pending, Resolved, Closed; `priority` = Low, Medium, High, Critical; `pending_reason` = Awaiting Info, Awaiting Third Party, Other; task `type` = Investigation, Review, Follow-up, Other; task `status` = Open, In Progress, Closed; party `party_type` = Person, Organization. |
| 5 | Run Server Side Script | Assert `sys_number` for `x_casemgmt_case` has `prefix='CASE'` and `maximum_digits=7`, assert the fixture's `number` matches `/^CASE\d{7}$/`, then attempt to overwrite `number` and assert it did not change (read-only). Finally purge the fixture. |

Expected: pass. Aggregate many small checks inside one `expect(...)` per script step so one failure names the field that broke.

#### A2 — Manager has full CRUD (`ATF 02`, 12 steps in this UI recipe, ~30 min)

Identity: `Demo Manager` (`x_casemgmt_demo_manager`). Fixtures: two cases (`ATF-A2-own`, `ATF-A2-foreign`), the second assigned to nobody.

> **Step count.** The shipped `ATF 02` has **10** steps because a script builds both fixtures and the native steps address them by literal `sys_id` — a shape only the API can author (F15). The UI recipe below trades two extra steps for buildability: the fixtures become `Record Insert` steps whose pills the later steps bind to, and each `Record Validation` becomes a `Record Query`. The assertions are the same.

| # | Step type | Inputs / expectation |
| --- | --- | --- |
| 1 | Run Server Side Script | *Test script*: purge stale `ATF-A2-%` rows. Nothing else — the two fixtures are built by steps 2 and 3 so that later steps can address them (route **R1**) |
| 2 | Record Insert | *Table* `x_casemgmt_case`; *Enforce security* **ticked**; *Field values* `Subject`=`ATF-A2-own`, `Description`=`Synthetic ATF fixture record. No PII.`, `Requester Name`=`ATF Synthetic Requester`, `Status`=`Draft`, `Assigned Group`=`x_casemgmt_demo_team`; *Assert type* `Record successfully inserted`. Runs **before** the Impersonate step, so the test executor creates it |
| 3 | Record Insert | same, `Subject`=`ATF-A2-foreign`, assigned to **nobody** (leave `Assigned Group` and `Assigned Agent` empty) |
| 4 | Impersonate | *User* [`user`] type **`Demo Manager`** and pick the suggestion (**not** `x_casemgmt_demo_manager` — see §4) |
| 5 | Record Insert | *Table* `x_casemgmt_case`; *Enforce security* **ticked**; *Field values* `Subject`=`ATF-A2-created`, `Description`=`Synthetic ATF fixture record. No PII.`, `Requester Name`=`ATF Synthetic Requester`, `Status`=`Draft`; *Assert type* `Record successfully inserted` → create ✅ |
| 6 | Record Query | *Table* `x_casemgmt_case`; *Enforce security* **tick it** (unticked by default); *Conditions* `Subject` `is` `ATF-A2-own`; *Assert type* `There is at least one record matching the query` → read of a case they are not the agent on succeeds (read **all**) |
| 7 | Record Query | same for `ATF-A2-foreign` → `There is at least one record matching the query` |
| 8 | Record Update | *Table* `x_casemgmt_case`; *Record* [`record_id`] ← **Data Pill Picker** → `Step 3: Record Insert➛Record`; *Field values* `Priority`=`High`; *Enforce security* **ticked**; *Assert type* `Record successfully updated` → write **all** |
| 9 | Record Query | *Conditions* `Subject` `is` `ATF-A2-foreign` **AND** `Priority` `is` `High`; *Assert type* `There is at least one record matching the query` → the write persisted (route **R2**, in place of a `Record Validation`) |
| 10 | Run Server Side Script | `GlideRecordSecure` on both fixtures: `canCreate/canRead/canWrite/canDelete` all `true` |
| 11 | Record Delete | *Table* `x_casemgmt_case`; *Record* ← pill → `Step 3: Record Insert➛Record`; *Enforce security* **ticked**; *Assert type* `Record successfully deleted` |
| 12 | Run Server Side Script | assert no `ATF-A2-%` rows remain — checking each `deleteRecord()` return value, not just re-querying — and that the 10 demo cases are untouched |

#### A3 — Agent: create, assigned-only read/write, no delete (`ATF 03`, 11 steps, ~35 min)

Identity: `Demo Agent` (`x_casemgmt_demo_agent`). Fixtures — build all four so "assigned only" is proven in both directions:

| Fixture | `assigned_agent` | `assigned_group` | Agent's expected access |
| --- | --- | --- | --- |
| `ATF-A3-by-agent` | the demo agent | *(empty)* | read ✅ write ✅ |
| `ATF-A3-by-group` | *(empty)* | `x_casemgmt_demo_team` (agent is a member) | read ✅ write ✅ |
| `ATF-A3-unassigned` | *(empty)* | *(empty)* | read ❌ write ❌ |
| `ATF-A3-other-group` | *(empty)* | a second group the agent is **not** in | read ❌ write ❌ |

Build the four fixtures as four `Record Insert` steps ahead of the `Impersonate` step (route **R1**), so the two steps that need a `Record` can bind to a pill. Every step from the impersonation onward carries *Enforce security* **ticked** — and remember `Record Query` arrives unticked.

Steps: purge script → 4 × `Record Insert` (the fixtures above) → `Impersonate` `Demo Agent` → `Record Insert` (*Assert type* `Record successfully inserted`, create ✅) → `Record Query` `Subject` `is` `ATF-A3-by-agent` (`There is at least one record matching the query`) → `Record Query` on `ATF-A3-by-group` (same) → `Record Query` on `ATF-A3-unassigned` (**`No records match the query`** — the denial; see F8 for why this is not a `Record Update`) → `Record Update` with *Record* ← pill → the `ATF-A3-by-agent` insert step (`Record successfully updated`) → `Record Query` on `ATF-A3-other-group` (`No records match the query`) → `Record Delete` with *Record* ← the same pill and *Assert type* `Record was not deleted` (delete ❌) → `Run Server Side Script` asserting `GlideRecordSecure` `canDelete()===false` on every fixture and `canWrite()` true only on the two assigned ones → cleanup script that checks each `deleteRecord()` return value.

#### A4 — Viewer is read-only (`ATF 04`, 8 steps, ~40 min)

Identity: `Demo Viewer` (`x_casemgmt_demo_viewer`).
Fixture: **one** case, subject `ATF-RBAC-04 assigned elsewhere`, deliberately assigned to `x_casemgmt_demo_team` **and** to `Demo Agent` — i.e. assigned to *somebody who is not the viewer*. One fixture is enough here and two would prove nothing extra: the viewer's read grant is unconditional, so an assigned row and an unassigned row exercise the same ACL. What matters is that the row the viewer is refused write on is one they can *read*, otherwise the refusal could be a read denial in disguise.

| # | Step type | Inputs |
| --- | --- | --- |
| 1 | Record Insert | *Table* `x_casemgmt_case`; *Enforce security* **ticked**; *Field values* `Subject`=`ATF-RBAC-04 assigned elsewhere`, `Description`=`Synthetic ATF fixture record. No PII.`, `Requester Name`=`ATF Synthetic Requester`, `Requester Email`=`atf-fixture@example.invalid`, `Type`=`General Inquiry`, `Status`=`Draft`, `Priority`=`Medium`, `Assigned Group`=`x_casemgmt_demo_team`, `Assigned Agent`=`Demo Agent`; *Assert type* `Record successfully inserted`. Created before the impersonation, by the test executor |
| 2 | Impersonate | *User* [`user`] type **`Demo Viewer`** and pick the suggestion |
| 3 | Record Query | *Table* `x_casemgmt_case`; **tick *Enforce security*** — it is unticked by default, and unticked here the whole scenario silently measures nothing; *Conditions* `Subject` `is` `ATF-RBAC-04 assigned elsewhere` (the string operator arrives as `starts with` — change it to `is`); leave *Timeout* at its default `5` Seconds; *Assert type* `There is at least one record matching the query` → read ✅ |
| 4 | Record Insert | *Table* `x_casemgmt_case`; *Enforce security* **ticked**; *Assert type* `Record was not inserted`; *Field values* — **supply a complete, valid row**: `Subject`=`ATF-RBAC-04 viewer create attempt`, `Description`=`Synthetic ATF fixture record. No PII.`, `Requester Name`=`ATF Synthetic Requester`, `Requester Email`=`atf-fixture@example.invalid`, `Type`=`General Inquiry`, `Status`=`Draft`, `Priority`=`Medium` — the seven the shipped `ATF 04` uses. **This is not optional, and it is the easiest thing in the scenario to get wrong**: the widget pre-populates a blank row per mandatory column, so a step submitted with nothing meaningful in it looks finished. `Record was not inserted` cannot tell *"the ACL refused this row"* apart from *"this row was never good enough to reach the ACL"*, and a green step that only establishes the second proves nothing about create ❌. Make the payload one that **would** insert for a privileged identity, then attribute the refusal by reading the step output for the platform's own `ACL Exception Insert Failed due to security constraints`. Do not reason "it would have failed validation anyway" in either direction: dictionary `mandatory` is **not** enforced on the server-side insert path — measured, a REST insert of `{}` into `x_casemgmt_case` returns `201` and mints a number — so the only trustworthy attribution is the ACL exception in the output |
| 5 | Record Update | *Table* `x_casemgmt_case`; *Record* [`record_id`] ← **Data Pill Picker** → `Step 1: Record Insert➛Record`; *Field values* `Priority`=`High`; *Enforce security* **ticked**; *Assert type* `Record was not updated` → write ❌ |
| 6 | Record Delete | *Table* `x_casemgmt_case`; *Record* ← the same pill; *Enforce security* **ticked**; *Assert type* `Record was not deleted` → delete ❌ |
| 7 | Run Server Side Script | assert the identity **first** (`gs.getUserName()` is `x_casemgmt_demo_viewer`, `gs.hasRole('x_casemgmt_case_viewer')`) — run as anyone else these denials mean nothing — then `GlideRecordSecure`: `canRead()===true`, `canCreate()===false`, `canWrite()===false`, `canDelete()===false`. For "read **all**", compare the **iterated** visible `sys_id` set against an authoritative plain-`GlideRecord` set: `GlideRecordSecure.getRowCount()` is **not** ACL-filtered, so any `>= N` threshold can pass while the role sees nothing (measured: agent `getRowCount=11` while iterating 9) |
| 8 | Run Server Side Script | delete both `ATF-RBAC-04 %` rows (the fixture, and the create attempt in case it ever succeeds), check each `deleteRecord()` return value rather than assuming, re-query by subject prefix for residue, and assert the demo 10 / 10 / 8 census is unchanged. ATF's own rollback removes rows its steps created, so this step is a belt-and-braces check *and* the thing that fails loudly if the rollback ever does not happen |

Expect steps 4, 5 and 6 to log the platform's own `ACL Exception Insert/Update/Delete Failed due to security constraints` — that string in the step output is what tells you the denial came from the ACL layer rather than from validation.

> This test is the natural place for the Scenario-A negative control: temporarily assert `canWrite()===true` in step 7 and confirm the runner reports `viewer canWrite expected[true] actual[false]` and marks step 8 `Skipped`, then restore.

> **Two ways this scenario can go green while proving nothing**, both of them ordinary mistakes rather than exotic ones: an unticked *Enforce security* (step 3 above — the default is inconsistent, see §4), and an unattributable refusal on step 4. The shipped `ATF 04` avoids both. Check them before you believe a pass, and apply the same two checks to every other RBAC scenario in this section.

#### A5 — Field-level ACLs (`ATF 05`, 9 steps, ~25 min)

Fixture: one case assigned to `x_casemgmt_demo_team` with `assigned_agent` = the demo agent.

| # | Step type | Expectation |
| --- | --- | --- |
| 1 | Record Insert | *Table* `x_casemgmt_case`; *Enforce security* **ticked**; *Field values* `Subject`=`ATF-A5-field-acl`, `Description`=`Synthetic ATF fixture record. No PII.`, `Requester Name`=`ATF Synthetic Requester`, `Status`=`Draft`, `Assigned Group`=`x_casemgmt_demo_team`, `Assigned Agent`=`Demo Agent`; *Assert type* `Record successfully inserted`. Route **R1** — step 3 binds to this step's pill |
| 2 | Impersonate | type **`Demo Manager`** |
| 3 | Record Update | *Record* ← **Data Pill Picker** → `Step 1: Record Insert➛Record`; *Field values* `Assigned Group`=`x_casemgmt_demo_team`; *Enforce security* **ticked**; *Assert type* `Record successfully updated` (the manager may write it) |
| 4 | Run Server Side Script | `GlideRecordSecure`: `gr.assigned_group.canWrite()===true`, `gr.assigned_agent.canWrite()===true` |
| 5 | Impersonate | type **`Demo Agent`** |
| 6 | Run Server Side Script | `assigned_group.canWrite()===false`; `assigned_agent.canWrite()===true` (they are the assigned agent) |
| 7 | Impersonate | type **`Demo Viewer`** |
| 8 | Run Server Side Script | both `canWrite()===false` |
| 9 | Run Server Side Script | cleanup, with each `deleteRecord()` return value checked |

Alternative on a form (needs a browser): **Open an Existing Record** — *Record* ← the step 1 pill again — → **Field State Validation** with *Read only* [`read_only`] = `assigned_group` for the agent identity. Equivalent assertion, higher cost.

#### A6 — Task and party mirror, manager + viewer (`ATF 06`, 21 steps, ~35 min)

Fixtures: one parent case, one task, one party (Person) — subjects `ATF-A6-…`. Build the parent case as a `Record Insert` step first; the task and party inserts can then take their mandatory `Case` reference from that step's pill, and every later `Record Update` / `Record Delete` binds to the task's and the party's own insert steps (route **R1** throughout — this scenario chains cleanly because each row it touches is one an earlier step created).
Manager: insert task, insert party, query both, update both, delete both → all succeed. Viewer: query both succeed; insert/update/delete on both → `Record was not inserted` / `Record was not updated` / `Record was not deleted`. *Enforce security* **ticked** on every one of them, and ticked by hand on each `Record Query`. Close with a script step asserting the demo 10/10/8 counts are unchanged.

#### A7 — Agent assigned-only on task and party (`ATF 07`, 6 steps, ~20 min)

Fixtures: a case assigned to the agent, with one child task and one child party; plus a second case assigned to nobody with its own child task and party.
Steps: fixture setup → Impersonate `Demo Agent` → `Run Server Side Script` asserting `GlideRecordSecure` `canRead()`/`canWrite()` is `true` on the children of the assigned case and `false` on the children of the unassigned case (per-record, per F9) → `Record Query` on the assigned children (`There is at least one record matching the query`) → `Record Query` on the unassigned children (`No records match the query`) → cleanup. Every query step needs *Enforce security* **ticked** by hand. This scenario needs no `Record` field at all: the fixtures can stay in a script step because the assertions are all queries and `GlideRecordSecure` probes (routes **R2** and **R3**).

> **This test was RED for a period, and is now GREEN.** It asserts the AAP §0.5.6 mirror, and it failed because the application's four scripted child-table ACLs dereferenced `current.case` (F4) — `case` being a JavaScript reserved word — so the conditions could not compile and the agent narrowing denied *every* row. **The ACLs were fixed at the root cause** (`current.getElement('case')`), the test needed no edit, and it passes in the final suite run `TES0001015` alongside `ATF 06`. It was also strengthened rather than relaxed on the way — see the `M5` entry in §8 (this document has no §9; that reference was wrong). Kept here as the record of a real defect the suite caught.

---

### Scenario B — State-machine transition matrix

**Contract under test** (AAP §0.5.5): `Draft → Open` requires `assigned_group`. `Open → In Progress` requires `assigned_agent` populated **and** a member of `assigned_group`. `In Progress → Pending` sets `pending_reason` (Awaiting Info / Awaiting Third Party / Other). `Pending → In Progress` clears `pending_reason`. `In Progress → Resolved` requires **all** child `x_casemgmt_case_task` rows `Closed`, else `All tasks must be closed before resolving this case.` `Resolved → Closed` requires the `x_casemgmt_case_manager` role and auto-sets `closed_date`. Any → `Draft` is prohibited: `Cases cannot be returned to Draft.` `Closed → *` is prohibited: `Closed cases are terminal and cannot be modified.`

Build it as **seven server-side tests plus three form-level tests**. The server-side tests are the fast regression net; the form-level tests prove the message reaches the screen.

**The pattern every server-side transition test uses**

This is the pattern to build in the UI. It is not the shape of the shipped tests — those pin `sys_id`s into `Record`, which only the API can do (F15) — and it produces the same assertions without ever typing an identifier into a field that refuses one.

1. `Run Server Side Script` — purge any stale row carrying this test's fixture subject. Nothing else.
2. **`Record Insert`** — the fixture, created **at the *from* status directly**, with exactly the preconditions the row under test needs (and deliberately without the one the transition requires). *Enforce security* **ticked**; *Assert type* `Record successfully inserted`. A direct insert at a non-`Draft` status is accepted — measured on this instance at `Open`, `Pending`, `Resolved` **and** `Closed` — because the transition guards are before-**update** rules, so nothing stops a row being *born* at the *from* status. Where a row needs several fixtures (B6 needs two), add one `Record Insert` per fixture and bind each later step to the right pill. This step must come **before** step 3 so the fixture belongs to the test executor, and it is what every later `Record` binds to (route **R1**).
3. `Impersonate` — type **`Demo Manager`** unless the row is about a role check, and pick the suggestion (§4).
4. `Record Update` — *Record* ← **Data Pill Picker** → `Step 2: Record Insert➛Record`; attempt the transition **without** the precondition; *Enforce security* **ticked**; *Assert type* `Record was not updated`.
5. `Record Query` — *Conditions* `Subject` `is` `<the fixture subject>` **AND** `Status` `is` `<the *from* value>`; *Assert type* `There is at least one record matching the query`; **tick *Enforce security*** (unticked by default). This is the abort-really-aborted check, in the form the UI can express for a run-time fixture (route **R2**).
6. `Record Update` — same pill; satisfy the precondition and repeat; *Assert type* `Record successfully updated`.
7. `Record Query` — *Conditions* `Subject` `is` `<the fixture subject>` **AND** `Status` `is` `<the *to* value>`; `There is at least one record matching the query`.
8. `Run Server Side Script` — call the validator directly and assert `{ok, error}`, including the verbatim message where the row has one: `new x_casemgmt.CaseTransitionValidator().canTransitionToResolved(gr)` etc.
9. `Run Server Side Script` — cleanup (each `deleteRecord()` return value checked) + demo-data census.

> **Two step counts, deliberately.** The counts in the table below are the **shipped** tests'. A UI build of the same row runs one or two steps longer, because each `Record Validation` becomes a `Record Query` and each fixture becomes its own `Record Insert`. The shipped counts are kept because they are what you will see in the suite; §6.1 records the difference. Times are **unmeasured estimates** except where marked **measured** — read §6 before relying on any of them.

| Test | Row(s) covered | Fixture | Key assertions | Est. |
| --- | --- | --- | --- | --- |
| **B1** `ATF 08`, 8 steps | `Draft → Open` | Draft case, no `assigned_group` | blocked without a group; succeeds once `assigned_group=x_casemgmt_demo_team`; `canTransitionToOpen()` `ok:false` then `ok:true` | 20 m |
| **B2** `ATF 09`, 10 steps | `Open → In Progress` | Open case with `assigned_group` set | blocked with no `assigned_agent`; blocked with an agent who is **not** a member of the group; succeeds with the demo agent (a member); `isAgentInGroup()` both ways | 25 m |
| **B3** `ATF 10`, 8 steps | `In Progress → Pending`, `Pending → In Progress` | In Progress case | Pending with `pending_reason=Awaiting Info` succeeds and persists; back to In Progress succeeds and `pending_reason` is **empty** | 20 m |
| **B4** `ATF 11`, 10 steps | task-closure gate | In Progress case + **one `Open` child task** | `Resolved` blocked; status still In Progress; `canTransitionToResolved()` returns exactly `All tasks must be closed before resolving this case.`; close the task; `Resolved` now succeeds; `getOpenTaskCountForCase()` 1 → 0 | 30 m |
| **B5** `ATF 12`, 10 steps | `Resolved → Closed` | Resolved case assigned to the demo agent | as the **agent**: blocked, status still Resolved, `canTransitionToClosed(gr, agentId)` `ok:false`; as the **manager**: succeeds and `closed_date` is non-empty | 30 m |
| **B6** `ATF 13`, 8 steps | any → `Draft` | one Open case and one In Progress case | both blocked; `validateNoBacktransition('Open','Draft').error` === `Cases cannot be returned to Draft.` | **45 m (measured)** |
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
| 1 | Run Server Side Script, **or** `Record Insert` | fixture setup — the case (and for `ATF 15`, its open child task) at the *from* status. In the UI prefer a **`Record Insert`** step for the case, so step 3 can bind its `Record` to that step's pill (route **R1**); `ATF 15`'s child task can be a second `Record Insert` taking its `Case` reference from the first step's pill. If you build the fixture in a script instead, **add a handoff guard:** after inserting, re-read every fixture by `sys_id` with a plain `GlideRecord` and assert it resolves. Step 3 resolves it the same way, through Global-scope `TestExecutorAjax`, so if anything is wrong with the fixture this fails here — precisely and upstream — instead of surfacing later as a misleading "does not have a record with id". Do **not** rely on the fixture's own stale-residue delete having left something behind |
| 2 | Impersonate | *User* type **`Demo Manager`** and pick the suggestion |
| 3 | Open an Existing Record | *Table* [`table`] `x_casemgmt_case`; *Record* [`record_id`] ← **Data Pill Picker** → `Step 1: Record Insert➛Record`. The field cannot be typed (F15), and the fixture does not exist while you are building the step, so the pill is the only route unless you have pre-created a row whose `number` you can type into *Select the document* |
| 4 | Set Field Values | *Table* [`table`] `x_casemgmt_case`; *Field values* [`field_values`] `Status`=`Resolved` (`ATF 16`: `Draft`; `ATF 17`: `In Progress`) — field + value, no operator |
| 5 | Submit a Form | *Assert type* [`assert_type`] `Form submitted to server` — the submit is expected to be **rejected by the server**, and ATF captures the resulting page |
| 6 | Record Validation | *Record* ← the same pill; assert the row's `Status` is unchanged — i.e. the save really was refused. *(Or, if you built the fixture in a script, a `Record Query` on `Subject` + `Status` instead — route **R2**.)* |
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
| 2 | Send REST Request - Inbound | Pick the plain **`Send REST Request - Inbound`** — the picker lists a confusable twin, `Send REST Request - Inbound - REST API Explorer`, above it. Then, **in this order**: *Method* [`http_method`] `POST` — set it first, because the body field does not render while Method is `GET` (F16); *Path* [`end_point`] `/api/x_casemgmt/case_submit`; *Headers* [`headers`] — a **Name + Value row widget**, so **two rows**, not JSON: row 1 `Content-Type` / `application/json`, then click **⊕ `Add Row`** and enter row 2 `Accept` / `application/json`; *Body* [`request_body`] `{"subject":"ATF-PORTAL-18 anonymous submission","type":"General Inquiry","description":"…","requester_name":"ATF Requester","requester_email":"atf.requester@example.invalid"}`. Leave *Authentication Type* at `Basic Authentication` with no profile chosen — that sends no credentials, which is the point (F11) |
| 3 | Assert Status Code | *Operation* [`response_operation`] `is` — already the default, nothing to change (the stored value is `equals`; the dropdown reads `is` / `is not` / `less than` / `greater than` / `less than or is` / `greater than or is`); *Status code* [`status_code`] `201` |
| 4 | Assert JSON Response Payload Element | *Element path* [`element_name`] `/result/number`; *Operation* leave at its default `is not empty` — that *is* the "exists" assertion, and it is why no value field appears on this step |
| 5 | Assert JSON Response Payload Element | *Element path* `/result/message`; *Operation* → change to `is`, **which is what makes the next field appear at all**; *Value* [`element_value`] `Your case has been submitted` |
| 6 | Assert Response Payload | *Operation* `contains` (the default here); *Response body* [`response_body`] `Your case has been submitted` |
| 7 | Assert Response Payload | *Operation* `contains`; *Response body* `CASE` |
| 8 | Record Query | *Table* `x_casemgmt_case`; *Conditions* `Subject` `is` `ATF-PORTAL-18 anonymous submission`; *Assert type* `There is at least one record matching the query` |
| 9 | Run Server Side Script | the genuinely anonymous, **non-mutating** leg. `sn_ws.RESTMessageV2` with no credentials POSTs the body `[]`, which must come back `400 {"result":{"error":"Invalid payload."}}` — the handler's own message, which a `401`/`403` from the authenticator could never produce, and a payload shape `submitCase()` rejects before it touches `GlideRecord`; then a credential-free `GET` of the lookup endpoint for the case step 2 submitted must return `200` with exactly `{status, subject, opened_date}` matching the stored row; finally a census proves neither call persisted anything. Shipped output: `checks=12 failures=0` |
| 10 | Run Server Side Script | delete the case step 2 submitted, assert every delete reported success and that no `ATF-PORTAL-18` row survives. Shipped output: `submissions removed=1` / `deletes reporting failure=0` / `residue rows=0`. No post-run sweep — see F12 |

#### C2 — Valid lookup returns only the whitelist (`ATF 19`, 10 steps, ~25 min)

Fixture: a case pinned to number **`CASE9000019`** (out of the auto-number sequence, so the test is portable — F11), subject `ATF-PORTAL-19 lookup fixture`, with `assigned_group`, `assigned_agent`, `description`, `requester_name`, `requester_email` all populated **precisely so their absence from the response is meaningful**.

Steps 1–2: fixture setup — which first checks, read-only, that no row it does not own occupies the fixture `sys_id` or already carries `CASE9000019`, and **refuses to run**, having changed nothing, if one does — and a pre-check that the fixture really carries the internal fields. This fixture must be built in a script step, not a `Record Insert`: it needs a pinned, out-of-sequence `number`, and `Record Insert` goes through `GlideTemplate`, which will not set a read-only field (F6). Step 3: `Send REST Request - Inbound`, *Method* `GET`, *Path* `/api/x_casemgmt/case_status_lookup`, *Query Parameters* [`query_params`] — again a **row widget**, so one row: Name `number`, Value `CASE9000019`. Step 4: `Assert Status Code`, *Operation* `is` (default), *Status code* `200`. Steps 5–7: `Assert JSON Response Payload Element` with *Element path* `/result/status`, `/result/subject`, `/result/opened_date` and *Operation* left at `is not empty`. Steps 8–9: `Assert Response Payload` with *Operation* **`does not contain`** and *Response body* set to each forbidden key. Step 10: a `Run Server Side Script` that parses the body and asserts the **negative whitelist** exhaustively — the response must not contain `assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email` or `sys_id`, as keys *or* as values (check both the key set and the raw text against each populated fixture value), and that the key set is exactly `{status, subject, opened_date}`. Then clean up.

> The shipped step reports `checks=23 failures=0`. Asserting both keys and values is what makes the whitelist claim real: a key could be renamed and still leak the datum.

#### C3 — Unknown number returns 404 verbatim (`ATF 20`, 6 steps, **21 min measured**)

Fixture: a script step that asserts **no** case with number `CASE9999999` exists (so the 404 is real, not incidental). Then `Send REST Request - Inbound` with *Method* `GET`, *Path* `/api/x_casemgmt/case_status_lookup` and one *Query Parameters* row — Name `number`, Value `CASE9999999` → `Assert Status Code` *Operation* `is` (default), *Status code* `404` → `Assert Response Payload` *Operation* `contains`, *Response body* `No case found with that number.` → `Assert JSON Response Payload Element` *Element path* `/result/error`, *Operation* changed to `is` (which reveals *Value*), *Value* `No case found with that number.` → a closing script step asserting the message is character-exact (compare length and codepoints, not just equality of a trimmed string).

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

## 6. Build-time estimate — and what of it was actually measured

> **Read this before quoting a number.** Three of the twenty scenarios have been built literally in the ATF UI and
> timed. The other seventeen have not. Earlier revisions of this section presented the total below as a saving
> against the original 16-hour estimate; **that comparison was never measured and is withdrawn.** What follows is a
> line-item estimate with the three measurements set beside it, and an extrapolation that points the other way.

**What was measured.** Three scenarios, one per area, built from nothing through the ATF UI and run green:

| Scenario | Line item below | Measured | Factor | Conditions |
| --- | --- | --- | --- | --- |
| **C3** (`ATF 20`) | 20 m | **20 m 44 s** | **1.0×** | on target |
| **B6** (`ATF 13`) | 20 m | **44 m 27 s** | **2.2×** | — |
| **A4** (`ATF 04`) | 20 m | **40 m 20 s** | **2.0×** | — |

All three were built under conditions **materially easier** than the line items describe: the Jasmine script bodies
were lifted ready-made from the shipped tests rather than authored (§6 claims to include ~12 KB of Jasmine per
test), and two of the three were built by someone who already knew about the `Record`-field blocker (F15) and did not
have to discover it. Two of the three still ran at **2×**. A first-time builder should expect C3 ~20–25 m, B6
~25–30 m, and A4 **60–90 m** — the last being unbuildable at all before the F15 correction in this revision, since
nothing on screen tells you why the `Record` field keeps emptying itself.

| Item | Estimate (unmeasured unless noted) |
| --- | --- |
| Harness prep — P1–P6, confirm identities, one throwaway pass/fail probe | 0 h 30 m |
| Scenario A — A1 20 m, A2 30 m, A3 35 m, **A4 40 m (measured)**, A5 25 m, A6 35 m, A7 20 m | 3 h 25 m |
| Scenario B — B1 20 m, B2 25 m, B3 20 m, B4 30 m, B5 30 m, **B6 45 m (measured)**, B7 25 m | 3 h 15 m |
| Scenario B — the three form-level tests, 30 m each (includes driving the client runner) | 1 h 30 m |
| Scenario C — C1 30 m, C2 25 m, **C3 21 m (measured)**, C4 10 m | 1 h 26 m |
| Suite assembly — one `sys_atf_test_suite`, 20 `sys_atf_test_suite_test` links, one full run | 0 h 20 m |
| Negative controls — one per area, invert, run, restore | 0 h 25 m |
| **Line-item total** | **≈ 10 h 51 m** |
| **Same total with the measured 1.5–2.0× factor applied to the seventeen untimed scenarios** | **≈ 15–20 h** |

**So the honest statement is this:** the line items add to roughly 11 hours, and the only three that have been
timed came in at 1.0×, 2.0× and 2.2× of their line item under favourable conditions. Extrapolating even the
optimistic end of that range puts a full UI build **at or above the original 16-hour estimate**, not well under it.
No claim of a saving is made. What *is* true, and is the point, is that **none of this cost has to be paid**: the
suite is shipped, running and folded into the package, so the D3.3 fallback condition never fired (see the head of
this document). This plan is decomposed so it can be delivered incrementally if it ever is needed — Scenario A alone
covers the RBAC matrix end to end — and rebuilding what the suite already contains is a package import, measured in
minutes.

### 6.1 Where the shipped suite deviates from the recipe above

The recipe is what a human would build from nothing; the shipped tests were then strengthened past it in specific
places. Each difference is listed here rather than left for a reader to discover by diffing.

| Test | Recipe says | Shipped test does | Why |
| --- | --- | --- | --- |
| **Every test with a `Record`-carrying step** — `ATF 01`–`ATF 06`, `ATF 08`–`ATF 17` | Build the fixture as a **`Record Insert`** step and bind each later `Record` to its **output pill**, or replace the step with a `Record Query` / `GlideRecordSecure` equivalent (§4 routes R1–R3). Consequently a UI build runs **1–2 steps longer** per test than the shipped count | Carries a **literal pinned `sys_id`** in `record_id` (26 `Record Update`, 19 `Record Validation`, 7 `Record Delete`, 3 `Open an Existing Record` steps), and pins its fixtures in a script step with `gr.setNewGuidValue()` | These tests were authored through the Table API, which writes `record_id` directly. **The UI cannot produce that shape at all**: the `Record` control is read-only and silently discards a typed `sys_id`, even an existing one (F15). Neither form is more correct — they are different authoring paths to the same assertions. Import `atf/*.xml` if you want the shipped wiring verbatim |
| `ATF 01` | Assert the §0.5.7 schema field by field | Additionally asserts **exact field-set equality** per table — it enumerates every non-`sys_*` element and compares it as a *set* against the AAP list (case 14, `case_task` 7, `case_party` 6), so an **extra** column fails the test as loudly as a missing one. Its fixture also **omits `status`** so the platform's own default is what gets asserted, rather than the test pre-setting `Draft` and then confirming its own input | Field-by-field assertions cannot detect an undeclared extra column, and a fixture that sets the value it later checks proves nothing about the default |
| `ATF 02`, `ATF 04` | Assert the role can read all cases | Compares **iterated visible sys_id sets** — `GlideRecordSecure` iteration against an authoritative plain-`GlideRecord` set — and asserts the assigned *and* unassigned fixtures are both present | `GlideRecordSecure.getRowCount()` is **not** ACL-filtered (measured: agent `getRowCount=11` while iterating 9), so any `>= N` threshold can pass while the role sees nothing. See register §9.6a P2 |
| `ATF 03` | Step 8 is a `Record Update` with *Assert type* `Record was not updated` | Step 8 is a **`Run Server Side Script`** that attempts the write through `GlideRecordSecure` and asserts the secured API cannot reach the row, `canWrite()` is false, and the stored value is unchanged | ATF's `Record Update` step must **locate** the row before it can attempt a write, and the assigned-only read ACL already hides it — so the native step aborts with `Unable to find record` instead of observing a denial. This was a real suite failure (`TES0001013`) before it was rebuilt. Note also that plain `GlideRecord.update()` **bypasses ACLs** and must never be the vehicle here. See register §9.6a P1 and P4 |
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
6. Set `sn_atf.runner.enabled=true`, register a client runner (P4), and run the suite. **What to expect depends on the install state, and the two are not interchangeable.** *After `../scripts/post_import_remediation.js` has created the 24 `sys_choice` rows:* **20 Success / 0 Failure / 0 Error / 0 Skipped, with 180 of 180 step results Success** — the post-remediation verdict measured as `TES0001015` and reproduced as `TES0001016` / `TES0001017`. *From the package alone, straight after a bare commit:* **20 tests, 14 Success / 6 Failure / 0 Error / 0 Skipped, with 180 of 180 steps executed** — the current measured verdict `TES0001002` (2026-09-02), the six failures being `ATF 01`, `ATF 10`, `ATF 15`, `ATF 16`, `ATF 17` and `ATF 18` on the absent choice rows. Earlier partial results (19/1 for `ATF 03` or `ATF 07`, and 16/4 for `ATF 07` plus `ATF 15`-`17`) all trace to defects since fixed at their root cause; if you see one of them, something in P1a-P1c is incomplete rather than the suite being wrong.
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
