# Update Set Consolidation — Final Report

## What this task is

Four Update Set XML packages exist under `servicenow-case-management-poc/update-set/`. None of the
three that are in scope for consolidation is both functionally complete *and* proven to import
cleanly. This task produces exactly **one** package at the canonical path
`update-set/x_casemgmt_case_management_update_set.xml` that is both, by rebuilding the application
on a genuinely empty instance, re-applying the two post-rebuild fixes, exporting the result, and
gating that exact export through a real preview and commit.

## The single-PDI constraint, and what verification therefore means

Only **one** ServiceNow Personal Developer Instance is available for this work — the instance
identified by the `SERVICENOW_INSTANCE_ADMIN_URL` environment secret. Every step runs against that
same instance. There is no second instance against which a genuine first-time import could be
observed.

**Verification in this task is therefore a same-instance reset-and-reimport, not an independent
second instance.** The instance is torn down to a proven zero-state immediately before the
candidate bytes are imported, with no intervening patch — the closest achievable proxy for a clean
first-time install. Readers must know the residual risk this leaves: anything the platform holds
outside the artifacts a teardown removes — instance-level caches, indexes, retained update
history, or metadata a scope deletion does not reach — is not fully eliminated by a reset, and a
result obtained this way cannot claim everything a truly independent instance would prove.
Provisioning or requesting a second PDI is out of scope for this task.

The `…FALLBACK.xml` package is out of scope entirely and is not read, referenced, modified,
archived, deleted, or counted anywhere in this task or this report.

---

## Step 1-2 — Zero-state reset and rebuilt baseline

Owner: unit U1. Executed 2026-09-08, 17:55Z–18:27Z. Every figure below was measured fresh against
the live instance during that window; no number is carried over from a prior report.

### 1. Preflight

| Check | Command | Result |
|---|---|---|
| Hibernation (by **body content**, never status code) | `GET /api/now/table/sys_remote_update_set?sysparm_limit=1` | **JSON body** ⇒ instance LIVE. HTTP 200 |
| Credentials | same call | HTTP 200, no 401/403 ⇒ valid |
| Not mid-upgrade | `sys_upgrade_history?sysparm_query=upgrade_finishedISEMPTY` | `{"result":[]}` |
| Not mid-upgrade (valid predicate) | `…?sysparm_query=upgrade_startedISNOTEMPTY^upgrade_finishedISEMPTY` | `{"result":[]}` |

Zero hibernation events occurred for the entire checkpoint. Read-only heartbeats
(`GET /api/now/table/sys_user?sysparm_limit=1`) at 17:55:45Z, 18:00:37Z, 18:08:16Z, 18:10:01Z,
18:12:31Z, 18:14:43Z, 18:16:17Z, 18:20:20Z, 18:20:57Z, 18:22:00Z, 18:25:41Z, 18:27:40Z — all
HTTP 200 with JSON bodies.

### 2. Pre-teardown census (evidence before destruction)

| Class | Measured before teardown |
|---|---|
| `sys_scope?scope=x_casemgmt` | **1 record** — `82b99028936f74320d74d6f88357a5af`, name `x_casemgmt Case Management`, version `1.0.0` |
| Three table endpoints | all **HTTP 200**; rows **10 / 10 / 8** (case / case_task / case_party) |
| `sys_user_role` (three scoped roles) | **3** — manager `73710b052f274ece1d578c00f4424423`, agent `f7c449d22a2944c6e33eddb62ca4d241`, viewer `e3cd650e33c6bfc335732e94683beca1` |
| `sys_choice` | **24** across 7 lists (case.type 2, case.status 6, case.priority 4, case.pending_reason 3, case_task.type 4, case_task.status 3, case_party.party_type 2) |
| `sys_number` | **3** (categories = the three tables; prefixes CASE / TASK / PARTY, 7 digits) |
| `sys_security_acl` | **29** |
| `sys_security_acl_role` | **36** — manager 17 / agent 13 / viewer 6 |
| `sys_user_has_role` (three roles) | **3** grants |
| Schema | `sys_db_object` 3; `sys_dictionary` 21/14/13; `sys_documentation` 21/14/13 |
| Application artifacts | flows 7, business rules 12, script includes 2, UI actions 6, UI policies 3, client scripts 3, reports 8, dashboards 2, portal 1 + 2 pages + 3 widgets, scripted REST 2, ATF 20 tests / 1 suite / 180 steps |
| Demo seed | 3 `sys_user` (`x_casemgmt_demo_manager` / `_agent` / `_viewer`, all `@example.invalid`), 1 `sys_user_group` (`x_casemgmt_demo_team`), 0 `core_company` name-matching |
| Local update capture | `sys_update_xml` local rows naming x_casemgmt **415** across 14 sets; `sys_update_version` naming x_casemgmt **439** (111 in state `current`); `sys_metadata_delete` naming x_casemgmt 11,251 |

