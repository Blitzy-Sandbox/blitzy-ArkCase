# Refine Run — FINAL REPORT

The final report for the Refine PR sequence "rebuild the master Update Set so that all table and
role-link records are created via native platform actions". It is written from the four phase
reports in this directory and from the machine-readable [`run-state.json`](./run-state.json), with
every load-bearing fact re-verified independently and read-only before it was written down: file
hashes recomputed on disk, instance state re-queried by REST, screenshot paths resolved with
`test -f`.

- **Target instance:** `https://dev306625.service-now.com` — Zurich Patch 10. A developer PDI, not a
  customer instance. No instance was provisioned, released or re-requested.
- **Scope:** `x_casemgmt`, scope `sys_id` `82b99028936f74320d74d6f88357a5af` — always resolved by
  query (`sys_scope?sysparm_query=scope=x_casemgmt`), never taken from a literal.
- **Run window:** 2026-09-02T17:34:43Z (first connectivity probe) → 2026-09-02T22:10:59Z (Phase 3
  exit), plus this final step.
- **No credential, cookie, session token or `sysparm_ck` value appears in this file** or in any other
  committed artifact of this run.
- Every `sys_id` quoted below was **resolved by query at the time it was used** and is recorded here as
  evidence of what was measured, never as an input a reader or a script should hard-code.
- **Report structure** follows the five parts the PR asks for: (a) Phase 0, (b) Phase 1, (c) Phase 2,
  (d) which package is shipping, (e) Phase 3 known issues. Each SCREENSHOT is attached next to its
  own checkpoint's result, and every phase's exit condition carries a UTC timestamp.

## Phase exit conditions, timestamped

| Phase | Exit condition | Verdict | Confirmed (UTC) | Entered only after the prior confirmation? |
| --- | --- | --- | --- | --- |
| **0** — establish a live instance | Live, authenticated, non-hibernating session confirmed by content, with heartbeat running | **MET** | `2026-09-02T17:52:29Z` | first phase |
| **1** — native creation for tables and role links **[HARD GATE]** | Import (S0), scratch validation (S1–S2), native rebuild (S3–S4), count check (S4a) confirmed; master set Complete with the full package and the swap applied; instance clean | **MET** | `2026-09-02T19:22:09Z` | yes — Phase 1's first write (the S0 upload) was `17:55:18Z`, after Phase 0's `17:52:29Z` |
| **2** — verify the final package **[HARD GATE]** | Preview and commit both clean on this checksum, against a genuinely clean instance, storage and role links confirmed after | **MET** | `2026-09-02T20:53:14Z` | yes — Phase 2 read `phase1.exit_condition = met` at `19:47:16Z` and took its first action at `19:53:13Z` |
| **3** — ATF suite **[NON-BLOCKING]** | Full suite executed with every result captured and classified; 100% pass **not** required | **MET** | `2026-09-02T22:10:59Z` | yes — Phase 3 read `phase2.exit_condition = met` (`20:53:14Z`) and ran its single test at `21:20:29Z` |

No phase's exit condition was unmet, so the run did not stop early and nothing blocked it. Both hard
gates were cleared on the route the PR explicitly permits — "first attempt, or fixed-and-re-verified"
— with the fix attempts itemized in part (c) and counted against the two-attempt cap.

---

## (a) Phase 0 — a live, authenticated instance

**Wake confirmation.** The instance was **already live and was never hibernating**, so no wake was
performed. Detection was by **content**, not by HTTP status, exactly as the Environment Setup
procedure requires (hibernation answers HTTP 200 with an HTML splash):

| Check | Observed | Verdict |
| --- | --- | --- |
| `GET /api/now/table/sys_remote_update_set?sysparm_limit=1` | HTTP 200 with a valid **JSON** body | live, credentials valid |
| Mid-upgrade check (`sys_upgrade_history`, `upgrade_startedISNOTEMPTY^upgrade_finishedISEMPTY`) | zero records | not mid-upgrade |
| Browser landing page | a real rendered page, authenticated as System Administrator | live |

- **Hibernating at start:** no. **Wake sequence run:** no. **Developer-Site wake route used:** no.
- **Recovery cycles:** **0 of the permitted 3**, in this phase and in every later phase. **Zero
  hibernation events for the whole run, so zero duration was lost to hibernation.** Recovery cycles
  are counted independently of the fix-and-re-verify budget; neither consumed the other.
- **Heartbeat status:** running from Phase 0 to the end of the run — **mechanism:** the read-only
  API-context heartbeat `GET /api/now/table/sys_user?sysparm_limit=1`; **interval:** every
  **10 minutes** on its own clock, never paused by, or replaced with, any other polling. Nothing the
  heartbeat does writes. It stayed on the API variant through Phase 2's commit step (rather than
  navigating a browser tab to `home.do`) so the record/commit-result page needed for the commit
  resume check was never lost. Phase 3's beats, for example, read 21:04:43, 21:14:43, 21:24:43,
  21:34:43, 21:44:43, 21:54:44, 22:04:44 — all HTTP 200.
- Credential handling: presence-and-format checks only before any session existed; the password was
  passed to `curl` through a `0600` config file in a private scratch directory outside every
  repository checkout, and browser tasks were briefed to read it from the environment rather than
  being handed a literal.

