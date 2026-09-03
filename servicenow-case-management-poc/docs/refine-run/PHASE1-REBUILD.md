# Phase 1 — Native rebuild of the master Update Set (S3 – S6)

Refine PR, Phase 1 **HARD GATE**, work unit **U2**. Directives owned here: **D2** (the
OBJECTIVE), **D21** (S3 rebuild), **D22** (S3 resume check), **D23** (S4 confirm), **D24**
(S4a count delta), **D25** (S5 mark Complete), **D26** (S6 clean the instance), **D27**
(Phase 1 exit condition). S0/S1/S2 belong to U1 and are reported in `PHASE0-1.md`; Phase 2
(preview/commit) belongs to U3 and was not started here.

Instance `https://dev306625.service-now.com` (Zurich Patch 10). Every sys_id below was
resolved by query at the time it was used (`sys_scope?scope=x_casemgmt`,
`sys_user_role?name=…`, `sys_db_object?name=…`, `sys_number?category=…`,
`sys_user?user_name=…`); the literals are recorded here as evidence, not as inputs. No
credential, cookie or CSRF token appears in this file or in any committed artifact.

---

## 1. The single-test result (U1's S1) — reported first, per D27

D27 requires the single-test result to be presented **before** the full-package result.
This section restates U1's S1 outcome; the detail is in `PHASE0-1.md` §3.2.

| S1 assertion | Observed | Verdict |
| --- | --- | --- |
| One test table created by the real Table API (`POST /api/now/table/sys_db_object`, `x_casemgmt_refine_probe`, sys_id `19999c5a930b435009aa70d19dba107d`) | HTTP 201 | PASS |
| Physical storage provisioned | `GET /api/now/table/x_casemgmt_refine_probe?sysparm_limit=1` flipped from HTTP 400 "Invalid table" to **HTTP 200** | PASS |
| One test role created (`x_casemgmt_refine_probe_role`, `caa9509a930b435009aa70d19dba1033`) | HTTP 201 | PASS |
| One role **link** produced by the platform's own role-assignment path (ACL form → "Requires role") | `sys_security_acl_role` `96dcd812934b435009aa70d19dba1064` written by the platform | PASS |
| The platform captured the native actions into the SCRATCH Update Set | 6 records captured, including `sys_security_acl_role_96dcd812934b435009aa70d19dba1064` — a payload class that appears **zero** times in the shipping package | PASS |
| Persistence after marking the SCRATCH set Complete | table endpoint still HTTP 200; `sys_user_role?name=x_casemgmt_refine_probe_role` → exactly 1 | PASS |
| Nothing from the probe shipped | SCRATCH set `4999985a930b435009aa70d19dba102e` never exported/previewed/committed | PASS |

