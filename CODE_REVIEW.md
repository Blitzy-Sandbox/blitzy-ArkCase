# CODE_REVIEW.md

**Work Item:** ServiceNow Case Management POC — `servicenow-case-management-poc/`
**Pull Request branch:** `blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2`
**Agent Action Plan (AAP):** Section 0.1 – Section 0.8 (the AAP authored by the Blitzy platform for this work item)
**Review process:** Multi-phase, multi-cycle (per the user-provided Refine PR instructions). Each cycle runs Infrastructure/DevOps → Security → Backend Architecture → Business/Domain → Frontend → QA/Test Integrity → Other SME, followed by a final reviewer verdict.
**Final verdict (current):** *Pending — Cycle 1 in progress.*

---

## 1. Pre-flight Gate — Cycle 1

Per Refine PR instructions, the pre-flight gate must pass before the first phase of a cycle. It requires:

1. All AAP deliverables exist.
2. Project builds clean.
3. All tests pass.
4. All static-analysis gates pass.
5. No production-path method returns a placeholder stub.

This deliverable is a **no-runtime XML deliverable** consumed by a ServiceNow PDI via Update Set import. There is no traditional build/test runner. The pre-flight gate is therefore mapped to:

| Pre-flight criterion | Mapping for this work item | Result |
| --- | --- | --- |
| All AAP deliverables exist | Every CREATE row in AAP §0.5.1 has a corresponding file under `servicenow-case-management-poc/` | ✅ 147 XML + 1 JS + 9 MD = 157 files; manifest fully satisfied |
| Project builds clean | XML well-formedness via Python `xml.etree.ElementTree.parse()` for every `*.xml`; `node --check` for every `*.js` | ✅ 147/147 XML parse; 1/1 JS clean |
| All tests pass | Static rule checks: scope-namespace exclusivity (`x_casemgmt_*`); no hardcoded `sys_id` literals inside `<script>`, `<condition>`, `<filter>`, `<when>`, `<computed_value>`, `<ajax_script>` and equivalent executable/filter elements; no PII; verbatim error-message presence | ✅ 0 violations |
| All static-analysis gates pass | Same as above plus AAP-required-artifact manifest scan and Update Set structural validity check (`<unload>` root, single `<sys_remote_update_set>`, `<sys_update_xml>` children only) | ✅ 0 violations; Update Set valid |
| No production-path method returns a placeholder stub | Scan for `TODO`/`FIXME`/`NotImplementedError`/empty-function-body patterns in Script Includes, Business Rules, Flow scripts, UI Action scripts, Client Scripts, scripted REST scripts, and `scripts/seed_demo_data.js` | ✅ 0 production stubs; all `placeholder` matches are HTML input-hint attributes, `.invalid` requester emails, or AAP-canonical `[scope]` documentation |

**Pre-flight gate verdict (Cycle 1): PASS.** Proceeding to Phase 1.

---

## 2. Domain Assignment Manifest

Every changed file is assigned to **exactly one primary domain** (per Refine PR instructions). Secondary-domain reviewers are listed where their specialist surface is materially touched.

### 2.1 Infrastructure / DevOps (32 files)

| File | Primary domain | Secondary |
| --- | --- | --- |
| `servicenow-case-management-poc/app/sys_app/x_casemgmt_case_management.xml` | Infra/DevOps | — |
| `servicenow-case-management-poc/app/sys_scope/x_casemgmt.xml` | Infra/DevOps | Security |
| `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` | Infra/DevOps | All |
| `servicenow-case-management-poc/numbers/sys_number_x_casemgmt_case.xml` | Infra/DevOps | Backend |
| `servicenow-case-management-poc/numbers/sys_number_x_casemgmt_case_party.xml` | Infra/DevOps | Backend |
| `servicenow-case-management-poc/numbers/sys_number_x_casemgmt_case_task.xml` | Infra/DevOps | Backend |
| `servicenow-case-management-poc/docs/deployment.md` | Infra/DevOps | QA |
| `servicenow-case-management-poc/scripts/round_trip_verify.md` | Infra/DevOps | QA |

### 2.2 Security (37 files)

