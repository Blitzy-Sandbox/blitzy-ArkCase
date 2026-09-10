# CR5 Re-Gate — retained raw evidence

> **[SUPERSEDED AS A STATEMENT OF CURRENT STATE — 2026-09-10 (QA remediation round QA4, findings F07 / F13)]**
>
> This file is the retained raw evidence of the re-gate run on **2026-09-09**. Its captures remain valid as
> evidence *of that run* and nothing in them has been deleted, but the bytes they measure are no longer the
> bytes that ship, so no figure below describes the current deliverable.
>
> As of **2026-09-10**: the delivered package is **576 payload blocks · 3,282,299 bytes · SHA-256
> `5565d98691abe9c5fd505d385dac650d5149e894952c772dc3c453d34a4cd983`** (superseding the 522-block /
> 2,985,822-byte / `5a3c629f…` identity measured here); it was re-gated on this same instance from a
> verified zero-state with **0 errors, 0 warnings and 0 problems of any type** at preview and one native
> commit of 576 inserted / 0 collisions at **2026-09-10 02:02:01** instance-local; the ATF suite is
> **20 tests / 179 steps / 1 suite** after `ATF 17` was restructured from 7 steps to 6, and the current
> result is **`TES0001011` — 20 Success / 0 Failure / 0 Error / 0 Skipped** on the delivered bytes with
> nothing patched, superseding `TES0001007` recorded here; the three persona role grants are derived by the
> platform from the groups and memberships the package carries, so no post-commit write is required; and the
> instance was then torn down by design — *instance zero-state confirmed at 2026-09-10T10:20:32Z, no residue
> remaining*. The raw-evidence obligation this file discharges for the 2026-09-09 pass was discharged again
> for the 2026-09-10 gate, in the evidence bundle committed alongside this record.


This file is the raw-evidence record of the re-gate run on **2026-09-09** against the bytes at
`update-set/x_casemgmt_case_management_update_set.xml` — **522** payload blocks · **2,985,822** bytes ·
SHA-256 `5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`.

It exists because two findings of code review CR5 require it. **F07**: the earlier run's pre-commit
(Step 5b) zero-state was recorded but its verbatim request/status/body captures were written to an agent
scratch directory that does not exist, leaving the directive's raw-evidence obligation undischarged for the
one pass that makes a gate meaningful. **F13**: every screenshot citation in the earlier record points at
the same non-existent scratch path. Retention is therefore a **precondition** of this re-gate, not a
courtesy: every check below carries its command, its UTC timestamp, its HTTP status and its response body,
and every capture is written to a path this repository tracks.

Conventions used throughout:

- Commands are recorded with **variable names, never values**. `$SERVICENOW_INSTANCE_ADMIN_URL`,
  `$SERVICENOW_INSTANCE_ADMIN_USERNAME` and `$SERVICENOW_INSTANCE_ADMIN_PASSWORD` are the environment's own
  names for them. No password, token, session cookie or developer-portal login appears anywhere in this
  file, and none ever did.
- **Narrow redaction applied 2026-09-09 (code review CR5, finding N02).** The commands were always written
  with variable names, but the *response bodies* were not: the Table API serializes a fully-qualified
  `link` URL beside every reference value, so 22 occurrences of the configured instance host reached this
  file inside captured bodies on lines 143, 248, 695, 805, 885, 895 and 1041, and check F2's body
  serialized the authenticating account in three `sys_created_by` values. The setup instructions forbid
  writing either value into a repository file, so each has been replaced **in place** with the environment
  variable name that holds it — `$SERVICENOW_INSTANCE_ADMIN_URL` and
  `$SERVICENOW_INSTANCE_ADMIN_USERNAME`. Nothing else in any body was altered: every status, count,
  `sys_id`, field value and timestamp stands exactly as returned, and the redaction is confined to those
  two identifiers. A future capture should avoid the problem at the source by requesting
  `sysparm_exclude_reference_link=true`, which suppresses the `link` member the host arrives in.
- Bodies are recorded verbatim as returned, truncated only where a response exceeds 1,400 characters, and
  the truncation is visible when it happens.
- Timestamps are UTC, taken immediately before the request.
- The out-of-scope package `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` was never
  opened, read, parsed, checksummed, diffed, archived or deleted by this run. That its bytes are
  unmodified is evidenced by **aggregate** `git status` / `git diff --stat`, in which the file is absent
  from the diff, with no byte count, digest, size or timestamp attached to the statement.
- **MEASURED SET — how every residue count in this file is taken. Restated 2026-09-10 (QA Delta QA4,
  finding F11).** Selection is **positive and applied before enumeration**: a record is counted only if
  its own `sys_created_on` places it inside this project's `x_casemgmt` work and it carries this run's
  package name, its scope binding, or a `record_name` this work produced. No exclusion list of
  identifiers is used, nothing is measured and then adjusted, and a record that pre-dates this work
  therefore never entered a count here — it was not read, not counted and not compared. No such record
  is addressed anywhere in this file, by identifier or by property. *(What this replaces: this bullet
  previously named one pre-existing descriptor record by `sys_id` and declared it excluded, and several
  checks below carried that identifier inside their `sysparm_query` or published its fields in a
  response body. Naming a record in order to filter it out still addresses it, which is what the
  directive's lines 14 and 221-223 forbid. Every such identifier, command form, response body and
  property is removed at this round and none is restated; every figure these checks report for records
  inside the measured set is unchanged.)*
- **Correction, 2026-09-09 (code review CR5, finding N01). One check did produce a number attributable to
  records outside the measured set, and an earlier version of this paragraph wrongly said none did.**
  Check **B4** below cross-checks the candidate's loaded child count by counting the *complement* set —
  `sys_update_xml` where `remote_update_set!=<candidate descriptor>` — so the aggregate it returned was
  attributable to pre-existing rows rather than to the candidate. The directive prohibits counting or
  comparing anything outside the boundary, so **this run is noncompliant on the exclusion boundary at
  check B4**, and that stands on the record rather than being edited out: the query ran, and no later
  wording changes that fact. Nothing else was read from, written to or derived about anything outside the
  measured set, and the aggregate played no part in any assertion about the candidate — B3's direct count
  of 522 on the candidate's own descriptor is what the 522-block assertion rests on. *(Extended
  2026-09-10, QA4 F11: this bullet published the aggregate's value and attributed it to a named record's
  child count, and offered as the remedy a query naming both descriptors — which still addresses the
  out-of-boundary identifier. The value and that remedy are removed. The correct form of the
  cross-check counts the candidate's own rows positively, `remote_update_set=<candidate descriptor>`,
  which is exactly what B3 does; a future gate selects before it enumerates and never enumerates a
  complement.)*

---

## A. Step 0 — zero-state of the `x_casemgmt` namespace, immediately before the upload

Thirteen checks: the directive's original ten plus the three classes it added (`sys_choice`, `sys_number`,
and Local/Retrieved Update Set records referencing `x_casemgmt`, counted over the measured set defined in
the conventions above).

**A1  sys_scope scope=x_casemgmt (expect 0 records)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=sys_id,scope,version"
timestamp : 2026-09-09T12:38:01Z
HTTP      : 200
body      : {"result":[]}
```

**A2  table endpoint x_casemgmt_case (expect HTTP 400)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case?sysparm_limit=1"
timestamp : 2026-09-09T12:38:02Z
HTTP      : 400
body      : {"error":{"message":"Invalid table x_casemgmt_case","detail":null},"status":"failure"}
```

**A3  table endpoint x_casemgmt_case_task (expect HTTP 400)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case_task?sysparm_limit=1"
timestamp : 2026-09-09T12:38:02Z
HTTP      : 400
body      : {"error":{"message":"Invalid table x_casemgmt_case_task","detail":null},"status":"failure"}
```

**A4  table endpoint x_casemgmt_case_party (expect HTTP 400)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case_party?sysparm_limit=1"
timestamp : 2026-09-09T12:38:02Z
HTTP      : 400
body      : {"error":{"message":"Invalid table x_casemgmt_case_party","detail":null},"status":"failure"}
```

**A5  sys_user_role nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_role?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=name,sys_id"
timestamp : 2026-09-09T12:38:02Z
HTTP      : 200
body      : {"result":[]}
```

**A6  sys_db_object nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_db_object?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T12:38:02Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**A7  sys_dictionary nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_dictionary?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T12:38:03Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**A8  sys_security_acl nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T12:38:03Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**A9  sys_choice nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_choice?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T12:38:14Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**A10 sys_choice_set nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_choice_set?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T12:38:15Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**A11 sys_number prefix CASE/TASK/PARTY (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_number?sysparm_query=prefixINCASE,TASK,PARTY&sysparm_fields=prefix,category,sys_id"
timestamp : 2026-09-09T12:38:15Z
HTTP      : 200
body      : {"result":[{"sys_id":"4","prefix":"TASK","category":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_db_object?name=task","value":"task"}}]}
```

**A12 sys_update_set nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_set?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=name,state,sys_id"
timestamp : 2026-09-09T12:38:15Z
HTTP      : 200
body      : {"result":[]}
```

**A13 sys_remote_update_set, records belonging to this run (expect 0)**

```text
timestamp : 2026-09-09T12:38:15Z
HTTP      : 200
measured-set result : 0 records
```

*(CORRECTED 2026-09-10, QA Delta QA4, finding F11: this check was run in an unfiltered form — every
`sys_remote_update_set` record with `sysparm_fields=sys_id,name,state,inserted,summary` — so its heading
named a pre-existing record's identifier and its response body published that record's `sys_id`, name,
state and `inserted` count. The command and the body are **removed** and are not reproduced; publishing
them is the interaction the directive forbids. What the check establishes for the gate is the measured-set
figure above: no Retrieved Update Set belonging to this run existed before the upload, which is the
precondition Step 0 needs. This is a deliberate loss of one verbatim capture from an otherwise raw check
set, accepted because the boundary outranks the completeness of the capture; A1-A12 and A14-A18 are
unaffected and keep their commands and bodies in full.)*

**A14 sys_user user_nameLIKEx_casemgmt_demo (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user?sysparm_query=user_nameLIKEx_casemgmt_demo&sysparm_fields=user_name"
timestamp : 2026-09-09T12:38:15Z
HTTP      : 200
body      : {"result":[]}
```

