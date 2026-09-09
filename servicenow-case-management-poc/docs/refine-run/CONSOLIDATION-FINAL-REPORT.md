# Update Set Consolidation — Final Report

## CR1 amendment — read this before any identity figure below

Code review checkpoint **CR1** examined the package this report describes and raised seven findings
against it. Six were defects in the shipped bytes and five were inaccurate or unauthorised statements
in this report. Both sets were resolved on 2026-09-09, so **the bytes at the canonical path are no
longer the ones §1 and §8 below measure**:

| Property | Pre-amendment (what §1/§8 measure) | Shipping now |
| --- | --- | --- |
| Payload blocks | 522 | **522** (four removed, four added) |
| Bytes | 3,114,377 | **2,994,341** |
| SHA-256 | `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` | **`751ceb61215f1207a7496693820007b5cd6ab1b43ce4cceed4e80f3208e72d4a`** |

The seven amendments, each traceable to the finding it answers:

1. **F01** — the three `sys_user_has_role` payloads were **removed**. Role Management V2 refuses them
   on this release (§7 proved it), so their only effect was to make an otherwise clean commit report
   "Failed at 100% — some updates failed to commit" and log three skipped rows. The manual sequence a
   deployer can run instead is written out in
   [`../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5h](../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md), and the
   capability gap is recorded as blocking in
   [`../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).

   > **CORRECTION 2026-09-09 (code review CR2, finding F09) — this is a BLOCKED gate, not a gate met
   > by "the package plus one step".** Removing the refused payloads was right, and every measurement
   > behind it stands. The **verdict** drawn from it did not. Access control has two halves and they
   > must be reported separately:
   >
   > - **Schema half — PROVEN, from one commit.** 26 scoped `sys_security_acl` records and **27 of 27**
   >   `sys_security_acl_role` links (manager 14 / agent 10 / viewer 3) install from the single Step 5c
   >   commit, with no remediation script run and no second commit (§4 of Step 5-6).
   > - **Assignment half — BLOCKED PLATFORM CAPABILITY GAP.** The **3** `sys_user_has_role` grants do
   >   **not** transport by any update set on this release — proven at record level, both stampings
   >   refused (§7 of Step 5-6). Post-commit `sys_user_has_role` for the three demo personas read
   >   **0**.
   >
   > A gate that requires a manual write **after** the commit is not met by the deliverable. So
   > **AAP §0.7.3's Gate 3 (ACLs — "case_viewer cannot write; case_agent cannot access unassigned
   > cases; case_manager has full access") and AAP §0.7.4's "3 users (one per role)" are
   > UNSATISFIED** by the shipping package, and no statement in this report may read as though they
   > pass. The §5h sequence is a deployer's workaround for a blocked capability, recorded so a
   > recipient is not stranded — it is **not** evidence of satisfaction. Per AAP §0.7.2's
   > Minimal-Change Clause and §0.3.2's closing bullet, a capability gap PDI cannot address is
   > **reported**, not worked around; reporting it is the resolution, and no new delivery mechanism is
   > proposed here (a scoped Fix Script was removed by CR1; a scoped Business Rule writing the global
   > `sys_user_has_role` table would need cross-scope privilege and would be an ongoing artifact the
   > AAP does not enumerate).

2. **F04** — the `sys_script_fix` payload was **removed**. It was the only payload in the package
   carrying `sys_package`/`sys_scope` = `global`, and by its own description an installed copy cannot
   complete its work because the commit engine rewrites a committed record's scope. The body remains
   at `../../scripts/post_import_remediation.js` for the Global Background Script route, and the
   record definition at `../../scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` is now
   stamped `x_casemgmt` and marked as a retained, unshipped reference.
3. **F02** — the eight `sys_grid_canvas_pane` placements were **restored**, as two self-contained
   bundles that also carry the eight `sys_portal` widget instances they reference (see the correction
   in §6 fix (2) below).
4. **F06** — the anonymous-submission ceiling in `CasePortalService` is no longer a count-then-insert
   check. It counts the window with the persisted row among it and withdraws that row when the count is
   over the ceiling, and it now has
   a per-requester fairness cap.
5. **F07** — the anonymous lookup gained strict `^CASE[0-9]{7}$` validation ahead of any query,
   per-session sliding-window throttling, an HTTP 429 path through the REST operation and the widget,
   and abuse monitoring under a stable log marker; the widget's false "no case-number enumeration
   oracle exists" claims were replaced with the honest statement of that exposure.
6. **F06/F07** — two scoped `sys_rate_limit_rules` payloads were **added**, as the platform-native
   per-hour ceiling on the unauthenticated caller for each anonymous REST resource.
7. **F03** — every block was **reordered** into the AAP §0.5.2 dependency tiers (application → tables
   → dictionary → labels → choices/numbers → roles → ACLs → ACL-role links → script includes →
   subflows → parent flows → business rules → UI → REST → rate limits → portal → reports → dashboard
   graph → ATF → seed data). No payload byte changed in the reorder: the sha256 over the sorted set of
   payload texts is identical before and after.

8. **F06 (fix review)** — the admission ceiling now **counts** the window with the inserted row among
   it rather than ranking that row inside it. A rank bounds the window only for a caller whose query
   sees all of it: a caller seeing a prefix ranks itself near the front and admits, and a run of
   inserts in descending `sys_id` order admitted 14 of 14 against a ceiling of 10 when measured. A
   count cannot do that — of any set of survivors, the one that counted last necessarily saw every
   other survivor. Re-verified on the shipped payload body across 3,000 random schedules under both
   delete-visibility models (29 of 29 assertions).
9. **F03 (fix review)** — the two pane bundles added in item 4 were sorting at their *first* record's
   tier (`sys_portal`), which put them ahead of the `sys_grid_canvas` rows their panes reference. A
   bundle applies as one unit and now sorts at its most dependent member's tier, and the ordering
   check was strengthened into a real reference check that resolves every in-package reference against
   the block defining it.
10. **F05 (fix review)** — the two `sys_rate_limit_rules` artifacts no longer describe the stock `guest`
    `sys_id` they carry as "a considered exception"; it is stated as a violation of AAP §0.7.2 and
    counted inside the blocking gap in `../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.CR1.2.
11. **F07 (fix review)** — the lookup guard's own concurrency residue (an unlocked read-append-write on
    session client data) and its cookie-rotation bypass are now recorded in the code, in
    `../portal-pages.md` and in the limitations register, with the native rate-limit rule named as the
    perimeter and its effectiveness marked unverified.

**The eight `sys_portal` rows the pane bundles carry are value-identical to the ones already nested in
the two `sys_portal_page` composites** — same `sys_id`s, same ten fields, same values, verified
field-for-field — so the second `INSERT_OR_UPDATE` of each is a no-op update rather than a conflicting
write. The bundles omit the 96 `sys_portal_preferences` children, which the page composites already
carry. The bundles were assembled from the exported records rather than captured from a re-configured
instance, which is why the pane restoration is listed among the items the mandatory pre-release gate in
`../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.CR1.6 has to settle.

Two consequences a reader must carry into everything below:

- **Every `522` / `3,114,377` / `b2217224…` figure in the rest of this report describes the
  pre-amendment bytes.** They are retained as provenance, not restated as the shipping identity.
- **The amended bytes have not been previewed or committed on an instance.** The PDI is deliberately
  at its torn-down zero state and this checkpoint made no instance writes, so §4's gate evidence
  belongs to the pre-amendment bytes. A recipient MUST run the preview gate in
  [`../deployment.md`](../deployment.md) — upload, preview, zero `type=error` and zero `type=warning`
  — before committing. What was verified statically on the amended bytes: `xmllint` clean; all 522
  payloads parse; 522 unique block names and no stray root `sys_id`; one sane descriptor whose
  `inserted`/`summary` equal 522; zero `global` scope stamps anywhere; every one of the 122 embedded
  script bodies parses and is ES5-conformant; every reference inside the restored pane bundles
  resolves to a record the same package carries; and the dependency-order assertion passes.

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
candidate was excluded **structurally and before enumeration**, not by convention and not by
subtraction. The predicate, stated rather than described, and null-safe:

```
enumerate row  ⇔  sys_id is empty OR sys_id != 9929f50df18ccec91ea13b2a3bccfc90
```

i.e. `addQuery('sys_id','!=',X).addOrCondition('sys_id','ISEMPTY')`. **Why the OR term is required:**
`addQuery('sys_id','!=',X)` alone is a SQL `<>` comparison and therefore does **not** match a
NULL-valued row, so a row with an empty key would be invisible to the sweep rather than excluded from
it — this report's own Step 8 survivor hunt (§6 of Step 8) was caught by exactly that trap on a
reference column. Where a loop enumerated a fixed set of ids instead, the excluded id was filtered
client-side with an explicit `getValue()` comparison, which has the same null-safety property.

**CORRECTION 2026-09-09 (code review CR2, finding F07).** The row for the excluded record previously
published its child count, its preview-problem counts and its state alongside the word "EXCLUDED".
Reading a record's metrics is not the same as not counting it, so those figures are **removed**: this
table now reports only the predicate and the **task-owned** rows it enumerated — **task-owned count =
10**, every one of them listed and deleted below. Nothing below is a raw
total minus the excluded record. (This concerns only `9929f50d…`. The `…SETUP-GATE-PROBE` record
`4a3338771c4045e08d557ac4da77d15f` is a different case entirely — capturing its identity, state, child
count and problem counts **before** deleting it was required and authorized, and those figures stay.)