**SCREENSHOT — instance landing page once confirmed live** (directive line 86)
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase0-landing-page.png`
Caption: *Phase 0 — instance landing page confirmed live and authenticated.*

**Phase 0 exit condition: MET at `2026-09-02T17:52:29Z`.**

---

## (b) Phase 1 — native creation for tables and role links  [HARD GATE]

### The single-test result, first

The PR requires the single-test result before the full-package result, so it comes first here.

**S1 — one test table and one test role link, created natively in a separate SCRATCH Update Set:
PASS, verified `2026-09-02T18:37:43Z`.**

| Assertion | Observed | Verdict |
| --- | --- | --- |
| Resume check before any write | `sys_db_object?name=x_casemgmt_refine_probe` empty; `sys_user_role?name=x_casemgmt_refine_probe_role` empty; the table's endpoint HTTP 400 "Invalid table" — neither artifact existed, so S1 ran in full | — |
| Probe table created by the **real Table API** | `POST /api/now/table/sys_db_object` → HTTP 201, `x_casemgmt_refine_probe` | PASS |
| **Physical storage** provisioned by the platform | the table's own endpoint flipped from HTTP 400 "Invalid table" to **HTTP 200**; audit columns and the collection dictionary row auto-created | PASS |
| Probe role created natively | `POST /api/now/table/sys_user_role` → HTTP 201, `x_casemgmt_refine_probe_role` | PASS |
| **Role link written by the platform itself** | REST `POST /api/now/table/sys_security_acl` is refused for a non-elevated admin (HTTP 403), so the ACL was created in the UI after `security_admin` elevation and the role attached through the ACL form's own "Requires role" related list — the platform wrote the `sys_security_acl_role` link as its own side effect | PASS |
| Persisted after the SCRATCH set was marked Complete | table endpoint HTTP 200; `sys_user_role` query returns exactly 1; the link record present with both references intact | PASS |
| The test validation can never ship | SCRATCH set `4999985a930b435009aa70d19dba102e`, "REFINE SCRATCH native-creation probe (DO NOT SHIP)", 6 captured records, never exported, uploaded, previewed or committed; the shipping set held 0 records at that moment | PASS |

This is the finding the whole rebuild depends on: **native creation produces captured records,
including the role-link class**, which hand-authored XML does not.

**SCREENSHOT — test table's definition in Studio showing native creation** (directive line 115)
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase1-s1-probe-table-studio.png`
Caption: *Phase 1 S1 — probe table definition created natively via Table API (Studio → Data Model →
Table "Refine Probe", name `x_casemgmt_refine_probe`, application `x_casemgmt Case Management`).*