**S1 verdict: PASS**, verified `2026-09-02T18:37:43Z`. Screenshots cited by U1:
`blitzy/screenshots/phase1-s1-probe-table-studio.png` ("probe table definition created
natively via Table API") and `blitzy/screenshots/phase1-s1-probe-role-link.png` ("role
assignment screen showing the natively created probe role link"), both under the
repository root. S1 established the premise the full rebuild depends on: **native creation
produces captured records, including the role-link class.**

---

## 2. The full-package result (S3 – S6)

### 2.1 D22 RESUME CHECK — run before any write

D22 requires each artifact to be checked separately and only the incomplete sub-parts
re-run. All three were incomplete, so all three ran; nothing was skipped and nothing
completed was redone.

| Sub-part | Query | Answer |
| --- | --- | --- |
| (i) hand-authored records removed from the captured XML? | `sys_update_xml` children of the imported package | **No** — 3 `sys_db_object`, 25 `sys_dictionary`, 3 `sys_user_has_role` present; 7 `sys_choice` + 26 `sys_security_acl` present (to be left untouched); the shipping Local set held 0 rows |
| (ii) tables natively recreated? | `sys_db_object?nameSTARTSWITHx_casemgmt` | **No** — the live rows were the hand-authored ones committed from the package (`bd806f5b…`, `f9fd58b1…`, `179699d5…`, all `sys_created_on 2025-01-01 00:00:00`, `sys_mod_count 0`) |
| (iii) role links natively recreated? | shipping set children | **No** — 0 `sys_security_acl_role` and 0 platform-captured `sys_user_has_role` in the set, while the live instance carried 27 links (manager 14 / agent 10 / viewer 3) and 3 grants |

INTERP-2 applies: the directive's "new, empty PDI … no risk of these tables/role-links
already existing live" is factually false on this instance, and the RESUME CHECKs govern.

### 2.2 The mechanism that realized "the master set" (INTERP-3)

A `sys_remote_update_set` cannot be current and cannot capture new changes, so the single
shipping artifact was realized as the **Local** Update Set U1 created:

| Record | sys_id | Role |
| --- | --- | --- |
| Local Update Set `x_casemgmt_case_management v1.0.0 (native rebuild)` | `1109981a930b435009aa70d19dba1098` | **the master shipping set** — holds the full package and captured every native action |
| Retrieved Update Set `x_casemgmt_case_management v1.0.0 (native rebuild import)` | `b4861cf7bbe24b36926fcaff4583b5bf` | the S0 import; left at `state=loaded`, never previewed or committed |
| Local Update Set `REFINE ABSORBER deletions (DO NOT SHIP)` | `25d86c1a938b435009aa70d19dba101b` | throwaway that absorbed the platform's capture of every deletion |

**Step 1 — move the package into the capture target.** A background script re-pointed all
**926** `sys_update_xml` children from `remote_update_set=b4861cf7…` onto
`update_set=1109981a…` and cleared `remote_update_set`. Record identity (sys_id, name,
payload, type, target_name, action) was preserved; `setWorkflow(false)` and
`autoSysFields(false)` avoided audit churn. Result: `moved=926 failed=0`,
shipping children **926**, remote children left **0**, remote set still `state=loaded`.
Verified immediately afterwards: the shipping set's per-class inventory was **identical to
the S0 baseline across all 42 payload classes**, and a SHA-256 guard over the 7 choice +
26 ACL payloads matched (`f7e5df42723bbedd3705321fa1ae99b2d4919768b4ebcc4e052d1956f0733f93`).

**Step 2 — the ABSORBER, and why it exists.** An update-set capture is keyed by update
name. A captured DELETE therefore lands on the *same* row as the existing
INSERT_OR_UPDATE payload and would destroy that payload inside the shipping set. Every
destructive step in this phase was therefore performed with the ABSORBER as the current
Update Set, and only creative steps ran with the shipping set current. The switch was made
with the platform's own `GlideUpdateSet().set()` inside the same script that did the work,
so no window existed in which a deletion could be captured into the master set. This was
verified after every destructive step: the shipping set's count, per-class inventory and
guard hash were unchanged each time.

### 2.3 S3 — records removed from the captured XML (D21, first half)

31 payload rows were removed, each located by its exact update name (one query per name, so
nothing adjacent could be caught). Verbatim backups of all 31 rows, payload included, were
taken first.

| Removed update record | Type | Target |
| --- | --- | --- |
| `sys_db_object_179699d585b1c44f4a15b28b51a0de1c` | Table | x_casemgmt_case_party |
| `sys_db_object_bd806f5b23883f5d28ed792570f1070b` | Table | x_casemgmt_case |
| `sys_db_object_f9fd58b1a8c6ecc0cf653c0b50ecc5a3` | Table | x_casemgmt_case_task |
| `sys_dictionary_04c189886307f35757d6fc5f94b9074f` | Dictionary | x_casemgmt_case_party.role_label |
| `sys_dictionary_0bf56c205b5fbda5c5971de48d3ca279` | Dictionary | x_casemgmt_case.number |
| `sys_dictionary_180d00dda06c4b93e4c2c106b621d153` | Dictionary | x_casemgmt_case_task.type |
| `sys_dictionary_1fa3f30c65afbf042f32440bf955199f` | Dictionary | x_casemgmt_case_party.organization |
| `sys_dictionary_25c60a42b3b9a76ae153979ec5e88edc` | Dictionary | x_casemgmt_case.closed_date |
| `sys_dictionary_25cae07ed16e95fd89a4c8013152ecc2` | Dictionary | x_casemgmt_case_task.case |
| `sys_dictionary_35ea82e3ffef23bfc94aa73d2a74fa52` | Dictionary | x_casemgmt_case.assigned_group |
| `sys_dictionary_388df21ea3ca149d70916144f84ecf42` | Dictionary | x_casemgmt_case_task.assigned_to |
| `sys_dictionary_3e18b5498c00dfde143bbc84fced474c` | Dictionary | x_casemgmt_case.opened_date |
| `sys_dictionary_548ff520bd22f86da39916a86f8cef1e` | Dictionary | x_casemgmt_case.description |
| `sys_dictionary_5e02afdbd2f05f407e986015e93d1238` | Dictionary | x_casemgmt_case_party.party_type |
| `sys_dictionary_5f0be2eaed29d45b1d63d64e876d22c4` | Dictionary | x_casemgmt_case.status |
| `sys_dictionary_696e73e041d826fe2d43a3f259acd1f1` | Dictionary | x_casemgmt_case.requester_name |
| `sys_dictionary_6f706e8bfa01ada7d9e44707e33251be` | Dictionary | x_casemgmt_case.requester_email |
| `sys_dictionary_71f23b3da166caace302a5c4ea7052d0` | Dictionary | x_casemgmt_case.assigned_agent |
| `sys_dictionary_7584a06a06745f24e42efb27f0ae5975` | Dictionary | x_casemgmt_case.priority |
| `sys_dictionary_8cd658b766c404ce4445d191adabd14c` | Dictionary | x_casemgmt_case_task.subject |
| `sys_dictionary_96a737c3997894e2ba2aacb07aa4854e` | Dictionary | x_casemgmt_case.subject |
| `sys_dictionary_9a49190f6a6b8f2b4100073c53631168` | Dictionary | x_casemgmt_case.type |
| `sys_dictionary_a20971037c6fb4c520d7a13231b15f3b` | Dictionary | x_casemgmt_case_task.due_date |
| `sys_dictionary_af19c46ec8457885c75512edec980172` | Dictionary | x_casemgmt_case_task.status |
| `sys_dictionary_c6fd3f91c5c2dc0ecf41923ef9bf75b5` | Dictionary | x_casemgmt_case.pending_reason |
| `sys_dictionary_d9b322d03c2bb79ef07a261e2f686cb4` | Dictionary | x_casemgmt_case_party.person |
| `sys_dictionary_f08a56ae8a5263f0af629913c48ae173` | Dictionary | x_casemgmt_case.duration_to_close |
| `sys_dictionary_fbd5378ac5055b3db843042ff20777b5` | Dictionary | x_casemgmt_case_party.case |
| `sys_user_has_role_0988a3e374b3a9fee4fd767265fba757` | Role Assignment | sys_user_has_role_x_casemgmt_demo_agent |
| `sys_user_has_role_b095d91833fde26d96f511e6a60afd58` | Role Assignment | sys_user_has_role_x_casemgmt_demo_viewer |
| `sys_user_has_role_c6ed64934879ee3ea435a2276bb5bf79` | Role Assignment | sys_user_has_role_x_casemgmt_demo_manager |

Count after removal: **926 → 895** (28 table/dictionary rows, then 3 role-assignment rows).
The only classes that moved were `sys_db_object` 3→0, `sys_dictionary` 25→0 and
`sys_user_has_role` 3→0.

**Left untouched, exactly as D21 requires** — the **7 `sys_choice`** payloads
(`x_casemgmt_case.type`, `.status`, `.pending_reason`, `.priority`,
`x_casemgmt_case_party.party_type`, `x_casemgmt_case_task.type`, `.status`) and the **26
`sys_security_acl`** payloads. Both sets were re-verified **byte-for-byte** by per-payload
SHA-256 after every subsequent step; the combined guard hash never changed.

### 2.4 S3 — role links created natively (D21, second half; INTERP-1)

Two platform facts were established empirically first, inside the ABSORBER, before
anything touched the shipping set:

1. **`sys_security_acl_role` is auto-captured.** Its collection dictionary carries
   `update_synch=true`; deleting and re-inserting one link produced a captured
   INSERT_OR_UPDATE row. The same test proved the write does **not** touch the parent ACL
   (`sys_updated_on` and `sys_mod_count` unchanged) and produces **no** `sys_security_acl`
   capture — so D21's "leave ACL records untouched" cannot be violated by the link work.
2. **`sys_user_has_role` is *not* auto-captured** (no `update_synch` attribute): a
   natively re-created grant produced zero capture rows. The platform's own update-set
   writer — `GlideUpdateManager2.saveRecord()`, the mechanism behind the platform's "Add to
   Update Set" action — *does* serialize it, producing a platform-generated payload of type
   "User Role". That is the path used, so no hand-authored XML was needed for this class
   either.

A third fact corrected an assumption: the platform assigns a **fresh random GUID** to a new
link. The pre-existing links' composite sys_ids (first half of the ACL sys_id + first half
of the role sys_id) were manufactured by `scripts/post_import_remediation.js`, not by the
platform. Link identity therefore necessarily changes across the rebuild; what must be
reproduced is the ACL↔role **pairing**.

**Order matters and is not interchangeable.** The links were created *before* the tables
were deleted, because the platform's table-delete cascade removes the 26 ACLs. Links
created against re-created ACLs would carry ACL sys_ids that appear nowhere in the
package's 26 ACL payloads, and the committed links would be orphaned.

Sequence: with the ABSORBER current, all 27 links and all 3 grants were deleted (live left
0 / 0); with the **shipping set** current, 27 links were inserted against the original 26
ACL records (`created=27 failed=0`, auto-captured) and 3 grants were inserted and then
serialized by the platform's writer.

Result — live: **27** links, **pair-for-pair identical** to the pre-rebuild inventory when
compared on (operation, ACL name, role), split **manager 14 / agent 10 / viewer 3**, every
row in the `x_casemgmt` scope; **3** grants, `state=active`, `inherited=false`.

