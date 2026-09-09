# Validation Gates

> **CR1 AMENDMENT — 2026-09-09. The canonical package's bytes changed after the identity rows below were written.**
> Code review checkpoint CR1 raised seven findings against the shipped package. Resolving them **removed four
> payloads** — the three `sys_user_has_role` records this release's Role Management V2 refuses to install, and the
> Global-stamped `sys_script_fix` record — and **added four**: the two dashboard-pane bundles that restore the eight
> `sys_grid_canvas_pane` widget placements, and two scoped `sys_rate_limit_rules` records. It also hardened the two
> anonymous portal endpoints in place (post-insert admission counting on submit; strict number validation,
> per-session throttling, an HTTP 429 path and abuse monitoring on lookup) and reordered every block into the
> AAP §0.5.2 dependency tiers.
>
> | Property | Pre-amendment (the rows below) | **Shipping now** |
> | --- | --- | --- |
> | Payload blocks | 522 | **522** |
> | Bytes | 3,114,377 | **2,994,341** |
> | SHA-256 | `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` | **`751ceb61215f1207a7496693820007b5cd6ab1b43ce4cceed4e80f3208e72d4a`** |
>
> Re-derive all three from the file itself — `sha256sum`, `stat -c %s`, `grep -c '<sys_update_xml action='` —
> rather than trusting any quoted figure. **The amended bytes have not been previewed or committed on an
> instance:** the PDI is deliberately at its torn-down zero state and the CR1 checkpoint made no instance writes,
> so the upload → preview → zero-problem gate in [`deployment.md`](deployment.md) is the recipient's first step, before commit. What was
> verified statically: `xmllint` clean, all 522 payloads parse, 522 unique block names, one sane descriptor whose
> `inserted`/`summary` equal 522, zero `global` scope stamps, all 122 embedded script bodies parse and are
> ES5-conformant, every reference in the restored pane bundles resolves inside the package, and the AAP §0.5.2
> dependency-order assertion passes. Every identity figure elsewhere in this document describes the
> pre-amendment bytes and is retained as provenance. Full amendment ledger: [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](refine-run/CONSOLIDATION-FINAL-REPORT.md).>
> **CR1 FIX REVIEW — 2026-09-09.** Independent re-verification of the CR1 remediation changed the bytes once
> more, and the identity row above is the result. Three further fixes: the anonymous-submit ceiling now
> **counts** the window with the inserted row among it instead of ranking that row inside it, which bounds the
> window under every interleaving rather than only when a caller's query sees all of it; the two restored pane
> bundles now sort **after** the `sys_grid_canvas` rows they reference, which the first amendment had them
> preceding; and the two new `sys_rate_limit_rules` artifacts no longer claim an exception to AAP §0.7.2's
> no-hardcoded-`sys_id` rule for the stock `guest` reference they carry — it is counted as part of that
> blocking gap instead. **Gate 7 below remains OPEN on the shipping bytes**, and the full ordered sequence that
> closes it — upload, preview, commit, census including the 8 pane rows, the mandatory §5h role grants, both
> dashboards rendering, rate-limit verification, the 20-test ATF suite and the 13-assertion transition harness —
> is set out in [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §0.CR1.6. The
> last ATF run and the last transition-harness run were both taken on the **pre-CR1** install and are stale
> against these bytes.


> **DELIVERABLE IDENTITY — read this before comparing, verifying or asserting any digest, byte size or block count anywhere in these documents.**
> Re-measured **2026-09-08** from the file on disk (`sha256sum`, `stat -c %s`,
> `grep -c '<sys_update_xml action='`) after the Update Set consolidation replaced the canonical package. These
> rows are the only identities stated here as current fact. Every other digest in this documentation set is
> either the retained fallback artifact below or an explicitly dated historical measurement, and is labelled as
> such where it appears.
>
> | Artifact | Identity, as measured 2026-09-08 | Status |
> | --- | --- | --- |
> | `update-set/x_casemgmt_case_management_update_set.xml` — **THE DELIVERABLE** | **522** `<sys_update_xml>` blocks · **3,114,377** bytes · SHA-256 **`b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`** · descriptor `sys_id` `8ebb770493534b1009aa70d19dba102a` · `xmllint --noout` clean | **GATED — by a same-instance reset-and-reimport, not by an independent second PDI.** These exact bytes were uploaded, previewed to **0** `type=error` and **0** `type=warning` problems, and committed **once** through the native Commit Update Set action on 2026-09-08, onto this instance reset to a recorded zero-state (CR2 F06: recorded at the time, not raw-proven) immediately beforehand with no intervening patch. Post-commit it installed 3 tables (rows 10/10/8), `sys_dictionary`/`sys_documentation` 21/21 · 14/14 · 13/13, 3 roles, 26 ACLs, **27** `sys_security_acl_role` links (manager 14 / agent 10 / viewer 3) and **24** `sys_choice` values, with task and party linkage resolving. Residual risk of same-instance verification, and the two deltas it did not carry, are recorded in [`docs/refine-run/CONSOLIDATION-FINAL-REPORT.md`](refine-run/CONSOLIDATION-FINAL-REPORT.md) |
> | `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — **the elected base** | **926** blocks · **3,781,097** bytes · SHA-256 **`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`** · 26 `sys_security_acl` · `xmllint` clean | Retained. Modified after election by the three commits below, then **restored to the elected bytes 2026-09-05T04:45Z**. Deliberately **no longer** byte-identical to the deliverable — a fallback that tracks the deliverable is not a fallback |
> | The two candidate packages this consolidation superseded — `…REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks · 4,062,067 bytes · `e109e1d1…`) and `…AMENDED-NOT-GATED.xml` (935 blocks · 3,973,569 bytes · `9f3ea74c…`) | Both **deleted** from `update-set/` in this consolidation; their bytes remain recoverable from git history | Superseded: each was hand-authored rather than platform-exported, and neither was ever gated through a teardown-and-reimport commit. Provenance recorded in [`docs/refine-run/CONSOLIDATION-FINAL-REPORT.md`](refine-run/CONSOLIDATION-FINAL-REPORT.md) |
>
> **What the deliverable is: the elected base AS AMENDED. It is NOT byte-identical to `…FALLBACK.xml`.**
> *(Retained as written on 2026-09-05. **CORRECTED 2026-09-08:** that is no longer what the deliverable is.)*
> **What the deliverable now is: the consolidated, platform-exported package identified in the table above —
> 522 blocks / 3,114,377 bytes / `b2217224…`.**
> It was produced by the platform's own application-publish path on an instance rebuilt from the 988-block
> package and then corrected by the two post-rebuild fixes (the 24 native `sys_choice` values and the
> case/task/party linkage), captured with the platform's own capture API rather than by editing XML, and exported
> by `UpdateSetExport`. All 522 blocks carry a `<payload_hash>`, the signature of a genuine platform export. Its
> payload inventory: 3 `sys_db_object`; the full dictionary set; **7** `sys_choice_set` composites carrying
> exactly **24** values at 2/6/4/3/4/3/2; 3 `sys_number`; 3 `sys_user_role`; 26 `sys_security_acl`; **27**
> `sys_security_acl_role`; 7 flows; 7 business rules; 2 script includes; 6 UI actions; 8 reports; 2 dashboards;
> 1 portal + 2 pages + 3 widgets; 2 scripted REST definitions; 20 ATF tests + 1 suite + 180 steps + 20
> suite-tests; and 10 case / 10 task / 8 party rows with 3 users, 1 group and 2 companies.
>
> **The deliverable's superseded digests — recorded so an older copy can be recognised, and never to be read as
> current.** `7292a6fe…` / 3,781,097 B / 926 blocks was the elected base at `3671901b5b` and is **still** the
> identity of `…FALLBACK.xml`. `a9204411…` / 3,780,373 B was the deliverable at `f8454fb078`, and `4e28acae…` /
> 3,944,374 B was the deliverable at `6efb13b141`; **neither is the identity of any file in this tree.** Where a
> figure further down this documentation set is a **dated measurement** of one of those revisions, it is
> preserved as written and marked as history — rewriting it would falsify the record. Where such a figure was
> stated as a current identity, or as a value a reader is told to verify, compute, assert or promote, it has been
> **corrected** to the table above. If you find one that has not been, the table above wins.
>
> **What an importer must do, and what the gate did and did not settle.** A single commit of the deliverable on
> an empty instance **is** sufficient for the schema, the roles, the ACLs, the 27 role links and the 24 choice
> values: all of them were measured present after one commit, with no remediation script and no second commit.
> One delta the package cannot carry is reported rather than papered over: the **3** `sys_user_has_role`
> grants, which Role Management V2 refuses to accept from any update set on this release. The native remedy is
> the role form's *Edit Members*, written out step by step in
> [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5h, and it is **mandatory** —
> until it is done the three demo personas have no access (review finding F01, which also removed the three
> non-installing payloads from the package).
> A second delta was reported here and **was wrong**: the **8** `sys_grid_canvas_pane` rows were said to bind a
> canvas cell to a `sys_portal` widget instance that "is not an application file, so no publish can include
> them". Pane rows *are* application files, the package embeds the 8 `sys_portal` widget instances they point at,
> and without the pane rows a committed dashboard renders empty. Review finding F02 restored them; see Gate 6. AAP §0.7.1 /
> Gate 7 — the zero-preview-error round trip — is **met on these bytes by a same-instance reset-and-reimport,
> not by an independent second instance**: only one PDI is available for this project, so the instance was torn
> down to a recorded zero-state (CR2 F06) and the exact candidate bytes were then imported and committed with nothing
> running in between. The residual risk that leaves is real and named: anything the platform holds outside the
> records a teardown removes — caches, indexes, retained update history or metadata a scope deletion does not
> reach — was not re-created by the exercise and was not tested by it. The full record is
> [`docs/refine-run/CONSOLIDATION-FINAL-REPORT.md`](refine-run/CONSOLIDATION-FINAL-REPORT.md).
>
> *Retained as written on 2026-09-05, and superseded by the paragraph above — D48's two remedies as they stood
> then:*
> **human-gated**: **(a)** restore the elected bytes to the deliverable path — now a plain file copy from the
> restored `…FALLBACK.xml` — at the cost of dropping the three remediation passes from the shipped package; or
> **(b)** run the full gate on `9f3ea74c…` against a genuinely clean, dedicated PDI. Remedy **(a)** was taken
> on 2026-09-05, and the 2026-09-08 consolidation then settled the comparison outright by recording the
> checksum of the bytes it shipped and running the gate on those bytes by the same-instance route above.

## Purpose


This document captures the seven validation gates that the scoped application MUST pass before delivery. Each gate corresponds to a critical capability surface and has a specific pass condition; every gate MUST be exercised on a fresh PDI before the Update Set is committed. Failure on any gate blocks delivery — no out-of-scope workarounds are permitted (per AAP Section 0.7.2 Minimal-Change Clause).

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

This file is the central reference for:

1. The verbatim 7-row validation table from AAP Section 0.7.3.
2. How each gate maps to the other documentation files in `docs/` (cross-reference).
3. What it means for a gate to "pass" (Pass Condition column).
4. The order in which gates SHOULD be checked (so failures are caught early).

This is a synthesis document. It links to the per-capability design documents under `docs/` and the deployment runbook under `docs/deployment.md` rather than duplicating their content. When a verifier needs the underlying design contract for a gate, they SHOULD follow the Cross-Reference Document link in that gate's sub-section.

## The Seven Gates

The following table is preserved verbatim from AAP Section 0.7.3 and serves as the canonical pass/fail criteria for delivery. The Criterion and Pass Condition columns MUST be evaluated character-for-character as written; partial passes, skipped checks, or warnings rebranded as passes are NOT acceptable.

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| Data model | All 3 custom tables created with correct fields and types | Zero missing mandatory fields |
| Workflow | All state transitions enforced for both case types | Invalid transitions return blocking error; task-closure check blocks Resolved transition |
| ACLs | Role-based access enforced | case_viewer cannot write; case_agent cannot access unassigned cases; case_manager has full access |
| Portal — submission | Case created from unauthenticated portal submission | Case appears in internal list with Draft status and correct case number |
| Portal — lookup | Status lookup returns correct data for valid case number | Correct status/subject/opened_date returned; "not found" message for invalid number |
| Dashboards | Both dashboards render with synthetic data | All widgets display data; no broken report references |
| Update Set | Scoped app exported | Update Set loads without errors on a fresh PDI instance |

## Measured Status

The table above is the frozen AAP criteria and is reproduced verbatim; it is deliberately left unaltered. The
table below is the **measured outcome** of those criteria: the pre-2026-08-11 entries were measured on
`https://dev379024.service-now.com` (Australia Patch 3), a host that is now **retired and is not used**, so they
stand as dated evidence from it; the 2026-09-02 re-exercise was measured on the current validation instance
`https://dev306625.service-now.com` (**Zurich Patch 10**), as the attribution notes below and in the rows state.
Every entry is an observation, not an expectation. Where a gate's outcome depends on an operational
step, that is stated rather than folded into a pass.

**Read the evidence attribution carefully — the measurements come from three different runs, and they are not
interchangeable:**

- **The clean-instance round trip** ([`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md))
  established the install behaviour and the zero-preview-error result. It was run on the 913-block /
  3,618,378-byte / SHA-256 `7272edfc…` revision — **not on the shipping deliverable's bytes**, which is why the
  Update Set gate below is recorded as **NOT MET** for the elected artifact. That gate is binary: it is met
  on a byte sequence or it is not met on it, and there is no partial or conditional reading of it. An earlier run
  of the same procedure
  on the **916-block `32a064d6…`** revision (3,448,009 bytes) is retained in §9.10 as history; the two are
  separate measurements and neither describes today's file.
- **The preview of the 925-block `e49a7654…` revision** is a third, separate measurement: that file uploaded as
  a fresh retrieved update set and previewed against an instance that already holds the schema and this
  application's change history. It yields **31 problems, all
  `Found a local update that is newer than this one`, and zero `Could not find a record` problems**. It does
  **not** include a teardown or a commit, so it cannot be cited as a clean-slate result.
- **Superseded on 2026-09-02, then amended on 2026-09-03 by the choice-composite fix and again by the three
  post-election remediation commits, with the delivery
  election MADE in between: the retained original package is the elected *base*, and the shipping deliverable is
  that base as amended. Three byte sequences carry
  three separate verdicts — read all three, because the gate
  is binary and takes one verdict per sequence, and note that the two on-disk files were re-cut on 2026-09-03,
  so each one's current digest is stated below alongside the sequence it superseded.** *(1) Where the gate is MET:* the full
  trip was measured on **export 3's byte sequence — 988 blocks / 4,062,436 bytes /
  SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`**, uploaded onto a genuinely clean
  instance, previewed to 0 `type=error` and 0 `type=warning` problems and then committed by the native UI action
  ("Succeeded 100%", 613 inserted / 375 updated / 0 collisions), measured `2026-09-02T20:53:14Z`. See
  [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md). Those bytes are **no file on disk** — they are
  recoverable only from git history — and their block order is exactly what the CR1 review's HIGH AAP §0.5.2
  finding rejected. *(2) Where the gate is NOT MET — the retained rebuilt artifact:* the post-review CR1
  re-sequencing put those same 988 records into AAP §0.5.2 dependency order, producing 988 blocks /
  4,062,436 bytes / SHA-256 `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` — **a
  superseded identity that matches no file in this tree; never verify or promote against it** — and at commit
  `f8454fb078` the seven direct `sys_choice` children were replaced with platform-native choice composites,
  producing the file now on disk: **988 blocks / 4,062,067 bytes / SHA-256
  `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`** — that is the digest and byte size an
  operator would have measured on it. The exact-byte round trip on the
  complete sequence was never run on it, and **that file was superseded and deleted in the Update Set
  consolidation**: it was hand-authored rather than platform-exported, and the consolidation produced and gated
  a platform export instead. Its provenance, and the reason it was superseded, are recorded in
  [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md); its bytes remain
  recoverable from git history. What was established about it
  is corroboration plus an exact-child runtime result, not the gate:
  `xmllint --noout` clean, 988 blocks, every §0.5.2 dependency assertion passing, 981 of its 988 children
  byte-identical to the previewed `eee9fabd…` bytes, and read-only REST confirming the instance's captured set
  still holds 988 children whose update names are set-identical to the file's — while the remaining 7, the
  choice composites, were themselves uploaded as a delta, previewed to **0 problems of any type** and committed
  natively on 2026-09-03, each of the seven payloads on the instance byte-identical to the file's.
  *(3) Where the gate is MET on the bytes that ship — THE SHIPPING deliverable, gated by a same-instance
  reset-and-reimport rather than by an independent second PDI:* the Update Set consolidation rebuilt the
  application on an emptied instance, re-applied the two post-rebuild fixes, exported the result through the
  platform's own publish-and-export path, tore the instance back down to a recorded zero-state (CR2 F06) and then uploaded,
  previewed and committed **that exact export, once**, with nothing running in between.
  `update-set/x_casemgmt_case_management_update_set.xml` is therefore
  **522 blocks / 3,114,377 bytes / SHA-256
  `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`, measured 2026-09-08 — previewed to 0
  `type=error` and 0 `type=warning` problems, then committed**. It is **NOT** byte-identical to
  `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`, which retains the elected base itself
  (`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, 926 blocks, 3,781,097 bytes, 26
  `sys_security_acl`, restored to those bytes 2026-09-05T04:45Z). `b2217224…` is the digest to verify the
  artifact
  against — every earlier deliverable digest (`7292a6fe…`, `9f3ea74c…`, `a9204411…`, `4e28acae…`) is history
  and matches no shipping file. **What the gate settled, measured after that single commit:** three tables at
  HTTP 200 with rows 10 / 10 / 8, `sys_dictionary` and `sys_documentation` at 21/21 · 14/14 · 13/13, 3
  `sys_db_object`, 3 roles, 26 scoped ACLs, **27** `sys_security_acl_role` links (manager 14 / agent 10 /
  viewer 3; per table case 11 / task 8 / party 8), **24** `sys_choice` values through the package's seven
  `sys_choice_set` composites at 2/6/4/3/4/3/2, 3 `sys_number`, 7 flows active and published, 8 reports, 2
  dashboards, 1 portal + 2 public pages + 3 widgets, 2 anonymous REST endpoints, 20 ATF tests + 1 suite + 180
  steps + 20 suite-tests, and task and party linkage resolving by dot-walk with every Organization party
  resolving to a real `core_company`. **No remediation script was run and there was no second commit**, so on
  these bytes neither the physical schema nor the ACL role links nor the choice values is a post-import step any
  longer, and the demo rows travel inside the package rather than needing `scripts/seed_demo_data.js`.
  **What the gate did not settle, stated plainly:** one class the package cannot carry — the **3**
  `sys_user_has_role` grants, which Role Management V2 refuses from any update set on this release (native
  remedy: the role form's *Edit Members*, [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md)
  §5h, mandatory) — and the fact that a same-instance reset
  cannot prove what an independent instance would: platform-level caches, indexes, retained update history and
  any metadata a scope teardown does not reach were not re-created by the exercise and were not tested by it.
  The full record, including the one failure cycle this gate produced and the three source-side fixes it forced,
  is [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).
  *Retained as written on 2026-09-05, and true of the package that shipped then rather than of this one:*
  tree — and **no preview of the complete file has ever been run on those bytes, so the Update Set gate is NOT
  MET for the shipping deliverable.** Directive **D48's stop condition is live** as well: the checksum recorded
  for the shipping package was `7292a6fe…` and the bytes are `9f3ea74c…`; both remedies — restoring the elected
  bytes from `…FALLBACK.xml`, or running the full gate on a genuinely clean dedicated PDI — are human-gated.
  *That was the standing status until the 2026-09-08 consolidation; remedy (a) was taken on 2026-09-05 and the
  consolidation then ran the gate on the bytes it shipped, by the same-instance route described above.*
- **Later verification runs on the committed application** produced the workflow, ACL, REST and ATF results.
  These were taken against the live application after remediation, not from the import.
- **Browser observation** produced the portal-page, dashboard and related-list results.

Each row below names which of the three it rests on.

| Gate | Measured status | Evidence |
| --- | --- | --- |
| Data model | ✅ **PASS — from the package alone, measured 2026-09-08 after the Update Set consolidation**, on the shipping deliverable (522 blocks / 3,114,377 bytes / `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`): a **single** commit of those exact bytes onto this instance, reset to a recorded zero-state immediately beforehand (CR2 F06: the pre-commit teardown's ten checks were recorded, not raw-proven; every measurement in this row is post-commit and is evidenced in the consolidation report), produced three physical tables with rows 10 / 10 / 8, `sys_dictionary` **and** `sys_documentation` at 21/21 · 14/14 · 13/13, 3 `sys_db_object`, 3 `sys_number` counters and **24** `sys_choice` values across the seven fields at 2/6/4/3/4/3/2, every option label rendering on a real case form — with **no remediation script and no second commit**. The package carries the platform-captured schema rows and seven `sys_choice_set` composites, which is why the choice half needs no post-import step and the physical-schema half no longer does either. The earlier qualification on this row — metadata without physical storage, 25 hand-authored `sys_dictionary` rows, `scripts/post_import_remediation.js` and a second commit — was a property of the hand-authored candidate packages that this consolidation superseded and deleted, and does not apply to the bytes that ship. The historical from-the-package-alone result on **export 3's byte sequence `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** (988 blocks / 4,062,436 bytes, no file on disk — git history only) is retained as history in [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md). | Measured post-commit by direct query and in a browser: 3 tables HTTP 200 with 10 / 10 / 8 rows, 21 / 14 / 13 columns each carrying its `sys_documentation` row, 24 choice rows, and CASE9000003's dropdowns enumerating [Draft, Open, In Progress, Pending, Resolved, Closed] · [General Inquiry, Complaint] · [Low, Medium, High, Critical] · [Awaiting Info, Awaiting Third Party, Other] — [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md). The pre-consolidation readings — a bare commit yielding table metadata with no physical storage (REST 403, zero `sys_choice` rows, inserts failing with `invalid table name`), and 3 physical tables / 24 choice rows only after the §9.5 remediation — are retained below as the history of the superseded packages. |
| Workflow | ✅ **PASS** | Two distinct pieces of evidence, deliberately kept apart. **(a) Breadth — the U1 enforcement pass:** all 13 transition-logic assertions covering every row of the AAP §0.5.5 matrix (both case types, both prohibited transitions, the task-closure gate, the date stamping, the `pending_reason` lifecycle) pass under the order-250 `enforce_forward_transitions` Business Rule; re-measured after every subsequent change at **13 / 13**, per assertion, byte-identical expected vs actual (§9.7). **(b) Depth on the form, one dedicated run after the round trip:** clicking the real **Resolve** UI Action on a case with an open child task was blocked, no write occurred (`sys_mod_count` unchanged), and the form displayed `All tasks must be closed before resolving this case.` — codepoint-verified, 52 ASCII characters, terminating U+002E. (b) proves the message reaches the form for one transition; (a) proves the matrix. All 7 flows are `active=true`, `status=published`. |
| ACLs | ⚠️ **QUALIFIED — correct after the documented manual remediation, and incorrect until then. Restated 2026-09-05 for THE SHIPPING deliverable**, the 935-block / 3,973,569-byte `9f3ea74c…` package (measured 2026-09-05T04:45Z; the 926-block / 3,780,373-byte `a9204411…` identity this row previously named was superseded at commit `6efb13b141` and matches no file in this tree): a payload census of the shipping file counts **29 `sys_security_acl` payloads and 0 `sys_security_acl_role` rows**, so the **36** role links (manager 17 / agent 13 / viewer 6) are **not in it** and `scripts/post_import_remediation.js` must be run to create them. Those 36 are this package's number: the 26-ACL elected base retained at `…FALLBACK.xml` needs **27** (manager 14 / agent 10 / viewer 3), and the difference is exactly the three field-level `query_range` ACLs the post-election passes added × 3 roles = 9 links (36 − 9 = 27, 29 − 3 = 26). The 2026-09-03 choice-composite fix changed only the seven `sys_choice` children; the three `query_range` ACLs are the only change that affects this row. The 27-of-27-from-the-package-alone result ([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md)) was measured on **export 3's byte sequence `eee9fabd…`** (988 blocks / 4,062,436 bytes, no file on disk — git history only), in agreement with the Update Set row below. The **retained rebuilt** artifact (`…REBUILT-DEPENDENCY-ORDERED.xml`) contains those same 27 link records in dependency order, so 27 of 27 is the **expected** outcome on it — but that file was never uploaded, previewed or committed, so its evidence is **static only** until its own S1–S6 run. Neither result transfers to the shipping one. | A clean commit of the shipping package gives **29** ACLs with **0 of 36** `sys_security_acl_role` link rows; after running `scripts/post_import_remediation.js` in Global, **36 of 36** (manager 17 / agent 13 / viewer 6). The figures immediately below are **instance row counts as measured at `2026-09-02T20:40:00Z`**, when the committed package carried 26 ACLs and the invariant was **27 of 27** — re-measured live at `2026-09-05T04:45:00Z` the same instance reads 29 ACLs and 36 links (17/13/6). The matrix is then correct on the case table by impersonation: manager 14/14 with Delete, agent 9/14 without Delete, viewer 14/14 read-only. Both halves of "Assigned only" proven, including group-only visibility and record-level denial by direct URL. **The child-table defect is fixed:** the agent's `case_task` / `case_party` read+write conditions previously could not compile (`current.case` — `case` is a JS reserved word) and denied every row; the mirror is now enforced correctly and **ATF 06 and ATF 07 both pass** in the final suite run. |
| ACLs — **CORRECTED 2026-09-08**, *and re-verdicted 2026-09-09 by the row below* | ~~✅ **PASS for the schema-side of access control**~~ **— verdict WITHDRAWN, see the next row (CR2 F09). The measurements below are unchanged.** Measured **from the package alone, 2026-09-08 after the Update Set consolidation**, on the shipping deliverable (522 blocks / 3,114,377 bytes / `b2217224…`): a payload census of it counts **26 `sys_security_acl` and 27 `sys_security_acl_role`** payloads, and after the single commit the instance read **26** scoped ACLs and **27** role links — per role **manager 14 / agent 10 / viewer 3**, per table **case 11 / task 8 / party 8** — with `scripts/post_import_remediation.js` never run and no second commit. ⚠️ **One class does not transport and cannot:** the **3** `sys_user_has_role` grants to the demo personas. Proven at record level: Role Management V2 owns that table on this release, so the update-set loader's permission check answers false and the platform logs "permission denied: no thrown error"; the payloads were refused stamped `Global` *and* stamped `x_casemgmt`. **No update set can deliver those grants on this release** — the manual sequence is the role form's *Edit Members*, and the sixteen ATF failures it causes are itemized in the consolidation report. *(The clause that stood here — "which is a documented post-commit step rather than a package defect" — is **withdrawn 2026-09-09**; see the next row.)* The earlier qualification on this row — 0 of 36 links from the package, 29 ACLs, remediation required — belonged to the hand-authored candidate packages this consolidation superseded and deleted. The historical 27-of-27-from-the-package-alone result on **export 3's byte sequence `eee9fabd…`** (988 blocks / 4,062,436 bytes, git history only) is retained in [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md). | A single clean commit of the shipping package gives **26** scoped ACLs with **27 of 27** `sys_security_acl_role` link rows (manager 14 / agent 10 / viewer 3; case 11 / task 8 / party 8) and **0 of 3** `sys_user_has_role` grants — measured 2026-09-08, [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md). The pre-consolidation reading for the superseded packages was 29 ACLs with 0 of 36 links until `scripts/post_import_remediation.js` ran in Global. The figures immediately below are **instance row counts as measured at `2026-09-02T20:40:00Z`**, when the committed package carried 26 ACLs and the invariant was **27 of 27** — re-measured live at `2026-09-05T04:45:00Z` the same instance reads 29 ACLs and 36 links (17/13/6). The matrix is then correct on the case table by impersonation: manager 14/14 with Delete, agent 9/14 without Delete, viewer 14/14 read-only. Both halves of "Assigned only" proven, including group-only visibility and record-level denial by direct URL. **The child-table defect is fixed:** the agent's `case_task` / `case_party` read+write conditions previously could not compile (`current.case` — `case` is a JS reserved word) and denied every row; the mirror is now enforced correctly and **ATF 06 and ATF 07 both pass** in the final suite run. |
| ACLs — **CORRECTED 2026-09-09 (code review CR2, finding F09)**, superseding both rows above | ❌ **NOT MET on the assignment half of access control. The schema half is proven.** *Proven, from the package alone and one commit:* a payload census of the shipping deliverable counts **26 `sys_security_acl` and 27 `sys_security_acl_role`** payloads, and after the single commit the instance read **26** scoped ACLs and **27 of 27** role links — per role **manager 14 / agent 10 / viewer 3**, per table **case 11 / task 8 / party 8** — with `scripts/post_import_remediation.js` never run and no second commit; the live matrix then behaves as AAP §0.5.6 specifies, with the `assigned_group` / `assigned_agent` field-level ACLs in place. *Not met:* the **3** `sys_user_has_role` grants to the demo personas. Role Management V2 owns that table on this release, so the update-set loader's permission check answers false and the platform logs "permission denied: no thrown error"; the payloads were refused stamped `Global` **and** stamped `x_casemgmt`. Post-commit `sys_user_has_role` for the three personas read **0**, and sixteen of the twenty ATF tests fail as the measurement of that one gap. **A gate that requires a manual write after the commit is not met by the deliverable**, so **AAP §0.7.3's Gate 3 and AAP §0.7.4's "3 users (one per role)" are UNSATISFIED** and this row is scored **NOT MET**. The *Edit Members* sequence in [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5h is a **deployer workaround for a BLOCKED platform capability gap**, not gate satisfaction. No alternative mechanism is proposed: a scoped Fix Script was removed by CR1 and a scoped Business Rule writing the global `sys_user_has_role` table would need cross-scope privilege and would be an ongoing artifact the AAP does not enumerate — per AAP §0.7.2's Minimal-Change Clause and §0.3.2's closing bullet, reporting the gap is the resolution. | Same measurements as the row above, re-verdicted: **26 of 26** scoped ACLs and **27 of 27** role links from one commit — proven; **0 of 3** `sys_user_has_role` grants — blocked. [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) (CR2 F09 correction), [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §0.CR1.3. |
| Portal — submission | ✅ **PASS — REST contract and portal page** | Anonymous `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE…","message":"Your case has been submitted"}`, row lands `status=Draft` with `sys_created_by=guest`. **The page works too:** as a Guest (`window.NOW.user_display_name === "Guest"`, `x-is-logged-in: false`) it renders one form with the five controls `subject` / `type` / `description` / `requester_name` / `requester_email`, keeps Submit disabled while the form is invalid, and on submit replaces the form with a confirmation panel carrying the verbatim `Your case has been submitted` and the returned case number. 0 console errors, no request ≥ 400. The blank page recorded here in earlier revisions was two defects — no `sp_container`/`sp_row`/`sp_column`/`sp_instance` layout records, and both widgets reading `response.data.<field>` where a Scripted REST body is nested under `result` — both now fixed (§9.6 E8-P). |
| Portal — lookup | ✅ **PASS — REST contract and portal page** | GET valid → exactly `{status, subject, opened_date}`, all seven internal fields absent from body and raw response. GET unknown → **404** with `No case found with that number.`, byte-identical to the required literal. **The page works too:** it renders one case-number input and a result panel with exactly three labelled values (Status / Subject / Opened Date, 3 `dt`/`dd` pairs); a whitelist audit of the rendered page for the seven internal field names returned zero matches; an unknown number replaces the panel with an alert whose `innerText` is the required literal, codepoint-verified at 31 characters; and a stored `<img src=x onerror=…>` subject renders as text (`&lt;img` in the raw HTML, 0 images, no script execution). |
| Dashboards | ✅ **PASS — both dashboards, admin and every entitled persona** | Browser-observed after the two packaging defects behind the earlier FAIL were fixed. **Agent Workspace renders 3 of 3 widgets, Manager View 5 of 5**, one tab each, and the empty-state string "Add widgets using the widget picker." is programmatically **absent** from both. Values were read from each chart's per-point accessibility labels rather than estimated from pixels: status 2/2/2/2/1/1 across Closed / In Progress / Open / Resolved / Draft / Pending; type General Inquiry 6 (60%) and Complaint 4 (40%); priority High 3, Medium 3, Critical 2, Low 2; Average Time to Close `16 Days 0 Hours 0 Minutes` and Cases Opened in Last 30 Days `10`, both returned by `SingleScoreRunProcessor` with `"STATUS":"SUCCESS"`. **Persona access is enforced as designed:** the manager opens both; the agent opens Agent Workspace and reads exactly its own three cases in *My Open Cases* (a DOM-wide `CASE\d{7}` scan returns only those three, so row-level scoping holds) and is correctly refused Manager View; the viewer is correctly refused, which is the documented design in [`dashboards.md`](./dashboards.md) rather than a defect. 0 console errors and 0 responses ≥ 400 on all five loads. **What the earlier FAIL was:** each dashboard's composite named three child tables that do not exist on this release — `pa_tab`, `pa_dashboard_widgets` and `pa_dashboard_role` — so the tab, all 8 widget placements and the role grants were dropped on commit; and all 8 `sys_report` rows committed with no grouping column because `group_by` is not a `sys_report` column at all (the column is `field`). Both are fixed in the artifacts and their payloads; see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.5 and §0.6.1 for the full forensic record. |
| Update Set | ❌ **NOT MET for THE SHIPPING deliverable — updated 2026-09-05. This gate is binary: it is met on a byte sequence or it is not met on it, and it is not recordable as a partial or qualified result. It takes one verdict per sequence, and three sequences are in play. *MET — export 3's sequence:* the 988 payload records were uploaded onto a genuinely clean instance, previewed to 0 `type=error` and 0 `type=warning` problems with nothing skipped or ignored, and then committed by a single native UI action — "Succeeded 100%", 613 inserted / 375 updated / 0 collisions, physical storage and 27 of 27 role links confirmed after ([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md)) — measured on 988 blocks, 4,062,436 bytes, SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`, `2026-09-02T20:53:14Z`. Those bytes are no file on disk, and their block order is exactly what the CR1 review's HIGH AAP §0.5.2 finding rejected. *NOT MET — the retained rebuilt artifact:* the post-review CR1 re-sequencing put those same 988 records into §0.5.2 dependency order, giving 988 blocks / 4,062,436 bytes / SHA-256 `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` — **a superseded identity that matches no file in this tree**; the choice-materialization fix at commit `f8454fb078` then replaced its seven `sys_choice` children, giving the file now on disk — **988 blocks / 4,062,067 bytes / SHA-256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`** — and the round trip on neither complete sequence was ever run; it is retained, and not shipped, at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`. *NOT MET — THE SHIPPING deliverable, which is what ships:* the exact-byte gate could not be completed on any instance available to this run, so checkpoint OVERRIDE-2 was invoked and the untouched original package was **elected** as the shipping *base*, and three later authorized remediation passes (`f8454fb078`, `6efb13b141`, `8dfdbcb015`) amended those bytes in place for a net +9 payloads with 919 payload names in common. `update-set/x_casemgmt_case_management_update_set.xml` is **935 blocks / 3,973,569 bytes / SHA-256 `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`, measured 2026-09-05T04:45Z — MEASURED, NOT GATE-VERIFIED**. It is **NOT** byte-identical to `…FALLBACK.xml`, which retains the elected base itself (`7292a6fe…`, 926 blocks, 3,781,097 bytes, 26 `sys_security_acl`, restored 2026-09-05T04:45Z), and **no preview of the complete file was ever run on the shipping bytes** — so this gate is NOT MET for the artifact a reader holds, AAP §0.7.1 is unsatisfied for it, and directive **D48's stop condition is live** because the checksum recorded for the shipping package was `7292a6fe…` while the bytes are `9f3ea74c…` (both remedies human-gated: restore the elected bytes from `…FALLBACK.xml`, or run the full gate on a genuinely clean dedicated PDI). The seven choice children are the one part of it that does carry a preview-and-commit result: uploaded as their own delta, previewed to **0 problems of any type**, committed natively, `sys_choice` **0 → 24** with the exact option labels on the real forms, 2026-09-03 — which closes the choice half of the Data model qualification and removes choice creation from the post-import steps, and closes nothing else. **The election settled which package ships; it did not pass this gate, and nothing here may be read as though electing the fallback verified it.** What the election costs is measured on the shipping file rather than estimated: **0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25 hand-authored `sys_dictionary` rows** with random-32-hex names — so the shipping package **does not include this round's native-rebuild fix**, the ACL-role links are absent from it, and `scripts/post_import_remediation.js` must be run post-commit to create them — **36** links for its **29** ACL payloads (manager 17 / agent 13 / viewer 6), where the 26-ACL elected base needs 27 (14 / 10 / 3) — exactly as the pre-refine deployment did (which is why the Data model and ACLs rows above carry their qualification). What closes this gate for the shipping artifact: run [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) against the `9f3ea74c…` file on a genuinely clean, dedicated PDI — not `dev306625`, whose already-committed retrieved set carries this file's own descriptor `sys_id` `9929f50df18ccec91ea13b2a3bccfc90` — asserting **935** children and 3,973,569 bytes. What closes it for the retained rebuilt artifact — the available upgrade path — is the same run against the `e109e1d1…` file asserting **988** children, after which that file can be promoted back to the deliverable path; both are set out in §10.0 of [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). Corroborating static evidence on the retained rebuilt file — evidence, never the gate: `xmllint --noout` clean, 988 blocks, 981 of them byte-identical to the previewed `eee9fabd…` bytes with the other 7 being the natively previewed-and-committed choice composites, every §0.5.2 dependency assertion passing (application record first, tables before dictionary rows, dictionary before documentation and choices, roles before ACLs, both before the 27 role links, subflows before the two state-machine flows, reports before both dashboards, portal → page → widget → container → row → column → instance, ATF test → step → step-input value, all 38 seed rows last), and read-only REST confirming the instance's captured set still holds 988 children whose update names are set-identical to the file's — which bounds the difference to block sequence alone. The conditional reading below belongs to the earlier revisions: zero problems of any type on a genuine clean slate, measured on the earlier `7272edfc…` revision; zero *reference* problems on the immediately preceding 925-block `e49a7654…` revision, previewed against an instance that already holds the schema and the application history, with the remaining problems being that instance's own change history; and no preview of the complete file on the 926-block `a9204411…` bytes (commit `f8454fb078`, since superseded and no file on disk), whose seven choice children alone carry the 2026-09-03 delta preview and native commit — see §0.3c of the limitations register for what was measured on them instead. Nothing whatsoever has been previewed on the shipping `9f3ea74c…` bytes** | **Clean slate (earlier revision).** On the **913-block / 3,618,378-byte / SHA-256 `7272edfc…`** file: **before = 41 errors** previewed against the already-populated instance (20 local-update collisions + 18 `x_casemgmt_case`/`case` + 3 `core_company`/`organization` reference problems); then, after a staged teardown proven complete (scope query `[]`, every application census counter 0, all three tables moving from HTTP 200 to HTTP 400), an upload with the child `sys_update_xml` count asserted at **exactly 913**; **298** problems on the first clean-slate preview, every one `Found a local update that is newer than this one` — the teardown's own deletions captured locally; and **after = 0 problems of any type** once that local capture was purged at source. Checked against the platform's own predicate rather than assumed: `state=previewed`, `unresolvedProblems=false`, `shouldDisplay=true`. Then committed, `previewed → committing → committed`. **Progression 41 → 298 → 0.** **Populated instance (the case that used to fail).** The same procedure on the 913-block `89638c17…` revision left **21 package-intrinsic reference problems** — 18 × `Could not find a record in x_casemgmt_case for column case` and 3 × `Could not find a record in core_company for column organization` — because the 28 seed rows carried their parent key in the reference element **body**, and preview accepts only a sys_id there. **The immediately preceding 925-block revision.** After the seed rows were re-shaped (parent key in the `display_value` attribute with an empty body for `x_casemgmt_case` and `core_company`; deterministic pinned numbers `CASE9000001-10` / `TASK9000001-10` / `PARTY9000001-08`), the **925-block / 3,698,577-byte / `e49a7654…`** file was uploaded as a fresh retrieved update set (925 children asserted) and previewed against the same populated instance: **31 problems, all `Found a local update that is newer than this one`, and ZERO `Could not find a record` problems — 63 → 0.** Every one of the 31 targets was confirmed to hold a local `sys_update_version` in state `current`, so all 31 are this instance's own history; **no seed-data record appears among them.** **Not claimed:** these bytes have not been re-run through a full teardown trip, and **Commit was withheld** because the verification instance is shared. **The bytes that ship (935 blocks / 3,973,569 bytes / `9f3ea74c…`, measured 2026-09-05T04:45Z) have not been previewed as a complete file, and neither had the superseded 926-block / 3,780,373-byte `a9204411…` revision before them** — the 926-block revision differed from `e49a7654…` by 13 re-synced payloads and 1 added block (the case form's Related Lists definition) and, since 2026-09-03, by the seven native choice composites; each of those 14 records was applied to the live instance and read back field-for-field identical to its artifact, and every table and column they name was confirmed to exist, but that is not a preview and this document does not treat it as one. The shipping bytes then add **+9** payloads on top of the elected base — 4 Business Rules, 1 Client Script, 3 field-level `query_range` ACLs and 1 Form Layout record — none of which has been previewed either (register §0.3c; re-running the trip is §10.0 item 1a). The seven choice children **were** previewed and committed, as their own delta: 0 problems of any type, native commit, `sys_choice` 0 → 24. The install footprint also remains: a bare commit creates no physical storage, so the documented §9.5 sequence — two commits with a Global remediation run between and after them — is still required. It completed with `verified=true`, `acl_links_total=27`, `errors=0`, **as measured at `2026-09-02T20:40:00Z` against the 26-ACL package of that day**; on the 29-ACL shipping package the same run's invariant is `acl_links_total=36` (manager 17 / agent 13 / viewer 6), which is what the live instance reads at `2026-09-05T04:45:00Z`. The earlier **916-block `32a064d6…`** result (42 → 0) is retained in §9.2/§9.10 as the history of that revision. |
| Update Set — **CORRECTED 2026-09-08**, superseding the row above, and its basis split 2026-09-09 by the row's own binary rule | ✅ **MET for THE SHIPPING deliverable, on a pre-commit zero-state precondition that is evidence-unproven at raw level — and by a same-instance reset-and-reimport rather than by an independent second PDI. Updated 2026-09-08 by the Update Set consolidation; the precondition qualification added 2026-09-09 (CR2 F06, second pass — re-opened by independent verification).** This gate is binary: it is met on a byte sequence or it is not met on it, and it takes one verdict per sequence — so the qualification cannot be scored as a partial verdict, and it is stated instead as which half of the verdict's basis is evidenced and which is not. **Evidenced, in the consolidation report and re-readable there: 522 children loaded = 522 payload blocks exactly, 0 `type=error` and 0 `type=warning` with no problem row carrying a `status`, a single native *Commit Update Set* action at 2026-09-08 21:27:27 UTC, and the whole post-commit census. NOT independently re-verifiable: the pre-commit (Step 5b) zero-state precondition — its ten checks were run and their normalized results recorded, but the verbatim requests, statuses and bodies for that pass went to an agent scratch directory the repository does not retain, and the instance is torn down so the pass cannot be re-run. The MET therefore reads: met on the preview-and-commit measurements, resting on a pre-commit zero-state reported as recorded at the time rather than proven.** *(The Step 8 teardown's ten checks DO carry verbatim `curl` commands and raw bodies in the report and remain proven; nothing here withdraws them, and nothing here questions the commit itself.)* *MET — the bytes that ship:* `update-set/x_casemgmt_case_management_update_set.xml` is **522 blocks / 3,114,377 bytes / SHA-256 `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`**, a genuine platform export (every block carries a `<payload_hash>`). Those exact bytes were re-checksummed immediately before upload, uploaded through `/sys_upload.do`, located **by their own descriptor `sys_id` `8ebb770493534b1009aa70d19dba102a`** rather than by the name-ordered locator, loaded with **522 children = 522 payload blocks exactly** (no duplicate append), previewed genuinely (`previewing → previewed`) to **0 `type=error` and 0 `type=warning`** problems — with no problem row carrying a `status`, so no count was made to read zero by marking anything `skip_collision`, `ignored` or `skipped` — and then committed **once**, through the platform's own **Commit Update Set** action, at **2026-09-08 21:27:27 UTC**. The instance had been torn down to a zero-state recorded by the pre-commit teardown's ten zero-state checks — **CORRECTED 2026-09-09 (CR2 F06): those ten checks are recorded in the consolidation report as a normalized summary of derived counts, not as raw request-and-body captures. The verbatim captures for that pass went to an agent scratch directory that the repository does not retain, so the Step 5b zero-state gate is reported as recorded at the time and is evidence-unproven at raw level. The Step 8 teardown's ten checks DO carry verbatim `curl` commands and raw bodies in the report and remain proven.** — immediately beforehand, and **nothing ran between that teardown and the commit** — no script, no data load, no configuration change. Post-commit, by direct query: 3 tables HTTP 200 with rows 10 / 10 / 8; `sys_dictionary` and `sys_documentation` 21/21 · 14/14 · 13/13; 3 `sys_db_object`; 3 roles; 26 scoped ACLs; **27** `sys_security_acl_role` links (manager 14 / agent 10 / viewer 3); **24** `sys_choice` values via 7 composites at 2/6/4/3/4/3/2; 3 `sys_number`; 7 flows active and published; 8 reports; 2 dashboards; 1 portal + 2 public pages + 3 widgets; 2 anonymous REST endpoints; 20 ATF tests + 1 suite + 180 steps + 20 suite-tests; and task/party linkage resolving. **What this gate does not claim, stated plainly:** it is a same-instance reset-and-reimport, so anything the platform holds outside the records a teardown removes — caches, indexes, retained update history, metadata a scope deletion does not reach — was neither re-created nor tested, and this result cannot claim everything a truly independent instance would prove; provisioning a second PDI was out of scope. Two classes also did not transport and cannot: the **3** `sys_user_has_role` grants (Role Management V2 refuses them from any update set on this release; native remedy *Edit Members*) and the **8** `sys_grid_canvas_pane` rows (they point at `sys_portal` widget instances, which are not application files). *History, retained rather than restated as current:* export 3's **`eee9fabd…`** sequence (988 blocks / 4,062,436 bytes) was previewed to 0 problems and committed natively on 2026-09-02 and is no file on disk; the two hand-authored candidate packages — the 988-block `e109e1d1…` rebuild and the 935-block `9f3ea74c…` amended package — were superseded and **deleted** in this consolidation, their provenance recorded in [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) and their bytes recoverable from git history; and directive **D48's stop condition is closed**, the checksum recorded for the shipping package and the bytes on disk both being `b2217224…`. What remains open is only the independent-instance confirmation named above.  | **Clean slate (earlier revision).** On the **913-block / 3,618,378-byte / SHA-256 `7272edfc…`** file: **before = 41 errors** previewed against the already-populated instance (20 local-update collisions + 18 `x_casemgmt_case`/`case` + 3 `core_company`/`organization` reference problems); then, after a staged teardown proven complete (scope query `[]`, every application census counter 0, all three tables moving from HTTP 200 to HTTP 400), an upload with the child `sys_update_xml` count asserted at **exactly 913**; **298** problems on the first clean-slate preview, every one `Found a local update that is newer than this one` — the teardown's own deletions captured locally; and **after = 0 problems of any type** once that local capture was purged at source. Checked against the platform's own predicate rather than assumed: `state=previewed`, `unresolvedProblems=false`, `shouldDisplay=true`. Then committed, `previewed → committing → committed`. **Progression 41 → 298 → 0.** **Populated instance (the case that used to fail).** The same procedure on the 913-block `89638c17…` revision left **21 package-intrinsic reference problems** — 18 × `Could not find a record in x_casemgmt_case for column case` and 3 × `Could not find a record in core_company for column organization` — because the 28 seed rows carried their parent key in the reference element **body**, and preview accepts only a sys_id there. **The immediately preceding 925-block revision.** After the seed rows were re-shaped (parent key in the `display_value` attribute with an empty body for `x_casemgmt_case` and `core_company`; deterministic pinned numbers `CASE9000001-10` / `TASK9000001-10` / `PARTY9000001-08`), the **925-block / 3,698,577-byte / `e49a7654…`** file was uploaded as a fresh retrieved update set (925 children asserted) and previewed against the same populated instance: **31 problems, all `Found a local update that is newer than this one`, and ZERO `Could not find a record` problems — 63 → 0.** Every one of the 31 targets was confirmed to hold a local `sys_update_version` in state `current`, so all 31 are this instance's own history; **no seed-data record appears among them.** **Not claimed:** these bytes have not been re-run through a full teardown trip, and **Commit was withheld** because the verification instance is shared. **The bytes that ship (522 blocks / 3,114,377 bytes / `b2217224…`, measured 2026-09-08) have been previewed and committed as a complete file, on this instance reset to a recorded zero-state immediately beforehand (CR2 F06: recorded, not raw-proven) — the gate row above is that result. Before the consolidation the shipping bytes were the 935-block / 3,973,569-byte `9f3ea74c…` package, which had never been previewed as a complete file, and neither had the superseded 926-block / 3,780,373-byte `a9204411…` revision before it** — the 926-block revision differed from `e49a7654…` by 13 re-synced payloads and 1 added block (the case form's Related Lists definition) and, since 2026-09-03, by the seven native choice composites; each of those 14 records was applied to the live instance and read back field-for-field identical to its artifact, and every table and column they name was confirmed to exist, but that is not a preview and this document does not treat it as one. The shipping bytes then add **+9** payloads on top of the elected base — 4 Business Rules, 1 Client Script, 3 field-level `query_range` ACLs and 1 Form Layout record — none of which has been previewed either (register §0.3c; re-running the trip is §10.0 item 1a). The seven choice children **were** previewed and committed, as their own delta: 0 problems of any type, native commit, `sys_choice` 0 → 24. The install footprint of those superseded packages also remained: on them a bare commit created no physical storage, so the documented §9.5 sequence — two commits with a Global remediation run between and after them — was required. It is **not** required on the bytes that ship: one commit of them produced the physical schema, the 27 role links and the 24 choice values with no script run at all. It completed with `verified=true`, `acl_links_total=27`, `errors=0`, **as measured at `2026-09-02T20:40:00Z` against the 26-ACL package of that day**; on the 29-ACL shipping package the same run's invariant is `acl_links_total=36` (manager 17 / agent 13 / viewer 6), which is what the live instance reads at `2026-09-05T04:45:00Z`. The earlier **916-block `32a064d6…`** result (42 → 0) is retained in §9.2/§9.10 as the history of that revision. |

> **Net, updated 2026-09-08 by the Update Set consolidation: for THE SHIPPING deliverable — the 522-block /
> 3,114,377-byte `b2217224…` package — 5 gates pass outright · ~~1 passes with a documented post-commit native
> step~~ **[scoring WITHDRAWN 2026-09-09 — CR2 F09: ACLs is NOT MET on the assignment half; see the corrected
> accounting below]** · 1 is MET by a same-instance reset-and-reimport** — 5 + 1 + 1 = 7, which is the
> accounting tabulated below. The Update Set gate is now **met on the bytes that ship**: they were previewed to 0 `type=error` and 0
> `type=warning` problems and committed once, on this instance reset to a recorded zero-state (CR2 F06: recorded, not raw-proven) immediately
> beforehand with no intervening patch — and that is a same-instance reset-and-reimport, **not** an independent
> second instance, which is the one thing this result cannot claim. Data model is now an outright pass: a single
> commit of the shipping package produced the physical schema, the `sys_documentation` rows and the 24 choice
> values with no remediation script and no second commit. ACLs is proven on the **schema half** — 26 scoped
> ACLs and **27 of 27** `sys_security_acl_role` links from the package alone — and is **NOT MET on the
> assignment half**: the **3** `sys_user_has_role` grants, which Role Management V2 refuses from any update set
> on this release. **CORRECTED 2026-09-09 (CR2 F09):** describing that as "one named post-commit native step"
> is withdrawn — a manual write performed after the commit is a deployer workaround for a BLOCKED platform
> capability gap, not gate satisfaction, and it leaves AAP §0.7.3 Gate 3 and §0.7.4 unsatisfied.
> **The pre-consolidation accounting, retained as history rather than restated as current:** it read 4 pass · 2
> qualified · 1 NOT MET on the 935-block `9f3ea74c…` package, whose physical schema and role links had to come
> from `scripts/post_import_remediation.js` rather than out of the commit; a separate 5 · 1 · 1 reading belonged
> to the 988-block `e109e1d1…` rebuilt package. Both of those packages were superseded and **deleted** in this
> consolidation. *Retained as written on 2026-09-05, and superseded by the correction that follows it:*
> *…its own Update Set gate is NOT MET as
> well. The **Update Set gate was MET on export 3's sequence `eee9fabd…`, is NOT MET on the retained rebuilt
> `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`, is NOT MET on the elected base
> `7292a6fe…` retained at `…FALLBACK.xml`, and is NOT MET on the `9f3ea74c…` bytes that ship.** Electing the fallback settled which package ships and passed no gate; §10.0 of
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) records the run that closes the
> gate for either artifact, and the promotion that makes the rebuilt one shippable.*
> **CORRECTED 2026-09-08 — the Update Set gate is MET on the `b2217224…` bytes that ship**, run on those
> exact bytes by the same-instance reset-and-reimport described above rather than on an independent second
> instance. The two candidate packages named in the retained lines were superseded and **deleted** in this
> consolidation, so no promotion remains to be made. Evidence:
> [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) for the current
> result, [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) for the earlier ones.
>
> **Net for the shipping deliverable, scored under the binary rule — CORRECTED 2026-09-09 (CR2 F09):
> 5 gates pass outright · 1 NOT MET (ACLs, on the assignment half; its schema half is proven) · 1 MET by a
> same-instance reset-and-reimport** — 5 + 1 + 1 = 7. *(This line previously read "1 passes with a documented
> post-commit native step" in place of the NOT MET; that scoring is withdrawn.)*
>
> | Verdict | Gates |
> | --- | --- |
> | ✅ Pass outright (5) | Data model *(physical schema, documentation rows and 24 choice values from one commit)* · Workflow · Portal — submission *(REST contract **and** page)* · Portal — lookup *(REST contract **and** page)* · Dashboards *(both, admin and every entitled persona)* |
> | ❌ NOT MET (1) — **CORRECTED 2026-09-09 (CR2 F09)**; this cell previously read "✅ Pass with a documented post-commit native step" | ACLs *(**schema half proven:** 26 ACLs and 27 of 27 role links from the package alone, one commit, no remediation script. **Assignment half NOT MET:** the 3 `sys_user_has_role` grants cannot be delivered by any update set on this release, so post-commit they read 0 — AAP §0.7.3 Gate 3 and §0.7.4 unsatisfied. Creating them with Edit Members is a deployer workaround for a BLOCKED platform capability gap, not gate satisfaction.)* |
> | ✅ MET, by a same-instance reset-and-reimport (1) — **on a pre-commit zero-state precondition that is evidence-unproven at raw level (CR2 F06, second pass)** | Update Set *(the shipping 522-block / 3,114,377-byte / `b2217224…` file previewed to 0 `type=error` and 0 `type=warning` problems and committed once, on this instance reset immediately beforehand with nothing running in between. **Evidenced: the load of 522 children, the two zero problem counts, the single native commit and the post-commit census. Not independently re-verifiable: the pre-commit (Step 5b) zero-state itself — its ten checks were run and their normalized results recorded, but the verbatim captures for that pass are not retained and the instance is torn down, so it is reported as recorded rather than proven.** Also not verified on an independent second PDI, which is a named limitation of the verification rather than a defect in the package)* |
>
> **On the count — CORRECTED 2026-09-09 (CR2 F09).** Gate 1 (Data model) no longer carries the
> manual-remediation qualification the superseded packages needed, so it is an outright pass. Gate 3 (ACLs) is
> **NOT MET**: its schema half is proven from the package alone, its assignment half cannot be delivered by any
> update set on this release, and a gate needing a manual write after the commit is not met by the deliverable.
> The accounting is **5 pass outright · 1 NOT MET · 1 MET by a same-instance reset-and-reimport**, i.e.
> **5 + 1 + 1 = 7** with the middle column now NOT MET rather than pass-with-a-step. *(The sentence that stood
> here — "a reader who counted that step as part of a normal install and a reader who scored it as a
> qualification now arrive at the same place: **6 pass · 1 MET by a same-instance reset-and-reimport**" — is
> **withdrawn**: no reading of a mandatory post-commit manual write makes six gates pass.)* The progression of
> this line across
> revisions is `2+3+1` (wrong — sums to six), `2+4+1`, `1+5+1`, `3+3+1`, `4+3+0`, `4+2+1`, `5+1+1` on the
> rebuilt package, `4+2+1` again on the elected bytes, `5+1+1` after the Update Set consolidation gated the
> shipping bytes, and — after this correction — **`5+1+1`** read as 5 pass · 1 NOT MET · 1 MET. Any count that
> fails to sum to 7 is wrong on its face.
>
> **What the one BLOCKED gap and the one remaining caveat mean, because neither may be read as "fine" or as
> "nothing left" — framing CORRECTED 2026-09-09 (CR2 F09).** ACLs is correct on the package's own records the
> moment the commit finishes — 26 ACLs, 27 of
> 27 role links — but the three role **grants** cannot be delivered by any update set on this release and must
> be created by hand with *Edit Members*, and until they are, every persona-scoped check fails for want of a
> role rather than for want of an ACL: that is exactly
> what the sixteen ATF failures in the consolidation report are — one measurement of one blocked gate, not
> sixteen defects. That is why this gate is scored **NOT MET** rather than "a documented step": the write
> happens after the commit, on the instance, by hand. **The Update Set gate is binary and it is MET**, on the shipping bytes, by a preview to 0 problems of
> any type and one native commit onto an instance reset to a recorded zero-state (CR2 F06) — *and which bytes carry which
> proof still matters*: that result belongs to the 522-block `b2217224…` file and to nothing else. The
> zero-problems-of-any-type result on the `7272edfc…` revision and the zero-reference-problems result on
> `e49a7654…` remain what they always were, measurements of their own revisions. What is **not** claimed anywhere
> is an independent second instance: the reset was performed on the only PDI available to this project. An
> earlier revision of this paragraph said the two portal gates *"pass at the contract level and fail at the
> surface level … a human visiting either portal page sees a blank screen"*; that was true when written and is
> **withdrawn** — the Service Portal layout records were authored and both pages render and work anonymously.
>
> The application logic is sound; the package is not self-installing. The install procedure that does work, and
> the residual manual footprint per defect, are in §9.5 of the limitations register. **The portal pages and both
> dashboards are now usable on this instance**, and the two further AAP requirements outside these seven gates
> that were previously measured as failing are now measured as passing:
>
> - **§0.4.4's related lists** for `case_task` and `case_party` were never authored — `sys_ui_related_list` held
>   0 rows for this scope and the case form's related-lists wrapper measured 0 pixels tall. The definition now
>   ships as [`../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml`](../related_lists/sys_ui_related_list_x_casemgmt_case_default.xml)
>   and the wrapper measures **227 px** with two sections, *Case Tasks* above *Case Parties*, each showing its
>   child rows — identically for admin, the agent and the viewer, which is what proves the definition is a base
>   definition applying to every user. One caveat is worth knowing before diagnosing it twice: the definition is
>   cached server side, so if the form was ever rendered before the definition existed, the lists stay invisible
>   until that cache is invalidated. Step 12 of [`deployment.md`](./deployment.md) Step 3 records the symptom and
>   the remedy.
> - **The chart reports' grouping column** arrived empty because `group_by` is **not a column** on `sys_report` on
>   this release, so the element was discarded on import; the column a chart groups on is `field` (register §0.6.1).
>   All four chart reports now carry `field` and plot the intended dimension.
>
> **Regression gate (outside the seven).** The 13 transition-logic assertions that were passing before this
> pass were re-measured afterwards with the same harness, run verbatim: **13 / 13 before, 13 / 13 after**, per
> assertion, with byte-identical expected and actual values — see §9.7 of the limitations register.
>
> **ATF gate (outside the seven).** **Current result, measured 2026-09-02 on the package alone: `TES0001002`,
> `21:45:31Z → 21:47:35Z` (`run_time 00:02:04`, `UI Batches Executed` 0 → 3) — 20 tests, `14 Success / 6 Failure /
> 0 Error / 0 Skipped`, with 180 of 180 steps executed and none unable to execute.** The six failures, by name,
> are **`ATF 01`, `ATF 10`, `ATF 15`, `ATF 16`, `ATF 17` and `ATF 18`**; all six are classification (c) with no
> fix attempted, and all six have the **same** root cause — `sys_choice` rows are absent for the three scoped
> tables (0 rows; the package's own choice `sys_id` `3e7609e334c65bf732756bc25d9f21c2` answers HTTP 404) while the
> dictionary keeps the four `case` fields choice-typed, so `status`, `type`, `priority` and `pending_reason` offer
> no selectable option. Each failure's failing step, verbatim assertion text, classification and fix-attempt
> record is in [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) §(e); the suite left no residue (ATF
> rollback clean, demo census back to 10 / 10 / 8). This gate therefore did **not** pass on the package as it
> stood that day, and the six named failures are not to be averaged into a rate.
> **What has changed since, and what has not.** The root cause those six failures share — absent `sys_choice`
> rows — is addressed in the package now on disk: its seven choice children are platform-native composites, and
> that exact seven-child delta previewed to 0 problems, committed natively and produced **24 of 24** rows with
> the exact option labels on the real forms (2026-09-03). The dictionary's four `case` choice fields therefore
> have selectable options after a commit of the current bytes. **The suite has not been re-run on them**, so
> 14 / 6 remains the last measured ATF rollup and no new rollup may be quoted; re-running the suite against the
> current package is open work alongside §10.0 item 2.
> **The 20 / 20 rollup below is historical post-remediation evidence and no longer the current verdict.** On the
> committed instance the suite scored **20 / 20 tests Success and 180 / 180 step results Success**
> — 0 Failure, 0 Error, 0 Skipped, ~4 minutes, no test residue left behind — and that
> rollup was **reproduced twice independently**: `TES0001016` (2026-08-10 04:56) and `TES0001017`
> (2026-08-10 05:22, `run_time 00:03:28`, dispatched through the product UI with a browser runner attached,
> `UI Batches Executed` 0 → 3). Those runs were taken **after** `../scripts/post_import_remediation.js` had
> created the 24 `sys_choice` rows, which is precisely the condition the 2026-09-02 run lacked — so both results
> stand, dated and classified: 20 / 20 with the choice rows present, 14 / 6 without them.
> **Quote the rollup and the measurement method, not a `TES…` identifier.**
> `sys_atf_test_suite_result` rows are **not durable on this shared instance**: `TES0001015` and `TES0001014`,
> which earlier revisions of this row presented as the final and the serialized-import verdicts, **no longer
> resolve** — a REST `GET` on either answers *"No Record found"* — so both are historical and perishable, and the
> reproducible claim is the rollup plus the seven post-import checks of
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §8.5](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md), with the full perishability
> record in [§8.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). An earlier *series* of runs,
> `TES0001010`–`TES0001012`, scored **16 Success / 4 Failure** — `ATF 07` (the child-table ACL condition) plus the
> three form tests `ATF 15` / `ATF 16` / `ATF 17`; both root causes are fixed and that result is history rather
> than status. Two claims remain separate and are **not** interchangeable: that the suite scored 20 / 20 against
> the **live, post-remediation** assets (the August runs above), and that it does so against the **serialized**
> ones — the latter was last taken on an earlier package revision, and repeating it on the shipping bytes is open
> work (register §10.0 item 2). Neither claim survives into the current verdict: the 2026-09-02 run above is the
> live-asset measurement that stands today, and it is 14 / 6.
> Running the suite requires `sn_atf.runner.enabled = true` and a browser-attached client runner — see
> [`ATF_MANUAL_TEST_PLAN.md`](./ATF_MANUAL_TEST_PLAN.md).

## Per-Gate Detail

Each gate below follows the same shape: the verbatim Criterion and Pass Condition, a numbered Detailed Verification Procedure that a human verifier can execute on the PDI without any further design context, the Cross-Reference Document under `docs/` that defines the design contract this gate exercises, and a Failure Mode that explains what to do when the gate fails. Per AAP Section 0.7.2 Minimal-Change Clause: when any gate fails and the resolution would require adding a module, workflow, table, portal page, integration, or other artifact beyond the AAP-defined scope, **stop and report the specific gap — do not substitute an out-of-scope workaround.**

### Gate 1 — Data Model

- **Criterion:** All 3 custom tables created with correct fields and types
- **Pass Condition:** Zero missing mandatory fields
- **Detailed Verification Procedure:**
    1. Open ServiceNow → System Definition → Tables → filter `Name CONTAINS x_casemgmt_case`. Confirm exactly 3 records: `x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`.
    2. Open each table and verify the field set matches `docs/data-model.md` verbatim — `x_casemgmt_case` has 14 fields (12 user-prompt-specified plus `pending_reason` plus the virtual `duration_to_close` Function Field), `x_casemgmt_case_task` has 6, `x_casemgmt_case_party` has 5 — 25 fields total.
    3. For each Mandatory column in `data-model.md`, confirm the dictionary entry has `mandatory = true`.
    4. For each Choice column, confirm the choices on the choice list match the Choice Values column verbatim.
    5. For each Reference column, confirm the reference target matches verbatim (`sys_user_group`, `sys_user`, `core_company`, `x_casemgmt_case`).
    6. Confirm the auto-numbering format on `x_casemgmt_case.number` is `CASE0000001` (7-digit zero-padded) and the field is Read-only.
- **Cross-Reference Document:** [`data-model.md`](./data-model.md)
- **Failure Mode:** If any mandatory field is missing or has a wrong type, fix the dictionary entry in the source application and re-export the Update Set. Do NOT add fields beyond the AAP-specified set. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires adding fields outside the AAP-defined data model, stop and report — do not substitute.

### Gate 2 — Workflow

- **Criterion:** All state transitions enforced for both case types
- **Pass Condition:** Invalid transitions return blocking error; task-closure check blocks Resolved transition
- **Detailed Verification Procedure:**
    1. Open Flow Designer and filter by **Application = `x_casemgmt Case Management`**, which is the reliable
       way to list them. The two parent flows are named **`general_inquiry_state_machine`** and
       **`complaint_state_machine`** internally, and **General Inquiry State Machine** / **Complaint State
       Machine** on screen — note there is **no `x_casemgmt_` prefix on flow names**, so a name filter of
       `x_casemgmt_*state_machine` matches nothing. Searching the name for `state_machine` works. Confirm both
       are **Active** and **Published**, not Draft. The same filter shows the five subflows they call:
       `validate_open_transition`, **`validate_in_progress_transition`** (note the underscores — the repository
       file is `validate_inprogress_transition.xml`), `validate_pending_transition`,
       `validate_resolved_transition`, `validate_closed_transition`. All seven were last measured
       `active=true`, `status=published`.
    2. As `x_casemgmt_demo_manager` user, create a new General Inquiry case in Draft status; attempt to set status to Open WITHOUT setting `assigned_group`. Verify a blocking form-level error appears.
    3. Set `assigned_group` and re-attempt the Open transition. Verify success.
    4. Attempt In Progress transition WITHOUT setting `assigned_agent`. Verify blocking error.
    5. Set `assigned_agent` to a user that is NOT a member of `assigned_group`. Verify blocking error.
    6. Set `assigned_agent` to a valid group member. Verify success.
    7. Create a child task on the case with `status = Open`. Attempt In Progress → Resolved transition. Verify error: `"All tasks must be closed before resolving this case."` (verbatim).
    8. Close the child task. Re-attempt Resolved transition. Verify success.
    9. As `x_casemgmt_demo_agent` (non-manager), attempt Resolved → Closed transition. Verify blocking form-level error.
    10. As `x_casemgmt_demo_manager`, attempt Resolved → Closed. Verify success and that `closed_date` is auto-populated.
    11. Attempt to set status back to Draft from any non-Draft state. Verify error: `"Cases cannot be returned to Draft."` (verbatim).
    12. Attempt to update a Closed case — first a field-only edit (change `priority`, leave `status` untouched), then a status change out of Closed. Verify both raise `"Closed cases are terminal and cannot be modified."` (verbatim), and that pressing Update with nothing edited is still accepted (the no-op is the only save a Closed case permits).
    13. Attempt an edge that is not in the matrix. On a fresh Draft case set `status` straight to `Closed`. Verify the form-level error `A case cannot go from Draft to Closed. From Draft the only valid next status is Open.`, that `status` is still `Draft` after a genuine reload, and that `closed_date` is still empty. Repeat for `Open → Closed`, `Pending → Resolved` and `Resolved → Open`; all eight skip/backward edges must be refused, because Gate 2's criterion is *all* state transitions enforced, not only the six the matrix lists preconditions for.
    14. Repeat the entire procedure for a Complaint case to confirm both flows enforce the same rules.
- **Cross-Reference Document:** [`state-machine.md`](./state-machine.md)
- **Failure Mode:** If any transition rule fails, fix the corresponding subflow in `flows/sub_flows/` and re-export. Do NOT add transitions beyond the AAP-specified set. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires a transition or workflow not defined in AAP Section 0.5.5, stop and report — do not substitute.

### Gate 3 — ACLs

- **Criterion:** Role-based access enforced
- **Pass Condition:** case_viewer cannot write; case_agent cannot access unassigned cases; case_manager has full access
- **Detailed Verification Procedure:**
    1. Impersonate `x_casemgmt_demo_viewer`. Open the case list. Confirm all cases visible.
    2. Open any case → attempt to edit any field → confirm the form is read-only (no Save button or all fields disabled).
    3. Impersonate `x_casemgmt_demo_agent`. Open the case list. Confirm only cases where `assigned_agent = self` OR `assigned_group` contains self are visible.
    4. Open an assigned case → confirm fields are editable.
    5. Attempt to write to `assigned_group` field — confirm field is read-only (manager-only).
    6. Open an unassigned case via direct URL — confirm 403 / "Security constraints prevent access" message.
    7. Impersonate `x_casemgmt_demo_manager`. Open the case list. Confirm all cases visible and editable.
    8. Edit `assigned_group` and `assigned_agent` — confirm both fields are writable.
    9. Delete a Draft demo case — confirm success.
    10. Repeat steps for `case_task` and `case_party` tables to confirm the same matrix is enforced.
- **Cross-Reference Document:** [`acl-matrix.md`](./acl-matrix.md)
- **Failure Mode:** If any role has incorrect access, fix the ACL records in `acl/` and re-export. Do NOT modify global ACLs. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires altering global ACLs or adding roles beyond the three AAP-defined scoped roles, stop and report — do not substitute.

### Gate 4 — Portal Submission

- **Criterion:** Case created from unauthenticated portal submission
- **Pass Condition:** Case appears in internal list with Draft status and correct case number
- **Detailed Verification Procedure:**
    1. Log out of the PDI. Open the portal URL `[instance URL]/x_casemgmt_case_portal` in an incognito browser window. The slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml); AAP Section 0.7.2 verbatim wording uses the generic placeholder `[instance URL]/x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time"). See [`portal-pages.md`](./portal-pages.md) for full discussion.
    2. Navigate to the Case Submission page.
    3. Fill in the 5 fields: subject, type (General Inquiry), description, requester_name, requester_email.
    4. Click Submit. Confirm a confirmation panel appears displaying the auto-generated case number in `CASE0000001` format.
    5. Log in as `x_casemgmt_demo_manager`. Open the case list. Find the case by the returned number.
    6. Confirm `status = Draft`, `subject` matches submitted value, `requester_name` matches submitted value, and `opened_date` is set.
    7. Confirm internal fields (`assigned_group`, `assigned_agent`, `closed_date`) are NOT populated.
- **Cross-Reference Document:** [`portal-pages.md`](./portal-pages.md)
- **Failure Mode:** If submission fails or the case doesn't appear, fix the scripted REST endpoint in `portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml` and re-export. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires adding portal pages, fields, or anonymous endpoints beyond those defined in [`portal-pages.md`](./portal-pages.md), stop and report — do not substitute.

### Gate 5 — Portal Lookup

- **Criterion:** Status lookup returns correct data for valid case number
- **Pass Condition:** Correct status/subject/opened_date returned; "not found" message for invalid number
- **Detailed Verification Procedure:**
    1. Log out of the PDI. Open the portal URL in an incognito browser window.
    2. Navigate to the Case Status Lookup page.
    3. Enter the case number returned from the Gate 4 submission test. Click Lookup.
    4. Confirm the result panel displays exactly three fields: `status`, `subject`, `opened_date`. Confirm NO other fields are exposed (no `assigned_group`, no `assigned_agent`, no `description`, no `closed_date`, no `requester_*`).
    5. Enter an invalid case number (e.g., `CASE9999999`). Click Lookup.
    6. Confirm the literal text `"No case found with that number."` (verbatim) is displayed.
- **Cross-Reference Document:** [`portal-pages.md`](./portal-pages.md)
- **Failure Mode:** If the lookup exposes internal fields or returns wrong text, fix the scripted REST endpoint in `portal/rest/sys_ws_definition_x_casemgmt_case_status_lookup.xml` and re-export. Per AAP Section 0.7.2 Minimal-Change Clause, if a gap requires exposing additional fields on the lookup page, stop and report — do not substitute; the user prompt explicitly limits the lookup to `status`, `subject`, and `opened_date`.

### Gate 6 — Dashboards

- **Criterion:** Both dashboards render with synthetic data
- **Pass Condition:** All widgets display data; no broken report references
- **Detailed Verification Procedure:**
    1. Impersonate `x_casemgmt_demo_agent`. Navigate to Performance Analytics → Dashboards → Agent Workspace.
    2. Confirm all 3 widgets render: My open cases (list), My overdue tasks (list), Case count by status (donut).
    3. Confirm each widget displays at least one row of synthetic data (or a clean "No data" message — but NOT a "Report not found" or 500 error).
    4. Click each list widget item to drill into the underlying record. Confirm navigation works.
    5. Impersonate `x_casemgmt_demo_manager`. Navigate to Manager View dashboard.
    6. Confirm all 5 widgets render: cases by status (bar), cases by type (donut), cases by priority (bar), avg time-to-close (single-score), cases-opened-30-days (single-score).
    7. Confirm each widget shows synthetic-data values consistent with the seed data.
- **Cross-Reference Document:** [`dashboards.md`](./dashboards.md)
- **What actually happens today:** steps 2 and 6 both pass. Agent Workspace renders 3 of 3 widgets and Manager
  View 5 of 5, one tab each, with the seed data, 0 console errors and 0 responses ≥ 400. Step 4's drill-in works
  because *My Open Cases* renders a real list frame with record links. Note that step 3's "or a clean No data
  message" branch is the correct outcome for the two "My …" widgets when the signed-in user has no assignments:
  the manager legitimately sees a populated list frame reading "No records to display", while the agent sees
  exactly its own three cases.
- **Two packaging defects had to be fixed to get here, and both are recorded in full because the symptom pointed
  away from the cause:**
    1. Each dashboard's composite named three child tables that **do not exist on this release** — `pa_tab`,
       `pa_dashboard_widgets` and `pa_dashboard_role` — so the tab, all 8 widget placements and the role grants
       were silently dropped on commit, and a dashboard with no tab can render no widgets. The real wiring is
       `sys_portal_page` → `sys_grid_canvas` → `pa_tabs` → `pa_m2m_dashboard_tabs`, plus one
       `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` triple per widget. Supplying only a tab
       is provably insufficient: the platform auto-created one on first view and both dashboards stayed blank.
    2. The chart reports arrived with **no grouping column** although the artifacts specified one, because
       `group_by` is not a `sys_report` column at all — the column a chart groups on is `field` (register §0.6.1).
- **Getting a dashboard to open for a non-admin persona took three further gates, none of them obvious from the
  refusal text, so they are named here:** `sys_report.user` must be `GLOBAL` before the report read ACL's role
  branch is even evaluated; `sys_report.roles` then narrows which roles may read; and the dashboard itself is
  gated by `pa_dashboards_permissions` (the share list, one row per role) **and** by
  `pa_dashboards.restrict_to_roles`, which is the field the renderer quotes when it refuses. The similarly-named
  `pa_dashboards.roles` is labelled "Requires Roles" and only narrows — it grants nothing. There is no per-widget
  `report_view` gate on this application's content: that message was verified absent on every dashboard load, and
  verified as a true negative rather than an unobserved one, because the same personas do receive it on the
  platform's own `task`-table homepage widgets in the same session.
- **CR1 2026-09-09 (review finding F02) — the package could not have passed this gate, and now can.** The
  8 `sys_grid_canvas_pane` placements had been dropped from the shipped package on the mistaken premise that
  `sys_portal` widget instances cannot be packaged. They can, and the package embeds all 8 of them (with 96
  `sys_portal_preferences`) inside its two `sys_portal_page` composites; the real cause of the preview error that
  triggered the drop is that the preview validator resolves a reference only against a local record or a
  *standalone* block in the same set, and the widget instances travelled as composite children. Without the pane
  rows a committed dashboard has its canvas, tab, permissions, reports and configured widget instances but no
  placements, so steps 2 and 6 of this procedure would have found 0 of 3 and 0 of 5 widgets on a fresh install.
  The 8 rows are restored in the shipping bytes as two self-contained bundles that carry the widget instances
  they reference. **Verified statically only** — 8 pane records present, every `portal_widget` and `grid_canvas`
  target resolving inside the package — so on the next deployment run steps 2 and 6 are the confirmation, plus
  `GET /api/now/stats/sys_grid_canvas_pane?sysparm_count=true&sysparm_query=sys_scope.scope=x_casemgmt` → 8.
- **Failure Mode:** if a future revision regresses this, fix the artifacts and their payloads and re-export —
  **not** by hand-building the dashboards on the instance, which would leave the deliverable still broken. Per
  AAP Section 0.7.2 Minimal-Change Clause, if a gap requires adding widgets beyond the eight reports defined in
  [`dashboards.md`](./dashboards.md), stop and report — do not substitute.

### Gate 7 — Update Set

- **Criterion:** Scoped app exported
- **Pass Condition:** Update Set loads without errors on a fresh PDI instance
- **CR1 2026-09-09 — this gate's verdict does NOT carry over to the bytes that ship now.** Every gate result
  recorded for Gate 7 below was measured on the pre-amendment package (522 blocks / 3,114,377 bytes /
  `b2217224…`). Resolving the CR1 findings changed the bytes — four payloads removed, four added, three payloads
  amended in place, every block reordered — and the amended package has **not** been uploaded, previewed or
  committed anywhere: the PDI is deliberately at its torn-down zero state and the CR1 checkpoint made no
  instance writes. This gate is therefore **OPEN on the shipping bytes** and closing it is the first deployment
  action ([`deployment.md`](./deployment.md) Step 2). What is established statically on those bytes:
  `xmllint --noout` clean; all 522 payloads parse individually; 522 unique block names with no duplicate and no
  stray root `sys_id`; exactly one descriptor, whose `inserted`/`summary` both read 522; zero `global` scope
  stamps in any payload; every one of the 122 embedded script bodies parses and uses no post-ES5 construct;
  every reference inside the restored pane bundles resolves to a record the same package carries; the payload
  set is byte-identical before and after the reorder (sha256 over the sorted payload texts); and the AAP §0.5.2
  dependency-order assertion passes, which the pre-amendment bytes failed.
- **Detailed Verification Procedure:**
    1. On the source PDI: System Update Sets → Local Update Sets → locate the scoped application Update Set → set status to Complete → Export to XML.
    2. Provision a fresh PDI (or use a separate clean instance).
    3. On the verification PDI: System Update Sets → Retrieved Update Sets → Upload XML → select the exported file.
    4. Click Preview. Wait for preview to complete.
    5. Confirm zero preview errors. Skipped or warning rows are NOT acceptable as passes.
    6. If preview errors exist, return to source PDI, fix the underlying records, re-export, and restart this procedure.
    7. Click Commit. Wait for commit to complete.
    8. Re-run all of Gates 1–6 on the verification PDI to confirm the application is fully functional after a fresh install.
- **Status of this procedure:** it has been executed end-to-end on the 913-block / 3,618,378-byte /
  `7272edfc…` revision, reaching **0 preview problems of any type** — verified through the platform's
  own `unresolvedProblems=false` / `shouldDisplay=true` predicate — and then `state=committed`. The measured
  progression was **41 → 298 → 0**: 41 against the already-populated instance, 298 on the first clean-slate
  preview (all of them the teardown's own deletions captured as newer local updates), and 0 once that local
  capture was purged at source. It was also executed earlier, with the same zero result, on the **916-block
  `32a064d6…`** revision. **On the 925-block `e49a7654…` revision steps 1-4 only were
  executed** — upload as a fresh retrieved update set with the child count asserted at 925, then preview:
  **31 problems, all `Found a local update that is newer than this one`, zero `Could not find a record`.**
  Steps 5-8 (teardown, commit, re-run the gates) were **not** performed on those bytes because the
  verification instance is shared with other work and committing would have mutated a live application.
  **Superseded on 2026-09-02, in three parts, and this procedure either has been executed on a byte sequence or
  it has not — there is no partial credit. On the 988 records as they stood in export 3's byte
  sequence — 988 blocks / 4,062,436 bytes / `eee9fabd…` — steps 1-4 plus the
  commit were executed and reached 0 problems of any type followed by `state=committed`, so the gate is MET on
  that sequence
  ([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md)). The post-review CR1 re-sequencing then
  changed the block order into AAP §0.5.2 dependency order, producing `90ee0249…` (a superseded identity that
  matches no file in this tree), and the choice-materialization fix at commit `f8454fb078`
  then replaced that file's seven `sys_choice` children, producing the 988-block / 4,062,067-byte / `e109e1d1…`
  file. Steps 1-8 were never executed on either of those
  byte sequences, and **that file was superseded and deleted in the Update Set consolidation**, which produced
  and gated a platform export in its place
  ([`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md); its bytes remain
  recoverable from git history). It had been checked
  statically instead
  (`xmllint --noout` clean, 988 blocks, 981 of them byte-identical to the previewed bytes, every §0.5.2
  dependency assertion passing), and its seven choice children were separately uploaded, previewed to 0
  problems of any type and committed natively on 2026-09-03 — corroboration plus an exact-child result rather
  than a round trip. **Steps 1-4 were likewise never
  run on the complete 935-block / 3,973,569-byte / `9f3ea74c…` bytes, which shipped before this consolidation
  and were superseded and deleted with it. Steps 1-8 HAVE now been executed, in full, on the bytes that ship:**
  `update-set/x_casemgmt_case_management_update_set.xml` at **522 blocks / 3,114,377 bytes / `b2217224…`** was
  checksummed, uploaded, loaded with 522 children asserted, previewed to **0 `type=error` and 0 `type=warning`**
  problems and committed once through the native Commit Update Set action on 2026-09-08, onto this instance
  torn down to a recorded zero-state (CR2 F06: recorded, not raw-proven) immediately beforehand with nothing running in between; gates 1-6 were then
  re-measured on that install. Those bytes are **NOT** byte-identical to
  `…FALLBACK.xml` (that path retains the elected base `7292a6fe…` / 926 blocks / 3,781,097 bytes, restored
  2026-09-05T04:45Z). The gate is
  therefore MET for the artifact that ships — by a same-instance reset-and-reimport rather than an independent
  second PDI, which is the one thing it does not prove — and directive D48's stop condition is closed, the
  recorded checksum for the shipping package and the bytes on disk both being `b2217224…`.** Re-running §5 of
  [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) against the shipping file on a
  genuinely clean, dedicated **second** PDI, asserting **522** children and 3,114,377 bytes, is what would
  discharge the independent-instance confirmation that a same-instance reset cannot give;
  [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) states exactly what
  the same-instance run did and did not establish.
  Step 8 was carried out on the `7272edfc…` install: all of gates 1–6 were re-measured on the
