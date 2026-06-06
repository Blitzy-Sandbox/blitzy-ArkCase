# PDI Limitations and Known Issues — `x_casemgmt` Case Management POC

> **Purpose:** an honest, complete record of (1) every code-generation/packaging **defect** found in the
> deliverable Update Set and how it was remediated, (2) the **one defect that could not be remediated**
> without authoring new application logic, (3) the ServiceNow **PDI platform limitations** encountered, and
> (4) what was intentionally **not done** per scope/constraints. It also gives the precise code-generation
> fixes recommended for the next generation pass.
>
> This document deliberately does **not** overstate the result. The deployment is functional for the
> majority of the specified behavior, but it has a material runtime gap (the Flow Designer flows), which is
> documented in full below.

---

## 1. Executive summary

| Capability | Runtime status on the PDI |
|---|---|
| 3 custom tables + fields + choices + auto-number | ✅ Working (after direct-build remediation) |
| 3 roles + ACL role × CRUD matrix (manager/agent/viewer, incl. assigned-only + field ACLs) | ✅ Working (after role-link remediation; empirically validated) |
| Prohibited-transition guards (Any→Draft, Closed→*) | ✅ Working (Business Rules) |
| Transition side-effects (`opened_date`, `closed_date`, clear `pending_reason`) | ✅ Working (Business Rules) |
| `assigned_agent` must be a member of `assigned_group` (when an agent **is** set) | ✅ Working (Business Rule) |
| Anonymous portal: case submit (Draft + number) and status lookup (whitelisted) | ✅ Working (scripted REST, after service_id + op-script remediation) |
| Reports (8) + Dashboards (2) records + demo data | ✅ Present and backed by populated tables |
| **Forward-transition precondition guards** (Draft→Open needs group; Open→In&nbsp;Progress needs agent-in-group; In&nbsp;Progress→Resolved needs all tasks closed; Resolved→Closed needs manager role) | ❌ **NOT enforced at runtime** — these live only in the Flow Designer flows, which deploy as non-functional dead shells (Defect F). The transition *logic* exists and is correct in the `CaseTransitionValidator` Script Include, but nothing invokes it at runtime. |

**Bottom line:** the data model, access control, prohibited-transition protection, side-effects, and the
external portal all work. The *positive precondition* checks for forward state transitions do not run,
because the flows that contain them were serialized incorrectly by the code generator.

---

## 2. Defects found in the deliverable, and their remediations

> Nine packaging/configuration defects were remediated to make the deliverable's **own documented intent**
> deploy and run. None of these involved authoring new application logic — they restore the generator's
> stated design (e.g., wiring existing roles to existing ACLs per each ACL's own description, building tables
> from the deliverable's own field specs). The tenth issue (Defect F, flows) is **not** remediated here
> because it *would* require authoring new logic.

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

### Defect C — Update Set commit does not trigger DDL for **new** tables  *(platform limitation; remediated operationally)*
- **Symptom:** after a clean zero-error commit, `x_casemgmt_case` materialized but `x_casemgmt_case_task`
  and `x_casemgmt_case_party` physical tables and **all** choice lists were absent (persisted across 6 commit
  attempts and a full app-delete teardown + re-establish cycle).
- **Root cause:** committing a retrieved Update Set applies record *metadata* but does **not** execute the
  physical schema DDL for brand-new tables. A fresh `GlideRecord` INSERT of `sys_db_object` /
  `sys_dictionary` / `sys_choice` (workflow ON) *does* trigger the DDL.
- **Remediation:** direct-build the two tables, their fields, and all choices from the deliverable's own
  `data-model.md` specs (forced deliverable sys_ids, `x_casemgmt` scope). Result: `case_task` 13 cols /
  7 choices, `case_party` 12 cols / 2 choices, `case` 15 choices. See deployment guide §5a.

### Defect D — Cross-scope write/read barrier for background scripts  *(platform behavior; worked around)*
- **Symptom:** a `global` background script could neither create nor read rows in the scoped `x_casemgmt_*`
  tables (writes refused; reads return 0 rows).
- **Root cause:** background scripts execute in `rhino.global`; scoped tables refuse cross-scope data access
  by default.
- **Remediation/Workaround:** run background scripts **in scope** by passing the scope **sys_id**
  (`82b99028…`) as the `sys_scope` parameter to `sys.scripts.do`. (This same barrier complicates ACL
  impersonation testing — see §3.)

### Defect E — Auto-numbering does not fire on a direct-built scoped table  *(fixed live; documented post-import step — not patched into repo XML)*
- **Symptom:** new `x_casemgmt_case` inserts received no `CASE…` number.
- **Root cause:** on a directly-built scoped table the standard number generation is not wired.
- **Remediation:** set the `number` dictionary `default_value` to
  `javascript:global.getNextObjNumberPadded();` (**the `global.` qualifier is required** in scope) and
  `maximum_digits = 7` on the counter; flush cache. Numbering then yields `CASE0000001` format.

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
  occurrences inside the `validate_closed_transition` subflow are deliberately left untouched: they live in
  the flow's serialized snapshot JSON, the flow never executes (Defect F), and `closed_date` stamping is
  reliably handled by the corrected `set_closed_date` business rule instead. XML comments, `<description>`
  text, dictionary defaults, and seed-data values are intentionally left as generated.)

