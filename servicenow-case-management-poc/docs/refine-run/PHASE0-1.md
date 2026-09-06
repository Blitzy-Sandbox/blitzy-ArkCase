# Refine Run — Phase 0 and Phase 1 S0/S1/S2 Report

> **⚠ HISTORICAL PHASE RECORD — artifact identities and screenshot paths below are superseded.**
> This report describes the state at its own phase exit (`2026-09-02T18:40:16Z`). **Three commits
> landed long afterwards** (`f8454fb078`, `6efb13b141`, `8dfdbcb015`) and rewrote the update-set
> artifacts without re-running the D36 gate, taking the deliverable path to
> `9f3ea74c043c0e2c966d4b4314dc6c0868583780becf79316d792da1d9cf60a9`, 3,973,569 bytes, 935 payload
> blocks — measured, never gate-verified.
> **CORRECTED 2026-09-05 — the deliverable path holds the exact, untouched elected package again:**
> `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7`, 3,781,097 bytes, 926 payload
> blocks, `cmp`-identical to `…_update_set.FALLBACK.xml`. Those three commits' amendments
> (`9f3ea74c…`, 3,973,569 bytes, 935 blocks) were never previewed on any instance and are retained,
> explicitly non-shipping, at `…_update_set.AMENDED-NOT-GATED.xml`. What the shipped package
> therefore does NOT include is itemised in [`FINAL-REPORT.md`](./FINAL-REPORT.md) § "Artifact
> identity and evidence — RESTATED": the 7 name-keyed choice collections (the single root cause of
> the six ATF failures), 4 business rules, 1 form layout, 1 onLoad client script and the 3
> `query_range` ACLs — and, separately and true of every shippable file, all 27
> `sys_security_acl_role` role links, which only `…REBUILT-DEPENDENCY-ORDERED.xml` carries.
> **`scripts/post_import_remediation.js` therefore REMAINS MANDATORY on a clean instance** — without
> it a bare commit of the shipped bytes leaves the three scoped tables **without physical storage**
> and the ACLs **without role links**, so every ACL denies every non-admin. One caveat travels with
> it: the script asserts 29 ACLs / 36 links (the figures the repository's 29 `acl/*.xml` artifacts
> describe) while the shipped package supplies only **26** ACLs, so a clean-instance run reports that
> shortfall as a **named** non-convergence and tells the operator to import the three `query_range`
> ACL records from `acl/` and re-run.
> The 926-block / 3,781,097-byte / `7292a6fe…` package
> this unit imported and retained is what both `…FALLBACK.xml` and the deliverable path hold. Every
> screenshot basename this report originally cited was absent from disk; the two Phase 1 S1 probe
> checkpoints have since been **re-captured** on a disposable probe and are cited by verified
> absolute path in §3.2. The Phase 0
> landing-page checkpoint was re-captured and is cited by verified path in §2.2. Read
> [`FINAL-REPORT.md`](./FINAL-REPORT.md) § "Artifact identity and evidence — RESTATED
> 2026-09-05T04:45Z" and [`run-state.json`](./run-state.json) `final.qa3_remediation` before relying
> on any hash, size, payload count, instance figure or screenshot path below.

Unit U1 of the Refine PR sequence. Scope of this report: Phase 0 (establish a live instance) and
Phase 1 steps **S0** (import + fallback), **S1** (scratch native-creation validation) and **S2**
(delete the test artifacts, re-set the master set current).

Phase 1 steps **S3–S6** (the real rebuild) belong to the next unit, Phase 2 (preview/commit) to the
unit after that, and Phase 3 (ATF) to the one after that. Nothing in those steps was performed here.

- Target instance: `https://dev306625.service-now.com` — Zurich Patch 10
- Scope: `x_casemgmt`, scope `sys_id` `82b99028936f74320d74d6f88357a5af` (always resolved by query
  `sys_scope?sysparm_query=scope=x_casemgmt`, never from a literal)
- Machine-readable state for the following units: [`run-state.json`](./run-state.json)
- No credential, session token or cookie value appears in this file, in `run-state.json`, or in any
  committed artifact.

---

## 1. Credential and target pre-checks (before any wake/heartbeat activity)

A presence-and-plausible-format check only — neither credential set can be functionally validated
before a session exists.

| Variable | Presence | Format check | Result |
| --- | --- | --- | --- |
| `SERVICENOW_DEV_LOGIN_USERNAME` | `present=true` | `format_plausible=true` — non-empty, no whitespace, email-shaped | PASS |
| `SERVICENOW_DEV_LOGIN_PASSWORD` | `present=true` | `format_plausible=true` — non-empty, minimum-length policy satisfied | PASS |
| `SERVICENOW_INSTANCE_ADMIN_URL` | `present=true` | `format_plausible=true` — matches `^https://dev[0-9]+\.service-now\.com/?$` | PASS |
| `SERVICENOW_INSTANCE_ADMIN_USERNAME` | `present=true` | `format_plausible=true` — non-empty, no whitespace | PASS |
| `SERVICENOW_INSTANCE_ADMIN_PASSWORD` | `present=true` | `format_plausible=true` — non-empty, minimum-length policy satisfied | PASS |

Each check emitted and committed a boolean decision only: no length, prefix, substring or any other
shape metadata about any of these values was recorded. No interactive prompt for a credential was
issued at any point.

