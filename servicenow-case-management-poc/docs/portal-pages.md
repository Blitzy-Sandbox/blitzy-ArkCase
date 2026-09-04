# Portal Pages

## Purpose

This document captures the wireframe-level specifications for the two unauthenticated Experience Portal pages: Case Submission and Case Status Lookup. Both pages are delivered as Service Portal records under [`../portal/pages/`](../portal/pages/) with widgets under [`../portal/widgets/`](../portal/widgets/) and scripted REST endpoints under [`../portal/rest/`](../portal/rest/). Anonymous access is enforced by the platform's portal/widget configuration. The lookup page enforces strict field whitelisting at the scripted REST layer to prevent exposure of internal data.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

## Common Conventions

- Both pages live under a single Service Portal record [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml).
- Portal URL: `[instance URL]/x_casemgmt_case_portal`. The portal slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml). AAP Section 0.7.2 verbatim wording uses `[instance URL]/x_casemgmt_portal` as a generic placeholder ("or the equivalent portal URL chosen at portal-record creation time"); this document uses the actual implementation slug to keep the per-page URL examples below accurate.
- Both pages are anonymous (no login required).
- Both pages use the platform default theme, add no branding and add **no custom CSS** — every widget's `css` element is empty, per AAP Section 0.4.4. The WCAG AA contrast items raised against these pages are addressed only as far as that mandate allows, by class choice rather than by overriding the palette; see *Colour contrast* under [Accessibility of the two form widgets](#accessibility-of-the-two-form-widgets) for the measurements and for the residual items the mandate leaves in place.
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
| Primary action is never disabled | Both buttons are `ng-disabled` on the in-flight flag **only**, so they stay pointer-addressable and stay in the tab order, and the press is validated on click. A button disabled on form validity was the previous design and it answered nothing: a disabled `<button>` does not receive the pointer (the click lands on the wrapping `div.form-group`, and the declared `cursor:not-allowed` can never render), and it is removed from the tab order. The form sets `novalidate`, so the browser contributes no per-field message either — the widget's own messages are the whole of the feedback | both widgets |
| Guidance under the button | A paragraph under the button (carrying no colour class, so it inherits the theme's body colour rather than `.help-block` grey) states what is still needed, in visible text, referenced by the button through `aria-describedby`. It is always present in the DOM, so that reference never dangles. On the lookup page its empty-state line is suppressed while the field's own message is showing, because both said the same sentence and two copies of one instruction read as two problems | both widgets |
| Stale-message hygiene | Every input carries `ng-change="c.onInputChange()"`, which drops the previous attempt's outcome — the submission error and validation summary, and on the lookup page the result panel, the not-found alert and the service-failure alert together. A keystroke is evidence the user has moved on from that answer, and clearing the lookup's four pieces of state together is what stops a panel describing a superseded case number from coexisting with the new one. Per-field messages are deliberately NOT cleared here: they are bound to live `$invalid && $touched` and correct themselves | both widgets |
| Heading structure | One real `<h1>` per page — "Submit a Case" / "Case Status Lookup" — and on the submission page it is mounted **outside** the `ng-if` that swaps the form for the confirmation, so exactly one `h1` exists in every state. Both confirmation panels and the lookup result panel use `<h2>`, so no level is skipped. Note that the Service Portal page container additionally emits its own 1x1 clipped `div.sr-only[role="heading"][aria-level="1"]` from `sp_page.title`, with text identical to the widget's `h1`; that element is platform-generated and cannot be removed from the widget layer, so each page exposes two level-1 headings to assistive technology | both widgets |
| Successful result announcement | The lookup result panel sits inside an **always-mounted** `<div role="status" aria-live="polite">`. The region is the mounted wrapper rather than the `ng-if`'d panel because a live region must exist in the DOM before its content changes to be announced reliably. Before this, both failure paths announced (`role="alert"`) and success announced nothing, so a screen-reader user heard the outcome only when it went wrong | lookup widget |
| In-flight state | The same paragraph is a `role="status" aria-live="polite"` region that announces "Submitting your case, please wait..." / "Looking up your case, please wait...", and the form sets `aria-busy` while the request is outstanding. The button's changing inner text is no longer the only signal | both widgets |
| Result and error announcements | `role="alert"` on the submission error panel, the lookup result's not-found panel, the lookup's service-failure panel, and the confirmation panel; the lookup result itself is a `<dl>`/`<dt>`/`<dd>` definition list | both widgets |
| Programmatic invalid state | Every control has a `name` and binds **`aria-invalid`** to `$invalid && $touched`, so assistive technology is told *which* control is wrong rather than only that the form is. The `$touched` half is deliberate: a field the user has never visited is not announced as an error on first paint | both widgets |
| Visible invalid state | The control's `.form-group` takes Bootstrap 3's **`has-error`** class under the same condition, which is what makes the failing field visually distinguishable without any custom CSS | both widgets |
| Per-field error message | Each control has its own paragraph carrying the theme's **`text-danger`** class and **`role="alert"`**, referenced by the control through `aria-describedby`, rendered only while that control is invalid and touched. The exact strings are in the table below | both widgets |
| Maximum-length notice | Each length-capped field carries a **`role="status"`** notice that appears only once `maxlength` has been reached, because `maxlength` silently discards further keystrokes and a silent discard is the defect. Wording: *"&lt;Field&gt; has reached its limit of &lt;n&gt; characters. Anything typed beyond this point is discarded."* for Subject (255), Description (4000) and Your name (100) | submission widget |
| Colour contrast | Inherited from the platform default theme, with **no custom CSS anywhere** — AAP Section 0.4.4 mandates the default theme with *"No custom CSS, no custom branding"* and Section 0.3.2 places theme and branding modifications out of scope, so the frozen specification outranks the WCAG contrast preference and the palette is not overridden. What could be fixed WITHOUT custom CSS was fixed by class choice: the neutral guidance and status paragraphs no longer carry `.help-block` (theme grey `#b1b1b1`, measured **2.14:1** — the single audit Lighthouse used to fail) and instead inherit the theme's body colour `#717171`, measured **4.88:1 — passes AA**. The remaining items are the stock components' own colour values and are left exactly as the platform paints them: resting `.btn-primary` white on `#428bca` = **3.63:1**, per-field `.text-danger` `#d9534f` = **3.96:1**, `.alert-warning` `#c77c11` on the theme's white alert background = **3.32:1**, and the focus indicator `#66afe9` = **2.37:1** against white (the theme's own 4px outline is painted `rgba(0,0,0,0)`, so the 1.5px glow is the whole indicator). `.alert-danger` already passes at `#a02622` on `#fdf7f7` = **7.09:1**. Measured after the change: Lighthouse Accessibility **96/100 on both pages**, its one failing audit being the theme's `.btn-primary` label. Those four residuals are bounded by the Section 0.4.4 exception and are recorded here rather than silently accepted — closing them requires an explicit exception to the no-custom-CSS mandate, which is a specification decision and not one this package may take for itself | portal surface |
| Target size | Interactive controls are 34px tall and **deliberately left that way**. 34x34 clears WCAG 2.1 AA SC 2.5.8's 24x24 minimum; the 44x44 figure is SC 2.5.5, which is AAA, and reaching it would mean changing the theme's control metrics — a visual redesign of exactly the kind AAP Section 0.4.4 exists to prevent | portal surface |
| Known residual | Each control's `aria-describedby` names its error paragraph unconditionally while that paragraph is `ng-if`'d, so the reference is unresolved whenever the field is valid or untouched. WAI-ARIA requires an unresolvable IDREF to be ignored, and each message also carries `role="alert"` so it is announced on appearance regardless; the alternative — mounting an empty `help-block` per field — would add Bootstrap's help-block margins to the form in its normal, valid state. Recorded as a deliberate trade-off rather than an oversight. One further residual is platform-owned and outside these widgets: the Service Portal skip link measures 3.63:1 (white on `#428bca`) once focused. The confirmation link is deliberately a plain theme link rather than a `.btn`, because the theme paints `.btn:focus` with a fully transparent outline and that would have left the link with no keyboard focus indicator of its own | both widgets |

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

