# Portal Pages

## Purpose

This document captures the wireframe-level specifications for the two unauthenticated Experience Portal pages: Case Submission and Case Status Lookup. Both pages are delivered as Service Portal records under [`../portal/pages/`](../portal/pages/) with widgets under [`../portal/widgets/`](../portal/widgets/) and scripted REST endpoints under [`../portal/rest/`](../portal/rest/). Anonymous access is enforced by the platform's portal/widget configuration. The lookup page enforces strict field whitelisting at the scripted REST layer to prevent exposure of internal data.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

## Common Conventions

- Both pages live under a single Service Portal record [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml).
- Portal URL: `[instance URL]/x_casemgmt_case_portal`. The portal slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml). AAP Section 0.7.2 verbatim wording uses `[instance URL]/x_casemgmt_portal` as a generic placeholder ("or the equivalent portal URL chosen at portal-record creation time"); this document uses the actual implementation slug to keep the per-page URL examples below accurate.
- Both pages are anonymous (no login required).
- Both pages use the platform default theme — no custom CSS, no custom branding (per AAP Section 0.4.4).
- Both pages call scripted REST endpoints under `/api/x_casemgmt/...`.
- The scripted REST endpoints execute with platform-default elevated privilege but the request/response shapes whitelist exactly the fields specified by AAP Section 0.7.4.
- No PII in any example record; all examples reference synthetic data consistent with [`../seed-data/`](../seed-data/).

### Accessibility of the two form widgets

Both form widgets are keyboard-operable, semantically marked up, and announce their own state. What is authored,
and why, so that a later edit does not remove it by accident:

| Concern | Treatment | Where |
| --- | --- | --- |
| Accessible name for every control | A bound `<label for>` on every input, select and textarea | both widgets |
| Required-ness | `required` **and** `aria-required="true"` on the four mandatory controls. The `*` in the label is decoration, so it carries `aria-hidden="true"` and is never the only carrier of the information | submission widget |
| Reason a disabled button is disabled | The form sets `novalidate`, so the browser contributes no per-field message. A `help-block` paragraph under the button states the reason in visible text and is referenced by the button through `aria-describedby`. It is always present in the DOM, so the reference never dangles | both widgets |
| In-flight state | The same paragraph is a `role="status" aria-live="polite"` region that announces "Submitting your case, please wait..." / "Looking up your case, please wait...", and the form sets `aria-busy` while the request is outstanding. The button's changing inner text is no longer the only signal | both widgets |
| Result and error announcements | `role="alert"` on the submission error panel, the lookup result's not-found panel, the lookup's service-failure panel, and the confirmation panel; the lookup result itself is a `<dl>`/`<dt>`/`<dd>` definition list | both widgets |
| Programmatic invalid state | Every control has a `name` and binds **`aria-invalid`** to `$invalid && $touched`, so assistive technology is told *which* control is wrong rather than only that the form is. The `$touched` half is deliberate: a field the user has never visited is not announced as an error on first paint | both widgets |
| Visible invalid state | The control's `.form-group` takes Bootstrap 3's **`has-error`** class under the same condition, which is what makes the failing field visually distinguishable without any custom CSS | both widgets |
| Per-field error message | Each control has its own `help-block` paragraph carrying **`role="alert"`**, referenced by the control through `aria-describedby`, rendered only while that control is invalid and touched. The exact strings are in the table below | both widgets |
| Maximum-length notice | Each length-capped field carries a **`role="status"`** notice that appears only once `maxlength` has been reached, because `maxlength` silently discards further keystrokes and a silent discard is the defect. Wording: *"&lt;Field&gt; has reached its limit of &lt;n&gt; characters. Anything typed beyond this point is discarded."* for Subject (255), Description (4000) and Your name (100) | submission widget |
| Colour contrast | **Inherited in full from the platform default theme and not measurable project-side.** All three widgets ship an empty `css` element and an empty `link` element, define no colour, and reference no branding asset; `sp_portal.theme` / `theme_dv` are empty. AAP Section 0.4.4 mandates that default treatment ("ServiceNow Experience Portal default theme. No custom CSS, no custom branding"), so there is nothing project-side to change — authoring CSS to alter contrast would violate that requirement. If the platform theme's contrast is ever judged insufficient, that is a theme decision to raise against the AAP, not a defect in these widgets | portal surface |