Two query traps were hit and corrected while taking this census. **An invalid field in
`sysparm_query` is silently ignored and the query returns the unfiltered table total.**
On `sys_security_acl_role` the role field is `sys_user_role`, not `role` — `role=…` returned the
table total 40,626 before correction. And `sys_number?prefixINCASE,TASK,PARTY` returns **4** rows,
the fourth being the out-of-box **global** `task` counter (`sys_id` `4`, scope `global`), which is
not part of this application and was deliberately preserved.

### 3. The teardown guard (directive line 34), applied fresh

The guard was applied **twice** — once on entry and again immediately before the destructive call,
with nothing deleted in between.

```
GET $URL/api/now/table/sys_scope?sysparm_query=scope%3Dx_casemgmt
{"result":[{"sys_id":"82b99028936f74320d74d6f88357a5af","scope":"x_casemgmt",
            "name":"x_casemgmt Case Management","version":"1.0.0"}]}
```

* Assertion 1 — the query returned **exactly one** record: `count=1` ✔
* Assertion 2 — the scope `sys_id` is a well-formed 32-character hexadecimal value:
  `82b99028936f74320d74d6f88357a5af`, `len=32`, matches `^[0-9a-f]{32}$` ✔
* Verdict: **PROCEED**. Had the query returned zero records, an empty result, or a malformed
  `sys_id`, nothing would have been deleted.

This guard is re-verified fresh at every teardown in this task. A prior successful teardown does
not make the next one safe by default.

### 4. Teardown

```
POST /xmlhttp.do
  sysparm_processor=com.snc.apps.AppsAjaxProcessor
  sysparm_function=deleteApplication
  sysparm_sys_id=82b99028936f74320d74d6f88357a5af
  sysparm_delete_all=true
→ HTTP 200, answer="b804978093db0b1009aa70d19dba1089"   (a sys_progress_worker)
```

A first attempt returned `HTTP 401 <xml error="invalid token"/>`. That is a CSRF-token failure, not
a credential failure — the REST session stayed at HTTP 200 throughout. The cause is that
`/sys_scope.do` does not expose a scrapable `sysparm_ck` input, while `/sys.scripts.do` and
`/upload.do` do; re-scraping from a page that exposes it resolved the call.

The worker progressed `Dropping table x_casemgmt_case` → `…_case_task` → `Deleting Submit a Form`
→ `Deleting Run Server Side Script` → `Deleting x_casemgmt_case_resolve`, then finished
`state=complete` with **`state_code=error`**:

> Failed to completely delete application 'x_casemgmt Case Management'. Review and manually delete
> any files that remain prior to deleting the application again.

That partial verdict is the reason this step does not end at the teardown call. It had already
removed the scope, all three tables, every dictionary and documentation row, all 24 `sys_choice`
rows, all 3 `sys_number` counters, the 3 roles, 29 ACLs, 36 role links, and every flow, report,
dashboard, portal and ATF record. What remained was removed explicitly below.

### 5. Explicit residue removal

