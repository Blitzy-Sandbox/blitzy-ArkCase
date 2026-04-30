# Portal Pages

## Purpose

This document captures the wireframe-level specifications for the two unauthenticated Experience Portal pages: Case Submission and Case Status Lookup. Both pages are delivered as Service Portal records under [`../portal/pages/`](../portal/pages/) with widgets under [`../portal/widgets/`](../portal/widgets/) and scripted REST endpoints under [`../portal/rest/`](../portal/rest/). Anonymous access is enforced by the platform's portal/widget configuration. The lookup page enforces strict field whitelisting at the scripted REST layer to prevent exposure of internal data.

The placeholder string `x_[scope]_` is preserved as written throughout this repository; the actual scope identifier is auto-assigned by the ServiceNow Personal Developer Instance (PDI) when the scoped application is created. No other token replaces this placeholder.

## Common Conventions

- Both pages live under a single Service Portal record [`../portal/sp_portal_x_[scope]_case_portal.xml`](../portal/sp_portal_x_[scope]_case_portal.xml).
- Portal URL: `[instance URL]/x_[scope]_portal` (or the equivalent portal URL chosen at portal-record creation time, per AAP Section 0.7.2).
- Both pages are anonymous (no login required).
- Both pages use the platform default theme — no custom CSS, no custom branding (per AAP Section 0.4.4).
- Both pages call scripted REST endpoints under `/api/x_[scope]/...`.
- The scripted REST endpoints execute with platform-default elevated privilege but the request/response shapes whitelist exactly the fields specified by AAP Section 0.7.4.
- No PII in any example record; all examples reference synthetic data consistent with [`../seed-data/`](../seed-data/).

## Page 1: Case Submission

### Purpose

Allows an unauthenticated external requester to submit a new case. On successful submission, the page shows a confirmation panel displaying the auto-generated case number (in `CASE0000001` format) and a friendly "Your case has been submitted" acknowledgement.

### URL

- `[instance URL]/x_[scope]_portal?id=case_submit` (Service Portal page route).

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

### Input Fields

| Field | HTML Type | Maps To | Mandatory | Validation |
| --- | --- | --- | --- | --- |
| Subject | text input | `x_[scope]_case.subject` | Yes | non-empty, max 255 chars |
| Case Type | dropdown | `x_[scope]_case.type` | Yes | one of `General Inquiry`, `Complaint` |
| Description | textarea | `x_[scope]_case.description` | Yes | non-empty, max 4000 chars |
| Your Name | text input | `x_[scope]_case.requester_name` | Yes | non-empty, max 100 chars |
| Your Email | text input | `x_[scope]_case.requester_email` | No | optional; if provided, max 100 chars |

### Submit Behavior

1. Form-level client-side validation runs first (mandatory fields, max-length).
2. On client validation pass, the widget calls scripted REST endpoint POST `/api/x_[scope]/case_submit`.
3. The scripted REST handler validates the payload server-side, creates a new `x_[scope]_case` record with `status = Draft` (the default), populates `subject`, `type`, `description`, `requester_name`, `requester_email` from the payload, and DOES NOT populate `assigned_group`, `assigned_agent`, or `closed_date`.
4. Auto-numbering populates `number` in `CASE0000001` format.
5. Business rule `set_opened_date` populates `opened_date = gs.nowDateTime()` on insert.
6. The endpoint returns a JSON payload `{ "number": "<auto-generated case number>" }`.
7. The submission widget hides the form and shows the confirmation widget displaying the returned case number plus the acknowledgement "Your case has been submitted."

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
- Server-side error → 500 Internal Server Error with generic "Submission failed; please try again." (do NOT expose internal stack traces).

## Page 2: Case Status Lookup

### Purpose

Allows an unauthenticated external requester to look up the current status of a case they previously submitted. The page accepts a single case number input and returns ONLY `status`, `subject`, and `opened_date` for valid case numbers. For invalid case numbers, the page displays the verbatim text "No case found with that number." (per AAP Section 0.7.4).

### URL

- `[instance URL]/x_[scope]_portal?id=case_status` (Service Portal page route).

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
| Case Number | text input | URL parameter on GET `/api/x_[scope]/case_status_lookup?number=<value>` | Yes | non-empty, format must match `CASE\d{7}` (regex client-side hint, server-side enforced) |

### Lookup Behavior

1. Client-side validates the case number format (regex `^CASE\d{7}$`) and shows hint if malformed.
2. On valid format, the widget calls scripted REST endpoint GET `/api/x_[scope]/case_status_lookup?number=<value>`.
3. The endpoint queries `x_[scope]_case` by `number = <value>` using a `GlideRecord` lookup.
4. **If found:** returns 200 OK with body `{ "number": "...", "status": "...", "subject": "...", "opened_date": "..." }` — only those four fields, NOTHING else.
5. **If not found:** returns 404 Not Found with body `{ "message": "No case found with that number." }` (verbatim).
6. The widget renders the result panel with the four returned fields, OR the verbatim "not found" message.

### Whitelisted Output Fields

The lookup endpoint returns ONLY the following case fields. Per AAP Section 0.7.4, no internal fields are exposed under any circumstance. The scripted REST handler MUST construct the response object with EXPLICIT field assignment (`{number: gr.number, status: gr.status, subject: gr.subject, opened_date: gr.opened_date}`) — never `gr.toJSON()` or similar serialization shortcut.