| `sys_id` | name | state | children | error / warning problems | action |
|---|---|---|---|---|---|
| `9929f50df18ccec91ea13b2a3bccfc90` | — not read — | — not read — | — not read — | — not read — | **EXCLUDED STRUCTURALLY by the predicate above, before enumeration — never opened, never counted; no property of it is published as a measurement of this work** |
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
| 8 | `sys_remote_update_set`, `nameLIKEx_casemgmt` **with the §5 exclusion predicate applied in the query** (`^sys_idISEMPTY^ORsys_id!=9929f50df18ccec91ea13b2a3bccfc90`) | `{"result":[]}` — **task-owned residue 0**. *(CORRECTED 2026-09-09, CR2 F07: this cell previously read "1 record, and it is the excluded FALLBACK candidate ⇒ effective residue 0". A subtraction is not an exclusion; the predicate is applied before the count, and the excluded record's own properties are not published here.)* | **PASS** |
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

**CORRECTION 2026-09-09 (code review CR2, finding F07).** This section previously closed: *"Verified
after all work: that record is still `state=committed` with `sys_mod_count=0` and still 926 children —
bit-for-bit as found."* Those figures are **removed**. Interrogating the excluded record's state,
modification counter and child count is itself a form of counting it, which is the one thing the
no-touch constraint forbids. What is reported instead, and all that is reported:

- **The exclusion predicate**, applied structurally and before every enumeration (stated in §5 above):
  `sys_id is empty OR sys_id != 9929f50df18ccec91ea13b2a3bccfc90`, null-safe by the explicit
  `ISEMPTY` OR term.
- **The task-owned counts** that survive that predicate — 0 in every sweep and every zero-state check.
- **An id-only existence probe** confirmed the record survived the sweeps, reading no field of it.

The identification reasoning above this note is deliberately retained: the no-touch constraint requires
the candidate to be identified **without opening the file**, and that reasoning is how it was. It is
only the counts derived from it that are withdrawn. File-level non-modification is evidenced where it
belongs — by aggregate `git status` and `git diff --stat`, which show the file absent from the diff.

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
`g_user: <configured administrator> | System Administrator` (the login identifier is redacted per
CR2 F11; it is the account named by `SERVICENOW_INSTANCE_ADMIN_USERNAME`). Navigated to
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

`servicenow-case-management-poc/scripts/create_choice_values.js` — ES5-only (verified by a
comment- and string-stripping scan: zero `let`/`const`/arrow/backtick/`class`/`for-of` in the
executable body; the backticks that appear in the file are markdown quoting inside the header
comment). `node --check` passes. *(CORRECTED 2026-09-09, CR2: a line count stood here and has been
removed — it goes stale the moment the file is edited, and it describes nothing a reader needs. The
script's behaviour is what matters and is described below and in its own header comment.)* **Zero** hardcoded `sys_id` literals, **zero** PII, **zero**
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

*(CORRECTED 2026-09-09, CR2 findings F01-F05: the output described in the paragraph above is the
count-based part of a contract that is now larger. The script additionally emits a `PERSISTED|` line
carrying the post-write re-read of all 24 rows' `label`/`sequence`/`language`/`inactive`, a per-field
and an aggregate `CHOICE_SETS|` line carrying each composite's `sys_scope`/`sys_package` ownership,
and a `RACE|`/`ABORT|`/`SKIPPED|` family when a concurrent write is detected; the `SUMMARY|` line now
carries a `reason=` field, and the verdict is `OK` only when the counts, the persisted attributes and
the app-owned composites all agree and no duplicate key or race abort occurred. It refuses outright,
before any write, when the executing scope is not `x_casemgmt` or when the application scope record
does not resolve to exactly one well-formed row. See the correction under §4's run table for how that
changes the verdicts recorded there.)*

**Write-path discovery that the script now documents and diagnoses.** `sys_db_object` for
`sys_choice` reports `create_access=false, update_access=false, delete_access=false,
read_access=true, sys_scope=global`: a **scoped** session may read `sys_choice` but may not write it,
and `GlideRecord.canCreate()` / `canWrite()` both answer `true` in the very run whose insert is
refused (they evaluate ACLs, not cross-scope privileges — useless as a pre-check). The script
therefore reports `insert REFUSED` with a diagnosis rather than failing silently. Scope attribution
does not suffer: `sys_choice` has no `sys_scope` column at all, and ownership is carried by the seven
`sys_choice_set` composites, all of which are app-owned (`sys_scope` = `sys_package` =
`x_casemgmt Case Management`, names `sys_choice_x_casemgmt_*`).

> **CORRECTION 2026-09-09 (code review CR2) — the Global-scope write is an AAP §0.7.2
> scope-exclusivity violation, and it has been WITHDRAWN from this project's documented procedure.**
> This paragraph previously ended "…and the procedure it documents is **verify in scope, write from
> Global**." That sentence is withdrawn. AAP §0.7.2 requires that all artifacts live in the
> `x_casemgmt` scope with **"Zero global-scope writes"**, and it names the constraint twice (the
> PDI-only bullet: "no global-scope writes"; the scoped-namespace-only bullet, which lists `choices`
> among the artifact classes that must be in scope). A Global-scope `sys_choice` write is therefore not
> a sanctioned remedy for the refusal measured above — it is a violation of the execution boundary,
> whatever it achieves. The runs in §4 below that were performed in Global are recorded there as
> violations on the same basis. The replacement procedure is not restated here: the script documents
> itself, and its header comment is the authority on how it is to be run.

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
| 3 (in scope) | deleted `case.pending_reason=Other` | `insert REFUSED`, shortfall, `FAILED problems=3` | shortfall detected; cross-scope write barrier diagnosed. **This is the run that matters**: an in-scope session detects the gap and refuses to paper over it |
| 4 (**Global — ⛔ AAP §0.7.2 SCOPE-EXCLUSIVITY VIOLATION; withdrawn from the documented procedure**) | same gap | `created=1`, 24/24, `OK` | the insert succeeded from Global and the shortfall closed — recorded as **what was measured**, not as a sanctioned remedy: AAP §0.7.2 requires zero global-scope writes, so this run breached the execution boundary. New `sys_id` `c1cf9fc4935f0b1009aa70d19dba1017` |
| 5 (in scope) | `status=Draft` label → "Draft DRIFT PROBE", sequence → 999 | both drifts detected, repair refused with its cause reported (the remedy line it printed at the time named the Global route, and is withdrawn with it — see the correction below) | **count still read 24/24 with every per-field line ok — a count-only check would have passed** |
| 6 (**Global — ⛔ AAP §0.7.2 SCOPE-EXCLUSIVITY VIOLATION; withdrawn from the documented procedure**) | same drift | repaired, `OK` | the in-place repair executed from Global — again what was measured, not a sanctioned remedy |
| 7 (**Global — ⛔ AAP §0.7.2 SCOPE-EXCLUSIVITY VIOLATION; withdrawn from the documented procedure**) | inserted surplus `case.priority='U2 Surplus Probe'` | `expected=4 found=5`, `TOTAL 25`, a `SURPLUS` line naming `sys_id=93706748935f0b1009aa70d19dba1029`, `FAILED` | surplus is detected as a failure, as required. The surplus row itself was inserted from Global, which is the same boundary breach |
| 8 (final) | probes removed | `OK`, 24/24 | final state |

> **CORRECTION 2026-09-09 (code review CR2) — runs 4, 6 and 7 were performed in the Global scope, and
> that is an AAP §0.7.2 scope-exclusivity violation, not a sanctioned remedy.** AAP §0.7.2 requires
> every artifact — `choices` explicitly among them — to live in the `x_casemgmt` scope, with **"Zero
> global-scope writes"**. These three runs wrote `sys_choice` rows from a Global session, so each
> breached the execution boundary. They are left in the table because they are what was measured and
> deleting a measurement would be worse than recording the breach; what is withdrawn is any reading of
> them as *the* way to close a refused scoped `sys_choice` write. The Global-scope write procedure has
> been **removed from this project's documented procedure** on that ground. The replacement is not
> described here: the script documents itself, and its header comment is the authority on how to run
> it. Note also that runs 4, 6 and 7 are the only three that mutated state from outside the scope; runs
> 1, 2, 3, 5 and 8 were in scope, and the final state was proven tuple-identical to the pre-run
> snapshot (next paragraph), so nothing from these three runs survives on the instance or in the
> package.

> **CORRECTION 2026-09-09 (code review CR2, findings F01-F05) — every verdict in the table above was
> produced by the script as it stood at the time, and its verification contract has since been
> strengthened. Read those verdicts against the contract that existed then, not against the current
> one.** Two consequences, both of which change what the table's own cells would say if the runs were
> repeated today:
>
> - **A Global-scope run no longer reaches a verdict at all.** Runs 4, 6 and 7 completed and reported
>   `OK` / `FAILED` from a Global session. The script now asserts `gs.getCurrentScopeName()` against
>   `x_casemgmt` before it resolves the scope record or attempts any write, and a run outside the
>   application's own scope returns `verdict=FAILED|reason=out-of-scope execution` with zero inserts
>   and zero updates attempted. So those three runs are not merely recorded as boundary breaches — the
>   route they took is now closed in code, and the refusal names the native in-scope Choices-list
>   remedy while naming a Global run, a `sys_db_object` edit and a `sys_scope_privilege` as forbidden.
>   The same gate now also refuses to reconcile when the `sys_scope` query for `x_casemgmt` returns
>   anything but exactly one well-formed row, where it previously logged that and continued.
> - **An `OK` verdict now asserts more than it did.** At the time of these runs the verdict was
>   `counts agree AND no problems were logged`. Run 5 is this report's own demonstration of what that
>   missed: a drifted `label` and `sequence` while *"a count-only check would have passed"*. The
>   verdict now additionally requires that every one of the 24 rows be **re-read from the database
>   after the write** and match its specified `label`, `sequence`, `language` and `inactive`; that
>   **exactly one app-owned `sys_choice_set` composite** exist for each of the seven fields with
>   `sys_scope` and `sys_package` resolving to this application and no surplus composite present; and
>   that no duplicate natural key and no detected concurrent write have occurred. The `CHOICE_SETS 7/7`
>   cell in run 1 was a count of composites, not a verification of their ownership.
>
> Nothing measured in the table is withdrawn. What is withdrawn is the inference that an `OK` recorded
> here is an `OK` under the present contract — it is the weaker predecessor of one. The script's own
> header comment is the authority on the current contract.

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
`g_user.userName=<configured administrator>`, "System Administrator", `hasRole('admin')=true` — the
login identifier is redacted per CR2 F11; the **role** it holds, `admin`, is the point and is left
as written). Verified as the **`admin`-role** session, which is what the directive asks for ("Open a
real case record"); §9 covers the scoped personas.

**The four dropdowns on real record `CASE9000001`** all render as populated selects — none empty:

| Field | Count | Values offered |
|---|---|---|
| `status` | 6 | Draft, Open, In Progress, Pending, Resolved, Closed |
| `type` | 2 | General Inquiry, Complaint (plus `-- None --`) |
| `priority` | 4 | Low, Medium, High, Critical |
| `pending_reason` | 3 | Awaiting Info, Awaiting Third Party, Other (plus `-- None --`) |

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-case-form-status-choices.png` — **NOT RETAINED** (CR2 F06)
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-case-form-type-priority-pending.png` — **NOT RETAINED** (CR2 F06)

> **CORRECTION 2026-09-09 (CR2, finding F06) — every `/tmp/blitzy/scratch/…` path cited anywhere in this report is **NOT RETAINED**.**
> That directory was agent scratch, never a repository file, and it does not
> exist in or alongside this repository; `blitzy/screenshots/` holds no equivalent capture. The
> descriptions of what each artefact showed are kept verbatim above and below, because they are the
> record of what was observed — but each is now a **recorded observation with a named evidence gap**
> rather than a citation a reader can open. Every such path in this document is marked
> **NOT RETAINED** in place, so no citation points at something unopenable without saying so.

**Task and party linkage in the UI.** On `/x_casemgmt_case_task_list.do`, **10 of 10** rows show a
populated `Case` display value rendered as a hyperlink (TASK…1/2 → CASE9000003, 3/9 → CASE9000004,
4/5 → CASE9000005, 6/7/10 → CASE9000008, 8 → CASE9000009). On
`/x_casemgmt_case_party_list.do`, **8 of 8** rows show a populated `Case` value; all **3**
Organization rows show a real company name (Synthetic Org Alpha ×2, Synthetic Org Beta) and all 5
Person rows a real person. Both a blank cell and a bare `sys_id` were explicitly tested for.
**Failing rows: none.**

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-task-list-case-refs.png` — **NOT RETAINED** (CR2 F06)
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/u2-party-list-case-and-org-refs.png` — **NOT RETAINED** (CR2 F06)

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
| **Timestamp clustering.** 27 interactive form submissions cannot land inside two seconds | All 27 carried the same `sys_created_by` — the `admin`-role account, login identifier redacted per CR2 F11 — with `sys_created_on` in `2026-09-02 19:09:55`–`19:09:56`, `sys_mod_count=0` ⇒ **script signature** |
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

**Per-row audit of the 27 original links — added 2026-09-09 (code review CR2, finding F08).** The
three tests above were applied to every row, but they were tabulated one row per *test*, which
classified all 27 only in aggregate. Directive L87 forbids skipping the per-record trace, so the trace
is written out here, one row per record, with an explicit verdict on each. Legend for the evidence
column:

- **T1 — timestamp clustering.** The row's `sys_created_on` falls inside the two-second window
  `2026-09-02 19:09:55`–`19:09:56` with `sys_mod_count=0`. 27 interactive form submissions cannot land
  inside two seconds; a single script run can and did.
- **T2 — not an installer composite.** The row's `sys_id` is not `first16(ACL)+first16(role)`, so
  `post_import_remediation.js`'s `installerLinkSysId()` was not its author — which is what establishes
  that a *different* direct insert was.
- **T3 — named as a directly-inserted row in the run record.** The row appears as
  `sys_security_acl_role_<sys_id>` in [`PHASE1-REBUILD.md`](./PHASE1-REBUILD.md) §"Captured role links
  (27)", under that document's explicit **DEVIATION** entry: a server-side background script "inserted
  all 27 links directly (`created=27 failed=0`, relying on auto-capture)" and "Neither insert went
  through the platform's native role-assignment action."

**Two data points are not recoverable, and are declared rather than inferred or left blank:**

1. **The per-row second within the T1 window.** Only the aggregate window was recorded; the instance
   that held the rows has been torn down, so the exact `sys_created_on` of an individual row cannot be
   re-read. Every row therefore carries the window with that stated in place of a false precision.
2. **The per-row `operation`.** The run record identifies each link by ACL target and role only
   (`table[.field].role`), not by operation, which is why several rows below share a (table, role) pair
   and differ only in an operation this document cannot attribute per `sys_id`. The *set* of
   operations is not in doubt and is reconciled in aggregate below (read 9 / write 9 / create 6 /
   delete 3), and the pair-for-pair `(ACL, role)` matrix was compared before and after recreation with
   no pair lost and none added.

The `Created by (role)` column records the **role** the authoring session held, not a login identifier
(CR2 F11): the underlying `sys_created_by` on all 27 rows is the configured administrator account, and
the notable part is what it did *not* hold — `security_admin` — because a server-side background script
is not ACL-gated and so wrote these rows without the elevation the native path would have required.

| # | Old `sys_id` | ACL (table / field) | Role | Created by (role) | Created on (UTC) | Evidence | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | `bfd9ec9a938b435009aa70d19dba10d1` | `x_casemgmt_case.assigned_agent` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 2 | `f3d9ec9a938b435009aa70d19dba10cc` | `x_casemgmt_case.assigned_agent` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 3 | `bbd9ec9a938b435009aa70d19dba109d` | `x_casemgmt_case.assigned_group` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 4 | `33d9ec9a938b435009aa70d19dba10e4` | `x_casemgmt_case` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 5 | `4ce920da938b435009aa70d19dba1036` | `x_casemgmt_case` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 6 | `88e920da938b435009aa70d19dba105e` | `x_casemgmt_case` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 7 | `b7d9ec9a938b435009aa70d19dba10b4` | `x_casemgmt_case` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 8 | `fbd9ec9a938b435009aa70d19dba10e9` | `x_casemgmt_case` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 9 | `77d920da938b435009aa70d19dba1019` | `x_casemgmt_case` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 10 | `77d9ec9a938b435009aa70d19dba10a3` | `x_casemgmt_case` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 11 | `c4e920da938b435009aa70d19dba1076` | `x_casemgmt_case` | viewer | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 12 | `8ce920da938b435009aa70d19dba1047` | `x_casemgmt_case_party` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 13 | `c0e920da938b435009aa70d19dba1042` | `x_casemgmt_case_party` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 14 | `08e920da938b435009aa70d19dba103c` | `x_casemgmt_case_party` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 15 | `b3d920da938b435009aa70d19dba1031` | `x_casemgmt_case_party` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 16 | `80e920da938b435009aa70d19dba107c` | `x_casemgmt_case_party` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 17 | `fbd9ec9a938b435009aa70d19dba10ae` | `x_casemgmt_case_party` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 18 | `0ce920da938b435009aa70d19dba1070` | `x_casemgmt_case_party` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 19 | `7fd9ec9a938b435009aa70d19dba10fb` | `x_casemgmt_case_party` | viewer | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 20 | `33d920da938b435009aa70d19dba101f` | `x_casemgmt_case_task` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 21 | `04e920da938b435009aa70d19dba1053` | `x_casemgmt_case_task` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 22 | `33d9ec9a938b435009aa70d19dba10a9` | `x_casemgmt_case_task` | agent | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 23 | `f3d920da938b435009aa70d19dba1007` | `x_casemgmt_case_task` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 24 | `cce920da938b435009aa70d19dba1058` | `x_casemgmt_case_task` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 25 | `73d9ec9a938b435009aa70d19dba10ba` | `x_casemgmt_case_task` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 26 | `48e920da938b435009aa70d19dba104d` | `x_casemgmt_case_task` | manager | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |
| 27 | `3bd920da938b435009aa70d19dba1001` | `x_casemgmt_case_task` | viewer | `admin` role, server-side script (no `security_admin` elevation) | `2026-09-02 19:09:55`–`19:09:56` — per-row second not retained | T1 ✔ · T2 ✔ · T3 ✔ | **DIRECT INSERT** |

**Not one of the 27 — and excluded deliberately.** [`PHASE1-REBUILD.md`](./PHASE1-REBUILD.md) holds a
**28th** `sys_security_acl_role_<sys_id>` token, `96dcd812934b435009aa70d19dba1064`. It is **not** one
of this application's links and is not in the table above. It is the probe link that document's S1
created **on purpose through the native path** — a `read` ACL on the throwaway probe table
`x_casemgmt_qa5_probe_table` with role `x_casemgmt.qa5_probe_role`, attached through the ACL form's own
"Requires role" related list under an elevated `security_admin` session, so that the platform itself
wrote the row and the capture behaviour could be observed (PHASE1-REBUILD §S1, entries at its L58-59,
L85, L106 and L137). Its verdict is **NATIVE**, it belongs to a different table and a different role,
and counting it here would inflate 27 to 28.

**Reconciliation: 27 + 3, original and recreated.**

| Set | Count | Per role | Per table | Verdict |
|---|---|---|---|---|
| Original `sys_security_acl_role` links | **27** | manager 14 · agent 10 · viewer 3 | `x_casemgmt_case` 11 (8 on the table + 3 on its fields: `assigned_agent` 2, `assigned_group` 1) · `_case_task` 8 · `_case_party` 8 | **DIRECT INSERT** — all 27, per row above |
| Recreated `sys_security_acl_role` links | **27** | manager 14 · agent 10 · viewer 3 | `x_casemgmt_case` 11 · `_case_task` 8 · `_case_party` 8 | **NATIVE** — all 27, per row in §8 |
| Original `sys_user_has_role` grants | **3** | one per role | n/a | **DIRECT INSERT** — all 3, per row in §8 |
| Recreated `sys_user_has_role` grants | **3** | one per role | n/a | **NATIVE** — all 3, per row in §8 |
| Native probe link (not this application's) | 1 | n/a — `x_casemgmt.qa5_probe_role` | `x_casemgmt_qa5_probe_table` | **NATIVE**, and **excluded** from every figure above |

The two per-role splits and the two per-table splits were derived independently: the 14 / 10 / 3 and
11 / 8 / 8 above are counted from the 27 old `sys_id`s in the table, and the same splits were measured
live on the 27 new rows in §8. Nothing is missing and nothing is double-counted: 27 old rows deleted,
27 new rows created, 3 old grants deleted, 3 new grants created.

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

**Per-row NATIVE verdict — evidence legend, added 2026-09-09 (CR2 F08).** Every row below carries an
explicit verdict, and the four checks behind it are per-row rather than aggregate:

- **N1 — brand-new `sys_id`.** The row's `sys_id` appears in none of the 27 direct-inserted `sys_id`s
  audited in §7, so it is a new record and not a survivor of the audited set. (New `sys_id`s are
  inherent to recreating a link and are not a defect — INTERP-R1.)
- **N2 — not an installer composite.** The `sys_id` is not `first16(ACL)+first16(role)`, so
  `post_import_remediation.js` did not author it.
- **N3 — its own `sys_created_on`, ~23 s from its neighbours.** The 27 rows carry 27 *distinct*
  timestamps spanning 19:15:30 → 19:26:54 in roughly 23-second steps — the cadence of one interactive
  form submission after another, in direct contrast to the audited set's two-second batch.
- **N4 — captured as an `INSERT_OR_UPDATE` in the app's Default set**, paired with the `DELETE` capture
  of the row it replaced; each pair was verified before the next was started (the deleted row answering
  HTTP 404).

The `Created by (role)` column records the **roles the authoring session held** — the elevated
`security_admin` plus `admin` — rather than a login identifier (CR2 F11). Elevation was proven
effective, not assumed: the ACL form's "Requires role" related list changed from read-only to editable.
This is the substantive difference from the audited set, which was written by a non-elevated background
script that bypassed ACL evaluation entirely.

| # | New `sys_id` | Role | Op | ACL (table / field) | Created by (role) | Created on (UTC) | Evidence | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | `9aa4e780939f0b1009aa70d19dba1016` | manager | read | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:15:30 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 2 | `ca15a7c0939f0b1009aa70d19dba10bf` | manager | create | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:17:22 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 3 | `e3256bc0939f0b1009aa70d19dba10c5` | agent | create | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:17:45 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 4 | `45452fc0939f0b1009aa70d19dba10b0` | manager | delete | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:18:08 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 5 | `3a552304939f0b1009aa70d19dba1062` | viewer | read | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:18:30 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 6 | `5475e304939f0b1009aa70d19dba103e` | agent | read | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:18:53 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 7 | `3d856704939f0b1009aa70d19dba10f7` | agent | write | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:19:16 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 8 | `af956b04939f0b1009aa70d19dba1077` | manager | write | `x_casemgmt_case` | `security_admin` (elevated), `admin` | 2026-09-08 19:19:39 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 9 | `09b56f04939f0b1009aa70d19dba10b3` | agent | write | `x_casemgmt_case.assigned_agent` | `security_admin` (elevated), `admin` | 2026-09-08 19:20:02 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 10 | `bac56b44939f0b1009aa70d19dba1082` | manager | write | `x_casemgmt_case.assigned_agent` | `security_admin` (elevated), `admin` | 2026-09-08 19:20:25 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 11 | `d0e52f44939f0b1009aa70d19dba10b8` | manager | write | `x_casemgmt_case.assigned_group` | `security_admin` (elevated), `admin` | 2026-09-08 19:20:48 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 12 | `39f5ef44939f0b1009aa70d19dba1097` | manager | create | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:21:11 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 13 | `2306e384939f0b1009aa70d19dba1056` | agent | create | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:21:34 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 14 | `0d266784939f0b1009aa70d19dba10ea` | manager | delete | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:21:57 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 15 | `aa366b84939f0b1009aa70d19dba1007` | viewer | read | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:22:20 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 16 | `94562f84939f0b1009aa70d19dba1047` | agent | read | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:22:42 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 17 | `3966ef84939f0b1009aa70d19dba1058` | manager | read | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:23:05 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 18 | `9376a3c4939f0b1009aa70d19dba108e` | agent | write | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:23:28 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 19 | `859667c4939f0b1009aa70d19dba10de` | manager | write | `x_casemgmt_case_party` | `security_admin` (elevated), `admin` | 2026-09-08 19:23:51 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 20 | `aea62bc4939f0b1009aa70d19dba10ab` | manager | create | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:24:14 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 21 | `d0c62fc4939f0b1009aa70d19dba1085` | agent | create | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:24:37 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 22 | `b1d6efc4939f0b1009aa70d19dba1019` | manager | delete | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:25:00 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 23 | `5be6a308939f0b1009aa70d19dba1088` | agent | read | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:25:23 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 24 | `81076708939f0b1009aa70d19dba10ba` | viewer | read | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:25:46 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 25 | `2a172b08939f0b1009aa70d19dba1099` | manager | read | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:26:09 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 26 | `0c372f08939f0b1009aa70d19dba1032` | agent | write | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:26:32 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |
| 27 | `3947af08939f0b1009aa70d19dba10f8` | manager | write | `x_casemgmt_case_task` | `security_admin` (elevated), `admin` | 2026-09-08 19:26:54 | N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ | **NATIVE** |

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

Per-row, for both the old and the new row of each grant — **columns and verdicts added 2026-09-09
(CR2 F08)**, because the table previously carried neither a creator nor a verdict:

| User | Role | New `sys_id` | New: created by (role) | New: created (UTC) | New: evidence | New verdict | Old direct-insert `sys_id` | Old: created by (role) | Old: created (UTC) | Old: evidence | Old verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `x_casemgmt_demo_manager` | `x_casemgmt_case_manager` | `203beb4093df0b1009aa70d19dba1011` | `security_admin` (elevated), `admin` | 19:43:56 | G1 ✔ · G2 ✔ · G3 ✔ | **NATIVE** | `20b02f48935f0b1009aa70d19dba102b` | `admin` role, server-side script | `2026-09-08 18:58:04` | D1 ✔ (first-hand) | **DIRECT INSERT** |
| `x_casemgmt_demo_agent` | `x_casemgmt_case_agent` | `3d4b6f4093df0b1009aa70d19dba10bc` | `security_admin` (elevated), `admin` | 19:44:18 | G1 ✔ · G2 ✔ · G3 ✔ | **NATIVE** | `30b02f48935f0b1009aa70d19dba1032` | `admin` role, server-side script | `2026-09-08 18:58:04` | D1 ✔ (first-hand) | **DIRECT INSERT** |
| `x_casemgmt_demo_viewer` | `x_casemgmt_case_viewer` | `c35ba38093df0b1009aa70d19dba103d` | `security_admin` (elevated), `admin` | 19:44:39 | G1 ✔ · G2 ✔ · G3 ✔ | **NATIVE** | `70b02f48935f0b1009aa70d19dba1037` | `admin` role, server-side script | `2026-09-08 18:58:04` | D1 ✔ (first-hand) | **DIRECT INSERT** |

Evidence legend for the grants:

- **G1 — its own `sys_created_on` from a separate save.** The three new rows carry three distinct
  timestamps ~22 s apart (19:43:56 / 19:44:18 / 19:44:39), one per *Edit Members* save.
- **G2 — the platform re-derived a companion row at the moment of the grant.** Alongside each new
  grant the platform wrote an `inherited=true` `snc_required_script_writer_permission` row with
  `sys_created_by=system` (`603beb40…1015`, `7d4b6f40…10c0`, `075ba380…1041`). That is the strongest
  native-authoring evidence in this section — a side effect of the platform's own user-provisioning
  logic, which the *Edit Members* save invokes. Stated precisely, and consistently with the **CR2 F10**
  correction below the table: what G2 establishes is that the **platform**, not the operator, wrote
  those three rows at grant time. It is kept as native-authoring evidence **and** reported there as a
  **BLOCKING capability gap**, because provisioning a scoped-application persona through the native
  path makes the platform add a stock role. Both statements are true and neither is withdrawn.
- **G3 — the table total moved by 6, not 3.** `sys_user_has_role` went 3890 → 3884 across the delete
  pass (3 grants + 3 companions) and back to **3890** after the re-grant — the companion mechanism
  measured at the table level rather than inferred from three rows. Read carefully, that same figure
  says the **pre-existing** grants also had companions beside them, which the delete pass removed; so
  the mere *presence* of a companion is not by itself a discriminator between the two authoring paths.
  What discriminates is the re-derivation: three new `system`-authored rows appearing at the instant of
  three native saves.
- **D1 — creation timestamp and author, known first-hand.** All three old rows were created at
  `2026-09-08 18:58:04` by this unit's own `seed_demo_data.js` run, whose `ensureRoleAssignment()`
  (~L724–745) inserts `sys_user_has_role` directly. No inference was needed for these three, which is
  why their evidence column carries one check rather than three: the author is known, not deduced. The
  aggregate `granted_by` test recorded above is useless as a signal on this instance (the sentinel
  `not-applicable` on all 3890 rows), and it is not claimed as evidence here.

The decisive proof of native authoring here is not the timestamp but a side effect that the platform's
own user-provisioning logic produces at the moment of a native save, and an operator's insert does not
invoke (stated with its one caveat under **G3** in the legend above): alongside each new grant **the
platform re-derived its `inherited=true`
`snc_required_script_writer_permission` companion row with `sys_created_by=system`**
(`603beb40…1015`, `7d4b6f40…10c0`, `075ba380…1041`). The delete pass had removed those companions
too — `sys_user_has_role` went 3890 → 3884 (3 grants + 3 companions) and back to **3890** after the
native re-grant.

> **CORRECTION 2026-09-09 (code review CR2, finding F10) — that companion row is a BLOCKING capability
> gap, and this report previously contradicted itself about it.** §9 of this section closed with the
> bare sentence "No global ACL was created and no stock role was granted", which a reader could weigh
> directly against the companion-row evidence above. Both halves cannot be true as written. The precise
> position, in two parts:
>
> - **The stock role is NOT authored by this package.** Three checks, each re-run for this correction:
>   the canonical Update Set at
>   `update-set/x_casemgmt_case_management_update_set.xml` contains **0** occurrences of
>   `snc_required_script_writer_permission`; it contains **0** `sys_user_role_contains` payloads; and
>   all three `roles/*.xml` artifacts carry an empty self-closing `<includes_roles/>`
>   (`roles/sys_user_role_x_casemgmt_case_manager.xml` L81,
>   `…_case_agent.xml` L98, `…_case_viewer.xml` L109). Nothing in this repository grants it, inherits
>   it, or names it. The companion is derived by the **platform's own user-provisioning logic** when a
>   role is granted through the native path — which is exactly why it is evidence of native authoring.
> - **It IS effective on each demo persona.** Measured by impersonation, not inferred: the viewer's own
>   session reports roles `snc_required_script_writer_permission, x_casemgmt_case_viewer` (§9 below),
>   and the agent's likewise. So a scoped-role persona provisioned by the native path ends up holding a
>   stock role in addition to its one scoped role.
>
> **Classification: BLOCKING capability gap — reported, not accepted and not worked around.** A
> scoped-application persona cannot be provisioned through the platform's own native role-grant path
> without the platform adding a stock role. Removing it would mean writing global `sys_user_has_role`
> rows this package does not own, and **AAP §0.3.2 forbids "global scope changes of any kind"** — "no
> edits to `sys_user`, `sys_user_group`, `sys_user_role` (except the three new scoped roles created in
> scope), `core_company`, `task`, `incident`, or **any out-of-the-box ServiceNow tables**", which
> `sys_user_has_role` is; AAP
> §0.7.2's Minimal-Change Clause and §0.3.2's closing bullet then require a gap PDI cannot address to
> be **stopped and reported** rather than substituted. So it is reported here, cross-referenced from
> `../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` **ADV-3**, and no remedy is applied. The measurements above
> — the three companion `sys_id`s, `sys_created_by=system`, `inherited=true`, and the 3890 → 3884 →
> 3890 movement — are unchanged; only the classification is.

Screenshots (each shows the platform's own "Edit Members" screen with the role in the assigned Roles
List before Save, plus the resulting user form), all under
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/screenshots/` — **NOT RETAINED**
(CR2 F06):
`u2-native-role-grant-x_casemgmt_demo_manager.png`, `…-manager-userform.png`,
`u2-native-role-grant-x_casemgmt_demo_agent.png`, `…-agent-userform.png`,
`u2-native-role-grant-x_casemgmt_demo_viewer.png`, `…-viewer-userform.png`.

**Evidence status of those six captures (CR2 F06).** The files are gone with the scratch directory and
cannot be re-taken — the instance no longer holds the application. What they showed is recorded above
and stands as a recorded observation; it is no longer independently inspectable. The native-authoring
verdict on these three grants therefore rests on the two pieces of evidence that **are** in this
document: the per-row timestamps in the table above, and the platform-derived companion rows recorded
in the paragraph above them (whose classification is corrected under CR2 F10 in §9).

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
profile so the elevated administrator session used for the recreation work was never mutated.

**Viewer** — identity confirmed on a real page: `g_user.userName=x_casemgmt_demo_viewer`, roles
`snc_required_script_writer_permission, x_casemgmt_case_viewer`. That the scoped role is present and
effective is itself live proof that the natively re-granted row works — and this same reading is the
evidence that the **stock** `snc_required_script_writer_permission` role is effective on the persona
too, which §8's CR2 F10 correction classifies as a **BLOCKING capability gap** of the native
role-grant path rather than a property of this package. All **10** cases readable
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
explicitly). **No global ACL was created here, and this work granted no stock role.** What must be
stated alongside that, because a bare version of this sentence is what CR2 F10 found contradicting §8:
**the platform itself derived a stock `snc_required_script_writer_permission` companion row on each of
the three personas** when each scoped role was granted through the native path. That role is not
authored, inherited or named anywhere in this repository — the canonical package holds **0**
occurrences of it and **0** `sys_user_role_contains` payloads, and all three `roles/*.xml` carry an
empty self-closing `<includes_roles/>` — and it **is** effective on each persona, as the impersonation
readings above show. See the **CR2 F10 correction in §8**: that is a **BLOCKING capability gap** of the
platform's native role-grant path, reported rather than accepted, because removing it would require
writing global `sys_user_has_role` rows AAP §0.3.2 forbids this package to own. D3.5 was verified
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
checkpoint's window — **58 in total, all authored by the `admin`-role account (login identifier
redacted per CR2 F11), all in the app's Default set** — is:

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
granted by the elevated `admin`/`security_admin` session — the native grants) plus
`snc_required_script_writer_permission` (`inherited=true`, `by=system` — **platform-derived, not
granted here, and reported as a BLOCKING capability gap under the CR2 F10 correction in §8**: it is
effective on all three personas, it is absent from every artifact in this repository, and AAP §0.3.2
forbids the global `sys_user_has_role` write that removing it would need). Directive L224–225 is
intact: no field, dictionary, table or ACL was added, removed or edited.

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

The only other side effect is one `sys_user_preference` row on the **configured administrator's**
account (`name=recent.impersonations`), unavoidable when using the impersonation §9 requires. It is a
UI preference of that account, not an app artifact.

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
| `sys_user_has_role` | 3 — **measured on the pre-export instance, where Step 4's native grants were live. This target was NOT met after the Step 5c commit: post-commit it read 0, and no update set on this release can carry it (CR2 F09 — a BLOCKED capability gap, not a post-commit step that satisfies the gate).** |
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
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/shots/u3-5a-export-publish-dialog.png` — **NOT RETAINED** (CR2 F06)
and `…/shots/u3-5a-export-publish.png` — **NOT RETAINED** (CR2 F06). Both were agent scratch and are absent
from this repository; what they showed is recorded in the sentence above them.

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
PII); 523 payload `application` stamps, **all** the scope `sys_id`.

Three statements this section previously made were wrong or unauthorised, and CR1 findings F03, F04 and
F05 named each of them. Corrected:

- **Scope exclusivity (F04).** These bytes did **not** carry zero `global` stamps. Exactly one payload
  did — the `sys_script_fix` record, stamped `<sys_package display_value="Global" source="global">global`
  and `<sys_scope display_value="Global">global` — so "no global-scope artifacts" was false as written.
  That payload has since been removed (see the CR1 amendment at the top of this report); the claim is
  true of the bytes that ship now, and the measurement that establishes it is
  `zero payloads containing source="global" or <sys_scope>global</sys_scope>`.
- **Dependency ordering (F03).** Block order being the platform's capture order rather than the AAP
  §0.5.2 dependency order is a **requirement violation, not a reported property**. No override
  supersedes §0.5.2, and a passing preview does not settle it: preview resolves a reference against
  anything in the set regardless of position, so it cannot detect an ordering the AAP mandates for the
  benefit of a reader and of any consumer that applies the file sequentially. The blocks are now
  ordered by those tiers, with the payload bytes proven unchanged by the reorder.
- **No hardcoded `sys_id` (F05).** "The no-hardcoded-`sys_id` rule governs authored artifacts" was a
  narrowing of AAP §0.7.2 that no override authorises, and it is withdrawn. The rule as written admits
  no such exception, and a native platform export cannot satisfy it: measured on the bytes that ship,
  **4,343 32-character-hex occurrences appear outside their own record's `<sys_id>` element, across 515 of
  the 522 blocks, and 115 distinct ids (983 occurrences) belong to platform records the package does not
  own** (on the pre-amendment bytes this section was written against: 4,314 / 515 / 114 / 981). Because ServiceNow resolves an Update Set payload's reference fields by `sys_id` and offers no
  by-key alternative in the transport format, this is a **PDI capability gap that cannot be closed
  inside the platform's own export**, and it is reported as blocking under the AAP §0.7.2
  Minimal-Change Clause rather than redefined — see
  [`../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). What the project
  does deliver against the rule's intent is unchanged and remains true of everything except the two
  `sys_rate_limit_rules` artifacts named in `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.CR1.2: every other authored artifact,
  every ACL condition, every flow script and the seed script resolve their targets by `name`,
  `user_name`, `number` or `role_label`, so nothing a human wrote carries an id literal.

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
identified and left alone. The FALLBACK package's own record was excluded structurally, before
enumeration, by the null-safe predicate stated in §5 of Step 1-2 (`sys_id is empty OR sys_id !=
9929f50d…`, the `ISEMPTY` OR term being what keeps a NULL-keyed row from slipping past a bare `!=`).
It was never read, and no property of it is published anywhere in this section.

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

**All ten zero-state checks — normalized summary of what each check returned, not the raw capture:**

Every figure in the table below is a **derived count**, transcribed from the run at the time. It is
not the verbatim request, HTTP status and response body; those were written to an agent scratch
directory that this repository does not retain (see the dated correction directly after the table).

| # | Check | Normalized result |
| --- | --- | --- |
| 1 | `sys_scope` for `x_casemgmt` | 0 — body `[]` |
| 2 | `x_casemgmt_case` endpoint | **HTTP 400** `"Invalid table x_casemgmt_case"` |
| 3 | `x_casemgmt_case_task` endpoint | **HTTP 400** `"Invalid table x_casemgmt_case_task"` |
| 4 | `x_casemgmt_case_party` endpoint | **HTTP 400** `"Invalid table x_casemgmt_case_party"` |
| 5 | `sys_user_role` for the three roles | 0 |
| 6 | `sys_choice` for the three tables | 0 |
| 7 | `sys_number` for the three tables | 0 |
| 8 | `sys_remote_update_set`, task-owned residue under the exclusion predicate stated below | 0 |
| 9 | `sys_update_set` `nameLIKEx_casemgmt`, and app-owned sets | 0 and 0 |
| 10a | scoped `sys_security_acl_role` (by `sys_user_role.name` **and** by `sys_scope`) | 0 |
| 10b | `sys_user_has_role` for the three scoped roles | 0 |
| 10c | `sys_dictionary` for the three tables | 0 |
| 10d | `sys_db_object` for the three tables | 0 |
| 10e | `sys_documentation` for the three tables | 0 |

Rows 10a-10e are the one check the directive counts as check 10, reported per class: each of the five
is a distinct high-risk class and an aggregate cell would let a non-zero in one hide behind zeros in
the others. Check 8's exclusion is **structural and null-safe**, and it is the predicate rather than a
subtraction:

```
keep row  ⇔  sys_id is empty OR sys_id != 9929f50df18ccec91ea13b2a3bccfc90
```

expressed as `addQuery('sys_id','!=',X).addOrCondition('sys_id','ISEMPTY')` — the `!=` term alone
drops NULL-valued rows on this platform, which is the trap the Step 8 survivor hunt was caught by
(§6 of Step 8). The count reported for check 8 is the **task-owned** residue that survives that
predicate; no total that includes the excluded record is published, and no figure here is a raw total
minus it.

> **CORRECTION 2026-09-09 (code review CR2, finding F06) — the Step 5b zero-state gate is
> EVIDENCE-UNPROVEN AT RAW LEVEL.** The table above was previously headed "All ten zero-state checks,
> raw". It is not raw: it holds derived counts with no verbatim request, no timestamp per check and no
> HTTP status paired with its response body. The verbatim captures for **this** pass — the exact
> `curl` invocations, statuses and bodies — were written to an agent scratch directory
> (`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/`, **NOT RETAINED** — the directory
> does not exist in or alongside this repository, and `blitzy/screenshots/` holds no equivalent), so
> they are no longer available for inspection and this gate **cannot be independently re-verified from
> retained material**. The counts stand as *reported as recorded at the time*, and nothing about them
> is withdrawn — what is withdrawn is the claim that they constitute raw proof.
>
> Why that distinction is load-bearing here specifically: Step 5b is the **pre-commit** gate, the one
> that establishes the §4 commit landed on a genuine zero state. And §14 of Step 1-2 records this
> platform's own trap — an invalid field in `sysparm_query` is **silently ignored** and the query
> answers with the unfiltered table total or, filtered differently, with a `0` that means "the filter
> was discarded" rather than "the class is empty". A bare `0` from such a query is
> **indistinguishable** from a genuine `0`; only the raw request-and-body pair distinguishes them.
> That is precisely why the raw capture mattered, and precisely what is missing.
>
> **The boundary, so this is not read wider than it is.** The **Step 8** teardown (§7 of the Step 8
> section) carries the verbatim `curl` command **and** the raw response body for all ten checks, in the
> report itself; it is proven from retained material and **remains proven**. The **Step 1-2** teardown's
> §6 table sits between the two: it carries a run timestamp (`2026-09-08T18:09:31Z`) and a raw response
> body per check, but not the verbatim request line for every check, and its check 10 reports nine
> classes in a single cell with a per-class `0` each. **Step 5b** — this table — is the weakest of the
> three: normalized counts only. So a reader should not conclude that the teardown as a whole is
> unevidenced. What is unaffected by this correction, and evidenced in this document: the
> `deleteApplication` mechanism with `sysparm_delete_all=true`, the line-34 guard applied fresh at each
> of the three teardowns (§3 here, §3 of Step 1-2, §2 of Step 8), the explicit residue ledger above, and
> the collateral totals in §7 of Step 1-2 and §8 of Step 8.

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

**Gate accuracy (CR1 finding F01).** This report originally carried that outcome forward as a clean,
complete gate. It was not: the platform's own verdict on the commit was "Failed at 100% — the update set
commit completed but some updates failed to commit", three payloads the package shipped did not install,
and post-commit `sys_user_has_role` was 0 — so the package as it then stood could not be described as one
that installs everything it carries. Two things follow, and both are now true of the shipping bytes
rather than argued away:

- The three non-installing payloads were **removed** from the package (see the CR1 amendment at the top
  of this report), so a commit of the bytes that ship has nothing in it that the loader will refuse on
  this release. The role grants are **not delivered by the deliverable at all**: the manual sequence a
  deployer can run instead is in
  [`../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5h](../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md), and per the
  **CR2 F09 correction** at the top of this report that manual step is a workaround for a **BLOCKED
  capability gap** — it does not make AAP §0.7.3 Gate 3 or §0.7.4 satisfied.
- The gate evidence in this section therefore attaches to the pre-amendment bytes, and the amended
  bytes are **not** gated. That is stated at the top of this report and in
  [`../deployment.md`](../deployment.md), and it is the recipient's first deployment step.

Everything else in this section — the collision proof, the checksum, the 522-children load, the genuine
`previewing → previewed` transition, the zero-error/zero-warning counts and the single native commit —
is measurement, and it stands as written for the bytes it was measured on.

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
   `sys_grid_canvas_pane` payloads. *Fix applied at the time:* drop the 8 pane payloads
   (530 → 522 children). Re-preview: 9 → **1**.

   **The diagnosis recorded here was wrong, and CR1 finding F02 established it from the shipped bytes.**
   What this report said was that `sys_portal` rows carry no `sys_scope`, are therefore not application
   files, and that "no publish can ever include them" — with the corroboration that no package in the
   project's history had carried panes, canvases or `sys_portal` rows. Measured on the very bytes this
   report ships, all three of those statements are false: the package embeds **8 `sys_portal`
   widget-instance rows and 96 `sys_portal_preferences` rows**, inside its two `sys_portal_page`
   composites, and it embeds both `sys_grid_canvas` rows as standalone blocks. The 8 widget-instance
   `sys_id`s are exactly the 8 `portal_widget` targets of the dropped panes — set equality, verified
   against `../../dashboards/pa_dashboards_x_casemgmt_agent_workspace.xml` and
   `…_manager_view.xml`. The 988-block package that previewed to 0 problems and committed on this
   instance (§ the ledger in step 5b) carried all 8 pane rows as well.

   **The real root cause** is the preview reference validator's resolution rule: it resolves a payload's
   reference against a record that already exists locally, or against a **standalone block in the same
   set**, and the 8 widget instances travelled only as composite *children* of the `sys_portal_page`
   payloads. So `pane.portal_widget` was unresolvable at preview even though the target was in the file.
   Nothing about `sys_portal` prevented transport.

   **What the wrong diagnosis cost.** With no pane rows, both dashboards install with their tab pages,
   canvases, tabs, permissions, all 8 reports and all 8 fully-configured widget instances — and no
   placements, so each canvas renders empty. AAP §0.7.3 Gate 6 ("both dashboards render with synthetic
   data; all widgets display data") could not have passed on a fresh install of those bytes.

   **Resolution (in the bytes that ship now).** The 8 pane rows are restored as two blocks, one per
   dashboard, whose payload is a self-contained `<unload>` bundle carrying that dashboard's `sys_portal`
   widget-instance rows *and* its pane rows — so every `portal_widget` reference resolves inside its own
   payload, which is the shape the 988-block package previewed clean with. The preference children are
   not duplicated: they continue to travel in the `sys_portal_page` composites. Verified statically:
   8 pane records present, every `portal_widget` target and every `grid_canvas` target is a record the
   same package carries. Not verified on an instance — see the CR1 amendment at the top of this report.
3. **1 × "Found a local update that is newer than this one"** on `sys_app_82b99028…`. Pulled with display
   values, the problem named its own culprit: `sys_update_xml` `535df78893534b1009aa70d19dba10ee`,
   `action=DELETE`, created 21:03:18 — **during my own teardown**, and captured into the *global* "Default"
   set because the teardown ran from a global session. *Fix:* purge `sys_update_xml` by
   `application = <scope>` regardless of which set owns the row (29 rows: 27 Access Roles, 1 Custom
   Application DELETE, 1 Table), plus 12 `sys_update_version` rows findable only by `record_name`. The
   The excluded package's children and the candidate's own were skipped by the null-safe `sys_id` predicate
   (`sys_id is empty OR sys_id != 9929f50d…`) and left intact — skipped before enumeration, and neither
   opened nor counted (CR2 F07).

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
  **CR1 F01 update:** the three payloads have been removed from the package, because shipping a payload
  that is known to be refused buys nothing and costs the recipient a commit that reports failures. The
  gap itself is unchanged and is now recorded as blocking, with the manual sequence written
  out in [`../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5h](../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) and its
  verification query.

  > **CORRECTION 2026-09-09 (CR2, finding F09).** This bullet previously closed "`AAP §0.7.4`'s '3
  > users, one per role' is therefore satisfied by the package plus one documented step, not by the
  > commit alone." That sentence is **withdrawn**: a documented manual write performed after the
  > commit does not satisfy a gate on the deliverable. The corrected verdict, stated once at the top
  > of this report and consistently everywhere it appears: the **schema half** of access control
  > transports and is proven (26 scoped ACLs, 27 of 27 role links, one commit, no remediation script);
  > the **assignment half** does not transport by any update set on this release and is a **BLOCKED
  > platform capability gap**, leaving **AAP §0.7.3 Gate 3 and AAP §0.7.4 UNSATISFIED**. Every
  > measurement in this bullet is unchanged — only the verdict is. The consequence is measured in
  > Step 7 §5-6: the sixteen ATF failures are the measurement of this one blocked gate.

- **`sys_grid_canvas_pane` = 0.** The documented consequence of fix (2) above — **and the diagnosis
  under it was wrong.** `sys_portal` rows are in fact carried by this package (8 of them, with 96
  preference rows), so nothing prevented the pane rows from travelling; what defeated them was the
  preview validator resolving references only against local records and standalone blocks in the same
  set. CR1 F02 records the full correction under fix (2) above. **In the bytes that ship now this delta
  is closed:** 8 pane rows are present, bundled with the widget instances they reference.

### 8. Step 6 — canonical replacement and cleanup

At the end of this consolidation,
`servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` held the
**exact bytes that were uploaded and committed** in §4 — not a re-export — re-verified in place:

| Property | Value (as of this consolidation) | Shipping now (after the CR1 amendment) |
| --- | --- | --- |
| **SHA-256** | `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` | **`751ceb61215f1207a7496693820007b5cd6ab1b43ce4cceed4e80f3208e72d4a`** |
| Bytes | 3,114,377 | **2,994,341** |
| Payload blocks | 522 | **522** |
| `xmllint --noout` | PASS | **PASS** |
| Gated by upload → preview → commit | **yes**, §4 | **no** — the recipient's first step, per [`../deployment.md`](../deployment.md) |

The right-hand column is the seven-amendment package described at the top of this report; the left-hand
column is retained because it is what §4's gate evidence was measured on.

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

Why the grants are absent is **already documented, and reported as blocking**: §Step 5-6 §7 of this report
proves at
record level that Role Management V2 owns `sys_user_has_role` on this release, that the update-set loader's
permission check therefore answers false and the platform logs "permission denied: no thrown error", and
that the three payloads were refused when stamped `Global` *and* when stamped `x_casemgmt` — so **no update
set can deliver these grants on this release**. The manual sequence is the role form's *Edit Members*, which
is what Step 4 did and what the Step 5b teardown then removed. The **cause** is thus a known limitation;
the **symptom** — sixteen ATF failures — is new, which is why every row above is classified (b) rather
than (a). It also explains the stale 17 / 3 baseline: `TES0001005` ran on the pre-teardown instance, where
Step 4's native grants were still in place.

> **CORRECTION 2026-09-09 (CR2, finding F09) — the sixteen failures are ONE measurement, and the gate they
> measure is BLOCKED, not accepted.** Two things in the paragraph above must be read exactly:
>
> 1. **The sixteen are not sixteen defects.** They are the *measurement* of a single blocked gate — the
>    three `sys_user_has_role` grants that no update set on this release can carry. Every one of them
>    fails at the first step performed as an impersonated persona, and the four measurements above
>    establish that root cause at record level. A reader must not conclude that the suite result is
>    unexplained, nor that sixteen independent bugs exist in the application.
> 2. **"Accepted" was the wrong classification.** The gap is **reported as a BLOCKED platform capability
>    gap**, per AAP §0.7.2's Minimal-Change Clause and §0.3.2's closing bullet, which require a gap PDI
>    cannot address to be stopped-and-reported rather than substituted. It leaves **AAP §0.7.3 Gate 3
>    and AAP §0.7.4 UNSATISFIED** for the deliverable, and no statement anywhere in this project may
>    present the role/grant gate as passing while this suite result stands. The corrected verdict is at
>    the top of this report and in §7 of Step 5-6.

**What was deliberately not done.** Granting those three roles would have turned all sixteen failures
green in minutes. That is exactly the live patch this step forbids, so it was not done — no role grant, no
ACL change, no configuration change, no edit to any record, and no edit to the package or the canonical
file. **Per the failure path, a fix for a (b) classification requires restarting from Step 5a in full —
fresh export, teardown, reimport, commit, re-run ATF — and never a live patch. That restart was not
performed here, and per this project's policy ATF failures do not block shipping the Step 6 file.** The
finding is escalated instead, with one caveat for whoever takes it: a Step 5a restart alone cannot close
it, because §7 establishes that no update set on this release can carry `sys_user_has_role`. **CORRECTED
2026-09-09 (CR2 F09):** there is no third option to find and none is proposed here. A post-commit native
grant step is a deployer's workaround, not gate satisfaction, and "an explicitly accepted limitation" is
the wrong classification — this is a **BLOCKED platform capability gap** and reporting it is the
resolution. The alternatives were evaluated and rejected on AAP grounds: the scoped Fix Script route was
removed by CR1, and a scoped Business Rule writing the global `sys_user_has_role` table would need
cross-scope privilege and would be an ongoing artifact the AAP does not enumerate.

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

Screenshots from the browser session (agent scratch, not repository files) — **all NOT RETAINED**
(CR2 F06): the scratch directory does not exist in or alongside this repository, so none of the paths
below can be opened, and the ATF result figures they backed are the recorded observations in §3 and §5
of this step rather than inspectable artefacts.

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-01-login.png` — **NOT RETAINED**
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-02-post-login.png` — **NOT RETAINED**
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-03-suite-record.png` — **NOT RETAINED**
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-04-pick-a-browser.png` — **NOT RETAINED**
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-atf-suite-result.png` — **NOT RETAINED**
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/u4-06-admin-case-form-g_form-present.png` — **NOT RETAINED**

One failure-detail screenshot per failing test, sixteen files, all in
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u4/shots/` — **NOT RETAINED** (CR2 F06):

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
| Credentials | same call, Basic auth as the **configured administrator** (`SERVICENOW_INSTANCE_ADMIN_USERNAME`; login identifier redacted per CR2 F11, and no password or token appears anywhere in this repository) | HTTP 200 — no 401, no 403, so no BLOCKED stop |
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
| `sys_user_has_role` (scoped roles) | **0** — the residual delta of §7, Step 5-6; **CR2 F09: a BLOCKED capability gap, AAP §0.7.3 Gate 3 / §0.7.4 unsatisfied** | Flows | 7 (active + published) |
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
| `sys_remote_update_set` | `9929f50df18ccec91ea13b2a3bccfc90` | — not read — | — not read — | — not read — | not queried | **EXCLUDED STRUCTURALLY before enumeration by the null-safe predicate (`sys_id is empty OR sys_id != 9929f50d…`) — untouched, uncounted, and no property of it published here (CORRECTED 2026-09-09, CR2 F07: this row previously published its name, state and child count)** |
| `sys_update_set` | `bce2c05c93934b1009aa70d19dba1042` | `x_casemgmt_case_management v1.0.0 (gate candidate)` | `complete` | 522 | n/a | this task's — DELETED |
| `sys_update_set` | `5e2b48dc93d34b1009aa70d19dba108a` | `Default` (scope's own, `is_default`) | `in progress` | 0 → 438 at deletion | n/a | this task's — DELETED |
| `sys_update_set` | `11226d84a56503108bb220b7a4d212b2` | `Default` (global) | `in progress` | 290, none `x_casemgmt`-named | n/a | global — left alone |
| `sys_update_set` | `2f6d66b1938b8f1009aa70d19dba10f0`, `a2bda2f1938b8f1009aa70d19dba1047` | other scopes' `Default` sets | `in progress` | — | n/a | other scopes — left alone |

`nameLIKE` and `descriptionLIKE` queries for the excluded package's marker text returned **0 rows on both
tables**, so that record is textually unidentifiable; it was therefore excluded **structurally, before
enumeration**, in every deletion loop and every count in this section, by the null-safe predicate
`sys_id is empty OR sys_id != 9929f50df18ccec91ea13b2a3bccfc90` — the explicit `ISEMPTY` OR term being
required because a bare `addQuery('sys_id','!=',X)` is a SQL `<>` comparison that does not match a
NULL-valued row (§6 below hit that exact trap on a reference column). Every count in this section is
therefore a **task-owned** count, never a raw total with the excluded record subtracted afterwards.

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
the **task-owned** `sys_update_xml application=<scope>` count read **1** rather than 0 under the exclusion
predicate — one row this task owned had survived. *(CORRECTED 2026-09-09, CR2 F07: this sentence previously
read "`sys_update_xml application=<scope>` read **927** rather than the excluded package's 926", which
derives the figure by subtracting the excluded record's children from a raw total. The task-owned count is
what is reported.)* A second sweep
reported `found=0` for everything — because `addQuery(ref,'!=',id)` does **not** match rows whose reference is
EMPTY (a SQL NULL comparison), so the row was invisible to it. Rewritten with encoded queries plus an in-loop
`getValue()` check, the third sweep found and deleted it: `67e39c9493574b1009aa70d19dba10b2 |
sys_app_82b99028936f74320d74d6f88357a5af | DELETE | Custom Application`, created **22:41:55 during the
teardown itself** and captured into the **global** `Default` set — the teardown recording its own DELETE.
Afterwards the **task-owned** residue was **0**: `sys_update_xml application=<scope>` with the exclusion
applied in the query (`^remote_update_setISEMPTY^ORremote_update_set!=9929f50d…`, null-safe by the
`ISEMPTY` OR term — without it the `!=` alone is the very SQL `<>` trap this paragraph is about) returns
**0** rows, and so does the same predicate combined with `nameLIKEx_casemgmt`. *(CORRECTED 2026-09-09,
CR2 F07: this sentence previously read "`sys_update_xml application=<scope>` = **926**, all of them the
excluded package's children". That is a raw total attributed to the excluded record, which F07 forbids;
the task-owned count is what is reported.)*

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

**8. `sys_remote_update_set` residue owned by this task → zero, with the exclusion applied in the query**

```
$ ... "sys_remote_update_set?sysparm_query=nameLIKEx_casemgmt%5Esys_idISEMPTY%5EORsys_id!%3D9929f50df18ccec91ea13b2a3bccfc90&sysparm_fields=sys_id,name,state"
{"result":[]}
task-owned count=0
```

**CORRECTED 2026-09-09 (code review CR2, finding F07).** This check previously ran without the exclusion
term, printed the excluded record's `sys_id`, `name`, `state` and `sys_mod_count` in its raw body, and then
reported "raw count=1 → excluding that record = 0"; a following paragraph published `sys_mod_count = 0` as
evidence of non-modification. All of that is withdrawn — a subtraction is not an exclusion, and reading the
record's fields is not leaving it untouched. The predicate is now part of the query, applied **before** the
count, and it is null-safe (`^sys_idISEMPTY^ORsys_id!=…`, because a bare `!=` is a SQL `<>` that does not
match a NULL-valued row). What is reported is the **task-owned** count: **0**. The record's own continued
existence was confirmed by an id-only existence probe that reads no field of it, and file-level
non-modification is evidenced where it belongs — by aggregate `git status` / `git diff --stat`.

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
| Portal, authenticated as the **configured administrator** | `/x_casemgmt_case_portal` | **"Page not found — The page you are looking for could not be found."** |
| Portal submit page, authenticated | `?id=x_casemgmt_case_submit` | same "Page not found" |
| Portal, signed out | `/x_casemgmt_case_portal` | HTTP 302 → `/session_timeout.do` login page; no portal renders |
| Custom Applications list | `/sys_app_list.do` | **"Unfiltered Custom Applications list showing 0 records … No records to display"**; page text contains neither `casemgmt` nor `case management` |
| Applications, filtered on the scope | `/sys_scope_list.do?sysparm_query=scope=x_casemgmt` | **"Filtered Applications list showing 0 records … No records to display"** |
| Anonymous REST endpoint | `GET /api/x_casemgmt/case_status_lookup?number=CASE9000002` | **HTTP 401** — the endpoint no longer serves |

Screenshots (agent scratch, not repository files):

- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-portal-after-teardown-authenticated.png` — the portal URL, authenticated, "Page not found" — **NOT RETAINED** (CR2 F06)
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-portal-after-teardown.png` — the portal URL signed out, redirected to login — **NOT RETAINED** (CR2 F06)
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-portal-submit-after-teardown.png` — the submit page, "Page not found" — **NOT RETAINED** (CR2 F06)
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-app-list-after-teardown.png` — Custom Applications, 0 records — **NOT RETAINED** (CR2 F06)
- `/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/shots/u5-scope-list-after-teardown.png` — Applications filtered on `scope=x_casemgmt`, 0 records — **NOT RETAINED** (CR2 F06)

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
  Management V2 refuses those payloads from any update set on this release; a deployer's manual sequence is
  the role form's *Edit Members* related list) and `sys_grid_canvas_pane` = 0 (those 8 rows point at
  `sys_portal` widget instances, not application files). Both dashboards still render from the committed
  report and placement records. **CORRECTED 2026-09-09 (CR2 F09):** the first of those two is not merely a
  "residual delta" — it is a **BLOCKED platform capability gap** that leaves **AAP §0.7.3 Gate 3 and
  AAP §0.7.4 UNSATISFIED** for this deliverable. The schema half of access control is proven from this one
  commit; the assignment half is not delivered by any update set on this release, and the *Edit Members*
  sequence is a deployer's workaround rather than gate satisfaction.

**(3) The ATF suite result is current against this exact file.** Cited from the Step 7 section, which ran it
against the artifacts this package's commit created, after that commit and against nothing else:

- Suite result **`TES0001006`** (`sys_id` `027c049093174b1009aa70d19dba109e`), created **2026-09-08 22:09:18
  UTC**: 20 tests — **4 Success · 16 Failure · 0 Error · 0 Skipped**; 180 steps = 64 success + 16 failure +
  100 skipped. Passing: ATF 01, ATF 18, ATF 19, ATF 20.
- All sixteen failures are itemized by name in the Step 7 section, and **all sixteen are classified (b) — new
  defect** rather than (a) — accepted-failure-register: they share **one root cause**, that the three demo
  personas hold no role grants, which is the same `sys_user_has_role` class the package cannot carry. None of
  the sixteen matches the project's accepted-failure register, and the stale `TES0001005` = 17 / 3 / 0 / 0
  baseline is superseded and is not quoted as a result anywhere. **CORRECTED 2026-09-09 (CR2 F09):** the
  sixteen are **one measurement, not sixteen defects** — they are how the blocked assignment half of
  AAP §0.7.3 Gate 3 / §0.7.4 shows up in a test run. The suite result is therefore fully explained, and it
  is explained by a gate that is **not met** rather than by one that passed.
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
record (`sys_remote_update_set` `9929f50df18ccec91ea13b2a3bccfc90`) was excluded **structurally, before
enumeration**, from every deletion loop and every count in this section, by the null-safe predicate
`sys_id is empty OR sys_id != 9929f50df18ccec91ea13b2a3bccfc90`. *(CORRECTED 2026-09-09, CR2 F07: this
sentence previously published that record's `sys_mod_count` and `state`, and asserted its `sys_mod_count`
again after the teardown. Those figures are withdrawn — reading them is a form of counting the record. Only
the predicate and the resulting task-owned counts are reported, and file-level non-modification rests on the
aggregate `git status` / `git diff --stat` evidence named in the same sentence.)*

**Which scripts were run, and why** (from the Step 3-4 section, D3.6):

| Script | Run? | Why |
|---|---|---|
| `scripts/create_choice_values.js` | **RUN** | newly authored for this task — ES5, idempotent, keyed on the natural key `(name, element, value)`: it inserts only what is missing, repairs a wrong `label`/`sequence`/`language`/`inactive` in place, never duplicates, reports a surplus as a failure exactly as it reports a shortfall, and prints a per-field expected-vs-found line plus a total and a verdict. No standalone choice-only script existed, and an Update Set commit does not transport `sys_choice` rows, so the 24 values across the 7 choice fields were created natively before the Step 5a export. *(CORRECTED 2026-09-09, CR2: a line count stood in this cell and has been removed — a line count in prose goes stale the moment the file is edited. The script's behaviour, described here, is what a reader needs; its header comment is the authority on how to run it.)* *(CORRECTED 2026-09-09, CR2 findings F01-F05: the description above is now the count-based part of a larger contract. The script refuses to write at all — before resolving the scope record — unless it is executing in the `x_casemgmt` scope and the `sys_scope` query for it resolves to exactly one well-formed row; it re-reads all 24 rows from the database after writing and fails on any attribute that did not persist; it verifies exactly one app-owned `sys_choice_set` composite per field, ownership included, and fails on a missing, duplicated, mis-owned or surplus one; and it detects a concurrent writer, stops writing and fails rather than duplicating a value. See §3 and the correction under §4's run table.)* |
| `scripts/seed_demo_data.js` | **RUN**, unmodified | the case/task/party linkage fix; it contains no `sys_choice` handling |
| `scripts/post_import_remediation.js` and its Fix Script twin `scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` | **NOT RUN** | not choice-only: its `ensureTable`, dictionary, ACL and number branches — including a destructive table delete — would have mutated the Step 2 natively-committed rebuild output, which the directive classifies as a CRITICAL trigger. The five measured reasons are recorded in the Step 3-4 section |
| `scripts/pre_delete_collateral_guard.js` | **RUN**, unmodified, read-only | used here in §4 to bound the blast radius before the teardown |
| `scripts/transition_logic_regression_assertions.js` | **RUN** | the 13-assertion harness, re-run against this package's committed artifacts (§12 item 3) |

**No user-specified Rules exist for this project.** `review_rules` reports "No user rules provided", so there
was no Rule-versus-directive conflict anywhere in this task. The work was therefore held to enterprise-standard
best practice plus the AAP's standing constraints that the directive does not touch and no override relaxes:
no hardcoded `sys_id` in package artifacts, synthetic data only with no PII, scope-namespace exclusivity with
zero global-scope writes, no global ACLs and no stock-role grants **authored or performed by this work**, no
SMTP or email configuration, no
ServiceNow Store apps, AAP §0.5.2 dependency ordering in the shipped package, and no secret — instance URL,
username, password or session token — written into any repository file.

**CORRECTED 2026-09-09 (CR2, finding F11) — the last item was not fully true when written, and the
redaction rule now applied is stated here so a reader can audit it.** No password, no instance URL and
no session token appeared anywhere; the **configured administrator's login identifier** did, tied to
Basic authentication and to live session identity. Every such occurrence has been replaced with
`<configured administrator>` or with the environment-variable name
`SERVICENOW_INSTANCE_ADMIN_USERNAME`. The rule, applied surgically:

- **Redacted** wherever the token named the *account this work authenticated as* — `g_user` readings,
  `g_user.userName`, "Basic auth as …", the browser observation rows, and the `sys_user_preference`
  account.
- **Recorded as the required role instead** wherever the point was *provenance* — who or what authored
  a row: `sys_created_by` on the audited links, the 58 `sys_update_xml` captures, and the `Created by
  (role)` columns in §7-§8, which now carry `admin` / `security_admin` as roles.
- **Left as written** wherever the token denotes a **role name or a platform mechanism** rather than a
  login: `hasRole('admin')`, `admin_overrides`, the elevated `security_admin` session, a role column in
  an ACL table, another document's section title quoted verbatim, and the privilege-level comparisons
  in Step 3-4 §9 and Step 7 §6 that contrast what an `admin`-level user sees with what a scoped-role
  persona sees. Redacting those would destroy the statement being made.
- **Not touched at all:** `sys_created_by` values inside exported XML payloads, which live in files
  this correction does not own.

**CORRECTED 2026-09-09 (CR2, finding F10) — the "no stock-role grants" item needs its boundary stated.**
This work authored no stock-role grant and no `roles/*.xml` inherits one (all three carry an empty
self-closing `<includes_roles/>`, and the canonical package holds 0 occurrences of
`snc_required_script_writer_permission` and 0 `sys_user_role_contains` payloads). But the **platform**
derived an `inherited=true` `snc_required_script_writer_permission` companion row on each of the three
demo personas when their scoped role was granted through the native path, and impersonation shows it
effective. That is reported as a **BLOCKING capability gap** — §8 and §9 of Step 3-4 and **ADV-3** in
`../PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` — and not as compliance: removing it would require writing
global `sys_user_has_role` rows AAP §0.3.2 forbids this package to own.

**Outcome classification.** The run did **not** end CRITICAL, and it did not take the directive's CRITICAL
stop path. Step 5c was a clean pass on the first
gated attempt after one earlier failure cycle (1 of the 2 permitted, recorded in the Step 5-6 section), the
canonical file was replaced with the gated export, and the instance was then emptied. Had the run ended
CRITICAL, this section would record that the canonical file had been left unchanged and why; it does not,
because it did not.

**CORRECTED 2026-09-09 (CR2, findings F09 and F10) — two BLOCKED capability gaps are reported against this
deliverable, and the line above may not be read as denying them.** The run's *process* outcome and the
deliverable's *gate* outcome are different things. Reported blocked:

1. **The three `sys_user_has_role` grants do not transport** by any update set on this release. The
   schema half of access control is proven from one commit (26 scoped ACLs, 27 of 27 role links, no
   remediation script); the assignment half is a **BLOCKED platform capability gap**, leaving
   **AAP §0.7.3 Gate 3 and AAP §0.7.4 UNSATISFIED**. The sixteen ATF failures are its measurement
   (Step 7 §5-6, and the CR2 F09 correction at the top of this report).
2. **A scoped-application persona cannot be provisioned through the platform's own native role-grant
   path without the platform adding a stock role** — the `snc_required_script_writer_permission`
   companion, recorded in §8 and §9 of Step 3-4 with the CR2 F10 correction there. Removing it would
   mean writing global `sys_user_has_role` rows this package does not own, which **AAP §0.3.2**
   forbids, so it is reported rather than accepted or worked around.

### 15. Evidence artifacts for this step

Raw command-and-response captures and run logs (agent scratch, not repository files) in
`/tmp/blitzy/scratch/7871c364-a98a-4b0b-9eda-3e6a8571a6d2/dest/u5/` — **all NOT RETAINED** (CR2 F06):
`ten_checks.txt` (all ten checks with the
exact curl command above each raw body), `ten_checks_final.txt` (the final full pass), `purge_log.txt` (the
deletion ledger, `found`/`deleted` per class), `global_before.txt` / `global_after.txt` (the 28 collateral
counters), `guard_out.html` (the collateral guard's enumeration), `browser_report.json` /
`browser_report2.json` (the browser observations quoted in §9) and the five screenshots listed there.

**CORRECTION 2026-09-09 (CR2, finding F06).** That scratch directory does not exist in or alongside this
repository and none of the files above can be opened. This does **not** weaken this step's ten-check
result, and the distinction matters: for **Step 8** the verbatim `curl` command and the raw response body
of every one of the ten checks are transcribed into **§7 of this section**, in the report itself, so the
Step 8 zero-state gate is proven from retained material and the lost scratch copies are a duplicate. The
**Step 5b** pass is the one with no in-report raw capture at all, and it is marked evidence-unproven at
raw level in its own section. The Step 1-2 pass sits between the two: its §6 table carries a run
timestamp and a raw response body per check, but not the verbatim request line for every check, and its
check 10 reports nine classes in one cell with a per-class `0` each.

Because the instance no longer holds the application, the raw bodies quoted in §7 and the numbers in this
section are the durable record of the teardown; there is nothing left on the instance to re-measure them
against, which is the intended outcome.

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
step outside this task's scope; a reader doing that should note the caveat in §13 and, **CORRECTED
2026-09-09 (CR2 F09)**, that the three `sys_user_has_role` grants are **not a step the package carries and
not a step that closes its gate**: no update set on this release can deliver them, so the deliverable leaves
**AAP §0.7.3 Gate 3 and AAP §0.7.4 unsatisfied** and that is reported as a BLOCKED platform capability gap.
The *Edit Members* sequence in
[`../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5h](../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) is what a deployer must
do to make the personas usable; it does not make the gate met.