**Retrieved Update Sets — 10 removed, each recorded before deletion.** The FALLBACK package
candidate was excluded structurally (`addQuery('sys_id','!=',…)`), not by convention.

| `sys_id` | name | state | children | error / warning problems | action |
|---|---|---|---|---|---|
| `9929f50df18ccec91ea13b2a3bccfc90` | x_casemgmt_case_management v1.0.0 | committed | 926 | 13 / 0 | **EXCLUDED — FALLBACK candidate, not touched, not counted** |
| `b4861cf7bbe24b36926fcaff4583b5bf` | …v1.0.0 (native rebuild import) | loaded | 0 | 0 / 0 | deleted |
| `7af37c12930f435009aa70d19dba105a` | …v1.0.0 (native rebuild) | previewed | 988 | 3 / 0 | deleted |
| `23467496930f435009aa70d19dba1013` | …v1.0.0 (native rebuild) | previewed | 988 | 0 / 0 | deleted |
| `0b3b7452934f435009aa70d19dba100d` | …v1.0.0 (native rebuild) | committed | 988 | 0 / 0 | deleted |
| `cafe0903150000000000000000000001` | x_casemgmt QA-FIX shape matrix probe | committed | 6 | 6 / 0 | deleted |
| `cafe0903170000000000000000000003` | x_casemgmt QA-FIX native choice composite probe | committed | 1 | 0 / 0 | deleted |
| `cafe0903180000000000000000000004` | x_casemgmt QA-FIX scoped case choice composite probe | committed | 1 | 0 / 0 | deleted |
| `cafe0903190000000000000000000005` | x_casemgmt QA-FIX seven native choice composites | committed | 7 | 0 / 0 | deleted |
| `cafe0903160000000000000000000002` | x_casemgmt QA-FIX scope matrix probe | committed | 4 | 3 / 0 | deleted |
| `4a3338771c4045e08d557ac4da77d15f` | **x_casemgmt_case_management v1.0.0 SETUP-GATE-PROBE** | previewed | 926 | **28 / 0** | **deleted** |

The `…SETUP-GATE-PROBE` record was previously designated retained evidence. It was **removed** here
under the directive's line 36-45 mandate that the instance hold no trace of any prior attempt's
update sets, rather than retained: its `sys_id`, name, state, child count and 28 error problems are
preserved in the row above, recorded before deletion, because the report — not the instance — is
the durable artifact.

**Local Update Sets — 13 removed**, found by name *and* by `application=82b99028…` (the second
predicate is what catches the four that do not name the scope):

`066c23c6…` (926 children) · `0fdd70ee…` (1) · `1109981a…` (988) · `59a5a306…` (926) ·
`85e6b062…` (4) · `9402fca6…` (6) · `d1f9052a…` (7) · `dfadf8d6…` (988) · `ede14de6…` (1) ·
`0e1f9c5f…` “QA5 SCRATCH PROBE (DO NOT SHIP)” (22) · `25d86c1a…` “REFINE ABSORBER deletions (DO NOT
SHIP)” (533) · `4999985a…` “REFINE SCRATCH native-creation probe (DO NOT SHIP)” (6) ·
`934aabce…` the x_casemgmt scope's own **“Default”** set (65).

The **global** `Default [Global]` set record `11226d84a56503108bb220b7a4d212b2` was excluded
structurally and survives; only its **9** x_casemgmt-named children were removed.

**Other residue removed:** 2 `sys_user_grmember`, 1 `sys_user_group`, 3 `sys_user`, 5
`sys_hub_flow_snapshot`, 1 `sys_hub_action_type_snapshot` (“Case Transition Guard”), 543
`sys_metadata_delete` rows orphaned in the deleted scope, and 530 `sys_update_version` rows naming
x_casemgmt (419 `previous`, **111 `current`**). No orphaned application menus existed
(`sys_app_application` and `sys_ui_application` name-matching both 0) and no auto-generated
`<table>_user` role remained (`sys_user_role?nameLIKEx_casemgmt` = 0).