Fields explicitly INCLUDED in the response:

- `number` (echoed back so the requester can confirm they queried the right number)
- `status`
- `subject`
- `opened_date`

Fields explicitly EXCLUDED from the response (per AAP Section 0.7.4 — "lookup page returns ONLY status, subject, opened_date — no internal fields exposed"):

- `description` — internal narrative
- `priority` — internal triage
- `closed_date` — internal disposition (and might be empty)
- `assigned_group` — internal assignment
- `assigned_agent` — internal assignment
- `requester_name` — privacy
- `requester_email` — privacy
- `pending_reason` — internal disposition
- All `sys_*` audit fields (`sys_id`, `sys_created_on`, `sys_created_by`, `sys_updated_on`, `sys_updated_by`)

### Not-Found Behavior (VERBATIM)

When the supplied case number does not match any record in `x_[scope]_case`, the lookup endpoint MUST return the following text character-for-character in both the JSON response body's `message` field AND the rendered widget:

```text
No case found with that number.
```

Per AAP Section 0.7.4, this text is the canonical not-found message. It MUST appear character-for-character — no paraphrase, no translation, no punctuation drift. The trailing period is part of the message; the casing of "No" (capital N) is part of the message; the lowercase "case found with that number" is part of the message.

### Error Handling

- Empty case number → 400 Bad Request, client-side hint "Please enter a case number."
- Malformed case number (regex fail) → 400 Bad Request, client-side hint "Case number format must be CASE0000001."
- Case number not found → 404 Not Found, displays "No case found with that number."
- Server-side error → 500 Internal Server Error, generic "Lookup failed; please try again."

## Source-Side Semantic Mapping

This section documents how the two ServiceNow portal pages semantically correspond to ArkCase concepts. None of the ArkCase code is reused — it is read-only context that informed the data shapes and request/response patterns.

| ServiceNow Artifact | ArkCase Source Concept | Notes |
| --- | --- | --- |
| Page 1 — Case Submission | `acm-services/acm-service-portal-gateway/` (FOIA portal anonymous-submission pattern) | Replaces Java REST + Angular template with Service Portal page + widget + scripted REST endpoint |
| Page 1 — Case Submission widget | `acm-standard-applications/arkcase/src/main/webapp/resources/modules/cases/services/case-info.client.service.js` (`Case.InfoService.save`) | The case payload shape (subject, type, description, requester_*) is informed by the AngularJS service contract, but the implementation is fully ServiceNow-native |
| Page 2 — Case Status Lookup | `acm-plugins/acm-default-plugins/acm-case-file-plugin/src/main/java/com/armedia/acm/plugins/casefile/service/GetCaseByNumberService.java` | Java service that fetches a case by case number; ServiceNow uses GlideRecord lookup by `number` |
| Scripted REST endpoint `/api/x_[scope]/case_submit` | `acm-services/acm-service-portal-gateway/.../foiaPortalRequestServiceProvider.java` | Replaces Java REST controller |
| Scripted REST endpoint `/api/x_[scope]/case_status_lookup` | `GetCaseByNumberService.java` | Replaces Java service-layer surface |

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
4. Log in as `x_[scope]_demo_manager`; locate the new case in the case list.
5. Confirm `status = Draft`, `subject` and `requester_name` match submitted values, and `opened_date` is set.
6. Confirm `assigned_group`, `assigned_agent`, `closed_date` are empty.
7. Log out; open the lookup page; enter the new case number; click Look Up.
8. Confirm the result panel shows `number`, `status`, `subject`, `opened_date` — and NO other case fields.
9. Enter case number `CASE9999999`; confirm the literal text "No case found with that number." appears.

## Cross-References

- [`data-model.md`](./data-model.md) — schema reference for the case fields used in the portal.
- [`state-machine.md`](./state-machine.md) — describes why submitted cases start in `Draft` status.
- [`acl-matrix.md`](./acl-matrix.md) — explains why anonymous submission is permitted (scripted REST runs at platform-default privilege).
- [`validation-gates.md`](./validation-gates.md) — Gates 4 and 5 (Portal submission and lookup).
- [`../portal/sp_portal_x_[scope]_case_portal.xml`](../portal/sp_portal_x_[scope]_case_portal.xml) — Service Portal record.
- [`../portal/pages/`](../portal/pages/) — `sp_page_x_[scope]_case_submit.xml`, `sp_page_x_[scope]_case_status.xml`.
- [`../portal/widgets/`](../portal/widgets/) — three widget records (`sp_widget_x_[scope]_case_submission_widget.xml`, `sp_widget_x_[scope]_case_lookup_widget.xml`, `sp_widget_x_[scope]_case_confirmation_widget.xml`).
- [`../portal/rest/`](../portal/rest/) — two scripted REST endpoint records (`sys_ws_definition_x_[scope]_case_submit.xml`, `sys_ws_definition_x_[scope]_case_status_lookup.xml`).
- [`../script_includes/`](../script_includes/) — `x_[scope]_CasePortalService.xml` (server-side helper that backs both scripted REST endpoints).