## Page 1: Case Submission

### Purpose

Allows an unauthenticated external requester to submit a new case. On successful submission, the page shows a confirmation panel displaying the auto-generated case number (in `CASE0000001` format) and a friendly "Your case has been submitted" acknowledgement.

### URL

- `[instance URL]/x_casemgmt_case_portal?id=x_casemgmt_case_submit` — the portal slug `x_casemgmt_case_portal` is the `<url_suffix>` from [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml), and the page slug `x_casemgmt_case_submit` is the `<id>` from [`../portal/pages/sp_page_x_casemgmt_case_submit.xml`](../portal/pages/sp_page_x_casemgmt_case_submit.xml).

### Wireframe

```text
+----------------------------------------------------------+
|  [Portal Default Header]                                 |
|                                                          |
|              Submit a New Case                           |
|                                                          |
|  +----------------------------------------------------+  |
|  | Subject *               [text input, max 255]      |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | Case Type *             [dropdown]                 |  |
|  |   - General Inquiry                                |  |
|  |   - Complaint                                      |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | Description *           [textarea, max 4000]       |  |
|  |                                                    |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | Your Name *             [text input, max 100]      |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | Your Email              [text input, max 100]      |  |
|  +----------------------------------------------------+  |
|                                                          |
|              [ Submit ]                                  |
|                                                          |
|  [Portal Default Footer]                                 |
+----------------------------------------------------------+
```

### Per-field validation messages, and what the Submit hint says

Earlier revisions of these widgets validated at form level only: a single hint under the button said that required
fields were missing, no individual control was marked, and the two consequences were both wrong answers. A user who
had completed all four required fields and typed a malformed address in the **optional** email field was told that
required fields were incomplete — the one field actually blocking Submit was the one the message denied mattered.
And a user who hit a `maxlength` cap had characters discarded with no notice at all.

Both are fixed. Every control now carries its own message, and the aggregate hint states the real reason:

| Control | Message shown when it is invalid and has been touched |
| --- | --- |
| Subject | `Subject is required.` |
| Case Type | `Select a case type.` |
| Description | `Description is required.` |
| Your Name | `Your name is required.` |
| Your Email | `Enter a valid email address, or leave the field empty. Email is optional, but an address that is not valid blocks Submit.` |
| Case Number *(lookup page)* | `Enter a case number to look up.` |

The hint beneath the Submit button is a `role="status" aria-live="polite"` region and has **three** states, so it
can never contradict the field-level messages:

| Condition | Hint text |
| --- | --- |
| any of the four required fields still incomplete | `Every field marked * is required. Complete all four to enable Submit.` |
| all four complete, but the optional email is malformed | `Email is optional, but the address entered is not valid. Correct it or clear the field to enable Submit.` |
| nothing blocking | `All required fields are complete.` |

The distinction is computed by `c.requiredIncomplete()` in the widget's client script, which inspects only the four
mandatory controls — that is what lets the second state exist at all. The hint paragraph is always present in the
DOM, so the button's `aria-describedby` reference never dangles, and it doubles as the in-flight announcement.