### Defect 7 — Scripted REST `service_id` missing  *(fixed live)*
- **Symptom:** every call to the portal REST endpoints returned HTTP 400 "Requested URI does not represent
  any resource".
- **Root cause:** both `sys_ws_definition` records shipped with an empty `service_id`, collapsing the route
  to `/api/x_casemgmt`.
- **Remediation:** set `service_id = case_submit` and `case_status_lookup`. Routes restored to
  `POST /api/x_casemgmt/case_submit` and `GET /api/x_casemgmt/case_status_lookup`.

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

### Defect 9 — ACL → role link records entirely missing  *(fixed live; empirically validated)*
- **Symptom:** with the app committed, **no** role (manager/agent/viewer) could use the application; only
  `admin` (via `admin_overrides`) had access.
- **Root cause:** the deliverable ships 26 correct `sys_security_acl` records (correct operations,
  assigned-only condition scripts, and descriptions that name the intended role per ACL) but **zero**
  `sys_security_acl_role` link records. On this high-security PDI, an ACL with no role + no condition + no
  script evaluates to **deny** ("Deny access for empty term"), so every non-admin was denied.
- **Remediation:** created the 27 `sys_security_acl_role` links (the `.assigned_agent` field ACL needs both
  manager + agent; all roles looked up **by name**, no hard-coded sys_id, scoped to the app). The mapping is
  100% deterministic from each ACL's own description, so this restores the generator's documented design
  rather than authoring new policy. Security cache flushed.
- **Empirical validation** (impersonation `canX` probe): `MANAGER = full CRUD`; `AGENT = create + assigned-only
  read/write + no delete`; `VIEWER = read-only` — exactly the AAP §0.5.6 matrix.

---

## 3. The defect that was NOT remediated — **Defect F: Flow serialization defect**

> This is the single most important limitation and is reported here in full. It is **not** remediated
> because doing so would require **authoring new application logic** (rebuilding/publishing a Flow Designer
> flow graph), which the Refine-PR mandate explicitly forbids ("do not generate any new code"). It is also
> not remediable at the deployment layer: there is no supported API to rehydrate a flow from a snapshot blob,
> and the required runtime graph records simply do not exist in the deliverable.

- **What shipped:** all 7 flows — 2 main (`x_casemgmt_general_inquiry_state_machine`,
  `x_casemgmt_complaint_state_machine`) and 5 subflows (`validate_open`, `validate_inprogress`,
  `validate_pending`, `validate_resolved`, `validate_closed`) — are **header-only `sys_hub_flow` records**.
- **Evidence (multi-source, definitive):**
  - 0 `sys_hub_trigger_instance`, 0 `sys_hub_action_instance`, 0 `sys_hub_flow_logic`, 0 `sys_hub_flow_snapshot`
    records in scope.
  - 0 `sys_flow_context` rows for any `x_casemgmt` flow → the flows have **never executed** (not on seed, not
    on any update).
  - The live `latest_snapshot` / `master_snapshot` values are 32-char **truncated JSON garbage**: the
    generator placed the ~10,651-byte compiled flow-definition JSON into a **32-character reference field**,
    which truncated on import.
  - The deliverable XML and the per-flow repo XML contain only the 7 `sys_hub_flow` headers; the flow logic
    exists *only* as inline JSON in the snapshot CDATA, not as the required graph records.
- **Root cause:** the code generator serialized each flow as a header record with the compiled snapshot
  inlined into a reference field, **without** emitting the runtime graph
  (`sys_hub_trigger_instance` + `sys_hub_action_instance` + `sys_hub_flow_logic` + a real
  `sys_hub_flow_snapshot` record). A flow cannot register its trigger or execute without that graph.
- **Runtime impact:** the following **forward-transition precondition guards are not enforced**:
  - Draft → Open requires `assigned_group` populated.
  - Open → In&nbsp;Progress requires `assigned_agent` populated **and** a member of `assigned_group`.
    *(Partial mitigation: the `validate_assigned_agent_membership` Business Rule blocks an **invalid** agent —
    one not in the group — but does **not** block an **empty** agent on this transition.)*
  - In&nbsp;Progress → Resolved requires all child `x_casemgmt_case_task` records to be `Closed`
    (the "All tasks must be closed before resolving this case." gate).
  - Resolved → Closed requires the caller to hold `x_casemgmt_case_manager`.
