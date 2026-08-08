# Human Deployment Recreate Guide — `x_casemgmt` Case Management POC

> **Audience:** a human ServiceNow administrator who needs to reproduce, from scratch, the working
> deployment of the `x_casemgmt` Case Management scoped application onto a ServiceNow Personal
> Developer Instance (PDI).
>
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

> ### ⚠️ Correction from the clean-instance round trip — read before following §5
>
> A genuine clean-slate re-import was performed after this guide was written, and it corrected one claim made in
> several places below. Where §5 says a remediation is **"AUTOMATIC — no action required"** because the package
> auto-executes `scripts/post_import_remediation.js` on commit, the measured behaviour is:
>
> - **The auto-execute trigger does fire.** It logs
>   `X_CASEMGMT_REMEDIATION|BOOTSTRAP|fired|…|state=committed`.
> - **It cannot succeed.** It reports `SUMMARY|verified=false|tables_built=0|acl_links_total=0|…|errors=121`,
>   every error being `GlideTableDescriptor is not allowed in scoped applications` or
>   `GlideSecurityManager is not allowed in scoped applications` — because the commit engine forces the
>   dispatched record's `sys_scope` to the application, and those APIs are refused in scoped execution.
>   Shipping the script as global in the package does not avoid this.
>
> So **treat every "AUTOMATIC — no action required" note in §5 as a manual step**: run
> *System Definition → Fix Scripts → "x_casemgmt Post-Import Remediation" → Run Fix Script* with scope
> **Global**, and confirm `…|SUMMARY|verified=true|…|errors=0`. Defects **E** (auto-numbering) and **7** (REST
> `service_id`) genuinely need nothing — they are carried by the package artifacts. Defects **C** (physical
> schema) and **9** (the 27 ACL role links) need the manual run.
>
> Three further things this guide does not yet cover, all measured on the clean install: the two dashboards
> **install but cannot render** (their tab child is serialized as `pa_tab`; this release's table is `pa_tabs`); the portal **pages render blank** (their
> Service Portal layout records were never authored, so only the REST endpoints work); and each of the three
> tables arrives with `display=true` on nearly every column, which makes every reference to a case render
> blank until reduced to one display field per table.
>
> The full step-by-step procedure that works end to end — including the second commit needed because dropping
> `sys_db_object` cascades the ACLs away, and the demo-data preparation needed before
> `scripts/seed_demo_data.js` can populate anything — is
> **`docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §9.5**.

---

## 0. Outcome you should expect

After completing this guide, on `https://dev379024.service-now.com` you will have:

- Scoped application **`x_casemgmt` ("Case Management")** with a single scope/`sys_app` record (`sys_id 82b99028936f74320d74d6f88357a5af`).
- **3 physical tables**: `x_casemgmt_case` (with auto-number `CASE0000001`), `x_casemgmt_case_task`, `x_casemgmt_case_party`, each with all dictionary fields and choice lists.
- **3 roles**: `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`.
- **26 ACLs + 27 role-link records** enforcing the role × CRUD matrix (manager full / agent assigned-only / viewer read-only).
- **6 business rules**, **2 Script Includes** (`CaseTransitionValidator`, `CasePortalService`), **2 scripted REST services** (anonymous case submit + status lookup), **8 reports**, **2 dashboards**, **1 Experience/Service Portal** with 2 pages and 3 widgets, **1 UI policy**, and **number counters**.
- **10 demo cases** (`CASE0000013`–`CASE0000022`, all six statuses, both case types), demo tasks, demo parties, and 3 demo users (one per role).