A press on an invalid form additionally raises a `role="alert"` summary next to the button, because the per-field
messages sit beside fields the requester has already scrolled past:

| Widget | Summary text |
| --- | --- |
| submission | `Your case has not been submitted yet. Correct the highlighted fields above, then choose Submit again.` |
| lookup | `Enter a case number, then choose Look Up Status.` |

Neither summary is a substitute for the per-field messages: those say which field and why, the summary says the
press was received and refused. Both are cleared by the next keystroke.

The hint beneath the Submit button is a `role="status" aria-live="polite"` region and has **three** states, so it
can never contradict the field-level messages:

| Condition | Hint text |
| --- | --- |
| any of the four required fields still incomplete | `Every field marked * is required. Complete all four before submitting.` |
| all four complete, but the optional email is malformed | `Email is optional, but the address entered is not valid. Correct it or clear the field before submitting.` |
| nothing blocking | `All required fields are complete.` |

The distinction is computed by `c.requiredIncomplete()` in the widget's client script, which inspects only the four
mandatory controls — that is what lets the second state exist at all. The hint paragraph is always present in the
DOM, so the button's `aria-describedby` reference never dangles, and it doubles as the in-flight announcement.

No CSS was added at all. `has-error`, `text-danger`, `alert-warning` and `alert-danger` are Bootstrap 3 classes the
platform's default Service Portal theme already provides, and the roles, `aria-live` regions, `aria-invalid`
bindings and heading levels are all markup. Every widget's `css` element is empty, which is what AAP §0.4.4's
*"No custom CSS, no custom branding"* requires; §0.3.2 places theme and branding modifications out of scope as
well. Where a colour measured below AA, the remedy taken was to stop applying the offending default-theme class
(the guidance paragraphs' `.help-block` grey, 2.14:1, replaced by the inherited body colour at 4.88:1) rather
than to restyle the theme.

Three consequences are worth stating plainly. First, the four contrast items that are inherent to the stock
components — `.btn-primary` at rest (3.63:1), per-field `.text-danger` (3.96:1), `.alert-warning` text (3.32:1)
and the focus indicator (2.37:1) — remain **disclosed rather than fixed**, bounded by the §0.4.4 exception;
Lighthouse Accessibility reads 96/100 on both pages with the `.btn-primary` label as its only failing audit.
Closing them needs an explicit specification exception permitting widget-scoped colour CSS. Second, the
**control-size** gap is deliberately not fixed either — 34 px clears WCAG 2.1 AA SC 2.5.8's 24×24 minimum, and
the 44×44 figure is SC 2.5.5 (AAA), which would require changing the theme's control metrics. Third, everything
that could be fixed in **markup** was: a real `<h1>` per page, the success panel inside an always-mounted
`role="status" aria-live="polite"` region, a keyboard-reachable primary action that validates on press, stale
messages cleared on edit, and the status-page link on the confirmation panel.
[`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) INFO-3 describes both gaps as
disclosed-and-unfixed with the `css` field empty, which is exactly the shipped state.

### Input Fields

| Field | HTML Type | Maps To | Mandatory | Validation |
| --- | --- | --- | --- | --- |
| Subject | text input | `x_casemgmt_case.subject` | Yes | non-empty, max 255 chars |
| Case Type | dropdown | `x_casemgmt_case.type` | Yes | one of `General Inquiry`, `Complaint` |
| Description | textarea | `x_casemgmt_case.description` | Yes | non-empty, max 4000 chars |
| Your Name | text input | `x_casemgmt_case.requester_name` | Yes | non-empty, max 100 chars |
| Your Email | text input | `x_casemgmt_case.requester_email` | No | optional; if provided, max 100 chars |

### Submit Behavior

1. Form-level client-side validation runs first. The Submit button is **always enabled** — it is `ng-disabled` on the in-flight flag only — and `c.submit(caseSubmitForm)` consults the form's validity on the press. On an invalid form it marks every control `$touched` (which renders each field's own `role="alert"` message), shows a `role="alert"` summary, and **returns without issuing any request**. A disabled button was the previous gate and it was a dead end: a disabled `<button>` is pointer-transparent, so a click landed on the wrapping `div.form-group` and produced no feedback at all, and it is absent from the tab order, so a keyboard user never reached the primary action. The FormController is passed **as an argument** rather than read from `$scope`, because the form sits inside `ng-if="!c.data.submitted"` and therefore links on a child scope where `$scope.caseSubmitForm` is undefined.
2. On client validation pass, the widget calls scripted REST endpoint POST `/api/x_casemgmt/case_submit`.
3. The scripted REST handler validates the payload server-side, creates a new `x_casemgmt_case` record with `status = Draft` (the default), populates `subject`, `type`, `description`, `requester_name`, `requester_email` from the payload, and DOES NOT populate `assigned_group`, `assigned_agent`, or `closed_date`.
4. Auto-numbering populates `number` in `CASE0000001` format.
5. Business rule `set_opened_date` populates `opened_date = gs.nowDateTime()` on insert.
6. The endpoint returns a JSON payload `{ "number": "<auto-generated case number>" }`.
7. The submission widget hides the form and shows the confirmation widget displaying the returned case number plus the acknowledgement "Your case has been submitted" (no trailing period — matches the wireframe and the confirmation widget schema), and a link on to the status page (see below).
8. Editing any input clears the previous attempt's messages (`ng-change="c.onInputChange()"`), so a failed submission's alert cannot sit above fields the requester is already correcting.

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
|              [ Check the status of this case ]           |
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
> | `description` of 4,001 characters (or `subject` 256, `requester_name` 101, `requester_email` 101) | **400**, field-level `{error, fields}` body naming the offending field and quoting both the limit and the length received, and **no row created**. An over-length value is **REFUSED, never truncated** — the earlier behaviour answered 201 and stored a silently shortened value, which on an anonymous intake path meant the material end of a long description was dropped while the requester was told the case had been submitted. Measured: 4,001-char `description` → `400 {"description":"Description must be 4000 characters or fewer (received 4001)."}`; all three over-length fields at once → one 400 naming all three; exactly-at-limit 255/4000/100/99 → **201** and stored in full. The check must live in script because a column longer than 255 is TEXT and does not truncate at storage |
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

0. **Arriving from a submission confirmation.** The confirmation panel links here as `?id=x_casemgmt_case_status&number=CASE0000001`. The widget's server script reads that parameter with `$sp.getParameter('number')` into `data.prefilledNumber` (trimmed, capped at the 20 characters the input's own `maxlength` allows), and the client controller pre-fills the field and runs the lookup once. Without it the requester followed a link labelled "Check the status of this case", landed on an empty form, and had to re-type the number the link already carried. This is the only circumstance in which the widget issues a request without a button press, and it is the requester driving it — they clicked a link that says exactly this. With no parameter, `prefilledNumber` is `''` and the page behaves as it always did: empty field, no request. The parameter is treated as untrusted address-bar input: it is never used to build a query directly (the lookup still goes through the same `encodeURIComponent`'d GET, and the endpoint answers 404 for anything it does not recognise) and it reaches the template through `ng-model`, which renders it as a value and never as markup.
1. Client-side validates that the case number is non-empty and shows the field's own message plus a summary if it is not. The Look Up Status button is **always enabled** — `ng-disabled` on the in-flight flag only — and `c.lookup(caseLookupForm)` decides on the press, returning without issuing a request when the field is empty. A button disabled on an empty field was the previous gate and it answered nothing, for the same two reasons as on the submission page: a disabled `<button>` is pointer-transparent and is absent from the tab order.
2. On a non-empty value, the widget calls scripted REST endpoint GET `/api/x_casemgmt/case_status_lookup?number=<value>`.
3. The endpoint queries `x_casemgmt_case` by `number = <value>` using a `GlideRecord` lookup.
4. **If found:** returns 200 OK with body `{ "status": "...", "subject": "...", "opened_date": "..." }` — only those three fields, NOTHING else. `opened_date` is the **display** value (session timezone and date format), not the raw stored UTC value: the endpoint previously emitted the raw column, so the same record read `2026-09-03 17:39:40` externally and `2026-09-03 10:39:40` on the internal form — a seven-hour discrepancy that put an external requester's submission time in the future relative to what staff could see. The timezone that qualifies the instant is rendered as part of the **Opened Date label** on the lookup panel (e.g. `Opened Date (America/Los_Angeles)`), resolved by the widget from its own session; it is deliberately **not** a fourth response key, because AAP Section 0.7.4 fixes this payload at exactly three.
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

**Measured outcome of the procedure above, taken on `dev379024` (Australia Patch 3).** That host is now
**retired and is not used**, so the figures below are dated evidence from it, not a reading of the current
validation instance. Steps 1-9 pass anonymously: `POST` returns **201** with
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