freshly installed instance, and their outcomes are the ones in the Measured Status table above. Note that
  steps 7–8 no longer require the §9.5 install sequence on the shipping bytes — one commit of them creates the
  physical storage, the 27 role links and the 24 choice values — while on the superseded packages they did.
- **Cross-Reference Document:** [`deployment.md`](./deployment.md) and [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md)
- **Failure Mode:** Update Set integrity is the final gate; failure here blocks delivery. The most common cause is hard-coded `sys_id` references — search every flow, ACL, business rule, and seed record for literal `sys_id` values and replace with `GlideRecord` lookups by name/user_name/number/role_label. Per AAP Section 0.7.2 Minimal-Change Clause, if the preview reports errors that would require modifying global tables, installing Store applications, or adding scope-external artifacts to resolve, stop and report — do not substitute.

## Recommended Verification Order

The seven gates SHOULD be exercised in the order listed below. The order is a hint to verifiers, not a contract: each gate's Pass Condition is independently authoritative, but running them in this sequence ensures that early failures (e.g., a missing dictionary field) surface before time is spent on later gates that depend on the schema being correct. Re-running a later gate after fixing an earlier gate is expected.

1. **Gate 1 (Data model)** — foundational; nothing works without correct schema. Run first because Gates 2–6 all read from the three custom tables, and a missing field manifests as a broken downstream gate that is harder to diagnose than a missing dictionary entry.
2. **Gate 3 (ACLs)** — required for impersonation tests in later gates. Run before Gate 2 because Gate 2's Step 9 (non-manager attempts Resolved → Closed) needs role membership to be enforced correctly to produce the expected blocking error.
3. **Gate 2 (Workflow)** — depends on schema (Gate 1) and ACLs (Gate 3) being correct. The flows are filtered by case `type`, so both General Inquiry and Complaint must be exercised.
4. **Gate 4 (Portal submission)** — depends on schema (Gate 1) and the case table. Note: Gate 4 does NOT depend on Gate 3 because the portal endpoint runs as a privileged user with a whitelisted field set; it is verifying a different access path than the impersonation tests.
5. **Gate 5 (Portal lookup)** — depends on Gate 4 having created at least one demo case via the portal so that there is a case number to look up. The "not found" case (`CASE9999999`) does not depend on Gate 4 succeeding, but the positive-path step does.
6. **Gate 6 (Dashboards)** — depends on synthetic seed data being committed (the demo cases, tasks, and parties), which means the seed script has run successfully and the demo cases are visible in the case list. Run after the workflow tests to ensure the seed-data status mix is intact (some Closed cases for `avg_time_to_close`, etc.).
7. **Gate 7 (Update Set)** — final integration gate; runs the entire Gates 1–6 suite on a fresh PDI to confirm the application is fully functional after a clean install. This gate is non-substitutable: a successful round-trip on a fresh PDI is the ultimate evidence of integrity.

