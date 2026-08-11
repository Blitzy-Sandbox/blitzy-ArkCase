# PDI Limitations and Known Issues — `x_casemgmt` Case Management POC

> **Purpose:** an honest, complete record of (1) every code-generation/packaging **defect** found in the
> deliverable Update Set and how it was remediated, (2) the **flow-serialization defect** that required the
> seven Flow Designer flows to be re-authored natively, (3) the ServiceNow **PDI platform limitations**
> encountered, (4) what was intentionally **not done** per scope/constraints, (5) the **automated regression
> suite** and its honest coverage (§8), (6) the **clean-instance round trip**, the regression report and the
> **residual manual footprint** (§9), and (7) the **recommended next steps** (§10). It also gives the precise
> code-generation fixes recommended for the next generation pass.
>
> This document deliberately does **not** overstate the result, and it is explicit about the *kind* of evidence
> behind each claim rather than certifying them all as equal. Three kinds appear, and they are labelled wherever
> they matter: **directly observed at runtime** on the live instance (the enforcement, ACL, REST, portal-page,
> dashboard and related-list results); **measured statically** over the deliverable (block counts, hashes, payload
> parsing, reference resolution, script-copy identity); and **not measured** (any update-set preview or commit of
> the bytes that ship — §0.3c and §10.0 item 1a — and a re-run of the ATF suite against a fresh re-load of the
> shipped artifacts on the current revision, §8.3). Nothing in the third category is presented as if it belonged to the first two. Where a
> result is partial or depends on an operational step, that is stated explicitly. An earlier revision of this
> paragraph certified that *every* claim was directly observed; that was not true while the round-trip and ATF
> claims above were attributed to bytes and runs they did not belong to, so the certification has been replaced by
> this narrower and checkable statement.
>
> **Read §0 and then §9 before you deploy this.** §0 is the authoritative statement of what the package
> currently is and what has and has not been proved about it. A clean-instance round trip established that
> upload → preview → commit previews with **zero errors** — but on an **earlier revision of the bytes**, and it
> showed that a commit does **not** by itself produce a fully functional application: **Defects C and 9 still
> need one manual remediation run**, and the demo data still needs one seed-script run. The three surface gaps
> that earlier revisions of this paragraph listed as open — the portal page layout, the two dashboards and the
> case form's related lists — are **all now authored, packaged and verified rendering** (§0.3b for the portal
> layout; §0.3c and §0.5 for the dashboards, §0.6.2 for the related lists). §9.5 is the step-by-step install
> procedure that actually works; §9.9 and §9.10 record what was measured at the end of the passes that produced
> them. Where an earlier revision of this document claimed the residual human footprint was "none", that claim
> has been measured, found false, and withdrawn — the footprint is small but it is not zero.
>
> **Chronology matters in this document.** §2–§9 are a record of successive passes, and several results in them
> were later superseded. Anything marked *historical* is kept because the diagnosis is still useful, not
> because it is the current state. **Where §0 and any later section disagree, §0 is correct.**

---

## 0. Current state of the package — the authoritative block

Everything in this section was measured on the bytes that ship today, with one stated exception: the
zero-preview-error round trip of §0.3 was measured on an earlier revision of the same file, and §0.3a–§0.3c record
exactly what carries from those revisions to today's bytes and what does not. It supersedes any conflicting
number anywhere else in this document.

**Read every measurement here as of its stated date.** The verification instance has been hibernating since
2026-08-11 and serves no application surface, so nothing in this section has been re-measured since — §0.11 states
what that leaves unproven and what has to happen before any of it can be re-taken.

### 0.1 Package identity

| Property | Value |
|---|---|
| Path | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` |
| `<sys_update_xml>` blocks | **926** (plus exactly one `sys_remote_update_set` descriptor, under a single `<unload>` root) |
| Size | **3,781,097 bytes** |
| SHA-256 | **`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`** |
| Previous revision | **925 blocks · 3,698,577 bytes · SHA-256 `e49a7654f8990287cee459eb4bec0245dc3f40588ebd63344b80cf16e0508361`** — the bytes on which the reference-error class was measured to zero (§0.3b). The QA-findings pass that produced today's bytes changed **13 payloads** (8 `sys_report`, 2 `Dashboard`, 3 `sp_widget`) and added **1 block** (the Related Lists definition), all recorded in §0.3c. Before that: **913 blocks · 3,643,389 bytes · SHA-256 `89638c17d328839d7b2cbba1525f9490c95b7f54434792fd732846126b3da13e`** — the bytes an independent QA pass previewed, which reported 120 `type=error` problems / 40 distinct, 21 of them package-intrinsic. The pass that turned those bytes into the 925-block `e49a7654…` revision re-shaped the 28 seed records (parent key moved into the `display_value` attribute for `x_casemgmt_case` and `core_company`, deterministic pinned numbers added) and added 12 blocks — the 8 `sp_container`/`sp_row`/`sp_column`/`sp_instance` rows that make the two portal pages render, 1 List Layout for the Cases default view, and 1 extra UI Policy with its 2 policy actions; measured preview effect, the 21 package-intrinsic `Could not find a record` problems went to **0**. Before all of those: **913 blocks · 3,618,378 bytes · SHA-256 `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e`** — the bytes the clean-slate round trip of §0.3 was run on, and the only bytes on which "0 preview problems of any type, then committed" has ever been measured. So the full chain, oldest first, is `7272edfc…` (913) → `89638c17…` (913) → `e49a7654…` (925) → **`7292a6fe…` (926, ships today)**. |
| Update names | 926 of 926 are canonical `<table>_<sys_id>`, and 926 of 926 are unique |
| ATF range | **761 blocks** = 20 `sys_atf_test` + 180 `sys_atf_step` + **540** step-input rows (539 `Value` + 1 `Variable Value`) + 1 `sys_atf_test_suite` + 20 suite links. Unchanged by the QA-findings pass — 761 of the 926 blocks |
| Installer records | **1 Fix Script** (`x_casemgmt Post-Import Remediation`, global-scoped by design). **No bootstrap Business Rule, and no auto-execute record of any kind.** |
| Other counts | 26 ACLs · 25 dictionary entries · 7 flows (2 parent + 5 subflows) + 1 Custom Action + 1 shared flow block · 7 Business Rules · 3 tables · 3 roles · 3 number counters · 7 choice lists · 8 reports · 2 dashboards · 1 portal + 2 pages + 3 widgets · 2 scripted REST services + 2 operations · 2 Script Includes · 6 UI Actions · 28 seed-data rows · **1 List Layout** (`sys_ui_list` + 13 `sys_ui_list_element` rows, Cases default view) · **1 Related Lists definition** (`sys_ui_related_list` + 2 `sys_ui_related_list_entry` rows, Cases Default view — `x_casemgmt_case_task.case` and `x_casemgmt_case_party.case`) · **8 portal layout rows** (2 `sp_container` + 2 `sp_row` + 2 `sp_column` + 2 `sp_instance`) · **2 UI Policies + 2 UI Policy Actions** (the `case_party` conditional fields) |

### 0.2 Exactly what has been verified about these bytes, and what has not

| Claim | Status on the **current** bytes |
|---|---|
| Well-formed, internally consistent XML | **VERIFIED on today's bytes.** 926 of 926 embedded `<payload>` documents parse (nested CDATA terminators un-split first — the file carries 100 `]]]]><![CDATA[>` escapes); one `<unload>` root; one descriptor; all 926 names unique and canonical; `xmllint --noout` clean. |
| Fix Script body is the repository source, byte for byte | **VERIFIED.** The packaged `<script>` equals `../scripts/post_import_remediation.js` exactly (172,520 characters), as does the standalone `../scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` wrapper. |
| **Clean-slate upload → preview → commit on these bytes** | **NOT on these bytes — do not read the §0.3 or §0.3b results as covering them.** The full teardown → upload → preview → commit trip (child count asserted at 913, preview to **0 problems of any type**, then `state=committed`) was measured on the earlier **913-block `7272edfc…`** revision (§0.3). The **925-block `e49a7654…`** revision was uploaded and previewed against this already-populated instance: **31 problems, all `Found a local update that is newer than this one`, ZERO `Could not find a record` problems** (63 → 0), every one of the 31 confirmed to have a local `sys_update_version` in state `current`; commit withheld because the verification instance is shared (§0.3b). **No preview has been run on today's 926-block `7292a6fe…` bytes.** What has been measured on them instead is recorded in §0.3c: every one of the 13 changed payloads and the 1 added block was applied to the live instance and read back field-for-field identical to its artifact, and every table and column each of them names was checked to exist in `sys_db_object` / `sys_dictionary`. |

### 0.3 CLOSED — this deliverable has been clean-slate round-tripped

This was previously OPEN LIMITATION 1: the zero-preview-error proof belonged to a **much earlier revision** of
the file. **That gap is closed by measurement** on the 913-block, 3,618,378-byte, SHA-256 `7272edfc…` revision
— the file as it stood immediately before the QA-remediation pass re-synced 9 payloads into it. §0.3a, §0.3b and
§0.3c together state precisely how this result carries — and does not carry — to today's `7292a6fe…` bytes; three
revisions separate them.

The trip was run on `https://dev379024.service-now.com` (Australia Patch 3). It is the same procedure the
earlier revision went through, executed again from a genuine teardown, and every figure below is an observation:

| Stage | Measured result |
|---|---|
| Package identity going in | 913 blocks · 3,618,378 bytes · SHA-256 `7272edfc…` — the revision of the file that existed when this trip was run. The bytes that ship today are **926 blocks · `7292a6fe…`** (§0.1); three revisions separate them (§0.3a, §0.3b, §0.3c) |
| **BEFORE** — the same bytes previewed against the **already-populated** instance | **41 problems, all type `error`**: 20 × `Found a local update that is newer than this one`, 18 × `Could not find a record in x_casemgmt_case for column case`, 3 × `Could not find a record in core_company for column organization` |
| Teardown | Staged application-level teardown proven complete: `sys_scope` query returns `[]`, **every** application census counter is 0, and all three tables move from HTTP 200 to **HTTP 400** (table absent, not merely access-denied) |
| Upload onto the clean slate | `state=loaded`, child `sys_update_xml` count **exactly 913** |
| First clean-slate preview | **298 problems**, every one `Found a local update that is newer than this one` — these are the *teardown's own deletions* captured as local updates, not a defect in the package (see §9.2 for the same root cause on the earlier revision) |
| **AFTER** — preview once that local capture is purged at source | **0 problems of any type.** Checked against the platform's own predicate rather than assumed: `state=previewed`, `unresolvedProblems=false`, `shouldDisplay=true` |
| Commit | `previewed` → `committing` → **`committed`** |

**Progression: 41 → 298 → 0, then committed.**

The commit log (`sys_update_set_log`, *not* `sys_update_log`, which returns 0 rows over REST) recorded **30**
errors, and every one is an already-documented defect rather than anything new: 28 are the seed rows failing to
insert because a bare commit creates no physical storage (**Defect C** — 10 × `Table 'x_casemgmt_case' does not
exist`, 10 × `…case_task…`, 8 × `…case_party…`), and 2 are `Table 'pa_tab' does not exist` (**E5**, the dashboard
packaging defect — **since fixed**; `pa_tab` no longer appears in the deliverable, so this pair of commit errors
cannot recur, see §0.5). The documented §9.5 install sequence then completed normally: remediation run 1
built the 3 physical tables (25 fields, 24 choices, 3 counters), a second upload → preview → commit restored the
26 ACLs and the seed rows, and remediation run 2 reported **`verified=true`, `acl_links_created=27`,
`acl_links_total=27` (manager 14 / agent 10 / viewer 3), `security_cache_flushed=true`, `errors=0`**.

**The file on disk is byte-unchanged by the trip** — re-measured after commit: 3,618,378 bytes, SHA-256
`7272edfc…`, 913 blocks, identical to the identity that went in.

**The AAP §0.7.1 round-trip gate is therefore MET on the bytes that were round-tripped.** What remains is not a
verification gap but the install footprint itself: a bare commit is not self-sufficient, and the documented §9.5
sequence (two commits with a Global remediation run between and after them) is required. That footprint is
§10.2, and it is unchanged by this result. **§0.3a, §0.3b and §0.3c below state precisely how this result carries
— and does not carry — to the bytes that ship today.** In one line: it does not. Three revisions have landed since
(9 re-synced payloads, then 12 added blocks and 28 re-shaped seed rows, then 13 re-synced payloads and 1 added
block), and only the first of those three was measured to be preview-neutral against this trip.

### 0.3a The QA-remediation pass changed 9 payloads — what that does to §0.3's result

The pass fixed 9 records and, because every record exists twice in this repository (as a standalone
record-definition artifact and as a `<payload>` inside the deliverable), re-synced all 9 payloads so the two
copies agree. The file identity therefore moved from `7272edfc…` / 3,618,378 bytes to
**`89638c17…` / 3,643,389 bytes**. The block count is still **913**.

**What changed, exactly.** Nine `<payload>` bodies and nothing else. Verified mechanically rather than asserted:
the two files have an identical 913-member block-name set, and with every `<sys_update_xml>` block replaced by a
placeholder the two skeletons are **byte-identical** — so no block was added, removed, reordered or otherwise
touched. The nine are `sys_script_include` `CaseTransitionValidator`; `sys_script`
`enforce_forward_transitions` and `block_terminal_closed`; `sys_ui_action` `case_start_progress`,
`case_set_pending`, `case_resume` and `case_resolve`; `sys_dictionary` `x_casemgmt_case.duration_to_close`; and
`sys_report` `Average Time to Close`. Each payload was rebuilt by a transform **derived per record from the
previous revision** — the previous payload was reproduced from the previous artifact first, and only the
transform that reproduced it byte-for-byte was then applied to the new artifact — so the serialization
convention could not drift.

**Three-way parity holds for all 9:** artifact ⇄ payload ⇄ the live record on the instance agree field for
field. The package-wide parity gate was re-run over all 140 artifacts: **120 matched, 0 absent, 10 divergent —
the identical 10 that diverged before the pass**, so nothing regressed (those 10 are 8 records whose artifact
file carries one extra trailing newline, and the 2 `sys_ws_operation` records whose payload XML-escapes the
operation script where the artifact wraps it in a nested CDATA section — two encodings of the same string).
All 913 embedded payloads still parse as XML, `xmllint --noout` passes on the file, and every script and UI
Action condition extracted back out of the **patched** payloads passes `node --check` (11 bodies, 0 failures).
No new `sys_id` literal was introduced in any of the 9 (each still holds exactly the 2 it held before: its own
and the application's), and all 9 still carry `sys_scope` = the `x_casemgmt` application.

**What was measured on the new bytes, and what was not.** The clean-slate 41 → 298 → 0 progression above
belongs to `7272edfc…`. Repeating it would require another full application teardown, which cannot be done here
— this PDI is shared with other automated work. What *was* measured instead is a **matched A/B preview** of both
revisions, uploaded and previewed back to back through the platform's own Import-XML form and
**Preview Update Set** UI action against the same instance state:

| | `7272edfc…` (previous) | `89638c17…` (the revision this A/B produced) |
|---|---|---|
| Load | `state=loaded` | `state=loaded` |
| Preview | `state=previewed`, ≈ 2 min | `state=previewed`, ≈ 5 min |
| Problems attributable to that file's own 913 records | **34** — 18 `Could not find a record in x_casemgmt_case for column case` + 13 `Found a local update that is newer than this one` + 3 `Could not find a record in core_company for column organization` | **34** — **the same 18 / 13 / 3, on the same target records** |
| Distinct problem descriptions | 3 | 3 |
| Problem descriptions present in one but not the other | — | **0** |

So the 9 re-synced payloads introduce **zero** new preview problems: the two revisions produce identical problem
signatures, matched not merely by description text but by `(description, target record)` pair. Neither figure is
a zero-error result, because both were previewed against an instance where the application is **already
committed** — which is the same reason §0.3's "BEFORE" column reads 41 rather than 0. The honest statement is
therefore: *the absolute zero-preview-error gate was measured on `7272edfc…`, and the change to `89638c17…` was
measured to be preview-neutral.* Anyone wanting the absolute result on today's bytes should repeat §0.3's
teardown on a dedicated instance.

**Two platform behaviours measured during that A/B run, worth recording because each one can mislead:**

1. **Re-uploading this file onto an instance that already has it reuses the same `sys_remote_update_set` row and
   *appends* its children rather than replacing them.** The `<sys_remote_update_set>` descriptor hard-codes
   `sys_id` `9929f50df18ccec91ea13b2a3bccfc90`, so the loader matches on it: the child count went
   913 → 1,826 → 2,739 across two uploads onto a row that already carried one committed batch, the row's state
   was reset from `previewed` back to `loaded` by the second load, and `sys_updated_on` is no help in telling
   the loads apart because each one stamps it back to the file's literal `2026-04-30 12:00:00`. The consequence
   for anyone reading raw counts: the **totals** were 68 and 102, both of which are simply 2 × 34 and 3 × 34 —
   an artefact of duplicated children, not of package content. Attribute problems to their originating batch
   (via `remote_update` → the child's `sys_created_on`) or start from a row with no accumulated children.
2. **Preview rewrites `sys_update_xml.name`**, re-canonicalising a `<table>_<sys_id>` name to a human-readable
   one (e.g. `sys_dictionary_0bf56c20…` → `sys_dictionary_x_casemgmt_case_closed_date`). A diff keyed on `name`
   therefore reports phantom differences; key on the immutable `type` + `target_name` pair instead.

Also measured, and correcting an assumption in earlier revisions of this document: on this release
(Australia Patch 3) `Found a local update that is newer than this one` is typed **`error`**, not `warning`, and
its count equals the record's `Collisions` field exactly.

### 0.3b The 925-block `e49a7654…` revision: preview measured, reference class eliminated, commit withheld

> **These are no longer the bytes that ship.** They were when this section was written; the shipping revision is
> now the 926-block `7292a6fe…` file of §0.3c. Everything measured below still stands as a measurement of
> `e49a7654…`, and §0.3c states exactly what carries forward from it and what does not.

A later QA-remediation pass changed the deliverable again, and this section records what was measured on the
result. **The bytes measured here are 925 blocks, 3,698,577 bytes, SHA-256
`e49a7654f8990287cee459eb4bec0245dc3f40588ebd63344b80cf16e0508361`.** Relative to the 913-block `89638c17…`
revision the differences are: all 28 seed records re-shaped and re-numbered, and 12 blocks added — 8 portal
layout rows (`sp_container` / `sp_row` / `sp_column` / `sp_instance` × 2 pages) that make the two Experience
Portal pages render at all, 1 List Layout for the Cases default view, and 1 additional UI Policy with its 2
`sys_ui_policy_action` rows for the `case_party` conditional fields.

| Stage | Measurement |
|---|---|
| Upload | Uploaded as a **fresh** retrieved update set (its own `sys_remote_update_set` `sys_id`, so it could not merge into the application's existing retrieved row). `state=loaded`, child `sys_update_xml` count asserted at **exactly 925** |
| Preview | `state=previewed`. **31 problems, every one typed `error`, and every one the identical description `Found a local update that is newer than this one`.** |
| Reference problems | **ZERO.** No `Could not find a record` problem of any kind — down from **63** on the previous revision (of which 21 were package-intrinsic: 18 × `x_casemgmt_case` / `case` + 3 × `core_company` / `organization`) |
| Classification of the 31 | Each problem's target was looked up in `sys_update_version`: **31 of 31 have a local row in state `current`, and 0 have none.** They are this instance's own change history — the application's earlier imports plus the QA-remediation deployments of the 8 `sp_*` layout rows, 2 UI Policies + 2 policy actions, 8 `sys_report`, 4 `sys_ui_action`, 2 `sys_script`, 1 `sys_script_include` and 4 `sys_dictionary` records. **No seed-data record appears among them** |
| Commit | **Withheld deliberately.** The verification instance is shared with other work, and committing would have mutated a live application. So "0 problems of any type" remains proven only on `7272edfc…` (§0.3); what is proven on the shipping bytes is the elimination of the reference class |

**Why the reference class went away — measured, not reasoned.** Update Set preview accepts a reference element
**body** only when that body is a `sys_id` that already exists in the target database. A body holding a display
value or a number is rejected *even when the target row exists* (`case` = `CASE0000981` and `organization` =
`Synthetic Org Alpha` both errored against rows that were present). An intra-set `sys_id` resolves only when the
target travels in a canonically named `<table>_<sys_id>` block. An **empty** body is clean, and so is an empty
body with the key carried in a `display_value` **attribute**. Hence the two shapes the seed rows now use:

- **`case` and `organization`** carry the key in the `display_value` attribute with an **empty body**. They
  commit **empty**, and `../scripts/seed_demo_data.js` fills them after commit by number / company-name lookup.
- **`assigned_group`, `assigned_agent`, `assigned_to`, `person`** keep the key in the body. `sys_user`,
  `sys_user_group` and `sys_user_role` reference bodies are never checked by preview (a deliberately bogus
  `user_name` produced no problem) **and the import engine resolves them** — corroborated by the fact that the
  demo users, the demo group and the three `sys_user_has_role` rows all exist on the instance under the
  artifacts' own pinned `sys_id`s with their `user` and `role` columns correctly resolved. These commit
  **linked**, so the seed script's repair is a no-op safety net for them.

Every seed row also carries a **pinned number** in the 9,000,000 band (`CASE9000001`-`CASE9000010`,
`TASK9000001`-`TASK9000010`, `PARTY9000001`-`PARTY9000008`), which cannot collide with a counter-issued number
and leaves the counters untouched. That number is the adoption key: the seed script matches it first, adopts the
packaged row, and fills only what is empty. Verified on a live PDI — three rows were deliberately unlinked onto
their pinned numbers, one run repaired exactly the cleared columns, a second run reported `repaired=0`, the
census stayed at 10 cases / 10 tasks / 8 parties with no duplicates, and the snapshots restored field-identical.

**Three more platform behaviours measured while doing this, each of which can waste an afternoon:**

1. **You cannot ingest this file through the Table API.** `POST /api/now/table/sys_remote_update_set` with the
   XML as the body does not load an `<unload>` document. Use a multipart form POST to **`/sys_upload.do`**
   (not `/upload.do`), with a login session and that form's own `sysparm_ck`.
2. **`PATCH`-ing `sys_remote_update_set.state` does not drive the workflow.** The field is effectively
   read-only from the REST API — the write is silently reverted. Preview can be driven from a background script
   (`state=previewing`, then `GlideScriptedHierarchicalWorker` against
   `UpdateSetPreviewer.generatePreviewRecordsWithUpdate`), but **commit must be launched from the browser
   UI action**, which calls the Java processor `com.glide.update.UpdateSetCommitAjaxProcessor`.
   `new GlideUpdateSetWorker().setUpdateSourceSysId(id).start()` does **not** commit a retrieved update set —
   tested, and the state stayed `previewed`.
3. **`GlideUpdateManager2().loadUpdateXML()` is not a general back door.** From Global scope it silently
   declines to write rows into the application's scoped **data** tables (their Create/Update/Delete access is
   `[PRIVATE]`), and in testing it also declined to materialise synthetic `sys_user_preference` and
   `sys_ui_list` records. Metadata deployment works from Global; data must be written by an in-scope script.

### 0.3c The shipping 926-block bytes: what the QA-findings pass changed, and what is proven about it

A later pass resolved a QA report's six formal findings — all six in the presentation layer — and this section
records exactly what that did to the deliverable's bytes and what has and has not been measured on the result.
**These are the bytes that ship: 926 blocks, 3,781,097 bytes, SHA-256
`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`.**

**The delta from `e49a7654…` is exactly 13 changed payloads and 1 added block, verified mechanically** rather
than asserted: the two revisions share an identical 925-member block-name set, exactly one name is new, none was
removed or reordered, and 912 of the 925 shared payloads are byte-identical.

**Two of those 13 payloads were edited twice.** The final validation pass measured that
`case_count_by_status` and `all_cases_by_type` were still rendering as solid pies rather than the donuts the AAP
specifies, and corrected `sys_report.type` on both. That second round is what moved the package from the
intermediate 926-block `f482214ae73a6402b54b6ebce8feac229f5849ddb23473a2b11d03f7bed55910` /
3,781,093-byte revision to the shipping `7292a6fe…` / 3,781,097-byte revision — a four-byte difference, being
`pie`→`donut` twice, with the block count and the block-name set unchanged. Both intermediate and final
revisions have the same 13-changed-plus-1-added shape relative to `e49a7654…`; only the content of those two
report payloads differs between them. Any document, log or transcript quoting `f482214a…` is quoting that
superseded intermediate and should be read as describing the same delta with two report `type` values not yet
corrected (§0.6.3).

| What changed | Blocks | Why |
|---|---|---|
| `sys_report` × 8 | 8 payloads | `<group_by>` → **`<field>`** on the four chart reports (the column a chart report actually groups on — `group_by` is not a column on `sys_report`, §0.6.1); `<roles>` populated with the three scoped roles and `<user>GLOBAL</user>` added on all 8, which are the two gates the report read ACL evaluates; the inert `<group_by/>` and `<format/>` elements removed; and, in a second round of edits to two of these eight payloads, `<type>` **`pie` → `donut`** on `case_count_by_status` and `all_cases_by_type` to match the AAP's donut specification (§0.6.3) |
| `Dashboard` × 2 | 2 payloads | Re-authored onto the tables this release actually has — `sys_portal_page` + `sys_grid_canvas` + `pa_tabs` + `pa_m2m_dashboard_tabs` + one `sys_portal` / `sys_portal_preferences` / `sys_grid_canvas_pane` trio per widget, plus `pa_dashboards_permissions` share rows and `restrict_to_roles`. The three non-existent tables (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`) are gone (§0.5) |
| `sp_widget` × 3 | 3 payloads | Submission and lookup widgets gained per-field validation messages, `name` attributes, bound `aria-invalid`, `has-error` state, `role="alert"` / `role="status"` regions, maxlength notices, a 20 s lookup deadline and a distinct transport-failure panel; all three had the inert `<pop_up>` element removed (not a column on `sp_widget` — the same defect class as `group_by`) |
| **New:** Related Lists definition | +1 block | `sys_ui_related_list` + 2 `sys_ui_related_list_entry` rows for `x_casemgmt_case_task.case` and `x_casemgmt_case_party.case` on the Cases **Default view** — the AAP §0.4.4 requirement that had never been authored (§0.6.2). Placed immediately after the List Layout block, before the UI Actions, per the AAP §0.5.2 dependency order |

**What is proven about these bytes.** **13 of the 14** records were deployed to the live instance and then read
back and compared field for field against the artifact they came from: **0 mismatches** (the eight reports on
`field` / `roles` / `user`; the two dashboards across their whole record chain; the two form widgets on `template`,
`client_script` and `css`; the related-list definition and its two entries across 24 compared fields). The
fourteenth — the confirmation widget — had nothing to deploy: its only change was removing `<pop_up>`, and its live
record was instead confirmed to expose **33 fields, none of them matching `pop`**, which is the same evidence that
made the element inert. Every table name and every column name any of the 14 records uses was checked against
`sys_db_object` and `sys_dictionary` on this release — which is how both inert elements were found — and the check
now reports **0 unknown tables and 0 unknown columns**. All 926 payloads parse, `xmllint --noout` is clean on the
file and on all **14** changed or new standalone artifacts, both packaged widget scripts pass `node --check`, and
artifact ⇄ payload parity holds for every one of the 14. The runtime result each change was made for was then
re-verified in a browser; §0.4, §0.5, §0.6 and §0.6a carry the measurements.

**What is *not* proven about these bytes, stated plainly so it cannot be read the other way.** No update-set
preview has been run on `7292a6fe…`. The reference-error result of §0.3b belongs to `e49a7654…` and the
zero-problems-of-any-type result of §0.3 belongs to `7272edfc…`. What bounds the risk is the shape of the delta
rather than a measurement of the file: 13 of the 14 records already existed in the previous revision under the
same `sys_id` in the same canonically named block, so they can only produce the local-history collision class
that §0.3b already characterised; and the one new block is a `sys_metadata` descendant whose only reference is to
`x_casemgmt_case`, which travels in the same set in a canonical block. Anyone who needs the absolute gate on the
shipping bytes should repeat §0.3's teardown on a dedicated instance — this one is shared, which is also why
commit stayed withheld.

**One caveat that a preview cannot warn you about, and that cost real time to find.** Importing the Related Lists
definition onto an instance that has already rendered the case form is **not** sufficient to make the related
lists appear: the server caches a form's related-list set, and the cache is not invalidated by the rows arriving.
The symptom is deeply misleading — *Configure ▸ Related Lists* shows both lists correctly in the Selected column
and the rows read back correctly over REST, while `#related_lists_wrapper` still measures 0 px with no markup and
the browser issues no related-list request at all. The remedy is one UI operation, recorded as
`deployment.md` **step 12** and as §4 item **17**.

### 0.4 Current validation-gate rollup

**4 gates pass outright · 3 pass only with a qualification · 0 fail** — 4 + 3 + 0 = 7. Per-gate detail is in
§6 and in `validation-gates.md`; the qualifications are real and are not rounded away. Gates 4 and 5 moved from
qualified to outright passes when the Service Portal layout records were authored and the widgets' response
handling was corrected, so both portal pages now render and work anonymously (§0.3b). **Gate 6 moved from an
outright failure to an outright pass** in the QA-findings pass: both dashboards were re-authored onto the tables
this release actually has and both now render every widget with live data, for the personas the AAP names
(§0.3c, §0.5). Gate 7 moved the other way, from an outright pass to conditional, because that pass belongs to an
earlier revision than the one that ships — see §0.3b and §0.3c for exactly what is and is not proven on today's
bytes:

| Gate | Current status |
|---|---|
| 1 Data model | ⚠️ Qualified — correct **after** the manual Defect C remediation; a bare commit yields metadata with no physical storage |
| 2 Workflow | ✅ Pass — all four precondition guards and both prohibitions block on the form, both case types; and since the QA-remediation pass the **transition graph** is enforced too (all 8 illegal skip/backward edges refused, §9.6 **E12**) and a Closed case is immutable rather than only status-frozen (§9.6 **E13**) |
| 3 ACLs | ⚠️ Qualified — correct **after** the manual Defect 9 remediation creates the 27 ACL role links |
| 4 Portal submission | ✅ Pass — the anonymous **REST contract** and the submission **page** both work; the missing Service Portal layout records were authored and the widget response-envelope defect fixed (§0.3b, §9.6 E8-P) |
| 5 Portal lookup | ✅ Pass — the anonymous **REST contract** and the lookup **page** both work, returning only `status` / `subject` / `opened_date` and the verbatim not-found literal (§0.3b, §9.6 E8-P) |
| 6 Dashboards | ✅ Pass — **Agent Workspace renders 3 of 3 widgets and Manager View 5 of 5**, all with live data, correct chart types and zero console errors; verified as `admin` and then by impersonation for all five (persona, dashboard) pairs the AAP §0.4.4 defines, with the two pairs that must be refused still refused (§0.5) |
| 7 Update Set | ⚠️ **Conditional** — 41 → 298 → **0** problems of any type, then `committed`, measured on the earlier `7272edfc…` revision (§0.3); **zero `Could not find a record` problems** (63 → 0) with 31 local-history collisions remaining and commit withheld, measured on the 925-block `e49a7654…` revision (§0.3b); **no preview run on the shipping 926-block bytes**, whose 13-payload + 1-block delta is characterised in §0.3c |

**On the count.** Earlier revisions of this document claimed *"2 pass, 3 qualified, 1 fail"* (which does not sum
to 7) and then *"3 pass · 3 qualified · 1 fail"* (which was correct before gate 6 was fixed). The count above is
derived from the table, one row at a time, and is the count every other document in this deliverable now quotes.
It is deliberately the conservative reading: gates 1 and 3 carry **the same single qualification** — the
documented manual post-import remediation, which is an approved installer step, not a defect in the data model or
the ACL design — so a reader who counts that step as part of a normal install will read gates 1, 2, 3 and 6 as
outright passes and gate 7 as the only qualified one, arriving at **6 pass · 1 qualified · 0 fail**. Both
accountings describe the identical measured state; this document uses the conservative one so that no
qualification is ever lost by rounding. What must never be written is any count that fails to sum to 7.

**Read the three remaining qualifications precisely, because "qualified" must not be read as "fine".** Gates 1
and 3 are correct once an operator has run the Global remediation script, and **incorrect until then** — until
that run the three tables are metadata with no physical storage and all 26 ACLs have zero role links, which
denies everything. Gate 7's qualification is about *which bytes* carry which proof, not about a defect: see
§0.3c. An earlier revision of this paragraph read *"Gates 4 and 5 pass at the contract level and fail at the
surface level … a human visiting either portal page sees a blank screen"*, and *"Gate 6 fails outright"*; both
statements were true when written and are **withdrawn** — the portal layout records were authored (§0.3b) and the
dashboards were re-authored and verified rendering (§0.5). What remains true is the important part: **the package
is not self-installing.** Every user-facing surface the AAP specifies now works on this instance *after* the §9.5
sequence has been run, and none of them works on a bare commit.

### 0.5 The dashboard failure — root-caused, then fixed and verified

**Status: ✅ RESOLVED.** Both dashboards render. The rest of this section is in two parts: what the fix is and
what it measures at runtime, then the forensic record of the failure, retained because the wrong first diagnosis
is instructive and because anyone re-generating these artifacts needs to know which table names do not exist.

#### The fix

Each dashboard artifact was re-authored onto the record chain this release actually uses. Per dashboard:

| Record | Count (Agent Workspace / Manager View) | Role |
|---|---|---|
| `sys_portal_page` | 1 / 1 | the page the dashboard's canvas hangs from |
| `sys_grid_canvas` | 1 / 1 | the canvas itself, referenced by `pa_dashboards.canvas_page` |
| `pa_tabs` + `pa_m2m_dashboard_tabs` | 1 + 1 / 1 + 1 | the single tab (`Overview` / `Operational KPIs`) and its link to the dashboard |
| `pa_dashboards` | 1 / 1 | the dashboard record, carrying `restrict_to_roles` |
| `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` | 3 + 36 + 3 / 5 + 60 + 5 | one trio per widget — the widget instance, its 12 preferences (including `sys_id` = the backing report and `renderer`), and its geometry on the canvas |
| `pa_dashboards_permissions` | 2 / 1 | the share list: agent + manager on Agent Workspace, manager only on Manager View |

Three tables the old artifacts used are gone from both files, because **they do not exist on this release**:
`pa_tab`, `pa_dashboard_widgets` and `pa_dashboard_role`. Every reference in the new chain resolves either by
`display_value` attribute or by an intra-set `sys_id` that travels in the same update set in a canonically named
block — the two role references on the `pa_dashboards_permissions` rows are the pinned `sys_id`s of
`roles/sys_user_role_x_casemgmt_case_manager.xml` and `…_case_agent.xml`, which is the only shape update-set
preview resolves for an intra-set target (§0.3b).

#### What it measures at runtime

Verified as `admin` and then re-verified by impersonation for every (persona, dashboard) pair. Widget values were
read out of the rendered charts' own per-point accessibility labels, not inferred from the underlying tables:

| Dashboard | Widgets rendered | Values read from the rendered charts |
|---|---|---|
| Agent Workspace | **3 of 3** | *My Open Cases* and *My Overdue Tasks* render as real list frames with headers; *Case Count by Status* draws six slices |
| Manager View | **5 of 5** | *All Cases by Status* — Closed 2 / In Progress 2 / Open 2 / Resolved 2 / Draft 1 / Pending 1. *All Cases by Type* — General Inquiry 6 (60%) / Complaint 4 (40%). *All Cases by Priority* — High 3 / Medium 3 / Critical 2 / Low 2. *Average Time to Close* — **16 Days 0 Hours 0 Minutes** (`SingleScoreRunProcessor` → 200, raw value 1382400 s). *Cases Opened in Last 30 Days* — **10** |

| Persona | Agent Workspace | Manager View |
|---|---|---|
| Demo Manager | ✅ 3 widgets | ✅ 5 widgets |
| Demo Agent | ✅ 3 widgets — *My Open Cases* lists exactly `CASE0000981`, `CASE0000982`, `CASE0000986` ("1 to 3 of 3"), and a DOM-wide `CASE\d{7}` sweep of the page returned only those three | ⛔ correctly refused |
| Demo Viewer | ⛔ correctly refused | ⛔ correctly refused |

Both refusals are the platform's own dashboard-level message — *"Sorry! / The &lt;name&gt; dashboard has not been
shared with you. / Go to Dashboards Overview"* — and neither refused page issues a single `POST /xmlhttp.do`, so
the gate is being applied to the dashboard and not to its widgets. The viewer's exclusion is deliberate and is
what `dashboards.md` and AAP §0.4.4 specify: the AAP names an *agent* workspace and a *manager* view and no
viewer surface. What the viewer does have was measured separately and is in §0.9.

**A false lead worth naming, because it is the obvious suspect and it is innocent here.** The per-widget
`report_view` denial — *"Access is restricted by the report_view ACL"* — scored **zero** occurrences on any
scoped dashboard for any persona. That was confirmed as a true negative rather than an absent check, by driving
the identical personas at four out-of-box `task`-table widgets on `/now/nav/ui/home` in the same session, where
the same message **does** appear. `report_view` ACLs are named after the *reported* table; none exists for the
three scoped tables, so the platform falls back to `read`, which the scoped ACLs already grant correctly.

#### The forensic record — why the first diagnosis was too narrow

Earlier text in this register said gate 6 fails on **one** mis-serialized element (`pa_tab` where this release
has `pa_tabs`) and that fixing it is "a rename, not an investigation". **That was measured and is wrong.** On
`dev379024`, Australia Patch 3:

- `pa_tab` → HTTP 400 `Invalid table pa_tab`; the real table is **`pa_tabs`**.
- `pa_dashboard_widgets` → HTTP 400 `Invalid table pa_dashboard_widgets`; the real table is **`pa_widgets`**.
- `pa_dashboard_role` → HTTP 400 `Invalid table pa_dashboard_role`.
- `sys_grid_canvas_pane` **is** a valid table (121 rows instance-wide), yet both scoped dashboards have **0**
  panes on their canvas, and `pa_widgets` in scope `x_casemgmt` is **0**.

Each dashboard artifact *then* shipped blocks for `pa_dashboards` (valid), `pa_tab` (invalid),
`pa_m2m_dashboard_tabs` (valid), `sys_grid_canvas_pane` (valid), `pa_dashboard_widgets` (invalid — 3 for Agent
Workspace, 5 for Manager View) and `pa_dashboard_role` (invalid). So **three** table names were wrong, not one,
and the widget records never landed at all. (Present tense throughout the rest of this subsection describes the
pre-fix artifacts, not the ones that ship — see *The fix* above.)

Decisive evidence that a tab alone is not the missing piece: **opening each dashboard as `admin` caused the
platform itself to auto-create one empty `pa_tabs` "New Tab 1" plus its `pa_m2m_dashboard_tabs` link** (row
creation times 00:39:59 and 00:43:29 UTC matched the two page loads to the second) — and both dashboards were
**still blank afterwards**, showing 0 tabs in the rendered tab strip and the platform's empty state,
verbatim: **"Add widgets using the widget picker."** Both pages returned HTTP 200 with **zero console errors
and zero non-2xx responses**, so this is not a runtime or authorization failure. Controls run in the same
session: the out-of-box "Incident Management" dashboard renders 6 widget cards with 4 live charts, and the
scoped report *All Cases by Status* runs and draws a live bar chart from the real case rows (10 at the latest
measurement) — dashboard
rendering, charting and the data are all healthy.

> **Disclosure — a side effect of measuring this, since cleaned up.** Those two empty `pa_tabs` rows and their
> two link rows were created by the platform on a plain read-only page view; no "Add tab"/"Add widget" affordance
> was used and no write API was called. They were **deleted** when the fix was applied, so that the live state of
> `dev379024` equals what a clean import of these artifacts produces — one tab per dashboard, named `Overview`
> and `Operational KPIs`, each with exactly one `pa_m2m_dashboard_tabs` link. Re-measured after the cleanup: the
> two scoped canvases carry **exactly one `pa_tabs` row each** and no `New Tab 1` row of ours survives — the rows
> still named `New Tab` on this instance are out-of-box ones from 2018 and 2020.

### 0.6 Three further gaps — all root-caused, all now closed

Every item in this section was open when it was written and all are **now fixed**. Each is kept in full, with the
remedy and its runtime verification stated first, because the root causes are the reusable part: an element that
is not a column on the target table is discarded on import in silence, a related-list definition is not enough
on its own if the instance has already rendered the form, and an artifact comment asserting a platform limitation
is worth nothing until someone measures the platform. §0.6.3 was added after the other two, by the final
regression pass rather than by a QA finding.

#### 0.6.1 Report grouping — ✅ RESOLVED

**The fix, applied.** `<group_by>` → **`<field>`** in the four chart-report artifacts and their four payloads
(*Case Count by Status*, *All Cases by Status*, *All Cases by Type*, *All Cases by Priority*), and the inert
`<group_by/>` and `<format/>` elements removed from all eight report artifacts and payloads. `field` was also
applied to the eight live rows and read back.

**Verified at runtime.** All four charts were opened in a browser and now plot the dimension they were designed
for, read from the rendered chart rather than from the query: *by Status* six buckets (Closed 2 / In Progress 2 /
Open 2 / Resolved 2 / Draft 1 / Pending 1), *by Type* two (General Inquiry 6 / Complaint 4), *by Priority* four
(High 3 / Medium 3 / Critical 2 / Low 2). The "grouped by *Assigned Agent*" symptom is gone. The two single-score
reports were re-checked for regression and still render `16 Days 0 Hours 0 Minutes` and `10`.

**A second, independent gate had to be closed before any persona could open these reports at all**, and it is
worth recording because it is invisible from the artifact: `sys_report.roles` only narrows access, and the read
ACL's role branch runs **only** when `sys_report.user` is the literal `GLOBAL`. A report with `roles` populated
and `user` empty is a *private* report and is refused to everyone but its owner. All eight artifacts now ship
`<user>GLOBAL</user>` **and** `<roles>x_casemgmt_case_manager,x_casemgmt_case_agent,x_casemgmt_case_viewer</roles>`.

**The original diagnosis, retained.** The six chart reports each
  specify their grouping as `<group_by>status</group_by>` (or `priority` / `type`), and every installed row
  arrives with no grouping at all; the visible consequence is that *All Cases by Status* renders grouped by
  *Assigned Agent*. The reports exist and are backed by populated tables, but they do not aggregate as designed.

  **This is not the commit engine dropping a column — `group_by` is not a column on `sys_report` at all.**
  Measured on this release: `sys_dictionary` for `sys_report` holds `field`, `sumfield`, `group` (a reference)
  and `additional_groupby`, and **no** `group_by`. So the element is discarded on import for the same reason as
  the `sys_number` case in §4 item 6 and `defaultsort` in §9.3a item 3 — an element that is not a column on the
  target table is silently ignored. **The column a chart report actually groups on is `field`**, which the pass
  established while fixing the *Average Time to Close* single-score report (§9.6 **E14**): the Report Designer's
  left rail and the Run button read `field`, and for a non-COUNT single score the aggregated column must
  additionally be in `sumfield`, which is what the cold-load `SingleScoreRunProcessor` submits. All six chart
  reports currently have `field` empty, which matches the symptom exactly.

  An earlier revision of this bullet ended *"the pass deliberately did not apply it"*, because at that time no QA
  finding covered these reports. A QA finding subsequently did, and the rename was applied as described above —
  in **four** chart artifacts, not six: of the eight reports, four are charts that group, two are single-score
  aggregates that do not, and two are list reports. *Cases Opened in Last 30 Days* is a `COUNT` aggregate and
  correctly needs neither `field` nor `sumfield`; *Average Time to Close* was fixed earlier by the `virtual=false`
  correction of §9.6 **E14** and needs `sumfield`, which it already had.

#### 0.6.2 Related lists on the case form — ✅ RESOLVED

**The fix, applied.** `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` now ships one
`sys_ui_related_list` for `x_casemgmt_case` on the **Default view** plus two `sys_ui_related_list_entry` rows —
`x_casemgmt_case_task.case` at position 0 and `x_casemgmt_case_party.case` at position 1 — packaged as one added
update-set block placed immediately after the List Layout block, before the UI Actions. The entry rows cannot be
their own update records: `sys_ui_related_list` extends `sys_metadata` and so has a `sys_update_name`, while
`sys_ui_related_list_entry` has **no** super class and therefore no update name, so the two entries must ride
inside the definition's payload. The `related_list` value format is `<child table>.<field>`, confirmed against
`incident`'s seven out-of-box entries.

**Verified at runtime on `CASE0000981`.** `#related_lists_wrapper` measures **227.3125 px** (was 0) with class
`tabs_enabled`, and renders two sections in the intended order — **Case Tasks (2)** then **Case Parties (2)** —
the ordering confirmed three independent ways (DOM order, `compareDocumentPosition`, and the tab strip's own left
offsets, 10 px vs 117 px). The rows are the real children: `TASK0000276` *Open* and `TASK0000277` *Closed*;
`PARTY0000159` *Person / Requester* and `PARTY0000160` *Organization / Respondent*. The identical 227 px was
measured for `admin`, for the agent and for the viewer, which proves the base definition applies to every user
rather than to one person's personalisation; the agent additionally gets a **New** button on each list and the
viewer gets none, which is the ACL layer behaving correctly. Zero console errors, zero responses ≥ 400, and a
write audit confirmed no case, task or party record was touched by the verification.

**The caveat that makes this fix non-obvious — see §4 item 17.** Creating the three rows is necessary but not
sufficient on an instance that has already rendered the case form: the server caches the form's related-list set.
Immediately after the rows existed and read back correctly, the wrapper still measured 0 px, `#related_lists_wrapper`
still held only the `related_lists.ready` script, and **no related-list request was issued at all** — while
*Configure ▸ Related Lists* showed both lists correctly in its Selected column. A REST `PUT` of the same values is
a **no-op** (nothing is dirtied, no business rule fires) and does not clear it. Opening *Configure ▸ Related
Lists* and pressing **Save** with nothing moved fixed it immediately, because that processor deletes and reinserts
through the path that invalidates the cache — and in doing so **replaced all three `sys_id`s**, which is why the
artifact is pinned to the platform-minted ids and records that provenance rule in its own header.

**The original measurement, retained.** `sys_ui_related_list` held **0 rows** for `x_casemgmt_case` — and 0 for any
`x_casemgmt` table — against **1,545** rows instance-wide. On a real case record the form's
`#related_lists_wrapper` rendered at a bounding height of **0 CSS pixels** with class `tabs_disabled` and zero
tabs, while the same measurement on an out-of-box `sys_user_group` record returned 196.656 px and 288.625 px with
visible rows. The child tables' `case` reference fields made the related lists *possible*; the configuration that
would render them had never been authored.

#### 0.6.3 Chart type — the two donuts were shipping as solid pies — ✅ RESOLVED

**The fix, applied.** `<type>` **`pie` → `donut`** in `reports/x_casemgmt_case_count_by_status.xml` and
`reports/x_casemgmt_all_cases_by_type.xml`, in their two update-set payloads, and on the two live rows (both
read back `type: donut`). These are the only two reports the AAP specifies as donuts — AAP §0.4.4 names a
"donut chart for *Case count by status*" on the Agent Workspace and a "donut chart for *All cases by type*" on
the Manager View, and AAP §0.5.1 repeats it for both — so nothing else needed changing: the two bar charts, the two
list reports and the two single scores were already the specified types.

**Verified at runtime, from the rendered geometry rather than the stored value.** All four renders of the two
reports — each one embedded in its dashboard and each one standalone — now report `series.innerSize = "70%"` and
draw a real inner arc: `innerR` **67.795** against `r` **96.85** in the dashboard widgets, and 98.98/141.4 and
104.965/149.95 standalone, a 70 % hole at every size. The solid-pie signature that identified the defect — a
Highcharts point path terminating `A 0 0 0 0 1 …` with inner radius 0 and no `innerSize` — is **absent from every
render**. The Report Designer's own type selector independently shows the **Donut** card with
`aria-pressed="true"` on both reports. Bucket values and counts are unchanged by the type change (*by Status* six
buckets, *by Type* General Inquiry 6 / Complaint 4), zero console errors, zero responses ≥ 400.

**Two claims the artifacts themselves made, both measured false and both now withdrawn.** The artifacts' own
comments had justified `pie` by asserting that (a) `sys_report.type` "has no literal donut enum" on this release
and (b) "the platform renders a pie with a centre hole once it is embedded in a Dashboard widget". Measured on
this release, the `sys_report.type` choice list **does** contain `donut` (label "Donut") and `semi_donut`
alongside `pie`, `bar`, `horizontal_bar` and `line_bar`, and **four out-of-box reports already use `donut`**;
and there is no widget-level promotion of a pie into a donut — the report's own `type` is what decides the
rendering, which is exactly why both dashboard-embedded renders were solid before the change and are holed
after it. Both comments have been replaced in the artifacts by the measured correction, so the files no longer
argue for the value they no longer carry.

**Why this was not in the QA report, and why it was fixed anyway.** No finding covered it; it surfaced during
the final cross-cutting regression pass, when the dashboard run reported the *Case Count by Status* widget as a
solid pie. It is the same defect class as §0.6.1's `group_by` — an artifact asserting a platform fact that was
never measured — and it is a direct AAP-parity gap, so it was corrected rather than filed. One benign
consequence is worth recording so it is not later mistaken for a regression: Highcharts' accessibility module
still announces a donut as "Pie chart with N slices", because a donut *is* a pie series carrying `innerSize`.
That string comes from the charting library, not from the report definition, and no setting in the report
changes it.

### 0.6a The seven gates as re-measured on the §0.3 install — evidence per gate

The §0.4 rollup is the verdict; this is the evidence behind it, taken on the instance produced by the §0.3 round
trip rather than carried forward from an earlier pass. Each row names the measurement, not the expectation.

| Gate | Verdict | Evidence measured on this install |
|---|---|---|
| 1 Data model | ⚠️ Pass after remediation | All **25** shipped `dictionary/*.xml` artifacts compared field by field against the live `sys_dictionary` rows, keyed on `(name, element)`: **0 absent, 0 divergent** on `internal_type`, `max_length`, `mandatory`, `read_only`, `choice`, `default_value`, `function_field`, `display`, `active` and reference target. All **7** choice lists present with their exact labels (24 rows, 0 inactive). `number` carries `default_value=javascript:global.getNextObjNumberPadded()` and `read_only=1`; display fields are `number` / `subject` / `role_label`. An insert probe produced `CASE0000989`, matching `^CASE[0-9]{7}$`, defaulting to `Draft`, and was removed. The three list views render as real data grids with 10 / 10 / 8 rows, zero banners, zero console errors. **Physical storage exists only because the remediation built it** — hence the qualification, not the field definitions. |
| 2 Workflow | ✅ Pass | **Since re-measured and widened by the QA-remediation pass:** the transition *graph* is now enforced as well as each target's precondition — 16/16 illegal-edge attempts (8 edges × both case types) refused with HTTP 403 and `sys_mod_count` 0, and form-driven `Draft→Closed` / `Draft→Resolved` blocked with an 85- and 87-character message while the legal `Draft→Open` control still commits with zero banners (§9.6 **E12**); a Closed case now refuses field-only edits with the 49-character verbatim message while still permitting a genuine no-op save (§9.6 **E13**); and the `Set Pending` UI Action, which could never reach the server, now performs its transition (§9.6 **E11**). The evidence below predates that pass and remains accurate. **Breadth:** the shipped harness `../scripts/transition_logic_regression_assertions.js` re-run verbatim in scope `x_casemgmt` emitted `U1ASSERT\|TOTAL=13 PASSED=13 FAILED=0`, with `expected` and `actual` byte-identical on all 13 and labels A1–A13 matching the §9.7 table exactly (**A9** is the `canTransitionToClosed` non-manager assertion; **A10** is any → Draft). Its own `CLEANUP` line reports `tasks=4 cases=7 remainingCases=10`, so every fixture it created was removed. **Depth on the form:** clicking the real **Resolve** UI Action on a case with one open child task produced a single error banner whose painted text is `All tasks must be closed before resolving this case.` — **52** characters, no surrounding whitespace, zero non-ASCII, final codepoint U+002E — and the literal was provably absent from the page before the click. `status` still read `In Progress` after the click and after a clean reload; server-side probes showed `sys_mod_count` unchanged at **0** and `sys_updated_on` unchanged, so **no write occurred**. The submit returned **302 back to the same record** — the abort-and-redisplay signature. All 6 UI Actions are `active=true`. |
| 3 ACLs | ⚠️ Pass after remediation | Measured at **record** level by impersonation, because a table-level `canRead()` cannot evaluate a conditional ACL. **manager:** create on all 3 tables, all 10 cases visible, read+write+**delete** on unassigned, group-only and agent-assigned fixtures, both sensitive fields writable. **agent:** create yes; **9 of 10** cases visible — the unassigned case is `read=DENIED`; write yes on both assigned shapes; **delete no**; field ACLs correct — `assigned_group` not writable at all, `assigned_agent` writable **only** on the case where the agent is the assigned agent. **viewer:** create **no** on all 3, all 10 visible, write and delete **no** everywhere. Both halves of "Assigned only" proven — the group half via a group-only case, the agent half via an agent-assigned case. **Child-table mirror proven with a purpose-built fixture** (the demo data could not prove it, as the unassigned case has no children): one task and one party added to the unassigned case were visible to manager and viewer (11 / 9) but **excluded from the agent's list and denied on direct read**; the fixture was then deleted and the census restored to 10 / 10 / 8. |
| 4 Portal — submission | ✅ Pass — REST **and** page | Anonymous, no credentials (`window.NOW.user_display_name === "Guest"`, every response carrying `x-is-logged-in: false`): the page renders a single `<form>` with the five required controls — `subject`, `type` (choice: General Inquiry / Complaint), `description`, `requester_name`, `requester_email` — a Submit button that stays disabled while the form is invalid, and on submit `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE…","message":"Your case has been submitted"}` with the form replaced by a confirmation panel reading the verbatim message plus the returned case number. The row lands `status=Draft`, `sys_created_by=guest`, assignment and `closed_date` empty, and appears in the internal Cases list. Zero console errors; zero requests ≥ 400. *(Earlier revisions of this row recorded the page as failing; that was true before the layout records existed.)* |
| 5 Portal — lookup | ✅ Pass — REST **and** page | Anonymous: the page renders one case-number input and a result panel showing exactly three labelled values — Status, Subject, Opened Date. A whitelist audit of the rendered `<main>` for `assigned_group\|assigned_agent\|description\|closed_date\|requester_name\|requester_email\|priority\|type\|@` returned **zero matches**, and the panel holds exactly 3 `dt`/`dd` pairs. An unknown number replaces the panel with an alert whose `innerText` is byte-identical to the required literal `No case found with that number.` (31 characters, codepoint-verified). A stored `<img src=x onerror=…>` subject renders as **text** (`&lt;img` in the raw HTML, 0 images, `window.__fixqXss` undefined). *(Earlier revisions of this row recorded the page as failing; that was true before the layout records existed.)* |
| 6 Dashboards | ✅ Pass — **re-measured after the fix** | **Agent Workspace renders 3 of 3 widgets and Manager View 5 of 5**, all with live data over the 10 seeded cases, correct chart types (2 bars, 2 donuts, 2 single scores, 2 lists) and zero console errors. Persona-verified by impersonation across all 6 (persona, dashboard) pairs: manager ✅✅, agent ✅ Agent Workspace with *My Open Cases* listing exactly `CASE0000981` / `CASE0000982` / `CASE0000986` and ⛔ correctly refused on Manager View, viewer ⛔ refused on both — the refusals being the platform's dashboard-level "has not been shared with you" message with no widget request issued at all. §0.5 carries the per-widget values. *(The original ❌ measurement is retained in §0.5's forensic subsection: 0 tabs, 0 widgets, the empty state "Add widgets using the widget picker.", `pa_widgets` in scope 0, and two inert `sys_grid_canvas_pane` stubs — the consequence of three child table names that do not exist on this release.)* |
| 7 Update Set | ⚠️ Conditional | §0.3 in full — 41 → 298 → **0** problems of any type, `unresolvedProblems=false`, then `committed` — but that was the earlier `7272edfc…` revision. On the 925-block `e49a7654…` revision: **zero `Could not find a record` problems** (63 → 0) with 31 local-history collisions remaining and **commit withheld** on the shared instance (§0.3b). On the shipping 926-block bytes: **no preview run**; the 13-payload + 1-block delta and what *was* measured on it are in §0.3c. |

Two AAP requirements outside the seven gates were tracked here and **both are now fixed.** **Related lists**
were never authored; they now ship as one `sys_ui_related_list` plus two entry rows, and on `CASE0000981` the
form's `#related_lists_wrapper` measures **227.3125 px** with sections *Case Tasks (2)* and *Case Parties (2)*
listing the real children — identically for admin, agent and viewer (§0.6.2, §9.6 E8). The **party UI Policy's
on-change re-evaluation** was the second item: two declarative policies replaced the tautological script-driven
one, and re-evaluation was verified in a browser in both directions with real mouse interaction (§9.6 E4). The
demo census behind all of the above is §9.8a.

### 0.7 What the current package contains no automation for

**Nothing in this package fires on its own.** The bootstrap Business Rule that once dispatched the remediation
on commit was built, measured firing, measured failing with 121 `SecurityException`s, and then **deleted** —
both because it could not succeed and because its condition matched the commit of **any** retrieved Update
Set, not just this application's, so activating it would have dispatched privileged, partly destructive
remediation on unrelated deployments (§9.4). The Fix Script travels in the package so the remediation body is
auditable there, but **running it from the Fix Script UI does not work either**, because the commit engine
rewrites the record's scope. The only measured route is a manual run from *System Definition → Scripts -
Background* with **"In scope" = Global**. §9.5 is the procedure.

### 0.8 Four behaviours the QA-remediation pass disclosed rather than repaired

Each was reported by QA as an informational finding, re-measured on the live instance during the remediation
pass, and then written up where a reader would look for it instead of being fixed — because in each case the
fix would either be impossible in the application layer or would add workflow the AAP does not specify. They
are listed here so they are discoverable from this authoritative block and are not mistaken for oversights.

| Behaviour | Why it is disclosed rather than fixed | Written up in |
|---|---|---|
| **An invalid choice value sent to the REST Table API returns `HTTP 200` and is silently dropped.** All five choice fields carry `choice = 3`, so the platform discards an unrecognised value before any Business Rule evaluates; `sys_mod_count` stays `0` and no error reaches the client | A before-update rule cannot see a value the dictionary already removed. Hard rejection would need a Scripted REST wrapper in front of the Table API, and AAP §0.1.1 states the target deliberately exposes the platform's auto-generated Table API | §4 item **15** |
| **A write refused by an ACL is silent on the classic form** — `HTTP 302` exactly like a success, empty body, `#output_messages` keeps `outputmsg_hide`, `0` message nodes, and a 407-character page containing no explanation. The Table API says `403 ACL Exception Update Failed due to security constraints` | No application code runs: the ACL layer stops the write before any Business Rule evaluates, so there is nothing the application can author a message from. AAP §0.7.1's "surface all blocking errors on the form" is met by the workflow layer, which does render a banner on every transition refusal | §4 item **16** |
| **The all-tasks-closed rule gates one edge, not the Resolved state** — a new open task can be added to a Resolved case, a closed task can be reopened, and `Resolved → Closed` then succeeds with open child work | AAP §0.5.5 attaches the condition to `In Progress → Resolved` and attaches only the manager-role check to `Resolved → Closed`. The implementation matches the matrix exactly; strengthening it would add workflow the Minimal-Change Clause (§0.7.2) forbids | §5, final bullet |
| **For a same-save field-plus-status change the subflow's verdict is advisory and discarded** — the subflow reads the committed row, returns a false `blocked=true`, and the in-flight Script Include verdict wins and is correct | A before-update rule is the only layer that can abort a save and surface a form error; a flow trigger fires after the commit; no API lets a subflow read the in-flight `current`. Trusting the subflow would reject legal transitions. Covered by directive overrides **C1** and **C8** | §3.3 |

### 0.9 Five more behaviours the QA-findings pass disclosed rather than repaired

The pass that closed the six formal QA findings also re-measured five behaviours that it deliberately did **not**
change, for one of two reasons in every case: the only available remedy is a write outside this application's
scope, which AAP §0.3.2 forbids outright, or the behaviour already matches what the AAP specifies and changing it
would add design the Minimal-Change Clause (§0.7.2) bars. They are listed here so that a reader who meets one of
them recognises it as a known, bounded property of the deliverable.

| # | Behaviour, as measured | Why it is disclosed rather than fixed |
|---|---|---|
| **ADV-1** | **`case_party.organization` reads as empty for every non-admin user.** The values are real and correct — `PARTY0000160` holds *Synthetic Org Alpha*, and `admin` sees it on the form, in the list and in the API — but the column is stripped from every payload served to the three demo personas, because `GET /api/now/table/core_company` answers those personas **403**. A reference field whose target table the caller cannot read renders blank rather than erroring | `core_company` is an out-of-box **global** table. The only fix is a read grant on it — a global ACL, or a global role assignment — and **AAP §0.3.2 forbids global-scope changes of any kind**, naming `core_company` explicitly among the tables that must not be edited. The scoped side is already correct: `x_casemgmt_case_party` read is granted to all three roles, and the `organization` column itself carries no field-level denial |
| **ADV-2** | **The viewer is offered a `Delete` item in the list-actions dropdown.** It is a cosmetic affordance only: the server-side ACL refuses the operation, and the viewer's measured capability is read-everything / write-nothing with no `New` button on any of the three lists, 13/13 form fields read-only, and no `Update`, `Save` or transition action | The dropdown is the platform's own list-actions menu, assembled from **global** records shared by every table on the instance rather than from anything this application authors — nothing in the `x_casemgmt` scope contributes an entry to it. Suppressing one entry for one scoped table therefore means editing a global record, which AAP §0.3.2 forbids. The security boundary is enforced where it must be — the write is refused — so what remains is an affordance that misleads, not an access hole |
| **ADV-3** | **The three demo users each carry the out-of-box role `snc_required_script_writer_permission`** in addition to their one scoped role | It is granted by the platform's own user-provisioning logic, not by any seed artifact in this package, and it confers no access to this application's tables. Removing it would be a write to `sys_user_has_role` rows this package does not own. Recorded so that a role census of the demo users is not read as a packaging error |
| **INFO-3** | **The portal's colour contrast and control sizing sit below WCAG AA in five measured places** — helper text 2.14:1, enabled-button label 3.63:1, the amber alert 3.32:1, the focus glow 2.37:1, and 34 px control heights. Re-measured after this pass's accessibility work: the new per-field error messages, `aria-invalid` bindings, `role="alert"` / `role="status"` regions and `aria-describedby` wiring are all in place and were verified, but they do not move contrast or size. One further instance found while re-testing: the **Submit button is 68.63 px wide** — Bootstrap's intrinsic shrink-to-fit around a five-character label, constant at 375 / 768 / 1280 / 1920 px | Every one of these values is inherited from the **default Service Portal theme**, and AAP §0.4.4 specifies that theme with *"No custom CSS, no custom branding."* Fixing any of them requires adding CSS, which is the one thing that section forbids. The `css` field on all three widgets is verified **empty (0 characters)** for exactly that reason. Precedence is explicit in this deliverable: the design contract outranks the accessibility heuristic, so the constraint is honoured and the gap is disclosed |
| **INFO-5** | **A Closed case's protection is server-side only.** The form still renders `Status` and the other columns as editable and still offers `Update`, so a user learns the record is frozen by attempting a save and reading the banner. The refusal itself is complete and verbatim — `Closed cases are terminal and cannot be modified.` at 49 characters, for a field-only edit as well as a status change (§9.6 **E13**) — and nothing is written (`sys_mod_count` unchanged) | AAP §0.5.5 requires that a transition out of `Closed` be *"PROHIBITED — terminal state"* with the blocking error surfaced on the form, which is exactly what is delivered. Making the whole form read-only on `Closed` is additional UI design — a UI Policy or a client script the AAP does not specify — and the Minimal-Change Clause bars adding it. A kinder form is a legitimate future improvement, not a defect against the specification |

**One informational finding was resolved by documentation rather than by code, and that decision is recorded
where the contract lives.** The anonymous submit endpoint accepts a payload with no `type` and stores the case
with `type` empty, while the portal form marks Type required. `CasePortalService._validateSubmission` treats
`type` as optional-but-choice-constrained deliberately: AAP §0.5.7's `x_[scope]_case` table does **not** mark
`type` mandatory, so rejecting the request would make the API stricter than the specification it implements. The
API contract is now stated explicitly in `portal-pages.md` instead. The two informational findings that *were*
code-fixed in this pass are the lookup widget's missing timeout and 504-as-not-found mapping (**INFO-2**) and the
silent truncation at 255 / 4000 characters (**INFO-4**); both are described in §0.3c.

### 0.10 Console and network noise that is the platform's, not this application's

A final consolidated audit loaded all nine internal screens and both public portal pages and recorded every
console message and every network response. The headline numbers are clean — **0 console errors and 0 responses
≥ 400 across 711 requests** on the nine internal screens, and **0 application console errors with no unexpected
response ≥ 400** across 70 requests on the two portal pages. This section records the non-empty *warning* channel
so that a later pass recognises it rather than re-filing it, because every entry in it originates in a ServiceNow
platform bundle and none of it can be fixed from inside this scoped application.

| What appears | Where | Origin — why it is not ours |
|---|---|---|
| `Highcharts warning #26` (6×) | both dashboards, all four chart reports | `GlideV2ChartingIncludes.jsx`. Highcharts' "WebGL not supported, no fallback module" notice on a headless/software-GL browser. Every chart still drew correctly and was measured. |
| `getMessage (key="…"): synchronous use not supported in Mobile or Service Portal unless message is already cached` (21×) | dashboards + Report Designer | `js_includes_dashboards_2.jsx` and the condition-builder i18n. Uncached i18n keys (`Open user's profile`, `and condition`, `or condition`). |
| `The specified value "" does not conform to the required format. The value must be a valid CSS color.` (2×) | both dashboards | `initColorPicker` in `js_includes_dashboards_2.jsx`, seeded with an empty value by the platform. |
| `<now-dropdown-panel> is a deprecated component …` (4×) | the four chart reports | entirely inside `sn-nlq-query-input.min.js` — the Report Designer's natural-language query box. |
| `Need to call setKeys with a valid apiKey` and `No current page in dataContext, skipping click handling` (8×) | both portal pages, 2 per click | `js_includes_sp_defer.js` click telemetry; a PDI has no analytics apiKey configured. |
| `Unload event listeners are deprecated …` | every screen | a DevTools *Issues* entry (not a console error or warning) from `sp_min.jsx` / `js_includes_doctype.jsx`. |
| `GET /%7B%7BgetReportIcon(category)%7D%7D` | both dashboards | the literal AngularJS expression `{{getReportIcon(category)}}` requested as an image `src` by the platform's widget-picker template. Returns 200, so it is a wasted round trip rather than a failure. |

**One entry deserves singling out because it is exception-shaped and it appears on this application's own case
form:** `Exception while evaluating NACM configuration in text area: ReferenceError: renderNACMFieldLevel is not
defined`, five times per load, with a stack that runs entirely through the platform's
`js_includes_doctype.jsx` → `runBeforeRender` → `z_last_include.jsx` NACM (field-level security) bootstrap. It is
emitted through ServiceNow's `jslog` at console level **`log`**, not `error`, which is why the audit's error count
is still zero. No rendering defect accompanies it, every field and both related lists render correctly, and
nothing in this scoped application references `renderNACMFieldLevel`. It is recorded here only so that a reader
who opens DevTools on a case form is not misled into believing this application throws.

**Two expected non-2xx responses, so they are not mistaken for regressions.** The deliberate not-found lookup
returns **HTTP 404** by design and Chrome additionally logs its own unsuppressable
`Failed to load resource: … 404 (Not Found)` for it; that pair is the correct behaviour of the AAP §0.7.4
not-found contract, not a fault. Separately, `204` (page-timing PATCH), `201` (the platform's own
`POST /api/now/ui/history` on dashboard load) and `304` (cached Angular partials) occur routinely and are all
successful responses below any failure threshold.

**One reading trap on the Agent Workspace dashboard.** Opened as `admin`, its two list widgets correctly show
*"No records to display"*, because *My Open Cases* and *My Overdue Tasks* filter on
`assigned_agent`/`assigned_to = current user` and the demo records belong to `Demo Agent`. The widgets themselves
render fully — title, column set, empty state. With the agent persona impersonated they list
`CASE0000981` / `CASE0000982` / `CASE0000986` (§0.5). An empty list under `admin` is the reports working, not
failing.

### 0.11 The verification instance is hibernating, so nothing in this register has been re-measured since 2026-08-11

**Every measurement in this document was taken before this outage, on the dates each section states. None of them
has been re-taken since, and no reader should treat any of them as re-confirmed today.**

**What happened.** On 2026-08-11 a form-driven `In Progress → Resolved` save on a case with one open child task
returned **HTTP 502** from the `snow_adc` edge — a 555-byte error page, no application banner painted, so whether
that write committed is unknown. Every route on the host then answered 502 for roughly five hours. From
approximately 18:00 UTC the same day, **every** route on `dev379024` began
returning ServiceNow's static **"Instance Hibernating page"** at HTTP 200: `/login.do`, the scoped list route
`x_casemgmt_case_list.do`, `/stats.do`, and every `/api/now/table/…` endpoint each answer with one byte-identical
**5,904-byte** document (md5 `5ebcd848f165ae9a34359c01e0289f16`) carrying 0 forms, 0 inputs, 0 scripts, no
occurrence of `x_casemgmt`, and **none** of the Glide application-node headers a live instance emits
(`JSESSIONID`, `glide_user_route`, `glide_node_id_for_js`, `x-transaction-id`, `server-timing`). Arbitrary
non-existent paths return the same document, so requests are terminating at the edge and never reaching an
application node. Re-probed repeatedly across more than three hours by both `curl` and a real browser: unchanged.
This is an availability regression on the hosting PDI, not a missing or broken application — the same host served
the portal and the login form normally three days earlier.

**Why it cannot be resolved from a build environment.** The placeholder's only control is a **Sign in** button
whose target is `https://developer.servicenow.com/dev.do#!/home?wu=true`; waking a hibernating PDI requires an
authenticated **ServiceNow Developer Program** session for the account that owns the instance. The credentials
available to this project are *instance* credentials (`admin`), and every developer-portal wake endpoint answers
HTTP 401 `User is not authenticated` with or without them, while the portal presents an anonymous visitor no
wake affordance at all. `dev364430` — the hostname the AAP and the setup instructions name — is reachable but
rejects these credentials, which is §10.4 item 11.

**What the outage leaves unproven.** The clean-slate preview of the shipping bytes (§10.0 item 1a), an ATF suite
run against re-loaded artifacts (§10.0 item 2), a fresh run of the 13-assertion transition harness (§9.7), and a
re-observation of the eight form assertions (§3.4) are all blocked until someone wakes the instance. §10.0 item 0
is the precondition for every one of them.

**The one code-side suspect, and why it has not been changed on suspicion.** The request that returned 502 was a
save that reaches the order-250 guard, and §3.4 measures those at **8–10 seconds**, because
`x_casemgmt_enforce_forward_transitions` runs the matching subflow through
`sn_fd.FlowAPI.getRunner()…inForeground()` before re-evaluating the gate. That foreground call is **not**
load-bearing: STEP 2 of the same rule re-evaluates the identical gate against the in-flight `current` record
through `CaseTransitionValidator` and is what decides the outcome, and a `FlowAPI` failure only logs `gs.warn`
while STEP 2 still enforces — the rule fails closed onto the validator. So *if* the same save returns 502 again
on a woken instance, the first thing to establish is whether that transaction is timing out at the edge, and the
targeted remedy is to stop paying the foreground subflow on saves the guard is going to reject: evaluate STEP 2
first and dispatch the subflow only when the transition is allowed. That changes no verdict and no message, and
it is the same principle the rule already applies to transitions rejected at order 100/200, which abort in 35 ms
and 4 ms with no subflow dispatch (§3.4). It has deliberately **not** been applied yet: one 502 followed by a
whole-instance outage on every route is consistent with the hosting instance going down, the signal is not
reproducible while the PDI is asleep, and the enforcement path is not something to re-architect on an
unreproducible signal.

**Instance hygiene left behind.** Eight synthetic cases and two tasks prefixed `QA-FINAL`, created by the
verification pass shortly before the outage, are probably still on the instance: the delete requests issued for
them were absorbed by the placeholder rather than reaching the application. They are synthetic and carry no PII,
but anyone recounting demo-data thresholds after the wake should remove them first so the AAP §0.7.4 census is
read against the packaged seed rows alone.

---

## 1. Executive summary

| Capability | Runtime status on the PDI |
|---|---|
| 3 custom tables + fields + choices + auto-number | ⚠️ **Working, but not from the package alone.** The physical schema is built by `../scripts/post_import_remediation.js`. The package ships that script as a Fix Script so the body is auditable, but it ships **no trigger and nothing that runs by itself**: an auto-execute Business Rule was built, was measured firing on commit, was measured failing with 121 `SecurityException`s (the commit engine forces the record's `sys_scope` to the application, and `GlideTableDescriptor`/`GlideSecurityManager` are then refused in scoped execution), and was subsequently **removed from the package** for that reason and for the security reason in §0.7. On a genuinely clean instance the tables therefore arrive as metadata with **no physical storage** until an operator performs the manual sequence in §9.5, **steps 1-3**. Auto-numbering itself *is* carried by the package artifacts (§2 Defect E): after remediation a fresh insert produced `CASE0000448`, matching `^CASE[0-9]{7}$`. |
| 3 roles + ACL role × CRUD matrix (manager/agent/viewer, incl. assigned-only + field ACLs) | ⚠️ **Working, but not from the package alone.** A clean commit produces the 26 ACLs with **0 of 27** `sys_security_acl_role` links; the 27 links and the security-cache flush appear only after the remediation is run manually (§9.4–§9.5). Once run, the live 12-cell matrix is correct: manager full CRUD on all three tables; agent create with **no blanket** read/write and `delete=false`; viewer read-only. **Record-level narrowing empirically confirmed for both halves of the AAP §0.5.6 "Assigned only" definition** — impersonated agent sees 9 of 14 cases; `CASE0000453` and `CASE0000458` are visible with an *empty* `assigned_agent`, so group membership is the only possible grant path, and the five cases with neither group nor agent are absent. Direct-URL access to an unassigned row returns "Security constraints prevent access to requested page". Field-level ACLs confirmed too: the agent sees `assigned_group` read-only while `assigned_agent` stays editable. **Child-table narrowing: historically broken, now passing.** An earlier revision's `case_task`/`case_party` agent conditions could not compile (`case` is a JavaScript reserved word, so a `current.case` dot-walk fails); with the `current.getElement('case')` accessor the impersonated agent sees its assigned task and party rows (10 and 8) with write but not delete, and `ATF 07` passes — green in the current suite run `TES0001015` (§8.3). The failure is retained in §9.6 E-ATF as diagnosis only; it is **not** an open defect. |
| Prohibited-transition guards (Any→Draft, Closed→*) | ✅ Working (Business Rules). Since the QA-remediation pass this also covers a Closed row's **fields**, not just its status: a field-only edit to a Closed case raises the same verbatim message, while a save that changes nothing is still accepted (§9.6 **E13**) |
| Transition-graph enforcement (only the edges AAP §0.5.5 lists are legal) | ✅ Working (Business Rule order 250, STEP 0). Was previously **absent** — only each target status's precondition was checked, so all 8 illegal skip/backward edges were accepted and `Draft→Closed` could reach the terminal state unassigned with an empty `closed_date`. Now refused with a message naming the attempted edge and the legal next status; 16/16 attempts blocked across both case types (§9.6 **E12**) |
| The six transition **UI Actions** (`Open`, `Start Progress`, `Set Pending`, `Resume`, `Resolve`, `Close`) | ✅ Working. Visibility is correct for all 18 identity × status combinations, including zero buttons for the read-only viewer, after the four over-length conditions moved into `CaseTransitionValidator.canShowAction()` (§9.6 **E3**); and `Set Pending`, which could never reach the server because of a reserved `sysverb_` prefix in its `gsftSubmit` call, now performs its transition (§9.6 **E11**) |
| Transition side-effects (`opened_date`, `closed_date`, clear `pending_reason`) | ✅ Working (Business Rules) |
| `assigned_agent` must be a member of `assigned_group` (when an agent **is** set) | ✅ Working (Business Rule) |
| Anonymous portal **REST contract** (submit → Draft + number; lookup → whitelisted) | ✅ Working. `service_id` is carried by the package itself (§2 Defect 7), and the two `sys_ws_operation` payloads were re-synced from their authoritative artifact files in this pass (§9.3, deliverable edit 2). Re-verified after the clean-instance round trip with **no credentials on the request**: `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE0000450","message":"Your case has been submitted"}`; `GET …/case_status_lookup?number=CASE0000450` → **200** with body keys exactly `{status, subject, opened_date}` and all seven internal fields absent; `?number=CASE9999999` → **404** `{"error":"No case found with that number."}` — byte-compared to the required literal, 31/31 bytes identical including the trailing full stop. |
| Anonymous portal **pages** (`/x_casemgmt_case_portal` submit + status-lookup screens) | ✅ **Working.** Two defects had to be fixed: the Service Portal **layout** records were never authored (§9.6 E8-P) — `sp_container` → `sp_row` → `sp_column` → `sp_instance` are now packaged for both pages, 8 records — and both widgets read `response.data.number` / `response.data.status` where a Scripted REST response nests the body under `result`, so a 201 rendered "Submission failed"; both now unwrap defensively. Verified anonymously in a browser: submission renders 5 inputs and a confirmation panel carrying the verbatim message and the returned `CASE…` number, lookup renders exactly Status / Subject / Opened Date and the verbatim `No case found with that number.`, with 0 console errors and no request ≥ 400 |
| Reports (8) + Dashboards (2) records + demo data | ✅ **All three working, after two packaging defects were fixed.** Reports: the four chart reports grouped by the wrong dimension because they specified `<group_by>`, which is **not a column on `sys_report`** — the column is `field`. Renamed in the four artifacts and their payloads, and all four now plot the intended dimension (status 6 buckets / type 2 / priority 4). A second, independent gate had to be closed for any persona to open them at all: the read ACL's role branch runs only when `sys_report.user` is the literal `GLOBAL`, so all 8 now ship `user=GLOBAL` **and** the three scoped roles in `roles` (§0.6.1). Dashboards: both were re-authored onto the tables this release actually has — `sys_portal_page` + `sys_grid_canvas` + `pa_tabs` + `pa_m2m_dashboard_tabs` + a `sys_portal` / `sys_portal_preferences` / `sys_grid_canvas_pane` trio per widget + `pa_dashboards_permissions` share rows + `restrict_to_roles` — replacing three table names that do not exist on this release (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`). **Agent Workspace now renders 3 of 3 widgets and Manager View 5 of 5**, with live data and correct chart types, for every persona the AAP names and refused for the two it does not (§0.5, §9.6 E5). Demo data ✅ at the AAP §0.7.4 thresholds — 10 cases across all six statuses, both types, 10 tasks, 8 parties — and the seed script now **adopts** the packaged rows by their pinned numbers rather than requiring them to be deleted first (§9.6 E1). |
| **Forward-transition precondition guards** (Draft→Open needs group; Open→In&nbsp;Progress needs agent-in-group; In&nbsp;Progress→Resolved needs all tasks closed; Resolved→Closed needs manager role) | ✅ **Enforced at runtime, blocking on the form** — all 7 Flow Designer flows were re-authored natively and now execute; the order-250 before-update Business Rule runs the matching validation subflow synchronously and aborts the save with the verbatim message. Verified on the live case form for **both** case types (Defect F, §3). |

**Bottom line.** The application logic is sound: the data model, access control, prohibited-transition
protection, side-effects, the forward precondition guards and the portal **REST contract** all work, and the
*positive precondition* checks for forward state transitions run and block invalid transitions on the form —
the seven flows that contain them were re-authored through Flow Designer itself and are invoked synchronously
from a before-update Business Rule.

**What the package alone does *not* deliver.** The clean-instance round trip of §9.10 showed that upload →
preview → commit **previews with zero errors** — on the earlier bytes identified in §0.3 — but does **not** by
itself yield a fully functional application. **Nothing in the current package runs by itself** (§0.7): two
things need one manual remediation run (Defect C, physical schema; Defect 9, the 27 ACL role links), and the
demo data needs `scripts/seed_demo_data.js` run in scope after commit — it now ADOPTS the packaged rows by
their pinned numbers rather than requiring them to be deleted first. There is one more manual step, and it is
new: on an instance that has already rendered the case form, the imported related-list definition does not take
effect until *Configure ▸ Related Lists* is opened and **Saved** once, because the server caches a form's
related-list set (§0.6.2, §4 item 17, `deployment.md` step 12). Earlier revisions of this paragraph also listed
the two **dashboards** and the **related lists** as broken independently of installation; both have since been
authored, packaged and verified rendering (§0.5, §0.6), and that claim is withdrawn. Every residual step is
enumerated in §9.5, §9.6 and §10. Acceptance path **(b)** of the Refine-PR brief therefore still applies, not
(a) — the reason is now the install footprint alone, not a non-functional surface.

---

## 2. Defects found in the deliverable, and their remediations

> Nine packaging/configuration defects were remediated to make the deliverable's **own documented intent**
> deploy and run. None of these involved authoring new application logic — they restore the generator's
> stated design (e.g., wiring existing roles to existing ACLs per each ACL's own description, building tables
> from the deliverable's own field specs). The tenth issue (Defect F, flows) needed more than packaging
> repair and is documented separately in §3.

### Defect A — Duplicate Application/scope record  *(fixed in deliverable XML)*
- **Symptom:** preview produced ~123 name-resolution errors (109 on `sys_scope`); `case_task`/`case_party`
  and all choices failed to materialize.
- **Root cause:** the XML contained **two** Application records for scope `x_casemgmt` — a standalone
  `sys_scope` row *and* a `sys_app` row — creating an ambiguous scope hierarchy.
- **Remediation:** removed the redundant standalone `sys_scope` `<sys_update_xml>` block so the single
  `sys_app` (`82b99028…`) is the sole scope authority (record count 149 → 148).

### Defect B — `application` reference encoded as a name string  *(fixed in deliverable XML)*
- **Symptom:** after fixing A, physical tables `case_task`/`case_party` still would not materialize.
- **Root cause:** every `sys_update_xml.application` value (a reference to `sys_scope`) was serialized as the
  name string `"x_casemgmt_case_management"` instead of the scope **sys_id** (149 occurrences).
- **Remediation:** replaced all 149 `<application>` values with the scope sys_id `82b99028…`. XML re-uploaded
  and re-previewed with **zero errors** (problem progression 111 → 5 → 0).

### Defect C — Update Set commit does not trigger DDL for **new** tables  *(platform limitation; the remediation body is shipped, nothing auto-executes it — one manual run is required)*
**Verdict: NOT automated end-to-end. A human step is required.** The package ships the remediation body as a
Fix Script so it is auditable inside the deliverable, and **nothing in the package executes it**. An
auto-execute trigger was built and measured: it **did fire** on commit and then **failed with 121
`SecurityException`s**, because the commit engine rewrites the record's `sys_scope` to the application and
`GlideTableDescriptor` is refused in scoped execution (§9.4). It has since been **removed from the package**
(§0.7) — for that reason and because its condition matched the commit of *any* retrieved Update Set. The
physical schema therefore appears only after an operator runs `../scripts/post_import_remediation.js` from
*System Definition → Scripts - Background* with **"In scope" = Global**. The exact sequence, in the order it
must be performed, is [§9.5](#95-residual-manual-footprint-per-defect-with-the-precise-step) steps 1-3.
Acceptance path **(b)**, not (a).

- **Symptom:** after a clean zero-error commit, `x_casemgmt_case` materialized but `x_casemgmt_case_task`
  and `x_casemgmt_case_party` physical tables and **all** choice lists were absent (persisted across 6 commit
  attempts and a full app-delete teardown + re-establish cycle).
- **Root cause — named, and proved rather than inferred.** The physical DDL for a brand-new table is emitted
  by the platform's **after-insert Business Rule `Synch Dictionary and Table` (order 500) on `sys_db_object`**.
  The Update Set apply engine (`GlideUpdateManager2`) applies every captured payload with the target record's
  **business rules suppressed**, so that rule never runs. Six controlled trials on throwaway probe tables:

  | Trial | What was applied | Result |
  |---|---|---|
  | 1 | `sys_db_object` insert, `setWorkflow(false)` | `physical=false`, 0 collection rows, 0 dictionary rows |
  | 2 | + `sys_dictionary` collection row (element NULL, `internal_type=collection`), workflow **ON** | `physical=false` — platform log `Table is not valid - <probe>` |
  | 3 | `sys_db_object` + collection row, both workflow **OFF** | `physical=false` |
  | 4 | `sys_dictionary` element row alone, workflow OFF | `physical=false` |
  | 5 (control) | `sys_db_object` insert, workflow **ON** | `physical=true`, 7 columns — logs `Slow business rule 'Synch Dictionary and Table' on sys_db_object`, `Creating table:`, `DBTable.create() for:` |
  | 6 | the package's own `sys_db_object` payload through **`GlideUpdateManager2.loadXML`** (the engine's own apply path) | metadata row created (`0 → 1`) but `physical=false`, no DDL log lines |

  Trial 6 is the decisive one: **no payload or ordering change can make the engine run a business rule it
  deliberately suppresses**, so a "fix it in the XML" remediation for Defect C is not merely undesirable, it is
  impossible. Trials 2 and 3 also rule out the intuitive fix of shipping the `sys_dictionary` collection row —
  it does not substitute for the business rule, so those three blocks were deliberately **not** added rather
  than shipped inert (they would also risk a duplicate-collection-row hazard on a table that is already
  physical, the same class of failure as Defect A).
- **Remediation — shipped in the package, but run by hand.** `scripts/post_import_remediation.js` builds the
  tables, all 25 fields and all 24 choice values from the deliverable's own specs (`../tables/*.xml`,
  `../dictionary/*.xml`, `../choices/*.xml`, which mirror `data-model.md`). The package ships **no trigger for
  it** — one was built, measured firing, measured failing (§9.4), and then removed, so nothing can mislead an
  operator into believing the remediation happened. **An operator must run the script explicitly, in scope
  Global**, per §9.5 steps 1-3.
  Idempotent, and **fail-closed by design**: a table whose physical state cannot be positively established is
  left **strictly untouched** and the run aborts for that table rather than assuming the table is
  metadata-only. The clean-slate rebuild only ever deletes rows for a table it has *proved* has no physical
  storage — proof requires three independent signals (`GlideTableDescriptor.isValid`,
  `GlideRecord.isValid`, `TableUtils.tableExists`) to agree on "no"; any one of them saying "yes", or any of
  them throwing, aborts. Every `deleteRecord()` return value is checked and the collection is read back, so a
  partial deletion aborts instead of proceeding. It can therefore never destroy data.
  **It also proves ownership before it deletes anything, which is a separate question from physical state.**
  `inventoryTableMetadata()` examines every `sys_dictionary` and `sys_db_object` row carrying the table's name
  and admits each one only as this application's own — an element the package declares (the collection row,
  the `TABLE_SPECS` fields, and the `number` column the platform's own number-maintenance rule adds for a
  declared counter), carrying this application's scope **and** package — or as the platform's own
  identity/audit plumbing, which carries no scope at all. A single row that is neither, a declared element
  wearing another application's scope, two rows claiming one element, or a second `sys_db_object` of the same
  name, is reported with its `sys_id` and its reason and the table is abandoned with **nothing deleted**. A
  dictionary row an administrator or another automation added to a metadata-only application table is
  therefore never erased. The deletion that follows a clean inventory addresses rows by **primary key**,
  restricted to that inventory, so a row arriving mid-purge cannot be caught by a stale selector. The same
  check guards the single-row delete in `ensureField()`.
- **Cross-check for whoever runs the clean import.** Because the DDL provably cannot happen until after the
  commit completes, the 28 **seed-data** blocks (10 Case, 10 Case Task, 8 Case Party) cannot land on a
  genuinely clean import: applying a data payload to a table that has metadata but no physical storage was
  measured to return without throwing and insert nothing (`GlideRecord.query() - invalid table name: …`), the
  same silent-skip behaviour as Defect 9's link payloads. Demo data is not part of the acceptance criteria for
  package self-sufficiency (tables, numbering, REST, RBAC), and it is restored by running
  `scripts/seed_demo_data.js` **in scope** afterwards, exactly as this guide already prescribes.

### Defect D — Cross-scope barrier for background scripts  *(platform behavior; read opened, writes closed on purpose)*
- **Symptom (as first met):** a `global` background script could neither create nor read rows in the scoped
  `x_casemgmt_*` tables (writes refused; reads return 0 rows).
- **Root cause:** background scripts execute in `rhino.global`; a scoped table's Application Access columns on
  `sys_db_object` decide what another scope may do, and the package had shipped them as the string `"public"`,
  which a boolean column stores as `false` (§9.6 **E9**).
- **Current, deliberate state:** `read_access` and `ws_access` are `true`, so a `global` script and the REST
  Table API can **read** these tables — that read is what the REST verification gate and the ATF client runner
  need. `create_access`, `update_access` and `delete_access` are `false`, so a cross-scope **write** is refused
  by design: *"Create operation against 'x_casemgmt_case' from scope 'rhino.global' has been refused due to the
  table's cross-scope access policy."* Application Access is a gate separate from the record ACLs — a plain
  `GlideRecord` in another scope is not ACL-filtered at all, and Global code can suppress this application's
  before-update transition guards with `setWorkflow(false)` — so leaving the write columns open would have put
  every case row outside the role matrix of `acl-matrix.md` and outside the state machine.
- **Consequence for operators:** any script that **writes** application data must run **in scope**, by passing
  the scope **sys_id** (`82b99028…`) as the `sys_scope` parameter to `sys.scripts.do`. That is how
  `scripts/seed_demo_data.js` is run. `scripts/post_import_remediation.js` runs in **Global** and writes only
  platform tables, so it is unaffected. (The impersonation constraint in §3 is a separate limitation.)

### Defect E — Auto-numbering not wired  *(now folded into the package artifacts)*
**Verdict: folded into the importable package. No human step.**

- **Symptom:** new `x_casemgmt_case` inserts received no `CASE…` number.
- **Root cause — two independent gaps, both now closed in the package:**
  1. The `number` dictionary entry shipped with an **empty** `<default_value>`. The wiring is normally created
     by the platform's after-insert Business Rule **`Create Default Number Maintenance Field` (order 1000) on
     `sys_db_object`** — which the commit engine suppresses for exactly the same reason as Defect C's
     `Synch Dictionary and Table`. So Defects C and E share one root cause.
  2. The three counter artifacts carried `<number_of_digits>7</number_of_digits>`, and **`number_of_digits` is
     not a column on `sys_number`**. The live dictionary for `sys_number` exposes exactly
     `category`, `prefix`, `number`, `maximum_digits`, `sys_id`. The element was therefore **silently
     discarded on import**, which is why the format degraded rather than erroring — the padding never arrived.
     (A dead `<maximum>0</maximum>` element was present for the same reason and has been removed.)
- **Remediation, in the artifacts themselves:**
  - `dictionary/x_casemgmt_case_number.xml` now carries
    `<default_value>javascript:global.getNextObjNumberPadded();</default_value>`. **The `global.` qualifier is
    mandatory** — `getNextObjNumberPadded()` lives in the global scope and a scoped table's default-value
    evaluation will not resolve it otherwise. `read_only=true`, `internal_type=string`, `max_length=40`,
    `unique=true` are unchanged.
  - `numbers/sys_number_x_casemgmt_case.xml`, `…_case_task.xml` and `…_case_party.xml` now carry
    `<maximum_digits>7</maximum_digits>` in place of the discarded element; prefixes `CASE`/`TASK`/`PARTY`
    unchanged. All three had the identical gap, so all three were corrected.
  - All four changes are mirrored into the corresponding `Dictionary` and `Number Maintenance` `<payload>`
    blocks of `update-set/x_casemgmt_case_management_update_set.xml`, so the repo artifact and the deliverable
    cannot disagree.
  - `post_import_remediation.js` additionally re-asserts both values. That is not redundancy: Defect C's table
    rebuild re-creates the `number` dictionary entry from scratch, and the business rule that would normally
    wire it is suppressed.
- **Empirical verification** (live, in scope, after the edits): a synthetic probe insert received
  `number="CASE0000058"`, `^CASE[0-9]{7}$` → **true**, length 11; the live dictionary read back
  `default_value="javascript:global.getNextObjNumberPadded();" read_only=1 internal_type=string max_length=40`
  and the counter read back `prefix=CASE number=0 maximum_digits=7`. The probe row was deleted; the 10 demo
  cases keep their original numbers `CASE0000012…CASE0000021`. The anonymous portal write path produced
  `CASE0000059` in the same format, so numbering is confirmed through both the internal and external paths.

### Defect 6 — `gs.nowDateTime()` is scope-fenced  *(fixed live; repo source XML fix applied)*
- **Symptom:** date-stamping business rules failed silently / errored under the scoped execution context.
- **Root cause:** `gs.nowDateTime()` is not accessible in this scoped context.
- **Remediation:** use `current.opened_date = new GlideDateTime();` and
  `current.closed_date = new GlideDateTime();` in the `set_opened_date` / `set_closed_date` business rules.
  (Several textual occurrences of `gs.nowDateTime()` exist across the deliverable — in XML comments,
  `<description>` metadata, dictionary field-default idioms, and seed values — but only the two executable
  Business-Rule script lines matter, and ONLY those two are changed. They are corrected in BOTH the repo
  source XML (`business_rules/x_casemgmt_set_opened_date.xml` and `business_rules/x_casemgmt_set_closed_date.xml`)
  AND the corresponding records embedded in the deliverable update-set XML, for re-import faithfulness. The
  occurrences that previously sat inside the `validate_closed_transition` subflow are **gone**: that subflow
  was re-authored natively (Defect F, §3) and the re-authored flows contain no inline snapshot JSON at all, so
  no flow artifact in the package now references `gs.nowDateTime()`. `closed_date` stamping remains the job of
  the corrected `set_closed_date` business rule. XML comments, `<description>` text, dictionary defaults, and
  seed-data values are intentionally left as generated.)

### Defect 7 — Scripted REST `service_id` missing  *(now folded into the package artifacts)*
**Verdict: folded into the importable package. No human step.**

- **Symptom:** every call to the portal REST endpoints returned HTTP 400 "Requested URI does not represent
  any resource".
- **Root cause:** both `sys_ws_definition` records shipped with **no `<service_id>` element at all**, so the
  route collapsed to `/api/x_casemgmt`. `service_id` is the URL path segment the routing layer reads; the
  platform composes the read-only `base_uri` as `/api/<namespace>/<service_id>` from it.
- **Remediation, in the artifacts themselves:** `<service_id>case_submit</service_id>` added to
  `portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml` and
  `<service_id>case_status_lookup</service_id>` to `…_case_status_lookup.xml`, each placed in the file's own
  element order (between `requires_snc_internal_role` and `sys_class_name`). `requires_authentication=false`
  and `active=true` are unchanged. Both are mirrored into the two `Scripted REST Service` `<payload>` blocks
  of the deliverable Update Set.
- **Empirical verification** (live, after the edits, with **no `Authorization` and no `Cookie` header** on any
  request):
  1. `POST /api/x_casemgmt/case_submit` → **HTTP 201**
     `{"result":{"number":"CASE0000059","message":"Your case has been submitted"}}`
  2. `GET /api/x_casemgmt/case_status_lookup?number=CASE0000013` → **HTTP 200**
     `{"result":{"status":"Open","subject":"Demo case 02: Open (General Inquiry)","opened_date":"2026-08-06 21:41:34"}}`
     — response body keys are exactly `status`, `subject`, `opened_date`; no internal field is exposed.
  3. `GET /api/x_casemgmt/case_status_lookup?number=CASE9999999` → **HTTP 404**
     `{"result":{"error":"No case found with that number."}}` — string compared programmatically against the
     mandated text: exact match, single key `error`.

  The probe case created by step 1 was deleted afterwards; the case count returned to 10.

### Defect 8 — Stale live REST operation scripts  *(fixed live)*
- **Symptom:** after Defect 7, GET returned HTTP 200 + `null` for unknown numbers (should be 404) and POST
  returned HTTP 415 (no media type).
- **Root cause:** the live `sys_ws_operation` records held an **older** script than the deliverable's; the
  deliverable's operation scripts are correct (GET → 404 "No case found with that number."; POST consumes
  `application/json`, returns 201 `{number, "Your case has been submitted"}`).
- **Remediation:** copied the deliverable's own operation scripts onto the live operation records. (Note:
  `GlideStringUtil.base64Decode` is **not** static; use `gs.base64Decode()`.) Because the **deliverable XML
  already contains the correct scripts**, a clean fresh import does not reproduce this defect — it was a
  deployment state-sync artifact.

### Defect 9 — ACL → role link records entirely missing  *(automation is shipped, fires, and cannot complete — one manual run is required)*
**Verdict: NOT automated end-to-end. A human step is required.** The 27 links cannot be shipped as records at
all (two independent measured reasons below), so a script is the only mechanism available — and the script's
auto-execute path fires but fails, for the same commit-time scope rewrite as Defect C, because
`GlideSecurityManager` is refused in scoped execution (§9.4). The links and the security-cache flush appear only
after an operator runs `scripts/post_import_remediation.js` in scope **Global**
([§9.5](#95-residual-manual-footprint-per-defect-with-the-precise-step) step 3). Acceptance path **(b)**, not (a).

- **Symptom:** with the app committed, **no** role (manager/agent/viewer) could use the application; only
  `admin` (via `admin_overrides`) had access.
- **Root cause:** the deliverable ships 26 correct `sys_security_acl` records (correct operations,
  assigned-only condition scripts, and descriptions that name the intended role per ACL) but **zero**
  `sys_security_acl_role` link records. On this high-security PDI, an ACL with no role + no condition + no
  script evaluates to **deny** ("Deny access for empty term"), so every non-admin was denied.
- **Why the links cannot be packaged as records — two independent, measured reasons.**
  1. `sys_security_acl` has **no `roles` column** on this release. Enumerating `sys_dictionary` for the table
     and its `sys_metadata` super-class yields `active, admin_overrides, advanced, applies_to, condition,
     controlled_by_refs, decision_type, description, local_or_existing, name, operation, script,
     security_attribute, sys_id, type` — nothing role-bearing. So the links exist only as rows in the
     `sys_security_acl_role` m2m table; they cannot ride along inside the ACL record.
  2. `sys_security_acl_role` **payloads are silently skipped by the update engine.** Five different payload
     shapes were pushed through `GlideUpdateManager2.loadXML` — standalone; with an XML prolog; nested inside
     the parent ACL's `record_update`; wrapped in an `<unload>` document; and the platform's *own* captured
     serialization obtained via `GlideUpdateManager2.saveRecord` — and **all five produced 0 rows**, with no
     error raised. A plain `GlideRecord` insert of the same data from a global script produced 1 row.

  Shipping 27 `sys_security_acl_role` `<sys_update_xml>` blocks would therefore have looked correct in the
  package and delivered nothing on import. They are deliberately **not** in the deliverable, and no
  link-artifact files were added under `acl/` — that directory still holds exactly the original 26 ACL records.
- **Remediation — shipped in the package, but run by hand.** `scripts/post_import_remediation.js` creates the
  27 links and flushes the security cache. The package ships **no trigger** for it: one was built, fired, could
  not succeed (§9.4) and was removed (§0.7); **an operator must run the script in scope Global**
  (§9.5 step 3). The `.assigned_agent` field ACL needs both manager and agent, which is why 26 ACLs yield 27
  links (manager 14, agent 10, viewer 3).
- **The verification is fail-closed in *both* directions.** The script builds the **exact expected set of
  (ACL, role) pairs** from the ACLs' own `<roles>` declarations and then requires the live set to equal it
  — not merely to reach a threshold. `verified=false` is reported for a shortfall, for an **unexpected extra
  pair**, for an unexpected ACL count, or for any ACL it could not map. Extra pairs are not just flagged but
  **removed**, with each `deleteRecord()` return value checked and the row read back to confirm it is gone.
  Two invariants must both hold: `acl_links_total === 27` **exactly**, and the per-role distribution
  `manager 14 / agent 10 / viewer 3`. An earlier revision accepted any count `>= 27`, which would have let an
  **over-privileged** link — for example a `viewer` attached to a write ACL — pass verification silently; that
  hole is closed. Proven by injection: an extra `(case write ACL, viewer)` pair was created deliberately,
  verification failed on 28 links, reconciliation deleted exactly that pair, restored 27, and the read-back
  confirmed its removal.
- **How the role for each ACL is determined — and why it is never guessed.** Three sources, in order of
  authority, which independently agree on all 27 links:
  1. **The package's own `<roles>` declaration.** Every `acl/*.xml` artifact (and therefore every `ACL`
     payload block in the Update Set) carries e.g. `<roles>x_casemgmt_case_manager</roles>` or
     `<roles>x_casemgmt_case_manager,x_casemgmt_case_agent</roles>` — **role names, not sys_ids**. Because
     `sys_security_acl` has no `roles` column the element is ignored when the record is written, but the
     engine keeps each incoming payload as a `sys_update_version` row keyed `sys_security_acl_<sys_id>`, so
     the declaration remains readable on the instance. The script reads it back from there, newest version
     first, and accepts only this application's own three role names.
  2. The field-level naming convention: `.assigned_agent` → manager **and** agent; `.assigned_group` → manager.
  3. The ACL's own `description`, which names the intended role in prose.
- **A trap worth knowing about, found the hard way.** Source 3 alone is **not durable**. Deleting
  `sys_security_acl_role` rows fires the platform business rule **`Update ACL Description on Role Change`** on
  that table (implementation logged as `ACLDescriber`), which rewrites the *parent ACL's* description to
  role-less text such as `Allow read for records in x_casemgmt_case, never (all ACL conditions are empty).` —
  erasing the only prose copy of the mapping. This was observed directly: after the 27 links were deleted to
  prove the deny-on-empty-term behaviour, 24 of the 26 descriptions had been rewritten and only the two field
  ACLs could still be mapped. Source 1 was added for exactly this case, and recovered all 24 lost links with
  no re-import and no manual repair (`acls_scanned=26 | links_created=24 | links_already_present=3 |
  links_total=27 | unmapped_acls=0 | verified=true | errors=0`). The same property means the description text
  a reader sees on a live ACL is platform-generated once links exist; the authored prose lives in `acl/*.xml`
  and in the committed payloads, which remain authoritative.
- **Note on sys_ids and the "no hard-coded sys_id" rule.** Every reference resolved here is by **name**: the
  scope by `sys_scope.scope`, the roles by `sys_user_role.name`, the ACLs by their own `name` plus the
  `<roles>` declaration in their committed payload. Each link's own `sys_security_acl`/`sys_user_role` values
  are sys_ids read out of the database during the same run — never literals. `post_import_remediation.js`
  contains **zero** 32-character hex literals of any kind.
- **The security-cache flush needs no separate operator step.** `GlideSecurityManager.get().reset()` runs
  inside the same script pass that creates the links, in global scope (it is unavailable to a scoped caller),
  so the operator performing §9.5 step 3 does not have to flush anything by hand. Without it the links exist
  but enforcement does not change, which is the difference between "the records are there" and "access control
  works". This is the second of the two scoped-execution barriers that make the auto-execute path impossible
  (§9.4).
- **Empirical validation** (live, global scope, `GlideImpersonate` + `GlideRecordSecure`, after all package
  edits) — 27 links present, distributed manager 14 / agent 10 / viewer 3:

  | Role | `x_casemgmt_case` | `x_casemgmt_case_task` | `x_casemgmt_case_party` |
  |---|---|---|---|
  | manager | C ✅ R ✅ W ✅ D ✅ | C ✅ R ✅ W ✅ D ✅ | C ✅ R ✅ W ✅ D ✅ |
  | agent | C ✅ R — W — D ❌ | C ✅ R — W — D ❌ | C ✅ R — W — D ❌ |
  | viewer | C ❌ R ✅ W ❌ D ❌ | C ❌ R ✅ W ❌ D ❌ | C ❌ R ✅ W ❌ D ❌ |

  The agent's "—" is the correct observable, not a gap: `GlideRecordSecure.canRead()` with no record loaded
  evaluates the assigned-only condition script against an *empty* record, where `assigned_agent` and
  `assigned_group` are blank, so it denies. The AAP matrix specifies agent read/write as **"Assigned only"**,
  and the record-level probe confirms exactly that: on its assigned case
  `readable=true canWrite=true canDelete=false`; on an unassigned case **NOT READABLE — filtered out of the
  query entirely**; 9 of the 10 demo cases visible (the tenth is the Draft case with no `assigned_group`).
  Manager sees 10 of 10 with full write and delete; viewer sees 10 of 10 read-only.
- **The auto-execute trigger was built, measured, and REMOVED.** An earlier revision shipped a
  `sys_script_x_casemgmt_post_import_bootstrap.xml` artifact (deleted; no such file exists under
  `scripts/` any more) — an after-update Business Rule on
  `sys_remote_update_set`, `order=1000`, condition `current.state.changesTo('committed')`, authored
  global-scope and shipped `active=false`. It carried no logic of its own: it resolved the Fix Script
  `x_casemgmt Post-Import Remediation` **by name** and dispatched it with
  `new GlideScopedEvaluator().evaluateScript(fix, 'script', null)` inside a try/catch so it could never abort a
  commit. It is no longer part of the package, for two reasons. First, it could not succeed: the commit engine
  rewrites its scope to the application, where the remediation's privileged calls are refused (121
  SecurityExceptions, nothing created). Second — and this is why it was removed rather than left inactive — its
  condition gated on the state transition alone and **not** on the committed set belonging to `x_casemgmt`, so
  an activated copy would dispatch privileged, partly destructive remediation (table-metadata deletion and
  re-creation, ACL rewiring) on the commit of any unrelated Update Set. The remediation now carries a
  defensive `deactivateBootstrapTrigger()` that quiets a legacy copy only when its name, its `collection`
  (`sys_remote_update_set`) and its `sys_update_name`
  (`sys_script_x_casemgmt_post_import_bootstrap`) all match and exactly one row does; a same-named rule
  belonging to anything else is reported and left untouched. The Fix Script remains, folded into the Update
  Set as record **117 of 926**, after every record the remediation repairs, and is the package's ONLY
  global-scope record. (Earlier revisions of this line said "104 of 913"; the block count and the Fix Script's
  ordinal both moved as later passes added blocks ahead of it. 117 of 926 is the measured position in the
  shipping file.)

  It is shipped **`active=false`**. It was measured to fire and then fail with 121 `SecurityException`s (§9.4),
  and a rule that fires, logs a `SUMMARY|verified=false` line and changes nothing is worse than no rule at all:
  it invites an operator to believe the remediation ran. Shipping it inactive keeps the mechanism, its rationale
  and its dispatch wiring in the deliverable — auditable and one checkbox away from active — while making the
  required manual step unavoidable rather than optional. Its own header comment states this, states that it
  cannot succeed if activated, and points at the global background-script procedure. Fuller rationale, the
  rejected alternatives, and the exact verification signal are in §4.14 and §9.4.

---

## 3. Defect F — flow serialization defect *(root-caused, then remediated by native re-authoring)*

> This was the single most serious limitation in the delivered package: all seven Flow Designer flows shipped
> as non-functional "dead shells". It has been root-caused and remediated. The seven flows were **re-authored
> through Flow Designer itself** on the PDI, they execute at runtime, and the four forward-transition
> precondition guards now block invalid transitions on the case form with the verbatim messages. The
> subsections below give the confirmed root cause, the remediation strategies attempted **in order**, the
> runtime evidence, and the one platform behavior that shaped the design.

### 3.1 Confirmed root cause — four independent proofs

The generator wrote each flow as a single `sys_hub_flow` header with the compiled flow definition inlined
into a **reference-width field**, and emitted none of the relational graph a flow needs to run.

1. **Schema proof.** In `sys_dictionary`, `sys_hub_flow.latest_snapshot` and `sys_hub_flow.master_snapshot`
   are `string` with **`max_length = 32`** — they are meant to hold the sys_id of a `sys_hub_flow_snapshot`
   row. The generator placed roughly 10.6 KB of compiled flow JSON into them, and the platform truncated it
   at exactly 32 characters. The live value on every one of the seven flows was a JSON fragment such as
   `{\n    "name": "x_casemgmt_genera` (length 32). Related: the repo XML also emitted
   `master_snapshot_id`, which is **not a column on this release** — the real column is
   `master_snapshot_digest`.
2. **Server proof.** Flow Designer's own loader, `GET /api/now/processflow/flow/<sys_id>`, returned
   **HTTP 500** for all seven with:
   `java.lang.IllegalStateException: Expected BEGIN_ARRAY but was STRING at line 1 column 1 path $`
   — the deserializer expecting the graph array and finding a truncated string.
3. **Graph proof.** In scope `x_casemgmt` there were **0** rows in `sys_hub_trigger_instance`,
   `sys_hub_action_instance`, `sys_hub_flow_logic`, `sys_hub_flow_snapshot`, `sys_hub_flow_input`,
   `sys_hub_flow_output` **and 0 in `sys_hub_flow_component`**, and **0 `sys_flow_context` rows** for any of
   the seven flows — they had never executed. (Release note: on this release the runtime graph lives in
   `sys_hub_flow_component` / the `*_v2` instance tables; `sys_hub_action_instance` is legacy and nothing
   writes it any more, so checking only the legacy table is the wrong probe. The conclusion held either way.)
4. **UI proof.** Opening a flow in the builder rendered `Corrupted flow` with
   `This flow can't be opened. Select another history entry to view or restore.`, status `Inactive`, and both
   `Edit flow` and `Force save` **disabled**. `GET /api/now/processflow/versioning/<sys_id>` returned
   `{"data":[]}` — zero history entries, so the on-screen "restore" instruction was unfollowable. The seven
   records were **unrecoverable through the UI** and had to be re-authored.

**Why hand-writing the XML cannot fix this.** A flow is a relational graph spread across the flow record, a
published snapshot record, trigger/action/subflow/logic instances, input and output variable models, and
compiled execution plans, all cross-linked by sys_id. Emitting a mutually consistent set of those rows by
hand is not a realistic serialization strategy; re-injecting hand-authored graph XML was therefore ruled out
as a repair, and no part of the current package's flow graph is hand-written (see §3.5).

### 3.2 Remediation strategies attempted, in order

**Strategy 1 — native authoring. ATTEMPTED AND SUCCEEDED.** No fallback was needed, so no fallback error is
quoted here: the ladder stopped at the first strategy that produced verifiably executable flows.

1. **Proof of concept.** A throwaway subflow was created and published in Flow Designer in a real browser.
   The platform reported `Subflow published successfully` and produced a genuine `sys_hub_flow_snapshot`
   **record** plus real `sys_hub_flow_component` rows — confirming the platform, not the package, was healthy.
2. **The seven corrupt shells were deleted** (`DELETE /api/now/table/sys_hub_flow/<sys_id>` → HTTP 204 × 7),
   justified by proof 4 above: there was no UI or API repair path.
3. **A scoped Custom Action, `Case Transition Guard`, was authored in Action Designer** with declared inputs
   `case_sys_id` and `target_status` and outputs `blocked` and `error_message`. Its script step delegates to
   `new x_casemgmt.CaseTransitionValidator()`. The platform reported `Action is successfully published.`
4. **The five validation subflows were authored/published** — each one input, the guard action with a literal
   `target_status`, and an `Assign Subflow Outputs` step. The template subflow was verified in Flow Designer's
   own Test runner (`Test Run - Completed`, outputs `Blocked = true`, `Error Message = Case record is
   missing.`), proving the whole chain subflow input → action → Script Include → subflow outputs.
5. **The two parent flows were authored/published/activated** with an `Updated` record trigger on
   `x_casemgmt_case`, condition `type=General Inquiry^statusVALCHANGES` and `type=Complaint^statusVALCHANGES`,
   each calling all five subflows. The platform reported `Flow activated successfully`.

Everything above went through Flow Designer's own UI and its own authoring/publish APIs, so the **platform**
compiled the graph. Strategies 2 (ship a Custom Action for a human to wire in manually) and 3 (delete the
shells and rely on Business Rules alone) were therefore **not** required. The Custom Action still ships,
because it is the reusable step inside all five subflows — not because a manual wiring step remains.

### 3.3 The platform behavior that shaped the design

**A Flow Designer record trigger fires *after* the database write commits.** A flow on its own therefore
cannot refuse a transition or surface a form-level blocking error the way a `before` Business Rule can. This
is a platform behavior, not a defect, and it is the reason a natively authored flow alone would not satisfy
the requirement that invalid transitions produce a blocking error **on the form**.

The design consequence: a new before-update Business Rule,
`x_casemgmt_enforce_forward_transitions` (**order 250**), runs the matching validation subflow
**synchronously, in the foreground**, via
`sn_fd.FlowAPI.getRunner().subflow('x_casemgmt.<subflow>').inForeground().withInputs({case_sys_id: …}).run()`,
then re-evaluates the same gate against the **in-flight** `current` record through
`x_casemgmt.CaseTransitionValidator` and, on failure, calls `gs.addErrorMessage(<the validator's message>)`
plus `current.setAbortAction(true)`. It re-evaluates rather than trusting the subflow alone because a subflow
reads the **committed** row, which is stale when `assigned_group` or `assigned_agent` changes in the same
save; any divergence between the two verdicts is logged. If the subflow call throws, the rule falls **closed**
onto the validator's verdict rather than letting the save through.

**The honest consequence of that design, measured — for a same-save field-plus-status change the subflow's
verdict is advisory and is discarded.** Two of the six transitions have a field precondition
(`Draft → Open` needs `assigned_group`; `Open → In Progress` needs `assigned_agent`), and whenever the user
supplies that field in the *same* save as the status change, the subflow reads the row as it still exists in
the database — precondition field empty — and returns a **false BLOCKED**. The Script Include, reading
`current`, returns the correct ALLOWED and wins. So the flows demonstrably *execute* (which is what
distinguishes a live flow from a dead record), but on this path they do not *decide*: the Script Include is
the authoritative gate.

Measured on the live instance, with the divergence written to `syslog` by the rule itself. `CASE0001080`,
where both preconditions were supplied in-save, produced two entries — verbatim, one of them:

```text
x_casemgmt_enforce_forward_transitions: subflow x_casemgmt.validate_in_progress_transition reported
blocked=true while the in-flight evaluation reported blocked=false for case
c42ce4ea93a20f10830ef82bdd03d60f (Open -> In Progress). The in-flight evaluation decides because it
reflects the row as it will be saved.
```

and the same sentence naming `x_casemgmt.validate_open_transition` for its `Draft -> Open`. Both saves
returned **HTTP 200** and persisted, which is the correct outcome. The control that pins the mechanism:
`CASE0001081` made the identical `Open → In Progress` change with `assigned_agent` written in a **prior**
save, and that transition logged **no divergence at all** — the subflow read a committed row that already
had the agent, agreed with the validator, and both said ALLOWED. So divergence tracks exactly one variable,
whether the precondition field is written in the same transaction, and never the transition itself.
Corroborating that the flow layer is genuinely running and not merely bypassed: `sys_flow_context` carries
`COMPLETE` rows for the subflows with `source_table = sys_script` (the synchronous Business-Rule
invocations) alongside the parent-flow context with `source_table = x_casemgmt_case`.

This is disclosed rather than repaired because there is nothing to repair without breaking the AAP's own
requirement. A before-update rule is the only layer that can abort a save and surface a form-level error
(§0.7.1), a Flow Designer record trigger fires only *after* the write commits, and no platform API lets a
subflow read the in-flight `current`. Trusting the subflow instead would reject legal transitions —
setting the agent and the status together in one save is the natural gesture on the form and would fail.
The divergence is logged rather than suppressed so that an operator reading `syslog` sees the two verdicts
and which one applied. Directive overrides **C1** (Business-Rule enforcement approved in place of flow-only
enforcement) and **C8** (a before-update rule invoking a subflow synchronously is approved) cover this
arrangement explicitly.

The Business Rule does **not** hardcode any message — it passes `verdict.error` through, so
`CaseTransitionValidator` remains the single source of truth shared with the six UI Actions.

Order 250 sits after the two prohibition guards (100 `block_terminal_closed`, 200
`block_draft_backtransition`) and before the side-effect rules (300 agent-membership, 400 clear
`pending_reason`, 500 stamp `closed_date`), so the existing chain is unchanged.

### 3.4 Runtime verification — what was actually observed

"Flow is Active" and "records exist" are not verification. Each of the four transition assertions was driven
**on the live case form** — by editing the Status field and clicking the stock `Update` button, not a custom
transition button — for **both** case types, giving 8 observations. Every message below was read from the
rendered DOM node `#output_messages .outputmsg_text` and checked character by character.

| # | Assertion | General Inquiry | Complaint | On-screen message |
|---|---|---|---|---|
| i | In&nbsp;Progress → Resolved with one **open** child task | BLOCKED | BLOCKED | `All tasks must be closed before resolving this case.` |
| ii | close the task, retry In&nbsp;Progress → Resolved | SUCCEEDS, status reads `Resolved` | SUCCEEDS, status reads `Resolved` | none |
| iii | Resolved → Closed as a **non-manager** (UI Impersonate) | BLOCKED | BLOCKED | `Only case managers can close cases.` |
| iv | In&nbsp;Progress → Draft | BLOCKED | BLOCKED | `Cases cannot be returned to Draft.` |

All 8 observations passed. Assertions i and ii form a controlled experiment: the same edit by the same user on
the same record was blocked while the child task was `Open` and allowed once it was `Closed`, so the
task-closure gate is the only variable.

**Flow execution evidence.** `sys_flow_context` rows in state `COMPLETE` exist for all seven flows: the five
subflows from the synchronous Business-Rule invocations, and **both parent flows** triggered from their
`Updated` record triggers with `source_table = x_casemgmt_case` (a parent context appears for each transition
that actually committed — blocked saves never commit, so they correctly produce none). Flow Designer's own
loader now returns **HTTP 200 with `errorCode 0`** for all seven, the exact endpoint that returned HTTP 500
for the dead shells.

**Three honest caveats about how the block appears on the form:**

1. **Every blocked save renders two banners** — the specific rule message *and* ServiceNow's stock
   `Invalid update`. This is normal `setAbortAction(true)` behavior and is what a user sees.
2. **The redisplayed form echoes the rejected value.** After an aborted save the classic form shows the
   `Status` value the user submitted. That is ServiceNow's own abort semantics for the classic form and is
   not something the application controls. It is phantom: a reload and a database read show the case
   unchanged. Only a reload or a REST read proves persistence — reading status from the post-save frame
   produces a false "allowed" result.

   **A second phantom, `Closed Date`, existed and has been fixed.** As first measured, a close denied to a
   non-manager also redisplayed a populated `Closed Date`, because `setAbortAction(true)` cancels the *write*
   but does **not** stop the rest of the before-update chain — the platform keeps running it and exposes the
   pending abort only through `current.isActionAborted()`. The order-500 rule therefore still stamped the
   in-memory record. All four rules that add a message or mutate a field after the guards — order 250
   `enforce_forward_transitions`, order 300 `validate_assigned_agent_membership`, order 400
   `clear_pending_reason_on_inprogress` and order 500 `set_closed_date` — now check
   `current.isActionAborted()` first and return. A rejected save consequently gets no `closed_date`, keeps its
   `pending_reason`, collects no second unrelated message, and does not pay the synchronous subflow execution.
   Only the `Status` echo in caveat 2 remains, because it is the platform's behavior rather than the
   application's.
3. **An aborted save returns HTTP 302, exactly like a successful one**, so HTTP status cannot be used to
   detect a block. The reliable in-page signal is `#output_messages` losing its `outputmsg_hide` class.

Saves that reach order 250 take roughly 8–10 seconds to settle, because that rule executes a Flow Designer
subflow synchronously. A transition already rejected at order 100 or 200 no longer pays that cost: measured
server-side, `Closed → In Progress` now aborts in **35 ms** and `In Progress → Draft` in **4 ms**, and
`sys_flow_context` shows no subflow dispatch for either, whereas the transitions that do reach the guard
(`Pending → In Progress`, `Resolved → Closed`) still produce their `source_table = sys_script` subflow
contexts.

### 3.5 What is in the package now

The seven flow artifacts under `../flows/` were replaced with the platform's **own** serialization of the
re-authored records — taken from `sys_update_xml.payload` on the instance, with only whitespace indentation
applied (verified element-for-element: every tag, attribute and field value byte-identical, CDATA preserved).
No graph element is hand-written. Two records were added:

- `../flows/custom_actions/x_casemgmt_transition_guard_action.xml` — the `Case Transition Guard` action.
- `../flows/sub_flows/shared_flow_logic_block.xml` — the one `sys_hub_flow_block` shared by all five
  subflows' flow-logic instances. Flow Designer's per-flow capture omits a block shared across flows, so it is
  packaged explicitly; without it the subflows would import carrying a reference that resolves to nothing.

Plus the new Business Rule `../business_rules/x_casemgmt_enforce_forward_transitions.xml`. All three are
folded into the Update Set in dependency order: Script Includes → **Action Type** → **Flow Block** → the five
subflows → the two parent flows → Business Rules (record count 148 → 151).

**No non-functional flow record remains** in `servicenow-case-management-poc/` or in the Update Set: every
Flow and Action Type record in the package carries a real snapshot and its graph elements.

Because the flows were re-authored, their internal names changed — they no longer carry an `x_casemgmt_`
prefix. The current names are `general_inquiry_state_machine`, `complaint_state_machine`,
`validate_open_transition`, `validate_in_progress_transition`, `validate_pending_transition`,
`validate_resolved_transition`, `validate_closed_transition`. These are the names the order-250 Business Rule
dispatches on.

### 3.6 Code-generation fix for the next pass

Do not serialize a flow by hand. Author it in Flow Designer (or drive Flow Designer's own authoring and
publish APIs) and then capture the result, so the platform emits the snapshot record, the trigger / action /
subflow / logic instances, the input and output variable models, and the compiled execution plans as a
mutually consistent set. In particular, never write compiled flow JSON into `latest_snapshot` or
`master_snapshot`: those fields are 32 characters wide and hold the sys_id of a real
`sys_hub_flow_snapshot` row. When capturing a flow that shares a `sys_hub_flow_block` with sibling flows,
include that block record explicitly.

**Which fields are durable, and which the platform owns.** When checking a flow's health, assert on
`active`, `status = published`, a `master_snapshot` that resolves to a real `sys_hub_flow_snapshot` row, and a
non-empty graph from `GET /api/now/processflow/flow/<sys_id>`. Do **not** assert that
`latest_snapshot == master_snapshot`, and do not treat a `latest_snapshot` that resolves to nothing as
corruption: the platform rewrites that field with transient working-snapshot ids and garbage-collects the
rows, so it drifts on its own within minutes and is not a reliable indicator. The same applies to
`version_record` and to the `snapshot` field on `sys_flow_trigger_plan` / `sys_flow_subflow_plan` /
`sys_hub_action_plan` — all four are platform-managed bookkeeping, all four are plain strings rather than
reference fields, and the platform recompiles the plan records itself. Execution uses `master_snapshot`.
Note that the platform's own Update Set export normalises `latest_snapshot` to the published master, which is
the correct portable form; a captured payload will therefore differ from the live row on that one field, and
that difference is expected rather than drift to be chased.

---

## 4. ServiceNow PDI platform limitations encountered (not deliverable defects)

These are inherent platform behaviors that shaped the deployment and testing approach. They are documented
so future operators don't mistake them for bugs.

1. **Commit ≠ DDL for new tables.** The Update Set apply engine (`GlideUpdateManager2`) applies every captured
   payload with the target record's **business rules suppressed**. The physical DDL for a brand-new table is
   emitted by the after-insert Business Rule **`Synch Dictionary and Table` (order 500) on `sys_db_object`**,
   so committing the metadata is necessary but not sufficient. Confirmed suppressed alongside it:
   **`Create Default Number Maintenance Field` (order 1000)** — which is why Defect E has the same root cause —
   plus `Create Default Module` and `Create or update access controls`. Consequences, each measured:
   no payload or ordering change can produce the DDL (verified through the engine's own `loadXML` path);
   shipping the `sys_dictionary` collection row does **not** substitute for the rule; and a data payload
   applied to a table that has metadata but no physical storage returns without throwing and inserts nothing.
   A `GlideRecord` build with workflow **ON**, from a **global** script, is the reliable way to materialize
   brand-new scoped tables — which is what `scripts/post_import_remediation.js` does. (See Defect C, §4.14.)
2. **Cross-scope data barrier — narrowed deliberately in the final package.** *Historically* a `global`
   background script could neither create nor read scoped `x_casemgmt_*` data, because all five cross-scope
   access columns on the three tables were false; the guidance then was "run in scope". The **final access
   policy is different and is what ships**: `read_access = true` and `ws_access = true` on all three tables,
   with `create_access`, `delete_access` and `configuration_access` left **false**. So reads (including the
   Table API) are open to other scopes and to the platform's own resolvers, while writes and schema changes
   stay private to `x_casemgmt`. Verified on the instance: all three tables report
   `read_access=true, ws_access=true, create_access=false, delete_access=false, configuration_access=false`,
   matching the three `tables/*.xml` artifacts exactly. Writes from a global script still require running in
   scope. (See Defect D for the original diagnosis.)
3. **`GlideImpersonate` is blocked in scoped scripts** (`SecurityException`). Impersonation-based ACL tests
   must run in a **global** script. Conveniently, `GlideRecordSecure.canCreate/canRead/canWrite/canDelete`
   evaluate ACLs correctly from global even though *data* reads are blocked — this is how the ACL matrix was
   validated.
4. **`ws_access` — historically false, now true.** *Historically* `ws_access = false` on the scoped tables
   blocked the Table API outright. In the final package `ws_access = true`, so
   `GET /api/now/table/x_casemgmt_case` resolves for an authenticated caller with the right ACLs; it is still
   not the *intended* path (internal users use the native list/form UI, external users the scripted REST portal
   endpoints), and an **anonymous** Table API call is still refused — by authentication and ACL evaluation, not
   by `ws_access`. Demo users remain untestable through it for the separate reason in item 5.
5. **Demo users have no known passwords** and lack the script-execution role, so per-user runtime tests
   cannot be driven by logging in as them; use **UI Impersonate** (works in the UI) — see the workflow
   tryout guide.
6. **Auto-numbering on scoped tables requires the `global.` qualifier.** The number field's dictionary
   `default_value` must read `javascript:global.getNextObjNumberPadded();` — `getNextObjNumberPadded()` lives
   in the global scope and a scoped table's default-value evaluation will not resolve the bare call. Separately,
   the zero-padding lives in **`sys_number.maximum_digits`**; `number_of_digits` and `maximum` are **not
   columns** on `sys_number` (its writable columns are exactly `category`, `prefix`, `number`,
   `maximum_digits`) and any such element in an imported payload is **silently discarded** — no error, just a
   counter with no padding. `category` is a reference to `sys_db_object` that stores the table name, so it is
   resolvable by name. (See Defect E.)
7. **`gs.nowDateTime()` is scope-fenced**; use `new GlideDateTime()`. (See Defect 6.)
8. **`gs.print()` is forbidden in scoped scripts** — use `gs.info()`/`gs.warn()` and read back from `syslog`.
   In global scripts, `gs.print()` output appears as `*** Script:` lines.
9. **`gs.getSession().isImpersonating()` is a security-restricted member** — inaccessible from the background
   script runner.
10. **`case` is a JavaScript reserved word** — use `gr.getValue('case')` and quote it as a property key
    (`{'case': sysId}`) in the Rhino engine.
11. **`sys.scripts.do` needs an interactive form-login UI session** (Basic auth authenticates REST only).
    The login POST requires `sys_action=sysverb_login`. (See deployment guide §3.)
12. **High-security ACL evaluation:** an ACL with no role + no condition + no script evaluates to **deny**
    ("Deny access for empty term"), not allow. This is why Defect 9 made the app unusable rather than
    wide-open. Implication: scoped apps must ship explicit `sys_security_acl_role` links.
13. **`GlideStringUtil.base64Decode` is not static** — use `gs.base64Decode()`.
14. **Fix Scripts do not auto-run on Update Set commit** — the platform only runs them on application install
    from a repository or the Store, and a Fix Script certainly cannot be triggered by the commit of the very
    Update Set that contains it. Because Defects C and 9 provably cannot be delivered as records (§2), the
    package needs a trigger that genuinely fires. Three candidates were built and measured:

    | Candidate | Survives import? | Fires with no human? | Verdict |
    |---|---|---|---|
    | **Global after-update Business Rule on `sys_remote_update_set`, condition `current.state.changesTo('committed')`** | ✅ the `sys_script` payload is applied by the engine with `collection`/`when`/`condition`/`order`/`active`/`script` intact | ✅ fires on the state write — but on the real commit path the engine rewrites its scope first, so the privileged calls it needs are refused | **ADOPTED, THEN REMOVED** — see the status note below |
    | `sysauto_script` Scheduled Script Execution shipped in the package | record imports, but `sys_trigger` rows = **0** — the `sysauto` after-insert rule that creates the schedule entry is itself suppressed | ❌ | rejected |
    | First-touch guard inside the app's own scope | ✅ | ❌ only on a human touch — and a scoped context cannot write any of the four targets (`GlideTableDescriptor is not allowed in scoped applications`; `sys_dictionary.update()` returns null) | rejected |

    Design details that came from measurement rather than preference: **global** scope is used because every
    target table (`sys_db_object`, `sys_dictionary`, `sys_choice`, `sys_number`, `sys_ws_definition`,
    `sys_security_acl_role`) is global with cross-scope create/update denied — it is the narrowest scope that
    works. **`when=after`** is used rather than `async` because for a single qualifying transition the platform
    dispatched the async variant **twice**, milliseconds apart, and two concurrent passes would race on the
    destructive half of the table rebuild; `after` was measured firing exactly once. The condition tests the
    state **transition**, not the value, because the platform writes to an already-committed retrieved Update
    Set more than once. The rule **deactivates itself** once the application verifies as fully wired, so it is a
    one-shot bootstrap and not a permanent hook — and a failed or partial run deliberately leaves it active so
    the next commit retries.

    > **⚠️ STATUS: the rule is NOT in the package. It was removed.** Everything above describes its design and
    > is accurate as design. It does not describe what happens on a real install, because on the real
    > upload → preview → commit path the rule **cannot succeed** (§9.4): the commit engine rewrites its scope to
    > the application and the privileged calls are refused. Since the self-deactivation only happens on
    > `verified=true`, a failing run left the rule **active**, retrying and re-logging `verified=false` on every
    > subsequent commit — which invites an operator to believe the remediation ran. An intermediate revision
    > shipped it `active=false` for that reason; the current package **does not ship it at all**, because its
    > condition matched the commit of *any* retrieved Update Set and activating it would have dispatched
    > privileged, partly destructive remediation on unrelated deployments (§0.7, §9.4). The required procedure is
    > the manual one in §9.5. The paragraphs below record what was measured, and distinguish the synthetic
    > exercise from the real commit path; they are retained as the security rationale for the removal, not as a
    > description of what installs.

    **What was verified, and what remains for the clean-instance round trip.** The trigger was exercised
    directly: a synthetic `sys_remote_update_set` row was driven through `loaded → committed`, and the rule
    fired once, dispatched the Fix Script, and produced exactly one `BOOTSTRAP|fired` line, one
    `SUMMARY|verified=true|…|errors=0` line and one `TRIGGER|…|deactivated` line, after which the rule read
    `active=false`. Applying the shipped Business Rule payload through the engine's own `loadXML` also
    re-armed it from `active=false` back to `active=true`, which matters because both trigger records are
    **global** scope and therefore survive a teardown of the `x_casemgmt` scope — a re-import re-arms the
    one-shot by itself. What that exercise does **not** substitute for is a real
    upload → preview → commit on a clean instance; confirming the rule fires on that path is the
    clean-instance round trip's job, using the signal below.

    **Verification signal — and which path it applies to.** Every line the remediation emits is a `gs.info()`
    prefixed `X_CASEMGMT_REMEDIATION|`. Read them with
    `GET /api/now/table/syslog?sysparm_query=messageSTARTSWITHX_CASEMGMT_REMEDIATION^ORDERBYDESCsys_created_on`
    (or *System Logs → All*, message starts with `X_CASEMGMT_REMEDIATION`).

    The expectation below was measured in the **synthetic exercise** described above — a hand-driven
    `sys_remote_update_set` transition, where the rule genuinely ran in `rhino.global`. **It is not what a real
    commit produces.** On the real path the scope is rewritten and the run reports
    `scope_context=x_casemgmt|…|verified=false|…|errors=121` (§9.4); and because the package no longer ships
    that rule at all, a real commit of the current package emits **no marker lines at all**. Read the
    expectation below as the signal to look for **after running the remediation manually from
    *Scripts - Background* with "In scope" = Global** (§9.5 steps 1-3), which is the only route that produces
    it: one `…|LEASE|acquired|x_casemgmt_post_import_remediation|acquired <timestamp> on node <node>`, one
    `…|SUMMARY|verified=true|…|errors=0`, one `…|LEASE|released|x_casemgmt_post_import_remediation`, and — only
    on an instance carrying a legacy copy of the removed trigger — one
    `…|TRIGGER|x_casemgmt Post-Import Bootstrap|legacy copy <sys_id> deactivated after successful remediation`
    (a clean instance reports `not installed - the package no longer ships it`). On a genuinely clean
    instance the summary should read `tables_built=3` and `acl_links_created=27`, because those counters
    increment only when the script actually creates something; on a re-run it reads `tables_already=3` and
    `acl_links_already=27`. (Both halves have been observed separately: `created` counters incrementing when
    the objects were genuinely missing, and the `already` form on repeat runs. The exact clean-install figures
    are what the clean-instance round trip should confirm.) The created-vs-already counters are how a real
    first install is told apart from a repeat. Corroborating checks that need no log reading: no Business Rule named
    `x_casemgmt Post-Import Bootstrap` exists on a clean install (and a legacy one reads `active=false` after a
    converged run); `sys_security_acl_role` filtered to `sys_scope.scope=x_casemgmt` returns **27** rows; and
    `GET /api/now/table/x_casemgmt_case_task?sysparm_limit=1` answers **HTTP 200**, because `ws_access` and
    `read_access` are open (an earlier revision of this note said 403 — that was the boolean-versus-string
    packaging defect, since fixed; see §9.6 **E9**). Cross-scope *writes* are refused by design, so verify or
    repair DATA from inside the application scope.

    Idempotency was proved by running the shipped Fix Script twice back-to-back: both runs reported
    `verified=true`, `errors=0`, and every counter at `created=0` / `already=<expected>`.

15. **An invalid choice value sent through the REST Table API is answered `HTTP 200` and silently dropped —
    the API client is never told its field was rejected.** All five choice fields in the application
    (`case.status`, `case.priority`, `case.type`, `case_task.status`, `case_party.party_type`) are
    `internal_type=string` with **`choice = 3`** ("dropdown without --None--"), which means the platform
    validates the submitted value against `sys_choice` and discards anything unrecognised **before** any
    Business Rule sees the record. Measured on `CASE0001078`, a Draft case, one PATCH per row:

    | Sent | HTTP | Stored afterwards | `sys_mod_count` | Error body |
    |---|---|---|---|---|
    | `status = "Bogus Status"` | **200** | `status` still `Draft` | **0** | none |
    | `status = "Approved"` (a real ArkCase status, not one of ours) | **200** | `status` still `Draft` | **0** | none |
    | `priority = "Catastrophic"` | **200** | `priority` still `Medium` | **0** | none |
    | `type = "Freedom Of Information"` | **200** | `type` still `General Inquiry` | **0** | none |
    | `case_task.status = "Cancelled"` | **200** | `status` still `Open` | **0** | none |
    | *control:* `priority = "High"` | 200 | `priority` = **`High`** | **1** | none |

    The control row is what makes this a measurement rather than an assumption: the same PATCH shape with a
    *valid* value writes and increments `sys_mod_count`, so the write path is working and only the value was
    dropped. **Why no blocking message appears:** the order-250 rule refuses an unrecognised status with
    *That is not a valid case status…* — but it never runs, because by the time it evaluates,
    `previous.status === current.status` and the rule early-returns on an unchanged status (its line 18).
    So the two layers guard different paths, and the register records only what was measured: the dictionary
    filters the REST Table API early and quietly, and the rule's fail-closed allowlist is what would catch a
    value that reaches it — a stale choice left behind by a de-activated or renamed `sys_choice` row, or any
    write path that does not run choice validation. The comment block in the rule was corrected in this pass:
    it previously named the Table API as a path that "can set `status` to anything at all", which this
    measurement disproves. **Consequence for an integrator:** no corrupt data can enter the tables this
    way, but a client that PATCHes a typo receives `200` and must re-read the record to discover its change
    was ignored. Nothing in the application can change this — a before-rule cannot see a value the dictionary
    already removed. An API contract that needs hard rejection would have to validate against `sys_choice`
    in a Scripted REST wrapper rather than use the Table API directly, which is outside the AAP's scope
    (§0.1.1 states the target exposes the platform's auto-generated Table API and honours no legacy
    API contract).

16. **A write refused by an ACL is refused *silently* on the classic form, and explicitly only on the Table
    API.** Measured under real UI Impersonation as `x_casemgmt_demo_viewer` (`window.NOW.user` read back in
    the page: `name = x_casemgmt_demo_viewer`, `userID = 912ca3946a0f74c22d5b7c2e7e143771`,
    `roles = allRoles = "x_casemgmt_case_viewer"`, `isImpersonating = true`) against `CASE0001082` — a
    fixture staged at `status = Open` with `assigned_group` populated and `assigned_agent` already set to a
    member of that group, so `Open → In Progress` is a **legal** edge whose only precondition is already
    satisfied and the state machine would allow it. Any refusal is therefore attributable to access control
    alone, and no workflow message appeared at any point.

    | | Classic form (`/x_casemgmt_case.do`) | Table API (`PATCH /api/now/table/x_casemgmt_case/<sys_id>`) |
    |---|---|---|
    | HTTP status | **302** — byte-for-byte what a *successful* save returns | **403** |
    | Response body | empty (`content-length: 0`) | `{"error":{"message":"Operation Failed","detail":"ACL Exception Update Failed due to security constraints"},"status":"failure"}` |
    | Reason shown on screen | **none** | none — the text exists only in the JSON |
    | `#output_messages` class | `outputmsg_container outputmsg_hide` — the `outputmsg_hide` class is **retained** | n/a |
    | `.outputmsg_text` nodes | **0** | n/a |
    | `data-server-messages` | `"false"` | n/a |

    Render-time denial is thorough and is where the platform does its real work:
    `g_form.getEditableFields()` returns **`[]`**, all 14 fields report `isReadOnly() === true`,
    `.form_action_button` count is **0**, `#sysverb_update` **does not exist**, and every field's hidden value
    carrier is stamped by the server with **`writeaccess="false"`** (the visible control is the
    `sys_readonly.x_casemgmt_case.<field>` variant, `readonly="readonly"`, `aria-readonly="true"`).
    But the client API itself offers no resistance: `g_form.setValue('status','In Progress')` on a field
    `g_form` simultaneously reports as read-only **succeeds**, updates the hidden carrier and repaints the
    grey display control, with zero warning. Forcing the submit the missing button would have issued
    (`gsftSubmit(null, g_form.getFormElement(), 'sysverb_update')`) put the mutation on the wire —
    the POST body carried `sys_action=sysverb_update` and
    `sys_original.x_casemgmt_case.status=Open&x_casemgmt_case.status=In+Progress` — and the server discarded
    it without a word. The complete rendered `body.innerText` afterwards is **407 characters** and contains
    no error, warning, denial or the phrase "read only" anywhere; a genuine full-navigation reload and an
    independent admin-side read both show `status = Open` with `sys_mod_count` unchanged at `2`.
    A read control in the same session, same token, same record answers **`HTTP 200`** and returns all 21
    fields, so the split is exactly read-allowed / write-denied.

    **This is platform UX, not an application defect** — the application authors no message here because no
    application code runs: the ACL layer stops the write before any Business Rule evaluates, which is also
    why the AAP §0.7.1 "surface all blocking errors on the form" requirement is satisfied by the workflow
    layer (every transition refusal renders a red banner) and not by this one. Worth recording for whoever
    owns the RBAC experience: the platform **does** own a first-class denial pattern and used it elsewhere in
    the very same impersonated session — the viewer's Home page printed *"Access Restricted — You do not have
    the required permissions to view this content. Access is restricted by the report_view ACL. Please
    contact your administrator for assistance"* four times — it simply is not wired to a record-form write
    refusal. Two practical consequences: an operator diagnosing "my save did nothing" must use the Table API
    or the browser network log to obtain a reason, and **`HTTP 302` from the classic form means nothing about
    whether a save was accepted** (the same caveat as §3.4 caveat 3, arrived at from the ACL side).

17. **A form's related-list set is cached server-side, and importing the definition does not invalidate it.**
    Measured while authoring the AAP §0.4.4 related lists (§0.6.2). On an instance that had already rendered
    `x_casemgmt_case.do`, creating the `sys_ui_related_list` and its two `sys_ui_related_list_entry` rows left the
    form unchanged: `#related_lists_wrapper` still measured **0 px** with class `tabs_disabled`, its innerHTML
    still held nothing but the `related_lists.ready` script, and **no related-list request was issued at all** —
    the server was not emitting the payload, so this is not a client-side rendering problem. Three things make it
    a genuine trap rather than an ordinary cache:

    - **The configuration UI reports success.** *Configure ▸ Related Lists* showed both lists in the **Selected**
      column, correctly labelled *Case Task->Case* and *Case Party->Case*, while the form rendered none of them.
    - **A REST `PUT` of the same values does not clear it.** The write is a **no-op** — `sys_updated_on` stays
      equal to `sys_created_on`, nothing is dirtied and no business rule fires — so it cannot invalidate anything.
      A field-by-field diff of the scoped definition against `incident`'s working one found no meaningful
      difference, which is what proved the configuration was never the problem.
    - **`glide.ui.defer_related_lists` was already `false`**, so deferred loading was not the explanation either.

    **The remedy is one UI operation:** open *Configure ▸ Related Lists* on the form and press **Save** with
    nothing moved. That processor **deletes and reinserts** the rows through the path that invalidates the cache,
    and the lists appear on the next load — corroborated by the server additionally emitting
    `js_includes_listv2_doctype.jsx`, which is absent from the broken load. `/cache.do` is the heavier
    alternative and was deliberately not used on this shared instance. **One consequence to plan for: the
    delete-and-reinsert replaces all three `sys_id`s**, so any artifact pinned to the pre-Save ids must be
    re-pinned afterwards. `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` records this in its own
    header and is pinned to the platform-minted ids; `deployment.md` step 12 is the operator-facing procedure.

18. **Report and dashboard visibility is a chain of four independent gates, and three of them are invisible from
    the artifact.** Measured while making the eight reports and two dashboards reachable by the demo personas.
    Any one of the four denies on its own, and the platform's message names none of them:

    1. **`sys_report.user` must hold the literal `GLOBAL`.** The read ACL is a script whose role-checking branch
       executes only on the `isGlobal` path. A report with `roles` correctly populated but `user` empty is a
       *private* report and is refused to everyone except its owner — which is exactly how all 8 shipped.
    2. **`sys_report.roles`** then narrows which roles may read it. It holds comma-separated role **names**.
    3. **`pa_dashboards_permissions`** is the dashboard **share list** — one row per grantee, `type` `1` = Role,
       `2` = Group, `3` = User, with `read` / `write` / `delete` booleans. It extends `sys_metadata`, so each row
       is its own update record and travels in the update set.
    4. **`pa_dashboards.restrict_to_roles`** is the gate the renderer actually quotes when it refuses. Note the
       trap in the sibling column: `pa_dashboards.roles` is labelled *"Requires Roles"* and only **narrows** — it
       does not grant, so populating it alone changes nothing.

    A fifth mechanism is worth naming because it is the obvious suspect and is **innocent** here: **`report_view`
    ACLs are named after the *reported table*, not the report.** None exists for the three scoped tables, so the
    platform falls back to `read`, which the scoped ACLs grant. That was confirmed as a true negative rather than
    an absent check by driving the identical personas at four out-of-box `task`-table widgets in the same session,
    where the *"Access is restricted by the report_view ACL"* message **does** appear.

19. **A reference field whose target table the caller cannot read renders empty, with no error anywhere.**
    `x_casemgmt_case_party.organization` points at `core_company`, an out-of-box global table. For the three demo
    personas `GET /api/now/table/core_company` answers **403**, and the platform's response is not an error on the
    party record but the **silent removal of the column from the payload** — the form field, the list column and
    the API response all read empty while `admin` sees the real value (`PARTY0000160` → *Synthetic Org Alpha*). The
    scoped side is entirely correct, so there is nothing to fix inside this application: the grant would have to be
    made on `core_company` itself, which AAP §0.3.2 forbids. Disclosed as **ADV-1** in §0.9. The diagnostic lesson
    generalises — when a reference column is blank for one user and populated for another, check the *target*
    table's read access before looking at the field.

---

## 5. Intentionally NOT done (per AAP scope / Refine-PR constraints)

- **No ArkCase code changed** — the ArkCase Java/Maven tree was used only as read-only semantic reference, and
  nothing outside `servicenow-case-management-poc/` was modified, renamed or deleted. What was authored is
  confined to directive-approved `x_casemgmt` artifacts: the seven natively re-authored Flow Designer flows plus
  the `Case Transition Guard` Custom Action and the shared flow logic block (Defect F, §3), the order-250
  `x_casemgmt_enforce_forward_transitions` Business Rule, the post-import remediation script and its Fix Script
  wrapper, the 21 ATF artifacts, and the transition-logic regression harness. An earlier revision of this
  section claimed "no new application code generated"; that was true of the generation pass and is **false** of
  the deliverable as it stands, so it has been withdrawn.
- **Email notifications:** not configured (disabled on the PDI per constraint; no SMTP/notification rules/
  templates attempted).
- **No global-scope writes** beyond what the platform itself owns: the 3 roles, the ACL role-links, and the
  demo `sys_user`/`sys_user_group`/`sys_user_has_role` records are the only records touching base tables, and
  they are the records the deliverable itself defines.
- **No data migrated** from ArkCase — all demo data is synthetic.
- **No ServiceNow Store apps** installed; only the platform's standard low-code tooling was used.
- **Flow graph reconstruction is done, not deferred** (Defect F, §3) — the seven flows were re-authored
  natively in Flow Designer, they execute at runtime, and no dead flow record remains in the package. What
  is deliberately **not** done is repairing a flow by hand-writing its graph XML into the Update Set: that
  is the strategy that produced the dead shells, and it is not used anywhere in the current package.
- **Instance test-harness settings were changed but deliberately NOT captured** into the Update Set:
  `sn_atf.runner.enabled = true` so the ATF suite can run (§8.2). These are instance configuration, not
  application artifacts, and capturing them would be a global write. They are listed as prerequisites in
  §9.5 instead. A short-lived attempt to give the three demo personas passwords, so record-level ACL
  narrowing could be measured by real login, was **reverted** — authentication fails on this release even
  after a successful write, and the seed artifacts document admin **UI Impersonation** as the intended
  mechanism, which is what was used.
- **Missing artefacts that the Refine-PR pass was scoped away from authoring — both since authored.** Recorded
  so the history reads correctly rather than as an oversight: the Service Portal **layout** records (§9.6 E8-P)
  and the AAP §0.4.4 **related lists** (§9.6 E8) were both absent when that pass ran, which was bounded to
  Defect F, Defects C/E/7/9, the ATF suite and the acceptance proof, and explicitly barred from authoring new
  portal artifacts or new application logic. Both were subsequently built: the 8 `sp_container` / `sp_row` /
  `sp_column` / `sp_instance` rows in the pass recorded in §0.3b, and the `sys_ui_related_list` + 2 entry rows in
  the QA-findings pass of §0.3c. Neither is an open gap; §10.1 item 3 and §10.2 item 6 are marked **DONE**.
- **The all-tasks-closed rule is a gate on one transition, not a standing invariant — so a case can end up
  `Closed` with open child work.** AAP §0.5.5 row 5 places the requirement precisely: *In Progress → Resolved,
  required condition "All linked `x_[scope]_case_task` records have status = Closed"*. Row 6, `Resolved → Closed`,
  requires only *"Caller has `x_[scope]_case_manager` role"*. The implementation matches the matrix exactly, so
  nothing re-checks task state once a case has passed the Resolved edge, and no rule reacts to a child task
  changing after that point. Measured end to end on `CASE0001079`:

  | Step | Action | Result |
  |---|---|---|
  | 1 | `In Progress → Resolved` with one **open** child task (`TASK0000306`) | **HTTP 403** — the gate fires, as designed |
  | 2 | close `TASK0000306`, retry `In Progress → Resolved` | HTTP 200 — the controlled experiment: task state was the only variable |
  | 3 | insert a **new** `Open` task (`TASK0000307`) on the now-**Resolved** case | HTTP **201**; the case is byte-unchanged (`status Resolved`, `sys_mod_count` still `3`) — **no retro-enforcement** |
  | 4 | **reopen** the already-closed `TASK0000306` (`Closed → Open`) on the Resolved case | HTTP 200; the case is again unchanged |
  | 5 | `Resolved → Closed` with **two** open child tasks | HTTP **200** — the case closes, `closed_date` stamped, and both tasks remain `Open` afterwards |

  This is **not an AAP violation** — adding a second task check on the `Resolved → Closed` edge, or a
  child-table rule that pushes a Resolved case back to In Progress, would be application logic the AAP does not
  specify, and the Minimal-Change Clause (§0.7.2) forbids adding workflow beyond the defined scope. It is
  disclosed because the practical effect is not obvious from reading the matrix: *"all tasks must be closed
  before resolving"* protects the moment of resolution, not the closed state, and the route to
  Closed-with-open-work is a legal two-step sequence rather than an exploit. Anyone who wants the stronger
  invariant should ask for it as a requirement change — the natural shape being the same
  `x_casemgmt.CaseTransitionValidator.canTransitionToResolved()` check re-used on the `Resolved → Closed`
  edge, plus an after-insert/after-update rule on `x_casemgmt_case_task`.

---

## 6. Validation-gate status (AAP §0.7.3) — honest assessment

| Gate | Criterion | Status | Notes |
|---|---|---|---|
| 1. Data model | 3 tables, correct fields/types | ⚠️ **PASS only after remediation** | Measured on a clean install: the commit yields `sys_db_object` metadata with **no physical storage** (REST 403; 0 `sys_choice` rows for all 7 choice lists, because the Choice-List updates load but cannot persist against storage-less tables) and an insert fails with `GlideRecord.setValue() - invalid table name: x_casemgmt_case`. After the manual remediation of §9.5 all three tables are physical (21/14/13 columns), 24 choice rows exist, and all 7 choice lists render with the exact option labels. UI-verified: the three list views render as real data grids (`1 to 13 of 13`, `1 to 10 of 10`, `1 to 8 of 8`) with zero banners and zero console errors; `number` is read-only in format `CASE0000448`. |
| 2. Workflow | All transitions enforced for both case types | ✅ **PASS** | Prohibited transitions (Any→Draft, Closed→*), side-effects and agent-membership are enforced by Business Rules; the **four forward precondition guards, including the task-closure-blocks-Resolve gate, are now enforced at runtime and block on the form** after the seven flows were re-authored natively and wired into the order-250 before-update Business Rule (Defect F, §3). Verified by 8 live form observations — 4 assertions × 2 case types — with the verbatim messages read from the rendered DOM, and `sys_flow_context` rows in state `COMPLETE` for all 7 flows. |
| 3. ACLs | Role-based access enforced | ⚠️ **PASS on all three tables after remediation** (was: FAIL on the child tables — now fixed, see §9.6 E-ATF) | A clean commit gives 26 ACLs and **0 of 27** role links (every ACL with no role, no condition and no script evaluates to *deny*, which makes the app unusable); after the manual remediation the link count is **27**. Parent-table matrix then verified empirically by impersonation: manager 14/14 rows with Update+Delete+New; agent **9/14** with Update+New and **no Delete**; viewer 14/14 fully read-only with no Update/Delete/New. Both halves of "Assigned only" proven — the `assigned_agent` branch and the `isMemberOf(assigned_group)` branch — plus record-level denial by direct URL and the two field-level ACLs. The agent's `x_casemgmt_case_task` / `x_casemgmt_case_party` read+write conditions previously **could not compile** (`current.case`; `case` is a JS reserved word ⇒ `missing name after . operator`) and therefore denied every row — caught by ATF 07. **That is now fixed** (`current.getElement('case')`): the impersonated agent sees 10 task rows and 8 party rows with `canWrite=true` and `canDelete=false`, and `ATF 07` passes with 58 checks across five parent fixtures. See §9.6 E-ATF. |
| 4. Portal — submission | Unauthenticated submit creates a Draft case with a number | ✅ **PASS — REST contract and portal page** | Anonymous, no credentials (`window.NOW.user_display_name === "Guest"`, every response carrying `x-is-logged-in: false`): the page renders a single `<form>` with the five required controls — `subject`, `type` (choice: General Inquiry / Complaint), `description`, `requester_name`, `requester_email` — a Submit button that stays disabled while the form is invalid, and on submit `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE…","message":"Your case has been submitted"}` with the form replaced by a confirmation panel reading the verbatim message plus the returned case number. The row lands `status=Draft`, `sys_created_by=guest`, assignment and `closed_date` empty, and appears in the internal Cases list. Zero console errors; zero requests ≥ 400. |
| 5. Portal — lookup | Status lookup returns correct data / not-found | ✅ **PASS — REST contract and portal page** | Anonymous: the page renders one case-number input and a result panel showing exactly three labelled values — Status, Subject, Opened Date. A whitelist audit of the rendered `<main>` for `assigned_group\|assigned_agent\|description\|closed_date\|requester_name\|requester_email\|priority\|type\|@` returned **zero matches**, and the panel holds exactly 3 `dt`/`dd` pairs. An unknown number replaces the panel with an alert whose `innerText` is byte-identical to the required literal `No case found with that number.` (31 characters, codepoint-verified). A stored `<img src=x onerror=…>` subject renders as **text** (`&lt;img` in the raw HTML, 0 images, `window.__fixqXss` undefined). |
| 6. Dashboards | Both dashboards render with synthetic data | ✅ **PASS** — *was FAIL; fixed and re-measured* | Both dashboards were re-authored onto the record chain this release actually uses — `sys_portal_page` + `sys_grid_canvas` + `pa_tabs` + `pa_m2m_dashboard_tabs` + one `sys_portal` / `sys_portal_preferences` / `sys_grid_canvas_pane` trio per widget + `pa_dashboards_permissions` share rows + `restrict_to_roles` — replacing **three table names that do not exist on this release** (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`; the real names are `pa_tabs` and `pa_widgets`, and dashboard sharing is not a child record of that kind). **Measured after the fix: Agent Workspace renders 3 of 3 widgets, Manager View 5 of 5**, all with live data over the 10 seeded cases and correct chart types, with zero console errors and zero responses ≥ 400. Values read from the rendered charts' own per-point labels: status Closed 2 / In Progress 2 / Open 2 / Resolved 2 / Draft 1 / Pending 1; type General Inquiry 6 / Complaint 4; priority High 3 / Medium 3 / Critical 2 / Low 2; *Average Time to Close* `16 Days 0 Hours 0 Minutes`; *Cases Opened in Last 30 Days* `10`. Persona-verified across all 6 pairs: manager ✅ both, agent ✅ Agent Workspace (*My Open Cases* = `CASE0000981` / `CASE0000982` / `CASE0000986`) and ⛔ correctly refused on Manager View, viewer ⛔ refused on both. The 8 backing `sys_report` records also needed two fixes before they would render or be readable — `<group_by>` → `<field>`, and `user=GLOBAL` + `roles` so the read ACL's role branch runs at all (§0.6.1). §0.5, §0.6.1, §9.6 E5. |
| 7. Update Set | Loads/previews with zero errors | ⚠️ **CONDITIONAL PASS — the result depends on the instance you preview against, and the two cases must not be conflated** | **(a) On a genuine clean slate the gate passes.** Measured end to end on the 913-block / 3,618,378-byte / `7272edfc…` revision: **before = 41 errors** against the already-populated instance, **298** on the first clean-slate preview (all `Found a local update that is newer than this one` — the teardown's own deletions), **after = 0 problems of any type** once that local capture was purged at source, verified against the platform's own predicate (`state=previewed`, `unresolvedProblems=false`, `shouldDisplay=true`), then **`committed`**. The teardown was proven complete first (scope `[]`, every census counter 0, all three tables at HTTP 400). Full detail in §0.3. **(b) Previewed against an instance where the schema and the application history already exist, it did NOT pass, and the reason was a real packaging defect — now fixed.** The 913-block `89638c17…` revision produced **34 package-attributable problems** in a matched A/B (§0.3a) and an independent QA preview of the same bytes reported **120 `type=error` problems / 40 distinct, of which 21 were package-intrinsic**: 18 × `Could not find a record in x_casemgmt_case for column case` + 3 × `Could not find a record in core_company for column organization`. Those 21 were **not** an artefact of the instance — the 28 seed rows carried their parent key in the reference element BODY, and Update Set preview accepts only a sys_id in a body, so it rejected every one of them even though the target rows existed. **(c) On the immediately preceding revision the reference class is eliminated.** The 925-block / 3,698,577-byte / `e49a7654…` file was uploaded as a fresh retrieved update set (925 children asserted) and previewed against this same populated instance: **31 problems, every one `Found a local update that is newer than this one`, and ZERO `Could not find a record` problems of any kind** — 63 reference errors went to **0**. All 31 targets were confirmed to hold a LOCAL `sys_update_version` row in state `current` (`no_local_version=0`), i.e. every remaining problem is this instance's own change history — the app's earlier imports plus the QA-remediation deployments of the `sp_*` layout chain, the two UI Policies and their actions, 8 reports, 4 UI Actions, 2 Business Rules, 1 Script Include and 4 dictionary rows. **Zero seed-data records appear among them.** That class cannot arise on a fresh PDI, which is what this gate measures. **What is still open.** These bytes have not been taken through another full teardown-to-clean-slate trip, and **Commit was deliberately withheld** — the verification instance is shared, so committing would have mutated an application other agents are using. **(d) On the bytes that ship — the 926-block `7292a6fe…` file — no preview has been run at all.** Its delta from `e49a7654…` is 13 payloads of records that already existed under the same `sys_id` in the same canonically named block, plus 1 new `sys_metadata` block whose only reference is to `x_casemgmt_case`, which travels in the same set; so the expected outcome is the same local-history collision class and nothing new, but that is a reasoned expectation and is not recorded here as a measurement. The honest statement is therefore: zero problems of any type proven on `7272edfc…`, zero reference problems proven on `e49a7654…`, and nothing measured on `7292a6fe…` beyond the static and live-parity checks of §0.3c. See §0.3, §0.3a, §0.3b, §0.3c and §10.0 item 1a. |
| — Related lists (AAP §0.4.4) | Case form shows `case_task` and `case_party` related lists | ✅ **PASS** — *was FAIL (never authored); now authored, packaged and verified* | Not one of the seven AAP §0.7.3 gates, tracked here because it is an AAP requirement. `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` ships one `sys_ui_related_list` for `x_casemgmt_case` on the Default view plus two `sys_ui_related_list_entry` rows (`x_casemgmt_case_task.case` position 0, `x_casemgmt_case_party.case` position 1) as one added update-set block. Measured on `CASE0000981`: `#related_lists_wrapper` **227.3125 px** with class `tabs_enabled`, sections **Case Tasks (2)** then **Case Parties (2)** in that order (confirmed by DOM order, `compareDocumentPosition` and the tab strip's left offsets), listing the real children `TASK0000276` *Open* / `TASK0000277` *Closed* and `PARTY0000159` *Person, Requester* / `PARTY0000160` *Organization, Respondent*. The identical 227 px was measured for admin, agent and viewer, so the base definition applies to every user; the agent gets a **New** button per list and the viewer none. Zero console errors, zero responses ≥ 400, and no case / task / party record written by the verification. **One install caveat:** on an instance that already rendered the form, the rows are not enough — *Configure ▸ Related Lists* must be opened and **Saved** once to invalidate the server-side cache (§0.6.2, §4 item 17, `deployment.md` step 12). §0.6.2, §9.6 E8. |

> **Net across the seven gates, for the bytes that ship: 4 pass outright · 3 pass only with a qualification ·
> 0 fail.** `4 + 3 + 0 = 7`. This matches §0.4 exactly; if the two ever disagree, §0.4 is authoritative.
>
> - **Outright pass (4):** **Workflow**, **Portal — submission**, **Portal — lookup** and **Dashboards**. The two
>   portal gates moved from qualified to outright once the Service Portal layout records were authored and the
>   widgets' Scripted-REST response-envelope bug was fixed, so both pages render and work anonymously (§0.3b,
>   §9.6 E8-P). **Dashboards** moved from an outright failure to an outright pass when both dashboards were
>   re-authored onto the tables this release actually has — 3 of 3 and 5 of 5 widgets rendering with live data,
>   persona-verified (§0.5, §0.3c).
> - **Qualified (3):** **Data model** and **ACLs**, each correct only after one manual remediation run; and
>   **Update Set**, whose qualification is about which bytes carry which proof rather than about a defect — the
>   zero-problems-of-any-type result belongs to the earlier `7272edfc…` revision (41 → 298 → **0**, then
>   `committed`; §0.3), the zero-reference-problems result to `e49a7654…` (§0.3b), and **no preview has been run
>   on the shipping `7292a6fe…` bytes** (§0.3c).
> - **Outright failure (0):** none.
>
> **How this relates to the counts recorded in earlier revisions and in §9.10.** The progression of this line is
> `2+3+1` (wrong — totals six) → `2+4+1` → `1+5+1` → `3+3+1` → **`4+3+0`**. Each earlier figure was correct for
> the state measured at the time; only the first was arithmetically wrong. The change from `3+3+1` to `4+3+0` is
> gate 6 alone. Any count in this deliverable that does not sum to 7 is a defect in the document.
>
> Gate 2 remains a full PASS and was independently re-verified: clicking the real **Resolve** UI Action on a case
> with an open child task was blocked, the record was not written (`sys_mod_count` unchanged), and the form
> displayed `All tasks must be closed before resolving this case.` — codepoint-verified as 52 pure-ASCII
> characters with a terminating U+002E.
>
> So the deployment is usable end-to-end for case intake, access control and the full state machine — prohibited
> transitions, forward-transition preconditions and side-effects alike — through the internal forms and lists,
> through the portal both as an API **and** as a UI, on both dashboards, and with the case form's related lists
> in place. An earlier revision of this sentence ended *"It is not usable through the portal UI, its dashboards
> do not render here, its case form has no related lists"*; all three clauses have been fixed and are withdrawn.
> The one clause that stands is the last: **it is not self-installing.** The exact residual manual footprint is
> enumerated in §9.5, plus the one-time *Configure ▸ Related Lists ▸ Save* of §4 item 17 on any instance that has
> already rendered the case form.

---

## 7. Summary of where each fix lives

| Defect | Fixed in deliverable XML | Fixed live on PDI | Repo source XML patched | Operational (post-import script) |
|---|:---:|:---:|:---:|:---:|
| A duplicate scope | ✅ | — | ✅ | — |
| B `application` ref | ✅ | — | ✅ | — |
| C commit-no-DDL | ✅ the remediation script is folded into the Update Set — record **117** (Fix Script) of **926**, counting `<sys_update_xml>` blocks from 1. The auto-execute trigger that once accompanied it has been **removed** (§9.4) | ✅ | ✅ `scripts/post_import_remediation.js` + `scripts/sys_script_fix_…xml` | ⚠️ **no automatic trigger — one manual run required.** The trigger that was built fired and could not succeed (`verified=false`, `tables_built=0`, `errors=121`) and was additionally not confined to this application's Update Set, so it is gone. See §9.4 and the procedure in §9.5. |
| D cross-scope barrier | n/a | n/a (workaround) | n/a | n/a — the remediation runs entirely in **global** and writes no `x_casemgmt_*` data; data seeding stays `seed_demo_data.js`'s job, in scope |
| E auto-numbering | ✅ `Dictionary` + 3 × `Number Maintenance` payload blocks updated | ✅ | ✅ `dictionary/x_casemgmt_case_number.xml`, `numbers/sys_number_x_casemgmt_case{,_task,_party}.xml` | re-asserted by the script (needed only because Defect C's rebuild re-creates the dictionary row) |
| 6 `gs.nowDateTime` | partial | ✅ | ✅ | — |
| 7 REST `service_id` | ✅ both `Scripted REST Service` payload blocks updated | ✅ | ✅ `portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml`, `…_case_status_lookup.xml` | re-asserted by the script (convergence for a partially-repaired instance) |
| 8 stale REST op-scripts | already correct in XML | ✅ | n/a | — |
| 9 ACL role-links | ✅ the remediation that creates them is in the Update Set (as the Fix Script; no trigger ships). The 27 `sys_security_acl_role` **records themselves cannot be packaged** — `sys_security_acl` has no `roles` column and link payloads are silently skipped by the engine (5 shapes tested) | ✅ | ✅ created by `scripts/post_import_remediation.js` from each ACL's own `<roles>` declaration, resolved **by name** | ⚠️ **nothing auto-executes; one manual run required.** A clean commit leaves `acl_links_total=0` of an expected 27; the links and the `GlideSecurityManager.get().reset()` flush appear only after the manual run. The trigger that once dispatched this fired but could not succeed, and has been removed (§0.7). See §9.4–§9.5. |
| F flow serialization | ✅ (7 flows replaced with the platform's own graph serialization; +Action Type, +Flow Block, +order-250 Business Rule; 148 → 151 records) | ✅ (7 flows re-authored natively in Flow Designer and published/active; Custom Action published; Business Rule installed) | ✅ | — (no post-import step required) |

> **Repo-source propagation policy (current).** Every remediation now propagates into the repository and into
> the deliverable Update Set. An earlier revision of this document stated that **E**, **7** and **9** were
> deliberately *not* injected and were required post-import operational steps instead. **That is no longer
> true and has been corrected here.** The current position, per defect:
>
> - **E** (auto-numbering) and **7** (REST `service_id`) are **folded into the package proper**: the artifact
>   files carry the values and the corresponding `Dictionary`, `Number Maintenance` and `Scripted REST Service`
>   `<payload>` blocks in `update-set/x_casemgmt_case_management_update_set.xml` carry them identically, so the
>   repo artifact and the deliverable cannot disagree. No operational step remains for either.
> - **C** (physical schema) and **9** (ACL role links) **cannot** be delivered as records — not as a matter of
>   policy but of measured platform behaviour: the DDL comes from a business rule the commit engine suppresses,
>   and `sys_security_acl_role` payloads are silently discarded (§2, §4.1, §4.14). For these the *remediation
>   body* is what ships, and nothing more: `../scripts/post_import_remediation.js` and its Fix Script wrapper,
>   folded into the same single Update Set as block 117 of 926. The global after-update Business Rule on
>   `sys_remote_update_set` that once dispatched it **is no longer in the package** — it fired, could not
>   succeed, and its condition matched the commit of any retrieved Update Set (§0.7, §9.4). **These two defects
>   therefore require the manual run of §9.5; nothing installs them for you.** The remediation is idempotent,
>   resolves every reference by name, contains no sys_id literals, and reports a single grep-able
>   `X_CASEMGMT_REMEDIATION|SUMMARY|` line whose `verified=` token is the proof it converged.
> - **Residual human footprint — CORRECTED by measurement in this pass.** An earlier revision of this document
>   stated *"Residual human footprint for C, E, 7 and 9: none. Upload → preview → commit is sufficient."*
>   **That claim is false and is withdrawn.** A genuine clean-instance round trip (§9) established:
>   **E and 7 are fully delivered by the package alone** — no human step, confirmed on a clean install.
>   **C and 9 are not.** The bootstrap Business Rule *did* fire (verbatim syslog in §9.4) but could not
>   complete, because the commit engine rewrites the dispatched record's `sys_scope` to the application and the
>   script's `GlideTableDescriptor` and `GlideSecurityManager` calls are then refused in scoped execution — 121
>   errors, `verified=false`, `tables_built=0`, `acl_links_total=0`. Shipping the automation *global* in the
>   package does not help, because the rewrite happens at commit time regardless of the packaged `sys_scope`.
>   That rule has since been **removed** from the package, so a commit of the current bytes emits no marker lines
>   at all. The precise step-by-step manual procedure, and why automation was not achievable, are in §9.5.
> - Unchanged: **A** and **B** remain packaging fixes in the XML, and **6** remains an in-place correction of
>   two generated Business-Rule script lines. The zero-error preview gate is preserved — the two added blocks
>   use the same 18-element `<sys_update_xml>` wrapper, unique `update_guid`s, and payloads byte-identical to
>   their standalone artifacts.

### 7.1 Where the presentation-layer fixes live

The table above covers Defects A–F. The QA-findings pass fixed a separate set, all in the presentation layer, and
every one of them lives in **both** carriers — the standalone artifact and the matching `<payload>` in the Update
Set — plus, in each case, the live record on `dev379024` so the result could be measured. None of them needs an
operational step, with the single exception noted for the related lists.

| Fix | Artifact(s) | Update Set block(s) | Operational step |
|---|---|---|---|
| Chart reports grouped on the wrong dimension — `<group_by>` → `<field>` (§0.6.1) | `reports/x_casemgmt_case_count_by_status.xml`, `…_all_cases_by_status.xml`, `…_all_cases_by_type.xml`, `…_all_cases_by_priority.xml` | 4 × `Report` | — |
| Reports unreadable by any persona — `user=GLOBAL` + `roles`, and the inert `<group_by/>` / `<format/>` elements removed (§0.6.1) | all 8 `reports/*.xml` | 8 × `Report` | — |
| Dashboards rendered nothing — re-authored onto `sys_portal_page` / `sys_grid_canvas` / `pa_tabs` / `pa_m2m_dashboard_tabs` / `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` / `pa_dashboards_permissions`, and `restrict_to_roles` set (§0.5, §9.6 E5) | `dashboards/pa_dashboards_x_casemgmt_agent_workspace.xml`, `…_manager_view.xml` | 2 × `Dashboard` (49 and 76 records) | — |
| Case form had no related lists (§0.6.2, §9.6 E8) | `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` | 1 × `Related Lists` (added; block 92 of 926) | ⚠️ **one-time** *Configure ▸ Related Lists ▸ Save* on an instance that already rendered the form — §9.5 step 7, §4 item 17 |
| Portal validation UX and accessibility — per-field messages, bound `aria-invalid`, `has-error`, `role="alert"` / `role="status"`, maxlength notices, a 20 s lookup deadline, a distinct transport-failure panel, and the inert `<pop_up>` element removed (§0.3c) | `portal/widgets/sp_widget_x_casemgmt_case_submission_widget.xml`, `…_case_lookup_widget.xml`, `…_case_confirmation_widget.xml` | 3 × `Service Portal Widget` | — |

---

## 8. Automated regression suite (ATF) — delivered, running, and its honest coverage

This section covers the Automated Test Framework suite added in this pass. It is the only section of this
document that speaks to ATF; nothing elsewhere in the register is amended by it.

### 8.1 What was delivered

An ATF suite was **generated, executed and serialized successfully**. The relational failure mode that
afflicted Flow Designer (§3) was anticipated for ATF's multi-table step configuration, was measured, and was
designed around — see §8.5. It did not defeat the deliverable.

| | |
|---|---|
| Suite | **`x_casemgmt Case Management POC`** (`sys_atf_test_suite`, scope `x_casemgmt`) |
| Tests | **20** — `ATF 01` … `ATF 20` |
| Records | 20 `sys_atf_test` + 180 `sys_atf_step` + **540 `sys_variable_value`** step-input rows + 1 `sys_atf_test_suite` + 20 `sys_atf_test_suite_test` links = **761** |
| Repo artifacts | `../atf/*.xml` — 21 files (one per test carrying its steps and their inputs, plus the suite and its links) |
| In the package | **761 `<sys_update_xml>` blocks** in `../update-set/x_casemgmt_case_management_update_set.xml` — 20 tests + 180 steps + **540** step-input rows + 1 suite + 20 suite links — placed after the `Report`/`Dashboard` blocks and before the seed data, so the tables, dictionary, choices, roles, ACLs, Script Includes and Business Rules the tests exercise all load first. The ATF blocks took the package from 153 to 916 records at the time; the package is now **926** blocks (§0.1) — it went 916 → 913 when the bootstrap-trigger block was removed, → 925 when the portal-layout, List Layout and UI Policy records were added, → 926 with the case form's Related Lists definition — and **the 761-block ATF range is unchanged throughout**, so it is 761 of 926 today. |

Coverage, by the three areas required:

| Test | Area | What it asserts |
|---|---|---|
| `ATF 01` | Data model | The full §0.5.7 schema of all three tables — field names, types, lengths, mandatory flags, reference targets — every choice set, the `sys_number` prefix/padding, and that `number` is read-only and matches `CASE0000001` |
| `ATF 02` | RBAC | `x_casemgmt_case_manager`: create, read **all**, write **all**, delete — all succeed |
| `ATF 03` | RBAC | `x_casemgmt_case_agent`: create succeeds; read/write succeed on a case assigned via `assigned_agent` **and** on one assigned via `assigned_group`; both denied on an unassigned case and on a case in another group; delete denied |
| `ATF 04` | RBAC | `x_casemgmt_case_viewer`: read all succeeds; create, write and delete all denied |
| `ATF 05` | RBAC (field) | `assigned_group` writable by the manager only; `assigned_agent` writable by the manager **and** the assigned agent; neither by the viewer |
| `ATF 06` | RBAC (children) | The matrix mirrored on `x_casemgmt_case_task` and `x_casemgmt_case_party` for the manager and the viewer |
| `ATF 07` | RBAC (children) | The agent's assigned-only narrowing on the two child tables — **green since the §9.6 E-ATF fix**; now 58 checks across five parent fixtures |
| `ATF 08` | State machine | `Draft → Open` blocked without `assigned_group`, succeeds with it |
| `ATF 09` | State machine | `Open → In Progress` blocked with no `assigned_agent`, blocked with an agent outside `assigned_group`, succeeds with a member |
| `ATF 10` | State machine | `In Progress → Pending` sets `pending_reason`; `Pending → In Progress` clears it |
| `ATF 11` | State machine | Task-closure gate: `Resolved` blocked while a child task is `Open`, with the message verbatim; succeeds once the task is `Closed` |
| `ATF 12` | State machine | `Resolved → Closed` denied to a non-manager, permitted to the manager, and `closed_date` auto-set |
| `ATF 13` | State machine | Any status → `Draft` prohibited, message verbatim |
| `ATF 14` | State machine | `Closed → *` prohibited from every other status, message verbatim |
| `ATF 15` | State machine (**on the form**) | The task-closure message appears on the rendered case form and the save is refused |
| `ATF 16` | State machine (**on the form**) | The back-transition message appears on the rendered case form and the save is refused |
| `ATF 17` | State machine (**on the form**) | The terminal-state message appears on the rendered case form and the save is refused |
| `ATF 18` | Portal contract | `POST /api/x_casemgmt/case_submit` → **201**, body carries `number` and `Your case has been submitted`, and the created case lands in `Draft` with a `CASE`-format number |
| `ATF 19` | Portal contract | `GET /api/x_casemgmt/case_status_lookup?number=<valid>` → **200** carrying `status`, `subject`, `opened_date`, and the whitelist asserted **negatively** — 23 checks confirming `assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email` and `sys_id` appear neither as keys nor as values |
| `ATF 20` | Portal contract | `GET …?number=CASE9999999` → **404** with exactly `No case found with that number.`, re-verified with **no credentials at all** |

All five verbatim strings are asserted character-exactly, trailing period included:
`All tasks must be closed before resolving this case.` · `Cases cannot be returned to Draft.` ·
`Closed cases are terminal and cannot be modified.` · `No case found with that number.` ·
`Your case has been submitted`

The tests assert **observable behaviour only**. None of them references a `sys_hub_flow` record or any other
implementation artifact, so the suite is valid whether the transition guard is reached through a flow, a
subflow or the Business Rule path of §3 — and `ATF 11`'s own step log records the abort as coming from
`x_casemgmt_enforce_forward_transitions`, which is exactly the shipped mechanism.

### 8.2 Instance settings that were changed — a prerequisite for running the suite, not part of the package

| Property | Before | After | Captured in the Update Set? |
|---|:---:|:---:|:---:|
| `sn_atf.runner.enabled` | `false` | **`true`** | **No — deliberately not** |
| `sn_atf.schedule.enabled` | `false` | **`true`** | **No — deliberately not** |
| `sn_atf.headless.enabled` | `false` | `false` (**unchanged**) | n/a |

- **`sn_atf.runner.enabled` must be `true` on any instance where the suite is to run.** With it `false` — the
  shipped default on a PDI — every run aborts. It is an instance **test-harness** setting rather than an
  application artifact, so it is intentionally excluded from the Update Set and is disclosed here instead.
- `sn_atf.schedule.enabled` was **not** set deliberately: the platform's own business rule *Enable/Disable
  scheduled tests* flipped it as a side effect of enabling the runner, logging *"Enabled scheduled suites
  because test execution was enabled"*. It is recorded here because it is a real change to the instance. It has
  caused no unattended execution — `sys_atf_schedule` and `sys_atf_schedule_run` both hold **zero** rows, and
  every suite result on the instance was triggered by `admin` with an empty `schedule_run`. Setting it back to
  `false` is safe and does not affect the suite.
- `sn_atf.headless.enabled` was left `false`. Consequently the three form-level tests (`ATF 15`–`ATF 17`)
  require a **browser client test runner**: open `/atf_test_runner.do?sysparm_nostack=true` in a second tab,
  leave it open, then run the suite and pick that session in the *Pick a Browser* dialog. The other 17 tests
  need no browser.
- These two property rows are the **only** addition to the set of base-table records listed in §5; they are
  instance settings, not records the deliverable defines.

**To run the suite:** commit the Update Set → set `sn_atf.runner.enabled = true` → open the client test runner
tab → open the suite record → **Run Test Suite** → pick the runner session. Roughly 8 minutes.

### 8.3 Evidence that the tests pass

**Three different claims are separated here, because they are not interchangeable and earlier revisions of this
document ran them together:**

1. **the current live suite result** — what the suite scores on the instance today;
2. **the last serialized-import proof** — the most recent run performed *after* re-loading every ATF record from
   the shipped `../atf/*.xml` artifacts, which is what proves the *package* rather than the UI-authored copies;
3. **what the tests actually assert** — see §8.6 and the note under the table in §8.4.

#### (1) Current live result — `TES0001015`

| | |
|---|---|
| Result | **`TES0001015`** (`sys_atf_test_suite_result` `c557b49a93e28b10830ef82bdd03d638`) |
| Window | `2026-08-08 16:37:19` → `16:41:47` — **4 minutes** |
| Rollup | **success 20 · failure 0 · error 0 · skip 0** (`rolled_up_test_success_count = 20`), across 20 child `sys_atf_test_result` rows |
| Steps | **180 of 180 `Success`** across those 20 children |
| Status | **`Success`** — "Suite passed" |

> **⚠️ These row identifiers are perishable — re-measure, do not cite.** Re-measured on **2026-08-10**: `TES0001015`
> (`c557b49a…638`) and `TES0001014` (`f2f7770a…680`) **no longer exist on the instance** — a REST `GET` on either
> answers *"No Record found"* — and at the start of that pass all three ATF result tables
> (`sys_atf_test_suite_result`, `sys_atf_test_result`, `sys_atf_test_result_step`) held **0 rows**. Table Cleaner
> (`sys_auto_flush`, 30 days) does not explain a ~1.5-day-old disappearance and `sys_audit_delete` holds nothing for
> those tables, so treat suite-result rows on this shared instance as transient by default.
>
> **What has been re-measured since, and is the current evidence:** two independent runs of the same 20 tests, each
> **20 Success / 0 Failure / 0 Error / 0 Skipped with 180 of 180 step results Success** —
> `TES0001016` (`5ff9036a…6b8`, 2026-08-10 04:56:34) and `TES0001017` (`b5ff076a…6a5`, 2026-08-10 05:22:41,
> `run_time 00:03:28`, dispatched through the product UI with a browser runner attached, `UI Batches Executed` 0 → 3,
> `user_agents` populated on exactly `ATF 15`/`16`/`17`). That pass also recomputed the rollup from the children
> rather than trusting `rolled_up_*`, and proved the suite can fail by inverting one expectation per area and
> observing three genuine `Failure` verdicts before restoring them. **The claim in this section therefore stands and
> has been reproduced twice — but quote the seven post-import checks in §8.5, not a `TES…` number.**

Per-test verdicts and run times, read from the 20 child rows: `ATF 01` Success 3 s · `02` Success 8 s ·
`03` Success 6 s · `04` Success 3 s · `05` Success 7 s · `06` Success 12 s · `07` Success 6 s ·
`08` Success 10 s · `09` Success 13 s · `10` Success 3 s · `11` Success 5 s · `12` Success 9 s ·
`13` Success 4 s · `14` Success 7 s · `15` Success 41 s · `16` Success 47 s · `17` Success 40 s ·
`18` Success 9 s · `19` Success 6 s · `20` Success 2 s. Not one child carries a value in
`first_failing_step`, and the rolled-up failure, error and skip counters are all `0`.

#### (2) Last serialized-import proof — `TES0001014`, on an earlier package revision

`TES0001014` (`f2f7770a93ea4b10830ef82bdd03d680`, `2026-08-08 12:00:34` → `12:06:18`, 5 minutes 44 seconds) also
scored **20 · 0 · 0 · 0** with 180 of 180 steps `Success`, and it is the run that was executed **after** every
test, step and step-input record had been re-loaded into the instance from the shipped `../atf/*.xml` artifacts
through the platform's own payload loader. Its verdict was corroborated four independent ways rather than read off
one field: the **Failed Tests in Suite** related list is empty; the rolled-up failure, error and skip counts are
all `0`; a step-level sweep across all 20 child results returns **180 steps, every one `Success`**; and no child
result carries a value in `first_failing_step`, `first_failing_client_error` or `output`. The three form-driving
tests genuinely ran through a real browser — the client runner's **UI Batches Executed** counter went `0 → 3`,
exactly one batch per `ATF 15/16/17`.

> **The gap, stated plainly.** `TES0001014` proves the *serialized* assets of the package revision current at
> that moment — a **pre-security** revision. `TES0001015` proves the *live* assets as they stand now. The suite
> has **not** been re-run against a fresh re-load of the shipped artifacts since the security and
> documentation-truthfulness passes changed the package. **The security pass did touch ATF records:** it rewrote
> `ATF 18`'s anonymous leg (to a non-mutating one, §9.6a P6) and `ATF 19`'s setup, which changed **10 packaged
> blocks** — 2 `Test`, 4 `Test Step` and 4 `Value` — and the two artifacts
> `atf/x_casemgmt_atf_18_*.xml` and `atf/x_casemgmt_atf_19_*.xml` on disk. The range has held at exactly **761**
> blocks throughout, with nothing added or removed. So `TES0001014` **predates the current form of those
> two tests**, which is a further reason the serialized re-load re-run is outstanding rather than a formality.
> An earlier revision of this paragraph asserted that nothing in either pass touched an ATF record; that was
> measured and is false for precisely `ATF 18` and `ATF 19`. Closing the gap is recommended next step 2 (§10.0).
>
> **One ATF payload changed again after that pass, and the instance was never told.** An earlier revision of this
> paragraph also claimed the ATF range had been "byte-unchanged from that pass onward (0 content-differing blocks
> between it and HEAD; the only later ATF edit is a header comment in `atf/x_casemgmt_atf_03_*.xml`, which the
> package does not carry)". **That was stale and is corrected here.** The later ATF edit is in
> **`atf/x_casemgmt_atf_18_portal_submit_contract.xml`**, it is the `Value` block for `sys_variable_value`
> `7b1f7b99514155cc7d085e3926b42cbe` (`ATF 18` step 9, *Run Server Side Script*), and **the package does carry
> it** — HEAD commit `f8a7f46e1b` edited the artifact and the matching `<payload>` together. Measured, twice, and
> re-measured for this entry:
>
> | | Package + artifact (they agree) | Live row on the instance |
> |---|---|---|
> | length | **9,500** chars | **8,931** chars |
> | md5 of the whole value | `b7bc890521ce3b122cd01f0bf4509ed8` | `d3bbf6f2a5a6…` |
> | md5 with `//` comments and blank lines stripped | **`91822682b141`** | **`91822682b141`** |
> | unified diff | **17 changed lines, every one a `//` comment — 0 non-comment lines** | |
>
> So the executable code is **identical** and the delta is **behaviourally inert**: the currently-installed copy of
> `ATF 18` step 9 is one comment revision behind the package, and nothing else in the suite differs. A full
> re-diff of the packaged `sys_variable_value` blocks against the live rows returns **539 of 540 byte-identical, 1
> differing (this one), 0 only-in-package, 0 only-in-live**. Consequently any suite verdict taken on this instance
> is a verdict on the package's *code* for all 540 inputs and on the package's *bytes* for 539 of them.
>
> **And the delta-carrying test was re-run to confirm it, rather than argued about.** `ATF 18`
> (`a4fab153ebcda77e4c2d7b8905f7d19e`, 10 steps) was dispatched from its own form through the product UI on
> 2026-08-10: **Status `Success`, 10 of 10 steps Success, 15 seconds**, no `Pick a Browser` prompt and
> `user_agents` empty — all four batches were server batches. The submit step answered **`201 Created`** with
> `{"result":{"number":"CASE0001218","message":"Your case has been submitted"}}` and `X-Is-Logged-In: false`; the
> step whose script carries the delta, **step 9**, reported
> `anonymous POST [] -> 400 {"result":{"error":"Invalid payload."}}` and
> `genuinely anonymous, non-mutating portal probe: checks=12 failures=0`; step 10 reported
> `submissions removed=1 | deletes reporting failure=0 | residue rows=0`. Afterwards `subject STARTSWITH ATF-PORTAL`
> was **0 rows** and the case table was back to **10**. The same pass re-confirmed the provenance from the UI as
> well as the API: **Show Latest Update** on step 9 resolves to a single Customer Update in
> `x_casemgmt_case_management v1.0.0` with **`Updates = 0`**, **Compare to Current** reports *"There are no
> differences found"*, and the installed script's comment-stripped md5 was independently recomputed as
> `91822682b141…` — the package's value.
>
> **The delta has deliberately not been closed by writing to the instance.** Two reasons, both measured. First, the
> row is not writable through the Table API — a `PATCH` on `sys_variable_value/7b1f7b99…` answers
> `403 ACL Exception Update Failed due to security constraints` — so closing it means a background script or the
> ATF UI. Second, and decisively, overwriting it would cost the provenance property this section leans on: all
> **20** tests, **180** steps and the suite still carry `sys_mod_count = 0` with the package's
> `2025-01-01 00:00:00` stamps, which is what proves a run is a run of the *as-installed package records* rather
> than of something hand-edited afterwards. Trading that away for 17 comment lines is a bad exchange. The correct
> close is a re-load of the shipped artifacts (§10.0 item 2), which restores the bytes *and* the provenance in one
> operation.
>
> Three `sys_variable_value` rows do carry `sys_mod_count = 2` and a `2026-08-10 06:19:00` stamp:
> `8038165c…` (`ATF 20`), `96b00e8a…` (`ATF 04`) and `f460249a…` (`ATF 13`). Those are the three negative controls
> of the test-execution QA pass — inverted, observed to fail, and restored — and their **values are byte-identical
> to the package** (they are among the 539). Two writes each, one out and one back, is exactly what
> `sys_mod_count = 2` records.

> **History, kept because it matters.** The immediately preceding run of the same suite, `TES0001013`
> (`0fd7ebc2936a4b10830ef82bdd03d6e7`, 2026-08-08 10:50), was **19 / 1** — `ATF 03` failed at step 8 with
> `FAILURE: Unable to find record 'ad246e3efcb417cf87cc4d8eb2bc6df5' in table 'x_casemgmt_case'`, and steps 9-11
> were skipped as a consequence. The cause was the test's own construction, not the application: step 8 was a native
> `Record Update` step, and that step type must **locate** the row before it can attempt a write and observe a
> denial — impossible here, because the assigned-only read ACL had already made that row invisible to the
> impersonated agent (step 6 proves exactly that). Step 8 was rebuilt as a `Run Server Side Script` step that
> attempts the write through `GlideRecordSecure`, the only scoped API that applies the write ACL. That failure is
> also the strongest available evidence that this suite is capable of failing: it was unplanned, the suite caught
> it, attributed it to the exact step, reported it verbatim, and went green once the step was corrected.
> An earlier run still, `TES0001006` (2026-08-07), was also 19 / 1, for the unrelated `ATF 07` child-table ACL
> defect recorded as §9.6 **E-ATF**, which is likewise now fixed.

Every suite result on the instance was triggered by `admin` with an empty `schedule_run` — no unattended
execution has ever occurred (see §8.2). Of the earlier series `TES0001001` … `TES0001006`, all reported
19 success / 1 failure except the first, which ran only 17 of the 20 tests because of a suite-link defect in the
authoring tooling that was found and fixed before any evidence was relied upon. **There is no authoritative
`TES…` row, and this document does not nominate one.** Suite-result rows are not durable on this shared instance —
`TES0001015` and `TES0001014`, which an earlier revision of this paragraph named as the authoritative and the
serialized-import verdicts, no longer resolve (§8.3). What is authoritative is the **rollup and the method**:
20 tests Success / 180 of 180 step results Success / 0 failure / 0 error / 0 skip, reproduced independently by
`TES0001016` and `TES0001017` (§8.3), verified against the seven post-import checks of §8.5 rather than against a
row identifier. `TES0001014` remains the historical marker for the last verdict taken against a fresh re-load of
the shipped artifacts (§8.3 (2)), and repeating that on the shipping bytes is §10.0 item 2.

Depth of assertion, from the step summaries of the `TES0001014` run: `ATF 01` verified the case schema with
`checks=76 failures=0` and the task and party schema with `checks=52 failures=0`; `ATF 19` verified the lookup
whitelist with `checks=23 failures=0`.

The three form-level tests genuinely drove the browser. The runner's counter went from
`UI Batches Executed [ 0 ]` to `[ 3 ]` — one batch per form test; its Execution Frame loaded real
`x_casemgmt_case` forms under *Demo Manager* impersonation (`Impersonation successful in the UI session.
Impersonated user: x_casemgmt_demo_manager`); `ATF 15`'s result records the browser as
`HeadlessChrome/151.0.0.0` and carries three runner-captured screenshot attachments; and each blocking message
was observed **on the form**. All three messages were additionally recovered, character-for-character, from the
ARIA live region inside ATF's own screenshot payloads — an independent corroboration of the on-screen text
rather than a re-reading of the same assertion. Each was recovered prefixed `error: ` followed by the message:

| Test | Message recovered from the rendered form |
|---|---|
| `ATF 15` | `All tasks must be closed before resolving this case.` |
| `ATF 16` | `Cases cannot be returned to Draft.` |
| `ATF 17` | `Closed cases are terminal and cannot be modified.` |

A nuance worth recording: the form renders **two** banners, the state-machine message *and* the platform's
generic `Invalid update`. Assert on the former; the latter is expected.

Diagnostics across both browser tabs: **zero** console errors out of 322 messages and **zero** failed requests
out of 1,579. The only aborted requests were three `net::ERR_ABORTED` self-reloads on `x_casemgmt_case.do`
carrying `sysparm_from_atf_test_runner=true` — one per form test, each paired with ATF's own
`cancel_my_transaction.do` call, and all three of those tests passed.

### 8.4 Evidence that the tests can *fail* — the negative controls

A suite that cannot fail proves nothing. One expectation per area was deliberately inverted, the runner was
confirmed to report a genuine failure, and the expectation was then restored and re-run green.

| Area | Test | Inversion | Runner's reported failure (verbatim) |
|---|---|---|---|
| RBAC | `ATF 04` | assert the viewer *can* write | `viewer canWrite expected[true] actual[false]` |
| State machine | `ATF 11` | drop the trailing period from the expected message | `blocking message is verbatim expected[All tasks must be closed before resolving this case] actual[All tasks must be closed before resolving this case.]` |
| Portal | `ATF 20` | expect `200` instead of `404` | `The response status code doesn't match the specified operation for expected status code: '200', actual status code: '404'` |

The state-machine control is the most informative of the three: a single missing period is reported as a
failure, which is what makes the "verbatim" claim in §8.1 mean something.

Independently, the harness itself was proven before any test was authored: a throwaway probe asserting
`1 + 1 === 2` returned a real `success` verdict, and the same probe inverted to `1 + 1 === 3` returned a real
`failure` verdict with the message *"Assertion failed: probe arithmetic (inverted) should have been 3 but was
2"*. Both probes were deleted afterwards and are not part of the shipped suite.

### 8.5 Do the ATF records survive serialization and re-import? Yes — but only in one form

This was the specific risk flagged for ATF, by analogy with §3. **It is real, it was measured, and the
deliverable is built the way that survives.**

- A step's input **values are not stored on the step**. `sys_atf_step.inputs` is a `glide_var` column that is
  always empty; the values live in a second table, `sys_variable_value`
  (`document='sys_atf_step'`, `document_key=<step sys_id>`, `variable=<atf_input_variable sys_id>`).
- `GlideRecordXMLSerializer` **embeds** those rows as children inside the `sys_atf_step` document — and
  **`GlideUpdateManager2.loadXML()`, the per-record mechanism an Update Set commit uses, ignores them.**
  Measured on a deleted-and-re-imported test: `AFTER_REIMPORT|test=present|steps=6|inputs=0`, after which the
  test ran **`FAILURE`**. This is the same shape of defect as §3: header records present, relational body
  missing. Had the artifacts been shipped in that form, they would have imported as dead shells.
- **The fix, and what `../atf/*.xml` and the Update Set actually contain:** each `sys_variable_value` row is
  emitted as its **own** record, immediately after its parent step, with a deterministic `sys_id`. The parent
  step keeps its `delete_multiple` directive so re-import is idempotent.
- Proven four ways after the change:

  | Check | Result |
  |---|---|
  | Delete `ATF 20`, re-apply the 22 record documents from its shipped artifact file in file order | `inputs=15` restored; test ran **Success**, 6/6 steps |
  | Delete `ATF 11`, re-apply the 45 blocks belonging to it taken **straight out of the Update Set, in Update Set order** | `inputs=34` restored; test ran **Success**, 10/10 steps |
  | Re-apply the suite artifact | Suite and all 20 ordered links restored |
  | **Re-apply all 21 artifact files — every test, step, step-input, the suite and its links — then run the whole suite** | *(measured on the then-current 763-record / 542-input ATF range; the shipping range is now **761 records / 540 inputs**, see §0.1)* 763 records applied with **0 load errors**; live state 20 tests / 180 steps / 542 inputs; all 542 input values **byte-identical** to the artifacts (verified by md5 per `(document_key, variable)`: 542 identical, 0 different, 0 missing); the suite then ran as `TES0001006` with the same **19 / 1 / 0 / 0** verdict. **Counts are as of that revision.** The test-asset remediation pass rebuilt `ATF 03` step 8 (five native-step inputs replaced by the two a script step takes), so the package now carries **761 records / 540 step-inputs**, re-verified byte-identical against the instance by the same md5-per-`(document_key, variable)` method (540 identical, 0 different, 0 missing) — and the current verdict is **20 / 0 / 0 / 0**, see §8.3 |

  The last row is the one that matters: the verdict in §8.3 belongs to records that came *through* the
  serialization, not to the originals.
- Two ordering and idempotence consequences, both measured:
  - Deleting a `sys_atf_test` cascades away its `sys_atf_test_suite_test` link, so the suite blocks must load
    **after** the tests. They do — they are the last blocks in the ATF range.
  - The loader's indifference to nested children applies to the platform's `delete_multiple` directive too: the
    `<sys_variable_value action="delete_multiple" query="document_key=…"/>` child the platform emits inside each
    step document is **also ignored**. The same directive *is* honoured when applied as a top-level document
    (measured: a step's inputs went 2 → 0). The practical consequence is bounded: because every shipped input
    row carries a deterministic `sys_id`, importing the package onto a clean instance, or re-importing it over a
    previous import of itself, is exactly idempotent — the ids match and the rows update in place. Importing it
    on top of a **natively authored** copy of the same suite, whose rows carry platform-generated ids, *adds* a
    second row per input instead of replacing it (measured at the time: 542 → 1035, on the then-current input count). That situation arises only on the
    authoring instance, where it was cleaned up; the clean-instance procedure removes the scope first and so
    cannot hit it. A maintainer who wants unconditional idempotence can emit one top-level `delete_multiple`
    document per step ahead of that step's input rows.

**The check to run on a clean instance after upload → preview → commit:**

1. `sys_atf_test` where `sys_scope.scope=x_casemgmt` → **20**
2. `sys_atf_step` where `test.sys_scope.scope=x_casemgmt` → **180**
3. `sys_variable_value` where `document=sys_atf_step` and `document_key` is one of those steps → **540**
4. `sys_atf_test_suite` → **1**, named `x_casemgmt Case Management POC`; `sys_atf_test_suite_test` → **20**
5. **A step with zero input rows is the failure signature.** If one appears, the input records did not load,
   or loaded ahead of their parent step. Equally, **no step should have more than its expected number of input
   rows** — a duplicate means the package was imported over a natively authored suite (see above).
6. Set `sn_atf.runner.enabled=true`, attach a client runner, run the suite → expect **20 success / 0 failure /
   0 error / 0 skipped**. That is the measured expectation, not a projection: `TES0001015` and `TES0001014`
   (§8.3) each achieved it with 180 of 180 steps Success after the §9.6 **E-ATF**, **E9** / **E-ATF15** and
   `ATF 03` step-8 fixes. Also expect the shipping range to be **761 records / 540 input rows** (§0.1).
7. No post-run sweep is needed. `ATF 18` creates nothing outside ATF's rollback context and asserts that no
   `ATF-PORTAL-18` row survives it (see §8.6, M4). Confirm with a list on `x_casemgmt_case` where `subject`
   starts with `ATF-PORTAL` — expect zero rows.

### 8.6 What the suite found, and what remains manual

**A real defect, surfaced by `ATF 07` and left visible rather than hidden — and since FIXED.** *This subsection
is the historical diagnosis. The defect it describes is closed: the four conditions now use
`current.getElement('case')`, and `ATF 07` is green in both `TES0001014` and the current `TES0001015`
(§8.3). It is kept because the diagnosis explains why the ACLs are written the way they are.* At the time,
four scoped condition scripts on the child-table ACLs dereferenced `current.case`. Because `case` is a JavaScript reserved word, those scripts
**fail to compile** — the platform log reads
`Script compilation error: Script Identifier: sys_security_acl.1ea69bf11f64a85ddf0c7e970779fefe, Error Description: missing name after . operator (…; line 2)`
and, for the party table, `AccessTerm: Slow ACL 98ad89a6a3e869f11fb477ed8f8f1b87 for the path record/x_casemgmt_case_party/read`.
An ACL whose condition cannot compile evaluates to **deny**, so `x_casemgmt_case_agent` cannot read the tasks
or parties of the case it is itself assigned to. `ATF 07` reports it as
`agent assigned-only narrowing on the child tables: checks=4 failures=2 :: agent can read a task on its assigned parent case expected[true] actual[false] | agent can read a party on its assigned parent case expected[true] actual[false]`.
The remedy was an accessor that does not require the reserved word — `current.getElement('case')` was the one
measured to support every operation the conditions need — and the test needed no change, turning green on its own
once the scripts were fixed. The impersonated agent now sees 10 task rows and 8 party rows with `canWrite=true`
and `canDelete=false`. The test is deliberately **not** deleted or weakened: a suite that hides
a real defect to look green is worth less than one that shows it. A second, latent code-hygiene issue was found
the same way — `CaseTransitionValidator.canTransitionToClosed()` has a branch calling `gs.getUser(userName)`,
which a scoped application cannot use to fetch another user; it is inert on the shipped path and was not
changed.

**What stays manual:**

| # | What | Why | Cost |
|---|---|---|---|
| M1 | Setting `sn_atf.runner.enabled = true` wherever the suite is to run | Instance test-harness setting, deliberately not captured into the package (§8.2) | < 1 min |
| M2 | Opening a client test runner tab for `ATF 15`–`ATF 17` | Form-level steps need a browser; `sn_atf.headless.enabled` was left `false` | ~2 min per run |
| ~~M3~~ | ~~The genuinely anonymous REST leg~~ — **automated** | The `Send REST Request - Inbound` step type supports only `basic`/`mutual` auth, but with no profile configured it sends **no credentials at all** and the platform serves it as `guest` — measured: `X-Is-Logged-In: false` on the response, and the row it creates is owned by `guest`. `ATF 18`'s steps 2–8 therefore assert the 201 contract for a genuinely unauthenticated caller, and each of `ATF 18`–`ATF 20` additionally carries a scoped `Run Server Side Script` companion using `sn_ws.RESTMessageV2` with no credentials (201 / 200 / 404 as specified, while `/api/now/table/x_casemgmt_case` correctly returns 401 to an anonymous caller). `ATF 18`'s companion is deliberately **non-mutating** (M4). A credential-free `curl` transcript is recorded in `ATF_MANUAL_TEST_PLAN.md` §5 C4 for anyone wanting to re-confirm it outside ATF. | — |
| ~~M4~~ | ~~Deleting the one `ATF-PORTAL-18` case after each `ATF 18` run~~ — **no longer needed** | ATF rolls back records created by its own steps, by its scripts and by the ATF-instrumented `Send REST Request - Inbound` step — but **not** a row a *script* creates by calling into the instance over HTTP with `sn_ws.RESTMessageV2`: that arrives as `guest`, in its own transaction, and the rollback additionally reverses the test's own cleanup delete of it. `ATF 18`'s anonymous leg used to submit a real case that way, so each run left exactly one synthetic `Draft` case. That leg is now **non-mutating** — it POSTs a payload the handler must reject (`400`, `Invalid payload.`) and performs a read-only credential-free lookup, then proves by census that neither call persisted a row — so the only row the test creates comes from the instrumented step, inside the rollback context, which the platform removes even when the cleanup step is skipped. Measured over two consecutive runs on 2026-08-08 (`12a928de93628b10830ef82bdd03d686`, `805bac9293a28b10830ef82bdd03d630`): both Success, step 10 reporting `residue rows=0`, `subject STARTSWITH ATF-PORTAL` → **0 rows**, and the second run's step 1 reporting `pre-existing submissions removed=0`. A row left by a run of the earlier design must still be swept once by hand. | spent |
| ~~M5~~ | ~~Fixing the four `current.case` ACL scripts so `ATF 07` goes green~~ — **done** | The conditions now use `current.getElement('case')`; `ATF 07` is green in `TES0001015` | — |

**Fixtures and data safety.** Every test creates its own synthetic fixtures, prefixed `ATF-`, with
`@example.invalid` addresses, and deletes them again; ATF's rollback covers the rest. No test mutates the demo
data. After the full suite run and every re-import experiment, the demo set was re-verified as intact: **10
cases spanning all six statuses (Draft 1, Open 2, In Progress 2, Pending 1, Resolved 2, Closed 2) and both
types (General Inquiry 6, Complaint 4), 10 tasks, 8 parties, 3 demo users, 1 demo group**, with zero `ATF-`
rows left behind. `ATF 19` pins its fixture to the out-of-sequence number `CASE9000019` precisely so it stays
portable to a freshly imported instance whose counter restarts at `CASE0000001`; and because a row it does not
own could still carry that number, its setup step **verifies** uniqueness read-only and **refuses to run**,
changing nothing, rather than deleting the foreign carrier.

**Not overstated.** **All 20 tests pass** in the current run `TES0001015` (§8.3) — the earlier `19 / 1` and
`16 / 4` verdicts are historical and are labelled as such wherever they appear. Two caveats that the pass rate
does **not** cover, stated so the suite is not read as proving more than it does: (a) the suite has not been
re-run against a fresh re-load of the shipped artifacts since the last two package-changing passes (§8.3, gap
note); and (b) `ATF 15`, `ATF 16` and `ATF 17` assert that the offending save is **refused**, that the record is
**not** written, and that the exact server-side message string is produced — they do **not** read the rendered
text out of the form's DOM, so "the message is visible on the form" remains a **manual** observation (the eight
live form observations in §3.4). Three areas are covered automatically; of M1–M5, **M3, M4 and M5 are now
closed** and the two that remain (M1, M2) are trivial. A step-by-step plan for rebuilding the whole suite by hand in the ATF UI
— costed at about 10 hours against the original 16-hour estimate — is in `ATF_MANUAL_TEST_PLAN.md`, which also
states plainly that automated generation held and that the plan is a recipe rather than a substitute.

### 8.7 Identifiers in the ATF artifacts — full disclosure

The package's standing rule is that no artifact carries a foreign `sys_id`: users resolve by `user_name`,
groups and roles by `name`, cases by `number`, tables by `name`. Every 32-character literal in
`../atf/*.xml` is accounted for below, and the two categories that cannot be expressed by name are named
rather than glossed over.

| Category | Count | Status |
|---|---:|---|
| A record's own `<sys_id>`, or a reference to another record this package defines | 1,861 | Compliant — deterministic (md5 of a stable key), so identical on every instance the package is imported into |
| The two permitted package literals (`<application>`, `<remote_update_set>`) | 221 | Compliant |
| `sys_atf_step.step_config` — which step type each step is | 180 (14 distinct) | **Unavoidable.** `step_config` is a reference to an out-of-the-box `sys_atf_step_config` row. ATF offers no name-based form in a serialized record, and these are platform-shipped ids, identical on every instance. |
| `sys_variable_value.variable` — which input of that step type a value belongs to | 540 (45 distinct) | **Unavoidable**, for the same reason: the join key is a reference to an out-of-the-box `atf_input_variable` row. |
| Identity references inside a step's own **reference inputs** — the `user` input of `Impersonate` (21) and reference fields inside a `field_values` template (7) | 28 (4 distinct) | **Unavoidable.** A reference input stores a `sys_id` by construction. All four distinct values are the three demo users and the demo group, and **this same Update Set creates those records with exactly those `sys_id`s** (`seed-data/users/*.xml`, `seed-data/groups/*.xml`), so they resolve identically on any instance the package is imported into. Re-counted after the `ATF 03` step-8 rebuild: still 21 `Impersonate` user values across 3 distinct demo users, plus 7 identity references inside `field_values` templates across 3 distinct, = 28 across 4 distinct. |
| Fixture record ids addressed by native steps (`Record`, `Conditions`, `Field values`) | 25 distinct | Compliant — these identify records the test itself creates in its own fixture-setup step, the direct analogue of a record's own `sys_id`. Deterministic, so the native step that follows can address the fixture without ATF's client-side `{{step[…]}}` substitution, which does not resolve on the server-side-only path. |

**Inside script bodies there are now zero identity `sys_id` literals.** Every server-side script that needs an
identity resolves it at run time — `userId('x_casemgmt_demo_manager')` against `sys_user.user_name`,
`groupId('x_casemgmt_demo_team')` against `sys_user_group.name` — and fixture field values carry a
`@user:<user_name>` / `@group:<name>` token that the fixture loop resolves before insert. That is both the rule
the package is held to and the more portable arrangement: the tests keep working even where the demo
identities exist under different `sys_id`s. After that change all 20 tests were re-verified — the 17
server-side tests re-run individually (16 success, `ATF 07` failing as documented **at that time** — it has since
been fixed and is green in `TES0001015`) and the three form-level tests re-run through the client runner (all
three Success, each blocking message additionally observed on the rendered form by hand — the tests themselves
assert the refusal, the non-write and the exact server-side string, not the rendered DOM text — and
`UI Batches Executed` 0 → 3).

> **Superseded — the clean-instance shortfall has been root-caused and fixed.** An earlier revision of this note
> recorded **16 Success / 4 Failure** on a genuinely clean instance (`TES0001010`–`TES0001012`, byte-identical
> verdicts): `ATF 15/16/17` failed at `Open an Existing Record` and `ATF 07` failed on the child-table ACLs. Both
> causes are now understood and fixed, and neither was what this note originally claimed:
>
> - `ATF 15/16/17` were **not** defeated by an ATF fixture-to-form handoff problem. The fixture was always created
>   and always visible. The platform resolves that step's record in **Global** scope via
>   `TestExecutorAjax.validateFormParameters`, and that read was being refused by the table's cross-scope access
>   policy because the package declared the boolean `sys_db_object` access columns as the string `"public"`. See
>   §9.6 **E-ATF15** and **E9**, both rewritten with the measurements that disprove the earlier diagnosis.
> - `ATF 07` was defeated by four child-table ACL conditions that could not compile (`current.case`; `case` is a
>   JavaScript reserved word). See §9.6 **E-ATF**.
>
> **The current, measured expectation for a clean install is 20 ran / 20 Success / 0 Failure / 0 Error / 0 Skipped**,
> evidenced by the current run **`TES0001015`** in §8.3 with 180 of 180 steps Success (and by `TES0001014`, the
> last run made against a fresh re-load of the shipped artifacts). Every earlier "expect 19 success / 1 failure"
> and "expect 16 / 4" statement in this register and in
> [`ATF_MANUAL_TEST_PLAN.md`](./ATF_MANUAL_TEST_PLAN.md) is superseded by that figure; both documents have been
> brought into line with it rather than left to contradict each other.

---

## 9. Clean-instance round trip, regression report and residual manual footprint

> This section records what could only be learned by tearing the application down and re-importing it. It was
> produced by the final unit of the Refine-PR pass, which owns the Section-2 acceptance proof. Every number
> below is a measurement taken on `https://dev379024.service-now.com`, not an expectation.

### 9.1 What "clean instance" meant here, and why

The Refine-PR brief asks for a **fresh PDI import**. Only one instance is reachable: `dev379024`. The
`dev364430` host still named in some of this repository's older documentation is **stale — it returns HTTP 401**,
and no developer.servicenow.com credentials exist in this environment to provision another PDI. "Clean instance"
was therefore implemented as an **application-level clean slate on `dev379024`**: the `x_casemgmt` scope and
every artifact in it were deleted, then the newly exported Update Set was uploaded, previewed and committed.
This is disclosed rather than glossed: it is not a brand-new PDI, and instance-level state (platform version,
plugin set, and the instance properties in §8.2) was inherited rather than reset.

Two consequences follow and neither is a defect:

- The previously validated live state was deliberately destroyed. The standing environment note *"do not re-run
  the deployment; it would disturb the validated state"* was overridden by the brief on purpose.
- **Case numbers and `sys_id`s differ from values quoted in older documentation and screenshots.** Anything in
  this repository citing a specific `CASE…` number from before this pass should be read as illustrative.

`DELETE /api/now/table/sys_scope/{id}` is **not** sufficient at this data volume — it returned
HTTP 500 `Transaction cancelled: maximum execution time exceeded`, removed the `sys_scope` row, and left every
other artifact in place. The teardown had to be staged explicitly (ATF results and `sys_variable_value` rows,
then flows/ACLs/scripts/portal/reports, then the three physical tables children-first, then roles/users/groups,
then the update-set bookkeeping and `sys_metadata_delete` tombstones). Anyone reproducing this should not trust
the single-DELETE cascade described in the deployment instructions.

### 9.2 Before/after preview error counts

| Stage | Errors | Warnings | What it means |
|---|---:|---:|---|
| **BEFORE** — re-import onto the still-populated instance | **42** | 0 | The "before" number the brief asks for. 21 × `Found a local update that is newer than this one` (18 Dictionary, 1 Table, 1 Business Rule, 1 Report — collisions with the live Defect-C rebuild and the bootstrap rule's self-deactivation), 18 × `Could not find a record in x_casemgmt_case for column case` (10 Case Task + 8 Case Party, because none of the packaged demo-case `sys_id`s were present), 3 × `Could not find a record in core_company for column organization`. |
| Clean slate, package as inherited | 559 | 0 | *Worse* on a clean instance, and the finding that mattered. `missing_item_update` was empty on **all 559**, meaning the previewer had credited **no** intra-set provider at all. |
| Clean slate, after deliverable edit 1 | 297 | 0 | All of one kind — `Found a local update that is newer than this one` — now with `missing_item_update` populated. |
| **AFTER** — clean slate, edits applied, local capture purged | **0** | **0** | Worker message `Success!`. Then committed: `previewed → committing → committed`. |

**Headline: BEFORE 42 → AFTER 0**, with the full progression **42 → 559 → 297 → 0** disclosed rather than
reported as a single clean number.

Two root causes were found on the way, and both are worth knowing for the next generation pass:

1. **The previewer indexes intra-set providers by the platform's canonical update name, `<table>_<sys_id>`.**
   All 916 blocks carried human-readable names (`x_casemgmt_case.type`, `ATF 01 - Data model…`, `Case Management`),
   so nothing in the set could satisfy anything else in the set and every cross-reference reported as missing.
   Verified against the instance's own `sys_update_version` history, where platform-written names take exactly
   the canonical form (`sys_app_82b99028936f74320d74d6f88357a5af`). **This is inherited, not introduced by this
   pass** — the pre-refine 148-record package used human-readable names too.
2. **Deleting metadata while a local Update Set is in progress captures DELETE updates.** The staged teardown
   caused 362 canonically-named DELETE rows to be captured into the local "Default" set; once the package's own
   names matched, those newer local rows collided. Purging exactly the colliding local rows (matched by name
   against the retrieved set, so unrelated work on this shared instance was untouched) took 297 → 0.

Mechanics worth recording, because the documented sequence does not work here: the Table-API POST of an
`<unload>` document is rejected (HTTP 400 `Misshaped element`), so upload must be a multipart
`POST /sys_upload.do`; and `sys_remote_update_set.state` is **read-only over REST** — a `PATCH` is silently
reverted — so preview and commit must be driven through `UpdateSetPreviewAjax` and
`com.glide.update.UpdateSetCommitAjaxProcessor` via `/xmlhttp.do` (or from the UI). No browser is required.
Before committing, the platform's own predicate was checked: `state=previewed`, `unresolvedProblems=false`,
`shouldDisplay=true` — i.e. nothing manual sat between preview and commit.

### 9.3 The three edits made to the deliverable in the clean-instance round-trip pass

The package remains **one** file at `update-set/x_casemgmt_case_management_update_set.xml`. The **916 records**
(pre-refine 148; delta +768) counted below are the count as measured in *that* pass. The shipped file now
carries **926** `<sys_update_xml>` blocks (§0.1). The path from 916 to 926 is: a security-review pass removed one
block — the global auto-execute installer trigger, see Defect C in §2 — leaving 913, of which two are
pre-existing drift between this narrative and the file that the pass neither introduced nor rewrote history to
hide; a later pass added 12 (8 portal layout rows, 1 List Layout, 1 UI Policy + 2 policy actions) to reach 925;
and the QA-findings pass added 1 (the Related Lists definition) to reach 926. Every edit was verified to change nothing else: after edit 1 there were **zero**
payload differences and zero differences in any other wrapper field; after edit 2 there were **exactly two**
payload differences and still zero other wrapper-field differences; after edit 3 there were **zero** payload
differences, zero other wrapper-field differences, and **exactly two** `<name>` differences.

1. **Canonical update names.** Every block's `<name>` was rewritten to `<table>_<sys_id>`; 916/916 unique. This
   is what turned the clean-instance preview from 559 errors into a solvable 297 and then 0. It also removed the
   8 duplicate `sys_update_xml.name` values the package previously carried.
2. **The two Scripted REST operation payloads were re-synced from their authoritative artifact files.** The
   packaged `sys_ws_operation` payloads carried **empty `consumes`/`produces`** and a stale 527-character script
   that returned `{result: result}` with no message, while
   `portal/rest/sys_ws_operation_x_casemgmt_case_submit_post.xml` and `…_case_status_lookup_get.xml` carried
   `application/json` and the full ~6.3 KB / ~6.9 KB scripts containing the verbatim strings. Before this edit the
   endpoints returned **HTTP 415** (`Invalid content-type. Supported request media types for this service are: []`)
   and **HTTP 406**; after it they return **201 / 200 / 404** with the verbatim messages. The package retains
   ownership of `sys_id`, scope, package, audit and wrapper fields; only the functional fields were taken from
   the artifacts.

3. **Two Dashboard composite names corrected — a defect introduced by edit 1 and caught by the final static
   sweep.** Edit 1 derived each canonical name from the **first** child element inside `<payload>`. That is
   correct for the 914 single-record blocks, but wrong for the two Dashboard blocks, whose payloads carry nine
   and ten children beginning with `sys_grid_canvas_pane` rather than with the primary `pa_dashboards` record.
   Both blocks were therefore named `pa_dashboards_<sys_grid_canvas_pane sys_id>` — a table name and a `sys_id`
   belonging to two different records. They now read `pa_dashboards_cde4dd9cb243cac3ad196d6a90a678be`
   (Agent Workspace) and `pa_dashboards_6459b19ef618e53a07735c38fc6a1d5c` (Manager View), keyed off the
   `pa_dashboards` record each block actually provides. All 916 names are canonical against a
   primary-record mapping, and all 916 remain unique.

   *Re-verified by preview, not by inspection.* Because the artifact changed after the round trip of §9.2, the
   corrected file was re-uploaded and previewed again. Both blocks resolved to the correct local dashboards —
   `x_casemgmt_agent_workspace` and `x_casemgmt_manager_view` — and their only problem was the expected
   `Found a local update that is newer than this one` collision. No problem anywhere in the set mentioned
   `sys_grid_canvas_pane`, and no `Could not find a record` problem touched either dashboard. That preview ran
   against the instance **with the application already installed** and reported 46 problems: 25 collisions plus
   the **same 21** reference problems described in §9.2 and §9.5 (18 × `x_casemgmt_case for column case`,
   3 × `core_company for column organization`). The 21 is **identical before and after edit 3**, which is the
   evidence that this edit changed nothing functional. It is **not** comparable to the clean-slate **0** in
   §9.2: on a genuine clean slate the two child tables do not yet exist, so the previewer performs no reference
   validation on those columns at all.

   *And proven structurally, so the clean-slate **0** does carry over to the shipped file.* A block's `<name>` is
   used for exactly two things: matching an intra-set **provider** to a consumer, and matching a **local**
   record for the newer-local-update collision check. The two Dashboard composite blocks between them provided
   19 records at the time this was measured (`sys_grid_canvas_pane`, `pa_dashboards`, `pa_tab`,
   `pa_m2m_dashboard_tabs`, `pa_dashboard_widgets` × 8, `pa_dashboard_role` × 3). Every one of the other 914
   blocks’ payloads was searched for those 19 `sys_id`s: **zero cross-block references**. Nothing in the set
   consumes anything these two blocks provide, so their names cannot participate in any intra-set resolution, and
   on a clean slate there are no local records to collide with. Edit 3 therefore cannot change the clean-slate
   preview outcome, and the **AFTER = 0** of §9.2 is attributable to the file as shipped.

   > **The two Dashboard payloads have since been rewritten, and the record inventory above no longer describes
   > them.** Three of those table names do not exist on this release, which is why neither dashboard rendered;
   > §0.5 has the diagnosis and the fix. The rewritten blocks provide **49** records for Agent Workspace and
   > **76** for Manager View (`sys_portal_page`, `sys_grid_canvas`, `pa_tabs`, `pa_m2m_dashboard_tabs`,
   > `pa_dashboards`, `pa_dashboards_permissions`, and a `sys_portal` + 12 `sys_portal_preferences` +
   > `sys_grid_canvas_pane` trio per widget). The structural argument above still holds for them for the same
   > reason — the search of all 924 other blocks for any of the 125 `sys_id`s these two provide still returns
   > **zero** hits (re-run on the current bytes),
   > and the two role references they now carry are *consumed from*, not provided to, the three
   > `sys_user_role` blocks, which is the resolvable direction.

> **Since fixed — the duplicate endpoint identity is gone.** This section previously reported that the artifact
> `portal/rest/sys_ws_operation_x_casemgmt_case_submit_post.xml` carried `sys_id
> e1b7bfa9aff542fa88a645612a73e54c` while the package used `886ad7128907a6351ea04b210c27029e` for the same
> logical endpoint — two identities for one endpoint, functional fields reconciled but the identity left
> unresolved. It has now been resolved in favour of the package's value. The instance settled it: `GET
> /api/now/table/sys_ws_operation/886ad7128907a6351ea04b210c27029e` returns the single live Case Submit POST
> operation, while `…/e1b7bfa9aff542fa88a645612a73e54c` returns **HTTP 404** — that `sys_id` corresponds to no
> record anywhere. The artifact now carries `886ad7128907a6351ea04b210c27029e` as its sole identity, in its
> `<sys_id>`, and the package block's `<name>` and payload agree with it. `e1b7bfa9aff542fa88a645612a73e54c`
> no longer appears anywhere in the deliverable.

### 9.3a Edits made to the deliverable in the packaging-and-schema pass

A later review pass targeted packaging, configuration and schema self-sufficiency. Its changes are recorded here
so that §9.3 is not read as the complete edit history.

> **Record count in this subsection is 916 throughout, because that is what the package held at the time.** The
> shipping count is **926** (§0.1) — the bootstrap-trigger block and its payload were removed afterwards, taking
> it to 913, and two later passes added 12 and 1 more blocks respectively (§0.3b, §0.3c). Every
> "916" below should be read as "all blocks in the package as it then stood"; the gates themselves were re-run on
> the current file and still pass (§0.2). Every one was verified by a four-part static gate suite
run over the whole deliverable: a **structural** gate (single `<unload>` root, 1 descriptor + 916
`sys_update_xml`, the full 18-element wrapper set on every record, unique `<name>` and `<update_guid>`, every
payload parses, canonical `<table>_<sys_id>` naming, and 14 AAP §0.5.2 ordering invariants), a **parity** gate
(all 1181 standalone artifact records compared field-by-field against their embedded payloads), an **embedded**
gate (all 916 payloads parse, all 60 embedded scripts parse), and a **script-copy** gate (the remediation body
ships as three byte-identical copies). All four pass.

| # | Change | Why | Evidence |
|---|---|---|---|
| 1 | **Artifact ↔ package parity brought to exact.** 181 elements normalized across 136 artifact files — `sys_scope` ×170, the REST metadata fields, `number_ref` ×3, `sp_portal.homepage`/`login_page`, `sys_app.source` | The standalone artifacts and the package payloads disagreed on 171 records. A reader could not tell which copy was authoritative, and a regenerate-from-artifacts step would have silently changed the package | Parity gate: **1181 records compared, 0 absent, 0 divergent.** The `flows/` directory is excluded and documented as such — its apparent divergence is an artefact of two same-`sys_id` `sys_hub_flow` children per composite block, and it is owned by a different review lens |
| 2 | **One display field per table, in the package itself** | See §9.6 E7. The package was the *sole* carrier of this defect, because a normal write cannot create multiple display fields — the platform clears the flag on every sibling — so only an Update Set commit, which suppresses business rules, can produce the broken state | 21 dictionary artifacts and their payloads set to `display=false`; live read-back gives `x_casemgmt_case → [number]`, `case_task → [subject]`, `case_party → [role_label]` |
| 3 | **`defaultsort` corrected from `true` to `1`** on `x_casemgmt_case.number` | **`sys_dictionary.defaultsort` is an integer column** (`internal_type=integer` on its own dictionary entry). Writing the string `true` is **silently discarded** — no error, and no `sys_mod_count` increment — so the case list had *no* default sort at all. Measured directly: setting `'true'` left the stored value unchanged, setting `'1'` persisted | Fixed in three places that must agree: the artifact, its payload, and the remediation script's expected value |
| 4 | **Duplicate Scripted REST operation identity resolved** | Two `sys_id`s existed for one endpoint | See the note at the end of §9.3 — the instance returned **HTTP 404** for the artifact's value |
| 5 | **The four REST blocks moved ahead of the portal UI blocks** | AAP §0.5.2 requires the scripted REST records to precede the widgets that call them by URL, and the portal artifacts' own `CROSS-REFERENCES` sections already declared that order — the package was the copy violating it | Relocated by exact line-range move with no reserialization; the sorted multiset of per-block text hashes is **identical** before and after, proving nothing but position changed. The four previously-failing ordering assertions now pass |
| 6 | **The remediation script made fail-closed and semantically convergent** | It could destroy a populated table on an exception, it accepted a surplus of ACL role links, and it treated a field as correct merely because the column existed | See §9.3b |

### 9.3b The remediation script's safety and convergence changes

The script is the only mechanism that can complete Defects C and 9, so its failure modes matter more than its
happy path. Five classes of defect were fixed.

- **It could delete a populated table.** `tableIsPhysical()` mapped **any** exception to `false`, and
  `ensureTable()` then treated `false` as licence to delete every `sys_dictionary` and `sys_db_object` row for
  that table. A transient failure of a privileged call was therefore indistinguishable from "this table has no
  physical storage". It now uses a **tri-state probe**: three independent signals
  (`GlideTableDescriptor.isValid`, `GlideRecord.isValid`, `TableUtils.tableExists`), where a throw or a
  non-boolean answer yields `unknown`, any `yes` yields `yes`, and only unanimous `no` yields `no`. Anything but
  a proven `no` **aborts that table untouched**. Every `deleteRecord()` return value is checked and the
  collection is read back, so a partial deletion aborts rather than continuing. Proven by injection: forcing the
  probe to `unknown` left `sys_dictionary` at 13 rows and `sys_db_object` at 1 row — **nothing was deleted**.
- **It could delete metadata it did not own.** Even with the tri-state probe correct, "this table has no
  physical storage" was still treated as licence to delete *every* row matching `name = <table>`. Absent
  storage says nothing about authorship, and a metadata-only application table is exactly the situation in
  which an administrator or another automation can have authored an extra `sys_dictionary` row — which this
  Global-scope script would have erased silently. Ownership is now **proved before anything is deleted**:
  `inventoryTableMetadata()` classifies every `sys_dictionary` and `sys_db_object` row carrying the table's
  name as either this application's own (an element the package declares — the collection row, the
  `TABLE_SPECS` fields, and the `number` column the platform's number-maintenance rule adds for a declared
  `COUNTER_SPECS` counter — carrying this application's scope **and** package) or the platform's own unscoped
  identity/audit plumbing. An undeclared element, a declared element in a foreign scope or package, two rows
  claiming one element, or a second `sys_db_object` of the same name is reported with its `sys_id` and its
  reason, and the table is abandoned with **nothing deleted**. The follow-on delete addresses rows by
  **primary key**, restricted to that inventory, so a row that appears mid-purge is not swept up by a stale
  selector; it surfaces as residue and aborts the rebuild before the fresh insert. `ensureField()`'s
  single-row delete carries the same guard. The allowed element set is **derived** from the package's own
  declarations, so it cannot drift from the schema. Proven by injection over the shipped body with stubbed
  Glide APIs, against row shapes read from the live instance: on a clean install the three tables purge
  21 / 14 / 13 dictionary rows plus one table row and re-insert, while a surplus column, a foreign-scoped
  column, a scope/package mismatch, a duplicate element, a duplicate table row and an unresolvable
  application scope each delete **0 rows and insert nothing**, reporting the offending `sys_id`.
- **It accepted over-privileged ACL links.** Verification failed only below 27 links, so 28 passed — meaning an
  extra `(write ACL, viewer)` pair would have been accepted silently. It now builds the **exact expected pair
  set** from the ACLs' own `<roles>` declarations, requires equality, deletes extras with verified deletes, and
  asserts both `total === 27` and the per-role distribution manager 14 / agent 10 / viewer 3.
- **It called a field "correct" if the column merely existed.** Type, length, mandatory, read-only, display,
  unique, reference target, default value and active were never compared, so a wrong `max_length` or a missing
  default survived. It now compares and repairs **12 dictionary attributes** and **4 choice attributes**, and
  verifies the choice configuration as an **exact set** — 7 lists and 24 values, failing on a missing *or* an
  unexpected value. Missing authoritative defaults were also added (`case.status=Draft`, `case.priority=Medium`,
  `case_task.status=Open`).
- **Its header described an execution contract that did not hold.** It claimed no human step beyond
  upload → preview → commit, and that running the Fix Script from the UI was equivalent to a global background
  run. Neither is true (§9.4). The header now states the one route measured to work.


### 9.4 Did the auto-execute trigger fire? Yes — it could not succeed, and it has since been removed

The brief requires this to be answered from evidence, so the evidence is reproduced in full. Read it as
**history with a security lesson**, not as a description of what the current package does: **the trigger is no
longer in the package** (§0.7), so a commit of the shipping bytes produces none of the lines below. The trigger
**did fire** when it was shipped. Verbatim, from `syslog` (source `x_casemgmt`, 143 marker rows in the commit
window):

```
X_CASEMGMT_REMEDIATION|BOOTSTRAP|fired|remote_update_set=x_casemgmt_case_management v1.0.0|state=committed|scope=x_casemgmt|dispatching Fix Script "x_casemgmt Post-Import Remediation"
X_CASEMGMT_REMEDIATION|START|post-import remediation|scope_context=x_casemgmt|…
X_CASEMGMT_REMEDIATION|SUMMARY|verified=false|tables_built=0|tables_already=0|fields_created=0|fields_already=0|choices_created=0|choices_already=0|counters_written=0|counters_already=3|number_default_written=0|number_default_already=1|service_ids_written=0|service_ids_already=2|acl_links_created=0|acl_links_already=0|acl_links_total=0|acl_links_expected=27|security_cache_flushed=false|errors=121
X_CASEMGMT_REMEDIATION|BOOTSTRAP|dispatch complete for "x_casemgmt Post-Import Remediation"
```

Note `scope_context=x_casemgmt`, not global. All 121 errors are of exactly two kinds:

```
java.lang.SecurityException: GlideTableDescriptor is not allowed in scoped applications
java.lang.SecurityException: GlideSecurityManager is not allowed in scoped applications
```

**Why automation was not achievable.** The package shipped both the Fix Script and the bootstrap Business Rule
with `sys_scope=global` — it still ships the Fix Script that way, and no longer ships the rule at all — but
**the commit engine forces every committed record's `sys_scope` to the Update Set's application.** Reading the records back after commit confirms it: the Fix Script's `sys_scope` is
`82b99028936f74320d74d6f88357a5af` (its `sys_package` is still global), and the bootstrap rule is app-scoped,
`active=true`, on `sys_remote_update_set`, `when=after`, `order=1000`,
`condition=current.state.changesTo('committed')`. The remediation needs `GlideTableDescriptor` (to materialise
physical storage) and `GlideSecurityManager` (to flush the security cache); both are unavailable to scoped
execution. So the trigger cannot be made to work by packaging it differently — the rewrite happens at commit
time regardless of the packaged scope. The rule correctly left itself active, because it only deactivates on
`verified=true`; after the manual run it deactivated itself, exactly as designed.

**Why it was removed rather than shipped inactive.** Two reasons, and the second is the decisive one. (1) It can
never complete, so its only possible effect on a real install is to write `verified=false` marker lines that
invite an operator to believe the remediation ran. (2) Its condition — `current.state.changesTo('committed')` on
`sys_remote_update_set` — matches the commit of **any** retrieved Update Set on the instance, not just this
application's. A global, `order=1000`, after-update rule with that condition would dispatch privileged and partly
destructive remediation on **unrelated** deployments the moment anyone committed anything. Shipping it
`active=false` mitigated but did not remove that hazard, because a re-import re-arms a global record. It is
therefore deleted from the package altogether. The remediation script retains a `deactivateBootstrapTrigger()`
routine whose only job is to quiet a **legacy** copy on an instance that received an earlier revision, and to
refuse to touch any similarly-named rule it cannot positively identify as this package's own.

E and 7, by contrast, need no script at all — they are carried by the artifacts — and were confirmed present
and correct on the clean install (`counters_already=3`, `number_default_already=1`, `service_ids_already=2`).

### 9.5 Residual manual footprint, per defect, with the precise step

Everything that could be automated is in the package. What remains, in the order it must be performed:

| # | Defect | What is missing after upload → preview → commit | Precise step | Why automation was not achievable |
|---|---|---|---|---|
| 1 | **C** — physical schema | `sys_db_object` metadata exists but has **no physical storage**; REST returns 403; 0 `sys_choice` rows for all 7 choice lists; inserts fail with `invalid table name` | **Run `scripts/post_import_remediation.js` in scope Global — that is the whole step.** It performs the `sys_db_object` deletion and the rebuild itself. Re-measured on a clean install of the final package: from Global alone it reported `clean slate\|dictionary_rows_removed=14\|db_object_rows_removed=1\|residue=0\|reusing_sys_id=yes` for each table, the platform emitted its DDL (`Creating table:`, `DBTable.create() for:`, `ALTER TABLE x_casemgmt_case ADD number VARCHAR(40)`), and all three finished `built\|signals=...isValid=yes,...isValid=yes,...tableExists=yes` with `tables_built=3, fields_created=25, choices_created=24`. **No application picker was set at any point.** An earlier revision of this row required setting `apps.current_app` first and REST-DELETEing the three rows by hand, on the basis that `DictionaryUtils.isDeletable()` refuses from Global; that is retained below as a fallback only | The DDL comes from the platform's `Synch Dictionary and Table` business rule, which the commit engine suppresses; and the remediation cannot run from the auto-execute path because commit rewrites its scope (§9.4). `sys_db_object` deletion is gated by `DictionaryUtils.isDeletable()` → `_isItemInUserScope()`, which refuses from Global, while the cross-scope policy on `sys_db_object` refuses from the app scope — the application-picker route is the only one that works |
| 2 | **C**, second pass | Deleting the three `sys_db_object` rows **cascades away all 26 ACLs** | **Upload → preview → commit the same Update Set a second time.** This preview reports ~21 `Could not find a record in x_casemgmt_case for column case` / `…core_company for column organization` problems, because the tables now exist but are empty — accept those (`status=ignored`). **On collisions, read this carefully:** the rule "never ignore a collision" still holds for every table EXCEPT `sys_dictionary`. Re-measured on the final package, this preview reported 46 problems = 25 collisions + the 21 references, and **all 25 collisions were `sys_dictionary` rows the remediation had written moments earlier**. The original caution existed because ignoring them used to discard the hand-repaired display fields; the package now carries the corrected `display` and `defaultsort` values itself, so accepting the remote is the correct action there, and the step-3 remediation re-verifies afterwards. Note that on this platform `status='ignored'` means *ignore the problem and apply the incoming record*; the only other choices are `skipped` and `skip_collision`. The second commit restores the 26 ACLs, the seed rows, the users and the role grants | A consequence of step 1, not avoidable while the DDL must be produced by a table rebuild |
| 3 | **9** — 27 ACL role links | 26 ACLs with **0** role links. On this high-security instance an ACL with no role, no condition and no script evaluates to **deny**, which makes the application unusable | Run `scripts/post_import_remediation.js` in scope **Global** again. Expected on the `SUMMARY` line: `verified=true`, `acl_links_created=27`, `acl_links_total=27`, `acl_links_expected=27`, `security_cache_flushed=true`, `errors=0`. The script also emits a `TRIGGER` line; on the current package it reports that no bootstrap rule was found, which is correct — the rule was removed and the code path is only a defensive leftover. Do not wait for a deactivation message | `sys_security_acl` has no `roles` column and `sys_security_acl_role` link payloads are silently discarded by the commit engine (5 payload shapes tested, §2 Defect 9). The creating script cannot auto-run for the reason in §9.4 |
| 4 | ~~**E7** — one display field per table~~ **NO LONGER MANUAL — now carried by the package** | Nothing. This step is retained with its original number so that existing references to "§9.5 step 4" still resolve | **No operator action.** Previously the operator had to reduce each table to one display field by hand, because all three arrived with `display=true` on nearly every column (13 of 14 on `x_casemgmt_case`) while ServiceNow permits exactly one — so every reference **to** a case rendered blank. Both carriers of the defect are now fixed: the 24 `dictionary/*.xml` artifacts and their Update Set payloads ship `display=false` on all but one column per table (`x_casemgmt_case` → `number`, `x_casemgmt_case_task` → `subject`, `x_casemgmt_case_party` → `role_label`), and `post_import_remediation.js` no longer sets `display: true` on every field it creates. The script additionally **reconciles** the flag after its field loop and **verifies exactly one display field per table**, failing the run if that does not hold | Now fully automated. Two platform behaviours had to be understood first: (a) a normal write that sets `display=true` on one column **silently clears it on every sibling**, so multiple display fields can only ever be *created* by an Update Set commit, where business rules are suppressed — which is why the package was the sole carrier; and (b) the reconciliation therefore has to run once per table after all fields are settled, not per field. Verified by injection: forcing `display=true` onto a non-display column was detected by attribute and value and repaired in a single pass |
| 5 | **E1/E2 — FIXED in the shipping bytes** | *Was:* the packaged seed rows committed with **`number` empty on all 10 demo cases** and dangling parent references, and they **blocked the app's own seed script from repairing them**. *Now:* all 28 seed rows carry pinned deterministic numbers (`CASE9000001`+, `TASK9000001`+, `PARTY9000001`+) and the `case` / `organization` references travel as a `display_value` attribute with an empty body, so nothing dangles | Run `scripts/seed_demo_data.js` in scope `x_casemgmt`. **Do not delete the packaged rows first** — the script now ADOPTS them by pinned number and fills only the columns that are still empty. Measured on a live PDI: first run `adopted=10/10/8`, second run `repaired=0`, no duplicates |
| 6 | Instance prerequisites (not package artifacts, deliberately not captured) | — | `sn_atf.runner.enabled = true` to run the ATF suite (it survived this teardown). `sn_atf.headless.enabled = false` and cannot be enabled here, so `/atf_test_runner.do?sysparm_nostack=true` must be open in a browser before launching the suite. The three demo personas have **no password** by design and can only be exercised through admin **UI Impersonation** | These are instance test-harness settings, not application configuration; capturing them into the Update Set would be a global write |

**One step was added to this list by the QA-findings pass, and it applies only in one circumstance.**

| # | Item | What is missing after upload → preview → commit | Precise step | Why automation was not achievable |
|---|---|---|---|---|
| 7 | Related-list cache (§4 item 17) | **Only on an instance that had already rendered the case form before the definition arrived.** The `sys_ui_related_list` and its two entry rows commit correctly and read back correctly, and *Configure ▸ Related Lists* shows both lists as Selected — but the form's `#related_lists_wrapper` still measures **0 px** and the browser issues no related-list request, because the server caches a form's related-list set and the import does not invalidate it. On a genuinely clean instance this step is **not needed** | Open a case record → context menu → **Configure ▸ Related Lists** → press **Save** without moving anything. The lists appear on the next load. `deployment.md` step 12 has the operator-facing version | There is no supported API that invalidates this cache. A REST `PUT` of the same values is a no-op and dirties nothing; the slushbucket's own processor deletes and reinserts through the invalidating path, which is why pressing Save works and why it **replaces all three `sys_id`s** |

**Acceptance path: (b), not (a).** The package contains everything that could be automated. E and 7 are fully
self-sufficient. **C and 9 ship the remediation *body* — the Fix Script record and `../scripts/post_import_remediation.js`
— and nothing that executes it.** There is no trigger and no auto-execute record of any kind in the package (§0.1,
§0.7): the bootstrap Business Rule that once dispatched the remediation on commit was built, measured firing,
measured failing with 121 `SecurityException`s, and then deleted, and running the shipped Fix Script from the Fix
Script UI does not work either because the commit engine rewrites the record's scope. **So nothing fires on
commit.** The body converges only when an operator invokes it manually from *System Definition → Scripts -
Background* with **"In scope" = Global**, and it was measured doing exactly that in the §9.5 sequence:
`verified=true`, `acl_links_total=27`, `errors=0`. Even then it cannot complete in a single pass for a measured
platform reason — rebuilding the tables cascades the ACLs away, which is why the procedure is two commits with a
remediation run between and after them. The footprint above is the smallest one achievable in this build
environment, and it is disclosed rather than assumed away.

### 9.6 Additional defects found by the round trip — recorded as the honest current state

None of these was introduced by the pass that found them, and none was within the Refine-PR scope to repair at
that time (they are not Defect F, not Defects C/E/7/9, and not the ATF suite). They are recorded here so they are
not lost — and, as the ✅ markers show, most have since been repaired by later passes. **E5** (dashboards) and
**E8** (related lists) were closed by the QA-findings pass of §0.3c; the only rows in this table that are still
open are **E2** (the dangling `sys_user_grmember.group` literal, repaired operationally by the seed script).

| Ref | Defect | Evidence | Effect |
|---|---|---|---|
| **E1** — **FIXED** | *Was:* packaged `Case Record` payloads omitted the `number` element entirely, so all 10 demo cases committed with `number` empty while `x_casemgmt_case_task.case` and `x_casemgmt_case_party.case` held the literal string `"CASE0000008"` and `case_party.organization` held `"Synthetic Org Beta"` — reference bodies the import engine never resolves. *Now:* every seed payload carries a pinned `<number>`, and every `case` / `organization` reference carries its key in the `display_value` attribute with an **empty** body (the only shape Update Set preview accepts for a target created by the same set) | The columns arrive empty rather than dangling, and `scripts/seed_demo_data.js` adopts each row by its pinned number and fills them by key lookup. `sys_user` / `sys_user_group` references (`assigned_group`, `assigned_agent`, `assigned_to`, `person`) keep their key in the body and arrive already linked, because the import engine does resolve those | Case↔task and case↔party relationships are complete after the documented post-commit seed step; preview reports **zero** `Could not find a record` problems (was 21 package-intrinsic) |
| **E2** | `sys_user_grmember.group` is a dangling literal (`group_raw=x_casemgmt_demo_team`, `is_sys_id=false`, empty display value) while the `user` side resolved correctly | `gs.getUser().isMemberOf()` can never match | The **group branch** of the agent's read/write ACL is inert, so "Assigned only" collapses to the `assigned_agent` branch (7 rows instead of 9). Repaired by the seed script, which creates a correct membership; the bad row must be deleted |
| **E3** — ✅ **FIXED** | Was: `sys_ui_action.condition` is `condition_string`, **max length 254**, and four conditions exceeded it and were silently truncated mid-expression on import: `x_casemgmt_case_start_progress` (264), `_set_pending` (271), `_resume` (267), `_resolve` (271) — the Resolve condition ended `…isMemberOf(current.assigned_grou`. A truncated condition cannot evaluate, so the guard **failed open with no syslog error**, and exactly those four buttons rendered on all six statuses for `admin`, for `Demo Agent` and for the read-only `Demo Viewer`, who has no write ACL, a fully read-only form and no Update button. The two short-condition actions (`_open` 76, `_close` 79) always behaved correctly. **A second root cause, measured while fixing it: `sys_ui_action` has NO `roles` column on this release** — UI Action role restrictions live in the m2m table `sys_ui_action_role` (which holds rows for out-of-box actions and **0** for ours) — so the `<roles>` element in these payloads is inert on import and the `condition` was the only guard the platform was honouring | Now: the expression lives in `x_casemgmt.CaseTransitionValidator.canShowAction(caseGr, requiredStatus)` and each of the four conditions is the call `new x_casemgmt.CaseTransitionValidator().canShowAction(current, '<status>')` — **71, 78, 74 and 78 characters**, all far inside the limit and no longer truncatable. The method implements the identical rule (required status AND (manager OR (agent AND (assigned_agent = me OR member of assigned_group)))) and fails **closed** on a missing record or missing status. Fixed in the four `ui_action/*.xml` files, in `script_includes/x_casemgmt_CaseTransitionValidator.xml` and in all five matching Update Set payloads | **Resolved, and re-measured on the live instance as an 18-cell matrix** (3 identities × 6 statuses, 18 read-only form loads): every button now appears only on its own source status — `Open`→Draft, `Start Progress`→Open, `Set Pending`+`Resolve`→In Progress, `Resume`→Pending, `Close`→Resolved — a Closed case shows none of the six for any identity, `Demo Agent` never sees the manager-only `Open`/`Close` (on the Resolved case where it is the assigned agent the header is `Update` only), and **`Demo Viewer` sees zero of the six on every status and no `Update` button** (`.form_action_button` count literally 0). The overflow "additional actions" menu was enumerated per cell and holds only platform items, so nothing is merely relocated. 18/18 cells match. This closes what §10.2 item 7 planned |
| **E11** — ✅ **FIXED** | The `Set Pending` UI Action was **100% non-functional**. Its client half ended `gsftSubmit(null, g_form.getFormElement(), 'sysverb_x_casemgmt_case_set_pending');` — the `sysverb_` prefix is reserved for the platform's own stock verbs, so the lookup could never resolve a custom action. The platform answered `Unable to find UI Action with name 'sysverb_x_casemgmt_case_set_pending' on table 'x_casemgmt_case'`, `serverSetPending()` was never reached and `sys_mod_count` stayed **0** on every attempt. The client-side allow-list *did* work (an invalid reason produced `Pending reason must be one of: Awaiting Info, Awaiting Third Party, Other.` and issued no POST), which is precisely what masked the failure in a demo | The third `gsftSubmit` argument is now the unprefixed `action_name` `x_casemgmt_case_set_pending`, matching the pattern the working actions use, with a `*** DO NOT PREFIX THIS WITH sysverb_ ***` block quoting the platform's own error so it is not "simplified" back. Fixed in `ui_action/x_casemgmt_case_set_pending.xml` and its Update Set payload | **Resolved, verified at runtime.** Clicking `Set Pending` on an `In Progress` case now issues `POST /x_casemgmt_case.do → 302`, and after a genuine full-navigation reload the case reads `status = Pending`, `pending_reason = Awaiting Third Party`. The string `Unable to find UI Action` did not appear once in the session (checked four independent ways: live MutationObserver on `document.body.innerText`, an offline scan of 455 archived console entries, an explicit DOM probe after every click and reload, and the CDP console list). The client-side guard is unweakened: an invalid reason still raises the 74-character allow-list error and `gsftSubmit` is provably never called |
| **E12** — ✅ **FIXED** | **The transition graph was not enforced — only the target status's precondition was.** `enforce_forward_transitions` (order 250) dispatched purely on `proposedStatus`, and each subflow validated only that target's requirement, so nothing validated the `previous → current` edge. All **8** illegal skip/backward edges were accepted on both case types: `Draft→In Progress`, `Draft→Resolved`, `Draft→Closed`, `Open→Resolved`, `Open→Closed`, `Pending→Resolved`, `Resolved→In Progress`, `Resolved→Open`. Because the status select offers all six values on every record, `Draft→Closed` was reachable by any ordinary user through the form, in one save, with **zero** banners — landing a case in the terminal state unassigned, with open work, and with **`closed_date` empty** (order 500 keys on the `Resolved→Closed` edge), which also removed it silently from the *Average Time to Close* aggregate | `x_casemgmt.CaseTransitionValidator.validateTransitionEdge(prev, next)` now holds the adjacency list as the single definition for the whole application, and BR250 consults it as **STEP 0** — after its abort-state guard and its unrecognised-target allowlist (so those messages are untouched) and before the synchronous subflow (so an illegal edge costs milliseconds). An INSERT and a status-unchanged save are never judged against the graph; an unrecognised *source* status fails closed. Fixed in `script_includes/x_casemgmt_CaseTransitionValidator.xml`, `business_rules/x_casemgmt_enforce_forward_transitions.xml` and both Update Set payloads | **Resolved, verified at runtime.** 16/16 attempts (8 edges × 2 case types) are refused with HTTP 403 attributed to `x_casemgmt_enforce_forward_transitions`, `sys_mod_count` 0 on every fixture. Form-driven: `Draft→Closed` surfaces `A case cannot go from Draft to Closed. From Draft the only valid next status is Open.` (85 chars) and `Draft→Resolved` its 87-char equivalent, both with `#output_messages` losing `outputmsg_hide`, and after reload the case is still `Draft` with `closed_date` empty. The positive control — the legal `Draft→Open` — still commits with zero banners |
| **E13** — ✅ **FIXED** | **`Closed` was not terminal for anything but `status`.** `validateNoBacktransition` guards `prev === 'Closed' && next !== 'Closed' && next !== ''`, so a save that left `status` alone committed silently on a Closed case: `priority Medium→High`, a `subject` rewrite and clearing `assigned_agent` all persisted, through the form and through the Table API (HTTP 200, `sys_mod_count` 0→3). The platform was telling the user *Closed cases are terminal and cannot be modified.* while the row was freely editable, and four in-scope documents described the stricter behaviour | `block_terminal_closed` (order 100) now chains `validateClosedRecordUnchanged(current, previous)` after the status check. It compares the 13 application columns, normalising empty to `''` so a cleared field counts as a change, and deliberately excludes every `sys_*` column and the virtual `duration_to_close` — which is what keeps a genuine no-op save (Update pressed with nothing edited) working. Fixed in `script_includes/x_casemgmt_CaseTransitionValidator.xml`, `business_rules/x_casemgmt_block_terminal_closed.xml` and both payloads | **Resolved, verified at runtime.** REST: `priority`, `subject` and clearing `assigned_agent` on a Closed case all return **403** with `sys_mod_count` unchanged and `closed_date` byte-stable; a true no-op returns 200 and still writes nothing. Form: changing only `priority` on a Closed case (status verifiably untouched) surfaces `Closed cases are terminal and cannot be modified.` at **49** chars and `priority` is still `Medium` after reload |
| **E14** — ✅ **FIXED** | **`duration_to_close` returned EMPTY for every Closed case**, including demo `CASE0000984` (an 18-day span) and `CASE0000988`. It is the `aggregation_source` of the *Average Time to Close* single-score report, so that widget had no data to average | Root cause measured by comparison with the platform's own function fields (`pa_dm_task_telemetry.duration`, `cmdb_data_management_policy_execution.execution_time`): a `function_field` must have **`virtual = false`** — the DB computes the expression at query time — and ours shipped `virtual = true`, which makes the platform treat the column as a script-backed virtual field with no calculation and therefore always empty. The `glidefunction:datediff(closed_date,opened_date)` argument order was already correct (the OOB pattern is `datediff(end, start)`; swapping it was tested and produced nothing). Fixed in `dictionary/x_casemgmt_case_duration_to_close.xml` and its payload | **Resolved, verified at runtime.** With `virtual=false` the field returns real durations immediately: `CASE0000984` → **18 Days**, `CASE0000988` → **14 Days**, and a case closed during testing rendered `50 Minutes (00:50:06)` on the form, exactly matching its `closed_date − opened_date`. The *Average Time to Close* report now aggregates over populated values |
| **E4** — **FIXED** | *Was:* UI Policy `x_casemgmt_case_party_conditional_fields` applied correctly at form **load** but never re-evaluated on change, so on a new Case Party neither reference field ever appeared and a polymorphic party could not be completed through the form. Root cause: the condition `party_typeISNOTEMPTY^ORparty_typeISEMPTY^EQ` is a tautology that never transitions, there were **zero** `sys_ui_policy_action` rows, and all logic sat in `script_true` with `reverse_if_false=false`. *Now:* two declarative policies — one per value — each owning exactly one field through a `sys_ui_policy_action` (`visible=true`, `mandatory=true`), both `reverse_if_false=true`, `on_load=true`, `run_scripts=false`, scripts empty. Because each policy owns one field, ordering is irrelevant and the empty state is deterministic. Verified in a browser with real mouse interaction (`isTrusted:true`, and `g_form.setValue` instrumented to prove it was never called): empty → both hidden; Person → `person` visible + mandatory, `organization` hidden; Organization → the exact mirror; correct at load on existing `PARTY0000159` / `PARTY0000160`; submitting with the shown field empty blocks with the platform literal `The following mandatory fields are not filled in: Person`; and a party was created end-to-end through the form. **Note:** `sys_ui_policy` and `sys_ui_policy_action` **CREATE is refused from scope `x_casemgmt`** (UPDATE is allowed), so the new rows must be deployed from Global — they still inherit the app's `sys_scope` / `sys_package`. |
| **E5** — ✅ **FIXED** (was: re-measured and WIDER than first recorded) | *Was:* each Dashboard composite block used **three table names that do not exist on this release**: `pa_tab` (real name `pa_tabs`), `pa_dashboard_widgets` (real name `pa_widgets`) and `pa_dashboard_role` (no equivalent) | `GET /api/now/table/pa_tab` → **HTTP 400 `Invalid table pa_tab`**; `pa_dashboard_widgets` → **HTTP 400**; `pa_dashboard_role` → **HTTP 400**; while `pa_tabs` → 200 (26 rows), `pa_widgets` → 200 (167 rows) and `sys_grid_canvas_pane` → 200 (121 rows) all resolve. `sys_db_object` holds `pa_tabs`, `pa_widgets` and `sys_grid_canvas_pane`, and no `pa_tab`. Both `pa_dashboards` rows commit and are live; the children do not — **0** `sys_grid_canvas_pane` rows on either canvas and **0** `pa_widgets` in scope `x_casemgmt`. Rendered: **0 tabs, 0 widgets**, empty state "Add widgets using the widget picker.", **0 console errors, 0 non-2xx** | Neither dashboard renders anything, and validation gate 6 fails. The PDI capability is present — the out-of-box "Incident Management" dashboard renders 6 widget cards with 4 live charts in the same session, and the scoped report *All Cases by Status* draws a live chart from the real case rows (10 at the latest measurement) — so this is a **multi-element packaging defect in the deliverable**. **An earlier revision of this row called it a one-element defect fixable by renaming `pa_tab`; that was measured and is wrong** — the platform auto-created an empty `pa_tabs` row on first view and both dashboards stayed blank, because the widget and pane records never land either. **Pre-existing**: `dashboards/pa_dashboards_x_casemgmt_*.xml` were byte-unchanged since the pre-refine commit, so no unit of the pass that found this introduced it. **Now fixed.** Both artifacts and both payloads were re-authored onto the real chain — `sys_portal_page` + `sys_grid_canvas` + `pa_tabs` + `pa_m2m_dashboard_tabs` + `pa_dashboards` + `pa_dashboards_permissions` + one `sys_portal` / 12 `sys_portal_preferences` / `sys_grid_canvas_pane` trio per widget (49 records for Agent Workspace, 76 for Manager View) — and the three non-existent tables removed. **Verified at runtime: 3 of 3 and 5 of 5 widgets render with live data**, correct chart types, zero console errors, persona-verified across all 6 (persona, dashboard) pairs with the two that must be refused still refused. The platform's two auto-created empty `pa_tabs` rows were deleted so live state equals a clean import. §0.5 carries the values; §0.3c carries the packaging delta. Closes §10.2 item 9 |
| **E7** — ✅ **FIXED, both carriers** | Was: 13 of 14 `x_casemgmt_case` dictionary entries carried `display=true` (also 6 of 6 on `case_task`, 5 of 5 on `case_party`), in the packaged blocks **and** in `post_import_remediation.js`. Now: the 24 dictionary artifacts and their payloads ship `display=false` except one column per table, and the script sets `display: true` only on `case.number` / `case_task.subject` / `case_party.role_label`, reconciles the flag per table, and **verifies exactly one display field per table** | Was: `getDisplayValue('case')` returned `""`; the `Case` column showed "(empty)" on every task and party row. Now: the package itself yields one display field per table on commit, and the script's verification fails the run if it does not | Resolved. No longer a residual manual step — see §9.5 step 4, retained only so existing cross-references resolve |
| **E8** — ✅ **FIXED** | *Was:* AAP §0.4.4's **Related Lists were never authored** | *Measured before the fix:* `sys_ui_related_list` held **0 rows** for `x_casemgmt_case` and 0 for every other table in the app — against **1,545** rows instance-wide and 4 for `sys_user_group`, so the emptiness was a real absence and not a query artifact. On a real case record (2 task rows and 1 party row of its own) the form's **`#related_lists_wrapper` measured exactly 0 CSS pixels** (`offsetHeight`/`clientHeight`/`scrollHeight` all 0, computed `height: 0px`, class `tabs2_wrapper_default tabs_disabled`, its only child a `<script>`), `#tabs2_list` has **0 children** and `display: none`, and the form does not scroll. Same measurement on an out-of-box `sys_user_group` record: **196.656 px** and **288.625 px** with tabs "Roles (1)" / "Group Members" / "Groups" and 1 and 4 visible rows. Not a load-timing artifact: related-list load timing is `default`, no "Load related lists" affordance exists, the platform already fired `related_lists.ready`, and no related-list fetch is issued at all. Not a script or network failure either: 0 console errors, 0 non-2xx. No `sys_ui_related_list`/`sys_ui_form`/`sys_ui_section`/`sys_ui_element` artifact exists in the repository or the package (only 1 `sys_ui_policy` and 6 `sys_ui_action`) | AAP §0.4.4 requires related lists for `case_task` and `case_party` on the case form; without them a user cannot see or add a case's tasks or parties there. **Now authored and verified.** `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` ships one `sys_ui_related_list` (Default view) plus two `sys_ui_related_list_entry` rows — `x_casemgmt_case_task.case` at position 0, `x_casemgmt_case_party.case` at position 1 — as one added update-set block. The entries ride inside the definition's payload because `sys_ui_related_list_entry` has no super class and therefore no `sys_update_name`. Measured on `CASE0000981`: wrapper **227.3125 px** (was 0), class `tabs_enabled`, sections **Case Tasks (2)** then **Case Parties (2)**, rows `TASK0000276` / `TASK0000277` and `PARTY0000159` / `PARTY0000160`; identical 227 px for admin, agent and viewer; agent gets a **New** button per list, viewer none; zero console errors. **One install caveat that is easy to mistake for a failed fix:** on an instance that has already rendered the form the rows alone do nothing until *Configure ▸ Related Lists* is opened and **Saved** once — and that Save replaces all three `sys_id`s (§0.6.2, §4 item 17). Closes §10.2 item 6 |
| **E8-P** — **FIXED** | *Was:* the Service Portal **layout** records were never authored, so `GET /api/now/sp/page` returned HTTP 200 with `containers: []` for all three routes and both pages rendered blank, even though `sp_portal`, both `sp_page` records and all three `sp_widget` records were present and correct. The two `sp_page` artifacts encoded their layout in a `<page_internal>` JSON element, plus `<description>` and `<hide_for_kb>` — **none of which are columns on `sp_page` on this release**, so all three were inert. *Now:* `portal/layout/sp_page_layout_x_casemgmt_case_submit.xml` and `…_case_status.xml` ship one `sp_container` → `sp_row` → `sp_column` → `sp_instance` chain per page (8 records, deterministic sys_ids, `sp_instance.sp_widget` resolved to the widget rows), the three inert elements were removed, and a second defect was fixed in both widgets: they read `response.data.number` / `response.data.status`, but a Scripted REST response nests the body under `result`, so a **201 rendered "Submission failed"** — both now unwrap defensively. `GET /api/now/sp/page` returns non-empty `containers` for both routes and both pages render and function anonymously (§0.3b). |
| **E-ATF** — ✅ **FIXED** | The four scoped **child-table** ACL conditions dereference `current.case`, and `case` is a JavaScript reserved word | `Javascript compiler exception: missing name after . operator (sys_security_acl.1ea69bf11f64a85ddf0c7e970779fefe; line 2)`, plus `AccessTerm: Slow ACL … for the path record/x_casemgmt_case_task/read`. Caught by **ATF 07** | `x_casemgmt_case_task` read+write and `x_casemgmt_case_party` read+write **deny every row** for the agent. The parent-table ACLs are unaffected. **Fixed.** All four conditions now use `var caseElement = current.getElement('case');` and dereference the parent through `caseElement.nil()` / `caseElement.getRefRecord()`. `getElement('case')` was chosen over `getValue('case')` because it is the accessor measured to work for every operation the conditions need: a scoped probe confirmed `t.case` fails to compile at all, while `t.getElement('case')` returns the reference, `.getRefRecord()` resolves it (read back as `CASE0000594`) and `.nil()` answers correctly. Each of the four files carries a `*** RESERVED WORD — DO NOT SIMPLIFY THIS BACK TO current.case ***` block quoting the compiler error, and the comment prologues of all 12 ACL files were swept so none illustrates the mechanism with a non-compiling accessor. **Measured before/after on the live instance:** the agent could see 0 task rows and 0 party rows; it now sees 10 tasks and 8 parties with `canWrite=true, canDelete=false`. `ATF 07` went from red to green and now asserts 58 checks across five parents (both-branch, direct-only, group-only, unassigned, non-member-group) with their task and party children. Confirmed green in the full suite run `TES0001014` |
| **E-ATF15** — ✅ **FIXED; THE ORIGINAL DIAGNOSIS IN THIS ROW WAS WRONG** | `ATF 15/16/17` failed on a clean instance at step 3 `Open an Existing Record`: `Table 'x_casemgmt_case' does not have a record with id '…'` | **The earlier "ATF server-fixture → client-form handoff" explanation was disproved by measurement and is retracted.** Replicating the step-1 fixture exactly in scope `x_casemgmt` returned the pinned `sys_id` and the row read back as `CASE0000598`, so the fixture *is* created and *is* visible — the handoff was never the problem. The platform's own `step_execution_generator` for step config `Open an Existing Record` (`5f2e0e535332120028bc29cac2dc34d3`) maps the `invalid_sys_id` reason to that exact message, and it is produced by `ATFFormStepExecutor` → GlideAjax → the Script Include `TestExecutorAjax.validateFormParameters`, **which runs in Global scope** and does a plain `new GlideRecord(formTable).get(sysId)`. That read was being refused: *"Read operation against 'x_casemgmt_case' from scope 'rhino.global' has been refused due to the table's cross-scope access policy."* So the true cause is the same one as **E9** — the boolean cross-scope access columns on `sys_db_object` were declared as the string `"public"` and therefore landed **false** | **Fixed at the root cause, not worked around.** The step needs a cross-scope **read**, so `ws_access` and `read_access` are emitted as boolean `true` in all three `tables/*.xml` files and their three Update Set payloads. `create_access`, `update_access` and `delete_access` are emitted as boolean **`false`** — a security-review correction to the first version of this fix, which opened all five: an open write column let any Global-scope caller mutate these tables with a plain `GlideRecord`, which no ACL filters (measured: a Global insert, update and delete against `x_casemgmt_case` all succeeded). Closing them changes nothing about this row's defect, because `TestExecutorAjax.validateFormParameters` only reads. (`alter_access`, `client_scripts_access` and `configuration_access` are explicitly `false`; `access` stays the string `public`, being the only string column.) `post_import_remediation.js` no longer assigns `'public'` to boolean columns and now reconciles all eight on every run — opening what must be open and closing any write column it finds open — including the already-physical path its `ensureTable()` short-circuits. **Verified in the real ATF client test runner:** step 3 now reports `Successfully opened the 'x_casemgmt_case' form with id '…'` for all three tests, the old message appears nowhere, and `ATF 15/16/17` each passed 7/7 — confirmed twice individually and again inside the full suite `TES0001014`. Corroborated three independent ways: the step summary, the runner's Execution Frame visibly rendering the real scoped form, and `GET /x_casemgmt_case.do?sys_id=…` returning HTTP 200. The three tests no longer depend on residue: step 1 of each now re-reads every fixture by `sys_id` with a plain GlideRecord and asserts it resolves, so a handoff problem would fail precisely and upstream rather than as a misleading "does not have a record with id" |
| **E-GU** — ✅ **FIXED** | `gs.getUser(userName)` **ignores its argument** on this release and returns the **session** user | Measured in both scope and global: `gs.getUser("x_casemgmt_demo_agent")` → `resolved_name=admin`, `IS_SESSION_USER=true`, `hasRole(manager)=true` | `CaseTransitionValidator.canTransitionToClosed()`'s branch (b) — "userId provided and differs from the current user" — silently degrades to the session user, so it answers `{ok:true}` for a non-manager. Branches (a) and (c), which call `gs.getUser()` with no argument, are correct and are the **only** branches the shipped runtime uses; an unknown `sys_id` still denies by default. Fix: resolve roles with `sys_user_has_role` directly rather than `gs.getUser(userName)`. **No longer latent, and now fixed.** On the clean-slate reseed the demo users got resolvable `sys_id`s, so harness assertion **A9 reached branch (b) and FAILED** — `canTransitionToClosed` returned `{ok:true}` for a non-manager, a real bypass of the AAP §0.5.5 Resolved→Closed rule. Branch (b) now resolves the grant with a `GlideRecord` query on `sys_user_has_role` (`user=<runtime sys_id>` ^ `role.name=x_casemgmt_case_manager`) instead of `gs.getUser(userName)`, which is the platform's own store of effective role grants. After the fix the harness is **13/13 PASS** including A9. (A9 is the `canTransitionToClosed` non-manager assertion; A10 is the any→Draft assertion. Earlier revisions of this entry named A10 here, which was wrong — see the per-assertion table in §9.7.) Fixed in `script_includes/x_casemgmt_CaseTransitionValidator.xml` and its Update Set payload, with the measured behaviour recorded as a WARNING in the method body so it is not "simplified" back. See §9.7 |
| **E9** — ✅ **FIXED; THE "CORRECTING THE FLAGS DOES NOT LIFT THE 403" CONCLUSION IN THIS ROW WAS WRONG** | The three scoped tables were **unreachable from outside the application scope**. `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` returned **HTTP 403** `{"message":"User Not Authorized","detail":"Failed API level ACL Validation"}` as `admin`, for all three tables. The platform named the reason when the same read ran in a global background script: *"Read operation against 'x_casemgmt_case' from scope 'rhino.global' has been refused due to the table's cross-scope access policy."* Two aggravating properties: a global-scope `GlideRecord` read returned `getRowCount() == 0` instead of raising, so a global verification script silently reported "no data" for a fully populated table; and `GlideRecordSecure.canRead()` returned **`true`**, so the record ACLs were never the cause | **Root cause confirmed: the boolean-versus-string packaging bug WAS the whole cause.** On `sys_db_object` only `access` is a string — `ws_access`, `read_access`, `create_access`, `update_access` and `delete_access` are **boolean**, so the package's `"public"` coerced to **false** and every cross-scope operation was refused. **Why the earlier attempt appeared to disprove this:** writing those columns flushes only the `sys_db_object` catalogue, **not** `syscache_tabledescriptor`, and neither `GlideSecurityManager` reset, a session-cache clear nor a full `/cache.do` Cache Flush rebuilds that descriptor. Touching the table's **collection** `sys_dictionary` row (the one with `element` NULL) does force the rebuild, and the corrected values then take effect immediately. The earlier conclusion was drawn from a run that never got past the stale descriptor | **Fixed and measured, and then narrowed to least privilege.** All three tables answer **HTTP 200** on the REST Table API, and global-scope `GlideRecord` **reads** return rows (11 cases / 10 tasks / 8 parties at the time of measurement) instead of a silent 0. Cross-scope **writes** are refused on purpose: `create_access`, `update_access` and `delete_access` are `false`, so a Global-scope insert/update/delete answers *"… has been refused due to the table's cross-scope access policy"* and `GlideTableDescriptor.getAccessPolicy()` reports `Create=[PRIVATE], Read=[PUBLIC], Update=[PRIVATE], Delete=[PRIVATE], WSAccess=[PUBLIC]` (all four measured on the target PDI). The first version of this fix opened all five columns, which was an over-grant: Application Access is a gate separate from the record ACLs, plain `GlideRecord` in another scope is not ACL-filtered, and Global code can suppress the before-update transition guards with `setWorkflow(false)`. The REST Table API write path is unaffected by the change and remains ACL-governed. The fix is in `tables/x_casemgmt_case.xml`, `x_casemgmt_case_task.xml` and `x_casemgmt_case_party.xml`, mirrored into their three Update Set payloads, plus a rewritten `post_import_remediation.js` that carries a `TABLE_ACCESS_SPEC`, a `refreshTableDescriptor()` helper that performs the collection-row touch (with a value that genuinely CHANGES and is then restored — a re-write of the same value is a no-op that flushes nothing, measured), an `ensureTableAccess()` that runs for every table on every run, reads every value back and repairs drift in both directions, and a `verifyRemediation()` that raises a problem on drift. Each `tables/*.xml` header records the defect, the three capabilities it broke (the REST Table API gate, global-scope verification scripts, and the ATF client runner via Global-scope `TestExecutorAjax`) and the cache note. **This also resolved E-ATF15** — the same refusal was what made `ATF 15/16/17` fail at `Open an Existing Record`, so the post-commit REST gate in the deployment instructions now passes as written and no longer needs the app-scope workaround |
| **E10** | **The commit engine silently drops `read_only=true` on dictionary fields.** The package declares `read_only` on `x_casemgmt_case.number`, `opened_date`, `closed_date` and `duration_to_close`; after a clean commit all four arrive **writable**. Found on the first real clean-slate install by the remediation's semantic dictionary comparison, which reported `FIELD` / `x_casemgmt_case.number` / `repaired` / `read_only:false->true` and the same for the other three (`fields_repaired=4`) | Effect had it gone unnoticed: the **auto-numbered case number, both audit dates and the computed duration would all have been user-editable** on the form, so a user could overwrite the case number or backdate `opened_date`/`closed_date`. This is the third measured instance of one root pattern — the commit engine not honouring a declared `sys_dictionary` attribute — the other two being `display` (E7) and `defaultsort` (§9.3a item 3) | **Self-correcting as shipped**: `post_import_remediation.js` compares all 12 dictionary attributes and repairs any drift, so the required step-3 remediation run restores all four to `read_only=true` and verification fails if it cannot. The pre-remediation package alone leaves them writable, so the remediation is not optional for correctness either. The pre-Phase-2 script treated a field as correct whenever its column existed and would have left all four writable indefinitely |


### 9.6a Platform behaviours measured during the test-asset remediation pass

These are not application defects. Each is a property of the platform or of ATF that was measured directly on this
instance, and each one silently invalidates an obvious way of writing a test — which is why they are recorded here
rather than left as folklore. Every one of them changed something in the shipped suite.

| # | Measured behaviour | How it was measured | Why it matters, and what the suite does about it |
|---|---|---|---|
| **P1** | **A plain `GlideRecord` does not enforce ACLs, so `update()` succeeds even where `canWrite()` is `false`.** | Impersonating `x_casemgmt_demo_agent` against an unassigned case: `plain_get=true`, `canRead=false`, `canWrite=false`, `canDelete=false` — and yet `setValue('priority','High'); update()` **returned the sys_id and the stored value became `High`**. (Fixture restored afterwards.) | Any "the agent cannot write this row" proof built on plain `GlideRecord.update()` passes while reporting a write the ACL layer was never consulted about. `GlideRecordSecure` is the only scoped API that applies the write ACL, and `ATF 03` step 8 uses it. The trap is documented inside that step so it is not "simplified" back. |
| **P2** | **`GlideRecordSecure.getRowCount()` is not ACL-filtered.** | With 11 case rows: manager `getRowCount=11` / iterated 11; viewer 11 / 11; **agent `getRowCount=11` but iterated 9**. | A read-scope assertion of the form `getRowCount() >= N` can pass even when the role can see nothing at all. `ATF 02` and `ATF 04` now compare **iterated** visible sys_id **sets** against an authoritative plain-`GlideRecord` set, and assert both the assigned and the unassigned fixtures explicitly. |
| **P3** | **ATF ships no step type that can assert text on a classic platform form.** | The `Submit a Form` step config (`be8e0a935332120028bc29cac2dc34e4`) exposes only `form_ui` and `assert_type` — there is no message or text input. The only text-on-page assertion in the framework is `Assert Text on Page (Custom UI)`, which targets the Custom UI DOM, not the platform form these tests drive. | The *rendering* of a blocking message on the form cannot be automated here. `ATF 15/16/17` therefore assert the message **string** verbatim server-side, in the same transaction and against the same fixture the form just submitted, and their descriptions label the on-screen rendering as an explicitly manual observation instead of counting it as automated coverage. |
| **P4** | **ATF's own `Record Update` step cannot express a write denial on a row the impersonated user cannot read.** | `FAILURE: Unable to find record 'ad246e3efcb417cf87cc4d8eb2bc6df5' in table 'x_casemgmt_case'` in `TES0001013`. The step must **locate** the row before it can attempt the write and observe the refusal. | Read denial precedes write denial, so the step aborts rather than reaching an `record_not_updated` outcome. `ATF 03` step 8 was rebuilt as a script step. Note this makes the protection *stronger* than the native step can express, not weaker. |
| **P5** | **`stepResult.setOutputMessage()` overwrites the step output on every call — it does not append.** | A step that called it three times stored only the last line: the prior `TES0001013` `ATF 15` step-7 output contained just `fixture cleanup: checks=6 failures=0`, with the message-assertion and fixtures-removed evidence silently discarded. | Evidence written by an earlier call is lost, which makes a passing test look unevidenced and hides residue counts. All **27** affected scripts across the suite now accumulate their lines and emit once via `notes.join('\n')`; the re-run shows all three lines present, in order. |
| **P6** | **ATF's rollback reinstates a row created outside the ATF transaction — but a row created by the ATF-instrumented inbound-REST step IS inside it.** | `ATF 18` used to submit through the anonymous portal endpoint from a *script*, using `sn_ws.RESTMessageV2`: an outbound call is not instrumented, so the row was inserted by **`guest`** in its own HTTP transaction, the cleanup deleted it *inside* the ATF transaction, and the rollback undid that deletion. Confirmed in `TES0001014`: the leftover rows were `ATF-PORTAL-18` with `sys_created_by = guest`. The `Send REST Request - Inbound` step type behaves differently even though it too is served as `guest` (`X-Is-Logged-In: false`, guest-owned row): ATF instruments it, so its insert is recorded. Measured on 2026-08-08 in result `4d04241693628b10830ef82bdd03d6b0`, whose step 10 was skipped by an earlier failure — the Rollback batch removed the submitted case on its own, and a post-run list on `subject STARTSWITH ATF-PORTAL` returned zero rows. | A test must not create a row through the uninstrumented path. `ATF 18`'s anonymous leg is therefore non-mutating — an intentionally rejected POST plus a read-only lookup, with a census proving neither call persisted a row — so the test now asserts its own cleanliness: every delete reported success, no `ATF-PORTAL-18` row survives, and, measured over two consecutive runs (`12a928de93628b10830ef82bdd03d686`, `805bac9293a28b10830ef82bdd03d630`), nothing is left on the instance and the following run's pre-clean removes nothing. The manual sweep (§8.6, M4) is retired. |
| **P7** | **`GlideImpersonate` is not allowed in scoped applications**, and **deleting a row in a global table from scoped code silently returns `false`.** | `Background message, type:error, message: GlideImpersonate is not allowed in scoped applications`. Separately, `deleteRecord()` on three `sys_variable_value` rows returned **`false`** from scope `x_casemgmt` and **`true`** for the same rows from global scope. | Impersonation probes must run in global scope — which is only possible at all because the cross-scope access fix (**E9**) lets global read the three tables. The silent-`false` delete is exactly the failure mode the hardened cleanup assertions now catch: every cleanup checks each `deleteRecord()` return value rather than assuming it worked. |

---

### 9.7 Regression report (13 transition-logic assertions)

**Before this pass: 13 / 13 passing. After this pass: 13 / 13 passing. Zero regressions.**

This is the **baseline harness itself, re-run verbatim** — not a re-implementation. The 192-line script that
produced the pre-change baseline was recovered byte-for-byte and executed exactly as its own header prescribes: in
scope `x_casemgmt` through the background-script runner (the validator is `access=package_private`, so a
global-scope caller cannot instantiate it), with the result read back out of `syslog` from the single `U1ASSERT|`
line it emits (`gs.print()` is forbidden in scoped scripts). Every fixture it writes is uniquely prefixed
`U1BASE-`, is written with `setWorkflow(false)` so no Business Rule can interfere with *setup*, and is deleted by
the harness at the end; the demo data is never mutated. It contains no `sys_id` literals — users and groups
resolve by `user_name`/`name`, and the deliberately-unresolvable identity in A9 is generated at run time with
`gs.generateGUID()`.

**The harness is now a repository artifact**, at
[`../scripts/transition_logic_regression_assertions.js`](../scripts/transition_logic_regression_assertions.js), so
this gate is reproducible without recovering the script again. Its assertion bodies are byte-identical to the run
that produced the figures below; only its header was expanded with instructions for running it from
**System Definition > Scripts - Background** with the scope selector set to `x_casemgmt`.

| Run | Timestamp | Result |
|---|---|---|
| **BEFORE** — captured before any change in this pass | 2026-08-07 01:23:03 | `TOTAL=13 PASSED=13 FAILED=0` |
| **AFTER** — all changes in place, after the clean-instance round trip and the re-seed | 2026-08-08 09:18:43 | `TOTAL=13 PASSED=13 FAILED=0` |
| **AFTER the abort-state-coordination / fail-closed-guard / scope-normalisation pass** — same harness, re-run verbatim | 2026-08-08 11:27:44 | `TOTAL=13 PASSED=13 FAILED=0` (cleanup `tasks=4 cases=7`) |
| **AFTER the test-asset remediation pass (final HEAD)** — same harness, re-run verbatim, unmodified | 2026-08-08 19:23:16 | `TOTAL=13 PASSED=13 FAILED=0` (cleanup `tasks=4 cases=7 remainingCases=11`) |

Per assertion, with byte-identical expected and actual values on every one:

| # | Assertion | Result |
|---|---|---|
| A1 | `canTransitionToOpen` blocks an empty `assigned_group` → `Required field assigned_group is empty.` | ✅ PASS |
| A2 | `canTransitionToOpen` allows a populated `assigned_group` → `{ok:true}` | ✅ PASS |
| A3 | `canTransitionToInProgress` blocks an empty `assigned_agent` → `Assigned agent must be set and must be a member of the assigned group.` | ✅ PASS |
| A4 | `canTransitionToInProgress` blocks an agent who is not in `assigned_group` → same verbatim message | ✅ PASS |
| A5 | `canTransitionToInProgress` allows an agent who is a member of `assigned_group` | ✅ PASS |
| A6 | `canTransitionToResolved` blocks while one child task is Open → `All tasks must be closed before resolving this case.` | ✅ PASS |
| A7 | `canTransitionToResolved` allows once every child task is Closed | ✅ PASS |
| A8 | `canTransitionToClosed` allows a caller holding `x_casemgmt_case_manager` (`callerHasManagerRole=true`) | ✅ PASS |
| A9 | `canTransitionToClosed` blocks a caller without the manager role → `Only case managers can close cases.` (`idUnknown=true`) | ✅ PASS |
| A10 | `validateNoBacktransition` blocks any → Draft → `Cases cannot be returned to Draft.` | ✅ PASS |
| A11 | `validateNoBacktransition` blocks Closed → * → `Closed cases are terminal and cannot be modified.` | ✅ PASS |
| A12 | `isAgentInGroup` true for a member, false for a non-member | ✅ PASS |
| A13 | `getOpenTaskCountForCase` counts every non-Closed child task (2 of 3) | ✅ PASS |

Each run reports its own `CLEANUP` figures. Every run removed all seven of its own fixture cases and all four
of its fixture tasks, so the harness leaves nothing behind. The `remainingCases` figure is a census of the whole
table at that moment and therefore moves with the instance rather than with the harness: the 2026-08-08 09:18:43
run reported `remainingCases=20`, matching the census in §9.8 taken while that run's own and other suites'
fixtures were still present. The final-HEAD run reported **`remainingCases=11`**, which was the *clean* steady state
at that time:
the **10** demo cases required by AAP §0.7.4 (`CASE0000587`–`CASE0000596`, covering all six statuses across both
case types) plus one pre-existing `guest`-created row left by the setup phase's own portal verification, which is
not ATF residue and was deliberately not deleted on a shared instance. Neither figure indicates a harness leak;
both runs deleted exactly what they created.

> **A separate, stricter probe found a real latent defect that is NOT one of these 13 and is NOT a regression.**
> An earlier revision of this section reported 12 / 13, on the strength of a *re-implemented* harness written
> before the baseline script had been recovered. That re-implementation was not equivalent. Where the baseline's A9
> drives `canTransitionToClosed` with a **deliberately unresolvable** identity — exercising the validator's
> `userGr.get()` failure path, which correctly denies — the re-implementation passed a **real, resolvable foreign**
> `sys_user` sys_id, which reaches a different branch. That branch is genuinely broken (§9.6 **E-GU**:
> `gs.getUser(userName)` ignores its argument on this release and returns the *session* user, so a foreign `userId`
> is evaluated against the caller's own roles). Branch behaviour, measured directly:
>
> | Branch | Input | Result |
> |---|---|---|
> | (a) | `userId === gs.getUserID()` | `{ok:true}` — correct |
> | (c) | `userId` empty | `{ok:true}` — correct |
> | (b) | a **foreign**, resolvable `sys_id` | `{ok:true}` — **the defect** |
> | (b) | an **unknown** `sys_id` | `{ok:false,"Only case managers can close cases."}` — correct |
>
> The shipped runtime only ever uses branches (a) and (c) — the Business Rule and all six UI Actions evaluate the
> **current** user — and the Script Include is `package_private`, so nothing outside the application can call it
> at all. Manager-only closing is independently confirmed by **ATF 12 passing** in all three suite runs using real
> impersonation. The honest reading is therefore: **all 13 baseline assertions are still green, and in addition a
> latent authorisation hole was found on a code path the application never takes.** Nothing was relaxed to reach
> 13 / 13 — the baseline harness was run as written. **The hole has since been closed:** branch (b) now resolves the grant with a `GlideRecord` query on `sys_user_has_role` instead of `gs.getUser(userName)`, and assertion A9 passes against a real resolvable foreign identity (§9.6 **E-GU**). It is therefore recorded in §10.5 as completed work (former item 9) and is **not** on the active list.

**Closing Defect F broke nothing in the pre-existing path.** All seven case Business Rules are active in the
correct order, with U1's new rule slotted cleanly between the blockers and the membership validator: 100
`block_terminal_closed` (before-update), 100 `set_opened_date` (before-insert), 200
`block_draft_backtransition`, **250 `enforce_forward_transitions`**, 300
`validate_assigned_agent_membership` (insert + update), 400 `clear_pending_reason_on_inprogress`, 500
`set_closed_date`. That measurement was taken while the order-1000 bootstrap rule on `sys_remote_update_set`
still existed (it read `active=false` after a successful remediation); **the rule has since been removed and the
current package ships seven case Business Rules and no eighth rule on any global table** — see §0.7. The four
behaviours that always worked were re-measured: both prohibited-transition
messages come back verbatim; `CASE0000457` and `CASE0000461` both carry populated `opened_date` **and**
`closed_date`; `CASE0000455` (Pending) holds `pending_reason=Awaiting Info` while both In Progress cases hold it
empty. The `{ok, error}` contract is consumed by `ui_action/x_casemgmt_case_close.xml` and by the `open`,
`resolve` and `start_progress` actions; `resume` and `set_pending` do not call the validator, which is correct —
AAP §0.5.5 lists "None" as the required condition for the two transitions they perform. The anonymous portal
contract still answers **201 / 200 / 404** with the verbatim strings.

**Independent runtime confirmation.** Clicking the real **Resolve** UI Action on a case with one open child task
was **blocked**: the persisted status stayed `In Progress`, `closed_date` stayed empty, and `sys_mod_count` and
`sys_updated_on` were byte-identical to their pre-attempt values, so no write occurred. The form displayed
exactly `All tasks must be closed before resolving this case.` in the `gs.addErrorMessage()` banner —
codepoint-verified as 52 pure-ASCII characters with a terminating U+002E, no leading or trailing whitespace.

### 9.8 Demo data restored (AAP §0.7.4) — as measured in the U4 clean-instance pass

> **Which measurement this is.** Every figure in this subsection was measured **at the end of the U4
> clean-instance pass**, and the specific `CASE…` / `TASK…` / `PARTY…` ranges belong to *that* pass. They are not
> a current-state statement: each teardown-and-re-seed allocates fresh numbers from the live counters, so the
> ranges move every time. A later measurement of the same census is in §9.7 (10 demo cases
> `CASE0000587`–`CASE0000596`, `remainingCases=11`), and the **current** census — measured after the §0.3 round
> trip and re-seed — is in §9.8a below. Any statement about the census *now* has to be re-measured rather than
> read out of this table. **What is invariant across all of these measurements, and is what AAP §0.7.4
> actually requires, is the shape of the census — the threshold and "Measured" columns below other than the
> literal number ranges.** An earlier revision of this subsection
> presented its ranges as the current census without saying which pass produced them, which read as a
> contradiction of §9.7.

| Threshold | Required | Measured (U4 pass) |
|---|---|---|
| Cases | ≥ 10 | **10 demo cases** (`CASE0000452`–`CASE0000461` in that pass), `number` empty on none |
| Statuses covered | all six | **all six** — Draft, Open, In Progress, Pending, Resolved, Closed |
| Case types | both | **both** — General Inquiry and Complaint |
| Tasks | open + closed mix | **10** — 3 Open, 1 In Progress, 6 Closed; zero dangling parent references |
| Parties | Person + Organization | **8** — 5 Person, 5 resolving; 3 Organization, 3 resolving; zero dangling references |
| Demo users | 3 | **3** |
| Demo group | 1 | **1**, with a valid membership for the agent |
| Role grants | 3 | **3** |

All synthetic and PII-free: every demo user and every case `requester_email` is on `@example.invalid`; the two
companies are `Synthetic Org Alpha` and `Synthetic Org Beta`. Counters proven live across all three tables — the
ranges quoted here are the ones the **U4 pass** allocated, and later passes allocate later ranges from the same
counters: `CASE0000452`–`461`, `TASK0000091`–`0000100`, `PARTY0000042`–`0000049`. The invariant the counters
prove is the `CASE0000001` / `TASK0000001` / `PARTY0000001` seven-digit shape and monotonic allocation, not the
particular numbers.

The case table also holds a handful of additional synthetic `Draft` rows created as validation probes during
this pass, plus one row per ATF suite run left by `ATF 18` for the reason already documented in §8.6 (M4): an
inbound anonymous HTTP request runs as `guest` in its own transaction, outside ATF's rollback. All are
synthetic and on `@example.invalid`. Demo-data cleanup remains out of scope.

### 9.8a Demo data as it stands now — measured after the §0.3 round trip

This is the **current** census, taken on `dev379024` after the clean-slate round trip, the §9.5 install sequence
and a re-seed with `scripts/seed_demo_data.js`. It is a separate measurement from §9.8 and from §9.7; where a
reader wants "the census now", this is the row set to quote.

The packaged seed rows had to be removed before re-seeding, exactly as **E1/E2** predict: all 10 packaged cases
committed with an **empty `number`**, and all 10 packaged tasks and 8 packaged parties held their parent as a
literal string (`case='CASE0000008'`, `organization='Synthetic Org Beta'`) rather than a reference. Those 28 rows
plus one dangling `sys_user_grmember` row were deleted, then the seed script was run in scope `x_casemgmt`
(Global cannot write these tables by design — **E9**) and exited 0.

| Threshold | Required | Measured now |
|---|---|---|
| Cases | ≥ 10 | **10**, `CASE0000979`–`CASE0000988`, `number` empty on none |
| Statuses covered | all six | **all six** — Draft 1, Open 2, In Progress 2, Pending 1, Resolved 2, Closed 2 |
| Case types | both | **both** — General Inquiry 6, Complaint 4 |
| Priorities | — | all four present — Low, Medium, High, Critical |
| Date stamping | — | `opened_date` on 10 of 10; `closed_date` on **only** the 2 Closed cases |
| Tasks | open + closed mix | **10**, `TASK0000276`–`TASK0000285` — 3 Open, 1 In Progress, 6 Closed; all four types; zero dangling parent references; `assigned_to` and `due_date` populated on all |
| Parties | Person + Organization | **8**, `PARTY0000159`–`PARTY0000166` — 5 Person, 3 Organization; zero dangling references; no Person row without `person`, no Organization row without `organization`, and no row with both |
| Demo users | 3 | **3**, all active |
| Demo group | 1 | **1** (`x_casemgmt_demo_team`), with a valid membership for the agent |
| Role grants | 3 | **3** — one per role |

All synthetic and PII-free: every demo user address and every case `requester_email` is on `@example.invalid`;
the two companies remain `Synthetic Org Alpha` and `Synthetic Org Beta`.

> **One census reading that is not a defect.** `sys_user_grmember` holds a **second** row for
> `x_casemgmt_demo_agent`, pointing at group `5ee74940b70022108d4406dd1e11a918`. That is the platform's own
> auto-provisioned `snc_required_script_writer_permission` group — it resolves (HTTP 200), its
> `sys_created_by` is `system`, and it appears **0** times in the package. It is a platform-managed global row,
> not a dangling reference, and it was deliberately left untouched.

### 9.9 Final re-verification of every gate, at the end of the pass

Everything in §9.2–§9.8 was measured as the pass progressed; every gate was then measured **again, from
scratch, at the end of that pass** — after the round trip, after the remediation, after the re-seed and after the
ATF runs. All of the following was observed on `dev379024`, and nothing was repaired between measuring and
recording.

> **This table is a snapshot of the end of THAT pass, not the current state.** An earlier revision of this
> paragraph certified that "no number here is stale"; two later package-changing passes have since landed, so the
> certification has been withdrawn and the rows that were superseded are marked inline. Where this table and §0
> disagree, **§0 is correct.** Specifically superseded here: the ATF row's `16 Success / 4 Failure` verdict and
> its `542` step-parameter count (current: **20 / 0 / 0 / 0** and **540** — §0.1, §8.3), and the demo-data row's
> 20/21-case census (current: **10 cases / 10 tasks / 8 parties** — §9.8a).

| Gate | Re-measured result |
|---|---|
| Tables visible | All three tables readable in scope with their full column sets (20 / 13 / 12 dictionary element rows, plus one collection row each). **All seven choice lists** present with the exact option labels: `case.type` General Inquiry, Complaint · `case.status` Draft, Open, In Progress, Pending, Resolved, Closed · `case.priority` Low, Medium, High, Critical · `case.pending_reason` Awaiting Info, Awaiting Third Party, Other · `case_task.type` Investigation, Review, Follow-up, Other · `case_task.status` Open, In Progress, Closed · `case_party.party_type` Person, Organization. Exactly **one display field per table** (`number` / `subject` / `role_label`), so reference display values render. In the UI the three lists read "1 to 20 of 20", "1 to 10 of 10", "1 to 8 of 8" as real data grids, with **zero** error banners, the `Case` column populated on **10/10** task rows and **8/8** party rows, **0 console errors** and **0 non-2xx** across 241 requests. |
| Auto-numbering | One synthetic in-scope insert produced **`CASE0000542`**, matching `^CASE[0-9]{7}$`; the probe row was removed again. `number` is read-only, proven four ways including a live typing test that left the value unchanged and `g_form.modified` false. |
| REST, anonymously (no credentials sent) | `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE0000543","message":"Your case has been submitted"}`, and the created case is in `Draft`. `GET …/case_status_lookup?number=CASE0000543` → **200** with body keys **exactly** `{opened_date, status, subject}`; `assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email` and `sys_id` are absent from the parsed body **and** from the raw response text. `GET …?number=CASE9999999` → **404** `{"error":"No case found with that number."}`, **31 of 31 bytes identical** to the required literal. |
| RBAC | `sys_security_acl` 26, **`sys_security_acl_role` 27**. Table-level probe under impersonation with `GlideRecordSecure`: manager create/read/write/delete on all three tables; agent create only, with **no blanket read or write** and **delete false**; viewer read only. Record-level narrowing was proven in the browser earlier in the pass on both halves of the AAP §0.5.6 definition. |
| Roles and scope | One `sys_user_role` row each for `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`; exactly one `sys_scope` row, `scope=x_casemgmt`, version 1.0.0. |
| Demo data ⚠️ **census SUPERSEDED — currently 10 cases / 10 tasks / 8 parties (§9.8a)** | *At the time of this snapshot:* 20 cases at the census (21 once the last anonymous-submit regression probe, `CASE0000553`, was added), **none with an empty `number`**, spanning **all six** statuses and **both** case types; 10 tasks (3 Open, 1 In Progress, 6 Closed) with **zero** dangling parent references; 8 parties (5 Person, 3 Organization) with zero dangling parent or organization references; 3 users, 1 group with a correctly-referenced membership, 3 role grants, 2 synthetic companies. Every case `requester_email` is on `@example.invalid` — 20 of 20 at the census, and the later probe likewise. The rows above the AAP threshold of 10 are the disclosed validation probes and the `ATF 18` residue of §9.8; the regression harness left nothing behind (`U1BASE-` rows remaining: 0). |
| Workflow, on the form | `Resolve` clicked on `CASE0000454` while `TASK0000091` was still `Open`: **blocked**, with exactly one visible message, `All tasks must be closed before resolving this case.` — 52 characters, no leading or trailing whitespace, terminating U+002E, strict equality against the required literal true. **No write occurred**: after a cache-bypassing reload the status is still `In Progress`, `closed_date` still empty, `sys_mod_count` still **0**, and the complete before and after record XML snapshots are **byte-identical**. |
| ATF ⚠️ **SUPERSEDED — see §8.3** | `sn_atf.runner.enabled=true`, `sn_atf.headless.enabled=false` (instance settings; the package contains **zero** `sys_properties` records). *At the time of this snapshot:* three suite runs, byte-identical verdicts each time, **20 ran, 16 Success, 4 Failure, 0 Error, 0 Skipped** — failures `ATF 07` (§9.6 E-ATF) and `ATF 15`/`16`/`17` (§9.6 E-ATF15), both root causes since fixed. **Current result: `TES0001015` = 20 Success / 0 Failure / 0 Error / 0 Skipped, 180 of 180 steps Success** (§8.3). Survivability of the re-imported records at the time: `sys_atf_test` 20, `sys_atf_step` 180, step-parameter rows **542** — matching the `Value` blocks the package then shipped; the shipping range is now **761 blocks with 540 inputs** (§0.1) — one suite, 20 suite members, **zero tests with no steps**, **zero steps with no parameters**, suite `sys_mod_count` 0. The ATF records did **not** degrade the way the flows did in Defect F. |
| Regression | The baseline harness re-run verbatim: **13 / 13 before, 13 / 13 after** (§9.7). |

---

### 9.10 Clean-slate round trip on the `e01add3a` packaging-pass bytes — NOT on the bytes that ship today

> **⚠️ Read the identity below before the result.** This subsection was originally titled "repeated on the FINAL
> bytes", and at the time it was written that was accurate. It is no longer: **the bytes proved here are not the
> bytes that ship.** Three package-changing passes landed afterwards. What follows is a complete and honest
> record of a clean-slate round trip on the `e01add3a` packaging-pass revision, and it is the strongest
> round-trip evidence this project has — but it is **not** evidence about the current file. The gap is stated in
> §0.3 and closing it is recommended next step 1.

§9.1–§9.9 describe a round trip performed before the packaging-and-schema pass. Because the package changed after
that (§9.3a), the whole trip was repeated end to end against the bytes current at that moment, identified by hash
so the claim is checkable:

**Bytes proved by this subsection — the `e01add3a` packaging-pass revision:
`update-set/x_casemgmt_case_management_update_set.xml` — sha256 `32a064d6a97dde91bb65d9d48adf44406b7fa6183681894db4570fee071a4f0a`, 3,448,009 bytes, 916 records.**

**Bytes round-tripped separately and successfully:
sha256 `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e`, 3,618,378 bytes, 913 records** (§0.3).
**Bytes that ship today: sha256 `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`,
3,781,097 bytes, 926 records** (§0.1). Two further revisions separate them from `89638c17…` — which was itself
the `7272edfc…` file with 9 payloads re-synced and measured preview-neutral (§0.3a) — namely `e49a7654…`
(925 blocks, §0.3b) and today's `7292a6fe…` (926 blocks, §0.3c).
The difference from the revision proved in this subsection is the removal of the bootstrap-trigger block and its
payload, the cross-scope access narrowing, six packaged metadata fields corrected so they describe what their
records actually do, one Script Include comment label, and the two portal-widget templates. None of it touches a
name, a `sys_id`, a scope reference or a load-order dependency. **A complete teardown → upload → preview → commit run — 41 → 298 →
0 problems, then `committed` — was performed on the `7272edfc…` revision and is recorded in §0.3. It has NOT been
performed on the bytes that ship**, and an earlier revision of this sentence claimed otherwise; that claim is
withdrawn. §0.3b and §0.3c state what has been measured on each subsequent revision, and §10.0 item 1a is the
outstanding work. This subsection is retained as the history of the `e01add3a` revision; §0 is the current status,
and where the two disagree §0 is correct.

> **Why the trip was run twice.** The first pass used sha256 `475a97a3…a17ea` and reached the same result (54 → 296 → **0**, committed). It also surfaced the **E-GU** authorization bypass through harness assertion **A9** (the `canTransitionToClosed` non-manager assertion — A10 is the any → Draft assertion, per the table in §9.7), which was then fixed in `script_includes/x_casemgmt_CaseTransitionValidator.xml` — changing one payload **after** the trip. Rather than argue that a script body cannot affect preview resolution, the entire trip was **repeated from a fresh teardown on the corrected bytes**, and every figure below is from that second run. This is deliberately not the earlier mistake of attributing a clean-slate result to bytes that were subsequently edited.

| Stage | Measurement |
|---|---|
| Pre-flight | Instance reachable, credentials valid. **The upgrade check in the deployment instructions is invalid on this release:** it queries `sys_upgrade_history` for `state=executing`, but that table has **no `state` column** (its columns are `upgrade_started` / `upgrade_finished`), and an invalid field in `sysparm_query` is silently ignored — so the query returns unfiltered rows and always looks like an upgrade is running. Correct predicate `upgrade_startedISNOTEMPTY^upgrade_finishedISEMPTY` → **0 rows** |
| Upload mechanics | The file's `<sys_remote_update_set>` descriptor carries a fixed `sys_id`, so **re-uploading MERGES into the same row and appends its children** (observed: 1832 = 2 × 916). Every upload here was preceded by a staging reset and the child count asserted at exactly **916** before previewing |
| BEFORE (populated instance) | **54 error-type problems** = 33 `Found a local update that is newer than this one` + 18 `Could not find a record in x_casemgmt_case for column case` + 3 `…core_company for column organization`. The 21 reference problems are **identical** to those recorded in §9.2/§9.3 |
| Teardown | Staged application-level teardown, every query anchored on the app's `sys_scope` or the `x_casemgmt_` prefix. Verified complete: every census counter **0**, and the three tables moved from HTTP **403** to HTTP **400** — a useful distinction, since 400 means *table absent* whereas 403 means *table exists but cross-scope refused* (E9) |
| Clean-slate preview | First pass **296 problems, 100 % collisions**, zero missing references and zero missing tables — caused by the teardown's own deletions being captured locally (a local DELETE is "newer" than the package's INSERT). Purging only the local rows whose `<name>` the retrieved set itself carries (299 `sys_update_xml` + 1891 `sys_update_version`) and re-previewing gave **ZERO PROBLEMS OF ANY TYPE** — zero errors *and* zero warnings. Progression **54 → 296 → 0** |
| Commit | `SNC.PreviewerManager().doPreview()` leaves `state=loaded`, so the platform's own predicate refused (`shouldDisplay=false`). After setting `state=previewed`: `unresolvedProblems=false`, `shouldDisplay=true` — the predicate was checked, not assumed. The AJAX contract was read out of the platform's own **Commit Update Set** UI action: `validateCommitRemoteUpdateSet` → `commitRemoteUpdateSet` with `sysparm_remote_updateset_sys_id` and `sysparm_skip_app_installs=false`. **previewed → committing → committed** |
| Package-alone state | scope 1, `sys_db_object` 3, `sys_dictionary` 25, **`sys_choice` 0** (Defect C), `sys_number` 3, roles 3, ACLs 26, **acl_role links 0** (Defect 9), flows 7, reports 8, dashboards 2, REST 2+2, portal 1+2+3, ATF 20, demo users 3 |
| Auto-execute trigger | **Zero `X_CASEMGMT_REMEDIATION` marker rows at or after the commit start — and that is the expected result because no auto-execute record exists to fire.** The package ships **1 Fix Script and no bootstrap Business Rule, `sysauto_script` or `sys_trigger` of any kind** (§0.1 "Installer records", §9.4); the bootstrap rule an earlier revision carried was removed from the package. An earlier version of this row asserted that the rule "ships `active=false`" and quoted a committed record's field values — **that was stale and factually wrong.** Nothing of the kind is in the package or on the instance: 0 `x_casemgmt`-scoped Business Rules on any update-set table, 0 `sysauto_script` rows, 0 `sys_trigger` rows. Post-import remediation is therefore a **documented manual step**, not an automatic one — run the packaged Fix Script, or `../scripts/post_import_remediation.js`, from Global scope after commit (§9.5). |

**Path (b) was then executed exactly as §9.5 prescribes**, which produced the two corrections now folded into
§9.5 steps 1 and 2, plus defect **E10**. Final state after step 3: `verified=true … acl_links_total=27 …
errors=0`, with `by_role=agent=10, manager=14, viewer=3`. Demo data after step 4: **10 cases / 0 without a
number, 10 tasks / 0 unresolved, 8 parties / 0 unresolved**, all six statuses and both types present.

**Gate results on this clean-slate install of the `e01add3a` bytes** — these results belong to that revision, not to the shipping file (§0.3)

| Gate | Result | Evidence |
|---|---|---|
| 1 Data model | ✅ PASS | All three tables `physical=yes`, `missing_fields=none`, `drifted_attributes=none`, `display_fields=[number]`/`[subject]`/`[role_label]` — **exactly one per table**, `choices{lists=7/7,values=24/24}`, counters `CASE/7 TASK/7 PARTY/7` |
| 2 Workflow | ✅ PASS | **13/13** transition-logic assertions, including A9 after the E-GU fix. All four verbatim messages asserted |
| 3 ACLs | ✅ PASS | 26 ACLs / **27** role links / derived 27 / missing 0 / unexpected 0. Impersonated: manager `C,R,W,D` all true on all three tables; viewer `R` only; agent create-only with `R`/`W` denied against an empty record, which is the documented correct observable for an "Assigned only" condition |
| 4 Portal submission | ⚠️ REST contract PASS · page FAIL | Anonymous, no credentials: **201** `{"number":"CASE0000586","message":"Your case has been submitted"}`. The submission **page** renders blank (E8-P), so the user-facing gate does not pass — recorded as ✅ in an earlier revision of this table, which conflated the endpoint with the page |
| 5 Portal lookup | ⚠️ REST contract PASS · page FAIL | **200** with body keys exactly `{status, subject, opened_date}`; unknown number → **404** `{"error":"No case found with that number."}`. The lookup **page** renders blank (E8-P), so the user-facing gate does not pass |
| 6 Dashboards | ❌ FAIL **on these bytes** | 2 `pa_dashboards` present, **0 `pa_tabs`** — the pre-existing packaging defect E5, unchanged by that pass. Re-measured after it: the defect spanned **three** invalid child table names, not one, and 0 canvas panes and 0 scoped `pa_widgets` landed either. **Since fixed** — both dashboards were re-authored onto the real record chain and now render 3 of 3 and 5 of 5 widgets, persona-verified (§0.5, §0.3c). This row records the `e01add3a` measurement, not the current state |
| 7 Update Set | ✅ PASS **for these bytes** | Zero problems of any type on a genuine clean slate, then committed. An equivalent trip was later run on the `7272edfc…` revision with the same zero result (§0.3); **it has not been run on the bytes that ship** (§0.3c, §10.0 item 1a) |

**On the `e01add3a` bytes: 2 gates passed outright — 2 Workflow and 7 Update Set — 4 passed with a
qualification (1 Data model and 3 ACLs, each only after the manual remediation; 4 Portal — submission and
5 Portal — lookup, each only at the REST layer), and 1 failed (6 Dashboards). `2 + 4 + 1 = 7`.** An earlier revision of
this line read "Six of seven gates pass on the final bytes", which is not supportable: gates 4 and 5 passed only
at the REST layer, and gates 1 and 3 passed only after the manual remediation of §9.5. The single outright
failure is the pre-existing E5 packaging defect, now known to be wider than first recorded (§0.5).
**The shipping bytes no longer score 2 · 4 · 1.** They score **4 · 3 · 0**: gates 4 and 5 moved to outright
passes when the portal layout records were authored, and gate 6 — the single outright failure recorded in this
subsection — moved to an outright pass when both dashboards were re-authored onto the tables this release actually
has (§0.5). The rollup in this subsection is retained as the measurement of the `e01add3a` install; **the current
rollup for the shipping bytes is §0.4, and where the two disagree §0.4 is correct.**


### 9.11 Accessibility of the two portal form widgets — what is authored, and what is inherited

Four accessibility observations were raised against the portal widgets at the acceptance gate. Three were
authored into the widgets and their Update Set payloads; the fourth cannot be acted on project-side, and saying
so is more useful than claiming a fix.

| Observation | Disposition | What changed |
|---|---|---|
| The required indicator was a visual-only `<span class="required">*</span>`, with no `aria-hidden` and no `aria-required` on the control | ✅ **Authored** | The four asterisks carry `aria-hidden="true"` — they are decoration and are no longer read out as content — and the four mandatory controls carry `aria-required="true"` alongside the existing `required`, so required-ness is conveyed programmatically and not only visually |
| `novalidate` suppresses the browser's per-field messages, so a disabled Submit button was the only feedback for an incomplete form, and it gave **no reason** | ✅ **Authored** | Each form gained a `help-block` paragraph under its button that states the reason in visible text ("Every field marked * is required. Complete all four to enable Submit." / "Enter a case number to enable Look Up Status."), referenced by the button through `aria-describedby`. The paragraph is always in the DOM, so the reference never dangles |
| The in-flight state changed only the button's inner text, with no `aria-busy`/`aria-live`, so "Submitting..." was announced only if focus happened to be on the button | ✅ **Authored** | The same paragraph is a `role="status" aria-live="polite"` region and announces the in-flight state; each form sets `aria-busy` through `ng-attr-aria-busy` while its request is outstanding |
| Colour contrast is not statically measurable | ⚠️ **Not actionable project-side, by AAP design** | Nothing changed, and nothing can be. All three widgets ship an **empty** `css` element and an **empty** `link` element, define no colour and reference no branding asset, and `sp_portal.theme`/`theme_dv` are empty — the entire visual treatment is the platform default theme that **AAP §0.4.4 mandates** ("No custom CSS, no custom branding"). Authoring CSS to alter contrast would violate that requirement, so if the platform theme's contrast is ever judged insufficient it is a theme decision to raise against the AAP rather than a defect in these widgets |

Everything above is markup on the `template` field of `portal/widgets/sp_widget_x_casemgmt_case_submission_widget.xml`
and `…_case_lookup_widget.xml`, mirrored byte-for-byte into the two `Widget` `<payload>` blocks, so artifact and
package cannot disagree. No CSS was added, no verbatim string was touched, no `sys_id` literal was introduced, and
the block count was unchanged by that edit. **When this was written these were markup-level improvements to widgets
that did not render**, because the Service Portal *layout* records had never been authored (§9.6 E8-P) — they raised
the quality of widgets that nothing yet put on screen. **That is no longer the case:** the layout records were
authored (§10.1 item 3, now DONE), both pages render anonymously, and a later QA-findings pass extended this same
markup with per-field validation messages, bound `aria-invalid`, `has-error` state, `role="alert"` / `role="status"`
regions and maxlength notices — still with an empty `css` element on all three widgets (§0.3c, §0.9 INFO-3). The per-attribute rationale is in `portal-pages.md` → *Accessibility of the two form widgets*, and in the
template comments so a later edit does not quietly remove it.

**Verified installed, not merely authored.** After the §0.3 round trip the three live `sp_widget` records were
compared field by field against their artifacts: `template`, `client_script` and `script` are **byte-identical on
all three** (submission 8,524 / 11,638 / 2,170 characters; lookup 3,769 / 8,195 / 1,253; confirmation 429 / 1,613 /
1,053 — matching SHA-256 on every field), and `public=true`, `servicenow=false`, `roles=''` are preserved so
anonymous access is intact. The accessibility markup above therefore ships and installs, rather than existing only
in the repository. The comparison also confirms the one observation that could not be acted on: **`css` and `link`
are empty strings on all three widgets**, so there is no project-authored stylesheet in which to raise the
contrast of the inherited theme — AAP §0.4.4 mandates the platform default theme, and changing it would be a
scope violation rather than a fix.

---

## 10. Recommended next steps

Ordered by what unblocks the most. Estimates are for an engineer with admin access to the instance and are
deliberately conservative.

> **What this list is.** §10.0–§10.4 contain **open work only**, numbered 1–12 in the order it should be done.
> Completed work has been moved out of the active tables into **§10.5**, where it keeps the number it had when it
> was active so that existing references still resolve. An earlier revision of this section claimed completed
> items were not listed and then listed six of them (2, 3, 9, 10, 12, 13) struck through in the active tables;
> that contradiction is resolved here.

### 10.0 Do this first

Item 1 — the clean-slate round trip — was done, and is recorded in §0.3 and in §10.5 under its original number.
**It was done on the `7272edfc…` revision, and the deliverable has changed twice since**, so a round trip *on the
bytes that ship* is outstanding again and is re-listed below as item 1a. Three items remain here, and **item 0 is
a precondition for the other two** — neither can start while the verification instance is asleep (§0.11).

| # | Work | Why | Estimate |
|---|---|---|---|
| 0 | **Wake the verification PDI `dev379024` from the ServiceNow Developer Program account that owns it, then re-measure the final gate.** In order: read the case and task the 502 save touched to establish whether that write committed; delete the ten `QA-FINAL` fixture rows; re-run the §3.4 form observations, the §9.7 assertion harness and the ATF suite; then proceed to 1a and 2 | Since 2026-08-11 every route on the instance returns ServiceNow's hibernation placeholder (§0.11), so items 1a and 2 cannot begin and **nothing in this register can be re-measured**. Waking requires developer-portal credentials that a build environment does not hold — instance `admin` credentials cannot authenticate to the Developer Program portal | 15 min to wake · ~2 h to re-measure |
| 1a | **Clean-slate upload → preview → commit the shipping `7292a6fe…` bytes** on a dedicated instance, and record the problem count by type | The absolute zero-problems gate belongs to `7272edfc…` (§0.3); `e49a7654…` was previewed against a populated instance with the reference class at zero and commit withheld (§0.3b); and **no preview has been run on today's 926-block bytes at all** (§0.3c). The delta since `e49a7654…` is 13 payloads of records that already existed under the same `sys_id` plus 1 new `sys_metadata` block, so the expected outcome is the same local-history collision class and nothing else — but that is a reasoned expectation, not a measurement, and this register does not treat the two as equivalent. It cannot be run here: this PDI is shared, and a teardown would destroy an application other automated work is using | 1–2 h on a dedicated PDI |
| 2 | **Re-load every `atf/*.xml` artifact into the instance and re-run the suite**, recording the verdict against the re-loaded bytes | Still open, but **much narrower than earlier revisions of this row implied**, and the residual risk is now quantified rather than assumed. What has been measured (§8.3): a full re-diff of the packaged `sys_variable_value` blocks against the live rows returns **539 of 540 byte-identical, 1 differing, 0 only-in-package, 0 only-in-live**; the one difference is `ATF 18` step 9 and is **17 `//` comment lines with 0 non-comment lines changed** (comment-stripped md5 `91822682b141` on both sides), so the **executable code of all 540 inputs is identical to the package**. Provenance is measured too: all 20 tests, all 180 steps and the suite carry `sys_mod_count = 0` with the package's `2025-01-01 00:00:00` stamps, and **180 / 180 `step_config` plus 540 / 540 input `variable` references resolve** to live rows with **0** zero-input steps and **0** duplicate `(document_key, variable)` pairs — i.e. the green verdicts already recorded were taken on the as-installed package records, not on hand-edited copies. What remains unmeasured is narrow and specific: a re-load performed *on the current bytes*, followed by a suite run, which would close both the one comment-only delta and the last of the "expectation is not measurement" gap in one operation. Note also that the delta cannot be closed by patching the row — `PATCH sys_variable_value/7b1f7b99…` answers `403 ACL Exception Update Failed due to security constraints` — and should not be, since a hand-write would destroy the `sys_mod_count = 0` provenance above | 30 min per run (client runner; `sn_atf.headless.enabled` cannot be enabled here) |

### 10.1 Blocking — the application is not demonstrable through its intended UI without these

| # | Work | Why | Estimate |
|---|---|---|---|
| 3 | ~~**Author the Service Portal layout records** (`sp_container`, `sp_row`, `sp_column`, `sp_instance`) for both pages~~ — ✅ **DONE.** Both chains are authored, packaged (8 blocks) and deployed, the three inert `sp_page` elements removed, and the widgets' Scripted-REST response-envelope bug fixed. Both pages render and work anonymously; see §9.6 E8-P and §0.3b. A portal **menu** was not added — the two pages are reached by their `id` (`?id=x_casemgmt_case_submit`, `?id=x_casemgmt_case_status`), which is what the AAP specifies |
| 4 | ~~**Add `number` to the packaged `Case Record` payloads**, or drop the seed rows from the package and rely on `seed_demo_data.js`~~ — ✅ **DONE.** All 28 seed payloads now carry a **pinned number** in the 9,000,000 band (`CASE9000001`–`CASE9000010`, `TASK9000001`–`TASK9000010`, `PARTY9000001`–`PARTY9000008`), which cannot collide with a counter-issued number and leaves the counters untouched. The `case` and `organization` references carry their key in a `display_value` attribute with an empty body — the only shape update-set preview accepts for an intra-set target — and `seed_demo_data.js` **adopts** each packaged row by its pinned number and fills only what is empty. Preview reference errors went 21 → **0** (§9.6 E1, §0.3b) |

### 10.2 Correctness and packaging

| # | Work | Why | Estimate |
|---|---|---|---|
| 5 | **Emit canonical `<table>_<sys_id>` update names from the generator** | An earlier pass had to rewrite all 916 names of the then-current package to get a zero-error preview on a clean instance (all 926 in the shipping file are canonical and unique); the generator still emits human-readable names (§9.2) | 1 h in the generator |
| 6 | ~~**Author the two related lists** required by AAP §0.4.4 (`case_task` and `case_party` on the case form) and capture them~~ — ✅ **DONE.** `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` ships the `sys_ui_related_list` plus two `sys_ui_related_list_entry` rows and is captured as one added update-set block, placed after the List Layout and before the UI Actions per AAP §0.5.2. Verified on `CASE0000981`: wrapper 227.3125 px, sections *Case Tasks (2)* then *Case Parties (2)* with the real child rows, identical for admin / agent / viewer, zero console errors. One install caveat — *Configure ▸ Related Lists ▸ Save* is required once on an instance that already rendered the form (§4 item 17, §0.6.2, §9.6 E8) |
| 8 | ~~**Replace the party UI Policy's tautological condition**~~ — ✅ **DONE.** `ui_policy/x_casemgmt_case_party_conditional_fields.xml` and its packaged payload now carry **two** discriminating policies (`party_type=Person`, `party_type=Organization`), each with one declarative `sys_ui_policy_action`, `reverse_if_false=true`, `run_scripts=false` and empty scripts. On-change re-evaluation verified in a browser in both directions; see §9.6 E4 |
| 9 | ~~**Correct the three invalid Dashboard child table names**~~ — ✅ **DONE, and it was a rewiring rather than a rename.** `pa_tab`, `pa_dashboard_widgets` and `pa_dashboard_role` are gone from both artifacts and both payloads. What replaced them is the chain this release actually uses: `sys_portal_page` + `sys_grid_canvas` + `pa_tabs` + `pa_m2m_dashboard_tabs` + `pa_dashboards` (carrying `restrict_to_roles`) + `pa_dashboards_permissions` share rows + one `sys_portal` / 12 `sys_portal_preferences` / `sys_grid_canvas_pane` trio per widget — 49 records for Agent Workspace, 76 for Manager View. `pa_widgets` turned out **not** to be the widget-instance carrier for a dashboard canvas; `sys_portal` + `sys_portal_preferences` is. **Validation gate 6 now passes: 3 of 3 and 5 of 5 widgets render with live data**, persona-verified across all 6 (persona, dashboard) pairs (§0.5, §9.6 E5) |

### 10.3 Test suite

The suite is complete and green; the only outstanding test-suite work is the serialized re-load re-run, which is
item 2 in §10.0 because it is part of closing the packaging proof.

### 10.4 Deployment ergonomics

| # | Work | Why | Estimate |
|---|---|---|---|
| 10 | **Collapse the two-pass install into one** by finding a packaging route that yields physical storage without a table rebuild — e.g. shipping the tables via an application *installation* rather than an Update Set | The current procedure needs two commits because dropping `sys_db_object` cascades the ACLs (§9.5 steps 1–3) | investigation, 1 day |
| 11 | **Correct the stale instance hostname** wherever it still appears; `dev364430` returns HTTP 401 and `dev379024` is the reachable instance | Anyone following the older documentation will hit a 401 and conclude the credentials are wrong | 30 min |
| 12 | **Replace the single-DELETE rollback instruction** with the staged teardown this pass had to use | `DELETE /api/now/table/sys_scope/{id}` returns HTTP 500 *maximum execution time exceeded* at this data volume and does not cascade (§9.1) | 30 min |

### 10.5 Completed — kept for provenance, not for planning

These items were on the active list in earlier revisions of this document and are **done**. They are recorded
here so that the history of the plan is not lost, and removed from §10.0–§10.4 so the active list contains only
open work.

| Former # | Work | Outcome | Effort |
|---|---|---|---|
| 1 | ~~**Clean-slate upload → preview → commit the current package**~~ — ✅ **DONE, on the `7272edfc…` revision** | Run end to end on `dev379024` against sha256 `7272edfc…`, 3,618,378 bytes, 913 records. The revision current *when this row was written* (`89638c17…`, 3,643,389 bytes, still 913 records) differed only in the 9 payloads the QA-remediation pass re-synced, and was measured preview-neutral against this revision by a matched A/B preview (§0.3a). **Two revisions have shipped since, so this row does not cover today's bytes** — 926 blocks / 3,781,097 bytes / `7292a6fe…` (§0.1), which is why the work is re-listed as open item 1a. Pre-flight passed (using the corrected `upgrade_startedISNOTEMPTY^upgrade_finishedISEMPTY` predicate, since the documented `state=executing` one is invalid on this release). Staged teardown proven complete — scope `[]`, every census counter 0, all three tables at HTTP 400. Upload asserted the child count at exactly 913. Preview problems **by type**: 41 before on the populated instance → 298 on the first clean-slate pass (all `Found a local update that is newer than this one`) → **0 of any type**, confirmed by the platform's own `unresolvedProblems=false` / `shouldDisplay=true` predicate. Commit reached **`state=committed`**. The §9.5 C/9 sequence then reported **`verified=true`, `acl_links_total=27`, `errors=0`**. All seven gates were re-measured (§0.4) and the hash re-computed from the file on disk is unchanged. **Full record in §0.3** | — |
| 2 | ~~**Fix the four child-table ACL conditions** — replace `current.case` with `current.getValue('case')`~~ — ✅ **DONE** | `case` is a JS reserved word, so the conditions could not compile and denied every row; the agent had no access to tasks or parties (§9.6 E-ATF). Implemented as `current.getElement('case')`, which measurement showed to be the accessor that supports every operation the conditions need. The impersonated agent now sees 10 task rows and 8 party rows with `canWrite=true` and `canDelete=false`, and `ATF 07` passes with 58 checks across five parent fixtures — green in `TES0001014`. No functional access-control gap remains | 1 h incl. re-running ATF 07 — spent |
| 3 | ~~**Reduce each table to a single display field**~~ — ✅ **DONE in this pass**, in the packaged `Dictionary` blocks **and** in `post_import_remediation.js` | Was: every reference to a case rendered blank, and re-running the remediation reintroduced the problem. Now: the package ships one display field per table, and the script reconciles and verifies it (§9.6 E7) | — |
| 7 | ~~**Shorten the four over-length UI Action conditions** to ≤ 254 characters, or move the logic into the action script~~ — ✅ **DONE** | The truncated conditions made the guards fail open, so `Start Progress`, `Set Pending`, `Resume` and `Resolve` rendered for every status and every identity, including the read-only viewer (§9.6 **E3**). Implemented by moving the expression into `CaseTransitionValidator.canShowAction()`, leaving each condition a 71–78 character call. Re-measured as an 18-cell matrix on the live instance: 18/18 cells correct, the viewer now sees none of the six buttons and no `Update`, and all five server-side buttons still perform their transition when clicked | 1 h — spent |
| 9 | ~~**Resolve roles from `sys_user_has_role`** in `CaseTransitionValidator.canTransitionToClosed()` instead of `gs.getUser(userName)`~~ — ✅ **DONE** | Closes a latent authorisation hole on branch (b): any future caller that passes a foreign `userId` is answered against the *caller’s* roles. The shipped runtime never takes that branch and all 13 regression assertions pass, so this is hardening rather than a fix for a live failure (§9.6 E-GU, §9.7) | 30 min |
| 10 | ~~**Reconcile the duplicate `sys_ws_operation` identity** for the submit endpoint~~ — ✅ **DONE** | The artifact and the package carried different `sys_id`s for the same logical endpoint. Settled against the instance: the artifact's `e1b7bfa9…` returns **HTTP 404** while the package's `886ad712…` is the single live record, so `886ad712…` is now the sole identity in both (§9.3, §9.3a item 4) | — |
| 12 | ~~**Make `ATF 15/16/17` create their fixture inside the client step's transaction** (or use ATF's `{{step[…]}}` substitution)~~ — ✅ **DONE, BUT NOT THIS WAY: THE PREMISE WAS WRONG** | This item assumed a fixture-to-form handoff problem and residue dependence. Measurement disproved both: the fixture is created and visible, and the failure came from the platform resolving that step's record in **Global** scope while the table's cross-scope access columns were false (§9.6 **E-ATF15** / **E9**). Fixing those five booleans fixed all three tests without touching how the fixtures are made. Step 1 of each test additionally gained a handoff guard — it re-reads every fixture by `sys_id` with a plain GlideRecord and asserts it resolves — so a genuine handoff problem would now fail precisely and upstream instead of surfacing as "does not have a record with id". All three pass 7/7 in the client runner, individually and inside `TES0001014` | 2–3 h estimated; the actual fix was five boolean values |
| 13 | ~~**Re-run the full suite after items 2 and 12** and expect 20/20~~ — ✅ **DONE** | First achieved as `TES0001014`, and re-confirmed by the current run `TES0001015` (§8.3): **20 success / 0 failure / 0 error / 0 skipped**, 180 of 180 steps Success, `UI Batches Executed` 0 → 3, and again as the current `TES0001015` with the same rollup. The expectation was met exactly. What is **not** covered, and is now §10.0 item 2, is a re-run after re-loading the shipped artifacts on the current package revision | 30 min per run (client runner; `sn_atf.headless.enabled` cannot be enabled here) — spent |

Also completed in the documentation-truthfulness pass: every reference to the deleted standalone scope artifact
and to the deleted bootstrap artifact was repaired across the deliverable (171 broken relative references → 0).
Broken relative references are re-checked by hand whenever an artifact is added, renamed, moved or deleted;
this deliverable ships no repository-level CI tooling of its own.

### 10.6 Explicitly out of scope — unchanged

**Production deployment to a customer instance**, **UAT sign-off**, and **demo-data cleanup** remain out of
scope and are unaffected by this pass. Nothing above should be read as a step toward production readiness: this
is a proof of concept. §10.1 no longer holds any open work — every user-facing surface renders — so what stands
between this package and a clean, self-contained demonstration is now §10.0 alone: a round trip on the shipping
bytes, and a re-run of the ATF suite against re-loaded artifacts.