**Why the update-version purge matters.** A `deleteApplication` teardown records its own deletions
as local update rows, and a local DELETE reads as *newer* than an incoming package's INSERT. That is
the documented cause of the 296–298 `Found a local update that is newer than this one` problems seen
on an earlier clean-slate preview in this project. Removing those rows is part of completing the
teardown, not a fix applied to a failing preview.

### 6. Zero-state re-verification — all ten checks, PASS = 10 / FAIL = 0

Run 2026-09-08T18:09:31Z. Raw response shown for each.

| # | Check | Raw result | Verdict |
|---|---|---|---|
| 1 | `sys_scope?sysparm_query=scope=x_casemgmt` | `{"result":[]}` | **PASS** |
| 2 | `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` | **HTTP 400** `{"error":{"message":"Invalid table x_casemgmt_case",…},"status":"failure"}` | **PASS** |
| 3 | `GET /api/now/table/x_casemgmt_case_task?sysparm_limit=1` | **HTTP 400** `"Invalid table x_casemgmt_case_task"` | **PASS** |
| 4 | `GET /api/now/table/x_casemgmt_case_party?sysparm_limit=1` | **HTTP 400** `"Invalid table x_casemgmt_case_party"` | **PASS** |
| 5 | `sys_user_role?sysparm_query=nameINx_casemgmt_case_manager,x_casemgmt_case_agent,x_casemgmt_case_viewer` | `{"result":[]}`; `nameLIKEx_casemgmt` = 0 | **PASS** |
| 6 | `sys_choice` queried **directly**: `nameIN` the three tables | `{"result":[]}`; `nameSTARTSWITHx_casemgmt` `{"result":[]}`; `nameLIKEx_casemgmt` = 0 | **PASS** |
| 7 | `sys_number?sysparm_query=categoryIN` the three tables | `{"result":[]}`; cross-check `prefixINCASE,TASK,PARTY` returns only the global `task` counter (`sys_id` `4`, scope `global`) | **PASS** |
| 8 | `sys_remote_update_set?sysparm_query=nameLIKEx_casemgmt` | 1 record, and it is the excluded FALLBACK candidate `9929f50df18ccec91ea13b2a3bccfc90` ⇒ effective residue **0** | **PASS** |
| 9 | `sys_update_set?sysparm_query=nameLIKEx_casemgmt` | `{"result":[]}`; cross-check `application=82b99028…` `{"result":[]}` | **PASS** |
| 10 | `sys_security_acl_role` (by `sys_user_role`) 0 · by `sys_scope` 0 · `sys_user_has_role` 0 · `sys_security_acl` 0 · `sys_dictionary` 0 · `sys_documentation` 0 · `sys_db_object` 0 · `sys_metadata` in scope 0 · `sys_update_version` x_casemgmt 0 | sum **0** | **PASS** |

A table that has been dropped answers **HTTP 400 "Invalid table"**. HTTP 403 would mean the table
still exists and cross-scope read was refused, and would **not** be a pass.

### 7. Collateral: nothing outside `x_casemgmt` was changed

Global table totals before → after, against the delta predicted from the census:

`sys_user` 638→635 (−3) · `sys_user_group` 52→51 (−1) · **`core_company` 179→179 (0)** ·
`sys_user_role` 620→617 (−3) · `sys_security_acl` 43742→43713 (−29) · `sys_security_acl_role`
40626→40590 (−36) · `sys_db_object` 6293→6290 (−3) · `sys_number` 148→145 (−3) · `sys_choice`
18985→18961 (−24) · `sys_hub_flow` 349→342 (−7) · `sys_script` 5676→5664 (−12) · `sys_report`
656→648 (−8) · `pa_dashboards` 5→3 (−2) · `sp_portal` 10→9 (−1) · `sp_page` 121→119 (−2) ·
`sp_widget` 296→293 (−3) · `sys_ws_definition` 245→243 (−2) · `sys_atf_test` 206→186 (−20) ·
`sys_atf_step` 2345→2165 (−180) · `sys_update_set` 16→3 (−13) · `sys_remote_update_set` 11→1 (−10).
All twenty-one match exactly.

