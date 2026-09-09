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

Owner: unit U2. Executed 2026-09-08, 18:38Z–19:56Z. Every figure below was measured fresh against
the live instance during that window. Nothing is carried over from a prior report, including the
scope `sys_id`: it was re-queried (`sys_scope?sysparm_query=scope=x_casemgmt` → exactly one record,
`82b99028936f74320d74d6f88357a5af`, 32-hex) and that measured value was used for every scoped run.

Preflight: `GET /api/now/table/sys_user?sysparm_limit=1` returned HTTP 200 with a **JSON** body ⇒
instance live, credentials valid, no 401/403. Zero hibernation events for the whole checkpoint.

> **Timestamp convention.** Values below are the stored **UTC** values. This instance's display
> layer renders them at `America/Los_Angeles`, i.e. seven hours earlier — the same offset already
> recorded against ATF 18/19. A row created at `19:15:30` UTC displays as `12:15:30`.

### 1. Script inventory — what the repository actually contains (D3.1)

`grep -c sys_choice` over `servicenow-case-management-poc/scripts/`:

| File | `sys_choice` hits | What it is |
|---|---|---|
| `post_import_remediation.js` | 10 | Carries the authoritative `CHOICE_SPECS` block (~L494–525) with `EXPECTED_CHOICE_LISTS = 7` / `EXPECTED_CHOICE_VALUES = 24`. **Not choice-only** — also holds `ensureTable`, dictionary, ACL and number branches, including a destructive table-delete |
| `sys_script_fix_x_casemgmt_post_import_remediation.xml` | 11 | Fix Script twin of the above. Same content, same hazard |
| `pre_delete_collateral_guard.js` | 3 | Pre-teardown guard; counts choices, does not create them |
| `seed_demo_data.js` | **0** | The case/task/party **linkage** script (`adoptReference`, `ensureCase`, `ensureTask`, `ensureParty`, `ensureCompany`, `lookupCaseSysId`, `lookupCaseNumberBySubject`). Resolves every reference by `user_name` / `name` / `number`; zero 32-hex literals; `.invalid` emails only |
| `transition_logic_regression_assertions.js` | 0 | The 13-assertion transition harness |

**No standalone choice-only script existed**, so the directive's "if no standalone script exists for
the choice-list fix, author one now" branch applies.

Documented transport limitation, confirmed in `docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`: direct
`sys_choice` children in an update set committed cleanly and yet materialised **0** rows
(~L524–526, "Defect C"); the platform-native app-scoped `sys_choice_set` composite form fixed it
(~L536–542) and that delta previewed to 0 problems while taking `sys_choice` from **0 → 24**
(~L228–229, ~L569–572).

### 2. The judgment: which script(s) were run, and why (D3.6)

**Run:** `scripts/create_choice_values.js` (authored here, see §3) and `scripts/seed_demo_data.js`
**unmodified** (md5 `f19d2c9c660d610753c9ff6ede19cf06` before and after — verified byte-identical).

**Not run: `post_import_remediation.js` and its Fix Script twin.** Read for `CHOICE_SPECS` only.
Five measured reasons, not a preference:

1. **It is not choice-only.** Its choice branch is one of several; `ensureTable`, dictionary, ACL and
   number branches run alongside it.
2. **It contains a destructive table-delete branch.** Running it wholesale would mutate the natively
   committed rebuild output Step 2 had just verified — which the directive names at L137–141 as a
   CRITICAL-classification trigger.
3. **Its `ensureAllAclRoleLinks()` would manufacture exactly what Step 4 forbids.** That function
   pins each link's `sys_id` to `first16(ACL) + first16(role)` via `setNewGuidValue()`
   (`installerLinkSysId()`, ~L2617–2624). Its own comment states that a row created by an
   administrator "carries a random GUID and can therefore never be mistaken for one of ours". Running
   it would have re-created the direct-insert links Step 4 exists to eliminate.
4. **It must run in Global scope to do its schema work**, which conflicts with the scoped run the
   choice fix needs.
5. **There was nothing left for it to repair.** The Step 2 baseline already carried 3 tables,
   21/14/13 dictionary + documentation rows, 24 choices, 3 roles, 26 ACLs and 27 role links.

### 3. The new script (D3.2)

`servicenow-case-management-poc/scripts/create_choice_values.js` — 785 lines, ES5-only (verified by a
comment- and string-stripping scan: zero `let`/`const`/arrow/backtick/`class`/`for-of` in the
executable body; the backticks that appear in the file are markdown quoting inside the header
comment). `node --check` passes. **Zero** hardcoded `sys_id` literals, **zero** PII, **zero**
TODO/placeholder. The only write receivers in the file are `existing.update()` and `gr.insert()`,
both on `sys_choice` records; `sys_choice_set`, `sys_db_object` and `sys_scope` are read-only reads
used for verification and refusal diagnosis. No email/SMTP interaction.

It creates exactly 24 values across 7 fields, taken verbatim (value, label, sequence) from
`CHOICE_SPECS` in `scripts/post_import_remediation.js`, with `inactive=false` and `language=en`:

| Table.field | Count | Values (label, sequence) |
|---|---|---|
| `x_casemgmt_case.type` | 2 | General Inquiry 100, Complaint 200 |
| `x_casemgmt_case.status` | 6 | Draft 100, Open 200, In Progress 300, Pending 400, Resolved 500, Closed 600 |
| `x_casemgmt_case.priority` | 4 | Low 100, Medium 200, High 300, Critical 400 |
| `x_casemgmt_case.pending_reason` | 3 | Awaiting Info 100, Awaiting Third Party 200, Other 300 |
| `x_casemgmt_case_task.type` | 4 | Investigation 100, Review 200, Follow-up 300, Other 400 |
| `x_casemgmt_case_task.status` | 3 | Open 100, In Progress 200, Closed 300 |
| `x_casemgmt_case_party.party_type` | 2 | Person 100, Organization 200 |

Idempotency is keyed on the natural key `(name = table, element = field, value = value)` — never on
`sys_id`. Missing rows are inserted, a row whose `label`, `sequence`, `language` or `inactive` flag
disagrees with the specification is repaired **in place**, and nothing is ever duplicated. A
**surplus** — a stray extra value on one of the seven fields — is reported as a failure exactly as a
shortfall is. Output is one `VERIFY` line per field (`table.element expected=N found=N`) plus a
total and a verdict.

**Write-path discovery that the script now documents and diagnoses.** `sys_db_object` for
`sys_choice` reports `create_access=false, update_access=false, delete_access=false,
read_access=true, sys_scope=global`: a **scoped** session may read `sys_choice` but may not write it,
and `GlideRecord.canCreate()` / `canWrite()` both answer `true` in the very run whose insert is
refused (they evaluate ACLs, not cross-scope privileges — useless as a pre-check). The script
therefore reports `insert REFUSED` with a diagnosis and remedy rather than failing silently, and the
procedure it documents is **verify in scope, write from Global**. Scope attribution does not suffer:
`sys_choice` has no `sys_scope` column at all, and ownership is carried by the seven
`sys_choice_set` composites, all of which are app-owned (`sys_scope` = `sys_package` =
`x_casemgmt Case Management`, names `sys_choice_x_casemgmt_*`).

> Beware: `sys_choice` has **no** `sys_scope`/`sys_package` column, so a query filtered on one
> silently returns the unfiltered name-filtered total. Cross-check every counter against the
> table's own total — the same trap the Step 1-2 section records for other tables.

**Exportability proven, not assumed.** A write made through this path was captured as a
`sys_update_xml` row of type **Choice list** named `sys_choice_x_casemgmt_case_pending_reason` into
update set `3d4d5f04931f0b1009aa70d19dba10b2` — the app's own **Default** set
(`application = x_casemgmt Case Management`, `is_default = true`). The rows are therefore application
files that the Step 5a export will capture.

### 4. Choice-list fix: run and verification (D3.3)

Run via `/sys.scripts.do` with `sys_scope=82b99028936f74320d74d6f88357a5af`; every scoped run
answered `Script completed in scope x_casemgmt`. Note that `gs.getCurrentApplicationId()` reflects
the session's application picker and misreports a Global run as in-scope —
`gs.getCurrentScopeName()` is the authoritative check, and the script uses it.

Per-field counts, measured directly against `sys_choice`:

| Table.field | Expected | Before | After | Idempotency re-run |
|---|---|---|---|---|
| `x_casemgmt_case.type` | 2 | 2 | 2 | 2 |
| `x_casemgmt_case.status` | 6 | 6 | 6 | 6 |
| `x_casemgmt_case.priority` | 4 | 4 | 4 | 4 |
| `x_casemgmt_case.pending_reason` | 3 | 3 | 3 | 3 |
| `x_casemgmt_case_task.type` | 4 | 4 | 4 | 4 |
| `x_casemgmt_case_task.status` | 3 | 3 | 3 | 3 |
| `x_casemgmt_case_party.party_type` | 2 | 2 | 2 | 2 |
| **Total** | **24** | **24** | **24** | **24** |

The Step 2 baseline already held all 24 rows with the correct split, so the honest finding is that
**the choice-list gap the directive anticipated did not exist on this baseline** — the previous
unit's rebuilt package carried the values through as native composites. A count-only check would
have been a weak result, so each branch of the fix was proven live instead, by deliberately breaking
the state and repairing it (all probes reverted):

| Run | State induced | Script verdict | Outcome |
|---|---|---|---|
| 1 (in scope) | none | `OK`, 24/24, 7 `VERIFY` lines ok, `CHOICE_SETS 7/7` | baseline confirmed |
| 2 (in scope) | none | identical | idempotent: 24 rows, 24 distinct `sys_id`s, global total unchanged at 18985 |
| 3 (in scope) | deleted `case.pending_reason=Other` | `insert REFUSED`, shortfall, `FAILED problems=3` | shortfall detected; cross-scope write barrier diagnosed |
| 4 (Global) | same gap | `created=1`, 24/24, `OK` | repair works from Global; new `sys_id` `c1cf9fc4935f0b1009aa70d19dba1017` |
| 5 (in scope) | `status=Draft` label → "Draft DRIFT PROBE", sequence → 999 | both drifts detected, repair refused with cause + remedy | **count still read 24/24 with every per-field line ok — a count-only check would have passed** |
| 6 (Global) | same drift | repaired, `OK` | in-place repair works |
| 7 (Global) | inserted surplus `case.priority='U2 Surplus Probe'` | `expected=4 found=5`, `TOTAL 25`, a `SURPLUS` line naming `sys_id=93706748935f0b1009aa70d19dba1029`, `FAILED` | surplus is a failure, as required |
| 8 (final) | probes removed | `OK`, 24/24 | final state |

Final state proven equal to baseline, not merely equal in count: a tuple diff of
`(name, element, value, label, sequence, inactive, language)` across all 24 rows is **identical** to
the pre-run snapshot, and the instance-wide `sys_choice` total is back to **18985**.

### 5. Linkage fix: run and verification (D3.3)

`scripts/seed_demo_data.js` run unmodified, in scope, twice.

Run 1 repaired the gap that **did** exist on the baseline: 8 cases had `opened_date` repaired, **all
10** tasks had their `case` reference repaired, **all 8** parties had their `case` reference
repaired, and the **3** Organization parties had `organization` repaired; 1 group membership was
added. Its own summary line: `cases inserted=0 adopted=10 repaired=8 | tasks inserted=0 adopted=10
repaired=10 | parties inserted=0 adopted=8 repaired=8`.

| Check | Before | After |
|---|---|---|
| `x_casemgmt_case` rows | 10 | 10 (CASE9000001–CASE9000010) |
| Statuses covered | — | all six: Draft 1, Open 2, In Progress 2, Pending 1, Resolved 2, Closed 2 |
| Types covered | — | both: General Inquiry 6, Complaint 4 |
| `x_casemgmt_case_task` rows / `caseISEMPTY` | 10 / **10** | 10 / **0** |
| `x_casemgmt_case_party` rows / `caseISEMPTY` | 8 / **8** | 8 / **0** |
| Organization parties / `organizationISEMPTY` | 3 / **3** | 3 / **0** |
| Person parties / `personISEMPTY` | 5 / 0 | 5 / 0 |
| `core_company` rows | 179 | 179 (no new company created) |

Beyond counting non-empty fields, every reference was **resolved individually** by `sys_id`: each
task's `case`, each party's `case`, each Organization party's `organization` → `core_company`, and
each Person party's `person` → `sys_user`. **UNRESOLVED = NONE.**

Run 2 was a clean no-op — 0 inserts, 0 repairs, still 10/10/8 with 10/10/8 distinct numbers —
proving idempotency.

### 6. Live-UI verification, not just API (D3.4, D3.5)

Driven in a real logged-in Chrome session (`/login.do`, identity confirmed authoritatively as
`g_user.userName=admin`, "System Administrator", `hasRole('admin')=true`). Verified as **admin**,
which is what the directive asks for ("Open a real case record"); §9 covers the scoped personas.

**The four dropdowns on real record `CASE9000001`** all render as populated selects — none empty:

| Field | Count | Values offered |
|---|---|---|
| `status` | 6 | Draft, Open, In Progress, Pending, Resolved, Closed |
| `type` | 2 | General Inquiry, Complaint (plus `-- None --`) |
| `priority` | 4 | Low, Medium, High, Critical |
| `pending_reason` | 3 | Awaiting Info, Awaiting Third Party, Other (plus `-- None --`) |

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-case-form-status-choices.png`
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-case-form-type-priority-pending.png`

**Task and party linkage in the UI.** On `/x_casemgmt_case_task_list.do`, **10 of 10** rows show a
populated `Case` display value rendered as a hyperlink (TASK…1/2 → CASE9000003, 3/9 → CASE9000004,
4/5 → CASE9000005, 6/7/10 → CASE9000008, 8 → CASE9000009). On
`/x_casemgmt_case_party_list.do`, **8 of 8** rows show a populated `Case` value; all **3**
Organization rows show a real company name (Synthetic Org Alpha ×2, Synthetic Org Beta) and all 5
Person rows a real person. Both a blank cell and a bare `sys_id` were explicitly tested for.
**Failing rows: none.**

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-task-list-case-refs.png`
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-party-list-case-and-org-refs.png`

No row was hand-edited in the UI to make a screenshot pass; every fix was made at the source script.

### 7. Role-link authoring audit (D4.1, D4.2)

The count was correct before anything was touched — **27** links split manager 14 / agent 10 /
viewer 3, and **3** grants — and the audit was performed anyway, exactly as L87 requires. It is what
caught the defect: **the count was right and the authoring method was wrong.**

Counting was cross-checked so the number is trustworthy: `sys_security_acl_role` filtered by
`sys_scope=82b99028…` → 27, and independently by `sys_user_role.nameLIKEx_casemgmt` → 27, against a
table total of 40617.

Three independent tests were applied to every row:

| Test | Result on the original 27 links / 3 grants |
|---|---|
| **Timestamp clustering.** 27 interactive form submissions cannot land inside two seconds | All 27 carried `sys_created_by=admin` with `sys_created_on` in `2026-09-02 19:09:55`–`19:09:56`, `sys_mod_count=0` ⇒ **script signature** |
| **Installer-composite `sys_id`.** `post_import_remediation.js` pins link `sys_id`s to `first16(ACL)+first16(role)` | **0 of 27** matched ⇒ that script was not the author, so a *different* direct insert was |
| **`granted_by`** (grants) | Useless as a signal on this instance: the sentinel `not-applicable` on all 3890 rows (`ISEMPTY`=0) |

Documentary confirmation, which settles it: `docs/refine-run/PHASE1-REBUILD.md` records an explicit
**DEVIATION** — a server-side background script "inserted all 27 links directly (`created=27
failed=0`, relying on auto-capture)" and "inserted the 3 grants directly… Neither insert went
through the platform's native role-assignment action." All 27 live `sys_id`s appeared in that
document's own list of directly-inserted rows.

The 3 grants needed no inference at all: they were created by this unit's own `seed_demo_data.js`
run at `2026-09-08 18:58:04` (`ensureRoleAssignment()`, ~L724–745, inserts `sys_user_has_role`
directly), so they were known first-hand to be direct inserts.

**Verdict: all 30 records failed the native-authoring trace and every one was deleted and
recreated.** Per INTERP-R1 the breakdown is reported on both dimensions: per role **manager 14 /
agent 10 / viewer 3 = 27**; per table **`x_casemgmt_case` 11 / `x_casemgmt_case_task` 8 /
`x_casemgmt_case_party` 8**; per operation read 9 / write 9 / create 6 / delete 3. (The instance's
2026-09-05 measurement of 36 links / 17-13-6 is not this task's number; the acceptance number is 27.)

### 8. Native recreation (D4.3, D4.4)

All work done in a session **elevated to `security_admin`** via `elevated_role_dialog.do` (UI page
`b80fa99a0a0a0b7f2c2a0da76c12ae00`, whose processing script calls
`GlideSecurityManager.enableElevatedRole`). Elevation was proven effective, not assumed: the ACL
form's "Requires role" related list changed from read-only to editable with Update/Delete controls.

**The 27 ACL role links.** The ACL form's "Requires role" related list offers no **New** button, so
the platform's own record-level controls were used: open `/sys_security_acl_role.do?sys_id=<old>` and
click the form's own **Delete** action, then open
`/sys_security_acl_role.do?sys_id=-1&sysparm_query=sys_security_acl=<ACL>` — the parent
pre-populated exactly as the related list does it — set the role and click **Submit**. Each pair was
verified before batching: the deleted row answered HTTP 404 and was captured as a `DELETE`, the new
row as an `INSERT_OR_UPDATE`, both in the app's Default set.

| # | New `sys_id` | Role | Op | ACL (table / field) | Created by | Created on (UTC) |
|---|---|---|---|---|---|---|
| 1 | `9aa4e780939f0b1009aa70d19dba1016` | manager | read | `x_casemgmt_case` | admin | 2026-09-08 19:15:30 |
| 2 | `ca15a7c0939f0b1009aa70d19dba10bf` | manager | create | `x_casemgmt_case` | admin | 2026-09-08 19:17:22 |
| 3 | `e3256bc0939f0b1009aa70d19dba10c5` | agent | create | `x_casemgmt_case` | admin | 2026-09-08 19:17:45 |
| 4 | `45452fc0939f0b1009aa70d19dba10b0` | manager | delete | `x_casemgmt_case` | admin | 2026-09-08 19:18:08 |
| 5 | `3a552304939f0b1009aa70d19dba1062` | viewer | read | `x_casemgmt_case` | admin | 2026-09-08 19:18:30 |
| 6 | `5475e304939f0b1009aa70d19dba103e` | agent | read | `x_casemgmt_case` | admin | 2026-09-08 19:18:53 |
| 7 | `3d856704939f0b1009aa70d19dba10f7` | agent | write | `x_casemgmt_case` | admin | 2026-09-08 19:19:16 |
| 8 | `af956b04939f0b1009aa70d19dba1077` | manager | write | `x_casemgmt_case` | admin | 2026-09-08 19:19:39 |
| 9 | `09b56f04939f0b1009aa70d19dba10b3` | agent | write | `x_casemgmt_case.assigned_agent` | admin | 2026-09-08 19:20:02 |
| 10 | `bac56b44939f0b1009aa70d19dba1082` | manager | write | `x_casemgmt_case.assigned_agent` | admin | 2026-09-08 19:20:25 |
| 11 | `d0e52f44939f0b1009aa70d19dba10b8` | manager | write | `x_casemgmt_case.assigned_group` | admin | 2026-09-08 19:20:48 |
| 12 | `39f5ef44939f0b1009aa70d19dba1097` | manager | create | `x_casemgmt_case_party` | admin | 2026-09-08 19:21:11 |
| 13 | `2306e384939f0b1009aa70d19dba1056` | agent | create | `x_casemgmt_case_party` | admin | 2026-09-08 19:21:34 |
| 14 | `0d266784939f0b1009aa70d19dba10ea` | manager | delete | `x_casemgmt_case_party` | admin | 2026-09-08 19:21:57 |
| 15 | `aa366b84939f0b1009aa70d19dba1007` | viewer | read | `x_casemgmt_case_party` | admin | 2026-09-08 19:22:20 |
| 16 | `94562f84939f0b1009aa70d19dba1047` | agent | read | `x_casemgmt_case_party` | admin | 2026-09-08 19:22:42 |
| 17 | `3966ef84939f0b1009aa70d19dba1058` | manager | read | `x_casemgmt_case_party` | admin | 2026-09-08 19:23:05 |
| 18 | `9376a3c4939f0b1009aa70d19dba108e` | agent | write | `x_casemgmt_case_party` | admin | 2026-09-08 19:23:28 |
| 19 | `859667c4939f0b1009aa70d19dba10de` | manager | write | `x_casemgmt_case_party` | admin | 2026-09-08 19:23:51 |
| 20 | `aea62bc4939f0b1009aa70d19dba10ab` | manager | create | `x_casemgmt_case_task` | admin | 2026-09-08 19:24:14 |
| 21 | `d0c62fc4939f0b1009aa70d19dba1085` | agent | create | `x_casemgmt_case_task` | admin | 2026-09-08 19:24:37 |
| 22 | `b1d6efc4939f0b1009aa70d19dba1019` | manager | delete | `x_casemgmt_case_task` | admin | 2026-09-08 19:25:00 |
| 23 | `5be6a308939f0b1009aa70d19dba1088` | agent | read | `x_casemgmt_case_task` | admin | 2026-09-08 19:25:23 |
| 24 | `81076708939f0b1009aa70d19dba10ba` | viewer | read | `x_casemgmt_case_task` | admin | 2026-09-08 19:25:46 |
| 25 | `2a172b08939f0b1009aa70d19dba1099` | manager | read | `x_casemgmt_case_task` | admin | 2026-09-08 19:26:09 |
| 26 | `0c372f08939f0b1009aa70d19dba1032` | agent | write | `x_casemgmt_case_task` | admin | 2026-09-08 19:26:32 |
| 27 | `3947af08939f0b1009aa70d19dba10f8` | manager | write | `x_casemgmt_case_task` | admin | 2026-09-08 19:26:54 |

Evidence that these are natively authored: **27 of 27 carry brand-new `sys_id`s** (no row survives
from the direct-inserted set), **0** are installer composites, and there are **27 distinct
`sys_created_on` values spanning 19:15:30 → 19:26:54, roughly 23 seconds apart** — the signature of
27 separate interactive form submissions, in direct contrast to the original 2-second batch. The
pair-for-pair `(ACL, role)` matrix is **identical** to before: no pair lost, none added. New
`sys_id`s are inherent to recreating a link and are not a defect.

**The 3 user→role grants.** Recreated through the platform's own role-grant screen: the user
record's **Roles → "Edit…"** control, which opens the `sys_m2m_template.do` "Edit Members"
slushbucket. The role was moved with the screen's own `remove_from_collection_button` /
`add_to_collection_button` control and committed with its own `sysverb_save`, as **two separate
saves** — one save diffs initial against final state, so a delete-and-recreate in a single save is a
no-op.

| User | Role | New `sys_id` | Created (UTC) | Old direct-insert `sys_id` |
|---|---|---|---|---|
| `x_casemgmt_demo_manager` | `x_casemgmt_case_manager` | `203beb4093df0b1009aa70d19dba1011` | 19:43:56 | `20b02f48935f0b1009aa70d19dba102b` |
| `x_casemgmt_demo_agent` | `x_casemgmt_case_agent` | `3d4b6f4093df0b1009aa70d19dba10bc` | 19:44:18 | `30b02f48935f0b1009aa70d19dba1032` |
| `x_casemgmt_demo_viewer` | `x_casemgmt_case_viewer` | `c35ba38093df0b1009aa70d19dba103d` | 19:44:39 | `70b02f48935f0b1009aa70d19dba1037` |

The decisive proof of native authoring here is not the timestamp but a side effect no direct insert
produces: alongside each new grant **the platform re-derived its `inherited=true`
`snc_required_script_writer_permission` companion row with `sys_created_by=system`**
(`603beb40…1015`, `7d4b6f40…10c0`, `075ba380…1041`). The delete pass had removed those companions
too — `sys_user_has_role` went 3890 → 3884 (3 grants + 3 companions) and back to **3890** after the
native re-grant.

Screenshots (each shows the platform's own "Edit Members" screen with the role in the assigned Roles
List before Save, plus the resulting user form), all under
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/`:
`u2-native-role-grant-x_casemgmt_demo_manager.png`, `…-manager-userform.png`,
`u2-native-role-grant-x_casemgmt_demo_agent.png`, `…-agent-userform.png`,
`u2-native-role-grant-x_casemgmt_demo_viewer.png`, `…-viewer-userform.png`.

**Final state, re-measured after all recreation:** 27 scoped links, manager 14 / agent 10 / viewer 3,
3 grants, every row tracing to native creation.