If any gate fails, return to the corresponding source artifact, apply the fix, re-export the Update Set on the source PDI, and re-run the failed gate plus every subsequent gate to confirm no regression. Do NOT mark a later gate as passed if an earlier gate failed and was not re-verified.

## Definition of Done

The scoped application is delivered as Done when every Gate above passes AND every success criterion below holds. The bullet list reproduces AAP Section 0.7.2 (User Example — Success criteria) verbatim:

- Cases created, assigned, progressed through all defined states, and closed via both internal UI and external portal
- Tasks created, linked to cases, assigned, and closed — case resolution blocked until all linked tasks are closed
- People and Organizations associated to cases as typed parties
- ACLs enforced: `case_viewer` read-only, `case_agent` read/write on assigned cases, `case_manager` full access
- 2 dashboards operational: agent workspace and manager view
- Scoped application exported as a complete Update Set

In addition, every Gate's Pass Condition (column 3 of the Seven Gates table above) MUST hold on a fresh PDI after the Update Set has been re-imported and committed. The exported Update Set XML file path and the portal URL MUST be delivered as final artifacts alongside confirmation that all seven validation gates passed (see [`deployment.md`](./deployment.md) Step 4: Deliver).

> **Current standing against this Definition of Done.** It is **not** fully met, and the Measured Status table
> above records exactly where. Against the success criteria reproduced in this section: cases can be created,
> assigned, progressed through every state and closed **via the internal UI**, and a case can now also be
> submitted and tracked **via the external portal** — both pages render and work anonymously since their
> Service Portal layout records were authored and the widgets' response-envelope bug was fixed; tasks and
> parties work and case resolution is correctly
> blocked until all linked tasks are closed; ACLs are enforced as specified **on all three tables**, the agent
> role's task and party conditions having been fixed and confirmed by ATF 06 and 07 passing; **both dashboards are
> operational** — Agent Workspace renders 3 of 3 widgets and Manager View 5 of 5, with live seed data, for the
> admin and for every persona the design entitles, which is the Gate 6 row above and
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.5](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) (this paragraph previously
> recorded them as non-operational, which was accurate while the two packaging defects behind that result were
> still present, and is **withdrawn**); and the scoped application **is** exported as a single complete Update Set, which
> previewed with zero errors — **on the shipping deliverable's own bytes, gated on 2026-09-08 by a same-instance
> reset-and-reimport**. So what keeps this Definition of Done from being fully met is now two things only: three
> `sys_user_has_role` grants that no update set on this release can carry, which the role form's *Edit Members*
> creates as a documented post-commit step, and **the absence of an independent second instance** on which to
> repeat the round trip — the reset was performed on the only PDI available to this project. The
> outstanding work is enumerated in priority order in
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §10](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md); the round trip on the
> shipping bytes has since been run and is recorded in
> [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md). **Item 0, the
> wake of the hibernating — and now **retired, superseded** — `dev379024`, is superseded rather than open**: the re-measurement it existed to
> unblock was performed on `dev306625` on 2026-09-02, so item 1a's blocker is no longer an unreachable instance
> but the need for a genuinely clean, dedicated one (§0.11 and §10.0 item 0).
>
> **Read every measured status in this document as of the date its evidence was taken.** The verification instance
> has been hibernating since 2026-08-11 and serves no application surface, so nothing here was re-measured on
> it; [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.11](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) records what that
> leaves unproven. **The gates were re-exercised on 2026-09-02 on the existing `dev306625` PDI, after a targeted
> clean-state operation whose cascade exceeded the destructive boundary it was authorized under** — that
> instance was **not** newly provisioned; it already held this application installed, committed and seeded.
> **The intended target was authorized under OVERRIDE-3** — the three scoped tables' `sys_db_object` records,
> their `sys_dictionary` rows, their data rows and the scoped `sys_security_acl_role` links — **but the
> platform's table-delete cascade reached beyond that subset, which is a scope violation of the destructive
> boundary rather than an authorized side effect**: it also removed **26 `sys_security_acl`, 24 `sys_choice`
> rows, 7 business rules, 8 `sys_report`, 3 `sys_ui_list`, 1 `sys_ui_related_list`, 2 `sys_ui_policy` and the 3
> `sys_number` counters**, measured before and after in
> [`refine-run/PHASE1-REBUILD.md` §2.5](./refine-run/PHASE1-REBUILD.md). On a live instance the application
> therefore carried zero ACLs, zero ACL-role links, zero business rules and zero UI policies from
> `2026-09-02T19:22:09Z` until the Phase 2 commit at `2026-09-02T20:53:14Z` — roughly **91 minutes** — which
> is the **second, independent ground on which Phase 1's hard gate is NOT MET**, alongside the role-link/grant
> mechanism deviation. Neither the deletion command having named only the three `sys_db_object` records, nor the
> Phase 2 commit's later restoration of the removed records, authorizes that reach. **Any equivalent future
> operation MUST run the pre-delete collateral guard first**: a read-only enumeration of the platform's delete
> dependencies before the first delete, aborting with **nothing deleted** on any non-zero count in a class
> outside the authorized subset, recording the phase as unmet on that ground, taking OVERRIDE-2's fallback /
> leave-for-human path, and proceeding only on an explicit human expansion of the destructive scope — specified
> in [`refine-run/PHASE1-REBUILD.md` §2.5](./refine-run/PHASE1-REBUILD.md) and in `refine-run/run-state.json`
> `final.scope_audit_d46.override_3_destructive_boundary`. The scope, the application record, the three roles
> and the seven flows were left in place. Clean state confirmed at
> `2026-09-02T19:22:09Z`: three tables at `HTTP 400 Invalid table`, `sys_dictionary` 0, `sys_security_acl_role`
> 0, `sys_user_has_role` 0, `sys_number` 0 — see
> [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) for the preview/commit result and the ATF suite
> outcome measured there.

## Cross-References

The documents below are the design contracts that each Gate exercises. A verifier MUST consult the corresponding document to interpret a gate's verification procedure when ambiguity arises.

- [`data-model.md`](./data-model.md) — Gate 1 (the three-table schema with field/type/constraint matrices)
- [`state-machine.md`](./state-machine.md) — Gate 2 (the transition matrix and the four blocking-error messages)
- [`acl-matrix.md`](./acl-matrix.md) — Gate 3 (the role × table × CRUD matrix and the "Assigned only" definition)
- [`portal-pages.md`](./portal-pages.md) — Gates 4 and 5 (submission page fields, lookup page fields, "No case found with that number." text)
- [`dashboards.md`](./dashboards.md) — Gate 6 (Agent Workspace + Manager View widget inventory and report references)
- [`deployment.md`](./deployment.md) — Gate 7 (Export → Verify → Confirm → Deliver runbook)
- [`../scripts/round_trip_verify.md`](../scripts/round_trip_verify.md) — manual procedure for Gate 7 (fresh-PDI re-import preview verification)
- [`../README.md`](../README.md) — overall POC overview and deliverable index
