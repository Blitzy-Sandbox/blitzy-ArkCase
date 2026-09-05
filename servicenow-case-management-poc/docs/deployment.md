# Deployment

## Purpose

This document captures the four-step deployment procedure for the ServiceNow scoped application POC, mapped 1:1 to Validation Gate 7 (Update Set integrity) defined in [`validation-gates.md`](./validation-gates.md). It is non-negotiable: every step MUST complete cleanly before delivery, and the Update Set XML MUST re-import on a fresh PDI with zero preview errors. The four steps — Export, Verify, Confirm, Deliver — are preserved verbatim from AAP Section 0.7.2 (User Example — Deployment steps) and are reproduced as quoted text within each section below so that any human operator (or future build agent) can execute the deployment using only this document plus the cross-referenced manual round-trip-verify procedure. **Standing note: this walkthrough has NOT been executed end-to-end on the elected deliverable's current byte sequence (926 blocks, 3,780,373 bytes, SHA-256 `a9204411593a4811f30540d30c8d56d73d8c34e2a288a3ac541596a15aaec274`) — no preview of the complete file has been run on it, so the AAP §0.7.1 Update Set gate is NOT MET for the file a reader holds until step 2 is run on it. What those bytes do carry, added 2026-09-03, is seven platform-native choice composites with their own runtime proof: that exact seven-child delta was uploaded, previewed to 0 problems of any type and committed by the native commit action (commit worker `state=complete`, message "Update set committed"), taking `sys_choice` for the three tables from 0 to 24 rows with every option label rendering on the real forms. Choice creation is therefore no longer a post-import step. The delivery election has been made and the elected package ships; the note below states which sequence carries which result and which artifact is retained as the upgrade path.**

> **CURRENT BYTES OF THE ELECTED DELIVERABLE — read this before comparing any digest in these documents.**
> The 2026-09-04 QA-findings pass (18 findings, F1-F18) re-cut `update-set/x_casemgmt_case_management_update_set.xml`.
> A follow-up remediation pass, prompted by an independent verification of that work, re-cut it
> again: the SAME 935 blocks, with six payloads changed and none added or removed.
> What to verify before an upload, and what to assert after it:
>
> | | Value |
> | --- | --- |
> | Blocks (`<sys_update_xml>` children) | **935** (was 926: 9 inserted) |
> | Bytes | **3,973,569** (was 3,944,374 at the QA-findings pass; 3,780,373 before it) |
> | SHA-256 | **`9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`** (was `4e28acae…` at the QA-findings pass; `a9204411…` before it) |
> | `…FALLBACK.xml` | byte-identical to the above, as always |
> | `…REBUILT-DEPENDENCY-ORDERED.xml` | **unchanged** at 988 blocks / 4,062,067 bytes / `e109e1d1…` — see the warning below |
>
> Inserted: 3 field-level `query_range` ACLs, 4 data-contract Business Rules, 1 Client Script, 1 Form Layout.
> Re-synced in place: 3 ACLs, 3 reports, 3 portal widgets, 1 Script Include, 2 dictionary rows, 1 ATF step
> value, and the Fix Script's embedded remediation body. Re-cut again by the follow-up pass: the portal
> Script Include, the two data-contract integrity Business Rules, the agent read ACL, and two portal
> widgets. The package's own header comment carries both record-by-record lists. Scoped-artifact counts move with it: **29** ACLs (was 26), **36** ACL role links the
> remediation creates (was 27), **11** Business Rules (was 7).
>
> **Every `a9204411…`, `3,780,373` and "926" figure elsewhere in this documentation set — and every
> `4e28acae…` or `3,944,374` figure, which belongs to the intermediate QA-findings revision — is a dated record
> of a superseded revision and is left as written** — those passages state what was measured at a point in
> time, and rewriting them would falsify the record. Where a *procedure* tells you to assert a child count or
> check a digest, it has been updated to the values above; if you find one that has not been, the values above
> win. The child count has been **935** since the QA-findings pass and the byte count and digest have moved
> twice since that pass began, so trust this block over any figure further down.
>
> **WARNING — the retained rebuilt package now REGRESSES this pass.** `…REBUILT-DEPENDENCY-ORDERED.xml` was
> deliberately left byte-untouched, because its only evidence is the byte-level provenance of 981 of its 988
> children against the one sequence that ever previewed to zero problems, and rewriting records inside a file
> that is retained rather than shipped would destroy that for nothing. The consequence is that promoting it as
> it stands would undo all 18 QA fixes. A promotion must first carry the 9 inserted and 14 re-synced records
> named in the elected package's header comment.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