**Target verification.** Resolved host `dev306625.service-now.com` — the validation PDI this run used.
It was **not** newly provisioned: per INTERP-2 it already held this scoped application installed,
committed, converged and seeded when the run began, and the clean target Phase 1 needed was obtained
later by a targeted clean-state operation whose cascade exceeded the destructive boundary it was
authorized under (§Phase 1, and `run-state.json` `phase1.instance_clean_state`). **The intended target
was authorized under OVERRIDE-3** — the three scoped tables' `sys_db_object` records, their
`sys_dictionary` rows, their data rows and the scoped `sys_security_acl_role` links — **but the
platform's table-delete cascade reached beyond that subset, which is a scope violation of the
destructive boundary rather than an authorized side effect**: it also removed 26 `sys_security_acl`,
24 `sys_choice` rows, 7 business rules, 8 `sys_report`, 3 `sys_ui_list`, 1 `sys_ui_related_list`, 2
`sys_ui_policy` and the 3 `sys_number` counters, measured before and after in
[`PHASE1-REBUILD.md` §2.5](./PHASE1-REBUILD.md). On a live instance the application therefore carried
zero ACLs, zero ACL-role links, zero business rules and zero UI policies from `2026-09-02T19:22:09Z`
until the Phase 2 commit at `2026-09-02T20:53:14Z` — roughly **91 minutes** — and that is the
**second, independent ground on which Phase 1's hard gate is NOT MET**, alongside the role-link/grant
mechanism deviation. Neither the deletion command having named only the three `sys_db_object` records,
nor the Phase 2 commit's later restoration of the removed records, authorizes that reach. **Any
equivalent future operation MUST run the pre-delete collateral guard first**: a read-only enumeration
of the platform's delete dependencies before the first delete, an abort with **nothing deleted** on
any non-zero count in a class outside the authorized subset, the phase recorded as unmet on that
ground, OVERRIDE-2's fallback / leave-for-human path, and no further destruction without an explicit
human expansion of the destructive scope — specified in [`PHASE1-REBUILD.md` §2.5](./PHASE1-REBUILD.md)
and in `run-state.json` `final.scope_audit_d46.override_3_destructive_boundary`. It is **not** the
retired `dev379024`, and it is a developer PDI host
(`devNNNNNN.service-now.com`), not a customer production or customer-owned instance. No instance was
provisioned, released or re-requested.

**Credential handling used throughout.** A curl config was written to the run's private scratch
directory (outside every repository checkout) with mode `0600` and consumed as `curl -sS -K <cfg>`,
so the password never entered a process list, a log, or a repository file:

```
printf 'user = "%s:%s"\n' "$SERVICENOW_INSTANCE_ADMIN_USERNAME" "$SERVICENOW_INSTANCE_ADMIN_PASSWORD" > <scratch>/sn.cfg
chmod 600 <scratch>/sn.cfg
curl -sS -K <scratch>/sn.cfg "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/..."
```

Browser work was briefed to read the credentials from the environment variables (or that same
config file) — no credential literal was ever passed in a task brief.

---

## 2. Phase 0 — live, authenticated, non-hibernating session

### 2.1 Connectivity verification (detection by CONTENT, not by HTTP status)

| Step | Call | Observed | Verdict |
| --- | --- | --- | --- |
| 1 | `GET /api/now/table/sys_remote_update_set?sysparm_limit=1` | HTTP 200 with a **valid JSON body** (1 result) | reachable, credentials valid, **not** hibernating |
| 2 | `GET /api/now/table/sys_upgrade_history?sysparm_limit=1&sysparm_query=upgrade_startedISNOTEMPTY^upgrade_finishedISEMPTY` | HTTP 200, **0 records** | not mid-upgrade — proceed |

Hibernation on this platform answers HTTP 200 with an HTML splash, so the decisive signal is the
body: a JSON body means live, an HTML body would have meant hibernating. Neither 401 (credentials)
nor 403 (access) nor a connection timeout/DNS failure (wrong URL / deprovisioned) occurred.

### 2.2 Browser (UI) confirmation

A real browser session logged in through the UI form at `/login.do` (fields `user_name`,
`user_password`) and reached the landing page `https://dev306625.service-now.com/now/nav/ui/home`
(primary route; the `/home.do` fallback was not needed).

- Authenticated: the user menu shows **System Administrator** (the avatar control's accessible name
  reads `System Administrator: Available`).
- Live by content: a shadow-DOM-aware deep text extraction of the rendered page (10,601 characters)
  scored **zero** occurrences for every hibernation marker (`hibernating`, `hibernate`,
  `hibernation`, `wake up instance`, `waking up`, `sign in to wake`, `reclaimed`,
  `developer.servicenow.com`) and zero for `invalid login`. The positive determination rests on
  rendered application chrome plus server-backed data a static splash cannot produce — verbatim from
  the page: "Welcome to Admin Home, System!", "Current version — Zurich", "Entitled ServiceNow apps:
  Needs update 174 / Installed 239 / Total 3129". All 117 landing-page requests returned 2xx.
- Console: **zero errors** on the landing page. Pre-existing base-platform noise elsewhere (two
  `/login.do` script errors and one cosmetic SVG `NaN` path error on the welcome page) is not caused
  by this run.

**SCREENSHOT — instance landing page once confirmed live.** The original capture,
`phase0-landing-page.png`, is **NOT RETRIEVABLE** — named here as a basename only, never as a path
to open: `blitzy/screenshots/` is untracked by design under **INTERP-6**, so the absolute path that
once resolved into it stopped resolving the moment the working tree was re-created, and nothing
carried the binary across. **This checkpoint was re-captured live on 2026-09-05T04:50Z** and the
replacement was verified on disk as a readable PNG with a valid signature and `IEND` terminator:

`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa-refix-phase0-landing-page-recaptured.png`
Caption: *Phase 0 — instance landing page confirmed live and authenticated: Polaris Admin Home on
`dev306625`, "Welcome to Admin Home, System!", the Instance-upgrade tile reading **Current version
Zurich**, user menu reading **System Administrator***

### 2.3 Wake sequence and recovery accounting

The instance was **live at first contact**, so the wake sequence was never entered.

| Item | Value |
| --- | --- |
| Hibernating at start | no |
| Wake performed | no |
| Recovery cycles used | **0** of the 3 permitted per run |
| Recovery cycle durations | none (no cycle occurred) |
| Fix-and-re-verify attempts used | **0** — counted independently of the recovery cap |

Had a wake been required, the route is the Developer Site (`developer.servicenow.com/dev.do` →
sub-nav **"Manage my instance"** → **"Wake Instance"** when not Online, otherwise **"⟳ Refresh"**),
polling roughly every 30 s and judging by content, with a 15-minute / 30-poll timeout. No instance
was ever released or re-requested.

### 2.4 Heartbeat

Running, on its own clock, for the remainder of this unit.

**(a) Required mechanism, and the one condition that licenses the API variant.** Directive
lines 76–84 require the **browser/UI heartbeat** for the general sequence: a rendered
navigation to `home.do` in the authenticated browser session, on an independent ~10-minute
clock, judged live **by content**. The **API-context heartbeat**
(`GET /api/now/table/sys_user?sysparm_limit=1`) is the **narrow exception**, permitted
**only while the Retrieved Update Set record page or the commit-result page must be
preserved** — navigating away would destroy the page state the commit resume check depends
on.

**(b) Mechanism actually used — the API variant, for the whole run, Phase 0 to end.**