Captured role links (27):

| Update record | Target |
| --- | --- |
| `sys_security_acl_role_bfd9ec9a938b435009aa70d19dba10d1` | x_casemgmt_case.assigned_agent.x_casemgmt_case_agent |
| `sys_security_acl_role_f3d9ec9a938b435009aa70d19dba10cc` | x_casemgmt_case.assigned_agent.x_casemgmt_case_manager |
| `sys_security_acl_role_bbd9ec9a938b435009aa70d19dba109d` | x_casemgmt_case.assigned_group.x_casemgmt_case_manager |
| `sys_security_acl_role_33d9ec9a938b435009aa70d19dba10e4` | x_casemgmt_case.x_casemgmt_case_agent |
| `sys_security_acl_role_4ce920da938b435009aa70d19dba1036` | x_casemgmt_case.x_casemgmt_case_agent |
| `sys_security_acl_role_88e920da938b435009aa70d19dba105e` | x_casemgmt_case.x_casemgmt_case_agent |
| `sys_security_acl_role_b7d9ec9a938b435009aa70d19dba10b4` | x_casemgmt_case.x_casemgmt_case_manager |
| `sys_security_acl_role_fbd9ec9a938b435009aa70d19dba10e9` | x_casemgmt_case.x_casemgmt_case_manager |
| `sys_security_acl_role_77d920da938b435009aa70d19dba1019` | x_casemgmt_case.x_casemgmt_case_manager |
| `sys_security_acl_role_77d9ec9a938b435009aa70d19dba10a3` | x_casemgmt_case.x_casemgmt_case_manager |
| `sys_security_acl_role_c4e920da938b435009aa70d19dba1076` | x_casemgmt_case.x_casemgmt_case_viewer |
| `sys_security_acl_role_8ce920da938b435009aa70d19dba1047` | x_casemgmt_case_party.x_casemgmt_case_agent |
| `sys_security_acl_role_c0e920da938b435009aa70d19dba1042` | x_casemgmt_case_party.x_casemgmt_case_agent |
| `sys_security_acl_role_08e920da938b435009aa70d19dba103c` | x_casemgmt_case_party.x_casemgmt_case_agent |
| `sys_security_acl_role_b3d920da938b435009aa70d19dba1031` | x_casemgmt_case_party.x_casemgmt_case_manager |
| `sys_security_acl_role_80e920da938b435009aa70d19dba107c` | x_casemgmt_case_party.x_casemgmt_case_manager |
| `sys_security_acl_role_fbd9ec9a938b435009aa70d19dba10ae` | x_casemgmt_case_party.x_casemgmt_case_manager |
| `sys_security_acl_role_0ce920da938b435009aa70d19dba1070` | x_casemgmt_case_party.x_casemgmt_case_manager |
| `sys_security_acl_role_7fd9ec9a938b435009aa70d19dba10fb` | x_casemgmt_case_party.x_casemgmt_case_viewer |
| `sys_security_acl_role_33d920da938b435009aa70d19dba101f` | x_casemgmt_case_task.x_casemgmt_case_agent |
| `sys_security_acl_role_04e920da938b435009aa70d19dba1053` | x_casemgmt_case_task.x_casemgmt_case_agent |
| `sys_security_acl_role_33d9ec9a938b435009aa70d19dba10a9` | x_casemgmt_case_task.x_casemgmt_case_agent |
| `sys_security_acl_role_f3d920da938b435009aa70d19dba1007` | x_casemgmt_case_task.x_casemgmt_case_manager |
| `sys_security_acl_role_cce920da938b435009aa70d19dba1058` | x_casemgmt_case_task.x_casemgmt_case_manager |
| `sys_security_acl_role_73d9ec9a938b435009aa70d19dba10ba` | x_casemgmt_case_task.x_casemgmt_case_manager |
| `sys_security_acl_role_48e920da938b435009aa70d19dba104d` | x_casemgmt_case_task.x_casemgmt_case_manager |
| `sys_security_acl_role_3bd920da938b435009aa70d19dba1001` | x_casemgmt_case_task.x_casemgmt_case_viewer |

Captured user→role grants (3):

| Update record | Target |
| --- | --- |
| `sys_user_has_role_cce920da938b435009aa70d19dba1081` | Demo Agent.x_casemgmt_case_agent |
| `sys_user_has_role_40e920da938b435009aa70d19dba1089` | Demo Manager.x_casemgmt_case_manager |
| `sys_user_has_role_c0e920da938b435009aa70d19dba1090` | Demo Viewer.x_casemgmt_case_viewer |

No `security_admin` elevation was required: REST refuses `sys_security_acl*` writes for a
non-elevated admin, but a server-side platform script is not ACL-gated, so the platform
performed every insert itself.

### 2.5 S3 — the three real tables created natively (D21, second half)

**Precondition (authorised twice by OVERRIDE-3).** A table that already exists cannot be
created, so the three tables were deleted first — with the ABSORBER current, children
first because of the inbound `case` reference fields. The `apps.current_app` user
preference (`8749eb4e9343435009aa70d19dba1085` → the x_casemgmt scope) was verified present
before and after and never repointed; without it the platform's "Validate Table Delete" /
"Validate Dictionary Column Delete" rules refuse scoped metadata deletes.

**The platform's cascade, enumerated** (measured immediately before and after the three
deletes — this is wider than the tables themselves and is reported rather than summarised):

| Class | Before | After |
| --- | --- | --- |
| `sys_db_object` (x_casemgmt) | 3 | 0 |
| `sys_dictionary` (3 tables) | 48 | 0 |
| `sys_documentation` (3 tables) | 47 | 0 |
| `sys_security_acl` (scoped) | 26 | 0 |
| `sys_security_acl_role` (scoped) | 27 | 0 |
| `sys_choice` (3 tables) | 24 | 0 |
| `sys_script` business rules | 7 | 0 |
| `sys_report` | 8 | 0 |
| `sys_ui_list` / `sys_ui_related_list` / `sys_ui_policy` | 3 / 1 / 2 | 0 / 0 / 0 |
| `sys_number` counters | 3 | 0 |
| data rows (case / task / party) | 12 / 10 / 8 | 0 / 0 / 0 |
| **survived**: `sys_ui_action` 6, `sys_hub_flow` 7, `sys_user_role` 3, `sys_scope` 1, `sys_app` 1 | — | unchanged |

None of those collateral classes was *targeted*: the deletion command named only the three
`sys_db_object` records. Every collateral record's payload remains in the shipping package,
so U3's commit restores them, and S6 requires the tables absent regardless. The 255 delete
captures landed in the ABSORBER; the shipping set stayed at 895 rows with its choice and
ACL payloads byte-identical.

**Creation.** With the shipping set current and the scope resolved by query:

* `POST /api/now/table/sys_db_object` ×3 → **HTTP 201** each. Every field replayed from the
  pre-deletion schema dump (label, plural, `super_class` empty, `access=public`,
  `read_access`/`ws_access` true, the six access flags false, `is_extendable=false`,
  `number_ref`).