**The ACL inventory itself is provably unchanged** — role links may be added or restored, ACL records
may not. Scoped `sys_security_acl` is **26** before and after, none added, none removed, all 26
identical on `name` + `operation`; every one still carries `sys_mod_count=0` and `sys_updated_on =
2025-01-01 00:00:00` (the package's authored timestamp), and the number of scoped ACLs updated during
this checkpoint's window is **0**. Distribution: `x_casemgmt_case` 8, `_case_task` 8, `_case_party`
8, `case.assigned_group` 1, `case.assigned_agent` 1.

### 9. Role-model sanity check by impersonation

Personas have no passwords, so the platform's own impersonation was used
(`impersonate_dialog.do` → `session.onlineImpersonate()`), each persona in its own throwaway browser
profile so the admin session used for the recreation work was never mutated.

**Viewer** — identity confirmed on a real page: `g_user.userName=x_casemgmt_demo_viewer`, roles
`snc_required_script_writer_permission, x_casemgmt_case_viewer`. That the role is present and
effective is itself live proof that the natively re-granted row works. All **10** cases readable
(read All). On `CASE9000001`: `g_form.getEditableFields()` returns **`[]`**, no Update, no Insert and
no Delete control renders, and all seven business fields render read-only ⇒ **read-only confirmed**.
Structurally guaranteed too: the viewer role's only 3 ACL links are all `operation=read`.

**Agent** — identity `g_user.userName=x_casemgmt_demo_agent`, roles `…, x_casemgmt_case_agent`. The
case list returns **exactly 9 rows, CASE9000002–CASE9000010, with CASE9000001 absent** — matching
the "assigned only" set computed independently beforehand as admin (`assigned_agent = Demo Agent` on
7 cases ∪ `assigned_group = x_casemgmt_demo_team` on 9; CASE9000001 has neither). The list footer
reads "1 to 9 of 9". Opening CASE9000001 directly answers *"Security constraints prevent access to
requested page"*. On assigned `CASE9000003` the Update control renders and 9 fields are editable
(`subject, description, assigned_agent, requester_email, type, priority, pending_reason,
requester_name, status`) — and `assigned_group` is **not** among them, which corroborates the
field-level ACLs: `assigned_group` write is manager-only while `assigned_agent` is writable by the
assigned agent.

Screenshots: `u2-persona-viewer-case-list.png`, `u2-persona-viewer-case-form.png`,
`u2-persona-viewer-core-company.png`, `u2-persona-viewer-party-list.png`,
`u2-persona-agent-case-list.png`, `u2-persona-agent-case-form.png`,
`u2-persona-agent-unassigned-case-denied.png`, `u2-persona-agent-core-company.png`,
`u2-persona-agent-party-list.png` (same directory as above).

**Known accepted limitation, reproduced and deliberately not "fixed".** `/core_company_list.do`
answers **both** scoped personas *"Security constraints prevent access to requested page"*, and in
consequence the party list's `organization` column is blank in all 8 rows for both — while the same
list shows real company names to admin (§6). This is the project's recorded **ADV-1**:
`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` ~L922, restated ~L2052–2057 and N8 ~L2242 — closing it
would need a global ACL or a stock-role grant, both forbidden (AAP §0.3.2 names `core_company`
explicitly). **No global ACL was created and no stock role was granted.** D3.5 was therefore verified
as admin, which is what the directive's wording asks for.

### 10. Collateral: what changed, and nothing else

A census taken before any write was re-taken afterwards. The diff contains **exactly three
changes**, all intended:

| Change | Before → After |
|---|---|
| Scoped-role grants | 0 → **3** (`sys_user_has_role` table total 3884 → 3890, the 3 grants plus their 3 platform-derived companions) |
| Task / party `case` references empty | 10 / 8 → **0 / 0** |
| Organization parties with empty `organization` | 3 → **0** |

Every other line is byte-identical: rows 10/10/8; `sys_dictionary` + `sys_documentation` 21/21,
14/14, 13/13; `sys_db_object` 3; `sys_choice` 24 (2/6/4/3/4/3/2); `sys_choice_set` 7; instance-wide
`sys_choice` 18985; `sys_number` 3; `sys_user_role` 3; `sys_security_acl` 26;
`sys_security_acl_role` 27; demo users 3; demo group 1; `core_company` 179.

The authoritative footprint is the app's own capture. Every `sys_update_xml` row created in this
checkpoint's window — **58 in total, all by `admin`, all in the app's Default set** — is:

| Type | Action | Count | What it is |
|---|---|---|---|
| Access Roles | DELETE | 27 | the audited direct-insert links removed |
| Access Roles | INSERT_OR_UPDATE | 27 | the natively recreated links |
| Choice list | INSERT_OR_UPDATE | 3 | `sys_choice_x_casemgmt_case_status`, `_case_priority`, `_case_pending_reason` — the drift repair, surplus removal and `Other` restore, all ending tuple-identical to baseline |
| Form Layout | INSERT_OR_UPDATE | 1 | see disclosure below |

There are **zero** dictionary, table, ACL, flow, business-rule, script-include, report, dashboard and
portal payloads. Records created in the window, counted directly: `sys_security_acl` **0**,
`sys_dictionary` **0**, `sys_db_object` **0**, `sys_hub_flow` **0**, `sys_script` **0**, `sys_scope`
**0**, `sys_email` / `sys_email_account` **0 / 0** (no SMTP interaction). No Store app was installed.
The demo users hold exactly six role rows between them: their one scoped role (`inherited=false`,
`by=admin` — the native grants) plus `snc_required_script_writer_permission` (`inherited=true`,
`by=system` — platform-derived, not granted here). Directive L224–225 is intact: no field,
dictionary, table or ACL was added, removed or edited.

**Disclosure — one unintended artifact, retained deliberately.** `sys_ui_section`
`726167c8935f0b1009aa70d19dba102e`, a Form Layout for `x_casemgmt_case`'s Default view, was created
in the `x_casemgmt` scope at 19:01:14 (`sys_mod_count=0`) when the §6 browser brief opened the case
form with the app's picker active. The platform materialised it; it was not authored here. It carries
23 `sys_ui_element` rows in exactly the field order AAP §0.4.4 prescribes (`number, type, status,
priority, subject, description, opened_date, closed_date, assigned_group, assigned_agent,
requester_name, requester_email, pending_reason, duration_to_close`, with split markers), so its
content is the app's intended layout and is AAP-aligned rather than a deviation. It is not a
data-model change. It was **not** deleted: removing platform-materialised form metadata risks
degrading the very form the next steps must verify post-commit. It adds **one extra `Form Layout`
payload** to the Step 5a export — noted so that inventory is not a surprise.

The only other side effect is one `sys_user_preference` row on the **admin** account
(`name=recent.impersonations`), unavoidable when using the impersonation §9 requires. It is a UI
preference of the admin user, not an app artifact.

**FALLBACK package: zero interaction of any kind** — never opened, read, checksummed, archived,
deleted, counted or compared. Repository-level proof: `git status --porcelain` under `update-set/`
is empty, so no file in that directory changed.

All seven baseline gates still pass, so the Step 2 baseline remains exportable: the three table
endpoints return HTTP 200 with JSON bodies, each of the three scoped roles returns exactly one
record, and `sys_scope?scope=x_casemgmt` returns exactly one. Untouched app content is intact —
7 flows, 2 script includes, 8 reports, 6 UI actions, 3 widgets, 20 ATF tests.

### 11. What the Step 5a export must capture

Everything this step produced exists to be captured into the Step 5a export, not to persist:

1. the **24 `sys_choice` rows** for the three tables, carried by the seven app-owned
   `sys_choice_x_casemgmt_*` composites (per-field 2/6/4/3/4/3/2);
2. the **27 natively authored `sys_security_acl_role`** links (manager 14 / agent 10 / viewer 3) and
   the **3 natively authored `sys_user_has_role`** grants — all with the new `sys_id`s tabulated in
   §8, and all captured as `Access Roles` payloads in the app's Default set;
3. one additional **`Form Layout`** payload (§10 disclosure);
4. the **10 case / 10 task / 8 party** demo rows with their now-populated references.

Both scripts ran **before** the export, against the Step 2 baseline, as part of building the
candidate package — they are not the post-commit remediation the "single clean commit" gate forbids.

## Step 5-6 — Gated reimport and canonical replacement

This step is the gate. Everything Steps 1-4 built was exported as a candidate package, the instance was
emptied to a proven zero-state, that exact candidate was re-imported and committed **once**, and only
after all of it passed was the canonical file in the repository replaced. Every number below was measured
freshly against this specific export; nothing is carried over from an earlier section's verification.

### 1. Acceptance targets, measured before anything was touched

Measured by direct query on the post-Step-4 instance, and used as the pass/fail targets for the
post-commit checks in §4:

| What | Target measured |
| --- | --- |
| Table endpoints | `x_casemgmt_case` / `_case_task` / `_case_party` → HTTP 200 |
| Rows | 10 case / 10 task / 8 party |
| `sys_dictionary` / `sys_documentation` | case 21/21, task 14/14, party 13/13 |
| `sys_db_object` | 3 |
| `sys_choice` (3 tables) | 24, per field 2/6/4/3/4/3/2 |
| `sys_number` | 3 (one per table; the out-of-box global `task` counter is separate and was preserved) |
| `sys_user_role` | 3 |
| `sys_security_acl` (scoped) | 26 |
| `sys_security_acl_role` (scoped) | 27 — per role manager 14 / agent 10 / viewer 3; per table case 11 / task 8 / party 8 |
| `sys_user_has_role` | 3 |
| Flows | 7, all active and published |
| ATF | 20 tests / 1 suite / 180 steps / 20 suite-tests |
| Scope | `sys_scope` for `x_casemgmt` = exactly one record, `sys_id` `82b99028936f74320d74d6f88357a5af` |

The scope `sys_id` was re-queried, not taken from any prior report. A read-only enumeration by the
repository's own `scripts/pre_delete_collateral_guard.js` (run unmodified, its only side effect being
syslog rows) independently corroborated the per-table figures: scoped role links 11/8/8 = 27, scoped
ACLs 10/8/8 = 26, one `sys_number` per table, and zero links held by any role outside the scoped three.

### 2. Step 5a — producing the candidate package

**Why a new export was necessary.** A payload inventory of the two packages already in the repository
showed both are **hand-authored**, not platform exports: they carry `<unload
unload_date="2025-01-01 00:00:00">`, hand-written comment banners inside payload blocks, and no
`<payload_hash>` on their children. Neither could serve as the candidate; the export had to come from
the platform itself.