- **What still works despite Defect F** (enforced by Business Rules / Script Include, confirmed):
  Any→Draft is blocked ("Cases cannot be returned to Draft."); Closed→* is blocked ("Closed cases are
  terminal and cannot be modified."); `opened_date`/`closed_date` side-effects fire; `pending_reason` is
  cleared on In&nbsp;Progress; agent-membership is validated when an agent is set. The **logic** for all
  forward guards is present and correct in the `CaseTransitionValidator` Script Include (13 logic assertions
  pass, all verbatim error messages correct) — it is simply never invoked, because only the dead flows call it.
- **Required code-generation fix (next pass):** export each flow **with** its complete runtime graph —
  `sys_hub_trigger_instance`, `sys_hub_action_instance`, `sys_hub_flow_logic`, and a genuine
  `sys_hub_flow_snapshot` record (the snapshot must be a real related record, **not** inline JSON crammed
  into the 32-char `latest_snapshot`/`master_snapshot` reference field) — **or** rebuild and publish each
  flow in Flow Designer on the PDI and then re-export.

---

## 4. ServiceNow PDI platform limitations encountered (not deliverable defects)

These are inherent platform behaviors that shaped the deployment and testing approach. They are documented
so future operators don't mistake them for bugs.

1. **Commit ≠ DDL for new tables.** (See Defect C.) A direct `GlideRecord` build is the reliable way to
   materialize brand-new scoped tables.
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
6. **Auto-numbering on scoped tables requires the `global.` qualifier** (`global.getNextObjNumberPadded()`).
   (See Defect E.)
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
- **Flow graph not reconstructed** (Defect F) — explicitly out of bounds (would be authoring new logic).

---

## 6. Validation-gate status (AAP §0.7.3) — honest assessment

| Gate | Criterion | Status | Notes |
|---|---|---|---|
| 1. Data model | 3 tables, correct fields/types | ✅ PASS | After direct-build (Defect C). All mandatory fields present. |
| 2. Workflow | All transitions enforced for both case types | ⚠️ **PARTIAL** | Prohibited transitions (Any→Draft, Closed→*), side-effects, and agent-membership-when-set are enforced (Business Rules). **Forward precondition guards and the task-closure-blocks-Resolve gate are NOT enforced at runtime** (Defect F). Logic is present/correct in `CaseTransitionValidator`. |
| 3. ACLs | Role-based access enforced | ✅ PASS | After Defect 9 remediation; empirically validated (manager full / agent assigned-only / viewer read-only). |
| 4. Portal — submission | Unauthenticated submit creates a Draft case with a number | ✅ PASS | Anonymous POST → 201 `{number, "Your case has been submitted"}`; case appears with `Draft` status. |
| 5. Portal — lookup | Status lookup returns correct data / not-found | ✅ PASS | GET valid → `{status, subject, opened_date}` (no internal-field leak); GET invalid → 404 "No case found with that number." |
| 6. Dashboards | Both dashboards render with synthetic data | ✅ Records present | `x_casemgmt_agent_workspace` + `x_casemgmt_manager_view` exist; all 8 backing reports exist over populated tables (10 cases / 10 tasks). Visual render should be confirmed in the UI per the tryout guide. |
| 7. Update Set | Loads/previews with zero errors | ✅ PASS | Zero-error preview achieved (111 → 5 → 0); committed. |

> **Net:** 5 gates fully pass, 1 (dashboards) verified at the data/record layer, and 1 (workflow) is
> **partial** due to Defect F. The honest headline is that the deployment is usable end-to-end for case
> intake, access control, prohibited-transition protection, side-effects, and the portal — but it does **not**
> enforce forward-transition preconditions at runtime until the flows are regenerated correctly.

---

## 7. Summary of where each fix lives

| Defect | Fixed in deliverable XML | Fixed live on PDI | Repo source XML patched | Operational (post-import script) |
|---|:---:|:---:|:---:|:---:|
| A duplicate scope | ✅ | — | ✅ | — |
| B `application` ref | ✅ | — | ✅ | — |
| C commit-no-DDL | n/a | ✅ | n/a | ✅ (direct-build) |
| D cross-scope barrier | n/a | n/a (workaround) | n/a | ✅ (run in scope) |
| E auto-numbering | — | ✅ | ❌ (documented post-import step) | ✅ |
| 6 `gs.nowDateTime` | partial | ✅ | ✅ | — |
| 7 REST `service_id` | — | ✅ | ❌ (documented post-import step) | ✅ |
| 8 stale REST op-scripts | already correct in XML | ✅ | n/a | — |
| 9 ACL role-links | — | ✅ | ❌ (documented post-import step) | ✅ |
| F flow serialization | ❌ not fixable without new code | ❌ | ❌ | ❌ |

> **Repo-source propagation policy (commit-phase decision).** The repository's in-scope artifacts are patched
> for exactly two classes of defect: (1) **import-blocking** packaging / reference-resolution defects (A, B),
> and (2) **in-place corrections of an existing generated script line** that are mechanical, semantically
> equivalent, and validated working live (Defect 6 — the two `gs.nowDateTime()` Business-Rule lines). All
> other remediations — **E** (auto-numbering default), **7** (REST `service_id`), **9** (ACL role-links) — are
> **runtime/config or new-record** remediations: they were applied live on the PDI and are documented here and
> in `HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` as required post-import operational steps. They are deliberately NOT
> injected into the deliverable XML or repo source, both to honor the "do not generate new code / synthesize
> new records" mandate and to preserve the validated zero-error Update Set preview gate.