* `POST /api/now/table/sys_dictionary` ×27 → **HTTP 201** each (case 14, case_task 7,
  case_party 6), so the platform provisioned the physical columns itself and wrote the
  collection and label rows on its own.

**Naming convention, measured on the real rebuild.** The platform computes
`sys_db_object_<sys_id>` for a table, `sys_dictionary_<table>_<element>` for a field and
`sys_documentation_<table>[_<element>]_en` for a label. The string
`sys_db_object_x_casemgmt_case` that the pre-refine package carried in the record's own
`sys_update_name` **column** was a hand-authored value, not a platform capture name — so
for `sys_db_object` the discriminator between hand-authored and platform-captured is the
**sys_id**, not the name pattern, while for `sys_dictionary` the pattern itself is the
discriminator. This is recorded because it contradicts the expectation stated in this
unit's brief.

Captured table records (3):

| Update record | Type | Target |
| --- | --- | --- |
| `sys_db_object_13cae85e938b435009aa70d19dba10e0` | Table | Case |
| `sys_db_object_c4da2c5e938b435009aa70d19dba10fa` | Table | Case Party |
| `sys_db_object_7bca2c5e938b435009aa70d19dba1095` | Table | Case Task |

Captured dictionary records (30 = 27 fields + 3 collection rows):

| Update record | Target |
| --- | --- |
| `sys_dictionary_x_casemgmt_case_assigned_agent` | Case.Assigned Agent |
| `sys_dictionary_x_casemgmt_case_assigned_group` | Case.Assigned Group |
| `sys_dictionary_x_casemgmt_case_closed_date` | Case.Closed Date |
| `sys_dictionary_x_casemgmt_case_description` | Case.Description |
| `sys_dictionary_x_casemgmt_case_duration_to_close` | Case.Duration to Close |
| `sys_dictionary_x_casemgmt_case_null` | Case |
| `sys_dictionary_x_casemgmt_case_number` | Case.Number |
| `sys_dictionary_x_casemgmt_case_opened_date` | Case.Opened Date |
| `sys_dictionary_x_casemgmt_case_party_case` | Case Party.Case |
| `sys_dictionary_x_casemgmt_case_party_null` | Case Party |
| `sys_dictionary_x_casemgmt_case_party_number` | Case Party.Number |
| `sys_dictionary_x_casemgmt_case_party_organization` | Case Party.Organization |
| `sys_dictionary_x_casemgmt_case_party_party_type` | Case Party.Party Type |
| `sys_dictionary_x_casemgmt_case_party_person` | Case Party.Person |
| `sys_dictionary_x_casemgmt_case_party_role_label` | Case Party.Role Label |
| `sys_dictionary_x_casemgmt_case_pending_reason` | Case.Pending Reason |
| `sys_dictionary_x_casemgmt_case_priority` | Case.Priority |
| `sys_dictionary_x_casemgmt_case_requester_email` | Case.Requester Email |
| `sys_dictionary_x_casemgmt_case_requester_name` | Case.Requester Name |
| `sys_dictionary_x_casemgmt_case_status` | Case.Status |
| `sys_dictionary_x_casemgmt_case_subject` | Case.Subject |
| `sys_dictionary_x_casemgmt_case_task_assigned_to` | Case Task.Assigned To |
| `sys_dictionary_x_casemgmt_case_task_case` | Case Task.Case |
| `sys_dictionary_x_casemgmt_case_task_due_date` | Case Task.Due Date |
| `sys_dictionary_x_casemgmt_case_task_null` | Case Task |
| `sys_dictionary_x_casemgmt_case_task_number` | Case Task.Number |
| `sys_dictionary_x_casemgmt_case_task_status` | Case Task.Status |
| `sys_dictionary_x_casemgmt_case_task_subject` | Case Task.Subject |
| `sys_dictionary_x_casemgmt_case_task_type` | Case Task.Type |
| `sys_dictionary_x_casemgmt_case_type` | Case.Type |

Captured label records (30 = 3 table labels + 27 field labels):

| Update record | Target |
| --- | --- |
| `sys_documentation_x_casemgmt_case__en` | Case |
| `sys_documentation_x_casemgmt_case_assigned_agent_en` | Case.Assigned Agent |
| `sys_documentation_x_casemgmt_case_assigned_group_en` | Case.Assigned Group |
| `sys_documentation_x_casemgmt_case_closed_date_en` | Case.Closed Date |
| `sys_documentation_x_casemgmt_case_description_en` | Case.Description |
| `sys_documentation_x_casemgmt_case_duration_to_close_en` | Case.Duration to Close |
| `sys_documentation_x_casemgmt_case_number_en` | Case.Number |
| `sys_documentation_x_casemgmt_case_opened_date_en` | Case.Opened Date |
| `sys_documentation_x_casemgmt_case_party__en` | Case Party |
| `sys_documentation_x_casemgmt_case_party_case_en` | Case Party.Case |
| `sys_documentation_x_casemgmt_case_party_number_en` | Case Party.Number |
| `sys_documentation_x_casemgmt_case_party_organization_en` | Case Party.Organization |
| `sys_documentation_x_casemgmt_case_party_party_type_en` | Case Party.Party Type |
| `sys_documentation_x_casemgmt_case_party_person_en` | Case Party.Person |
| `sys_documentation_x_casemgmt_case_party_role_label_en` | Case Party.Role Label |
| `sys_documentation_x_casemgmt_case_pending_reason_en` | Case.Pending Reason |
| `sys_documentation_x_casemgmt_case_priority_en` | Case.Priority |
| `sys_documentation_x_casemgmt_case_requester_email_en` | Case.Requester Email |
| `sys_documentation_x_casemgmt_case_requester_name_en` | Case.Requester Name |
| `sys_documentation_x_casemgmt_case_status_en` | Case.Status |
| `sys_documentation_x_casemgmt_case_subject_en` | Case.Subject |
| `sys_documentation_x_casemgmt_case_task__en` | Case Task |
| `sys_documentation_x_casemgmt_case_task_assigned_to_en` | Case Task.Assigned To |
| `sys_documentation_x_casemgmt_case_task_case_en` | Case Task.Case |
| `sys_documentation_x_casemgmt_case_task_due_date_en` | Case Task.Due Date |
| `sys_documentation_x_casemgmt_case_task_number_en` | Case Task.Number |
| `sys_documentation_x_casemgmt_case_task_status_en` | Case Task.Status |
| `sys_documentation_x_casemgmt_case_task_subject_en` | Case Task.Subject |
| `sys_documentation_x_casemgmt_case_task_type_en` | Case Task.Type |
| `sys_documentation_x_casemgmt_case_type_en` | Case.Type |