| File | Primary domain | Secondary |
| --- | --- | --- |
| `servicenow-case-management-poc/roles/sys_user_role_x_casemgmt_case_agent.xml` | Security | — |
| `servicenow-case-management-poc/roles/sys_user_role_x_casemgmt_case_manager.xml` | Security | — |
| `servicenow-case-management-poc/roles/sys_user_role_x_casemgmt_case_viewer.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_assigned_agent_field_acl.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_assigned_group_field_acl.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_create_agent.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_create_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_delete_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_create_agent.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_create_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_delete_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_read_agent_assigned.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_read_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_read_viewer.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_write_agent_assigned.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_party_write_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_read_agent_assigned.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_read_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_read_viewer.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_create_agent.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_create_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_delete_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_read_agent_assigned.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_read_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_read_viewer.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_write_agent_assigned.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_task_write_manager.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_write_agent_assigned.xml` | Security | — |
| `servicenow-case-management-poc/acl/x_casemgmt_case_write_manager.xml` | Security | — |
| `servicenow-case-management-poc/portal/rest/sys_ws_definition_x_casemgmt_case_status_lookup.xml` | Security | Frontend |
| `servicenow-case-management-poc/portal/rest/sys_ws_definition_x_casemgmt_case_submit.xml` | Security | Frontend |
| `servicenow-case-management-poc/portal/rest/sys_ws_operation_x_casemgmt_case_status_lookup_get.xml` | Security | Backend |
| `servicenow-case-management-poc/portal/rest/sys_ws_operation_x_casemgmt_case_submit_post.xml` | Security | Backend |
| `servicenow-case-management-poc/seed-data/users/sys_user_x_casemgmt_demo_agent.xml` | Security | Business |
| `servicenow-case-management-poc/seed-data/users/sys_user_x_casemgmt_demo_manager.xml` | Security | Business |
| `servicenow-case-management-poc/seed-data/users/sys_user_x_casemgmt_demo_viewer.xml` | Security | Business |
| `servicenow-case-management-poc/seed-data/groups/sys_user_group_x_casemgmt_demo_team.xml` | Security | Business |
| `servicenow-case-management-poc/seed-data/role_assignments/sys_user_has_role_x_casemgmt_demo_agent.xml` | Security | Business |
| `servicenow-case-management-poc/seed-data/role_assignments/sys_user_has_role_x_casemgmt_demo_manager.xml` | Security | Business |
| `servicenow-case-management-poc/seed-data/role_assignments/sys_user_has_role_x_casemgmt_demo_viewer.xml` | Security | Business |
| `servicenow-case-management-poc/docs/acl-matrix.md` | Security | — |

### 2.3 Backend Architecture (49 files)

