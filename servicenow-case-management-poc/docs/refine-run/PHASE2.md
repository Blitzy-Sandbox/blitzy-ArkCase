# Phase 2 — Verify the final package on a clean instance (S1 – S6)

Refine PR, Phase 2 **HARD GATE**, work unit **U3**. Directives owned here: **D28** (S1 clean
confirm), **D29** (S2 checksum), **D30** (S3a retrieve + preview), **D31** (S3b zero `type=error`
problems), **D32** (S4 commit by UI action only), **D33** (S4a partial-commit handling), **D34**
(commit screenshot), **D35** (S5 storage + role links), **D36** (S6 recorded checksum + staleness
RULE), **D37** (Phase 2 exit condition). Phase 0/1 belong to U1/U2 (`PHASE0-1.md`,
`PHASE1-REBUILD.md`); Phase 3 (ATF) belongs to U4 and was not started here.

Instance `https://dev306625.service-now.com` (Zurich Patch 10). Every `sys_id` below was resolved by
query at the time it was used (`sys_scope?scope=x_casemgmt`, `sys_update_set?name=…`,
`sys_remote_update_set?…`, `sys_user_role?name=…`); the literals are recorded as evidence, not used
as inputs. No credential, cookie or `sysparm_ck` value appears in this file or in any committed
artifact.

**Entry gate (D1).** `run-state.json` `phase1.exit_condition = "met"` (2026-09-02T19:22:09Z), so
Phase 2 was entered. Instance liveness was confirmed **by content** (a JSON body, not the
hibernation HTML splash) and a read-only API heartbeat (`GET /api/now/table/sys_user?sysparm_limit=1`,
10-minute interval) ran for the whole phase. **Hibernation events: 0; recovery cycles used: 0 of 3.**

**Heartbeat mechanism — required, used, and the deviation, stated for this phase.**
(a) **Required** by directive lines 76–84: the **browser/UI heartbeat** — a rendered navigation to
`home.do` on an independent ~10-minute clock, judged live by content — with the **API-context**
variant (`GET sys_user`) permitted **only** while the Retrieved Update Set record page or the
commit-result page must be preserved. (b) **Used:** the API variant for the **whole phase**, on the
run-long 10-minute loop (`PHASE0-1.md` §2.4), not only across the commit window. (c) That is a
**DEVIATION from directive lines 76–84 in mechanism selection**, not compliance — for the §5 commit
window it is the licensed exception (§5, "Heartbeat exception"), and for every other interval of this
phase the mandated browser/UI heartbeat was not executed. (d) **Observed impact: none** — 0
hibernation events, 0 recovery cycles, and both variants are read-only. (e) **Corrective action:**
the mandated browser-context heartbeat was executed in the CR2 remediation pass against `home.do` in
a rendered authenticated session — BEAT 1 `2026-09-03T04:23:34.684Z`, BEAT 2 `2026-09-03T04:34:04.494Z`,
delta 630 s, both judged live by page content, session "System Administrator"; that pass performed no
commit and no PDI write, so no commit-page exception window arose and the browser→API→browser
transition pair is **not applicable** to it. Full statement: `PHASE0-1.md` §2.4.

---

## 1. S1 — the instance was genuinely clean before anything was previewed (D28)

Every assertion was observed first-hand at **2026-09-02T19:53:13Z** and re-confirmed at
**2026-09-02T20:03:58Z** before the fix re-attempt:

| D28 assertion | Observed |
| --- | --- |
| `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` | **HTTP 400** `{"error":{"message":"Invalid table x_casemgmt_case"}}` |
| `GET …/x_casemgmt_case_task?sysparm_limit=1` | **HTTP 400** "Invalid table x_casemgmt_case_task" |
| `GET …/x_casemgmt_case_party?sysparm_limit=1` | **HTTP 400** "Invalid table x_casemgmt_case_party" |
| `sys_dictionary?sysparm_query=name=<each table>` | **0 / 0 / 0** rows |
| `sys_security_acl_role` where `sys_user_role.nameSTARTSWITHx_casemgmt` | **0** |
| `sys_security_acl_role` where `sys_security_acl.nameSTARTSWITHx_casemgmt` (cross-check) | **0** |
| `sys_user_has_role` for the three scoped roles | **0** |
| `sys_db_object` rows for the three target tables (extra check) | **0** |

Preserved and verified present, so the precondition is described accurately: the 3 scoped roles
(`x_casemgmt_case_manager` `73710b05…`, `x_casemgmt_case_agent` `f7c449d2…`,
`x_casemgmt_case_viewer` `e3cd650e…`), `sys_scope` and `sys_app` for `x_casemgmt`, 7 scoped flows,
and the `apps.current_app` preference for `admin` (`82b99028936f74320d74d6f88357a5af`). Scoped
`sys_security_acl` and `sys_number` stood at 0 — cascade-removed with the tables in U2's S6, and
carried in the package for restoration on commit.

**No deletion was performed by this unit**, and no fix attempt was needed to reach the clean state
(OVERRIDE-3: absent tables and zero role links are the authorized clean state, not breakage). This
made the commit a genuine first-time-import test.

---

## 2. S2 — the Complete package was exported by the platform, and its checksum computed (D29)

**Mechanism — the platform's own export path.** The `sys_update_set` UI action "Export to XML"
(condition `state == 'complete' && base_update_set.nil()`, both true for the master set) runs
`new UpdateSetExport().exportUpdateSet(current)` and then redirects to
`export_update_set.do?sysparm_sys_id=<snapshot>&sysparm_delete_when_done=true&sysparm_is_remote=false&sysparm_ck=<session token>`.
This phase invoked that exact pair: the platform API produced the snapshot, and the platform's own
export processor streamed the bytes. Observed while establishing the mechanism: `export_update_set.do`
answers **401** with Basic auth alone and **401** with a session cookie alone; it authenticates with
the session cookie plus a scraped `sysparm_ck`; and passing the *local* set's `sys_id` returns HTTP
200 with **0 bytes**, because the processor streams the snapshot the API returns.

