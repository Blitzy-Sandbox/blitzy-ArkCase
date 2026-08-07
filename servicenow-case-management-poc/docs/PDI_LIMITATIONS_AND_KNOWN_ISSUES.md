# PDI Limitations and Known Issues — `x_casemgmt` Case Management POC

> **Purpose:** an honest, complete record of (1) every code-generation/packaging **defect** found in the
> deliverable Update Set and how it was remediated, (2) the **flow-serialization defect** that required the
> seven Flow Designer flows to be re-authored natively, (3) the ServiceNow **PDI platform limitations**
> encountered, and (4) what was intentionally **not done** per scope/constraints. It also gives the precise
> code-generation fixes recommended for the next generation pass.
>
> This document deliberately does **not** overstate the result. Every claim of runtime enforcement below was
> observed on the live instance rather than inferred from the presence of records; where a result is partial
> or depends on an operational step, that is stated explicitly.

---

## 1. Executive summary

| Capability | Runtime status on the PDI |
|---|---|
| 3 custom tables + fields + choices + auto-number | ✅ Working. The physical schema is built by `scripts/post_import_remediation.js`, which the package now **auto-executes** on Update Set commit (§2 Defect C). Auto-numbering itself is carried by the package artifacts (§2 Defect E): a fresh insert produced `CASE0000058`, matching `^CASE[0-9]{7}$`. |
| 3 roles + ACL role × CRUD matrix (manager/agent/viewer, incl. assigned-only + field ACLs) | ✅ Working. The 27 `sys_security_acl_role` links **and** the security-cache flush are created by the auto-executing remediation (§2 Defect 9). Live 12-cell matrix: manager full CRUD on all three tables; agent create-only at table level with `delete=false`; viewer read-only. Record-scoped narrowing confirmed: the agent can read/write its assigned case and the unassigned case is filtered out of the query entirely (9 of 10 rows visible). |
| Prohibited-transition guards (Any→Draft, Closed→*) | ✅ Working (Business Rules) |
| Transition side-effects (`opened_date`, `closed_date`, clear `pending_reason`) | ✅ Working (Business Rules) |
| `assigned_agent` must be a member of `assigned_group` (when an agent **is** set) | ✅ Working (Business Rule) |
| Anonymous portal: case submit (Draft + number) and status lookup (whitelisted) | ✅ Working. `service_id` is now carried by the package itself (§2 Defect 7). Verified with **no credentials on the request**: `POST /api/x_casemgmt/case_submit` → **201** `{"number":"CASE0000059","message":"Your case has been submitted"}`; `GET …/case_status_lookup?number=CASE0000013` → **200** with body keys exactly `{status, subject, opened_date}`; `?number=CASE9999999` → **404** `{"error":"No case found with that number."}`. |
| Reports (8) + Dashboards (2) records + demo data | ✅ Present and backed by populated tables |
| **Forward-transition precondition guards** (Draft→Open needs group; Open→In&nbsp;Progress needs agent-in-group; In&nbsp;Progress→Resolved needs all tasks closed; Resolved→Closed needs manager role) | ✅ **Enforced at runtime, blocking on the form** — all 7 Flow Designer flows were re-authored natively and now execute; the order-250 before-update Business Rule runs the matching validation subflow synchronously and aborts the save with the verbatim message. Verified on the live case form for **both** case types (Defect F, §3). |

**Bottom line:** the data model, access control, prohibited-transition protection, side-effects, the forward
precondition guards, and the external portal all work. The *positive precondition* checks for forward state
transitions now run and block invalid transitions on the form: the seven flows that contain them were
re-authored through Flow Designer itself and are invoked synchronously from a before-update Business Rule.

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
2. **The redisplayed form echoes the rejected value.** After an aborted save the classic form shows the value
   the user submitted, and in assertion iii it also showed a populated `Closed Date`, because the order-500
   rule still ran against the in-memory record. Both are phantom: a reload and a database read show the case
   unchanged. Only a reload or a REST read proves persistence — reading status from the post-save frame
   produces a false "allowed" result.
3. **An aborted save returns HTTP 302, exactly like a successful one**, so HTTP status cannot be used to
   detect a block. The reliable in-page signal is `#output_messages` losing its `outputmsg_hide` class.

Saves take roughly 8–10 seconds to settle, because order 250 executes a Flow Designer subflow synchronously.

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

---

## 6. Validation-gate status (AAP §0.7.3) — honest assessment