> **Known functional limitation that survives this procedure:** the 7 Flow Designer flows deploy as
> non-functional "dead shells" (see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`, Defect F). Prohibited-transition
> guards, side-effects, the portal, and ACLs all work via Business Rules / Script Includes / scripted REST.
> The forward-transition *precondition* guards that live only in the flows are **not enforced at runtime**.
> This guide cannot remediate that without authoring new flow logic.

---

## 1. Prerequisites

| Item | Value / Requirement |
|---|---|
| Target instance | `https://dev379024.service-now.com` (any PDI on **Zurich** or later) |
| Admin account | `admin` role required (full `security_admin` elevation available) |
| Tools | `curl`, `python3`, a text editor. (Or just a browser for the UI path.) |
| Deliverable | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` (UTF-8, no BOM, ~768 KB, 1 `sys_remote_update_set` + 148 `sys_update_xml`) |
| PDI state | Awake (not hibernated) and **not** mid-upgrade |

### 1.1 Environment / secrets

The deployment uses HTTP Basic auth. Supply credentials via environment variables (never hard-code or echo the password):

```bash
export SERVICENOW_INSTANCE_URL="https://dev379024.service-now.com"
export SERVICENOW_USERNAME="admin"
export SERVICENOW_PASSWORD="<the PDI admin password>"
```

A convenient curl config that keeps the password out of the process list (create with `umask 077`):

```bash
umask 077
cat > /tmp/sn_curl.cfg <<EOF
user = "${SERVICENOW_USERNAME}:${SERVICENOW_PASSWORD}"
EOF
```

---

## 2. Pre-flight checks (abort on any failure)

```bash
SN="$SERVICENOW_INSTANCE_URL"

# 2.1 Reachability + credential validity  -> expect HTTP 200
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" -o /dev/null -w "reachable: HTTP %{http_code}\n" \
  "$SN/api/now/table/sys_remote_update_set?sysparm_limit=1"

# 2.2 Instance not mid-upgrade  -> expect empty result array
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_upgrade_history?sysparm_limit=1&sysparm_query=state=executing"

# 2.3 Scope existence (clean install vs update)  -> zero records = clean
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt"
```

- `200` on 2.1 → proceed. `401` → bad credentials. `403` → account lacks `admin`/`sys_remote_update_set`.
- Any record on 2.2 → wait until upgrade completes.
- Records on 2.3 → an existing scope is present; the commit will update it (the preview step surfaces real conflicts).

---

## 3. Establish a working UI session (required for background scripts)

Several remediations run server-side JavaScript through the **Scripts - Background** page (`sys.scripts.do`).
That page needs an interactive **form-login** UI session — Basic auth alone is **not** sufficient (it
authenticates REST/Table API only). Establish the session once:

```bash
SN="$SERVICENOW_INSTANCE_URL"; CJ=/tmp/sn_cookies.txt
rm -f "$CJ"
# (a) GET the login form, scrape its CSRF token
curl -s -c "$CJ" -b "$CJ" -o /tmp/lf.html "$SN/login.do"
LCK=$(grep -oE 'sysparm_ck"[^>]*value="[^"]+"' /tmp/lf.html | grep -oE 'value="[^"]+"' | sed 's/value="//;s/"//' | head -1)
# (b) POST credentials  -- sys_action=sysverb_login is REQUIRED  -> expect HTTP 302 -> login_redirect.do
curl -s -c "$CJ" -b "$CJ" \
  --data-urlencode "user_name=${SERVICENOW_USERNAME}" \
  --data-urlencode "user_password=${SERVICENOW_PASSWORD}" \
  --data-urlencode "sysparm_ck=${LCK}" \
  --data-urlencode "sys_action=sysverb_login" \
  -o /dev/null -w "login HTTP %{http_code}\n" "$SN/login.do"
# (c) follow the post-login redirect to finalize the session
curl -s -K /tmp/sn_curl.cfg -c "$CJ" -b "$CJ" -L -o /dev/null "$SN/login_redirect.do?sysparm_stack=no"
```

A reusable **background-script runner** `bg.sh` (runs JS server-side in a chosen scope, persists the
session cookie, scrapes the `g_ck` CSRF token each call). The `SCOPE` argument is either the literal
`global` or the **sys_id of a scope** (to run *in* that scoped application):

```bash
cat > /tmp/bg.sh <<'BG'
#!/bin/bash
SCRIPTFILE="$1"; SCOPE="${2:-global}"
SN="https://dev379024.service-now.com"; CJ=/tmp/sn_cookies.txt
curl -s -K /tmp/sn_curl.cfg -c "$CJ" -b "$CJ" -o /tmp/bgform.html "$SN/sys.scripts.do"
CK=$(grep -oE "g_ck['\"]?[ ]*=[ ]*['\"][^'\"]{32,}" /tmp/bgform.html | grep -oE "[A-Za-z0-9_+/=,-]{32,}" | tail -1)
[ -z "$CK" ] && CK=$(grep -oE 'sysparm_ck"[^>]*value="[^"]{32,}"' /tmp/bgform.html | grep -oE 'value="[^"]{32,}"' | sed 's/value="//;s/"//')
[ -z "$CK" ] && { echo "NO_CK (session expired - re-run section 3)"; exit 2; }
curl -s -K /tmp/sn_curl.cfg --max-time 600 -c "$CJ" -b "$CJ" -o /tmp/bg_out.html -w "HTTP %{http_code}\n" \
  --data-urlencode "script@${SCRIPTFILE}" --data-urlencode "sysparm_ck=${CK}" \
  --data-urlencode "runscript=Run script" --data-urlencode "sys_scope=${SCOPE}" \
  --data-urlencode "quota_managed_transaction=on" "$SN/sys.scripts.do"
BG
chmod +x /tmp/bg.sh
```

> **Scope gotchas (proven on this PDI):**
> - To **write/read the scoped `x_casemgmt_*` tables** from a background script you must run **in scope** —
>   pass the scope sys_id `82b99028936f74320d74d6f88357a5af` as the `SCOPE` argument. A `global` script
>   cannot create or even read rows in `x_casemgmt_case` (cross-scope barrier returns 0 rows / refuses writes).
> - `gs.print()` is **forbidden** in a scoped script — use `gs.info('MARKER| ...')` and read it back from the
>   `syslog` table. In a `global` script, `gs.print()` output appears as `*** Script:` lines in the response.
> - `case` is a JavaScript reserved word — always use `gr.getValue('case')` and quote it as a property key (`{'case': sysId}`).

---

## 4. Deploy the Update Set

### 4.1 UI method (recommended for humans)

1. **System Update Sets → Retrieved Update Sets → Import Update Set from XML** → upload
   `x_casemgmt_case_management_update_set.xml`.
2. Open the loaded retrieved set → **Preview Update Set**. Wait for preview to finish.
3. **Resolve preview problems**: the corrected deliverable previews with **zero errors**. If you see
   name-resolution / `sys_scope` errors, you are importing an *uncorrected* XML — see
   `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` Defects A & B (duplicate scope record / `application` reference
   encoding) and re-export a corrected XML first.
4. **Commit Update Set.**

### 4.2 API method (scriptable)

```bash
SN="$SERVICENOW_INSTANCE_URL"
XML="servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml"

# Upload (multipart via the UI upload processor; the Table-API POST returns HTTP 400 for this payload)
# Establish the UI session per Section 3 first, then:
G_CK=$(curl -s -K /tmp/sn_curl.cfg -b /tmp/sn_cookies.txt "$SN/sys_remote_update_set_list.do" \
  | grep -oE "g_ck['\"]?[ ]*=[ ]*['\"][^'\"]{32,}" | grep -oE "[A-Za-z0-9_+/=,-]{32,}" | tail -1)
curl -s -K /tmp/sn_curl.cfg -b /tmp/sn_cookies.txt \
  -F "sysparm_ck=${G_CK}" -F "sysparm_target=sys_remote_update_set" \
  -F "attachFile=@${XML};type=text/xml" \
  "$SN/sys_upload.do" -o /tmp/upload_result.html
```

Then **Preview** and **Commit** are driven through `UpdateSetPreviewAjax` / `UpdateSetCommitAjax`
(via a background script) or simply through the UI (Section 4.1). After the load, verify zero
**error**-type preview problems:

```bash
RUSET="<remote_update_set_sys_id>"
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_update_preview_problem?sysparm_query=remote_update_set=${RUSET}^type=error"
# -> result array MUST be empty before committing
```

> **The commit succeeds, but it does NOT create the physical `case_task` / `case_party` tables or any
> choice lists.** This is a platform limitation (Defect C). Proceed to Section 5.

---

## 5. Post-import remediations

> **Read this first — most of this section is now automatic.** Defects **C** (physical tables, fields, choice
> lists), **E** (auto-numbering), **7** (REST `service_id`) and **9** (ACL role links + security-cache flush)
> no longer require a human step. E and 7 are carried by the package artifacts themselves; C and 9 are
> performed by `scripts/post_import_remediation.js`, which the package auto-executes on commit through the
> global after-update Business Rule `x_casemgmt Post-Import Bootstrap` on `sys_remote_update_set`
> (condition `current.state.changesTo('committed')`). §5a, §5b, §5d and §5f below are kept as **verification**
> steps and as a manual fallback, not as required actions. §5c, §5e and §5g are unchanged.
>
> **Confirm the automation ran** instead of performing §5a/§5b/§5d/§5f by hand:
>
> ```bash
> # expect: one BOOTSTRAP|fired line, one SUMMARY|verified=true ... errors=0 line,
> #         and one TRIGGER|... deactivated after successful remediation line
> curl -s -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" -H "Accept: application/json" \
>   "$SERVICENOW_INSTANCE_URL/api/now/table/syslog?sysparm_query=messageSTARTSWITHX_CASEMGMT_REMEDIATION%5EORDERBYDESCsys_created_on&sysparm_fields=sys_created_on,message&sysparm_limit=100"
>
> # corroborating, no log reading needed:
> #   bootstrap rule has self-deactivated  -> active=false
> curl -s -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" -H "Accept: application/json" \
>   "$SERVICENOW_INSTANCE_URL/api/now/table/sys_script?sysparm_query=name=x_casemgmt%20Post-Import%20Bootstrap&sysparm_fields=name,active"
> #   27 ACL role links exist
> curl -s -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" -H "Accept: application/json" \
>   "$SERVICENOW_INSTANCE_URL/api/now/table/sys_security_acl_role?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_id&sysparm_limit=100"
> ```
>
> On a genuinely clean instance the summary line should read `tables_built=3` and `acl_links_created=27` —
> those counters increment only when the script actually creates something; on a repeat it reads
> `tables_already=3` and `acl_links_already=27`. Either way `verified=true|…|errors=0` is the proof it
> converged.
>
> **If the summary line is absent** (the bootstrap rule was removed from the instance, or the commit was done
> in a way that did not transition `sys_remote_update_set.state` to `committed`), run the whole remediation as
> a single action instead of following §5a–§5f individually:
>
> *System Definition → Fix Scripts → **"x_casemgmt Post-Import Remediation"** → Run Fix Script*
>
> — or, equivalently, paste `servicenow-case-management-poc/scripts/post_import_remediation.js` into
> *System Definition → Scripts - Background* with **"In scope" = Global** and run it:
>
> ```bash
> /tmp/bg.sh servicenow-case-management-poc/scripts/post_import_remediation.js global
> ```
>
> **It must run in `global`, not in scope.** `sys_db_object`, `sys_dictionary`, `sys_choice`, `sys_number`,
> `sys_ws_definition`, `sys_security_acl` and `sys_security_acl_role` are all global tables with cross-scope
> create/update denied, `GlideTableDescriptor` raises
> *"GlideTableDescriptor is not allowed in scoped applications"* for a scoped caller, and
> `GlideSecurityManager` is likewise unavailable in scope. The script writes no `x_casemgmt_*` data rows at
> all — seeding stays the job of §5g, which does run in scope. It is idempotent, so running it when nothing is
> wrong is harmless and reports only "already correct" lines.

Where a step below still needs a script, run it via `bg.sh`. Read results back from the response
(`/tmp/bg_out.html`) — extract `*** Script:` lines for `global` scripts, or query `syslog` for `gs.info`
markers from in-scope scripts. **All cross-references are resolved by name/number lookup — never by
hard-coded `sys_id`.**

### 5a. Materialize `x_casemgmt_case_task` & `x_casemgmt_case_party` tables + all choices  *(Defect C)*

**AUTOMATIC — no action required.** Performed by `scripts/post_import_remediation.js` under the auto-execute
trigger described above. Only verify.

Why it cannot be fixed in the XML: the physical DDL for a brand-new table is emitted by the platform's
after-insert Business Rule **`Synch Dictionary and Table` (order 500) on `sys_db_object`**, and the Update Set
apply engine applies every payload with business rules **suppressed**. Pushing the package's own
`sys_db_object` payload through the engine's own `GlideUpdateManager2.loadXML` creates the metadata row and
leaves `physical=false`; adding a `sys_dictionary` collection row does not help either. A `GlideRecord` INSERT
with workflow **ON** does trigger it — which is what the remediation does, from **global** scope.

Verify (as admin):

```bash
source /tmp/snow/env.sh
for T in x_casemgmt_case x_casemgmt_case_task x_casemgmt_case_party; do
  printf '%s -> ' "$T"
  curl -s -o /dev/null -w '%{http_code}\n' -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" \
    -H "Accept: application/json" "$SN/api/now/table/$T?sysparm_limit=1"
done      # expect 200 for all three
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
/tmp/bg.sh servicenow-case-management-poc/scripts/post_import_remediation.js global
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
// run IN SCOPE (82b99028936f74320d74d6f88357a5af)
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
source /tmp/snow/env.sh
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

**AUTOMATIC — no action required**, including the security-cache flush. Performed by
`scripts/post_import_remediation.js` under the auto-execute trigger described at the top of §5. Only verify.

Why the 27 links cannot simply be shipped as records — both reasons were measured on this release, not assumed:

1. `sys_security_acl` has **no `roles` column** (checked against `sys_dictionary` for the table *and* its
   `sys_metadata` super-class), so the links exist only as rows in the `sys_security_acl_role` m2m table.
2. `sys_security_acl_role` **payloads are silently skipped by the update engine.** Five payload shapes were
   pushed through `GlideUpdateManager2.loadXML` — standalone, with a prolog, nested in the parent ACL's
   `record_update`, wrapped in `<unload>`, and the platform's own captured serialization — and every one
   produced **0 rows with no error**. A `GlideRecord` insert from a global script produces the row.

Without the links, a high-security PDI evaluates an ACL with no role, no condition and no script as **deny**
("Deny access for empty term"), so no role can use the app.

The remediation derives each ACL's role from the package's own `<roles>` element — role **names**, never
sys_ids — read back out of the ACL's committed `sys_update_version` payload, falling back to the
`.assigned_agent`/`.assigned_group` naming convention and then to the ACL's description. 26 ACLs yield 27 links
because the `assigned_agent` field ACL needs both manager and agent, and the script treats 27 as an invariant:
a shortfall reports `verified=false` rather than silently leaving an ACL that denies everyone.

> **Do not delete `sys_security_acl_role` rows by hand to "reset" the links.** Deleting them fires the platform
> business rule `Update ACL Description on Role Change` (class `ACLDescriber`), which rewrites the parent ACL's
> description to role-less text such as `Allow read for records in x_casemgmt_case, never (all ACL conditions
> are empty).` and destroys the prose copy of the mapping. The remediation recovers from this on its own via
> the committed-payload source above, but there is no reason to provoke it.

Verify:

```bash
source /tmp/snow/env.sh
curl -s -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" -H "Accept: application/json" \
  "$SN/api/now/table/sys_security_acl_role?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_name&sysparm_limit=100" \
  | python3 -c "import sys,json;print(len(json.load(sys.stdin)['result']),'links (expect 27)')"
```

Then confirm enforcement, not just the record count, with the impersonation `canX` probe in **Section 6.3**
(run **global** — `GlideImpersonate` is blocked in scope). Expected: manager full CRUD on all three tables;
viewer read-only; agent create-only at table level with delete false, and at record level readable/writable on
its assigned case while an unassigned case is filtered out of the query entirely.

### 5g. Seed the demo data  *(idempotent)*

Run the deliverable's own seed script **in scope** (`scripts/seed_demo_data.js`) to create the 3 demo users,
1 demo group, 10 cases across all six statuses and both case types, demo tasks (open + closed mix), and demo
parties (Person + Organization mix). It resolves all references by `user_name` / `name` / `number`.

```bash
/tmp/bg.sh servicenow-case-management-poc/scripts/seed_demo_data.js 82b99028936f74320d74d6f88357a5af
```

---

## 6. Post-commit validation gates

### 6.1 Metadata / inventory (REST, runs as admin)

```bash
SN="$SERVICENOW_INSTANCE_URL"
for t in x_casemgmt_case x_casemgmt_case_task x_casemgmt_case_party; do
  curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" -o /dev/null -w "$t: HTTP %{http_code}\n" \
    "$SN/api/now/table/$t?sysparm_limit=1"
done
for r in x_casemgmt_case_manager x_casemgmt_case_agent x_casemgmt_case_viewer; do
  curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
    "$SN/api/now/table/sys_user_role?sysparm_query=name=$r&sysparm_fields=name"
done
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=scope,sys_id"
```

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

Portal UI: `https://dev379024.service-now.com/x_casemgmt_case_portal` (submission + status-lookup pages).

> Remember to delete any smoke-test cases afterward so the demo dataset stays at exactly 10.

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

> After any impersonation test, **re-run Section 3** to guarantee a clean `admin` session before
> continuing.

---

## 7. Quick reference — key identifiers

| Artifact | Identifier |
|---|---|
| Scope / `sys_app` | `x_casemgmt` — `82b99028936f74320d74d6f88357a5af` |
| Roles | `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer` |
| Demo users | `x_casemgmt_demo_manager`, `x_casemgmt_demo_agent`, `x_casemgmt_demo_viewer` |
| Demo group | `x_casemgmt_demo_team` (member: Demo Agent) |
| Portal URL | `https://dev379024.service-now.com/x_casemgmt_case_portal` |
| REST submit | `POST /api/x_casemgmt/case_submit` |
| REST lookup | `GET /api/x_casemgmt/case_status_lookup?number=<CASE…>` |
| Dashboards | `x_casemgmt_agent_workspace`, `x_casemgmt_manager_view` (`pa_dashboards`) |
| Verbatim messages | "All tasks must be closed before resolving this case." / "Cases cannot be returned to Draft." / "Closed cases are terminal and cannot be modified." / "No case found with that number." / "Your case has been submitted" |

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `bg.sh` prints `NO_CK` | UI session expired/destroyed | Re-run **Section 3** (form login); `sys_action=sysverb_login` is required |
| `sys.scripts.do` returns empty body | Basic-auth-only session (no UI session) | Re-run **Section 3** |
| Preview shows `sys_scope` name-resolution errors | Importing uncorrected XML (Defects A/B) | Use the corrected deliverable XML (single scope record; `application` encoded as scope sys_id) |
| `case_task` / `case_party` not visible after commit | Commit does not DDL new tables (Defect C) | Run **5a** (direct-build) |
| New cases get no `CASE…` number | Auto-numbering not firing on direct-built table (Defect E) | Run **5b** |
| All REST calls return HTTP 400 | `service_id` empty (Defect 7) | Run **5d** |
| Manager/agent/viewer denied everything | ACL role-links missing (Defect 9) | Run **5f**, then flush security cache |
| Resolve allowed with open tasks | Flow guards are dead shells (Defect F) | Not remediable here — see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` |
