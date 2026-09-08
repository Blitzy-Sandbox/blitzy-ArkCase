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

## Step 7 — ATF suite and transition harness

## Step 8 + Exit Condition
