# PDI Limitations and Known Issues — `x_casemgmt` Case Management POC

> **Purpose:** an honest, complete record of (1) every code-generation/packaging **defect** found in the
> deliverable Update Set and how it was remediated, (2) the **flow-serialization defect** that required the
> seven Flow Designer flows to be re-authored natively, (3) the ServiceNow **PDI platform limitations**
> encountered, (4) what was intentionally **not done** per scope/constraints, (5) the **automated regression
> suite** and its honest coverage (§8), (6) the **clean-instance round trip**, the regression report and the
> **residual manual footprint** (§9), and (7) the **recommended next steps** (§10). It also gives the precise
> code-generation fixes recommended for the next generation pass.
>
> This document deliberately does **not** overstate the result. Every claim of runtime enforcement below was
> observed on the live instance rather than inferred from the presence of records; where a result is partial
> or depends on an operational step, that is stated explicitly.
>
> **Read §9 first if you are about to deploy this.** A clean-instance round trip established that upload →
> preview → commit previews with **zero errors** but does **not** by itself produce a fully functional
> application: Defects C and 9 need one manual remediation run, and three further gaps are open — the portal
> page layout and the child-table ACL conditions, neither of which is a packaging problem, and the two
> dashboards, which is one (their tab child names a table this release does not have). §9.5 is the
> step-by-step install procedure that actually works; §9.9 re-states every gate as measured at the very end
> of the pass. Where an earlier revision of this document claimed the residual human
> footprint was "none", that claim has been measured, found false, and withdrawn.

---

## 1. Executive summary

| Capability | Runtime status on the PDI |
|---|---|
| 3 custom tables + fields + choices + auto-number | ⚠️ **Working, but not from the package alone.** The physical schema is built by `scripts/post_import_remediation.js`. The package ships that script *and* an auto-execute trigger, and the trigger demonstrably **fires** on commit — but it **cannot succeed**, because the commit engine forces the record's `sys_scope` to the application and the script's `GlideTableDescriptor`/`GlideSecurityManager` calls are then refused in scoped execution (§9.4). On a genuinely clean instance the tables therefore arrive as metadata with **no physical storage**, and one manual remediation run is required (§9.5, step 4). Auto-numbering itself *is* carried by the package artifacts (§2 Defect E): after remediation a fresh insert produced `CASE0000448`, matching `^CASE[0-9]{7}$`. |
| 3 roles + ACL role × CRUD matrix (manager/agent/viewer, incl. assigned-only + field ACLs) | ⚠️ **Working, but not from the package alone.** A clean commit produces the 26 ACLs with **0 of 27** `sys_security_acl_role` links; the 27 links and the security-cache flush appear only after the remediation is run manually (§9.4–§9.5). Once run, the live 12-cell matrix is correct: manager full CRUD on all three tables; agent create with **no blanket** read/write and `delete=false`; viewer read-only. **Record-level narrowing empirically confirmed for both halves of the AAP §0.5.6 "Assigned only" definition** — impersonated agent sees 9 of 14 cases; `CASE0000453` and `CASE0000458` are visible with an *empty* `assigned_agent`, so group membership is the only possible grant path, and the five cases with neither group nor agent are absent. Direct-URL access to an unassigned row returns "Security constraints prevent access to requested page". Field-level ACLs confirmed too: the agent sees `assigned_group` read-only while `assigned_agent` stays editable. **Caveat:** the agent's *child-table* narrowing does not work — see ATF 07 in §8.3 and §9.6 E-ATF. |
| Prohibited-transition guards (Any→Draft, Closed→*) | ✅ Working (Business Rules) |
| Transition side-effects (`opened_date`, `closed_date`, clear `pending_reason`) | ✅ Working (Business Rules) |
| `assigned_agent` must be a member of `assigned_group` (when an agent **is** set) | ✅ Working (Business Rule) |
| Anonymous portal **REST contract** (submit → Draft + number; lookup → whitelisted) | ✅ Working. `service_id` is carried by the package itself (§2 Defect 7), and the two `sys_ws_operation` payloads were re-synced from their authoritative artifact files in this pass (§9.3, deliverable edit 2). Re-verified after the clean-instance round trip with **no credentials on the request**: `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE0000450","message":"Your case has been submitted"}`; `GET …/case_status_lookup?number=CASE0000450` → **200** with body keys exactly `{status, subject, opened_date}` and all seven internal fields absent; `?number=CASE9999999` → **404** `{"error":"No case found with that number."}` — byte-compared to the required literal, 31/31 bytes identical including the trailing full stop. |
| Anonymous portal **pages** (`/x_casemgmt_case_portal` submit + status-lookup screens) | ❌ **Not working — the pages render blank.** The portal is reachable anonymously with no login wall (HTTP 200, zero redirects), but `GET /api/now/sp/page` returns `containers: []` for all three routes, so the Angular template instantiates **zero widget instances**: 0 labels, 0 inputs, 0 forms, 0 buttons. The `sp_portal`, `sp_page` and `sp_widget` records are all present and healthy — what was **never authored** is the layout (`sp_container` / `sp_row` / `sp_column` / `sp_instance`). Confirmed pre-existing, not introduced by this pass: no such artifact exists anywhere in the repository, none is in the Update Set, and none was in the pre-refine package either. See §9.6 E8-P. |
| Reports (8) + Dashboards (2) records + demo data | ⚠️ Reports ✅ present and backed by populated tables. **Dashboards ❌ cannot render** — measured precisely: both `pa_dashboards` rows *do* commit and are live, but each composite block also carries a tab child serialized as **`<pa_tab>`**, and the table on this release is named **`pa_tabs`** — so that child fails with `Table 'pa_tab' does not exist` on every import, `pa_m2m_dashboard_tabs` stays empty for both dashboards, and a dashboard with no tab shows no widgets. A one-element packaging defect in the deliverable, pre-existing and not introduced by this pass (§9.6 E5). Demo data ✅ restored to the AAP §0.7.4 thresholds, but **only after** deleting the packaged seed rows first (§9.6 E1). |
| **Forward-transition precondition guards** (Draft→Open needs group; Open→In&nbsp;Progress needs agent-in-group; In&nbsp;Progress→Resolved needs all tasks closed; Resolved→Closed needs manager role) | ✅ **Enforced at runtime, blocking on the form** — all 7 Flow Designer flows were re-authored natively and now execute; the order-250 before-update Business Rule runs the matching validation subflow synchronously and aborts the save with the verbatim message. Verified on the live case form for **both** case types (Defect F, §3). |

**Bottom line.** The application logic is sound: the data model, access control, prohibited-transition
protection, side-effects, the forward precondition guards and the portal **REST contract** all work, and the
*positive precondition* checks for forward state transitions run and block invalid transitions on the form —
the seven flows that contain them were re-authored through Flow Designer itself and are invoked synchronously
from a before-update Business Rule.

**What the package alone does *not* deliver.** A clean-instance round trip performed in this pass
(§9) shows that upload → preview → commit **previews with zero errors** but does **not** by itself yield a
fully functional application. Two things need one manual remediation run (Defect C, physical schema; Defect 9,
the 27 ACL role links); the demo data needs the packaged seed rows deleted before the seed script can work;
and three things are broken independently of packaging — the portal **pages** render blank because their layout
records were never authored, the two dashboards install but cannot render because their tab child is serialized
under a table name this release does not have (`pa_tab` vs `pa_tabs`), and the agent's child-table ACL
conditions cannot compile. Every one of these is enumerated with a precise
step-by-step remedy in §9.5 and §9.6. Acceptance path **(b)** of the Refine-PR brief therefore applies, not (a).

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

### Defect C — Update Set commit does not trigger DDL for **new** tables  *(platform limitation; now automated inside the package)*
**Verdict: automated by an auto-executing script shipped in the package. No human step.**

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
- **Remediation, now in the package.** `scripts/post_import_remediation.js` builds the tables, all 25 fields
  and all 24 choice values from the deliverable's own specs (`../tables/*.xml`, `../dictionary/*.xml`,
  `../choices/*.xml`, which mirror `docs/data-model.md`), and the package **auto-executes** it on commit —
  see the trigger described under Defect 9 and in §4.14. Idempotent: a table that is already physical is left
  strictly alone, and the clean-slate rebuild only ever deletes metadata-only rows for a table with no
  physical storage, so it can never destroy data.