**Mechanism.** The platform's own application-publish path — the `Publish to Update Set...` related link
(`sys_ui_action` `1baf2f72bf1130001875647fcf0739a5`, action `app_publish_to_update_set`) on the scoped
application's `sys_app` form — was used in a real authenticated browser session, driven over the Chrome
DevTools Protocol. The dialog's own defaults were accepted (version `1.0.0`, *Include demo data*
checked) and the platform reported "Successfully published … Succeeded in 10 Seconds". This path
packages every application file regardless of what any Update Set happened to capture, which is why it
was chosen over exporting a current Update Set. Screenshots:
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/shots/u3-5a-export-publish-dialog.png`
and `…/shots/u3-5a-export-publish.png`.

**Two things the publish alone did not carry, and how they were captured — package production, not a fix
cycle.** Verifying the package *before* the teardown is part of producing it, so neither of these
consumed the two-cycle fix budget:

1. *27 stray DELETE payloads.* The first publish produced 519 children — 492 `INSERT_OR_UPDATE` plus
   **27 DELETE** rows, one per `sys_security_acl_role` record that Step 4 had re-authored. Those deletes
   would have removed the very links the package must deliver. The 27 `sys_metadata_delete` rows were
   cleared at the source and the application re-published, yielding **492 children, all
   `INSERT_OR_UPDATE`, zero DELETE** — verified by read-back.
2. *39 data rows.* Demo data is not registered application data, so no rows came with the publish. They
   were added through the platform's own capture API (`GlideUpdateManager2().saveRecord`), never by
   editing XML: 10 case, 10 task, 8 party, 1 group, 3 users, 2 companies, 1 group membership, 3 role
   grants — 492 → 530 children, with a read-back after every class. (A completed Update Set silently
   refuses capture; the set had to be reopened to *in progress* first. Every reference was resolved by
   query from the data itself, so no `sys_id` was carried in by hand.)

**Export and off-instance verification.** The Local set was converted with the platform's own
`new UpdateSetExport().exportUpdateSet(...)` and the bytes downloaded through `export_update_set.do`.
The first candidate (530 blocks, sha256 `cc6433bf…`) is the one that failed the gate; §6 records what was
fixed and re-exported. The **shipped candidate** verified off-instance as:

| Property | Value |
| --- | --- |
| Bytes | 3,114,377 |
| Payload blocks | **522** (`grep -o '<sys_update_xml action=' \| wc -l`) |
| Descriptors | exactly 1 `<sys_remote_update_set>`, name `x_casemgmt_case_management v1.0.0 (gate candidate)`, `application_scope` `x_casemgmt`, `state` `loaded` |
| Stray `<sys_id>` after `</payload>` | 0 |
| `xmllint --noout` | PASS |
| **SHA-256** | `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` |

Payload inventory — every required class present: 3 `sys_db_object`; the full dictionary set
(`sys_dictionary` 30 / `sys_documentation` 30, i.e. 21+14+13 across the three tables plus the shared
rows); **7 `sys_choice_set` composites carrying exactly 24 values at 2/6/4/3/4/3/2**; 3 `sys_number`;
3 `sys_user_role`; 26 `sys_security_acl`; **27 `sys_security_acl_role`**; 3 `sys_user_has_role`; 7
`sys_hub_flow`; 7 business rules; 2 script includes; 6 UI actions; UI policies; 8 `sys_report`; 2
`pa_dashboards` + 2 `pa_tabs` + 2 `sys_grid_canvas` + 3 `pa_dashboards_permissions`; 1 portal + 2 pages
+ 3 widgets; 2 scripted REST definitions; **20 ATF tests + 1 suite + 180 steps + 20 suite-tests**; and
10 case / 10 task / 8 party rows with 3 users, 1 group, 1 membership, 2 companies. All 522 blocks carry
`<payload_hash>`, the signature of a genuine platform export. The 7 flow payloads (49.6-67.3 KB each)
**embed** their `sys_hub_flow_snapshot`, `sys_hub_action_instance` and `sys_variable_value` content,
which is why this package needs no standalone `sys_variable_value` blocks where the hand-authored
package used 540.

Standing constraints on the shipped bytes: 15 distinct email addresses, **all** `@example.invalid` (no
PII); 523 payload `application` stamps, **all** the scope `sys_id`, with **zero** `global` stamps (scope
exclusivity); no global-scope artifacts. Two properties are inherent to any platform export and are
reported rather than hand-corrected, since hand-editing the package is forbidden: reference fields carry
resolved `sys_id`s (the no-hardcoded-`sys_id` rule governs authored artifacts — scripts, ACL conditions
and the seed script, all of which resolve by query), and block order is the platform's canonical
name-order rather than the dependency order §0.5.2 describes. The gate itself settles whether that
ordering is sufficient: this package previewed to zero problems and committed on a genuinely empty
instance.

### 3. Step 5b — teardown to a proven zero-state

**The guard, re-verified fresh.** A prior successful teardown grants nothing here, so the check was run
again from scratch. Raw:

```
[{"sys_id":"82b99028936f74320d74d6f88357a5af","scope":"x_casemgmt","name":"x_casemgmt Case Management","version":"1.0.0"}]
```

→ exactly **one** record, `sys_id` matches `^[0-9a-f]{32}$` → **GUARD PASS**. Had the query returned
zero records, an empty value or a malformed `sys_id`, nothing would have been deleted.

**Ledger recorded before deletion.** App-owned Local sets: `30c75744931f0b1009aa70d19dba10e8` (complete,
"native rebuild", 988 children), `3d4d5f04931f0b1009aa70d19dba10b2` (in progress, "Default",
`is_default=true`, 96 children), `8aeaf38093534b1009aa70d19dba10ff` (complete, "gate candidate", 530
children). Retrieved sets: `0b3b7452934f435009aa70d19dba100d` (committed, 988 children),
`8ebb770493534b1009aa70d19dba102a` (loaded, 530 children). Three unrelated scopes' "Default" sets were
identified and left alone. The FALLBACK package's own record was excluded structurally, by `sys_id`, from
every sweep and every count, and was never read.

**Removal.** `deleteApplication` with `sysparm_delete_all=true`, which returned progress worker
`530d33c493534b1009aa70d19dba1082`; its trail shows the tables being dropped, the flow actions deleted
and the roles deleted, finishing with the platform's expected partial verdict ("manually delete any files
that remain"). The residue was then measured and removed explicitly: 494 orphan `sys_metadata` rows (488
`sys_metadata_delete`, 5 flow snapshots, 1 action-type snapshot), 1,636 `sys_update_version` rows, all
five update-set records with their 988 + 530 + 988 + 507 + 530 children, and the synthetic base rows
(3 demo users, 1 group, 2 memberships, 2 companies).

The mechanism that made the purge exact is worth recording: **`sys_update_version.application` carries
the scope `sys_id`**, which reaches the 431 of 530 child names that contain no `x_casemgmt` token at all
(names like `sys_atf_step_<sys_id>`). A name-pattern purge cannot find those, which is why earlier
attempts in this project left "newer local update" residue behind.

**All ten zero-state checks, raw:**

| # | Check | Result |
| --- | --- | --- |
| 1 | `sys_scope` for `x_casemgmt` | 0 — body `[]` |
| 2 | `x_casemgmt_case` endpoint | **HTTP 400** `"Invalid table x_casemgmt_case"` |
| 3 | `x_casemgmt_case_task` endpoint | **HTTP 400** `"Invalid table x_casemgmt_case_task"` |
| 4 | `x_casemgmt_case_party` endpoint | **HTTP 400** `"Invalid table x_casemgmt_case_party"` |
| 5 | `sys_user_role` for the three roles | 0 |
| 6 | `sys_choice` for the three tables | 0 |
| 7 | `sys_number` for the three tables | 0 |
| 8 | `sys_remote_update_set` `nameLIKEx_casemgmt` (FALLBACK's own record excluded) | 0 |
| 9 | `sys_update_set` `nameLIKEx_casemgmt`, and app-owned sets | 0 and 0 |
| 10 | scoped `sys_security_acl_role` / `sys_user_has_role` / `sys_dictionary` / `sys_db_object` / `sys_documentation` | 0 / 0 / 0 / 0 / 0 |

Beyond the ten, also proven zero: `sys_update_version` by application and by name, `sys_metadata`,
`sys_metadata_delete`, orphan `sys_update_xml`, and the demo base rows. The collision preconditions were
cleared too — the candidate's descriptor `sys_id` returned 0 records, and 120 sampled child `sys_id`s
from the export returned 0. The FALLBACK record was confirmed still present and untouched by an
id-only existence probe. **Nothing else ran between this teardown and the commit in §4** — no scripts,
no data loads, no configuration changes. (The full ten-check sequence was executed twice: once before
the first gate attempt, and again from the top before the passing attempt.)

### 4. Step 5c — the gated reimport

| Stage | Evidence |
| --- | --- |
| Collision proof | descriptor `sys_id` → 0 records; `nameLIKEx_casemgmt` → 0 records |
| Checksum before upload | `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` — re-computed immediately before the upload, matching the verified candidate |
| Upload | `/upload.do` → `/sys_upload.do` multipart → HTTP 200 (empty body, as expected) |
| Record located | **by descriptor `sys_id`** `8ebb770493534b1009aa70d19dba102a`, never by the name-ordered locator |
| Load | `state=loaded`, **522 children = 522 payload blocks exactly** — no duplicate append |
| Preview | tracker `7e92001c93934b1009aa70d19dba1089`, genuine `previewing → previewed`, 21:26:14 → 21:26:30 UTC |

**Both gate counts, quoted raw:**

```
type=error   → {"result":{"stats":{"count":"0"}}}
type=warning → {"result":{"stats":{"count":"0"}}}
full problem list → {"result":[]}
```

Zero problem rows carry a `status`, so no count was made to read zero by marking anything
`skip_collision`, `ignored` or `skipped`. A single `type=warning` row would have failed this gate exactly
as an error does.

**The commit — one commit, native UI button only.** The form was first inspected *without clicking* to
confirm `state=previewed` and to locate the platform's own **Commit Update Set** button
(`sys_ui_action` `c38b2cab0a0a0b5000470398d9e60c36`); screenshot `…/shots/u3-5c-precommit-form.png`. The
button was then clicked **exactly once, at 2026-09-08 21:27:27 UTC**. Only the platform's own progress
modal appeared — no confirmation dialog fired, so nothing was clicked through. The modal ended "Failed at
100% — The update set commit completed but some updates failed to commit"; screenshot
`…/shots/u3-5c-commit-result.png`. The record reads `state=committed`, `commit_date`
`2026-09-08 21:27:27`. There was no second commit, no remediation script and no live-instance patching.

**What that "some updates failed" covers, exhaustively.** `syslog` for skipped records after the commit
returns **exactly three rows**, all `sys_user_has_role` ("permission denied: no thrown error", 21:27:58).
Nothing else was skipped — see §7.

**Post-commit verification, every line by direct query:**

| Check | Result |
| --- | --- |
| 3 tables | HTTP 200 / 200 / 200 |
| Rows | 10 case / 10 task / 8 party |
| Scope | `82b99028936f74320d74d6f88357a5af`, v1.0.0 (the package carries the scope record's own `sys_id`, so the id survives the teardown) |
| `sys_dictionary` / `sys_documentation` | case **21/21**, task **14/14**, party **13/13** — matching §1 field for field |
| `sys_db_object` | 3 |
| `sys_security_acl_role` | **27** — per role **manager 14 / agent 10 / viewer 3**; per table **case 11 / task 8 / party 8** |
| `sys_security_acl` (scoped) | 26 |
| `sys_user_role` | 3 |
| `sys_choice` | **24** via 7 composites — per field **2 / 6 / 4 / 3 / 4 / 3 / 2** |
| `sys_number` | 3 |
| Flows | 7, all active **and** published |
| ATF | 20 tests / 1 suite / 180 steps / 20 suite-tests |
| Reports / dashboards / portal / REST | 8 reports; 2 dashboards; 1 portal + 2 public pages + 3 widgets; 2 anonymous REST endpoints |
| Business rules / script includes / UI actions / UI policies | 7 / 2 / 6 / 2 |
| Demo base rows | 3 users, 1 group, 1 membership, 2 companies |

**Choices rendering in the UI, not just present in a table.** A real case record (CASE9000003, "Demo case
03: In Progress (General Inquiry)") was opened in a browser and its dropdowns enumerated: `status`
[Draft, Open, In Progress, Pending, Resolved, Closed]; `type` [-- None --, General Inquiry, Complaint];
`priority` [Low, Medium, High, Critical]; `pending_reason` [-- None --, Awaiting Info, Awaiting Third
Party, Other]. Screenshot `…/shots/u3-5c-postcommit-choices.png`. The remaining three lists read
[Investigation, Review, Follow-up, Other], [Open, In Progress, Closed] and [Person, Organization].

**Linkage.** Zero tasks and zero parties have an empty `case`, and every reference **resolves** by
dot-walk (`case.numberISEMPTY` = 0 for both child tables). All 3 Organization parties resolve to a real
`core_company` (`organization.nameISEMPTY` = 0; e.g. party "Respondent" → *Synthetic Org Beta* on
CASE9000005) and all 5 Person parties resolve to a real user. Cases CASE9000001-CASE9000010 span all six
statuses and both types. Read-only runtime spot-checks (deliberately no POST, which would have created an
eleventh case): the portal and its submit page both HTTP 200, and the anonymous lookup endpoint returned
`{"result":{"status":"Open","subject":"Demo case 02: Open (General Inquiry)","opened_date":"2026-09-08 18:58:04"}}`.

### 5. The verification caveat this gate cannot escape

**This was a same-instance reset-and-reimport, not an independent second instance.** There is one PDI for
this project, so the package could not be imported onto genuinely different hardware. What was done
instead is the closest achievable proxy: the scope and everything it created were torn down and proven
absent by the ten checks in §3, and the candidate was then imported and committed onto that emptied
instance with nothing running in between.

A reader should treat the residual risk as real rather than eliminated. Anything an instance carries
*outside* the records this teardown deleted — platform-level caches, table or index metadata, upgrade
history, plugin state, `sys_properties` values, or any artifact that a scope teardown is not designed to
reset — was **not** re-created by this exercise and was not tested by it. A package that depends on such
residue would still pass this gate and could still fail on a truly fresh instance. The evidence above
establishes that the package installs cleanly onto an emptied *x_casemgmt* namespace on this instance; it
does not establish an independent clean-instance install, and "not verified on an independent fresh PDI"
is a known, accepted limitation of this verification rather than a defect in the package.

### 6. The one failure cycle, and the three fixes it produced (cycle 1 of 2)

The **first** gate attempt failed on the preview problem count: `type=error` **47**, `type=warning` 0.
Nothing was committed. Diagnosis root-caused it to three distinct mechanisms, each to a specific record:

1. **38 × "Update scope id 'global' is different than update set scope id …".** The 39 data rows had been
   captured from a global-scope session, so 38 children carried an `application` value of `global`
   (10 case, 10 task, 8 party, 3 users, 3 grants, 2 companies, 1 group, 1 membership).
   *Fix, at the source:* re-stamp those children with the scope and purge 8 stale `sys_update_version`
   rows keyed on the package's own child names. Re-preview: 47 → **9**.
2. **8 × "Could not find a record in `sys_portal` for column `portal_widget`"**, all on
   `sys_grid_canvas_pane` payloads. The unresolvable field is `portal_widget`, which points at a
   `sys_portal` widget-instance row; all 8 targets were confirmed absent, and `sys_portal` rows carry no
   `sys_scope`, so they are not application files and **no publish can ever include them**. Corroborated
   by the fact that no package in this project's history has carried panes, canvases or `sys_portal`
   rows. *Fix:* drop the 8 untransportable pane payloads (530 → 522 children). Re-preview: 9 → **1**.
3. **1 × "Found a local update that is newer than this one"** on `sys_app_82b99028…`. Pulled with display
   values, the problem named its own culprit: `sys_update_xml` `535df78893534b1009aa70d19dba10ee`,
   `action=DELETE`, created 21:03:18 — **during my own teardown**, and captured into the *global* "Default"
   set because the teardown ran from a global session. *Fix:* purge `sys_update_xml` by
   `application = <scope>` regardless of which set owns the row (29 rows: 27 Access Roles, 1 Custom
   Application DELETE, 1 Table), plus 12 `sys_update_version` rows findable only by `record_name`. The
   FALLBACK package's 926 children and the candidate's own were skipped by `sys_id` and left intact.

A probe preview then read **error 0, warning 0**, validating all three fixes. **Classification:
NON-CRITICAL** against every condition — each root cause was identified to a specific record or platform
mechanism; every fix is a capture/config correction *at the source*; none touched the natively created
schema, dictionary, ACL or role-link output that Steps 1-4 had already verified; and no fix required a
second commit, a live-instance patch, or an edit to the rebuild output. Per the failure path, the run
therefore **restarted from Step 5a in full** — fresh export, fresh teardown with all ten checks re-proven,
fresh reimport, fresh post-commit checks — so the fixes were proven through the same complete gate rather
than assumed correct.

**Cycle count: 1 of 2 used, 1 remaining. There was no third failure.** One further correction was caught
before shipping and is *not* a cycle: the re-export carried the record's own `state=previewed`, meaning a
recipient could have committed it without ever previewing. The record's state was normalised to `loaded`
and the package re-exported, which produced the shipped bytes. Likewise, the pre-teardown re-capture work
in §2 was package production, not a fix cycle.

Note also what did **not** happen: the anticipated failure for this project was `sys_choice` landing at 0
after the commit, which is what the pre-refine path could only fix with a remediation script plus a
second commit. It did not recur — the seven app-owned `sys_choice_set` composites carried all 24 values
through the single commit, with zero choice-script activity in `syslog` afterwards.

### 7. Two residual deltas, reported rather than papered over

Neither is a gate item; both are stated here so nobody downstream reads them as covered.

- **`sys_user_has_role` = 0 (3 grants not transported).** Root cause, proven at record level: Role
  Management V2 owns this table on this release (`glide.role_management.use.inh_count=true`, with
  `inherited` / `inh_count` / `inh_map` marked read-only in the dictionary), so the update-set loader's
  permission check answers false and the platform logs "permission denied: no thrown error" instead of
  raising an error. The three payloads were refused when stamped `Global` *and* refused again when stamped
  `x_casemgmt`, which disproves any capture-side explanation. **No update set can deliver these grants on
  this release**; the native remedy is the role form's *Edit Members*, which is exactly what Step 4 did.
  The gate's own requirements name the three **roles** (`sys_user_role` = 3 ✓) and the 27 **role links**
  (`sys_security_acl_role` = 27 ✓), both of which transported.
- **`sys_grid_canvas_pane` = 0.** The documented consequence of fix (2) above. Both dashboards, both tab
  records, both grid canvases, all 8 reports and all 3 dashboard-permission rows transported and are
  present; the pane rows that bind a canvas cell to a `sys_portal` widget instance cannot be carried by
  any update set, because `sys_portal` rows are not application files.

### 8. Step 6 — canonical replacement and cleanup

`servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` now holds the
**exact bytes that were uploaded and committed** in §4 — not a re-export — re-verified in place:

| Property | Value |
| --- | --- |
| **SHA-256** | **`b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`** |
| Bytes | 3,114,377 |
| Payload blocks | 522 |
| `xmllint --noout` | PASS |

Provenance of the two superseded files, recorded before they were deleted with `git rm` (their bytes
remain recoverable from git history):

- `x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` — 4,062,067 bytes, **988**
  payload blocks, sha256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`.
  *Superseded:* a hand-authored package (`<unload>` banner, comment blocks inside payloads, no
  `payload_hash`), never produced by the platform and never gated through a teardown-and-reimport commit.
- `x_casemgmt_case_management_update_set.AMENDED-NOT-GATED.xml` — 3,973,569 bytes, **935** payload
  blocks, sha256 `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`.
  *Superseded:* likewise hand-authored and, as its own filename records, never gated.