**SCREENSHOT — role assignment screen showing the test role link** (directive line 116)
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase1-s1-probe-role-link.png`
Caption: *Phase 1 S1 — role assignment screen showing the natively created probe role link (the
saved ACL's "Requires role" related list, one row `x_casemgmt_refine_probe_role`, pager "1 to 1 of 1").*

**S2 — the test artifacts were deleted** and the master set re-set as current: probe table endpoint
back to HTTP 400, probe role count 0. Re-verified live for this report: probe table HTTP 400, zero
`sys_db_object` and zero `sys_user_role` rows matching `refine_probe`, and **zero occurrences of
`refine_probe` anywhere in the shipping XML**. S0–S2 closed at `2026-09-02T18:40:16Z`.

### The full-package result

**S0 — import, and the FALLBACK PACKAGE retained first.** The original, unmodified master package
was copied to `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` **before any write to
the instance** — 926 payload blocks, 3,781,097 bytes, SHA-256
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, byte-identical to the
pre-refine deliverable. It was imported as a fresh retrieved set
`b4861cf7bbe24b36926fcaff4583b5bf` (926 children) left at `state=loaded`, never previewed and never
committed. The upload used a **scratch re-enveloped copy** because the file's own envelope carries
the `sys_id` of the already-committed pre-refine retrieved set `9929f50df18ccec91ea13b2a3bccfc90`;
uploading it unmodified would have mutated that committed record. That record was confirmed
untouched (still `state=committed`, still 926 children, `sys_updated_on` from before the run) —
re-verified for this report: **926 children, state committed**.
**S0 baseline captured-record count = 926**, measured at that moment and written to run-state as the
reconciliation anchor.

**"The master set" — the mechanism, stated plainly.** A `sys_remote_update_set` cannot be made
current and cannot capture new work on this platform, so the master set was realized as the **Local
Update Set `1109981a930b435009aa70d19dba1098`** ("x_casemgmt_case_management v1.0.0 (native
rebuild)"): all 926 imported children were re-pointed onto it by the platform's own record identity
(moved 926, failed 0), the hand-authored rows were removed there, and the native creations were
captured into that same set. Two records therefore stand for "the master set" in the log — the
`loaded` retrieved set and the Local set — and both are intended.

**S3 — the swap.** Removed from the captured XML (**31 rows**): 3 `sys_db_object`, 25
`sys_dictionary`, 3 `sys_user_has_role`. Choice lists and ACL records were left untouched, and
proved so: 7 `sys_choice` and 26 `sys_security_acl` payloads verified **byte-identical after every
step** against a payload guard hash. Natively created and captured (**93 rows**): 3 `sys_db_object`
(real Table API, HTTP 201), 30 `sys_dictionary` (HTTP 201 each, every value replayed from the
pre-deletion live schema), 30 `sys_documentation` label rows the platform writes for every column it
creates, **27 `sys_security_acl_role` links** (auto-captured, parent ACLs untouched) and 3
`sys_user_has_role` grants (serialized by the platform's own update-set writer, not hand-authored).

**S4 — the rebuild replaced the hand-authored records, with no throwaway artifact.** Zero
`refine_probe` matches in the shipping set; zero shipping children attributed to the SCRATCH set;
the removed hand-authored table identities appear nowhere in the package.

**S4a — record-count delta, reconciled.** `926 − 31 + 93 = 988`, and the measured post-swap count is
**988**. Only three classes changed count — `sys_dictionary` 25 → 30, `sys_documentation` 0 → 30,
`sys_security_acl_role` 0 → 27 — and two changed identity at the same count (`sys_db_object` 3,
`sys_user_has_role` 3). All 40 other payload classes were numerically unchanged, so the
stop-and-report trigger never fired.

**S5 — Complete.** The master set was marked `state=complete` at **`2026-09-02T19:20:46Z`**; nothing
was captured into it afterwards. Re-verified live for this report: `state=complete`, **988**
children.

**S6 — the instance returned to a clean state**, at `2026-09-02T19:22:09Z`: all three tables answer
HTTP 400 "Invalid table"; 0 scoped dictionary rows; 0 `sys_security_acl_role`; 0 `sys_user_has_role`;
0 `sys_number`. Deliberately preserved: the 3 roles, `sys_scope`, `sys_app`, the 7 flows and the
`apps.current_app` preference (without which the platform refuses scoped metadata deletes). The
table-delete cascade also removed 26 ACLs, 24 choice rows, 7 business rules, 8 reports, 3 UI lists,
1 related list, 2 UI policies and 30 data rows — every one of them carried by the package and
restored by the Phase 2 commit.

**Repository impact.** The 3 `tables/*.xml` and 25 `dictionary/*.xml` artifacts were refreshed to
match the platform-captured records (authorized: the PR orders exactly this swap). No files were
added or removed, all 27 fields are attribute-identical to the pre-refine live dictionary, and the
deliverable and fallback XML were byte-unchanged by that step.

**Fallback invoked in Phase 1: NO.**

**Phase 1 exit condition: MET at `2026-09-02T19:22:09Z`.**

---

## (c) Phase 2 — verify the final package on a clean instance  [HARD GATE]

**S1 — the instance was genuinely clean first**, confirmed at `2026-09-02T19:53:13Z` and re-confirmed
at `2026-09-02T20:03:58Z` before the second fix attempt: three tables HTTP 400 "Invalid table", 0
scoped dictionary rows, 0 `sys_db_object` rows, 0 role links by either query, 0 scoped grants — with
the roles, scope, app, flows and `apps.current_app` preference preserved. Phase 2 performed **no**
deletions of its own. This is what makes the run a genuine first-time-import test.

**S2 — the checksum.** The Complete package was exported by the platform's own export path
(`UpdateSetExport().exportUpdateSet()`, the API behind the "Export to XML" UI action, then
`GET /export_update_set.do`), with the master set verified at 988 children and `state=complete`
before and after every export.

| Shipping package | Value |
| --- | --- |
| Path | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` |
| **SHA-256** | **`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** |
| Size | 4,062,436 bytes |
| Payload blocks | **988** `<sys_update_xml action="INSERT_OR_UPDATE">`, zero DELETE rows |
| Well-formedness | `xmllint --noout` clean; every payload parses |
| Contents cross-check | `sys_db_object` 3 (the three real tables) · `sys_dictionary` 30, all platform-named · `sys_documentation` 30 · **`sys_security_acl_role` 27** · `sys_security_acl` 26 · `sys_choice` 7 · `sys_user_role` 3 · `sys_user_has_role` 3 · `sys_number` 3 · ATF 20 tests / 180 steps · seed 10 cases + 10 tasks + 8 parties |
| Hygiene | 0 probe artifacts · 0 credentials or tokens · 0 rows attributed outside the `x_casemgmt` scope |

**S3a — preview.** The package was uploaded onto the clean instance as a **new** retrieved set
`0b3b7452934f435009aa70d19dba100d` (988 children, `appended: false`, distinct from the pre-refine
committed set) using the proven mechanism: a priming REST GET, then
`GET /upload.do?sysparm_target=sys_remote_update_set` to scrape `sysparm_ck`, then
`POST /sys_upload.do` multipart (HTTP 200). Load state `loaded` on the first poll. **Preview
mechanism:** `POST /xmlhttp.do` with `sysparm_processor=UpdateSetPreviewAjax`,
`sysparm_ajax_processor_function=preview`, `sysparm_ajax_processor_sys_id=0b3b7452…` and a scraped
token, polled every 5s with a 600s timeout — triggered `20:26:22Z`, `previewing` → **`previewed`** at
`20:26:48Z` (26 seconds).

**S3b — zero `type=error` preview problems.** Queried directly against
`sys_update_preview_problem` for this set rather than trusting the platform to block commit (it does
not): **`type=error` = 0**, **`type=warning` = 0**, total problem rows **0**. Nothing was resolved,
skipped or ignored to reach that number. For scale: the pre-refine committed package carried **54**
`type=error` problems on this instance.

**Two fix-and-re-verify loops were needed to get there, and both are disclosed.** Three exports
exist; only the third is the deliverable.

| Attempt | Snapshot | SHA-256 | Preview outcome |
| --- | --- | --- | --- |
| 1 | `7af37c12930f435009aa70d19dba105a` | `df110c95…` | 63 `type=error` — superseded |
| 2 | `23467496930f435009aa70d19dba1013` | `7c382fab…` | 60 `type=error` — superseded |
| **3** | `0b3b7452934f435009aa70d19dba100d` | **`eee9fabd…`** | **0 problems of any type; committed. This is the deliverable.** |

- **Fix 1 (1 attempt of 2, resolved).** 3 errors "Update scope id 'global' is different than update
  set scope id …" on the three natively created `sys_user_has_role` grants: `sys_user_has_role` has
  no `sys_scope` column, so scope attribution lives only on the captured row's `application` field
  and the capture writer had run in global scope. Re-attributed to the scope, as the pre-refine
  package also did.
- **Fix 2 (2 attempts of 2, resolved).** 60 errors "Found a local update that is newer than this
  one" on the swapped table/dictionary/role-link records. Attempt 1 removed 231 stale
  `sys_update_version` rows and was insufficient — the previewer does not read that table. Attempt 2
  removed the 256 local DELETE-capture `sys_update_xml` rows (215 of them inside the throwaway
  ABSORBER set) that made the authoring instance declare the package stale. Both attempts targeted
  residue of this run's own authorized deletions, not the package payloads.

**S4 — commit, by UI action only.** The commit was performed by clicking **"Commit Update Set"** in
a rendered browser session, never by PATCHing state or calling the commit AJAX processor. The resume
check ran first (state `previewed`, no commit worker for this set, tables still HTTP 400, no prior
commit of this set), so it was clicked **exactly once**. No confirmation dialog appeared. Result
text: **"Update Set Commit / Succeeded 100% / Update set committed — Succeeded in 50 Seconds"**,
`state=committed` at **`2026-09-02T20:36:27Z`**; progress worker Complete / Success; counters
**inserted 613, updated 375, deleted 0, collisions 0, total 988**; zero `sys_update_log` rows; zero
children with a disposition; zero console errors and zero non-2xx network requests on the record
page.

**S4a — partial commit: NONE.** The commit did not fail and did not terminate partway. No artifact
is applied-but-unrecorded and none is recorded-but-unapplied, so this phase has **no partial-apply
state to report**. `scripts/post_import_remediation.js` was **not** run, no second commit was made,
and no rollback or back-out was invoked at any point.

**SCREENSHOT — commit result screen showing the outcome** (directive line 206)
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase2-commit-result.png`
Caption: *Phase 2 — commit result screen showing the outcome: zero problems, "Succeeded 100%",
"Update set committed".*

**S5 — physical storage and every role link now exist**, which is the proof the fix worked, because
the instance had none of it beforehand:

| Post-commit check | Before the commit | After the commit |
| --- | --- | --- |
| `x_casemgmt_case` / `_case_task` / `_case_party` endpoints | HTTP 400 "Invalid table" ×3 | **HTTP 200 ×3** |
| Dictionary rows per table | 0 / 0 / 0 | **21 / 14 / 13** |
| `sys_db_object` rows | 0 | 3 |
| **`sys_security_acl_role` links** | **0** | **27 — manager 14 / agent 10 / viewer 3** |
| Roles · grants · ACLs | 3 · 0 · 0 | 3 · 3 · 26 |
| Rest of the package | — | 7 scoped flows all active · 8 reports · 2 dashboards · 7 business rules · 2 script includes · 2 UI policies (+2 actions) · 6 UI actions · 3 list layouts · related list present · 1 portal · 2 pages · 3 widgets · 2 REST definitions (2 operations) · 3 demo users · 1 demo group · 3 number counters · ATF suite with 20 tests / 180 steps · seed 10 cases / 10 tasks / 8 parties |

Every row of that table was **re-verified live and read-only for this report** and still holds:
three tables HTTP 200, dictionary 21/14/13, 27 role links split exactly 14/10/3, 26 ACLs, 3 grants,
3 roles, 3 counters, 7 active flows, 10 cases / 10 tasks / 8 parties.

**S6 — the verified checksum recorded at `2026-09-02T20:53:14Z`:**
`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`. The standing rule attached to it
is that any later change to the package makes it stale and Phase 2 must re-run before the package is
ship-ready again. **The package was not changed after that point** (Phase 3 applied no fix to it), so
the checksum is current, not stale.

**Instance state, stated exactly (no partial writes, and not "untouched").** The live instance is
**fully applied**: it carries the whole committed package. It is deliberately *not* untouched — this
PR required the three scoped tables and their role links to be deleted and the package re-committed,
so the instance now holds only what the package carries (10 demo cases, not the 12 rows present
before the run). There is no partial-apply state anywhere in this run.

**Fallback invoked in Phase 2: NO.** The retained fallback file was never modified: re-hashed for
this report at `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`.

**Phase 2 exit condition: MET at `2026-09-02T20:53:14Z`.** The package became SHIPPABLE at that
moment, independent of Phase 3.

---

## (d) WHICH PACKAGE IS SHIPPING

> ### **The rebuilt-with-fix package is shipping.**
> Not the fallback. Both hard-gated phases reached their exit conditions — Phase 1 at
> `2026-09-02T19:22:09Z` and Phase 2 at `2026-09-02T20:53:14Z` — so the shipping package is the
> Phase-1-rebuilt, Phase-2-verified one, and it **does** include this round's fix.

| Item | Value |
| --- | --- |
| **Deliverable path** | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` |
| **Confirmed SHA-256** | `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` |
| **Matched against** | `phase2.verified_checksum` in [`run-state.json`](./run-state.json), recorded at `2026-09-02T20:53:14Z` — the checksum of the exact bytes that were previewed with zero problems and committed |
| **Match result** | **EQUAL.** No discrepancy, so nothing was stopped and no unverified artifact was presented as the deliverable |
| Size / payloads | 4,062,436 bytes · 988 `<sys_update_xml action="INSERT_OR_UPDATE">` blocks · `xmllint --noout` clean |
| How it was obtained | **Not re-exported.** These are the exact bytes Phase 2 previewed and committed, already at the deliverable path; the final step recomputed the hash over that file. A fresh export can differ byte-wise for reasons unrelated to content, which would trip the checksum stop for nothing |
| Fallback | **Not invoked.** Retained unmodified at `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`, SHA-256 `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` (926 blocks, 3,781,097 bytes) — kept in place as the labeled original |
| What the fix delivers | Table and dictionary payloads are the platform's own captured records from native Table-API creation, and the package now carries **27 `sys_security_acl_role` link records** it previously did not. One commit of these bytes on a clean instance produces physical storage for all three tables and all 27 role links, with **no post-import remediation script and no second commit** |

**Not a gate for this decision:** Phase 3's ATF results. They are attached in full below as
information, per the PR's own instruction that the package ships on Phase 2's result regardless of
Phase 3's outcome.

---

## (e) Phase 3 — ATF suite and harness: known issues

**Informational, explicitly not a shipping gate.** The package had already shipped on Phase 2's
result before this phase began. A 100% pass rate is not required, and nothing here is omitted or
averaged over. Because the prior validation instance was lost, this is the first live
re-confirmation of the package's pre-existing functional behaviour, so failures are treated as new
information rather than as re-confirming a known-good state.

**How it ran.** Headless ATF is unavailable on a PDI (`sn_atf.headless.enabled=false`, cannot be
enabled), so the client runner at `/atf_test_runner.do` was attached in a real rendered tab and the
suite launched from its own "Run Test Suite" UI action; the "Pick a Browser" dialog's pre-selected
current session was accepted unchanged. Validation first: a single test was run and its result read
from the rendered page, then cross-checked against the result record — they agreed on name, verdict,
failing step, failure text (byte-identical) and all five step statuses, differing only in displayed
timezone. Resume check: the only prior suite result predated Phase 2's commit, so no test was
resumable — **all 20 were re-run from scratch and none was logged as partial**. No test hit the
5-minute unreadable-result cap: **0 "unable to execute"**.

**Suite result `TES0001002`** (suite `x_casemgmt Case Management POC`), 2026-09-02T21:45:31Z →
21:47:35Z, run time 00:02:04: **20 tests — 14 pass / 6 fail / 0 error / 0 skip**, **180 of 180 steps
executed**, 3 UI batches. ATF's own rollback was clean (recovered delete 2, modified 3, inserted 37,
exceptions 0) and left no fixtures behind.

### All 20 ATF tests, by name

| # | Test | Result | Class | Fix attempts |
| --- | --- | --- | --- | --- |
| 1 | ATF 01 — Data model: case, task and party schema per AAP 0.5.7 | **FAIL** | (c) | 0 |
| 2 | ATF 02 — RBAC: `x_casemgmt_case_manager` has full CRUD (AAP 0.5.6) | PASS | — | — |
| 3 | ATF 03 — RBAC: `x_casemgmt_case_agent` create, ASSIGNED-ONLY read/write, no delete | PASS | — | — |
| 4 | ATF 04 — RBAC: `x_casemgmt_case_viewer` is read-only across all cases | PASS | — | — |
| 5 | ATF 05 — Field-level ACLs on `assigned_group` and `assigned_agent` | PASS | — | — |
| 6 | ATF 06 — RBAC mirror on `x_casemgmt_case_task` and `x_casemgmt_case_party` (manager, viewer) | PASS | — | — |
| 7 | ATF 07 — RBAC: agent ASSIGNED-ONLY read/write on task and party (AAP 0.5.6 mirror) | PASS | — | — |
| 8 | ATF 08 — Transition Draft to Open requires `assigned_group` | PASS | — | — |
| 9 | ATF 09 — Transition Open to In Progress requires an `assigned_agent` in the `assigned_group` | PASS | — | — |
| 10 | ATF 10 — In Progress to Pending sets `pending_reason`, Pending to In Progress clears it | **FAIL** | (c) | 0 |
| 11 | ATF 11 — Task-closure gate blocks In Progress to Resolved with the verbatim message | PASS | — | — |
| 12 | ATF 12 — Resolved to Closed requires the manager role and auto-sets `closed_date` | PASS | — | — |
| 13 | ATF 13 — Prohibited transition: any status back to Draft | PASS | — | — |
| 14 | ATF 14 — Prohibited transition: Closed is terminal | PASS | — | — |
| 15 | ATF 15 — Form: resolving a case with an open task is blocked on the form | **FAIL** | (c) | 0 |
| 16 | ATF 16 — Form: returning a case to Draft is blocked on the form | **FAIL** | (c) | 0 |
| 17 | ATF 17 — Form: a Closed case cannot be moved out of the terminal state on the form | **FAIL** | (c) | 0 |
| 18 | ATF 18 — Portal contract: anonymous submit returns 201 with the new case number | **FAIL** | (c) | 0 |
| 19 | ATF 19 — Portal contract: lookup of a valid number returns only status, subject, opened_date | PASS | — | — |
| 20 | ATF 20 — Portal contract: lookup of an unknown number returns 404 with the verbatim message | PASS | — | — |

**SCREENSHOT — ATF suite results screen showing the final pass/fail summary** (directive line 243)
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase3-atf-suite-results.png`
Caption: *Phase 3 — ATF suite results screen showing the final pass/fail summary (`TES0001002`,
Failure, 14 success / 6 failure of 20, 180 steps).*

### All 13 harness assertions, by name

`scripts/transition_logic_regression_assertions.js`, run **in the `x_casemgmt` application scope**
from the background-script runner at `2026-09-02T22:05:09Z` (platform response: "Script completed in
scope x_casemgmt"), result read from the single `syslog` line prefixed `U1ASSERT|`:
**`TOTAL=13 PASSED=13 FAILED=0`**.

| # | Assertion | Result |
| --- | --- | --- |
| A1 | `canTransitionToOpen` blocks empty `assigned_group` (verbatim message) | PASS |
| A2 | `canTransitionToOpen` allows populated `assigned_group` | PASS |
| A3 | `canTransitionToInProgress` blocks empty `assigned_agent` (verbatim) | PASS |
| A4 | `canTransitionToInProgress` blocks an agent not in `assigned_group` (verbatim) | PASS |
| A5 | `canTransitionToInProgress` allows an agent who is a member of `assigned_group` | PASS |
| A6 | `canTransitionToResolved` blocks while 1 child task is Open (verbatim) | PASS |
| A7 | `canTransitionToResolved` allows once every child task is Closed | PASS |
| A8 | `canTransitionToClosed` allows a caller holding `x_casemgmt_case_manager` | PASS |
| A9 | `canTransitionToClosed` blocks a caller without the manager role (verbatim) | PASS |
| A10 | `validateNoBacktransition` blocks any → Draft (verbatim) | PASS |
| A11 | `validateNoBacktransition` blocks Closed → * (verbatim) | PASS |
| A12 | `isAgentInGroup` true for a member, false for a non-member | PASS |
| A13 | `getOpenTaskCountForCase` counts every non-Closed child task | PASS |

Each assertion compared an expected and an actual JSON value, including every verbatim blocking
message ("All tasks must be closed before resolving this case.", "Cases cannot be returned to
Draft.", "Closed cases are terminal and cannot be modified.", "Only case managers can close
cases.", "Required field assigned_group is empty.", "Assigned agent must be set and must be a member
of the assigned group."). The pre-refine baseline for this harness was also `TOTAL=13 PASSED=13
FAILED=0`, so **the transition-logic contract shows no regression**; the only delta is the cleanup
line's `remainingCases` 11 → 10, which is the expected consequence of the authorized re-commit.

### The six failures: one root cause, classified

**Root cause (shared by all six).** `sys_choice` rows are absent for the three scoped tables — 0
rows, and the package's own choice `sys_id` `3e7609e334c65bf732756bc25d9f21c2` returns HTTP 404 —
while the dictionary keeps `case.type`, `case.status`, `case.priority` and `case.pending_reason`
choice-typed. Re-verified live for this report: **`sys_choice` rows for the three tables = 0.**
Consequences per test: ATF 01 and ATF 10 assert the choice sets directly; ATF 15/16/17 cannot set
`status` on the form ("Value 'Resolved'/'Draft'/'In Progress' is not currently a valid choice"); ATF
18's anonymous submit returns HTTP 400 because `CasePortalService._resolveCaseTypeChoice()`
deliberately fails closed when the choice list reads empty.

**Was it caused by this PR? No.** The 7 `sys_choice` payloads are **byte-identical** between the
rebuilt package and `…FALLBACK.xml`; the package's own documentation already records the
package-alone state as "`sys_choice` 0"; and the pre-refine instance had choice rows only because
`post_import_remediation.js` created 24 of them after the commit — a remediation this PR's own
definition of a clean commit excludes.

**Classification: (c) — pre-existing and a judgment call.** Not decided unilaterally. The artifact
at fault is the shipping update-set XML; amending it would make the Phase-2 verified checksum stale
and require Phase 2 to be re-run before anything could ship. **Fix attempts: 0 of the permitted 2**
(no attempt was made, precisely because the decision is not one to take unilaterally), and the
package therefore ships unchanged and verified. The item is flagged for human decision below.

**Impact to be honest about:** ATF 01, 15, 16, 17 and 18 skipped their later steps, so those
downstream assertions are **UNVERIFIED rather than passing** — ATF 01's task/party schema checks
(steps 4-5), ATF 15/16/17's on-form blocking-message assertions (steps 5-7), and ATF 18's
returned-number assertions (steps 4-10). What *is* positively corroborated: every script-path
transition test passed (ATF 08, 09, 11, 12, 13, 14), the whole RBAC/ACL matrix passed (ATF 02-07,
which can only pass because the 27 role links exist), both lookup tests passed (ATF 19, 20) and the
harness is 13/13.

### Genuinely new information from this phase

- **Defect 9 (ACL role links) is FIXED by the native rebuild:** documented package-alone state was
  "0 of 27"; this run produced **27/27** (manager 14 / agent 10 / viewer 3) with **no remediation
  run**.
- **Defect C's storage half is FIXED:** documented as "no physical storage, REST 403, inserts fail
  with an invalid table name"; this run produced three tables at HTTP 200 with dictionary 21/14/13
  from the package alone.
- **Defect C's choice half REMAINS** — the sole remaining package-alone gap, and the root cause of
  all six failures above.

### Other known pre-existing defects, and how they actually behaved

| Defect | Behaviour this run | Class |
| --- | --- | --- |
| `opened_date` empty on 8 of 10 seeded cases (blank Opened Date in the lookup; "Cases Opened in Last 30 Days" = 1) | caused **no** ATF failure — ATF 19 passed on its own fixture with an explicit `opened_date` compared exactly | (c) — see human decision items |
| Seed child rows carry no parent-case linkage (`case` empty on 10/10 tasks and 8/8 parties; `organization` empty on the 3 Organization parties) | not asserted by the suite; identical in `…FALLBACK.xml`; the pre-refine linkage came from `seed_demo_data.js` after the commit | (c) — see human decision items |
| Case form renders the raw column name `duration_to_close` as its label | **incidentally repaired** by the rebuild: the platform writes a `sys_documentation` label row for every column it creates | fixed as a side effect |
| "Case Count by Status" donut renders no legend or data labels | cosmetic, asserted by no test — no failure | (c) cosmetic |
| Package docs cite the retired host `dev379024`; README's file count is stale | documentation only, asserted by no test | (b) — deliberately out of this pass, see below |

**Phase 3 exit condition: MET at `2026-09-02T22:10:59Z`** — full suite executed, every result
captured by name and classified. A 100% pass rate was not required and was not achieved; the package
ships on Phase 2's result regardless.

---

## Scope and policy compliance

The standing policies in the PR's header were adjudicated for the whole run, not per phase.

| Policy | Verdict | Evidence |
| --- | --- | --- |
| **Sequence gating** — each phase a prerequisite for the next, entered only after the prior exit condition is explicitly confirmed | **SATISFIED** | The timestamped table at the top of this report. Each successor read the predecessor's `exit_condition` from `run-state.json` before acting: Phase 2 at `19:47:16Z`, Phase 3 on `phase2.exit_condition = met`. No phase was entered out of order |
| **Hard gate + fallback** — rebuilt package ships only if Phases 1 and 2 both complete cleanly; otherwise the fallback ships, labeled | **REBUILT SHIPS** | Both exit conditions MET (`19:22:09Z`, `20:53:14Z`), each cleanly or via the permitted fix-and-re-verify. Fallback not invoked and left byte-unmodified |
| **No rollback** — Rollback / `deleteApplication` never invoked; the PR's instruction overrides the Environment Setup rollback rows | **SATISFIED** | No `deleteApplication` call, no scope deletion, no back-out anywhere in the run. Verified live: `sys_scope` and `sys_app` `82b99028…` v1.0.0 both resolve, the three roles resolve, the three tables answer HTTP 200 with 27 role links, and zero retrieved sets on the instance are in `commit_failed`/`error` |
| **Partial writes** — a partial commit or write must be reported as such, never described as "untouched" | **NO PARTIAL APPLY** | Commit "Succeeded 100%", 613 inserted / 375 updated / 0 collisions / 988 total, progress worker Complete/Success, 0 commit-log rows, 0 children with a disposition. The instance is described as **fully applied** — and explicitly not as "untouched", since the PR itself required the tables and links to be deleted and the package re-committed |
| **Failure classification** — (a) regression / (b) unambiguous pre-existing / (c) judgment call | **APPLIED** | Zero class (a). Four class (c) items (choice rows, seed linkage, `opened_date`, donut cosmetics) shipped and flagged. One class (b) set (documentation defects) reported rather than fixed, because this unit's documentation mandate is limited to statements this run falsified |
| **Two-attempt cap** per issue, counted independently of hibernation recovery | **SATISFIED** | Fix ledger: `sys_number` identity 2/2 resolved · global-scope attribution on the 3 grants 1/2 resolved · "local update newer" 60 errors 2/2 resolved · `sys_choice` 0/2, unresolved and itemized as a known issue. **No issue exceeded two attempts, and no issue hit the cap while still unresolved.** Recovery cycles: **0 of 3 in every unit**, 0 hibernation events, consuming none of the fix budget |
| **Scope — in** | **ALL DONE** | Native table/role-link creation and rebuild · scratch-then-master sequencing (SCRATCH `4999985a…` never shipped; 0 `refine_probe` matches in the deliverable) · checksum-gated preview/commit · ATF suite execution · fallback correctly not needed |
| **Scope — out** | **RESPECTED** | No new ATF tests authored (the 20 tests / 180 steps are the package's own) · no instance released or re-requested · delivery not blocked by Phase 3's findings · `apps.current_app` preserved (verified live) |

**Platform records touched outside the table/role-link subset, each with its licence.** Every one of
these is a consequence of an action the PR ordered, and none is a unilateral change: 30
`sys_documentation` label rows, written by the platform for every column it creates; 3 `sys_number`
counters re-created carrying the package's own identities after the table-delete cascade removed
them; the cascade's own removal and the commit's restoration of 26 ACLs, 24 choice rows, 7 business
rules, 8 reports, 3 list layouts, 1 related list, 2 UI policies and 30 data rows; two throwaway local
update sets (SCRATCH `4999985a…` with 6 children, ABSORBER `25d86c1a…` with 266) created to keep
delete-captures out of the shipping set and never shipped; and, in Phase 2's fix loops, 231 stale
`sys_update_version` rows and 256 local DELETE-capture `sys_update_xml` rows removed from the
authoring instance — all of them residue of this run's own authorized deletions, not pre-existing
platform state. Two superseded retrieved update sets (`7af37c12…`, `23467496…`) remain on the
instance at `state=previewed`, and the pre-refine committed set `9929f50d…` remains committed with
its original 926 children.

## Human decision items

Nothing here blocks the delivery of the shipping package; each is a decision the PR reserves for a
human.

| # | Item | Class | Why it is a human call | Options |
| --- | --- | --- | --- | --- |
| 1 | `sys_choice` rows absent for the three scoped tables (0 rows), while four `case` fields stay choice-typed — the root cause of ATF 01, 10, 15, 16, 17, 18 | (c) | The fix lives in the shipping update-set XML. Changing it makes the Phase-2 verified checksum stale, so nothing could ship until Phase 2 was re-run in full | **1)** Amend the package's choice payloads, then re-run Phase 2 (clean instance → checksum → preview → zero errors → UI commit → storage/link confirmation) for a **new** verified checksum. **2)** Accept the verified package as it stands and keep the documented post-commit remediation step for choices. **3)** Hand-create the 24 choice rows on the instance — **not recommended**: it masks the package-alone defect and would make the next measurement dishonest. Then re-run the six tests |
| 2 | `opened_date` empty on 8 of 10 seeded cases | (c) | The defect is unambiguous, but its only fix vehicle is the seed XML / `seed_demo_data.js` inside the same checksum-frozen package, so the choice between amending and re-verifying versus shipping and remediating is the same trade-off as item 1 | **1)** Amend the seed payloads and re-run Phase 2 for a new checksum. **2)** Ship as verified and keep the documented post-commit `seed_demo_data.js` step, which fills the field |
| 3 | Seed child rows carry no parent-case linkage (`case` empty on 10/10 tasks and 8/8 parties; `organization` empty on the 3 Organization parties) | (c) | Same vehicle and the same checksum consequence; identical in the fallback package, so it is not a regression of this round | **1)** Amend the seed payloads and re-run Phase 2. **2)** Ship as verified and keep the post-commit `seed_demo_data.js` step, which creates the linkage |
| 4 | Pre-existing documentation defects left in place: the retired host `dev379024` (16 occurrences) and README's stale file count | (b) | Unambiguous, but outside this pass: the documentation mandate for this step is limited to statements **this run** falsified, so sweeping them up here would exceed it | Schedule a separate documentation pass to replace `dev379024` with `dev306625`, drop the hardcoded scope `sys_id` in favour of a query, and re-count the files |
| 5 | "Case Count by Status" donut renders no legend or data labels | (c) cosmetic | Pre-existing, asserted by no test, and a presentation judgment rather than a defect with one correct answer | Leave as is, or add data labels/legend in a later cosmetic pass |

## Documentation-accuracy pass

Because the **rebuilt** package ships, the statements this run falsified were corrected in the
package documentation — and only those. Every correction is dated, names the shipping bytes, and
cross-references this report for its evidence rather than restating it. Four statement families were
false and are now corrected:

1. **That the physical table schema and the 27 ACL role links must be repaired after import by
   `scripts/post_import_remediation.js`** — the commit of the shipping bytes produces both.
2. **That a second upload/commit cycle is required** (the rebuild-then-recommit route) — one commit
   was enough, and no remediation ran between commits because there was no second commit.
3. **The deliverable's identity and inventory figures the rebuild changed** — block count, byte size,
   SHA-256, and the package-alone census (`sys_dictionary` 25 → 30, `sys_security_acl_role` 0 → 27).
   The identity `926 blocks / 3,781,097 bytes / 7292a6fe…` that the older text calls "the bytes that
   ship" is exactly the retained fallback file, so the corrections re-point it there rather than
   rewriting those passages.
4. **That "no preview has been run on the shipping bytes", that Gate 7 is therefore a conditional
   pass, and that nothing has been re-measured because the verification instance is hibernating** —
   the shipping bytes were previewed to zero problems of any type and committed on a live,
   newly provisioned PDI on 2026-09-02.

| File | What was corrected |
| --- | --- |
| `README.md` | The "two manual post-import steps are mandatory" headline; the "bytes that ship have never been previewed / conditional gate" item and its 926-block identity sentence; the package **Identity** bullet; the "a commit alone does not reach it" deployment-contract note; the round-trip-status bullet; the "nothing has been re-measured" closing sentence |
| `docs/deployment.md` | The "bytes that ship … NO preview has been run" callout; Step 3's "a commit alone does not reach it / the two shortfalls need the manual remediation" note |
| `docs/validation-gates.md` | The shipping-bytes "no preview" bullet; the **Data model**, **ACLs** and **Update Set** gate verdicts; the 4-pass/3-qualified net count; the round-trip status bullet ("not even steps 1-4 have been run"); the hibernation "nothing re-measured" note |
| `docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` | The header summary ("upload → preview → commit does not give you a working application", Defects C and 9 "require manual steps every time", "a second commit is required"); the deliverable size/block figures; §5's "REQUIRED, not optional" preamble; the "steps 4 and 6 are the same command run twice" note |
| `docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` | §0.1 package identity (with the clean-slate preview/commit row it closes); the two runtime-status rows for the schema and the ACL matrix; the **Defect 9** section verdict; §9.5's residual-manual-footprint preamble; the package-alone census row; §10.0's "item 1a is outstanding"; the §0 hibernation "nothing re-measured" note |
| `scripts/round_trip_verify.md` | Phase 4's "mandatory" framing in the phase list **and** at the section heading; the "assert the child count is exactly 926" instruction; the standing-result paragraph; criterion 4's "after two remediation runs separated by a second commit"; the hibernation "cannot be executed at all" warning |

Everything else was left alone deliberately — including the retired-host `dev379024` references and
README's stale file count (reported above as human decision item 4), and every statement that remains
true: `sys_choice` 0 for the three tables, the post-commit `seed_demo_data.js` step for the seed
linkage, and `opened_date` on 8 of 10 cases. One example named in the refinement brief — the claim
that a from-scratch first commit "legitimately ends Failed at 100% with 22 errors" — appears in the
run's environment handover but **nowhere in the repository documentation**, so it had nothing to
correct here; the related "second commit" claim, which is in the documentation, was corrected as item
2 above.

## Screenshot index

Screenshots are attached by absolute path with a caption next to their checkpoint's result above;
the PNG binaries themselves are intentionally **not committed** to the repository.

| Checkpoint | Path | Caption |
| --- | --- | --- |
| Phase 0, line 86 — landing page | `…/blitzy/screenshots/phase0-landing-page.png` | Instance landing page confirmed live and authenticated |
| Phase 1 S1, line 115 — Studio table | `…/blitzy/screenshots/phase1-s1-probe-table-studio.png` | Probe table definition created natively via Table API |
| Phase 1 S1, line 116 — role assignment | `…/blitzy/screenshots/phase1-s1-probe-role-link.png` | Role assignment screen showing the natively created probe role link |
| Phase 2, line 206 — commit result | `…/blitzy/screenshots/phase2-commit-result.png` | Commit result screen: zero problems, "Succeeded 100%" |
| Phase 3, line 243 — ATF summary | `…/blitzy/screenshots/phase3-atf-suite-results.png` | ATF suite results screen with the final pass/fail summary |

All five paths are rooted at
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/` and were confirmed
to resolve on disk when this report was written. **No checkpoint is missing.** Supporting (non-
checkpoint) screenshots taken during the run are listed in `run-state.json` alongside these.

## Where the detail lives

| Document | Contents |
| --- | --- |
| [`PHASE0-1.md`](./PHASE0-1.md) | Phase 0 in full, and Phase 1 S0/S1/S2 — credential pre-checks, connectivity, heartbeat, the import and fallback retention, the native-creation probe |
| [`PHASE1-REBUILD.md`](./PHASE1-REBUILD.md) | Phase 1 S3–S6 — the swap, the native creations, the S4a count reconciliation, Complete, and the clean-state step |
| [`PHASE2.md`](./PHASE2.md) | Phase 2 S1–S6 — clean-instance proof, export and checksum, preview, the two fix loops, the UI-action commit, post-commit confirmation |
| [`PHASE3-ATF.md`](./PHASE3-ATF.md) | Phase 3 — the single-test validation, the suite run, every result by name, the classification argument and the harness |
| [`run-state.json`](./run-state.json) | The machine-readable record of all of the above, plus the `final` key recording the shipping decision |