**The number configuration.** The cascade had also removed the three `sys_number` counters.
They were re-created with the ABSORBER current, so the package's own three `sys_number`
payloads remain exactly as shipped. The first attempt used `setValue('sys_id', …)`, which
the platform ignores; the platform's "Synch Table Number Reference" business rule then
re-pointed each table's `number_ref` at the newly generated counters. The second attempt
used `setNewGuidValue()`, the platform API that forces record identity, so the counters
carry exactly the identities the package carries (`4fc55a26…`/CASE, `ee298f5e…`/TASK,
`2358f946…`/PARTY, all `maximum_digits=7`, counter 0), the sync rule re-pointed
`number_ref` at those, and the three table records were then re-serialized into the
shipping set by the platform's own writer so their captured payloads carry the final
`number_ref`. Verified by reading the captured payloads. One side effect is an improvement
and is reported as such: pre-refine, `x_casemgmt_case_task.number_ref` and
`x_casemgmt_case_party.number_ref` pointed at `sys_number` records that did not exist on
the instance; after the rebuild all three resolve.

**Physical-storage and schema proof:**

| Assertion | Observed |
| --- | --- |
| `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` | **HTTP 200** (it was HTTP 400 "Invalid table" between deletion and creation) |
| `GET …/x_casemgmt_case_task` , `…/x_casemgmt_case_party` | **HTTP 200**, **HTTP 200** |
| `sys_dictionary` row counts | case **21**, case_task **14**, case_party **13** — identical to the pre-deletion dump |
| `sys_documentation` row counts | 21 / 14 / 13 |
| Auto-number format | inserting one synthetic probe case yielded **`CASE0000001`**, and `status` defaulted to **Draft**; the probe row was deleted, the counter reset to 0, and all three tables left at 0 rows |
| Schema fidelity | all 27 fields compared attribute-by-attribute against the pre-refine live dictionary (`internal_type`, `max_length`, `mandatory`, `read_only`, `reference`, `default_value`, `choice`, `active`, `display`, `unique`, `audit`, `text_index`, `function_field`, `function_definition`, `column_label`, `attributes`): identical, with one normalisation — the platform stores an empty `choice` where the hand-authored rows stored `0`, both meaning "no choice list". The `choice=3` fields kept `choice=3`. |

The auto-number probe was run **in the `x_casemgmt` scope**: cross-scope writes to
`x_casemgmt_*` from `rhino.global` are refused by the table's access policy, and
`GlideUpdateSet` is barred in scoped code, so the current set was switched by a preceding
global script and the result was read back from `syslog`.

The rebuilt schema still satisfies AAP §0.5.7 verbatim, plus the additional live columns
the dump showed: `x_casemgmt_case.duration_to_close` (a `glide_duration` **function field**,
`glidefunction:datediff(closed_date,opened_date)`) and a `number` column on `case_task` and
`case_party` which the pre-refine package never carried as a serialized artifact.

### 2.6 S4 — the rebuild replaced the hand-authored records, with no throwaway artifact (D23)

| Assertion | Observed |
| --- | --- |
| S1 probe artifacts anywhere in the shipping set (searched on both `name` and `target_name`): `refine_probe`, probe table `19999c5a…`, probe role `caa9509a…`, probe ACL `63cc5812…`, probe link `96dcd812…` | **0 matches each** |
| Any shipping child whose `update_set` is the SCRATCH set `4999985a…` | **0** |
| SCRATCH set left as U1 created it | `state=complete`, its 6 rows intact, never exported |
| Any row naming a removed table sys_id (`bd806f5b…`, `f9fd58b1…`, `179699d5…`) or a removed grant sys_id (`0988a3e3…`, `b095d918…`, `c6ed6493…`) | **none** |
| All 30 dictionary rows platform-named `sys_dictionary_x_casemgmt_<table>_<element>` | yes — no `sys_dictionary_<32-hex>` row survives |
| The 3 table rows | the new platform GUIDs only |

### 2.7 S4a — record-count delta (D24)

```
D24 RECORD-COUNT RECONCILIATION  (baseline S0 = 926, post-swap = 988)

payload class               S0 base      now    delta   note
----------------------------------------------------------------------------------------------------
sys_variable_value              540      540       +0   unchanged
sys_atf_step                    180      180       +0   unchanged
sys_security_acl                 26       26       +0   unchanged
sys_dictionary                   25       30       +5   25 hand-authored removed; 30 platform-captured added (27 fields + 3 collection rows) - the swap
sys_atf_test                     20       20       +0   unchanged
sys_atf_test_suite_test          20       20       +0   unchanged
x_casemgmt_case                  10       10       +0   unchanged
x_casemgmt_case_task             10       10       +0   unchanged
sys_report                        8        8       +0   unchanged
x_casemgmt_case_party             8        8       +0   unchanged
sys_choice                        7        7       +0   unchanged
sys_hub_flow                      7        7       +0   unchanged
sys_script                        7        7       +0   unchanged (the 7 business rules)
sys_ui_action                     6        6       +0   unchanged
sp_widget                         3        3       +0   unchanged
sys_db_object                     3        3       +0   3 hand-authored removed, 3 platform-captured added (new sys_ids) - the swap
sys_number                        3        3       +0   unchanged
sys_user                          3        3       +0   unchanged
sys_user_has_role                 3        3       +0   3 hand-authored removed, 3 natively created and captured (new sys_ids) - the swap
sys_user_role                     3        3       +0   unchanged
core_company                      2        2       +0   unchanged
pa_dashboards                     2        2       +0   unchanged
sp_column                         2        2       +0   unchanged
sp_container                      2        2       +0   unchanged
sp_instance                       2        2       +0   unchanged
sp_page                           2        2       +0   unchanged
sp_row                            2        2       +0   unchanged
sys_script_include                2        2       +0   unchanged
sys_ui_policy                     2        2       +0   unchanged
sys_ui_policy_action              2        2       +0   unchanged
sys_ws_definition                 2        2       +0   unchanged
sys_ws_operation                  2        2       +0   unchanged
sp_portal                         1        1       +0   unchanged
sys_app                           1        1       +0   unchanged
sys_atf_test_suite                1        1       +0   unchanged
sys_hub_action_type_definition        1        1       +0   unchanged
sys_hub_flow_block                1        1       +0   unchanged
sys_script_fix                    1        1       +0   unchanged (the post-import remediation Fix Script)
sys_ui_list                       1        1       +0   unchanged
sys_ui_related                    1        1       +0   unchanged
sys_user_grmember                 1        1       +0   unchanged
sys_user_group                    1        1       +0   unchanged
sys_documentation                 0       30      +30   30 platform field/table label rows the platform writes with each column - the swap
sys_security_acl_role             0       27      +27   27 role links natively created and captured (mgr 14 / agent 10 / viewer 3) - the swap
----------------------------------------------------------------------------------------------------
TOTAL                           926      988      +62

classes whose COUNT changed: ['sys_dictionary', 'sys_documentation', 'sys_security_acl_role']
classes whose count is unchanged but identities changed: ['sys_db_object', 'sys_user_has_role']
payload classes: S0 baseline 42, post-swap 44 (the 2 added are sys_documentation and sys_security_acl_role); 41 of the 44 are numerically unchanged

LINE ITEMS
  926  S0 baseline (U1 import; equals the package file's 926 payload blocks)
   -3  sys_db_object  hand-authored  (x_casemgmt_case / _case_task / _case_party)
  -25  sys_dictionary hand-authored  (14 case + 6 case_task + 5 case_party fields)
   -3  sys_user_has_role hand-authored (demo_manager / demo_agent / demo_viewer grants)
   +3  sys_db_object  platform-captured
  +30  sys_dictionary platform-captured (27 fields incl. the 3 live-only number columns + 3 collection rows)
  +30  sys_documentation platform-captured field/table labels
  +27  sys_security_acl_role platform-captured role links
   +3  sys_user_has_role platform-captured grants
  ---
  988  post-swap total  (926 - 31 + 93)

ADDED rows: 93  REMOVED rows: 31
  added by class  : {'sys_db_object': 3, 'sys_dictionary': 30, 'sys_documentation': 30, 'sys_security_acl_role': 27, 'sys_user_has_role': 3}
  removed by class: {'sys_db_object': 3, 'sys_dictionary': 25, 'sys_user_has_role': 3}

VERDICT: the delta is explained line-for-line by the table/role-link swap alone. No other payload class shifted.
```