| Item | Value |
| --- | --- |
| Mechanism used | API context — `GET /api/now/table/sys_user?sysparm_limit=1` (read-only; never a write) — for **every** interval of the run, not only the commit window |
| Interval | 10 minutes |
| Driven by | detached background loop (`nohup … &`), one lightweight action per interval |
| PID | 8099 |
| First recorded beat | `2026-09-02T17:34:43Z 200` |
| Phase 3's beats, as an example of the same loop | 21:04:43, 21:14:43, 21:24:43, 21:34:43, 21:44:43, 21:54:44, 22:04:44 — all HTTP 200 |

```
nohup bash -c 'while :; do printf "%s " "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> <scratch>/heartbeat.log; \
  curl -sS -K <scratch>/sn.cfg "$SERVICENOW_INSTANCE_ADMIN_URL/api/now/table/sys_user?sysparm_limit=1" \
  -o <scratch>/hb_body.txt -w "%{http_code}\n" >> <scratch>/heartbeat.log; sleep 600; done' >/dev/null 2>&1 &
```

**The one interval where this mechanism was the correct one — retained, now correctly
scoped.** For the commit step of the following phase, while sitting on the Retrieved Update
Set record or the commit-result page, this API-context heartbeat is what the directive's
exception licenses, and browser navigation to `home.do` is what it forbids there,
so the page state needed for the commit resume check is not lost. Phase 2 honoured that
exception (`PHASE2.md` §5). The deviation is not that interval; it is every **other**
interval of the run, where the browser/UI heartbeat was required and the API variant was
used instead.

**(c) This is a DEVIATION from directive lines 76–84 in mechanism selection, not
compliance.** The general sequence ran on the exception's mechanism. The API variant was
selected globally at Phase 0 and never switched back to a rendered `home.do` navigation
outside the commit window, so the mandated browser/UI heartbeat was **not** executed during
the run.

**(d) Observed impact: none.** **0 hibernation events** and **0 recovery cycles** for the
whole run, so no availability decision turned on the variant chosen, and **both variants
are read-only** — neither the deviation nor the mandated mechanism writes anything to the
instance.

**(e) Corrective action taken in the CR2 remediation pass.** The mandated
**browser-context heartbeat** was executed against `home.do` in a rendered, authenticated
session:

| Beat | Timestamp (UTC) | Judged live by | Session |
| --- | --- | --- | --- |
| BEAT 1 | `2026-09-03T04:23:34.684Z` | page **content** — `/hibernat/i` false against the full 186 KB rendered DOM, Polaris shell components present, server-computed dashboard aggregates returned | user menu confirmed **"System Administrator"** |
| BEAT 2 | `2026-09-03T04:34:04.494Z` | same content checks, same result | same |

Delta between beats: **630 s**, i.e. the required ~10-minute independent clock. The two captures
`heartbeat-beat1-home-rendered.png` and `heartbeat-beat2-home-rendered.png` are **NOT RETRIEVABLE**
and are named as basenames only: the PNG binaries were correctly not committed under INTERP-6, the
directory is untracked, and nothing carried them across the working-tree rebuild. The durable
evidence for both beats is the timestamp pair and the content checks recorded in the table above. That pass performed **no commit and no PDI write of any kind**,
so **no commit-page exception window arose** and the API variant was **not used at all in
it**. The **browser→API and API→browser transition pair is therefore NOT APPLICABLE to that
pass**; the exact condition that would trigger it in a future run is the one in (a) — the
moment a Retrieved Update Set record page or a commit-result page must stay open, switch to
`GET sys_user` for the duration and switch back to the rendered `home.do` navigation as
soon as the page is no longer needed, recording both transitions.

**(e2) SECOND corrective pass — the QA5 record-integrity checkpoint, 2026-09-05.** The mandated
**browser-context** heartbeat was executed again, and this time the **mechanism** and the
**timestamp** are both recorded for **every** interval — which is exactly what the earlier record
omitted:

| Beat | Timestamp (UTC) | Mechanism, stated per interval | Judged live by | Screenshot (absolute path) |
| --- | --- | --- | --- | --- |
| A | `2026-09-05T20:14:57Z` | **browser navigation to `home.do`** in a rendered, authenticated session — not an API read | page **content**: a real rendered page, not a hibernation splash | `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa5-heartbeat-a-home.png` |
| B | `2026-09-05T20:36:12Z` | **browser navigation to `home.do`** | same — confirmed a real rendered page, not a hibernation splash | `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa5-heartbeat-b-home.png` |
| C | `2026-09-05T20:55:00Z` | **browser navigation to `home.do`** | same — confirmed a real rendered page, not a hibernation splash | `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa5-heartbeat-c-home.png` |
| D | `2026-09-05T21:35:42Z` | **browser navigation to `home.do`** | same — confirmed a real rendered page, not a hibernation splash | `/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/qa5-heartbeat-d-home.png` |

All four beats used the **same** mechanism; no interval of this pass ran on the API variant, and no
commit-page exception window arose because the pass performed **no commit and no PDI write of any
kind**. **0 hibernation events, 0 recovery cycles.**

**Stated plainly, because the earlier record left it to be inferred: the ORIGINAL run used the
API-context heartbeat for EVERY interval** — `GET /api/now/table/sys_user?sysparm_limit=1` on its
own 10-minute clock, from Phase 0 to the end of the run — **and no session loss resulted from it.**
0 hibernation events and 0 recovery cycles for the whole run. The finding against it is one of
**mechanism selection against directive lines 76–84**, not of cadence, and not of consequence.

**(f) STANDING CONTROL — mechanism selection for every future run on this package. This is
a rule, not an observation: an executor is bound by it and does not re-derive it.** The
failure in (b)/(c) is one of mechanism selection, not of cadence — the 10-minute clock ran
on its own throughout, per (b); what went wrong is that the exception's mechanism was
chosen once, globally, at Phase 0 and never switched back. The control therefore fixes
*which* mechanism is in force at every moment of a run, and makes each change of mechanism
a recorded event:

