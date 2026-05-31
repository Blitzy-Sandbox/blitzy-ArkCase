# CODE_REVIEW.md

**Project:** ArkCase → ServiceNow Scoped Application Re-Platform (Proof-of-Concept)
**Branch:** `blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2`
**Concrete scope identifier:** `x_casemgmt` (resolved from AAP placeholder `x_[scope]`)
**Review type:** Multi-domain, analysis-only PR review per the user-provided Refine PR Instructions. This review **does not modify production code and does not execute builds or re-run code generation**. Its two deliverables are this file (`CODE_REVIEW.md`) and, only if the final verdict is APPROVED, `executive-summary.html`.
**Review process:** A single fresh cycle (**Cycle 1** of this run; any prior cycle approvals/verdicts/findings recorded in earlier revisions of this file are discarded per the Refine PR restart rule). Each cycle runs, in fixed order: Pre-flight Gate → Access Level Assessment → Domain Assignment Manifest → Phase 1 Infrastructure/DevOps → Phase 2 Security → Phase 3 Backend Architecture → Phase 4 Business/Domain → Phase 5 Frontend → Phase 6 QA/Test Integrity → Phase 7 Other SME → Aggregation → Final Reviewer Verdict.
**Final verdict (current):** *Pending — Cycle 1 in progress.*

---

## Technology-stack adaptation note (read first)

The Refine PR Instructions enumerate review criteria written for a **Java / Spring Boot / Maven / Flyway / JPA / Kafka** service (they reference `src/main/java`, `pom.xml`, `application.properties`, Spring Batch, Ingres→PostgreSQL type fidelity, `gap-register.md`, etc.). **This project is none of those.** It is a **ServiceNow scoped application** delivered as serialized record-definition XML (147 files) + 1 standalone JavaScript seed script + 9 Markdown docs, all confined to `servicenow-case-management-poc/`. There is no compiler, no package manager, and no traditional test runner (AAP §0.6.1); the platform is a cloud ServiceNow Personal Developer Instance (PDI).

Per the Refine PR rule *"For any check that is not relevant to this project's technology stack, record `[check name]: not applicable — [reason]` and continue,"* every Java/Spring-specific check below is explicitly marked **not applicable** with a reason, and the **ServiceNow-native analog** (ACL/role design, Flow Designer state machine, scripted-REST field whitelist, no-hardcoded-`sys_id`, scope-namespace exclusivity, XML well-formedness, embedded-JS syntax, AAP §0.5.7 data-model fidelity, verbatim error strings) is reviewed in its place. The reviewer authored a standalone static-validation harness (xmllint, `node --check`, regex sweeps) to generate objective evidence; results are cited inline.

---

## Pre-flight

Per the Refine PR Instructions, the pre-flight gate is evaluated before any domain phase. **Failures do not abort the review** — each is recorded as a Critical finding and the review still runs to completion. All six gates are evaluated below; each is adapted to the ServiceNow stack where the literal Java/Spring phrasing does not apply.

| # | Gate | Pass condition (as written) | Result | Evidence |
|---|------|------------------------------|--------|----------|
| 1 | Deliverables exist | Every AAP-mandated artifact present in the repo | **PASS** | Full §0.3.1 inventory present (counts below) |
| 2 | Local build & runtime environment documented | Project Guide documents runtime versions, build/run steps, env vars | **PASS** (adapted) | `Project Guide.md` §3–§4; `servicenow-case-management-poc/docs/deployment.md`; `README.md` |
| 3 | Build & test status | Project Guide records AAP validation gates PASSED and test suite passing | **PASS** | `Project Guide.md` §3 test table + §5 AAP compliance matrix |
| 4 | Test coverage | Per-module test counts and pass rates present for all modules | **PASS** (adapted) | `Project Guide.md` §3 (per-category counts + pass rates) |
| 5 | Static analysis | No `@SuppressWarnings` w/o comment; no TODO/FIXME in production-path code | **PASS** (adapted) | Reviewer scan: zero genuine TODO/FIXME; `@SuppressWarnings` N/A (no Java) |
| 6 | No stubs in production path | No method whose sole impl is `return null` / `UnsupportedOperationException` / `emptyList()` | **PASS** (adapted) | Reviewer scan of `seed_demo_data.js` + embedded scripts: all bodies complete |

### Gate 1 — Deliverables exist — **PASS**

Every artifact mandated by AAP §0.3.1 / §0.4.1 is present. Reviewer-counted inventory under `servicenow-case-management-poc/`:

| Category | AAP-expected | Present | Path |
|---|---|---|---|
| Scoped app metadata | sys_app + sys_scope | 2 | `app/sys_app/`, `app/sys_scope/` |
| Custom tables | 3 | 3 | `tables/` |
| Dictionary fields | 23 prompt fields + supporting | 25 | `dictionary/` (12 case + 6 task + 5 party + `pending_reason` + `duration_to_close`) |
| Choice lists | 7 | 7 | `choices/` |
| Auto-numbering | 3 | 3 | `numbers/` |
| Scoped roles | 3 | 3 | `roles/` |
| ACLs | table+field | 26 | `acl/` (24 table-level + 2 field-level) |
| Flow Designer flows | 2 main + subflows | 2 + 5 | `flows/`, `flows/sub_flows/` |
| Script Includes | 2 | 2 | `script_includes/` |
| Business Rules | 6 | 6 | `business_rules/` |
| UI Policy | 1 | 1 | `ui_policy/` |
| UI Actions | transition buttons | 6 | `ui_action/` |
| Experience Portal | portal+2 pages+3 widgets+REST | 1+2+3+4 | `portal/`, `portal/pages/`, `portal/widgets/`, `portal/rest/` (2 def + 2 op) |
| Dashboards + Reports | 2 + 8 | 2 + 8 | `dashboards/`, `reports/` |
| Synthetic seed data | 10 cases / tasks / parties / users / group / role-assign | 10/10/8/3/1/3 | `seed-data/**` |
| Documentation | README + 7 docs | 1 + 7 | `README.md`, `docs/` |
| Scripts | seed JS + round-trip MD | 2 | `scripts/` |
| Consolidated Update Set | 1 | 1 | `update-set/x_casemgmt_case_management_update_set.xml` |

No AAP-mandated artifact is missing. No Critical finding.

### Gate 2 — Local build & runtime environment documented — **PASS (adapted)**

