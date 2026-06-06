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

---

## 0. Outcome you should expect

After completing this guide, on `https://dev364430.service-now.com` you will have:

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
| Target instance | `https://dev364430.service-now.com` (any PDI on **Zurich** or later) |
| Admin account | `admin` role required (full `security_admin` elevation available) |
| Tools | `curl`, `python3`, a text editor. (Or just a browser for the UI path.) |
| Deliverable | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` (UTF-8, no BOM, ~768 KB, 1 `sys_remote_update_set` + 148 `sys_update_xml`) |
| PDI state | Awake (not hibernated) and **not** mid-upgrade |

### 1.1 Environment / secrets

The deployment uses HTTP Basic auth. Supply credentials via environment variables (never hard-code or echo the password):

```bash
export SERVICENOW_INSTANCE_URL="https://dev364430.service-now.com"
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
SN="https://dev364430.service-now.com"; CJ=/tmp/sn_cookies.txt
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

## 5. REQUIRED post-import remediations

Run each of the following server-side scripts via `bg.sh`. Read results back from the response
(`/tmp/bg_out.html`) — extract `*** Script:` lines for `global` scripts, or query `syslog` for `gs.info`
markers from in-scope scripts. **All cross-references are resolved by name/number lookup — never by
hard-coded `sys_id`.**

### 5a. Materialize `x_casemgmt_case_task` & `x_casemgmt_case_party` tables + all choices  *(Defect C)*

The Update Set commit applies *metadata* but does not trigger the physical DDL for **new** tables. A fresh
`GlideRecord` INSERT of `sys_db_object` / `sys_dictionary` / `sys_choice` (with workflow ON) **does** trigger
the DDL. Build the two missing tables and the choice lists from the deliverable's own field specs
(`docs/data-model.md`), forcing the deliverable `sys_id`s and the `x_casemgmt` scope. Run **in scope**:

```bash
/tmp/bg.sh /tmp/build_tables.js 82b99028936f74320d74d6f88357a5af
```

`build_tables.js` must, for each of `x_casemgmt_case_task` (fields: `case`→ref `x_casemgmt_case`, `subject`
String 255, `type` Choice, `status` Choice, `assigned_to`→ref `sys_user`, `due_date` Date) and
`x_casemgmt_case_party` (fields: `case`→ref `x_casemgmt_case`, `party_type` Choice, `person`→ref `sys_user`,
`organization`→ref `core_company`, `role_label` String 100):

1. INSERT the `sys_db_object` (label, name, scope, super_class empty) — this triggers table creation.
2. INSERT each `sys_dictionary` field per `data-model.md`.
3. INSERT each `sys_choice` (table, element, value/label/sequence) for every choice list:
   `case.type` (General Inquiry, Complaint); `case.status` (Draft, Open, In Progress, Pending, Resolved,
   Closed); `case.priority` (Low, Medium, High, Critical); `case.pending_reason` (Awaiting Info, Awaiting
   Third Party, Other); `case_task.type` (Investigation, Review, Follow-up, Other); `case_task.status`
   (Open, In Progress, Closed); `case_party.party_type` (Person, Organization).

Verify: `x_casemgmt_case_task` exists (13 columns), `x_casemgmt_case_party` exists (12 columns), choices
`case=15, case_task=7, case_party=2`.

### 5b. Auto-numbering for `x_casemgmt_case`  *(Defect E)*

On a direct-built scoped table the OOB number generation does not fire. Set the `number` field's default
value **with the `global.` qualifier** and ensure the counter padding:

```javascript
// run IN SCOPE (82b99028...)
var d = new GlideRecord('sys_dictionary');
d.addQuery('name','x_casemgmt_case'); d.addQuery('element','number'); d.query();
if (d.next()) { d.setValue('default_value','javascript:global.getNextObjNumberPadded();'); d.update(); }
// ensure the number counter exists with maximum_digits=7 and prefix CASE (look up by table name)
```

Verify a new insert yields `CASE0000023`-style numbering. (A cache flush may be required.)

### 5c. `gs.nowDateTime()` → `new GlideDateTime()` in date business rules  *(Defect 6)*