| # | Rule | Applies |
| --- | --- | --- |
| **f1** | The **browser/UI beat is the DEFAULT**: a rendered navigation to `home.do` in the authenticated browser session, judged live **by content** (hibernation markers absent, application chrome and server-computed data present), on the independent ~10-minute clock, never paused and never merged into another wait | every interval of every phase that is not covered by **f2** |
| **f2** | The API-context beat (`GET /api/now/table/sys_user?sysparm_limit=1`, read-only) is the **narrow exception** and is used **only** for the intervals that fall inside the window where a Retrieved Update Set record page or a commit-result page must stay open — the Phase 2 Commit step and its RESUME CHECK. It is licensed by nothing else: not convenience, not the phase being long, not the browser being busy | the record/commit-result window only |
| **f3** | The beat **switches back to f1 the moment that page is no longer needed** — the commit outcome having been read and the RESUME CHECK answered — and not at the end of the phase, the end of the next interval, or any later point of convenience | at the close of every **f2** window |
| **f4** | **Both transitions are recorded**, browser→API and API→browser, each with its UTC timestamp, the page that opened or released the window, and the mechanism in force after the switch. A run that reports no transition pair must state that no **f2** window arose, as (e) does for the CR2 pass — silence is not a record | every **f2** window, and every run that has none |
| **f5** | The clock is independent of the mechanism: a switch under **f2** or **f3** does not restart, delay or skip an interval, and the ~10-minute cadence is unbroken across the boundary | every switch |

This control governs mechanism selection **from its adoption forward**. It does not, and
cannot, repair the intervals in (b) — Phases 0 through 3 ran on the **f2** mechanism where
**f1** was required, and §2.5 records that deviation as unresolved for the original run.

### 2.5 Phase 0 exit condition

> Live, authenticated, non-hibernating session confirmed by content, with heartbeat running.

**MET at 2026-09-02T17:52:29Z (UTC) — with the mechanism deviation of §2.4 recorded against it,
so this is not full directive compliance.** The condition as written was satisfied literally: the
session was live, authenticated and non-hibernating, confirmed by content, and a heartbeat *was*
running. But it ran on the **API variant** where directive lines 76–84 required the **browser/UI**
variant outside the Retrieved-Update-Set / commit-page exception, so the phase is recorded as met
**with a deviation**, never as compliant. Observed impact: none — 0 hibernation events and 0
recovery cycles for the whole run, and both variants are read-only.

**This deviation is not resolved for the original run, and cannot be.** Closing it in the sense the
directive means would require re-executing Phases 0–3 on a permissible target with browser `home.do`
beats outside Commit, the read-only `GET sys_user` beat only while the Retrieved Update Set record or
commit-result page had to stay open, and both transitions recorded around the Commit interval. That
re-execution is barred: the single provisioned instance is protected by the environment directive and
already holds the committed application, and provisioning or re-requesting a clean one is prohibited
("never release/re-request a new instance"). The browser-context heartbeat executed in the CR2
remediation pass (§2.4(e)) demonstrates the mandated mechanism, and the standing control **§2.4(f)**
binds mechanism selection for every future run — browser `home.do` beat by default, the read-only
`GET sys_user` beat only inside the record/commit-result window, switched back the moment that page
is no longer needed, with both transitions recorded. Together they correct the selection going
forward and nothing more: the CR2 pass performed no commit, so it records no browser→API→browser
transition pair, and neither it nor §2.4(f) retroactively replaces the mechanism used through
Phases 0–3.

---

## 3. Single-test result — Phase 1 S0, S1, S2

This section is the single-test result, reported ahead of any full-package result.

### 3.1 S0 — retain the FALLBACK PACKAGE and import the master package

**Fallback retained first, before any write to the instance.**

| Item | Value |
| --- | --- |
| Fallback path | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.FALLBACK.xml` |
| SHA-256 (fallback) | `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` — still the bytes `…FALLBACK.xml` holds, re-verified 2026-09-05T04:45Z after an intervening overwrite and restoration |
| SHA-256 (source deliverable at import time) | `7292a6fe30413a9fb0b115e160c668edb7487b4391865b21a011a7be1add66b7` — **a measurement of the deliverable path at `2026-09-02T17:55Z`, and true of that path again after the 2026-09-05 identity correction.** *(It was untrue of the path in between, while three later commits' amendments `9f3ea74c…` / 3,973,569 B / 935 blocks sat there; those bytes are retained at `…AMENDED-NOT-GATED.xml`.)* |
| Byte comparison | `cmp` reported the two files identical **at import time**; they are no longer identical, and after the 2026-09-05T04:45Z restoration of the fallback that is the correct state rather than a defect |
| Well-formedness | `xmllint --noout` passes on the copy |
| Payload blocks | **926** `<sys_update_xml action="INSERT_OR_UPDATE">` — the reconciliation anchor for the rebuild's count delta. Correct for these bytes; the shipping file carries **935** after three later commits added 9 payloads |
| Original deliverable | **unmodified by this unit** (`git diff --stat` on it was empty here); it was modified by commits after the run — see the note at the top |

**Live pre-import baseline (read-only).** One retrieved update set existed:
`9929f50df18ccec91ea13b2a3bccfc90`, "x_casemgmt_case_management v1.0.0", `state=committed`, 926
children, `sys_created_on 2026-04-30 12:00:00`. Three local update sets existed:
`066c23c69383435009aa70d19dba10d3` (complete), `59a5a3069343435009aa70d19dba10e8` (complete) — the
two stale sets sharing the package's name — and `934aabce9343435009aa70d19dba10fe` ("Default",
in progress, current at that moment).

**A structural hazard in the package, and how the import was made safe.** The package's single
`<sys_remote_update_set>` envelope carries `<sys_id>9929f50df18ccec91ea13b2a3bccfc90</sys_id>` — the
sys_id of the *already-committed* retrieved set above — and all 926 children point their
`remote_update_set` field at it, while 913 of the 926 carry no child-level `sys_id` of their own. The
live record's `sys_id` **and** its `sys_created_on` are verbatim the values inside the file, which
proves the XML loader honours the file's record identity. Uploading the file unmodified would
therefore have updated that committed record (resetting its state and appending children into it) —
an out-of-scope mutation and a polluted baseline.

The import therefore uploaded a **scratch-only re-enveloped copy** of the package through the same
proven mechanism. The transformation touched record identity only:

- envelope `sys_id` → a freshly generated value, `b4861cf7bbe24b36926fcaff4583b5bf`
- envelope `name` → `x_casemgmt_case_management v1.0.0 (native rebuild import)` (unconfusable with
  the committed set and the two stale local sets)
- envelope `sys_created_on` / `sys_updated_on` elements dropped so the platform stamps the real load
  time — this keeps the documented `ORDERBYDESCsys_created_on` locate query correct
- all 926 `remote_update_set` pointers re-pointed to the new envelope
- the 13 child-level `sys_id` values regenerated, so no child of the committed set is moved or updated

Proof the imported content *is* the master package: the concatenated SHA-256 over all 926
`<payload>` bodies is identical in the original and the uploaded copy
(`98ffea7b68c8fcd31a448bea6924b8a302c76b0e62bd2098a0f36fa3c2ff9a18`), and the child update-name list
is identical and in the same order. The copy lives only in the run's scratch directory; the
repository deliverable was never modified.

**Upload mechanism, exactly as used** (the Table API POST to `/api/now/table/sys_remote_update_set`
was never used — it returns HTTP 400 on this instance):

```
# 1. priming REST GET on a cold session (required, or the token scrape returns a session-timeout page)
curl -sS -K <scratch>/sn.cfg -c <cj> -b <cj> "$URL/api/now/table/sys_user?sysparm_limit=1"        # 200 JSON