- **Cross-check for whoever runs the clean import.** Because the DDL provably cannot happen until after the
  commit completes, the 28 **seed-data** blocks (10 Case, 10 Case Task, 8 Case Party) cannot land on a
  genuinely clean import: applying a data payload to a table that has metadata but no physical storage was
  measured to return without throwing and insert nothing (`GlideRecord.query() - invalid table name: …`), the
  same silent-skip behaviour as Defect 9's link payloads. Demo data is not part of the acceptance criteria for
  package self-sufficiency (tables, numbering, REST, RBAC), and it is restored by running
  `scripts/seed_demo_data.js` **in scope** afterwards, exactly as this guide already prescribes.

### Defect D — Cross-scope write/read barrier for background scripts  *(platform behavior; worked around)*
- **Symptom:** a `global` background script could neither create nor read rows in the scoped `x_casemgmt_*`
  tables (writes refused; reads return 0 rows).
- **Root cause:** background scripts execute in `rhino.global`; scoped tables refuse cross-scope data access
  by default.
- **Remediation/Workaround:** run background scripts **in scope** by passing the scope **sys_id**
  (`82b99028…`) as the `sys_scope` parameter to `sys.scripts.do`. (This same barrier complicates ACL
  impersonation testing — see §3.)

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

### Defect 9 — ACL → role link records entirely missing  *(now automated inside the package)*
**Verdict: automated by an auto-executing script shipped in the package. No human step. Cannot be shipped as
records — see the negative result below.**

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
- **Remediation, now in the package.** `scripts/post_import_remediation.js` creates the 27 links and flushes
  the security cache, and the package auto-executes it on commit (see the trigger below). The
  `.assigned_agent` field ACL needs both manager and agent, which is why 26 ACLs yield 27 links (manager 14,
  agent 10, viewer 3). The script asserts that total as an invariant: a shortfall, an unexpected ACL count, or
  any ACL it could not map makes the run report `verified=false` rather than quietly leaving a role-less ACL
  that would deny everyone.
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
- **The security-cache flush is automated, not an instruction.** `GlideSecurityManager.get().reset()` runs in
  the same pass, in global scope (it is unavailable to a scoped caller). Without it the links exist but
  enforcement does not change, which is the difference between "the records are there" and "access control
  works".
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
- **How the remediation auto-executes.** The package ships
  `scripts/sys_script_x_casemgmt_post_import_bootstrap.xml` — a **global-scope, after-update Business Rule on
  `sys_remote_update_set`**, `order=1000`, condition `current.state.changesTo('committed')`. It carries no
  logic of its own: it resolves the Fix Script `x_casemgmt Post-Import Remediation` (which carries
  `post_import_remediation.js` verbatim) **by name** and dispatches it with
  `new GlideScopedEvaluator().evaluateScript(fix, 'script', null)`, inside a try/catch so it can never abort a
  commit. Both records are folded into the Update Set at positions 103 (Fix Script) and 104 (Business Rule),
  after every record the remediation repairs. Fuller rationale, the rejected alternatives, and the exact
  post-commit verification signal are in §4.14.

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
2. **Cross-scope data barrier.** A `global` background script cannot create or read scoped `x_casemgmt_*`
   data; run in scope (sys_scope = scope sys_id). (See Defect D.)
3. **`GlideImpersonate` is blocked in scoped scripts** (`SecurityException`). Impersonation-based ACL tests
   must run in a **global** script. Conveniently, `GlideRecordSecure.canCreate/canRead/canWrite/canDelete`
   evaluate ACLs correctly from global even though *data* reads are blocked — this is how the ACL matrix was
   validated.