Two deltas exceeded the estimate and both are bounded and explained:

* **`sys_dictionary` −110 against an estimated −48.** The extra rows are variable-store columns on
  the platform's `var__m_*` tables owned by the application's 20 ATF tests and 7 flows (the instance
  holds 25,013 such dictionary rows in total). Verified afterwards: dictionary counts for stock
  tables are intact and sane (`sys_user` 67, `sys_user_group` 20, `core_company` 45, `task` 71,
  `incident` 26, `sys_user_role` 12, `sys_security_acl` 16, `sys_number` 6), and
  `sys_dictionary?nameCONTAINSx_casemgmt` and `?referenceCONTAINSx_casemgmt` are both 0.
* **`sys_user_has_role` −6 against an estimated −3.** Three were the scoped-role grants; three were
  the demo users' other grants, cascaded when those three users were deleted. Only three `sys_user`
  rows were deleted and all three were `x_casemgmt_demo_*`.

`sys_audit_delete` for the teardown window holds 504 rows naming only this application's own
footprint — its `var__m_atf_*` / `var__m_sys_hub_*` / `var__m_sys_flow_*` variable stores,
`pa_dashboards` 2 + `pa_tabs` 2 + permissions 3 + m2m 2, the `sp_*` chain (portal 1, page 2, widget
3, container 2, column 2, row 2, instance 2), `sys_report` 8, `sys_security_acl_role` 36,
`sys_user` 3, `sys_user_grmember` 2, `sys_user_group` 1, `sys_user_has_role` 3, `sys_user_role` 3,
`oauth_entity` 1. Nothing global appears. Every stock endpoint tested (`sys_user`,
`sys_user_group`, `core_company`, `incident`, `task`, `sys_user_role`) still answers HTTP 200.

### 8. The FALLBACK package was never touched

`…FALLBACK.xml` was not opened, read, checksummed, archived, deleted, or counted at any point.

No update-set record on the instance is textually identifiable as the FALLBACK package's own:
`nameLIKEFALLBACK` and `descriptionLIKEFALLBACK` return **0** on both `sys_remote_update_set` and
`sys_update_set`. The candidate was therefore identified without opening the file: the canonical
package (`sha256 7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`) pins descriptor
`sys_id` `9929f50df18ccec91ea13b2a3bccfc90`, which occurs 927 times in it (1 descriptor plus 926
child `remote_update_set` attributes), and this project's own records describe `…FALLBACK.xml` as
the retained elected base `7292a6fe…` — the same bytes as the canonical path. A record loaded from
either is the same row. Because it cannot be distinguished, it is **treated as the FALLBACK
package's own record and excluded**: not deleted, and not counted in any total above.

Verified after all work: that record is still `state=committed` with **`sys_mod_count=0`** and still
**926** children — bit-for-bit as found.

### 9. The baseline package