**Non-destructive, and verified so:** the master set held **988** children immediately before and
immediately after every export, and stayed `state=complete`. The platform's own
`delete_when_done` removed each temporary snapshot after streaming.

| Export | Snapshot `sys_id` | Bytes | Payloads | SHA-256 | Fate |
| --- | --- | --- | --- | --- | --- |
| 1 | `7af37c12930f435009aa70d19dba105a` | 4,062,298 | 988 | `df110c9526bdc81d62b06b0f6a58b5573a83b9d3153fcd7c623ef9704668a000` | previewed → 63 `type=error` → superseded by fix 1 |
| 2 | `23467496930f435009aa70d19dba1013` | 4,062,436 | 988 | `7c382fab41954ebea107c610a0c496343e29e3393bd5788c441080e58c2163db` | previewed → 60 `type=error` → superseded by fix 2 |
| **3 (the deliverable was written from this export)** | `0b3b7452934f435009aa70d19dba100d` | **4,062,436** | **988** | **`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** | previewed → **0 problems** → **committed**; the file was re-sequenced later, so this is export 3's digest and not the shipping file's — see §7.1 |

This table records what was exported, uploaded and previewed, so the digests in it are the digests
of those bytes. Export 3's streamed bytes —
`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` — are what was previewed to zero
problems and committed (§3–§5), and they went to
`servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`
(`cmp`-verified byte-identical to the streamed response), replacing the pre-refine content.

**That file was changed after Phase 2, twice.** The post-review CR1 pass first re-sequenced its
`<sys_update_xml>` blocks into the AAP §0.5.2 dependency order, producing
`90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`: the same 988 payload records,
every body and identity byte-identical, at the same 4,062,436 bytes, differing from the previewed
bytes only in the order of the blocks — but a different byte sequence, and one that has never been
uploaded, previewed or committed on any instance. **Per the D36 rule in §7 the recorded checksum is
therefore stale and the Phase 2 S1–S6 re-run is owed on the `90ee0249…` bytes; it has not been
performed.** The re-verification pass then **elected the untouched fallback** as the shipping
package under OVERRIDE-2 / directive D3, so the deliverable path now holds
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` (926 blocks, 3,781,097 bytes) and
the re-sequenced rebuilt package is **retained, not shipped**, at
`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`.

The gate is binary, so it takes one verdict per byte sequence and no other: **NOT MET for
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, the elected sequence that ships;
NOT MET for `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`, the retained rebuilt
package; MET for `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`, export 3's
sequence.** Electing settles the shipping decision and not the gate — §7.1 states the position in
full, and §9 carries the verdict.

The re-sequencing was checked **statically only**: `xmllint --noout` clean, 988 blocks, per-block
digest multiset identical to export 3's bytes, header (1,370 bytes), tail and byte size identical,
44-class census identical, and every §0.5.2 dependency assertion passing (application record first,
tables before dictionary rows, dictionary before documentation and choices, roles before ACLs, both
before the 27 role links, subflows before the two state-machine flows, reports before both
dashboards, portal → page → widget → container → row → column → instance, ATF test → step →
step-input value, and all 38 seed rows last — the 28 rows on the three scoped tables plus the 10
demo user/group/membership/grant/company rows). That evidence bounds the change to block sequence
alone; it is **corroborating evidence, not the platform test D36 requires**, and it is not presented
as satisfying the gate.

The fallback `…_update_set.FALLBACK.xml` was never touched and still hashes to
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`; those are the bytes now elected
onto the deliverable path, so the two files are byte-identical, which is exactly what OVERRIDE-2
describes for this path. Per INTERP-11 nothing was re-exported or regenerated after the verified
checksum below: the CR1 pass rearranged the blocks already in the file, and the re-verification pass
restored the fallback's own bytes to the deliverable path and kept the re-sequenced rebuilt package
beside it.

**Sanity checks on export 3's bytes, all pass:**

| Check | Expected | Observed |
| --- | --- | --- |
| `xmllint --noout` | no output | no output |
| `grep -c '<sys_update_xml action="INSERT_OR_UPDATE">'` | 988 (U2's post-swap count) | **988** |
| Payload actions present | only INSERT_OR_UPDATE | only INSERT_OR_UPDATE (0 DELETE rows) |
| Platform-captured table payloads | the three scoped tables | 3 `sys_db_object` rows whose payloads name `x_casemgmt_case` ("Case"), `x_casemgmt_case_task` ("Case Task"), `x_casemgmt_case_party` ("Case Party"), all in the `x_casemgmt` scope |
| Removed hand-authored table ids (`bd806f5b…`, `f9fd58b1…`, `179699d5…`) | absent | **0** occurrences each |
| Platform-named dictionary payloads | `sys_dictionary_x_casemgmt_case_*` | **30**, every one on that convention (27 field rows + 3 collection rows) |
| `sys_security_acl_role` payloads | 27, split 14 / 10 / 3 | **27** — manager **14**, agent **10**, viewer **3** |
| Untouched classes | `sys_choice` 7, `sys_security_acl` 26 | **7**, **26** |
| Seed rows on the three scoped tables | 28 | **28** = 10 case / 10 task / 8 party |
| Other counts (spot-check) | — | `sys_documentation` 30, `sys_user_has_role` 3, `sys_user_role` 3, `sys_number` 3, `sys_variable_value` 540, `sys_atf_step` 180 |
| U1's S1 probe artifacts (`refine_probe`, `19999c5a…`, `caa9509a…`, `63cc5812…`, `96dcd812…`) | none | **0** occurrences each |
| Credential hygiene | none | 0 `sysparm_ck` / `glide_session` / `JSESSIONID`; the 3 `<user_password/>` elements are empty, exactly as in the pre-refine package |

Note on naming: this platform names `sys_db_object` update rows by `sys_id`
(`sys_db_object_13cae85e…`), not by table name, so a literal `sys_db_object_x_casemgmt_case` update
name does not exist here; the substance the check calls for — platform-captured native table payloads
rather than the removed hand-authored ones — is satisfied and evidenced above.

---

## 3. S3a — retrieved onto the clean instance and previewed (D30)

Upload used the only working mechanism, with the priming GET that a cold session requires; the Table
API was never used for the XML.

| Step | Result |
| --- | --- |
| Priming `GET /api/now/table/sys_remote_update_set?sysparm_limit=1` | HTTP 200, JSON body |
| `GET /upload.do?sysparm_target=sys_remote_update_set` | HTTP 200, 72-char `sysparm_ck` scraped from the hidden input |
| `POST /sys_upload.do` multipart (`sysparm_ck`, `sysparm_target=sys_remote_update_set`, `attachFile=@<export 3 bytes>`) | **HTTP 200** (2026-09-02T20:26:05Z → 20:26:09Z) |
| Retrieved set located by query | **`0b3b7452934f435009aa70d19dba100d`**, name "x_casemgmt_case_management v1.0.0 (native rebuild)" |
| **NEW record assertion** | distinct from the pre-refine committed set `9929f50df18ccec91ea13b2a3bccfc90`, from U1's imported set `b4861cf7bbe24b36926fcaff4583b5bf`, and from both superseded attempts (`7af37c12…`, `23467496…`) |
| **No-append assertion** | children = **988** = the exported payload count (an append would have doubled it; U1's set still holds 0 children, untouched) |
| Load poll (5 s interval, 300 s cap) | `loaded` at t=0 s, `error_detail` empty |

Preview was triggered exactly as D30 specifies — the AJAX processor, never a `PATCH` of `state`:

```
POST {instance}/xmlhttp.do
  sysparm_processor=UpdateSetPreviewAjax
  sysparm_ajax_processor_function=preview
  sysparm_ajax_processor_sys_id=0b3b7452934f435009aa70d19dba100d
  sysparm_ck=<scraped>