4. **`ws_access = false` on scoped tables blocks the Table API.** `GET /api/now/table/x_casemgmt_case` is not
   the intended access path; internal users use the native list/form UI, external users use the scripted REST
   portal endpoints. (This is by design, but means demo users can't be tested via Table API.)
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
    | **Global after-update Business Rule on `sys_remote_update_set`, condition `current.state.changesTo('committed')`** | ✅ the `sys_script` payload is applied by the engine with `collection`/`when`/`condition`/`order`/`active`/`script` intact | ✅ fires on the state write, executing in `rhino.global` where `GlideTableDescriptor` works and `sys_dictionary.update()` succeeds | **ADOPTED** |
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

    **Post-commit verification signal.** Every line the remediation emits is a `gs.info()` prefixed
    `X_CASEMGMT_REMEDIATION|`. Read them with
    `GET /api/now/table/syslog?sysparm_query=messageSTARTSWITHX_CASEMGMT_REMEDIATION^ORDERBYDESCsys_created_on`
    (or *System Logs → All*, message starts with `X_CASEMGMT_REMEDIATION`). Expect, written synchronously
    during the commit: one `…|BOOTSTRAP|fired|remote_update_set=<name>|state=committed|scope=rhino.global`,
    one `…|SUMMARY|verified=true|…|errors=0`, and one
    `…|TRIGGER|x_casemgmt Post-Import Bootstrap|deactivated after successful remediation`. On a genuinely clean
    instance the summary should read `tables_built=3` and `acl_links_created=27`, because those counters
    increment only when the script actually creates something; on a re-run it reads `tables_already=3` and
    `acl_links_already=27`. (Both halves have been observed separately: `created` counters incrementing when
    the objects were genuinely missing, and the `already` form on repeat runs. The exact clean-install figures
    are what the clean-instance round trip should confirm.) The created-vs-already counters are how a real
    first install is told apart from a repeat. Corroborating checks that need no log reading: the Business Rule
    `x_casemgmt Post-Import Bootstrap` reads `active=false`; `sys_security_acl_role` filtered to
    `sys_scope.scope=x_casemgmt` returns **27** rows; and `x_casemgmt_case_task` / `x_casemgmt_case_party`
    answer HTTP 200 on the Table API.

    Idempotency was proved by running the shipped Fix Script twice back-to-back: both runs reported
    `verified=true`, `errors=0`, and every counter at `created=0` / `already=<expected>`.

---

## 5. Intentionally NOT done (per AAP scope / Refine-PR constraints)

- **No new application code generated** and **no ArkCase code changed** — per the Refine-PR mandate. The
  ArkCase Java/Maven tree was used only as read-only semantic reference.
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
- **Missing artefacts that this Refine-PR pass was scoped away from authoring** — recorded so they read as
  known gaps rather than oversights: the Service Portal **layout** records (§9.6 E8-P) and the AAP §0.4.4
  **related lists** (§9.6 E8). Both were absent before this pass as well. The pass was bounded to Defect F,
  Defects C/E/7/9, the ATF suite and the acceptance proof, and explicitly barred from authoring new portal
  artifacts or new application logic, so these were measured and reported rather than built. They are
  items 1 and 6 of §10.

---

## 6. Validation-gate status (AAP §0.7.3) — honest assessment

| Gate | Criterion | Status | Notes |
|---|---|---|---|
| 1. Data model | 3 tables, correct fields/types | ⚠️ **PASS only after remediation** | Measured on a clean install: the commit yields `sys_db_object` metadata with **no physical storage** (REST 403; 0 `sys_choice` rows for all 7 choice lists, because the Choice-List updates load but cannot persist against storage-less tables) and an insert fails with `GlideRecord.setValue() - invalid table name: x_casemgmt_case`. After the manual remediation of §9.5 all three tables are physical (21/14/13 columns), 24 choice rows exist, and all 7 choice lists render with the exact option labels. UI-verified: the three list views render as real data grids (`1 to 13 of 13`, `1 to 10 of 10`, `1 to 8 of 8`) with zero banners and zero console errors; `number` is read-only in format `CASE0000448`. |
| 2. Workflow | All transitions enforced for both case types | ✅ **PASS** | Prohibited transitions (Any→Draft, Closed→*), side-effects and agent-membership are enforced by Business Rules; the **four forward precondition guards, including the task-closure-blocks-Resolve gate, are now enforced at runtime and block on the form** after the seven flows were re-authored natively and wired into the order-250 before-update Business Rule (Defect F, §3). Verified by 8 live form observations — 4 assertions × 2 case types — with the verbatim messages read from the rendered DOM, and `sys_flow_context` rows in state `COMPLETE` for all 7 flows. |
| 3. ACLs | Role-based access enforced | ⚠️ **PASS on the parent table after remediation; FAIL on the child tables** | A clean commit gives 26 ACLs and **0 of 27** role links (every ACL with no role, no condition and no script evaluates to *deny*, which makes the app unusable); after the manual remediation the link count is **27**. Parent-table matrix then verified empirically by impersonation: manager 14/14 rows with Update+Delete+New; agent **9/14** with Update+New and **no Delete**; viewer 14/14 fully read-only with no Update/Delete/New. Both halves of "Assigned only" proven — the `assigned_agent` branch and the `isMemberOf(assigned_group)` branch — plus record-level denial by direct URL and the two field-level ACLs. **However the agent's `x_casemgmt_case_task` / `x_casemgmt_case_party` read+write conditions cannot compile** (`current.case`; `case` is a JS reserved word ⇒ `missing name after . operator`) so they deny every row — caught by ATF 07 (§8.3) and detailed in §9.6 E-ATF. |
| 4. Portal — submission | Unauthenticated submit creates a Draft case with a number | ⚠️ **REST contract PASS · portal page FAIL** | REST, no credentials: `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE0000450","message":"Your case has been submitted"}`, case lands in `Draft`. But the submit **page** at `/x_casemgmt_case_portal?id=x_casemgmt_case_submit` renders blank — 0 labels, 0 inputs, 0 buttons after a 12-second poll — because `sp/page` returns `containers: []`. A visitor cannot submit through the UI; only the endpoint works. §9.6 E8-P. |
| 5. Portal — lookup | Status lookup returns correct data / not-found | ⚠️ **REST contract PASS · portal page FAIL** | REST: GET valid → exactly `{status, subject, opened_date}` with `assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email` and `sys_id` all absent from body *and* raw response; GET invalid → **404** with `No case found with that number.` byte-identical to the required literal. The lookup **page** renders blank for the same reason as gate 4 — no field, no button, no result panel, and the not-found text appears nowhere in the DOM. §9.6 E8-P. |
| 6. Dashboards | Both dashboards render with synthetic data | ❌ **FAIL** | Measured precisely, not assumed. The two `pa_dashboards` records **do commit** and are live in scope (`x_casemgmt_agent_workspace`, `x_casemgmt_manager_view`, both still carrying the packaged audit stamps). What fails is the **tab child** inside each composite block: the package serializes it as `<pa_tab>`, but this release's table is `pa_tabs` (`GET /api/now/table/pa_tab` → HTTP 400 unknown table; `pa_tabs` → 200, and `sys_db_object` holds `pa_tabs` and `pa_m2m_dashboard_tabs` but no `pa_tab`). So the commit log carries two `Table 'pa_tab' does not exist` errors on every import, `pa_m2m_dashboard_tabs` for both dashboards is **0 rows**, and a dashboard with no tab renders no widgets. This is a one-element packaging defect in the deliverable, **not** an absent PDI capability — and it is pre-existing: the dashboard artifacts are byte-unchanged since the pre-refine commit and that package carried the same `<pa_tab>` element. The 8 backing `sys_report` records do commit and are backed by populated tables. §9.6 E5. |
| 7. Update Set | Loads/previews with zero errors | ✅ **PASS** | **Before = 42 errors** (dirty instance), **after = 0 errors / 0 warnings** on a genuine clean slate, then committed to `state=committed`. Full progression and the two deliverable edits that produced it are in §9.2–§9.3. |
| — Related lists (AAP §0.4.4) | Case form shows `case_task` and `case_party` related lists | ❌ **FAIL (never authored)** | Not one of the seven AAP §0.7.3 gates, recorded here because it was measured in this pass. `sys_ui_related_list` is empty for every table in the app, `#related_lists_wrapper` renders at height 0, and no `sys_ui_related_list`/`sys_ui_form`/`sys_ui_section`/`sys_ui_element` artifact exists in the repository or the package. §9.6 E8. |

> **Net, measured on a clean-instance round trip in this pass (§9):** **2 gates pass outright** (Workflow;
> Update Set), **3 pass with a qualification** (Data model and ACLs pass only after one manual remediation run;
> both Portal gates pass at the REST layer but fail at the page layer), and **1 fails outright** (Dashboards —
> the dashboards’ tab child names a table this release does not have). Gate 2 remains a full PASS and was **independently re-verified in this pass**: clicking the
> real **Resolve** UI Action on a case with an open child task was blocked, the record was not written
> (`sys_mod_count` unchanged), and the form displayed `All tasks must be closed before resolving this case.` —
> codepoint-verified as 52 pure-ASCII characters with a terminating U+002E.
>
> So the deployment is usable end-to-end for case intake, access control and the full state machine — prohibited
> transitions, forward-transition preconditions and side-effects alike — and for the portal **as an API**. It is
> **not** usable through the portal UI, its dashboards cannot be installed here, and it is not self-installing:
> the exact residual manual footprint is enumerated in §9.5.

---

## 7. Summary of where each fix lives

| Defect | Fixed in deliverable XML | Fixed live on PDI | Repo source XML patched | Operational (post-import script) |
|---|:---:|:---:|:---:|:---:|
| A duplicate scope | ✅ | — | ✅ | — |
| B `application` ref | ✅ | — | ✅ | — |
| C commit-no-DDL | ✅ the remediation script **and** its auto-execute trigger are folded into the Update Set (Fix Script at position 103, Business Rule at 104; 151 → 153 records) | ✅ | ✅ `scripts/post_import_remediation.js` + `scripts/sys_script_fix_…xml` + `scripts/sys_script_…bootstrap.xml` | ⚠️ **trigger fires but cannot succeed — one manual run required.** Measured on a clean install: `SUMMARY` reports `verified=false`, `tables_built=0`, `errors=121`. See §9.4 and the procedure in §9.5. |
| D cross-scope barrier | n/a | n/a (workaround) | n/a | n/a — the remediation runs entirely in **global** and writes no `x_casemgmt_*` data; data seeding stays `seed_demo_data.js`'s job, in scope |
| E auto-numbering | ✅ `Dictionary` + 3 × `Number Maintenance` payload blocks updated | ✅ | ✅ `dictionary/x_casemgmt_case_number.xml`, `numbers/sys_number_x_casemgmt_case{,_task,_party}.xml` | re-asserted by the script (needed only because Defect C's rebuild re-creates the dictionary row) |
| 6 `gs.nowDateTime` | partial | ✅ | ✅ | — |
| 7 REST `service_id` | ✅ both `Scripted REST Service` payload blocks updated | ✅ | ✅ `portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml`, `…_case_status_lookup.xml` | re-asserted by the script (convergence for a partially-repaired instance) |
| 8 stale REST op-scripts | already correct in XML | ✅ | n/a | — |
| 9 ACL role-links | ✅ the remediation + trigger that create them are in the Update Set. The 27 `sys_security_acl_role` **records themselves cannot be packaged** — `sys_security_acl` has no `roles` column and link payloads are silently skipped by the engine (5 shapes tested) | ✅ | ✅ created by `scripts/post_import_remediation.js` from each ACL's own `<roles>` declaration, resolved **by name** | ⚠️ **trigger fires but cannot succeed — one manual run required.** A clean commit leaves `acl_links_total=0` of an expected 27; the links and the `GlideSecurityManager.get().reset()` flush appear only after the manual run. See §9.4–§9.5. |
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
>   and `sys_security_acl_role` payloads are silently discarded (§2, §4.1, §4.14). For these the *automation*
>   is what ships: `scripts/post_import_remediation.js`, its Fix Script wrapper, and the global after-update
>   Business Rule on `sys_remote_update_set` that dispatches it when the commit flips the retrieved Update Set
>   to `committed`. All three are folded into the same single Update Set (record count 151 → 153). The
>   remediation is idempotent, resolves every reference by name, contains no sys_id literals, and reports a
>   single grep-able `X_CASEMGMT_REMEDIATION|SUMMARY|` line whose `verified=` token is the proof it converged.
> - **Residual human footprint — CORRECTED by measurement in this pass.** An earlier revision of this document
>   stated *"Residual human footprint for C, E, 7 and 9: none. Upload → preview → commit is sufficient."*
>   **That claim is false and is withdrawn.** A genuine clean-instance round trip (§9) established:
>   **E and 7 are fully delivered by the package alone** — no human step, confirmed on a clean install.
>   **C and 9 are not.** The bootstrap Business Rule *does* fire (verbatim syslog in §9.4) but cannot complete,
>   because the commit engine rewrites the dispatched record's `sys_scope` to the application and the script's
>   `GlideTableDescriptor` and `GlideSecurityManager` calls are then refused in scoped execution — 121 errors,
>   `verified=false`, `tables_built=0`, `acl_links_total=0`. Shipping the automation *global* in the package does
>   not help, because the rewrite happens at commit time regardless of the packaged `sys_scope`. The precise
>   step-by-step manual procedure, and why automation was not achievable, are in §9.5.
> - Unchanged: **A** and **B** remain packaging fixes in the XML, and **6** remains an in-place correction of
>   two generated Business-Rule script lines. The zero-error preview gate is preserved — the two added blocks
>   use the same 18-element `<sys_update_xml>` wrapper, unique `update_guid`s, and payloads byte-identical to
>   their standalone artifacts.

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
| Records | 20 `sys_atf_test` + 180 `sys_atf_step` + **542 `sys_variable_value`** step-input rows + 1 `sys_atf_test_suite` + 20 `sys_atf_test_suite_test` links = **763** |
| Repo artifacts | `../atf/*.xml` — 21 files (one per test carrying its steps and their inputs, plus the suite and its links) |
| In the package | **763 `<sys_update_xml>` blocks** in `../update-set/x_casemgmt_case_management_update_set.xml`, placed after the `Report`/`Dashboard` blocks and before the seed data, so the tables, dictionary, choices, roles, ACLs, Script Includes and Business Rules the tests exercise all load first. Record count **153 → 916**. |

Coverage, by the three areas required:

| Test | Area | What it asserts |
|---|---|---|
| `ATF 01` | Data model | The full §0.5.7 schema of all three tables — field names, types, lengths, mandatory flags, reference targets — every choice set, the `sys_number` prefix/padding, and that `number` is read-only and matches `CASE0000001` |
| `ATF 02` | RBAC | `x_casemgmt_case_manager`: create, read **all**, write **all**, delete — all succeed |
| `ATF 03` | RBAC | `x_casemgmt_case_agent`: create succeeds; read/write succeed on a case assigned via `assigned_agent` **and** on one assigned via `assigned_group`; both denied on an unassigned case and on a case in another group; delete denied |
| `ATF 04` | RBAC | `x_casemgmt_case_viewer`: read all succeeds; create, write and delete all denied |
| `ATF 05` | RBAC (field) | `assigned_group` writable by the manager only; `assigned_agent` writable by the manager **and** the assigned agent; neither by the viewer |
| `ATF 06` | RBAC (children) | The matrix mirrored on `x_casemgmt_case_task` and `x_casemgmt_case_party` for the manager and the viewer |
| `ATF 07` | RBAC (children) | The agent's assigned-only narrowing on the two child tables — **currently red; see §8.6** |
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

The suite was run as a single action from the suite form, with a real browser attached as the client runner.
The run quoted below is the **final** one, executed after every test, step and step-input record had been
re-loaded into the instance from the shipped `../atf/*.xml` artifacts through the platform's own payload
loader — so this verdict belongs to the package as serialized, not merely to what was authored in the UI.

| | |
|---|---|
| Result | **`TES0001006`** (`sys_atf_test_suite_result` `258b61f993a28710830ef82bdd03d648`) |
| Window | `2026-08-07 07:08:24` → `07:13:55` — **5 minutes 31 seconds** |
| Rollup | **success 19 · failure 1 · error 0 · skip 0**, across 20 child `sys_atf_test_result` rows |
| Status | `Failure` — because of the one red test in §8.6, which is a defect the suite **found**, not a broken test |

Per-test verdicts and run times: `ATF 01` Success 7 s · `02` Success 4 s · `03` Success 5 s ·
`04` Success 4 s · `05` Success 10 s · `06` Success 22 s · **`07` Failure 3 s** · `08` Success 6 s ·
`09` Success 9 s · `10` Success 12 s · `11` Success 18 s · `12` Success 20 s · `13` Success 4 s ·
`14` Success 5 s · `15` Success 52 s · `16` Success 53 s · `17` Success 49 s · `18` Success 6 s ·
`19` Success 5 s · `20` Success 3 s.

Six suite results exist on the instance (`TES0001001` … `TES0001006`), every one triggered by `admin` with an
empty `schedule_run` — no unattended execution occurred (see §8.2). All six report 19 success / 1 failure
except the first, which ran only 17 of the 20 tests because of a suite-link defect in the authoring tooling
that was found and fixed before any evidence was relied upon.

Depth of assertion, from the step summaries of that run: `ATF 01` verified the case schema with
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
  | **Re-apply all 21 artifact files — every test, step, step-input, the suite and its links — then run the whole suite** | 763 records applied with **0 load errors**; live state 20 tests / 180 steps / 542 inputs; all 542 input values **byte-identical** to the artifacts (verified by md5 per `(document_key, variable)`: 542 identical, 0 different, 0 missing); the suite then ran as `TES0001006` with the same **19 / 1 / 0 / 0** verdict |

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
    second row per input instead of replacing it (measured: 542 → 1035). That situation arises only on the
    authoring instance, where it was cleaned up; the clean-instance procedure removes the scope first and so
    cannot hit it. A maintainer who wants unconditional idempotence can emit one top-level `delete_multiple`
    document per step ahead of that step's input rows.

**The check to run on a clean instance after upload → preview → commit:**

1. `sys_atf_test` where `sys_scope.scope=x_casemgmt` → **20**
2. `sys_atf_step` where `test.sys_scope.scope=x_casemgmt` → **180**
3. `sys_variable_value` where `document=sys_atf_step` and `document_key` is one of those steps → **542**
4. `sys_atf_test_suite` → **1**, named `x_casemgmt Case Management POC`; `sys_atf_test_suite_test` → **20**
5. **A step with zero input rows is the failure signature.** If one appears, the input records did not load,
   or loaded ahead of their parent step. Equally, **no step should have more than its expected number of input
   rows** — a duplicate means the package was imported over a natively authored suite (see above).
6. Set `sn_atf.runner.enabled=true`, attach a client runner, run the suite → expect **19 success / 1 failure**
   (`ATF 07`, §8.6) — or 20/0 once the ACL defect is fixed.
7. Afterwards, delete `x_casemgmt_case` where `subject` starts with `ATF-PORTAL-18` (see §8.6, M4).

### 8.6 What the suite found, and what remains manual

**A real defect, surfaced by `ATF 07` and left visible rather than hidden.** Four scoped condition scripts on
the child-table ACLs dereference `current.case`. Because `case` is a JavaScript reserved word, those scripts
**fail to compile** — the platform log reads
`Script compilation error: Script Identifier: sys_security_acl.1ea69bf11f64a85ddf0c7e970779fefe, Error Description: missing name after . operator (…; line 2)`
and, for the party table, `AccessTerm: Slow ACL 98ad89a6a3e869f11fb477ed8f8f1b87 for the path record/x_casemgmt_case_party/read`.
An ACL whose condition cannot compile evaluates to **deny**, so `x_casemgmt_case_agent` cannot read the tasks
or parties of the case it is itself assigned to. `ATF 07` reports it as
`agent assigned-only narrowing on the child tables: checks=4 failures=2 :: agent can read a task on its assigned parent case expected[true] actual[false] | agent can read a party on its assigned parent case expected[true] actual[false]`.
The remedy is `getValue('case')` or `current['case']` in those four scripts; the test needs no change and turns
green on its own once they are fixed. The test is deliberately **not** deleted or weakened: a suite that hides
a real defect to look green is worth less than one that shows it. A second, latent code-hygiene issue was found
the same way — `CaseTransitionValidator.canTransitionToClosed()` has a branch calling `gs.getUser(userName)`,
which a scoped application cannot use to fetch another user; it is inert on the shipped path and was not
changed.

**What stays manual:**

| # | What | Why | Cost |
|---|---|---|---|
| M1 | Setting `sn_atf.runner.enabled = true` wherever the suite is to run | Instance test-harness setting, deliberately not captured into the package (§8.2) | < 1 min |
| M2 | Opening a client test runner tab for `ATF 15`–`ATF 17` | Form-level steps need a browser; `sn_atf.headless.enabled` was left `false` | ~2 min per run |
| M3 | The genuinely anonymous REST leg | The `Send REST Request - Inbound` step type supports only `basic`/`mutual` auth, so it cannot impersonate an anonymous caller. `ATF 18`–`ATF 20` exercise the endpoints authenticated, and each carries a scoped `Run Server Side Script` companion using `sn_ws.RESTMessageV2` with **no** credentials — which is what actually proves the anonymous contract (201 / 200 / 404 as specified, while `/api/now/table/x_casemgmt_case` correctly returns 401 to an anonymous caller). A credential-free `curl` transcript is recorded in `ATF_MANUAL_TEST_PLAN.md` §5 C4 for anyone wanting to re-confirm it outside ATF. | ~10 min |
| M4 | Deleting the one `ATF-PORTAL-18` case after each `ATF 18` run | ATF rolls back records created by its own steps and scripts, but **not** a row created by an inbound HTTP request — that runs as `guest`, in its own transaction — and the rollback additionally reverses the test's own cleanup delete. Each run therefore leaves exactly one synthetic `Draft` case. Remedy: delete `x_casemgmt_case` where `subject` starts with `ATF-PORTAL-18`. Done after the `TES0001004` run; demo data verified back at 10 cases / 10 tasks / 8 parties. | < 1 min |
| M5 | Fixing the four `current.case` ACL scripts so `ATF 07` goes green | Owned by the ACL artifacts, not by the test | not owned here |

**Fixtures and data safety.** Every test creates its own synthetic fixtures, prefixed `ATF-`, with
`@example.invalid` addresses, and deletes them again; ATF's rollback covers the rest. No test mutates the demo
data. After the full suite run and every re-import experiment, the demo set was re-verified as intact: **10
cases spanning all six statuses (Draft 1, Open 2, In Progress 2, Pending 1, Resolved 2, Closed 2) and both
types (General Inquiry 6, Complaint 4), 10 tasks, 8 parties, 3 demo users, 1 demo group**, with zero `ATF-`
rows left behind. `ATF 19` pins its fixture to the out-of-sequence number `CASE9000019` precisely so it stays
portable to a freshly imported instance whose counter restarts at `CASE0000001`.

**Not overstated.** 19 of 20 tests pass. The twentieth fails for a real reason that is documented above and
attributable to an artifact outside this suite. Three areas are covered automatically; five items (M1–M5)
remain manual, four of them trivial. A step-by-step plan for rebuilding the whole suite by hand in the ATF UI
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
| `sys_variable_value.variable` — which input of that step type a value belongs to | 542 (45 distinct) | **Unavoidable**, for the same reason: the join key is a reference to an out-of-the-box `atf_input_variable` row. |
| Identity references inside a step's own **reference inputs** — the `user` input of `Impersonate` (21) and reference fields inside a `field_values` template (7) | 28 (4 distinct) | **Unavoidable.** A reference input stores a `sys_id` by construction. All four distinct values are the three demo users and the demo group, and **this same Update Set creates those records with exactly those `sys_id`s** (`seed-data/users/*.xml`, `seed-data/groups/*.xml`), so they resolve identically on any instance the package is imported into. |
| Fixture record ids addressed by native steps (`Record`, `Conditions`, `Field values`) | 28 distinct | Compliant — these identify records the test itself creates in its own fixture-setup step, the direct analogue of a record's own `sys_id`. Deterministic, so the native step that follows can address the fixture without ATF's client-side `{{step[…]}}` substitution, which does not resolve on the server-side-only path. |

**Inside script bodies there are now zero identity `sys_id` literals.** Every server-side script that needs an
identity resolves it at run time — `userId('x_casemgmt_demo_manager')` against `sys_user.user_name`,
`groupId('x_casemgmt_demo_team')` against `sys_user_group.name` — and fixture field values carry a
`@user:<user_name>` / `@group:<name>` token that the fixture loop resolves before insert. That is both the rule
the package is held to and the more portable arrangement: the tests keep working even where the demo
identities exist under different `sys_id`s. After that change all 20 tests were re-verified — the 17
server-side tests re-run individually (16 success, `ATF 07` failing as documented) and the three form-level
tests re-run through the client runner (all three Success, each blocking message again observed on the form
verbatim, `UI Batches Executed` 0 → 3).

> **Correction from the clean-instance round trip (§9).** The three form-level tests `ATF 15`, `ATF 16` and
> `ATF 17` recorded as Success above were passing on the *pre-teardown* instance. On a genuinely clean instance
> they **fail**, deterministically, in three independent runs. The suite score is **16 Success / 4 Failure**, not
> 19/1. The cause is a test-design issue rather than an application defect, and it is documented with its
> evidence in §9.6 (E-ATF15). The remaining 16 successes and the `ATF 07` failure reproduce exactly as described
> in this section.
>
> **This supersedes every "expect 19 success / 1 failure" statement made for a clean instance**, specifically
> the historical run summary in §8.3, step 6 of the re-import check in §8.5, and the "Last full-suite verdict"
> and step-6 expectation in [`ATF_MANUAL_TEST_PLAN.md`](./ATF_MANUAL_TEST_PLAN.md). Those figures are accurate
> for the six suite results `TES0001001`–`TES0001006`, which all ran *before* the teardown; they are not the
> expectation after a clean install. The current, reproducible expectation is **20 ran / 16 Success / 4 Failure /
> 0 Error / 0 Skipped** (`TES0001010`, `TES0001011`, `TES0001012` — byte-identical verdicts), rising to 19/1 once
> §10.3 item 12 is done and to 20/0 once §10.1 item 2 is done as well. `ATF_MANUAL_TEST_PLAN.md` belongs to the
> unit that authored the suite and was deliberately left unedited by this pass; read it together with this note.

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

### 9.3 The three edits made to the deliverable in this pass

The package remains **one** file at `update-set/x_casemgmt_case_management_update_set.xml`, with **916 records**
(pre-refine 148; delta +768). Every edit was verified to change nothing else: after edit 1 there were **zero**
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
   record for the newer-local-update collision check. The two Dashboard composite blocks between them provide
   19 records (`sys_grid_canvas_pane`, `pa_dashboards`, `pa_tab`, `pa_m2m_dashboard_tabs`,
   `pa_dashboard_widgets` × 8, `pa_dashboard_role` × 3). Every one of the other 914 blocks’ payloads was
   searched for those 19 `sys_id`s: **zero cross-block references**. Nothing in the set consumes anything these
   two blocks provide, so their names cannot participate in any intra-set resolution, and on a clean slate
   there are no local records to collide with. Edit 3 therefore cannot change the clean-slate preview outcome,
   and the **AFTER = 0** of §9.2 is attributable to the file as shipped.

> **Reported, not fixed:** the artifact `portal/rest/sys_ws_operation_x_casemgmt_case_submit_post.xml` carries
> `sys_id e1b7bfa9aff542fa88a645612a73e54c`, which is **absent from the package** — the package uses
> `886ad7128907a6351ea04b210c27029e` for the same logical endpoint. Two records exist for one endpoint. The
> functional fields were reconciled; the duplicate identity was left alone and is recorded here.

### 9.4 Did the auto-execute trigger fire? Yes — and it cannot succeed

The brief requires this to be answered from evidence. The trigger **fired**. Verbatim, from `syslog`
(source `x_casemgmt`, 143 marker rows in the commit window):

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

**Why automation was not achievable.** The package ships both the Fix Script and the bootstrap Business Rule
with `sys_scope=global`, but **the commit engine forces every committed record's `sys_scope` to the Update Set's
application.** Reading the records back after commit confirms it: the Fix Script's `sys_scope` is
`82b99028936f74320d74d6f88357a5af` (its `sys_package` is still global), and the bootstrap rule is app-scoped,
`active=true`, on `sys_remote_update_set`, `when=after`, `order=1000`,
`condition=current.state.changesTo('committed')`. The remediation needs `GlideTableDescriptor` (to materialise
physical storage) and `GlideSecurityManager` (to flush the security cache); both are unavailable to scoped
execution. So the trigger cannot be made to work by packaging it differently — the rewrite happens at commit
time regardless of the packaged scope. The rule correctly left itself active, because it only deactivates on
`verified=true`; after the manual run it deactivated itself, exactly as designed.

E and 7, by contrast, need no script at all — they are carried by the artifacts — and were confirmed present
and correct on the clean install (`counters_already=3`, `number_default_already=1`, `service_ids_already=2`).

### 9.5 Residual manual footprint, per defect, with the precise step

Everything that could be automated is in the package. What remains, in the order it must be performed:

| # | Defect | What is missing after upload → preview → commit | Precise step | Why automation was not achievable |
|---|---|---|---|---|
| 1 | **C** — physical schema | `sys_db_object` metadata exists but has **no physical storage**; REST returns 403; 0 `sys_choice` rows for all 7 choice lists; inserts fail with `invalid table name` | Set the session's application picker to **x_casemgmt Case Management** (user preference `apps.current_app`), then **REST-DELETE the three `sys_db_object` rows children-first** (`x_casemgmt_case_task`, `x_casemgmt_case_party`, `x_casemgmt_case`) — some return HTTP 500 *maximum execution time exceeded* but do succeed. Then run `scripts/post_import_remediation.js` in scope **Global** | The DDL comes from the platform's `Synch Dictionary and Table` business rule, which the commit engine suppresses; and the remediation cannot run from the auto-execute path because commit rewrites its scope (§9.4). `sys_db_object` deletion is gated by `DictionaryUtils.isDeletable()` → `_isItemInUserScope()`, which refuses from Global, while the cross-scope policy on `sys_db_object` refuses from the app scope — the application-picker route is the only one that works |
| 2 | **C**, second pass | Deleting the three `sys_db_object` rows **cascades away all 26 ACLs** | **Upload → preview → commit the same Update Set a second time.** This preview reports ~21 `Could not find a record in x_casemgmt_case for column case` / `…core_company for column organization` problems, because the tables now exist but are empty — accept those (`status=ignored`); never ignore a collision problem. The second commit restores the 26 ACLs, the seed rows, the users and the role grants | A consequence of step 1, not avoidable while the DDL must be produced by a table rebuild |
| 3 | **9** — 27 ACL role links | 26 ACLs with **0** role links. On this high-security instance an ACL with no role, no condition and no script evaluates to **deny**, which makes the application unusable | Run `scripts/post_import_remediation.js` in scope **Global** again. Expected on the `SUMMARY` line: `verified=true`, `acl_links_created=27`, `acl_links_total=27`, `acl_links_expected=27`, `security_cache_flushed=true`, `errors=0` — followed by a `TRIGGER` line recording that the bootstrap rule deactivated itself after a successful remediation | `sys_security_acl` has no `roles` column and `sys_security_acl_role` link payloads are silently discarded by the commit engine (5 payload shapes tested, §2 Defect 9). The creating script cannot auto-run for the reason in §9.4 |
| 4 | **E7** — one display field per table | All three tables arrive with `display=true` on nearly every column (13 of 14 on `x_casemgmt_case`). ServiceNow permits exactly one. Effect: every reference **to** a case renders blank — the `Case` column in the task and party lists, and the mandatory `Case` field on their forms | Reduce each table to a single display field: `x_casemgmt_case` → `number`, `x_casemgmt_case_task` → `subject`, `x_casemgmt_case_party` → `role_label`. Verified immediately afterwards: `getDisplayValue('case')` returns `CASE0000455`, and the `Case` column is populated on 10/10 task rows and 8/8 party rows | Not attempted by any automation. The defect is present in **both** the packaged `Dictionary` blocks and in `scripts/post_import_remediation.js` (which sets `display: true` on every field it creates), so re-running the remediation reintroduces it. This is the first thing to fix in the next generation pass |
| 5 | **E1/E2** — demo data | The packaged seed rows commit with **`number` empty on all 10 demo cases** and dangling parent references, and they **block the app's own seed script from repairing them** | Delete the 10 number-less `Demo case …` rows, their orphan tasks and parties, and the dangling `sys_user_grmember` row; then run `scripts/seed_demo_data.js` in scope. It then inserts all 10 cases with platform-allocated numbers and fully resolved references, with zero warnings | Every packaged `Case Record` payload **omits the `number` element**, and auto-numbering does not fire on an Update-Set data insert. `ensureCase()` keys on `subject`, so the number-less rows match and the script makes no change. See §9.6 E1 |
| 6 | Instance prerequisites (not package artifacts, deliberately not captured) | — | `sn_atf.runner.enabled = true` to run the ATF suite (it survived this teardown). `sn_atf.headless.enabled = false` and cannot be enabled here, so `/atf_test_runner.do?sysparm_nostack=true` must be open in a browser before launching the suite. The three demo personas have **no password** by design and can only be exercised through admin **UI Impersonation** | These are instance test-harness settings, not application configuration; capturing them into the Update Set would be a global write |

**Acceptance path: (b), not (a).** The package contains everything that could be automated. E and 7 are fully
self-sufficient. C and 9 ship their automation, that automation demonstrably fires, and it cannot complete for a
measured platform reason. The footprint above is the smallest one achievable in this build environment, and it is
disclosed rather than assumed away.

### 9.6 Additional defects found by the round trip — recorded as the honest current state

None of these was introduced by this pass, and none is within the Refine-PR scope to repair (they are not
Defect F, not Defects C/E/7/9, and not the ATF suite). They are recorded here so they are not lost.

| Ref | Defect | Evidence | Effect |
|---|---|---|---|
| **E1** | Packaged `Case Record` payloads omit the `number` element entirely (field set is `description, priority, requester_email, requester_name, status, subject, type` + `sys_*`) | All 10 demo cases commit with `number` empty; `x_casemgmt_case_task.case` and `x_casemgmt_case_party.case` then hold the literal string `"CASE0000008"`, and `case_party.organization` holds `"Synthetic Org Beta"` | Case↔task and case↔party relationships are broken in the packaged demo data, and the seed script cannot repair them because its idempotency key already matches. Remedy in §9.5 step 5 |
| **E2** | `sys_user_grmember.group` is a dangling literal (`group_raw=x_casemgmt_demo_team`, `is_sys_id=false`, empty display value) while the `user` side resolved correctly | `gs.getUser().isMemberOf()` can never match | The **group branch** of the agent's read/write ACL is inert, so "Assigned only" collapses to the `assigned_agent` branch (7 rows instead of 9). Repaired by the seed script, which creates a correct membership; the bad row must be deleted |
| **E3** | `sys_ui_action.condition` is `condition_string`, **max length 254**. Four conditions exceed it and are silently truncated mid-expression on import: `x_casemgmt_case_start_progress` (264), `_set_pending` (271), `_resume` (267), `_resolve` (271). The Resolve condition ends `…isMemberOf(current.assigned_grou` | Exactly those four buttons render for the **viewer**, who has no write ACL, a fully read-only form and no Update button; the two short-condition actions (`_open` 76, `_close` 79) behave correctly | A truncated condition cannot evaluate, so the guard fails open. Data security is intact — the write ACL rejects the change server-side — but the affordance is misleading. Fix: move the condition into a Script Include call short enough to fit, or into the UI Action's script |
| **E4** | UI Policy `x_casemgmt_case_party_conditional_fields` does not re-evaluate on change | Both branches are configured correctly and apply correctly **at form load** (Person record → Person visible and mandatory, Organization absent from the DOM; Organization record → the mirror). Driving `party_type` through the real `<select>` *and* through `g_form.setValue()` in both directions on both record types left `isVisible`/`isMandatory` frozen at the load-time branch every time | A user switching Party Type is not shown the field they now need and is still required to fill the wrong one. Signature of **"Reverse if false" unchecked** |
| **E5** | The two Dashboard composite blocks serialize their tab child as **`<pa_tab>`**; this release's table is **`pa_tabs`** | `GET /api/now/table/pa_tab` → **HTTP 400** (unknown table); `…/pa_tabs` → **200**; `sys_db_object` holds `pa_tabs` (label "Tab") and `pa_m2m_dashboard_tabs` but **no** `pa_tab`. Two commit errors on every import: `Table 'pa_tab' does not exist`. Both `pa_dashboards` rows nevertheless commit and are live, while `pa_m2m_dashboard_tabs` for them is **0 rows** | Each dashboard installs **with no tab**, so it renders no widgets and validation gate 6 fails. The PDI capability is present — this is a **one-element packaging defect in the deliverable**. **Pre-existing**: `dashboards/pa_dashboards_x_casemgmt_*.xml` are byte-unchanged since the pre-refine commit and the pre-refine Update Set carried the same two `<pa_tab>` elements, so no unit of this pass introduced it. Fix in §10.2 item 11 |
| **E7** | 13 of 14 `x_casemgmt_case` dictionary entries carry `display=true` (also 6 of 6 on `case_task`, 5 of 5 on `case_party`), in the packaged blocks **and** in `post_import_remediation.js` lines 239–265 | `getDisplayValue('case')` returned `""`; the `Case` column showed "(empty)" on every task and party row | Every reference to a case renders blank. Remedy in §9.5 step 4 |
| **E8** | AAP §0.4.4's **Related Lists were never authored** | `sys_ui_related_list` is empty for every table in the app; `#related_lists_wrapper` renders at height 0 and the case form does not scroll; no `sys_ui_related_list`/`sys_ui_form`/`sys_ui_section`/`sys_ui_element` artifact exists in the repository or the package (only 1 `sys_ui_policy` and 6 `sys_ui_action`) | AAP §0.4.4 requires related lists for `case_task` and `case_party` on the case form. A user cannot see or add a case's tasks or parties from the case form |
| **E8-P** | The Service Portal **layout** records were never authored | `GET /api/now/sp/page` returns HTTP 200 with `containers: []` for all three routes, alongside `theme:{footer:{},header:{}}`. `sp_portal`, both `sp_page` records (`public:true`, `draft:false`, correct titles and routing) and all 3 `sp_widget` records are present and healthy. No `sp_container`/`sp_row`/`sp_column`/`sp_instance` record exists on disk, in the package, or in the pre-refine package | Both portal pages render **completely blank** — 0 labels, 0 inputs, 0 buttons; all six portal screenshots are byte-identical. `Your case has been submitted`, the case number, the whitelisted lookup result and `No case found with that number.` appear **only** in the API responses, never on screen. Validation gates 4 and 5 pass at the REST layer only. There is also no navigation: the only link on any page is "Skip to page content". **ACL filtering is ruled out by control probe:** the *same* anonymous guest session receives **populated** `containers` (length 1, 2 widget instances, an 11,867-byte body carrying the full `sys_container` shape) from the out-of-the-box `404` and `unauthorized` portal pages, while both `x_casemgmt` pages return a 927–947-byte body with `containers: []` on a fully resolved `public:true, draft:false` record. Three response signatures were characterised — 565 B page-does-not-exist, 927–947 B page-healthy-but-no-layout, 11,867 B page-with-layout — and both `x_casemgmt` pages sit in the middle band. The rendered `<main>` is 336 characters ending in `<!-- ngRepeat: container in containers -->` with zero instances; the three route screenshots are byte-identical (one sha256) and each is 100 % pure white across all 1,296,000 pixels; console errors 0, and of 77 requests the only non-2xx are two benign 304 revalidations of the platform’s own `sn_banner.xml` — so this is configuration, not a crash. `sp_portal.theme_dv` is also empty, which is why no header/footer chrome renders. Fix: capture the container/row/column/widget-instance records for both pages, plus a menu |
| **E-ATF** | The four scoped **child-table** ACL conditions dereference `current.case`, and `case` is a JavaScript reserved word | `Javascript compiler exception: missing name after . operator (sys_security_acl.1ea69bf11f64a85ddf0c7e970779fefe; line 2)`, plus `AccessTerm: Slow ACL … for the path record/x_casemgmt_case_task/read`. Caught by **ATF 07** | `x_casemgmt_case_task` read+write and `x_casemgmt_case_party` read+write **deny every row** for the agent. The parent-table ACLs are unaffected. Fix: replace `current.case` with `current.getValue('case')` / `current.getElement('case')` |
| **E-ATF15** | `ATF 15/16/17` fail on a clean instance at step 3/7 `Open an Existing Record`: `Table 'x_casemgmt_case' does not have a record with id '…'` | Deterministic across three runs, including one with the client runner deliberately throttled. Steps 1 (fixture) and 2 (Impersonate) succeed; steps 4–7 skip. **The application is not at fault** — replicating the fixture exactly (`setNewGuidValue(<fixed sys_id>)` + `insert()`) returned the requested id, read back as `CASE0000540` with the display value resolving, and passed `GlideRecordSecure` with `canRead=true` | An ATF **server-fixture → client-form handoff** problem: a row created by a `Run Server Side Script` step is not visible to a following client-side form step. The fixture's own first action is to delete stale residue, which is what those tests had been relying on; the clean slate removed it. Fix: create the fixture inside the client step's own transaction, or address it with ATF's `{{step[…]}}` substitution |
| **E-GU** | `gs.getUser(userName)` **ignores its argument** on this release and returns the **session** user | Measured in both scope and global: `gs.getUser("x_casemgmt_demo_agent")` → `resolved_name=admin`, `IS_SESSION_USER=true`, `hasRole(manager)=true` | `CaseTransitionValidator.canTransitionToClosed()`'s branch (b) — "userId provided and differs from the current user" — silently degrades to the session user, so it answers `{ok:true}` for a non-manager. Branches (a) and (c), which call `gs.getUser()` with no argument, are correct and are the **only** branches the shipped runtime uses; an unknown `sys_id` still denies by default. Fix: resolve roles with `sys_user_has_role` directly rather than `gs.getUser(userName)`. Found by a probe stricter than the 13 baseline assertions, which pass a **deliberately unresolvable** id and therefore never reach this branch — so this is a latent hole, not a regression. See §9.7 |

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

The same run reports `CLEANUP tasks=4 cases=7 remainingCases=20` — the harness removed all seven of its own
fixture cases and all four of its fixture tasks, and the 20 remaining cases match the independent census in §9.8.

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
> 13 / 13 — the baseline harness was run as written. The hole remains open and is item 9 of §10.2.

**Closing Defect F broke nothing in the pre-existing path.** All seven case Business Rules are active in the
correct order, with U1's new rule slotted cleanly between the blockers and the membership validator: 100
`block_terminal_closed` (before-update), 100 `set_opened_date` (before-insert), 200
`block_draft_backtransition`, **250 `enforce_forward_transitions`**, 300
`validate_assigned_agent_membership` (insert + update), 400 `clear_pending_reason_on_inprogress`, 500
`set_closed_date`; plus the order-1000 bootstrap rule on `sys_remote_update_set`, correctly `active=false` after
a successful remediation. The four behaviours that always worked were re-measured: both prohibited-transition
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

### 9.8 Demo data restored (AAP §0.7.4)

| Threshold | Required | Measured |
|---|---|---|
| Cases | ≥ 10 | **10 demo cases** (`CASE0000452`–`CASE0000461`), `number` empty on none |
| Statuses covered | all six | **all six** — Draft, Open, In Progress, Pending, Resolved, Closed |
| Case types | both | **both** — General Inquiry and Complaint |
| Tasks | open + closed mix | **10** — 3 Open, 1 In Progress, 6 Closed; zero dangling parent references |
| Parties | Person + Organization | **8** — 5 Person, 5 resolving; 3 Organization, 3 resolving; zero dangling references |
| Demo users | 3 | **3** |
| Demo group | 1 | **1**, with a valid membership for the agent |
| Role grants | 3 | **3** |

All synthetic and PII-free: every demo user and every case `requester_email` is on `@example.invalid`; the two
companies are `Synthetic Org Alpha` and `Synthetic Org Beta`. Counters proven live across all three tables:
`CASE0000452`–`461`, `TASK0000091`–`0000100`, `PARTY0000042`–`0000049`.

The case table also holds a handful of additional synthetic `Draft` rows created as validation probes during
this pass, plus one row per ATF suite run left by `ATF 18` for the reason already documented in §8.6 (M4): an
inbound anonymous HTTP request runs as `guest` in its own transaction, outside ATF's rollback. All are
synthetic and on `@example.invalid`. Demo-data cleanup remains out of scope.

### 9.9 Final re-verification of every gate, at the end of the pass

Everything in §9.2–§9.8 was measured as the pass progressed. Because the documentation above is what a reader
will act on, every gate was then measured **again, from scratch, at the end of the pass** — after the round trip,
after the remediation, after the re-seed and after the ATF runs — so that no number here is stale. All of the
following was observed on `dev379024`, and nothing was repaired between measuring and recording.

| Gate | Re-measured result |
|---|---|
| Tables visible | All three tables readable in scope with their full column sets (20 / 13 / 12 dictionary element rows, plus one collection row each). **All seven choice lists** present with the exact option labels: `case.type` General Inquiry, Complaint · `case.status` Draft, Open, In Progress, Pending, Resolved, Closed · `case.priority` Low, Medium, High, Critical · `case.pending_reason` Awaiting Info, Awaiting Third Party, Other · `case_task.type` Investigation, Review, Follow-up, Other · `case_task.status` Open, In Progress, Closed · `case_party.party_type` Person, Organization. Exactly **one display field per table** (`number` / `subject` / `role_label`), so reference display values render. In the UI the three lists read "1 to 20 of 20", "1 to 10 of 10", "1 to 8 of 8" as real data grids, with **zero** error banners, the `Case` column populated on **10/10** task rows and **8/8** party rows, **0 console errors** and **0 non-2xx** across 241 requests. |
| Auto-numbering | One synthetic in-scope insert produced **`CASE0000542`**, matching `^CASE[0-9]{7}$`; the probe row was removed again. `number` is read-only, proven four ways including a live typing test that left the value unchanged and `g_form.modified` false. |
| REST, anonymously (no credentials sent) | `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE0000543","message":"Your case has been submitted"}`, and the created case is in `Draft`. `GET …/case_status_lookup?number=CASE0000543` → **200** with body keys **exactly** `{opened_date, status, subject}`; `assigned_group`, `assigned_agent`, `description`, `closed_date`, `requester_name`, `requester_email` and `sys_id` are absent from the parsed body **and** from the raw response text. `GET …?number=CASE9999999` → **404** `{"error":"No case found with that number."}`, **31 of 31 bytes identical** to the required literal. |
| RBAC | `sys_security_acl` 26, **`sys_security_acl_role` 27**. Table-level probe under impersonation with `GlideRecordSecure`: manager create/read/write/delete on all three tables; agent create only, with **no blanket read or write** and **delete false**; viewer read only. Record-level narrowing was proven in the browser earlier in the pass on both halves of the AAP §0.5.6 definition. |
| Roles and scope | One `sys_user_role` row each for `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`; exactly one `sys_scope` row, `scope=x_casemgmt`, version 1.0.0. |
| Demo data | 20 cases at the census (21 once the last anonymous-submit regression probe, `CASE0000553`, was added), **none with an empty `number`**, spanning **all six** statuses and **both** case types; 10 tasks (3 Open, 1 In Progress, 6 Closed) with **zero** dangling parent references; 8 parties (5 Person, 3 Organization) with zero dangling parent or organization references; 3 users, 1 group with a correctly-referenced membership, 3 role grants, 2 synthetic companies. Every case `requester_email` is on `@example.invalid` — 20 of 20 at the census, and the later probe likewise. The rows above the AAP threshold of 10 are the disclosed validation probes and the `ATF 18` residue of §9.8; the regression harness left nothing behind (`U1BASE-` rows remaining: 0). |
| Workflow, on the form | `Resolve` clicked on `CASE0000454` while `TASK0000091` was still `Open`: **blocked**, with exactly one visible message, `All tasks must be closed before resolving this case.` — 52 characters, no leading or trailing whitespace, terminating U+002E, strict equality against the required literal true. **No write occurred**: after a cache-bypassing reload the status is still `In Progress`, `closed_date` still empty, `sys_mod_count` still **0**, and the complete before and after record XML snapshots are **byte-identical**. |
| ATF | `sn_atf.runner.enabled=true`, `sn_atf.headless.enabled=false` (instance settings; the package contains **zero** `sys_properties` records). Three suite runs, byte-identical verdicts each time: **20 ran, 16 Success, 4 Failure, 0 Error, 0 Skipped**. Failures are `ATF 07` (§9.6 E-ATF) and `ATF 15`/`16`/`17` (§9.6 E-ATF15). Survivability of the re-imported records: `sys_atf_test` 20, `sys_atf_step` 180, step-parameter rows **542** — exactly the 542 `Value` blocks the package ships — one suite, 20 suite members, **zero tests with no steps**, **zero steps with no parameters**, suite `sys_mod_count` 0. The ATF records did **not** degrade the way the flows did in Defect F. |
| Regression | The baseline harness re-run verbatim: **13 / 13 before, 13 / 13 after** (§9.7). |

---

## 10. Recommended next steps

Ordered by what unblocks the most. Estimates are for an engineer with admin access to the instance and are
deliberately conservative. Items this pass completed are not listed.

### 10.1 Blocking — the application is not demonstrable through its intended UI without these

| # | Work | Why | Estimate |
|---|---|---|---|
| 1 | **Author the Service Portal layout records** (`sp_container`, `sp_row`, `sp_column`, `sp_instance`) for both pages and capture them into the Update Set, plus a menu so the two pages are reachable from the portal home | Both portal pages currently render blank (§9.6 E8-P). The widgets and endpoints already work, so this is pure layout | 2–4 h |
| 2 | **Fix the four child-table ACL conditions** — replace `current.case` with `current.getValue('case')` | `case` is a JS reserved word, so the conditions cannot compile and deny every row; the agent has no access to tasks or parties (§9.6 E-ATF). This is the one open *functional* access-control gap | 1 h incl. re-running ATF 07 |
| 3 | **Reduce each table to a single display field** in the packaged `Dictionary` blocks **and** in `post_import_remediation.js` | Otherwise every reference to a case renders blank, and re-running the remediation reintroduces the problem (§9.6 E7) | 1 h |
| 4 | **Add `number` to the packaged `Case Record` payloads**, or drop the seed rows from the package and rely on `seed_demo_data.js` | The packaged seed data commits with no case numbers and dangling child references, and it blocks the seed script from repairing them (§9.6 E1). Dropping the 28 seed blocks is the simpler and more robust option | 1–2 h |

### 10.2 Correctness and packaging

| # | Work | Why | Estimate |
|---|---|---|---|
| 5 | **Emit canonical `<table>_<sys_id>` update names from the generator** | This pass had to rewrite all 916 names to get a zero-error preview on a clean instance; the generator still emits human-readable names (§9.2) | 1 h in the generator |
| 6 | **Author the two related lists** required by AAP §0.4.4 (`case_task` and `case_party` on the case form) and capture them | Never authored; a user cannot see a case's tasks or parties from the case form (§9.6 E8) | 1–2 h |
| 7 | **Shorten the four over-length UI Action conditions** to ≤ 254 characters, or move the logic into the action script | Truncation makes the guards fail open, so transition buttons render for users who cannot use them (§9.6 E3) | 1 h |
| 8 | **Tick "Reverse if false" on the party UI Policy** (and confirm it is not load-only) | The conditional Person/Organization fields do not re-evaluate when `party_type` changes on screen (§9.6 E4) | 15 min |
| 9 | **Resolve roles from `sys_user_has_role`** in `CaseTransitionValidator.canTransitionToClosed()` instead of `gs.getUser(userName)` | Closes a latent authorisation hole on branch (b): any future caller that passes a foreign `userId` is answered against the *caller’s* roles. The shipped runtime never takes that branch and all 13 regression assertions pass, so this is hardening rather than a fix for a live failure (§9.6 E-GU, §9.7) | 30 min |
| 10 | **Reconcile the duplicate `sys_ws_operation` identity** for the submit endpoint | The artifact and the package carry different `sys_id`s for the same logical endpoint (§9.3) | 30 min |
| 11 | **Rename the Dashboard tab child from `pa_tab` to `pa_tabs`** in `dashboards/pa_dashboards_x_casemgmt_agent_workspace.xml`, `…_manager_view.xml` and the two matching Dashboard `<payload>` blocks in the Update Set, then re-import and confirm `pa_m2m_dashboard_tabs` has one row per dashboard and both render | Validation gate 6 fails today because each dashboard installs with no tab. The capability is present on the PDI — `pa_tabs` exists and `pa_tab` does not — so this is a rename, not an investigation (§9.6 E5) | 15–30 min + one re-import |

### 10.3 Test suite

| # | Work | Why | Estimate |
|---|---|---|---|
| 12 | **Make `ATF 15/16/17` create their fixture inside the client step's transaction** (or use ATF's `{{step[…]}}` substitution) | They currently depend on fixture residue from earlier runs and fail on a genuinely clean instance (§9.6 E-ATF15) | 2–3 h |
| 13 | **Re-run the full suite after items 2 and 12** and expect 20/20 | ATF 07 is a real defect that item 2 fixes; 15/17 are fixed by item 12 | 30 min per run (client runner; `sn_atf.headless.enabled` cannot be enabled here) |

### 10.4 Deployment ergonomics

| # | Work | Why | Estimate |
|---|---|---|---|
| 14 | **Collapse the two-pass install into one** by finding a packaging route that yields physical storage without a table rebuild — e.g. shipping the tables via an application *installation* rather than an Update Set | The current procedure needs two commits because dropping `sys_db_object` cascades the ACLs (§9.5 steps 1–3) | investigation, 1 day |
| 15 | **Correct the stale instance hostname** wherever it still appears; `dev364430` returns HTTP 401 and `dev379024` is the reachable instance | Anyone following the older documentation will hit a 401 and conclude the credentials are wrong | 30 min |
| 16 | **Replace the single-DELETE rollback instruction** with the staged teardown this pass had to use | `DELETE /api/now/table/sys_scope/{id}` returns HTTP 500 *maximum execution time exceeded* at this data volume and does not cascade (§9.1) | 30 min |

### 10.5 Explicitly out of scope — unchanged

**Production deployment to a customer instance**, **UAT sign-off**, and **demo-data cleanup** remain out of
scope and are unaffected by this pass. Nothing above should be read as a step toward production readiness: this
is a proof of concept, and the items in §10.1 are what stand between it and a clean demonstration.