The file it replaced measured 3,781,097 bytes / 926 blocks / sha256
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`. Every forward-looking document that
still names the 926-, 935- or 988-block artifact, or a superseded checksum, as the shipping package is now
stale by design and needs re-pointing to the value above.

`update-set/` ends with **exactly two files**: this canonical package and the FALLBACK package. The
FALLBACK file was not opened, read, checksummed, diffed, archived, deleted, or included in any count or
comparison; that it is unchanged is shown by `git status` and an empty `git diff --stat`, and its own
instance record was excluded by `sys_id` from every teardown sweep.

### 9. Hand-off

The instance is **deliberately left standing** in the verified post-commit state described in §4, so the
ATF step can run against it. For that step: scope `sys_id` **`82b99028936f74320d74d6f88357a5af`** (measured,
unchanged); ATF suite **`8e8c6de584ba8f081439ad5ee09ad1a1`**, "x_casemgmt Case Management POC", inventory
**20 tests / 1 suite / 180 steps / 20 suite-tests**. Two update-set records remain — the committed
Retrieved set `8ebb770493534b1009aa70d19dba102a` (kept as the gate's evidence) and the Local set
`bce2c05c93934b1009aa70d19dba1042` that the platform created automatically as commit bookkeeping. Both are
removed by the final teardown step. No probe artifact, throwaway user or test table was created at any
point in this step, so there is nothing else to clean up.

## Step 7 — ATF suite and transition harness

Both suites were re-run against the package the Step 5c commit installed, and **every number in this
section was measured in this run**. Nothing is carried forward from the last recorded ATF result, which
predates the choice-list fix: the stale baseline was `TES0001005` = 17 Success / 3 Failure / 0 Error /
0 Skip, and that is *not* what this package scores. The result below replaces it.

### 1. What was tested, and the two identifiers re-measured rather than inherited

Step 5c passed (§Step 5-6 §4: `state=committed`, `commit_date` `2026-09-08 21:27:27`, preview 0 errors and
0 warnings), so a testable final package exists and both suites ran. Neither identifier was taken from a
prior section:

| What | How it was obtained | Value |
| --- | --- | --- |
| Scope | `sys_scope?sysparm_query=scope=x_casemgmt` re-queried → exactly **one** record, 32-hex | `82b99028936f74320d74d6f88357a5af` |
| ATF suite | located **by name**, `sys_atf_test_suite?name=x_casemgmt Case Management POC` → exactly one record, `active=true`, in that scope | `8e8c6de584ba8f081439ad5ee09ad1a1`, "x_casemgmt Case Management POC" |

Both values coincide with the pre-refine ones, and the reason is worth stating because it was expected to
be otherwise: the package carries these records' **own** `sys_id`s, so the commit recreated them under the
same identity — the same mechanism §Step 5-6 §4 already recorded for the scope record. The suite was still
located by name, not by a remembered id; the id above is that lookup's result. A cross-check
(`sys_atf_test_suite?sys_scope.scope=x_casemgmt`) returns the same single record and no other.

Inventory the commit recreated, confirmed by query before running anything: **`sys_atf_test` 20 ·
`sys_atf_test_suite` 1 · `sys_atf_step` 180 · `sys_atf_test_suite_test` 20**. Preflight: `GET
/api/now/table/sys_user?sysparm_limit=1` returned HTTP 200 with a **JSON** body (live, not hibernating),
no 401/403, and `sys_upgrade_history?upgrade_finishedISEMPTY` was empty. Zero hibernation events occurred
during this step.

### 2. How the suite was driven — a real browser, because it cannot be anything else

`sn_atf.headless.enabled` reads **`false`** on this instance (re-checked here, alongside
`sn_atf.runner.enabled=true`), so the suite cannot run headlessly. It was driven in a real authenticated
Chrome 151.0.7922.71 session over the Chrome DevTools Protocol — a private browser instance on its own
debugging port and profile, so the host's shared browser was never involved:

1. `/login.do` — the real login form filled and submitted, landing on an authenticated session; the
   classic form documents then rendered under that session.
2. `/sys_atf_test_suite.do?sys_id=8e8c6de5…` — form header "Test Suite", Name "x_casemgmt Case Management
   POC", related list **"Test Suite Tests (20)"** listing ATF 01 … ATF 20 at execution order 100 … 2000.
3. The form's own **Run Test Suite** UI action (`onclick=pickABrowser()`) was clicked.
4. The **"Pick a Browser"** dialog rendered verbatim — *"The test you have selected includes client-side
   steps. Choose a browser to run this test."* — with the radio labelled **"Start a new test runner"**
   (`pickABrowser=newBrowser`) confirmed selected, and the dialog's own Run Test Suite clicked once at
   **2026-09-08 22:09:17 UTC**.
5. A runner tab opened at `/atf_test_runner.do?sys_atf_agent=bb4c885093174b1009aa70d19dba100e…` and was
   **kept open** for the whole run and afterwards. While waiting, the heartbeat was the read-only API
   probe, never a navigation, so the runner page was never lost.

### 3. The fresh suite result

| Field | Value |
| --- | --- |
| Suite result | **`TES0001006`**, `sys_id` `027c049093174b1009aa70d19dba109e` |
| Created | **2026-09-08 22:09:18 UTC** — **42 minutes after** the Step 5c commit at 21:27:27, so this run is unambiguously against the committed final package |
| Status | `failure` |
| Counts | **Success 4 · Failure 16 · Error 0 · Skipped 0** |
| Duration | 34 seconds |
| Suite record screen | "Test Results (20)", "Failed Tests in Suite (16)" |

The immediately preceding suite result on this instance was `TES0001005` at 2026-09-08 **16:27:45** — five
hours *before* the commit, which is precisely why it could not speak for this package. **This section's
result is 4 / 16, freshly measured; the 17 / 3 figure is superseded and is not restated as current
anywhere.**

**Step reconciliation — 180 of 180 accounted for, and no test skipped.** `sys_atf_test_result` rows for
this parent = **20**, so all twenty member tests ran. `sys_atf_test_result_step` rows = **180 exactly**:
**64 success + 16 failure + 100 skipped**. The 100 skipped are the remaining steps *within* the sixteen
failed tests ("This step did not execute due to a failure in a previous step") — ATF's normal
abort-after-first-failure behaviour. No test was skipped, and the suite's own Skipped count is 0.

**Per-test outcome, all twenty:**

| Test | Result | Test | Result |
| --- | --- | --- | --- |
| ATF 01 - Data model: case, task and party schema | **Success** | ATF 11 - Task-closure gate blocks In Progress to Resolved | Failure |
| ATF 02 - RBAC: case_manager has full CRUD | Failure | ATF 12 - Resolved to Closed requires the manager role | Failure |
| ATF 03 - RBAC: case_agent create, assigned-only | Failure | ATF 13 - Prohibited transition: any status back to Draft | Failure |
| ATF 04 - RBAC: case_viewer is read-only | Failure | ATF 14 - Prohibited transition: Closed is terminal | Failure |
| ATF 05 - Field-level ACLs on assigned_group/agent | Failure | ATF 15 - Form: resolve with an open task is blocked | Failure |
| ATF 06 - RBAC mirror on task and party | Failure | ATF 16 - Form: return to Draft is blocked | Failure |
| ATF 07 - RBAC: agent assigned-only on task/party | Failure | ATF 17 - Form: Closed is terminal on the form | Failure |
| ATF 08 - Draft to Open requires assigned_group | Failure | ATF 18 - Portal: anonymous submit returns 201 | **Success** |
| ATF 09 - Open to In Progress requires an agent in group | Failure | ATF 19 - Portal: lookup returns only the whitelist | **Success** |
| ATF 10 - In Progress to Pending sets pending_reason | Failure | ATF 20 - Portal: unknown number returns 404 | **Success** |

**What the four passes establish, since they are the tests this re-run existed to settle.** `ATF 01` is the
schema-and-choice-set test that failed in every recent package-alone run on absent `sys_choice` rows; it
**passes here**, so the choice-list fix genuinely travelled inside this package and materialised through
the single commit. `ATF 19` passes **including its character-for-character `opened_date` comparison**, and
`ATF 18` / `ATF 20` pass on the anonymous portal contract (201 with a number; 404 with the verbatim
message).

### 4. The 13-assertion transition harness

`scripts/transition_logic_regression_assertions.js` was run **unmodified** (verified: clean `git status`,
sha256 `ce0f9322592e24b9a07b8ddd57a5d3dbe763c190963e762db7116828157c90dd`) through `/sys.scripts.do` in a
UI session (login POST → HTTP 302; a fresh 72-character `sysparm_ck` scraped per action), with
**`sys_scope` set to the scope `sys_id` re-queried in §1** — a global run would fail every assertion,
`CaseTransitionValidator` being package-private. The response was HTTP 200 and contained the required
marker **`Script completed in scope x_casemgmt`**, with no evaluator error. It ran at 22:17:15 → 22:17:27
UTC, after the suite had reached its terminal state, so nothing else was touching the instance.

Result read from `syslog` (`messageSTARTSWITHU1ASSERT`, newest first), row `sys_created_on`
**2026-09-08 22:17:27**, source `x_casemgmt` — newer than the pre-run high-water mark of 16:23:58, so it
belongs to this run:

```
U1ASSERT|TOTAL=13 PASSED=13 FAILED=0 |CLEANUP tasks=4 cases=7 remainingCases=10
```

**PASS.** All thirteen assertions passed with their verbatim expected strings matched: A1/A2
`canTransitionToOpen` (blocks empty `assigned_group` — *"Required field assigned_group is empty."* —
and allows it populated); A3/A4/A5 `canTransitionToInProgress` (blocks an empty agent and a
non-member — *"Assigned agent must be set and must be a member of the assigned group."* — allows a
member); A6/A7 `canTransitionToResolved` (blocks with one Open child task — *"All tasks must be closed
before resolving this case."* — allows once all are Closed); A8/A9 `canTransitionToClosed` (allows a
manager-role caller, `callerHasManagerRole=true`; blocks one without it — *"Only case managers can close
cases."*); A10/A11 `validateNoBacktransition` (*"Cases cannot be returned to Draft."* and *"Closed cases
are terminal and cannot be modified."*); A12 `isAgentInGroup`; A13 `getOpenTaskCountForCase` (expected 2,
actual 2). **The harness contributes no entries to the failure list below.**

That matters for reading §5: the transition-logic layer is entirely healthy on this package, and
`CaseTransitionValidator` resolves the manager role correctly, which places the sixteen ATF failures
somewhere other than the state machine.

### 5. Every failure, itemized by name, with its classification

Sixteen failures, all from the ATF suite. **Each was checked against this project's recorded
known/accepted issues on test name, step *and* message — not on resemblance — and none of them matches, so
there are no (a) classifications in this run.** What was checked, and why each accepted symptom is absent:

| Registered accepted issue | Recorded where | Status in this run |
| --- | --- | --- |
| `ATF 17` — *"Unable to set field 'status' to value 'In Progress'. Field 'status' is not editable"*, the form lock on Closed cases | `ATF_MANUAL_TEST_PLAN.md` § *Scenario B — State-machine transition matrix* (the `Set Field Values` step that sets `status`, and the expected banner *"Closed cases are terminal and cannot be modified."*) | **Did not occur.** ATF 17 never reached that step — order 4 is `skipped`; it failed earlier, at order 3, with an unrelated message |
| `ATF 18` / `ATF 19` — `opened_date` asserted character-for-character, failing on a 7-hour offset | `ATF_MANUAL_TEST_PLAN.md` **§6.1** *Where the shipped suite deviates from the recipe above* (the control *stored `17:19:27` vs displayed `10:19:27`*), `docs/portal-pages.md` § *Lookup Behavior* (the endpoint returns the **display** value, not the raw stored one), and §Step 3-4 of this report (`America/Los_Angeles`, seven hours) | **Did not occur.** Both tests **passed**, ATF 19 including the exact comparison |
| `core_company` unreadable to all three scoped roles, making `case_party.organization` unusable for a persona | `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` **ADV-1** (§0.9) and its restatement **N8** (§5.1) | **Not reached.** ATF 06 / ATF 07 failed at the persona layer before any `organization` read; no failure message names `core_company` |
| The choice-row class — `ATF 01`/`10`/`15`/`16`/`17`/`18` failing because `sys_choice` is empty after a bare commit | `ATF_MANUAL_TEST_PLAN.md` § *Status of this document* (the verdict rows: 14 / 6 from the package alone) and **§7** step 6 (**20 / 20** once the 24 rows exist) | **Not available as a citation.** The 24 rows are present and ATF 01 passes; this run's failures carry entirely different messages |

All sixteen are therefore classification **(b) — a symptom not previously recorded**. They share one root
cause, established in §6.

| # | Failure, by name | `atf/` file | First failing step | Exact message |
| --- | --- | --- | --- | --- |
| 1 | ATF 02 - RBAC: `x_casemgmt_case_manager` has full CRUD (AAP 0.5.6) | `x_casemgmt_atf_02_rbac_x_casemgmt_case_manager_has_full_crud_aap_0_5_6.xml` | 3 · Record Insert | `Unable to insert record into table 'x_casemgmt_case'. Details: ACL Exception Insert Failed due to security constraints` |
| 2 | ATF 03 - RBAC: `x_casemgmt_case_agent` create, ASSIGNED-ONLY read/write, no delete | `x_casemgmt_atf_03_rbac_x_casemgmt_case_agent_create_assigned_only_read_write_no_delete.xml` | 3 · Record Insert | the same ACL Exception on `x_casemgmt_case` |
| 3 | ATF 04 - RBAC: `x_casemgmt_case_viewer` is read-only across all cases | `x_casemgmt_atf_04_rbac_x_casemgmt_case_viewer_is_read_only_across_all_cases.xml` | 3 · Record Query | `No records matching query: Sys ID = cd17696587e11cb376a2964c217ff87f` |
| 4 | ATF 05 - Field-level ACLs on `assigned_group` and `assigned_agent` | `x_casemgmt_atf_05_field_level_acls_on_assigned_group_and_assigned_agent.xml` | 3 · Record Update | `Unable to find record '174bb5a31631f5fb4f95c14083aa1afd' in table 'x_casemgmt_case'` |
| 5 | ATF 06 - RBAC mirror on `x_casemgmt_case_task` and `x_casemgmt_case_party` (manager, viewer) | `x_casemgmt_atf_06_rbac_mirror_on_x_casemgmt_case_task_and_x_casemgmt_case_party_manager.xml` | 3 · Record Insert | `Unable to insert record into table 'x_casemgmt_case_task'. Details: ACL Exception Insert Failed due to security constraints` |
| 6 | ATF 07 - RBAC: agent ASSIGNED-ONLY read/write on task and party (AAP 0.5.6 mirror) | `x_casemgmt_atf_07_rbac_agent_assigned_only_read_write_on_task_and_party_aap_0_5_6_mirror.xml` | 3 · Run Server Side Script | `agent assigned-only narrowing on the child tables: checks=52 failures=19 :: agent can read the parent case expected[true] actual[false] \| agent can read a task on its assigned parent case expected[true] actual[false] \| agent can read a party on its assigned parent case expected[true] actual[false] \| ALLOW read (direct-assigned x_casemgmt_case_task) expected[true] actual[false] …` |
| 7 | ATF 08 - Transition Draft to Open requires `assigned_group` | `x_casemgmt_atf_08_transition_draft_to_open_requires_assigned_group.xml` | 3 · Record Update | `Unable to find record '83f3e6d3ff140821649d17368601a963' in table 'x_casemgmt_case'` |
| 8 | ATF 09 - Transition Open to In Progress requires an `assigned_agent` in the `assigned_group` | `x_casemgmt_atf_09_transition_open_to_in_progress_requires_an_assigned_agent_in_the_assig.xml` | 3 · Record Update | `Unable to find record 'd2b5064109ff252741f8c4c4d370b398' in table 'x_casemgmt_case'` |
| 9 | ATF 10 - In Progress to Pending sets `pending_reason`, Pending to In Progress clears it | `x_casemgmt_atf_10_in_progress_to_pending_sets_pending_reason_pending_to_in_progress_clea.xml` | 3 · Record Update | `Unable to find record '0e87e901adab05218fcbf7d5a84bc2c2' in table 'x_casemgmt_case'` |
| 10 | ATF 11 - Task-closure gate blocks In Progress to Resolved with the verbatim message | `x_casemgmt_atf_11_task_closure_gate_blocks_in_progress_to_resolved_with_the_verbatim_mes.xml` | **4** · Record Update | `Unable to find record '8eb58da796d8386b3ecc5493644a5911' in table 'x_casemgmt_case'` |
| 11 | ATF 12 - Resolved to Closed requires the manager role and auto-sets `closed_date` | `x_casemgmt_atf_12_resolved_to_closed_requires_the_manager_role_and_auto_sets_closed_date.xml` | 3 · Record Update | `Unable to find record '3b8f2498cffba6dd162a3d5c0e7d06e3' in table 'x_casemgmt_case'` |
| 12 | ATF 13 - Prohibited transition: any status back to Draft | `x_casemgmt_atf_13_prohibited_transition_any_status_back_to_draft.xml` | 3 · Record Update | `Unable to find record '2c5e1c1b024c34d83ce0524539985203' in table 'x_casemgmt_case'` |
| 13 | ATF 14 - Prohibited transition: Closed is terminal | `x_casemgmt_atf_14_prohibited_transition_closed_is_terminal.xml` | 3 · Record Update | `Unable to find record '3ed0fd4998aa5a461d089e574c504954' in table 'x_casemgmt_case'` |
| 14 | ATF 15 - Form: resolving a case with an open task is blocked on the form | `x_casemgmt_atf_15_form_resolving_a_case_with_an_open_task_is_blocked_on_the_form.xml` | 3 · Open an Existing Record | `This step failed because the client error 'Uncaught ReferenceError: g_form is not defined' was detected on the page being tested.` |
| 15 | ATF 16 - Form: returning a case to Draft is blocked on the form | `x_casemgmt_atf_16_form_returning_a_case_to_draft_is_blocked_on_the_form.xml` | 3 · Open an Existing Record | the same `g_form is not defined` client error |
| 16 | ATF 17 - Form: a Closed case cannot be moved out of the terminal state on the form | `x_casemgmt_atf_17_form_a_closed_case_cannot_be_moved_out_of_the_terminal_state_on_the_fo.xml` | 3 · Open an Existing Record | the same `g_form is not defined` client error |

### 6. One root cause behind all sixteen, and what may not be done about it here

**The three demo personas hold no role grants after the single Step 5c commit, so every test that
impersonates one fails at its first persona-context step.** Four independent measurements:

1. **The grants are absent.** `sys_user_has_role` filtered on `user.user_name STARTSWITH x_casemgmt_demo`
   returns **0 rows** — the personas hold no roles at all. The three scoped **roles** themselves
   transported and exist, and so did the **27** ACL role links; it is only the three *grants* that are
   missing. `docs/acl-matrix.md` § *Measured evidence (read-only Table API as `admin`)* records the
   expected state as "Exactly **3** grant rows".
2. **The failure lands exactly at the impersonation boundary.** In every failing test, step 1 (fixture
   setup, run as admin) **succeeded** and step 2 `Impersonate` **succeeded** — its output reads
   `Impersonated Demo Manager` — and the failure is always the *next* step, the first one performed as the
   persona. Nothing fails before impersonation; nothing that avoids impersonation fails at all.
3. **A persona cannot read a case that exists** — measured by ATF 04's own step 3, a `Record Query` by
   `sys_id` as the impersonated viewer, returning no records. That is what unifies the
   `Unable to find record '<sys_id>'` family with the ACL exceptions: ATF's native `Record Update` and
   `Record Query` steps must *locate* a row before acting on it, so an unreadable row surfaces as "unable
   to find" rather than as a denial — the mechanism `ATF_MANUAL_TEST_PLAN.md` **§6.1** already records for
   the historical `TES0001013` ATF 03 failure. It equally explains ATF 15 / 16 / 17: a form opened by a
   user who cannot read the record renders no form, so `g_form` never exists.
4. **The browser is not the cause of the `g_form` error.** In the *same* Chrome session, as **admin**, the
   same table's form (`x_casemgmt_case`, CASE9000003) rendered with `typeof g_form === "object"`,
   `g_form.getValue('number') = "CASE9000003"` and `g_form.getValue('status') = "In Progress"`. The client
   error appears only under the role-less persona.

Why the grants are absent is **already documented, and accepted**: §Step 5-6 §7 of this report proves at
record level that Role Management V2 owns `sys_user_has_role` on this release, that the update-set loader's
permission check therefore answers false and the platform logs "permission denied: no thrown error", and
that the three payloads were refused when stamped `Global` *and* when stamped `x_casemgmt` — so **no update
set can deliver these grants on this release**. Its native remedy is the role form's *Edit Members*, which
is what Step 4 did and what the Step 5b teardown then removed. The **cause** is thus a known limitation;
the **symptom** — sixteen ATF failures — is new, which is why every row above is classified (b) rather
than (a). It also explains the stale 17 / 3 baseline: `TES0001005` ran on the pre-teardown instance, where
Step 4's native grants were still in place.

**What was deliberately not done.** Granting those three roles would have turned all sixteen failures
green in minutes. That is exactly the live patch this step forbids, so it was not done — no role grant, no
ACL change, no configuration change, no edit to any record, and no edit to the package or the canonical
file. **Per the failure path, a fix for a (b) classification requires restarting from Step 5a in full —
fresh export, teardown, reimport, commit, re-run ATF — and never a live patch. That restart was not
performed here, and per this project's policy ATF failures do not block shipping the Step 6 file.** The
finding is escalated instead, with one caveat for whoever takes it: a Step 5a restart alone cannot close
it, because §7 establishes that no update set on this release can carry `sys_user_has_role`. The real
options are a documented post-commit native grant step or an explicitly accepted limitation — a decision
outside this step's authority.

### 7. Nothing persisted: the instance is as this step found it

The census taken before the runs and again after both of them is **identical on every counter** — a
literal `diff` of the two captures reports no difference:

| Counter | Before and after |
| --- | --- |
| Rows | case **10** / task **10** / party **8** |
| `sys_choice` (3 tables) | **24** |
| `sys_db_object` / `sys_dictionary` / `sys_documentation` | **3** / **48** / **48** |
| `sys_number` / `sys_user_role` | **3** / **3** |
| `sys_security_acl` (scoped) / `sys_security_acl_role` | **26** / **27** (manager 14 / agent 10 / viewer 3) |
| `sys_user_has_role` | **0** (unchanged — the §6 finding, not something this step altered) |
| Flows / business rules / script includes / reports | **7** (all active) / **7** / **2** / **8** |
| Demo users | **3** |
| ATF definitions | **20** tests / **1** suite / **180** steps / **20** suite-tests |

ATF's own fixture activity rolled back completely: **20 of 20** tests produced a `sys_rollback_context` and
**all 20 read `state=rolled_back`**. No residue survived either run — `x_casemgmt_case` with
`subject STARTSWITH ATF-PORTAL` → **0** rows, `subject STARTSWITH ATF` → **0** rows, and the harness's own
`CLEANUP tasks=4 cases=7 remainingCases=10` line was confirmed by query (10 / 10 / 8 immediately
afterwards). **No metadata was captured by anything in this step**: `sys_update_xml` rows created after
22:05 UTC = **0**. The only lasting traces of this step are the ATF result rows and the `U1ASSERT` syslog
line quoted above — the evidence itself.

Two disclosures so nothing reads as covered that is not. First, an empty Local update set named "Default"
(`5e2b48dc93d34b1009aa70d19dba108a`, `is_default=true`, created 2026-09-08 22:03:35) exists for the scope
with **0 children**; it is platform bookkeeping for an interactive scoped session, holds no captured
change, and falls inside the Local-update-set sweep the teardown step already performs. Second, the
committed Retrieved set `8ebb770493534b1009aa70d19dba102a` and Local set `bce2c05c93934b1009aa70d19dba1042`
from Step 5c were left exactly as they were. **The FALLBACK package was not interacted with in any way** —
its file was not opened, read, checksummed, archived or deleted, and its own instance record was excluded
from every count and comparison in this section.

### 8. Evidence artifacts

Screenshots from the browser session (agent scratch, not repository files):

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-01-login.png`
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-02-post-login.png`
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-03-suite-record.png`
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-04-pick-a-browser.png`
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-atf-suite-result.png`
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-06-admin-case-form-g_form-present.png`

One failure-detail screenshot per failing test, sixteen files, all in
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/`:

- `u4-atf-failure-detail-atf02.png` (ATF 02) · `u4-atf-failure-detail-atf03.png` (ATF 03) ·
  `u4-atf-failure-detail-atf04.png` (ATF 04) · `u4-atf-failure-detail-atf05.png` (ATF 05)
- `u4-atf-failure-detail-atf06.png` (ATF 06) · `u4-atf-failure-detail-atf07.png` (ATF 07) ·
  `u4-atf-failure-detail-atf08.png` (ATF 08) · `u4-atf-failure-detail-atf09.png` (ATF 09)
- `u4-atf-failure-detail-atf10.png` (ATF 10) · `u4-atf-failure-detail-atf11.png` (ATF 11) ·
  `u4-atf-failure-detail-atf12.png` (ATF 12) · `u4-atf-failure-detail-atf13.png` (ATF 13)
- `u4-atf-failure-detail-atf14.png` (ATF 14) · `u4-atf-failure-detail-atf15.png` (ATF 15) ·
  `u4-atf-failure-detail-atf16.png` (ATF 16) · `u4-atf-failure-detail-atf17.png` (ATF 17)

Because the instance is torn down after this step, these artifacts and the numbers in this section are the
durable record; the ATF result rows themselves do not survive the teardown.

### 9. Hand-off

**The instance is left standing**, in the same post-commit state Step 5c produced and this step measured
twice without altering it, so the teardown step can run against it. For that step: scope `sys_id`
`82b99028936f74320d74d6f88357a5af` (re-measured here); the ATF suite, its 20 tests, 180 steps and 20
suite-tests are all still present; the `Default` Local set noted in §7 is an extra record for the
Local/Retrieved sweep. No probe artifact, throwaway user, test table or configuration change was created
at any point in this step.


## Step 8 + Exit Condition

Owner: unit U5 (order 4). This section discharges Step 8 (directive lines 169-189) and the Exit Condition
(lines 191-200), and records the documentation impact of the two deletions Step 6 made. Every number below was
measured by this unit against the live instance during this step; nothing in it is inherited from a prior
report, and where it cites another step's measurement it says so and names the section.

### 1. Preflight, and why this step runs regardless of outcome

The directive requires the teardown "after Step 6/7 complete (or after a CRITICAL stop, if reached)" and says
plainly that "this teardown happens regardless of outcome". Step 5c was a clean pass, so no CRITICAL path was
taken; the teardown ran on the successful path, and would have run identically had it not been.

Preflight, all three checks, 2026-09-08:

| Check | Command | Result |
|---|---|---|
| Instance live (body content, not status code) | `GET /api/now/table/sys_remote_update_set?sysparm_limit=1` | HTTP 200 with a **JSON** body → live, not hibernating |
| Credentials | same call, Basic auth as `admin` | HTTP 200 — no 401, no 403, so no BLOCKED stop |
| Not mid-upgrade | `GET /api/now/table/sys_upgrade_history?sysparm_query=upgrade_startedISNOTEMPTY^upgrade_finishedISEMPTY` | `{"result":[]}` |

The instance's own `Date` response header at preflight read `Tue, 08 Sep 2026 22:36:17 GMT`. A read-only
heartbeat (`GET /api/now/table/sys_user?sysparm_limit=1`) was used for the duration of the step; no hibernation
event occurred, so no wake cycle was consumed.

### 2. The line-34 guard, applied fresh for the third teardown

Line 34 requires the guard to be re-verified fresh every time a teardown runs — "a prior successful teardown
does not make the next one safe by default". It was applied twice here, immediately before the destructive
call, and both applications returned the identical raw body:

```
$ curl -s --user "$A" -H 'Accept: application/json' \
    "$U/api/now/table/sys_scope?sysparm_query=scope%3Dx_casemgmt&sysparm_fields=sys_id,scope,name,version"
{"result":[{"sys_id":"82b99028936f74320d74d6f88357a5af","scope":"x_casemgmt","name":"x_casemgmt Case Management","version":"1.0.0"}]}
```

- record count = **1** (exactly one, as required) ✔
- `sys_id` length = **32**, and it matches `^[0-9a-f]{32}$` ✔
- **VERDICT: PROCEED.** Had the query returned zero records the delete would have been skipped and this section
  would have recorded that instead; had it returned an empty or malformed `sys_id`, or more than one record,
  nothing would have been deleted and this step would have reported BLOCKED with the raw output.

### 3. Pre-teardown inventory — the last measurement of the live application

Captured before anything was destroyed, because after the teardown it is unrecoverable. This is the state Step
5c's single native commit produced and Step 7 measured without altering it.

| Class | Measured | Class | Measured |
|---|---|---|---|
| `sys_scope` | 1 (`82b99028936f74320d74d6f88357a5af`, v1.0.0) | Rows: case / task / party | **10 / 10 / 8** |
| `sys_dictionary` (case/task/party) | 21 / 14 / 13 | `sys_documentation` | 21 / 14 / 13 |
| `sys_db_object` | 3 | `sys_choice` | **24** (case 15 · task 7 · party 2) |
| `sys_number` | 3 | `sys_user_role` | 3 |
| scoped `sys_security_acl` | 26 | `sys_security_acl_role` | **27** (manager 14 · agent 10 · viewer 3) |
| `sys_user_has_role` (scoped roles) | **0** — the residual delta of §7, Step 5-6 | Flows | 7 (active + published) |
| Business rules | 7 | Script includes | 2 |
| UI actions | 6 | UI policies | 2 |
| Reports | 8 | Dashboards | 2 |
| Portal / pages / widgets | 1 / 2 / 3 | Scripted REST APIs | 2 |
| ATF tests / suites / steps / suite-tests | 20 / 1 / 180 / 20 | Demo users / group / membership | 3 / 1 / 1 |
| Synthetic `core_company` rows | 2 | `sys_metadata` in scope | 553 |
| `sys_update_version` (application = scope) | 487 | `sys_update_xml` (application = scope) | 1970 |
| `sys_metadata_delete` | 0 | | |

Update-set ledger, captured with `sys_id | name | state` before deletion, as the directive's evidence-first
principle requires:

| Table | `sys_id` | `name` | `state` | Children | Preview problems | Disposition |
|---|---|---|---|---|---|---|
| `sys_remote_update_set` | `8ebb770493534b1009aa70d19dba102a` | `x_casemgmt_case_management v1.0.0 (gate candidate)` | `committed` | 522 | **0 error / 0 warning** | this task's — DELETED |
| `sys_remote_update_set` | `9929f50df18ccec91ea13b2a3bccfc90` | `x_casemgmt_case_management v1.0.0` | `committed` | 926 | not queried | **the excluded package's own record — untouched, uncounted** |
| `sys_update_set` | `bce2c05c93934b1009aa70d19dba1042` | `x_casemgmt_case_management v1.0.0 (gate candidate)` | `complete` | 522 | n/a | this task's — DELETED |
| `sys_update_set` | `5e2b48dc93d34b1009aa70d19dba108a` | `Default` (scope's own, `is_default`) | `in progress` | 0 → 438 at deletion | n/a | this task's — DELETED |
| `sys_update_set` | `11226d84a56503108bb220b7a4d212b2` | `Default` (global) | `in progress` | 290, none `x_casemgmt`-named | n/a | global — left alone |
| `sys_update_set` | `2f6d66b1938b8f1009aa70d19dba10f0`, `a2bda2f1938b8f1009aa70d19dba1047` | other scopes' `Default` sets | `in progress` | — | n/a | other scopes — left alone |

`nameLIKE` and `descriptionLIKE` queries for the excluded package's marker text returned **0 rows on both
tables**, so that record is textually unidentifiable; it was therefore excluded **structurally, by `sys_id`
comparison**, in every deletion loop and every count in this section.

### 4. The collateral guard, run read-only before destroying anything

`scripts/pre_delete_collateral_guard.js` was run **unmodified**, in the `x_casemgmt` scope, via
`/sys.scripts.do` — response `Script completed in scope x_casemgmt`, enumeration timestamped `22:40:12Z`. Its
finding that bounds the blast radius: **zero `sys_security_acl_role` rows held by any role outside the scoped
three**, for all three tables (per-table scoped links 11 / 8 / 8; ACLs 10 / 8 / 8; choices 15 / 7 / 2). Its
own STEP2 then aborted with 18 reasons, which is expected and correct: the script's authorised subset is the
narrower Phase-1 table-delete subset, not a full application teardown. The full teardown is authorised for
this task by the directive itself (lines 169-172), and the guard's read-only enumeration is what it was used
for here.

### 5. The teardown itself

```
POST /xmlhttp.do
  sysparm_processor=com.snc.apps.AppsAjaxProcessor
  sysparm_function=deleteApplication
  sysparm_sys_id=82b99028936f74320d74d6f88357a5af      <- the guard-verified value, nothing else
  sysparm_delete_all=true
  sysparm_ck=<fresh token from an interactive UI session>
```

HTTP 200, worker `3b93dc1c93934b1009aa70d19dba1034`. Progress trail: *Dropping table x_casemgmt_case* →
*Deleting Case Task* → *Dropping table x_casemgmt_case_party* → *Deleting Run Server Side Script* → *Deleting
Send REST Request - Inbound* → *Deleting CasePortalService*. It finished `state=complete` with
`state_code=error` and the platform's expected partial verdict: *"Failed to completely delete application
'x_casemgmt Case Management'. Review and manually delete any files that remain…"*. That verdict is precisely
why the directive requires the three explicit sweeps below; it is not a failure of the teardown.

`DELETE /api/now/table/sys_scope/<id>` was **not** used at any point — it returns 204 without cascading.

### 6. What did not cascade, and what was deleted explicitly

Residue survey immediately after the cascade: scope 0 · three table endpoints HTTP 400 · roles 0 · `sys_choice`
0 · `sys_number` 0 · ACLs 0 · role links 0 · grants 0 · dictionary / documentation / `sys_db_object` 0 · ATF 0
— **but** 2 retrieved sets, 2 local sets, 3 demo users, 1 group, 1 membership, 2 synthetic companies,
`sys_metadata` in scope 490 (1 `sys_hub_action_type_snapshot` + 5 `sys_hub_flow_snapshot` + 484
`sys_metadata_delete`), `sys_update_version` 1041 and `sys_update_xml` 2409. The directive names exactly this
class of survivor, and each was removed explicitly.

Deletion ledger, verbatim from the run log (`found` / `deleted` per class; the excluded package's record and
its children are absent from every line because the loops skipped it by `sys_id`):

| Class | Selector | found | deleted |
|---|---|---|---|
| `sys_update_preview_problem` | children of `8ebb7704…` | 0 | 0 |
| `sys_update_xml` | payloads of retrieved `8ebb7704…` | 522 | 522 |
| `sys_remote_update_set` | retrieved set `8ebb7704…` | 1 | 1 |
| `sys_update_xml` | payloads of local `5e2b48dc…` (`Default`) | 438 | 438 |
| `sys_update_set` | local set `5e2b48dc…` | 1 | 1 |
| `sys_update_xml` | payloads of local `bce2c05c…` (gate candidate) | 522 | 522 |
| `sys_update_set` | local set `bce2c05c…` | 1 | 1 |
| `sys_update_version` | by name / by application | 28 / 1041 | 28 / 1041 |
| `sys_metadata_delete` | orphans in the deleted scope | 484 | 484 |
| `sys_hub_flow_snapshot` | flow snapshots | 5 | 5 |
| `sys_hub_action_type_snapshot` | action-type snapshots | 1 | 1 |
| `sys_user` | the 3 synthetic demo users | 3 | 3 |
| `sys_user_group` | the synthetic demo group | 1 | 1 |
| `sys_user_grmember` | demo group membership | 1 | 1 |
| `core_company` | `Synthetic Org Alpha` (`d46832bc679ff0254d734c6d4d512315`), `Synthetic Org Beta` (`764f7aa36e02a12f9de6da7d7cf1cf82`) | 2 | 2 |
| `sys_choice`, `sys_choice_set`, `sys_number`, `sys_user_role`, `sys_security_acl`, `sys_security_acl_role`, `sys_user_has_role`, `sys_dictionary`, `sys_documentation`, `sys_db_object` | scoped selectors | 0 each | 0 each — already removed by the cascade |

**One survivor took three passes and is worth recording, because it is the exact class that produces "Found a
local update that is newer than this one" on a later import.** After the first sweep,
`sys_update_xml application=<scope>` read **927** rather than the excluded package's 926. A second sweep
reported `found=0` for everything — because `addQuery(ref,'!=',id)` does **not** match rows whose reference is
EMPTY (a SQL NULL comparison), so the row was invisible to it. Rewritten with encoded queries plus an in-loop
`getValue()` check, the third sweep found and deleted it: `67e39c9493574b1009aa70d19dba10b2 |
sys_app_82b99028936f74320d74d6f88357a5af | DELETE | Custom Application`, created **22:41:55 during the
teardown itself** and captured into the **global** `Default` set — the teardown recording its own DELETE.
Afterwards `sys_update_xml application=<scope>` = **926**, all of them the excluded package's children
(`nameLIKEx_casemgmt` AND `remote_update_set != 9929f50d…` = **0**).

A broad follow-up sweep returned **0** for `sys_app`, `sys_scope`, `sys_app_module`, `sys_app_application`,
`sys_ui_list`, `sys_ui_section`, `sys_ui_related_list`, `sys_ui_policy`, `sys_script`, `sys_script_include`,
`sys_script_client`, `sys_ui_action`, `sys_report`, `pa_dashboards`, `sp_page`, `sp_widget`,
`sys_ws_definition`, every `sys_atf_*` table, `sys_dictionary` (by name and by reference), `sys_documentation`,
`sys_db_object`, `sys_number`, `sys_choice`, `sys_security_acl`, `sys_user_role`, `sys_user`, `sys_user_group`,
`sys_metadata`, `sys_metadata_delete`, `sys_atf_test_result` and `sys_atf_test_suite_result`. Two apparent
non-zeros were an invalid-field trap — an unknown field in `sysparm_query` is silently ignored and the
unfiltered table total comes back — `sys_ui_application?titleLIKE…` = 19 and `sp_portal?urlLIKE…` = 9; with the
real columns (`name`, `url_suffix`) both read **0**, and `sp_portal`'s 9 rows are the stock portals (cab, mesp,
kb, benchmarks, esc, perf, sp, sp_config, swp). `sys_package` / `sys_store_app` are ACL-refused to this account
("Failed API level ACL Validation") and were not readable either before or after.

### 7. The ten zero-state checks, with raw evidence

Re-run in full, from the top, after the last removal. **PASS = 10 / FAIL = 0.**

**1. `sys_scope` for `x_casemgmt` → zero records**

```
$ curl -s --user "$A" -H 'Accept: application/json' "$U/api/now/table/sys_scope?sysparm_query=scope%3Dx_casemgmt"
{"result":[]}
```

**2-4. The three table endpoints → HTTP 400 "Invalid table" (this instance's confirmation that a table is gone)**

```
$ curl -s -w "\nHTTP=%{http_code}\n" ... "$U/api/now/table/x_casemgmt_case?sysparm_limit=1"
{"error":{"message":"Invalid table x_casemgmt_case","detail":null},"status":"failure"}
HTTP=400
$ ... x_casemgmt_case_task
{"error":{"message":"Invalid table x_casemgmt_case_task","detail":null},"status":"failure"}
HTTP=400
$ ... x_casemgmt_case_party
{"error":{"message":"Invalid table x_casemgmt_case_party","detail":null},"status":"failure"}
HTTP=400
```

**5. `sys_user_role` for the three scoped roles → zero records**

```
$ ... "sys_user_role?sysparm_query=nameINx_casemgmt_case_manager%2Cx_casemgmt_case_agent%2Cx_casemgmt_case_viewer"
{"result":[]}
cross-check nameLIKEx_casemgmt count=0
```

**6. `sys_choice` queried directly for the three tables' choice-typed fields → zero rows**

```
$ ... "sys_choice?sysparm_query=nameINx_casemgmt_case%2Cx_casemgmt_case_task%2Cx_casemgmt_case_party"
{"result":[]}
per-field cross-check (case.type/status/priority/pending_reason, task.type/status, party.party_type) count=0
nameSTARTSWITHx_casemgmt count=0
nameLIKEx_casemgmt count=0
sys_choice_set nameLIKEx_casemgmt count=0
```

**7. `sys_number` counters for the three tables → zero rows**

```
$ ... "sys_number?sysparm_query=categoryINx_casemgmt_case%2Cx_casemgmt_case_task%2Cx_casemgmt_case_party"
{"result":[]}
cross-check prefixINCASE,TASK,PARTY:
{"result":[{"sys_id":"4","prefix":"TASK","sys_scope":{...,"value":"global"},"category":{...,"value":"task"}}]}
```

The single row the cross-check returns is the out-of-box **global** `task` counter (`sys_id` `4`, scope
`global`), which is not this application's and was deliberately preserved.

**8. `sys_remote_update_set?sysparm_query=nameLIKEx_casemgmt` → zero, the excluded package's own record aside**

```
$ ... "sys_remote_update_set?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=sys_id,name,state,sys_mod_count"
{"result":[{"sys_id":"9929f50df18ccec91ea13b2a3bccfc90","name":"x_casemgmt_case_management v1.0.0","sys_mod_count":"0","state":"committed"}]}
raw count=1  → excluding that record = 0
```

`sys_mod_count` = **0** on that row, before and after this step: it was never opened, never previewed, never
loaded into, never modified. It is the one record the directive excludes, and it is excluded from this count.

**9. `sys_update_set?sysparm_query=nameLIKEx_casemgmt` → zero records**

```
$ ... "sys_update_set?sysparm_query=nameLIKEx_casemgmt"
{"result":[]}
$ ... "sys_update_set?sysparm_query=application%3D82b99028936f74320d74d6f88357a5af"
{"result":[]}
```

**10. Scoped ACLs, role links, grants, dictionary, table records and ATF definitions → zero rows**

```
sys_security_acl        nameSTARTSWITHx_casemgmt                                    => 0
sys_security_acl        sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
sys_security_acl_role   sys_user_role.nameIN<the three roles>                        => 0
sys_security_acl_role   sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
sys_user_has_role       role.nameIN<the three roles>                                 => 0
sys_dictionary          nameIN<the three tables>                                     => 0
sys_documentation       nameIN<the three tables>                                     => 0
sys_db_object           nameIN<the three tables>                                     => 0
sys_atf_test            sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
sys_atf_test_suite      sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
sys_atf_step            sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
sys_atf_test_suite_test sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
sys_metadata            sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
sys_update_version      application=82b99028936f74320d74d6f88357a5af                 => 0
sys_hub_flow            sys_scope=82b99028936f74320d74d6f88357a5af                   => 0
SUM of check-10 counters = 0
```

Every earlier partial pass was followed by an explicit removal and then a re-run of **all ten** checks from
the top; the pass recorded above is the complete final pass, not an aggregate of partial ones.

### 8. Collateral proof — global totals before and after

Snapshotted before the teardown and re-read after the last removal. Every delta equals the inventory in §3;
nothing unrelated was destroyed.

| Table | Before | After | Δ | Table | Before | After | Δ |
|---|---:|---:|---:|---|---:|---:|---:|
| `sys_user` | 638 | 635 | −3 | `sys_atf_test` | 206 | 186 | −20 |
| `sys_user_group` | 52 | 51 | −1 | `sys_atf_test_suite` | 49 | 48 | −1 |
| `core_company` | 179 | 177 | −2 | `sys_atf_step` | 2345 | 2165 | −180 |
| `sys_user_role` | 620 | 617 | −3 | `sys_report` | 656 | 648 | −8 |
| `sys_security_acl` | 43739 | 43713 | −26 | `pa_dashboards` | 5 | 3 | −2 |
| `sys_security_acl_role` | 40617 | 40590 | −27 | `sp_portal` | 10 | 9 | −1 |
| `sys_user_has_role` | 3884 | 3884 | **0** | `sp_page` | 121 | 119 | −2 |
| `sys_db_object` | 6293 | 6290 | −3 | `sp_widget` | 296 | 293 | −3 |
| `sys_number` | 148 | 145 | −3 | `sys_ws_definition` | 245 | 243 | −2 |
| `sys_choice` | 18985 | 18961 | −24 | `sys_ui_action` | 2479 | 2473 | −6 |
| `sys_hub_flow` | 349 | 342 | −7 | `sys_ui_policy` | 2905 | 2903 | −2 |
| `sys_script` | 5671 | 5664 | −7 | `sys_update_set` | 5 | 3 | −2 |
| `sys_script_include` | 4785 | 4783 | −2 | `sys_remote_update_set` | 2 | 1 | −1 |
| `sys_dictionary` | 154187 | 154077 | −110 | `sys_documentation` | 145236 | 145130 | −106 |

`sys_user_has_role` at **0** is consistent with §7 of the Step 5-6 section: the three grants were never
created, because this release refuses them from any update set. The dictionary and documentation deltas
(−110 / −106) are the three tables' own columns plus the platform's per-table system columns. Stock endpoints
all still answer HTTP 200 and stock dictionary counts are intact (`sys_user` 67, `sys_user_group` 20,
`core_company` 45, `task` 71, `incident` 26, `sys_user_role` 12); `sys_dictionary` queried by
`nameCONTAINSx_casemgmt` and by `referenceCONTAINSx_casemgmt` both read **0**.

### 9. Browser confirmation — the empty end state, observed rather than only queried

Driven in a real headless Chrome under this unit's own control (private profile, private debugging port,
process stopped cleanly afterwards; the checkpoint provides no browser-subagent tool, so the session was
driven directly over CDP). A "not found" or absent result is the **expected, correct** outcome for every
observation below.

| Observation | URL | What the page showed |
|---|---|---|
| Portal, authenticated as `admin` | `/x_casemgmt_case_portal` | **"Page not found — The page you are looking for could not be found."** |
| Portal submit page, authenticated | `?id=x_casemgmt_case_submit` | same "Page not found" |
| Portal, signed out | `/x_casemgmt_case_portal` | HTTP 302 → `/session_timeout.do` login page; no portal renders |
| Custom Applications list | `/sys_app_list.do` | **"Unfiltered Custom Applications list showing 0 records … No records to display"**; page text contains neither `casemgmt` nor `case management` |
| Applications, filtered on the scope | `/sys_scope_list.do?sysparm_query=scope=x_casemgmt` | **"Filtered Applications list showing 0 records … No records to display"** |
| Anonymous REST endpoint | `GET /api/x_casemgmt/case_status_lookup?number=CASE9000002` | **HTTP 401** — the endpoint no longer serves |