There is **no local build** for this stack (AAP §0.6.1: zero dependency manifests; all capabilities bundled in the cloud PDI). The literal "runtime versions / build steps" phrasing maps to **deployment to a PDI**, which is documented:
- `Project Guide.md` §3 explicitly states the no-build posture and enumerates the validation tooling actually used (Node 20.x `node --check`, Python XML parser, xmllint).
- `servicenow-case-management-poc/docs/deployment.md` documents the Update Set export → re-import → preview → commit walkthrough.
- `servicenow-case-management-poc/scripts/round_trip_verify.md` documents the fresh-PDI preview procedure.
- **Environment variables:** none are required for this artifact set (AAP §0.8.5 confirms zero env vars / secrets provided). The PDI instance URL / admin credentials are *deployment-time* inputs (AAP §0.7.2 placeholders), and the docs correctly mark them as human-supplied at deploy time. No Critical finding.

### Gate 3 — Build & test status — **PASS**

`Project Guide.md` §3 records the AAP §0.7.3 seven-gate framework plus static-validation results as PASSED, and §5 contains a full AAP-compliance matrix. The single item recorded as *Pending* (Gate 7 live-PDI re-import preview) is explicitly and correctly attributed to the absence of a provisioned PDI (a human deployment-phase activity), not to a defect. No Critical finding.

### Gate 4 — Test coverage — **PASS (adapted)**

There is no unit-test framework for ServiceNow XML record-definitions (AAP §0.6.1). The analog "per-module counts and pass rates" is satisfied by `Project Guide.md` §3, which tabulates each validation category with totals and pass rates (e.g., XML well-formedness 147/147, standalone JS 1/1, embedded JS 35/35, demo-data threshold checks, verbatim-string checks). The reviewer independently reproduced these (see Pre-flight Gate 5/6 and Phases 2/6). No module shows an unexplained failure. No Critical finding.

### Gate 5 — Static analysis — **PASS (adapted)**

- `@SuppressWarnings` audit: **not applicable** — no Java source exists on this branch.
- TODO/FIXME in production path: reviewer ran `grep -rnE '\b(TODO|FIXME|XXX|HACK|NotImplemented|TBD)\b'` across all `*.xml`/`*.js` under `servicenow-case-management-poc/`. **Zero genuine work-deferral markers.** The handful of textual matches are documentation comments explaining the AAP `x_[scope]`→`x_casemgmt` placeholder-preservation rule (e.g., `portal/rest/sys_ws_definition_x_casemgmt_case_status_lookup.xml:217`, `portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml:231`, `seed-data/parties/x_casemgmt_case_party_demo_01.xml:547`) and one comment in `dictionary/x_casemgmt_case_assigned_group.xml:82` describing that a user *could* type the literal word "TBD" as a free-text value — none are code TODOs. No Critical finding.

### Gate 6 — No stubs in production path — **PASS (adapted)**

Reviewer inspected every executable body. `scripts/seed_demo_data.js` (1,452 LOC, 22 functions) contains six `return null;` statements (lines 431, 470, 677, 745, 758, 767) — each is a **legitimate defensive early-return** guarded by an existence check and accompanied by a `gs.warn(...)` diagnostic (e.g., `ensureGroupMembership` at line 425 returns null only when the user or group cannot be resolved; `ensureParty` at line ~745 returns null only when the parent case / person / organization reference is missing). These are correct control flow, not placeholder stubs. No `UnsupportedOperationException`/`NotImplementedError`/empty-body equivalents exist in any embedded script. No Critical finding.

**Pre-flight gate verdict (Cycle 1): PASS** (6/6 gates pass; 0 Critical findings). Proceeding to Access Level Assessment.

---

## Access Level Assessment

**Determined level: Level 1 — Source code only** (with a ServiceNow-specific nuance described below).

| Level | Access provided | This project? |
|---|---|---|
| 1 | Source code only | **YES — this is the operative level** |
| 2 | + compiler | N/A — ServiceNow XML record-definitions are not locally compiled |
| 3 | + runtime | NO — runtime for this stack is a live ServiceNow PDI, which was not provisioned |
| 4 | + database | NO — the "database" for this stack is the PDI's tables; no PDI access |
| 5 | + API schema + 1P/3P API access | NO — PDI admin URL/credentials are AAP §0.7.2 placeholders, never provided |

**Access confirmed available:**
- Full read access to all 157 source artifacts under `servicenow-case-management-poc/`, the consolidated Update Set XML, the AAP (`blitzy/documentation/Technical Specifications.md`), and the `Project Guide.md`.
- Host-level **static validators**: `xmllint` (libxml 2.14.5), `node --check` (Node v20.20.2), `python3` 3.13.7, `git` 2.51.0. For a ServiceNow stack these are the closest analog to a "compiler": they verify XML well-formedness and embedded-JavaScript syntax **without** executing anything on a platform.

**Access NOT available (and therefore testing capabilities limited):**
- **No live ServiceNow PDI.** For this technology stack the PDI *is* simultaneously the compiler, runtime, database, and API surface. Its absence (AAP §0.7.2 credentials are unresolved placeholders; `Project Guide.md` §1.5 records this as a Human-Operator access issue) means the following are **impossible to exercise locally and are NOT defects of the code**:
  - AAP §0.7.3 Gate 7 — Update Set re-import **Preview** (zero-error) and **Commit** on a fresh PDI.
  - Live workflow execution (Flow Designer state-machine transitions) across both case types.
  - Live ACL enforcement (impersonating `case_manager` / `case_agent` / `case_viewer`).
  - Live Experience Portal page rendering and anonymous submission/lookup round-trips.
  - Live dashboard/report widget rendering against seeded data.

**Effect on the QA/Test Integrity domain (Phase 6):** Per the Refine PR rule *"do not flag as a defect any testing gap that is a direct consequence of the access level provided,"* the reviewer will **not** treat the absence of live-PDI runtime test results as a defect. The build correctly substitutes (a) exhaustive static validation and (b) a documented manual PDI verification runbook (`scripts/round_trip_verify.md`, `docs/validation-gates.md`). Those are the maximum testing capabilities unlocked at Level 1 for this stack, and they were exercised.

---

## Domain Assignment Manifest