No CSS was added for any of this: `has-error`, `help-block`, `alert-warning` and `alert-danger` are Bootstrap 3
classes the platform's default Service Portal theme already provides, which is what keeps the widgets inside AAP
§0.4.4's *"No custom CSS, no custom branding"*. The `css` field on all three widgets is empty. The contrast and
control-size consequences of that constraint are recorded as a disclosed limitation in
[`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.9](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) (INFO-3), not fixed here.

### Input Fields

| Field | HTML Type | Maps To | Mandatory | Validation |
| --- | --- | --- | --- | --- |
| Subject | text input | `x_casemgmt_case.subject` | Yes | non-empty, max 255 chars |
| Case Type | dropdown | `x_casemgmt_case.type` | Yes | one of `General Inquiry`, `Complaint` |
| Description | textarea | `x_casemgmt_case.description` | Yes | non-empty, max 4000 chars |
| Your Name | text input | `x_casemgmt_case.requester_name` | Yes | non-empty, max 100 chars |
| Your Email | text input | `x_casemgmt_case.requester_email` | No | optional; if provided, max 100 chars |

### Submit Behavior

1. Form-level client-side validation runs first (mandatory fields, max-length).
2. On client validation pass, the widget calls scripted REST endpoint POST `/api/x_casemgmt/case_submit`.
3. The scripted REST handler validates the payload server-side, creates a new `x_casemgmt_case` record with `status = Draft` (the default), populates `subject`, `type`, `description`, `requester_name`, `requester_email` from the payload, and DOES NOT populate `assigned_group`, `assigned_agent`, or `closed_date`.
4. Auto-numbering populates `number` in `CASE0000001` format.
5. Business rule `set_opened_date` populates `opened_date = gs.nowDateTime()` on insert.
6. The endpoint returns a JSON payload `{ "number": "<auto-generated case number>" }`.
7. The submission widget hides the form and shows the confirmation widget displaying the returned case number plus the acknowledgement "Your case has been submitted" (no trailing period — matches the wireframe and the confirmation widget schema).

### Confirmation Widget

```text
+----------------------------------------------------------+
|  [Portal Default Header]                                 |
|                                                          |
|              Your case has been submitted                |
|                                                          |
|              Case Number: CASE0000017                    |
|                                                          |
|              Save this number to look up status later.   |
|                                                          |
|              [ Submit Another Case ]                     |
|                                                          |
|  [Portal Default Footer]                                 |
+----------------------------------------------------------+
```

### Whitelisted Fields

The submission endpoint accepts EXACTLY the following five fields and no others:

- `subject`
- `type`
- `description`
- `requester_name`
- `requester_email`

All other fields on the case table are NOT accepted by the submission endpoint and any extra fields in the request payload MUST be silently ignored. The scripted REST handler MUST construct the new `GlideRecord` write by explicit field assignment from the whitelist — never by iterating over arbitrary payload keys. This is a security control, not a feature.

### Error Handling

- Missing mandatory field → 400 Bad Request with field-level error message rendered next to the offending input.
- Invalid `type` value → 400 Bad Request with "Invalid case type".

> **Implemented and measured, not just specified.** The `submitCase()` gate in
> `../script_includes/x_casemgmt_CasePortalService.xml` runs **before** any `GlideRecord` is initialised, and the
> operation script in `../portal/rest/sys_ws_operation_x_casemgmt_case_submit_post.xml` maps its result onto the
> status codes below. Verified with anonymous `curl` against the live PDI, no credentials:
>
> | Request | Response |
> |---|---|
> | `{}` — every field absent | **400**, field-level `{error, fields}` body, and **no row created** |
> | no body at all | **400** |
> | `subject` / `description` / `requester_name` blank or whitespace-only | **400** (values are trimmed first) |
> | `description` of 6,006 characters | **201** — an over-length value is **truncated to the column bound, not rejected**: measured `description` stored at exactly 4,000 characters, and a 300-character `subject` stored at exactly 255. `requester_name` and `requester_email` cap at 100 the same way. The cap is applied deliberately rather than left to the platform, because a column longer than 255 is TEXT and would otherwise store the whole oversized value |
> | `type` = `NOT_A_REAL_TYPE` | **400** — the value is checked against the **live** `sys_choice` list for `x_casemgmt_case.type`, so the AAP's "extensible" choice contract keeps working, and an unreadable list fails closed. Matching is exact first, then case-insensitive |
> | `type` omitted entirely | **201**, and the column is stored **empty** — `type` carries no mandatory constraint in AAP §0.5.7, and no default is invented. The submission **page** always sends one, because its Type control is `required` |
> | `requester_email` present but malformed | **400** |
> | body that is not valid JSON | **400** `Request body must be valid JSON.` — previously this threw inside the operation script and escaped as **HTTP 500** |
> | body that is a JSON array | **400** `Invalid payload.` (verbatim — an ATF step asserts this exact string) |
> | more than 10 anonymous submissions inside 60 s | **429** — a flood guard that counts `sys_created_by='guest'` rows in the trailing minute, so it cannot block a legitimate single submission |
> | wrong `Content-Type` | **415** |
> | `GET` / `PUT` / `DELETE` on the submit path | **405** |
> | a valid submission | **201** `{"number":"CASE…","message":"Your case has been submitted"}`, row `status=Draft` |

- Server-side error → 500 Internal Server Error with generic "Submission failed; please try again." (do NOT expose internal stack traces).

#### `type` is optional in the API and required on the page — a deliberate contract, stated because it looks like a bug

A QA pass raised this as an informational finding: `POST /api/x_casemgmt/case_submit` with no `type` returns **201**
and stores the case with `type` empty, while the submission **page** marks Type required and will not enable Submit
without it. Both halves are intentional, and the reason is precedence rather than oversight.

AAP §0.5.7 defines the `x_casemgmt_case` table field by field, and `type` is the one choice field it does **not**
mark mandatory (`subject`, `description` and `requester_name` are). Rejecting a payload without `type` would make
the endpoint stricter than the schema it implements, and the endpoint is a thin, whitelisted door onto that schema —
`CasePortalService._validateSubmission` therefore treats `type` as **optional but choice-constrained**: absent is
accepted, present-and-unrecognised is a 400 checked against the live `sys_choice` list. The *page* is free to be
stricter than the API, and is: its Type control is `required`, so a case submitted through the portal always carries
one. No default is invented server-side, because inventing `General Inquiry` would silently misclassify a complaint.

The consequence to be aware of: a case created by a direct API call with no `type` will show an empty Type on the
internal form and will not appear in either bucket of the *All Cases by Type* dashboard chart. None of the ten
seeded demo cases is in that state, and the ATF suite's submit test posts an explicit `"type": "General Inquiry"`,
so no test depends on either reading. Recorded as **INFO-1** in
[`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md` §0.9](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md).

## Page 2: Case Status Lookup

### Purpose

Allows an unauthenticated external requester to look up the current status of a case they previously submitted. The page accepts a single case number input and returns ONLY `status`, `subject`, and `opened_date` for valid case numbers. For invalid case numbers, the page displays the verbatim text "No case found with that number." (per AAP Section 0.7.4).

### URL

- `[instance URL]/x_casemgmt_case_portal?id=x_casemgmt_case_status` — the portal slug `x_casemgmt_case_portal` is the `<url_suffix>` from [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml), and the page slug `x_casemgmt_case_status` is the `<id>` from [`../portal/pages/sp_page_x_casemgmt_case_status.xml`](../portal/pages/sp_page_x_casemgmt_case_status.xml).

### Wireframe

```text
+----------------------------------------------------------+
|  [Portal Default Header]                                 |
|                                                          |
|              Look Up Case Status                         |
|                                                          |
|  +----------------------------------------------------+  |
|  | Case Number             [text input, e.g.,         |  |
|  |                          CASE0000017]              |  |
|  +----------------------------------------------------+  |
|                                                          |
|              [ Look Up ]                                 |
|                                                          |
|  +-----------------+ Result Panel +--------------------+ |
|  |                                                    |  |
|  |  Case Number:    CASE0000017                       |  |
|  |  Subject:        <subject text>                    |  |
|  |  Status:         In Progress                       |  |
|  |  Opened:         2025-04-15 10:23:45               |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Portal Default Footer]                                 |
+----------------------------------------------------------+
```

### Input Field

| Field | HTML Type | Sent To | Mandatory | Validation |
| --- | --- | --- | --- | --- |
| Case Number | text input | URL parameter on GET `/api/x_casemgmt/case_status_lookup?number=<value>` | Yes | non-empty, format must match `CASE\d{7}` (regex client-side hint, server-side enforced) |

### Lookup Behavior

1. Client-side validates the case number format (regex `^CASE\d{7}$`) and shows hint if malformed.
2. On valid format, the widget calls scripted REST endpoint GET `/api/x_casemgmt/case_status_lookup?number=<value>`.
3. The endpoint queries `x_casemgmt_case` by `number = <value>` using a `GlideRecord` lookup.
4. **If found:** returns 200 OK with body `{ "status": "...", "subject": "...", "opened_date": "..." }` — only those three fields, NOTHING else.
5. **If not found:** returns 404 Not Found carrying the verbatim literal `No case found with that number.` Measured body on this release: **`{"result":{"error":"No case found with that number."}}`** — the Scripted REST framework nests a handler's body under `result`, so the `error` key sits one level down. The message string is byte-identical either way and the widget reads it defensively, but the envelope is recorded here because earlier revisions of this document wrote it as `{"error":"…"}` and a consumer coding against that shape would miss it.
6. The widget renders the result panel with the three returned fields, OR the verbatim "not found" message.

### Whitelisted Output Fields

The lookup endpoint returns ONLY the following three case fields per AAP Section 0.7.4 ("lookup page returns ONLY status, subject, opened_date — no internal fields exposed"). The scripted REST handler in [`../portal/rest/sys_ws_operation_x_casemgmt_case_status_lookup_get.xml`](../portal/rest/) constructs the response object with EXPLICIT field assignment to defend in depth against accidental field exposure in future edits:

```javascript
response.setBody({
    status:      String(result.status      || ''),
    subject:     String(result.subject     || ''),
    opened_date: String(result.opened_date || '')
});
```

The underlying Script Include [`../script_includes/x_casemgmt_CasePortalService.xml`](../script_includes/) (`lookupCase` function) returns the same three-field shape — i.e., the field whitelist is enforced at two layers (Script Include + REST operation), so an accidental edit to either layer alone cannot widen the exposure.

Fields explicitly INCLUDED in the response (the AAP §0.7.4 whitelist):

- `status`
- `subject`
- `opened_date`

Fields explicitly EXCLUDED from the response (per AAP Section 0.7.4 — "no internal fields exposed"; AAP interprets "internal fields" to mean every field on the case table other than the three above):

- `number` — even though the requester supplied it as input, this implementation does NOT echo it back. The widget already has the user-supplied value in its own scope and re-prints it from the input field; including `number` in the response would be redundant and would weaken the whitelist discipline.
- `description` — internal narrative
- `priority` — internal triage
- `closed_date` — internal disposition (and might be empty)
- `assigned_group` — internal assignment
- `assigned_agent` — internal assignment
- `requester_name` — privacy
- `requester_email` — privacy
- `type` — internal classification
- `pending_reason` — internal disposition
- All `sys_*` audit fields (`sys_id`, `sys_created_on`, `sys_created_by`, `sys_updated_on`, `sys_updated_by`)

### Not-Found Behavior (VERBATIM)

When the supplied case number does not match any record in `x_casemgmt_case`, the lookup endpoint MUST return the following text character-for-character in both the JSON response body's `message` field AND the rendered widget:

```text
No case found with that number.
```

Per AAP Section 0.7.4, this text is the canonical not-found message. It MUST appear character-for-character — no paraphrase, no translation, no punctuation drift. The trailing period is part of the message; the casing of "No" (capital N) is part of the message; the lowercase "case found with that number" is part of the message.

### Error Handling

- Empty case number → 400 Bad Request, client-side hint "Please enter a case number."
- Malformed case number (regex fail) → 400 Bad Request, client-side hint "Case number format must be CASE0000001."
- Case number not found → 404 Not Found, displays "No case found with that number."
- Server-side error → 500 Internal Server Error, generic "Lookup failed; please try again."

#### Not-found and service-failure are two different answers, and the widget no longer conflates them

Earlier revisions of the lookup widget routed **every** failure — 404, 500, a network drop, a gateway timeout —
through a single branch that set `c.notFound = true`, which rendered the AAP's verbatim literal
`No case found with that number.` That is the one message that must never be shown on a transport failure: it is a
statement of fact about the case table, and an infrastructure error is not evidence about the case table. A
requester whose case exists could be told, definitively, that it does not.

The error handler is now split, and the two paths render different panels:

| Outcome | State set | Panel rendered |
| --- | --- | --- |
| HTTP 404, or HTTP 400 (bad request) | `c.notFound = true`, `c.errorMessage = ''` | `alert alert-warning`, `role="alert"`, containing the verbatim `No case found with that number.` — unchanged, still character-for-character, still the only place that string appears |
| HTTP 5xx, a network failure, or the client-side deadline expiring | `c.errorMessage` set, `c.notFound = false` | `alert alert-danger`, `role="alert"`, containing `The case service could not be reached. Please try again in a moment.` |

The 400 case is deliberately grouped with 404 rather than with the failures: the endpoint answers 400 when the
supplied number is not a well-formed case number, which *is* an answer about the input, and the widget's own regex
means a 400 is close to unreachable from the page.

`c.result`, `c.notFound` and `c.errorMessage` are all reset at the start of every lookup, so at most one of the
three panels can ever be on screen.

#### The lookup has a 20-second deadline; the submission deliberately has none

`var LOOKUP_TIMEOUT_MS = 20000;` is passed to `$http.get(url, { timeout: LOOKUP_TIMEOUT_MS })`. Without it a stalled
request left the button reading "Looking up your case, please wait..." indefinitely with no way to recover but a page
reload. On expiry the promise rejects with no HTTP status, which lands in the service-failure branch above — so a
timeout produces the "could not be reached" panel and never the not-found literal. Recovery needs nothing but
pressing the button again.

**The submission POST is deliberately left without a timeout, and that asymmetry is intentional.** A lookup is a
read: abandoning it costs nothing and the user simply retries. A submission is a write. If the client gave up at
20 seconds on a request the server went on to commit, the page would report failure for a case that exists, and the
obvious user response — submit again — would create a duplicate. Better to keep waiting than to invite that. The
anonymous flood guard on the endpoint (10 submissions per 60 s) is a second reason not to encourage retries.

Verified at runtime: the failure path was driven with the browser's network emulation set offline, producing
`net::ERR_INTERNET_DISCONNECTED` with no HTTP status. The red panel appeared, the literal
`No case found with that number.` was absent from **every** live text node on the page, and the lookup recovered on a
plain retry once the network was restored.

## Source-Side Semantic Mapping

This section documents how the two ServiceNow portal pages semantically correspond to ArkCase concepts. None of the ArkCase code is reused — it is read-only context that informed the data shapes and request/response patterns.

| ServiceNow Artifact | ArkCase Source Concept | Notes |
| --- | --- | --- |
| Page 1 — Case Submission | `acm-services/acm-service-portal-gateway/` (FOIA portal anonymous-submission pattern) | Replaces Java REST + Angular template with Service Portal page + widget + scripted REST endpoint |
| Page 1 — Case Submission widget | `acm-standard-applications/arkcase/src/main/webapp/resources/modules/cases/services/case-info.client.service.js` (`Case.InfoService.save`) | The case payload shape (subject, type, description, requester_*) is informed by the AngularJS service contract, but the implementation is fully ServiceNow-native |
| Page 2 — Case Status Lookup | `acm-plugins/acm-default-plugins/acm-case-file-plugin/src/main/java/com/armedia/acm/plugins/casefile/service/GetCaseByNumberService.java` | Java service that fetches a case by case number; ServiceNow uses GlideRecord lookup by `number` |
| Scripted REST endpoint `/api/x_casemgmt/case_submit` | `acm-services/acm-service-portal-gateway/.../foiaPortalRequestServiceProvider.java` | Replaces Java REST controller |
| Scripted REST endpoint `/api/x_casemgmt/case_status_lookup` | `GetCaseByNumberService.java` | Replaces Java service-layer surface |

## Verification

The two portal-related rows from AAP Section 0.7.3's seven-row validation framework are reproduced verbatim below. Both gates MUST pass before the Update Set is exported.

| Gate | Criterion | Pass Condition |
| --- | --- | --- |
| Portal — submission | Case created from unauthenticated portal submission | Case appears in internal list with Draft status and correct case number |
| Portal — lookup | Status lookup returns correct data for valid case number | Correct status/subject/opened_date returned; "not found" message for invalid number |

The numbered procedure below cross-references [`validation-gates.md`](./validation-gates.md) Gates 4 and 5.

1. Log out of the PDI; open the portal URL in an incognito browser.
2. Navigate to the submission page; fill all 5 fields with synthetic values; submit.
3. Confirm the confirmation panel displays the auto-generated case number in `CASE0000001` format.
4. Log in as `x_casemgmt_demo_manager`; locate the new case in the case list.
5. Confirm `status = Draft`, `subject` and `requester_name` match submitted values, and `opened_date` is set.
6. Confirm `assigned_group`, `assigned_agent`, `closed_date` are empty.
7. Log out; open the lookup page; enter the new case number; click Look Up.
8. Confirm the result panel shows `status`, `subject`, `opened_date` — and NO other case fields. (The panel also
   re-prints the number the user typed, from its own input scope; the number is deliberately **not** in the
   response body — see *Whitelisted Output Fields* above.)
9. Enter case number `CASE9999999`; confirm the literal text "No case found with that number." appears.
10. Re-check the validation behaviour of both forms, because it is the part most easily broken by a later edit:
    - On the submission page, fill all four required fields and type `not-an-email` in Your Email. Confirm that the
      **email** group alone takes `has-error`, that its control alone reports `aria-invalid="true"`, that the message
      *"Enter a valid email address, or leave the field empty…"* is rendered, and that the hint under the button reads
      *"Email is optional, but the address entered is not valid…"* — **not** the required-fields wording.
    - Paste 300 characters into Subject. Confirm the value is capped at exactly 255 **and** that the notice
      *"Subject has reached its limit of 255 characters…"* appears; repeat for Description at 4000.
    - On the lookup page, block network access and press Look Up. Confirm the red *"The case service could not be
      reached…"* panel appears and that `No case found with that number.` does **not** appear anywhere on the page.
      Restore the network and press Look Up again; confirm it recovers without a reload.

**Measured outcome of the procedure above, on `dev379024`.** Steps 1-9 pass anonymously: `POST` returns **201** with
`{"number":"CASE…","message":"Your case has been submitted"}`, every response carries `x-is-logged-in: false`, the
found panel holds exactly three `dt`/`dd` pairs and `Object.keys(response)` is exactly
`["status","subject","opened_date"]`, an audit of the rendered `<main>` for the eight internal field names returns
zero matches, and the not-found literal measures exactly **31** characters, codepoint-verified as pure ASCII with a
terminating `U+002E`. Step 10 passes in all five invalid states tested on the submission form and both states on the
lookup form. Both pages were also re-checked at 375 / 768 / 1280 / 1920 px after the markup changes:
`scrollWidth === innerWidth` at every width, no element crossing the right edge, no overlapping form groups and no
clipped text — including the 375 px state with every error message on screen at once.

## Cross-References

- [`data-model.md`](./data-model.md) — schema reference for the case fields used in the portal.
- [`state-machine.md`](./state-machine.md) — describes why submitted cases start in `Draft` status.
- [`acl-matrix.md`](./acl-matrix.md) — explains why anonymous submission is permitted (scripted REST runs at platform-default privilege).
- [`validation-gates.md`](./validation-gates.md) — Gates 4 and 5 (Portal submission and lookup).
- [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml) — Service Portal record.
- [`../portal/pages/`](../portal/pages/) — `sp_page_x_casemgmt_case_submit.xml`, `sp_page_x_casemgmt_case_status.xml`.
- [`../portal/widgets/`](../portal/widgets/) — three widget records (`sp_widget_x_casemgmt_case_submission_widget.xml`, `sp_widget_x_casemgmt_case_lookup_widget.xml`, `sp_widget_x_casemgmt_case_confirmation_widget.xml`).
- [`../portal/rest/`](../portal/rest/) — two scripted REST endpoint records (`sys_ws_definition_x_casemgmt_case_submit.xml`, `sys_ws_definition_x_casemgmt_case_status_lookup.xml`).
- [`../script_includes/`](../script_includes/) — `x_casemgmt_CasePortalService.xml` server-side helper that backs both scripted REST endpoints.