# 2. fetch the upload page and scrape the CSRF token from the hidden input name="sysparm_ck" (72 chars)
curl -sS -K <scratch>/sn.cfg -c <cj> -b <cj> "$URL/upload.do?sysparm_target=sys_remote_update_set" # 200, 28,564 bytes

# 3. multipart upload
curl -sS -K <scratch>/sn.cfg -c <cj> -b <cj> \
     -F "sysparm_ck=<token>" -F "sysparm_target=sys_remote_update_set" \
     -F "attachFile=@<package file>;type=text/xml" "$URL/sys_upload.do"                            # 200, empty body

# 4. locate the created record (the response carries no sys_id)
curl -sS -K <scratch>/sn.cfg "$URL/api/now/table/sys_remote_update_set?sysparm_query=nameSTARTSWITHx_casemgmt_case_management^ORDERBYDESCsys_created_on&sysparm_limit=2"

# 5. poll state every 5s, timeout 300s
curl -sS -K <scratch>/sn.cfg "$URL/api/now/table/sys_remote_update_set/<sys_id>?sysparm_fields=state,error_detail"
```

Upload completed `2026-09-02T17:55:18Z`; the record read `state=loaded` on the first poll with an
empty `error_detail`.

**S0 result**

| Assertion | Observed | Verdict |
| --- | --- | --- |
| New retrieved update set created | `b4861cf7bbe24b36926fcaff4583b5bf`, "x_casemgmt_case_management v1.0.0 (native rebuild import)", created 2026-09-02 17:55:15 | PASS |
| Left pre-commit | `state=loaded`; never previewed, never committed; `sys_update_preview_problem` count 0; `summary` and `collisions` empty | PASS |
| Child count exactly 926 | `sys_update_xml?remote_update_set=b4861cf7…` → **926** | PASS |
| Not the already-committed set | `b4861cf7…` ≠ `9929f50d…` | PASS |
| Committed set untouched (no append) | still `state=committed`, still 926 children, `sys_updated_on 2026-09-02 14:42:11` (before this run began) | PASS |
| Retrieved sets on the instance | exactly 2 | PASS |

**S0 baseline record count (`phase1.baseline_record_count`) = 926.** This is the "before (step 0)"
number the rebuild's count-delta check must compare against, captured at the moment of import rather
than remembered from documentation. It agrees with the package file's own 926 payload blocks and with
the committed set's 926 children.

**The master shipping Local Update Set.** A `sys_remote_update_set` cannot be current and cannot
capture new changes on this platform, so "leave it current" is realised as: the retrieved set sits at
`loaded`, and a **Local** Update Set was created to be the capture target for the rebuild.

| Item | Value |
| --- | --- |
| `sys_id` | `1109981a930b435009aa70d19dba1098` |
| Name | `x_casemgmt_case_management v1.0.0 (native rebuild)` |
| Application | the query-resolved `x_casemgmt` scope |
| State | `in progress`, `is_default=false` |
| Captured records | **0** — deliberately empty; filling it is the next unit's work |
| Current | yes (see §3.3) |

Two records therefore stand for "the master set", and both are intended: the Retrieved Update Set
`b4861cf7…` holding the imported package at `loaded`, and the shipping Local Update Set
`1109981a…` that is current.

Mechanism for making a set current, and a caveat worth knowing:

```
curl -sS -K <scratch>/sn.cfg -b <cj> -H "X-UserToken: <sysparm_ck>" -H 'Content-Type: application/json' \
     -X PUT "$URL/api/now/ui/concoursepicker/updateset" -d '{"sysId":"<update set sys_id>"}'   # {"success":true}
```

The picker **GET** is session-cached: a session opened before the change keeps reporting the previous
set. Re-read it in a fresh session. The backing user preference is `sys_update_set` for the user, and
the platform may replace that preference *row* (its `sys_id` changed during this run), so read it by
`name=sys_update_set^user=<user sys_id>` rather than by a remembered `sys_id`.

### 3.2 S1 — native creation validated in a separate SCRATCH Update Set

**Resume check, run first.** `sys_db_object?name=x_casemgmt_refine_probe` → empty;
`sys_user_role?name=x_casemgmt_refine_probe_role` → empty; `GET /api/now/table/x_casemgmt_refine_probe`
→ HTTP 400 "Invalid table". Neither artifact existed, so S1 was executed in full.

**SCRATCH Update Set** (separate from the shipping set, and it must never ship):
`4999985a930b435009aa70d19dba102e`, name `REFINE SCRATCH native-creation probe (DO NOT SHIP)`, in the
`x_casemgmt` scope, made current for the duration of the probe.

**One probe table, created by the real Table API — a platform action, not authored XML:**

```
curl -sS -K <scratch>/sn.cfg -H 'Content-Type: application/json' -X POST "$URL/api/now/table/sys_db_object" \
  -d '{"name":"x_casemgmt_refine_probe","label":"Refine Probe","sys_scope":"<scope sys_id resolved by query>","is_extendable":"false"}'
# HTTP 201 -> sys_id 19999c5a930b435009aa70d19dba107d
```

Physical storage confirmed by the table's own endpoint flipping from HTTP 400 "Invalid table" to
**HTTP 200** (`{"result":[]}`); the platform auto-provisioned the six audit columns and the
collection dictionary row.

**One probe role, and one role LINK produced by the platform's own role-assignment path:**

```
curl -sS -K <scratch>/sn.cfg -H 'Content-Type: application/json' -X POST "$URL/api/now/table/sys_user_role" \
  -d '{"name":"x_casemgmt_refine_probe_role","description":"…","sys_scope":"<scope sys_id>"}'
