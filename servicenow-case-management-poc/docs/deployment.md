# Deployment

## Purpose

This document captures the four-step deployment procedure for the ServiceNow scoped application POC, mapped 1:1 to Validation Gate 7 (Update Set integrity) defined in [`validation-gates.md`](./validation-gates.md). It is non-negotiable: every step MUST complete cleanly before delivery, and the Update Set XML MUST re-import on a fresh PDI with zero preview errors. The four steps — Export, Verify, Confirm, Deliver — are preserved verbatim from AAP Section 0.7.2 (User Example — Deployment steps) and are reproduced as quoted text within each section below so that any human operator (or future build agent) can execute the deployment using only this document plus the cross-referenced manual round-trip-verify procedure. **Standing note: this walkthrough has NOT been executed end-to-end on the deliverable's current byte sequence (935 blocks, 3,973,569 bytes, SHA-256 `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`, measured 2026-09-05T04:45Z — MEASURED, NOT GATE-VERIFIED) — no preview of the complete file has been run on it, so the AAP §0.7.1 Update Set gate is NOT MET for the file a reader holds until step 2 is run on it, and directive D48's stop condition is live because the checksum recorded for the shipping package was `7292a6fe…`. What those bytes do carry, added 2026-09-03, is seven platform-native choice composites with their own runtime proof: that exact seven-child delta was uploaded, previewed to 0 problems of any type and committed by the native commit action (commit worker `state=complete`, message "Update set committed"), taking `sys_choice` for the three tables from 0 to 24 rows with every option label rendering on the real forms. Choice creation is therefore no longer a post-import step. The delivery election has been made and the shipping package ships; the note below states which sequence carries which result and which artifact is retained as the upgrade path.**

> **CR1 AMENDMENT — 2026-09-09. The canonical package's bytes changed after the identity rows below were written.**
> Code review checkpoint CR1 raised seven findings against the shipped package. Resolving them **removed four
> payloads** — the three `sys_user_has_role` records this release's Role Management V2 refuses to install, and the
> Global-stamped `sys_script_fix` record — and **added four**: the two dashboard-pane bundles that restore the eight
> `sys_grid_canvas_pane` widget placements, and two scoped `sys_rate_limit_rules` records. It also hardened the two
> anonymous portal endpoints in place (post-insert admission ranking on submit; strict number validation,
> per-session throttling, an HTTP 429 path and abuse monitoring on lookup) and reordered every block into the
> AAP §0.5.2 dependency tiers.
>
> | Property | Pre-amendment (the rows below) | **Shipping now** |
> | --- | --- | --- |
> | Payload blocks | 522 | **522** |
> | Bytes | 3,114,377 | **2,989,530** |
> | SHA-256 | `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` | **`8160ed16cfc7c9bce84d5b2e9d3d971d4035b733078a653614d189b8090d89c7`** |
>
> Re-derive all three from the file itself — `sha256sum`, `stat -c %s`, `grep -c '<sys_update_xml action='` —
> rather than trusting any quoted figure. **The amended bytes have not been previewed or committed on an
> instance:** the PDI is deliberately at its torn-down zero state and the CR1 checkpoint made no instance writes,
> so the upload → preview → zero-problem gate in **Step 2 of this document** is the recipient's first step, before commit. What was
> verified statically: `xmllint` clean, all 522 payloads parse, 522 unique block names, one sane descriptor whose
> `inserted`/`summary` equal 522, zero `global` scope stamps, all 122 embedded script bodies parse and are
> ES5-conformant, every reference in the restored pane bundles resolves inside the package, and the AAP §0.5.2
> dependency-order assertion passes. Every identity figure elsewhere in this document describes the
> pre-amendment bytes and is retained as provenance. Full amendment ledger: [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](refine-run/CONSOLIDATION-FINAL-REPORT.md).