| File | Primary domain | Secondary |
| --- | --- | --- |
| `servicenow-case-management-poc/tables/x_casemgmt_case.xml` | Backend | Business |
| `servicenow-case-management-poc/tables/x_casemgmt_case_party.xml` | Backend | Business |
| `servicenow-case-management-poc/tables/x_casemgmt_case_task.xml` | Backend | Business |
| `servicenow-case-management-poc/dictionary/x_casemgmt_case_*.xml` (13 files) | Backend | Business |
| `servicenow-case-management-poc/dictionary/x_casemgmt_case_task_*.xml` (6 files) | Backend | Business |
| `servicenow-case-management-poc/dictionary/x_casemgmt_case_party_*.xml` (5 files) | Backend | Business |
| `servicenow-case-management-poc/choices/sys_choice_case_type.xml` | Backend | Business |
| `servicenow-case-management-poc/choices/sys_choice_case_status.xml` | Backend | Business |
| `servicenow-case-management-poc/choices/sys_choice_case_priority.xml` | Backend | Business |
| `servicenow-case-management-poc/choices/sys_choice_case_pending_reason.xml` | Backend | Business |
| `servicenow-case-management-poc/choices/sys_choice_case_task_type.xml` | Backend | Business |
| `servicenow-case-management-poc/choices/sys_choice_case_task_status.xml` | Backend | Business |
| `servicenow-case-management-poc/choices/sys_choice_case_party_party_type.xml` | Backend | Business |
| `servicenow-case-management-poc/script_includes/x_casemgmt_CasePortalService.xml` | Backend | Security |
| `servicenow-case-management-poc/script_includes/x_casemgmt_CaseTransitionValidator.xml` | Backend | Business |
| `servicenow-case-management-poc/flows/general_inquiry_state_machine.xml` | Backend | Business |
| `servicenow-case-management-poc/flows/complaint_state_machine.xml` | Backend | Business |
| `servicenow-case-management-poc/flows/sub_flows/validate_open_transition.xml` | Backend | Business |
| `servicenow-case-management-poc/flows/sub_flows/validate_inprogress_transition.xml` | Backend | Business |
| `servicenow-case-management-poc/flows/sub_flows/validate_pending_transition.xml` | Backend | Business |
| `servicenow-case-management-poc/flows/sub_flows/validate_resolved_transition.xml` | Backend | Business |
| `servicenow-case-management-poc/flows/sub_flows/validate_closed_transition.xml` | Backend | Business |
| `servicenow-case-management-poc/business_rules/x_casemgmt_block_draft_backtransition.xml` | Backend | Business |
| `servicenow-case-management-poc/business_rules/x_casemgmt_block_terminal_closed.xml` | Backend | Business |
| `servicenow-case-management-poc/business_rules/x_casemgmt_clear_pending_reason_on_inprogress.xml` | Backend | Business |
| `servicenow-case-management-poc/business_rules/x_casemgmt_set_closed_date.xml` | Backend | Business |
| `servicenow-case-management-poc/business_rules/x_casemgmt_set_opened_date.xml` | Backend | Business |
| `servicenow-case-management-poc/business_rules/x_casemgmt_validate_assigned_agent_membership.xml` | Backend | Security |
| `servicenow-case-management-poc/scripts/seed_demo_data.js` | Backend | QA, Business |

### 2.4 Business / Domain (30 files)

| File | Primary domain | Secondary |
| --- | --- | --- |
| `servicenow-case-management-poc/seed-data/cases/x_casemgmt_case_demo_01.xml` … `_10.xml` (10 files) | Business | QA |
| `servicenow-case-management-poc/seed-data/tasks/x_casemgmt_case_task_demo_01.xml` … `_10.xml` (10 files) | Business | QA |
| `servicenow-case-management-poc/seed-data/parties/x_casemgmt_case_party_demo_01.xml` … `_08.xml` (8 files) | Business | QA |
| `servicenow-case-management-poc/docs/data-model.md` | Business | Backend |
| `servicenow-case-management-poc/docs/state-machine.md` | Business | Backend |

### 2.5 Frontend (13 files)

| File | Primary domain | Secondary |
| --- | --- | --- |
| `servicenow-case-management-poc/portal/sp_portal_x_casemgmt_case_portal.xml` | Frontend | Security |
| `servicenow-case-management-poc/portal/pages/sp_page_x_casemgmt_case_status.xml` | Frontend | — |
| `servicenow-case-management-poc/portal/pages/sp_page_x_casemgmt_case_submit.xml` | Frontend | — |
| `servicenow-case-management-poc/portal/widgets/sp_widget_x_casemgmt_case_confirmation_widget.xml` | Frontend | — |
| `servicenow-case-management-poc/portal/widgets/sp_widget_x_casemgmt_case_lookup_widget.xml` | Frontend | Security |
| `servicenow-case-management-poc/portal/widgets/sp_widget_x_casemgmt_case_submission_widget.xml` | Frontend | Security |
| `servicenow-case-management-poc/ui_policy/x_casemgmt_case_party_conditional_fields.xml` | Frontend | Business |
| `servicenow-case-management-poc/ui_action/x_casemgmt_case_open.xml` | Frontend | Business |
| `servicenow-case-management-poc/ui_action/x_casemgmt_case_start_progress.xml` | Frontend | Business |
| `servicenow-case-management-poc/ui_action/x_casemgmt_case_set_pending.xml` | Frontend | Business |
| `servicenow-case-management-poc/ui_action/x_casemgmt_case_resume.xml` | Frontend | Business |
| `servicenow-case-management-poc/ui_action/x_casemgmt_case_resolve.xml` | Frontend | Business |
| `servicenow-case-management-poc/ui_action/x_casemgmt_case_close.xml` | Frontend | Business |
| `servicenow-case-management-poc/docs/portal-pages.md` | Frontend | — |