# HTTP 201 -> sys_id caa9509a930b435009aa70d19dba1033
```

A REST `POST /api/now/table/sys_security_acl` was **refused**: HTTP 403
`ACL Exception Insert Failed due to security constraints`. Plain `admin` cannot write ACL records on
this instance, and `security_admin` elevation is session-bound to the interactive UI — a Basic-auth
REST session cannot carry it. The ACL work was therefore done in the UI: user menu → **Elevate
role** → `security_admin` → Update (the red elevated-privileges border confirms it), then a new ACL
was created on `/sys_security_acl.do?sys_id=-1` and the role was assigned through the ACL form's own
**"Requires role"** related list, so that the platform itself wrote the link record.

| Record | Identity | Notes |
| --- | --- | --- |
| Probe ACL | `sys_security_acl` `63cc5812934b435009aa70d19dba109f` | `type=record`, `operation=read`, `name=x_casemgmt_refine_probe`, active, admin overrides, condition/script empty, `x_casemgmt` scope |
| Probe role link | `sys_security_acl_role` `96dcd812934b435009aa70d19dba1064` | written by the platform as the side effect of the UI role assignment |

Two platform gates encountered on the way, recorded so they need not be rediscovered: this instance
**refuses to insert a role-less Allow-If ACL** ("Empty ACL - Select Role or Security Attribute"; the
save aborts and no record is created), so the role must be attached via the same "Requires role"
related list *before* the insert; and the save then raises a
"Verify Security Rules for '<table>'" dialog which must be confirmed with **Continue**. None of the
26 pre-existing ACLs was opened for edit or modified — they all still show `Updated 2024-12-31 16:00:00`.

**Capture evidence — the whole premise of the rebuild.** The platform captured six records into the
SCRATCH set, including the `sys_security_acl_role` class that appears **zero** times in the shipping
package:

| Type | Target | Update name |
| --- | --- | --- |
| Table | Refine Probe | `sys_db_object_19999c5a930b435009aa70d19dba107d` |
| Dictionary | Refine Probe | `sys_dictionary_x_casemgmt_refine_probe_null` |
| Field Label | Refine Probe | `sys_documentation_x_casemgmt_refine_probe__en` |
| Access Control | x_casemgmt_refine_probe | `sys_security_acl_63cc5812934b435009aa70d19dba109f` |
| **Access Roles** | .x_casemgmt_refine_probe_role | `sys_security_acl_role_96dcd812934b435009aa70d19dba1064` |
| Role | x_casemgmt_refine_probe_role | `sys_user_role_caa9509a930b435009aa70d19dba1033` |

Two naming facts for the rebuild that follows: the platform names a captured table record
`sys_db_object_<sys_id>` — **not** `sys_db_object_<table name>` — and a newly created table captures a
single collection dictionary row `sys_dictionary_<table>_null` plus a field-label row.

**Persistence confirmed by marking the SCRATCH set Complete and then querying the Table API** (the
Retrieved-Update-Set Preview/Commit flow does not apply to a Local Update Set and was not invoked):

```
curl -sS -K <scratch>/sn.cfg -H 'Content-Type: application/json' \
  -X PATCH "$URL/api/now/table/sys_update_set/4999985a930b435009aa70d19dba102e" -d '{"state":"complete"}'
```

| Post-Complete assertion | Observed | Verdict |
| --- | --- | --- |
| `GET /api/now/table/x_casemgmt_refine_probe?sysparm_limit=1` | HTTP **200** | PASS |
| `GET /api/now/table/sys_user_role?sysparm_query=name=x_casemgmt_refine_probe_role` | exactly **1** record | PASS |
| The link record itself, by `sys_id` | present, both references intact; count for the probe role = 1 | PASS |
| SCRATCH set state | `complete` | PASS |
| Nothing shipped from the probe | shipping set still 0 captured records; retrieved-set count still 2; SCRATCH never exported, uploaded, previewed or committed | PASS |

**S1 verdict: PASS**, verified `2026-09-02T18:37:43Z`. Native creation produces captured records,
including the role-link class — which is exactly what the rebuild depends on.

**SCREENSHOT — test table's definition in Studio showing native creation: RE-CAPTURED 2026-09-05,
and the path resolves.**
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase1-s1-probe-table-studio.png` — 241,921 bytes, PNG 1600×1000.
Caption: *Phase 1 S1 — probe table definition created natively, shown in ServiceNow Studio.*
Breadcrumb **Data Model > Table > QA5 Probe Table**; Label **QA5 Probe Table**; Name
**`x_casemgmt_qa5_probe_table`**; Application **`x_casemgmt Case Management`**; Remote Table
unchecked; Columns tab pager **“1 to 7 of 7”** listing the platform's own audit columns (Updated,
Created by, Created, Sys ID, Updates, Updated by) **plus the String column “Probe Note”** that was
added by hand — which is what makes that column set proof of a native, platform-provisioned table
rather than a hand-authored dictionary; Application Explorer showing Tables *Case / Case Party /
Case Task / Qa5 Probe Table*; status bar **`x_casemgmt Case Management | 1.0.0`**.

**SCREENSHOT — role assignment screen showing the test role link: RE-CAPTURED 2026-09-05, and the
path resolves.**
`/tmp/blitzy/blitzy-ArkCase/blitzy-7871c364-a98a-4b0b-9eda-3e6a8571a6d2_212d0c/blitzy/screenshots/phase1-s1-probe-role-link.png` — 142,655 bytes, PNG 1600×1000.
Caption: *Phase 1 S1 — role assignment screen showing the natively created probe role link.*
The native Access Control form headed **“Access Control / x_casemgmt_qa5_probe_table”**: Type
**record**, Operation **read**, Decision Type **Allow If**, Admin overrides and Active both ticked,
Name **“QA5 Probe Table [x_casemgmt_qa5_probe_table]”**, Application **`x_casemgmt Case
Management`**, and the **“Requires role” related list carrying exactly one row —
`x_casemgmt.qa5_probe_role` — with the pager reading “1 to 1 of 1”**. That related-list row *is* the
`sys_security_acl_role` link record, written by the platform as the side effect of the assignment,
and it is the payload class that appears **zero** times in the shipping package.

