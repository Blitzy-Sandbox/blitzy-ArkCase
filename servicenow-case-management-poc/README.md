# ServiceNow Case Management POC

A proof-of-concept ServiceNow scoped application that re-platforms a subset of ArkCase's case-management functional domain onto the ServiceNow Now Platform.

This subdirectory contains the ServiceNow scoped application, delivered as a **single self-contained Update Set XML** at `update-set/x_casemgmt_case_management_update_set.xml`, accompanied by serialized record-definition artifacts and supporting documentation under this same subdirectory. It targets a ServiceNow Personal Developer Instance (PDI); the current validation instance is `dev306625`, running **Zurich Patch 10** (`glide-zurich-07-01-2025__patch10-05-22-2026_06-12-2026_2311`), where the 2026-09-02 run took its measurements. It was originally built and gate-measured on `dev379024` (**Australia Patch 3**), a host that is now **retired and not used** — figures dated to it are dated evidence from that host, never current state. It is fully isolated from the existing ArkCase Maven reactor at the repository root — the rest of the repo is read-only context. The concrete scope identifier `x_casemgmt` is used consistently throughout these documents and every artifact under this subdirectory.

> **DELIVERABLE IDENTITY — read this before comparing, verifying or asserting any digest, byte size or block count anywhere in these documents.**
> Re-measured from the files on disk (`sha256sum`, `stat -c %s`,
> `grep -c '<sys_update_xml action="INSERT_OR_UPDATE">'`, and `cmp` between the deliverable and the
> fallback) — the commit-by-commit chain at 2026-09-05T04:45Z, and the deliverable path's own identity
> again after remedy (a) of directive D48's stop condition was executed. These four rows are the only
> identities stated here as current fact. Every other digest in this documentation set is either one of the other two retained
> artifacts below or an explicitly dated historical measurement, and is labelled as such where it appears.
>
> | Artifact | Identity, measured on disk | Status |
> | --- | --- | --- |
> | `update-set/x_casemgmt_case_management_update_set.xml` — **THE DELIVERABLE** | **926** `<sys_update_xml>` blocks · **3,781,097** bytes · SHA-256 **`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`** · descriptor `sys_id` `9929f50df18ccec91ea13b2a3bccfc90` · `xmllint --noout` clean · **0** `sys_security_acl_role` payloads | **MEASURED, NOT GATE-VERIFIED.** These exact bytes have never been uploaded or previewed on any instance. It is the **exact, untouched elected fallback**: `cmp` against `…FALLBACK.xml` reports no difference. **CORRECTED** — this row read **935** blocks · **3,973,569** bytes · `9f3ea74c…`, which the path held from commit `f8454fb078` until remedy (a) of directive D48's stop condition was executed; those bytes are retained, explicitly non-shipping, as the fourth artifact below |
> | `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — **the elected base** | **926** blocks · **3,781,097** bytes · SHA-256 **`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`** · 26 `sys_security_acl` · `xmllint` clean | Retained. Modified after election by the three commits below, then **restored to the elected bytes 2026-09-05T04:45Z**. **CORRECTED** — this row said it was deliberately no longer byte-identical to the deliverable. It is byte-identical again, and for the opposite reason: the **deliverable** was restored to the elected bytes by remedy (a) and this round's amendments were moved to the separate, explicitly non-shipping `…AMENDED-NOT-GATED.xml`. A fallback that tracks the deliverable is not a fallback; a fallback the deliverable has been restored *to* is D3's intended end state |
> | `update-set/x_casemgmt_case_management_update_set.AMENDED-NOT-GATED.xml` — **the retained amended package, EXPLICITLY NON-SHIPPING** | **935** blocks · **3,973,569** bytes · SHA-256 **`9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`** · 29 `sys_security_acl` · **0** `sys_security_acl_role` · `xmllint` clean | Retained, **not shipped**. **MEASURED, NEVER GATE-VERIFIED** — these bytes were never uploaded or previewed anywhere. They sat at the deliverable path from commit `f8454fb078` until remedy (a) of D48's stop condition was executed, and they are the only shippable-shaped artifact carrying this round's choice-materialization fix |
> | `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` — **the upgrade path** | **988** blocks · **4,062,067** bytes · SHA-256 **`e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`** · descriptor `sys_id` `0b3b7452934f435009aa70d19dba100d` · `xmllint` clean | Retained, **not shipped**. Gate NOT MET — its own complete bytes were never uploaded, previewed or committed |
>
> **What the deliverable is: the EXACT, UNTOUCHED ELECTED BASE. It IS byte-identical to `…FALLBACK.xml` —
> `cmp` reports no difference.**
> OVERRIDE-2 / directive D3 elected the untouched original package — `7292a6fe…`, 926 blocks, 3,781,097 bytes —
> as the shipping **base** at commit `3671901b5b`. Three later authorized remediation passes then amended those
> bytes in place: `f8454fb078` (choice materialization and seed references), `6efb13b141` (18 QA findings) and
> `8dfdbcb015` (independent-verification remediation). Between them they added **4** Business Rules, **1** Client
> Script, **3** field-level `query_range` ACLs and **1** Form Layout record, and renamed the **7** `sys_choice`
> payloads to `sys_choice_x_casemgmt_*` — a net **+9** payloads over the base, with **919** payload names in
> common. **CORRECTED — this paragraph said the deliverable was NOT reverted to the base. It has since been:**
> remedy (a) of D48's stop condition was executed, the recorded bytes were copied back to the deliverable path,
> and the nine amendments are **retained, not deleted**, at `…AMENDED-NOT-GATED.xml`. D3's authorized path on an
> unmet hard gate is the *untouched* package, and D48 permits a checksum mismatch to be closed only by putting
> the recorded bytes back — never by relabelling a measured digest as the recorded one.
> **What that costs, stated plainly:** the shipped package carries **26** `sys_security_acl` payloads and **7**
> `sys_script` Business Rules (not 29 and 11), the **7 older `sys_choice_<32-hex>` rows** rather than the
> name-keyed collections, and no Client Script or Form Layout record — so it does **not** carry this round's
> choice-materialization fix, and the absence of those collections is the single root cause of the six ATF
> failures in `docs/refine-run/PHASE3-ATF.md`. `scripts/post_import_remediation.js` asserts **36** ACL → role
> links (manager 17 / agent 13 / viewer 6) against the **29** ACLs this repository's `acl/*.xml` artifacts
> describe, so on this 26-ACL package it reports the 3-ACL / 9-link shortfall as a **named** non-convergence
> and tells the operator to import the three `query_range` ACL records from `acl/` and re-run; the base's own
> 26 ACLs need **27** links (manager 14 / agent 10 / viewer 3). Those are two different packages, not two
> readings of one.
>
> **The deliverable's superseded digests — recorded so an older copy can be recognised, and never to be read as
> current.** `7292a6fe…` / 3,781,097 B / 926 blocks was the elected base at `3671901b5b` and is **not**
> superseded at all: it is the identity of `…FALLBACK.xml` **and of the deliverable path**, restored there by
> remedy (a). `a9204411…` / 3,780,373 B was the deliverable at `f8454fb078`, and `4e28acae…` /
> 3,944,374 B was the deliverable at `6efb13b141`; **neither is the identity of any file in this tree.**
> `9f3ea74c…` / 3,973,569 B / 935 blocks was the deliverable at `8dfdbcb015` and remains a live measurement —
> of `…AMENDED-NOT-GATED.xml`, never of the deliverable. Where a
> figure further down this documentation set is a **dated measurement** of one of those revisions, it is
> preserved as written and marked as history — rewriting it would falsify the record. Where such a figure was
> stated as a current identity, or as a value a reader is told to verify, compute, assert or promote, it has been
> **corrected** to the table above. If you find one that has not been, the table above wins.
>
> **What an importer must still do, and what is still unmet.** A bare commit of the deliverable on a clean
> instance is **not** sufficient. Measured on the shipping file: **0** `sys_documentation` rows, **0**
> `sys_security_acl_role` rows and **25** hand-authored `sys_dictionary` rows with random-32-hex update names. So
> the commit leaves the three scoped tables **without physical storage** and the ACLs **without role links**. Run
> `scripts/post_import_remediation.js` in **Global** scope after the commit, commit a second time, run it again,
> then seed with `scripts/seed_demo_data.js`. AAP §0.7.1 / Gate 7 — the zero-preview-error round trip — is
> **UNMET** for these bytes — they have never been previewed anywhere. Directive **D48's stop condition was
> RAISED, REPORTED, and is now CLOSED BY REMEDY (a)**: the checksum recorded for the shipping package is
> `7292a6fe…`, the bytes at the deliverable path measure `7292a6fe…`, and the identity comparison holds. It was
> closed the only way D48 allows — by putting the recorded bytes back at the path, never by overwriting a
> recorded checksum with a measured one. **(a) EXECUTED:** the elected bytes were copied from `…FALLBACK.xml`
> to the deliverable path and verified with `sha256sum` on all four update-set files and with `cmp`; the cost is
> that the three remediation passes are **absent from the shipped package** and retained instead at
> `…AMENDED-NOT-GATED.xml`. **(b) STILL HUMAN-GATED and the open half:** run the full gate on `9f3ea74c…`
> against a genuinely clean, dedicated PDI — the only route that would let those nine amendments ship — which is
> **unavailable** on two measurements: no clean PDI is provisioned (the single instance `dev306625` holds this
> application committed, converged and seeded), and the deliverable's own descriptor `sys_id`
> `9929f50df18ccec91ea13b2a3bccfc90` is an **already-committed** retrieved set on that instance, so an upload
> there would reuse that row and append the file's children to the committed evidence. The full record is `docs/refine-run/run-state.json`
> `final.d48_stop_condition` and `final.artifact_identity_ledger`.
>
> **WARNING — promoting the retained rebuilt package as it stands would drop this round's remediation.**
> `…REBUILT-DEPENDENCY-ORDERED.xml` carries the platform-captured `sys_db_object` and `sys_dictionary` records
> directives D2/D21 ordered — **30** platform-named `sys_dictionary` rows, **30** `sys_documentation` rows and all
> **27** `sys_security_acl_role` links — and every AAP §0.5.2 dependency assertion passes on it, which is why it
> is the upgrade path. What it does **not** carry is the 9 payloads the three post-election passes added — the
> ones now retained at `…AMENDED-NOT-GATED.xml` and **absent from the shipped package too**: it holds 26
> `sys_security_acl` and 7 `sys_script` rows, no Client Script and no Form Layout record.
> A promotion must therefore carry those 9 records across first. Its identity is **`e109e1d1…` over 4,062,067
> bytes**, which **supersedes** `90ee0249…` over 4,062,436 bytes — commit `f8454fb078` applied the same
> choice-materialization fix to this package too. `90ee0249…` matches **no file in this tree**, so any
> instruction still quoting it would send an operator to a checksum they cannot reproduce, and they would
> correctly abort.

> **The package is self-contained; the *installation* is not self-completing, and this POC is not finished.** Committing the Update Set does **not** by itself yield a working application, and four things are open. Read this before planning around it:
>
> 1. **Two manual post-import steps are mandatory for the shipping package — the delivery election put them back.** The 2026-09-02 native-rebuild run did get both the physical table schema (Defect C's storage half) and all **27** ACL role-link records (Defect 9) **from the package alone** on a single clean-instance commit — three tables at HTTP 200 with `sys_dictionary` **instance rows** 21 / 14 / 13, and **27 `sys_security_acl_role` instance rows** split manager 14 / agent 10 / viewer 3, with `scripts/post_import_remediation.js` never run and no second commit. Those are **instance row counts, as measured at `2026-09-02T20:40:00Z`** against the 26-ACL package of that day, not package payload counts; re-measured live at `2026-09-05T04:45:00Z` the same instance reads **36** role links (manager 17 / agent 13 / viewer 6) and **29** `sys_security_acl`, the difference being fully attributed to three field-level `query_range` ACLs created on the instance on 2026-09-04 carrying exactly 9 links between them (36 − 9 = 27, 29 − 3 = 26). **That result belongs to export 3's byte sequence — 988 blocks, 4,062,436 bytes, SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` — which is no file on disk and survives only in git history.** The retained rebuilt package (`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, now **988 blocks, 4,062,067 bytes, SHA-256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`** after the 2026-09-03 choice-composite fix, superseding `90ee0249…`) carries **the same 988 records re-sequenced into AAP §0.5.2 dependency order** and therefore the same 27 `sys_security_acl_role` links and the same platform-captured table and dictionary rows — but the complete file was **never uploaded, previewed or committed**, so its evidence is **static corroboration plus the exact-child proof of its seven choice composites**, and its own S1–S6 gate run is still owed before it can be promoted. Neither the measurement nor the retained file transfers to the shipping deliverable. A payload census of the shipping file — **926 blocks, 3,781,097 bytes, SHA-256 `7292a6fe…`** — counts **0 `sys_documentation` rows, 0 `sys_security_acl_role` rows, 26 `sys_security_acl` rows and 25 hand-authored `sys_dictionary` rows**, so on it a bare commit still leaves the three tables without physical storage and its **26** `sys_security_acl` payloads without their **27** role links (manager 14 / agent 10 / viewer 3); `scripts/post_import_remediation.js` asserts the **29**-ACL / **36**-link invariant of the repository's `acl/*.xml` artifacts (manager 17 / agent 13 / viewer 6), so on this package it reports the 3-ACL / 9-link shortfall as a **named** non-convergence and tells the operator to import the three `query_range` ACL records from `acl/` and re-run. The documented remediation route applies **in full**: run `scripts/post_import_remediation.js` in **Global**, commit a second time, run it again, then seed. **CORRECTED — this census read 935 blocks / 3,973,569 bytes / `9f3ea74c…` / 29 ACLs / 36 links, measured 2026-09-05T04:45Z**, which are the figures of the retained amended package at `…AMENDED-NOT-GATED.xml` and were the deliverable's while those bytes sat at its path, before remedy (a) of D48's stop condition was executed. Defect C's **choice half is closed on the retained amended and retained rebuilt packages as of 2026-09-03, and is OPEN on the package that ships** — **CORRECTED**, because this sentence read "closed on both packages" while the amended bytes were the deliverable. Those two retained packages each carry seven platform-native choice composites — a canonical `sys_choice_<table>_<field>` wrapper holding one `x_casemgmt`-owned `sys_choice_set` with the authored value rows nested inside, 24 values across the seven fields (2 / 6 / 4 / 3 / 4 / 3 / 2) — and that exact seven-child delta was uploaded, previewed to **0 problems of any type**, committed by the native commit action, and took `sys_choice` for the three tables from **0 to 24** rows with every option label rendering on the real forms. **No post-import choice creation is required for those two retained packages. It IS required for the shipped fallback**, which carries the 7 older `sys_choice_<32-hex>` rows instead — the single root cause of the six ATF failures — and for which `scripts/post_import_remediation.js` creates the 24 rows. What still needs the documented post-commit step on every package is the seed-row linkage and `opened_date` (`scripts/seed_demo_data.js`). Evidence, with the commit counters and post-commit queries: [`docs/refine-run/FINAL-REPORT.md`](docs/refine-run/FINAL-REPORT.md). The paragraphs below that describe the remediation route are accurate for the shipping deliverable with its 26-ACL / 27-link figures (`7292a6fe…`, 926 blocks, 3,781,097 bytes), which is byte-identical to the elected base retained at `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — `cmp` reports no difference — and, with the 29-ACL / 36-link figures, for the retained amended package at `…AMENDED-NOT-GATED.xml` (`9f3ea74c…`, 935 blocks, 3,973,569 bytes), which does **not** ship. **CORRECTED**: this passage said the two files are no longer byte-identical, which held until remedy (a) of D48's stop condition restored the elected bytes to the deliverable path. The fallback stays off the remediation path so the elected bytes remain recoverable.
> 2. **The user-facing surfaces all work now.** Three items that were listed here as broken have each been fixed and re-verified in a browser: both **dashboards** render every widget with the seed data, for the admin and for each entitled persona (Agent Workspace 3 of 3, Manager View 5 of 5); the case form renders its **related lists**, Case Tasks above Case Parties, with their child rows; and the four **chart reports** plot the dimension they were designed around instead of falling back to Assigned Agent. The two portal **pages** were fixed in an earlier pass and remain working, and their validation and accessibility behaviour has since been rebuilt — see Current Status. One operational caveat survives for the related lists: their definition is cached server side, so on an instance that rendered the case form before the definition existed they stay invisible until that cache is invalidated. [`docs/deployment.md`](docs/deployment.md) Step 3 item 12 has the symptom and the one-click remedy.
> 3. **Running the ATF suite needs an instance setting** (`sn_atf.runner.enabled = true`) that is deliberately not captured into the package, plus a browser-attached client runner.
>
> 4. **AAP §0.7.1's zero-preview-error gate is a binary hard gate, and it is NOT MET for the artifact that ships. The delivery election has been MADE — under checkpoint OVERRIDE-2 the untouched original package is the ELECTED package, and what ships is that package itself — and electing it settled which package ships without passing that gate. Do not treat the artifact as verified by round trip, and do not read this as a partial or qualified result.** The file at `update-set/x_casemgmt_case_management_update_set.xml` is that elected package, untouched: **926 blocks, 3,781,097 bytes, SHA-256 `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` — MEASURED, NOT GATE-VERIFIED**. It **IS** byte-identical to `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`, which holds the same elected base (restored to those bytes 2026-09-05T04:45Z), and `cmp` reports no difference. **CORRECTED — this item read "935 blocks, 3,973,569 bytes, `9f3ea74c…`, measured 2026-09-05T04:45Z … NOT byte-identical to the fallback", describing the base AS AMENDED by `f8454fb078`, `6efb13b141` and `8dfdbcb015`. That was true of the deliverable path until remedy (a) of D48's stop condition was executed; those amended bytes are retained, explicitly non-shipping, at `…AMENDED-NOT-GATED.xml`.** `7292a6fe…` is the digest to verify a copy of the artifact against — the superseded `a9204411…` / 3,780,373 bytes (commit `f8454fb078`) and `4e28acae…` / 3,944,374 bytes (commit `6efb13b141`) match no file in this tree — and **no preview of the complete file has ever been run on those bytes** — the seven choice children being the one part of it that carries a preview and a native commit of its own (0 problems of any type, `sys_choice` 0 → 24, 2026-09-03). **Label it honestly: the shipping package does NOT include this round's native-rebuild fix.** Measured on the file itself — **0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25 hand-authored `sys_dictionary` rows** with random-32-hex record names. The consequence a deployer must plan for is the ACL-role links — **27** for this 26-ACL package (manager 14 / agent 10 / viewer 3), where the 29-ACL retained amended package would need 36 (17 / 13 / 6): they are **not in the package**, so `scripts/post_import_remediation.js` must be run to create them, and because that script asserts the 29 / 36 figures it reports the shortfall on this package as a **named** non-convergence — exactly as the pre-refine deployment did, and exactly as [`docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5 already documents. **Why the exact-byte gate could not be completed — measured, not judged:** the single provisioned PDI is not a clean target, holding this application installed, committed, converged and seeded (**instance row counts: `x_casemgmt_case` 10, `x_casemgmt_case_task` 10, `x_casemgmt_case_party` 8, all three tables live — the settled post-commit census, measured four separate times, exactly what the package carries. SUPERSEDED READING: 13 / 13 / 11 at `2026-09-05T04:45:00Z`, which counted QA2/portal fixture rows that have since been removed; every reading is namespaced in [`docs/refine-run/run-state.json`](docs/refine-run/run-state.json) at `history_snapshots_do_not_read_as_current.instance_row_counts_readings`**), so step one of the gate fails on it and making it clean means deleting the scoped application this repository's environment directive protects; and the loader matches on the `<sys_remote_update_set>` descriptor `sys_id` carried inside the file — for the deliverable that is `9929f50df18ccec91ea13b2a3bccfc90`, which on `dev306625` is an **already-committed** retrieved set — so an upload onto that instance would reuse the committed retrieved-set row and **append** the file's 926 children to the very record the original evidence rests on. **The retained rebuilt package is the available upgrade path.** `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` — **988 blocks, 4,062,067 bytes, SHA-256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`** — satisfies AAP §0.5.2 dependency ordering and carries the platform-captured table and dictionary records together with all 27 `sys_security_acl_role` links. It is retained and **not shipped**, and one action makes it shippable: run the full gate on those exact bytes on a genuinely clean, dedicated PDI — confirm a clean target, checksum the bytes, upload asserting **988** children, preview to zero `type=error`, commit through the native "Commit Update Set" UI action, confirm physical storage for all three tables and all 27 `sys_security_acl_role` links, then record the digest as verified with that run's own timestamp — after which it can be promoted back to the deliverable path. §10.0 of [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) carries that promotion in full. **Where the gate IS met, for completeness:** export 3's byte sequence — the same 988 records at 4,062,436 bytes, SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` — was previewed on 2026-09-02 against an instance holding none of the three tables to **0 `type=error` and 0 `type=warning`** problems with nothing skipped or ignored, then committed by the native UI action: "Succeeded 100%", 613 inserted / 375 updated / 0 collisions / 988 total, `2026-09-02T20:53:14Z`. Those bytes are **no file in this repository** — they survive only in git history — and their block order is exactly what the CR1 review's HIGH AAP §0.5.2 finding rejected, which is why they are not the deliverable either. See [`docs/refine-run/FINAL-REPORT.md`](docs/refine-run/FINAL-REPORT.md). The rest of this item is the historical record of the **earlier** revisions, ending in the elected base that is retained today at `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` and that the shipping deliverable amends rather than copies: three separate results exist and they belong to three different revisions of this file, which is exactly the distinction earlier revisions of this paragraph collapsed. **Zero preview problems of any type, then `state=committed`**, was measured on the **913-block, 3,618,378-byte, SHA-256 `7272edfc…`** revision after a proven teardown — progression **41 → 298 → 0**. **Zero `Could not find a record` problems** (the package-intrinsic reference class, 63 → 0) was measured on the **925-block, 3,698,577-byte, `e49a7654…`** revision, previewed against an already-populated instance that left 31 `Found a local update that is newer than this one` collisions — every one of them confirmed to be that instance's own history — with **commit withheld** because the instance is shared. **The 926-block, 3,781,097-byte, SHA-256 `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` bytes — the elected base, which shipped before the native rebuild and was elected again under OVERRIDE-2, and which is on disk today at `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` (restored to those bytes 2026-09-05T04:45Z) — were never previewed.** What *was* measured on them: each of the 13 re-synced payloads and the 1 added block was applied to the live instance and read back field-for-field identical to its artifact, and every table and column they name was confirmed to exist. [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.2, §0.3b and §0.3c](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) hold the full record of that lineage; the trip that §10.0 item 1a tracks as open work was **executed on export 3's `eee9fabd…` records on 2026-09-02 and stands open for the shipping `7292a6fe…` bytes, for the retained amended `9f3ea74c…` bytes, and for the retained `e109e1d1…` bytes as the promotion** (`docs/refine-run/`, and §10.0 item 1a of the limitations register for exactly what remains).
>
> Every one of these is measured, not estimated — and every measurement in this deliverable is stated as of the date it was taken. **The instance those measurements were taken on has been hibernating since 2026-08-11**, serving ServiceNow's placeholder page on every route, so nothing in that set was re-measured on it. The **existing `dev306625` PDI, made clean by a targeted clean-state operation whose cascade exceeded the destructive boundary it was authorized under**, was used on 2026-09-02 instead — it was *not* newly provisioned: it already held this application installed, committed, converged and seeded. **The intended target was authorized under OVERRIDE-3** — the three scoped tables' `sys_db_object` records, their `sys_dictionary` rows, their data rows and the scoped `sys_security_acl_role` links — **but the platform's table-delete cascade reached beyond that subset, which is a scope violation of the destructive boundary rather than an authorized side effect:** it also removed **26 `sys_security_acl`, 24 `sys_choice` rows, 7 business rules, 8 `sys_report`, 3 `sys_ui_list`, 1 `sys_ui_related_list`, 2 `sys_ui_policy` and the 3 `sys_number` counters**, measured before and after in [`docs/refine-run/PHASE1-REBUILD.md` §2.5](docs/refine-run/PHASE1-REBUILD.md). The consequence: on a live instance the application carried zero ACLs, zero ACL-role links, zero business rules and zero UI policies from `2026-09-02T19:22:09Z` until the Phase 2 commit at `2026-09-02T20:53:14Z` — roughly **91 minutes** — and this is the **second, independent ground on which Phase 1's hard gate is NOT MET**, alongside the role-link/grant mechanism deviation. Neither the deletion command having named only the three `sys_db_object` records, nor the Phase 2 commit's later restoration of the removed records, authorizes that reach. **Any equivalent future operation MUST run the pre-delete collateral guard first:** a read-only enumeration of the platform's delete dependencies before the first delete, aborting with **nothing deleted** on any non-zero count in a class outside the authorized subset, recording the phase as unmet on that ground, taking OVERRIDE-2's fallback / leave-for-human path, and proceeding only on an explicit human expansion of the destructive scope — specified in [`docs/refine-run/PHASE1-REBUILD.md` §2.5](docs/refine-run/PHASE1-REBUILD.md) and in `docs/refine-run/run-state.json` `final.scope_audit_d46.override_3_destructive_boundary`. The scope record, the application record, the three roles, the seven flows and the `apps.current_app` preference were left in place. Clean state confirmed at `2026-09-02T19:22:09Z`: all three tables answering `HTTP 400 Invalid table`, `sys_dictionary` rows 0, `sys_security_acl_role` 0, `sys_user_has_role` 0, `sys_number` 0. What was re-measured there was **export 3's byte sequence — 988 blocks, 4,062,436 bytes, SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`**: its preview, its commit, the post-commit state that commit produced, and the ATF suite. **No byte sequence on disk was round-trip tested** — not the shipping 926-block `7292a6fe…` deliverable, whose complete bytes have never been previewed on any instance and which is byte-identical to the elected base retained at `…FALLBACK.xml`, not the retained amended 935-block `9f3ea74c…` package at `…AMENDED-NOT-GATED.xml`, and not the retained 988-block `e109e1d1…` rebuild, whose complete bytes were never uploaded, previewed or committed. The seven choice-composite children they share are the exception and the only one: uploaded as their own delta on 2026-09-03, previewed to 0 problems of any type and committed natively. Export 3's records exist only in git history — recoverable with `git show 7d36aec06e:servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`, which reproduces `eee9fabd…` at 4,062,436 bytes / 988 payloads. Read every 2026-09-02 preview/commit/post-commit figure as belonging to `eee9fabd…` and to nothing else — [`docs/refine-run/FINAL-REPORT.md`](docs/refine-run/FINAL-REPORT.md); [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.11](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) records what that leaves unproven and what has to happen first. [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) is the authoritative current-state record and the place to start.

## Refactoring Objective

The POC delivers seven enumerated capabilities, replacing specific ArkCase modules with ServiceNow-native equivalents:

- **Case lifecycle** — `x_casemgmt_case` table replicates `acm-case-file-plugin`'s `CaseFile` entity (12 fields).
- **Task domain** — `x_casemgmt_case_task` table replicates `acm-task-plugin`'s `AcmTask` (6 fields).
- **Polymorphic party association** — `x_casemgmt_case_party` collapses `acm-person-plugin`'s `PersonAssociation` and `PersonOrganizationAssociation` (5 fields, single-table polymorphism with a `party_type` choice).
- **Role/privilege subsystem** — three scoped roles (`x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`) replacing `acm-services/acm-service-users` `ApplicationRolesConfig` and `acm-admin-plugin` `RolesPrivilegesService`.
- **Case state-machine** — two Flow Designer flows (one per case type: General Inquiry, Complaint) replacing the Activiti BPMN + `ChangeCaseFileStateService` stack.
- **External requester intake portal** — ServiceNow Experience Portal with two unauthenticated pages (case submission + case status lookup) replacing `acm-service-portal-gateway`'s anonymous-submission pattern.
- **Reporting surfaces** — two ServiceNow dashboards (Agent Workspace + Manager View) backed by eight reports, replacing the Pentaho/Solr aggregates.

This is **partial functional parity, not API compatibility**. ArkCase's REST APIs (`/api/latest/plugin/casefile/...`, `/api/latest/plugin/admin/rolesprivileges/...`, etc.) are explicitly NOT preserved; consumers use the ServiceNow platform's auto-generated Table API and the Experience Portal page services instead.

## Out of Scope

The following ArkCase capabilities are explicitly NOT replicated by this POC:

- Document management, file attachments, redaction (no `acm-content-management`, `acm-tool-integration-alfresco`, `acm-plugin-ecm-file`).
- FOIA deadline tracking and compliance workflows.
- Email notifications (disabled on the PDI; no SMTP, notification rules, or templates configured).
- Correspondence management.
- Time tracking and cost tracking.
- External-system integrations (Alfresco CMIS, Outlook/Exchange EWS, Pentaho BI, OnlyOffice, ZyLAB, Ephesoft, AWS Comprehend Medical, AWS Transcribe, LDAP/AD SSO).
- Data migration from ArkCase (zero rows are read from the ArkCase MySQL database; all seed data is fabricated).
- Global-scope changes (no edits to `sys_user`, `sys_user_group`, `sys_user_role` outside the three scoped roles created here, `core_company`, `task`, `incident`, or any out-of-the-box ServiceNow tables) — with **one disclosed and approved exception**: the installer Fix Script `x_casemgmt Post-Import Remediation` is authored in the **global** scope, because the `GlideTableDescriptor` and `GlideSecurityManager` calls it needs are refused in scoped execution. It is installer wiring rather than application configuration, and the commit engine rewrites it into `x_casemgmt` anyway. See Build Constraints item 1 and [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.7](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). The global tables `sys_user`, `sys_user_group`, `sys_user_role` and `core_company` receive **data** inserts only, never schema changes.
- ServiceNow Store applications (none are installed; the build relies exclusively on the platform's standard low-code tooling shipped with the PDI).
- Any module, workflow, portal page, table, or integration beyond the defined POC scope.

## Repository Relationship

All output for this POC is confined to `servicenow-case-management-poc/`. All files and folders **outside this subdirectory** are read-only context and MUST NOT be modified, renamed, or deleted by any build agent.

The protected items at the repository root and at `acm-*` paths are:

- Top-level files: `pom.xml`, `README.md` (the existing ArkCase project README, distinct from this README), `LICENSE.txt`, `.gitlab-ci.yml`, `.gitlab-ci-release.yml`, `acm-checkstyle-checks.xml`, `jacoco-summary.sh`.
- Top-level directories: `acm-core-api/`, `acm-forms/`, `acm-jmeter/`, `acm-plugins/`, `acm-services/`, `acm-standard-applications/`, `acm-tool-integrations/`, `acm-user-interface/`, `acm-web/`.

### Read-Only Semantic References

The following ArkCase locations were consulted as semantic source-of-truth when designing the scoped application. They were never modified, renamed, or deleted:

- `acm-plugins/acm-default-plugins/acm-case-file-plugin/` — Case domain (`CaseFile.java`, `ChangeCaseFileStateService`, `CaseFileTasksService`, etc.).
- `acm-plugins/acm-default-plugins/acm-task-plugin/` — Task domain (`AcmTask.java`).
- `acm-plugins/acm-default-plugins/acm-person-plugin/` — Party domain (`PersonAssociation.java`, `PersonOrganizationAssociation.java`).
- `acm-plugins/acm-default-plugins/acm-admin-plugin/` — Roles/privileges service.
- `acm-services/acm-service-users/` — Application roles configuration.
- `acm-services/acm-service-portal-gateway/` — Portal-gateway anonymous-submission pattern.
- `acm-standard-applications/arkcase/` — AngularJS UI shell for UX semantic reference.

## Directory Layout

Every directory is listed below with its exact file count, so the tree can be diffed against the working copy (`247` files in total, README included — the bracketed counts below sum to 246 plus this file; **224** of the 247 are XML, the rest being 18 `.md`, 4 `.js` and 1 `.json`). Measured at commit `3ce969fa49`; re-derive either way with `find servicenow-case-management-poc -type f | wc -l` or `git ls-files servicenow-case-management-poc | wc -l`, which agree at 247, and the XML count with `find servicenow-case-management-poc -type f -name '*.xml' | wc -l`. The earlier figure of `235` was correct at commit `6efb13b141`'s predecessor and went stale when that commit added 9 files (3 `query_range` ACLs, 4 business rules, 1 client script, 1 form layout); the figure of `244`, measured 2026-09-05T07:40Z, went stale in turn when the QA-remediation passes added `update-set/x_casemgmt_case_management_update_set.AMENDED-NOT-GATED.xml`, `client_scripts/x_casemgmt_case_closed_readonly_enforce.xml` and `ui_policy/x_casemgmt_case_closed_readonly.xml`. **CORRECTED — the counts below are now 249 files / 226 XML**, and the bracketed per-directory counts have been updated to match. The two files that took the tree from 247/224 to 249/226 are `business_rules/x_casemgmt_case_display_stored_state.xml` and `client_scripts/x_casemgmt_case_party_clear_opposite_reference.xml`, both added by the QA-remediation pass that followed commit `3ce969fa49`; they are counted in the `business_rules/ [12]` and `client_scripts/ [3]` brackets below, so the brackets sum to 248 plus this file = **249**, of which **226** are XML and the rest are 18 `.md`, 4 `.js` and 1 `.json`. Treat the three commands as authoritative over any literal here: remediation passes keep adding artifacts, so a higher reading is expected and is not a contradiction.

```plaintext
servicenow-case-management-poc/
├── README.md                          (this file — overview and entry point)
├── update-set/                    [4] x_casemgmt_case_management_update_set.xml — THE DELIVERABLE
│                                      (926 blocks · 3,781,097 bytes · SHA-256 7292a6fe… — MEASURED,
│                                      NOT GATE-VERIFIED). It is the exact, untouched elected base
│                                      and IS byte-identical to
│                                      x_casemgmt_case_management_update_set.FALLBACK.xml, which holds
│                                      the same bytes (restored 2026-09-05T04:45Z); cmp reports no
│                                      difference. It does NOT carry the 2026-09-03 native choice
│                                      composites and does NOT carry this round's native-rebuild fix,
│                                      so its 26 ACLs need 27 sys_security_acl_role links from the
│                                      remediation script and the 24 choice rows from it too.
│                                      CORRECTED: this entry described 935 blocks · 3,973,569 bytes ·
│                                      9f3ea74c… — the elected base AS AMENDED, which sat at this
│                                      path until remedy (a) of D48's stop condition was executed.
│                                      Those bytes are retained, explicitly NON-SHIPPING, at
│                                      x_casemgmt_case_management_update_set.AMENDED-NOT-GATED.xml
│                                      (935 blocks · 3,973,569 bytes · 29 ACLs · the 7 name-keyed
│                                      choice composites), which is the only shippable-shaped file
│                                      carrying this round's choice fix and which does not ship.
│                                      x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml
│                                      is retained but NOT shipped (988 blocks · 4,062,067 bytes ·
│                                      SHA-256 e109e1d1…, superseding 90ee0249…/4,062,436) and is the
│                                      available upgrade path — see item 4 of the note at the top of
│                                      this file.
├── app/                           [1] app/sys_app/x_casemgmt_case_management.xml — the scoped
│                                      application record. There is no separate sys_scope
│                                      artifact: the platform derives sys_scope from sys_app
│                                      on commit, so shipping one would duplicate it.
├── tables/                        [3] case, case_task, case_party (sys_db_object)
├── dictionary/                   [60] 30 sys_dictionary field/collection rows (27 fields + the 3
│                                      table-level *_collection rows) + 30 sys_documentation label
│                                      rows, for the three tables
│                                      ⚠️ tables/ and dictionary/ serialize the RETAINED REBUILT
│                                      records — the platform-captured ones, with platform-assigned
│                                      sys_ids — and NOT the shipping package's. The shipping
│                                      deliverable (7292a6fe…) carries 3 sys_db_object + 25
│                                      hand-authored sys_dictionary records with different sys_ids
│                                      and zero sys_documentation rows. When the two disagree, the
│                                      Update Set XML is what installs; these files are the record
│                                      of the rebuilt schema that the retained
│                                      REBUILT-DEPENDENCY-ORDERED package carries — the upgrade
│                                      path named in item 4 of the note at the top of this file.
├── choices/                       [7] every Choice list (sys_choice) — the authored option rows.
│                                      Both packages ship them as the platform's own native
│                                      composites: one Choice list block per field carrying an
│                                      x_casemgmt-owned sys_choice_set with the value rows nested
│                                      inside, 24 values across the seven fields. Committing the
│                                      package creates the rows; nothing post-import is needed.
├── numbers/                       [3] auto-numbering counters (sys_number)
├── roles/                         [3] the three scoped roles (sys_user_role)
├── acl/                          [29] table-level + field-level ACLs (sys_security_acl):
│                                      the 26 of AAP 0.5.6 plus 3 field-level query_range
│                                      grants on case.opened_date, case.closed_date and
│                                      case_task.due_date (QA finding F17), which let a date
│                                      RANGE filter participate in the WHERE clause without
│                                      widening which rows come back.
│                                      The 36 sys_security_acl_role LINK rows that grant these
│                                      to the roles are a different table and are created by
│                                      the post-import remediation script, not by these files.
│                                      That script also resolves the query_range ACLs' operation
│                                      reference by name, because 0.7.2 forbids shipping the
│                                      operation's sys_id.
├── flows/                         [9] 2 parent flows + 5 subflows + 1 Custom Action
│   ├── general_inquiry_state_machine.xml
│   ├── complaint_state_machine.xml
│   ├── custom_actions/                x_casemgmt_transition_guard_action.xml — the Custom
│   │                                  Action that returns the transition verdict to a flow
│   └── sub_flows/                     validate_open / validate_inprogress / validate_pending /
│                                      validate_resolved / validate_closed, plus
│                                      shared_flow_logic_block.xml (sys_hub_flow_block, the
│                                      shared logic block the five subflows reuse)
├── script_includes/               [2] CaseTransitionValidator + CasePortalService
├── business_rules/               [12] before-insert / before-update guards, plus one display
│                                      rule. The two that
│                                      matter most: x_casemgmt_enforce_forward_transitions
│                                      (order 250 — calls the subflow and raises the blocking
│                                      form error) and x_casemgmt_set_closed_date (order 500 —
│                                      the only writer of closed_date). Four enforce the
│                                      0.5.7 data contract on every write path, including the
│                                      Table API, which no client-side rule can reach:
│                                      validate_case_mandatory_fields (50), validate_case_
│                                      text_lengths (70), validate_case_task_integrity and
│                                      validate_case_party_integrity (100 on their own tables).
│                                      x_casemgmt_case_display_stored_state is the display rule
│                                      (when=before_display, all four action_* false): it
│                                      publishes the STORED status onto g_scratchpad so the
│                                      onLoad client script can put a form the server has just
│                                      refused back in step with the row.
├── client_scripts/                [3] x_casemgmt_case_flush_stale_messages (onLoad) — clears a
│                                      stale mandatory-field banner as soon as the field it
│                                      names is filled, so the form never contradicts itself;
│                                      x_casemgmt_case_closed_readonly_enforce — the onLoad
│                                      companion that keeps a terminal Closed case's controls
│                                      read-only on the rendered form, and which also restores
│                                      the stored status after a refused save;
│                                      x_casemgmt_case_party_clear_opposite_ref (onChange on
│                                      party_type) — clears the reference the discriminator
│                                      makes inapplicable, so its hidden input cannot post a
│                                      stale sys_id and trap the user behind a field they can
│                                      no longer see.
├── form_layout/                   [1] the case form's Default-view section (sys_ui_section plus
│                                      its 14 sys_ui_element rows) — a SINGLE column in the AAP
│                                      0.4.4 field order, which is also what makes the keyboard
│                                      tab order follow the visual order.
├── ui_policy/                     [2] case_party conditional person/organization fields;
│                                      x_casemgmt_case_closed_readonly — the Closed-case
│                                      read-only policy
├── ui_action/                     [6] the state-transition buttons
├── list_layouts/                  [1] the case table's Default-view list layout (sys_ui_list),
│                                      which is what puts subject, type and status into the case
│                                      list in the AAP field order
├── related_lists/                 [1] the case form's Default-view related lists
│                                      (sys_ui_related_list + 2 entries): Case Tasks, then Case
│                                      Parties. Read docs/deployment.md Step 3 item 12 before
│                                      concluding they do not work - the definition is cached
│                                      server side.
├── portal/                       [12] portal record + 2 pages + 3 widgets + 2 scripted REST
│                                      endpoints + supporting records. Both the REST endpoints and
│                                      the two pages work; layout/ carries the sp_container ->
│                                      sp_row -> sp_column -> sp_instance chain that makes them render.
├── dashboards/                    [2] Agent Workspace (3 widgets) + Manager View (5 widgets).
│                                      Each carries its full wiring: sys_portal_page ->
│                                      sys_grid_canvas -> pa_tabs -> pa_m2m_dashboard_tabs, one
│                                      sys_portal + sys_portal_preferences + sys_grid_canvas_pane
│                                      triple per widget, and the pa_dashboards_permissions share
│                                      rows. Verified rendering for the admin and for every
│                                      entitled persona (see docs/dashboards.md).
├── reports/                       [8] the eight reports the dashboards are meant to show
├── seed-data/                     [35] synthetic demo data: 3 users, 1 group, 3 role
│                                      assignments, 10 cases, tasks, parties
├── atf/                          [21] the Automated Test Framework suite: 20 test definitions
│                                      (ATF 01-20) + x_casemgmt_atf_test_suite.xml. These
│                                      serialize to 761 of the retained amended package's 935
│                                      blocks, and to 761 of the shipped package's 926.
├── docs/                         [17] see the Documentation Index below
└── scripts/                       [6] post_import_remediation.js — the mandatory Global
                                       post-import script (Defect C + Defect 9)
                                       sys_script_fix_x_casemgmt_post_import_remediation.xml —
                                       the Fix Script wrapper that carries that body inside
                                       the Update Set (it does NOT auto-run)
                                       seed_demo_data.js — idempotent demo-data seeder
                                       transition_logic_regression_assertions.js — server-side
                                       regression assertions for the transition guards
                                       pre_delete_collateral_guard.js — read-only guard that
                                       MUST be run before any authorised targeted deletion of
                                       the three scoped tables; enumerates the platform's
                                       delete dependencies and aborts before the first delete
                                       on anything outside the authorised subset
                                       round_trip_verify.md — the re-import/preview procedure
```

Each subfolder corresponds to a category of ServiceNow record definitions or supporting artifacts:

- `update-set/` holds the single final Update Set XML deliverable that gets imported into a fresh PDI.
- `app/` holds the scoped-application record (`sys_app`).
- `tables/`, `dictionary/`, `choices/`, `numbers/` define the three custom tables, their fields, choice lists, and auto-numbering counters.
- `roles/` and `acl/` define the three scoped roles and their table-level and field-level ACLs.
- `flows/`, `script_includes/`, `business_rules/`, `ui_policy/`, `ui_action/`, `client_scripts/` implement the case state-machine transition rules and form behavior. `business_rules/` is also where the AAP Section 0.5.7 data contract is enforced for callers that never load a form — a REST client cannot be reached by a UI Policy, so mandatory fields, string lengths and the party's exactly-one-of-person-or-organization rule are checked server side on every write.
- `form_layout/` fixes the case form's field order and single-column arrangement to AAP Section 0.4.4, which also makes the keyboard tab order follow the visual order.
- `list_layouts/` and `related_lists/` configure the internal user experience the AAP asks for in Section 0.4.4: which columns the case list shows, and the two child lists the case form shows beneath its fields.
- `portal/` holds the Experience Portal record, pages, widgets, and scripted REST endpoints powering external case submission and lookup.
- `dashboards/` and `reports/` define the two POC dashboards and their eight underlying reports.
- `seed-data/` contains synthetic demo data that exercises every status, both case types, and the full ACL matrix.
- `atf/` holds the 20 automated tests and the suite that assert the data model, the ACL matrix, the transition rules, and the portal REST contracts.
- `docs/` and `scripts/` hold supporting documentation and operational scripts.

## Data Model Quick Reference

Detailed schemas live in `docs/data-model.md`. This section is a one-glance summary.

**`x_casemgmt_case`** (12 fields):

| Field | Type | Constraints |
| --- | --- | --- |
| `number` | Auto-number | Read-only, format `CASE0000001` |
| `type` | Choice | General Inquiry, Complaint — extensible |
| `status` | Choice | Draft, Open, In Progress, Pending, Resolved, Closed |
| `priority` | Choice | Low, Medium, High, Critical |
| `subject` | String(255) | Mandatory |
| `description` | String(4000) | Mandatory |
| `opened_date` | DateTime | Auto-set on creation |
| `closed_date` | DateTime | Auto-set on Close transition |
| `assigned_group` | Reference → `sys_user_group` | Mandatory on Open transition |
| `assigned_agent` | Reference → `sys_user` | Optional; must be member of `assigned_group` |
| `requester_name` | String(100) | Mandatory — captures external requester |
| `requester_email` | String(100) | Optional |

A non-displayed `pending_reason` (Choice: Awaiting Info, Awaiting Third Party, Other) field also exists on the same table and is set/cleared by the state-machine flows during the Pending state. A virtual `duration_to_close` Function Field (`glide_duration` typed; computed at query time as `glidefunction:datediff(closed_date,opened_date)`) also exists on the same table; it is read-only, hidden from the form/list views, and consumed exclusively by the Manager View "Average Time to Close" widget per AAP Section 0.4.4. See `docs/data-model.md` for the full additional-fields rationale.

**`x_casemgmt_case_task`** (6 fields):

| Field | Type | Constraints |
| --- | --- | --- |
| `case` | Reference → `x_casemgmt_case` | Mandatory |
| `subject` | String(255) | Mandatory |
| `type` | Choice | Investigation, Review, Follow-up, Other |
| `status` | Choice | Open, In Progress, Closed |
| `assigned_to` | Reference → `sys_user` | Mandatory |
| `due_date` | Date | Mandatory |

**`x_casemgmt_case_party`** (5 fields):

| Field | Type | Constraints |
| --- | --- | --- |
| `case` | Reference → `x_casemgmt_case` | Mandatory |
| `party_type` | Choice | Person, Organization |
| `person` | Reference → `sys_user` | Conditional: required if `party_type = Person` |
| `organization` | Reference → `core_company` | Conditional: required if `party_type = Organization` |
| `role_label` | String(100) | Mandatory (e.g., Requester, Respondent, Witness) |

## Build Constraints (Non-Negotiable)

1. **Scoped-namespace exclusivity** — every artifact lives in the auto-assigned `x_casemgmt` namespace; zero global-scope writes are permitted, with **one disclosed exception** that is approved app-installer wiring rather than application configuration: the Fix Script `x_casemgmt Post-Import Remediation`. It is authored global because it calls `GlideTableDescriptor` and `GlideSecurityManager`, which the platform refuses in scoped execution — and it is rewritten into `x_casemgmt` by the commit engine anyway, which is exactly why the remediation cannot run automatically. A second global record, the auto-execute Business Rule `x_casemgmt Post-Import Bootstrap`, was built and has been **removed**: it could not succeed for the same scope-rewrite reason, and its condition fired on the commit of *any* retrieved Update Set rather than only this application's, so activating it would have dispatched privileged, partly destructive remediation on unrelated deployments. See [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §9.4. No other record in the package is global-scoped, and no out-of-the-box table receives a schema change; the global tables `sys_user`, `sys_user_group`, `sys_user_role` and `core_company` receive **data** inserts only.
2. **Zero hardcoded `sys_id`s** — anywhere; every cross-reference uses `GlideRecord` lookups by stable human-readable keys (`name`, `user_name`, `number`, `role_label`).
3. **No PII** — synthetic demo data only; no real names, email addresses, phone numbers, or organization names.
4. **Email-disabled** — no SMTP, notification rules, or email templates configured (notifications are disabled on the PDI).
5. **Single Update Set deliverable** — the final scoped application is exported as one XML at `update-set/x_casemgmt_case_management_update_set.xml`. **The single-file constraint is met; AAP §0.7.1's gate is not. That gate is binary and it is NOT MET for the shipping deliverable, whose own complete bytes were never previewed — see item 4 at the top of this file and §10.0 of [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) for the round trip that closes it and for the promotion of the retained rebuilt package. It is proven in full on the earlier `7272edfc…` revision (913 blocks / 3,618,378 bytes), which was taken through a complete teardown → upload → preview → commit run reaching 0 problems of any type; it is proven for the reference class only on the immediately preceding `e49a7654…` revision (925 blocks / 3,698,577 bytes)** — previewed against an already-populated instance, that file yielded 31 problems, all of them `Found a local update that is newer than this one` (this instance's own change history, impossible on a fresh PDI) and **zero** `Could not find a record` problems, with commit withheld because the verification instance is shared. **Restated after the delivery election and the D48 identity correction: the shipping deliverable is the 926-block, 3,781,097-byte, `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` package — the exact, untouched elected base, byte-identical to `…FALLBACK.xml`, MEASURED, NOT GATE-VERIFIED — and no preview has been run on the complete file, so the binary gate is NOT MET for the artifact that ships, and electing it passed no gate. Directive D48's stop condition was raised, reported and then CLOSED by remedy (a): the checksum recorded for the shipping package is `7292a6fe…` and the bytes measure `7292a6fe…`. **CORRECTED — this passage named the 935-block, 3,973,569-byte `9f3ea74c…` package (the elected base as amended by the three post-election remediation commits) as the shipping deliverable and D48's condition as live**; that held until remedy (a) was executed, and those bytes are retained, explicitly non-shipping, at `…AMENDED-NOT-GATED.xml`. The seven choice children that alone carry a preview and a native commit of their own (0 problems of any type, `sys_choice` 0 → 24, 2026-09-03) are in that retained package and in the retained rebuild — **not** in the file that ships. The 988-block, §0.5.2-reordered file is retained rather than shipped, at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, now 4,062,067 bytes / `e109e1d1…` after the same fix, as the available upgrade path; its 988 records were previewed to zero problems of any type and committed on export 3's `eee9fabd…` byte sequence, while the round trip on the complete on-disk sequence has never been run. Item 4 at the top of this file states the whole position.** See [`docs/validation-gates.md`](docs/validation-gates.md) Gate 7 and [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §0.3c and §10.0 item 1a.
6. **Flow-Designer-exclusive workflow** — all transition logic lives in Flow Designer (with helper Script Includes and Business Rules at the entity level); no direct background scripts for workflow state management.
7. **Repository minimality** — output confined to `servicenow-case-management-poc/`; the existing ArkCase repository structure is read-only context and is not refactored in place.
8. **Tooling restriction** — App Engine Studio, Flow Designer, and UI Builder only; no paid Store applications; no alternative authoring path.

## State-Machine Quick Reference

The full transition matrix and narrative live in `docs/state-machine.md`. The eight transition rows below are the canonical contract for both Flow Designer flows (General Inquiry and Complaint).

| From | To | Required condition | Blocking-error behavior on failure |
| --- | --- | --- | --- |
| Draft | Open | `assigned_group` populated | Surface form-level error |
| Open | In Progress | `assigned_agent` populated AND member of `assigned_group` | Surface form-level error |
| In Progress | Pending | None; sets `pending_reason` (Awaiting Info / Awaiting Third Party / Other) | n/a |
| Pending | In Progress | None; clears `pending_reason` | n/a |
| In Progress | Resolved | All linked `x_casemgmt_case_task` records have `status = Closed` | Surface "All tasks must be closed before resolving this case." |
| Resolved | Closed | Caller has `x_casemgmt_case_manager` role; auto-set `closed_date` | Surface form-level error |
| Any → Draft | (none) | PROHIBITED | Surface "Cases cannot be returned to Draft." |
| Closed → * | (none) | PROHIBITED — terminal state | Surface "Closed cases are terminal and cannot be modified." |

Those eight rows are the **complete** graph, and the edge is validated as well as the destination: a status change
whose source has no row leading to the proposed target — `Draft → Closed`, `Open → Resolved`, `Pending → Resolved`,
`Resolved → Open` and the rest — is refused on the form with `A case cannot go from <from> to <to>. From <from> the
only valid next status is <next>.` And "cannot be modified" covers the whole Closed row, not only its status: a
field-only edit to a Closed case raises the same verbatim message, while a save that changes nothing is still
accepted as a no-op. See `docs/state-machine.md`.

## Roles & ACLs Quick Reference

The full role × table × CRUD matrix and the "Assigned only" definition live in `docs/acl-matrix.md`.

| Role | Create | Read | Write | Delete |
| --- | --- | --- | --- | --- |
| `x_casemgmt_case_manager` | ✅ | ✅ All | ✅ All | ✅ |
| `x_casemgmt_case_agent` | ✅ | ✅ Assigned only | ✅ Assigned only | ❌ |
| `x_casemgmt_case_viewer` | ❌ | ✅ All | ❌ | ❌ |

"Assigned only" = cases where `assigned_agent = current user OR assigned_group contains current user`. Field-level ACLs further restrict writes on `assigned_group` (manager only) and `assigned_agent` (manager + assigned agent).

## Deliverables

- **Update Set XML:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` —
  **THE DELIVERABLE: the exact, untouched elected base — 926 blocks, 3,781,097 bytes, SHA-256
  `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`; MEASURED,
  NOT GATE-VERIFIED**. It **IS** byte-identical to `…FALLBACK.xml`, which retains the same elected base
  (926 blocks, 3,781,097 bytes, restored 2026-09-05T04:45Z), and `cmp` reports no difference. **CORRECTED —
  this entry read "the elected base AS AMENDED — 935 blocks, 3,973,569 bytes, `9f3ea74c…`", which the
  deliverable path held from commit `f8454fb078` until remedy (a) of D48's stop condition was executed; those
  bytes are retained, explicitly non-shipping, at `…AMENDED-NOT-GATED.xml`.** **It does
  not include this round's native-rebuild fix** — 0 `sys_documentation` rows, 0 `sys_security_acl_role` rows,
  25 hand-authored `sys_dictionary` rows and **26** ACLs, so the role links come from
  `scripts/post_import_remediation.js`, which asserts 36 links against the 29 ACLs this repository describes
  and therefore reports the 3-ACL / 9-link shortfall on this package as a **named** non-convergence — and
  **the AAP §0.7.1 Update Set gate is binary and NOT MET on these
  bytes**, whose complete file was never previewed. Directive D48's stop condition was raised, reported and
  then **CLOSED by remedy (a)**: the checksum recorded for the shipping package is `7292a6fe…` and the bytes
  measure `7292a6fe…` (item 4 of the note at the top of this file); the
  seven choice children it carries are the one part with a preview and a native commit of their own, and they
  make choice creation a non-step at install time.
  The rebuilt package is retained, not shipped, at
  `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks, 4,062,067
  bytes, SHA-256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` — superseding
  `90ee0249…` / 4,062,436 bytes, which matches no file in this tree) and is the available
  upgrade path — see [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)
  §10.0 for the one run that promotes it.
- **Portal URL:** `[instance URL]/x_casemgmt_case_portal` — this is the actual `<url_suffix>` declared in [`portal/sp_portal_x_casemgmt_case_portal.xml`](portal/sp_portal_x_casemgmt_case_portal.xml). AAP Section 0.7.2 verbatim wording uses the generic placeholder `[instance URL]/x_casemgmt_portal` ("or the equivalent portal URL chosen at portal-record creation time"); this Deliverables line uses the actual implementation slug so a verifier can navigate directly without further lookup. See [`docs/portal-pages.md`](docs/portal-pages.md) for the full discrepancy explanation. **The URL resolves anonymously with no login wall and both pages render and function** — submission returns a case number, lookup returns exactly status / subject / opened_date, and both forms report per-field validation accessibly. See Current Status below.
- **Dashboards:** Agent Workspace (3 widgets) + Manager View (5 widgets), both installing **and rendering** with the seed data. Verified in a browser for the admin and for each persona the design entitles: the manager opens both, the agent opens Agent Workspace and sees exactly its own assigned cases in *My Open Cases*, and the agent and viewer are correctly refused the dashboards they are not bound to. An earlier revision of this line reported 0 tabs and 0 widgets; the cause was packaging, not the reports — each dashboard's composite named three child tables that do not exist on this release (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`), so the tab, all 8 widget placements and the role grants were silently dropped on commit. The artifacts now carry the platform's real wiring. See Current Status below and [`docs/dashboards.md`](docs/dashboards.md).
- **Synthetic seed data:** at least 10 demo cases spanning all six statuses and both case types, plus 3 demo users (one per role) and 1 demo group. The packaged seed rows require one preparatory step before the seed script can populate them correctly — see Current Status below.

## Current Status

Every statement below is a measurement, not a projection, and each stands as of the date it was taken. Figures
dated before 2026-08-11 were measured on `https://dev379024.service-now.com` (Australia Patch 3) — **that host is
retired and is not used**, so they remain dated evidence from it and were never re-taken there. The 2026-09-02
figures were measured on the current validation instance `https://dev306625.service-now.com` (**Zurich Patch
10**).

**The package**

- **Identity:** `update-set/x_casemgmt_case_management_update_set.xml` — **THE DELIVERABLE: 926 update
  blocks, 3,781,097 bytes, SHA-256
  `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`**: the exact, untouched elected base,
  **byte-identical** to `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` (`cmp` reports no
  difference), which retains the same bytes (restored 2026-09-05T04:45Z). **CORRECTED — this bullet read "935
  update blocks, 3,973,569 bytes, `9f3ea74c…`, measured 2026-09-05T04:45Z: the elected base as amended by
  `f8454fb078`, `6efb13b141` and `8dfdbcb015`, a net +9 payloads with 919 payload names in common, and
  therefore NOT byte-identical to the fallback". That was true of the path until remedy (a) of D48's stop
  condition was executed; those amended bytes are retained, explicitly non-shipping, at
  `…AMENDED-NOT-GATED.xml`, and `9f3ea74c…` is the value to verify a copy of THAT file against.**
  `7292a6fe…` is the value to verify a copy of the deliverable against — nothing more; the superseded
  `a9204411…`
  (3,780,373 bytes) and `4e28acae…` (3,944,374 bytes) are the identity of no file in this tree. **The AAP
  §0.7.1 Update Set gate is binary and it is NOT MET on these bytes: no preview of the complete file was ever
  run on them. Directive D48's stop condition was raised, reported and then CLOSED by remedy (a) — the
  checksum recorded for the shipping package is `7292a6fe…` and the bytes measure `7292a6fe…`.** What was run,
  on the seven choice
  children **as the retained amended and retained rebuilt packages carry them** (this file does **not**: it
  carries the 7 older `sys_choice_<32-hex>` rows): upload, preview to **0 problems of any type**, native commit,
  and `sys_choice` for the three tables moving from **0 to 24** rows with every option label rendering on the
  real forms. **CORRECTED — that result does not transfer to the file that ships**, so post-import choice
  creation **IS** required for the deliverable (`scripts/post_import_remediation.js` creates the 24 rows), and
  nothing else about the gate changes. The full
  record of that fix, and of exactly what its runtime result covers, is
  [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3d](./docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). The
  delivery election was made under
  checkpoint OVERRIDE-2 and it settled which package ships without passing that gate. **It does not include this
  round's native-rebuild fix:** measured on the file, 0 `sys_documentation` rows, 0 `sys_security_acl_role` rows
  and 25 hand-authored `sys_dictionary` rows, so the ACL-role links are absent and
  `scripts/post_import_remediation.js` must be run to create them — **27** links for this 26-ACL package
  (manager 14 / agent 10 / viewer 3), where the 29-ACL retained amended package would need 36 (manager 17 /
  agent 13 / viewer 6) and where the script's own assertion is the 29 / 36 pair, which is why it reports the
  3-ACL / 9-link shortfall on this package as a **named** non-convergence.
  Quote those numbers and no others for the deliverable. **The rebuilt package is retained, not shipped**, at
  `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` — **988 blocks, 4,062,067
  bytes, SHA-256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`** — satisfying AAP §0.5.2
  dependency ordering and carrying the platform-captured schema records and all 27 role links; the round trip on
  its complete bytes has never been run either, and the single run that promotes it back to the deliverable path is
  §10.0 item 1a of
  [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md). The preview
  and commit of 2026-09-02 ([`docs/refine-run/FINAL-REPORT.md`](docs/refine-run/FINAL-REPORT.md)) were measured
  on a third sequence — export 3's, SHA-256
  `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` (the same 988 records, the same
  4,062,436 bytes) — which survives only in git history and whose block order is what the CR1 review's HIGH
  AAP §0.5.2 finding rejected. **Do not read any of the three digests as a verified-by-round-trip digest for the
  artifact on disk.** The shipping file's own lineage: earlier revisions carried different numbers again — 925
  blocks / 3,698,577 bytes / `e49a7654…` immediately
  before it, 913 blocks / 3,643,389 bytes / `89638c17…` before that, and 913 blocks / 3,618,378 bytes /
  `7272edfc…` before that. The step from 925 to 926 blocks is the new Related Lists record; the byte growth is
  that record plus the report, dashboard and portal-widget payload changes described below, and it is that file
  the measurements in the rest of this section describe.
- **Round-trip status on the shipping bytes (`7292a6fe…`, 926 blocks — the exact, untouched elected base
  that remedy (a) restored to the deliverable path; the same is true of the retained amended `9f3ea74c…`,
  935 blocks): NOTHING is proven — no upload, no
  preview, no commit of either byte sequence on any instance.** Every result in this bullet belongs to an **earlier
  revision** and is dated: zero *reference* problems on the 925-block `e49a7654…` revision, and zero problems
  *of any type* on the 913-block `7272edfc…` revision. Read those as two separate historical results, because
  they are, and do not carry either onto the artifact on disk.
  On `7272edfc…` (913 blocks / 3,618,378 bytes) the full trip was measured: teardown proven complete (scope
  query `[]`, every application census counter 0, all three tables moving from HTTP 200 to HTTP 400), upload
  with the child `sys_update_xml` count asserted at **exactly 913**, then preview problems **by type**: **41**
  against the already-populated instance → **298** on the first clean-slate pass, every one
  `Found a local update that is newer than this one` (the teardown's own deletions) → **0 of any type** once
  that local capture was purged at source, checked against the platform's own `state=previewed` /
  `unresolvedProblems=false` / `shouldDisplay=true` predicate rather than assumed. Then
  `previewed → committing → committed`.
  On the **925-block / 3,698,577-byte / `e49a7654…`** revision: uploaded as a fresh retrieved update set with
  **925** children asserted and previewed against an instance that already holds the schema and this
  application's change history — **31 problems, every one `Found a local update that is newer than this one`,
  and ZERO `Could not find a record` problems of any kind.** The 21 package-intrinsic reference problems that
  an independent QA preview found in the revision before that are **eliminated** (63 reference errors → 0), and
  all 31 remaining targets were confirmed to hold a local `sys_update_version` in state `current` — that is,
  they are the instance's own history and cannot arise on a fresh PDI. **Commit was withheld on those bytes**
  because the verification instance is shared with other work. The earlier 916-block revision
  (3,448,009 bytes, SHA-256 `32a064d6…`) reached the zero result too and is kept as history.
  **On the 988 records of the retained rebuilt package, the full trip has since been measured — on export 3's
  byte sequence `eee9fabd…` (988 blocks / 4,062,436 bytes): 0 `type=error` and
  0 `type=warning` preview problems on a genuinely clean instance, then a single UI-action commit that
  succeeded 100% — see [`docs/refine-run/FINAL-REPORT.md`](docs/refine-run/FINAL-REPORT.md). The §0.5.2
  re-sequencing then changed those bytes to `90ee0249…` (a digest that matches no file in this tree), and the
  2026-09-03 choice-composite fix changed them again to the retained `e109e1d1…` / 4,062,067-byte file on disk;
  the trip on neither of those exact sequences has ever been
  run. Neither sequence is the shipping deliverable, and neither result transfers to it.** The
  paragraph that follows records why the pass that produced the `7292a6fe…` bytes — the elected base, retained
  today at `…FALLBACK.xml` — stopped
  short of previewing them: re-uploading and previewing meant loading a retrieved update set on a
  verification instance shared with other work, which this pass declined to do. What changed since the previewed
  revision is bounded and is listed here so the risk can be judged rather than guessed: the four chart reports
  and their four siblings had `field`, `roles` and `user` set and two non-existent elements (`group_by`,
  `format`) removed; the two dashboard composites were rewritten onto the platform's real child tables; the
  three portal widgets had `template`, `client_script` and `description` rewritten and a non-existent element
  (`pop_up`) removed; and **one block was added**, the Related Lists definition. Every one of those records was
  applied to the live instance through the Table API and read back byte-identical to its artifact, so each is
  known to be accepted by the platform; and every table and column named across all of them was checked against
  `sys_db_object` and `sys_dictionary`, which is precisely the class of defect (`group_by`, `pa_tab`,
  `pa_dashboard_widgets`, `pa_dashboard_role`, `pop_up`) that the previous revisions carried silently. The
  2026-09-03 change on top of that is the seven native choice composites, which is the one part of the shipping
  file that has been previewed and committed on its own bytes: 0 problems of any type, native commit,
  `sys_choice` 0 → 24, every option label present on the real forms. **AAP
  §0.7.1's zero-preview-error gate is therefore proven in full on `7272edfc…`, proven for the reference class on
  `e49a7654…`, proven for the seven choice children of what ships, and not measured on the complete shipping
  file.** A verifier with a disposable PDI should re-run
  [`scripts/round_trip_verify.md`](scripts/round_trip_verify.md) against these bytes before relying on them.
- **Nothing in it fires on its own.** The package contains **no record that auto-executes, of any kind** — no
  Business Rule, no scheduled job, no `sys_trigger` row. (It does contain a Fix Script, which is a record; the
  point is that nothing *runs* it.) An earlier revision did ship one (the global Business
  Rule `x_casemgmt Post-Import Bootstrap`); it was **removed**, both because it could not succeed (the commit
  engine rewrites the dispatched record into the application scope, where the APIs it needs are refused) and
  because its condition fired on the commit of *any* retrieved Update Set, which would have dispatched
  privileged, partly destructive remediation onto unrelated deployments. The remediation body still ships, as
  the Fix Script `x_casemgmt Post-Import Remediation`, but a Fix Script does not self-run either.

**Installation is therefore a two-part operation**

Commit, then run `scripts/post_import_remediation.js` from *System Definition → Scripts - Background* with
**"In scope" = Global**. Two defects require it, and neither can be automated on a PDI:

- **Defect C** — the three tables commit as dictionary metadata without physical storage.
- **Defect 9** — the 29 ACLs commit without their **36** `sys_security_acl_role` link rows, so they grant
  nothing until the links exist.

[`docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) carries the numbered
procedure. Do not substitute the Fix Script UI: it executes in the application scope and fails.

**Working — directly observed**

- The three-table data model, and auto-numbering in `CASE0000001` format.
- The full state machine for both case types, with blocking form errors. All **7 flows** are `active=true`
  and `status=published`.
- The role × table × CRUD matrix, including record-level "Assigned only" narrowing and the field-level ACLs on
  `assigned_group` / `assigned_agent` — **on all three tables**. The `case_agent` condition defect that
  previously denied every row on the task and party tables has been fixed and the ATF tests that cover it
  (06, 07) pass.
- The anonymous portal **REST endpoints**: submit returns `201` with the new case number; lookup returns `200`
  with exactly `{status, subject, opened_date}`; an unknown number returns `404` with the verbatim
  `No case found with that number.`
- The 8 report definitions and the demo data (census as re-measured after the §0.3 round trip: **10 cases, 10 tasks, 8 parties** — see §9.8a of the limitations register).
- **The ATF suite runs end to end, and the current verdict is 14 of 20 — not green.** The latest run is
  `TES0001002`, `2026-09-02T21:45:31Z → 21:47:35Z` (run time `00:02:04`, 3 UI batches): **20 tests — 14 pass /
  6 fail / 0 error / 0 skip, with 180 of 180 steps executed**. The six failures, by name, are **`ATF 01`,
  `ATF 10`, `ATF 15`, `ATF 16`, `ATF 17` and `ATF 18`**, and they share **one** root cause: `sys_choice` rows are
  absent for the three scoped tables (0 rows; the package's own choice `sys_id`
  `3e7609e334c65bf732756bc25d9f21c2` answers HTTP 404) while the dictionary keeps the four `case` fields
  choice-typed — so `status`, `type`, `priority` and `pending_reason` have no selectable options, which fails the
  schema assertion, the `pending_reason` assertion, all three form transitions at *Set Field Values* and the
  portal submit contract (`CasePortalService` fail-closes on an empty type list and answers `400`). That is
  Defect C's choice half **as it stood that day**; the package now on disk carries the seven native choice
  composites whose delta previewed to 0 problems, committed natively and produced 24 of 24 rows on 2026-09-03,
  so that root cause is addressed in the current bytes — **the suite has not been re-run on them, so 14 / 6
  remains the last measured rollup and no newer one may be quoted.** Each failure's failing
  step, verbatim assertion text, classification and fix-attempt record is in
  [`docs/refine-run/FINAL-REPORT.md`](docs/refine-run/FINAL-REPORT.md) §(e). Running the suite leaves no test
  residue behind (ATF rollback clean; the demo census is back to 10 cases / 10 tasks / 8 parties).
  **The `20 / 20` rollup this bullet used to carry is historical post-remediation evidence, not the current
  status:** runs `TES0001016` and `TES0001017` (2026-08-10, the second dispatched through the product UI with a
  browser runner attached) each scored 20 tests Success and 180 / 180 step results Success in roughly 4 minutes —
  but they were taken on an instance where `scripts/post_import_remediation.js` had already created the 24
  `sys_choice` rows, which is exactly the condition the 2026-09-02 package-alone run lacked. Both results stand,
  dated: 20 / 20 after remediation, 14 / 6 from the package alone. Quote the rollup and the measurement method,
  **not a `TES…` identifier**: `sys_atf_test_suite_result` rows are not durable on this shared instance, and the
  two rows earlier revisions of this README cited as current — `TES0001015` and `TES0001014` — no longer resolve
  on it. (An earlier *series* of runs, `TES0001010`–`TES0001012`, scored **16 / 4** — `ATF 07` plus the three form
  tests `ATF 15` / `ATF 16` / `ATF 17`; that result predates the fixes and is history, not status. `TES0001014`
  was the last verdict taken against a fresh re-load of the shipped `atf/*.xml` artifacts — the project's only
  serialized-import proof, on an earlier package revision; repeating it on the shipping bytes is open work,
  tracked as §10.0 item 2 of the limitations register.)

**Not working — also directly observed**

- **Both portal pages now render and work** — this bullet used to read "both portal pages render blank", and
  that was accurate until two defects were fixed. First, the pages' Service Portal layout records
  (`sp_container` / `sp_row` / `sp_column` / `sp_instance`) had never been authored, so `GET /api/now/sp/page`
  reported **0 containers** and the pages were pure white; the two `sp_page` artifacts had encoded their layout
  in a `<page_internal>` JSON element, which is not a column on `sp_page` on this release. Second, both widgets
  read `response.data.number` / `response.data.status`, but a Scripted REST response nests the body under
  `result` — so even after the pages rendered, a **201 displayed "Submission failed"**. With the layout chain
  packaged (`portal/layout/`) and both widgets unwrapping defensively, an anonymous visitor
  (`window.NOW.user_display_name === "Guest"`) sees a 5-field submission form that returns a confirmation panel
  with the verbatim `Your case has been submitted` and the new `CASE…` number, and a lookup page that shows
  exactly Status / Subject / Opened Date or the verbatim `No case found with that number.` — 0 console errors,
  no request ≥ 400, and a stored `<img src=x onerror=…>` subject rendered as inert text.
- **Both dashboards now render every widget** — this bullet used to read "both dashboards render no tabs and no
  widgets", and that was accurate. Their composite blocks named three child tables that do not exist on this
  release (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`), so the tab, all 8 widget placements and the
  role grants were dropped on commit — and supplying only a tab was proven insufficient, because the platform
  auto-created one on first view and both dashboards stayed blank. The artifacts now carry the real wiring:
  `sys_portal_page` → `sys_grid_canvas` → `pa_tabs` → `pa_m2m_dashboard_tabs`, one
  `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` triple per widget, and the
  `pa_dashboards_permissions` share rows. Agent Workspace renders **3 of 3** and Manager View **5 of 5** with
  the seed data. Getting a dashboard to open for a non-admin persona took three further gates that the platform's
  refusal messages do not name — `sys_report.user` must be `GLOBAL`, `sys_report.roles` narrows who may read, and
  the dashboard is gated by `pa_dashboards_permissions` plus `pa_dashboards.restrict_to_roles` (whose sibling
  `pa_dashboards.roles`, labelled "Requires Roles", only narrows and grants nothing). All four are set.
- **The four chart reports now plot the dimension they were designed around** — this bullet used to report them
  grouping by *Assigned Agent*. Each artifact specified `<group_by>`, but **`group_by` is not a column on
  `sys_report`** on this release, so the element was discarded on import and the builder fell back to the
  alphabetically first field. The column a chart groups on is `field`, and all four now carry it: status renders
  its six buckets, type its two, priority its four. An inert `<format>` element was removed at the same time for
  the same reason, and the eight reports were shared with the three scoped roles. The two single-score reports
  were always correct and still are.
- **The case form now renders its related lists** — this bullet used to read "the case form has no related
  lists", with `sys_ui_related_list` holding 0 rows for this scope and the wrapper measuring exactly 0 pixels
  tall. The definition ships as `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` and the wrapper
  measures **227 px** with Case Tasks above Case Parties, for the admin, the agent and the viewer alike. Be aware
  of one caveat that looks exactly like the old defect and is not: the definition is cached server side, so on an
  instance that rendered the case form before the definition existed the lists stay invisible, and the
  configuration screen will meanwhile show them correctly selected. `docs/deployment.md` Step 3 item 12 has the
  remedy.
- **What remains genuinely open on the user-facing surfaces** is smaller and is bounded by the AAP rather than by
  effort: the `organization` value on a Case Party is unreadable by every non-admin persona, because that would
  need read access to the global out-of-box `core_company` table and AAP §0.3.2 forbids global changes by name;
  the platform's list-action dropdown still offers Delete to a viewer as a cosmetic affordance, which is a global
  UI Action and equally out of bounds, while the server-side ACL correctly denies it; and the portal's contrast
  ratios and 34 px control heights are the default theme's, which AAP §0.4.4 mandates. Each is recorded with its
  measurement in `docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`.

**No regressions.** The 13 transition-logic assertions that passed before this pass were re-measured with the
same harness afterwards: **13 / 13 before, 13 / 13 after**, per assertion.

**Read [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) before deploying.**
**Section 0** of that document is the authoritative current-state record and supersedes any later section it
disagrees with; Section 9.5 is the install procedure, Section 9.6 lists every known defect with its root cause,
and Section 10.0 gives the recommended next steps in priority order. The measured status of each of the seven
validation gates is in [`docs/validation-gates.md`](docs/validation-gates.md#measured-status).

> **Instance note.** The reachable verification instance is `https://dev306625.service-now.com`, running
> **Zurich Patch 10**; its Table API answered read-only queries on 2026-09-03. The earlier
> `https://dev379024.service-now.com` host is **retired and is not used** — every figure dated to it stays as
> dated evidence from that host and never as current state. The `dev364430` host named in some older
> documentation in this repository is stale and returns HTTP 401.

> **Running the ATF suite needs one instance setting that the package deliberately does not carry.** Set
> `sn_atf.runner.enabled = true` under *sys_properties*, then start the suite from a browser-attached client
> runner (open `/atf_test_runner.do?sysparm_nostack=true` first and select it under "Pick a Browser").
> Headless execution is **off** on the current validation instance `dev306625` — `sn_atf.headless.enabled` reads
> `false` over the Table API on 2026-09-03, and `sn_atf.runner.enabled` already reads `true` there — as it was on
> the retired `dev379024`, where it could not be enabled, so headless remains unverified. The
> property is instance configuration and is excluded from the package on purpose — importing an app should not
> silently enable test execution on someone's instance.

## Install & Deployment

1. **Export Update Set:** Navigate to System Update Sets → Local Update Sets. Locate the scoped application Update Set. Set status to Complete. Export as XML.
2. **Verify Update Set integrity:** Re-import the exported XML on the same instance via System Update Sets → Retrieved Update Sets → Upload. Preview the Update Set. Zero errors required before proceeding. If preview errors exist, resolve them in the source application before re-exporting.
3. **Confirm deployed state:** After successful preview, commit the Update Set. Verify the following are present and functional post-commit: all 3 custom tables visible in App Engine Studio; both Flow Designer flows active (not draft); Experience Portal accessible at `[instance URL]/x_casemgmt_portal` (or the equivalent portal URL chosen at portal-record creation time — for this implementation the actual portal slug is `x_casemgmt_case_portal`, see [`docs/portal-pages.md`](docs/portal-pages.md)); both dashboards accessible to users with correct roles; synthetic demo data visible in case list.
4. **Deliver:** Provide the exported Update Set XML file path and the portal URL as final deliverables alongside confirmation that all validation gates passed.

> **These four steps are the AAP's deployment contract, reproduced as written. Step 2 has NOT been executed on
> the deliverable's complete byte sequence (`7292a6fe…`, 926 blocks / 3,781,097 bytes — nor on the retained
> amended `9f3ea74c…`, 935 blocks / 3,973,569 bytes, which the deliverable path held until remedy (a) of
> D48's stop condition was executed), so step 4's
> "confirmation that all validation
> gates passed" cannot be
> given for the file in your hands: the Update Set gate is binary and it is NOT MET on those bytes. Directive
> D48's stop condition was raised, reported and then **CLOSED by remedy (a)** — the checksum recorded for the
> shipping package is `7292a6fe…` and the bytes measure `7292a6fe…`, so the identity comparison holds, which
> is a different question from the gate
> (item 4 of
> the note at the top of this file). Running step 2 on them is what makes this deliverable deliverable — and it
> must be run on a genuinely clean, dedicated PDI, not on `dev306625`, whose already-committed retrieved set
> carries this file's own descriptor `sys_id` `9929f50df18ccec91ea13b2a3bccfc90`.**
> The 2026-09-02 native-rebuild run did commit 988 records once on a clean
> instance — on export 3's `eee9fabd…` sequence — and
> got physical storage for all three tables and all 27 ACL role links out of the commit itself, **but that
> package is retained rather than shipped**
> (`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, `e109e1d1…` / 4,062,067
> bytes / 988 blocks). On the **shipping**
> deliverable (`7292a6fe…`) the two paragraphs below apply as written: a bare commit leaves the
> tables without storage and its **26** ACL payloads without their **27** role links (manager 14 / agent 10 /
> viewer 3), because the shipping package carries
> 0 `sys_security_acl_role` rows; `scripts/post_import_remediation.js` asserts the 29-ACL / 36-link figures of
> the repository's `acl/*.xml` artifacts, so on this package it reports the 3-ACL / 9-link shortfall as a
> **named** non-convergence. **CORRECTED — the choice lists ARE a post-commit item on the SHIPPING package.**
> This passage read "the choice lists are no longer a post-commit item on either package", which was written
> when the deliverable path held the amended bytes: the seven platform-native choice composites previewed to 0
> problems and committed natively as their own delta (`sys_choice` 0 → 24, exact option labels on the real
> forms) are carried by `…AMENDED-NOT-GATED.xml` and `…REBUILT-DEPENDENCY-ORDERED.xml`, **not** by the shipped
> fallback, which carries the 7 older `sys_choice_<32-hex>` rows — the single root cause of the six ATF
> failures in [`docs/refine-run/PHASE3-ATF.md`](docs/refine-run/PHASE3-ATF.md). On a clean instance
> `scripts/post_import_remediation.js` creates the 24 choice rows along with the schema and the links. What remains a
> post-commit item is the seed-row linkage and `opened_date`, through `scripts/seed_demo_data.js`; see
> [`docs/refine-run/FINAL-REPORT.md`](docs/refine-run/FINAL-REPORT.md).
> Step 3's **dashboard and portal checks now pass** — an earlier revision of this note warned that
> neither could, because the dashboards named three child tables this release does not have (`pa_tab`,
> `pa_dashboard_widgets`, `pa_dashboard_role`) and the portal pages had no layout records; both were packaging
> defects and both are fixed. What still blocks a bare commit is the schema and the ACL role links, and one more
> thing worth knowing before you start: if the target instance rendered the case form before this package's
> related-list definition arrived, the case form's related lists stay invisible until *Configure ▸ Related Lists*
> is opened and **Saved** once (`docs/deployment.md` step 12). Follow
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0 and §9.5](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) for the procedure that
> works — in outline: commit, rebuild the three tables and run `scripts/post_import_remediation.js` in **Global**
> (*Scripts - Background*, "In scope" = Global — **not** the Fix Script UI, which runs in the application scope
> and fails), commit a second time to restore the ACLs the rebuild cascaded away, run the remediation again to
> confirm `verified=true` with exactly 36 role links, then run `scripts/seed_demo_data.js` in scope — which
> **adopts** the packaged seed rows by their pinned numbers rather than requiring you to delete them first. The single-display-field repair that this outline previously listed is
> **no longer a manual step** — the package now ships one display field per table and the remediation verifies
> it.

Detailed walkthrough in `docs/deployment.md`. Manual round-trip verification procedure in `scripts/round_trip_verify.md`.

## Validation Gates

Detailed gate definitions live in `docs/validation-gates.md`. The seven gates below are the canonical pass/fail criteria for delivery, reproduced verbatim from AAP Section 0.7.3. For the **measured** outcome of each gate on the verification instance — **4 pass outright, 2 pass with a qualification, 1 NOT MET** (4 + 2 + 1 = 7) — see [`docs/validation-gates.md` → Measured Status](docs/validation-gates.md#measured-status). In brief: **Workflow**, **Portal — submission**, **Portal — lookup** and **Dashboards** pass outright, the two portal gates at both the REST-contract level and on the rendered pages, and Dashboards for the admin and for every persona the design entitles. **Data model** and **ACLs** are correct only after the documented manual post-import remediation. **Update Set** is a binary gate and is **NOT MET for the shipping deliverable**: no preview of any kind was ever run on its bytes, so it counts as no kind of pass — the zero-problem preview and clean commit were measured on export 3's sequence, which is neither the elected file nor the retained rebuilt one. Electing the fallback settled which package ships and passed no gate; the round trip that closes the gate, and the promotion of the retained `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, are in [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §10.0. Counting the documented remediation as part of a normal install instead — it is an approved installer step, not a defect in the data model or the ACL design — reads gates **Data model**, **Workflow**, **ACLs** and **Dashboards** as outright passes and leaves **Update Set** as the one gate NOT MET, yielding **6 pass · 0 qualified · 1 NOT MET** (6 + 0 + 1 = 7). Both accountings describe the identical measured state, neither scores the Update Set gate as a pass, and this deliverable quotes the conservative one throughout so that no qualification is lost by rounding.

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| Data model | All 3 custom tables created with correct fields and types | Zero missing mandatory fields |
| Workflow | All state transitions enforced for both case types | Invalid transitions return blocking error; task-closure check blocks Resolved transition |
| ACLs | Role-based access enforced | `case_viewer` cannot write; `case_agent` cannot access unassigned cases; `case_manager` has full access |
| Portal — submission | Case created from unauthenticated portal submission | Case appears in internal list with Draft status and correct case number |
| Portal — lookup | Status lookup returns correct data for valid case number | Correct status / subject / opened_date returned; "No case found with that number." for invalid number |
| Dashboards | Both dashboards render with synthetic data | All widgets display data; no broken report references |
| Update Set | Scoped app exported | Update Set loads without errors on a fresh PDI instance |

## Documentation Index

Read them in this order. The first is authoritative wherever any other document disagrees with it.

| Document | What it is for |
| --- | --- |
| [`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) | **The authoritative current-state record.** §0 carries the package identity, what is and is not verified, the open limitations, and the gate rollup. Start here. |
| [`docs/validation-gates.md`](docs/validation-gates.md) | AAP §0.7.3's seven gates with the evidence behind each verdict. |
| [`docs/data-model.md`](docs/data-model.md) | The three tables, field by field, per AAP §0.5.7. |
| [`docs/state-machine.md`](docs/state-machine.md) | The transition matrix per AAP §0.5.5, the blocking-error strings, and how enforcement is wired. |
| [`docs/acl-matrix.md`](docs/acl-matrix.md) | The role × table × CRUD matrix per AAP §0.5.6 and the definition of "Assigned only". |
| [`docs/portal-pages.md`](docs/portal-pages.md) | The submission and lookup surfaces and their exact field whitelists. |
| [`docs/dashboards.md`](docs/dashboards.md) | The widget inventory for both dashboards and the reports behind them. |
| [`docs/deployment.md`](docs/deployment.md) | Export, upload, preview, commit, and post-commit verification. |
| [`docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) | The full operator runbook, including the mandatory post-import remediation procedure. |
| [`docs/ATF_MANUAL_TEST_PLAN.md`](docs/ATF_MANUAL_TEST_PLAN.md) | What each of the 20 ATF tests asserts, and how to run the suite. |
| [`docs/WORKFLOW_TRYOUT_GUIDE.md`](docs/WORKFLOW_TRYOUT_GUIDE.md) | A hands-on walkthrough of the case lifecycle on a live instance. |
| [`scripts/round_trip_verify.md`](scripts/round_trip_verify.md) | The Update Set re-import and preview verification procedure. |

Files under `scripts/`:

- `scripts/post_import_remediation.js` — **the mandatory post-import remediation.** Builds the three tables' physical storage (Defect C) and creates the 27 `sys_security_acl_role` link rows (Defect 9). Run it from *Scripts - Background* with "In scope" = **Global**; it is fail-closed and reports `verified=true` only when both are correct.
- `scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` — the Fix Script record that carries that same body inside the Update Set so it arrives with the app. It does **not** auto-run, and running it from the Fix Script UI fails (application scope).
- `scripts/seed_demo_data.js` — idempotent server-side seed script. It adopts packaged rows by pinned number, resolves expected references by `user_name` / `name` / `number`, repairs blank, non-`sys_id`, or dangling reference values without overwriting valid operator-managed references, and guarantees `opened_date` on every demo case; it contains no hard-coded reference `sys_id`s.
- `scripts/transition_logic_regression_assertions.js` — the 13 server-side assertions over the transition guards, used to prove no regression across changes.
- `scripts/round_trip_verify.md` — manual procedure for the fresh-PDI re-import preview gate.

## License

The existing top-level repository license file is `LICENSE.txt` (LGPLv3) and applies to the existing ArkCase code. The artifacts under `servicenow-case-management-poc/` are derived semantic re-implementations and not direct ports of any LGPLv3 source code from the ArkCase repository.

No third-party LGPLv3 source code is included or redistributed in this subdirectory.