D24's stop-and-report condition was **not** triggered. Exactly three classes changed count
(`sys_dictionary` 25→30, `sys_documentation` 0→30, `sys_security_acl_role` 0→27), two kept
their count with new identities (`sys_db_object`, `sys_user_has_role`), and **41 of the 44
payload classes are numerically identical** — every class except those three, the two
identity-changed ones included, since their counts did not move. The 41 cover every figure
this unit's brief enumerates (540 `sys_variable_value`, 180 `sys_atf_step`, 26
`sys_security_acl`, 20 `sys_atf_test`, 20 `sys_atf_test_suite_test`, 8 `sys_report`, 7
`sys_choice`, 6 `sys_ui_action`, 3 `sys_number`, 3 `sys_user`, 3 `sys_user_role`, 2
dashboards, the portal records and the 28 seed rows on the three scoped tables). The set
difference was asserted, not eyeballed: 93 row names added and 31 removed, every one of
them inside the five swap classes.

One figure in the brief differs from the measured baseline and is unchanged by the swap, so
it cannot mask anything: `sys_hub_flow` measures **7** with `sys_hub_flow_block` counted
separately as 1.

The brief's `sys_script` figure of **7 is correct**, and the census above now says so. Both
packages carry 7 `sys_script` rows — the seven business rules — plus one row of a *distinct*
payload class, `sys_script_fix`: the post-import remediation Fix Script, update record
`sys_script_fix_227b757f182d8f3e1d9b774187ae8358`, whose payload is
`<record_update table="sys_script_fix">`. The first pass at this census keyed each payload
off the update-record/target label rather than off the record class inside the payload, and
so folded that one row into `sys_script` and reported 8; the mis-key then propagated into
every derived class total in this section. Both rows are `+0` either way, so no count, no
line item and no verdict above changes — only the class taxonomy and the class totals do
(baseline 42 rather than 41, post-swap 44, 41 numerically unchanged rather than 39).
Corrected by the post-review CR1 remediation, §7.

### 2.8 S5 — the master set is Complete (D25)

`PATCH /api/now/table/sys_update_set/1109981a930b435009aa70d19dba1098 {"state":"complete"}`
→ HTTP 200. Read back by query: `state=complete`, `is_default=false`, application = the
x_casemgmt scope, **988** children. **complete_at = 2026-09-02T19:20:46Z.**

Nothing can be captured into it afterwards: the current Update Set was switched away from
it before any further instance action — to the ABSORBER for the S6 deletions, and finally
to the platform's global **Default** set (`11226d84a56503108bb220b7a4d212b2`, resolved by
query). The ABSORBER was preferred over Default for the deletions so that scoped delete
captures land in a scoped throwaway instead of polluting the global Default set.

### 2.9 S6 — the live instance is clean (D26)

RESUME CHECK first, exactly as D26 requires:

| Artifact | Still existed? | Action |
| --- | --- | --- |
| `x_casemgmt_case_task` (14 dictionary rows) | yes | deleted (`7bca2c5e938b435009aa70d19dba1095`) |
| `x_casemgmt_case_party` (13) | yes | deleted (`c4da2c5e938b435009aa70d19dba10fa`) |
| `x_casemgmt_case` (21) | yes | deleted (`13cae85e938b435009aa70d19dba10e0`) |
| `sys_security_acl_role` for the 3 scoped roles | **no — already 0** (cascade-removed by the S3 table deletion, after they had been captured) | **not re-attempted** |
| `sys_user_has_role` for the 3 scoped roles | yes, 3 | deleted (3) |

Clean-state proof, each assertion observed:

| Assertion | Observed |
| --- | --- |
| `GET /api/now/table/x_casemgmt_case?sysparm_limit=1` | **HTTP 400** `{"error":{"message":"Invalid table x_casemgmt_case"}}` |
| `GET …/x_casemgmt_case_task` | **HTTP 400** "Invalid table x_casemgmt_case_task" |
| `GET …/x_casemgmt_case_party` | **HTTP 400** "Invalid table x_casemgmt_case_party" |
| `sys_dictionary` rows for the three tables | **0** (0 / 0 / 0) |
| `sys_security_acl_role` for the three scoped roles | **0** |
| `sys_user_has_role` for the three scoped roles | **0** |
| `sys_number` for the three categories | **0** (cascade) |
| Preserved and verified present | 3 scoped roles, `sys_scope`, `sys_app`, 7 flows, the `apps.current_app` preference |

**instance_clean_at = 2026-09-02T19:22:09Z.** No `deleteApplication`, no scope deletion, no
Rollback, no back-out was invoked at any point.

After the deletions the master set was re-verified: **`state=complete`, 988 children** —
identical to the S4a figure, per-class inventory identical, guard hash unchanged. The
deletions were therefore not captured, exactly as D26 states.

---

## 3. Repository impact

**Serialized artifacts refreshed from the platform-captured payloads** (OVERRIDE-1 makes
this legitimate divergence from the pre-refine content, not a defect):

| Path | Change |
| --- | --- |
| `tables/x_casemgmt_case.xml`, `tables/x_casemgmt_case_task.xml`, `tables/x_casemgmt_case_party.xml` | **3 files updated** — rewritten from the captured `sys_db_object` payloads |
| `dictionary/x_casemgmt_*.xml` (25 existing) | **25 files updated** — rewritten from the captured `sys_dictionary` payloads |
| **35 new files** under `dictionary/` | **35 files created** — added for captured records that had no serialized artifact: 30 `sys_documentation` label records, 3 collection dictionary records, 2 field dictionary records for the live-only `number` columns |

Counted from `git diff c1b8d239f1925fab934e227ef7983fd710de69d5 --name-status`: 35 `A` and
25 `M` under `dictionary/`, 3 `M` under `tables/`, and no `D` anywhere under
`servicenow-case-management-poc/`. The 25 updated and the 35 created files are disjoint
sets, so `dictionary/` holds **60** files after this unit against 25 before it, and
`tables/` still holds 3.

The new files are, all 35 of them, grouped by the kind of captured record they carry:

```
30 sys_documentation label records - one per created column, plus one per table
  dictionary/sys_documentation_x_casemgmt_case__en.xml
  dictionary/sys_documentation_x_casemgmt_case_assigned_agent_en.xml
  dictionary/sys_documentation_x_casemgmt_case_assigned_group_en.xml
  dictionary/sys_documentation_x_casemgmt_case_closed_date_en.xml
  dictionary/sys_documentation_x_casemgmt_case_description_en.xml
  dictionary/sys_documentation_x_casemgmt_case_duration_to_close_en.xml
  dictionary/sys_documentation_x_casemgmt_case_number_en.xml
  dictionary/sys_documentation_x_casemgmt_case_opened_date_en.xml
  dictionary/sys_documentation_x_casemgmt_case_party__en.xml
  dictionary/sys_documentation_x_casemgmt_case_party_case_en.xml
  dictionary/sys_documentation_x_casemgmt_case_party_number_en.xml
  dictionary/sys_documentation_x_casemgmt_case_party_organization_en.xml
  dictionary/sys_documentation_x_casemgmt_case_party_party_type_en.xml
  dictionary/sys_documentation_x_casemgmt_case_party_person_en.xml
  dictionary/sys_documentation_x_casemgmt_case_party_role_label_en.xml
  dictionary/sys_documentation_x_casemgmt_case_pending_reason_en.xml
  dictionary/sys_documentation_x_casemgmt_case_priority_en.xml
  dictionary/sys_documentation_x_casemgmt_case_requester_email_en.xml
  dictionary/sys_documentation_x_casemgmt_case_requester_name_en.xml
  dictionary/sys_documentation_x_casemgmt_case_status_en.xml
  dictionary/sys_documentation_x_casemgmt_case_subject_en.xml
  dictionary/sys_documentation_x_casemgmt_case_task__en.xml
  dictionary/sys_documentation_x_casemgmt_case_task_assigned_to_en.xml
  dictionary/sys_documentation_x_casemgmt_case_task_case_en.xml
  dictionary/sys_documentation_x_casemgmt_case_task_due_date_en.xml
  dictionary/sys_documentation_x_casemgmt_case_task_number_en.xml
  dictionary/sys_documentation_x_casemgmt_case_task_status_en.xml
  dictionary/sys_documentation_x_casemgmt_case_task_subject_en.xml
  dictionary/sys_documentation_x_casemgmt_case_task_type_en.xml
  dictionary/sys_documentation_x_casemgmt_case_type_en.xml

3 collection (table-level) dictionary records
  dictionary/x_casemgmt_case_collection.xml
  dictionary/x_casemgmt_case_party_collection.xml
  dictionary/x_casemgmt_case_task_collection.xml

2 field dictionary records for the live-only auto-number columns
  dictionary/x_casemgmt_case_party_number.xml
  dictionary/x_casemgmt_case_task_number.xml
```

The two `number` rows are the `number` columns on `case_task` and `case_party` that the
pre-refine package never carried as serialized artifacts (§2.5).

`dictionary/*_collection.xml` carry the table-level (collection) dictionary rows the
platform writes when it creates a table — captured as
`sys_dictionary_x_casemgmt_<table>_null`. The `sys_documentation_*` files carry the label
rows the platform writes for every column and table; the pre-refine package contained no
`sys_documentation` records at all, so all 30 are new captured content. They live in
`dictionary/` because they are dictionary-adjacent label records for the same three tables,
and they are named after their update record so the mapping is unambiguous.

**No file was removed** — zero `D` entries in the diff. Every one of the 25 updated
dictionary artifacts and all 3 updated table artifacts still corresponds to a captured
record, and each of the 35 created files corresponds to a captured record that previously
had no serialized artifact at all. The totals for this unit are therefore **3 table files
updated, 25 dictionary files updated, 35 dictionary files created, 0 removed.**

Each rewritten file keeps its original explanatory header and gains a `PROVENANCE` block in
the same comment style, which names the update record, its type/target and its capture
time, and scopes the statements the rebuild supersedes (chiefly the claim that the
`<sys_id>` is a deterministic MD5 — it is now the identity the platform assigned). Bodies
are the platform's own serialization, pretty-printed to the directory's 4-space convention;
the serializer asserts element-by-element that no text or CDATA content changed.

**Impact chased beyond what the directive names, and the outcome of each check:**

| Checked | Result |
| --- | --- |
| Field name/type dependencies in `business_rules/*`, `flows/**`, `acl/*`, `reports/*`, `ui_policy/*`, `related_lists/*`, `list_layouts/*`, `atf/*`, `script_includes/*`, `portal/**`, `scripts/*`, `seed-data/**` | every field they depend on still exists with the same name and the same type — the 27 rebuilt fields are attribute-identical to the pre-refine live dictionary (only the `choice` 0→empty normalisation differs, which is semantically the same "no choice list"). **Nothing rewritten.** |
| `numbers/sys_number_x_casemgmt_case.xml`, `…_case_task.xml`, `…_case_party.xml` | still match the re-created counters exactly: sys_id `4fc55a26…`/`ee298f5e…`/`2358f946…`, categories `x_casemgmt_case`/`_case_task`/`_case_party`, prefixes CASE/TASK/PARTY, `maximum_digits` 7, counter 0. **Nothing rewritten.** |
| `choices/*.xml` and `acl/*.xml` | out of scope by D21 and untouched; their payloads in the shipping set were verified byte-identical after every step |
| `update-set/x_casemgmt_case_management_update_set.xml` and `…FALLBACK.xml` | not this unit's to touch; both byte-unchanged by this unit (`git diff --stat` empty when U2 finished). U3 later wrote the exported package to the deliverable path, and the post-review CR1 remediation re-ordered its payload blocks — §7 |

---

## 4. Phase 1 EXIT CONDITION (D27)

| Requirement | State | Evidence |
| --- | --- | --- |
| Import (S0) confirmed | met (U1) | retrieved set `b4861cf7…`, `state=loaded`, 926 children; baseline recorded as 926 |
| Scratch validation (S1–S2) confirmed | met (U1) | §1 above; probe artifacts proven gone, master set re-set current |
| Native rebuild (S3–S4) confirmed | **met** | §2.3–§2.6: 31 hand-authored rows removed, 93 platform-captured rows present, no probe artifact, choices and ACLs byte-identical |
| Count check (S4a) confirmed | **met** | §2.7: 988 = 926 − 31 + 93, itemized; no other class shifted |
| Master set is Complete and contains the full package with the swap applied | **met** | `state=complete`, 988 children, all 39 baseline classes outside the five swap classes at their baseline counts (41 of the 44 classes numerically unchanged, §2.7) |
| Instance is clean | **met** | §2.9: HTTP 400 "Invalid table" ×3, zero dictionary rows, zero links, zero grants |
| Single-test result reported before the full-package result | **met** | §1 precedes §2 |

**VERDICT: EXIT CONDITION MET — 2026-09-02T19:22:09Z (UTC).** Phase 2 (U3) may proceed;
the fallback package was not invoked.

---

## 5. Deviations, fix attempts and open items