**Corrected: this record previously said both S1 captures were “NOT RETRIEVABLE, and permanently
so”.** The “permanently” rested on the reasoning that directive **D23** forbids re-staging a probe
at all. That reasoning was wrong in one respect. D23 requires that **no probe artifact survive into
the shipped package or be left behind on the instance** — not that the checkpoint go unphotographed.
A disposable probe can be built, photographed and destroyed without breaching it, and that is what
was done. Both cited basenames now resolve to readable PNGs.

**How the captures were obtained, and how D23 was kept.**

| Step | What was done |
| --- | --- |
| 1 | A disposable local update set, **“QA5 SCRATCH PROBE (DO NOT SHIP)”** `0e1f9c5f93c3431009aa70d19dba105a`, was made current, so every probe capture landed in it and nothing landed in the shipping set or in the ABSORBER set |
| 2 | The probe was built **natively in Studio** under an **elevated `security_admin`** session — table `x_casemgmt_qa5_probe_table` with the added String column “Probe Note”, role `x_casemgmt.qa5_probe_role`, and a `read` ACL on the table with that role attached through the ACL form's own “Requires role” related list, so the platform wrote the `sys_security_acl_role` link itself |
| 3 | Both screens were captured |
| 4 | **Every probe artifact was then deleted** |
| 5 | Absence was verified **five ways**: `sys_db_object`, `sys_user_role`, `sys_security_acl`, `sys_dictionary` and `sys_app_application` each return **zero** rows on a `qa5` match, and the probe table's list URL returns the platform's own **“Page not found”** body |
| 6 | The scratch set was set to **State = Ignore**, holding **22 probe-only DELETE updates** and nothing else, so it can never be previewed or committed anywhere |
| 7 | The **previous current set was restored**, with its **111 children unchanged** — no capture leaked into it |

**One deviation, recorded rather than smoothed over.** Inside a scoped application the Role form
exposes only a **Suffix** field and derives a read-only **Name** from it, so the probe role is named
**`x_casemgmt.qa5_probe_role`** — with a dot — rather than `x_casemgmt_qa5_probe_role`. That is the
platform's own convention inside a scope: the role the table creation auto-generated is named
`x_casemgmt.qa5_probe_table_user` by the same rule. The name shape differs from the original S1
probe role; the mechanism it evidences does not.

**The probe used for the re-capture is not the original, and these are equivalent-evidence captures
rather than recoveries of the lost binaries.** The original S1 probe (`x_casemgmt_refine_probe` /
`x_casemgmt_refine_probe_role`, created by REST `POST` against `sys_db_object` and `sys_user_role`)
was deleted at S2 and stays deleted; its captures are gone for good. The re-capture used a **fresh,
differently named probe** built through the UI, and it evidences the same mechanism — that native
creation produces platform-captured records **including the role-link class** — on the **current**
release rather than on the release of the original run. Every record that names these two files says
so.

**The contemporaneous evidence for the ORIGINAL probe is unchanged and still stands**, because the
re-capture evidences the mechanism, not the original artifacts: the `POST
/api/now/table/sys_db_object` → HTTP **201** for `19999c5a930b435009aa70d19dba107d`; the table
endpoint flipping from HTTP 400 "Invalid table" to HTTP **200** (physical storage); the platform's own
capture row `sys_db_object_19999c5a930b435009aa70d19dba107d` in the SCRATCH set — all recorded above
— plus `sys_security_acl_role` `96dcd812934b435009aa70d19dba1064`, written **by the platform** as the
side effect of that UI role assignment and captured as
`sys_security_acl_role_96dcd812934b435009aa70d19dba1064` (the class that appears zero times in the
shipping package, which is the whole premise S1 was run to establish), and the deletion proofs in
§3.3. The original captions were: *Phase 1 S1 — probe table definition created natively via Table
API* (Studio, Data Model → Table → Refine Probe, name `x_casemgmt_refine_probe`) and *Phase 1 S1 —
role assignment screen showing the natively created probe role link* (the saved ACL's "Requires role"
related list, one row `x_casemgmt_refine_probe_role`, pager "1 to 1 of 1"). Those two **original
binaries remain lost for good** — `blitzy/screenshots/` is untracked by design under **INTERP-6**, so
absolute paths into it stop resolving once the working tree is re-created, and nothing carried them
across.

### 3.3 S2 — delete the test artifacts, re-set the master set current

Deletions, in the order performed:

```
DELETE /api/now/table/sys_security_acl_role/96dcd812934b435009aa70d19dba1064   -> HTTP 403 (ACL Exception Delete Failed due to security constraints)
DELETE /api/now/table/sys_security_acl/63cc5812934b435009aa70d19dba109f        -> HTTP 403 (same constraint)
DELETE /api/now/table/sys_user_role/caa9509a930b435009aa70d19dba1033           -> HTTP 204
DELETE /api/now/table/sys_db_object/19999c5a930b435009aa70d19dba107d           -> HTTP 204
```

The two records REST refused (for the same lack of `security_admin` elevation that blocked the
insert) were removed by the platform itself: **deleting the table cascaded its ACL and that ACL's
role link.** No second elevation round was needed, and no fix-and-re-verify attempt was consumed.

Deletion proven by observation:

| Assertion | Observed | Verdict |
| --- | --- | --- |
| Probe table gone | `GET /api/now/table/x_casemgmt_refine_probe?sysparm_limit=1` → **HTTP 400 `Invalid table x_casemgmt_refine_probe`** (this instance's confirmation of removal — not 404/403) | PASS |
| Probe role gone | `sys_user_role?name=x_casemgmt_refine_probe_role` → **0** records | PASS |
| Probe link gone | `sys_security_acl_role` rows for the probe ACL → **0** | PASS |
| No residue | all four probe records return HTTP 404 by `sys_id`; `nameLIKErefine_probe` → 0 rows across `sys_db_object`, `sys_dictionary`, `sys_security_acl`, `sys_user_role`, `sys_documentation` | PASS |
| `apps.current_app` preserved | preference `8749eb4e9343435009aa70d19dba1085` still = `82b99028936f74320d74d6f88357a5af` — never deleted, never repointed | PASS |

Master set re-set as current, and read back in a fresh session:

| Assertion | Observed | Verdict |
| --- | --- | --- |
| Current update set | `x_casemgmt_case_management v1.0.0 (native rebuild) [x_casemgmt Case Management]`, `sysId 1109981a930b435009aa70d19dba1098` | PASS |
| SCRATCH no longer current | correct; it sits at `state=complete` | PASS |

Surroundings re-asserted (their deletion belongs to the rebuild unit's S6, not here). **These are
instance row counts as measured at `2026-09-02T18:40:16Z`, not package payload counts — the two are
different units and are not comparable.** Re-measured 2026-09-05T04:45:00Z, the two access-control
figures have moved and the move is fully attributed: `sys_security_acl_role` for `x_casemgmt*` roles
reads **36** (manager 17 / agent 13 / viewer 6) and scoped `sys_security_acl` reads **29**, because
three field-level `query_range` ACLs were created on the instance at `2026-09-04 10:48 UTC` on
`x_casemgmt_case.closed_date`, `x_casemgmt_case.opened_date` and `x_casemgmt_case_task.due_date`,
carrying exactly 9 role links between them — 36 − 9 = **27** and 29 − 3 = **26**, so the figures below
were correct when taken. **These three ACLs are authorised package content, not drift.** Each exists as a repository artifact
under `acl/`, and each carries one role link per scoped role — which is the 9. The role links
distribute **manager 17 / agent 13 / viewer 6**. [`docs/acl-matrix.md`](../acl-matrix.md) carries a
dedicated section stating the 26→29 and 27→36 arithmetic and recording that
`scripts/post_import_remediation.js` asserts both figures; that section is the authority for it and
this record cites it rather than re-arguing it.

**The settled census is 10 / 10 / 8**, measured four separate times: `x_casemgmt_case` **10** rows
(`CASE9000001`–`CASE9000010`), `x_casemgmt_case_task` **10** (`TASK9000001`–`TASK9000010`),
`x_casemgmt_case_party` **8** (`PARTY9000001`–`PARTY9000008`). **Corrected from the 13 / 13 / 11
this record previously reported as today's reading**, which counted QA2/portal fixture rows created
after the commit: **those rows are gone, none remains**, so the instance now holds exactly what the
package carries — which is precisely what OVERRIDE-3 authorised when the three tables were deleted,
re-created and the package re-committed. The units caveat still holds for any *future* divergence
(package seed payloads and instance rows are different units), but there is no divergence to explain
today. The `x_casemgmt_case` row count recorded in the
table below is **12**, the pre-deletion figure measured at `2026-09-02T18:40:16Z`; it is a historical
reading and stays as taken.

| Object | Expected | Observed (instance rows, as measured 2026-09-02T18:40:16Z) |
| --- | --- | --- |
| `x_casemgmt_case` / `x_casemgmt_case_task` / `x_casemgmt_case_party` | HTTP 200 | HTTP 200 / 200 / 200 |
| Scoped roles | 3 | 3 (`case_manager`, `case_agent`, `case_viewer`) |
| `sys_security_acl` in scope | 26 | **26** |
| `sys_security_acl_role` for the 3 roles | 27 (manager 14 / agent 10 / viewer 3) | **27** (14 / 10 / 3) |
| `x_casemgmt_case` rows | unchanged | 12 |
| Retrieved set `b4861cf7…` | `loaded`, 926 children | `loaded`, 926 |
| Committed set `9929f50d…` | `committed`, 926 children | `committed`, 926 |
| Shipping set `1109981a…` | `in progress`, 0 captured | `in progress`, 0 |

**S0–S2 exit timestamp: 2026-09-02T18:40:16Z (UTC).**

---

## 4. State handed to the following units

| Item | Value |
| --- | --- |
| Retrieved Update Set (imported package, pre-commit) | `b4861cf7bbe24b36926fcaff4583b5bf` — `state=loaded`, 926 children, never previewed/committed |
| Master shipping Local Update Set (capture target, **current**) | `1109981a930b435009aa70d19dba1098` — `x_casemgmt_case_management v1.0.0 (native rebuild)`, 0 captured records |
| Baseline record count for the count-delta check | **926** |
| Pre-existing committed retrieved set (leave alone) | `9929f50df18ccec91ea13b2a3bccfc90` — `committed`, 926 children |
| Stale local sets sharing the package name (do not confuse) | `066c23c69383435009aa70d19dba10d3`, `59a5a3069343435009aa70d19dba10e8` |
| SCRATCH set (complete, must never ship) | `4999985a930b435009aa70d19dba102e` |
| Fallback package | `servicenow-case-management-poc/update-set/x_casemgmt_case_management_update_set.FALLBACK.xml`, SHA-256 `7292a6fe…1add66b7` — **true of that file** (overwritten by three post-run commits, restored to these exact bytes on 2026-09-05T04:45Z) **and true of the deliverable path as well** after the identity correction; `cmp` reports no difference between them. The three commits' amendments `9f3ea74c…` / 3,973,569 B / 935 blocks are retained, explicitly non-shipping, at `…AMENDED-NOT-GATED.xml` |
| Heartbeat | API-context loop, PID 8099, 10-minute interval, still running — the **API variant where §2.4(a) requires the browser/UI variant** outside the record/commit-page exception: a **deviation** from directive lines 76–84, recorded in §2.4 |
| Scope | resolve by query every time: `sys_scope?sysparm_query=scope=x_casemgmt` → `82b99028936f74320d74d6f88357a5af` |

Practical notes that cost time to establish, so they need not be rediscovered:

1. A priming REST GET is mandatory before scraping `sysparm_ck` on a cold session.
2. `/sys_upload.do` returns HTTP 200 with an **empty body** and no `sys_id`; locate the record by query.
3. The XML loader honours the identity inside the file — an envelope `sys_id` that already exists on
   the instance is updated rather than duplicated, and children with no `sys_id` are appended to it.
4. ACL inserts and ACL deletes both require `security_admin` elevation, which only an interactive UI
   session can hold; deleting a table cascades its ACLs and their role links.
5. The update-set picker GET is session-cached; the `sys_update_set` user-preference row may be
   replaced, so query it by `name` + `user`.
6. `PATCH {"state":"complete"}` on a `sys_update_set` works through the Table API and is reflected on
   read-back.

## 5. Open items and blockers

None. Every step assigned to this unit completed and was verified by observation. No fix-and-
re-verify attempt was consumed (0 of 2 per issue), no recovery cycle was used (0 of 3 per run), no
rollback was invoked, and no partial write was left behind: every artifact this unit created on the
instance is either intentionally retained and named in §4, or deleted and proven gone in §3.3.