| Gate | Criterion | Status | Notes |
|---|---|---|---|
| 1. Data model | 3 tables, correct fields/types | ✅ PASS | After direct-build (Defect C). All mandatory fields present. |
| 2. Workflow | All transitions enforced for both case types | ✅ **PASS** | Prohibited transitions (Any→Draft, Closed→*), side-effects and agent-membership are enforced by Business Rules; the **four forward precondition guards, including the task-closure-blocks-Resolve gate, are now enforced at runtime and block on the form** after the seven flows were re-authored natively and wired into the order-250 before-update Business Rule (Defect F, §3). Verified by 8 live form observations — 4 assertions × 2 case types — with the verbatim messages read from the rendered DOM, and `sys_flow_context` rows in state `COMPLETE` for all 7 flows. |
| 3. ACLs | Role-based access enforced | ✅ PASS | After Defect 9 remediation; empirically validated (manager full / agent assigned-only / viewer read-only). |
| 4. Portal — submission | Unauthenticated submit creates a Draft case with a number | ✅ PASS | Anonymous POST → 201 `{number, "Your case has been submitted"}`; case appears with `Draft` status. |
| 5. Portal — lookup | Status lookup returns correct data / not-found | ✅ PASS | GET valid → `{status, subject, opened_date}` (no internal-field leak); GET invalid → 404 "No case found with that number." |
| 6. Dashboards | Both dashboards render with synthetic data | ✅ Records present | `x_casemgmt_agent_workspace` + `x_casemgmt_manager_view` exist; all 8 backing reports exist over populated tables (10 cases / 10 tasks). Visual render should be confirmed in the UI per the tryout guide. |
| 7. Update Set | Loads/previews with zero errors | ✅ PASS | Zero-error preview achieved (111 → 5 → 0); committed. |

> **Net:** 6 gates fully pass and 1 (dashboards) is verified at the data/record layer, with its visual render
> to be confirmed in the UI per the tryout guide. The deployment is usable end-to-end for case intake, access
> control, the full state machine — prohibited transitions, forward-transition preconditions and side-effects
> alike — and the external portal. Gate 2 moved from PARTIAL to PASS once the seven flows were re-authored
> natively and the order-250 Business Rule turned their verdicts into blocking form errors (§3).

---

## 7. Summary of where each fix lives

| Defect | Fixed in deliverable XML | Fixed live on PDI | Repo source XML patched | Operational (post-import script) |
|---|:---:|:---:|:---:|:---:|
| A duplicate scope | ✅ | — | ✅ | — |
| B `application` ref | ✅ | — | ✅ | — |
| C commit-no-DDL | ✅ the remediation script **and** its auto-execute trigger are folded into the Update Set (Fix Script at position 103, Business Rule at 104; 151 → 153 records) | ✅ | ✅ `scripts/post_import_remediation.js` + `scripts/sys_script_fix_…xml` + `scripts/sys_script_…bootstrap.xml` | **automated on commit — no human step** |
| D cross-scope barrier | n/a | n/a (workaround) | n/a | n/a — the remediation runs entirely in **global** and writes no `x_casemgmt_*` data; data seeding stays `seed_demo_data.js`'s job, in scope |
| E auto-numbering | ✅ `Dictionary` + 3 × `Number Maintenance` payload blocks updated | ✅ | ✅ `dictionary/x_casemgmt_case_number.xml`, `numbers/sys_number_x_casemgmt_case{,_task,_party}.xml` | re-asserted by the script (needed only because Defect C's rebuild re-creates the dictionary row) |
| 6 `gs.nowDateTime` | partial | ✅ | ✅ | — |
| 7 REST `service_id` | ✅ both `Scripted REST Service` payload blocks updated | ✅ | ✅ `portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml`, `…_case_status_lookup.xml` | re-asserted by the script (convergence for a partially-repaired instance) |
| 8 stale REST op-scripts | already correct in XML | ✅ | n/a | — |
| 9 ACL role-links | ✅ the remediation + trigger that create them are in the Update Set. The 27 `sys_security_acl_role` **records themselves cannot be packaged** — `sys_security_acl` has no `roles` column and link payloads are silently skipped by the engine (5 shapes tested) | ✅ | ✅ created by `scripts/post_import_remediation.js` from each ACL's own `<roles>` declaration, resolved **by name** | **automated on commit — no human step**, including the `GlideSecurityManager.get().reset()` flush |
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
> - **Residual human footprint for C, E, 7 and 9: none.** Upload → preview → commit is sufficient. The only
>   fallback, needed solely if the bootstrap Business Rule is removed from the instance, is a single action:
>   *System Definition → Fix Scripts → "x_casemgmt Post-Import Remediation" → Run Fix Script* with scope
>   **Global**. Expected output is the same `…|SUMMARY|verified=true|…|errors=0` line.
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