### 2.6 QA / Test Integrity (12 files)

| File | Primary domain | Secondary |
| --- | --- | --- |
| `servicenow-case-management-poc/reports/x_casemgmt_my_open_cases.xml` | QA | Business |
| `servicenow-case-management-poc/reports/x_casemgmt_my_overdue_tasks.xml` | QA | Business |
| `servicenow-case-management-poc/reports/x_casemgmt_case_count_by_status.xml` | QA | Business |
| `servicenow-case-management-poc/reports/x_casemgmt_all_cases_by_status.xml` | QA | Business |
| `servicenow-case-management-poc/reports/x_casemgmt_all_cases_by_type.xml` | QA | Business |
| `servicenow-case-management-poc/reports/x_casemgmt_all_cases_by_priority.xml` | QA | Business |
| `servicenow-case-management-poc/reports/x_casemgmt_avg_time_to_close.xml` | QA | Business |
| `servicenow-case-management-poc/reports/x_casemgmt_cases_opened_30d.xml` | QA | Business |
| `servicenow-case-management-poc/dashboards/pa_dashboards_x_casemgmt_agent_workspace.xml` | QA | Frontend |
| `servicenow-case-management-poc/dashboards/pa_dashboards_x_casemgmt_manager_view.xml` | QA | Frontend |
| `servicenow-case-management-poc/docs/dashboards.md` | QA | Frontend |
| `servicenow-case-management-poc/docs/validation-gates.md` | QA | — |

### 2.7 Other SME (2 files)

| File | Primary domain | Secondary |
| --- | --- | --- |
| `servicenow-case-management-poc/README.md` | Other SME | All |
| `CODE_REVIEW.md` (this file) | Other SME | All |

**Total: 157 in-scope files + CODE_REVIEW.md = 158 files reviewed across 7 domains.**

---

## 3. Cycle 1 — Phase Verdicts

*Phases execute in fixed order. Every phase MUST run regardless of earlier-phase verdicts. Each phase resolves to exactly APPROVED or BLOCKED with file:line findings.*

### 3.1 Phase 1 — Infrastructure / DevOps  *(Verdict: BLOCKED)*

**Scope reviewed.** The 8 primary-domain files in §2.1 (sys_app, sys_scope, consolidated Update Set, 3 number-maintenance counters, deployment.md, round_trip_verify.md), plus the cross-cutting Update Set structural integrity and the scope-namespace consistency across all 157 in-scope files.

**Positive findings.**