> **Status of the zero-preview-error requirement stated above — two results, not one.** Zero problems of
> **any** type was reached on the 913-block, **3,618,378-byte**, SHA-256
> `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e` revision: **41** preview problems against
> an already-populated instance, **298** on the first pass after a proven teardown (all
> `Found a local update that is newer than this one` — the teardown's own deletions captured as local updates),
> and **0 problems of any type** once that local capture was purged at source, confirmed through the platform's
> own `unresolvedProblems=false` predicate, then committed to `state=committed`.
> The **31-problem** preview result that earlier revisions of this paragraph attributed to "the bytes that ship"
> belongs to a **different revision — 925 blocks, 3,698,577 bytes, SHA-256 `e49a7654…`**. On those bytes, uploaded
> as a fresh retrieved update set (925 children asserted) and previewed against an already-populated instance:
> **31 problems, all `Found a local update that is newer than this one`, and ZERO `Could not find a record`
> problems** — the 21 package-intrinsic reference problems present in the previous 913-block `89638c17…`
> revision are gone (63 reference errors → 0), because the 28 seed records now carry their parent key in the
> `display_value` attribute with an empty element body and pinned deterministic numbers. Every one of the 31
> was confirmed to have a local `sys_update_version` in state `current`, so all 31 are the instance's own
> history and cannot occur on a fresh PDI. **Commit was withheld on those bytes** — the verification instance
> is shared — so "0 of any type" remains proven only on `7272edfc…`.
>
> **Superseded on 2026-09-02, and the delivery election has since been made — the gate it reports is binary and
> takes one verdict per byte sequence, so read all three in order.** *(1) Where the gate is
> MET:* the full trip was measured
> on **export 3's byte sequence — 988 blocks, 4,062,436 bytes, SHA-256
> `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`, `2026-09-02T20:53:14Z`**: 0 `type=error`
> and 0 `type=warning` preview problems on a genuinely clean instance, then a single UI-action commit that
> succeeded 100% (613 inserted / 375 updated / 0 collisions), with physical storage and all 27 ACL role links
> confirmed afterwards. Those bytes are no file on disk — they survive only in git history — and their block
> order is exactly what the CR1 review's HIGH AAP §0.5.2 finding rejected. *(2) The retained rebuilt artifact:*
> the file was then re-sequenced into the AAP §0.5.2 dependency order, giving 988 blocks, 4,062,436 bytes,
> SHA-256 `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` — the same 988 records
> byte-for-byte at the same byte count, differing from the previewed bytes **only in the order of the
> `<sys_update_xml>` blocks** — and on 2026-09-03 the seven direct `sys_choice` children in that file were
> replaced with the platform-native choice composites described in the *Purpose* note, giving the file now on
> disk: **988 blocks, 4,062,067 bytes, SHA-256
> `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`**, in which 981 of the 988 children remain
> byte-identical to the previewed sequence. The round trip on the complete on-disk sequence was never run, so it
> is retained, **not shipped**, at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`. It satisfies
> AAP §0.5.2 dependency ordering and carries the platform-captured schema records and all 27
> `sys_security_acl_role` links, which makes it **the available upgrade path**: run the full gate on those exact
> bytes on a genuinely clean, dedicated PDI — confirm a clean target, checksum the bytes, upload asserting
> **988** children, preview to zero `type=error`, commit through the native "Commit Update Set" UI action,
> confirm physical storage for all three tables and all 36 role links, record the digest as verified with that
> run's timestamp — and it can then be promoted back to the deliverable path (§10.0 of
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)). It was checked statically —
> `xmllint --noout` clean, 988 blocks, every §0.5.2 dependency assertion passing, and 981 of its 988 children
> byte-identical to the previewed `eee9fabd…` bytes with the remaining 7 being the native choice composites,
> whose own delta previewed to 0 problems and committed natively on 2026-09-03 — and the complete on-disk bytes
> were **not** uploaded, previewed or committed anywhere; that is static corroboration plus an exact-child
> runtime result, not a round trip of that complete byte sequence.
> The record is
> [`../docs/refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md). *(3) What ships:* the exact-byte gate
> could not be completed on any instance available to this run, so under checkpoint OVERRIDE-2 the untouched
> original package was **elected** as the deliverable, and it is the artifact the remainder of this note
> describes. It sits at `update-set/x_casemgmt_case_management_update_set.xml`, byte-identical to
> `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`. **It does not include this round's
> native-rebuild fix** — measured on the file, 0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25
> hand-authored `sys_dictionary` rows — so the 27 ACL-role links are absent from it and
> `scripts/post_import_remediation.js` must be run to create them, exactly as
> [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) documents. **Electing it
> settled which package ships; it did not pass the gate.** On 2026-09-03 the elected file's seven direct
> `sys_choice` children were replaced with platform-native choice composites — the one change made to it since
> the election, leaving 919 of its 926 children byte-identical — so **choice creation is no longer among the
> post-commit steps**, while the physical-schema and ACL-role-link remediation and the seed pass still are.
> §5 of that guide, run against the elected file on a
> genuinely clean PDI and asserting **935** children, is what discharges the zero-preview-error requirement
> stated at the top of this document for the artifact a reader holds:
>
> **The elected bytes are 926 blocks, 3,780,373 bytes, SHA-256
> `a9204411593a4811f30540d30c8d56d73d8c34e2a288a3ac541596a15aaec274`, and NO preview of the complete file has
> been run on them, so the Update Set gate is NOT MET for the deliverable and this walkthrough must not be read
> as already executed on it. Their seven choice children, and only those, carry a preview-and-commit result of
> their own: the exact seven-child delta was previewed to 0 problems of any type and committed natively on
> 2026-09-03, `sys_choice` 0 → 24.**
> Be precise about which measurement belongs to which artifact. **Twelve distinct package byte sequences exist
> across this deliverable's history; seven of them carry a full-package preview result and five carry none, two
> of those five carrying instead the exact-child preview and commit of their seven choice composites** — the
> table below is the whole lineage, one row per sequence, so no result can be borrowed by a file it was not
> measured on. Count the Preview column rather than trusting this sentence:
>
> | Digest (SHA-256) | Blocks | Bytes | Preview | Commit | Artifact / path | Class |
> |---|---:|---:|---|---|---|---|
> | `32a064d6…` | 916 | 3,448,009 | 0 problems of any type | committed | no file on disk — git history only | historical |
> | `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e` | 913 | 3,618,378 | 0 problems of any type (41 → 298 → 0) | `state=committed` | no file on disk — git history only | historical |
> | `89638c17d328839d7b2cbba1525f9490c95b7f54434792fd732846126b3da13e` | 913 | 3,643,389 | **120 `type=error`** (40 distinct, 21 package-intrinsic) | not committed | no file on disk — git history only | historical |
> | `e49a7654…` | 925 | 3,698,577 | 31 problems, all `Found a local update that is newer than this one`; **0** `Could not find a record` | commit withheld (shared instance) | no file on disk — git history only | historical |
> | `f482214ae73a6402b54b6ebce8feac229f5849ddb23473a2b…` | 926 | 3,781,093 | none | none | no file on disk — superseded intermediate, 4 bytes from the elected file (`pie` → `donut`, twice) | historical |
> | `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` | 926 | 3,781,097 | **none ever** | none | no file on disk — the elected sequence as it stood 2026-09-02, superseded 2026-09-03 by the choice-composite fix | historical |
> | `a9204411593a4811f30540d30c8d56d73d8c34e2a288a3ac541596a15aaec274` | 926 | 3,780,373 | **none on the complete file**; its seven choice children previewed **0 problems of any type** as their own delta, 2026-09-03 | seven-child delta committed natively 2026-09-03 (`sys_choice` 0 → 24); complete file never committed | `update-set/x_casemgmt_case_management_update_set.xml` + `…FALLBACK.xml` | **CURRENT deliverable — gate NOT MET; static evidence plus exact-child runtime proof** |
> | `df110c9526bdc81d62b06b0f6a58b5573a83b9d3153fcd7c623ef9704668a000` | 988 | 4,062,298 | **63 `type=error`** | not committed | no file on disk — export attempt 1 (snapshot `7af37c12930f435009aa70d19dba105a`) | historical |
> | `7c382fab41954ebea107c610a0c496343e29e3393bd5788c441080e58c2163db` | 988 | 4,062,436 | **60 `type=error`** | not committed | no file on disk — export attempt 2 (snapshot `23467496930f435009aa70d19dba1013`) | historical |
> | `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` | 988 | 4,062,436 | **0 `type=error` / 0 `type=warning`** | committed `2026-09-02T20:53:14Z` | no file on disk — export 3 (snapshot `0b3b7452934f435009aa70d19dba100d`) | historical — **the only complete round trip this run** |
> | `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` | 988 | 4,062,436 | none | none | no file on disk — the §0.5.2-reordered sequence as it stood 2026-09-02, superseded 2026-09-03 by the choice-composite fix | historical |
> | `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` | 988 | 4,062,067 | **none on the complete file**; the same seven choice children previewed **0 problems of any type** as their own delta, 2026-09-03 | seven-child delta committed natively 2026-09-03; complete file never committed | `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` | retained, not shipped — **static evidence plus exact-child runtime proof** |
>
> Read the table as the rule INTERP-9 states: a runtime measurement belongs to the byte sequence it was taken on.
> Only two on-disk artifacts exist — the elected `a9204411…` deliverable and the retained `e109e1d1…` rebuild —
> and **neither of them carries a preview or a commit result for its complete bytes**; what each does carry is
> the 2026-09-03 preview-and-commit result of the seven choice-composite children they hold in common, whose
> payloads are byte-identical to the seven children the platform committed. What changed from `e49a7654…` to the
> then-elected `7292a6fe…` bytes is small and fully enumerated: **13 payloads** re-synced
> (8 `sys_report`, 2 `Dashboard`, 3 `sp_widget`) and **1 block added** (the case form's Related Lists
> definition), all of it presentation-layer work resolving a QA report. What *has* been measured on those
> records: every one of the 14 deployed to a live PDI and read back field-for-field identical to its
> artifact; every table and column any of them names checked to exist in `sys_db_object` / `sys_dictionary`;
> all 926 embedded payloads parsing; `xmllint --noout` clean; and the runtime outcome of each change verified in
> a browser. What changed again on 2026-09-03, giving the elected `a9204411…` bytes, is equally bounded: the
> **seven** direct `sys_choice` children were replaced by seven platform-native choice composites — a canonical
> `sys_choice_<table>_<field>` wrapper carrying one `x_casemgmt`-owned `sys_choice_set` and the authored value
> rows nested inside it, 24 values in total (2 `case.type` / 6 `case.status` / 4 `case.priority` /
> 3 `case.pending_reason` / 4 `case_task.type` / 3 `case_task.status` / 2 `case_party.party_type`) — with the
> other **919** children byte-identical. Those seven children *were* measured: uploaded as their own delta,
> previewed to **0 problems of any type**, committed by the native commit action, `sys_choice` **0 → 24** with
> the exact option labels on the real forms — the full record is
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3d](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). What has **not** been
> measured is a preview or a commit of the complete file. The reason the residual risk is bounded rather than unknown: 13 of the 14 presentation records
> already existed in the previous revision under the same
> `sys_id` in the same canonically named block, so they can only produce the local-history collision class
> described above; the one new block is a `sys_metadata` descendant whose only reference is to
> `x_casemgmt_case`, which travels in the same set; and the seven choice blocks are the platform's own captured
> output, previewed and committed as such. That is a reasoned expectation, not a result — treat it as
> such. An earlier
> 916-block revision (3,448,009 bytes, SHA-256 `32a064d6…`) reached the same zero result as `7272edfc…` and is
> retained as history in [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.10](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md);
> §0.3c of that document is the current record for the shipping bytes. **Verify the digest before you upload, so
> you know which artifact you are testing** — and note that a bare commit is not sufficient on its own: the
> §9.5 install sequence below is mandatory, because the commit creates the table metadata without physical
> storage.