Every changed folder under `servicenow-case-management-poc/` is assigned to exactly one **primary** domain; **secondary** domains are listed where a specialist surface is materially touched. The 157 production files are fully partitioned across primary domains (6 + 29 + 50 + 27 + 37 + 8 = 157). Business/Domain is a **cross-cutting** verification domain (AAP-fidelity) and therefore owns no folder exclusively; its secondary stakes are listed. Repo-root review/context files (`CODE_REVIEW.md`, `blitzy/documentation/*.md`) are review/context artifacts, not graded production code.

| Folder | File Count | Primary Domain | Secondary |
|---|---:|---|---|
| `app/` (sys_app, sys_scope) | 2 | Infrastructure/DevOps | Backend Architecture |
| `update-set/` | 1 | Infrastructure/DevOps | QA/Test Integrity |
| `numbers/` | 3 | Infrastructure/DevOps | Backend Architecture |
| `tables/` | 3 | Backend Architecture | Business/Domain |
| `dictionary/` | 25 | Backend Architecture | Business/Domain |
| `choices/` | 7 | Backend Architecture | Business/Domain |
| `script_includes/` | 2 | Backend Architecture | Security |
| `business_rules/` | 6 | Backend Architecture | Business/Domain |
| `flows/` (+ `sub_flows/`) | 7 | Backend Architecture | Business/Domain |
| `roles/` | 3 | Security | — |
| `acl/` | 26 | Security | Backend Architecture |
| `portal/` (portal+pages+widgets+rest) | 10 | Frontend | Security |
| `ui_policy/` | 1 | Frontend | — |
| `ui_action/` | 6 | Frontend | Backend Architecture |
| `dashboards/` | 2 | Frontend | Business/Domain |
| `reports/` | 8 | Frontend | Business/Domain |
| `seed-data/` (users, groups, role_assignments, cases, tasks, parties) | 35 | QA/Test Integrity | Business/Domain |
| `scripts/` (seed_demo_data.js, round_trip_verify.md) | 2 | QA/Test Integrity | Infrastructure/DevOps |
| `docs/` | 7 | Other SME | Business/Domain |
| `README.md` | 1 | Other SME | — |

**Per-primary-domain totals:** Infrastructure/DevOps = 6; Backend Architecture = 50; Security = 29; Frontend = 27; QA/Test Integrity = 37; Other SME = 8; Business/Domain = 0 owned (cross-cutting). **Sum = 157.** Read-only out-of-scope context (untouched): the ArkCase Maven reactor (`acm-*`, `arkcase-lib/`, `pom.xml`, `.gitlab-ci*.yml`, `acm-checkstyle-checks.xml`, `jacoco-summary.sh`, `LICENSE.txt`) — verified via `git log` to have **zero** agent commits.

---

## Phase 1 — Infrastructure/DevOps  *(Verdict: APPROVED)*

**Scope reviewed:** `app/` (sys_app, sys_scope), `update-set/` (consolidated deliverable + dependency ordering), `numbers/` (auto-numbering), with secondary review of `choices/` and the ServiceNow default-vs-custom build posture.

### Positive findings

- **Scoped-application namespace is established cleanly and exclusively.** `app/sys_scope/x_casemgmt.xml` and `app/sys_app/x_casemgmt_case_management.xml` declare `scope=x_casemgmt`, `vendor_prefix=x_casemgmt`, `version=1.0.0`, `active=true`, `enforce_license=false`, `private=false`. Every one of the 147 record-definitions resolves into this scope (`sys_scope=x_casemgmt`); there are **zero global-scope writes** (AAP §0.7.2).
- **Update Set dependency ordering is correct and deterministic.** The consolidated `update-set/x_casemgmt_case_management_update_set.xml` is a single canonical unload with a `<sys_remote_update_set>` envelope wrapping 149 `<sys_update_xml>` records. Reviewer parsed the record order and confirmed it matches the AAP §0.5.2 contract: **scope → application → tables (`x_casemgmt_case`, `_case_task`, `_case_party`) → dictionary fields → choices → numbers → roles → ACLs → script includes → business rules → UI policy/actions → flows/subflows → portal → REST → reports → dashboards → seed data (last)**. This ordering is the single most important determinant of a zero-error PDI preview.
- **Auto-numbering matches the AAP §0.7.4 spec exactly.** `numbers/sys_number_x_casemgmt_case.xml` carries `prefix=CASE`, `number_of_digits=7` → `CASE0000001`; sibling records use `TASK`/`PARTY` prefixes with 7-digit padding. All three are scoped (`sys_scope=x_casemgmt`).
- **Sound ServiceNow low-code default-vs-custom posture.** The build creates custom scoped tables/fields/choices **only** where ArkCase domain semantics require them, and **reuses platform defaults** (`sys_user`, `sys_user_group`, `core_company`) as reference targets rather than re-creating them — exactly the App Engine Studio idiom expected for this migration project.
- **INFRA-1 (prior cycle) remediation independently verified.** The rogue `_case_mgmt_` infix filename is gone from all live references; 17 references use the canonical `x_casemgmt_case_management_update_set.xml`. The sole remaining textual occurrence (`update-set/...update_set.xml:34`) is an explanatory comment that *documents* the correction ("An earlier draft… has been corrected to align with the AAP-canonical path") — not a stale reference.

### Issues

- **INFRA-INFO-1 (Info).** `update-set/x_casemgmt_case_management_update_set.xml:34` retains a historical note mentioning the previously-incorrect filename `x_case_mgmt_…`. This is transparent provenance documentation and harmless, but a future maintainer skimming for the string could be briefly misled. Non-blocking; no action required.
- CI/CD pipeline correctness: **not applicable** — the scoped app ships no CI pipeline; the repo-root `.gitlab-ci*.yml` belong to the read-only ArkCase reactor and were not touched (0 agent commits).
- Flyway migration scripts: **not applicable** — no Flyway; ServiceNow auto-provisions schema from `sys_dictionary` records at Update Set apply time.
- Maven dependency management / BOM / snapshot pinning: **not applicable** — no Maven build for the POC (AAP §0.6.1: zero dependency manifests by design).
- Property externalization (hardcoded IPs/ports/credentials): **adapted — PASS.** No IPs, ports, or credentials are embedded in any artifact; the only instance-specific value (PDI URL) is correctly a *deployment-time* placeholder documented in `docs/deployment.md`, never hardcoded.
- Configuration-drift / multi-profile audit: **not applicable** — there are no `application-{profile}.properties`; ServiceNow configuration *is* the scoped record set, which has a single canonical representation.
- SQL migration hazard analysis (NOT NULL adds, index drops, column renames): **not applicable** — there is no hand-authored DDL; mandatory-field semantics are declared on dictionary records and applied by the platform's managed column-add path.
- JVM tuning (`.mvn/jvm.config`): **not applicable** — no JVM build.