1. `app/sys_app/x_casemgmt_case_management.xml` — scoped-app record correctly authored: `name="x_casemgmt Case Management"`, `scope="x_casemgmt"`, `vendor_prefix="x_casemgmt"`, `version="1.0.0"`, `active=true`, `enforce_license=false`, `private=false`. Aligns with AAP §0.4.1 + §0.5.1.
2. `app/sys_scope/x_casemgmt.xml` — scope record correctly authored: `name="x_casemgmt"`, `scope="x_casemgmt"`, `source="x_casemgmt"`. Aligns with AAP §0.4.1.
3. `update-set/x_casemgmt_case_management_update_set.xml` — root element is `<unload>` with `unload_date="2026-04-30 12:00:00"`; single `<sys_remote_update_set action="INSERT_OR_UPDATE">` envelope (name=`x_casemgmt_case_management v1.0.0`, application_scope=`x_casemgmt`); 149 `<sys_update_xml>` records distributed across 27 record-types. All structurally valid per ServiceNow Update Set XML schema.
4. Dependency ordering of records in the consolidated Update Set is correct: Application (#1) → Table (#3) → Dictionary (#6) → Choice List (#31) → Number Maintenance (#38) → Role (#41) → ACL (#44) → Script Include (#70) → Flow (#72) → Business Rule (#79) → UI Policy (#85) → UI Action (#86) → Service Portal (#92) → Page (#93) → Widget (#95) → Scripted REST Service definition / `sys_ws_definition` (#98) → Scripted REST API operation / `sys_ws_operation` (#100) → Report (#102) → Dashboard (#110) → User (#112) → Group (#115) → Group Member (#116) → Role Assignment (#117) → Company (#120) → Case Record (#122) → Case Task Record (#132) → Case Party Record (#142). Parent definitions precede child operations and seed data is loaded last.
5. `numbers/sys_number_x_casemgmt_case.xml` — `category=x_casemgmt_case`, `prefix=CASE`, `number=0`, `number_of_digits=7` → produces `CASE0000001`. Matches AAP §0.5.7 verbatim.
6. `numbers/sys_number_x_casemgmt_case_task.xml` — `category=x_casemgmt_case_task`, `prefix=TASK`, `number_of_digits=7` → produces `TASK0000001`.
7. `numbers/sys_number_x_casemgmt_case_party.xml` — `category=x_casemgmt_case_party`, `prefix=PARTY`, `number_of_digits=7` → produces `PARTY0000001`.
8. `docs/deployment.md` (188 lines) — comprehensive 4-step procedure (Export → Verify → Confirm → Deliver) plus Rollback section, fully aligned with the user-prompt deployment block in AAP §0.7.2 and validation gates §0.7.3.
9. `scripts/round_trip_verify.md` (238 lines) — manual procedure for fresh-PDI re-import verification: 4 phases (Upload → Preview → Commit → Re-Verify Gates 1–7) with pass criteria per phase.
10. Scope-namespace exclusivity scan across all 157 in-scope files: every functional artifact name and every executable cross-reference uses `x_casemgmt_*`. Zero global-scope writes detected. Compliance with AAP §0.7.2 scoped-namespace-only constraint.

**BLOCKED finding (1).**

| ID | File | Line | Severity | Description |
| --- | --- | --- | --- | --- |
| INFRA-1 | `servicenow-case-management-poc/ui_action/x_casemgmt_case_set_pending.xml` | 257 | MINOR | Stale filename reference inside `<description>` comment block: `- ../update-set/x_case_mgmt_case_management_update_set.xml` uses the variant identifier `x_case_mgmt_` (extra underscore between `case` and `mgmt`). The actual on-disk filename is `x_casemgmt_case_management_update_set.xml`. This is a scope-namespace exclusivity violation in documentation and an incorrect path reference. **Remediation:** replace `x_case_mgmt_case_management_update_set.xml` with `x_casemgmt_case_management_update_set.xml` on line 257. |

**Note on the second occurrence.** A grep of the in-scope tree finds `x_case_mgmt` in exactly two places: the one above (INFRA-1) and `update-set/x_casemgmt_case_management_update_set.xml:34`. The second occurrence is an **intentional historical-note** inside the Update Set's top-of-file `<!-- ... -->` comment explaining that the file was previously named `x_case_mgmt_...` and has been corrected to `x_casemgmt_...`. The note is itself self-correcting and does not point to a nonexistent file, so it is **not flagged**.

**Verdict: BLOCKED** — 1 minor finding to remediate (INFRA-1).

### 3.2 Phase 2 — Security  *(Verdict: APPROVED)*

**Scope reviewed.** The 37 primary-domain files in §2.2 (3 roles, 24 table-level ACLs, 2 field-level ACLs, 4 scripted-REST records, 3 demo users, 1 demo group, 3 role-assignments, `docs/acl-matrix.md`), plus cross-cutting sys_id-literal and PII scans across all 157 in-scope files.

**Positive findings.**

1. **Roles** — 3 scoped roles correctly authored in `servicenow-case-management-poc/roles/`:
   - `x_casemgmt_case_manager` (full create/read/write/delete; only role permitted to close)
   - `x_casemgmt_case_agent` (create + read/write only on assigned cases)
   - `x_casemgmt_case_viewer` (read-only)
   - All `grantable=true`, `elevated_privilege=false`, no global-scope side-effects.
2. **Table-level ACL matrix (24 ACLs)** — perfectly matches AAP §0.5.6:

   | Role | Create | Read | Write | Delete | ACL files |
   | --- | --- | --- | --- | --- | --- |
   | case_manager | ✅ (case, case_task, case_party) | ✅ All (case, case_task, case_party) | ✅ All (case, case_task, case_party) | ✅ (case, case_task, case_party) | `*_create_manager`, `*_read_manager`, `*_write_manager`, `*_delete_manager` |
   | case_agent | ✅ (case, case_task, case_party) | ✅ Assigned only (case, case_task, case_party) | ✅ Assigned only (case, case_task, case_party) | ❌ | `*_create_agent`, `*_read_agent_assigned`, `*_write_agent_assigned` |
   | case_viewer | ❌ | ✅ All (case, case_task, case_party) | ❌ | ❌ | `*_read_viewer` |
3. **"Assigned only" condition** — Each `*_agent_assigned` ACL contains a scripted condition that returns true iff `current.assigned_agent == gs.getUserID()` OR `gs.getUser().isMemberOf(current.assigned_group.toString())`. For `case_task` and `case_party` agent-assigned ACLs, the formula dot-walks via `current.case.getRefRecord()` to inspect the parent case's `assigned_agent` and `assigned_group`. This correctly implements AAP §0.5.6's "Assigned only" semantics.
4. **Field-level ACLs (2 ACLs)** — correctly restrict the two sensitive fields:
   - `x_casemgmt_case.assigned_group` write: `x_casemgmt_case_manager` only (no script needed; role-only check).
   - `x_casemgmt_case.assigned_agent` write: `x_casemgmt_case_manager` (unconditional) + `x_casemgmt_case_agent` (only when `current.assigned_agent == gs.getUserID()`, preventing self-grab and peer-poach). 2 158-character condition script with thorough inline rationale.
5. **Anonymous portal endpoints** — both REST definitions and operations carry `requires_authentication=false` and `requires_acl_authorization=false`:
   - POST `/api/x_casemgmt/case_submit` → delegates to `x_casemgmt.CasePortalService.submitCase()` which whitelists exactly 5 input fields (subject, type, description, requester_name, requester_email) and forces `status='Draft'`. All other payload keys are silently dropped.
   - GET `/api/x_casemgmt/case_status_lookup?number=...` → delegates to `x_casemgmt.CasePortalService.lookupCase()` which queries by the public-facing `number` field (NOT `sys_id`) and returns ONLY `status`, `subject`, `opened_date` — no internal fields exposed. Returns the AAP-verbatim "No case found with that number." text on miss.
6. **Demo users, group, role-assignments** — all 3 demo users use synthetic names (Demo Manager / Demo Agent / Demo Viewer), emails on the RFC-6761-reserved `.invalid` TLD (`demo-{role}@example.invalid`), and `user_name` prefixed with `x_casemgmt_`. The demo group `x_casemgmt_demo_team` is synthetic. Role-assignment records use the human-readable keys `user_name` and `role.name` (no `sys_id` literals). Zero PII; compliant with AAP §0.7.2 no-PII constraint.
7. **No hardcoded sys_id literals in executable content** — Python AST walk over every `*.xml` file in the in-scope tree, scanning every `<script>`, `<condition>`, `<filter>`, `<when>`, `<computed_value>`, `<ajax_script>`, `<script_true>`, `<script_false>`, `<script_plain>`, `<client_script>`, `<server_script>`, `<operation_script>`, `<onCondition>`, `<script_create>`, `<script_update>`, `<script_delete>`, `<init_script>`, `<script_includes>`, and `<script_body>` element body for 32-character lowercase hex literals (the sys_id format). After filtering documentation/comment contexts: **0 violations**. Every cross-reference resolves by stable human-readable key (`user_name`, `name`, `number`, `role.name`).
8. **`docs/acl-matrix.md`** — reproduces the AAP §0.5.6 matrix verbatim, defines "Assigned only" with both logical-expression and condition-script form, lists per-role narrative, field-level ACL design, UI Action visibility tied to ACL, and source-side ArkCase semantic mapping. Comprehensive and consistent with implementation.

**No BLOCKED findings.**

**Verdict: APPROVED.**

### 3.3 Phase 3 — Backend Architecture  *(Verdict: APPROVED)*

**Scope reviewed.** The 49 primary-domain files in §2.3 (3 tables, 25 dictionary entries, 7 choice lists, 2 Script Includes, 2 parent flows + 5 subflows, 6 business rules, 1 seed script).

**Positive findings.**

1. **Tables (3)** — all three `sys_db_object` records correctly authored: name = `x_casemgmt_case` / `x_casemgmt_case_task` / `x_casemgmt_case_party`; label = `Case` / `Case Task` / `Case Party`; `number_ref` points at the matching `sys_number_*` counter; no `super_class` (root tables, not extensions); `is_extendable=false`.
2. **Dictionary entries (25)** — perfect alignment with AAP §0.5.7:
   - `x_casemgmt_case` (14 entries): `number` (string/40, ro, auto-numbered to `CASE0000001`), `type` (string/40, optional, choice), `status` (string/40, **mandatory**, default=`Draft`, choice), `priority` (string/40, default=`Medium`, choice), `subject` (string/255, **mandatory**), `description` (string/4000, **mandatory**), `opened_date` (glide_date_time/40, ro), `closed_date` (glide_date_time/40, ro), `assigned_group` (reference→`sys_user_group`), `assigned_agent` (reference→`sys_user`), `requester_name` (string/100, **mandatory**), `requester_email` (string/100), `pending_reason` (string/40, choice), `duration_to_close` (glide_duration/40, ro — function field used by the "Average time to close" Manager-View dashboard widget).
   - `x_casemgmt_case_task` (6 entries): `case` (reference→`x_casemgmt_case`, **mandatory**), `subject` (string/255, **mandatory**), `type` (string/40, choice), `status` (string/40, default=`Open`, choice), `assigned_to` (reference→`sys_user`, **mandatory**), `due_date` (glide_date/40, **mandatory**).
   - `x_casemgmt_case_party` (5 entries): `case` (reference→`x_casemgmt_case`, **mandatory**), `party_type` (string/40, **mandatory**, choice), `person` (reference→`sys_user`, optional — UI Policy enforces conditional mandatory), `organization` (reference→`core_company`, optional — UI Policy enforces conditional mandatory), `role_label` (string/100, **mandatory**).
   - Note: `assigned_group` and `assigned_agent` are dictionary-level optional because the AAP defines them as Open-transition-time mandatory (workflow-time), not insert-time mandatory. The Open Flow Designer subflow enforces the workflow-time check.
   - Note: `pending_reason` and `duration_to_close` are additive support fields required to implement the state machine (per AAP §0.5.5) and the Manager-View "Average time to close" widget (per AAP §0.4.4); they do not conflict with §0.5.7's verbatim schema.
3. **Choice lists (7)** — match AAP §0.5.7 verbatim:
   - `case.type`: General Inquiry (seq=100), Complaint (seq=200)
   - `case.status`: Draft (100), Open (200), In Progress (300), Pending (400), Resolved (500), Closed (600)
   - `case.priority`: Low (100), Medium (200), High (300), Critical (400)
   - `case.pending_reason`: Awaiting Info (100), Awaiting Third Party (200), Other (300)
   - `case_task.type`: Investigation (100), Review (200), Follow-up (300), Other (400)
   - `case_task.status`: Open (100), In Progress (200), Closed (300)
   - `case_party.party_type`: Person (100), Organization (200)
4. **Script Include — `x_casemgmt.CaseTransitionValidator`** (22 706 chars; package_private, client_callable=false). Exposes 8 methods:
   - `canTransitionToOpen(caseGr)` — checks `assigned_group` populated
   - `canTransitionToInProgress(caseGr)` — checks `assigned_agent` populated AND `isAgentInGroup()` succeeds
   - `canTransitionToResolved(caseGr)` — checks `getOpenTaskCountForCase()===0`; returns verbatim AAP error `"All tasks must be closed before resolving this case."`
   - `canTransitionToClosed(caseGr, userId)` — checks caller has `x_casemgmt_case_manager` role
   - `validateNoBacktransition(prev, next)` — returns verbatim AAP errors `"Closed cases are terminal and cannot be modified."` (prev=Closed) and `"Cases cannot be returned to Draft."` (next=Draft & prev∉{Draft,''})
   - `isAgentInGroup(userSysId, groupSysId)` — `sys_user_grmember` query
   - `getOpenTaskCountForCase(caseSysId)` — GlideAggregate
   - `initialize()` — standard constructor
5. **Script Include — `x_casemgmt.CasePortalService`** (14 017 chars; package_private). Exposes `submitCase(payload)` and `lookupCase(number)`; submission whitelists exactly 5 input fields (subject, type, description, requester_name, requester_email) and forces `status='Draft'`; lookup queries by the public-facing `number` field (not `sys_id`) and returns only `{status, subject, opened_date}`.
6. **Business Rules (6)** — every rule has substantive body and is `active=true`, `when=before`:
   - `block_draft_backtransition` (order=200, on update, 6716 chars) → delegates to `validator.validateNoBacktransition()` then `gs.addErrorMessage(result.error); current.setAbortAction(true);`. Surfaces AAP-verbatim `"Cases cannot be returned to Draft."` text.
   - `block_terminal_closed` (order=100, on update, 5693 chars) → same delegate pattern; surfaces AAP-verbatim `"Closed cases are terminal and cannot be modified."`.
   - `clear_pending_reason_on_inprogress` (order=400, on update, 3251 chars) → if prev=Pending && new=`In Progress`, sets `current.pending_reason = ''`.
   - `set_closed_date` (order=500, on update, 3027 chars) → if prev=Resolved && new=Closed AND `current.closed_date.nil()`, sets `current.closed_date = gs.nowDateTime()`.
   - `set_opened_date` (order=100, on insert, 1472 chars) → if `current.opened_date.nil()`, sets `current.opened_date = gs.nowDateTime()`.
   - `validate_assigned_agent_membership` (order=300, on insert+update, 9580 chars) → when `assigned_agent` is set, validates it is a member of `assigned_group`; surfaces `"Assigned agent must be a member of the assigned group."` on failure.
7. **Flow Designer (2 parent flows + 5 subflows)** — all 7 are `active=true`. Latest snapshots populated (5K-11K chars each):
   - Parent `general_inquiry_state_machine` (type=flow, snap=10 639c) — 5 references to each subflow, 4 references to `CaseTransitionValidator`, 1 reference to verbatim `"All tasks must be closed"`, 4 references to `pending_reason`, 2 references to `x_casemgmt_case_manager`.
   - Parent `complaint_state_machine` (type=flow, snap=10 576c) — identical reference counts.
   - Subflow `validate_open_transition` (snap=5 641c) — 5 occurrences of `"Required field assigned_group"`, 4 Throw Error actions, references the validator.
   - Subflow `validate_inprogress_transition` (snap=5 686c) — 5 occurrences of `"must be a member"`.
   - Subflow `validate_pending_transition` (snap=2 801c) — 16 references to `pending_reason` (the subflow's responsibility is to set it via flow input).
   - Subflow `validate_resolved_transition` (snap=5 068c) — 6 occurrences of `"All tasks must be closed"`, 3 Throw Errors.
   - Subflow `validate_closed_transition` (snap=6 676c) — 6 occurrences of `"Only case managers can close"`, 3 references to `x_casemgmt_case_manager`.
8. **Seed script `scripts/seed_demo_data.js`** — 1 452 lines, 17 functions, passes `node --check`. Lookup helpers (`lookupUserSysId`, `lookupGroupSysId`, `lookupRoleSysId`, `lookupCompanySysId`, `lookupCaseSysId`, `lookupCaseNumberBySubject`) resolve cross-references via `GlideRecord` queries on stable human-readable keys (`user_name`, `name`, `number`, `subject`). Ensure helpers (`ensureUser`, `ensureGroup`, `ensureGroupMembership`, `ensureRoleAssignment`, `ensureCompany`, `ensureCase`, `ensureTask`, `ensureParty`) implement idempotent upsert semantics. Zero 32-character hex literals in the source code after comment stripping.

**No BLOCKED findings.**

**Verdict: APPROVED.**

### 3.4 Phase 4 — Business / Domain  *(Pending)*

### 3.5 Phase 5 — Frontend  *(Pending)*

### 3.6 Phase 6 — QA / Test Integrity  *(Pending)*

### 3.7 Phase 7 — Other SME  *(Pending)*

---

## 4. Cycle 1 — Consolidated Remediation List

*Populated at end of cycle once every phase has resolved.*

---

## 5. Final Reviewer Verdict

*Pending end of cycles.*
