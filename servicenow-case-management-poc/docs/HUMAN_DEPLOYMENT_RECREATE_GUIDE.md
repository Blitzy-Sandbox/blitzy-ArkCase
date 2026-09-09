# Human Deployment Recreate Guide — `x_casemgmt` Case Management POC

> **Audience:** a human ServiceNow administrator who needs to reproduce, from scratch, the working
> deployment of the `x_casemgmt` Case Management scoped application onto a ServiceNow Personal
> Developer Instance (PDI).

> **RELEASE AUTHORIZATION — 2026-09-09 (code review CR4 re-verification, findings F01 / F02 / F05).**
> Running this procedure on the candidate is exactly what Gate 7 asks for, and a clean preview is the
> evidence it produces. It is **not** a release clearance. `update-set/x_casemgmt_case_management_update_set.xml`
> (sha256 `5a3c629f…`, 2,985,822 bytes) stays a **release-blocked candidate** until three blockers are
> closed: **(1)** Gate 7 has never been run on these exact bytes; **(2)** the package knowingly carries 18
> references that resolve only on the source instance — 8 `<snapshot>` and 10 `<block>` values in Flow
> Designer's compiled-plan rows — which only a **re-export from an instance where the application is
> installed and published** closes, and which no preview result discharges; and **(3)** the F02/F05
> corrections were applied as a post-export sanitization stage rather than by a clean-source native export,
> so adopting these bytes as the release artifact is a packaging-stage decision requiring **explicit human
> authorization**. Promote only an identity that has completed Gate 7 under an authorized packaging route.

## CURRENT ARTIFACT STATE — 2026-09-09 (code review CR3, finding F12; identity re-pointed the same day for code review CR4, findings F02 and F05)

**One identity, and it prevails over every other figure in this document.** Earlier revisions of this file
present more than one package as "the deliverable". The eight statements below are what is on disk today and
what is true of it; every identity figure elsewhere in this document is dated provenance of an earlier
revision, and where any of them disagrees with this block, **this block is correct**.

1. **The only shipping artifact is `../update-set/x_casemgmt_case_management_update_set.xml`** — **522** payload
   blocks · **2,985,822** bytes · SHA-256
   **`5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`**. Reproduce it from the repository
   root with `sha256sum servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`.
2. **Status: MEASURED, NOT GATE-VERIFIED.** These exact bytes have never been uploaded, previewed or
   committed on any instance. What backs them is static checking only.
3. **The one gate this project ran did not run on these bytes, and the platform did not report it clean.**
   It ran on 2026-09-08 against a superseded **3,114,377**-byte revision (SHA-256 `b2217224…`, also 522
   blocks): the preview reached **0 `type=error` and 0 `type=warning`**, but the platform's own verdict on
   the single native commit was **"Failed at 100% — the update set commit completed but some updates failed
   to commit"**, with **three** `sys_user_has_role` rows skipped (`permission denied: no thrown error`).
   **No candidate has yet produced a commit the platform reported as clean**, so a "GATE MET" or "GATED"
   label anywhere below describes that attempt and not a clean pass.
4. **No test result covers the shipping bytes.** Neither the 20-test / 180-step ATF suite nor the
   13-assertion transition harness has been run against them. The most recent suite result — **`TES0001006`**,
   created **2026-09-08 22:09:18 UTC**, 20 tests = **4 Success / 16 Failure / 0 Error / 0 Skipped** — and the
   most recent harness pass (`TOTAL=13 PASSED=13 FAILED=0`, 2026-09-08 22:17:27 UTC) both ran against the
   artifacts the gated revision's commit created.
5. **The two candidate packages that older text below still names — `…REBUILT-DEPENDENCY-ORDERED.xml` (988
   blocks) and `…AMENDED-NOT-GATED.xml` (935 blocks) — were deleted on 2026-09-08 and are not on disk.**
   Neither may be an upload, verification or promotion target. Where a sentence below still points at one,
   read it as provenance of a superseded round and nothing else.