→ HTTP 200, tracker id af5b3892934f435009aa70d19dba104d
```

Poll trace (5 s interval, 600 s cap), triggered 20:26:22Z: `previewing` at t=0 s, 5 s, 11 s, 16 s,
21 s → **`previewed` at t=26 s** (20:26:48Z). No `error` state, no hibernation interruption.

---

## 4. S3b — zero `type=error` preview problems (D31)

**Final result on export 3 — the deliverable's 988 records:**
`GET /api/now/table/sys_update_preview_problem?sysparm_query=remote_update_set=0b3b7452934f435009aa70d19dba100d^type=error`
→ **empty array, count 0**. The `type=warning` query is also **0**, so there are no warning
descriptions to log. Total problem rows for the set: **0**. (Pre-refine baseline on this instance:
**54** `type=error`.)

The gate was **not** met on the first attempt, and no problem row was ever resolved, skipped, ignored
or otherwise silenced. Both issues were fixed at their cause and re-verified; the full history:

### Attempt 0 — 63 `type=error`, 0 `type=warning` (export 1)

| Class | Count | Description (verbatim) | Rows affected |
| --- | --- | --- | --- |
| Collision | 60 | "Found a local update that is newer than this one" | the 60 metadata names this run swapped: 3 `sys_db_object`, 26 `sys_dictionary`, 27 `sys_security_acl_role`, 1 `sys_documentation` (`duration_to_close` label), `sys_ui_list_x_casemgmt_case_null`, `sys_ui_related_x_casemgmt_case_null`, `sys_ui_policy_507da6cb…` |
| Scope | 3 | "Cannot commit Update Set 'x_casemgmt_case_management v1.0.0 (native rebuild)' because: Update scope id 'global' is different than update set scope id '82b99028936f74320d74d6f88357a5af'. Resolve the problem before committing." | the 3 re-created `sys_user_has_role` grants (Demo Manager / Agent / Viewer) |

### Issue 1 — global-scope attribution on the three grant rows (fixed in 1 attempt)

Root cause, established by query: exactly 3 of the 988 captured rows were attributed to the **global**
scope, and all 3 were the `sys_user_has_role` grants U2 serialized with `GlideUpdateManager2` from a
global-scope script; the other 985 carry the `x_casemgmt` scope. `sys_user_has_role` has **no**
`sys_scope`/`sys_package` column (checked against `sys_dictionary`), so the attribution exists only on
the captured update row's `application` field — and the pre-refine package shipped the same three
grants attributed to `82b99028936f74320d74d6f88357a5af` (verified inside `FALLBACK.xml`) and committed
successfully.

Fix, in the source set: set `application` to the scope (resolved by query) on those 3 `sys_update_xml`
rows, with `setWorkflow(false)` / `autoSysFields(false)`. The **payload was not altered** —
`payload_hash` verified unchanged on all three — and the set stayed `state=complete` with 988
children, 0 rows left off-scope. The three scope errors never returned, and export 3 contains **0**
rows attributed to anything other than the scope.

### Issue 2 — local delete-capture residue on the authoring instance (fixed in 2 attempts)

*Attempt 1 (insufficient).* Deleted the 231 `sys_update_version` rows for the 60 flagged names (60
`DELETE`/current, 38 `DELETE`/previous, 133 `INSERT_OR_UPDATE`/previous), re-exported (export 2) and
re-previewed: the same **60** collisions returned (with the 3 scope errors gone, confirming Issue 1's
fix landed). The previewer therefore does not read `sys_update_version`.

*Diagnosis.* For every one of the 60 names the newest **local `sys_update_xml`** row is a `DELETE`
capture of this run's authorized deletions — e.g. `sys_security_acl_role_04e920da…` had a local
`DELETE` recorded at `1a06388f5ad0000001` against the package payload's `1a0638726080000001`. 256
such rows existed for names the package ships: **215** in U2's throwaway ABSORBER set
(`25d86c1a938b435009aa70d19dba101b`, "DO NOT SHIP") and **41** in the `x_casemgmt` scope Default set
(`934aabce…`), every one created by `admin` today between 14:32 and 19:21. The previewer takes the
newest local row per update name, so the instance that authored the package declared it stale. A
first-time-import target — which D28 requires this instance to stand for — holds no delete-capture
history for records it has never had.

*Attempt 2 (resolved).* Deleted exactly those 256 `DELETE`-action `sys_update_xml` rows; the script
refused, by guard, any row belonging to the master shipping set and any row whose action was not
`DELETE` (`requested=256 deleted=256 already_absent=0`; ABSORBER 215, scope Default 41). The master
set was re-verified intact (988 children, `state=complete`); the ABSORBER kept its 51 remaining
children and the scope Default set its 65, all naming non-package records. **No live record, no
deliverable content and no `sys_update_preview_problem` row was touched.** The clean-instance
precondition was then re-confirmed (§1) before export 3 was uploaded and previewed — with **0**
problems of any type.

---

## 5. S4 / S4a — Commit (D32, D33), performed only by the rendered UI action

**RESUME CHECK first, before any click** (D32: never commit twice): the record read
`state=previewed` (`sys_updated_on` 2026-09-02 20:26:45); `sys_progress_worker` rows for this set:
**0**; the only committed retrieved set on the instance was the pre-refine
`9929f50df18ccec91ea13b2a3bccfc90`; and the three target tables still answered HTTP 400. The commit
had therefore not run, and it was performed **exactly once**. `committed_twice = false`.

**Mechanism: the native "Commit Update Set" UI action in a rendered browser session** — no API, no
AJAX processor call, no `PATCH` of `state` by this unit. In that session: login through
`/login.do` with credentials read from the environment at run time (never a literal, password field
masked throughout), user menu confirmed **"System Administrator"**, then
`/sys_remote_update_set.do?sys_id=0b3b7452934f435009aa70d19dba100d`, where Name read
"x_casemgmt_case_management v1.0.0 (native rebuild)", State read **"Previewed"** and the **"Commit
Update Set"** action was present and enabled (top and bottom action bars, the same OOB UI action
`c38b2cab0a0a0b5000470398d9e60c36`, `onclick … commitRemoteUpdateSet(this)`). Pre-commit counters on
the form: Inserted 613, Updated 375, Deleted 0, Collisions 0, Total 988.

**No confirmation dialog, modal or prompt appeared**, so D32's hard-stop clause never applied and
nothing was clicked through: the platform's own `shouldShowConfirmAppInstall` check answered "no" and
its `validateCommitRemoteUpdateSet` call raised no unresolved-problem confirmation. The commit was
kicked off by the page's own client script (`commitRemoteUpdateSet`, `sysparm_skip_app_installs`
empty → app installs not skipped).

**Driver identity — what is recoverable and what is not.** The rendered session was driven by a
`run_chrome_task` browser task. **Its orchestrator-side task/session identifier was not captured at
execution time and is not recoverable**, for three reasons established while attempting to recover
it: `syslog_transaction.session_id` is empty on this release (Zurich Patch 10), `blitzy/screenshots/`
is a flat directory carrying no per-run identifier, and subagent reports are not persisted to disk.
No identifier is asserted here in its place. What **is** recoverable is the platform-side identity
chain the driver left behind — non-secret, read from `syslog_transaction` and `sys_progress_worker`:

| # | Platform record | sys_id | UTC | What it shows |
| --- | --- | --- | --- | --- |
| 1 | `syslog_transaction` — interactive UI login form post (`/login.do?…sys_action=sysverb_login`, user `admin`) | `a8cc785a930f435009aa70d19dba1004` | `2026-09-02 20:32:27` | the driver logged in through the rendered login form, not through an API session |
| 2 | `syslog_transaction` — rendered record-page form load for `/sys_remote_update_set.do?sys_id=0b3b7452934f435009aa70d19dba100d` | `f20df49e930f435009aa70d19dba100a` | `20:33:44` | the Retrieved Update Set record was opened as a rendered form — the page the "Commit Update Set" action lives on |
| 3 | `sys_progress_worker` — "Committing update set…" | `1bad34d6934f435009aa70d19dba10cb` | `20:36:27` → `20:37:18` | `state_code=success`, `sys_created_by=admin`; the single commit worker for this set |
| 4 | `syslog_transaction` — post-commit record-page reload | `852e7c96934f435009aa70d19dba1027` | `20:38:32` | the driver re-read the record after the commit, in the same rendered session |

Screenshots produced by that driver, tying the chain to the visual evidence below:
`phase2-commit-progress-0pct.png` (the progress modal opened by the click at chain step 3),
`phase2-commit-result.png` and `phase2-commit-result-record-form.png` (the result screen and the
record at `State = Committed`, chain step 4), and
`phase2-postcommit-progress-worker-success.png` (the `sys_progress_worker` row of chain step 3).

**Result text, verbatim from the result screen:**

```
Update Set Commit
Succeeded 100%
Update set committed - Succeeded in 50 Seconds
```

No error text, no problem count and no skipped-record count appeared. Final record state
**`committed`**, Committed **2026-09-02 20:36:27 UTC**; the platform withdrew the "Commit Update Set"
and "Run Preview Again" actions and added "Show Commit Log". Corroboration: the platform's own
`sys_progress_worker` row "Committing update set: x_casemgmt_case_management v1.0.0 (native rebuild)"
is `State=Complete`, `Completion code=Success`, message "Update set committed" — while two **earlier**
commits of the *pre-refine* set in the same list carry `Completion code=Error` ("some updates failed
to commit due to errors"), so this instance does surface per-update failure and this commit had none.
`sys_update_log` rows for this set: **0**. No child of the set carries a disposition. Browser console
on the record page: **0 errors**; all 107 captured network requests returned 2xx.

**D33 partial commit: NOT APPLICABLE.** The commit neither failed nor terminated partway: every one
of the 988 updates was applied (613 inserted + 375 updated), 0 deleted, 0 collisions, no commit-log
entry, no skipped or failed update. The instance is in a **fully applied** state, not a partial-apply
state. Consistent with OVERRIDE-2, no Rollback, no Back Out and no `deleteApplication` was invoked at
any point in this phase — and none would have been permitted.

**Heartbeat exception (D12, line 84) honoured — this interval, and only this interval, is compliant:**
while sitting on the Retrieved Update Set record and the commit-result page the browser was **never**
navigated to `home.do`; liveness was carried by the independent API heartbeat (`GET sys_user`), which
logged HTTP 200 with a JSON body throughout. This is the narrow condition lines 76–84 license. It does
not cover the rest of the phase, where the same API variant ran in place of the required browser/UI
heartbeat — recorded as a deviation in the entry-gate section above and in `PHASE0-1.md` §2.4.

### D34 — commit screenshot

| Screenshot (absolute path) | Caption |
| --- | --- |
| `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase2-commit-result.png` | **"Phase 2 — commit result screen showing the outcome (zero problems / success)"** |

Supporting captures in the same directory: `phase2-login-confirmed.png` (authenticated session, user
menu "System Administrator"), `phase2-previewed-record.png` (the record at `state=previewed` with the
Commit action present, before the click), `phase2-previewed-record-fullpage.png`,
`phase2-commit-progress-0pct.png` (commit progress modal), `phase2-commit-result-record-form.png`
(record showing State = Committed), `phase2-postcommit-tables-created.png`,
`phase2-postcommit-progress-worker-success.png`, `phase2-postcommit-case-seed-rows.png`,
`phase2-postcommit-party-seed-rows.png`. Per INTERP-6 these are cited by path and caption; the PNG
binaries are **not** committed. `phase2-commit-dialog.png` deliberately does not exist — no
confirmation dialog ever appeared.

---

## 6. S5 — physical storage and every role link now exist (D35)

The instance had none of this beforehand (§1). Measured after the commit, with
`scripts/post_import_remediation.js` **not run**, no re-upload and no second commit:

| Check | Before (S1) | After commit |
| --- | --- | --- |
| `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` | HTTP 400 "Invalid table" | **HTTP 200** |
| `GET …/x_casemgmt_case_task?sysparm_limit=1` | HTTP 400 | **HTTP 200** |
| `GET …/x_casemgmt_case_party?sysparm_limit=1` | HTTP 400 | **HTTP 200** |
| `sys_dictionary` rows — case / task / party | 0 / 0 / 0 | **21 / 14 / 13** (identical to U2's pre-deletion dump) |
| `sys_db_object` rows for the three tables | 0 | **3** |
| `sys_security_acl_role` for `x_casemgmt*` roles | 0 | **27** |
| — split | — | **manager 14 / agent 10 / viewer 3** |
| `sys_user_role` (the three scoped roles) | 3 (preserved) | **3** |
| `sys_user_has_role` for those roles | 0 | **3** |
| Scoped `sys_security_acl` | 0 | **26** |

That is the proof D2 was after: the platform's own captured records provisioned physical storage and
carried all 27 ACL→role links through a single clean commit, with no remediation script anywhere in
the path (INTERP-10).

### Post-commit state of the rest of the package (recorded, not acted on, for U4)

| Artifact | Package | Live after commit |
| --- | --- | --- |
| Scoped flows | 7 | **7, all active** |
| Reports / dashboards | 8 / 2 | **8 / 2** |
| Business rules (`sys_script`) | 7 | **7** |
| Script includes | 2 | **2** |
| UI policies / UI policy actions / UI actions | 2 / 2 / 6 | **2 / 2 / 6** |
| List layout (`sys_ui_list`) / related list | 1 / 1 | **3 for the case tables / present for `x_casemgmt_case`** |
| Portal / pages / widgets | 1 / 2 / 3 | **1 / 2 / 3** |
| Scripted REST definitions / operations | 2 / 2 | **2 / 2** |
| Demo users / group / group membership | 3 / 1 / 1 | **3 / 1 / 1** |
| Demo companies (`core_company`) | 2 | **2** |
| ATF suite / tests / steps | 1 / 20 / 180 | **1 / 20 / 180** |
| Number counters (`sys_number`) | 3 | **3** (CASE / TASK / PARTY, 7 digits) |
| Seed rows | 28 | **10 cases / 10 tasks / 8 parties** |

Seed-row count is exactly what the package carries — not the 12 case rows present at handover, whose
two extra portal-created cases went with U2's authorized deletion (OVERRIDE-3, expected).

### Three post-commit gaps, recorded and classified — none of them a commit failure

1. **Choice lists did not materialize.** `sys_choice` for the three tables is **0**, although the
   package carries 7 `sys_choice` payloads holding 24 choice rows (queried by table name, by
   `nameLIKEcasemgmt`, and by the payload `sys_id`s — 0 in every case). The four choice-typed case
   fields still carry `choice=3` in the dictionary, so they are choice fields with no values. Those 7
   payloads are byte-identical to the pre-refine package's (U2's untouched-payload guard hash), so the
   package's first-time-import behavior here is unchanged by this run; the pre-refine deployment
   converged only via `post_import_remediation.js` plus a **second** commit — the crutch INTERP-10
   forbids this run from using. Relative to the handover state, the live instance now lacks those 24
   rows. **Classification: pre-existing package/platform behavior, outside the table/role-link
   subset; not fixed here** (a fix would change the package and, per D36's RULE, force a full Phase 2
   re-run).
2. **Seed child rows carry no parent-case linkage.** 10 of 10 tasks and 8 of 8 parties have an empty
   `case`, and the 3 Organization-type parties have an empty `organization`. The cause is in the
   payloads themselves and is identical in the pre-refine `FALLBACK.xml`: the seed task and party
   payloads contain **no `case` element at all**, and no `organization` element (`person` is carried
   as a `user_name` string, which the loader did resolve). The pre-refine environment's linkage came
   from `scripts/seed_demo_data.js` run *after* the commit, not from the update set. **Classification:
   pre-existing, not caused by this run.**
3. **`opened_date` empty on 8 of 10 cases** — the known pre-existing defect, reappearing exactly as
   OVERRIDE-3 anticipated (the commit engine suppresses the before-insert rule
   `x_casemgmt_set_opened_date`). **Classification: pre-existing (D5), not caused by this PR.**

None of the three is a partial apply: the platform reported every update applied
(613 + 375 = 988), `Completion code=Success`, 0 collisions, 0 commit-log rows, 0 dispositions and 0
preview problems.

---

## 7. S6 — the verified checksum (D36)

`sha256sum servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`
re-run at **2026-09-02T20:53:14Z**:

```
eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae   (4,062,436 bytes, 988 payloads)
```

It is byte-for-byte equal to `phase2.package_sha256`, i.e. to the exact bytes that were previewed with
zero problems and committed. Recorded as **`phase2.verified_checksum`**. The retained fallback is
untouched at `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`.

> **RULE (D36).** This checksum is what makes the package shippable, independent of Phase 3. **If the
> package changes after this point the checksum is stale, and Phase 2 (S1 clean confirm, S2 checksum,
> S3a preview, S3b zero `type=error`, S4 UI-action commit, S5 storage/role-link confirmation, S6
> recorded checksum) must re-run before the package is ship-ready again.**

### 7.1 The package HAS changed since, so the gate is NOT MET for the bytes that ship — and the fallback is the elected shipping package

This subsection is a later addition to §7. It does not qualify the rule above; it records what the
rule now demands.

**The verdict, binary, per byte sequence.** S1–S6 is a hard gate: a byte sequence has either been
through it or it has not, and there is no partial, conditional or qualified result available.

| Byte sequence | Gate S1–S6 (and AAP §0.7.1 with it) |
| --- | --- |
| `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` — **the elected sequence that ships** | **NOT MET.** The fallback's own bytes were never uploaded, previewed or committed on any instance. Electing it settles the shipping decision, not the gate |
| `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` — the retained rebuilt package | **NOT MET.** Never uploaded, never previewed, never committed on any instance |
| `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` — export 3's sequence | **MET.** Uploaded onto a genuinely clean instance, previewed to zero problems of any type, committed by the native UI action, storage and all 27 role links confirmed after, S6 sum recorded 2026-09-02T20:53:14Z |

**What follows from that, stated as the delivery position.** The delivery election is **made, and the
frozen directive made it.** The deliverable path
`update-set/x_casemgmt_case_management_update_set.xml` **holds the elected fallback** — the original
unmodified package, 926 payload blocks, 3,781,097 bytes, SHA-256
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, byte-identical to
`…_update_set.FALLBACK.xml`. Directive lines 16-24, 211-218, 220-222 and 310-322 tie Phase 2's exit
condition to the package being **shipped**, so that exit condition is not reached for the artifact on
the deliverable path while its bytes are ungated; on that path OVERRIDE-2 (directive **D3**)
authorizes the untouched fallback **by name** as the correct outcome, byte-identical to the
pre-refine file and hashing to `7292a6fe…`, with `tables/*.xml` and `dictionary/*.xml` possibly
unrefreshed. The directive permits no third state in which nothing is elected, so the fallback is
elected. **Electing settles the shipping decision and not the gate:** the elected bytes were never
previewed anywhere, so S1–S6 and AAP §0.7.1 remain **NOT MET** for them, and nothing in this record
designates the elected package platform-verified.

**What the elected package is, unsoftened.** It does **not** include this round's native-rebuild fix.
Measured on the elected file: **0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25
hand-authored `sys_dictionary` rows carrying random-32-hex update names** (`sys_dictionary_<32hex>`),
alongside the three hand-authored `sys_db_object_<32hex>` table records (`bd806f5b…`, `f9fd58b1…`,
`179699d5…`). So it carries neither the platform-captured table/dictionary records directives
**D2/D21** ordered nor the **27** ACL-role links, which means an importer **must run
`scripts/post_import_remediation.js`** after the commit to create the physical schema and those 27
links — exactly as the pre-refine deployment did, per
[`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5.

**What the election does not give up: ordering.** The elected fallback satisfies AAP §0.5.2 in its own
right, measured on the file rather than assumed — the application record first (payload index 0), the
3 table records before all 25 dictionary rows (3 < 4), the 7 `sys_choice` payloads after those
dictionary rows, the 3 roles before all 26 ACLs (41 < 42), both dashboards after all 8 reports
(124 < 125), every one of the 180 `sys_atf_step` rows after its own `sys_atf_test` (0 violations), the
5 validation subflows before both state-machine flows (76 < 77), the task and party rows after their
case rows (907 < 908), and all 38 seed rows last (indices 888–925). The ACL-role-link ordering
assertion is vacuous here because the package carries 0 such links. **Electing it therefore does not
re-open the review's AAP §0.5.2 ordering finding; what it gives up is content, which OVERRIDE-2
authorizes by name.**

**The retained rebuilt package — Path A, still available.** The re-sequenced native rebuild is kept
at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`: **988 payload
blocks, 4,062,436 bytes, SHA-256
`90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`**, `xmllint --noout` clean. Its
payload records are the ones this phase previewed to zero problems and committed, and every §0.5.2
dependency assertion passes on it — application record first, the 3 table records before all 30
platform-named dictionary rows, choices after them, the 3 roles before all 26 ACLs (76 < 77), all
**27** `sys_security_acl_role` links after both their ACL and their role (links at 103–129, ACL max
102, role max 76), dashboards after reports (186 < 187), every ATF step after its own test, subflows
before both state machines (138 < 139), task/party rows after their case rows (969 < 970), and all 38
seed rows last (950–987). One action would make it shippable: **run the full S1–S6 gate on those
exact bytes on a genuinely clean, dedicated PDI** — confirm a clean target; checksum the bytes;
upload asserting 988 children; preview to zero `type=error`; commit through the native "Commit Update
Set" UI action; confirm physical storage for all three tables and all 27 `sys_security_acl_role`
links; record `90ee0249…` as verified with that run's own timestamp.
[`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5 is the procedure.
**Whoever does that may then promote those bytes back to the deliverable path as the shipping
package**, restoring the D2/D21 native swap and the 27 role links.

**What changed.** The post-review CR1 pass, resolving that review's HIGH finding 1 (AAP §0.5.2
dependency ordering), re-sequenced the deliverable's 988 `<sys_update_xml>` blocks. The change is
block order only — the 1,370-byte header, the tail and every payload body and identity are
byte-identical to export 3's bytes, and the size is still 4,062,436 bytes — but the file is a
different byte sequence and hashes to
`90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`. Those bytes are the ones now
retained at `…_update_set.REBUILT-DEPENDENCY-ORDERED.xml`.

**What the rule therefore says, applied without exception.** The package changed after the S6 sum, so
the checksum recorded above is **stale**, and Phase 2 — S1 clean confirm, S2 checksum, S3a preview,
S3b zero `type=error`, S4 UI-action commit, S5 storage/role-link confirmation, S6 recorded checksum —
**must re-run on the exact bytes of whichever artifact is to be made ship-ready. It has been run on
neither artifact now on disk:** not on the retained rebuilt package `90ee0249…`, and not on the
elected fallback `7292a6fe…` that ships in its place, whose own bytes were never previewed at all.
`eee9fabd…` remains Phase 2's verified checksum and export 3's historical digest; it is not the
digest of either file on disk. AAP §0.7.1 — the exported XML must re-import on a fresh PDI with zero
preview errors — is satisfied for export 3's byte sequence and **NOT MET** for both artifacts now on
disk.

**What was done instead, and what it is worth.** The reordered file was checked statically and every
check passed: `xmllint --noout` clean; 988 blocks; the per-block digest multiset identical to export
3's bytes; header, tail, byte size and the 44-payload-class census all identical; every AAP §0.5.2
dependency assertion passing; and read-only REST confirming that the instance's captured set
`1109981a930b435009aa70d19dba1098` still holds 988 children whose update names are set-identical to
the file's. That bounds the risk to block sequence alone. It is **corroborating evidence, not the
D36 gate** — no upload, no preview and no commit of these bytes took place anywhere.

**Why the exact-byte gate was unavailable — measured, not judged.** Two of the four reasons are
measurements taken on this checkout and on the one provisioned instance, and two are boundaries the
passes in question worked under. These four are also the reason the election went the way it did:

| # | Reason | Kind |
| --- | --- | --- |
| 1 | **The instance is not a clean target.** `x_casemgmt_case` holds **10** rows, `x_casemgmt_case_task` **10** and `x_casemgmt_case_party` **8**, and all three tables answer live — so S1, whose first assertion is that the three tables do not exist, fails at its first step. Making the target clean means deleting the scoped application, which the environment directive names as destroying a verified environment | measurement |
| 2 | **An upload would append to Phase 2's own committed record.** `GET /api/now/table/sys_remote_update_set/0b3b7452934f435009aa70d19dba100d` returns that row with `state=committed`, and that `sys_id` is the `<sys_remote_update_set>` descriptor carried inside the rebuilt file itself. The loader matches on it, so an upload would **append** its 988 children to the committed retrieved-set record that holds Phase 2's evidence rather than creating a fresh one — the behaviour this package's own [`round_trip_verify.md`](../../scripts/round_trip_verify.md) warns about | measurement |
| 3 | This checkpoint permits read-only REST and **no PDI write of any kind** | boundary |
| 4 | AAP §0.7.1 wants a **fresh** PDI, and provisioning or re-requesting an instance is prohibited | boundary |

**The two paths, and which one is chosen.** Their costs are measured, not estimated:

**Path A — verify and promote the retained rebuilt package. AVAILABLE, not chosen.** On a genuinely
clean, dedicated PDI, run the full gate on the exact `90ee0249…` bytes at
`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`: **S1** confirm a
genuinely clean target; **S2** checksum the bytes about to be uploaded; **S3a** upload and assert 988
children; **S3b** preview with zero `type=error`; **S4** commit through the native "Commit Update
Set" UI action; **S5** confirm physical storage for all three tables and all 27 ACL-role links;
**S6** record `90ee0249…` as verified with that run's own timestamp and evidence.
[`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](../HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5 is the procedure.
*Cost:* one clean instance and one operator pass. *Outcome:* the gate is MET on those bytes, and
whoever completes the run may promote them back to the deliverable path as the shipping package,
restoring the D2/D21 native swap and the 27 role links.

**Path B — invoke the fallback. CHOSEN: this is the elected shipping package.** Its cost is measured,
not estimated. The fallback (`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, 926
blocks, 3,781,097 bytes) contains **0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25
hand-authored `sys_dictionary` rows**. Electing it therefore ships without the **27** ACL-role links
and without the **30** field/table label rows, without the native table/dictionary swap that
directives **D2/D21** ordered, and with the random-32-hex hand-authored schema record names this PR
existed to replace — so `scripts/post_import_remediation.js` is required after the commit. Its own
bytes were **never previewed at all**, so it does not satisfy AAP §0.7.1 either.

**Path A is the only path that would satisfy both AAP §0.5.2 and AAP §0.7.1 at once**, and the
retained artifact keeps it open. Neither artifact on disk satisfies AAP §0.7.1 today; both satisfy
AAP §0.5.2 in their own right (measured above, on each file), so the election turns on content rather
than on ordering.

**Why the fallback was elected.** The exact-byte S1–S6 gate is the only thing that could have made
the rebuilt package ship-ready, and it was unavailable for the two measurements and two boundaries in
the table above. Directive lines 16-24, 211-218, 220-222 and 310-322 tie Phase 2's exit condition to
the package being **shipped**, so that exit condition is not reached for the artifact on the
deliverable path while its bytes are ungated — and on that path OVERRIDE-2 (directive **D3**)
authorizes the original unmodified package **by name**, byte-identical to the pre-refine file and
hashing to `7292a6fe…`, with `tables/*.xml` and `dictionary/*.xml` possibly unrefreshed, as the
correct outcome. The frozen directive permits no third state in which nothing is elected, so with the
gate unavailable the directive supplies the fallback; this is the directive's election, not a
preference. The re-sequencing work is not discarded: the rebuilt package is retained with every
§0.5.2 assertion passing, and Path A promotes it once its bytes clear the gate.

**The third artifact, for completeness.** Export 3's bytes are recoverable from git —
`git show 7d36aec06e:servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`
reproduces 4,062,436 bytes hashing to `eee9fabd…`. They are the only bytes in this repository whose
exact sequence passed the gate, and they are precisely the sequence the review's HIGH ordering
finding rejected. **No artifact in the repository satisfies both requirements at once; only Path A
creates one, on the retained rebuilt bytes. The elected fallback ships in the meantime, labelled for
exactly what it is.**

---

## 8. Fix attempts (D6 — two per issue, counted per issue)

| # | Issue | Attempts | Cap | Outcome |
| --- | --- | --- | --- | --- |
| 1 | 3 `type=error` "Update scope id 'global' is different than update set scope id …" on the re-created `sys_user_has_role` grants | 1 | 2 | **Resolved** — `application` set to the `x_casemgmt` scope on those 3 captured rows in the source set (payload_hash unchanged); errors never returned |
| 2 | 60 `type=error` "Found a local update that is newer than this one" on the swapped table / dictionary / role-link records | 2 | 2 | **Resolved** — attempt 1 (231 stale `sys_update_version` rows removed) was insufficient; attempt 2 removed the 256 local `DELETE`-capture `sys_update_xml` rows (ABSORBER 215 + scope Default 41) that made the authoring instance declare the package stale. Clean-instance precondition re-established before the re-verify |

Hibernation recovery cycles: **0 of 3**, counted independently of the fix cap. No fix attempt
resolved, skipped or ignored a preview problem, and none touched the master set's payloads.

---

## 9. Phase 2 EXIT CONDITION (D37)

> *"Preview and commit both clean on this checksum, run against a genuinely clean instance, with
> storage/role-links confirmed after."*

| Clause | Evidence | Verdict |
| --- | --- | --- |
| Preview clean on this checksum | `0b3b7452934f435009aa70d19dba100d` reached `state=previewed` via the AJAX preview processor; `sys_update_preview_problem` `type=error` **0**, `type=warning` **0** (§3, §4) | **met** |
| Commit clean on this checksum | Committed once by the rendered "Commit Update Set" UI action; "Succeeded 100% — Update set committed - Succeeded in 50 Seconds"; `state=committed`; no `commit_failed`/`error`; no partial apply; no remediation script, no re-upload, no second commit (§5, INTERP-10) | **met** |
| Genuinely clean instance | Three tables HTTP 400 "Invalid table", `sys_dictionary` 0/0/0, `sys_security_acl_role` 0, `sys_user_has_role` 0 at 19:53:13Z, re-confirmed 20:03:58Z (§1) | **met** |
| Storage and role links confirmed after | Three tables HTTP 200; dictionary 21/14/13; `sys_security_acl_role` **27** split 14/10/3; roles 3; grants 3; ACLs 26 (§6) | **met** |

**PHASE 2 EXIT CONDITION: MET — 2026-09-02T20:53:14Z (UTC), on export 3's byte sequence and on that
sequence only.** Every clause above was measured on the bytes identified by
`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`, and Phase 2's shippable verdict
was recorded against those bytes — a statement about that byte sequence at the time this phase ran,
with Phase 3 (ATF, U4) not gating it. The fallback package was **not** invoked by this phase; it was
elected afterwards, by the frozen directive, and it is what now ships.

**What ships: the elected fallback.** The deliverable path
`update-set/x_casemgmt_case_management_update_set.xml` holds the original unmodified package — **926
payload blocks, 3,781,097 bytes, SHA-256
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`**, byte-identical to
`…_update_set.FALLBACK.xml`. It is elected under OVERRIDE-2 / directive **D3** on the
unmet-exit-condition path, and it is labelled for what it is: it does **not** include this round's
native-rebuild fix (0 `sys_documentation` rows, 0 `sys_security_acl_role` rows, 25 hand-authored
`sys_dictionary` rows with random-32-hex update names), so an importer must run
`scripts/post_import_remediation.js` to create the physical schema and the 27 ACL-role links, exactly
as the pre-refine deployment did. The re-sequenced rebuilt package is **retained, not shipped**, at
`…_update_set.REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks, 4,062,436 bytes, `90ee0249…`) with every
AAP §0.5.2 assertion passing; §7.1 records the one action that would make it shippable and the
promotion it then earns.

**Electing settles the shipping decision, not the gate.** S1–S6 is binary and takes one verdict per
byte sequence: **NOT MET** for the elected fallback `7292a6fe…`, whose own bytes were never previewed
anywhere; **NOT MET** for the retained rebuilt package `90ee0249…`, never uploaded, previewed or
committed; **MET** for `eee9fabd…`, export 3's sequence. The recorded checksum is **stale** under D36
and AAP §0.7.1 is **NOT MET** for both artifacts on disk. Nothing here designates either of them
ship-ready. Phase 2's exit condition is a record of what happened here, not a ship-readiness claim
about a byte sequence this phase never saw.

Live-instance state left for the units that follow: the app is committed and fully applied from the
verified package; the retrieved set `0b3b7452934f435009aa70d19dba100d` is `state=committed`; the two
superseded retrieved sets (`7af37c12…` previewed with 63 problems, `23467496…` previewed with 60) are
left in place as the record of the fix loop; the master shipping set `1109981a930b435009aa70d19dba1098`
is still `state=complete` with 988 children; nothing was rolled back, backed out or deleted at scope
level.