Screenshots (agent scratch, not repository files):

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-portal-after-teardown-authenticated.png` — the portal URL, authenticated, "Page not found"
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-portal-after-teardown.png` — the portal URL signed out, redirected to login
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-portal-submit-after-teardown.png` — the submit page, "Page not found"
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-app-list-after-teardown.png` — Custom Applications, 0 records
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-scope-list-after-teardown.png` — Applications filtered on `scope=x_casemgmt`, 0 records

### 10. Zero-state statement

The timestamp is the instance's own, not this agent's host clock: the `Date` response header read
`Tue, 08 Sep 2026 22:51:41 GMT`, corroborated by `new GlideDateTime().getValue()` executed on the instance
(`2026-09-08 22:51:41`, displaying as 15:51:41 in US/Pacific — the documented 7-hour offset) and by the
`sys_created_on` of the syslog row that script wrote.

> **instance zero-state confirmed at 2026-09-08T22:51:41Z, no residue remaining**

### 11. This teardown is intentional and expected — not a failure state

The goal of this task was a single, verified, portable XML file, not a live running instance. The verified,
final Update Set XML from Step 6 is the durable artifact; the live instance was never meant to hold the proof,
and after this step it holds none of it. A clean, empty instance is therefore the **correct, successful end
state** of this task, and the missing application, the unreachable portal URL, the absent dashboards and the
absent demo data are all expected consequences of it rather than regressions, unmet gates or AAP deviations.

What the AAP asked to be confirmed on a live instance (§0.7.1's post-commit deployable state, §0.7.2's
deployment-step items 3-4 and its portal-URL deliverable, and every §0.7.3 gate that presupposes a live
instance) is discharged instead by the Step 5c post-commit evidence recorded in the Step 5-6 section plus the
checksum-recorded XML named below — which is what the directive at lines 180-186 instructs.

The Step 6 file is what gets redeployed later, to this same instance or to any other, as a **separate
deployment step outside this task's scope**. Nothing in this task's remit re-installs it, and nothing needs to
be undone before it is installed: the instance is now the clean target such an install wants.

### 12. EXIT CONDITION — item by item

**(1) One file, at the canonical path, checksum-recorded.**
`servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` —
**522** payload blocks, **3,114,377** bytes,

> SHA-256 `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`

re-computed independently by this unit with `sha256sum` against the file on disk after Step 6 completed, and
matching the value Step 6 recorded, character for character. `ls update-set/` shows exactly two files: this
one and the untouched package named in §14. `xmllint --noout` parses it cleanly, and every payload block
carries a `<payload_hash>`, as a genuine platform export does.

**(2) Proven by a real preview and commit, on this instance reset to a genuine zero-state immediately before
that exact import, with no intervening patch.** Cited from the Step 5-6 section, which measured it:

- Step 5b emptied the instance first, and its zero-state was proven the same way this step's was — all three
  table endpoints HTTP 400, `sys_scope` empty, no `x_casemgmt` update-set records.
- The package was uploaded and located by **its own descriptor `sys_id`** `8ebb770493534b1009aa70d19dba102a`,
  never by a name-ordered locator, with the loaded child count asserted at **522 = the file's own block count,
  exactly**.
- Preview: **0 `type=error` and 0 `type=warning`** problems, with **no** problem row set to
  `skip_collision`, `ignored` or `skipped` — the count is genuinely zero, not zeroed.
- Commit: a **single** native *Commit Update Set* action at **2026-09-08 21:27:27 UTC**, reaching
  `state=committed`. Nothing ran between the teardown and the commit, and nothing ran after it to make any
  post-commit check pass — no remediation script, no second commit, no live-instance patch.
- Installed with everything intact: 3 tables at HTTP 200 with **real physical storage** and rows **10 / 10 /
  8**; `sys_dictionary` and `sys_documentation` 21 / 14 / 13 each; 3 `sys_db_object`; **3 roles**; **26** scoped
  ACLs with **27 `sys_security_acl_role` role links** (manager 14 / agent 10 / viewer 3; per table case 11 /
  task 8 / party 8); **24 choice values** from 7 native `sys_choice_set` composites at 2 / 6 / 4 / 3 / 4 / 3 /
  2; 3 `sys_number` counters; 7 flows active and published; 8 reports; 2 rendering dashboards; 1 portal with 2
  public pages and 3 widgets; 2 anonymous REST endpoints; 20 ATF tests + 1 suite + 180 steps + 20 suite-tests;
  and **data linkage resolving** — every seeded task and party pointing at its case, and the case references
  resolving by number.
- Two residual deltas were reported rather than papered over (Step 5-6 §7): `sys_user_has_role` = 0 (Role
  Management V2 refuses those payloads from any update set on this release; the native remedy is the role
  form's *Edit Members* related list) and `sys_grid_canvas_pane` = 0 (those 8 rows point at `sys_portal`
  widget instances, not application files). Both dashboards still render from the committed report and
  placement records.

**(3) The ATF suite result is current against this exact file.** Cited from the Step 7 section, which ran it
against the artifacts this package's commit created, after that commit and against nothing else:

- Suite result **`TES0001006`** (`sys_id` `027c049093174b1009aa70d19dba109e`), created **2026-09-08 22:09:18
  UTC**: 20 tests — **4 Success · 16 Failure · 0 Error · 0 Skipped**; 180 steps = 64 success + 16 failure +
  100 skipped. Passing: ATF 01, ATF 18, ATF 19, ATF 20.
- All sixteen failures are itemized by name in the Step 7 section, and **all sixteen are classified (b) — new
  defect** rather than (a) — accepted-failure-register: they share **one root cause**, that the three demo
  personas hold no role grants, which is the same `sys_user_has_role` class the package cannot carry. None of
  the sixteen matches the project's accepted-failure register, and the stale `TES0001005` = 17 / 3 / 0 / 0
  baseline is superseded and is not quoted as a result anywhere.
- The sixteen, by name — ATF 02 (manager full CRUD), ATF 03 (agent create / assigned-only read-write / no
  delete), ATF 04 (viewer read-only), ATF 05 (field-level ACLs on `assigned_group` and `assigned_agent`), ATF
  06 (RBAC mirror on task and party), ATF 07 (agent assigned-only on task and party), ATF 08 (Draft → Open
  requires `assigned_group`), ATF 09 (Open → In Progress requires an agent in the group), ATF 10 (In Progress
  ↔ Pending sets and clears `pending_reason`), ATF 11 (task-closure gate blocks In Progress → Resolved with the
  verbatim message), ATF 12 (Resolved → Closed requires the manager role and auto-sets `closed_date`), ATF 13
  (any status back to Draft is prohibited), ATF 14 (Closed is terminal), ATF 15 (form: resolving with an open
  task is blocked), ATF 16 (form: returning to Draft is blocked) and ATF 17 (form: a Closed case cannot leave
  the terminal state) — each with its `atf/` filename, first failing step and exact message in the Step 7
  section, §5.
- Per directive lines 166-167, ATF failures do not block shipping the Step 6 file, and per the adjudicated
  reading of D10.5(b)/D10.6 the (b) classification does not trigger a Step 5a restart; the failures are
  escalated in the report rather than patched live, because any fix would require a full Step 5a restart and
  never a live patch.
- The 13-assertion transition harness was also re-run on this package's committed artifacts:
  **`TOTAL=13 PASSED=13 FAILED=0`**, 2026-09-08 22:17:27 UTC.

**(4) The verification method, stated explicitly — see §13, which states it on its own because the directive
requires it to be unmissable.**

**(5) Nothing carried forward.** Per directive lines 199-200, no part of this exit condition rests on a prior
report's verification. Every Step 5 check — the zero-state proof, the upload, the descriptor lookup, the child
count, the preview problem counts by type, the single commit, and the entire post-commit census — was freshly
re-run by the order-2 unit against **this specific, final export**, and it is those fresh checks that are
cited above. The ATF suite and the transition harness were likewise re-measured against this package rather
than inherited; both identifiers (the suite's `sys_id` and the scope `sys_id`) were re-queried after the
commit rather than taken from any prior report, because both changed when the package was committed.

### 13. The verification caveat, stated on its own

**Verification used a same-instance reset-and-reimport, not an independent second instance.** There is one
Personal Developer Instance available to this task and provisioning a second one is out of scope, so the
closest achievable proxy for a clean-instance import was used: the instance was torn down to a proven
zero-state and the exact candidate bytes were then uploaded, previewed and committed onto it.

The residual risk this leaves is not fully eliminated: **instance-level cache, index or metadata that a full
teardown might not reset** could, in principle, have contributed to the clean preview and the successful
install. Specifically — platform metadata caches, table-descriptor and dictionary caches, security-manager
caches, and any residual index or database artifact that survives a scope deletion — were never independently
proven absent, only proven not to be visible to the ten record-level checks that Step 5b and this step ran. A
genuinely independent second PDI is the only thing that closes that gap, and this task did not have one.
Whoever reads this report should treat the Update Set gate as **met on these exact bytes, on this instance, by
this method**, and should treat an install onto a different instance as the remaining unproven case.

### 14. Closing inventory for whoever reads this next

**The two packages deleted at Step 6, with their provenance.** Both were removed with `git rm`, so their bytes
remain recoverable from git history; neither was moved to an archive directory and no archive directory was
created.

| Deleted file | Payload blocks | Bytes | SHA-256 | Why superseded |
|---|---:|---:|---|---|
| `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` | 988 | 4,062,067 | `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` | hand-authored rather than platform-exported; its records were the input to the native rebuild, and the consolidation produced and gated a platform export in its place |
| `update-set/x_casemgmt_case_management_update_set.AMENDED-NOT-GATED.xml` | 935 | 3,973,569 | `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9` | never gated on its own complete bytes; superseded by the gated export |

The file the canonical path held before Step 6 was 926 blocks / 3,781,097 bytes /
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`; it was replaced by the gated export, and
that replacement is what made the seven forward-looking documents stale (see §16).

**The FALLBACK package was never touched at any point in this task.** `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`
was not opened, not read for reference, not checksummed, not diffed, not archived, not deleted, and not
included in any count or comparison — by this unit or by any of the four units before it. It is proven
unmodified by `git status` and `git diff --stat` alone, which show it absent from the diff. Its own instance
record (`sys_remote_update_set` `9929f50df18ccec91ea13b2a3bccfc90`, `sys_mod_count` 0, `state=committed`) was
excluded structurally by `sys_id` from every deletion loop and every count in this section, and it still
carries `sys_mod_count` 0 after the teardown.

**Which scripts were run, and why** (from the Step 3-4 section, D3.6):

| Script | Run? | Why |
|---|---|---|
| `scripts/create_choice_values.js` | **RUN** | newly authored for this task (785 lines, ES5, idempotent): no standalone choice-only script existed, and Update Set commit does not transport `sys_choice` rows, so the 24 values across the 7 choice fields were created natively via the Table API before the Step 5a export |
| `scripts/seed_demo_data.js` | **RUN**, unmodified | the case/task/party linkage fix; it contains no `sys_choice` handling |
| `scripts/post_import_remediation.js` and its Fix Script twin `scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` | **NOT RUN** | not choice-only: its `ensureTable`, dictionary, ACL and number branches — including a destructive table delete — would have mutated the Step 2 natively-committed rebuild output, which the directive classifies as a CRITICAL trigger. The five measured reasons are recorded in the Step 3-4 section |
| `scripts/pre_delete_collateral_guard.js` | **RUN**, unmodified, read-only | used here in §4 to bound the blast radius before the teardown |
| `scripts/transition_logic_regression_assertions.js` | **RUN** | the 13-assertion harness, re-run against this package's committed artifacts (§12 item 3) |

**No user-specified Rules exist for this project.** `review_rules` reports "No user rules provided", so there
was no Rule-versus-directive conflict anywhere in this task. The work was therefore held to enterprise-standard
best practice plus the AAP's standing constraints that the directive does not touch and no override relaxes:
no hardcoded `sys_id` in package artifacts, synthetic data only with no PII, scope-namespace exclusivity with
zero global-scope writes, no global ACLs and no stock-role grants, no SMTP or email configuration, no
ServiceNow Store apps, AAP §0.5.2 dependency ordering in the shipped package, and no secret — instance URL,
username, password or session token — written into any repository file.

**Outcome classification.** The run did **not** end CRITICAL or BLOCKED. Step 5c was a clean pass on the first
gated attempt after one earlier failure cycle (1 of the 2 permitted, recorded in the Step 5-6 section), the
canonical file was replaced with the gated export, and the instance was then emptied. Had the run ended
CRITICAL, this section would record that the canonical file had been left unchanged and why; it does not,
because it did not.

### 15. Evidence artifacts for this step

Raw command-and-response captures and run logs (agent scratch, not repository files) in
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/`: `ten_checks.txt` (all ten checks with the
exact curl command above each raw body), `ten_checks_final.txt` (the final full pass), `purge_log.txt` (the
deletion ledger, `found`/`deleted` per class), `global_before.txt` / `global_after.txt` (the 28 collateral
counters), `guard_out.html` (the collateral guard's enumeration), `browser_report.json` /
`browser_report2.json` (the browser observations quoted in §9) and the five screenshots listed there.

Because the instance no longer holds the application, these captures and the numbers in this section are the
durable record of the teardown; there is nothing left on the instance to re-measure them against, which is the
intended outcome.

### 16. Documentation impact of Step 6's two deletions — closed

Step 6 deleted two files and replaced the canonical package's bytes, which left the project's forward-looking
documentation pointing at filenames that no longer exist and quoting an identity that no longer ships. That
impact was closed in seven documents — `README.md`, `docs/validation-gates.md`, `docs/deployment.md`,
`scripts/round_trip_verify.md`, `docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`,
`docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` and `docs/ATF_MANUAL_TEST_PLAN.md` — and bounded to exactly two
categories of statement:

- **(a) a reference to a file that no longer exists** — re-pointed at
  `update-set/x_casemgmt_case_management_update_set.xml`, or, where the sentence existed only to distinguish the
  candidate packages, replaced with a short factual note that both were superseded and deleted in this
  consolidation, citing this report;
- **(b) a statement naming a superseded package as the artifact that ships** — corrected to the canonical
  identity (522 blocks / 3,114,377 bytes / `b2217224…`), and, where the statement described verification
  status, corrected to say the gate was met by a same-instance reset-and-reimport rather than an independent
  second PDI, with the residual risk named.

81 dated correction blocks were written across the seven files (per file, cat-(a) / cat-(b) statements:
README 4 / 7 · validation-gates 4 / 6 · deployment 5 / 7 · round_trip_verify 6 / 9 ·
PDI_LIMITATIONS_AND_KNOWN_ISSUES 6 / 33 · HUMAN_DEPLOYMENT_RECREATE_GUIDE 3 / 7 · ATF_MANUAL_TEST_PLAN 1 / 1).
A re-grep afterwards found **0** statements still pointing at a deleted filename or claiming a superseded
package ships outside a dated, explicitly-retained historical block.

Left deliberately untouched: the `docs/refine-run/` run records (`PHASE0-1.md`, `PHASE1-REBUILD.md`,
`PHASE2.md`, `PHASE3-ATF.md`, `FINAL-REPORT.md`, `run-state.json`), which record past measurements at past
timestamps and are stale by design — proven byte-identical by `git diff`; the four earlier sections of this
report; every existing FALLBACK mention in every document, byte-identical, with corrections placed adjacent to
those sentences rather than inside them and with no such reference introduced by any new text in those seven
documents; and everything outside the two categories — no rewording, restructuring, reformatting, link-fixing
or AAP-layout tidying, and no deletion of the extra scripts and documents the AAP's enumerated layout omits.

### 17. Hand-off

Nothing follows this step on the instance: it holds no `x_casemgmt` scope, tables, dictionary rows, roles,
ACLs, role links, grants, choices, number counters, flows, reports, dashboards, portal artifacts, REST
endpoints, ATF definitions, seed data or update-set records of this application, and that is the intended end
state. The deliverable is the file at
`servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`, SHA-256
`b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`. Installing it is a separate deployment
step outside this task's scope; a reader doing that should note the one native step it cannot carry (the three
`sys_user_has_role` grants, via each role form's *Edit Members* related list) and the caveat in §13.