6. **The itemised exit-condition verdict, and the procedure that re-gates the shipping bytes**, are in
   [`./refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) §12.
7. This run recorded no property of, and performed **no comparison of any kind against**, any artifact that
   its scope excludes; the identity above comes from item 1 and from nowhere else.
8. **Why item 1's identity differs from the Step 5c export it came from — code review CR4, findings F02 and
   F05.** The canonical package ships the Step 5c gated export with two post-export redactions applied.
   **(F02)** `last_login`, `last_login_time` and `last_login_device` are emptied on the
   `x_casemgmt_demo_agent` and `x_casemgmt_demo_viewer` `sys_user` payloads, removing a routable login-source
   IP and two login timestamps. **(F05)** `sys_created_by` and `sys_updated_by` carry the neutral platform
   service identity `system` in place of the administrator login identifier, in **4,000** places across the
   descriptor, all 522 block wrappers and all 522 payloads, in both the CDATA and the XML-escaped encodings.
   `<payload_hash>` was **cleared** on the 515 blocks that still carried one — the stored value is not a
   recomputable digest, and a redacted payload must not assert a fingerprint of bytes that no longer exist —
   so the file now carries **0** non-empty and **522** empty `<payload_hash>` elements. Verified unchanged by
   the redaction: **522** blocks, **25,518** lines, one descriptor whose `<inserted>` and `<summary>` both
   read **522**, the multiset of all 32-hex tokens (**2,843** distinct — so no `sys_id` and no reference
   moved), `xmllint --noout` clean, and all 522 payloads still parsing individually. **These exact bytes have
   never been previewed or committed on any instance**, so the package remains ungated and Gate 7 remains
   open, exactly as item 2 states. Nothing in §4 or §5 below changes as a result: the digest and byte size to
   check before you upload are item 1's, and the child count to assert is still **522**.

## SUPPORTED INSTALL ROUTE — 2026-09-09 (code review CR3, finding F16)

**One clean commit of the exact candidate bytes, and nothing else.** AAP §0.7.2 requires scoped-namespace
exclusivity with **zero global-scope writes**; the release gate requires **a single clean commit — no second
commit, no remediation script, no live-instance patching**. Both constraints stand unchanged.

- Every passage in this document that tells an operator to run `../scripts/post_import_remediation.js` (or any
  script) from *Scripts - Background* with **"In scope" = Global**, to accept preview collisions, or to
  commit the Update Set a second time, is **⛔ NOT A SUPPORTED STEP**. Those passages are retained as the
  record of what an earlier round did, and each is marked where it appears.
- `../scripts/post_import_remediation.js` and `../scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` stay in the
  repository deliberately — as that record and as the diagnosis of what the superseded packages left short.
  Retention is not a licence to run them, and no gate is satisfied by running them.
- **A shortfall the package leaves is a source-side defect.** Correct it where the package is produced, then
  re-run the full gate on the exact candidate bytes; never patch the instance. The one shortfall the platform
  forces — the **3** `sys_user_has_role` grants, which Role Management V2 refuses from any update set on this
  release — is recorded as a BLOCKED capability gap, not as a step that satisfies a gate. **Those grants are
  the first post-commit action** — §5h, step 7 of the primary procedure — and their acceptance check is a pass
  condition of the §6.1 census (re-ordered 2026-09-09, code review CR5, finding F10).
- **The package does not carry 12 scoped records this repository holds** — 5 business rules, 3 client scripts,
  3 field-level `query_range` ACLs and 1 UI policy — by decision, with the functional consequence and an
  optional native install route stated in **§5i** (added 2026-09-09, code review CR5, finding F02).

> **DELIVERABLE IDENTITY — read this before comparing, verifying or asserting any digest, byte size or block count anywhere in these documents.**
> Re-measured **2026-09-05T04:45Z** from the files on disk (`sha256sum`, `stat -c %s`,
> `grep -c '<sys_update_xml action="INSERT_OR_UPDATE">'`). These three rows are the only identities stated
> here as current fact. Every other digest in this documentation set is either one of the other two retained
> artifacts below or an explicitly dated historical measurement, and is labelled as such where it appears.
>
> | Artifact | Identity, as measured 2026-09-05T04:45Z | Status |
> | --- | --- | --- |
> | `update-set/x_casemgmt_case_management_update_set.xml` — **THE DELIVERABLE, as of 2026-09-09 (CR3 F12)** | **522** `<sys_update_xml>` blocks · **2,985,822** bytes · SHA-256 **`5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`** · 26 `sys_security_acl` + 27 `sys_security_acl_role` · 8 `sys_grid_canvas_pane` · 0 `sys_user_has_role` · `xmllint --noout` clean | **MEASURED, NOT GATE-VERIFIED.** These exact bytes have never been uploaded, previewed or committed on any instance, so **assert 522 children and this digest** when you upload, and expect to be the first to run the gate on them |
> | `update-set/x_casemgmt_case_management_update_set.xml` — **the 2026-09-08 revision; SUPERSEDED 2026-09-09, not the deliverable (CR3 F12)** | **522** `<sys_update_xml>` blocks · **3,114,377** bytes · SHA-256 **`b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4`** · 26 `sys_security_acl` + 27 `sys_security_acl_role` · descriptor `sys_id` `8ebb770493534b1009aa70d19dba102a` · `xmllint --noout` clean | **GATE RUN ON THESE EXACT BYTES 2026-09-08, AND NOT CLEAN — this cell read "GATE MET on these exact bytes"; corrected 2026-09-09 (CR3 F12): the platform reported the commit as "Failed at 100% — the update set commit completed but some updates failed to commit", with three `sys_user_has_role` rows skipped** — a genuine platform export (every block carries a `<payload_hash>`), uploaded to an instance torn down to a recorded zero-state, previewed to 0 `type=error` and 0 `type=warning`, then committed once through the native UI action. A **same-instance reset-and-reimport**, not an independent second PDI |
> | `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — **the elected base** | **926** blocks · **3,781,097** bytes · SHA-256 **`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`** · 26 `sys_security_acl` · `xmllint` clean | Retained. Modified after election by the three commits below, then **restored to the elected bytes 2026-09-05T04:45Z**. Deliberately **no longer** byte-identical to the deliverable — a fallback that tracks the deliverable is not a fallback |
> | The two candidate packages this consolidation superseded — `…REBUILT-DEPENDENCY-ORDERED.xml` (988 blocks · 4,062,067 bytes · `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d`) and `…AMENDED-NOT-GATED.xml` (935 blocks · 3,973,569 bytes · `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`) | **deleted 2026-09-08** | Neither is on disk. The rebuilt package was the baseline the application was rebuilt from before the platform export was captured; both were removed with `git rm`, their bytes remain recoverable from git history, and their provenance is recorded in [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) |
>
> **What the deliverable is: the elected base AS AMENDED. It is NOT byte-identical to `…FALLBACK.xml`.**
> *(Retained as written on 2026-09-05. **CORRECTED 2026-09-08:** that is no longer what the deliverable is.)*
> **Recorded identities belong to the exact bytes they were measured on.** The block count, byte size and
> SHA-256 quoted anywhere in this guide describe the package as gated on 2026-09-08. If the package is
> re-cut for any reason, re-derive all three from the file you actually hold — `sha256sum <file>`,
> `wc -c <file>` and `grep -c '<sys_update_xml ' <file>` — and assert the loaded child count against that,
> never against a number quoted here.
>
> **CR1 AMENDMENT — 2026-09-09. The bytes changed again, and these are the current three:**
> **522** blocks · **2,985,822** bytes · SHA-256
> **`5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`**. Code review checkpoint CR1 removed
> four payloads (the three `sys_user_has_role` records this release refuses — §5h now delivers those grants —
> and the Global-stamped `sys_script_fix` record), added four (the two dashboard-pane bundles restoring the
> eight `sys_grid_canvas_pane` placements, and two scoped `sys_rate_limit_rules` records), hardened the two
> anonymous portal endpoints, and reordered every block into the AAP §0.5.2 dependency tiers. ~~**These bytes
> have not been previewed or committed anywhere**~~ — *(CORRECTED 2026-09-09, code review CR5, finding F01:
> they have. These exact bytes were uploaded, previewed to **0 problems of any type** and committed once on
> 2026-09-09, with the platform reporting `Succeeded 100%` / `Update set committed - Succeeded in 40
> Seconds`, and the ATF suite then scoring 20/20 over 180 of 180 steps. Evidence:*
> *[`refine-run/CR5-REGATE-EVIDENCE.md`](./refine-run/CR5-REGATE-EVIDENCE.md).* *That was a same-instance
> reset-and-reimport, so it does not relieve you of running the gate on **your** instance)* — run the
> upload → preview → zero-problem gate in
> [`deployment.md`](./deployment.md) Step 2 before committing, then §5h immediately after. Full ledger:
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) §0.CR1.
>
> **What the deliverable was before that amendment: the consolidated, platform-exported package in the table
> above — 522 blocks / 3,114,377 bytes / `b2217224…`.** One commit of it on an empty instance lands the physical schema, the three
> roles, 26 scoped ACLs with **27** role links (manager 14 / agent 10 / viewer 3), the **24** choice values, 7
> active flows, 8 reports, 2 dashboards, the portal with 2 public pages and 3 widgets, 2 anonymous REST
> endpoints, the ATF suite and the demo rows 10 / 10 / 8 with their linkage resolving — measured with no script
> run and no second commit. The one native step left is the **3** `sys_user_has_role` grants, created on each
> role form's *Edit Members* related list. Full record: [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).
> OVERRIDE-2 / directive D3 elected the untouched original package — `7292a6fe…`, 926 blocks, 3,781,097 bytes —
> as the shipping **base** at commit `3671901b5b`. Three later authorized remediation passes then amended those
> bytes in place: `f8454fb078` (choice materialization and seed references), `6efb13b141` (18 QA findings) and
> `8dfdbcb015` (independent-verification remediation). Between them they added **4** Business Rules, **1** Client
> Script, **3** field-level `query_range` ACLs and **1** Form Layout record, and renamed the **7** `sys_choice`
> payloads to `sys_choice_x_casemgmt_*` — a net **+9** payloads over the base, with **919** payload names in
> common. Every addition is the accepted resolution of an earlier QA round, which is why the deliverable was
> **not** reverted to the base. Package-payload counts move with it: **29** `sys_security_acl` payloads where the
> base has 26, and **11** `sys_script` Business Rules where the base has 7. `scripts/post_import_remediation.js`
> is therefore keyed to **36** ACL → role links (manager 17 / agent 13 / viewer 6) for this package, where the
> base's 26 ACLs need **27** (manager 14 / agent 10 / viewer 3). Those are two different packages, not two
> readings of one.
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
> ⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16.** The paragraph immediately below directs a **Global**-scope remediation run and a **second
> commit**. It violates AAP §0.7.2's zero-global-write constraint and the single-clean-commit gate ("no second commit, no remediation script, no live-instance patching"); it is retained only as a record of what an earlier round did on the two superseded hand-authored candidates. A shortfall the package leaves is a source-side defect: correct the package where it is produced and re-run the full gate on the exact candidate bytes — see SUPPORTED INSTALL ROUTE at the top of this guide.
>
> **What an importer must still do, and what is still unmet.** A bare commit of the deliverable on a clean
> instance is **not** sufficient. Measured on the shipping file: **0** `sys_documentation` rows, **0**
> `sys_security_acl_role` rows and **25** hand-authored `sys_dictionary` rows with random-32-hex update names. So
> the commit leaves the three scoped tables **without physical storage** and the ACLs **without role links**. Run
> `scripts/post_import_remediation.js` in **Global** scope after the commit, commit a second time, run it again,
> then seed with `scripts/seed_demo_data.js`. AAP §0.7.1 / Gate 7 — the zero-preview-error round trip — is
> **UNMET** for these bytes, and directive **D48's stop condition is LIVE and has been raised and reported**: the
> checksum recorded for the shipping package was `7292a6fe…` and the bytes are `9f3ea74c…`. Both remedies are
> **human-gated**: **(a)** restore the elected bytes to the deliverable path — now a plain file copy from the
> restored `…FALLBACK.xml` — at the cost of dropping the three remediation passes from the shipped package; or
> **(b)** run the full gate on `9f3ea74c…` against a genuinely clean, dedicated PDI, which is **unavailable** on
> two measurements: no clean PDI is provisioned (the single instance `dev306625` holds this application committed,
> converged and seeded), and the deliverable's own descriptor `sys_id` `9929f50df18ccec91ea13b2a3bccfc90` is an
> **already-committed** retrieved set on that instance, so an upload there would reuse that row and append 935
> children to the committed evidence. The full record is `docs/refine-run/run-state.json`
> `final.d48_stop_condition` and `final.artifact_identity_ledger`.
>
> **CORRECTED 2026-09-08 — the paragraph above is retained as written and describes the package that shipped
> before the Update Set consolidation.** On the export that ships now, a single commit is sufficient for
> everything an update set can carry: physical storage for all three tables (`sys_dictionary` and
> `sys_documentation` 21 / 14 / 13 each), 26 scoped ACLs with **27** role links, **24** `sys_choice` values, 3
> `sys_number` counters and the demo rows with their linkage, all measured after one commit with no
> remediation script and no second commit. AAP §0.7.1 / Gate 7 was recorded as **MET** on those bytes by a
> same-instance reset-and-reimport — **a verdict withdrawn 2026-09-09 (CR3 F12): the platform reported that
> commit as *Failed at 100%* with three `sys_user_has_role` rows skipped, and the bytes that ship now
> (2,985,822 / `5a3c629f…`) have never been uploaded, previewed or committed** — the route being — the single instance was emptied to a recorded zero-state, the exact bytes were uploaded,
> previewed to 0 problems of any type and committed once — with the residual risk named rather than waved
> away: instance-level cache, index, retained update history and metadata a scope teardown does not reach were
> neither re-created nor tested, and **the pre-commit zero-state is *recorded* rather than proven** (corrected
> 2026-09-09, CR2 finding F06) — its ten checks ran and their normalized results were transcribed, but the
> verbatim requests, statuses and bodies for that pre-commit pass are not retained here, so that precondition
> cannot now be independently re-verified. The preview-and-commit measurements themselves are evidenced and
> unchanged. That is what "recorded zero-state" means throughout this guide. Directive **D48's identity comparison is settled outright**: the recorded
> checksum and the bytes both read `b2217224…`. What remains manual is the **3** `sys_user_has_role` grants
> and the **8** `sys_grid_canvas_pane` rows, neither of which any update set carries on this release.
>
> **There is no longer a rebuilt package to promote: the consolidation superseded and deleted it.**
> `…REBUILT-DEPENDENCY-ORDERED.xml` carried the platform-captured `sys_db_object` and `sys_dictionary` records
> directives D2/D21 ordered — **30** platform-named `sys_dictionary` rows, **30** `sys_documentation` rows and
> all **27** `sys_security_acl_role` links — and every AAP §0.5.2 dependency assertion passed on it, which is
> why the consolidation used it as the **baseline it rebuilt the application from**: the application was
> reinstalled from those records, the two post-rebuild fixes were applied (the 24 native `sys_choice` values
> and the case/task/party linkage), and the platform captured and exported the result as the 522-block package
> that shipped from 2026-09-08 until the CR1 amendments and that was gated on its own bytes — a gate whose
> commit the platform reported as *Failed at 100%*, on bytes since superseded by the ungated 2,985,822-byte
> `5a3c629f…` file (CR3 F12). The deleted candidate's identity was **`e109e1d1…` over
> 4,062,067 bytes**, which superseded `90ee0249…` over 4,062,436 bytes; neither matches any file in this tree,
> so any instruction still quoting either would send an operator to a checksum they cannot reproduce, and they
> would correctly abort. Provenance for both deleted candidates: [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).
> **[CR3 2026-09-09 · F15 — WITHDRAWN AS EVIDENCE.** The block immediately above records a byte-comparison result against an artifact this project's scope excludes. That assertion is **not evidence** about the package that ships and must not be relied upon for any check, digest or decision: the shipping identity is the one published in CURRENT ARTIFACT STATE at the top of this document, established from the canonical path alone. This correction performed no comparison of any kind and records none. The wording above is left unaltered because the text of such a line may not be edited.**]

> **Why this guide exists:** the deliverable Update Set XML
> (`servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml`) does **not**
> deploy to a fully-functional state by upload-preview-commit alone. The ServiceNow platform and several
> code-generation defects require a sequence of **post-import remediation steps** to obtain a working
> application. This guide documents the exact, reproducible procedure that was used to bring the PDI to a
> working state, including every remediation.
>
> **Companion documents:**
> - `docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` — *why* each remediation is needed (root cause of every defect/limitation).
> - `docs/WORKFLOW_TRYOUT_GUIDE.md` — how to exercise the deployed application as the demo users.
> - `docs/deployment.md` — the deliverable's original (idealized) export/preview/commit walkthrough.

> ### ⚠️ Read this before following §5 — the install is a two-commit, two-script procedure
>
> **CORRECTED 2026-09-08 — this whole procedure is no longer in force on the package that ships; and see the
> SUPPORTED INSTALL ROUTE block at the top of this guide, which makes its Global-scope steps and its second
> commit non-executable (CR3 F16).** The measurements below were taken on the superseded 2026-09-08 revision
> (`b2217224…`); the shipping bytes are 2,985,822 / `5a3c629f…` and carry the same schema, role-link and choice
> payloads but have never been committed anywhere (CR3 F12). The
> consolidated 522-block platform export (`b2217224…`) carries the platform-captured schema records, the 27
> ACL role links and the 24 choice values in its own payloads, so a **single** upload → preview → commit
> produces a working application: measured on 2026-09-08 with no script run and no second commit — three
> tables with physical storage (`sys_dictionary` and `sys_documentation` 21 / 14 / 13 each, REST HTTP 200),
> 26 scoped ACLs with 27 links (manager 14 / agent 10 / viewer 3), 24 `sys_choice` values, 3 `sys_number`
> counters, 7 active flows, 8 reports, 2 dashboards, the portal and its 2 public pages, 2 anonymous REST
> endpoints, the ATF suite and the demo rows 10 / 10 / 8 with their linkage resolving. §5 below therefore
> reduces to **one** native step on that package: create the 3 `sys_user_has_role` grants on each role form's
> *Edit Members* related list (Role Management V2 refuses them from any update set on this release); the 8
> `sys_grid_canvas_pane` rows behind the dashboard canvases are likewise not application files. The
> two-commit, two-script procedure below remains the correct procedure for the two superseded hand-authored
> candidate packages, which this consolidation deleted, and is retained as written for that reason.
> Full record: [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md).
>
> **Updated 2026-09-03 — read this before the summary below. The delivery election has been made, and it puts
> this whole procedure back in force, with one step removed from it: the choice rows now come out of the
> commit.** A rebuilt deliverable was produced in which the table,
> dictionary and role-link records are the platform's own captured records, and a **single** upload → preview →
> commit of those 988 records — measured on **export 3's byte sequence,
> 988 blocks / 4,062,436 bytes / SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`**,
> `2026-09-02T20:53:14Z` — did produce, on a clean instance:
> three tables with physical storage (21 / 14 / 13 columns, REST HTTP 200) and **all 27 ACL role
> links** (manager 14 / agent 10 / viewer 3) — with `post_import_remediation.js` **never run** and **no second
> commit**, from a preview carrying 0 `type=error` and 0 `type=warning` problems. **That package is retained
> rather than shipped**, at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`
> (988 blocks / 4,062,067 bytes / SHA-256
> `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` — the §0.5.2-reordered sequence
> `90ee0249…` as re-cut at commit `f8454fb078` with the seven native choice composites — `90ee0249…` /
> 4,062,436 matches no file in this tree, so verify against `e109e1d1…` / 4,062,067 and nothing else — whose own
> complete round trip has never been run); it was described here as the **available upgrade path**, with §5 run **[CR3 2026-09-09 · F13 — NOT A TARGET: the package named here was deleted on 2026-09-08, is not on disk, and may not be uploaded, verified, gated, selected or promoted; no 988- or 935-child count may be asserted. The only such target is `update-set/x_casemgmt_case_management_update_set.xml` — 522 blocks / 2,985,822 bytes / `5a3c629f…`, itself ungated. Retained as provenance only.]**
> against it — verifying `e109e1d1…` over 4,062,067 bytes and
> asserting
> **988** children — as what would make it shippable and promotable back to the deliverable path, after first
> carrying across the 9 payloads the three post-election passes added to the deliverable and that this package
> does not hold. **[CR3 2026-09-09 · F13 — NOT A TARGET: that file was deleted on 2026-09-08, is not on disk, and there is no promotion to perform. The only upload, verification or promotion target is `update-set/x_casemgmt_case_management_update_set.xml` — 522 children, SHA-256 `5a3c629f…`.]**
> **What ships is the elected base AS AMENDED** — OVERRIDE-2 elected the untouched original as the shipping
> *base* because the exact-byte
> gate could not be completed on any instance available to that run, and three later remediation passes
> (`f8454fb078`, `6efb13b141`, `8dfdbcb015`) amended those bytes in place for a net +9 payloads. It is **NOT**
> byte-identical to `…FALLBACK.xml`, which retains the base itself. **So Defects C-storage and 9 are manual
> steps again:** the shipping file carries **29 `sys_security_acl` payloads, 0 `sys_security_acl_role` rows** and
> the 25 hand-authored
> `sys_dictionary` rows, so §5 below — including its two remediation passes that create the **36** role links
> (manager 17 / agent 13 / viewer 6; the 26-ACL base needs 27, split 14 / 10 / 3) — is
> **required as written**, and the child count to assert on upload is **935**, not 988 and not 926. **[CR3 2026-09-09 · F13 — NOT A TARGET: the 935-block and 988-block packages were deleted on 2026-09-08 and are not on disk. The only child count to assert is **522**, on `update-set/x_casemgmt_case_management_update_set.xml` (2,985,822 bytes / `5a3c629f…`, itself ungated). Retained as provenance only.]**
> **[CORRECTED 2026-09-09 · CR3 F12 — dated, not current: the count to assert is 522 and the digest to check is
> `5a3c629f…`; the 935-block package this paragraph describes was superseded and deleted on 2026-09-08, and the
> two remediation passes it calls for are not a supported step (see SUPPORTED INSTALL ROUTE at the top).]** **The choice rows are no
> longer a post-commit step on either package.** Both carry seven platform-native choice composites — a
> canonical `sys_choice_<table>_<field>` block per field holding one `x_casemgmt`-owned `sys_choice_set` with the
> authored value rows nested inside, 24 values in all — and that exact seven-child delta was uploaded, previewed
> to **0 problems of any type** and committed by the native commit action on 2026-09-03, after which `sys_choice`
> for the three tables went from **0 to 24** rows and all seven fields rendered their exact option labels on the
> real forms ([`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3d](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) is the full
> record). What still needs a post-commit
> step on either package: the seed-row linkage and
> `opened_date`, via `scripts/seed_demo_data.js` in scope. Evidence, including the commit counters
> and every post-commit query: [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md). **The summary and
> the §5 procedure below are the procedure for the shipping deliverable,**
> `update-set/x_casemgmt_case_management_update_set.xml` — byte-identical to
> `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — and for any older revision.
>
> **On the shipping package: upload → preview → commit does not give you a working application.** §5
> sets out the required sequence in full; this is the summary:
>
> - **Defects E (auto-numbering) and 7 (REST `service_id`) genuinely need nothing.** They are carried by the
>   package artifacts. Their sections are verification only.
> - **Defects C (physical schema) and 9 (the 36 ACL role links) require manual steps every time.** **Nothing in
>   the package fires on its own** — it contains no auto-execute record of any kind. An earlier revision shipped
>   a global Business Rule (`x_casemgmt Post-Import Bootstrap`) that dispatched the remediation on commit; it
>   **fired and then failed** with `SUMMARY|verified=false|…|errors=121`, every error being
>   `GlideTableDescriptor is not allowed in scoped applications` or `GlideSecurityManager is not allowed in
>   scoped applications`, because the commit engine forces the dispatched record's `sys_scope` to the
>   application and those APIs are refused in scoped execution. Shipping the script as global does not avoid
>   that. **The rule has since been removed from the package** — it could never succeed, and its condition
>   matched the commit of *any* retrieved Update Set, so it would have dispatched privileged, partly
>   destructive remediation onto unrelated deployments. **The remediation body does not ship inside the package
>   either — there is no Fix Script record to run.** The package carries no `sys_script_fix` payload at all, for
>   two measured reasons: an installed Fix Script cannot complete the work whatever it is stamped (the commit
>   engine rewrites its `sys_scope` to the application, so *System Definition → Fix Scripts → Run Fix Script*
>   fails identically with `errors=121`), and shipping it would put a Run button on a privileged, partly
>   destructive remediation whose only possible outcome for a recipient is those 121 errors.
> - ⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16.** **This bullet read "The single documented route is a background script in Global — *System
>   Definition → **Scripts - Background*** with "In scope" = Global, running
>   `scripts/post_import_remediation.js`. That is the only route measured to work and the only one this guide
>   prescribes."** It prescribes nothing now. It violates AAP §0.7.2's zero-global-write constraint and the single-clean-commit gate ("no second commit, no remediation script, no live-instance patching"); it is retained only as a record of what an earlier round did on the two superseded hand-authored candidates. A shortfall the package leaves is a source-side defect: correct the package where it is produced and re-run the full gate on the exact candidate bytes — see SUPPORTED INSTALL ROUTE at the top of this guide.
>   `scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` is retained in the repository as the Fix
>   Script's **reference record-definition** — reviewable, `x_casemgmt`-stamped, not shipped, and not an
>   execution route. Its embedded copy of the body has drifted from
>   `scripts/post_import_remediation.js`; that file is the single source of truth and the only thing to paste.
> - ⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16.** **This bullet read "A second commit is required."** Forcing the table rebuild meant deleting
>   three `sys_db_object` rows, which cascades away all 29 ACLs, the seed rows, the demo users and the role
>   grants; a second commit restored them, and the remediation then had to be run **again** to create the 36
>   ACL role links. That is the measured behaviour of the superseded procedure and the reason it can never
>   satisfy the gate. It violates AAP §0.7.2's zero-global-write constraint and the single-clean-commit gate ("no second commit, no remediation script, no live-instance patching"); it is retained only as a record of what an earlier round did on the two superseded hand-authored candidates. A shortfall the package leaves is a source-side defect: correct the package where it is produced and re-run the full gate on the exact candidate bytes — see SUPPORTED INSTALL ROUTE at the top of this guide.
> - **The demo data needs one script run, but no longer needs preparation.** An earlier revision of this bullet
>   said the packaged seed rows had to be **deleted** first; that is no longer true. Every seed row now carries a
>   pinned number in the 9,000,000 band, and `scripts/seed_demo_data.js` **adopts** the packaged row by that
>   number. For each expected reference it fills a blank value, repairs a non-`sys_id` raw key or a dangling
>   `sys_id`, and preserves a valid populated reference, including an operator-managed alternative. It also
>   guarantees `opened_date` on every adopted or inserted case while preserving the two explicit historical date
>   overrides. Run it in scope `x_casemgmt`; a second run must report `repaired=0`.
> - **The three demo-persona role grants are a mandatory manual step, and not because of a packaging choice.**
>   `sys_user_has_role` is owned by Role Management V2 on this release, so the update-set loader refuses the
>   table and the commit silently **skips** any such payload ("permission denied: no thrown error") — measured
>   with the payloads stamped Global *and* `x_casemgmt`. The package therefore carries **no `sys_user_has_role`
>   payload at all**, and §5h makes the three grants through the platform's own **Edit Members** slushbucket.
>   Until it is done, every persona holds no role: §6.3 reports `F/F/F/F` and the ATF suite fails at its first
>   persona step.
>
> **The three items this guide used to warn it could not remediate are all fixed in the package.** They are
> recorded here because earlier revisions of this note named them as live defects, and because each one was a
> packaging defect rather than an instance problem — so if you are installing from an older export you will still
> meet them:
>
> - **The two dashboards** installed but rendered 0 tabs and 0 widgets, because each artifact named three child
>   tables this release does not have (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`). Both are now
>   authored onto the real chain — `sys_portal_page`, `sys_grid_canvas`, `pa_tabs`, `pa_m2m_dashboard_tabs`,
>   `pa_dashboards` with `restrict_to_roles`, `pa_dashboards_permissions` share rows, and one `sys_portal` +
>   `sys_portal_preferences` + `sys_grid_canvas_pane` trio per widget. Agent Workspace renders **3 of 3** widgets
>   and Manager View **5 of 5**, verified for the manager and agent personas.
> - **The case form had no related lists.** The package now ships
>   `related_lists/sys_ui_related_list_x_casemgmt_case_default.xml` and the form renders *Case Tasks* above
>   *Case Parties* with their child rows. ⚠️ **One install step applies to this and to nothing else:** on an
>   instance that rendered the case form *before* the definition arrived, the server's cached related-list set
>   keeps the form empty. Open a case → context menu → **Configure ▸ Related Lists** → press **Save** with
>   nothing moved. See `deployment.md` step 12 and register §4 item 17.
> - **The chart reports arrived with no grouping column.** `group_by` is **not a column** on `sys_report` on this
>   release, so the element was discarded on import; the column a chart groups on is `field`. All four chart
>   reports now ship `field`, and all eight ship `roles` plus `user=GLOBAL` — the second being a separate gate
>   without which no persona can read a report at all (register §0.6.1).
>
> The portal **pages** were a fourth item and were fixed earlier — their Service Portal layout records are
> authored and packaged, and a response-envelope bug in both widgets was corrected, so both pages render and work
> anonymously.
>
> The same procedure with its measured evidence, per defect, is
> **[`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.5](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md#95-residual-manual-footprint-per-defect-with-the-precise-step)**.
>
> *Previously reported here and now fixed in the package: all three tables used to arrive with `display=true`
> on nearly every column, which made every reference to a case render blank until reduced by hand. The package
> now ships exactly one display field per table and the remediation verifies it.*
> **[CR3 2026-09-09 · F15 — WITHDRAWN AS EVIDENCE.** The block immediately above records a byte-comparison result against an artifact this project's scope excludes. That assertion is **not evidence** about the package that ships and must not be relied upon for any check, digest or decision: the shipping identity is the one published in CURRENT ARTIFACT STATE at the top of this document, established from the canonical path alone. This correction performed no comparison of any kind and records none. The wording above is left unaltered because the text of such a line may not be edited.**]


---

## 0. Outcome you should expect

After completing this guide, on the instance you targeted — the current validation instance is
`https://dev306625.service-now.com` — you will have:

- Scoped application **`x_casemgmt` ("Case Management")** with a single scope/`sys_app` record (`sys_id 82b99028936f74320d74d6f88357a5af` on the current validation instance — that is a **measured value, not an input**: on any instance, yours included, resolve it with `GET /api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=sys_id` rather than reusing the literal).
- **3 physical tables**: `x_casemgmt_case` (with auto-number `CASE0000001`), `x_casemgmt_case_task`, `x_casemgmt_case_party`, each with all dictionary fields and choice lists.
- **3 roles**: `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`. The roles themselves arrive in the package; the **three demo-persona grants of those roles do not** and are made post-commit per §5h, which is the **first** post-commit action (step 7 of the primary procedure) — the commit cannot install them on this release.
- **29 ACLs + 36 role-link records** enforcing the role × CRUD matrix (manager full / agent assigned-only / viewer read-only). 26 of the ACLs are AAP §0.5.6's table-level and field-level set; the other 3 are field-level `query_range` grants on `case.opened_date`, `case.closed_date` and `case_task.due_date`, granted to all three roles so a date RANGE filter may participate in the query — which rows come back is still decided by each role's read ACL. The remediation script resolves those three ACLs' `operation` reference by name, since §0.7.2 forbids shipping the operation's sys_id.
- **11 business rules** — in execution order on `x_casemgmt_case`: **`validate_case_mandatory_fields` (50, before-insert + update)** — refuses an empty `subject`, `description` or `requester_name` and names the offending field, which is what stops the Table API from creating a blank shell — **`validate_case_text_lengths` (70)**, `block_terminal_closed` (100, before-update), `set_opened_date` (100, before-insert), `block_draft_backtransition` (200), **`enforce_forward_transitions` (250)** — the one that runs the transition subflow and raises the blocking form error — `validate_assigned_agent_membership` (300, insert + update), `clear_pending_reason_on_inprogress` (400), and `set_closed_date` (500), the only writer of `closed_date`. Plus one on each child table at order 100: **`validate_case_task_integrity`** (task must carry its parent case, subject, assigned_to and due_date) and **`validate_case_party_integrity`** (exactly one of `person`/`organization`, matching `party_type`, per AAP §0.5.7's Conditional rows). The four order-50/70/100-on-children rules exist because a UI Policy cannot reach a REST caller: they enforce the data contract on every write path.
- **7 Flow Designer flows** — 2 parent flows (`general_inquiry_state_machine`, `complaint_state_machine`) and 5 subflows (`validate_open_transition`, `validate_in_progress_transition`, `validate_pending_transition`, `validate_resolved_transition`, `validate_closed_transition`) — plus **1 Custom Action** (`x_casemgmt_transition_guard_action`) and **1 shared flow logic block**.
- **2 Script Includes** (`CaseTransitionValidator`, `CasePortalService`), **2 scripted REST services** (anonymous case submit + status lookup), **8 reports**, **2 dashboards** (Agent Workspace with 3 widgets, Manager View with 5 — both rendering), **1 Experience/Service Portal** with 2 pages and 3 widgets, **2 UI policies** with their 2 policy actions, **6 UI Actions**, **1 List Layout**, **1 Related Lists definition** and **1 Form Layout section** (single-column, in AAP §0.4.4's field order — which is also what makes the keyboard tab order follow the visual order) on the case table's Default view, **1 Client Script** (`x_casemgmt_case_flush_stale_messages`, onLoad — clears a stale mandatory-field banner once the named field is filled), and **number counters**.
- **No Fix Script, and no auto-execute record of any kind.** The package deliberately carries no `sys_script_fix` payload: an installed copy cannot complete the remediation (the commit engine rewrites its scope to the application, measured `errors=121`) and it would offer a Run button on a privileged, partly destructive script. This bullet then read "The remediation is run as a Global background script per §5" — ⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16.** It violates AAP §0.7.2's zero-global-write constraint and the single-clean-commit gate ("no second commit, no remediation script, no live-instance patching"); it is retained only as a record of what an earlier round did. A shortfall the package leaves is a source-side defect: correct the package where it is produced and re-run the full gate on the exact candidate bytes.  `scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` is the retained reference record-definition, not an installed record.
- **10 demo cases** covering all six statuses and both case types, demo tasks, demo parties, and 3 demo users (one per role). **The packaged rows now carry pinned, deterministic numbers** — `CASE9000001`-`CASE9000010`, `TASK9000001`-`TASK9000010`, `PARTY9000001`-`PARTY9000008` — chosen in the 9,000,000 band so they cannot collide with counter-issued numbers, and `scripts/seed_demo_data.js` adopts those rows rather than inserting duplicates, so a committed install is number-identical to any other. **Numbers differ from the pinned set only if you seed WITHOUT committing the package** (the script then inserts fresh rows and the instance counter allocates the numbers) or if you delete the packaged rows before seeding — which you should not do. The numbers `CASE0000013`-`CASE0000022` quoted in older revisions of this guide were simply what one counter-allocated run produced.

> **What the package cannot carry across instances, beyond the role grants — the CR4 F01 portability
> capability gap.** An Update Set serializes every reference column as the target record's 32-character
> `sys_id`, and the format has no natural-key encoding, so AAP §0.7.2's literal "no hardcoded `sys_id` in any
> reference field" is unsatisfiable by the artifact format itself; it is reported as a capability gap rather
> than worked around, and the register entry is
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) (code review CR4, finding
> F01). Measured on the shipping bytes: every reference to an application record resolves to a record the
> same package carries, so nothing in the application can misbind on your instance; and exactly **18**
> references — 8 `<snapshot>` and 10 `<block>` inside Flow Designer's platform-generated compiled-plan rows —
> point at rows that exist only on the source instance and will not resolve on yours. That residue closes
> only by re-exporting the application from an instance where it is installed and published and then
> re-running Gate 7, so treat it as open: no gate passes on it. The flows themselves are carried by their own
> `sys_hub_flow` payloads and are verified after commit the way §6.1 describes, not by the compiled plans.

> **The flows work — an earlier revision of this guide said they did not, and that is now out of date.** All
> **7 flows are `active=true` and `status=published`** on the verification instance (last measured directly
> against `sys_hub_flow`), and every forward-transition precondition **is** enforced at runtime. The
> enforcement path is worth knowing before you troubleshoot anything: the before-update Business Rule
> `x_casemgmt_enforce_forward_transitions` (**order 250**) invokes the matching subflow through the Flow API,
> receives an `{ok, error}` verdict, and on a refusal calls `gs.addErrorMessage()` and `setAbortAction(true)` —
> which is what puts the blocking message on the form and prevents the write. The flows hold the decision
> logic; the Business Rule is what makes it blocking. The earlier "dead shells" state (Defect F in
> `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`) was a real observation on a previous revision and is recorded there as
> history.

---

## 1. Prerequisites

| Item | Value / Requirement |
|---|---|
| Target instance | **The current validation instance is `https://dev306625.service-now.com`, release Zurich Patch 10** (`glide-zurich-07-01-2025__patch10-05-22-2026_06-12-2026_2311`, read from `sys_properties.glide.war` over the Table API on 2026-09-03). The application is installed and committed there, and on 2026-09-02 the upload → preview → commit half of this procedure was executed on it — on export 3's byte sequence, not on either file now on disk (see the Deliverable row). **The full procedure as written was executed end to end on `https://dev379024.service-now.com`, release Australia Patch 3** — a host that is now **retired and is not used**, so its figures stand as dated evidence from it and never as current state. Those are the only two instances and the only two releases this procedure has been executed against, and only the Australia Patch 3 execution covered every step. It is *expected* to work on any PDI from Zurich onward, because it uses no release-specific API — but for the steps outside that measured half that is an expectation, not a measurement. On any other instance or release, treat every step as requiring revalidation, and in particular re-check the three Performance Analytics child table names (`pa_tabs`, `pa_widgets`, and whatever this release calls the dashboard-to-role link), which are exactly what the dashboard defect turns on. |
| Admin account | `admin` role required (full `security_admin` elevation available) |
| Tools | `curl`, `python3`, a text editor. (Or just a browser for the UI path.) |
| Deliverable | **Updated 2026-09-05 — the delivery election is made, the choice payloads have been fixed, and three later remediation passes have amended the elected bytes:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` is the **elected base AS AMENDED**. OVERRIDE-2 elected the untouched original as the shipping *base* because the exact-byte gate could not be completed on any instance available to that run; commits `f8454fb078` (choice materialization), `6efb13b141` (18 QA findings) and `8dfdbcb015` (independent-verification remediation) then amended those bytes in place, adding 4 Business Rules, 1 Client Script, 3 field-level `query_range` ACLs and 1 Form Layout record and renaming the 7 `sys_choice` payloads — net **+9** payloads, **919** payload names in common. It is therefore **NOT** byte-identical to `…FALLBACK.xml`, which retains the elected base itself (`7292a6fe…`, 926 blocks, 3,781,097 bytes, restored 2026-09-05T04:45Z). **`9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9` is the digest to check before you upload**, over a **3,973,569-byte, 935-block** file, and **935 is the child count to assert** in §4. The superseded digests, for recognising an older copy, are `a9204411…` over 3,780,373 bytes (commit `f8454fb078`) and `4e28acae…` over 3,944,374 bytes (commit `6efb13b141`) — **neither is on disk** — and `7292a6fe…` over 3,781,097 bytes, which **is** on disk but as the elected base at `…FALLBACK.xml`, not as the deliverable. **Read the deliverable's status before you plan around it: it is MEASURED (2026-09-05T04:45Z), NOT GATE-VERIFIED. The AAP §0.7.1 Update Set gate is binary and it is NOT MET on these bytes — no preview of the complete file was ever run on them — so the artifact is not verified by round trip; running §5 against it is what closes that gate. Directive D48's stop condition is live as well: the checksum recorded for the shipping package was `7292a6fe…` and the bytes are `9f3ea74c…`, and both remedies — restoring the elected bytes from `…FALLBACK.xml`, or running §5 on a genuinely clean dedicated PDI — are human-gated.** The seven choice children are the exception and the only one: uploaded as their own delta on 2026-09-03, previewed to **0 problems of any type**, committed by the native commit action, `sys_choice` **0 → 24** with all seven fields rendering their exact option labels — so **§5a's choice-row work is no longer needed** and the choices come out of the commit. And know what it does not carry: measured on the file, **0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25 hand-authored `sys_dictionary` rows**, so the **36** ACL role links for its **29** `sys_security_acl` payloads (manager 17 / agent 13 / viewer 6) are **not in the package** and §5's remediation passes must create them. The 26-ACL elected base at `…FALLBACK.xml` needs 27 instead, split manager 14 / agent 10 / viewer 3 — two different packages, not two readings of one. **The rebuilt package is retained, not shipped**, at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`: UTF-8, no BOM, **4,062,067 bytes (≈3.87 MiB)**, **988 `<sys_update_xml>` blocks**, SHA-256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` — the same file that was `90ee0249…` over 4,062,436 bytes before the choice-materialization fix at commit `f8454fb078`. **`e109e1d1…` / 4,062,067 is what you will measure; `90ee0249…` / 4,062,436 matches no file in this tree, so an instruction quoting it would send you to a checksum you cannot reproduce.** It satisfies AAP §0.5.2 dependency ordering and carries the platform-captured schema records and all 27 role links, and it is the **available upgrade path** — run §5 against it asserting **988** children on a genuinely clean PDI and it can be promoted back to the deliverable path (§10.0 of [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)). Its 988 records are the records that were previewed and committed on 2026-09-02 — but that was measured on **export 3's byte sequence, SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** (the same 988 records at the same byte count), because the file was afterwards re-sequenced into AAP §0.5.2 dependency order. The reordered file was verified statically (`xmllint --noout` clean, 988 blocks, every §0.5.2 dependency assertion passing, 981 of its 988 children byte-identical to the previewed bytes and the other 7 being the natively previewed-and-committed choice composites) rather than by a further upload or preview of the whole file, so **the upload → preview → commit trip on its complete bytes has never been run either.** The deliverable's own figures, measured 2026-09-05T04:45Z: UTF-8, no BOM, **3,973,569 bytes (≈3.79 MiB)**, **935 `<sys_update_xml>` blocks** behind 1 `<sys_remote_update_set>` descriptor (`sys_id` `9929f50df18ccec91ea13b2a3bccfc90`), SHA-256 `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9` — the QA-findings pass inserted 9 blocks and the follow-up remediation pass re-cut 7 payloads without changing the count. **Verify the digest before uploading** — this row has named four different revisions over the project's life and the wrong one will send you looking for defects that are already fixed. The revision before this one was 935 blocks / 3,944,374 bytes / `4e28acae…` (commit `6efb13b141`), before that 926 blocks / 3,780,373 bytes / `a9204411…` (commit `f8454fb078`), before that the elected base 926 blocks / 3,781,097 bytes / `7292a6fe…`, and before that 925 blocks / 3,698,577 bytes / `e49a7654…`; the QA-findings pass re-synced 13 payloads (8 `sys_report`, 2 `Dashboard`, 3 `sp_widget`) and added 1 block (the case form's Related Lists definition), and the 2026-09-03 pass replaced the seven choice children. Note that **no update-set preview has been run on the complete file** — see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3c. (Older revisions of this row said "~768 KB, 148 `sys_update_xml`"; that predates the ATF suite, which alone accounts for **761** of the 935 blocks.) |
| Deliverable — **corrected 2026-09-08, superseded 2026-09-09 (CR3 F12)** | The row above is retained as written. The deliverable is the platform export at `update-set/x_casemgmt_case_management_update_set.xml` at **522** blocks, **2,985,822** bytes, SHA-256 **`5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`** — **MEASURED, NOT GATE-VERIFIED**: never uploaded, previewed or committed. *This row read "**522** blocks, **3,114,377** bytes, SHA-256 `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` — whose exact bytes carry the AAP §0.7.1 Update Set gate as of 2026-09-08 (0 `type=error` / 0 `type=warning` preview from a recorded zero-state, then one native commit), by a same-instance reset-and-reimport rather than an independent second PDI"; that is the superseded revision, and the platform reported its commit as* **Failed at 100%** *with three `sys_user_has_role` rows skipped.* A single commit of it needs no remediation script; only the 3 `sys_user_has_role` grants are created natively afterwards. [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) |
| — | **[CR3 2026-09-09 · F13 — NOT A TARGET.** The two rows above tell an operator to check a `9f3ea74c…` digest, to assert **935** children, and to run §5 against a 988-block "available upgrade path" that could then be promoted to the canonical path. Both packages those instructions name (`…AMENDED-NOT-GATED.xml`, 935 blocks, and `…REBUILT-DEPENDENCY-ORDERED.xml`, 988 blocks) were **deleted on 2026-09-08 and are not on disk**. Do not check those digests, do not assert 935 or 988 children, and do not attempt a promotion — there is no file to promote. The only upload, verification and promotion target is `update-set/x_casemgmt_case_management_update_set.xml`: **522** blocks, **2,985,822** bytes, SHA-256 `5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`, and **522** is the only child count to assert. Those bytes are themselves ungated — see CURRENT ARTIFACT STATE at the top of this guide. The rows above are retained as the record of a superseded round; provenance is in the consolidation report §14.**] |
| PDI state | Awake (not hibernated) and **not** mid-upgrade |
| — | **[CR3 2026-09-09 · F15 — WITHDRAWN AS EVIDENCE.** The block immediately above records a byte-comparison result against an artifact this project's scope excludes. That assertion is **not evidence** about the package that ships and must not be relied upon for any check, digest or decision: the shipping identity is the one published in CURRENT ARTIFACT STATE at the top of this document, established from the canonical path alone. This correction performed no comparison of any kind and records none. The wording above is left unaltered because the text of such a line may not be edited.**] |

### 1.1 Environment / secrets

The deployment uses HTTP Basic auth. Supply credentials via environment variables (never hard-code or echo the password):

```bash
export SERVICENOW_INSTANCE_URL="https://dev306625.service-now.com"   # your target PDI
export SERVICENOW_USERNAME="admin"
export SERVICENOW_PASSWORD="<the PDI admin password>"
```

Everything this procedure writes to disk — the curl config holding the password, the cookie jar holding the
authenticated UI session, the scraped CSRF pages, the response bodies and the `bg.sh` runner — goes into **one
private per-run directory** and never a fixed `/tmp` name. Those files carry live session and CSRF material,
and file mode alone does not protect them: `umask 077` excludes other Unix users but **not** other processes
running as the *same* user, which is the normal case on a shared build or jump host, and a predictable name
additionally invites read, replacement, truncation, symlink collision and races between writing a file and
using it. So the directory must be unpredictable, mode `0700`, every file inside it created exclusively, and
the whole thing removed when you are done.

Allocate it once, before anything else (`$SCRATCH` lets you place it on a volume you control; otherwise
`$TMPDIR`, otherwise `/tmp`):

```bash
# Unpredictable, freshly-created, private. Refuse to continue if it cannot be allocated.
SNRUN="$(mktemp -d "${SCRATCH:-${TMPDIR:-/tmp}}/snrun.XXXXXXXXXX")" || {
  echo "FATAL: no private scratch directory - do not continue with credentials on a shared host" >&2
  exit 1
}
chmod 700 "$SNRUN"
export SNRUN                                    # bg.sh (Section 3) inherits the path from here
trap 'rm -rf -- "$SNRUN"' EXIT HUP INT TERM     # cleanup, including on Ctrl-C or a dropped session

umask 077        # every file created below is 0600
set -C           # noclobber: an existing path is REFUSED, never followed or overwritten

# The curl config keeps the password out of the process list. It is the only file that holds it.
cat > "$SNRUN/sn_curl.cfg" <<EOF
user = "${SERVICENOW_USERNAME}:${SERVICENOW_PASSWORD}"
EOF

# Sourced by the verification blocks in Sections 5a / 5d / 5f. It carries NO password - every
# authenticated call in this guide reads the credential from sn_curl.cfg with `curl -K`.
cat > "$SNRUN/env.sh" <<EOF
SN="${SERVICENOW_INSTANCE_URL}"
SERVICENOW_INSTANCE_URL="${SERVICENOW_INSTANCE_URL}"
SERVICENOW_USERNAME="${SERVICENOW_USERNAME}"
EOF

echo "scratch: $SNRUN"    # note this path if you will use more than one shell
```

**Working across several shell invocations.** The `trap` deletes the directory when *this* shell exits, which
is what you want for a single sitting. If you run the sections from separate shells, allocate the directory
once, note the path printed above, and in each new shell `export SNRUN="<that path>"` — do **not** re-run
`mktemp`, do not re-create files that already exist (`set -C` will correctly refuse), and do not install the
`trap` in the follow-on shells. When the deployment is finished, delete it yourself:

```bash
rm -rf -- "$SNRUN"
```

The rule that follows from this, and it has no exceptions in this guide: **never place a cookie jar, a curl
config, a scraped CSRF page, a response body or a runnable script at a fixed shared path.** If `set -C` refuses
a file, treat the pre-existing path as hostile — do not delete it and reuse the name; allocate a fresh
directory.

---

## 2. Pre-flight checks (abort on any failure)

```bash
SN="$SERVICENOW_INSTANCE_URL"

# 2.1 Reachability + credential validity  -> expect HTTP 200
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" -o /dev/null -w "reachable: HTTP %{http_code}\n" \
  "$SN/api/now/table/sys_remote_update_set?sysparm_limit=1"

# 2.2 Instance not mid-upgrade  -> expect empty result array
#     NOTE: sys_upgrade_history has NO `state` column on this release, and an invalid field in
#     sysparm_query is silently IGNORED - so the `state=executing` condition published in the
#     deployment instructions returns UNFILTERED rows and always looks like an upgrade is running.
#     Query the columns that exist instead: started but not finished.
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_upgrade_history?sysparm_limit=1&sysparm_query=upgrade_startedISNOTEMPTY%5Eupgrade_finishedISEMPTY"

# 2.3 Scope existence (clean install vs update)  -> zero records = clean
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt"
```

- `200` on 2.1 → proceed. `401` → bad credentials. `403` → account lacks `admin`/`sys_remote_update_set`.
  If 2.1 returns `200` with a **5,904-byte HTML body titled "Instance Hibernating page"** instead of JSON, the PDI
  is asleep: every route answers that way, and only the ServiceNow Developer Program account that owns the instance
  can wake it (see [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.11](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)). Stop here
  until it is awake — nothing below will work.
- Any record on 2.2 → wait until upgrade completes. Use the predicate shown
  (`upgrade_startedISNOTEMPTY^upgrade_finishedISEMPTY`), **not** `state=executing`: `state` is not a column on this
  release, invalid fields in `sysparm_query` are silently dropped, and the published condition therefore returns
  every historical upgrade row and reads as a false positive.
- Records on 2.3 → an existing scope is present; the commit will update it (the preview step surfaces real conflicts).

---

## 3. Establish a working UI session (required for background scripts)

Several remediations run server-side JavaScript through the **Scripts - Background** page (`sys.scripts.do`).
That page needs an interactive **form-login** UI session — Basic auth alone is **not** sufficient (it
authenticates REST/Table API only). Establish the session once:

```bash
: "${SNRUN:?run Section 1.1 first, or export SNRUN=<the path it printed>}"
SN="$SERVICENOW_INSTANCE_URL"; CJ="$SNRUN/cookies.txt"
rm -f -- "$CJ"
# (a) GET the login form, scrape its CSRF token
curl -s -c "$CJ" -b "$CJ" -o "$SNRUN/login_form.html" "$SN/login.do"
LCK=$(grep -oE 'sysparm_ck"[^>]*value="[^"]+"' "$SNRUN/login_form.html" | grep -oE 'value="[^"]+"' | sed 's/value="//;s/"//' | head -1)
# (b) POST credentials  -- sys_action=sysverb_login is REQUIRED  -> expect HTTP 302 -> login_redirect.do
#     The password is read from a 0600 file inside $SNRUN, never passed as an argument: a command
#     line is readable by every process on the host. printf is a shell builtin, so writing the file
#     does not expose it either - and it writes NO trailing newline, which matters: a newline would
#     be sent as %0A and the login would fail.
rm -f -- "$SNRUN/pw"
( umask 077; set -C; printf '%s' "$SERVICENOW_PASSWORD" > "$SNRUN/pw" ) || {
  echo "FATAL: could not create $SNRUN/pw exclusively - see Section 1.1" >&2
  exit 1
}
curl -s -c "$CJ" -b "$CJ" \
  --data-urlencode "user_name=${SERVICENOW_USERNAME}" \
  --data-urlencode "user_password@$SNRUN/pw" \
  --data-urlencode "sysparm_ck=${LCK}" \
  --data-urlencode "sys_action=sysverb_login" \
  -o /dev/null -w "login HTTP %{http_code}\n" "$SN/login.do"
rm -f -- "$SNRUN/pw"        # the file exists only for the duration of this one POST
# (c) follow the post-login redirect to finalize the session
curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" -L -o /dev/null "$SN/login_redirect.do?sysparm_stack=no"
```

A reusable **background-script runner** `bg.sh` (runs JS server-side in a chosen scope, persists the
session cookie, scrapes the `g_ck` CSRF token each call). The `SCOPE` argument is either the literal
`global` or the **sys_id of a scope** (to run *in* that scoped application):

```bash
cat > "$SNRUN/bg.sh" <<'BG'
#!/bin/bash
# Refuse to run without the private scratch directory: this script needs the session cookie jar
# and the curl config that live in it, and it must not fall back to a shared path.
SNRUN="${SNRUN:?bg.sh needs the private scratch directory - export SNRUN=<the path printed by Section 1.1> first}"
umask 077
SCRIPTFILE="$1"; SCOPE="${2:-global}"
SN="${SERVICENOW_INSTANCE_URL:?bg.sh needs SERVICENOW_INSTANCE_URL - export it as in Section 1.1}"; CJ="$SNRUN/cookies.txt"
curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" -o "$SNRUN/bg_form.html" "$SN/sys.scripts.do"
CK=$(grep -oE "g_ck['\"]?[ ]*=[ ]*['\"][^'\"]{32,}" "$SNRUN/bg_form.html" | grep -oE "[A-Za-z0-9_+/=,-]{32,}" | tail -1)
[ -z "$CK" ] && CK=$(grep -oE 'sysparm_ck"[^>]*value="[^"]{32,}"' "$SNRUN/bg_form.html" | grep -oE 'value="[^"]{32,}"' | sed 's/value="//;s/"//')
[ -z "$CK" ] && { echo "NO_CK (session expired - re-run section 3)"; exit 2; }
curl -s -K "$SNRUN/sn_curl.cfg" --max-time 600 -c "$CJ" -b "$CJ" -o "$SNRUN/bg_out.html" -w "HTTP %{http_code}\n" \
  --data-urlencode "script@${SCRIPTFILE}" --data-urlencode "sysparm_ck=${CK}" \
  --data-urlencode "runscript=Run script" --data-urlencode "sys_scope=${SCOPE}" \
  --data-urlencode "quota_managed_transaction=on" "$SN/sys.scripts.do"
BG
chmod +x "$SNRUN/bg.sh"
```

**Resolve the scope sys_id from the instance — never type a literal.** Every in-scope call below passes
`"$SCOPE_SYS_ID"`, and this is the one place it is produced. The value differs per instance, so a literal
copied out of a report is wrong everywhere except the instance it was measured on:

```bash
: "${SN:=$SERVICENOW_INSTANCE_URL}"
SCOPE_SYS_ID=$(curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=sys_id" \
  | python3 -c 'import json,sys; r=json.load(sys.stdin)["result"]; print(r[0]["sys_id"] if r else "")')
export SCOPE_SYS_ID
echo "scope sys_id: ${SCOPE_SYS_ID:-<not present yet>}"
```

An empty result is the expected answer on a clean instance where the package has not been committed yet (the
same condition Section 2.3 reports): commit the package in Section 4, then re-run this one block before any
in-scope call. Every later step that says "run IN SCOPE" means `"$SNRUN/bg.sh" <script> "$SCOPE_SYS_ID"`.

> **Scope gotchas (proven on this PDI):**
> - To **write** the scoped `x_casemgmt_*` tables from a background script you must run **in scope** — pass the
>   resolved scope sys_id (`"$SCOPE_SYS_ID"`, from the block above) as the `SCOPE` argument. A `global` script may **read** them
>   (`read_access` is open, which is what the REST gate and the ATF client runner need) but every cross-scope
>   **write** is refused by design: *"Create operation against 'x_casemgmt_case' from scope 'rhino.global' has
>   been refused due to the table's cross-scope access policy."* That is deliberate least privilege, not a
>   defect — see PDI_LIMITATIONS_AND_KNOWN_ISSUES.md Defect D and §9.6 E9.
> - `gs.print()` is **forbidden** in a scoped script — use `gs.info('MARKER| ...')` and read it back from the
>   `syslog` table. In a `global` script, `gs.print()` output appears as `*** Script:` lines in the response.
> - `case` is a JavaScript reserved word — always use `gr.getValue('case')` and quote it as a property key (`{'case': sysId}`).

---

## 4. Deploy the Update Set

### 4.1 UI method (recommended for humans)

1. **System Update Sets → Retrieved Update Sets → Import Update Set from XML** → upload
   `x_casemgmt_case_management_update_set.xml`.
2. Open the loaded retrieved set → **Preview Update Set**. Wait for preview to finish.
3. **Resolve preview problems. Zero `type=error` problems is the REQUIRED PASS CONDITION for this step — not
   a property already measured on the file you are uploading.** The shipping deliverable
   **CORRECTED 2026-09-08 — the shipping deliverable now DOES carry a whole-file preview result.** The
   consolidated 522-block export (`b2217224…`) was uploaded, previewed to **0 `type=error` and 0
   `type=warning`** with nothing marked skipped or ignored, and committed once natively on 2026-09-08 against
   an instance torn down to a recorded zero-state — a same-instance reset-and-reimport, not an independent
   second PDI ([`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md)). Zero `type=error` remains the required pass condition for your own run; what has
   changed is that the file you are uploading has met it once, on those exact bytes. The sentences that follow
   are retained as written and describe the packages that shipped and were retained before this consolidation,
   both candidates having since been deleted.
   (`update-set/x_casemgmt_case_management_update_set.xml`, **935** blocks, 3,973,569 bytes, `9f3ea74c…`) has
   never been previewed
   on any instance as a complete file, the elected base retained at `…FALLBACK.xml` (926 blocks, 3,781,097
   bytes, `7292a6fe…`) was never previewed either, and the retained rebuild (`…REBUILT-DEPENDENCY-ORDERED.xml`,
   988
   blocks, 4,062,067 bytes, `e109e1d1…`) was never uploaded or previewed either, so none of the three carries a
   whole-file preview
   result: you are measuring it here. The one part of them that does carry its own result is the seven native
   choice composites both files share, uploaded as their own delta on 2026-09-03 and previewed to **0
   problems of any type** before a native commit. The one
   sequence that has previewed to **0 `type=error` and 0 `type=warning`** and then committed is **export 3's —
   988 blocks, 4,062,436 bytes, SHA-256
   `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`, on 2026-09-02** — which is no file on
   disk and survives only in git history ([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md)). If you
   see name-resolution / `sys_scope` errors, you are importing an *uncorrected* XML — see
   `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` Defects A & B (duplicate scope record / `application` reference
   encoding) and re-export a corrected XML first. Do not proceed to step 4 while any `type=error` row remains,
   and do not silence one to get past this step.
   **One thing to expect here, and not to treat as a fault:** because `<payload_hash>` is empty on all 522
   blocks after the CR4 F05 redaction (CURRENT ARTIFACT STATE item 8), the preview cannot short-circuit on a
   stored payload fingerprint and compares the payloads themselves — a normal state for an Update Set XML,
   which 7 of these 522 blocks already shipped in before the redaction, and not an error condition. Allow the
   preview the longer end of its usual run time and judge it only on its problem rows.
4. **Commit Update Set** — the platform's native UI action on the retrieved-set record, clicked **once** in
   this rendered browser session. Before you click: confirm `state = previewed`, confirm the set is not
   already `committed` and carries no successful commit in its history, and confirm no update-set commit
   progress worker (`sys_progress_worker`) is already running for it. **If a confirmation dialog appears, do
   not click through it** — screenshot it, stop, and escalate for human review. (The successful 2026-09-02
   commit of export 3's `eee9fabd…` sequence produced no dialog, so a dialog is not the expected path.)
   Afterwards, verify `state=committed` and record the commit progress worker's `state` / `state_code`:
   exactly **one** successful worker should exist for the set.

### 4.2 API method (scriptable — upload and preview only; commit stays in the UI)

```bash
SN="$SERVICENOW_INSTANCE_URL"
XML="servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml"

# Upload (multipart via the UI upload processor; the Table-API POST returns HTTP 400 for this payload).
# Establish the UI session per Section 3 first, then run these four steps IN ORDER.
: "${SNRUN:?run Section 1.1 first, or export SNRUN=<the path it printed>}"
CJ="$SNRUN/cookies.txt"

# (1) PRIME the session with one REST GET. Do not skip this on a cold session: scraping the upload
#     form first returns a session-timeout page variant that carries NO token, and re-requesting the
#     same page does not recover — you have to prime, then scrape.
curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" -o /dev/null -w "prime: HTTP %{http_code}\n" \
  "$SN/api/now/table/sys_remote_update_set?sysparm_limit=1"

# (2) GET the upload FORM for this target (this is the page that carries the token to use)
curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" -o "$SNRUN/upload_form.html" \
  "$SN/upload.do?sysparm_target=sys_remote_update_set"

# (3) Scrape that form's OWN sysparm_ck (not g_ck from a list page - a list-page token is a
#     different form's token and the upload processor rejects it)
UP_CK=$(grep -oE 'sysparm_ck"[^>]*value="[^"]{32,}"' "$SNRUN/upload_form.html" \
  | grep -oE 'value="[^"]{32,}"' | sed 's/value="//;s/"//' | head -1)
[ -z "$UP_CK" ] && { echo "NO_CK on the upload form - session is cold or expired; re-run section 3, then step (1)"; exit 2; }

# (4) POST the file as multipart to /sys_upload.do
curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" \
  -F "sysparm_ck=${UP_CK}" -F "sysparm_target=sys_remote_update_set" \
  -F "attachFile=@${XML};type=text/xml" \
  "$SN/sys_upload.do" -o "$SNRUN/upload_result.html" -w "upload: HTTP %{http_code}\n"
```

Those four steps are the mandated sequence — prime → `GET /upload.do?sysparm_target=…` → scrape that form's
`sysparm_ck` → multipart `POST /sys_upload.do` — and they are what the 2026-09-02 upload used. Confirm the load
afterwards by reading the retrieved set's `state` and its child `sys_update_xml` count (§4.1 step 1 gives the
count to assert).

Every file this block touches — the cookie jar, the scraped upload form and the result page — holds live
session or CSRF material, so all of them live in the private `0700` per-run directory from §1.1 and none at a
fixed shared path: on a shared host, file mode does not exclude other processes running as the same Unix user,
so a unique directory, exclusive creation and the cleanup trap are what actually protect an authenticated
admin session.

**Preview may be scripted; Commit may not.** Preview is driven through `UpdateSetPreviewAjax` — the only
AJAX processor this procedure authorizes — with a `POST /xmlhttp.do` carrying
`sysparm_processor=UpdateSetPreviewAjax`, `sysparm_ajax_processor_function=preview`,
`sysparm_ajax_processor_sys_id=<the retrieved set>` and a scraped `sysparm_ck`, then polled
`previewing → previewed`. A `PATCH {"state":"previewing"}` returns HTTP 200 and silently does nothing —
`sys_remote_update_set.state` is read-only over REST — so do not use it.

**Commit must be performed through the native "Commit Update Set" UI action in a rendered browser session
(Section 4.1 step 4), exactly once, after the pre-click checks recorded there.** Do **not** call
`UpdateSetCommitAjax` / `com.glide.update.UpdateSetCommitAjaxProcessor`, do not `PATCH` `state`, and do not
launch a commit from a background script. What is prohibited is **you** issuing that call out of band;
the UI action's own client script calls the same processor from the record form (every request stamped with an
`x_referer` of `sys_remote_update_set.do?sys_id=…`), which is how the platform implements the button, so seeing
it in the network log while clicking is expected and is not a violation. An earlier revision of this section offered the background-AJAX
commit as an equal alternative; that path was rejected and never used, and it is **superseded** by the UI-only
action. The successful 2026-09-02 commit was performed by the UI action and encountered no confirmation
dialog; if one appears for you, stop and escalate rather than clicking through it.

After the load, verify zero **error**-type preview problems:

```bash
RUSET="<remote_update_set_sys_id>"
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_update_preview_problem?sysparm_query=remote_update_set=${RUSET}^type=error"
# -> result array MUST be empty before committing
```

> **The commit succeeds, but it does NOT create the physical `case_task` / `case_party` tables.** This is a
> platform limitation (Defect C's storage half). **The choice lists, by contrast, now come out of the commit:**
> since 2026-09-03 both packages carry seven platform-native, app-scoped `sys_choice` composites (a canonical
> `sys_choice_<table>_<field>` wrapper, one `x_casemgmt`-owned `sys_choice_set`, then the authored value rows),
> measured on a real instance as `sys_choice` **0 → 24** with every field rendering its exact options. Proceed
> to Section 5 for the storage half.

---

## 5. Post-import remediations

> **Read this first — updated 2026-09-03, and the delivery election is made.** A single upload → preview →
> commit that produced three tables with physical storage and all **27** ACL role links by itself, with the
> remediation never run and no second commit, was measured on the rebuilt package's 988 records — on
> **export 3's byte sequence, 988 blocks / 4,062,436 bytes / SHA-256
> `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`**, `2026-09-02T20:53:14Z`
> ([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md)). **That package is retained rather than
> shipped**, so this section is **not** verification-only: on the shipping deliverable it is **required as
> written**, defects C-storage and 9 included.
>
> **CORRECTED 2026-09-08 — what ships, and what this section now does for it.**
> **[RE-DATED 2026-09-09 (CR3 F12, CR4 F02/F05): the identity this paragraph states as "the shipping
> deliverable" is the superseded 2026-09-08 revision, and the preview-and-commit result below belongs to it.
> The shipping identity is 522 blocks / 2,985,822 bytes / `5a3c629f…` — see CURRENT ARTIFACT STATE at the top
> of this guide — and those bytes carry no preview and no commit result at all. Do not check the digest or
> the byte size below against the file on disk.]** The shipping deliverable is
> the consolidated platform export at `update-set/x_casemgmt_case_management_update_set.xml` — **522** blocks /
> **3,114,377** bytes / SHA-256 `b2217224888fb9b6de664ae816dcee8748507c37e9da0f2d259cc676cd4105a4` — and a
> preview of its complete file **was** run: 0 `type=error` and 0 `type=warning` from a recorded zero-state,
> followed by a single native commit, on 2026-09-08. Gate 7 in [`validation-gates.md`](./validation-gates.md)
> is therefore recorded as **MET** on those bytes, by a **same-instance reset-and-reimport** rather than by an
> independent second PDI; §10.0 item 1a of
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) is closed by that run. This
> section reduces on the shipping package to the **3** `sys_user_has_role` grants — **§5h below, which is
> mandatory and which no Update Set can replace on this release** — plus §5g's seed pass: the export carries the
> platform-captured schema, the 24 choice values and the 27 role links in its own payloads, so neither
> remediation pass nor a second commit is required. Full record: [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md). *The two paragraphs that follow
> are retained as written and describe the packages that shipped and were retained before this consolidation;
> both candidates have since been deleted, so there is no longer an upgrade path to promote.*
> **What ships, and what this section does for it.** The shipping deliverable is the **elected base AS AMENDED**
> at `update-set/x_casemgmt_case_management_update_set.xml` — 935 blocks / 3,973,569 bytes / SHA-256
> `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`, measured 2026-09-05T04:45Z; **MEASURED,
> NOT GATE-VERIFIED**, and **NOT** byte-identical to `…FALLBACK.xml`, which retains the elected base
> (`7292a6fe…`, 926 blocks, 3,781,097 bytes, restored 2026-09-05T04:45Z) — and
> **no preview of the complete file was ever run on those bytes** (its seven native choice composites were
> previewed and committed on their own on 2026-09-03, and nothing else in the file was), which is why Gate 7 in
> [`validation-gates.md`](./validation-gates.md) is recorded as **NOT MET** for it, the
> gate being binary rather than gradable, and why §10.0 item 1a of
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) stands open. Electing it
> settled which package ships; it did not pass that gate, and the artifact must not be presented as verified by
> round trip. Running the
> steps of §4 and this section against the shipping file on a **genuinely clean, dedicated** PDI — verify the
> digest (expect `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9` over 3,973,569 bytes),
> upload, assert **935** children, preview to zero `type=error`, commit through the native "Commit Update Set" **[CR3 2026-09-09 · F13 — NOT A TARGET: the 935-block and 988-block packages were deleted on 2026-09-08 and are not on disk. The only child count to assert is **522**, on `update-set/x_casemgmt_case_management_update_set.xml` (2,985,822 bytes / `5a3c629f…`, itself ungated). Retained as provenance only.]**
> UI action, then run the two remediation passes and confirm physical storage and all **36** role links
> (manager 17 / agent 13 / viewer 6) — is what
> turns that NOT MET into a MET for the deliverable; record **`9f3ea74c…`** as verified with that run's timestamp
> when it completes. It must not be run on `dev306625`: that instance's already-committed retrieved set carries
> this file's own descriptor `sys_id` `9929f50df18ccec91ea13b2a3bccfc90`, so an upload there would reuse the row
> and append 935 children to committed evidence.
>
> **The retained rebuilt package was described as the available upgrade path.** **[CR3 2026-09-09 · F13 — NOT A TARGET: that file was deleted on 2026-09-08, is not on disk, and there is no promotion to perform. The only upload, verification or promotion target is `update-set/x_casemgmt_case_management_update_set.xml` — 522 children, SHA-256 `5a3c629f…`.]**
> `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` — 988 blocks / 4,062,067
> bytes / SHA-256 `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` — satisfies AAP §0.5.2
> dependency ordering and carries the platform-captured table and dictionary records together with all 27
> `sys_security_acl_role` links; the trip on its exact bytes has never been run either. The same §4 + §5
> sequence against **that** file, asserting **988** children, plus recording its digest as verified with that
> run's timestamp, was what would have made it shippable and promotable back to the deliverable path — §10.0
> carries that history in full. It is not a route: the file was deleted on 2026-09-08 (CR3 F13). A clean target is
> required either way: each file's `<sys_remote_update_set>` descriptor makes the loader reuse an existing
> retrieved set and append its children (`../scripts/round_trip_verify.md`, Phase 1 warning), and a populated
> instance returns `Found a local update that is newer than this one` collisions instead of the zero-problem
> result.
>
> Defect C's **choice-list half is fixed on both packages as of 2026-09-03** — each carries seven
> platform-native, app-scoped `sys_choice` composites (canonical `sys_choice_<table>_<field>` wrapper, one
> `x_casemgmt`-owned `sys_choice_set`, then the authored value rows) covering all **24** values, 2 case type /
> 6 case status / 4 case priority / 3 case pending reason / 4 task type / 3 task status / 2 party type. That
> exact seven-child delta was uploaded on 2026-09-03, previewed to **0 problems of any type**, committed by the
> native commit action, and took `sys_choice` from **0 to 24** with every field rendering its exact option
> labels on real forms — so **§5a's choice-row steps are no longer required** (they remain harmless and
> idempotent if you run them). §5a's **physical-schema half is still mandatory**, and
> §5's step 7 (`seed_demo_data.js` in scope) is still needed for the seed linkage and `opened_date`.
> **[RE-NUMBERED 2026-09-09 · CR5 F10: the seed pass is now step **8**. Step **7** is the three role grants
> (§5h), which run first. `seed_demo_data.js` itself is unchanged.]**
> **Everything below is REQUIRED as written for the shipping deliverable**
> (`update-set/x_casemgmt_case_management_update_set.xml`, and its byte-identical copy
> `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`) and for older revisions.
>
> **On the shipping package: upload → preview → commit does not give you
> a working application. Two defects need manual work every time:**
>
> | Defect | Carried by the package? | What you must do |
> |---|---|---|
> | **E** — auto-numbering | ✅ Yes, fully | Nothing. §5b is verification only |
> | **7** — REST `service_id` | ✅ Yes, fully | Nothing. §5d is verification only |
> | **C** — physical tables and fields | ❌ **No** | §5a — mandatory |
> | **C** — choice lists | ✅ Yes, since 2026-09-03 | Nothing. §5a's choice rows are redundant (idempotent if run) |
> | **9** — 36 ACL role links + security-cache flush | ❌ **No** | §5f — mandatory |
>
> **Why C and 9 are not automatic, stated plainly.** The package ships **neither** an auto-execute trigger
> **nor** a Fix Script: it carries no `sys_script_fix` payload and no record that fires on commit, so the
> remediation is something you run, from `scripts/post_import_remediation.js` in the repository. A trigger was
> built: an after-update Business Rule `x_casemgmt Post-Import Bootstrap` on
> `sys_remote_update_set` (condition `current.state.changesTo('committed')`) that dispatched the Fix Script. It
> was measured to **fire and then fail**, and it has since been **removed from the package** for a second
> reason: that condition matches the commit of *any* retrieved Update Set, not only this application's, so
> activating it would dispatch privileged, partly destructive remediation on unrelated deployments. The
> remediation still deactivates a legacy copy of that rule if it finds one, identified by name **and**
> `collection` **and** `sys_update_name`. The commit engine rewrites every committed record's `sys_scope` to the installing application, so the
> remediation executes with `scope_context=x_casemgmt` instead of global, and every privileged call it needs is
> refused. The observed result, verbatim from `syslog`:
>
> ```
> X_CASEMGMT_REMEDIATION|BOOTSTRAP|fired|…|state=committed|scope=x_casemgmt|dispatching Fix Script …
> X_CASEMGMT_REMEDIATION|START|post-import remediation|scope_context=x_casemgmt|…
> X_CASEMGMT_REMEDIATION|SUMMARY|verified=false|tables_built=0|…|acl_links_total=0|acl_links_expected=27|security_cache_flushed=false|errors=121
> ```
>
> All 121 errors are exactly two kinds:
>
> ```
> java.lang.SecurityException: GlideTableDescriptor is not allowed in scoped applications
> java.lang.SecurityException: GlideSecurityManager is not allowed in scoped applications
> ```
>
> No packaging change defeats this — the scope rewrite happens at commit time regardless of the scope the
> records are authored in. **The bootstrap rule is therefore not shipped at all** (an earlier revision shipped
> it `active=false`). Nothing in the package fires on commit, so a fresh install leaves no marker lines in
> `syslog` until you run the remediation by hand. If an instance you inherit *does* carry that rule, treat an
> `active=true` copy as a hazard rather than as evidence that the automation ran: the remediation deactivates
> it once the application verifies as fully wired.
>
> **A Fix Script would not have worked either, which is the second reason none is shipped.** *System Definition
> → Fix Scripts → "x_casemgmt Post-Import Remediation" → Run Fix Script* executes that record **in the
> application scope** for the same reason and fails the same way — `errors=121`, `tables_built=0`,
> `acl_links_created=0` — so the package omits the record rather than shipping a privileged, partly destructive
> script behind a Run button that cannot succeed. On a fresh install there is nothing under *Fix Scripts* to
> look for. If an instance you inherit carries such a record from an older export, do not run it: paste
> **do not paste it into a Global background script either — ⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16.** It violates AAP §0.7.2's zero-global-write constraint and the single-clean-commit gate ("no second commit, no remediation script, no live-instance patching"); it is retained only as a record of what an earlier round did on the two superseded hand-authored candidates. A shortfall the package leaves is a source-side defect: correct the package where it is produced and re-run the full gate on the exact candidate bytes — see SUPPORTED INSTALL ROUTE at the top of this guide.** The repository keeps
> `scripts/sys_script_fix_x_casemgmt_post_import_remediation.xml` as the reference record-definition of that Fix
> Script — `x_casemgmt`-stamped, unshipped, and not an execution route; its embedded copy of the body has
> drifted from `scripts/post_import_remediation.js`, which is the single source of truth. The only route
> measured to work was a background script in scope **Global** — a measured fact about the script, and not a
> supported step (CR3 F16).
>
> ### THE PRIMARY PROCEDURE — eight numbered steps, and the only one you should follow
>
> This is the single authoritative sequence. It is the procedure that was measured to work, it is what
> `scripts/post_import_remediation.js` documents in its own header ("step 4 and again step 6 of
> HUMAN_DEPLOYMENT_RECREATE_GUIDE section 5"), and it **does not delete anything by hand**. A destructive
> alternative exists and is described afterwards as a clearly-labelled fallback; **do not start with it.**
>
> ⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16: steps 4, 5 and 6 of the table below must not be run.**
> Step 4 and step 6 run a script from *Scripts - Background* with **"In scope" = Global**, and step 5 is a
> **second commit** of the same Update Set with collisions accepted. AAP §0.7.2 requires scoped-namespace
> exclusivity with **zero global-scope writes**, and the release gate requires **a single clean commit — no
> second commit, no remediation script, no live-instance patching**. Those three steps are retained only as a
> record of what an earlier round did on the two hand-authored candidate packages (both deleted on
> 2026-09-08). **The supported route is steps 1, 2, 3, 7 and 8 only** — and since 2026-09-09 (CR5 F10) step 7
> is the **role grants** (§5h) and step 8 is the **seed pass** (§5g), in that order; if the package leaves a shortfall,
> correct it where the package is produced and re-run the full gate on the exact candidate bytes.
>
> **CORRECTED 2026-09-09 · CR3 F12 — step 1's child count and digest.** Assert **522** children and SHA-256
> **`5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`** over **2,985,822** bytes. The counts
> and digests step 1 names (935, 988, and the packages behind them) belong to superseded revisions, two of
> which were deleted on 2026-09-08 and are not on disk; step 1's row is retained as written, and this note
> prevails over it.
>
> **RE-ORDERED 2026-09-09 (code review CR5, finding F10) — the role grants are now step 7 and the seed pass is
> step 8; they were the other way round.** The three `sys_user_has_role` grants are **the first thing you do
> after the commit**. They are mandatory on every install, no Update Set can deliver them on this release, and
> a deployer who reaches the ATF run or the §6.3 impersonation probe without them re-derives a wholesale
> failure that says nothing about the application. The section they live in keeps its **§5h** label — other
> documents cross-reference that anchor — so §5h is deliberately printed **before** §5g below. Nothing else in
> the numbering moves: the supported sequence is **1 → 2 → 3 → 7 → 8**.
>
> | # | Step | What to do | Where |
> |---|---|---|---|
> | 1 | **Upload** | *System Update Sets → Retrieved Update Sets → Import Update Set from XML*, select the deliverable XML. Check the SHA-256 first (§1), then assert the loaded child `sys_update_xml` count — **935** for the shipping deliverable (`9f3ea74c…`, 3,973,569 bytes), **926** if you are verifying the elected base at `…FALLBACK.xml` (`7292a6fe…`, 3,781,097 bytes), **988** if you are instead verifying the retained `…REBUILT-DEPENDENCY-ORDERED.xml` (`e109e1d1…`, 4,062,067 bytes). Re-derive it from the file rather than trusting this row: `grep -c '<sys_update_xml ' <the XML>` | §4 |
> | 2 | **Preview** | Run Preview to completion. On a genuinely clean instance the expected result is **0 errors and 0 warnings**. Resolve any error; do **not** ignore a collision | §4 |
> | 3 | **Commit** | Click the native **Commit Update Set** UI action in a rendered browser session, **exactly once**, after the pre-click checks in §4.1 step 4 (`state=previewed`, not already committed, no commit progress worker running). Any confirmation dialog is a **hard stop** — screenshot it and escalate, do not click through. Do not script this step. Result: `state=committed` | §4.1 step 4 |
> | 4 | ⛔ **NOT A SUPPORTED STEP (CR3 F16).** ~~**Run the remediation in scope `Global`** — *first pass*~~ | *System Definition → **Scripts - Background***, set **"In scope" = Global**, paste `scripts/post_import_remediation.js`, run. This pass builds the three tables' physical storage and their fields; it also writes their choice rows, which since 2026-09-03 the package already carries natively, so that part is redundant and idempotent rather than required. It does the `sys_db_object` work itself; **you do not delete anything and you do not touch the application picker** | §5a |
> | 5 | ⛔ **NOT A SUPPORTED STEP (CR3 F16).** ~~**Commit the same Update Set a second time**~~ | The rebuild in step 4 **cascades away all 29 ACLs**, the seed rows, the demo users and the role grants; a second commit restores them. This preview reports ~21 `Could not find a record in x_casemgmt_case for column case` / `…core_company for column organization` problems, because the tables now exist but are empty — set **those** to `status=ignored`. It also reports ~25 `sys_dictionary` collisions from the rows step 4 wrote moments earlier; accepting the remote is correct **for `sys_dictionary` only**, because the package now carries the corrected `display` and `defaultsort` values itself. **Never ignore a collision on any other table** | §4 again |
> | 6 | ⛔ **NOT A SUPPORTED STEP (CR3 F16).** ~~**Run the remediation in scope `Global`** — *second pass*~~ | Same invocation as step 4. This is the pass that creates the **36** `sys_security_acl_role` links and flushes the security cache. Without it you have 29 ACLs with **0** role links, and on a high-security instance an ACL with no role, no condition and no script evaluates to **deny** — the application is unusable for every non-admin | §5f |
> | 7 | **Grant the three demo personas their scoped roles** — **the FIRST post-commit action** | Mandatory on every install: the package carries **no `sys_user_has_role` payload**, because the loader refuses that table on this release. The three demo `sys_user` rows arrive **with** the commit, so this runs immediately after it and **before** the seed pass. Make each grant through the platform's **Edit Members** slushbucket (user form → **Roles → Edit…**), one save per grant, then verify **exactly 3** scoped grants over REST. Without them every persona holds no role and every impersonation check and ATF test fails at its first persona step | §5h |
> | 8 | **Seed the demo data** | Run `scripts/seed_demo_data.js` **in scope** (not Global). Do **not** delete the packaged rows — they carry pinned numbers now and the script adopts them. Clear the dangling `sys_user_grmember` row if one is present | §5g |
>
> Run the remediation like this — **in `global`, never in scope**:
>
> ```bash
> "$SNRUN/bg.sh" servicenow-case-management-poc/scripts/post_import_remediation.js global
> ```
>
> **Steps 4 and 6 are the same command run twice.** That is deliberate, not a typo: the script is idempotent, and
> the two passes are separated by a commit because the commit is what restores the records the rebuild removed.
>
> **Updated 2026-09-03: on the shipping package, steps 4, 5 and 6 ARE needed — run all seven.** The result in
> **CORRECTED 2026-09-08 (and re-dated 2026-09-09, CR3 F12: measured on the superseded `b2217224…` revision,
> not on the shipping 2,985,822-byte `5a3c629f…` bytes, which carry the same payloads but have never been
> committed):** on the package that shipped then — the consolidated 522-block export `b2217224…` — steps
> 1-3 alone produce the physical schema, the 24 choice values and all **27** role links, measured on its own
> bytes with no remediation run and no second commit ([`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md)); steps 4-6 below are the procedure for the
> two superseded hand-authored candidate packages, which this consolidation deleted, and are retained as
> written for that reason. The expectation described next was recorded before that measurement:
> which steps 1-3 alone produced the physical schema and all 27 role links, with step 5's second commit never
> performed, was measured on **export 3's byte sequence — 988 blocks, 4,062,436 bytes, SHA-256
> `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** — which is **no file on disk** and
> survives only in git history. The **retained rebuilt** package
> (`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, SHA-256
> `e109e1d107e28401cbcc74a7e0006f10cfa68d668560843d6e0fee6f8b79408d` since the 2026-09-03 choice-composite
> re-cut, `90ee0249…` before it — a superseded digest that matches no file in this tree) holds those same 988 records — including
> the 27 `sys_security_acl_role` records — re-sequenced into AAP §0.5.2 dependency order, but it was **never
> uploaded, previewed or committed**, so on that file the one-commit outcome is an expectation backed by static
> checks and **remains unverified until its own S1–S6 gate run**. The shipping package carries **0** role-link **[CR3 2026-09-09 · F13 — NOT A TARGET: the package named here was deleted on 2026-09-08, is not on disk, and may not be uploaded, verified, gated, selected or promoted; no 988- or 935-child count may be asserted. The only such target is `update-set/x_casemgmt_case_management_update_set.xml` — 522 blocks / 2,985,822 bytes / `5a3c629f…`, itself ungated. Retained as provenance only.]**
> records of the **36** its 29 ACLs require (the 26-ACL elected base requires 27), so steps 4-6 are the procedure for the artifact that ships, not history — that conclusion is
> unchanged whichever of the two 988-record sequences the reader has in mind. Step 7 applies to all of them;
> the choice rows no longer do, both packages having carried native choice composites since 2026-09-03 —
> [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) records which result belongs to which byte
> sequence.
>
> ### The destructive route is a FALLBACK — preconditions and stop conditions
>
> > **⚠️ Do not perform this unless step 4 has actually failed.** It hand-deletes schema rows, and on a shared or
> > populated instance it can destroy work that is not yours. An earlier revision of this guide presented it as
> > step 1 of the normal procedure; that was wrong, and the one-command route in step 4 supersedes it.
>
> **Preconditions — all four must hold before you begin:**
>
> 1. Step 4 has been run and its `SUMMARY` line reports `verified=false` **with `tables_built=0`** — that is, the
>    script could not build the tables at all. A `verified=false` for any other reason is not grounds for this.
> 2. You have read the script's own output and confirmed it did **not** stop for its fail-closed reason. The
>    script refuses to rebuild a table whose storage state it cannot positively determine; if that is why it
>    stopped, deleting the rows by hand removes exactly the safety check that fired.
> 3. The instance is yours to break — a personal PDI with no other application and no other agent working in it.
> 4. You have a current export of anything on the instance you care about.
>
> **The fallback itself:** set the session application picker to **x_casemgmt Case Management** (user preference
> `apps.current_app`), then REST-DELETE the three `sys_db_object` rows **children first** —
> `x_casemgmt_case_task`, `x_casemgmt_case_party`, `x_casemgmt_case` — then run the remediation in **Global**
> (⛔ not a supported step, CR3 F16 — this whole alternative procedure is retained as a record, not as a
> route),
> then continue at step 5 of the primary procedure. Some deletes return HTTP 500 *maximum execution time
> exceeded* and nevertheless succeed; verify by re-querying the row, never by the status code.
>
> **Stop immediately, and do not continue, if any of these occur:**
>
> - A delete returns HTTP 403 or *cross-scope* — the picker is not set, and forcing it another way is not the fix.
> - Re-querying shows the row still present after two attempts — something is holding it; diagnose, do not retry
>   in a loop.
> - Any table **outside** `x_casemgmt_case`, `x_casemgmt_case_task`, `x_casemgmt_case_party` appears in a delete
>   URL. Deleting a `sys_db_object` row cascades; the wrong row is unrecoverable without a clone-back.
> - The subsequent remediation run reports `errors>0` on anything other than the two known
>   `not allowed in scoped applications` messages.
>
> In every one of those cases the correct next move is to stop and read
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.5](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md#95-residual-manual-footprint-per-defect-with-the-precise-step),
> which records each step with its measured evidence.
>
> **Why `global` is mandatory.** `sys_db_object`, `sys_dictionary`, `sys_choice`, `sys_number`,
> `sys_ws_definition`, `sys_security_acl` and `sys_security_acl_role` are all global tables with cross-scope
> create/update denied; `GlideTableDescriptor` raises *"GlideTableDescriptor is not allowed in scoped
> applications"* for a scoped caller; and `GlideSecurityManager` is likewise unavailable in scope. The script
> writes no `x_casemgmt_*` data rows at all — seeding stays the job of §5g, which *does* run in scope. It is
> idempotent, so running it when nothing is wrong is harmless and reports only "already correct" lines. It is
> also **fail-closed**: if it cannot positively establish whether a table has physical storage, it leaves that
> table strictly alone and aborts rather than assuming it is safe to rebuild. Separately, it will not delete a
> metadata row it cannot prove it owns — every `sys_dictionary` and `sys_db_object` row carrying a rebuilt
> table's name must be either an element this package declares, in this application's scope and package, or one
> of the platform's own unscoped identity/audit columns. Anything else is reported with its `sys_id` and the
> table is abandoned with nothing deleted, so a column an administrator added by hand survives the rebuild.
>
> ### Confirming it actually converged
>
> ```bash
> # The SUMMARY line is the proof. Expect verified=true and errors=0.
> curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
>   "$SERVICENOW_INSTANCE_URL/api/now/table/syslog?sysparm_query=messageSTARTSWITHX_CASEMGMT_REMEDIATION%5EORDERBYDESCsys_created_on&sysparm_fields=sys_created_on,message&sysparm_limit=100"
>
> # Corroborating, no log reading needed: exactly 36 ACL role links must exist.
> curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
>   "$SERVICENOW_INSTANCE_URL/api/now/table/sys_security_acl_role?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_id&sysparm_limit=100"
> ```
>
> On a genuinely clean instance the summary reads `tables_built=3` and `acl_links_created=36`; on a repeat it
> reads `tables_already=3` and `acl_links_already=27`. Either way the proof of convergence is
> `verified=true|…|errors=0` **together with** `acl_links_total=36|acl_links_expected=36`. The count must be
> **exactly** 27, distributed manager 14 / agent 10 / viewer 3 — the script rejects a surplus as well as a
> shortfall, and removes unexpected links, so a number other than 27 means it has not converged.
>
> §5c, §5e and §5g are unchanged.
> **[CR3 2026-09-09 · F15 — WITHDRAWN AS EVIDENCE.** The block immediately above records a byte-comparison result against an artifact this project's scope excludes. That assertion is **not evidence** about the package that ships and must not be relied upon for any check, digest or decision: the shipping identity is the one published in CURRENT ARTIFACT STATE at the top of this document, established from the canonical path alone. This correction performed no comparison of any kind and records none. The wording above is left unaltered because the text of such a line may not be edited.**]

Where a step below still needs a script, run it via `bg.sh`. Read results back from the response
(`$SNRUN/bg_out.html`) — extract `*** Script:` lines for `global` scripts, or query `syslog` for `gs.info`
markers from in-scope scripts. **All cross-references are resolved by name/number lookup — never by
hard-coded `sys_id`.**

### 5a. Materialize `x_casemgmt_case_task` & `x_casemgmt_case_party` tables and their fields  *(Defect C, storage half)*

⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16.** This whole section, including the command below and every
Global-scope instruction under it, is retained only as the record of what an earlier round did on the two
hand-authored candidate packages this consolidation superseded and deleted on 2026-09-08. Running
`post_import_remediation.js` in Global scope violates AAP §0.7.2's zero-global-write constraint, and pairing it
with a further commit violates the single-clean-commit gate. It is also moot on the shipping bytes: the
522-block package carries the platform-captured `sys_db_object`, `sys_dictionary` and `sys_documentation`
records, so the physical schema arrives with the commit itself. Do not run it. A shortfall the package leaves
is a source-side defect — correct the package where it is produced and re-run the full gate on the exact
candidate bytes, per **SUPPORTED INSTALL ROUTE** at the top of this document.

*Retained as written, and true of the superseded candidate packages:* **MANDATORY MANUAL STEP — this is step 4
of the primary procedure above.** The package ships the automation but
it cannot complete (see the preamble). You must do this yourself — and it is **one command**:

> **Scope of this step as of 2026-09-03.** Its **physical-schema half is still mandatory**: the commit does not
> create the three tables' storage or their columns. Its **choice half is now redundant**: both packages carry
> seven platform-native, app-scoped `sys_choice` composites that a commit materialises into all **24** value
> rows, measured `sys_choice` **0 → 24** on a real instance. The script still writes those rows, idempotently,
> so running it is harmless and its `choices_created=24` line is expected either way — you simply no longer
> depend on it for the choices.

```bash
"$SNRUN/bg.sh" servicenow-case-management-poc/scripts/post_import_remediation.js global
```

The script performs the `sys_db_object` deletion and the table rebuild itself. Measured on a clean install of the
shipped package, from **Global** with no application picker set: `clean slate|dictionary_rows_removed=14|
db_object_rows_removed=1|residue=0|reusing_sys_id=yes` per table, then the platform's own DDL
(`Creating table: x_casemgmt_case`, `DBTable.create() for:`, `ALTER TABLE x_casemgmt_case ADD number VARCHAR(40)`),
then `built|signals=GlideTableDescriptor.isValid=yes,GlideRecord.isValid=yes,TableUtils.tableExists=yes` — ending
`tables_built=3, fields_created=25, choices_created=24, counters_written=3`.

> ⛔ **NOT A SUPPORTED STEP (CR3 F16).** **This note read "Then go straight to step 5 — commit the Update Set a
> second time."** It violates AAP §0.7.2's zero-global-write constraint and the single-clean-commit gate ("no second commit, no remediation script, no live-instance patching"); it is retained only as a record of what an earlier round did on the two superseded hand-authored candidates. A shortfall the package leaves is a source-side defect: correct the package where it is produced and re-run the full gate on the exact candidate bytes — see SUPPORTED INSTALL ROUTE at the top of this guide. Rebuilding the tables **cascades away all
> 29 ACLs**, the seed rows, the demo users and the role grants, so this run necessarily ends
> `verified=false … errors=6`, every error being the ACL check (`found 0 x_casemgmt ACLs, expected 26`, and one per
> role). **That is the expected outcome of step 1, not a failure** — the script is fail-closed and refuses to
> report success with zero role links. `verified=true` arrives at step 6.

**Fallback, only if the run reports `db_object_rows_removed=0` or a `tables_indeterminate` count above zero:** set
the session application picker to **x_casemgmt Case Management** (user preference `apps.current_app`) and
REST-DELETE the three `sys_db_object` rows children-first — `x_casemgmt_case_task`, `x_casemgmt_case_party`, then
`x_casemgmt_case` — then re-run the script in Global. Some of those DELETEs return HTTP 500 *maximum execution time
exceeded* but do succeed, so confirm by re-querying rather than trusting the status code. This route exists because
`sys_db_object` deletion is gated by `DictionaryUtils.isDeletable()` → `_isItemInUserScope()`; it was **not needed**
on the release measured here. If the script reports `tables_indeterminate`, it has deliberately refused to touch a
table whose physical state it could not establish — investigate before forcing anything.

Why it cannot be fixed in the XML: the physical DDL for a brand-new table is emitted by the platform's
after-insert Business Rule **`Synch Dictionary and Table` (order 500) on `sys_db_object`**, and the Update Set
apply engine applies every payload with business rules **suppressed**. Pushing the package's own
`sys_db_object` payload through the engine's own `GlideUpdateManager2.loadXML` creates the metadata row and
leaves `physical=false`; adding a `sys_dictionary` collection row does not help either. A `GlideRecord` INSERT
with workflow **ON** does trigger it — which is what the remediation does, from **global** scope.

Verify (as admin):

```bash
source "$SNRUN/env.sh"
for T in x_casemgmt_case x_casemgmt_case_task x_casemgmt_case_party; do
  printf '%s -> ' "$T"
  curl -s -o /dev/null -w '%{http_code}\n' -K "$SNRUN/sn_curl.cfg" \
    -H "Accept: application/json" "$SN/api/now/table/$T?sysparm_limit=1"
done      # These return HTTP 200 once the package's access flags are in place: ws_access and
          # read_access are open, so the REST Table API can READ all three tables as admin.
          # (An earlier revision of this guide said 403; that was the boolean-versus-string
          # packaging defect, fixed - see PDI_LIMITATIONS_AND_KNOWN_ISSUES.md 9.6 E9.)
          # Writes are a different matter: cross-scope create/update/delete are refused by
          # design, so seed and repair data from a background script with "In scope" = x_casemgmt.
```

The remediation's own `VERIFY|` log line reports the same thing in one place, e.g.
`x_casemgmt_case{physical=true,columns=21,missing_fields=none,choices=15}
x_casemgmt_case_task{physical=true,columns=14,missing_fields=none,choices=7}
x_casemgmt_case_party{physical=true,columns=13,missing_fields=none,choices=2}` — 25 fields and 24 choice
values across the three tables, matching `docs/data-model.md`: `case.type` (General Inquiry, Complaint);
`case.status` (Draft, Open, In Progress, Pending, Resolved, Closed); `case.priority` (Low, Medium, High,
Critical); `case.pending_reason` (Awaiting Info, Awaiting Third Party, Other); `case_task.type`
(Investigation, Review, Follow-up, Other); `case_task.status` (Open, In Progress, Closed);
`case_party.party_type` (Person, Organization).

> **Expected on a genuinely clean import:** because the DDL cannot happen until the commit finishes, the
> Update Set's 28 seed-data records (10 Case, 10 Case Task, 8 Case Party) have no physical table to land in and
> contribute nothing — a data payload applied to a table with metadata but no storage inserts nothing and
> raises no error. Restore the demo data with **§5g** afterwards; that is the intended path, and the demo rows
> are not part of what makes the package self-sufficient.

**Manual fallback** (only if the summary line is missing — see the note at the top of §5):

```bash
"$SNRUN/bg.sh" servicenow-case-management-poc/scripts/post_import_remediation.js global
```

Note this must run in **`global`**, not in scope. An earlier revision of this guide said "Run **in scope**";
that was wrong — `GlideTableDescriptor` raises a `SecurityException` for a scoped caller and no dictionary
write succeeds.

### 5b. Auto-numbering for `x_casemgmt_case`  *(Defect E)*

**AUTOMATIC — no action required.** Both halves of the wiring are now carried by the package artifacts, and
the remediation re-asserts them (needed because §5a's table rebuild re-creates the `number` dictionary entry
and the platform rule that would normally wire it, `Create Default Number Maintenance Field` (order 1000), is
suppressed on commit for the same reason as §5a).

What the package now carries:

- `dictionary/x_casemgmt_case_number.xml` → `<default_value>javascript:global.getNextObjNumberPadded();</default_value>`.
  **The `global.` qualifier is mandatory**: `getNextObjNumberPadded()` lives in the global scope and a scoped
  table's default-value evaluation will not resolve the bare call.
- `numbers/sys_number_x_casemgmt_case{,_task,_party}.xml` → `<maximum_digits>7</maximum_digits>`.
  Previously these carried `number_of_digits`, which is **not a column** on `sys_number` (its writable columns
  are exactly `category`, `prefix`, `number`, `maximum_digits`) and was therefore **silently discarded on
  import** — the reason the padding never arrived.

Both are mirrored into the deliverable's `Dictionary` and `Number Maintenance` payload blocks.

Verify — insert one synthetic case **in scope** and check the format, then delete it:

```javascript
// run IN SCOPE: "$SNRUN/bg.sh" <this script> "$SCOPE_SYS_ID"   (Section 3 resolves SCOPE_SYS_ID by query)
var c = new GlideRecord('x_casemgmt_case');
c.initialize();
c.setValue('subject','numbering check - delete me');
c.setValue('description','Synthetic probe.');
c.setValue('status','Draft'); c.setValue('type','General Inquiry');
c.setValue('requester_name','Probe');
var id = c.insert();
var chk = new GlideRecord('x_casemgmt_case'); chk.get(id);
gs.info('NUMCHECK|' + chk.getValue('number') + '|ok=' + /^CASE[0-9]{7}$/.test(chk.getValue('number')));
chk.deleteRecord();
```

Expect `NUMCHECK|CASE0000058|ok=true` (the digits will differ). A dictionary-cache flush is not a separate
step: the remediation's dictionary write queues the platform's own cache-flush events.

### 5c. `gs.nowDateTime()` → `new GlideDateTime()` in date business rules  *(Defect 6)*

`gs.nowDateTime()` is scope-fenced in this context. The `set_opened_date` and `set_closed_date` business
rules must use `current.opened_date = new GlideDateTime();` / `current.closed_date = new GlideDateTime();`.
(If you import the *corrected* repo XML these are already fixed; if you import an older XML, patch the live
`sys_script` records.)

### 5d. Scripted REST `service_id`  *(Defect 7)*

**AUTOMATIC — no action required.** The values are now in the package: `portal/rest/…_case_submit.xml` carries
`<service_id>case_submit</service_id>` and `…_case_status_lookup.xml` carries
`<service_id>case_status_lookup</service_id>`, both mirrored into the two `Scripted REST Service` payload
blocks of the Update Set. `requires_authentication=false` and `active=true` are unchanged. `service_id` is the
URL path segment; the platform derives the read-only `base_uri` as `/api/<namespace>/<service_id>` from it, so
the resulting paths are `POST /api/x_casemgmt/case_submit` and `GET /api/x_casemgmt/case_status_lookup`.

Verify anonymously — this is the real test, so send **no** credentials (§6.2 exercises the same three calls):

```bash
source "$SNRUN/env.sh"
curl -s -o /dev/null -w 'lookup unknown -> %{http_code}\n' \
  "$SN/api/x_casemgmt/case_status_lookup?number=CASE9999999"     # expect 404
```

The remediation's `REST|` log lines report the live state directly, e.g.
`REST|Case Submit|already correct|service_id=case_submit|base_uri=/api/x_casemgmt/case_submit`.

### 5e. Scripted REST operation scripts  *(Defect 8)*

If the live `sys_ws_operation` records hold an older script than the deliverable's, copy the **deliverable's**
operation scripts onto the live records (the deliverable scripts are the correct/robust versions: GET
returns HTTP 404 `{"error":"No case found with that number."}` for an unknown number; POST consumes
`application/json` and returns HTTP 201 `{number, "Your case has been submitted"}`). Note
`GlideStringUtil.base64Decode` is **not** static — use `gs.base64Decode()` if transferring base64 payloads.

### 5f. ACL → role link records (27)  *(Defect 9)*

⛔ **NOT A SUPPORTED STEP — CR3 2026-09-09 · F16.** **This section read "MANDATORY MANUAL STEP — this is step 6
of the primary procedure at the top of §5. Run the remediation in scope Global *after* the second commit".**
It violates AAP §0.7.2's zero-global-write constraint and the single-clean-commit gate ("no second commit, no remediation script, no live-instance patching"); it is retained only as a record of what an earlier round did on the two superseded hand-authored candidates. A shortfall the package leaves is a source-side defect: correct the package where it is produced and re-run the full gate on the exact candidate bytes — see SUPPORTED INSTALL ROUTE at the top of this guide. On the shipping package the 27 `sys_security_acl_role` links arrive with the single commit, which is
what this section's own 2026-09-08 correction below records:

```bash
"$SNRUN/bg.sh" servicenow-case-management-poc/scripts/post_import_remediation.js global
```

The security-cache flush (`GlideSecurityManager.get().reset()`) happens inside that same run, so there is no
separate step for it — but it is also the reason the run cannot happen in scope, and therefore cannot happen
automatically on commit. **Skipping this step leaves 29 ACLs with 0 role links, and on this high-security
instance an ACL with no role, no condition and no script evaluates to `deny` — no non-admin can use the
application at all.**

Expect on the `SUMMARY` line: `verified=true`, `acl_links_total=36`, `acl_links_expected=36`,
`security_cache_flushed=true`, `errors=0`. The total must be **exactly** 27, distributed manager 14 / agent 10 /
viewer 3; the script rejects a surplus as well as a shortfall and deletes unexpected links, so any other number
means it has not converged.

Why the role links do not arrive from **this** package — **36** of them on the shipping deliverable's 29 ACLs
(manager 17 / agent 13 / viewer 6), 27 on the 26-ACL elected base retained at `…FALLBACK.xml` (manager 14 /
agent 10 / viewer 3) — and, precisely, what does and does not travel. Every
fact below was measured on this release, not assumed:

1. `sys_security_acl` has **no `roles` column** (checked against `sys_dictionary` for the table *and* its
   `sys_metadata` super-class), so the links exist only as rows in the `sys_security_acl_role` m2m table.
   This is unconditional and still true.
2. **The shipping deliverable carries 0 `sys_security_acl_role` rows** of the 36 it needs, so on the package that actually ships
   there is nothing for the commit to apply and the remediation run above is mandatory. That is the operative
   reason here.
3. **Direct `GlideUpdateManager2.loadXML` injection of a hand-authored link payload does not work.** Five
   payload shapes were pushed through it — standalone, with a prolog, nested in the parent ACL's
   `record_update`, wrapped in `<unload>`, and the platform's own captured serialization — and every one
   produced **0 rows with no error**. A `GlideRecord` insert from a global script produces the row. This result
   is about the direct `loadXML` back door, and it does **not** generalise to a normal Update Set commit.

**What IS a proven portable route — measured, and it changes the general claim.** `sys_security_acl_role`
rows that the **platform itself captured** into an Update Set do ride a normal Retrieved Update Set
preview → commit and do land: a single commit produced **27 of 27** links, distributed **manager 14 / agent 10
/ viewer 3**, with `post_import_remediation.js` never run and no second commit. That was measured on
**export 3's byte sequence, 988 blocks / 4,062,436 bytes / SHA-256
`eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`**, on 2026-09-02
([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md)). The retained rebuilt package
(`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`, `e109e1d1…` since the
2026-09-03 choice-composite re-cut, `90ee0249…` before it — a superseded digest that matches no file in this tree) carries those same captured rows in dependency
order; its own complete bytes have never been uploaded, previewed or committed. So the
earlier absolute claim — that the 27 links *cannot be shipped as records at all* — is **too strong and is
withdrawn**: what cannot be shipped is a **hand-authored** link payload pushed through direct `loadXML`, and
**CORRECTED 2026-09-08, re-qualified 2026-09-09 (CR3 F12) — this DOES change the step:** the consolidated 522-block export carries its **27** `sys_security_acl_role` rows in its own payloads, and the shipping bytes (2,985,822 bytes / `5a3c629f…`) still carry the same 27 payloads (measured), so no remediation run is needed for the links. What has been *observed* landing them is the 2026-09-08 revision's commit; the shipping bytes have never been uploaded, previewed or committed, so on them this is a payload measurement and not a commit result ([`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md)). The sentences here are retained as written and describe the superseded hand-authored candidates, both deleted in that consolidation. **For those packages, nothing changes about the step you
are performing:** those packages carry no link rows, so run the remediation exactly as written
above.

Without the links, a high-security PDI evaluates an ACL with no role, no condition and no script as **deny**
("Deny access for empty term"), so no role can use the app.

The remediation derives each ACL's role from the package's own `<roles>` element — role **names**, never
sys_ids — read back out of the ACL's committed `sys_update_version` payload, falling back to the
`.assigned_agent`/`.assigned_group` naming convention and then to the ACL's description. 29 ACLs yield 36 links
because the `assigned_agent` field ACL needs both manager and agent, and the script treats 27 as an invariant:
a shortfall reports `verified=false` rather than silently leaving an ACL that denies everyone.

> **Do not delete `sys_security_acl_role` rows by hand to "reset" the links.** Deleting them fires the platform
> business rule `Update ACL Description on Role Change` (class `ACLDescriber`), which rewrites the parent ACL's
> description to role-less text such as `Allow read for records in x_casemgmt_case, never (all ACL conditions
> are empty).` and destroys the prose copy of the mapping. The remediation recovers from this on its own via
> the committed-payload source above, but there is no reason to provoke it.

Verify:

```bash
source "$SNRUN/env.sh"
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_security_acl_role?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_name&sysparm_limit=100" \
  | python3 -c "import sys,json;print(len(json.load(sys.stdin)['result']),'links (expect 27)')"
```

Then confirm enforcement, not just the record count, with the impersonation `canX` probe in **Section 6.3**
(run **global** — `GlideImpersonate` is blocked in scope). Expected: manager full CRUD on all three tables;
viewer read-only; agent create-only at table level with delete false, and at record level readable/writable on
its assigned case while an unassigned case is filtered out of the query entirely.

### 5h. Grant the three demo personas their scoped roles  *(mandatory — the package cannot carry these)*

> **THIS IS THE FIRST POST-COMMIT ACTION — step 7 of the primary procedure. MOVED HERE 2026-09-09 (code
> review CR5, finding F10).** It used to be step 8 and to sit after §5g, which meant a deployer could reach
> the §6.3 impersonation probe or the §6.4 ATF run with **0** grants and re-derive a wholesale failure that
> says nothing about the application. Do it **immediately after the commit**, before §5g's seed pass: the three
> demo `sys_user` rows arrive with the commit itself, so nothing here waits on the seed script. **The section
> keeps its `5h` label deliberately** — [`deployment.md`](./deployment.md),
> [`validation-gates.md`](./validation-gates.md),
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md),
> [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) and
> `../scripts/seed_demo_data.js` all cross-reference "§5h" / "section 5h", and every one of those references
> must keep resolving — which is
> why §5h is printed **before** §5g. Nothing else in the guide's numbering moved; the acceptance check for
> this step is also a pass condition of the §6.1 census.

**This step is required on every install, and no Update Set can replace it.** The deliverable carries **no
`sys_user_has_role` payload at all**, deliberately: `sys_user_has_role` is owned by Role Management V2 on this
release (`glide.role_management.use.inh_count=true`, with `inherited` / `inh_count` / `inh_map` read-only in the
dictionary), so the update-set loader's permission check on the table answers `false`, the commit **skips** the
row rather than raising, and the log reads `Skipping record for table sys_user_has_role and id <sys_id> -
permission denied` — "permission denied: no thrown error". This was measured at record level with the three
payloads stamped **Global** *and* stamped **`x_casemgmt`**: both were refused, so it is not a capture defect or
a scope-stamping defect, and a package that carries them turns an otherwise clean commit into
`Failed at 100% — the update set commit completed but some updates failed to commit`. Full record:
[`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md), Step 5-6 section §7
(root cause and the three skipped `sys_id`s) and §11.

The authored record-definitions of the three grants are retained for review at
`seed-data/role_assignments/sys_user_has_role_x_casemgmt_demo_manager.xml`, `…_demo_agent.xml` and
`…_demo_viewer.xml`. They are the specification of what this step must produce — not payloads the commit
applies.

**Skipping this step is what makes the application look broken.** Without the grants each persona holds no role
at all: every impersonation-based check in §6.3 reports `F/F/F/F`, and the ATF suite fails wholesale at its
first persona step — 16 of 20 tests, every one of them failing on the step *after* `Impersonate` succeeded, with
`Unable to find record '<sys_id>'` or `g_form is not defined` rather than an authorization message (Step 5-6 §6).

#### The route measured to work: the platform's own Edit Members slushbucket

Do this three times — once per persona. Each grant is its own save.

| # | User (`sys_user.user_name`) | Role to add (`sys_user_role.name`) |
|---|---|---|
| 1 | `x_casemgmt_demo_manager` | `x_casemgmt_case_manager` |
| 2 | `x_casemgmt_demo_agent` | `x_casemgmt_case_agent` |
| 3 | `x_casemgmt_demo_viewer` | `x_casemgmt_case_viewer` |

1. Sign in to the instance UI as an administrator (a real rendered browser session — this control is a form
   widget, not an API). The run that measured this route was working in a session already elevated to
   `security_admin` for §5f; if the **Edit…** control renders read-only, elevate through the user menu's
   **Elevate role** and reopen the form.
2. Navigate to **User Administration → Users**, open the user from the row above (search on `user_name`, not on
   the display name).
3. In the form's **Roles** related list, click **Edit…**. That opens the platform's `sys_m2m_template.do`
   **Edit Members** slushbucket, with *Collection* (all roles) on the left and *Roles List* (this user's roles)
   on the right.
4. Find the role from the row above in *Collection* — filter on `x_casemgmt` — and move it to *Roles List* with
   the screen's own **add** control (`add_to_collection_button`).
5. Click the slushbucket's own **Save** (`sysverb_save`). **One save per grant.** A save diffs the initial state
   against the final state, so batching a removal and an addition of the same membership into a single save is a
   no-op; likewise, do not try to do all three users in one save — they are three different forms.
6. Confirm on the user form that the role now appears in the **Roles** related list before moving to the next
   persona.

**What you should see, and what is not a duplicate.** Alongside each grant the platform derives its own
`inherited=true` companion row (`snc_required_script_writer_permission`, `sys_created_by=system`), so the
`sys_user_has_role` table grows by **two** rows per grant, six for the three personas. That is the platform's
own bookkeeping and the signature of a natively-authored assignment — a direct insert produces no such
companion. Do not delete the companions and do not count them as demo grants.

#### Verify all three grants

```bash
# The check named in the deliverable's own artifacts. Returns the demo personas' role rows.
# Expect the 3 scoped grants - one per role - plus, on the native route above, one
# inherited=true snc_required_script_writer_permission companion per grant.
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SERVICENOW_INSTANCE_URL/api/now/table/sys_user_has_role?sysparm_query=user.user_nameSTARTSWITHx_casemgmt_demo&sysparm_fields=user.user_name,role.name,inherited&sysparm_limit=20"

# The unambiguous form of the same check: exactly THREE rows, one per scoped role,
# each with inherited=false. This is the acceptance criterion for this step.
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SERVICENOW_INSTANCE_URL/api/now/table/sys_user_has_role?sysparm_query=user.user_nameSTARTSWITHx_casemgmt_demo%5Erole.nameSTARTSWITHx_casemgmt_case&sysparm_fields=user.user_name,role.name,inherited&sysparm_limit=20"
```

Pass condition: the second call returns **exactly 3 rows** —
`x_casemgmt_demo_manager` → `x_casemgmt_case_manager`, `x_casemgmt_demo_agent` → `x_casemgmt_case_agent`,
`x_casemgmt_demo_viewer` → `x_casemgmt_case_viewer`. **0 rows** means this step has not been performed; more
than 3 rows on that filter means a persona holds a scoped role it should not, and the extra grant should be
removed through the same Edit Members screen.

#### Scripted alternative, and exactly how far it is proven

`scripts/seed_demo_data.js` Phase C (`ensureRoleAssignment()`) creates the same three grants with a direct
`GlideRecord` insert, resolving the user by `sys_user.user_name` and the role by `sys_user_role.name`, and it is
idempotent — a second run reports `already_present=3` and inserts nothing. It runs as part of §5g, **in scope
`x_casemgmt`** (the same `SCOPE_SYS_ID` invocation as §5g — not Global). **One ordering consequence, added
2026-09-09 (CR5 F10):** taking this route instead of the slushbucket moves the grants from step 7 to step 8,
because they then land with the seed pass — the *Edit Members* route above is the one that keeps them the
**first** post-commit action, and it remains the route measured to work and the one to use wherever provenance
matters:

```bash
: "${SCOPE_SYS_ID:?resolve it first with the sys_scope query in Section 3}"
"$SNRUN/bg.sh" servicenow-case-management-poc/scripts/seed_demo_data.js "$SCOPE_SYS_ID"
```

**What is proven about it:** run unmodified, in scope `x_casemgmt`, on the target PDI on `2026-09-08 18:58:04`,
it created all three `sys_user_has_role` grants first-hand — recorded in
[`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md) Step 3-4 §5 (the run)
and §7 (the grants it produced). Its Phase C now prints
`Phase C role grants: inserted=… already_present=… unresolved=… | scoped-role grants now held by demo
personas=N of 3 expected`, and warns with the remedy on a shortfall, so the outcome is readable from `syslog`
without a separate query.

**What is not:** a direct insert is **not** the platform's native role assignment. It does not produce the
`inherited=true` companion row, and an audit of provenance (which is exactly what the consolidation run's §7
audit performed) will classify it as a script-authored row and may require it to be deleted and recreated
through Edit Members. Where provenance matters — anything you will be asked to attest to — use Edit Members
above and treat the script as the convenience path for a throwaway demo instance.

### 5g. Seed the demo data  *(idempotent)*

> **Step 8 of the primary procedure — run §5h above first (re-ordered 2026-09-09, code review CR5, finding
> F10).** This section keeps its `5g` label and is printed after §5h on purpose; the seed pass is the **second**
> post-commit action.

Run the deliverable's own seed script **in scope** (`scripts/seed_demo_data.js`) to create the 3 demo users,
1 demo group, 10 cases across all six statuses and both case types, demo tasks (open + closed mix), and demo
parties (Person + Organization mix). It resolves all references by `user_name` / `name` / `number`.

```bash
# This is step 8 of the primary procedure. Step 7, the three role grants, is 5h ABOVE and must
# already be done (re-ordered 2026-09-09, CR5 F10). Note the
# scope argument: seeding runs IN SCOPE,
# unlike the remediation, which must run in Global. SCOPE_SYS_ID comes from the Section 3
# query block - re-run that one block now if it was empty before the commit.
: "${SCOPE_SYS_ID:?resolve it first with the sys_scope query in Section 3}"
"$SNRUN/bg.sh" servicenow-case-management-poc/scripts/seed_demo_data.js "$SCOPE_SYS_ID"
```

Do **not** delete the packaged seed rows first — that instruction belonged to an earlier revision. Every
packaged row now carries a pinned number (`CASE9000001`+, `TASK9000001`+, `PARTY9000001`+), and `ensureCase()` /
`ensureTask()` / `ensureParty()` match on that number **first** and adopt the row. Reference fields use
validity-aware reconciliation: the script fills a blank value, repairs a non-`sys_id` raw key or a dangling
`sys_id`, and preserves a valid populated reference even when it is an operator-managed alternative. It also
sets `opened_date` when missing on every adopted or inserted case, while retaining the explicit dates on
`CASE9000006` and `CASE9000010`. A second run must report `repaired=0` and insert nothing. Expect
`cases inserted=0 adopted=10 …` on a committed install; you will see `inserted=10` only if you run the script
on an instance where the package was never committed, in which case the instance counter allocates the numbers
instead. Clear the dangling `sys_user_grmember` row if one is present.

### 5i. Artifacts the shipped package does not carry  *(disclosed shortfall — optional native install route)*

> **ADDED 2026-09-09 (code review CR5, finding F02).** The package installs **12 fewer scoped records than
> this repository holds.** That is a decision, not an accident, and this section is where a deployer is told
> which records they are, what their absence costs at runtime, and how to install them natively if they want
> them. Nothing in this section is required to install the application and none of it is a gate step: this is
> a disclosed shortfall with a documented remedy, not a resolved item.

**The decision, and the reasoning behind it.** These 12 records are **not** re-exported into the package for
this release. The artifact set AAP §0.4.1 enumerates ships complete — its six `x_casemgmt_case` business rules
(`block_draft_backtransition`, `block_terminal_closed`, `set_opened_date`, `set_closed_date`,
`validate_assigned_agent_membership`, `clear_pending_reason_on_inprogress`) are all present, and so is its one
UI policy file, `../ui_policy/x_casemgmt_case_party_conditional_fields.xml`, whose two policy records and two
policy actions the package carries. The 12 below are hardening added by later code-review rounds, which the
AAP's Minimal-Change Clause does not require. Re-exporting the package to pick them up would discard this
candidate's dependency ordering and its actor-metadata redaction and would substitute un-reviewed bytes for
reviewed ones, and adding payload blocks to the XML by hand is prohibited outright. So the shortfall is
disclosed here with a route, and the package is left as it is.

**Re-derive the census yourself before relying on any figure below** — read-only, from the repository root:

```bash
F=servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml
grep -o '<type>Business Rule</type>'    "$F" | wc -l   # 7  - repository business_rules/ holds 12 files
grep -o '<type>Client Script</type>'    "$F" | wc -l   # 0  - repository client_scripts/ holds 3 files
grep -o '<type>Access Control</type>'   "$F" | wc -l   # 26 - repository acl/ holds 29 files
grep -o '<type>UI Policy</type>'        "$F" | wc -l   # 2  - repository ui_policy/ holds 3 policy records in 2 files
grep -o '<type>UI Policy Action</type>' "$F" | wc -l   # 2  - repository ui_policy/ holds 12 policy-action records
```

Both packaged UI policies are the `x_casemgmt_case_party` Person/Organization pair; the policy the package does
**not** carry is the one on `x_casemgmt_case`. **All 12 records exist in this repository**, so every one of them
is recoverable without re-exporting anything.

#### The 12 records, their repository files and their target tables

| # | Repository file | Record, and where it runs | Target table |
|---|---|---|---|
| 1 | [`../business_rules/x_casemgmt_case_display_stored_state.xml`](../business_rules/x_casemgmt_case_display_stored_state.xml) | `x_casemgmt_case_display_stored_state` — `before_display`, order 10, on `x_casemgmt_case` | `sys_script` |
| 2 | [`../business_rules/x_casemgmt_validate_case_mandatory_fields.xml`](../business_rules/x_casemgmt_validate_case_mandatory_fields.xml) | `x_casemgmt_validate_case_mandatory_fields` — `before` insert + update, order 50, on `x_casemgmt_case` | `sys_script` |
| 3 | [`../business_rules/x_casemgmt_validate_case_text_lengths.xml`](../business_rules/x_casemgmt_validate_case_text_lengths.xml) | `x_casemgmt_validate_case_text_lengths` — `before` insert + update, order 70, on `x_casemgmt_case` | `sys_script` |
| 4 | [`../business_rules/x_casemgmt_validate_case_task_integrity.xml`](../business_rules/x_casemgmt_validate_case_task_integrity.xml) | `x_casemgmt_validate_case_task_integrity` — `before` insert + update, order 100, on `x_casemgmt_case_task` | `sys_script` |
| 5 | [`../business_rules/x_casemgmt_validate_case_party_integrity.xml`](../business_rules/x_casemgmt_validate_case_party_integrity.xml) | `x_casemgmt_validate_case_party_integrity` — `before` insert + update, order 100, on `x_casemgmt_case_party` | `sys_script` |
| 6 | [`../client_scripts/x_casemgmt_case_closed_readonly_enforce.xml`](../client_scripts/x_casemgmt_case_closed_readonly_enforce.xml) | `x_casemgmt_case_closed_readonly_enforce` — `onLoad`, on `x_casemgmt_case` | `sys_script_client` |
| 7 | [`../client_scripts/x_casemgmt_case_flush_stale_messages.xml`](../client_scripts/x_casemgmt_case_flush_stale_messages.xml) | `x_casemgmt_case_flush_stale_messages` — `onLoad`, on `x_casemgmt_case` | `sys_script_client` |
| 8 | [`../client_scripts/x_casemgmt_case_party_clear_opposite_reference.xml`](../client_scripts/x_casemgmt_case_party_clear_opposite_reference.xml) | `x_casemgmt_case_party_clear_opposite_ref` — `onChange` on `party_type`, on `x_casemgmt_case_party` (the record name is truncated relative to the file name; that is the authored value) | `sys_script_client` |
| 9 | [`../acl/x_casemgmt_case_query_range_opened_date.xml`](../acl/x_casemgmt_case_query_range_opened_date.xml) | `x_casemgmt_case.opened_date`, operation `query_range`, granted to all three scoped roles | `sys_security_acl` |
| 10 | [`../acl/x_casemgmt_case_query_range_closed_date.xml`](../acl/x_casemgmt_case_query_range_closed_date.xml) | `x_casemgmt_case.closed_date`, operation `query_range`, granted to all three scoped roles | `sys_security_acl` |
| 11 | [`../acl/x_casemgmt_case_task_query_range_due_date.xml`](../acl/x_casemgmt_case_task_query_range_due_date.xml) | `x_casemgmt_case_task.due_date`, operation `query_range`, granted to all three scoped roles | `sys_security_acl` |
| 12 | [`../ui_policy/x_casemgmt_case_closed_readonly.xml`](../ui_policy/x_casemgmt_case_closed_readonly.xml) | *Case Closed Terminal State - Read Only* on `x_casemgmt_case` — **1** `sys_ui_policy` record **plus its 10 `sys_ui_policy_action` rows** (`assigned_agent`, `assigned_group`, `description`, `pending_reason`, `priority`, `requester_email`, `requester_name`, `status`, `subject`, `type`) in the one file | `sys_ui_policy` (+ `sys_ui_policy_action`) |

#### What installing without them costs, concretely

- **No server-side mandatory-field validation on `x_casemgmt_case`** (#2). An empty `subject`, `description` or
  `requester_name` is accepted on every write path that is not the form — the Table API included.
- **No text-length enforcement** (#3): oversized `subject` / `description` / `requester_name` values are stored
  as submitted.
- **No `case_task` referential-integrity guard** (#4): a task can be written without its parent case, subject,
  `assigned_to` or `due_date`.
- **No `case_party` referential-integrity guard** (#5): the "exactly one of `person` / `organization`, matching
  `party_type`" contract of AAP §0.5.7's Conditional rows is unenforced on any non-form write path. The two
  packaged UI policies still enforce it **on the form**; a REST or Table-API write is unguarded.
- **No stored-state display rule** (#1): the `before_display` normalisation of the case's stored state does not
  run, so the form shows the raw stored value.
- **No client-side Closed-case read-only enforcement** (#6 and #12): a Closed case's writable fields are
  presented as editable. The server guard **does** ship — `x_casemgmt_block_terminal_closed` (order 100,
  `before` update) is one of the package's 7 business rules — so the write is still refused with the verbatim
  "Closed cases are terminal and cannot be modified."; what is lost is the form stating the restriction up
  front instead of inviting an edit the server then rejects.
- **No stale mandatory-field banner flush** (#7): a mandatory-field message can persist on the form after the
  named field has been filled.
- **No party opposite-reference clear** (#8): changing `party_type` leaves the previously-populated
  `person` / `organization` reference in place, which is what the integrity guard at #5 would otherwise refuse.
- **No `query_range` grants on `x_casemgmt_case.opened_date`, `x_casemgmt_case.closed_date` and
  `x_casemgmt_case_task.due_date`** (#9-#11). On an instance whose default `query_range` posture is deny, a
  RANGE or relative-date predicate (`>`, `<`, BETWEEN, "at or after", "last 30 days") from a non-admin persona
  is **dropped from the query** rather than refused, so the caller is silently answered a different question —
  the list renders `0` rows with a banner naming the operation, and the Table API answers HTTP 403. Each ACL
  file's own header records that measurement and the reasoning behind the grant;
  [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) carries the register entry.

#### Installing them natively — OPTIONAL, post-commit

This is the platform's own XML record import: the same upload processor §2 and §4.2 already use for
`sys_remote_update_set`, pointed at each record's target table. It writes only into the `x_casemgmt` scope and
runs no script. Do it **after** the commit and after the post-commit sequence (§5h, then §5g), so the tables,
roles and choices the records reference already exist.

**In a browser:** open the target list (`sys_script_list.do`, `sys_script_client_list.do`,
`sys_security_acl_list.do`, `sys_ui_policy_list.do`), right-click the list header → **Import XML**, choose the
repository file, and repeat per file.

**Scripted, in this guide's own idiom** — establish the UI session per Section 3 first:

```bash
SN="$SERVICENOW_INSTANCE_URL"
: "${SNRUN:?run Section 1.1 first, or export SNRUN=<the path it printed>}"
CJ="$SNRUN/cookies.txt"
REPO="servicenow-case-management-poc"

# One file, one target table. The four steps are §4.2's, unchanged: prime the session, GET the
# upload form for THAT target, scrape the form's OWN sysparm_ck, POST the file as multipart.
# The token is single-use and belongs to the form it came from, so it is re-minted per file.
import_record_xml() {   # $1 = sysparm_target table, $2 = repository file
  target="$1"; file="$2"
  [ -f "$file" ] || { echo "MISSING $file"; return 2; }
  curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" -o /dev/null \
    "$SN/api/now/table/${target}?sysparm_limit=1"
  curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" -o "$SNRUN/upload_form.html" \
    "$SN/upload.do?sysparm_target=${target}"
  CK=$(grep -oE 'sysparm_ck"[^>]*value="[^"]{32,}"' "$SNRUN/upload_form.html" \
       | grep -oE 'value="[^"]{32,}"' | sed 's/value="//;s/"//' | head -1)
  [ -z "$CK" ] && { echo "NO_CK on the $target upload form - re-run Section 3, then retry"; return 2; }
  curl -s -K "$SNRUN/sn_curl.cfg" -c "$CJ" -b "$CJ" \
    -F "sysparm_ck=${CK}" -F "sysparm_target=${target}" \
    -F "attachFile=@${file};type=text/xml" \
    "$SN/sys_upload.do" -o "$SNRUN/import_result.html" \
    -w "$(basename "$file") -> ${target}: HTTP %{http_code}\n"
}

# sys_script - the 5 business rules (#1-#5)
for n in case_display_stored_state validate_case_mandatory_fields validate_case_text_lengths \
         validate_case_task_integrity validate_case_party_integrity; do
  import_record_xml sys_script "$REPO/business_rules/x_casemgmt_$n.xml"
done

# sys_script_client - the 3 client scripts (#6-#8)
for n in case_closed_readonly_enforce case_flush_stale_messages case_party_clear_opposite_reference; do
  import_record_xml sys_script_client "$REPO/client_scripts/x_casemgmt_$n.xml"
done

# sys_security_acl - the 3 field-level query_range ACLs (#9-#11)
for n in case_query_range_opened_date case_query_range_closed_date case_task_query_range_due_date; do
  import_record_xml sys_security_acl "$REPO/acl/x_casemgmt_$n.xml"
done

# sys_ui_policy - one file, one policy record PLUS its 10 policy actions (#12). The file is an
# <unload>, so the importer inserts each record under its own element name and sysparm_target
# only selects the form; the sys_ui_policy_action rows arrive with it.
import_record_xml sys_ui_policy "$REPO/ui_policy/x_casemgmt_case_closed_readonly.xml"
```

**Three normalisations the import does not do for you.** Check each one on the record form before you treat any
of these rows as in force:

1. **`Application` on every imported row must read *Case Management*.** All 12 files carry the source PDI's
   scope `sys_id` in `<sys_scope>`, which does not exist on your instance, so a row whose scope did not resolve
   is stranded in Global — and will not appear in the scoped counts below. Re-set the field on the form if so.
2. **`Operation` on the three ACLs must read `query_range`.** Those files carry the operation's human-readable
   **name**, not its `sys_id`, deliberately: AAP §0.7.2 forbids a hard-coded `sys_id` in a reference field. An
   unresolved row renders a blank *Operation* and simply does not participate — inert rather than dangerous.
   Set it from the reference lookup on the ACL form.
3. **Each of the three ACLs needs its three role links.** This release stores ACL role grants in the
   `sys_security_acl_role` m2m table, and the files carry no m2m rows — the `<roles>` element in them is a
   human-readable statement of intent. Add `x_casemgmt_case_manager`, `x_casemgmt_case_agent` and
   `x_casemgmt_case_viewer` on each ACL's **Requires role** list: 3 roles × 3 ACLs takes the scoped link count
   from 27 to 36.

**Verify by count, before and after.** Run this once before the imports and again after; the *before* column is
the package's own payload census, measured from the XML with the `grep` block above and not from any instance,
so a mismatch there is a commit problem rather than something this section can fix:

```bash
SN="$SERVICENOW_INSTANCE_URL"
for t in sys_script sys_script_client sys_security_acl sys_security_acl_role \
         sys_ui_policy sys_ui_policy_action; do
  printf '%-24s ' "$t"
  curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
    "$SN/api/now/table/$t?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_id&sysparm_limit=200" \
    | grep -o '"sys_id"' | wc -l
done
```

| Table | From the commit alone (the package's payload census) | After all 12 are imported |
|---|---|---|
| `sys_script` | 7 | 12 |
| `sys_script_client` | 0 | 3 |
| `sys_security_acl` | 26 | 29 |
| `sys_security_acl_role` | 27 | 36 — **only** after normalisation 3 above; the import alone leaves it at 27 |
| `sys_ui_policy` | 2 | 3 |
| `sys_ui_policy_action` | 2 | 12 |

**What importing them means for the package.** An instance carrying these 12 records **diverges from the
shipped package**: a later re-preview of the same XML sees rows the package does not describe, and no checksum
or block count in this guide changes. A deployer who wants them *in the package* must restore them at source —
install them on the instance the package is exported from and re-export under the packaging procedure, then
re-run the full gate on the new bytes — and must **not** hand-edit the deliverable XML to add payload blocks.

---

## 6. Post-commit validation gates

### 6.1 Metadata / inventory (REST, runs as admin)

> **✅ The three scoped tables ARE verifiable through the REST Table API, and reads from global scope work.**
> `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` answers **HTTP 200** as `admin` for all three tables,
> because the package ships `ws_access` and `read_access` as boolean `true`. An earlier revision of this guide
> recorded **HTTP 403** and told you never to read these tables from global scope; that was the
> boolean-versus-string packaging defect (`"public"` stored into a boolean column lands `false`), and it is
> fixed — see PDI_LIMITATIONS_AND_KNOWN_ISSUES.md §9.6 **E9**. Two things are worth knowing:
>
> - **A stale table descriptor can make a corrected flag look ineffective.** Writing the access columns flushes
>   the `sys_db_object` catalogue but not `syscache_tabledescriptor`. Touch the table's **collection**
>   `sys_dictionary` row (`element` empty) with a value that genuinely changes and then restore it;
>   `scripts/post_import_remediation.js` does exactly that.
> - **Cross-scope WRITES are refused on purpose.** `create_access`, `update_access` and `delete_access` are
>   `false`, so a global-scope `GlideRecord` insert/update/delete answers *"… has been refused due to the
>   table's cross-scope access policy"*. Application Access is a gate separate from the record ACLs, so an open
>   write column would let un-ACL'd global code mutate cases. Run anything that writes application data **in
>   scope** (`sys_scope = x_casemgmt`).
>
> **A row-count check from inside the application scope is still worth running**, because it proves the tables
> hold data and not merely that they answer (*Scripts - Background*, "In scope" =
> **x_casemgmt Case Management**):
>
> ```javascript
> // In scope = x_casemgmt Case Management
> var t = ['x_casemgmt_case', 'x_casemgmt_case_task', 'x_casemgmt_case_party'];
> for (var i = 0; i < t.length; i++) {
>     var gr = new GlideRecord(t[i]);
>     gr.query();
>     gs.info('GATE1|' + t[i] + '|rows=' + gr.getRowCount());
> }
> ```
>
> Read the results back from `syslog` (message starts with `GATE1`). A healthy install reports non-zero rows for
> all three; the verification instance last reported 11 / 10 / 8. This is an additional confirmation, not a
> workaround for the old HTTP 403 — that condition is fixed.

The role and scope checks below **do** work over REST, because those are global tables:

```bash
SN="$SERVICENOW_INSTANCE_URL"
for r in x_casemgmt_case_manager x_casemgmt_case_agent x_casemgmt_case_viewer; do
  curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
    "$SN/api/now/table/sys_user_role?sysparm_query=name=$r&sysparm_fields=name"
done
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=scope,sys_id"

# The single most informative post-install check: the ACL role links must number EXACTLY 27.
# 0 means step 6 has not run; anything other than 27 means it has not converged.
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_security_acl_role?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_id&sysparm_limit=100"

# The three demo-persona role grants: EXACTLY 3 rows, one per scoped role. This is §5h's
# acceptance check, and 0 rows is the single most common reason a persona-based test fails.
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_user_has_role?sysparm_query=user.user_nameSTARTSWITHx_casemgmt_demo%5Erole.nameSTARTSWITHx_casemgmt_case&sysparm_fields=user.user_name,role.name,inherited&sysparm_limit=20"

# Corroborating counts: 29 ACLs, 9 case Business Rules, and 7 flows all active AND published.
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_security_acl?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,operation&sysparm_limit=50"
curl -s -K "$SNRUN/sn_curl.cfg" -H "Accept: application/json" \
  "$SN/api/now/table/sys_hub_flow?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=internal_name,active,status&sysparm_limit=20"
```

**CENSUS PASS CONDITION — the role grants. ADDED 2026-09-09 (code review CR5, finding F10).** This census does
not pass unless **`sys_user_has_role` filtered to the three demo personas and the three scoped roles returns
EXACTLY 3 rows.** That is the `sys_user_has_role` call above, and the three rows are
`x_casemgmt_demo_manager` → `x_casemgmt_case_manager`, `x_casemgmt_demo_agent` → `x_casemgmt_case_agent` and
`x_casemgmt_demo_viewer` → `x_casemgmt_case_viewer`, each `inherited=false`. It is a **pass condition of this
census**, not a troubleshooting hint: anything other than 3 is a census failure, and you stop here rather than
continuing to §6.2.

- **0 rows** — every persona holds no role, every impersonation check in §6.3 reports `F/F/F/F`, and the ATF
  suite in §6.4 fails wholesale at its first persona step. Run **§5h** (step 7, the first post-commit action),
  then re-run this census.
- **More than 3 rows** on that filter — a persona holds a scoped role it should not; remove the extra through
  the same *Edit Members* screen. The `inherited=true` `snc_required_script_writer_permission` companion row
  the platform derives alongside each native grant is **not** counted by this filter (its role name does not
  start `x_casemgmt_case`), so six rows on the wider `user.user_nameSTARTSWITHx_casemgmt_demo` query is the
  healthy native-route signature, not a surplus.

Expected from the last call: seven rows — `general_inquiry_state_machine`, `complaint_state_machine`,
`validate_open_transition`, `validate_in_progress_transition`, `validate_pending_transition`,
`validate_resolved_transition`, `validate_closed_transition` — every one `active=true` **and**
`status=published`. A flow in `draft` enforces nothing.

### 6.2 Portal endpoints (anonymous path is the real test)

```bash
SN="$SERVICENOW_INSTANCE_URL"
# anonymous submit -> HTTP 201 {number, "Your case has been submitted"}
curl -s -H "Content-Type: application/json" -X POST \
  -d '{"subject":"Smoke test","type":"General Inquiry","description":"x","requester_name":"Tester"}' \
  -w "\nsubmit HTTP %{http_code}\n" "$SN/api/x_casemgmt/case_submit"
# status lookup, unknown number -> HTTP 404 "No case found with that number."
curl -s -w "\nlookup HTTP %{http_code}\n" "$SN/api/x_casemgmt/case_status_lookup?number=CASE9999999"
```

Portal UI: `$SERVICENOW_INSTANCE_URL/x_casemgmt_case_portal` — on the current validation instance,
`https://dev306625.service-now.com/x_casemgmt_case_portal`.

> **Both portal pages render and work anonymously.** Earlier revisions of this guide warned that they came up
> blank; that was a real packaging defect and it is fixed. Two things were wrong: the Service Portal layout
> records (`sp_container` / `sp_row` / `sp_column` / `sp_instance`) had never been authored, so
> `GET /api/now/sp/page` returned `containers: []`; and both widgets read `response.data.<field>` where a
> Scripted REST body is nested under `result`, so a successful 201 displayed "Submission failed". The package now
> carries the layout chain for both pages (`portal/layout/`) and both widgets unwrap defensively. Open
> `?id=x_casemgmt_case_submit` and `?id=x_casemgmt_case_status` in a private window: the first offers the five
> fields and returns a confirmation panel with the new `CASE…` number, the second returns Status / Subject /
> Opened Date or the verbatim `No case found with that number.` The `curl` checks above remain valid and are the
> quickest smoke test.

> Remember to delete any smoke-test cases afterward so the demo dataset does not drift. The current census on the
> verification instance is **10 cases, 10 tasks and 8 parties** — the extra smoke-test case that made it 11 in an
> earlier revision of this note was removed by the teardown and re-seed of §0.3, and the probes run since have
> each been deleted after measurement.

### 6.3 ACL matrix (impersonation `canX` probe — run **global**)

`GlideImpersonate` is blocked **in scope**, so impersonate from a **global** script. `canCreate/canRead/
canWrite/canDelete` evaluate the ACLs even though a global script cannot read the scoped *data*:

```javascript
function probe(label){ var g=new GlideRecordSecure('x_casemgmt_case');
  gs.print(label+' C='+g.canCreate()+' R='+g.canRead()+' W='+g.canWrite()+' D='+g.canDelete()); }
var ADMIN=gs.getUserID();
function uid(un){ var u=new GlideRecord('sys_user'); u.addQuery('user_name',un); u.query(); return u.next()?u.getUniqueValue():null; }
var imp=new GlideImpersonate();
[['MANAGER','x_casemgmt_demo_manager'],['AGENT','x_casemgmt_demo_agent'],['VIEWER','x_casemgmt_demo_viewer']]
  .forEach(function(p){ imp.impersonate(uid(p[1])); probe(p[0]); });
imp.impersonate(ADMIN);
```

Expected (matches AAP §0.5.6): `MANAGER C/R/W/D = T/T/T/T`; `AGENT = T/F/F/F` (create yes, no delete, no
*unconditional* read/write — assigned-only); `VIEWER = F/T/F/F` (read-only).

> **`F/F/F/F` for all three personas means §5h has not been run**, not that the ACLs are wrong: a user with no
> role matches no ACL. Verify the three grants with the `sys_user_has_role` call in §6.1 before diagnosing
> anything else here.

> After any impersonation test, **re-run Section 3** to guarantee a clean `admin` session before
> continuing.

---

### 6.4 Run the automated test suite (the strongest single check)

The application ships a 20-test ATF suite that asserts the data model, the whole role × CRUD matrix, every row of
the transition matrix including the three verbatim blocking messages, and the three portal REST contracts. Running
it is the fastest way to know the install is sound.

- **Prerequisite, and it is not in the Update Set:** set `sn_atf.runner.enabled = true` (*sys_properties*). It is
  an instance test-harness setting, deliberately not captured — importing an application should not silently
  enable test execution on someone's instance. Expect the platform to also flip `sn_atf.schedule.enabled` to
  `true` as a side effect; that is its own business rule, not a choice.
- **A browser-attached client runner is required here.** `sn_atf.headless.enabled` is `false` on this instance and
  could not be enabled, so open `/atf_test_runner.do?sysparm_nostack=true` in a second tab **before** launching
  the suite and select it under "Pick a Browser". Three of the tests drive a real form.
- **Run steps 4-8 of the primary procedure first**, and note that since 2026-09-09 (CR5 F10) the **role grants
  are step 7** and the seed pass is step 8. Without physical tables and the ACL role links the suite
  fails wholesale and tells you nothing about the application; without **step 7's three role grants (§5h)** it
  fails just as wholesale for a different reason — 16 of 20 tests fail on the step *after* `Impersonate`
  succeeds, because a persona with no role cannot read the rows the test then asks for (Step 5-6 §6 of
  [`refine-run/CONSOLIDATION-FINAL-REPORT.md`](./refine-run/CONSOLIDATION-FINAL-REPORT.md)).
- **Expected result once steps 4-8 have been run: 20 Success / 0 Failure / 0 Error / 0 Skipped, with 180 of 180
  step results Success**, in roughly 4 minutes, leaving no test records behind. That rollup was reproduced twice
  independently (`TES0001016` and `TES0001017`, 2026-08-10) — on an instance where the remediation had already
  created the 24 `sys_choice` rows, which is what makes it the *post-remediation* expectation rather than a
  package-alone one. **Run the suite before those steps and 14 / 6 is the last measured outcome, not a defect in
  the install:** on 2026-09-02 a bare commit with no remediation scored `TES0001002` = 20 tests, **14 Success /
  6 Failure / 0 Error / 0 Skipped**, 180 of 180 steps executed, the six failures being `ATF 01`, `ATF 10`,
  `ATF 15`, `ATF 16`, `ATF 17` and `ATF 18`, every one of them caused by the missing `sys_choice` rows for the
  three scoped tables ([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) §(e)). **That root cause is
  addressed in the packages now on disk** — since 2026-09-03 both carry native choice composites that a commit
  materialises into all 24 rows — **but the suite has not been re-run on those bytes, so 14 / 6 remains the last
  measured pre-remediation rollup and no newer one may be quoted.** Those six are the tests to re-check first,
  and they are the ones the choice fix is expected to move. **Record your own rollup rather than looking for a particular
  `TES…` row:**
  `sys_atf_test_suite_result` is not durable on this shared instance, and the `TES0001015` row this line used to
  cite no longer resolves ([`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §8.3](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)). An
  earlier run scored 16 / 4; those four failures were the child-table ACL condition and the three form-level
  assertions, both since fixed, so a 16 / 4 today means something in the install is incomplete rather than the
  suite being wrong.

[`ATF_MANUAL_TEST_PLAN.md`](./ATF_MANUAL_TEST_PLAN.md) documents what each test asserts and how to rebuild the
suite by hand if an instance refuses the serialized records.

## 7. Quick reference — key identifiers

| Artifact | Identifier |
|---|---|
| Scope / `sys_app` | `x_casemgmt` — `82b99028936f74320d74d6f88357a5af` **on the current validation instance only**; resolve it per instance with `GET /api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=sys_id` (Section 3) and pass `"$SCOPE_SYS_ID"`, never this literal |
| Roles | `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer` |
| Demo users | `x_casemgmt_demo_manager`, `x_casemgmt_demo_agent`, `x_casemgmt_demo_viewer` |
| Demo group | `x_casemgmt_demo_team` (member: Demo Agent) |
| Portal URL | `<instance URL>/x_casemgmt_case_portal` — `https://dev306625.service-now.com/x_casemgmt_case_portal` on the current validation instance |
| REST submit | `POST /api/x_casemgmt/case_submit` |
| REST lookup | `GET /api/x_casemgmt/case_status_lookup?number=<CASE…>` |
| Dashboards | `x_casemgmt_agent_workspace` (3 widgets; shared with the agent and manager roles), `x_casemgmt_manager_view` (5 widgets; manager only) — both `pa_dashboards`, each gated by a `pa_dashboards_permissions` share row **and** `restrict_to_roles` |
| Case-form related lists | `sys_ui_related_x_casemgmt_case_null` — *Case Tasks* (`x_casemgmt_case_task.case`) above *Case Parties* (`x_casemgmt_case_party.case`), Default view |
| Verbatim messages | "All tasks must be closed before resolving this case." / "Cases cannot be returned to Draft." / "Closed cases are terminal and cannot be modified." / "No case found with that number." / "Your case has been submitted" |

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `bg.sh` prints `NO_CK` | UI session expired/destroyed | Re-run **Section 3** (form login); `sys_action=sysverb_login` is required |
| `sys.scripts.do` returns empty body | Basic-auth-only session (no UI session) | Re-run **Section 3** |
| Preview shows `sys_scope` name-resolution errors | The XML being imported is not the deliverable, or has been edited | Re-download the deliverable and check its SHA-256 against §1. The package carries exactly one application record (`app/sys_app/x_casemgmt_case_management.xml`) and no standalone `sys_scope` artifact — the platform derives the scope from it |
| `case_task` / `case_party` not visible after commit | Commit does not DDL new tables (Defect C) — measured on the superseded hand-authored candidates | ~~Run **5a** — that is step 4 of the primary procedure, not an exception~~ ⛔ **NOT A SUPPORTED STEP (CR3 2026-09-09 · F16).** §5a is retained as history only. The shipping 522-block package carries the platform-captured `sys_db_object` / `sys_dictionary` / `sys_documentation` records, so the tables arrive with the commit. If they do not, stop: that is a source-side defect to correct in the package and re-gate, not something to patch from Global |
| New cases get no `CASE…` number, or get `CASE1` instead of `CASE0000001` | **Package integrity, not the platform.** Both halves of auto-numbering ship in the package: `default_value = javascript:global.getNextObjNumberPadded();` on the `number` dictionary entry (the `global.` qualifier is mandatory for a scoped table) and `maximum_digits = 7` on the counter | Verify those two values landed, then re-run the remediation in Global — §5b re-asserts both. If they are absent from the *artifacts*, the package is wrong and no amount of instance work fixes it |
| All REST calls return HTTP 400 | **Package integrity:** `sys_ws_definition.service_id` is the URL path segment and it is empty | The package carries both `service_id` values; verify they committed, then re-run the remediation — §5d re-asserts them. Also confirm the base path is `/api/x_casemgmt/…` |
| Anonymous REST call returns 401 rather than 201/200/404 | The endpoint's anonymous access flag did not land, or you are hitting the **Table** API instead of the scripted REST path | Only `/api/x_casemgmt/case_submit` and `/api/x_casemgmt/case_status_lookup` are anonymous. The Table API is *not* anonymous and rejecting it is correct behaviour, not a defect |
| Manager/agent/viewer denied everything | **Check the role grants first, then the ACL role-links.** A demo persona holds no role until §5h has been run — the package cannot carry `sys_user_has_role` on this release — and a user with no role matches no ACL. Missing ACL role-links (Defect 9) produce the same symptom for a user who *does* hold a role | Run the `sys_user_has_role` check in §6.1: it must return **exactly 3** scoped grants — that is a pass condition of the census, not an optional probe. If it returns 0, do **§5h**, which since 2026-09-09 (CR5 F10) is **step 7 of the primary procedure and the first post-commit action**, so on a correctly-followed install this symptom should not arise. If the grants are present, run **5f** — step 6 of the primary procedure — then confirm **exactly 27** links, distributed manager 14 / agent 10 / viewer 3 |
| Resolve allowed with open tasks, or any precondition not blocking | **Check the enforcement chain, in this order.** (1) Are the 7 flows `active=true` and `status=published`? They were measured so; a Draft flow enforces nothing. (2) Is the before-update Business Rule **`x_casemgmt_enforce_forward_transitions` (order 250)** present and active? It is the component that calls the subflow and then issues `gs.addErrorMessage()` + `setAbortAction(true)` — **without it the flows still run but nothing blocks**. (3) Is `CaseTransitionValidator` present? The rule and the flows both call it | The earlier "flow guards are dead shells" (Defect F) diagnosis applied to a previous revision and no longer describes this package — see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` for that history |
| Dashboards open but show no widgets | **Fixed in the current package** — if you see this, you are installing an older export whose dashboard artifacts named three child tables this release does not have (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`) | Not remediable by installing differently. Use the current export, whose dashboards carry `sys_portal_page` / `sys_grid_canvas` / `pa_tabs` / `pa_m2m_dashboard_tabs` / `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` / `pa_dashboards_permissions` (register §0.5) |
| A dashboard opens with *"has not been shared with you"* | Expected for two persona/dashboard pairs **by design** — the agent is not granted Manager View, and the viewer is granted neither. Unexpected for anyone else, in which case the share records did not land | Confirm `pa_dashboards_permissions` rows exist (type `1` = Role) **and** that `pa_dashboards.restrict_to_roles` names the role. Both are required; the sibling column `pa_dashboards.roles` is labelled *"Requires Roles"* and only narrows (register §4 item 18) |
| A chart is grouped by the wrong field | **Fixed in the current package.** The chart reports used to carry their grouping in `<group_by>`, which is **not a column** on `sys_report` on this release, so it was discarded on import; the column a chart groups on is `field` (register §0.6.1) | Use the current export. If you must patch an old one: rename the element to `field` in the four chart `reports/*.xml` and their four payloads, then re-export |
| A report opens as *"private"* or is refused to every persona | `sys_report.user` is empty. The read ACL only evaluates `roles` on the `isGlobal` path, so a report with roles but no `user` is private to its owner | Set `sys_report.user` to the literal `GLOBAL` **and** populate `roles`. All 8 packaged reports carry both (register §0.6.1) |
| The case form shows no related lists | **Fixed in the current package** — but this can also be a *cache* symptom on an instance that rendered the form before the definition arrived, in which case *Configure ▸ Related Lists* will misleadingly show both lists as Selected while the form stays empty | Open a case → context menu → **Configure ▸ Related Lists** → press **Save** with nothing moved. A REST `PUT` of the same values is a no-op and will not clear it (register §4 item 17, `deployment.md` step 12) |
| Portal pages are blank | **Fixed in the current package** — the Service Portal layout records (container / row / column / instance) had never been authored | Use the current export. The REST endpoints work regardless and can be used to demonstrate the contract |
| `Organization` is empty on every Case Party for a non-admin user | Not a defect in this application. `core_company` is a global out-of-box table and the demo personas cannot read it, so the platform strips the column from their payload; `admin` sees the real value | Disclosed as **ADV-1** in register §0.9. The only remedy is a grant on `core_company`, which AAP §0.3.2 forbids |