| # | Item | Disposition |
| --- | --- | --- |
| 1 | The brief expected a platform-captured table to be named `sys_db_object_x_casemgmt_case`. The platform in fact names it `sys_db_object_<sys_id>`; the name-pattern discriminator holds for `sys_dictionary` only. | Reported, not worked around. The swap is proven by sys_id instead (§2.5, §2.6). |
| 2 | `sys_user_has_role` is not auto-captured by update sets. | Delivered through the platform's own update-set writer rather than hand-authored XML (§2.4). |
| 3 | Re-created role links necessarily get new sys_ids (the platform assigns a GUID; the old composite ids were produced by `post_import_remediation.js`). | Pairing reproduced exactly, 27 links, 14/10/3. Identity change is inherent to native creation. |
| 4 | The platform's table-delete cascade also removed the 26 ACLs, 24 choices, 7 business rules, 8 reports, the layouts and the 3 counters from the **live instance**. | Consequence of the OVERRIDE-3-authorised table deletion, not a targeted deletion. Enumerated in §2.5. All payloads remain in the package, so U3's commit restores them; S6 requires the tables absent anyway. |
| 5 | `sys_number` identity — first attempt used `setValue('sys_id')`, which the platform ignores. | **The only fix-and-re-verify loop in this phase: 2 attempts of the 2 permitted, resolved** with `setNewGuidValue()` and confirmed in the captured payloads (§2.5). |
| 6 | `x_casemgmt_case_task`/`_case_party` `number_ref` were dangling pre-refine; they now resolve. Known cosmetic defect #2 (no label row for `duration_to_close`) is also incidentally repaired, because the platform writes a `sys_documentation` row for every column it creates. | Improvements produced by the native path. Reported, not hidden. |
| 7 | Known pre-existing defect: `opened_date` empty on 8 of 10 seeded cases. | Untouched by this unit. The live data was destroyed with the tables (authorised), so the defect will reappear from the package's own seed rows after U3's commit; it is classified under D5 and is not caused here. |
| 8 | Recovery cycles used | **0 of 3.** The heartbeat (read-only, 10-minute interval) reported HTTP 200 throughout; the instance never hibernated during this phase. |

No directive assigned to this unit was left unimplemented, narrowed or deferred, and no
partial write was left behind: every record this unit created on the instance is either
captured in the master set and deliberately deleted from the instance (the tables, the
links, the grants), or deliberately retained and named here (the master set, the ABSORBER,
the three `sys_number` counters — which the cascade removes again with the tables, leaving
zero).

---

## 6. State handed to U3 (Phase 2)

| Item | Value |
| --- | --- |
| Master shipping Update Set (export this) | `1109981a930b435009aa70d19dba1098` — `x_casemgmt_case_management v1.0.0 (native rebuild)`, **`state=complete`**, **988** children |
| Retrieved Update Set from S0 (leave alone) | `b4861cf7bbe24b36926fcaff4583b5bf`, `state=loaded`, **0** children after the move |
| ABSORBER (never export, never commit) | `25d86c1a938b435009aa70d19dba101b`, 266 children, all of them deletions |
| SCRATCH set from S1 (never export) | `4999985a930b435009aa70d19dba102e`, `state=complete`, 6 rows |
| Pre-existing committed retrieved set (leave alone) | `9929f50df18ccec91ea13b2a3bccfc90`, `state=committed` |
| Current Update Set left as | the global **Default** set — nothing can be captured into the completed master set |
| Clean-instance precondition for Phase 2 S1 | the three tables return HTTP 400 "Invalid table"; zero scoped dictionary rows, zero `sys_security_acl_role`, zero `sys_user_has_role`; scope, `sys_app`, 3 roles and 7 flows still present; 26 ACLs and 24 choices absent (cascade — the package restores them on commit) |
| `apps.current_app` preference | intact (`8749eb4e9343435009aa70d19dba1085` → the x_casemgmt scope). Do not delete or repoint it. |

---

## 7. Post-review corrections — code review CR1 (2026-09-02)

Delta code review CR1 (package integrity lens) raised three blocking findings against this
run, two of them against this report. All three were resolved on **2026-09-02**, after the
run's five units had finished. This is the code-review resolution pass, not a sixth unit: it
took **no action on the instance** — no upload, no preview, no commit, no write of any kind.

| Finding | What was wrong here | What changed in this file |
| --- | --- | --- |
| **2 (MEDIUM)** — payload-class census | The S4a census keyed each payload off the update-record/target label, so the one `sys_script_fix` row (the post-import remediation Fix Script, `sys_script_fix_227b757f182d8f3e1d9b774187ae8358`) was folded into `sys_script` and reported as 8. The mis-key propagated into the derived class totals: §2.2 put the baseline at 41 classes where there are 42, and §2.7 put the numerically identical count at 39 where it is 41 | §2.7's table now carries a distinct `sys_script_fix` row (`sys_script` 7, `sys_script_fix` 1, both `+0` in both packages) and an explicit class census; §2.2 reads **42** baseline classes; §2.7 reads **41 of the 44** numerically unchanged; §4's row names the 39 baseline classes outside the five swap classes. No count, line item, total or verdict moved — `926 − 31 + 93 = 988` stands unchanged |
| **3 (MEDIUM)** — repository-impact inventory | §3's table put the number of files added under `dictionary/` at zero and left the "The new files are:" list blank, though this unit created 35 serialized artifacts | §3 now records **3 table files updated, 25 dictionary files updated, 35 dictionary files created, 0 removed**, with the complete 35-path inventory grouped as 30 `sys_documentation` label records, 3 collection dictionary records and 2 field dictionary records for the live-only `number` columns |
| **1 (HIGH)** — AAP §0.5.2 dependency ordering | Not this report's defect, and not this unit's artifact: the deliverable update-set XML carried the 988 payload blocks in the order the native re-export produced them | The deliverable's blocks were re-assembled into dependency-safe order by the group holding that file. **Block sequence only**: header, tail and every payload block byte-identical, size unchanged at 4,062,436 bytes, 988 blocks, and the 44-class census unchanged. The shipping SHA-256 therefore changed to `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`, which every record in this directory now quotes |

**What the Phase 2 evidence covers, stated precisely.** Phase 2 verified the **988 payload
records**: that record set was uploaded onto a clean instance, previewed to zero problems of
any type and committed. The reordered deliverable carries those same records
byte-identically and differs only in block sequence, so the evidence carries over to the
record set. The reordered bytes themselves were **not** round-tripped on a PDI; they were
verified statically — `xmllint --noout` clean, 988 blocks, a per-block SHA-256 multiset
identical to the Phase-2-verified bytes, an unchanged 44-class census, and the AAP §0.5.2
assertions passing (`sys_app` at payload index 0, no dictionary before its table, no choice
before its dictionary row, every role before every ACL, no ACL-role link before its
prerequisites, every report before both dashboards, and all 38 seed rows last — the 28 rows
on the three scoped tables plus the 10 demo user/group/membership/grant/company rows, at
payload indices 950–987). The full account is in
[`FINAL-REPORT.md`](./FINAL-REPORT.md) under "Post-review remediation — code review CR1",
and the machine-readable one under `final.post_review_cr1_remediation` in
[`run-state.json`](./run-state.json).