`gs.nowDateTime()` is scope-fenced in this context. The `set_opened_date` and `set_closed_date` business
rules must use `current.opened_date = new GlideDateTime();` / `current.closed_date = new GlideDateTime();`.
(If you import the *corrected* repo XML these are already fixed; if you import an older XML, patch the live
`sys_script` records.)

### 5d. Scripted REST `service_id`  *(Defect 7)*

The two `sys_ws_definition` records ship with an empty `service_id`, which collapses routing to
`/api/x_casemgmt` and returns HTTP 400. Set them (look up the definitions by name):

```javascript
// run global
[['Case Submit','case_submit'], ['Case Status Lookup','case_status_lookup']].forEach(function(p){
  var w = new GlideRecord('sys_ws_definition'); w.addQuery('name', p[0]); w.query();
  if (w.next()) { w.setValue('service_id', p[1]); w.update(); }
});
```

Resulting paths: `POST /api/x_casemgmt/case_submit`, `GET /api/x_casemgmt/case_status_lookup`.

### 5e. Scripted REST operation scripts  *(Defect 8)*

If the live `sys_ws_operation` records hold an older script than the deliverable's, copy the **deliverable's**
operation scripts onto the live records (the deliverable scripts are the correct/robust versions: GET
returns HTTP 404 `{"error":"No case found with that number."}` for an unknown number; POST consumes
`application/json` and returns HTTP 201 `{number, "Your case has been submitted"}`). Note
`GlideStringUtil.base64Decode` is **not** static — use `gs.base64Decode()` if transferring base64 payloads.

### 5f. ACL → role link records (27)  *(Defect 9)*

The deliverable ships 26 correct `sys_security_acl` records but **zero** `sys_security_acl_role` link
records, so on a high-security PDI ("Deny access for empty term") no role can use the app. Recreate the
links from each ACL's own description (roles looked up **by name**), scoped to the app:

```javascript
// run global
var SCOPE='82b99028936f74320d74d6f88357a5af';
function roleId(nm){ var r=new GlideRecord('sys_user_role'); r.addQuery('name',nm); r.query(); return r.next()?r.getUniqueValue():null; }
var RM={'x_casemgmt_case_manager':roleId('x_casemgmt_case_manager'),
        'x_casemgmt_case_agent':roleId('x_casemgmt_case_agent'),
        'x_casemgmt_case_viewer':roleId('x_casemgmt_case_viewer')};
function addLink(aclId,rid){
  var g=new GlideRecord('sys_security_acl_role'); g.addQuery('sys_security_acl',aclId); g.addQuery('sys_user_role',rid); g.query();
  if (g.hasNext()) return;
  var x=new GlideRecord('sys_security_acl_role'); x.initialize();
  x.setValue('sys_security_acl',aclId); x.setValue('sys_user_role',rid); x.setValue('sys_scope',SCOPE); x.insert();
}
function rolesFor(name,script,desc){
  if (name.indexOf('.assigned_agent')>=0) return ['x_casemgmt_case_manager','x_casemgmt_case_agent'];
  if (name.indexOf('.assigned_group')>=0) return ['x_casemgmt_case_manager'];
  if (script && script.length>0)          return ['x_casemgmt_case_agent'];
  var m=desc.match(/x_casemgmt_case_(manager|agent|viewer)\s+(?:can|role to)/);
  return m ? ['x_casemgmt_case_'+m[1]] : [];
}
var a=new GlideRecord('sys_security_acl'); a.addQuery('name','STARTSWITH','x_casemgmt'); a.query();
while(a.next()){
  var roles=rolesFor(a.getValue('name'), a.getValue('script')||'', a.getValue('description')||'');
  for (var i=0;i<roles.length;i++){ if (RM[roles[i]]) addLink(a.getUniqueValue(), RM[roles[i]]); }
}
GlideSecurityManager.get().reset();   // flush the security cache so enforcement is live
```

Result: 27 role-link records (the `.assigned_agent` field ACL gets both manager + agent). Verify the role
matrix with an impersonation `canX` probe (see Section 6.3).

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

Portal UI: `https://dev364430.service-now.com/x_casemgmt_case_portal` (submission + status-lookup pages).

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
| Portal URL | `https://dev364430.service-now.com/x_casemgmt_case_portal` |
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
