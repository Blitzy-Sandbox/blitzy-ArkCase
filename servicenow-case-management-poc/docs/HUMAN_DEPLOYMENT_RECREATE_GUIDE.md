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

> ### ⚠️ Read this before following §5 — the install is a two-commit, two-script procedure
>
> **Updated 2026-09-02 — read this before the summary below. The delivery election has been made, and it puts
> this whole procedure back in force.** A rebuilt deliverable was produced in which the table,
> dictionary and role-link records are the platform's own captured records, and a **single** upload → preview →
> commit of those 988 records — measured on **export 3's byte sequence,
> 988 blocks / 4,062,436 bytes / SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`**,
> `2026-09-02T20:53:14Z` — did produce, on a clean instance:
> three tables with physical storage (21 / 14 / 13 columns, REST HTTP 200) and **all 27 ACL role
> links** (manager 14 / agent 10 / viewer 3) — with `post_import_remediation.js` **never run** and **no second
> commit**, from a preview carrying 0 `type=error` and 0 `type=warning` problems. **That package is retained
> rather than shipped**, at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`
> (988 blocks / 4,062,436 bytes / SHA-256
> `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`, the §0.5.2-reordered sequence, whose own
> round trip has never been run); it is the **available upgrade path**, and §5 run against it — asserting
> **988** children — is what would make it shippable and promotable back to the deliverable path.
> **What ships is the untouched original package**, elected under checkpoint OVERRIDE-2 because the exact-byte
> gate could not be completed on any instance available to that run. **So Defects C-storage and 9 are manual
> steps again:** the elected file carries **0 `sys_security_acl_role` rows** and the 25 hand-authored
> `sys_dictionary` rows, so §5 below — including its two remediation passes that create the 27 role links — is
> **required as written**, and the child count to assert on upload is **926**, not 988. What needs a post-commit
> step on either package: the **choice rows**
> (`sys_choice` is empty for the three tables — Defect C's remaining half), the seed-row linkage and
> `opened_date`, the last two via `scripts/seed_demo_data.js` in scope. Evidence, including the commit counters
> and every post-commit query: [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md). **The summary and
> the §5 procedure below are the procedure for the elected deliverable,**
> `update-set/x_casemgmt_case_management_update_set.xml` — byte-identical to
> `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` — and for any older revision.
>
> **On the elected package: upload → preview → commit does not give you a working application.** §5
> sets out the required sequence in full; this is the summary:
>
> - **Defects E (auto-numbering) and 7 (REST `service_id`) genuinely need nothing.** They are carried by the
>   package artifacts. Their sections are verification only.
> - **Defects C (physical schema) and 9 (the 27 ACL role links) require manual steps every time.** **Nothing in
>   the package fires on its own** — it contains no auto-execute record of any kind. An earlier revision shipped
>   a global Business Rule (`x_casemgmt Post-Import Bootstrap`) that dispatched the remediation on commit; it
>   **fired and then failed** with `SUMMARY|verified=false|…|errors=121`, every error being
>   `GlideTableDescriptor is not allowed in scoped applications` or `GlideSecurityManager is not allowed in
>   scoped applications`, because the commit engine forces the dispatched record's `sys_scope` to the
>   application and those APIs are refused in scoped execution. Shipping the script as global does not avoid
>   that. **The rule has since been removed from the package** — it could never succeed, and its condition
>   matched the commit of *any* retrieved Update Set, so it would have dispatched privileged, partly
>   destructive remediation onto unrelated deployments. The remediation body still ships, as the Fix Script
>   `x_casemgmt Post-Import Remediation`, but a Fix Script does not self-run. **You must run it yourself.**
> - **Running the Fix Script from the UI does not work either** — *System Definition → Fix Scripts → Run Fix
>   Script* executes that record in the **application** scope and fails identically. The only route measured to
>   work is *System Definition → **Scripts - Background*** with **"In scope" = Global**.
> - **A second commit is required.** Forcing the table rebuild means deleting three `sys_db_object` rows, which
>   cascades away all 26 ACLs, the seed rows, the demo users and the role grants; a second commit restores them.
>   The remediation then has to be run **again** to create the 27 ACL role links.
> - **The demo data needs one script run, but no longer needs preparation.** An earlier revision of this bullet
>   said the packaged seed rows had to be **deleted** first; that is no longer true. Every seed row now carries a
>   pinned number in the 9,000,000 band, and `scripts/seed_demo_data.js` **adopts** the packaged row by that
>   number and fills only the columns that arrived empty. Run it in scope `x_casemgmt`; a second run reports
>   `repaired=0`.
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

---

## 0. Outcome you should expect

After completing this guide, on `https://dev379024.service-now.com` you will have:

- Scoped application **`x_casemgmt` ("Case Management")** with a single scope/`sys_app` record (`sys_id 82b99028936f74320d74d6f88357a5af`).
- **3 physical tables**: `x_casemgmt_case` (with auto-number `CASE0000001`), `x_casemgmt_case_task`, `x_casemgmt_case_party`, each with all dictionary fields and choice lists.
- **3 roles**: `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer`.
- **26 ACLs + 27 role-link records** enforcing the role × CRUD matrix (manager full / agent assigned-only / viewer read-only).
- **7 business rules** — in execution order: `block_terminal_closed` (100, before-update), `set_opened_date` (100, before-insert), `block_draft_backtransition` (200), **`enforce_forward_transitions` (250)** — the one that runs the transition subflow and raises the blocking form error — `validate_assigned_agent_membership` (300, insert + update), `clear_pending_reason_on_inprogress` (400), and `set_closed_date` (500), the only writer of `closed_date`.
- **7 Flow Designer flows** — 2 parent flows (`general_inquiry_state_machine`, `complaint_state_machine`) and 5 subflows (`validate_open_transition`, `validate_in_progress_transition`, `validate_pending_transition`, `validate_resolved_transition`, `validate_closed_transition`) — plus **1 Custom Action** (`x_casemgmt_transition_guard_action`) and **1 shared flow logic block**.
- **2 Script Includes** (`CaseTransitionValidator`, `CasePortalService`), **2 scripted REST services** (anonymous case submit + status lookup), **8 reports**, **2 dashboards** (Agent Workspace with 3 widgets, Manager View with 5 — both rendering), **1 Experience/Service Portal** with 2 pages and 3 widgets, **2 UI policies** with their 2 policy actions, **6 UI Actions**, **1 List Layout** and **1 Related Lists definition** on the case table's Default view, and **number counters**.
- **1 Fix Script** (`x_casemgmt Post-Import Remediation`) carrying the post-import remediation body. It does not run by itself.
- **10 demo cases** covering all six statuses and both case types, demo tasks, demo parties, and 3 demo users (one per role). **The packaged rows now carry pinned, deterministic numbers** — `CASE9000001`-`CASE9000010`, `TASK9000001`-`TASK9000010`, `PARTY9000001`-`PARTY9000008` — chosen in the 9,000,000 band so they cannot collide with counter-issued numbers, and `scripts/seed_demo_data.js` adopts those rows rather than inserting duplicates, so a committed install is number-identical to any other. **Numbers differ from the pinned set only if you seed WITHOUT committing the package** (the script then inserts fresh rows and the instance counter allocates the numbers) or if you delete the packaged rows before seeding — which you should not do. The numbers `CASE0000013`-`CASE0000022` quoted in older revisions of this guide were simply what one counter-allocated run produced.

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
| Target instance | **Verified on `https://dev379024.service-now.com`, release Australia Patch 3.** That is the only instance and the only release this procedure has been executed against. It is *expected* to work on any PDI from Zurich onward, because it uses no release-specific API — but that is an expectation, not a measurement. On any other instance or release, treat every step as requiring revalidation, and in particular re-check the three Performance Analytics child table names (`pa_tabs`, `pa_widgets`, and whatever this release calls the dashboard-to-role link), which are exactly what the dashboard defect turns on. |
| Admin account | `admin` role required (full `security_admin` elevation available) |
| Tools | `curl`, `python3`, a text editor. (Or just a browser for the UI path.) |
| Deliverable | **Updated 2026-09-02 — the delivery election is made:** `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.xml` is the **ELECTED** package — the untouched original, elected under checkpoint OVERRIDE-2 because the exact-byte gate could not be completed on any instance available to that run. **`7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` is the digest to check before you upload**, over a **3,781,097-byte, 926-block** file, and **926 is the child count to assert** in §4. **Read its status before you plan around it: the AAP §0.7.1 Update Set gate is binary and it is NOT MET on these bytes — no preview of any kind was ever run on them — so the artifact is not verified by round trip; running §5 against it is what closes that gate.** And know what it does not carry: measured on the file, **0 `sys_documentation` rows, 0 `sys_security_acl_role` rows and 25 hand-authored `sys_dictionary` rows**, so the 27 ACL role links are **not in the package** and §5's remediation passes must create them. **The rebuilt package is retained, not shipped**, at `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`: UTF-8, no BOM, **4,062,436 bytes (≈3.87 MiB)**, **988 `<sys_update_xml>` blocks**, SHA-256 `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7`. It satisfies AAP §0.5.2 dependency ordering and carries the platform-captured schema records and all 27 role links, and it is the **available upgrade path** — run §5 against it asserting **988** children on a genuinely clean PDI and it can be promoted back to the deliverable path (§10.0 of [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md)). Its 988 records are the records that were previewed and committed on 2026-09-02 — but that was measured on **export 3's byte sequence, SHA-256 `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`** (the same 988 records at the same byte count), because the file was afterwards re-sequenced into AAP §0.5.2 dependency order. The reordered file was verified statically (`xmllint --noout` clean, 988 blocks, block multiset identical to the previewed bytes, unchanged header, tail, byte count and 44-class census, every §0.5.2 dependency assertion passing) rather than by a further upload or preview, so **the upload → preview → commit trip on the `90ee0249…` bytes has never been run either.** The elected deliverable's own figures: UTF-8, no BOM, **3,781,097 bytes (≈3.61 MiB)**, **926 `<sys_update_xml>` blocks** behind 1 `<sys_remote_update_set>` descriptor, SHA-256 `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`. **Verify the digest before uploading** — this row has named three different revisions over the project's life and the wrong one will send you looking for defects that are already fixed. The immediately previous revision was 925 blocks / 3,698,577 bytes / `e49a7654…`; the QA-findings pass re-synced 13 payloads (8 `sys_report`, 2 `Dashboard`, 3 `sp_widget`) and added 1 block (the case form's Related Lists definition). Note that **no update-set preview has been run on these bytes** — see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.3c. (Older revisions of this row said "~768 KB, 148 `sys_update_xml`"; that predates the ATF suite, which alone accounts for **761** of the 926 blocks.) |
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
#     NOTE: sys_upgrade_history has NO `state` column on this release, and an invalid field in
#     sysparm_query is silently IGNORED - so the `state=executing` condition published in the
#     deployment instructions returns UNFILTERED rows and always looks like an upgrade is running.
#     Query the columns that exist instead: started but not finished.
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_upgrade_history?sysparm_limit=1&sysparm_query=upgrade_startedISNOTEMPTY%5Eupgrade_finishedISEMPTY"

# 2.3 Scope existence (clean install vs update)  -> zero records = clean
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
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
> - To **write** the scoped `x_casemgmt_*` tables from a background script you must run **in scope** — pass the
>   scope sys_id `82b99028936f74320d74d6f88357a5af` as the `SCOPE` argument. A `global` script may **read** them
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

> **Read this first — updated 2026-09-02, and the delivery election is made.** A single upload → preview →
> commit that produced three tables with physical storage and all **27** ACL role links by itself, with the
> remediation never run and no second commit, was measured on the rebuilt package's 988 records — on
> **export 3's byte sequence, 988 blocks / 4,062,436 bytes / SHA-256
> `eee9fabd91fb5dfe94657c22e71a4cfa448c46e4dc7d35189ed6bb6361e4d4ae`**, `2026-09-02T20:53:14Z`
> ([`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md)). **That package is retained rather than
> shipped**, so this section is **not** verification-only: on the elected deliverable it is **required as
> written**, defects C-storage and 9 included.
>
> **What ships, and what this section does for it.** The elected deliverable is the untouched original package
> at `update-set/x_casemgmt_case_management_update_set.xml` — 926 blocks / 3,781,097 bytes / SHA-256
> `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, byte-identical to `…FALLBACK.xml` — and
> **no preview of any kind was ever run on those bytes**, which is why Gate 7 in
> [`validation-gates.md`](./validation-gates.md) is recorded as **NOT MET** for it, the
> gate being binary rather than gradable, and why §10.0 item 1a of
> [`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) stands open. Electing it
> settled which package ships; it did not pass that gate, and the artifact must not be presented as verified by
> round trip. Running the
> steps of §4 and this section against the elected file on a **genuinely clean** PDI — verify the digest,
> upload, assert **926** children, preview to zero `type=error`, commit through the native "Commit Update Set"
> UI action, then run the two remediation passes and confirm physical storage and all 27 role links — is what
> turns that NOT MET into a MET for the deliverable; record `7292a6fe…` as verified with that run's timestamp
> when it completes.
>
> **The retained rebuilt package is the available upgrade path.**
> `update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml` — 988 blocks / 4,062,436
> bytes / SHA-256 `90ee024968f29a36f420eeeea908676054bc0d79067ff8d26e826662d78d35d7` — satisfies AAP §0.5.2
> dependency ordering and carries the platform-captured table and dictionary records together with all 27
> `sys_security_acl_role` links; the trip on its exact bytes has never been run either. The same §4 + §5
> sequence against **that** file, asserting **988** children, plus recording its digest as verified with that
> run's timestamp, is what makes it shippable and promotable back to the deliverable path — §10.0 carries it in
> full. A clean target is
> required either way: each file's `<sys_remote_update_set>` descriptor makes the loader reuse an existing
> retrieved set and append its children (`../scripts/round_trip_verify.md`, Phase 1 warning), and a populated
> instance returns `Found a local update that is newer than this one` collisions instead of the zero-problem
> result.
>
> Defect C's **choice-list half is not fixed on either package** —
> `sys_choice` is still empty for the three tables after commit — so §5a's choice-row steps still apply, and
> §5's step 7 (`seed_demo_data.js` in scope) is still needed for the seed linkage and `opened_date`.
> **Everything below is REQUIRED as written for the elected deliverable**
> (`update-set/x_casemgmt_case_management_update_set.xml`, and its byte-identical copy
> `update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`) and for older revisions.
>
> **On the elected package: upload → preview → commit does not give you
> a working application. Two defects need manual work every time:**
>
> | Defect | Carried by the package? | What you must do |
> |---|---|---|
> | **E** — auto-numbering | ✅ Yes, fully | Nothing. §5b is verification only |
> | **7** — REST `service_id` | ✅ Yes, fully | Nothing. §5d is verification only |
> | **C** — physical tables, fields, choice lists | ❌ **No** | §5a — mandatory |
> | **9** — 27 ACL role links + security-cache flush | ❌ **No** | §5f — mandatory |
>
> **Why C and 9 are not automatic, stated plainly.** The package ships the remediation itself —
> `scripts/post_import_remediation.js` and a Fix Script that carries it verbatim — but **not** an auto-execute
> trigger. One was built: an after-update Business Rule `x_casemgmt Post-Import Bootstrap` on
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
> **Running the Fix Script from the UI does not work either.** *System Definition → Fix Scripts → "x_casemgmt
> Post-Import Remediation" → Run Fix Script* executes that record **in the application scope** for the same
> reason, and fails the same way. The only route measured to work is a background script in scope **Global**.
>
> ### THE PRIMARY PROCEDURE — seven numbered steps, and the only one you should follow
>
> This is the single authoritative sequence. It is the procedure that was measured to work, it is what
> `scripts/post_import_remediation.js` documents in its own header ("step 4 and again step 6 of
> HUMAN_DEPLOYMENT_RECREATE_GUIDE section 5"), and it **does not delete anything by hand**. A destructive
> alternative exists and is described afterwards as a clearly-labelled fallback; **do not start with it.**
>
> | # | Step | What to do | Where |
> |---|---|---|---|
> | 1 | **Upload** | *System Update Sets → Retrieved Update Sets → Import Update Set from XML*, select the deliverable XML. Check the SHA-256 first (§1), then assert the loaded child `sys_update_xml` count — **926** for the elected deliverable (`7292a6fe…`), 988 if you are instead verifying the retained `…REBUILT-DEPENDENCY-ORDERED.xml`. Re-derive it from the file rather than trusting this row: `grep -c '<sys_update_xml ' <the XML>` | §4 |
> | 2 | **Preview** | Run Preview to completion. On a genuinely clean instance the expected result is **0 errors and 0 warnings**. Resolve any error; do **not** ignore a collision | §4 |
> | 3 | **Commit** | Commit to `state=committed` | §4 |
> | 4 | **Run the remediation in scope `Global`** — *first pass* | *System Definition → **Scripts - Background***, set **"In scope" = Global**, paste `scripts/post_import_remediation.js`, run. This pass builds the three tables' physical storage, their fields and their choice lists. It does the `sys_db_object` work itself; **you do not delete anything and you do not touch the application picker** | §5a |
> | 5 | **Commit the same Update Set a second time** | The rebuild in step 4 **cascades away all 26 ACLs**, the seed rows, the demo users and the role grants; a second commit restores them. This preview reports ~21 `Could not find a record in x_casemgmt_case for column case` / `…core_company for column organization` problems, because the tables now exist but are empty — set **those** to `status=ignored`. It also reports ~25 `sys_dictionary` collisions from the rows step 4 wrote moments earlier; accepting the remote is correct **for `sys_dictionary` only**, because the package now carries the corrected `display` and `defaultsort` values itself. **Never ignore a collision on any other table** | §4 again |
> | 6 | **Run the remediation in scope `Global`** — *second pass* | Same invocation as step 4. This is the pass that creates the **27** `sys_security_acl_role` links and flushes the security cache. Without it you have 26 ACLs with **0** role links, and on a high-security instance an ACL with no role, no condition and no script evaluates to **deny** — the application is unusable for every non-admin | §5f |
> | 7 | **Seed the demo data** | Run `scripts/seed_demo_data.js` **in scope** (not Global). Do **not** delete the packaged rows — they carry pinned numbers now and the script adopts them. Clear the dangling `sys_user_grmember` row if one is present | §5g |
>
> Run the remediation like this — **in `global`, never in scope**:
>
> ```bash
> /tmp/bg.sh servicenow-case-management-poc/scripts/post_import_remediation.js global
> ```
>
> **Steps 4 and 6 are the same command run twice.** That is deliberate, not a typo: the script is idempotent, and
> the two passes are separated by a commit because the commit is what restores the records the rebuild removed.
>
> **Updated 2026-09-02: on the elected package, steps 4, 5 and 6 ARE needed — run all seven.** The result in
> which steps 1-3 alone produced the physical schema and all 27 role links, with step 5's second commit never
> performed, was measured on the **retained rebuilt** package
> (`update-set/x_casemgmt_case_management_update_set.REBUILT-DEPENDENCY-ORDERED.xml`), which carries the 27
> `sys_security_acl_role` records; the elected package carries **0** of them, so steps 4-6 are the procedure for
> the artifact that ships, not history. Step 7 and the outstanding choice rows apply to both —
> [`refine-run/FINAL-REPORT.md`](./refine-run/FINAL-REPORT.md) records which result belongs to which file.
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
> `x_casemgmt_case_task`, `x_casemgmt_case_party`, `x_casemgmt_case` — then run the remediation in **Global**,
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
> curl -s -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" -H "Accept: application/json" \
>   "$SERVICENOW_INSTANCE_URL/api/now/table/syslog?sysparm_query=messageSTARTSWITHX_CASEMGMT_REMEDIATION%5EORDERBYDESCsys_created_on&sysparm_fields=sys_created_on,message&sysparm_limit=100"
>
> # Corroborating, no log reading needed: exactly 27 ACL role links must exist.
> curl -s -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" -H "Accept: application/json" \
>   "$SERVICENOW_INSTANCE_URL/api/now/table/sys_security_acl_role?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_id&sysparm_limit=100"
> ```
>
> On a genuinely clean instance the summary reads `tables_built=3` and `acl_links_created=27`; on a repeat it
> reads `tables_already=3` and `acl_links_already=27`. Either way the proof of convergence is
> `verified=true|…|errors=0` **together with** `acl_links_total=27|acl_links_expected=27`. The count must be
> **exactly** 27, distributed manager 14 / agent 10 / viewer 3 — the script rejects a surplus as well as a
> shortfall, and removes unexpected links, so a number other than 27 means it has not converged.
>
> §5c, §5e and §5g are unchanged.

Where a step below still needs a script, run it via `bg.sh`. Read results back from the response
(`/tmp/bg_out.html`) — extract `*** Script:` lines for `global` scripts, or query `syslog` for `gs.info`
markers from in-scope scripts. **All cross-references are resolved by name/number lookup — never by
hard-coded `sys_id`.**

### 5a. Materialize `x_casemgmt_case_task` & `x_casemgmt_case_party` tables + all choices  *(Defect C)*

**MANDATORY MANUAL STEP — this is step 4 of the primary procedure above.** The package ships the automation but
it cannot complete (see the preamble). You must do this yourself — and it is **one command**:

```bash
/tmp/bg.sh servicenow-case-management-poc/scripts/post_import_remediation.js global
```

The script performs the `sys_db_object` deletion and the table rebuild itself. Measured on a clean install of the
shipped package, from **Global** with no application picker set: `clean slate|dictionary_rows_removed=14|
db_object_rows_removed=1|residue=0|reusing_sys_id=yes` per table, then the platform's own DDL
(`Creating table: x_casemgmt_case`, `DBTable.create() for:`, `ALTER TABLE x_casemgmt_case ADD number VARCHAR(40)`),
then `built|signals=GlideTableDescriptor.isValid=yes,GlideRecord.isValid=yes,TableUtils.tableExists=yes` — ending
`tables_built=3, fields_created=25, choices_created=24, counters_written=3`.

> **Then go straight to step 5 — commit the Update Set a second time.** Rebuilding the tables **cascades away all
> 26 ACLs**, the seed rows, the demo users and the role grants, so this run necessarily ends
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
source /tmp/snow/env.sh
for T in x_casemgmt_case x_casemgmt_case_task x_casemgmt_case_party; do
  printf '%s -> ' "$T"
  curl -s -o /dev/null -w '%{http_code}\n' -u "$SERVICENOW_USERNAME:$SERVICENOW_PASSWORD" \
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

**MANDATORY MANUAL STEP — this is step 6 of the primary procedure at the top of §5.** Run the remediation in
scope **Global** *after* the second commit:

```bash
/tmp/bg.sh servicenow-case-management-poc/scripts/post_import_remediation.js global
```

The security-cache flush (`GlideSecurityManager.get().reset()`) happens inside that same run, so there is no
separate step for it — but it is also the reason the run cannot happen in scope, and therefore cannot happen
automatically on commit. **Skipping this step leaves 26 ACLs with 0 role links, and on this high-security
instance an ACL with no role, no condition and no script evaluates to `deny` — no non-admin can use the
application at all.**

Expect on the `SUMMARY` line: `verified=true`, `acl_links_total=27`, `acl_links_expected=27`,
`security_cache_flushed=true`, `errors=0`. The total must be **exactly** 27, distributed manager 14 / agent 10 /
viewer 3; the script rejects a surplus as well as a shortfall and deletes unexpected links, so any other number
means it has not converged.

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
# This is step 7 of the primary procedure. Note the scope argument: seeding runs IN SCOPE,
# unlike the remediation, which must run in Global.
/tmp/bg.sh servicenow-case-management-poc/scripts/seed_demo_data.js 82b99028936f74320d74d6f88357a5af
```

Do **not** delete the packaged seed rows first — that instruction belonged to an earlier revision. Every
packaged row now carries a pinned number (`CASE9000001`+, `TASK9000001`+, `PARTY9000001`+), and `ensureCase()` /
`ensureTask()` / `ensureParty()` match on that number **first**, adopt the row, and fill only the columns that
are still empty (`case` on tasks and parties, `organization` on Organization parties — the two reference classes
that Update Set preview forces to ship empty). Nothing already populated is overwritten, so a second run
reports `repaired=0` and inserts nothing. Expect `cases inserted=0 adopted=10 …` on a committed install; you
will see `inserted=10` only if you run the script on an instance where the package was never committed, in
which case the instance counter allocates the numbers instead. Clear the dangling `sys_user_grmember` row if
one is present.

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
  curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
    "$SN/api/now/table/sys_user_role?sysparm_query=name=$r&sysparm_fields=name"
done
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_scope?sysparm_query=scope=x_casemgmt&sysparm_fields=scope,sys_id"

# The single most informative post-install check: the ACL role links must number EXACTLY 27.
# 0 means step 6 has not run; anything other than 27 means it has not converged.
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_security_acl_role?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=sys_id&sysparm_limit=100"

# Corroborating counts: 26 ACLs, 7 case Business Rules, and 7 flows all active AND published.
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_security_acl?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=name,operation&sysparm_limit=50"
curl -s -K /tmp/sn_curl.cfg -H "Accept: application/json" \
  "$SN/api/now/table/sys_hub_flow?sysparm_query=sys_scope.scope=x_casemgmt&sysparm_fields=internal_name,active,status&sysparm_limit=20"
```

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

Portal UI: `https://dev379024.service-now.com/x_casemgmt_case_portal`.

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
- **Run steps 4-7 of the primary procedure first.** Without physical tables and the 27 ACL role links, the suite
  fails wholesale and tells you nothing about the application.
- **Expected result: 20 Success / 0 Failure / 0 Error / 0 Skipped, with 180 of 180 step results Success**, in
  roughly 4 minutes, leaving no test records behind. That rollup was reproduced twice independently
  (`TES0001016` and `TES0001017`). **Record your own rollup rather than looking for a particular `TES…` row:**
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
| Scope / `sys_app` | `x_casemgmt` — `82b99028936f74320d74d6f88357a5af` |
| Roles | `x_casemgmt_case_manager`, `x_casemgmt_case_agent`, `x_casemgmt_case_viewer` |
| Demo users | `x_casemgmt_demo_manager`, `x_casemgmt_demo_agent`, `x_casemgmt_demo_viewer` |
| Demo group | `x_casemgmt_demo_team` (member: Demo Agent) |
| Portal URL | `https://dev379024.service-now.com/x_casemgmt_case_portal` |
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
| `case_task` / `case_party` not visible after commit | Commit does not DDL new tables (Defect C) | Run **5a** — that is step 4 of the primary procedure, not an exception |
| New cases get no `CASE…` number, or get `CASE1` instead of `CASE0000001` | **Package integrity, not the platform.** Both halves of auto-numbering ship in the package: `default_value = javascript:global.getNextObjNumberPadded();` on the `number` dictionary entry (the `global.` qualifier is mandatory for a scoped table) and `maximum_digits = 7` on the counter | Verify those two values landed, then re-run the remediation in Global — §5b re-asserts both. If they are absent from the *artifacts*, the package is wrong and no amount of instance work fixes it |
| All REST calls return HTTP 400 | **Package integrity:** `sys_ws_definition.service_id` is the URL path segment and it is empty | The package carries both `service_id` values; verify they committed, then re-run the remediation — §5d re-asserts them. Also confirm the base path is `/api/x_casemgmt/…` |
| Anonymous REST call returns 401 rather than 201/200/404 | The endpoint's anonymous access flag did not land, or you are hitting the **Table** API instead of the scripted REST path | Only `/api/x_casemgmt/case_submit` and `/api/x_casemgmt/case_status_lookup` are anonymous. The Table API is *not* anonymous and rejecting it is correct behaviour, not a defect |
| Manager/agent/viewer denied everything | ACL role-links missing (Defect 9) | Run **5f** — step 6 of the primary procedure — then confirm **exactly 27** links, distributed manager 14 / agent 10 / viewer 3 |
| Resolve allowed with open tasks, or any precondition not blocking | **Check the enforcement chain, in this order.** (1) Are the 7 flows `active=true` and `status=published`? They were measured so; a Draft flow enforces nothing. (2) Is the before-update Business Rule **`x_casemgmt_enforce_forward_transitions` (order 250)** present and active? It is the component that calls the subflow and then issues `gs.addErrorMessage()` + `setAbortAction(true)` — **without it the flows still run but nothing blocks**. (3) Is `CaseTransitionValidator` present? The rule and the flows both call it | The earlier "flow guards are dead shells" (Defect F) diagnosis applied to a previous revision and no longer describes this package — see `PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` for that history |
| Dashboards open but show no widgets | **Fixed in the current package** — if you see this, you are installing an older export whose dashboard artifacts named three child tables this release does not have (`pa_tab`, `pa_dashboard_widgets`, `pa_dashboard_role`) | Not remediable by installing differently. Use the current export, whose dashboards carry `sys_portal_page` / `sys_grid_canvas` / `pa_tabs` / `pa_m2m_dashboard_tabs` / `sys_portal` + `sys_portal_preferences` + `sys_grid_canvas_pane` / `pa_dashboards_permissions` (register §0.5) |
| A dashboard opens with *"has not been shared with you"* | Expected for two persona/dashboard pairs **by design** — the agent is not granted Manager View, and the viewer is granted neither. Unexpected for anyone else, in which case the share records did not land | Confirm `pa_dashboards_permissions` rows exist (type `1` = Role) **and** that `pa_dashboards.restrict_to_roles` names the role. Both are required; the sibling column `pa_dashboards.roles` is labelled *"Requires Roles"* and only narrows (register §4 item 18) |
| A chart is grouped by the wrong field | **Fixed in the current package.** The chart reports used to carry their grouping in `<group_by>`, which is **not a column** on `sys_report` on this release, so it was discarded on import; the column a chart groups on is `field` (register §0.6.1) | Use the current export. If you must patch an old one: rename the element to `field` in the four chart `reports/*.xml` and their four payloads, then re-export |
| A report opens as *"private"* or is refused to every persona | `sys_report.user` is empty. The read ACL only evaluates `roles` on the `isGlobal` path, so a report with roles but no `user` is private to its owner | Set `sys_report.user` to the literal `GLOBAL` **and** populate `roles`. All 8 packaged reports carry both (register §0.6.1) |
| The case form shows no related lists | **Fixed in the current package** — but this can also be a *cache* symptom on an instance that rendered the form before the definition arrived, in which case *Configure ▸ Related Lists* will misleadingly show both lists as Selected while the form stays empty | Open a case → context menu → **Configure ▸ Related Lists** → press **Save** with nothing moved. A REST `PUT` of the same values is a no-op and will not clear it (register §4 item 17, `deployment.md` step 12) |
| Portal pages are blank | **Fixed in the current package** — the Service Portal layout records (container / row / column / instance) had never been authored | Use the current export. The REST endpoints work regardless and can be used to demonstrate the contract |
| `Organization` is empty on every Case Party for a non-admin user | Not a defect in this application. `core_company` is a global out-of-box table and the demo personas cannot read it, so the platform strips the column from their payload; `admin` sees the real value | Disclosed as **ADV-1** in register §0.9. The only remedy is a grant on `core_company`, which AAP §0.3.2 forbids |