**Verdict: APPROVED** — 0 Critical findings; 1 Info note (INFRA-INFO-1). All Java/Maven/Flyway/JVM checks correctly N/A for a ServiceNow scoped app; the applicable analogs (scope exclusivity, Update Set dependency ordering, auto-numbering, default-vs-custom posture) all pass.

---

## Phase 2 — Security  *(Verdict: APPROVED)*

**Scope reviewed:** `acl/` (26 ACLs), `roles/` (3 roles), `portal/rest/` (2 anonymous scripted-REST definitions + 2 operations), `script_includes/x_casemgmt_CasePortalService.xml`, plus a cross-cutting secrets/injection sweep over all `*.xml`/`*.js`.

### Positive findings

- **The role × CRUD authorization matrix (AAP §0.5.6) is implemented exactly and completely.** 26 ACLs decompose to case (10), case_task (8), case_party (8). `case_manager` gets create/read/write/delete; `case_agent` gets create + "Assigned only" read/write and **no delete** (correctly expressed by the *absence* of a `*_delete_agent` ACL); `case_viewer` gets read only (no create/write/delete). No global ACLs — every record is `sys_scope=x_casemgmt`.
- **The "Assigned only" predicate is correctly and safely enforced.** `acl/x_casemgmt_case_write_agent_assigned.xml` (and the read sibling) set `advanced=true` so the scripted condition actually executes — the record even documents *why* (`advanced=false` would grant write to any `case_agent` regardless of assignment, violating §0.5.6 / §0.7.3 Gate 3). The operative script is `current.assigned_agent == gs.getUserID() || gs.getUser().isMemberOf(current.assigned_group)` — no hardcoded `sys_id`, `admin_overrides=true` for legitimate platform-admin break-glass only.
- **Layered field-level defense on sensitive columns.** `acl/x_casemgmt_case_assigned_agent_field_acl.xml` (`<name>x_casemgmt_case.assigned_agent</name>`, dotted = field-level, `operation=write`, `roles=manager,agent`) restricts write to `case_manager` always and `case_agent` only when `current.assigned_agent == gs.getUserID()`. Composes with the table-level ACL for defense-in-depth (matches AAP §0.5.6's "table AND field level" mandate).
- **Anonymous portal endpoints are safe by construction (no internal-data exposure).** The lookup endpoint (`requires_authentication=false`) emits **only** `{status, subject, opened_date}` — enforced redundantly at *two* layers: the REST operation (`sys_ws_operation_..._case_status_lookup_get.xml` builds the body with exactly those 3 keys) **and** `CasePortalService.lookupCase()` (returns exactly those 3 fields). The submit endpoint reads only a 5-field input whitelist `['subject','type','description','requester_name','requester_email']`, uses prototype-safe `hasOwnProperty`, `String()`-coerces every value, and **forces `status='Draft'` server-side after the whitelist loop** (a client cannot inject `status=Closed` or any non-whitelisted field). Submit returns only `{number}`.
- **No injection, no secrets, no global writes.** GlideRecord lookups use bound `addQuery('number', trimmed)` (the parameterized analog — no string-concatenated encoded queries anywhere). Reviewer sweep found **zero** hardcoded passwords/tokens/API keys and **zero** global-scope ACL/business-rule/script writes.

### Issues

- **SEC-INFO-1 (Info).** The anonymous REST endpoints necessarily execute at platform-default elevated privilege (this is how unauthenticated Service Portal data access works). The risk is fully mitigated by the strict, double-enforced input/output whitelists and the server-side `status='Draft'` lock described above; this matches the documented design (AAP §0.4.3). Recorded for transparency; non-blocking.
- SQL injection (string-concatenated JPQL/native queries): **not applicable** — no JPA/JDBC; `GlideRecord.addQuery(field, value)` binds values as parameters.
- Spring Security configuration (CSRF/CORS/session): **not applicable** — no Spring. Session/CSRF are managed by the Now Platform; anonymous access is an explicit, intentional platform capability gated by `requires_authentication=false` plus the field whitelists.
- Dependency CVEs: **not applicable** — the scoped app declares no third-party dependencies (AAP §0.6.1); all APIs are bundled Glide platform APIs.
- Actuator endpoints: **not applicable** — no Spring Boot Actuator.
- `@Valid`/`@Validated` at controller boundaries: **not applicable** (no Java controllers); the functional analog — input whitelisting + type coercion at the scripted-REST boundary — is present and correct.

**Verdict: APPROVED** — 0 Critical findings; 1 Info note (SEC-INFO-1). The substantive ServiceNow security surface (ACL matrix fidelity, "Assigned only" enforcement with `advanced=true`, field-level ACLs, anonymous-endpoint whitelisting, no-secrets, no-injection, scope exclusivity) is sound.

---

## Phase 3 — Backend Architecture  *(Verdict: APPROVED)*

**Scope reviewed:** `tables/` (3), `dictionary/` (25), `choices/` (7), `script_includes/` (2), `business_rules/` (6), `flows/` + `flows/sub_flows/` (7). The architecture analog here is: declarative schema (tables/dictionary/choices) = data layer; Script Includes = reusable service layer; Business Rules = entity-level guards; Flow Designer flows = orchestration layer.

### Positive findings

- **Data-model fidelity to AAP §0.5.7 is exact and verbatim.** Reviewer-parsed every dictionary record: the 12 `x_casemgmt_case` fields, 6 `x_casemgmt_case_task` fields, and 5 `x_casemgmt_case_party` fields match the prompt's field names, types, max-lengths, and mandatory flags **character-for-character** — e.g., `subject` String(255) mandatory, `description` String(4000) mandatory, `requester_name` String(100) mandatory, `requester_email` String(100) optional, `opened_date`/`closed_date` `glide_date_time` read-only, `due_date` `glide_date` mandatory. The two extra fields (`pending_reason`, `duration_to_close`) are explicitly AAP-sanctioned supporting fields (§0.4.1 Pending-status reason; §0.4.4 "Average Time to Close" widget source).
- **Reference + type fidelity is correct (the ServiceNow analog of the type-mapping check).** Reference fields target the right tables: `case_task.case` and `case_party.case` → `x_casemgmt_case`; `assigned_agent`/`assigned_to`/`party.person` → `sys_user`; `assigned_group` → `sys_user_group`; `party.organization` → `core_company`. Temporal fields use `glide_date_time`/`glide_date` (not a string) and the close-duration uses `glide_duration` — the platform-correct types.
- **All 7 choice lists match the AAP verbatim.** `case.type` {General Inquiry, Complaint}; `case.status` {Draft, Open, In Progress, Pending, Resolved, Closed}; `case.priority` {Low, Medium, High, Critical}; `pending_reason` {Awaiting Info, Awaiting Third Party, Other}; `case_task.type` {Investigation, Review, Follow-up, Other}; `case_task.status` {Open, In Progress, Closed}; `case_party.party_type` {Person, Organization}.
- **Clean, single-source state-machine layering.** `script_includes/x_casemgmt_CaseTransitionValidator.xml` is the one place transition guards live — `canTransitionToOpen/InProgress/Resolved/Closed`, `validateNoBacktransition`, `getOpenTaskCountForCase`, `isAgentInGroup` — and it carries the verbatim `"All tasks must be closed before resolving this case."` with a `status != Closed` open-task query. Both flows invoke it (11 call sites each), and the 6 `before` Business Rules (all `active`, on `x_casemgmt_case`, ordered 100→500: terminal-closed/opened-date guards first, agent-membership next, pending-clear and closed-date mutations last) provide entity-level enforcement independent of the UI path. This is the correct ServiceNow equivalent of ArkCase's `ChangeCaseFileStateService`.
- **Flows are correctly structured and deployable-active.** Two type-filtered `sys_hub_flow` records (one per case type) + 5 subflows; **all 7 are `active=true` and `status=published`** (satisfies AAP §0.7.1 "both flows Active, not Draft"); `run_as=user_who_triggers` is the correct choice so the "caller has `case_manager` role" check at the Resolved→Closed transition evaluates against the real actor.

### Issues

- **BACK-INFO-1 (Info).** `dictionary/x_casemgmt_case_duration_to_close.xml` is not one of the 12 fields in the AAP §0.5.7 verbatim table; it is a supporting computed field for the Manager-View "Average Time to Close" widget (sanctioned by AAP §0.4.4 and the Project Guide). Same status as the prior cycle's BUS-OBS-1 — recorded for transparency, non-blocking.
- JPA correctness (`@Entity`/`@Id`/`@EmbeddedId`/`FetchType.EAGER`/`@Transactional` placement): **not applicable** — no JPA. ServiceNow auto-provides the `sys_id` primary key and `sys_*` audit columns on every table.
- Spring Batch jobs: **not applicable** — no batch processing in scope.
- Ingres→PostgreSQL type fidelity (TIMESTAMP/BigDecimal/CHAR→boolean): **not applicable** — no relational schema migration; the analog (use `glide_date_time` for timestamps rather than a string, no boolean-as-char) is satisfied.
- Module boundaries / cross-module class imports: **not applicable** in the Java sense — a single scoped application. The cross-script-reference analog is correct: flows and rules call `new x_casemgmt.CaseTransitionValidator()` via the scoped namespace, not by literal.
- Pagination (`Pageable`, no unbounded `findAll()` > 1000): **not applicable** — no service list endpoints; data lists are platform-managed list views/reports with built-in pagination.
- Gap-register fidelity / HTTP 501 endpoints: **not applicable** — no `gap-register.md`; there are no 501 stubs.
- Dead-endpoint discovery: **adapted — PASS.** Both scripted-REST endpoints have a complete chain (REST operation → `CasePortalService` method → `GlideRecord` → `x_casemgmt_case`); no orphaned endpoints.
- Exception-handling completeness: **adapted — PASS.** Scripts guard with existence checks + `gs.error`/`gs.warn` logging and graceful error returns; flows surface blocking conditions via Throw Error.
- Concurrency bug hunting (non-final fields, static mutable collections, `@Async`, `@Cacheable`): **not applicable** — Script Includes are instantiated per request; no shared mutable state.
- Observability gap analysis: **adapted — PASS** — failure paths emit `gs.warn`/`gs.error`.
- Kafka lineage: **not applicable** — no messaging.

**Verdict: APPROVED** — 0 Critical findings; 1 Info note (BACK-INFO-1). Data-model fidelity (§0.5.7), choice fidelity, reference/type correctness, and the layered state-machine implementation (Script Include + Business Rules + Flows/subflows, all published-active) are all sound.

---

## Phase 4 — Business / Domain  *(Verdict: APPROVED)*

**Scope reviewed:** the AAP itself (`blitzy/documentation/Technical Specifications.md` §0.1–§0.8) cross-checked section-by-section against the implementation, with primary focus on the seed-data semantics and the verbatim contracts. This is the **AAP-mismatch domain**: every AAP decision/requirement/constraint was inspected against the corresponding artifact. **Zero mismatches were found** (no BLOCKED findings).

### Positive findings

- **State-machine transition matrix (AAP §0.5.5) is enforced in full.** All eight rows map to artifacts: Draft→Open requires `assigned_group` (`flows/sub_flows/validate_open_transition.xml`, dominant guard); Open→In Progress requires `assigned_agent` who is a member of `assigned_group` (`validate_inprogress_transition.xml` + `business_rules/...validate_assigned_agent_membership.xml`); In Progress↔Pending sets/clears `pending_reason` (`validate_pending_transition.xml` + `...clear_pending_reason_on_inprogress.xml`); In Progress→Resolved blocks on open child tasks via `getOpenTaskCountForCase` and throws the verbatim `"All tasks must be closed before resolving this case."` (`validate_resolved_transition.xml`); Resolved→Closed requires the `case_manager` role (`hasRole`) and auto-sets `closed_date` (`validate_closed_transition.xml` + `...set_closed_date.xml`); Any→Draft is blocked with verbatim `"Cases cannot be returned to Draft."` (`...block_draft_backtransition.xml`); Closed→* is blocked with verbatim `"Closed cases are terminal and cannot be modified."` (`...block_terminal_closed.xml`).
- **Demo-data thresholds (AAP §0.7.4) are met exactly.** 10 demo cases span **all six** statuses (Draft 1, Open 2, In Progress 2, Pending 1, Resolved 2, Closed 2) and **both** case types (General Inquiry 6, Complaint 4). Three demo users exist, one per role (`x_casemgmt_demo_manager`/`_agent`/`_viewer`), plus a demo group and three role-to-user assignments.
- **Verbatim contract fidelity (AAP §0.7.1 / §0.7.4).** All four user-facing strings are present character-for-character in their enforcing artifacts (not just in docs): the resolve-block string in the validator + resolve subflow; the no-Draft string in `block_draft_backtransition`; the terminal-closed string in `block_terminal_closed`; and `"No case found with that number."` in both the lookup REST operation and `CasePortalService`.
- **Out-of-scope constraints (AAP §0.3.2) are honored.** Email-disabled: **zero** notification/SMTP records exist (`grep` for `sysevent_email_action`/`sys_email`/`sys_notification` `record_update` tables returns nothing); the only email-keyword hits are comments documenting the disablement (e.g., "No `gs.eventQueue()` calls — email notifications are disabled per AAP"). No ECM/FOIA/correspondence/time-tracking/integration artifacts. No data migration — all seed data is synthetic.
- **ACL matrix (AAP §0.5.6) and data-model (AAP §0.5.7) re-confirmed** consistent with the deeper Security/Backend inspections (no business-level contradiction with the technical implementation).

### Issues

- **BUS-OBS-1 (Info).** The 8 demo parties (5 Person + 3 Organization) are distributed across 5 of the 10 demo cases. AAP §0.3.1 requires parties "to exercise the polymorphic UI policy" — satisfied, because **both** the Person and Organization conditional branches are represented. AAP §0.7.4's binding minimum-threshold list does **not** enumerate parties, and §0.5.1 says parties attach to "selected demo cases." This is therefore a fully compliant design choice, recorded for transparency only; **non-blocking**.
- AAP-mismatch check (missing endpoints / omitted batch jobs / type-mapping / NNR / config-externalization violations): **no mismatches found.** Each Java/Spring-flavored mismatch category is either satisfied by the ServiceNow analog or not applicable (no batch jobs, no relational type mapping, no externalized properties).
- API test collections (Postman/Newman): **not applicable** — none specified for this stack; the functional equivalent (the two scripted-REST endpoints) is covered structurally and by the documented manual portal-verification procedure.

**Verdict: APPROVED** — 0 Critical findings; 1 Info note (BUS-OBS-1). The implementation matches every AAP decision/requirement/constraint inspected (§0.5.5 transitions, §0.5.6 ACLs, §0.5.7 data model, §0.7.4 thresholds, §0.7.1 verbatim strings, §0.3.2 exclusions) with no mismatch.

---

## Phase 5 — Frontend  *(Verdict: APPROVED)*

**Files in scope (27):** `portal/` (sp_portal ×1, pages ×2, widgets ×3, rest ×4), `ui_policy/` ×1, `ui_action/` ×6, `dashboards/` ×2, `reports/` ×8. ServiceNow-native list/form views for the internal experience are platform-generated and not separate artifacts; the inspectable frontend surface is the Experience Portal, the conditional UI policy, the transition UI actions, and the dashboards/reports.

**Stack-adaptation note:** Frontend here is AngularJS 1.5.x Service Portal widgets (`$http`, `controller-as`, `ng-*`) + ServiceNow report/dashboard records — not React/Vue/Angular2+. Checks for component state libraries, bundlers, CSS-in-JS, etc. are *not applicable — this is the Service Portal widget model*.

### Positive findings

- **Experience Portal correctly unauthenticated and wired by name.** Both pages carry `<public>true</public>` (`sp_page_x_casemgmt_case_submit.xml:412`, `sp_page_x_casemgmt_case_status.xml:478`) and the portal record is public with `url_suffix=x_casemgmt_case_portal` (`sp_portal_x_casemgmt_case_portal.xml:293,313`). Each page embeds its widget by **id, not sys_id** — submit page → `"widget_id":"x_casemgmt_case_submission_widget"` (`sp_page_x_casemgmt_case_submit.xml:397-398`); status page → `"widget_id":"x_casemgmt_case_lookup_widget"` (`sp_page_x_casemgmt_case_status.xml:463-464`).
- **Submission widget enforces the 5-field whitelist with defense-in-depth and renders the verbatim acknowledgement.** The form exposes exactly the five AAP §0.4.4 inputs — subject/type/description/requester_name `required`, requester_email optional (`sp_widget_x_casemgmt_case_submission_widget.xml:709-799`); the POST body is built by explicit field enumeration, never `c.formData` wholesale (`:577-583`), and the error path uses a generic hardcoded message (no server text echoed). On success it embeds `sp_widget_x_casemgmt_case_confirmation_widget` via `$sp.getWidget()`, which displays the verbatim **"Your case has been submitted"** + the returned case number (`sp_widget_x_casemgmt_case_confirmation_widget.xml:278`).
- **Lookup widget enforces the strict 3-field response and the verbatim not-found text at the UI layer.** The controller extracts **only** `{status, subject, opened_date}` from `response.data` (`sp_widget_x_casemgmt_case_lookup_widget.xml:410-414`) and the template renders exactly those three fields in a `<dl>` (`:537-545`). The literal **"No case found with that number."** is hardcoded in the `ng-if="c.notFound"` panel (`:562-564`) and is *never* sourced from the server error body; all HTTP error classes (404/500/400/network) collapse to the same not-found state (information-leakage hardening). This is the third, client-side layer of the same whitelist enforced in the REST op and Script Include (Security phase) — and it matches the **FE-1 remediation** now documented in `docs/portal-pages.md:169-199` (three fields only, with the excluded-fields list).
- **Polymorphic party UI policy is correct.** `ui_policy/x_casemgmt_case_party_conditional_fields.xml` (table `x_casemgmt_case_party`, `active=true`, `on_load=true`, `run_scripts=true`) runs a single `script_true` whose branches map exactly to AAP §0.5.7: `party_type==='Person'` → show+mandatory `person`, hide `organization`; `==='Organization'` → show+mandatory `organization`, hide `person`; empty → hide both (`:script_true` body). The `'Person'`/`'Organization'` literals match the choice labels byte-for-byte.
- **Six transition UI actions are status- and role-gated and surface blocking errors.** Orders 100–600 map to Open / Start Progress / Set Pending / Resume / Resolve / Close. Each has a CDATA `<condition>` gating on `current.status` AND role — manager-only for Open (`x_casemgmt_case_open.xml:478`) and Close (`x_casemgmt_case_close.xml:540`); manager-or-*assigned*-agent (`assigned_agent==gs.getUserID() || isMemberOf(assigned_group)`) for the middle four. `Resolve` delegates the all-tasks-closed gate to `x_casemgmt.CaseTransitionValidator.canTransitionToResolved()` and surfaces the verbatim **"All tasks must be closed before resolving this case."** via `gs.addErrorMessage(result.error)` (`x_casemgmt_case_resolve.xml` script body).
- **Dashboards/reports bind by name and match the AAP §0.4.4 inventory exactly.** Agent Workspace = 3 widgets (my_open_cases list, my_overdue_tasks list, case_count_by_status donut/pie), visible to `case_agent`+`case_manager` (2 `pa_dashboard_role`); Manager View = 5 widgets (cases-by-status bar, cases-by-type donut/pie, cases-by-priority bar, avg_time_to_close single_score on `duration_to_close`, cases_opened_30d single_score), `case_manager`-only. All 8 reports bound through `pa_dashboard_widgets` via `<report display_value="...">x_casemgmt_*</report>` (no sys_id). The two list filters match AAP verbatim: `assigned_agent=javascript:gs.getUserID()^statusNOT INResolved,Closed` and `assigned_to=javascript:gs.getUserID()^due_date<javascript:gs.daysAgoStart(0)^status!=Closed`.

**Static checks:** 27/27 frontend XML well-formed (`xmllint`); 13/13 embedded JS blocks (3 widget client scripts, 3 widget server scripts, 1 UI-policy script, 6 UI-action scripts) pass `node --check`; scope exclusivity 27/27 reference `x_casemgmt`; **zero** hardcoded foreign sys_ids — all 46 32-hex occurrences are each record's own `<sys_id>` element or explanatory comments documenting the deterministic `MD5(name)` sys_id convention (verified at `sp_widget_x_casemgmt_case_submission_widget.xml:315-320` and `pa_dashboards_x_casemgmt_manager_view.xml:220-232`).

### Issues

- **FE-INFO-1 (Info).** The two donut widgets (`reports/x_casemgmt_case_count_by_status.xml`, `reports/x_casemgmt_all_cases_by_type.xml`) use ServiceNow report `<type>pie</type>` rather than a distinct `donut` type token. This is semantically equivalent for the AAP intent — identical `group_by` (status / type) and `COUNT` aggregate — and ServiceNow renders a donut as a display variant of the pie report type. **Non-blocking**; recorded for transparency.
- **FE-1 (prior-cycle BLOCKED) — remediation VERIFIED, now resolved.** The earlier documentation drift in `docs/portal-pages.md` (claiming a 4-field lookup response) is corrected: lines 169-199 document exactly the three whitelisted fields `{status, subject, opened_date}` with an explicit excluded-fields list, matching the code in the REST operation, the `CasePortalService` Script Include, and the lookup widget. No residual mismatch.

**Verdict: APPROVED** — 0 Critical findings; 1 Info note (FE-INFO-1). FE-1 remediation confirmed at `docs/portal-pages.md:169-199`. The Experience Portal, conditional UI policy, transition UI actions, and dashboards/reports all match the AAP (§0.4.4 UI surfaces, §0.5.5 transitions, §0.5.7 polymorphism, §0.7.4 verbatim strings) with no hardcoded sys_ids and clean scope exclusivity.

---

## Phase 6 — QA / Test Integrity  *(Verdict: APPROVED)*

**Files in scope (37):** `seed-data/` (cases ×10, tasks ×10, parties ×8, users ×3, role_assignments ×3, groups ×1), `scripts/seed_demo_data.js`, `scripts/round_trip_verify.md`, plus `docs/validation-gates.md`.

**Access-Level context (governs this domain):** Access Level 1 (source only — no PDI provisioned). The seven AAP §0.7.3 runtime validation gates and the Update-Set import/preview/commit are **live-PDI** activities that cannot be executed here. Per the Refine PR Access-Level rule, these are **not** flagged as defects — they are a direct consequence of the access level. The reviewable surface at L1 is: seed-data *fidelity*, *referential consistency*, *gate exercisability by construction*, *idempotency*, *synthetic-PII compliance*, and the *completeness of the documented human-executable verification procedures*. All of these were inspected.

### Positive findings

- **Demo-data thresholds (AAP §0.7.4 / §0.4.1) met exactly.** 10 cases spanning **all six** statuses (Draft 1, Open 2, In Progress 2, Pending 1, Resolved 2, Closed 2) and **both** types (General Inquiry 6, Complaint 4); 3 users — one per role with correct grants (`x_casemgmt_demo_manager`→`x_casemgmt_case_manager`, `…_agent`→`…_case_agent`, `…_viewer`→`…_case_viewer`); 1 demo group (`x_casemgmt_demo_team`) with the agent as a member.
- **The task-closure gate is exercisable in BOTH directions by construction.** Mapping the auto-numbered cases (demo_01→CASE0000001 … demo_10→CASE0000010) against the task seed: `CASE0000003` (In Progress) carries an **Open** task (`task_01`) + a Closed task — so an attempted Resolve is correctly **blocked**; `CASE0000005` and `CASE0000009` (Resolved) carry **only Closed** tasks — consistent with the **allow** path that let them reach Resolved. `CASE0000008` (In Progress) carries In Progress + Open tasks. The polymorphic UI policy is likewise exercisable: Person **and** Organization parties co-exist on cases 3, 5, and 8 (5 Person + 3 Organization total). The "Assigned only" ACL is exercisable because the demo agent is a member of `x_casemgmt_demo_team`, which is the `assigned_group` on the active cases.
- **`seed_demo_data.js` (1,452 LOC) is fully idempotent and 100% sys_id-free.** Every entity uses check-before-insert on a stable idempotent key (`ensureUser` queries `user_name`; `ensureGroup`/`ensureRole`/`ensureCompany` query `name`; cases keyed by `subject`; tasks/parties keyed by case+subject). All cross-references resolve via `GlideRecord` lookups (`user_name`/`name`/`number`/`subject`) — notably the `lookupCaseNumberBySubject()` → `lookupCaseSysId()` indirection that is *"independent of PDI-specific number allocations and re-runnable across instances"* (seed_demo_data.js:287-303). `node --check` passes.
- **Live-PDI verification is fully documented for the human deployer.** `docs/validation-gates.md` reproduces all seven AAP §0.7.3 gates verbatim and adds, per gate, a Detailed Verification Procedure, Cross-Reference Document, and Failure Mode that honors the Minimal-Change Clause (stop-and-report on out-of-scope gaps). `scripts/round_trip_verify.md` is a complete 4-phase procedure (Upload → Preview → Commit → Re-Verify Gates 1–6) with per-phase pass criteria and remediation.
- **Synthetic-data / no-PII constraint (AAP §0.7.2) honored.** All 13 distinct seed email values end in `@example.invalid` (RFC 6761 reserved, non-routable); names are obviously synthetic ("Synthetic Requester Three"). 35/35 seed XML well-formed, scope-exclusive (`x_casemgmt`), with **zero** hardcoded foreign sys_ids — all reference fields (`case`/`assigned_group`/`assigned_agent`/`assigned_to`/`person`/`organization`/`user`/`role`) carry name/number text nodes.

### Issues

- **QA-INFO-1 (Info).** The XML seed records link child rows to parents by **hardcoded case-number literal** (e.g., `task_01` → `<case …>CASE0000003</case>`). This presumes the fresh-PDI auto-number counter assigns `CASE0000001…CASE0000010` to `demo_01…demo_10` in Update-Set insert order. This is AAP §0.5.2-sanctioned (case references resolve by `number`) and the documented deployment target is explicitly a **fresh PDI** (`round_trip_verify.md`), so the presumption holds for the intended path. The companion `seed_demo_data.js` avoids the presumption entirely via subject→number indirection. Recorded so a verifier re-seeding on a **non-fresh** instance uses the JS seeder rather than re-importing the number-pinned XML rows. **Non-blocking.**
- **Runtime gate execution unavailable at Access Level 1** — *not a defect.* Gates 1–7 require a live PDI; their static analogs (XML well-formedness, JS syntax, referential consistency, threshold fidelity, gate-exercisability-by-construction) all pass, and the human procedures are complete.

**Verdict: APPROVED** — 0 Critical findings; 1 Info note (QA-INFO-1). Seed-data fidelity, referential consistency, idempotency, gate-exercisability, and synthetic-PII compliance all pass; the live-PDI gates are fully documented for the human deployer and their unavailability here is a sanctioned Access-Level-1 limitation, not a defect.

---

## Phase 7 — Other SME (Documentation & Cross-Cutting Constraints)  *(Verdict: APPROVED)*

**Files in scope (8) + cross-cutting sweeps over all 147 XML / 37 JS blocks:** `README.md` and `docs/` (data-model, state-machine, acl-matrix, portal-pages, dashboards, validation-gates, deployment). Cross-cutting checks: global no-hardcoded-sys_id, scope-namespace exclusivity, email-disabled compliance, and repository confinement.

### Positive findings

- **Documentation set is complete and faithful to the AAP.** All seven AAP §0.3.1-mandated docs are present alongside a thorough `README.md` (objective, out-of-scope, read-only repo relationship, directory layout, Update-Set path, portal reference). `docs/data-model.md` reproduces the three field tables (12 + 6 + 5, with the supporting `pending_reason` choice and the `duration_to_close` function field explicitly annotated as the §0.4.4-sanctioned additions); `docs/state-machine.md` carries all three verbatim blocking-error strings; `docs/acl-matrix.md` reproduces the §0.5.6 role×CRUD matrix and the "Assigned only" definition character-for-character.
- **No-hardcoded-sys_id (AAP §0.7.2) is globally honored.** Across the 146 individual record files there are **zero** 32-hex literals in reference text-nodes (excluding each record's own `<sys_id>`/`<sys_update_name>`). In the consolidated Update Set the only hex text-nodes are `sys_id` (184, own PK — deterministically `MD5(name)`), `remote_update_set` (149, the required FK to the parent `sys_remote_update_set`), and `update_guid` (149, each update record's own GUID) — all **required Update Set machinery**, not cross-references. Every functional reference resolves by `name`/`user_name`/`number`/`subject`.
- **Scope-namespace exclusivity (AAP §0.7.2) is absolute.** All 399 `<sys_scope>`/`<sys_package>` values are `x_casemgmt`. The only writes to base/global tables are the AAP-sanctioned synthetic seed (3 `sys_user`, 1 `sys_user_group` + membership, 3 `sys_user_has_role`) plus the three in-scope scoped roles (`sys_user_role`) explicitly permitted by §0.3.2. No global ACLs, business rules, script includes, UI policies, or OOB-table (incident/task/etc.) modifications.
- **Email-disabled (AAP §0.3.2 / §0.7.2) is verifiably honored.** Zero notification/SMTP record-definitions (`sysevent_email_action`/`sys_email`/`sys_notification`/template tables = 0). After stripping JS comments from all 37 script blocks (standalone + embedded CDATA), there are **0** executable `gs.eventQueue()`/`gs.email()`/`gs.notify()` calls — all 112 keyword occurrences are compliance-documenting comments (e.g., "Contains zero `gs.eventQueue()` calls per the email-disabled constraint").
- **Repository confinement (AAP §0.7.2) is intact.** Work is on branch `blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2` with a clean working tree. Every `agent@blitzy.com` change across branch history lands under `servicenow-case-management-poc/` (367), `CODE_REVIEW.md` (27, the review file itself), and `blitzy/` docs (3) — **zero** touches to the read-only ArkCase Maven reactor (`acm-*`, `pom.xml`, `arkcase-lib`, `.gitlab-ci*.yml`, `LICENSE.txt`, etc.).

### Issues

- **None.** No Critical, Warning, or Info findings in this domain. The documentation surface is complete and accurate, and all four cross-cutting constraints (no-hardcoded-sys_id, scope exclusivity, email-disabled, repo confinement) are cleanly satisfied with objective evidence.

**Verdict: APPROVED** — 0 findings. Documentation matches the AAP-mandated set verbatim where required; the no-hardcoded-sys_id, scope-exclusivity, email-disabled, and repository-confinement constraints are all satisfied with no exceptions.

---