| Property | Value |
|---|---|
| File | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` |
| **sha256** | **`e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`** |
| Size | 4,062,067 bytes |
| **`<sys_update_xml` payload blocks** | **988** |
| Descriptor `sys_id` | `0b3b7452934f435009aa70d19dba100d` |
| Descriptor name | `x_casemgmt_case_management v1.0.0 (native rebuild)` |

The checksum was re-verified at the moment of upload. The file was uploaded literally and was not
modified, spliced, or merged.

### 10. Upload, load, preview, commit

**Descriptor-collision precondition proved clear first.** Uploading a package whose descriptor
`sys_id` already exists reopens that record and appends duplicate children.
`sys_remote_update_set?sysparm_query=sys_id=0b3b7452934f435009aa70d19dba100d` returned
`{"result":[]}`, and `nameLIKEx_casemgmt` returned only the excluded FALLBACK candidate.

**Upload.** `GET /upload.do?sysparm_target=sys_remote_update_set` (fresh 72-character
`sysparm_ck`) → `POST /sys_upload.do` multipart with `sysparm_target=sys_remote_update_set` and
`attachFile=@<file>` → **HTTP 200** (empty body, as expected; this endpoint returns no `sys_id`).
The Table API POST of an XML body is not usable for this and was not attempted.

**Load.** The record was located **by descriptor `sys_id`**, not by a name-ordered locator:
`state=loaded`, name `x_casemgmt_case_management v1.0.0 (native rebuild)`.

**Child count: `sys_update_xml?sysparm_query=remote_update_set=0b3b7452934f435009aa70d19dba100d`
= 988, exactly.** No duplicate append.

**Local capture purged by the package's own child names.** All 988 distinct child `<name>` values
were read from the loaded set and used as the authority for what to purge: **3,211
`sys_update_version` rows were removed, 888 of them in state `current`**, plus 1 residual local
`sys_update_xml`. Verified afterwards: zero version rows and zero local update-xml rows remain under
any of those 988 names, and the retrieved set still holds 988 children.

This step is what makes the preview clean, and a name-pattern purge alone could not have done it:
the 888 colliding rows carry names with no scope token in them — `sys_atf_step_<sys_id>`,
`sp_widget_<sys_id>`, `pa_dashboards_<sys_id>`, `sp_container_<sys_id>`, `sp_instance_<sys_id>`,
`sp_portal_<sys_id>` — so only the package's own child names could locate them.

**Preview.** `POST /xmlhttp.do` with `sysparm_processor=UpdateSetPreviewAjax`,
`sysparm_ajax_processor_function=preview` → HTTP 200, `answer="5f0793c0931f0b1009aa70d19dba103c"`.
State `previewing` (18:15:55Z) → **`previewed`** (18:16:16Z).

**The preview gate — both types at zero.** A `type=warning` row is a gate failure here exactly as
an error is; the check is a row count filtered by `remote_update_set` and `type`, and setting a
problem's `status` does not reduce it and was not done.

```
GET sys_update_preview_problem?sysparm_query=remote_update_set=0b3b7452…^type=error    → {"result":[]}
GET sys_update_preview_problem?sysparm_query=remote_update_set=0b3b7452…^type=warning  → {"result":[]}
GET sys_update_preview_problem?sysparm_query=remote_update_set=0b3b7452…  (unfiltered) → {"result":[]}
```

**error = 0, warning = 0, total = 0.** The historical
`Found a local update that is newer than this one` class was eliminated entirely.

**Commit — native UI action, clicked once.** A real browser session (headless Chrome 151 driven
over the DevTools Protocol) logged in at `/login.do`; identity confirmed on the classic page as
`g_user: admin | System Administrator`. Navigated to
`/sys_remote_update_set.do?sys_id=0b3b7452934f435009aa70d19dba100d`, confirmed the form's `state`
field read `previewed`, then clicked the platform's own **“Commit Update Set”** UI action (button id
`c38b2cab0a0a0b5000470398d9e60c36`, `onclick=commitRemoteUpdateSet(this)`). No JavaScript dialog
fired and nothing was clicked through. Screenshots:
`blitzy/screenshots/u1-baseline-precommit-previewed.png` and
`blitzy/screenshots/u1-baseline-commit-result.png`.

| Field | Value |
|---|---|
| `state` | **committed** |
| **`commit_date`** | **2026-09-08 18:19:02** |
| `inserted` / `updated` / `deleted` / `collisions` | 986 / 2 / 0 / 0 (986 + 2 = 988) |
| Commit progress workers created | exactly **one** (`34c71744931f0b1009aa70d19dba10ca`, 18:19:01) |

One commit, with no second commit, no remediation script, and no live-instance patching.

### 11. The commit reported a partial failure — what actually did not land

`state=committed` is not by itself proof that every update applied. The commit result screen carries
a modal, and the progress worker carries `state_code=error`, both reading:

> Update Set Commit — Failed at 100%. The update set commit completed but some updates failed to
> commit due to errors. Review the Commit log for details.

The referenced commit log yields nothing usable on this release: `sys_update_log` is empty and has no
`update_set` column, and `sys_update_set_log` holds no rows for a *remote* update set. So the outcome
was verified directly instead — every payload in the committed set was parsed for its target table
and `sys_id` and tested for existence on the instance.

**Across all 988 children: 1,354 record blocks, 1,347 landed, exactly 7 did not.**

Landed at 100%: `sys_choice` 24/24, `sys_choice_set` 7/7, `sys_db_object` 3/3, `sys_dictionary` and
`sys_documentation` (88/88 labels), `sys_number` 3/3, `sys_security_acl` 26/26,
`sys_security_acl_role` 27/27, `sys_atf_test` 20/20, `sys_atf_test_suite` 1/1,
`sys_atf_test_suite_test` 20/20, `sys_atf_step` 180/180, every `sys_hub_*` flow class,
`sys_report` 8/8, `pa_dashboards` 2/2, `pa_tabs` 2/2, the whole `sp_*` portal chain,
`sys_script` 7/7, `sys_script_include` 2/2, `sys_ui_action` 6/6, `sys_ui_list` 1/1,
`sys_ui_policy` 2/2, `sys_user` 3/3, `sys_user_group` 1/1, `sys_user_grmember` 1/1,
`core_company` 2/2.

The seven that did not land:

| # | Table | `sys_id` | Target | Platform's stated reason |
|---|---|---|---|---|
| 1 | `sys_user_has_role` | `40e920da938b435009aa70d19dba1089` | Demo Manager → `x_casemgmt_case_manager` | `syslog` level 2: `Skipping record for table sys_user_has_role and id 40e920da938b435009aa70d19dba1089 - permission denied` |
| 2 | `sys_user_has_role` | `c0e920da938b435009aa70d19dba1090` | Demo Viewer → `x_casemgmt_case_viewer` | same message for this `sys_id` |
| 3 | `sys_user_has_role` | `cce920da938b435009aa70d19dba1081` | Demo Agent → `x_casemgmt_case_agent` | same message for this `sys_id` |
| 4–7 | `sys_element_mapping` | `cf3b876593ea0710830ef82bdd03d639`, `073b876593ea0710830ef82bdd03d63a`, `d78ccfe593ea0710830ef82bdd03d6eb`, `1f8ccfe593ea0710830ef82bdd03d6eb` | all nested in one payload, `sys_hub_action_type_definition_5168476d93aa0710830ef82bdd03d607`, target `case_transition_guard` | none — no platform message names them |

The three role grants were refused by the commit engine writing to the global
`sys_user_has_role` table. This is not residue — zero-state was proven and those rows stood at 0
before the import — and it is not a preview problem, so it is not something the Step 1-2 gate
measures. Both the three demo users and the three roles exist on the instance, so the grants are
recreatable; that work is Step 4's (“verifying, and recreating via native UI action if needed, the
27 role links and 3 role grants”). The four `sys_element_mapping` rows are children of the custom
flow Action “Case Transition Guard”, whose own definition, snapshot, 4 inputs and 8 outputs all
landed — so the Action is present with 12 of its 16 element mappings.

Neither was patched here. Re-committing is forbidden (a clean commit is a single commit), and
editing the package's bytes is out of scope.

### 12. Post-commit census

| Class | Post-commit |
|---|---|
| Three table endpoints | **HTTP 200** each; rows **10 / 10 / 8** |
| **`sys_scope?scope=x_casemgmt`** | **1 record, `sys_id` `82b99028936f74320d74d6f88357a5af`** |
| `sys_dictionary` / `sys_documentation` | 21/21, 14/14, 13/13 · `sys_db_object` 3 |
| `sys_user_role` | **3** — manager `73710b052f274ece1d578c00f4424423`, agent `f7c449d22a2944c6e33eddb62ca4d241`, viewer `e3cd650e33c6bfc335732e94683beca1` |
| `sys_security_acl` | **26** |
| **`sys_security_acl_role`** | **27** — per role **manager 14 / agent 10 / viewer 3**; per ACL target `x_casemgmt_case` 8, `x_casemgmt_case_task` 8, `x_casemgmt_case_party` 8, `case.assigned_agent` 2, `case.assigned_group` 1 |
| `sys_user_has_role` (three roles) | **0** — see §11 |
| **`sys_choice`** | **24** across **7** lists (case.type 2, case.status 6, case.priority 4, case.pending_reason 3, case_task.type 4, case_task.status 3, case_party.party_type 2) · `sys_choice_set` 7 |
| `sys_number` | **3** |
| Row counts | case 10, case_task 10, case_party 8 |
| Flows | **7, every one `active=true` and `status=published`** — General Inquiry State Machine, Complaint State Machine, and the 5 validate-transition subflows |
| ATF | **20** tests, **1** suite (`8e8c6de584ba8f081439ad5ee09ad1a1`, “x_casemgmt Case Management POC”), **180** steps |
| Other | reports 8, dashboards 2, portal 1 + 2 pages + 3 widgets, scripted REST 2, business rules 7, script includes 2, UI actions 6, UI policies 2 |
| Demo seed | 3 `sys_user`, 1 `sys_user_group` |
| Retrieved set | `state=committed`, 988 children, preview problems error 0 / warning 0 |

**The scope `sys_id` did not change, and later steps must not assume it did.** It is
`82b99028936f74320d74d6f88357a5af`, the same value as before the teardown, because the package pins
it — that string occurs **1,785 times** in the REBUILT bytes (the descriptor's `<application>`, the
`sys_app`/`sys_scope` payload's own `<sys_id>`, and every scoped child's scope reference). The ATF
suite likewise returned under its pinned `sys_id` `8e8c6de584ba8f081439ad5ee09ad1a1`. Any step that
needs either value should re-query it rather than expect a new one.

### 13. Known gaps in this baseline, left for the steps that own them

1. **The 3 `sys_user_has_role` grants are absent** (§11). Both the demo users and the roles exist,
   so they are recreatable. Step 4.
2. **Case/task/party linkage is not populated: all 10 tasks and all 8 parties have an empty `case`
   reference** (`caseISEMPTY` = 10 and 8). This is the Step 3 linkage fix.
3. **`sys_choice` is already 24 across 7 lists, not 0.** A commit leaving `sys_choice` at 0 has been
   recorded in this project before; on these bytes it did not happen. Step 3 should re-measure
   before assuming otherwise.
4. **4 `sys_element_mapping` rows of the `case_transition_guard` Action did not land** (§11). No
   later step currently claims this; it is flagged here for the export-inventory verification.
5. **Package-versus-live deltas the package simply does not carry**, relative to the instance as
   found: `sys_security_acl` 26 against 29 (the three field-level `query_range` ACLs added after the
   original delivery), `sys_script` 7 against 12, `sys_ui_policy` 2 against 3, `sys_script_client` 0
   against 3.

### 14. A measurement caveat for every later step

Several tables silently ignore an invalid field in `sysparm_query` and return the **unfiltered table
total** rather than an error. Confirmed on `sys_security_acl_role` (the role field is
`sys_user_role`, not `role`), `sp_portal` (`url_suffix`, not `urlSuffix`), `sys_ui_application` and
`sys_app_application` (no `title`), `sys_element_mapping` and `sys_ui_list_element` (no `sys_scope`),
and `sys_update_log` (no `update_set`). Any count taken with such a query is wrong and will usually
look alarmingly large. Cross-check every counter against the table's own total before believing it.

---

## Step 3-4 — Choice-list and linkage fixes; role-link authoring

## Step 5-6 — Gated reimport and canonical replacement

## Step 7 — ATF suite and transition harness

## Step 8 + Exit Condition