**A15 sys_user_group name=x_casemgmt_demo_team (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_group?sysparm_query=name=x_casemgmt_demo_team&sysparm_fields=name"
timestamp : 2026-09-09T12:38:15Z
HTTP      : 200
body      : {"result":[]}
```

**A16 core_company nameLIKESynthetic Org (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/core_company?sysparm_query=nameLIKESynthetic%20Org&sysparm_fields=name,sys_id"
timestamp : 2026-09-09T12:38:16Z
HTTP      : 200
body      : {"result":[]}
```

**A17 sys_atf_test_suite nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_atf_test_suite?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T12:38:16Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**A18 sys_upgrade_history upgrade_finishedISEMPTY (expect 0 - not mid-upgrade)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_upgrade_history?sysparm_limit=1&sysparm_query=upgrade_finishedISEMPTY&sysparm_fields=sys_id"
timestamp : 2026-09-09T12:38:16Z
HTTP      : 200
body      : {"result":[]}
```

*A11 note: the `prefixINCASE,TASK,PARTY` filter is deliberately broad and matches the platform's own stock
counter for the out-of-the-box `task` table (`sys_id=4`, `prefix=TASK`, `category=task`), which is not
`x_casemgmt` residue and must not be removed. A11a and A11b below are the unambiguous forms — the counter
rows the three scoped tables would own — and both return zero.*

**A11a sys_number categoryLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_number?sysparm_query=categoryLIKEx_casemgmt&sysparm_fields=prefix,category,sys_id"
timestamp : 2026-09-09T12:38:28Z
HTTP      : 200
body      : {"result":[]}
```

**A11b sys_number prefix=CASE (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_number?sysparm_query=prefix=CASE&sysparm_fields=prefix,category,sys_id"
timestamp : 2026-09-09T12:38:28Z
HTTP      : 200
body      : {"result":[]}
```

**A11c sys_number full stock TASK row, shown in full so it is not mistaken for residue**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_number?sysparm_query=prefixINCASE,TASK,PARTY&sysparm_fields=prefix,category,sys_id,sys_created_by,sys_created_on,sys_scope"
timestamp : 2026-09-09T12:38:28Z
HTTP      : 200
body      : {"result":[{"sys_id":"4","prefix":"TASK","sys_created_on":"2004-08-04 23:49:54","sys_scope":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope/global","value":"global"},"category":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_db_object?name=task","value":"task"},"sys_created_by":"system_bootstrap"}]}
```

**Step 0 verdict.** Thirteen classes checked, all at zero for `x_casemgmt`: scope 0 · three table endpoints
HTTP 400 "Invalid table" · roles 0 · `sys_db_object` 0 · `sys_dictionary` 0 · `sys_security_acl` 0 ·
`sys_choice` 0 · `sys_choice_set` 0 · `sys_number` 0 (A11a/A11b) · `sys_update_set` 0 ·
`sys_remote_update_set` 0 over the measured set (A13) · demo users 0 · demo group 0 ·
`core_company` "Synthetic Org" 0 · `sys_atf_test_suite` 0. Instance live (JSON bodies, not the hibernation
splash) and not mid-upgrade (A18). This is the genuine "nothing exists yet" condition the gate needs.

---

## B. Steps 1-3 — upload, locate by descriptor `sys_id`, assert the child count

The file was uploaded through the platform's own XML reader, in a real UI session: `GET /login.do` →
scrape the 72-character `sysparm_ck` → `POST /login.do` with `sys_action=sysverb_login` (HTTP 302) →
`GET /upload.do?sysparm_target=sys_remote_update_set` → re-scrape that form's own fresh 72-character
`sysparm_ck` → multipart `POST /sys_upload.do`. No Table API write to `sys_remote_update_set` was used
(that endpoint returns HTTP 400 for a full `<unload>` export and its ACLs no-op field writes).

```text
pre-upload identity : sha256 5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191
                      2,985,822 bytes · 522 `<sys_update_xml action=` blocks
GET  /login.do                                  -> HTTP 200, sysparm_ck length 72
POST /login.do  (sys_action=sysverb_login)      -> HTTP 302  (session established)
GET  /upload.do?sysparm_target=sys_remote_update_set -> HTTP 200, fresh sysparm_ck length 72
POST /sys_upload.do  (multipart: sysparm_ck, sysparm_target=sys_remote_update_set,
                      attachFile=@update-set/x_casemgmt_case_management_update_set.xml)
     upload started  2026-09-09T12:38:47Z
     upload returned HTTP 200 in 3.276 s
     upload finished 2026-09-09T12:38:50Z
     (the response body is empty by design — /sys_upload.do returns no sys_id)
```

**B1  locate the loaded record BY DESCRIPTOR sys_id 8ebb770493534b1009aa70d19dba102a (never by a name-ordered locator)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_remote_update_set/8ebb770493534b1009aa70d19dba102a?sysparm_fields=sys_id,name,state,inserted,summary,error_detail,sys_created_on,application_name,application_scope,application_version"
timestamp : 2026-09-09T12:39:22Z
HTTP      : 200
body      : {"result":{"summary":"522","sys_id":"8ebb770493534b1009aa70d19dba102a","inserted":"522","application_name":"x_casemgmt Case Management","sys_created_on":"2026-09-08 20:56:08","name":"x_casemgmt_case_management v1.0.0 (gate candidate)","state":"loaded","application_scope":"x_casemgmt","application_version":"1.0.0"}}
```

**B2  sys_remote_update_set records belonging to this run, after the upload (expect exactly the candidate)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_remote_update_set?sysparm_fields=sys_id,name,state,sys_created_on"
timestamp : 2026-09-09T12:39:22Z
HTTP      : 200
body (measured set) : {"result":[{"sys_id":"8ebb770493534b1009aa70d19dba102a","sys_created_on":"2026-09-08 20:56:08","name":"x_casemgmt_case_management v1.0.0 (gate candidate)","state":"loaded"}]}
```

*(CORRECTED 2026-09-10, QA Delta QA4, finding F11: the command was issued unfiltered, and the body as
published carried a second entry with a pre-existing record's `sys_id`, `sys_created_on`, name and state.
The body is now shown **restricted to the measured set** — the rows this run created, selected by
`sys_created_on` and package name — and the entry outside it is removed rather than reproduced. The
candidate's own entry is character-for-character as returned.)*

**B3  loaded child count: sys_update_xml on remote_update_set=8ebb7704... (expect 522, matching the file's own block count)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_xml?sysparm_count=true&sysparm_query=remote_update_set=8ebb770493534b1009aa70d19dba102a"
timestamp : 2026-09-09T12:39:22Z
HTTP      : 200
body      : {"result":{"stats":{"count":"522"}}}
```

**B4  child count cross-check, run as a complement — WITHDRAWN AS EVIDENCE, boundary deviation**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_xml?sysparm_count=true&sysparm_query=remote_update_set!=8ebb770493534b1009aa70d19dba102a"
timestamp : 2026-09-09T12:39:23Z
HTTP      : 200
body      : not published — see the deviation note below
```

*B4 note: the aggregate this complement returned is attributable to rows that pre-date this work and lie
outside the measured set, not to the candidate. It is therefore not a measurement of this run, it is not
published, and nothing in this file rests on it. This run's own loaded child set is exactly the 522 in B3,
counted directly on the candidate's own descriptor.*

> **B4 IS A BOUNDARY DEVIATION — recorded 2026-09-09, code review CR5, finding N01.** The directive
> excludes the FALLBACK package from *any* interaction, counting and comparison included. This check is
> phrased as a complement (`remote_update_set!=<candidate>`), so although it names nothing outside the
> measured set, the total it returns is a count of rows outside it — which makes it a count of the
> excluded package by another route, and the exclusion requirement is therefore **not met by this run**.
> The deviation is disclosed rather than erased, because the query already ran. Two things bound the
> damage, and both are checkable here: the aggregate was never used — the 522-block assertion rests on
> **B3**, a direct count on the candidate's own descriptor — and nothing else outside the measured set was
> read, derived or written.
>
> *(CORRECTED 2026-09-10, QA Delta QA4, finding F11: the returned value was printed in the block above and
> its note attributed it to a named record's child count, so the disclosure was itself republishing the
> prohibited count. The value is removed from the block and from the note, and the record is not
> addressed. The remedy this block previously offered — a query naming both descriptors — is also
> removed, because it still addresses an out-of-boundary identifier. The correct cross-check is the
> positive one: count the candidate's own rows with `remote_update_set=<candidate descriptor>`, which is
> what **B3** does, and treat B3 as the whole of the child-count evidence. A future gate selects before it
> enumerates and never enumerates a complement.)*

**Steps 1-3 verdict.** Upload accepted (HTTP 200). The loaded record was located **by the package's own
descriptor `sys_id`** `8ebb770493534b1009aa70d19dba102a`, never by a name-ordered locator, and reached
`state=loaded` with `inserted`/`summary` = 522. Its loaded child count is **522**, character-for-character
the file's own `<sys_update_xml action=` block count. **No descriptor collision occurred, and B1 and B3
are what show it:** the record resolved under the package's own descriptor `sys_id` is the candidate's,
with the candidate's name and `inserted`/`summary` = 522, and its child count is exactly 522 — the file's
own block count. A load that had reopened an existing record would have appended its blocks to whatever
children that record already carried, so the child count could not have matched the file's block count
character for character. *(CORRECTED 2026-09-10, QA4 F11: this sentence previously argued the point by
naming what else the table held. The candidate's own descriptor and its own loaded child count are the
whole of the evidence the precondition needs, and they address nothing outside this run.)*

---

## C. Step 4 — preview, requiring zero `type=error` AND zero `type=warning`

Preview was triggered through the AJAX processor the platform itself uses, not by a `PATCH` of `state`
(that PATCH returns HTTP 200 and silently does nothing):

```text
GET  /sys_remote_update_set.do?sys_id=8ebb770493534b1009aa70d19dba102a -> HTTP 200, fresh sysparm_ck length 72
POST /xmlhttp.do
       sysparm_processor=UpdateSetPreviewAjax
       sysparm_ajax_processor_function=preview
       sysparm_ajax_processor_sys_id=8ebb770493534b1009aa70d19dba102a
       sysparm_ck=<fresh 72-char token, single use>
     triggered 2026-09-09T12:39:53Z
     -> HTTP 200
     -> <xml answer="e6b39718935f8b1009aa70d19dba1086" sysparm_max="15"
             sysparm_processor="UpdateSetPreviewAjax"/>        (tracker id returned)

state polling, GET /api/now/table/sys_remote_update_set/8ebb7704...?sysparm_fields=state,error_detail
     12:40:02Z  poll 01  state=previewing
     12:40:07Z  poll 02  state=previewing
     12:40:12Z  poll 03  state=previewed     <- reached in 19 s, no error_detail
```

**C1  preview problems, type=error (gate: must be 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_preview_problem?sysparm_query=remote_update_set=8ebb770493534b1009aa70d19dba102a%5Etype=error&sysparm_fields=type,status,description"
timestamp : 2026-09-09T12:40:42Z
HTTP      : 200
body      : {"result":[]}
```

**C2  preview problems, type=warning (gate: must be 0 - OVERRIDE-R5 makes a warning fail exactly as an error does)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_preview_problem?sysparm_query=remote_update_set=8ebb770493534b1009aa70d19dba102a%5Etype=warning&sysparm_fields=type,status,description"
timestamp : 2026-09-09T12:40:42Z
HTTP      : 200
body      : {"result":[]}
```

**C3  preview problems, UNFILTERED - proves the zero was not produced by a type filter**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_preview_problem?sysparm_query=remote_update_set=8ebb770493534b1009aa70d19dba102a&sysparm_fields=type,status,description"
timestamp : 2026-09-09T12:40:42Z
HTTP      : 200
body      : {"result":[]}
```

**C4  any preview problem marked skip_collision/ignored/skipped on this set (a count reduced by marking is not a zero)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_preview_problem?sysparm_query=remote_update_set=8ebb770493534b1009aa70d19dba102a%5EstatusISNOTEMPTY&sysparm_fields=type,status,description"
timestamp : 2026-09-09T12:40:43Z
HTTP      : 200
body      : {"result":[]}
```

**C5  record state immediately before the commit**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_remote_update_set/8ebb770493534b1009aa70d19dba102a?sysparm_fields=state,error_detail,inserted,summary"
timestamp : 2026-09-09T12:40:43Z
HTTP      : 200
body      : {"result":{"summary":"522","inserted":"522","state":"previewed"}}
```

**Step 4 verdict.** `state=previewed`. **0 `type=error`, 0 `type=warning`, 0 problems of any type at all**
(C3 proves the zero is not an artefact of a type filter), and **no problem row carries a `status`** (C4), so
no count was reduced by marking anything `skip_collision`, `ignored` or `skipped`. The gate's step 4
condition is met on these exact bytes.

---

## D. Step 5 — one commit, through the platform's own *Commit Update Set* UI action

The commit was invoked in a real rendered browser session (Basic-auth REST calls do not mint a UI session,
and on this instance `PATCH {"state":"committing"}` returns HTTP 200 and does nothing while calling
`com.glide.update.UpdateSetCommitAjaxProcessor` directly hits parameter-contract problems). The button was
clicked **exactly once**. No confirmation, licensing, preview-problem or application-install dialog
appeared — the platform's own console recorded `showDialog = false` and `skipping data loss confirm dialog`,
then `running commit on 8ebb770493534b1009aa70d19dba102a`.

**The platform's own verdict, character for character:**

```text
Succeeded 100%
Update set committed - Succeeded in 40 Seconds
```

No subordinate message, no individual failed-update line, no skipped-record counter and no log link
appeared in the result modal; its only control was *Close*. Post-commit `State` on the record form reads
`Committed`, `Committed` timestamp `2026-09-09 05:47:06` (instance-local; the API timestamps in this file
are UTC), and the counts stand at Inserted 522 / Updated 0 / Deleted 0 / Collisions 0 / Total 522 with the
related list showing `Customer Updates (522)`. Zero failed network requests and zero error-severity console
messages during the commit; the one platform warning emitted was
`*** WARNING *** GlideAjax.getXMLWait - synchronous function - processor: UpdateSetCommitAjax`, which is the
platform's own synchronous-call notice and did not interrupt the flow.

This is the condition the earlier attempt failed: its modal read *"Failed at 100% — The update set commit
completed but some updates failed to commit"* because that revision still carried three `sys_user_has_role`
payloads Role Management V2 refuses. Those payloads are absent from these bytes and the verdict is clean.

Retained captures (tracked repository path, not scratch — this is finding F13's requirement):

| Capture | Path |
| --- | --- |
| Authenticated session | `blitzy/screenshots/cr5-regate-01-authenticated.png` |
| Record at `state=previewed`, 522/522, before the click | `blitzy/screenshots/cr5-regate-02-previewed-record.png` |
| Commit in progress (`Running 98%`, `Creating table x_casemgmt_case`) | `blitzy/screenshots/cr5-regate-commit-progress.png` |
| **The platform's verdict modal** | `blitzy/screenshots/cr5-regate-04-commit-result.png` |
| Record after the commit, `State = Committed` | `blitzy/screenshots/cr5-regate-05-record-after-commit.png` |
| Login page as first reached | `blitzy/screenshots/cr5-regate-login.png` |

No `cr5-regate-03-unexpected-dialog.png` exists, because no dialog appeared — that branch did not occur.

Two further captures this run produced are **deliberately not committed** and nothing here cites them:
`blitzy/screenshots/login_signed_out_baseline.png` and `blitzy/screenshots/authenticated_admin_landing.png`,
taken by the dashboard/portal pass as its own login baseline. They duplicate what
`cr5-regate-01-authenticated.png` and `cr5-regate-login.png` already retain, so they are left in the
working tree untracked rather than adding two redundant binaries to the repository. Every capture this file
cites is committed.

---

## E. Step 6 — post-commit census, by direct query

Every count below is read from the instance after the single commit and **before any post-commit action of
any kind** — no script was run, nothing was patched, nothing was granted. That ordering is what makes E14's
`sys_user_has_role = 0` a measurement of what the package delivers rather than of what an operator did
afterwards.

**E1  sys_scope scope=x_casemgmt (expect exactly 1, with a 32-hex sys_id)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=sys_id,scope,name,version"
timestamp : 2026-09-09T13:13:13Z
HTTP      : 200
body      : {"result":[{"sys_id":"82b99028936f74320d74d6f88357a5af","scope":"x_casemgmt","name":"x_casemgmt Case Management","version":"1.0.0"}]}
```

**E2  table x_casemgmt_case (expect HTTP 200)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/x_casemgmt_case?sysparm_count=true"
timestamp : 2026-09-09T13:13:13Z
HTTP      : 200
body      : {"result":{"stats":{"count":"10"}}}
```

**E3  table x_casemgmt_case_task (expect HTTP 200)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/x_casemgmt_case_task?sysparm_count=true"
timestamp : 2026-09-09T13:13:14Z
HTTP      : 200
body      : {"result":{"stats":{"count":"10"}}}
```

**E4  table x_casemgmt_case_party (expect HTTP 200)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/x_casemgmt_case_party?sysparm_count=true"
timestamp : 2026-09-09T13:13:14Z
HTTP      : 200
body      : {"result":{"stats":{"count":"8"}}}
```

**E5  sys_db_object nameLIKEx_casemgmt (expect 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_db_object?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=name,label,sys_id"
timestamp : 2026-09-09T13:13:14Z
HTTP      : 200
body      : {"result":[{"sys_id":"13cae85e938b435009aa70d19dba10e0","name":"x_casemgmt_case","label":"Case"},{"sys_id":"7bca2c5e938b435009aa70d19dba1095","name":"x_casemgmt_case_task","label":"Case Task"},{"sys_id":"c4da2c5e938b435009aa70d19dba10fa","name":"x_casemgmt_case_party","label":"Case Party"}]}
```

**E6  sys_dictionary rows, x_casemgmt_case (expect 21)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_dictionary?sysparm_count=true&sysparm_query=name=x_casemgmt_case"
timestamp : 2026-09-09T13:13:26Z
HTTP      : 200
body      : {"result":{"stats":{"count":"21"}}}
```

**E7  sys_dictionary rows, x_casemgmt_case_task (expect 14)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_dictionary?sysparm_count=true&sysparm_query=name=x_casemgmt_case_task"
timestamp : 2026-09-09T13:13:26Z
HTTP      : 200
body      : {"result":{"stats":{"count":"14"}}}
```

**E8  sys_dictionary rows, x_casemgmt_case_party (expect 13)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_dictionary?sysparm_count=true&sysparm_query=name=x_casemgmt_case_party"
timestamp : 2026-09-09T13:13:26Z
HTTP      : 200
body      : {"result":{"stats":{"count":"13"}}}
```

**E9  sys_documentation rows, x_casemgmt_case (expect 21)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_documentation?sysparm_count=true&sysparm_query=name=x_casemgmt_case"
timestamp : 2026-09-09T13:13:27Z
HTTP      : 200
body      : {"result":{"stats":{"count":"21"}}}
```

**E10 sys_documentation rows, x_casemgmt_case_task (expect 14)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_documentation?sysparm_count=true&sysparm_query=name=x_casemgmt_case_task"
timestamp : 2026-09-09T13:13:27Z
HTTP      : 200
body      : {"result":{"stats":{"count":"14"}}}
```

**E11 sys_documentation rows, x_casemgmt_case_party (expect 13)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_documentation?sysparm_count=true&sysparm_query=name=x_casemgmt_case_party"
timestamp : 2026-09-09T13:13:27Z
HTTP      : 200
body      : {"result":{"stats":{"count":"13"}}}
```

**E12 sys_security_acl nameLIKEx_casemgmt (expect 26)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:13:27Z
HTTP      : 200
body      : {"result":{"stats":{"count":"26"}}}
```

**E13 sys_user_role nameLIKEx_casemgmt (expect 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_role?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=name,sys_id"
timestamp : 2026-09-09T13:13:27Z
HTTP      : 200
body      : {"result":[{"sys_id":"73710b052f274ece1d578c00f4424423","name":"x_casemgmt_case_manager"},{"sys_id":"e3cd650e33c6bfc335732e94683beca1","name":"x_casemgmt_case_viewer"},{"sys_id":"f7c449d22a2944c6e33eddb62ca4d241","name":"x_casemgmt_case_agent"}]}
```

**E14 sys_security_acl_role links on the 3 scoped roles (expect 27 total)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl_role?sysparm_count=true&sysparm_query=sys_user_role.nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:13:38Z
HTTP      : 200
body      : {"result":{"stats":{"count":"27"}}}
```

**E15 role-link split: manager (expect 14)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl_role?sysparm_count=true&sysparm_query=sys_user_role.name=x_casemgmt_case_manager"
timestamp : 2026-09-09T13:13:38Z
HTTP      : 200
body      : {"result":{"stats":{"count":"14"}}}
```

**E16 role-link split: agent (expect 10)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl_role?sysparm_count=true&sysparm_query=sys_user_role.name=x_casemgmt_case_agent"
timestamp : 2026-09-09T13:13:38Z
HTTP      : 200
body      : {"result":{"stats":{"count":"10"}}}
```

**E17 role-link split: viewer (expect 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl_role?sysparm_count=true&sysparm_query=sys_user_role.name=x_casemgmt_case_viewer"
timestamp : 2026-09-09T13:13:39Z
HTTP      : 200
body      : {"result":{"stats":{"count":"3"}}}
```

**E18 sys_choice values across the 3 tables (expect 24)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_choice?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:13:39Z
HTTP      : 200
body      : {"result":{"stats":{"count":"24"}}}
```

**E19 sys_choice_set composites (expect 7)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_choice_set?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:13:39Z
HTTP      : 200
body      : {"result":{"stats":{"count":"7"}}}
```

**E20 sys_choice per field (expect case status 6 / type 2 / priority 4 / pending_reason 3, task type 4 / status 3, party party_type 2)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_choice?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=name,element,value,label&sysparm_limit=30"
timestamp : 2026-09-09T13:13:39Z
HTTP      : 200
body      : {"result":[{"name":"x_casemgmt_case_task","label":"Follow-up","value":"Follow-up","element":"type"},{"name":"x_casemgmt_case_party","label":"Organization","value":"Organization","element":"party_type"},{"name":"x_casemgmt_case_task","label":"Other","value":"Other","element":"type"},{"name":"x_casemgmt_case_task","label":"In Progress","value":"In Progress","element":"status"},{"name":"x_casemgmt_case","label":"Critical","value":"Critical","element":"priority"},{"name":"x_casemgmt_case_task","label":"Closed","value":"Closed","element":"status"},{"name":"x_casemgmt_case","label":"General Inquiry","value":"General Inquiry","element":"type"},{"name":"x_casemgmt_case","label":"Draft","value":"Draft","element":"status"},{"name":"x_casemgmt_case","label":"Awaiting Info","value":"Awaiting Info","element":"pending_reason"},{"name":"x_casemgmt_case","label":"Low","value":"Low","element":"priority"},{"name":"x_casemgmt_case","label":"Medium","value":"Medium","element":"priority"},{"name":"x_casemgmt_case","label":"Complaint","value":"Complaint","element":"type"},{"name":"x_casemgmt_case_party","label":"Person","value":"Person","element":"party_type"},{"name":"x_casemgmt_case_task","label":"Review","value":"Review","element":"type"},{"name":"x_casemgmt_case","label":"Pending","value":"Pending","element":"status"},{"name":"x_casemgmt_case","label":"Resolved","value":"Resolved","element":"sta
```

**E21 sys_number counters for the 3 scoped tables (expect 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_number?sysparm_query=categoryLIKEx_casemgmt&sysparm_fields=prefix,category,maximum_digits"
timestamp : 2026-09-09T13:13:39Z
HTTP      : 200
body      : {"result":[]}
```

*E21 note: `categoryLIKEx_casemgmt` returns nothing because `sys_number.category` is a reference to
`sys_db_object` and the `LIKE` operator does not traverse it. E21a is the correct form and returns the
three counters.*

**E21a sys_number counters, category IN the 3 scoped tables (expect 3: CASE/TASK/PARTY, 7 digits, scope x_casemgmt)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_number?sysparm_query=categoryINx_casemgmt_case,x_casemgmt_case_task,x_casemgmt_case_party&sysparm_fields=prefix,category,maximum_digits,sys_scope"
timestamp : 2026-09-09T13:14:08Z
HTTP      : 200
body      : {"result":[{"prefix":"PARTY","maximum_digits":"7","sys_scope":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope/82b99028936f74320d74d6f88357a5af","value":"82b99028936f74320d74d6f88357a5af"},"category":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_db_object?name=x_casemgmt_case_party","value":"x_casemgmt_case_party"}},{"prefix":"CASE","maximum_digits":"7","sys_scope":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope/82b99028936f74320d74d6f88357a5af","value":"82b99028936f74320d74d6f88357a5af"},"category":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_db_object?name=x_casemgmt_case","value":"x_casemgmt_case"}},{"prefix":"TASK","maximum_digits":"7","sys_scope":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope/82b99028936f74320d74d6f88357a5af","value":"82b99028936f74320d74d6f88357a5af"},"category":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_db_object?name=x_casemgmt_case_task","value":"x_casemgmt_case_task"}}]}
```

**E22 sys_hub_flow in scope x_casemgmt (expect 7: 2 parents + 5 validate subflows), with active/status**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_hub_flow?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,active,status,type&sysparm_limit=10"
timestamp : 2026-09-09T13:14:08Z
HTTP      : 200
body      : {"result":[{"name":"General Inquiry State Machine","active":"true","type":"flow","status":"published"},{"name":"Validate Closed Transition","active":"true","type":"subflow","status":"published"},{"name":"Complaint State Machine","active":"true","type":"flow","status":"published"},{"name":"Validate Open Transition","active":"true","type":"subflow","status":"published"},{"name":"Validate Pending Transition","active":"true","type":"subflow","status":"published"},{"name":"Validate Resolved Transition","active":"true","type":"subflow","status":"published"},{"name":"Validate In Progress Transition","active":"true","type":"subflow","status":"published"}]}
```

**E23 sys_grid_canvas_pane rows on the two scoped canvases (expect 8 - AAP Gate 6, unproven until now)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_grid_canvas_pane?sysparm_count=true&sysparm_query=grid_canvas.sys_scope.scope=x_casemgmt"
timestamp : 2026-09-09T13:14:08Z
HTTP      : 200
body      : {"result":{"stats":{"count":"8"}}}
```

**E24 sys_grid_canvas rows in scope (expect 2)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_grid_canvas?sysparm_count=true&sysparm_query=sys_scope.scope=x_casemgmt"
timestamp : 2026-09-09T13:14:09Z
HTTP      : 200
body      : {"result":{"stats":{"count":"2"}}}
```

**E25 pa_dashboards in scope (expect 2)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/pa_dashboards?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,sys_id,active"
timestamp : 2026-09-09T13:14:09Z
HTTP      : 200
body      : {"result":[{"sys_id":"6459b19ef618e53a07735c38fc6a1d5c","name":"x_casemgmt_manager_view","active":"true"},{"sys_id":"cde4dd9cb243cac3ad196d6a90a678be","name":"x_casemgmt_agent_workspace","active":"true"}]}
```

**E26 sys_report in scope (expect 8)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_report?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=title,type,table&sysparm_limit=10"
timestamp : 2026-09-09T13:14:09Z
HTTP      : 200
body      : {"result":[{"title":"Case Count by Status","type":"donut","table":"x_casemgmt_case"},{"title":"Average Time to Close","type":"single_score","table":"x_casemgmt_case"},{"title":"Cases Opened in Last 30 Days","type":"single_score","table":"x_casemgmt_case"},{"title":"My Overdue Tasks","type":"list","table":"x_casemgmt_case_task"},{"title":"All Cases by Status","type":"bar","table":"x_casemgmt_case"},{"title":"My Open Cases","type":"list","table":"x_casemgmt_case"},{"title":"All Cases by Type","type":"donut","table":"x_casemgmt_case"},{"title":"All Cases by Priority","type":"bar","table":"x_casemgmt_case"}]}
```

**E27 sp_portal in scope (expect 1, url_suffix x_casemgmt_case_portal)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sp_portal?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=title,url_suffix,public,sys_id"
timestamp : 2026-09-09T13:14:23Z
HTTP      : 200
body      : {"result":[{"sys_id":"82079e7877f4f6d09975ab96fc0fa2fa","url_suffix":"x_casemgmt_case_portal","title":"Case Management Portal"}]}
```

**E28 sp_page in scope (expect 2, both public)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sp_page?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=id,title,public"
timestamp : 2026-09-09T13:14:23Z
HTTP      : 200
body      : {"result":[{"public":"true","id":"x_casemgmt_case_submit","title":"Submit a Case"},{"public":"true","id":"x_casemgmt_case_status","title":"Case Status Lookup"}]}
```

**E29 sp_widget in scope (expect 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sp_widget?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=id,name,public"
timestamp : 2026-09-09T13:14:24Z
HTTP      : 200
body      : {"result":[{"public":"true","name":"Case Confirmation Widget","id":"x_casemgmt_case_confirmation_widget"},{"public":"true","name":"Case Submission Widget","id":"x_casemgmt_case_submission_widget"},{"public":"true","name":"Case Lookup Widget","id":"x_casemgmt_case_lookup_widget"}]}
```

**E30 sys_ws_definition in scope (expect 2 scripted REST services)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_ws_definition?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,service_id,active"
timestamp : 2026-09-09T13:14:24Z
HTTP      : 200
body      : {"result":[{"service_id":"case_status_lookup","name":"Case Status Lookup","active":"true"},{"service_id":"case_submit","name":"Case Submit","active":"true"}]}
```

**E31 sys_ws_operation in scope (expect 2, both requires_authentication=false)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_ws_operation?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,http_method,relative_path,requires_authentication,active"
timestamp : 2026-09-09T13:14:24Z
HTTP      : 200
body      : {"result":[{"http_method":"POST","requires_authentication":"false","name":"Case Submit POST","active":"true","relative_path":"/"},{"http_method":"GET","requires_authentication":"false","name":"Case Status Lookup GET","active":"true","relative_path":"/"}]}
```

**E32 sys_rate_limit_rules in scope (expect 2, both on the stock guest user)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_rate_limit_rules?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,active,rate_limit,user"
timestamp : 2026-09-09T13:14:25Z
HTTP      : 200
body      : {"result":[{"name":"x_casemgmt anonymous case status lookup (guest)","active":"true","user":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user/5136503cc611227c0183e96598c4f706","value":"5136503cc611227c0183e96598c4f706"}},{"name":"x_casemgmt anonymous case submit (guest)","active":"true","user":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user/5136503cc611227c0183e96598c4f706","value":"5136503cc611227c0183e96598c4f706"}}]}
```

**E33 demo users (expect 3, synthetic @example.invalid, no last_login data)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user?sysparm_query=user_nameLIKEx_casemgmt_demo&sysparm_fields=user_name,email,last_login,last_login_time,last_login_device"
timestamp : 2026-09-09T13:14:25Z
HTTP      : 200
body      : {"result":[{"last_login_time":"","user_name":"x_casemgmt_demo_agent","last_login":"","last_login_device":"","email":"demo-agent@example.invalid"},{"last_login_time":"","user_name":"x_casemgmt_demo_viewer","last_login":"","last_login_device":"","email":"demo-viewer@example.invalid"},{"last_login_time":"","user_name":"x_casemgmt_demo_manager","last_login":"","last_login_device":"","email":"demo-manager@example.invalid"}]}
```

**E34 demo group + membership (expect 1 group, 1 member)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_grmember?sysparm_query=group.name=x_casemgmt_demo_team&sysparm_fields=group.name,user.user_name"
timestamp : 2026-09-09T13:14:25Z
HTTP      : 200
body      : {"result":[{"group.name":"x_casemgmt_demo_team","user.user_name":"x_casemgmt_demo_agent"}]}
```

**E35 sys_user_has_role for the 3 demo personas x the 3 scoped roles - MEASURED BEFORE ANY POST-COMMIT ACTION (finding F10: the package cannot carry these, expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_has_role?sysparm_query=user.user_nameSTARTSWITHx_casemgmt_demo%5Erole.nameSTARTSWITHx_casemgmt_case&sysparm_fields=user.user_name,role.name,inherited"
timestamp : 2026-09-09T13:14:38Z
HTTP      : 200
body      : {"result":[]}
```

**E36 core_company rows the package writes into the GLOBAL table (finding F09: expect the 2 synthetic orgs)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/core_company?sysparm_query=nameLIKESynthetic%20Org&sysparm_fields=name,sys_id,sys_created_by"
timestamp : 2026-09-09T13:14:39Z
HTTP      : 200
body      : {"result":[{"sys_id":"764f7aa36e02a12f9de6da7d7cf1cf82","name":"Synthetic Org Beta","sys_created_by":"system"},{"sys_id":"d46832bc679ff0254d734c6d4d512315","name":"Synthetic Org Alpha","sys_created_by":"system"}]}
```

**E37 ua_table_licensing_config rows for the 3 scoped tables (finding F09: global table, expect 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/ua_table_licensing_config?sysparm_query=nameINx_casemgmt_case,x_casemgmt_case_task,x_casemgmt_case_party&sysparm_fields=name,sys_id"
timestamp : 2026-09-09T13:14:39Z
HTTP      : 200
body      : {"result":[{"sys_id":"1475935c935f8b1009aa70d19dba10c6","name":"x_casemgmt_case_party"},{"sys_id":"5c75d35c935f8b1009aa70d19dba1006","name":"x_casemgmt_case_task"},{"sys_id":"c475935c935f8b1009aa70d19dba1092","name":"x_casemgmt_case"}]}
```

**E38 case/task linkage: x_casemgmt_case_task rows whose case reference is empty (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/x_casemgmt_case_task?sysparm_count=true&sysparm_query=caseISEMPTY"
timestamp : 2026-09-09T13:14:39Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**E39 case/party linkage: x_casemgmt_case_party rows whose case reference is empty (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/x_casemgmt_case_party?sysparm_count=true&sysparm_query=caseISEMPTY"
timestamp : 2026-09-09T13:14:39Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**E40 Organization parties resolving to a real company (expect 3 rows, none with an empty organization)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case_party?sysparm_query=party_type=Organization&sysparm_fields=case.number,party_type,organization,role_label&sysparm_display_value=all"
timestamp : 2026-09-09T13:14:39Z
HTTP      : 200
body      : {"result":[{"case.number":{"display_value":"CASE9000005","value":"CASE9000005"},"party_type":{"display_value":"Organization","value":"Organization"},"organization":{"display_value":"Synthetic Org Beta","link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/core_company/764f7aa36e02a12f9de6da7d7cf1cf82","value":"764f7aa36e02a12f9de6da7d7cf1cf82"},"role_label":{"display_value":"Respondent","value":"Respondent"}},{"case.number":{"display_value":"CASE9000008","value":"CASE9000008"},"party_type":{"display_value":"Organization","value":"Organization"},"organization":{"display_value":"Synthetic Org Alpha","link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/core_company/d46832bc679ff0254d734c6d4d512315","value":"d46832bc679ff0254d734c6d4d512315"},"role_label":{"display_value":"Respondent","value":"Respondent"}},{"case.number":{"display_value":"CASE9000003","value":"CASE9000003"},"party_type":{"display_value":"Organization","value":"Organization"},"organization":{"display_value":"Synthetic Org Alpha","link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/core_company/d46832bc679ff0254d734c6d4d512315","value":"d46832bc679ff0254d734c6d4d512315"},"role_label":{"display_value":"Respondent","value":"Respondent"}}]}
```

**E41 case status coverage across all six statuses and both types (expect 10 cases: Draft 1/Open 2/In Progress 2/Pending 1/Resolved 2/Closed 2)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case?sysparm_fields=number,type,status,assigned_group,assigned_agent&sysparm_limit=12&sysparm_query=ORDERBYnumber"
timestamp : 2026-09-09T13:14:39Z
HTTP      : 200
body      : {"result":[{"number":"CASE9000001","assigned_group":"","assigned_agent":"","type":"General Inquiry","status":"Draft"},{"number":"CASE9000002","assigned_group":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_group/f5457651a57f6fadb32d3a09f963855b","value":"f5457651a57f6fadb32d3a09f963855b"},"assigned_agent":"","type":"General Inquiry","status":"Open"},{"number":"CASE9000003","assigned_group":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_group/f5457651a57f6fadb32d3a09f963855b","value":"f5457651a57f6fadb32d3a09f963855b"},"assigned_agent":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user/0ca8070bf940abded1aaa84ab389087f","value":"0ca8070bf940abded1aaa84ab389087f"},"type":"General Inquiry","status":"In Progress"},{"number":"CASE9000004","assigned_group":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_group/f5457651a57f6fadb32d3a09f963855b","value":"f5457651a57f6fadb32d3a09f963855b"},"assigned_agent":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user/0ca8070bf940abded1aaa84ab389087f","value":"0ca8070bf940abded1aaa84ab389087f"},"type":"General Inquiry","status":"Pending"},{"number":"CASE9000005","assigned_group":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_group/f5457651a57f6fadb32d3a09f963855b","value":"f5457651a57f6fadb32d3a09f963855b"},"assigned_agent":{"link":"https://dev306
```

**E42 ATF assets recreated by the commit (expect 20 tests, 1 suite, 180 steps)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_atf_test?sysparm_count=true&sysparm_query=sys_scope.scope=x_casemgmt"
timestamp : 2026-09-09T13:14:40Z
HTTP      : 200
body      : {"result":{"stats":{"count":"20"}}}
```

**E43 sys_atf_test_suite + sys_atf_step counts (expect 1 suite, 180 steps)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_atf_step?sysparm_count=true&sysparm_query=test.sys_scope.scope=x_casemgmt"
timestamp : 2026-09-09T13:15:00Z
HTTP      : 200
body      : {"result":{"stats":{"count":"180"}}}
```

**E44 the ATF suite, located BY NAME (its sys_id is new - the commit recreated it)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_atf_test_suite?sysparm_query=name=x_casemgmt%20Case%20Management%20POC&sysparm_fields=name,sys_id,active"
timestamp : 2026-09-09T13:15:00Z
HTTP      : 200
body      : {"result":[{"sys_id":"8e8c6de584ba8f081439ad5ee09ad1a1","name":"x_casemgmt Case Management POC","active":"true"}]}
```

**E45 ua_table_licensing_config: full row set for the 3 scoped tables, with sys_id and creator (finding F09 - the package payloads carry a7c75f44/a7c79f44/bbc79f44)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/ua_table_licensing_config?sysparm_query=nameINx_casemgmt_case,x_casemgmt_case_task,x_casemgmt_case_party&sysparm_fields=name,sys_id,sys_created_by,sys_created_on"
timestamp : 2026-09-09T13:15:00Z
HTTP      : 200
body      : {"result":[{"sys_id":"1475935c935f8b1009aa70d19dba10c6","sys_created_on":"2026-09-08 18:19:13","name":"x_casemgmt_case_party","sys_created_by":"system"},{"sys_id":"5c75d35c935f8b1009aa70d19dba1006","sys_created_on":"2026-09-08 18:19:14","name":"x_casemgmt_case_task","sys_created_by":"system"},{"sys_id":"c475935c935f8b1009aa70d19dba1092","sys_created_on":"2026-09-08 18:19:13","name":"x_casemgmt_case","sys_created_by":"system"}]}
```

**E46 finding F05 assertion 1/2: Flow Designer compiled execution-plan rows the package references but does not carry - sys_flow_subflow_plan snapshots referenced by the 18**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_flow_subflow_plan?sysparm_count=true"
timestamp : 2026-09-09T13:15:00Z
HTTP      : 200
body      : {"result":{"stats":{"count":"255"}}}
```

**E47 finding F05 assertion 2/2: the 7 sys_hub_flow_snapshot definitions the package DOES carry, in scope (expect 7)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_hub_flow_snapshot?sysparm_count=true&sysparm_query=flow.sys_scope.scope=x_casemgmt"
timestamp : 2026-09-09T13:15:01Z
HTTP      : 200
body      : {"result":{"stats":{"count":"336"}}}
```

**E48 sys_script (business rules) in scope (expect 7 - finding F02: the repository holds 12)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_script?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,collection,when,active&sysparm_limit=15"
timestamp : 2026-09-09T13:15:01Z
HTTP      : 200
body      : {"result":[{"name":"x_casemgmt_clear_pending_reason_on_inpro","active":"true","collection":"x_casemgmt_case","when":"before"},{"name":"x_casemgmt_block_terminal_closed","active":"true","collection":"x_casemgmt_case","when":"before"},{"name":"x_casemgmt_block_draft_backtransition","active":"true","collection":"x_casemgmt_case","when":"before"},{"name":"x_casemgmt_validate_assigned_agent_membe","active":"true","collection":"x_casemgmt_case","when":"before"},{"name":"x_casemgmt_set_opened_date","active":"true","collection":"x_casemgmt_case","when":"before"},{"name":"x_casemgmt_enforce_forward_transitions","active":"true","collection":"x_casemgmt_case","when":"before"},{"name":"x_casemgmt_set_closed_date","active":"true","collection":"x_casemgmt_case","when":"before"}]}
```

**E49 sys_script_client in scope (expect 0 - finding F02: the repository holds 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_script_client?sysparm_count=true&sysparm_query=sys_scope.scope=x_casemgmt"
timestamp : 2026-09-09T13:15:01Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**E50 sys_security_acl operation=query_range in scope (expect 0 - finding F02: the repository holds 3)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl?sysparm_count=true&sysparm_query=sys_scope.scope=x_casemgmt%5EoperationLIKEquery_range"
timestamp : 2026-09-09T13:15:02Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

*E47 note: `flow.sys_scope.scope=x_casemgmt` is not a valid dotted path on `sys_hub_flow_snapshot`, so the
platform ignored the filter and returned an instance-wide count. E47a is the correct form.*

**E47a sys_hub_flow_snapshot rows the scope owns (expect 7 - one per flow, all carried by the package)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_hub_flow_snapshot?sysparm_count=true&sysparm_query=sys_scope.scope=x_casemgmt"
timestamp : 2026-09-09T13:16:06Z
HTTP      : 200
body      : {"result":{"stats":{"count":"7"}}}
```

**E51 finding F05 census assertion: do the 8 execution-plan snapshot ids the package references resolve on this instance? (measured: none of them do)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_hub_flow_snapshot?sysparm_query=sys_idIN278c032993ea0710830ef82bdd03d650,cad133a193224710830ef82bdd03d655,e2d133a193224710830ef82bdd03d6a7,cce173a193224710830ef82bdd03d694,59d1ff6193224710830ef82bdd03d6f9,03d173a193224710830ef82bdd03d61e,29d2bfe193224710830ef82bdd03d6f7,b4da7be193624710830ef82bdd03d631&sysparm_fields=sys_id,name"
timestamp : 2026-09-09T13:16:06Z
HTTP      : 200
body      : {"result":[]}
```

**E52 finding F05 census assertion: the 9th referenced id, the shared logic block 62b45329932e0710830ef82bdd03d6ff (measured: does not resolve)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_hub_flow_block?sysparm_query=sys_id=62b45329932e0710830ef82bdd03d6ff&sysparm_fields=sys_id,name"
timestamp : 2026-09-09T13:16:06Z
HTTP      : 200
body      : {"result":[]}
```

**E53 the 7 flows, with active state and publication status (the definitions themselves are complete)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_hub_flow?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,active,status&sysparm_limit=10"
timestamp : 2026-09-09T13:16:06Z
HTTP      : 200
body      : {"result":[{"name":"General Inquiry State Machine","active":"true","status":"published"},{"name":"Validate Closed Transition","active":"true","status":"published"},{"name":"Complaint State Machine","active":"true","status":"published"},{"name":"Validate Open Transition","active":"true","status":"published"},{"name":"Validate Pending Transition","active":"true","status":"published"},{"name":"Validate Resolved Transition","active":"true","status":"published"},{"name":"Validate In Progress Transition","active":"true","status":"published"}]}
```

*E32 note: `rate_limit`, `api_id` and `resource` are not fields of `sys_rate_limit_rules`; the platform
returned `null` for each because they do not exist. E32a uses the table's real columns.*

**E32a sys_rate_limit_rules in scope, real columns (expect 2: lookup 240 req/hr, submit 60 req/hr, both bound to the stock guest user)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_rate_limit_rules?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,active,requests,api,api_resource,type,user"
timestamp : 2026-09-09T13:17:23Z
HTTP      : 200
body      : {"result":[{"name":"x_casemgmt anonymous case status lookup (guest)","active":"true","requests":"240","api":"Case Status Lookup","type":"User","api_resource":"GET /x_casemgmt/case_status_lookup","user":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user/5136503cc611227c0183e96598c4f706","value":"5136503cc611227c0183e96598c4f706"}},{"name":"x_casemgmt anonymous case submit (guest)","active":"true","requests":"60","api":"Case Submit","type":"User","api_resource":"POST /x_casemgmt/case_submit","user":{"link":"$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user/5136503cc611227c0183e96598c4f706","value":"5136503cc611227c0183e96598c4f706"}}]}
```

---

## F. Step 6b — the documented §5h post-commit grant step, and its verification

The census above measured `sys_user_has_role = 0` (E35) **before** this step, so what the package delivers
and what an operator adds afterwards are separately established. This step is the deliverable's own
documented post-commit action — `HUMAN_DEPLOYMENT_RECREATE_GUIDE.md` §5h — and it is mandatory on every
install because `sys_user_has_role` is owned by Role Management V2 on this release and the update-set loader
skips the row.

The route taken is §5h's own scripted alternative: the repository's `scripts/seed_demo_data.js`, run
unmodified **in scope `x_casemgmt`** through `/sys.scripts.do`, with the scope `sys_id` **re-queried from
the instance** rather than carried over (`GET /api/now/table/sys_scope?sysparm_query=scope=x_casemgmt` →
`82b99028936f74320d74d6f88357a5af`, verified 32-hex). No Global session was used for any write in this
re-gate.

```text
GET  /login.do -> 72-char sysparm_ck ; POST /login.do (sysverb_login) -> HTTP 302
GET  /sys.scripts.do -> HTTP 200, fresh 72-char sysparm_ck
POST /sys.scripts.do
       script@servicenow-case-management-poc/scripts/seed_demo_data.js
       sysparm_ck=<fresh token>   sys_scope=82b99028936f74320d74d6f88357a5af
       runscript=Run script
     started  2026-09-09T13:17:24Z
     returned HTTP 200 in 0.770 s
     finished 2026-09-09T13:17:25Z
     response contains: "Script completed in scope x_casemgmt"
```

The script's own `syslog` output, source `x_casemgmt`, 2026-09-09 13:17:25:

```text
Phase A: ensuring 3 demo users.
Phase B: ensuring 1 demo group and 1 group membership.
Phase C role grants: inserted=3 already_present=0 unresolved=0 | scoped-role grants now held by demo personas=3 of 3 expected.
Phase D: ensuring 10 demo cases.
Phase E: ensuring 10 demo tasks.
```

`inserted=3 … unresolved=0` is the measurement finding F10 asks for: the grants did not exist and now do.
The three scoped table row counts are unchanged by the run — 10 / 10 / 8 before and after — so the step
added the grants and altered no demo data.

**F1  sys_user_has_role, the acceptance form: the 3 demo personas x the 3 scoped roles (pass condition: EXACTLY 3, inherited=false)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_has_role?sysparm_query=user.user_nameSTARTSWITHx_casemgmt_demo%5Erole.nameSTARTSWITHx_casemgmt_case&sysparm_fields=user.user_name,role.name,inherited"
timestamp : 2026-09-09T13:18:02Z
HTTP      : 200
body      : {"result":[{"role.name":"x_casemgmt_case_manager","inherited":"false","user.user_name":"x_casemgmt_demo_manager"},{"role.name":"x_casemgmt_case_viewer","inherited":"false","user.user_name":"x_casemgmt_demo_viewer"},{"role.name":"x_casemgmt_case_agent","inherited":"false","user.user_name":"x_casemgmt_demo_agent"}]}
```

**F2  sys_user_has_role, all rows for the demo personas (the platform's own inherited=true companions are its bookkeeping, not demo grants)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_has_role?sysparm_query=user.user_nameSTARTSWITHx_casemgmt_demo&sysparm_fields=user.user_name,role.name,inherited,sys_created_by"
timestamp : 2026-09-09T13:18:02Z
HTTP      : 200
body      : {"result":[{"role.name":"x_casemgmt_case_manager","inherited":"false","sys_created_by":"$SERVICENOW_INSTANCE_ADMIN_USERNAME","user.user_name":"x_casemgmt_demo_manager"},{"role.name":"snc_required_script_writer_permission","inherited":"true","sys_created_by":"system","user.user_name":"x_casemgmt_demo_manager"},{"role.name":"x_casemgmt_case_viewer","inherited":"false","sys_created_by":"$SERVICENOW_INSTANCE_ADMIN_USERNAME","user.user_name":"x_casemgmt_demo_viewer"},{"role.name":"snc_required_script_writer_permission","inherited":"true","sys_created_by":"system","user.user_name":"x_casemgmt_demo_viewer"},{"role.name":"x_casemgmt_case_agent","inherited":"false","sys_created_by":"$SERVICENOW_INSTANCE_ADMIN_USERNAME","user.user_name":"x_casemgmt_demo_agent"},{"role.name":"snc_required_script_writer_permission","inherited":"true","sys_created_by":"system","user.user_name":"x_casemgmt_demo_agent"}]}
```

**F3  row counts unchanged after the grant step: x_casemgmt_case (expect 10)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/x_casemgmt_case?sysparm_count=true"
timestamp : 2026-09-09T13:18:02Z
HTTP      : 200
body      : {"result":{"stats":{"count":"10"}}}
```

**F4  no stock role was granted to any demo persona or scoped role (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_user_has_role?sysparm_count=true&sysparm_query=user.user_nameSTARTSWITHx_casemgmt_demo%5Erole.nameINitil,admin,security_admin,sn_incident_read"
timestamp : 2026-09-09T13:18:02Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

---

## G. Step 7, part 1 — the 13-assertion transition harness, run fresh against this commit

Run in scope `x_casemgmt` with the **re-queried** scope `sys_id` (a Global run fails every assertion,
because `CaseTransitionValidator` is package-private):

```text
POST /sys.scripts.do
       script@servicenow-case-management-poc/scripts/transition_logic_regression_assertions.js
       sysparm_ck=<fresh 72-char token>   sys_scope=82b99028936f74320d74d6f88357a5af
     started  2026-09-09T13:18:14Z   returned HTTP 200 in 0.822 s   finished 2026-09-09T13:18:15Z
     response contains: "Script completed in scope x_casemgmt"
```

Result read from `syslog` (`messageSTARTSWITHU1ASSERT`, newest first), created **2026-09-09 13:18:15**:

```text
U1ASSERT|TOTAL=13 PASSED=13 FAILED=0 |CLEANUP tasks=4 cases=7 remainingCases=10
PASS A1 canTransitionToOpen blocks empty assigned_group (verbatim)
       expected="{"ok":false,"error":"Required field assigned_group is empty."}"  actual= identical
PASS A2 canTransitionToOpen allows populated assigned_group
PASS A3 canTransitionToInProgress blocks empty assigned_agent (verbatim)
       expected="{"ok":false,"error":"Assigned agent must be set and must be a member of the assigned group."}"  actual= identical
PASS A4 canTransitionToInProgress blocks agent not in assigned_group (verbatim)
PASS A5 canTransitionToInProgress allows agent who is a member of assigned_group
PASS A6 canTransitionToResolved blocks while 1 child task is Open (verbatim)
       expected="{"ok":false,"error":"All tasks must be closed before resolving this case."}"  actual= identical
PASS A7 canTransitionToResolved allows once every child task is Closed
       (A8-A13 likewise PASS; TOTAL=13 PASSED=13 FAILED=0 is the harness's own summary)
```

`CLEANUP … remainingCases=10` shows the harness removed its own fixtures and left the ten demo cases.
This is a **fresh** result for the shipping bytes; the previous harness pass (2026-09-08 22:17:27, the same
13/13) measured the superseded revision's artifacts and is superseded as evidence for this file.

**This result also settles the functional consequence of finding F05.** The eighteen references to
Flow Designer's compiled execution-plan rows are measurably dangling on this instance — all nine distinct
target ids resolve to nothing (E51, E52) — and the transition logic they belong to nonetheless passes all
thirteen assertions, because the platform recompiles those rows from the seven `sys_hub_flow_snapshot`
definitions the package does carry (E47a) and all seven flows are `active` and `published` (E53).

---

## H. Step 6, part 2 — both dashboards rendered, in a browser, with data (AAP §0.7.3 Gate 6)

Gate 6 was **unproven on every prior revision**: the gated revision installed with `sys_grid_canvas_pane`
= 0, so each canvas would have rendered empty, and the eight pane rows in these bytes had only ever been
verified statically. E23 measured all eight landing on this commit; the renders below are the first
observation of the dashboards actually drawing them.

**Agent Workspace** (`/$pa_dashboard.do?sysparm_dashboard=cde4dd9cb243cac3ad196d6a90a678be`) — 3 of 3
widgets rendered:

| Widget | Type | What it displayed |
| --- | --- | --- |
| My Open Cases | list | Table with columns Number · Subject · Priority · Status · Opened Date; **0 rows**, empty state `No records to display`. Legitimate: the report filters on the logged-in user and the demo cases are assigned to a demo persona, not to the signed-in administrator account. The widget itself rendered fully — it is not a broken report reference |
| My Overdue Tasks | list | Table with columns Subject · Case · Due Date · Status; **0 rows**, same legitimate current-user filter |
| Case Count by Status | donut | Closed 2 (20.0%) · In Progress 2 (20.0%) · Open 2 (20.0%) · Resolved 2 (20.0%) · Draft 1 (10.0%) · Pending 1 (10.0%) — total **10**, matching the seeded distribution exactly |

**Manager View** (`/$pa_dashboard.do?sysparm_dashboard=6459b19ef618e53a07735c38fc6a1d5c`) — 5 of 5 widgets
rendered, every one with data:

| Widget | Type | What it displayed |
| --- | --- | --- |
| All Cases by Status | bar | Closed 2 · In Progress 2 · Open 2 · Resolved 2 · Draft 1 · Pending 1 (six non-zero bars, total 10) |
| All Cases by Type | donut | General Inquiry 6 (60.0%) · Complaint 4 (40.0%) |
| All Cases by Priority | bar | High 3 · Medium 3 · Critical 2 · Low 2 (four non-zero bars, total 10) |
| Average Time to Close | single score | **16 Days 8 Hours 0 Minutes** |
| Cases Opened in Last 30 Days | single score | **8** |

No widget showed a loading placeholder, a generic no-data state, an error, or a broken/missing report
reference. Zero console errors and zero failed network requests on either dashboard (59 and 56 requests,
all HTTP 200/201).

Portal, in a browser context proved to hold no session (loading `/login.do` in it showed the signed-out
form):

- `\?id=x_casemgmt_case_submit` rendered while signed out, with exactly the five specified inputs —
  `Subject *`, `Type *` (options `-- Select a type --` / `General Inquiry` / `Complaint`), `Description *`,
  `Your Name *`, `Email` — and a disabled Submit until the mandatory fields are complete. The form was not
  submitted.
- `\?id=x_casemgmt_case_status` looked up `CASE9000002` and returned **exactly three fields**: Status
  `Open`, Subject `Demo case 02: Open (General Inquiry)`, Opened Date `2026-09-08 18:58:04`. Nothing else —
  no description, requester name, requester email, assigned group, assigned agent, closed date or audit
  value. `GET /api/x_casemgmt/case_status_lookup?number=CASE9000002` → HTTP 200.
- The same page looked up `CASE0000000` and rendered, character for character,
  **`No case found with that number.`** The endpoint answered HTTP 404, which the widget converted into
  that message.

Retained captures (tracked repository path):

| Capture | Path |
| --- | --- |
| Agent Workspace dashboard | `blitzy/screenshots/cr5-regate-06-dashboard-agent-workspace.png` |
| Manager View dashboard | `blitzy/screenshots/cr5-regate-07-dashboard-manager-view.png` |
| Portal submission page, signed out | `blitzy/screenshots/cr5-regate-08-portal-submit-signed-out.png` |
| Portal lookup, valid number | `blitzy/screenshots/cr5-regate-09-portal-lookup-found.png` |
| Portal lookup, unknown number | `blitzy/screenshots/cr5-regate-10-portal-lookup-notfound.png` |

---

## I. Step 7, part 2 — the ATF suite, run fresh in a real browser against this commit

Headless ATF is disabled on this instance (`sn_atf.headless.enabled=false`), so the suite was driven through
a real client-side test runner: an administrator UI session → the suite record (located at the `sys_id` the package
pins, `8e8c6de584ba8f081439ad5ee09ad1a1`, name `x_casemgmt Case Management POC`, Active true, 20 tests in
its related list) → **Run Test Suite** → *Start a new test runner* → the runner tab held open until the run
finished. Run once.

| | |
| --- | --- |
| Suite result | **`TES0001007`** (`sys_id` `2f50a71493df8b1009aa70d19dba1090`) |
| Created | **2026-09-09 13:35:06 UTC** (the UI showed local `06:35:06`) |
| Ran | 13:35:06 → 13:37:28 UTC, stored run time 2 min 22 s |
| Status | **Success** |
| Tests | **20 Success · 0 Failure · 0 Error · 0 Skipped** |
| Steps | **180 = 180 Success + 0 Failure + 0 Error + 0 Skipped** |

All twenty tests passed: ATF 01 (data model per §0.5.7) · ATF 02-07 (the RBAC matrix, including
assigned-only agent access and the task/party mirror) · ATF 08-14 (every state transition and both
prohibited transitions) · ATF 15-17 (the form-level blocking behaviour) · ATF 18-20 (the anonymous portal
contract: submit returns 201 with the new number, lookup returns only status/subject/opened_date, unknown
number returns 404 with the verbatim message). There is no failing step and no failure message to
transcribe.

Two prior results are superseded as evidence for these bytes and are retained only as provenance of other
revisions: `TES0001005` (17 Success / 3 Failure) and `TES0001006` (4 Success / 16 Failure). **The three
failures the project's documents record as known — ATF 17's Closed-case form lock, and ATF 18 / ATF 19's
`opened_date` character-for-character assertions — did not recur in this run**, and `TES0001006`'s sixteen
failures did not either: their single root cause was the demo personas holding no roles, and §5h's grant
step ran before this suite exactly as the deployment guide now instructs.

Retained captures: `blitzy/screenshots/cr5-regate-11-atf-suite-record.png`,
`cr5-regate-12-atf-runner-connected.png`, `cr5-regate-13-atf-suite-result-summary.png`,
`cr5-regate-14-atf-per-test-results.png`. No `cr5-regate-15-atf-failure-detail.png` exists because there
was no failure to detail.

Diagnostics: zero error-severity console messages in the runner and no HTTP 4xx/5xx during the run. Six
`net::ERR_ABORTED` entries appear in the three form tests (ATF 15-17) on `POST /xmlhttp.do` and
`GET /x_casemgmt_case.do`; they are navigation cancellations from ATF's own form submits, the surrounding
submissions returned 302 and the destination documents 200, and all three tests passed.

---

## J. Security row S5 — the anonymous rate-limit rules' measured effect

S5 asked for the native rate-limit rules' effect to be measured rather than assumed. It was, and **the
measurement is negative: the rules count but do not enforce.**

Both rules install active and correctly parameterised — `x_casemgmt anonymous case status lookup (guest)`
at **240** requests and `x_casemgmt anonymous case submit (guest)` at **60**, `type=User`, `user=guest`
(E32a). The platform **is** matching traffic to them: `sys_rate_limit_count` holds a row per rule for the
guest user, and after the probe below the lookup rule's row read `request_count = 309` for
`count_start = 2026-09-09 13:00:00` — comfortably past its 240 ceiling.

The probe, unauthenticated, no cookies, single source:

```text
for i in 1..300:  GET $SERVICENOW_INSTANCE_ADMIN_URL/api/x_casemgmt/case_status_lookup?number=CASE9000002
     started 2026-09-09T13:49:06Z   finished 2026-09-09T13:49:45Z   (39 s)
     status distribution: 300 x HTTP 200        <- zero 429
     the 301st request also returned HTTP 200 with the normal whitelisted body:
       {"result":{"status":"Open","subject":"Demo case 02: Open (General Inquiry)","opened_date":"2026-09-08 18:58:04"}}
```

So the measured ceiling on this release, for anonymous scripted-REST traffic, is **no ceiling**: 309
requests in one hour against a 240-request rule produced no HTTP 429 and no throttling of any kind. The
platform offers no violation table and `sys_rate_limit_rules` carries no enforce/monitor flag to explain it;
what is measurable is that `api` and `api_resource` are **choice** columns whose stored values here are the
display labels `Case Status Lookup` and `GET /x_casemgmt/case_status_lookup` rather than the platform's own
resource keys, so the resource half of each rule binds to nothing and only its `user` half participates.

Consequence to record rather than repair: the effective control on the anonymous surface is the script-side
guard inside `CasePortalService` (whose own concurrency and cookie-rotation residue is already disclosed),
and the native rule is a **monitor, not a perimeter**. Correcting it means re-authoring the two rules at
source with the platform's own resource binding and re-exporting — a source-side change that this
checkpoint's byte-stability constraint (the gate must prove the exact shipping bytes) puts out of reach.

**J1  sys_rate_limit_count after the probe (the lookup rule counted 309 requests in the 13:00 hour against its 240 ceiling)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_rate_limit_count?sysparm_fields=rate_limit_rule,user,count_start,request_count,sys_created_by&sysparm_exclude_reference_link=true"
timestamp : 2026-09-09T13:52:07Z
HTTP      : 200
body      : {"result":[{"count_start":"2026-09-09 13:00:00","user":"5136503cc611227c0183e96598c4f706","sys_created_by":"guest","rate_limit_rule":"55e38d54edf281eb97d455a75b11ac93","request_count":"309"},{"count_start":"2026-09-09 13:00:00","user":"5136503cc611227c0183e96598c4f706","sys_created_by":"guest","rate_limit_rule":"e10d202203fa5a85dd185af381502031","request_count":"2"}]}
```

**K1  teardown guard: sys_scope scope=x_casemgmt must return EXACTLY ONE record with a well-formed 32-character hexadecimal sys_id**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=sys_id,scope,name,version"
timestamp : 2026-09-09T13:52:08Z
HTTP      : 200
body      : {"result":[{"sys_id":"82b99028936f74320d74d6f88357a5af","scope":"x_casemgmt","name":"x_casemgmt Case Management","version":"1.0.0"}]}
```

---

## K. Step 8 — teardown, behind the line-34 guard, and the zero-state re-verification

The directive's line-34 guard was applied **fresh for this teardown**, in code, before any delete: the
`sys_scope` query had to return **exactly one** record **and** a well-formed 32-character hexadecimal
`sys_id`, evaluated as `records==1 && sys_id =~ ^[0-9a-f]{32}$`, with the delete unreachable otherwise.

```text
guard evaluated 2026-09-09T13:52:2xZ
  records = 1
  sys_id  = 82b99028936f74320d74d6f88357a5af
  32-hex  = yes
  -> GUARD PASSED, proceeding

GET  /sys_remote_update_set.do?sys_id=8ebb7704...  -> HTTP 200, fresh 72-char sysparm_ck
POST /xmlhttp.do
       sysparm_processor=com.snc.apps.AppsAjaxProcessor
       sysparm_function=deleteApplication
       sysparm_sys_id=82b99028936f74320d74d6f88357a5af     <- the value the guard just validated
       sysparm_delete_all=true
       sysparm_ck=<fresh token>
     started  2026-09-09T13:52:23Z   -> HTTP 200, worker id 7c542b509313cb1009aa70d19dba10c3
     scope-gone polling: 13:52:32Z scope=1 endpoint=200 · 13:52:53Z scope=1 endpoint=400
                         13:53:48Z scope=0 endpoint=400   <- cascade complete in ~85 s
```

**Explicit removal ledger** — what the cascade did not take, removed by hand and named individually:

| Class | Records | How |
| --- | --- | --- |
| `sys_remote_update_set` — this run's own retrieved set `8ebb770493534b1009aa70d19dba102a` | 1 | Table API `DELETE` → HTTP 204; its **522** `sys_update_xml` children went with it (re-queried: 0) |
| `sys_update_set` — the Local set the commit left, `d0659b1c935f8b1009aa70d19dba10fe`, state `ignore` | 1 | Table API `DELETE` answers **HTTP 403** on this table (its ACLs carry `admin_overrides=false`), so removed with `GlideRecord` + `setWorkflow(false)` + `autoSysFields(false)`, addressed by a name query rather than a literal, with a guard refusing any `state=complete` set and restricting the delete to sets inside the measured set *(guard description corrected 2026-09-10, QA4 F11: it named an out-of-boundary descriptor's id as the second guard term)*. `syslog`: `U1TEARDOWN sys_update_set found=1 removed=1 kept= remaining_like_x_casemgmt=0` |
| `sys_user` — the three demo personas | 3 | Table API `DELETE` → HTTP 204 ×3 (`x_casemgmt_demo_agent`, `…_viewer`, `…_manager`) |
| `sys_user_group` — `x_casemgmt_demo_team` | 1 | Table API `DELETE` → HTTP 204 |
| `core_company` — `Synthetic Org Beta` (`764f7aa3…`), `Synthetic Org Alpha` (`d46832bc…`) | 2 | Table API `DELETE` → HTTP 204 ×2. **These are the two global rows finding F09 is about**: the commit created them, so the teardown had to remove them by hand |
| `sys_user_has_role` — the three §5h grants and their inherited companions | 0 remaining | Went with the users and the roles; re-queried as 0 |
| `sys_choice` / `sys_choice_set` / `sys_number` / `ua_table_licensing_config` | 0 remaining | Taken by the scope cascade on this release; re-queried individually as 0 rather than assumed |

The one write in this teardown that ran from a **Global** session is the `sys_update_set` removal, and
`sys_update_set` is a global table — the correct session for it. Nothing scoped was written from a Global
session at any point in this re-gate: the two script runs that touched application data
(`seed_demo_data.js`, the transition harness) both ran with `sys_scope=82b99028936f74320d74d6f88357a5af`
and both answered `Script completed in scope x_casemgmt`.

### The thirteen zero-state checks, re-run from the top

**K2  sys_scope scope=x_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=sys_id,scope"
timestamp : 2026-09-09T13:55:59Z
HTTP      : 200
body      : {"result":[]}
```

**K3  table endpoint x_casemgmt_case (expect HTTP 400)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case?sysparm_limit=1"
timestamp : 2026-09-09T13:55:59Z
HTTP      : 400
body      : {"error":{"message":"Invalid table x_casemgmt_case","detail":null},"status":"failure"}
```

**K4  table endpoint x_casemgmt_case_task (expect HTTP 400)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case_task?sysparm_limit=1"
timestamp : 2026-09-09T13:55:59Z
HTTP      : 400
body      : {"error":{"message":"Invalid table x_casemgmt_case_task","detail":null},"status":"failure"}
```

**K5  table endpoint x_casemgmt_case_party (expect HTTP 400)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/x_casemgmt_case_party?sysparm_limit=1"
timestamp : 2026-09-09T13:55:59Z
HTTP      : 400
body      : {"error":{"message":"Invalid table x_casemgmt_case_party","detail":null},"status":"failure"}
```

**K6  sys_user_role nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user_role?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=name"
timestamp : 2026-09-09T13:55:59Z
HTTP      : 200
body      : {"result":[]}
```

**K7  sys_db_object + sys_dictionary nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_dictionary?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:55:59Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**K8  sys_security_acl + sys_security_acl_role (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_security_acl?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:56:00Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**K9  sys_choice + sys_choice_set nameLIKEx_casemgmt (expect 0 - the class the directive added because it survives a scope delete)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_choice?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:56:16Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**K10 sys_choice_set nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_choice_set?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:56:16Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**K11 sys_number counters for the 3 scoped tables (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_number?sysparm_query=categoryINx_casemgmt_case,x_casemgmt_case_task,x_casemgmt_case_party&sysparm_fields=prefix,category"
timestamp : 2026-09-09T13:56:16Z
HTTP      : 200
body      : {"result":[]}
```

**K12 sys_update_set nameLIKEx_casemgmt (expect 0 - this run's Local set removed explicitly)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_set?sysparm_query=nameLIKEx_casemgmt&sysparm_fields=name,state,sys_id"
timestamp : 2026-09-09T13:56:17Z
HTTP      : 200
body      : {"result":[]}
```

**CORRECTED 2026-09-09 (QA Delta QA1 — Issue 1 / 2 / 3 / 4). The heading's parenthetical "(expect 0 -
this run's Local set removed explicitly)" is materially wrong, and the empty body above is a true answer to
the wrong question.** The `{"result":[]}` stands: `nameLIKEx_casemgmt` on `sys_update_set` returned 0 at
13:56:17Z and returned 0 at every moment before and after it. What that predicate cannot do is see the set
this run actually left, because the platform named it **`Default`** — a Local set generated by the platform
carries the platform's own name, never the application's, so a name filter on the scope prefix can never
match it however many times it is re-run. The set was bound to the scope by `application`, not by name:

| Property | Value |
| --- | --- |
| `sys_id` | `b65dd39c939f8b1009aa70d19dba10e4` |
| `name` | `Default` — hence invisible to `nameLIKEx_casemgmt` |
| `state` | `ignore` |
| `application` | `82b99028936f74320d74d6f88357a5af` — the scope the cascade had just destroyed |
| `sys_created_on` / `sys_updated_on` | 2026-09-09 13:21:58 / 13:53:51 — the update falls **inside** the cascade window (13:52:23Z→13:53:48Z) |
| `sys_update_xml` children | **448**, created 13:23:14→13:53:45 |
| of those, `x_casemgmt`-named | **73** — 30 Dictionary · 30 Field Label · 7 Choice list · 5 List Layout · 1 Related Lists |

The cause is the `deleteApplication` cascade itself: the platform captured **its own deletions** into the
scope's Local set while removing the application, so a teardown that verifies only by name records a zero
while the payloads it is meant to have removed accumulate under a platform-generated name. A **449th**
task-owned `sys_update_xml` row sat outside that set entirely —
`46a4a3549313cb1009aa70d19dba10c2`, name `sys_app_82b99028936f74320d74d6f88357a5af`, type
`Custom Application`, action `DELETE`, `target_name` `x_casemgmt Case Management`, created 13:53:51 —
captured into the **global** `Default` set `11226d84a56503108bb220b7a4d212b2`. That is the cascade
recording its own DELETE, and it is the same class the 2026-09-08 teardown needed three passes to find
(`CONSOLIDATION-FINAL-REPORT.md` §6 of the Step 8 section).

The corrected predicate selects by scope binding rather than by name, and it is what K21 below now runs:

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_set?sysparm_query=application=82b99028936f74320d74d6f88357a5af&sysparm_fields=sys_id,name,state,application"
timestamp : 2026-09-09T16:28:47Z   (after the removal recorded at the verdict below)
HTTP      : 200
body      : {"result":[]}
```

The set, its 448 children and the stray global capture were removed on 2026-09-09 between 16:27:46Z and
16:28:12Z; a direct existence query
`sys_update_set?sysparm_query=sys_id=b65dd39c939f8b1009aa70d19dba10e4` now answers `{"result":[]}`, and
the global `Default` set `11226d84…` went from 291 children to 290 — only the one stray `sys_app` capture
row was taken from it. Both predicates — this one and the original `nameLIKEx_casemgmt` — read **0** at
16:28:47Z, again at ~16:36Z and a third time in the platform UI.

**K13 sys_remote_update_set, records belonging to this run (expect 0 — the retrieved set was deleted)**

```text
timestamp : 2026-09-09T13:56:17Z
HTTP      : 200
measured-set result : 0 records
```

*(CORRECTED 2026-09-10, QA Delta QA4, finding F11: this check was run unfiltered, so its heading named a
pre-existing record's identifier and its body published that record's `sys_id`, `sys_created_on`, name,
state and `sys_updated_on`. The command and the body are **removed** and are not reproduced. What the
check establishes is the measured-set figure above — this run's own Retrieved Update Set no longer exists,
which is what the teardown had to prove — and that is corroborated by the ledger entry for its deletion
in the removal table above and by K14's direct count of its children at 0. Same deliberate loss of one
verbatim capture as at A13, for the same reason; K1-K12 and K15-K30 keep theirs in full.)*

**K14 sys_update_xml owned by this run's descriptor (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_xml?sysparm_count=true&sysparm_query=remote_update_set=8ebb770493534b1009aa70d19dba102a"
timestamp : 2026-09-09T13:56:17Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**CORRECTED 2026-09-09 (QA Delta QA1 — Issue 1 / 2 / 3 / 4). The count is right and the scope of the
check is too narrow to support the conclusion drawn from it.** `remote_update_set=8ebb7704…` asks only
whether the **retrieved** set this run uploaded still owns any payload rows; it is structurally blind to
payload rows captured into a **Local** set, which carry no `remote_update_set` reference at all. The 448
rows described at the K12 correction above, and the 449th stray row in the global `Default` set, were
therefore invisible to this check while it returned 0. A task-owned `sys_update_xml` count has to be taken
over the measured set, by scope binding and by name:

```text
check     : task-owned sys_update_xml, by scope binding (application = <scope>)
timestamp : 2026-09-09T16:28:47Z   (after the removal recorded at the verdict below)
HTTP      : 200
measured-set result : 0 rows

check     : the same class, task-owned, matched by name (nameLIKEx_casemgmt)
timestamp : 2026-09-09T16:28:47Z   (after the removal recorded at the verdict below)
HTTP      : 200
measured-set result : 0 rows
```

Both read **0** at 16:28:47Z and again at ~16:36Z. (The platform-UI confirmation covers the removed set's
own children — "Filtered Customer Updates list showing 0 records" for `update_set=b65dd39c…` — rather than
these two task-owned predicates, which are REST-only.)

**Why the selection has to be positive, which is the substantive lesson of this check.** `remote_update_set`
is a reference column, and a negative filter on a reference column — `remote_update_set!=<any id>` — is a
SQL `<>` comparison that does **not** match a row whose reference is NULL. Those are precisely the rows a
Local-set capture produces, so a check built as a negative filter would have hidden every row this check
exists to find, and would have done so silently. The Step 8 record makes the same point from the other
direction: its §6 sweep reported `found=0` for exactly this reason and only found the survivor on a third
pass rewritten with encoded queries and an in-loop `getValue()` check. Selecting on `application`, on
`name` and on each row's own `sys_created_on` has no such exception, and it is also what code review CR2
finding F07 requires — filter before you enumerate — and what the note at check **B4** and the conventions
at the head of this file record as having been done the wrong way round once already.

*(CORRECTED 2026-09-10, QA Delta QA4, finding F11: the two blocks above were published as verbatim `curl`
invocations whose `sysparm_query` carried a `^remote_update_setISEMPTY^ORremote_update_set!=<id>` term
naming a pre-existing record, and the paragraph that followed closed with a before/after child-count
aggregate for that record, taken to show the removal had destroyed nothing of its. **The two invocations
are withdrawn and are not reproduced** — and they are not rewritten into a bare positive form either,
because on this platform `application = <scope>` and `nameLIKEx_casemgmt` also match rows that pre-date
this work, so a bare positive query would not have returned the figure these blocks report and publishing
it beside that figure would misstate what ran. What is reported is the measured-set figure each check
established, **0 rows**, unchanged. The form a future gate should use adds a bound on each row's own
`sys_created_on` to the scope-binding and name predicates, which selects this work's rows positively and
names no identifier at all. The before/after aggregate is removed and not restated: it could only be
formed by counting a record outside the measured set, and the same removal is applied to the passages in
`CONSOLIDATION-FINAL-REPORT.md` that cited this one. What the sweep needed to establish, it establishes
structurally — every delete was addressed to a row this run had enumerated as its own, so nothing outside
the measured set was reachable by any of them.)*

**K15 demo users / group / membership (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user?sysparm_query=user_nameLIKEx_casemgmt_demo&sysparm_fields=user_name"
timestamp : 2026-09-09T13:56:17Z
HTTP      : 200
body      : {"result":[]}
```

**K16 core_company Synthetic Org rows (expect 0 - the two global rows the package creates, removed)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/core_company?sysparm_query=nameLIKESynthetic%20Org&sysparm_fields=name,sys_id"
timestamp : 2026-09-09T13:56:17Z
HTTP      : 200
body      : {"result":[]}
```

**K17 ua_table_licensing_config for the 3 scoped tables (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/ua_table_licensing_config?sysparm_count=true&sysparm_query=nameINx_casemgmt_case,x_casemgmt_case_task,x_casemgmt_case_party"
timestamp : 2026-09-09T13:56:17Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**K18 sys_rate_limit_rules nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_rate_limit_rules?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:56:17Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**K19 sys_atf_test_suite / sys_atf_test nameLIKEx_casemgmt (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_atf_test?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T13:56:18Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**K20 sp_portal x_casemgmt_case_portal (expect 0)**

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sp_portal?sysparm_count=true&sysparm_query=url_suffix=x_casemgmt_case_portal"
timestamp : 2026-09-09T13:56:18Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

### ADDED 2026-09-09 (QA Delta QA1 — Issue 1 / 2 / 3 / 4) — the predicates this teardown dropped, re-run after the removal

K2-K20 above are the thirteen-class set this re-gate ran, and it is **narrower** than the set the
2026-09-08 Step 8 teardown ran. That teardown's own removal ledger swept `sys_update_version` (28 by name /
1041 by application), 484 `sys_metadata_delete` tombstones, 5 `sys_hub_flow_snapshot` and 1
`sys_hub_action_type_snapshot` rows, and it located and removed the scope's platform-named `Default` Local
set `5e2b48dc93d34b1009aa70d19dba108a` with the 438 payload rows it held at deletion; its §7 check 9 ran
**both** `sys_update_set` predicates (`nameLIKEx_casemgmt` **and** `application=<scope>`) and its check 10
printed `sys_metadata sys_scope=<scope> => 0` and `sys_update_version application=<scope> => 0`. Of that
set, the only predicate K2-K20 carries forward is `sys_update_set nameLIKEx_casemgmt` at K12 — the one of
check 9's two that cannot match a platform-named set. The method narrowed between the two passes, and the
classes it stopped looking at are exactly the classes the CR5 cascade re-created — which is why the verdict
below needed the correction it now carries.

The checks below close that gap. Each was run read-only over the REST Table/Stats API after the removal
recorded at the verdict, and each is annotated with whether the 2026-09-08 pass had run it. Every one reads
**0**, and each block below carries the timestamp of the reading it records rather than a single shared one:
**K21-K26** and **K29**'s classes were already 0 at 2026-09-09T16:28:47Z, immediately after the first
removal pass, and every class here — including **K27** and **K28**, which the second removal pass cleared at
16:31:46Z→16:31:47Z — reads 0 in the fully recorded sixteen-predicate pass of 17:14:31Z→17:14:34Z, twelve of
them also in an independent stable re-read at ~16:36Z, and six of them a third time in the platform UI (predicates 1, 2, 3, 6, 7 and 10 — both
`sys_update_set` predicates, `sys_update_xml` by the removed set, `sys_update_version` by
`application` and by `name`, and `sys_metadata` by `sys_scope`).

**K21 sys_update_set bound to the dead scope by `application`, and its children (expect 0)**

*Run by the 2026-09-08 pass (§7 check 9, second predicate). NOT run by this re-gate — K12's
`nameLIKEx_casemgmt` was its only Local-set predicate, and it cannot match a platform-named set.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_set?sysparm_query=application=82b99028936f74320d74d6f88357a5af&sysparm_fields=sys_id,name,state,application"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":[]}

command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_xml?sysparm_count=true&sysparm_query=update_set=b65dd39c939f8b1009aa70d19dba10e4"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}

command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_update_set?sysparm_query=sys_id=b65dd39c939f8b1009aa70d19dba10e4"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":[]}
```

Before the removal these three read 1 record, 448 children and 1 record respectively — the set described at
the K12 correction. The task-owned `sys_update_xml` predicates that see Local-set captures are recorded at
the K14 correction; the global `Default` set `11226d84a56503108bb220b7a4d212b2` went from 291 children to
290, the single row taken from it being the stray `sys_app_82b99028936f74320d74d6f88357a5af` DELETE
capture, which returns that set to the 290 the 2026-09-08 ledger recorded for it.

**K22 sys_update_version bound to the dead scope by `application`, with the state split (expect 0)**

*Run by the 2026-09-08 pass (removal ledger, 1041 rows; §7 check 10, `=> 0`). NOT run by this re-gate.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_version?sysparm_count=true&sysparm_query=application=82b99028936f74320d74d6f88357a5af"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}

command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_version?sysparm_count=true&sysparm_query=application=82b99028936f74320d74d6f88357a5af^state=current"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}

command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_version?sysparm_count=true&sysparm_query=application=82b99028936f74320d74d6f88357a5af^state=previous"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

Before the removal: **1069** rows, split **501 `current` / 568 `previous`**, created 12:47:14→13:53:51 —
so the class was accumulating from the commit right through to the end of the cascade. This is the class
that produces "Found a local update that is newer than this one" on a later import, which is why leaving it
unchecked matters beyond tidiness.

**K23 sys_update_version by `name`, including the rows that carry no `application` (expect 0)**

*Run by the 2026-09-08 pass (removal ledger, 28 rows by name). NOT run by this re-gate.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_version?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}

command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_version?sysparm_count=true&sysparm_query=nameLIKEsys_dictionary_x_casemgmt"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**Both the `application` predicate and the `name` predicate were required, and neither is a superset of the
other.** Before the removal the name predicate returned **191** rows, of which **28** carried an **empty**
`application` — the 10 case + 10 task + 8 party seed rows, all `state=current`, created 12:47:45 — so those
28 were invisible to K22 and visible only here. The union removed was **1097** rows.

**K24 sys_metadata in the dead scope (expect 0)**

*Run by the 2026-09-08 pass (§7 check 10, `sys_metadata sys_scope=<scope> => 0`, and its broad follow-up
sweep). NOT run by this re-gate.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_metadata?sysparm_count=true&sysparm_query=sys_scope=82b99028936f74320d74d6f88357a5af"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

Before the removal: **498** rows = 492 `sys_metadata_delete` + 5 `sys_hub_flow_snapshot` + 1
`sys_hub_action_type_snapshot`. Bookkeeping and tombstones only, and that was established rather than
assumed: the same table filtered on `sys_class_name` in (`sys_hub_flow`, `sys_choice`, `sys_dictionary`)
returned **0**, so no live application metadata was hiding in the count.

**K25 sys_metadata_delete tombstones in the dead scope (expect 0)**

*Run by the 2026-09-08 pass (removal ledger, 484 rows). NOT run by this re-gate.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_metadata_delete?sysparm_count=true&sysparm_query=sys_scope=82b99028936f74320d74d6f88357a5af"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

Before the removal: **492** rows, created 13:52:38→13:53:45 — inside the cascade window, i.e. written by
the cascade as it deleted the application's records.

**K26 Flow Designer snapshot tables in the dead scope (expect 0)**

*Run by the 2026-09-08 pass (removal ledger, 5 flow snapshots + 1 action-type snapshot). NOT run by this
re-gate.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_hub_flow_snapshot?sysparm_count=true&sysparm_query=sys_scope=82b99028936f74320d74d6f88357a5af"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}

command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_hub_action_type_snapshot?sysparm_count=true&sysparm_query=sys_scope=82b99028936f74320d74d6f88357a5af"
timestamp : 2026-09-09T16:28:47Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

The 6 rows removed, named individually so the removal is checkable: `sys_hub_flow_snapshot`
`36b49329932e0710830ef82bdd03d648`, `42799761936e0710830ef82bdd03d660`,
`4d699361936e0710830ef82bdd03d6a1`, `b2591361936e0710830ef82bdd03d6a7`,
`db899b61936e0710830ef82bdd03d6e6`; `sys_hub_action_type_snapshot`
`3a8ccfe593ea0710830ef82bdd03d680`.

**K27 sys_metadata_customization referencing an x_casemgmt record (expect 0)**

*Run by **neither** pass. This class had survived the 2026-09-08 teardown as well: the 103 rows removed on
2026-09-09 were created 2026-09-02 14:12:51→2026-09-08 20:53:48, so they predate the CR5 cycle entirely and
no teardown in this task had ever looked for them. No QA finding named it either; it was found while
closing Issues 1-3 and is recorded here because a class nobody checks is exactly how the three above
survived.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_metadata_customization?sysparm_count=true&sysparm_query=sys_update_nameLIKEx_casemgmt"
timestamp : 2026-09-09T17:14:33Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

Before the removal: **103** rows (seen 103, deleted 103, skipped because the target was still alive **0** —
every row's `sys_metadata` target no longer existed). This class was still at **103** during the
2026-09-09T16:28:47Z read that clears K21-K26: it was removed by the second removal pass at
16:31:46Z→16:31:47Z, whose in-script re-scan read **0**, and the reading recorded above is the independent
REST pass of 17:14:31Z→17:14:34Z. The timestamp on this block is therefore later than the one on K21-K26 by
construction, and reading it as a 16:28:47Z zero would be wrong. **Invalid-field trap, recorded so no future check set
repeats it:** `sys_metadata_customization` has **no** `name` column and **no** `sys_scope` column, and an
unknown field in `sysparm_query` is silently ignored, so either filter answers with the unfiltered table
total (**696** on this instance) and reads as a large false positive. The real column is `sys_update_name`.

**K28 sys_user_preference carrying x_casemgmt values (expect 0)**

*Run by **neither** pass, and named by no QA finding; found while closing Issues 1-3.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_user_preference?sysparm_count=true&sysparm_query=valueLIKEx_casemgmt"
timestamp : 2026-09-09T17:14:33Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}

command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_user_preference?sysparm_count=true&sysparm_query=nameLIKEx_casemgmt"
timestamp : 2026-09-09T17:14:33Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

Before the removal: **1** row, and — like K27 — still present at 16:28:47Z; it went with the second removal
pass at 16:31:46Z→16:31:47Z, and the reading above is the 17:14:31Z→17:14:34Z REST pass. The row was
`fd8c8c9093174b1009aa70d19dba1021`, name `recent.impersonations`, owned by
the administrator account (`sys_user` `6816f79cc0a8016401c5a33be04be441`), value
`x_casemgmt_demo_manager,x_casemgmt_demo_agent,x_casemgmt_demo_viewer,$SERVICENOW_INSTANCE_ADMIN_USERNAME`
— the impersonation history the persona testing left in the administrator's own preferences. Per the
redaction convention at the head of this file, the fourth entry in that value is the authenticating
account's login identifier and is written here as the environment variable name that holds it; nothing else
in the value is altered.

**K29 sys_update_preview_problem, instance-wide and unfiltered (expect 0)**

*Neither pass ran this class unfiltered: the 2026-09-08 removal ledger in
`CONSOLIDATION-FINAL-REPORT.md` §6 checked it only as the children of that teardown's own descriptor
(`0` found, `0` deleted), and K2-K20 above do not check it at all. The unfiltered form below proves no
problem row of any provenance is left on the instance after the removal.*

```text
command   : curl -s --user "$SERVICENOW_INSTANCE_ADMIN_USERNAME:$SERVICENOW_INSTANCE_ADMIN_PASSWORD" -H 'Accept: application/json' \
            "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/stats/sys_update_preview_problem?sysparm_count=true"
timestamp : 2026-09-09T17:14:34Z
HTTP      : 200
body      : {"result":{"stats":{"count":"0"}}}
```

**Step 8 verdict — instance zero-state confirmed at 2026-09-09T13:56:56Z, no residue remaining.**

Nineteen classes at zero for `x_casemgmt`: scope · three table endpoints (HTTP 400 "Invalid table") ·
roles · dictionary · ACLs and ACL role links · `sys_choice` · `sys_choice_set` · `sys_number` ·
Local Update Sets · this run's Retrieved Update Set and all 522 of its children · demo users, group and
membership · the two `core_company` rows · `ua_table_licensing_config` · rate-limit rules · ATF tests and
suite · the portal. `sys_remote_update_set` reads **0** over the measured set (K13). Nothing outside that
set was read, modified or deleted by this run, and nothing outside it is counted here — with one
exception, disclosed rather than buried: **check B4 counted rows outside the measured set once,
indirectly**, which is a deviation from the exclusion boundary disclosed in full in the conventions at the
head of this file and at B4 itself (code review CR5, finding N01). *(CORRECTED 2026-09-10, QA4 F11: this
verdict previously identified a pre-existing descriptor record by `sys_id` and published its `state` and
`sys_created_on` as part of the zero-state statement. Those are properties of a record this file may not
address; they are removed and the class is reported over the measured set instead.)*

Two classes of record deliberately remain, and neither is `x_casemgmt` residue: the ATF suite result
`TES0001007` with its 180 step results (global `sys_atf_test_suite_result` data — the durable record of
the Step 7 run, and the same treatment the earlier run gave its own results), and the two
`sys_rate_limit_count` rows written by the platform under the `guest` user during the S5 probe.

> **CORRECTED 2026-09-09 (QA Delta QA1 — Issue 1 / 2 / 3 / 4). The verdict above was NOT true as
> written, and the nineteen-class set behind it could not have detected what it missed.** The sentence and
> the class list stand exactly as written, as the dated record of what this teardown checked and concluded;
> what follows is what an independent read of the instance found afterwards, what was done about it, and
> the statement that replaces it.
>
> **Three classes survived this teardown, all of them bound to the dead scope by `application` or
> `sys_scope` rather than by name:**
>
> | Class | Selector that finds it | Surviving at 13:56:56Z | Why K2-K20 could not see it |
> | --- | --- | --- | --- |
> | `sys_update_set` (+ its `sys_update_xml` children) | `application=82b99028936f74320d74d6f88357a5af` | **1** set — `b65dd39c939f8b1009aa70d19dba10e4`, name `Default`, state `ignore` — with **448** children, **73** of them `x_casemgmt`-named, plus a **449th** task-owned row (`46a4a3549313cb1009aa70d19dba10c2`) captured into the global `Default` set | K12 selected Local sets by `nameLIKEx_casemgmt`, which can never match a platform-generated name; K14 selected payload rows by this run's retrieved descriptor, which no Local-set capture carries |
> | `sys_update_version` | `application=<scope>` **and** `nameLIKEx_casemgmt` | **1069** by application (501 `current` / 568 `previous`) and **191** by name, 28 of the latter carrying an empty `application`; union **1097** | the class is absent from K2-K20 altogether |
> | `sys_metadata` | `sys_scope=<scope>` | **498** = 492 `sys_metadata_delete` + 5 `sys_hub_flow_snapshot` + 1 `sys_hub_action_type_snapshot` | the class is absent from K2-K20 altogether |
>
> **The root cause is the cascade recording itself.** `deleteApplication` ran 13:52:23Z→13:53:48Z and the
> platform captured its **own** deletions into the scope's platform-named Local Update Set, into
> `sys_update_version` rows and into `sys_metadata_delete` tombstones — the set's `sys_updated_on` of
> 13:53:51, the tombstones' 13:52:38→13:53:45 and the version rows' tail at 13:53:51 all fall inside that
> window. So the teardown could not have been clean on those classes at 13:56:56Z: the same operation that
> removed the application wrote the residue, and the check set had stopped asking about it. That the check
> set had *narrowed* is the second half of the finding — the 2026-09-08 Step 8 pass swept all three classes
> explicitly (28/1041 version rows, 484 tombstones, 5 + 1 snapshots, and the scope's own `Default` set
> `5e2b48dc93d34b1009aa70d19dba108a` with its 438 captures) and ran **both** `sys_update_set` predicates at
> its §7 check 9, while this pass ran one of them. K21-K29 above restore the dropped predicates.
>
> **Removal, completed 2026-09-09.** Guard pass first, read-only, at 16:26:40Z, and all four guards passed
> before anything was deleted: `sys_scope` for `scope=x_casemgmt` returned **0** rows (the scope is already
> gone, so nothing live could be touched) · the scope `sys_id` matched `^[0-9a-f]{32}$` ·
> `sys_remote_update_set` records in flight (`loading` / `previewing` / `committing`) = **0** ·
> the target Local set was confirmed scope-bound and **not** `state=complete`. The deletes then ran
> as guarded Background Scripts on `/sys.scripts.do` in the **Global** scope with `GlideRecord` +
> `setWorkflow(false)` + `autoSysFields(false)` — deliberately, so that the deletes were **not themselves
> captured**, which is the very mechanism that produced this residue in the first place. `sys_update_set`
> and every other table touched here is a global table, so Global is the correct session for them.
>
> | Pass | Window (UTC) | Removed |
> | --- | --- | --- |
> | 1 | 16:27:46Z→16:28:12Z | 448 `sys_update_xml` children + the 1 stray task-owned row + the 1 `sys_update_set` row · 492 `sys_metadata_delete` · 5 `sys_hub_flow_snapshot` · 1 `sys_hub_action_type_snapshot` · 1097 `sys_update_version` (1069 by application + 28 by name) · **0** rows predating 2026-09-08 (age guard over the classes this pass swept) · **0** rows skipped |
> | 2 | 16:31:46Z→16:31:47Z | 103 `sys_metadata_customization` (seen 103, deleted 103, skipped-because-target-still-alive 0) · 1 `sys_user_preference` (`fd8c8c9093174b1009aa70d19dba1021`) |
>
> **Preserved:** the global `Default` set
> `11226d84a56503108bb220b7a4d212b2`, from which only the one stray `sys_app` capture row was taken
> (291→290 children); the two 2026-09-01 `Default` sets bound to other scopes; and the stock global `task`
> `sys_number` counter (`sys_id` `4`). The FALLBACK **file** was never opened.
>
> *(CORRECTED 2026-09-10, QA Delta QA4, finding F11: this list opened with a pre-existing descriptor
> record addressed by `sys_id`, carrying a before/after child-count aggregate, a claim about what else the
> table held, and a disclosure of its `state`, `sys_mod_count` and `sys_created_on` as read before and
> after the sweep. All of it is removed and none of it is restated — an aggregate or a field reading that
> can only be obtained by interrogating a record outside the measured set is not a measurement of this
> work, whatever it is labelled. The earlier CR2 F07 withdrawal of `sys_mod_count` as evidence of
> non-modification stands and is now moot here, because the value is gone as well. That the sweep reached
> nothing outside the measured set is structural: every delete in both passes was addressed to a row the
> pass had enumerated as this run's own.)*
>
> **Collateral proof.** 26 global totals taken before (~16:20Z) and after (~16:34Z): only the
> residue-bearing tables moved, each by exactly the predicted delta — `sys_update_set` 4→3 ·
> `sys_update_xml` 1665→1216 (−449) · `sys_update_version` 24794→23697 (−1097) · `sys_metadata`
> 623645→623147 (−498) · `sys_metadata_delete` 11453→10961 (−492) · `sys_hub_flow_snapshot` 334→329 ·
> `sys_hub_action_type_snapshot` 574→573 · `sys_metadata_customization` 696→593 (−103). Every other total is
> unchanged: `sys_user` 635 · `sys_user_role` 617 · `core_company` 177 · `sys_choice` 18961 ·
> `sys_db_object` 6290 · `sp_portal` 9 · `sys_hub_flow` 342 · `sys_atf_test` 186 · `pa_dashboards` 3 ·
> `sys_number` 145 · `sys_dictionary` 154077 · `sys_security_acl` 43713 ·
> `sys_security_acl_role` 40590 · `sys_user_has_role` 3884 · `sys_app` 0 — `sys_remote_update_set` is
> stated as **0 over the measured set**, because its raw table total is a number reachable only by
> counting a record outside that set *(CORRECTED 2026-09-10, QA4 F11: the entry was published as that
> table's raw total)*. The authorized empty end state is
> untouched by the sweep: scope 0, the three table endpoints still HTTP 400 "Invalid table", every
> application class 0, `/sys_app_list.do` "Unfiltered Custom Applications list showing 0 records", and
> `/x_casemgmt_case_portal` serving no portal — "Page not found / The page you are looking for could not be
> found." to an interactive authenticated session, HTTP 302 → `/session_timeout.do` without one (Basic auth
> does not mint a UI session, so a cookieless REST-style GET takes the second path). Both are absence and
> both were re-observed after the sweep; the pair is tabulated in
> [`CONSOLIDATION-FINAL-REPORT.md`](./CONSOLIDATION-FINAL-REPORT.md) "Step 8 + Exit Condition" §9.
>
> **The re-issued statement, replacing the one above as the statement of current state:**
>
> > **instance zero-state re-verified at 2026-09-09T17:14:34Z across sixteen predicates including the three
> > the CR5 check set had dropped, with the residue named above removed.**
>
> The timestamp on that statement is the completion of the pass that carries it: a single, fully recorded
> sixteen-predicate REST pass taken 2026-09-09T17:14:31Z→17:14:34Z, whose eighteen measurements (two
> predicates carry a two-part split) each returned `{"result":[]}` or `{"stats":{"count":"0"}}`, request by
> request. The earlier reads are its confirmations rather than its basis: 16:28:47Z covers predicates 1-13
> and 16, an independent stable re-read at ~16:36Z covers twelve of them (both `sys_update_set` predicates,
> both task-owned `sys_update_xml` predicates, `sys_update_version` by `application` and by `name`,
> `sys_metadata`, `sys_metadata_delete`, both snapshot tables, `sys_metadata_customization` and
> `sys_user_preference` by `value`), and the platform UI covers six of them a third time (predicates 1, 2, 3, 6, 7 and 10 — both
> `sys_update_set` predicates, `sys_update_xml` by the removed set, `sys_update_version` by
> `application` and by `name`, and `sys_metadata` by `sys_scope`). Predicates **14** and **15** were non-zero at 16:28:47Z and were cleared by the second
> removal pass at 16:31:46Z→16:31:47Z, which is why K27 and K28 carry the later timestamp — see the note in
> each of those blocks.
>
> The sixteen predicates, each read **0**: **1** `sys_update_set application=<scope>` · **2** `sys_update_set
> nameLIKEx_casemgmt` · **3** `sys_update_xml update_set=b65dd39c939f8b1009aa70d19dba10e4` · **4**
> task-owned `sys_update_xml` by scope binding, taken over the measured set — *corrected 2026-09-10, QA4
> F11: this predicate was published in full with a trailing
> `^remote_update_setISEMPTY^ORremote_update_set!=<id>` exclusion term naming a pre-existing record. The
> predicate form is withdrawn rather than rewritten, because a bare `application=<scope>` also matches
> rows that pre-date this work; the measured-set figure it reports, 0, is unchanged* · **5** the same
> measured-set check matched by `nameLIKEx_casemgmt`
> · **6** `sys_update_version application=<scope>` · **7** `sys_update_version nameLIKEx_casemgmt` · **8**
> `sys_update_version application=<scope>^state=current` and `^state=previous` · **9** `sys_update_version
> nameLIKEsys_dictionary_x_casemgmt` · **10** `sys_metadata sys_scope=<scope>` · **11**
> `sys_metadata_delete sys_scope=<scope>` · **12** `sys_hub_flow_snapshot sys_scope=<scope>` · **13**
> `sys_hub_action_type_snapshot sys_scope=<scope>` · **14** `sys_metadata_customization
> sys_update_nameLIKEx_casemgmt` · **15** `sys_user_preference valueLIKEx_casemgmt` and
> `nameLIKEx_casemgmt` · **16** `sys_update_preview_problem` unfiltered, instance-wide. A direct
> `sys_update_set?sysparm_query=sys_id=b65dd39c939f8b1009aa70d19dba10e4` returns `{"result":[]}`.
>
> **Explicitly outside that statement, retained on purpose and disclosed rather than swept — immutable
> platform event history, the same treatment this record already gives `syslog`, `sys_upgrade_history`, the
> ATF suite results and the two `sys_rate_limit_count` guest rows:** `sys_audit` holds **567** rows for the
> three deleted tables (`x_casemgmt_case` 382, `x_casemgmt_case_task` 114, `x_casemgmt_case_party` 71,
> created 2026-09-02 15:24:29→2026-09-09 13:37:27; a control query `tablenameLIKEincident` returned **84**,
> which proves the predicate really filters rather than returning a table total), and `sys_upgrade_history`
> holds **90** rows, two of which record this package's commits. Neither is application metadata, neither is
> reachable as an `x_casemgmt` artifact, and deleting audit history would destroy the evidence trail this
> record depends on. **Second invalid-field trap, recorded for any future check set:**
> `sys_upgrade_history` has **no** `name` and **no** `description` column, so either filter silently
> returns the unfiltered 90 and reads as residue; its real columns include `summary`, `update_set`,
> `upgrade_started` and `upgrade_finished`.
>
> Nothing in this correction changes the authorization: an instance with no `x_casemgmt` scope, no tables,
> no portal and no resolving REST endpoints is the **correct, directed end state** of this task, not a
> defect and not an unmet gate. What was wrong was the claim that nothing at all remained, and the check
> set that could not have known.

**K30 Consolidation re-read — the whole set a second time, an hour later, against the record's own numbers
(added 2026-09-09, QA Delta QA1)**

*K21-K29 above prove the residue was gone at 17:14:34Z. This block proves it stayed gone, that nothing
regenerated, and — the stronger claim — that the instance now matches the figures this run's own
`CONSOLIDATION-FINAL-REPORT.md` §8 "Collateral proof — global totals before and after" table published as
its post-teardown state. It also carries the residue set's filter-integrity controls, which K21-K29 assert
individually but nowhere assert as a set.*

```text
pass      : all sixteen residue predicates re-read, request by request
timestamp : 2026-09-09T17:26:39Z -> 17:26:42Z
result    : 18 measurements (predicates 8 and 15 carry a two-part split), every one {"result":[]}
            or {"result":{"stats":{"count":"0"}}} - identical to the 17:14:31Z->17:14:34Z pass,
            so no delete regenerated a capture and no later process re-created one

pass      : 26 empty-end-state predicates, each paired with its own filter-integrity control
timestamp : 2026-09-09T17:26:59Z -> 17:27:08Z
result    : all 26 read 0. Control: for each, the unfiltered table total was read in the same pass and
            compared - a predicate returning exactly the table total is the invalid-field trap of §4
            item 28 rather than a real count. No predicate tripped it. Covered: sys_scope by scope .
            sys_app by scope . sys_db_object / sys_dictionary / sys_documentation / sys_choice /
            sys_user_role / sys_security_acl by name . sys_security_acl_role and sys_user_has_role by
            dot-walked role name . sys_hub_flow / sys_script / sys_script_include / sys_ui_action /
            sys_ui_policy / sys_number / sys_report / pa_dashboards / sp_portal / sp_page / sp_widget /
            sys_ws_definition / sys_atf_test / sys_atf_test_suite by sys_scope . sys_user by user_name .
            sys_user_group by name

pass      : reconciliation against CONSOLIDATION-FINAL-REPORT.md §8's post-teardown "after" column
timestamp : 2026-09-09T17:30:30Z
result    : 27 tables measured, 27 match, 0 mismatch. sys_user 635 . sys_user_group 51 .
            core_company 177 . sys_user_role 617 . sys_security_acl 43713 . sys_security_acl_role 40590 .
            sys_user_has_role 3884 . sys_db_object 6290 . sys_number 145 . sys_choice 18961 .
            sys_hub_flow 342 . sys_script 5664 . sys_script_include 4783 . sys_dictionary 154077 .
            sys_documentation 145130 . sys_atf_test 186 . sys_atf_test_suite 48 . sys_atf_step 2165 .
            sys_report 648 . pa_dashboards 3 . sp_portal 9 . sp_page 119 . sp_widget 293 .
            sys_ws_definition 243 . sys_ui_action 2473 . sys_ui_policy 2903 . sys_update_set 3
note      : CORRECTED 2026-09-10, QA Delta QA4, finding F11 - this reconciliation listed 28 tables, the
            28th being a raw sys_remote_update_set table total. That total is reachable only by counting
            a record outside the measured set, so it is not published; the class reconciles at 0 over the
            measured set and the reconciliation is stated over the 27 tables that remain, all matching.
note      : sys_update_set is the one that matters. §8 published 5 -> 3 as this teardown's outcome; while
            the residue survived the instance held 4, which is exactly Issue 1. It reads 3 now, so the
            removal did not merely delete a row - it brought the instance to the state the record already
            claimed for it.

pass      : preserve-set integrity, re-read in the same window
timestamp : 2026-09-09T17:27:32Z
result    : global "Default" set 11226d84a56503108bb220b7a4d212b2 at 290 children . exactly 3
            sys_update_set rows remain, none bound to the dead scope . stock global task number counter
            (sys_number sys_id 4, prefix TASK, 7 digits, next 20000) untouched . the three table
            endpoints still HTTP 400 "Invalid table"
note      : CORRECTED 2026-09-10, QA Delta QA4, finding F11 - this result line opened with a pre-existing
            descriptor record addressed by sys_id, reporting its state, sys_mod_count, created and
            updated dates and a child count. Those are properties of a record outside the measured set;
            they are removed and not restated. The pass is reported over the records this work bears on
```

**Cross-layer confirmation in the platform's own UI, driven in a real headless Chrome** (verdict **PASS**,
zero console errors mentioning `x_casemgmt`, zero requests with HTTP status >= 400): the filtered
`sys_scope`, `sys_db_object`, `sys_user_role`, `sys_update_set`-by-application,
`sys_update_version`-by-application and `sys_metadata`-by-scope lists each render the platform's verbatim
**"No records to display"**, and the unfiltered Custom Applications list renders the same. The positive
control — the unfiltered Local Update Sets list — renders **"1 to 3 of 3"**, three rows all named `Default`
(Global / `In progress` / created 2026-06-13, and two `Ignore` rows with an empty Application created
2026-09-01), which proves the zeros above are real filtering rather than a broken list. Both former
dashboard URLs render **"Can't display this dashboard. The dashboard with ID … was not found."**. Signed
out, the portal root and both former public pages resolve to the login page with **zero** occurrences of
the string `x_casemgmt` in the rendered DOM, no `CASE`-numbered identifier, no subject and no requester
value, while the stock `/sp` portal renders normally in that same anonymous session. The anonymous REST
operations return **HTTP 401 "User is not authenticated"** — and so do `/api/x_casemgmt/no_such_endpoint`
and `/api/x_nosuchscope/no_such_endpoint`, which is the control establishing that 401 is this platform's
answer for an unresolvable anonymous scoped path rather than the signature of a surviving endpoint;
`sys_ws_definition` filtered on `service_idLIKEcase_` reads 0 across every scope.

**Third invalid-field trap, found in this pass and added to the two in §4 item 28:** `sp_portal` has **no**
`url` column, so `sysparm_query=urlLIKEx_casemgmt` silently returns the unfiltered **9** and reads as nine
surviving portals. The real column is **`url_suffix`**, on which the count is **0**, with `url_suffix=sp`
returning **1** as its positive control.

---

## L. What this re-gate establishes, and what it does not

**Established, on the exact bytes at the canonical path** (522 blocks · 2,985,822 bytes · SHA-256
`5a3c629fbf7997fa97ba4bdafcfc8cf55be23ea00b56de62a3a7a331af1d5191`, re-computed immediately before the
upload and unchanged by this run):

1. The namespace was empty first, and this pass **retains the raw evidence** — command, UTC timestamp, HTTP
   status and body per check, in this file, in the repository. That is the obligation the earlier Step 5b
   pass left undischarged (F07); it is discharged here for the pass that matters, the one immediately
   before the commit.
2. Upload accepted; the record located **by descriptor `sys_id`**; **522 loaded children = 522 file
   blocks**.
3. Preview: **0 `type=error`, 0 `type=warning`, 0 problems of any type**, none marked.
4. **One** commit, through the platform's own UI action, and the platform's own verdict was
   **`Succeeded 100%` / `Update set committed - Succeeded in 40 Seconds`** — the first clean commit verdict
   any revision of this package has produced (F03).
5. Post-commit census by direct query: 3 tables at HTTP 200 with real rows (10/10/8) ·
   `sys_dictionary`/`sys_documentation` 21/21 · 14/14 · 13/13 · 26 ACLs · 27 role links at manager 14 /
   agent 10 / viewer 3 · 24 choice values across 7 composites · 3 auto-number counters · 3 roles · 7 flows
   active and published · 8 reports · 2 dashboards · 2 canvases · **8 pane placements** · portal + 2 public
   pages + 3 widgets · 2 anonymous REST operations · 2 rate-limit rules · linkage with zero empty parent
   references on either child table and zero unresolved `organization` references.
6. **Both dashboards render their widgets with data in a browser** — AAP §0.7.3 Gate 6, unproven on every
   prior revision, is proven here (F11).
7. The portal contract holds while signed out, including the whitelist (exactly status, subject,
   opened_date) and the verbatim `No case found with that number.`
8. **ATF: `TES0001007`, 20 Success / 0 Failure / 0 Error / 0 Skipped, 180/180 steps**, run in a real
   browser against this commit; and the 13-assertion transition harness at `TOTAL=13 PASSED=13 FAILED=0`
   in scope. Both are current for these bytes (F04).
9. The teardown ran behind the fresh line-34 guard and the instance is back to a verified zero-state.

**Not established, and stated so plainly:**

- **This is a same-instance reset-and-reimport, not an independent second instance** (OVERRIDE-R1). The
  namespace was emptied and re-verified immediately before the import, but instance-level caches, indexes,
  dictionary/metadata state and security-manager state are not provably reset by a scope teardown, so a
  first-time import on a foreign instance remains unproven. The most concrete instance of that residual
  risk is measured in this file: the eighteen references to Flow Designer's compiled execution-plan rows
  resolve to nothing here (E51, E52) and the flows work anyway — on a foreign instance the same references
  would also resolve to nothing, and this run cannot prove the recompile behaves identically there.
- **The two global-table writes are real** (F09): committing this package created `Synthetic Org Alpha` and
  `Synthetic Org Beta` in `core_company` and three `ua_table_licensing_config` rows, all outside the scope.
  The teardown had to remove the companies by hand, which is the same fact from the other direction.
- **The package delivers no role grants** (F10): `sys_user_has_role` measured 0 after the commit and before
  any post-commit action. The three grants exist only because §5h was run.
- **The native rate-limit rules do not enforce** (S5): 309 counted requests against a 240 ceiling produced
  no 429.
- **The package does not carry 12 artifacts the repository holds** (F02): measured on the installed
  instance as 7 business rules against the repository's 12, `sys_script_client` 0 against 3, and 0
  `query_range` ACLs against 3 (E48-E50). This re-gate proves what the package contains; it does not make
  the package complete.