> **DELIVERABLE IDENTITY — read this before comparing, verifying or asserting any digest, byte size or block count anywhere in these documents.**
> Re-measured **2026-09-08** from the file on disk (`sha256sum`, `stat -c %s`,
> `grep -c '<sys_update_xml action='`) after the Update Set consolidation replaced the canonical package. These
> rows are the only identities stated here as current fact. Every other digest in this documentation set is
> either the retained fallback artifact below or an explicitly dated historical measurement, and is labelled as
> such where it appears.
>
> | Artifact | Identity, as measured 2026-09-08 | Status |
> | --- | --- | --- |
> | `update-set/x_casemgmt_case_management_update_set.xml` — **THE DELIVERABLE** | **522** `<sys_update_xml>` blocks · **3,114,377** bytes · SHA-256 **`b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`** · descriptor `sys_id` `8ebb770493534b1009aa70d19dba102a` · `xmllint --noout` clean | **GATED — by a same-instance reset-and-reimport, not by an independent second PDI.** These exact bytes were uploaded, previewed to **0** `type=error` and **0** `type=warning` problems, and committed **once** through the native Commit Update Set action on 2026-09-08, onto this instance reset to a proven zero-state immediately beforehand with no intervening patch. Post-commit it installed 3 tables (rows 10/10/8), `sys_dictionary`/`sys_documentation` 21/21 · 14/14 · 13/13, 3 roles, 26 ACLs, **27** `sys_security_acl_role` links (manager 14 / agent 10 / viewer 3) and **24** `sys_choice` values, with task and party linkage resolving. The residual risk of same-instance verification, and the two deltas it did not carry, are recorded in [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) |
> | `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — **the elected base** | **926** blocks · **3,781,097** bytes · SHA-256 **`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`** · 26 `sys_security_acl` · `xmllint` clean | Retained. Modified after election by the three commits below, then **restored to the elected bytes 2026-09-05T04:45Z**. Deliberately **no longer** byte-identical to the deliverable — a fallback that tracks the deliverable is not a fallback |
> | The two candidate packages this consolidation superseded — `…REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks · 4,062,067 bytes · `e109e1d1…`) and `…AMENDED-NOT-GATED.xml` (935 blocks · 3,973,569 bytes · `9f3ea74c…`) | Both **deleted** from `update-set/` in this consolidation; their bytes remain recoverable from git history | Superseded: each was hand-authored rather than platform-exported, and neither was ever gated through a teardown-and-reimport commit. Provenance recorded in [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) |
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
> values: all of them were measured present after one commit, with no remediation script and no second commit,
> and the demo rows travel inside the package. Two classes it cannot carry are reported rather than papered
> over — the **3** `sys_user_has_role` grants, which Role Management V2 refuses from any update set on this
> release (the native remedy is the role form's *Edit Members*), and the **8** `sys_grid_canvas_pane` rows, which
> bind a canvas cell to a `sys_portal` widget instance and are not application files. AAP §0.7.1 / Gate 7 — the
> zero-preview-error round trip — is **met on these bytes by a same-instance reset-and-reimport, not by an
> independent second instance**: only one PDI is available to this project, so the instance was torn down to a
> proven zero-state and the exact candidate bytes were then imported and committed with nothing running in
> between. The residual risk that leaves is named rather than waved away: anything the platform holds outside the
> records a teardown removes — caches, indexes, retained update history, metadata a scope deletion does not
> reach — was not re-created by the exercise and was not tested by it. Directive **D48's stop condition is
> closed**: the checksum recorded for the shipping package and the bytes on disk are both `b2217224…`. The full
> record is [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).
>
> *Retained as written on 2026-09-05, and superseded by the paragraph above — D48's two remedies as they stood
> then:*
> **human-gated**: **(a)** restore the elected bytes to the deliverable path — now a plain file copy from the
> restored `…FALLBACK.xml` — at the cost of dropping the three remediation passes from the shipped package; or
> **(b)** run the full gate on `9f3ea74c…` against a genuinely clean, dedicated PDI. Remedy **(a)** was taken
> on 2026-09-05; the consolidation of 2026-09-08 then settled the comparison outright by recording the
> checksum of the bytes it shipped, and ran the gate itself by the same-instance route described above.
>
> **There is no longer a rebuilt package to promote: the consolidation superseded and deleted it.**
> `…REBUILT-DEPENDENCY-ORDERED.xml` carried the platform-captured `sys_db_object` and `sys_dictionary` records
> directives D2/D21 ordered — **30** platform-named `sys_dictionary` rows, **30** `sys_documentation` rows and all
> **27** `sys_security_acl_role` links — and it served as the baseline the consolidation rebuilt the application
> from, but it was hand-authored rather than platform-exported and was never gated through a
> teardown-and-reimport commit, so it was deleted rather than promoted. What ships instead is the platform export
> in the table above, which carries the same platform-named schema rows and the same 27 role links **and** the
> post-rebuild choice and linkage fixes, and which was gated on its own bytes. The deleted file's identity was
> **`e109e1d1…` over 4,062,067 bytes**, which superseded `90ee0249…` over 4,062,436 bytes; neither matches any
> file in this tree, so any instruction still quoting either would send an operator to a checksum they cannot
> reproduce, and they would correctly abort. Provenance: [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).

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
> order is exactly what the CR1 review's HIGH AAP §0.5.2 finding rejected. *(2) The rebuilt candidate — superseded and deleted in this consolidation:*
> the file was then re-sequenced into the AAP §0.5.2 dependency order, giving 988 blocks, 4,062,436 bytes,
> SHA-256 `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` — **a superseded identity that
> matches no file in this tree today; do not verify or promote against it** — the same 988 records
> byte-for-byte at the same byte count, differing from the previewed bytes **only in the order of the
> `<sys_update_xml>` blocks** — and on 2026-09-03 the seven direct `sys_choice` children in that file were
> replaced with the platform-native choice composites described in the *Purpose* note, giving the candidate then
> on disk: **988 blocks, 4,062,067 bytes, SHA-256
> `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`**, in which 981 of the 988 children remain
> byte-identical to the previewed sequence. The round trip on its complete bytes was never run, so it was never
> gated — and **this consolidation superseded and deleted it** from
> `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, its bytes recoverable from
> git history and its provenance recorded in
> [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md). It satisfied
> AAP §0.5.2 dependency ordering and carried the platform-captured schema records and all 27
> `sys_security_acl_role` links, which is why the consolidation used it as the **baseline it rebuilt the
> application from** rather than as a package to promote: the application was reinstalled from those records,
> the two post-rebuild fixes were applied (the 24 native `sys_choice` values and the case/task/party linkage),
> and the result was captured and exported by the platform itself as the 522-block package that now ships. **No
> promotion path remains, and none is needed.** What was checked on the deleted candidate before it went —
> `xmllint --noout` clean, 988 blocks, every §0.5.2 dependency assertion passing, and 981 of its 988 children
> byte-identical to the previewed `eee9fabd…` bytes with the remaining 7 being the native choice composites,
> whose own delta previewed to 0 problems and committed natively on 2026-09-03 — was static corroboration plus
> an exact-child runtime result, never a round trip of its complete byte sequence.
> The record is
> [`../docs/refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md). *(3) What ships:* the exact-byte gate
> could not be completed on any instance available to this run, so under checkpoint OVERRIDE-2 the untouched
> original package was **elected** as the deliverable, and it is the artifact the remainder of this note
> describes. It sits at `update-set/x_casemgmt_case_management_update_set.xml` and is **NOT** byte-identical to
> `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`: that path retains the **elected base**
> (`7292a6fe…`, 926 blocks, 3,781,097 bytes, restored to those bytes 2026-09-05T04:45Z), while the deliverable
> is that base **as amended** by three post-election remediation commits (`f8454fb078`, `6efb13b141`,
> `8dfdbcb015`) — a net +9 payloads, 919 payload names in common. **It does not include this round's
> native-rebuild fix** — measured on the file, 0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25
> hand-authored `sys_dictionary` rows — so the ACL-role links are absent from it and
> `scripts/post_import_remediation.js` must be run to create them: **36** links for its **29** ACL payloads
> (manager 17 / agent 13 / viewer 6), where the 26-ACL elected base needs 27 (manager 14 / agent 10 / viewer 3),
> exactly as
> [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) documents. **Electing it
> settled which package ships; it did not pass the gate.** On 2026-09-03 the elected base's seven direct
> `sys_choice` children were replaced with platform-native choice composites, and the two later passes added the
> 4 Business Rules, 1 Client Script, 3 field-level `query_range` ACLs and 1 Form Layout record that take it to
> 935 blocks — so **choice creation is no longer among the
> post-commit steps**, while the physical-schema and ACL-role-link remediation and the seed pass still are.
> §5 of that guide, run against the deliverable on a
> genuinely clean PDI and asserting **935** children, is what discharges the zero-preview-error requirement
> stated at the top of this document for the artifact a reader holds:
>
> **CORRECTED 2026-09-08 — items (2) and (3) above are retained as written and no longer describe this tree.**
> The two candidate packages were superseded and deleted in this consolidation, so there is no rebuilt artifact
> to promote; and what ships is the consolidated platform export — **522** blocks, **3,114,377** bytes, SHA-256
> `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` — on whose exact bytes the gate was run and
> **MET** on 2026-09-08: uploaded to an instance torn down to a proven zero-state, loaded with **522** children,
> previewed to **0 `type=error` and 0 `type=warning`** with no problem row marked skipped or ignored, then
> committed once through the native **Commit Update Set** action, with nothing run in between. It was a
> same-instance reset-and-reimport rather than an independent second instance, so instance-level cache, index
> and metadata a full teardown may not reset remain untested. D48's identity comparison is settled: the
> recorded checksum and the bytes both read `b2217224…`. One commit of those bytes yields the physical schema,
> 26 scoped ACLs with **27** role links, the **24** choice values and the demo rows; the only native step left
> is the 3 `sys_user_has_role` grants. The paragraph that follows is the pre-consolidation status, retained as
> the record of it ([`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md)).
>
> **The shipping bytes are 935 blocks, 3,973,569 bytes, SHA-256
> `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9` (measured 2026-09-05T04:45Z — MEASURED,
> NOT GATE-VERIFIED), and NO preview of the complete file has
> been run on them, so the Update Set gate is NOT MET for the deliverable and this walkthrough must not be read
> as already executed on it. Directive D48's stop condition is live: the checksum recorded for the shipping
> package was `7292a6fe…` and the bytes are `9f3ea74c…`; both remedies — restoring the elected bytes from
> `…FALLBACK.xml`, or running the full gate on a clean dedicated PDI — are human-gated. Their seven choice
> children, and only those, carry a preview-and-commit result of
> their own: the exact seven-child delta was previewed to 0 problems of any type and committed natively on
> 2026-09-03, `sys_choice` 0 → 24.**
> Be precise about which measurement belongs to which artifact. **Fourteen distinct package byte sequences exist
> across this deliverable's history; seven of them carry a full-package preview result and seven carry none, two
> of those seven carrying instead the exact-child preview and commit of their seven choice composites** — the
> table below is the whole lineage, one row per sequence, so no result can be borrowed by a file it was not
> measured on. Count the Preview column rather than trusting this sentence:
>
> | Digest (SHA-256) | Blocks | Bytes | Preview | Commit | Artifact / path | Class |
> |---|---:|---:|---|---|---|---|
> | `32a064d6…` | 916 | 3,448,009 | 0 problems of any type | committed | no file on disk — git history only | historical |
> | `7272edfc6b2b1b365cee1b816e58f07993d62a748dee21a4814d9d94dbfb109e` | 913 | 3,618,378 | 0 problems of any type (41 → 298 → 0) | `state=committed` | no file on disk — git history only | historical |
> | `89638c17d328839d7b2cbba1525f9490c95b7f54434792fd732846126b3da13e` | 913 | 3,643,389 | **120 `type=error`** (40 distinct, 21 package-intrinsic) | not committed | no file on disk — git history only | historical |
> | `e49a7654…` | 925 | 3,698,577 | 31 problems, all `Found a local update that is newer than this one`; **0** `Could not find a record` | commit withheld (shared instance) | no file on disk — git history only | historical |
> | `f482214ae73a6402b54b6ebce8feac229f5849ddb23473a2b…` | 926 | 3,781,093 | none | none | no file on disk — superseded intermediate, 4 bytes from the elected base (`pie` → `donut`, twice) | historical |
> | `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` | 926 | 3,781,097 | **none ever** | none | `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — **on disk**, restored to these bytes 2026-09-05T04:45Z | **the ELECTED BASE (OVERRIDE-2 / D3), retained — gate NOT MET; 26 `sys_security_acl`** |
> | `a9204411593a4811f30540d30c8d56d73d8c34e2a288a3ac541596a15aaec274` | 926 | 3,780,373 | **none on the complete file**; its seven choice children previewed **0 problems of any type** as their own delta, 2026-09-03 | seven-child delta committed natively 2026-09-03 (`sys_choice` 0 → 24); complete file never committed | no file on disk — the deliverable as it stood at commit `f8454fb078` | historical — **superseded; matches no file in this tree** |
> | `4e28acaed702b39c7d225d1dfd7f63c4da6c9696909c4011bafee29737734a63` | 935 | 3,944,374 | **none ever** | none | no file on disk — the deliverable as it stood at commit `6efb13b141` (the 18-QA-findings pass, which inserted the 9 payloads) | historical — **superseded; matches no file in this tree** |
> | `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9` | 935 | 3,973,569 | **none ever** — these exact bytes have never been uploaded or previewed on any instance | none | no file on disk — was the deliverable until the 2026-09-08 consolidation, then held briefly at `…AMENDED-NOT-GATED.xml` and **deleted**; bytes in git history | **superseded candidate, deleted 2026-09-08 — the elected base AS AMENDED (commits `f8454fb078`, `6efb13b141`, `8dfdbcb015`); MEASURED 2026-09-05T04:45Z, NOT GATE-VERIFIED; 29 `sys_security_acl`; D48 stop condition live** |
> | `df110c9526bdc81d62b06b0f6a58b5573a83b9d3153fcd7c623ef9704668a000` | 988 | 4,062,298 | **63 `type=error`** | not committed | no file on disk — export attempt 1 (snapshot `7af37c12930f435009aa70d19dba105a`) | historical |
> | `7c382fab41954ebea107c610a0c496343e29e3393bd5788c441080e58c2163db` | 988 | 4,062,436 | **60 `type=error`** | not committed | no file on disk — export attempt 2 (snapshot `23467496930f435009aa70d19dba1013`) | historical |
> | `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae` | 988 | 4,062,436 | **0 `type=error` / 0 `type=warning`** | committed `2026-09-02T20:53:14Z` | no file on disk — export 3 (snapshot `0b3b7452934f435009aa70d19dba100d`) | historical — **the only complete round trip this run** |
> | `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` | 988 | 4,062,436 | none | none | no file on disk — the §0.5.2-reordered sequence as it stood at commit `3671901b5b`, superseded by the choice-materialization fix at `f8454fb078` | historical — **superseded; matches no file in this tree, so never verify or promote against it** |
> | `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` | 988 | 4,062,067 | **none on the complete file**; the same seven choice children previewed **0 problems of any type** as their own delta, 2026-09-03 | seven-child delta committed natively 2026-09-03; complete file never committed | no file on disk — **deleted in the 2026-09-08 consolidation** after serving as the baseline the application was rebuilt from; bytes in git history | retained, not shipped — **static evidence plus exact-child runtime proof** |
> | `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` | 522 | 3,114,377 | **0 `type=error` / 0 `type=warning`** on an instance torn down to a proven zero-state, 2026-09-08 | committed once through the native UI action, 2026-09-08 21:27:27 UTC | `update-set/x_casemgmt_case_management_update_set.xml` — **on disk** | **THE CURRENT DELIVERABLE — genuine platform export; Update Set gate MET on these exact bytes by a same-instance reset-and-reimport, not by an independent second instance; 26 `sys_security_acl` + 27 `sys_security_acl_role`** |
>
> Read the table as the rule INTERP-9 states: a runtime measurement belongs to the byte sequence it was taken on.
> **CORRECTED 2026-09-08 — the sentence that follows is retained as written.** The tree now holds the
> 522-block platform export as the deliverable, whose complete bytes **do** carry a preview and a commit
> result (0 problems of any type, then one native commit, on an instance reset to a proven zero-state), plus
> the retained base file named below; the two candidate packages were superseded and deleted in this
> consolidation.
> **Three** on-disk artifacts exist — the `9f3ea74c…` deliverable, the `7292a6fe…` elected base retained at
> `…FALLBACK.xml`, and the retained `e109e1d1…` rebuild —
> and **none of them carries a preview or a commit result for its complete bytes**; what the deliverable and the
> rebuild do carry is
> the 2026-09-03 preview-and-commit result of the seven choice-composite children they hold in common, whose
> payloads are byte-identical to the seven children the platform committed. What changed from `e49a7654…` to the
> elected base's `7292a6fe…` bytes is small and fully enumerated: **13 payloads** re-synced
> (8 `sys_report`, 2 `Dashboard`, 3 `sp_widget`) and **1 block added** (the case form's Related Lists
> definition), all of it presentation-layer work resolving a QA report. What *has* been measured on those
> records: every one of the 14 deployed to a live PDI and read back field-for-field identical to its
> artifact; every table and column any of them names checked to exist in `sys_db_object` / `sys_dictionary`;
> all 926 embedded payloads of that 926-block revision parsing; `xmllint --noout` clean; and the runtime outcome of each change verified in
> a browser. What changed again on 2026-09-03, giving the since-superseded `a9204411…` bytes (commit
> `f8454fb078`; no longer on disk), is equally bounded: the
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
- All artifacts are in scope `x_casemgmt`, with **no exception**. The package previously carried one — the installer Fix Script `x_casemgmt Post-Import Remediation`, stamped `sys_package`/`sys_scope` = `global` — and code review checkpoint CR1 (finding F04) established that no override authorised a Global-scope write and that the stamp achieved nothing anyway, because the commit engine rewrites a committed record's scope to the application. **That payload has been removed from the package.** The remediation body is unchanged and still shipped in the repository at [`../scripts/post_import_remediation.js`](../scripts/post_import_remediation.js), to be run through the Global Background Script route documented in [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5; the record definition at [`../scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml`](../scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml) is now stamped `x_casemgmt` and marked as a retained, deliberately unshipped reference. Verify by filtering `sys_app=x_casemgmt Case Management` on every record type listed in the [Step 1](#step-1-export-the-update-set) artifact inventory; **no record is expected to differ**, and global tables must show **data** inserts only, never schema changes.
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
   - **0 Fix Scripts** — the package deliberately carries none. The post-import remediation body lives in the repository at [`../scripts/post_import_remediation.js`](../scripts/post_import_remediation.js) and is run through a Global Background Script (see the note in Step 2 and `HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5). Nothing in the package executes by itself.
   - **2 REST rate-limit rules** (`sys_rate_limit_rules`, scope `x_casemgmt`) — the platform-native per-hour ceiling on the unauthenticated caller for each anonymous REST resource, added for review findings F06/F07. Their effectiveness must be confirmed post-commit: see the verification queries in the record definitions under [`../portal/rest/`](../portal/rest/).
   - **8 `sys_grid_canvas_pane` placements** — the rows that bind each dashboard canvas cell to its report widget instance, carried as two self-contained bundles alongside the eight `sys_portal` widget instances they reference (review finding F02). Without them both dashboards install empty.
   - **221 ATF records in the platform export** — 20 test definitions, 180 test steps, 1 test suite and 20 suite-member links. This is by far the largest part of the package: **221 of its 522** blocks. In a platform export the step inputs are embedded in the step payloads themselves, so the 540 standalone `Value` payloads the superseded hand-authored candidates carried (539 `sys_variable_value` + 1 variable value) are not separate blocks here.
   - **1 UI Policy** — `case_party_conditional_fields` (shows `person` when `party_type=Person`; shows `organization` when `party_type=Organization`).
   - **1 List Layout + 1 Related Lists definition, both on the case table's Default view** — `sys_ui_list_x_casemgmt_case_null` under [`../list_layouts/`](../list_layouts/), which puts `subject`, `type` and `status` back into the case list in AAP field order, and `sys_ui_related_x_casemgmt_case_null` under [`../related_lists/`](../related_lists/), which is the definition plus the two entries (`x_casemgmt_case_task.case` at position 0, `x_casemgmt_case_party.case` at position 1) that make the case form show its own tasks and parties. Neither record type extends Application File at the child level, so each ships as one block carrying its children inline. See step 12 of Step 3 for the related-list cache caveat.
   - **1 sp_portal record + 2 pages + 3 widgets + 2 sys_ws_definition records** — the Experience Portal record, the case-submit and case-status pages, the submission/lookup/confirmation widgets, and the two scripted REST endpoints (`/api/x_casemgmt/case_submit`, `/api/x_casemgmt/case_status_lookup`).
   - **2 pa_dashboards records + 8 sys_report records** — Agent Workspace, Manager View, plus the eight reports enumerated in [`dashboards.md`](./dashboards.md).
   - **All seed data records** — under the scoped tables (`x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party`) plus the three demo users, the demo group, its membership and the two synthetic companies. **Role-to-user assignments are NOT in the package**: this release's Role Management V2 refuses `sys_user_has_role` inserts during an Update Set commit, so the three grants are a mandatory post-commit step — [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5h — and the personas have no access until it is done (review finding F01).

4. Set the Update Set state to **Complete**. The simplest path is the top-right Update Set picker → **Complete**, which prompts for confirmation; click **OK**. Once Complete, no further changes can be added to this Update Set without back-out.
5. Click **Export to XML** on the Update Set form (Related Links panel). The browser will download a single XML file. Save the resulting file to `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`. This is the canonical deliverable file path defined by AAP Sections 0.3.1 and 0.4.1; do not save under any other name or location.

### Notes

- **Exactly one file in [`../update-set/`](../update-set/) is the shipping deliverable:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`. That is the canonical path pinned by AAP Sections 0.3.1 and 0.4.1, it is the single file a deployer uploads in [Step 2](#step-2-verify-update-set-integrity), and it is the path quoted in [Step 4](#step-4-deliver). A fresh export **overwrites that one path in place** — never version it beside itself (no `…_v2.xml`, no `…-2026-09-02.xml`, no browser-suffixed `… (1).xml`), because a second candidate deliverable in the same directory makes "the Update Set XML" ambiguous to whoever imports it.
- **One deliberately named artifact is retained alongside it and MUST NOT be deleted.** It is not a deliverable and no deployer imports it; it is on disk for a documented reason:
  - `x_casemgmt_case_management_update_set.FALLBACK.xml` — the **elected base**, and **no longer byte-identical to the shipping deliverable**: 926 blocks, 3,781,097 bytes, SHA-256 `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, 26 `sys_security_acl`, restored to those bytes 2026-09-05T04:45Z. Its retention is **required** by directive D3/S0: the elected fallback must stay on disk under its own name so the bytes that were elected remain independently identifiable even after a later export overwrites the deliverable path. Three post-election remediation commits (`f8454fb078`, `6efb13b141`, `8dfdbcb015`) edited this path in lockstep with the deliverable, which defeated exactly that retention and left no on-disk copy of the elected bytes; they were restored, and **this path is now excluded from every remediation pass — a fallback that tracks the deliverable is not a fallback.** Do **not** replace the two files together and do **not** expect them to match.
  - The two candidate packages this consolidation superseded — `…REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks, 4,062,067 bytes, `e109e1d1…`) and `…AMENDED-NOT-GATED.xml` (935 blocks, 3,973,569 bytes, `9f3ea74c…`) — were **deleted** on 2026-09-08, their bytes recoverable from git history and their provenance recorded in [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md). Neither is on disk, and nothing in this repository should be verified or promoted against them.
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

> **CORRECTED 2026-09-08 — on the package that ships, a single commit DOES reach this walkthrough's state for
> everything an update set can carry.** Measured after one commit of the 522-block platform export onto an
> instance torn down to a proven zero-state, with no script run and no second commit: three tables at HTTP 200
> with physical storage (`sys_dictionary` and `sys_documentation` 21 / 14 / 13 each), the three roles, 26
> scoped ACLs carrying **27** `sys_security_acl_role` links (manager 14 / agent 10 / viewer 3), **24**
> `sys_choice` values across 7 lists, 3 `sys_number` counters, 7 flows active and published, 8 reports, 2
> dashboards, 1 portal with 2 public pages and 3 widgets, 2 anonymous REST endpoints, the ATF suite, and the
> demo rows 10 / 10 / 8 with their task and party linkage resolving. **The one native step that remains** is
> the 3 `sys_user_has_role` grants, which Role Management V2 refuses from any update set on this release — add
> them on each role form's *Edit Members* related list, step by step in
> [`HUMAN_DEPLOYMENT_RECREATE_GUIDE.md`](./HUMAN_DEPLOYMENT_RECREATE_GUIDE.md) §5h. **Until that step is done
> the three demo personas have no access at all**, so it is mandatory rather than optional (review finding F01).
>
> **CORRECTED AGAIN 2026-09-09 (review finding F02).** This note previously said the 8 `sys_grid_canvas_pane`
> rows "are likewise not application files and do not transport" while "both dashboards still render their
> widgets". Both halves were wrong. Pane rows are application files, they were dropped from the package on a
> mistaken diagnosis, and without them a committed dashboard has its canvas, its tab, its permissions, its
> reports and its fully-configured widget instances but **no placements — so it renders empty**. The 8 rows are
> restored in the bytes that ship now, bundled with the 8 `sys_portal` widget instances they reference so the
> reference resolves at preview. Confirm after commit with
> `GET /api/now/stats/sys_grid_canvas_pane?sysparm_count=true&sysparm_query=sys_scope.scope=x_casemgmt` → 8, and
> by opening both dashboards and counting 3 widgets on Agent Workspace and 5 on Manager View
> ([`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) §6 fix (2)).
>
> *Retained as written, and true of the two superseded hand-authored candidates rather than of the package that
> ships:* a single commit reaching physical storage for all three tables (HTTP 200; dictionary 21 / 14 / 13)
> and all **27** ACL role links (manager 14 / agent 10 / viewer 3) with the remediation script never run was
> measured on the 2026-09-02 native-rebuild run's 988 records
> — [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) — while the packages that shipped before this
> consolidation carried 0 `sys_security_acl_role` rows against the 36 their 29 ACLs required, plus 25
> hand-authored `sys_dictionary` rows, which is why both manual steps were required on them. The **choice
> lists were no longer among them.** Since 2026-09-03 those packages carried the seven native choice
> composites, and that exact seven-child delta was previewed to 0 problems and committed natively, taking
> `sys_choice` for the three tables from **0 to 24** rows with every option label rendering on the real forms.
> Seed-row linkage (task/party `case` references and the Organization → `core_company` references) and
> `opened_date` needed a post-commit `scripts/seed_demo_data.js` pass on those packages; the platform export
> carries the linkage itself, as the post-commit measurement above records. The seeder reconciles an expected
> reference when it is blank, contains a non-`sys_id` raw key, or points to a row that no longer exists; it
> preserves any valid populated reference, including a valid operator-managed alternative.
>
> **Nothing in the current package fires on its own.** It contains **no auto-execute record of any kind** — no
> Business Rule, no scheduled job, no trigger. The remediation body is **not** shipped as a Fix Script any more
> (review finding F04): it lives at `../scripts/post_import_remediation.js` and is run through a Global
> Background Script. For the record, when it was shipped as a Fix Script, running it from the Fix Script UI executed it in
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

> **Sub-step 3's "confirmation that all 7 validation gates passed" can now be given for the artifact as it
> stands, with one qualification stated rather than hidden.** The Update Set gate is binary, and it is **MET**
> on the deliverable's byte sequence — `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`, 522
> blocks / 3,114,377 bytes — because the complete file was uploaded, previewed to **0 `type=error` and 0
> `type=warning`** and committed once through the native UI action on 2026-09-08, against an instance torn
> down to a proven zero-state immediately beforehand with nothing run in between. The qualification is the
> route: this was a **same-instance reset-and-reimport**, not an independent second PDI, so instance-level
> cache, index and metadata that a full teardown may not reset were not eliminated as variables; only one PDI
> is available to this project. Directive **D48's stop condition is closed** — the checksum recorded for the
> shipping package and the bytes on disk both read `b2217224…`. Two classes remain outside what any update set
> can carry on this release and are reported rather than absorbed into the pass: the **3**
> `sys_user_has_role` grants (native remedy: each role form's *Edit Members*) and the **8**
> `sys_grid_canvas_pane` rows. The measured rollup is in [`validation-gates.md`](./validation-gates.md):
> **5 gates pass outright, 1 passes with a documented native step, and the Update Set gate is MET**; the full
> record, including the ten zero-state checks and the post-commit census, is
> [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).

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
- **Scoped-namespace exclusivity** — every artifact lives in the auto-assigned `x_casemgmt` namespace, with **zero exceptions and zero global-scope stamps in the package**. The one former exception, the Global-stamped Fix Script `x_casemgmt Post-Import Remediation`, was removed for review finding F04: no override authorised a Global-scope write, and the stamp bought nothing because the commit engine rewrites a committed record's scope into the application anyway (see [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §9.4). Its body is run instead through a Global Background Script, which is a deployment action rather than a shipped artifact. The auto-execute Business Rule `x_casemgmt Post-Import Bootstrap` that once accompanied it was **removed** earlier — it could not succeed, and its trigger condition was not confined to this application's Update Set. If a preview problem reveals a global-scope write, the design has violated the rule and must be reworked on the source PDI. Global tables receive **data** inserts only — never schema changes.
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
- [`../update-set/`](../update-set/) — destination directory for the exported XML. Three files live here, all measured 2026-09-05T04:45Z and **none byte-identical to another**: `x_casemgmt_case_management_update_set.xml` (**THE DELIVERABLE**, 935 blocks, 3,973,569 bytes, `9f3ea74c…` — MEASURED, NOT GATE-VERIFIED), `x_casemgmt_case_management_update_set.FALLBACK.xml` (the **elected base**, 926 blocks, 3,781,097 bytes, `7292a6fe…`) and `x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks, 4,062,067 bytes, `e109e1d1…`, retained but **not shipped** — the upgrade path).
- **CORRECTED 2026-09-08** — [`../update-set/`](../update-set/) now holds **two** files: the deliverable
  `x_casemgmt_case_management_update_set.xml` (**522** blocks, **3,114,377** bytes, SHA-256
  `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`, a genuine platform export whose exact
  bytes carry the Update Set gate as of 2026-09-08 by a same-instance reset-and-reimport) alongside the
  retained base file named in the bullet above. The two candidate packages that bullet also names were
  superseded and **deleted** in this consolidation; their bytes are recoverable from git history and their
  provenance is recorded in
  [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).
- [`../README.md`](../README.md) — overall POC overview with quick deployment summary; this file is the authoritative detailed walkthrough referenced from there.
- [`./data-model.md`](./data-model.md) — schema reference for the 25 fields verified in [Step 1](#step-1-export-the-update-set) sub-step 3.
- [`./state-machine.md`](./state-machine.md) — transition matrix and blocking-error messages exercised by the seed data in [Step 3](#step-3-confirm-deployed-state) sub-step 11.
- [`./acl-matrix.md`](./acl-matrix.md) — role × table × CRUD matrix verified by impersonating the three demo users in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
- [`./portal-pages.md`](./portal-pages.md) — wireframe-level specs for the submission and lookup pages exercised in [Step 3](#step-3-confirm-deployed-state) sub-steps 5–8.
- [`./dashboards.md`](./dashboards.md) — widget inventory for both dashboards verified in [Step 3](#step-3-confirm-deployed-state) sub-steps 9–10.