## Pre-Deployment Checklist

The following prerequisites MUST hold before starting the export step. They align with AAP Section 0.7.2 (Pre-build instance verification) and Section 0.7.1 (Round-trip-verify rule). If any item below is unchecked, do NOT proceed — resolve the underlying issue first, then re-run this checklist.

- Source PDI is accessible and admin login succeeds at `[instance URL]`. If login fails, stop and report — do not proceed.
- Validation Gates 1–6 have all passed on the source PDI (see [`validation-gates.md`](./validation-gates.md)).
- All seed data has been committed via the seed script in [`../scripts/seed_demo_data.js`](../scripts/seed_demo_data.js) and is visible in the case list. At minimum: 10 demo cases spanning all 6 statuses (Draft, Open, In Progress, Pending, Resolved, Closed) and both case types (General Inquiry, Complaint), 3 demo users (one per role), 1 demo group, and an open + closed task mix on selected demo cases.
- All 7 Flow Designer flows are **Active** *and* **Published** (not Draft) — the 2 parent flows `general_inquiry_state_machine` and `complaint_state_machine` and the 5 `validate_*_transition` subflows. Confirm both columns: a flow that is active but unpublished does not enforce. Equally important, confirm the before-update Business Rule **`x_casemgmt_enforce_forward_transitions` (order 250)** is present and active — it is what converts a subflow's refusal into a blocking form error, and without it the flows run but nothing blocks.
- Both dashboards (Agent Workspace, Manager View) render with synthetic data, with no broken report references. **This item now passes, and both defects behind its earlier failure are fixed.** Each dashboard composite block used to name **three child tables that do not exist on this release** — `pa_tab` (real name `pa_tabs`), `pa_dashboard_widgets` (`pa_widgets`) and `pa_dashboard_role` (no equivalent) — so the tab, every widget placement and the role grants were dropped on commit and each dashboard rendered 0 tabs and 0 widgets. Both artifacts and both payloads have been re-authored onto the chain this release actually uses: `sys_portal_page` + `sys_grid_canvas` + `pa_tabs` + `pa_m2m_dashboard_tabs` + `pa_dashboards` (carrying `restrict_to_roles`) + `pa_dashboards_permissions` share rows + one `sys_portal` / `sys_portal_preferences` / `sys_grid_canvas_pane` trio per widget. **Measured after the fix: Agent Workspace renders 3 of 3 widgets and Manager View 5 of 5**, with live data and correct chart types, zero console errors, and correct persona behaviour — manager sees both, agent sees Agent Workspace only, viewer is refused both by design. The second defect was in the reports: the four chart reports specified `<group_by>`, which is **not a column on `sys_report`** (the column is `field`), and no report was readable by any persona because a report's read ACL only evaluates roles when `sys_report.user` is the literal `GLOBAL`. All 8 now ship `field` where applicable, `roles` and `user=GLOBAL`, and all four charts plot the intended dimension. See [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.5 and §0.6.1](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).
- Portal submission and lookup behave correctly, **at both the REST layer and the page layer**. The two portal pages used to render blank because their Service Portal layout records had never been authored and both widgets mis-read the Scripted REST response envelope; both defects are fixed and the pages were re-verified anonymously in a browser.
- No hard-coded `sys_id` literals exist in any Update Set artifact. Search via Studio → Find: regex `[a-f0-9]{32}` across the scoped application; zero matches inside flow scripts, ACL conditions, business rules, script includes, scripted REST handlers, UI policies, UI actions, and seed records.
- All artifacts are in scope `x_casemgmt`, with **exactly one disclosed and approved exception** — the installer Fix Script `x_casemgmt Post-Import Remediation`, which is authored **global** because the `GlideTableDescriptor` and `GlideSecurityManager` calls it needs are refused in scoped execution. See the Rules Compliance note at the end of this document for the full rationale. Verify by filtering `sys_app=x_casemgmt Case Management` on every record type listed in the [Step 1](#step-1-export-the-update-set) artifact inventory; the Fix Script is the only record expected to differ, and global tables must show **data** inserts only, never schema changes.
- The current Update Set (top-right Update Set picker) is the scoped application Update Set, not the Default or another in-flight set. All in-progress edits since the last export must be on this Update Set.
- The browser is signed in as an admin user on the source PDI, with permission to mark Update Sets Complete and to export them.

## Step 1: Export the Update Set

Per AAP Section 0.7.2: "Navigate to System Update Sets → Local Update Sets. Locate the scoped application Update Set. Set status to Complete. Export as XML."

### Detailed Sub-Procedure

1. On the source PDI, navigate to **System Update Sets** → **Local Update Sets**.
2. Locate the Update Set whose application matches the scoped application (filter `Application = x_casemgmt Case Management`). If multiple Update Sets exist for this application, identify the one containing every artifact enumerated below — there should be exactly one.
3. Confirm the Update Set contains the expected artifacts. The inventory below mirrors the directory layout in AAP Section 0.4.1 and the file-by-file transformation map in AAP Section 0.5.1. A missing artifact at this stage means the export will fail Step 2 (preview).

   - **1 sys_app record** — `app/sys_app/x_casemgmt_case_management.xml`. There is deliberately **no standalone `sys_scope` artifact**: the platform derives the `sys_scope` row from the application record on commit, so shipping one would duplicate it. Earlier revisions of this inventory listed "1 sys_app + 1 sys_scope"; that artifact was removed.
   - **3 sys_db_object table records** — `x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`.
   - **All sys_dictionary records for the 25 fields total (14 + 6 + 5)** — covering every field on every custom table per [`data-model.md`](./data-model.md). The case table contributes 12 user-prompt fields plus a `pending_reason` choice field plus a `duration_to_close` virtual Function Field (14 total); the case_task table contributes 6 fields; the case_party table contributes 5 fields.
   - **7 Choice list records — one per Choice field** — `case.type`, `case.status`, `case.priority`, `case.pending_reason`, `case_task.type`, `case_task.status`, `case_party.party_type`. Since 2026-09-03 each ships as the platform's own native composite: a canonical `sys_choice_<table>_<field>` block whose payload carries one `x_casemgmt`-owned `sys_choice_set` and, nested inside it, the authored `sys_choice` value rows — 24 values across the seven fields (2 / 6 / 4 / 3 / 4 / 3 / 2). Commit them and the rows exist; there is **no post-import choice-creation step**.
   - **3 sys_user_role records** — `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`.
   - **All sys_security_acl records** — one per role × table × CRUD combination plus field-level ACLs on `assigned_group` and `assigned_agent` and parallel ACLs on `case_task` and `case_party`. See [`acl-matrix.md`](./acl-matrix.md) for the full inventory.
   - **7 sys_hub_flow records** — the 2 parent flows `general_inquiry_state_machine` and `complaint_state_machine`, plus the 5 subflows `validate_open_transition`, `validate_inprogress_transition`, `validate_pending_transition`, `validate_resolved_transition`, `validate_closed_transition` under `flows/sub_flows/`. (Note: the fourth subflow's **instance** internal name is `validate_in_progress_transition`, with underscores, while the repository file is `validate_inprogress_transition.xml`.)
   - **1 Custom Action + 1 shared flow logic block** — `flows/custom_actions/x_casemgmt_transition_guard_action.xml` (`sys_hub_action_type_base`), which returns the transition verdict to a flow, and `flows/sub_flows/shared_flow_logic_block.xml` (`sys_hub_flow_block`), the shared logic block the five subflows reuse.
   - **2 Script Includes** — `x_casemgmt_CaseTransitionValidator` and `x_casemgmt_CasePortalService`.
   - **11 Business Rules** — nine on `x_casemgmt_case`, in execution order: **`validate_case_mandatory_fields` (50, before-insert + update)**, **`validate_case_text_lengths` (70)**, `block_terminal_closed` (100, before-update), `set_opened_date` (100, before-insert), `block_draft_backtransition` (200), **`enforce_forward_transitions` (250)**, `validate_assigned_agent_membership` (300, insert + update), `clear_pending_reason_on_inprogress` (400), `set_closed_date` (500) — plus one on each child table at order 100: **`validate_case_task_integrity`** and **`validate_case_party_integrity`**. The order-250 rule is the one that invokes the transition subflow and turns its verdict into a blocking form error; the order-500 rule is the only writer of `closed_date`. The four order-50/70/child rules enforce the AAP §0.5.7 data contract server side — mandatory `subject`/`description`/`requester_name`, the string lengths, the task's own mandatory columns, and the party's exactly-one-of `person`/`organization` matching `party_type` — because a UI Policy cannot reach a Table API caller, which is how a blank or malformed row used to be creatable. Earlier revisions of this inventory listed seven, and before that six omitting `enforce_forward_transitions`.
   - **6 UI Actions** — the state-transition buttons under `ui_action/`.
   - **1 Fix Script** — `x_casemgmt Post-Import Remediation`, carrying the post-import remediation body verbatim. It is authored **global** by design (see the note in Step 2) and **does not execute by itself**.
   - **761 ATF records** — 20 test definitions, 180 test steps, 540 step inputs (539 `sys_variable_value` + 1 variable value), 1 test suite and 20 suite-member links. This is by far the largest part of the package: 761 of its 926 blocks.
   - **1 UI Policy** — `case_party_conditional_fields` (shows `person` when `party_type=Person`; shows `organization` when `party_type=Organization`).
   - **1 List Layout + 1 Related Lists definition, both on the case table's Default view** — `sys_ui_list_x_casemgmt_case_null` under [`../list_layouts/`](../list_layouts/), which puts `subject`, `type` and `status` back into the case list in AAP field order, and `sys_ui_related_x_casemgmt_case_null` under [`../related_lists/`](../related_lists/), which is the definition plus the two entries (`x_casemgmt_case_task.case` at position 0, `x_casemgmt_case_party.case` at position 1) that make the case form show its own tasks and parties. Neither record type extends Application File at the child level, so each ships as one block carrying its children inline. See step 12 of Step 3 for the related-list cache caveat.
   - **1 sp_portal record + 2 pages + 3 widgets + 2 sys_ws_definition records** — the Experience Portal record, the case-submit and case-status pages, the submission/lookup/confirmation widgets, and the two scripted REST endpoints (`/api/x_casemgmt/case_submit`, `/api/x_casemgmt/case_status_lookup`).
   - **2 pa_dashboards records + 8 sys_report records** — Agent Workspace, Manager View, plus the eight reports enumerated in [`dashboards.md`](./dashboards.md).
   - **All seed data records** — under the scoped tables (`x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`) plus role-to-user assignments. User and group references resolve by `user_name` and `name` lookup respectively (no `sys_id` literals).

4. Set the Update Set state to **Complete**. The simplest path is the top-right Update Set picker → **Complete**, which prompts for confirmation; click **OK**. Once Complete, no further changes can be added to this Update Set without back-out.
5. Click **Export to XML** on the Update Set form (Related Links panel). The browser will download a single XML file. Save the resulting file to `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`. This is the canonical deliverable file path defined by AAP Sections 0.3.1 and 0.4.1; do not save under any other name or location.

### Notes

- **Exactly one file in [`../update-set/`](../update-set/) is the shipping deliverable:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`. That is the canonical path pinned by AAP Sections 0.3.1 and 0.4.1, it is the single file a deployer uploads in [Step 2](#step-2-verify-update-set-integrity), and it is the path quoted in [Step 4](#step-4-deliver). A fresh export **overwrites that one path in place** — never version it beside itself (no `…_v2.xml`, no `…-2026-09-02.xml`, no browser-suffixed `… (1).xml`), because a second candidate deliverable in the same directory makes "the Update Set XML" ambiguous to whoever imports it.
- **Two deliberately named artifacts are retained alongside it and MUST NOT be deleted.** They are not deliverables and no deployer imports them; each is on disk for a documented reason:
  - `x_casemgmt_case_management_update_set.FALLBACK.xml` — the retained original, byte-identical to the shipping deliverable (926 blocks, 3,780,373 bytes, `a9204411…`). Its retention is **required** by directive D3/S0: the elected fallback must stay on disk under its own name so the bytes that were elected remain independently identifiable even after a later export overwrites the deliverable path. Both copies carry the 2026-09-03 native choice composites, and both must be replaced together so they stay byte-identical.
  - `x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` — the AAP Section 0.5.2 dependency-ordered rebuild (988 blocks, 4,062,067 bytes, `e109e1d1…`), retained but **not shipped**. It is the upgrade path described in the note under *Purpose* above and in §10.0 of [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md): once the full gate has been run on those exact bytes it can be promoted onto the deliverable path.
- **What is prohibited is unnamed or transient output, not a second file.** Nothing may accumulate in [`../update-set/`](../update-set/) except the shipping deliverable and the deliberately named retained artifacts above, each of which is itemized in [Cross-References](#cross-references). Intermediate exports, partial or interrupted downloads, and scratch copies MUST be removed rather than left in the directory, and any further artifact kept there MUST be given an explicit self-describing name and listed in Cross-References with the reason it is retained — an unexplained XML in that directory is indistinguishable from the deliverable to a deployer working from this document.
- If the export downloads multiple files (this can happen when the Update Set is unusually large), the export operation has split the artifact. This is a hard failure for this POC because the AAP requires a **single** Update Set deliverable. Resolve by reducing the Update Set scope to only the scoped application and re-exporting.

## Step 2: Verify Update Set Integrity

Per AAP Section 0.7.2: "Re-import the exported XML on the same instance via System Update Sets → Retrieved Update Sets → Upload. Preview the Update Set. Zero errors required before proceeding. If preview errors exist, resolve them in the source application before re-exporting."

### Detailed Sub-Procedure

1. Navigate to **System Update Sets** → **Retrieved Update Sets**.
2. Click **Import Update Set from XML** in the Related Links panel.
3. Upload the exported XML file from Step 1.
4. Open the imported record. State should be **Loaded**. If the state is anything else (e.g., **Failed to load**), open the Update Set log and resolve the underlying parse or schema issue on the source PDI, then restart from Step 1.
5. Click **Preview Update Set**. Wait for preview to complete; this can take 1–5 minutes depending on the size of the Update Set and the load on the PDI.
6. Examine the **Preview Problems** list:
   - Zero rows = pass. Proceed to Step 3.
   - One or more rows = **fail**. Do not commit. Resolve the underlying issue in the source application and restart from Step 1.

### Common Preview Problem Categories and Remediation

The remediation guidance below covers the most frequent preview-problem patterns observed when round-tripping a scoped application. The first category, **"Could not find a record"**, is by far the most common failure mode and accounts for the majority of preview-error reports.

- **"Could not find a record"** — typically caused by hard-coded `sys_id` references that do not exist on the destination instance. The source-application fix is to replace the literal `sys_id` with a `GlideRecord` lookup by a stable human-readable key per AAP Section 0.5.2 reference resolution rules. Lookup keys by record type:
  - User references → `sys_user.user_name`
  - Group references → `sys_user_group.name`
  - Role references → `sys_user_role.name`
  - Company references → `core_company.name`
  - Case references → `x_casemgmt_case.number`
  - Role-label references → `x_casemgmt_case_party.role_label`
  Re-export the Update Set after the source-side fix and restart Step 2.
- **"Found in update set but missing"** — a referenced artifact was not captured in the Update Set. Verify the Update Set scope is `x_casemgmt` and that the missing record is included in the source Update Set's collected records. The cause is usually that a record was edited under the Default Update Set rather than under the scoped application Update Set, or that the referenced record lives outside the scoped application (which would be an out-of-scope global-scope write — investigate and remove). Re-export the Update Set after the fix and restart Step 2.
- **"Has been changed by..."** — there is a global-scope conflict. The Update Set attempts to modify a record that is also being modified by a record outside the scoped application. Verify no global-scope writes exist in the Update Set per AAP Section 0.3.2 ("Global scope changes of any kind"). The remediation is to remove the conflicting modifications from the Update Set on the source PDI; if the conflict is intrinsic to the scoped-app design, the design has violated the scoped-namespace exclusivity rule and must be reworked.
- **"Skip"** rows in the preview — these are not errors but indicate the destination already has a newer version of the record. For a fresh PDI verification, every row should be **Insert** or **Update**, not **Skip**. If skips appear on a fresh PDI, the destination is not actually fresh — start over with a clean PDI.

For the comprehensive manual round-trip verification procedure, see [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md).

## Step 3: Confirm Deployed State

Per AAP Section 0.7.2: "After successful preview, commit the Update Set. Verify the following are present and functional post-commit: all 3 custom tables visible in App Engine Studio; Both Flow Designer flows active (not draft); Experience Portal accessible at `[instance URL]/x_casemgmt_portal` (or equivalent portal URL); Both dashboards accessible to users with correct roles; Synthetic demo data visible in case list."

> **On the elected package, a commit alone does NOT reach this walkthrough's state — the paragraph below applies
> in full.** A single commit reaching physical storage for all three tables (HTTP 200; dictionary 21 / 14 / 13)
> and all **27** ACL role links (manager 14 / agent 10 / viewer 3) with the remediation script never run was
> measured on the 2026-09-02 native-rebuild run's 988 records
> — [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) — and **that package is retained rather than
> shipped** (`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`), so the result
> does not transfer to the elected deliverable. The elected package carries 0 `sys_security_acl_role` rows and
> the 25 hand-authored `sys_dictionary` rows, which is why both manual steps are required on it. The **choice
> lists are no longer among them.** Since 2026-09-03 both packages carry the seven native choice composites, and
> that exact seven-child delta was previewed to 0 problems and committed natively, taking `sys_choice` for the
> three tables from **0 to 24** rows with every option label rendering on the real forms — so a commit now
> creates the choices and no post-import choice step is required. What still needs a post-commit step is the
> seed-row linkage (task/party `case` references and the Organization → `core_company` references) and
> `opened_date`, both of which `scripts/seed_demo_data.js` handles. The seeder reconciles an expected reference
> when it is blank, contains a non-`sys_id` raw key, or points to a row that no longer exists; it preserves any
> valid populated reference, including a valid operator-managed alternative.
>
> **On the elected package — the retained original — a commit alone did not reach it.** A clean-instance
> round trip established that after commit the three tables exist as metadata with **no physical storage** and the
> 26 ACLs have **0 of 27** role links. That same trip also found the dashboards' child records failing to commit
> and the portal pages rendering blank; **both of those were packaging defects and both are fixed** (see the
> *Steps 9-11 now pass* note below), so the two remaining shortfalls of a bare commit are the physical schema and
> the ACL role links — the two that need the manual remediation run.
>
> **Nothing in the current package fires on its own.** It contains **no auto-execute record of any kind** — no
> Business Rule, no scheduled job, no trigger. The remediation body ships as the Fix Script `x_casemgmt
> Post-Import Remediation`, and a Fix Script does not self-run; running it from the Fix Script UI executes it in
> the application scope and fails. An earlier revision did ship an auto-execute Business Rule, and it was
> measured firing and then failing (121 errors, all `GlideTableDescriptor`/`GlideSecurityManager is not allowed
> in scoped applications`) because the commit engine rewrites the dispatched record's scope; it has been removed,
> also because its condition matched the commit of *any* retrieved Update Set. **An operator must run the
> remediation by hand, in scope Global.**
>
> Use [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) — its seven-step primary
> procedure — as the authoritative install procedure, with
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.5](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) for the per-defect
> evidence, and treat the sub-steps below as the verification checklist to run *afterwards*. Note also that the
> install requires the Update Set to be committed a **second** time, because rebuilding the tables cascades the
> ACLs away.
>
> **Steps 9-11 now pass, and previously did not.** An earlier revision of this document warned that steps 9-10
> could not pass because both dashboards rendered 0 tabs and 0 widgets, and that the related-lists clause of
> step 11 could not pass because no `sys_ui_related_list` row existed for the scope and the form's
> related-lists wrapper measured 0 pixels tall. Both were packaging defects in this package, both have been
> fixed, and both were then re-verified in a browser against the running application:
>
> - **Dashboards.** The two dashboard artifacts described the widget wiring with three tables that do not exist
>   on the platform (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`), so the dashboards committed as
>   empty shells. They now carry the real wiring - `sys_portal_page`, `sys_grid_canvas`, `pa_tabs`,
>   `pa_m2m_dashboard_tabs`, and one `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` triple per
>   widget - plus the two records that actually govern who may open a dashboard,
>   `pa_dashboards_permissions` (the share list) and `pa_dashboards.restrict_to_roles` (the gate the renderer
>   quotes when it refuses). Agent Workspace renders 3 of 3 widgets and Manager View 5 of 5, with the seed data,
>   for the admin **and** for the personas step 9 and step 10 name.
> - **Related lists.** The package now ships
>   [`../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml`](../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml),
>   and the case form renders Case Tasks above Case Parties with their child rows. **See step 12 below** for the
>   one caveat: the definition is cached server side, so if the form was ever rendered before the definition
>   existed, the lists stay invisible until that cache is invalidated.
>
> The still-open items are the ones `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.4 and §10.0 list. Its dashboard and
> related-list entries have been retired: §0.5 and §0.6 now record both as fixed and keep the original
> measurements as forensic history, which is why those sections still contain the old numbers in past tense.

### Detailed Sub-Procedure

1. Click **Commit Update Set**. Wait for commit to complete. Commit can take 1–3 minutes; do not navigate away from the page until commit completes successfully.
2. Open **App Engine Studio** (Now Platform → All → App Engine Studio). Confirm the scoped application appears in the Apps list. Open the application and confirm 3 tables are listed:
   - `x_casemgmt_case`
   - `x_casemgmt_case_task`
   - `x_casemgmt_case_party`
3. Open **Flow Designer** (Now Platform → All → Process Automation → Flow Designer). Filter by **application `x_casemgmt Case Management`** — filtering by a name pattern such as `x_casemgmt_*state_machine` matches nothing, because flow names carry no scope prefix. Confirm both parent flows are **Active** *and* **Published** (not Draft):
   - `general_inquiry_state_machine`
   - `complaint_state_machine`
   All five subflows must also be Active and Published: `validate_open_transition`, `validate_in_progress_transition`, `validate_pending_transition`, `validate_resolved_transition`, `validate_closed_transition`. Then confirm the before-update Business Rule **`x_casemgmt_enforce_forward_transitions` (order 250)** is present and active — the flows decide, but that rule is what blocks the write and puts the message on the form.
4. Open the Experience Portal at `[instance URL]/x_casemgmt_case_portal`. The slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml); the AAP verbatim wording quoted in the section above uses the generic placeholder `x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time"). Open the URL in a private/incognito browser window so that no admin session interferes — both pages must work anonymously.
5. Confirm both pages render anonymously:
   - The case submission page (5 input fields: subject, type, description, requester_name, requester_email).
   - The case status lookup page (1 input field: case number).
6. Submit a test case via the submission page. Use synthetic input only (no real names, no real email addresses). Confirm the auto-generated case number is returned in `CASE0000001` format on the confirmation panel.
7. Look up the test case via the status lookup page using the case number returned in step 6. Confirm `status`, `subject`, `opened_date` are returned, and that no internal fields (`assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email`) are exposed.
8. Test the "not found" path with case number `CASE9999999`. Confirm the literal text `"No case found with that number."` (verbatim) appears.
9. Log in as `x_casemgmt_demo_agent`. Open Performance Analytics → Dashboards → **Agent Workspace**. Confirm all 3 widgets render with synthetic data:
   - My Open Cases (list)
   - My Overdue Tasks (list)
   - Case Count by Status (donut)
10. Log in as `x_casemgmt_demo_manager`. Open the **Manager View** dashboard. Confirm all 5 widgets render:
    - All Cases by Status (bar)
    - All Cases by Type (donut)
    - All Cases by Priority (bar)
    - Average Time to Close (single-score)
    - Cases Opened in Last 30 Days (single-score)
11. Open the case list (`x_casemgmt_case.list`). Confirm at least 10 demo cases are visible spanning all 6 statuses (Draft, Open, In Progress, Pending, Resolved, Closed) and both case types (General Inquiry, Complaint). Open one demo case, scroll to Related Lists, and confirm the case_task and case_party related lists render with seed records. Expect two sections, **Case Tasks above Case Parties**; on a seeded instance a case such as `CASE0000981` shows one Open and one Closed task and one Person and one Organization party.
12. **If step 11 shows no related lists at all, do this before treating it as a failure.** The platform caches the related-list definition for a (table, view) pair server side, and the cached answer is not invalidated when the definition arrives by a path other than the platform's own UI. The symptom is specific and misleading: **Configure → Related Lists** correctly lists `Case Task->Case` and `Case Party->Case` in its Selected column and the rows read back correctly from `sys_ui_related_list` / `sys_ui_related_list_entry`, yet the form renders `#related_lists_wrapper` at 0 px with no list markup in the document and issues no related-list request. To clear it, open the case form → hamburger menu → **Configure → Related Lists**, change nothing, and press **Save**. That processor reinserts the definition through the path that invalidates the cache; the lists appear immediately and persist across fresh loads. Flushing the instance cache (`/cache.do`) is the heavier alternative. Note that re-writing the same field values over the REST Table API does **not** help: an update that dirties no field is a no-op and fires no business rule. Re-saving through the UI also **replaces the three records' sys_ids**, because that processor deletes and reinserts rather than updating in place — harmless, since the definition is matched on `sys_update_name`, but worth knowing if you are comparing an instance against the shipped artifact.

If any of steps 2–11 fails, do not proceed to Step 4. Instead, follow the [Rollback Procedure](#rollback-procedure) below, address the underlying issue on the source PDI, and restart from Step 1. Step 12 is a remedy, not a gate: apply it and re-run step 11.

## Step 4: Deliver

Per AAP Section 0.7.2: "Provide the exported Update Set XML file path and the portal URL as final deliverables alongside confirmation that all validation gates passed."

### Detailed Sub-Procedure

1. Confirm the exported XML file is at `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` (the canonical path from AAP Sections 0.3.1 and 0.4.1).
2. Note the actual portal URL (e.g., `https://devXXXXXX.service-now.com/x_casemgmt_case_portal`). The host portion is the actual PDI hostname assigned at PDI provisioning; the path portion is the portal URL chosen at portal-record creation time and matches the `<url_suffix>` value in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml). The AAP verbatim wording uses the generic placeholder `x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time").
3. Compile a delivery summary that includes:
   - **Update Set XML path:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`.
   - **Portal URL:** the actual `https://devXXXXXX.service-now.com/x_casemgmt_case_portal` URL recorded in step 2.
   - **Validation gates:** confirmation that all 7 validation gates passed (see [`validation-gates.md`](./validation-gates.md)).
   - **Demo users:** the three demo users and their assigned roles:
     - `x_casemgmt_demo_manager` → `x_casemgmt_case_manager`
     - `x_casemgmt_demo_agent` → `x_casemgmt_case_agent`
     - `x_casemgmt_demo_viewer` → `x_casemgmt_case_viewer`
   - **Sample case number:** at least one case number from the seed data (e.g., the case generated in [Step 3](#step-3-confirm-deployed-state) sub-step 6, or a known seed case from [`../seed-data/cases/`](../seed-data/cases/)).

This is the **final** deliverable. Per AAP Section 0.7.1, no additional artifacts beyond what is enumerated in AAP Section 0.3.1 are produced; per AAP Section 0.7.2 (Minimal-Change Clause), no additional capabilities are added.

> **Sub-step 3's "confirmation that all 7 validation gates passed" cannot be given for the artifact as it
> stands.** The Update Set gate is binary and it is **NOT MET** on the elected deliverable's byte sequence
> `a9204411593a4811f30540d30c8d56d73d8c34e2a288a3ac541596a15aaec274`, because no upload → preview → commit
> trip has been run on the complete file — only on the seven choice children it carries, whose delta previewed
> to 0 problems and committed natively on 2026-09-03 (the note under *Purpose* above, and §10.0 of
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)). The delivery election is
> settled — the elected package is what ships — but electing it passed no gate, so **this step cannot be
> completed as written and the confirmation must not be given.** Running Step 2 against the elected file on a
> genuinely clean, dedicated PDI, asserting **935** children, is what makes the deliverable deliverable; running
> it against the retained `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`,
> asserting **988**, is the upgrade path that would additionally restore the 27 packaged role links. What can be
> reported honestly today is the measured rollup in [`validation-gates.md`](./validation-gates.md): **4 gates
> pass outright, 2 pass with a documented qualification, and the Update Set gate is NOT MET.**

## Rollback Procedure

If post-commit verification fails, the Update Set commit can be reversed using the platform's standard back-out procedure. Rollback is a recovery path, not a routine step — it should be invoked only when [Step 3](#step-3-confirm-deployed-state) sub-steps 2–11 reveal a failure that cannot be addressed without reverting the commit.

### Detailed Sub-Procedure

1. Navigate to **System Update Sets** → **Retrieved Update Sets**.
2. Open the committed Update Set record.
3. Click **Back out**. Confirm the action.
4. Wait for back-out completion. Like commit, back-out can take 1–3 minutes; do not navigate away from the page until completion.
5. Re-run the impacted validation gate(s) in [`validation-gates.md`](./validation-gates.md) to confirm the back-out is clean. At minimum, re-run Gate 1 (data model) and Gate 7 (Update Set integrity) — back-out should restore the destination PDI to a state where the scoped application's tables, ACLs, flows, and seed data are no longer present.
6. Resolve the underlying issue on the source PDI and restart from [Step 1](#step-1-export-the-update-set).

### Notes

- Back-out reverses the records introduced or modified by the committed Update Set. It does not delete subsequent edits made on the destination PDI after commit; those edits remain and may now reference records that no longer exist. To avoid orphaned references, do not edit scoped-application records on the verification PDI between commit and back-out.
- If back-out itself fails (e.g., due to dependent records added after commit), the cleanest recovery is to provision a fresh PDI and re-run the deployment from [Step 1](#step-1-export-the-update-set) on the new PDI, treating the original PDI as a corrupted target.

## Constraints & Reminders

The following constraints apply throughout deployment. They derive from AAP Sections 0.7.1 and 0.7.2 and are non-negotiable.

- **Single Update Set deliverable** — the scoped application MUST be exported as a SINGLE Update Set, not split across multiple. If the export operation produces multiple files, treat that as a hard failure and reduce the Update Set scope on the source PDI before re-exporting.
- **No hard-coded `sys_id`s** — every cross-reference is resolved by `GlideRecord` lookup against a stable human-readable key (`name`, `user_name`, `number`, `role_label`). The pre-deployment `[a-f0-9]{32}` regex sweep enforces this gate before export.
- **Scoped-namespace exclusivity** — every artifact lives in the auto-assigned `x_casemgmt` namespace; zero global-scope changes, with **one disclosed exception**: the Fix Script `x_casemgmt Post-Import Remediation` is authored global because it calls `GlideTableDescriptor` and `GlideSecurityManager`, which are refused in scoped execution. It is installer wiring, not application configuration, and the commit engine rewrites it into `x_casemgmt` regardless (see [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §9.4). The auto-execute Business Rule `x_casemgmt Post-Import Bootstrap` that once accompanied it has been **removed** from the package — it could not succeed, and its trigger condition was not confined to this application's Update Set. Apart from that one Fix Script, if a preview problem reveals a global-scope write, the design has violated the rule and must be reworked on the source PDI. Global tables receive **data** inserts only — never schema changes.
- **Email-disabled** — the build did NOT configure SMTP, notification rules, or email templates. Post-deploy SMTP testing is N/A; do not attempt to verify email delivery as part of [Step 3](#step-3-confirm-deployed-state).
- **Tooling restriction** — App Engine Studio + Flow Designer + UI Builder only; no Store app installs as part of deployment. Do not install any ServiceNow Store application during deployment, even if a preview problem appears to be solvable that way.
- **Repository minimality** — the deployment artifacts live exclusively under `servicenow-case-management-poc/`; the rest of the repository is unmodified. Do not modify, rename, or delete files outside this subdirectory under any circumstances during deployment.
- **No PII** — synthetic data only; no real names, email addresses, phone numbers, or organization names appear in the seed data, the test submissions made in [Step 3](#step-3-confirm-deployed-state), or any delivery artifact.
- **Minimal-Change Clause** — if a deployment problem can only be fixed by adding scope beyond the AAP, **stop and report** the specific gap. Do not substitute out-of-scope workarounds; do not add modules, workflows, portal pages, tables, or integrations beyond the defined scope.
- **Pre-build instance verification** — before starting [Step 1](#step-1-export-the-update-set), verify admin login succeeds at `[instance URL]`. If login fails, stop and report; do not proceed with deployment.

## Cross-References

- [`validation-gates.md`](./validation-gates.md) — Gate 7 (Update Set) is what this document operationalizes; the Pre-Deployment Checklist references Gates 1–6 as prerequisites.
- [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md) — manual procedure for the fresh-PDI re-import preview gate referenced by [Step 2](#step-2-verify-update-set-integrity).
- [`../scripts/seed_demo_data.js`](../scripts/seed_demo_data.js) — idempotent server-side seed script used for post-commit data verification in [Step 3](#step-3-confirm-deployed-state) sub-step 11.
- [`../update-set/`](../update-set/) — destination directory for the exported XML. Three files live here: `x_casemgmt_case_management_update_set.xml` (the **elected deliverable**, 926 blocks, 3,780,373 bytes, `a9204411…`), `x_casemgmt_case_management_update_set.FALLBACK.xml` (the retained original, byte-identical to it) and `x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks, 4,062,067 bytes, `e109e1d1…`, retained but **not shipped** — the upgrade path).
- [`../README.md`](../README.md) — overall POC overview with quick deployment summary; this file is the authoritative detailed walkthrough referenced from there.
- [`./data-model.md`](./data-model.md) — schema reference for the 25 fields verified in [Step 1](#step-1-export-the-update-set) sub-step 3.
- [`./state-machine.md`](./state-machine.md) — transition matrix and blocking-error messages exercised by the seed data in [Step 3](#step-3-confirm-deployed-state) sub-step 11.
- [`./acl-matrix.md`](./acl-matrix.md) — role × table × CRUD matrix verified by impersonating the three demo users in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
- [`./portal-pages.md`](./portal-pages.md) — wireframe-level specs for the submission and lookup pages exercised in [Step 3](#step-3-confirm-deployed-state) sub-steps 5–8.
- [`./dashboards.md`](./dashboards.md) — widget inventory for both dashboards verified in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
