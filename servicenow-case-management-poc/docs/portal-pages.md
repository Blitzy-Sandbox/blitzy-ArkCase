# Portal Pages

## Purpose

This document captures the wireframe-level specifications for the two unauthenticated Experience Portal pages: Case Submission and Case Status Lookup. Both pages are delivered as Service Portal records under [`../portal/pages/`](../portal/pages/) with widgets under [`../portal/widgets/`](../portal/widgets/) and scripted REST endpoints under [`../portal/rest/`](../portal/rest/). Anonymous access is enforced by the platform's portal/widget configuration. The lookup page enforces strict field whitelisting at the scripted REST layer to prevent exposure of internal data.

The concrete scope identifier `x_casemgmt_` is used consistently throughout this repository. ServiceNow Update Set imports use a standard XML parser, so the scope id must be concrete in every record before the Update Set is exported.

## Common Conventions

- Both pages live under a single Service Portal record [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml).
- Portal URL: `[instance URL]/x_casemgmt_case_portal`. The portal slug `x_casemgmt_case_portal` is the actual `<url_suffix>` declared in [`../portal/sp_portal_x_casemgmt_case_portal.xml`](../portal/sp_portal_x_casemgmt_case_portal.xml). AAP Section 0.7.2 verbatim wording uses `[instance URL]/x_casemgmt_portal` as a generic placeholder ("or the equivalent portal URL chosen at portal-record creation time"); this document uses the actual implementation slug to keep the per-page URL examples below accurate.
- Both pages are anonymous (no login required).
- Both pages use the platform default theme, add no branding and add **no custom CSS** — every widget's `css` element is empty, per AAP Section 0.4.4. The WCAG AA contrast items raised against these pages are addressed only as far as that mandate allows, by choosing a different default-theme colour token rather than by overriding the palette; the items no token choice can reach are listed, unresolved, in [Open accessibility limitations](#open-accessibility-limitations-blocked-by-aap-044--032).
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
| Stale-message hygiene | Every input carries `ng-change="c.onInputChange()"`, which drops the previous attempt's outcome — the submission's generic banner, refusal summary and per-field server messages, and on the lookup page the result panel, the not-found alert and the service-failure alert together. It fires only on an **actual model change**: the submission widget snapshots the five values when it raises an outcome and clears that outcome only once one of them differs, because `ng-change` also fires when AngularJS trims a keystroke back to the value already in the model, and that is how a whitespace press previously removed the summary while the per-field errors stayed (Delta QA4 Issue 14). A server field message about an **unedited** field survives an edit to a different field, since it is still a true statement. Per-field CLIENT messages are deliberately not cleared here: they are bound to live `$invalid && $touched` and correct themselves | both widgets |
| Heading structure | One real `<h1>` per page — "Submit a Case" / "Case Status Lookup" — and on the submission page it is mounted **outside** the `ng-if` that swaps the form for the confirmation, so exactly one `h1` exists in every state. Both confirmation panels and the lookup result panel use `<h2>`, so no level is skipped. Note that the Service Portal page container additionally emits its own 1x1 clipped `div.sr-only[role="heading"][aria-level="1"]` from `sp_page.title`, with text identical to the widget's `h1`; that element is platform-generated — the directive template lives in `/scripts/dist/sp_min.jsx` and is the focus target of the shell's own *"Skip to page content"* link — so it cannot be removed from the widget layer, and each page exposes two level-1 headings to assistive technology. Recorded as OPEN (A-6) in [Open accessibility limitations](#open-accessibility-limitations-blocked-by-aap-044--032) | both widgets |
| Successful result announcement | The lookup result panel sits inside an **always-mounted** `<div role="status" aria-live="polite">`. The region is the mounted wrapper rather than the `ng-if`'d panel because a live region must exist in the DOM before its content changes to be announced reliably. Before this, both failure paths announced (`role="alert"`) and success announced nothing, so a screen-reader user heard the outcome only when it went wrong | lookup widget |
| In-flight state | The same paragraph is a `role="status" aria-live="polite"` region that announces "Submitting your case, please wait..." / "Looking up your case, please wait...", and the form sets `aria-busy` while the request is outstanding. The button's changing inner text is no longer the only signal | both widgets |
| Result and error announcements | `role="alert"` on the submission error panel, the lookup result's not-found panel, the lookup's service-failure panel, and the confirmation panel; the lookup result itself is a `<dl>`/`<dt>`/`<dd>` definition list | both widgets |
| Programmatic invalid state | Every control has a `name` and binds **`aria-invalid`** to `$invalid && $touched`, so assistive technology is told *which* control is wrong rather than only that the form is. The `$touched` half is deliberate: a field the user has never visited is not announced as an error on first paint | both widgets |
| Visible invalid state | The control's `.form-group` takes Bootstrap 3's **`has-error`** class under the same condition, which is what makes the failing field visually distinguishable without any custom CSS | both widgets |
| Per-field error message | Each control has its own paragraph carrying the theme's **`alert-danger`** colour token — applied *without* the `alert` class, so it contributes the colour and no box — and **`role="alert"`**, referenced by the control through `aria-describedby`. It renders while that control is invalid and touched, **and** while the endpoint has named that field in an HTTP 400 `fields` map. The exact strings are in the table below | both widgets |
| Maximum-length notice | Each length-capped field carries a **`role="status"`** notice that appears only once `maxlength` has been reached, because `maxlength` silently discards further keystrokes and a silent discard is the defect. Wording: *"&lt;Field&gt; has reached its limit of &lt;n&gt; characters. Anything typed beyond this point is discarded."* for Subject (255), Description (4000) and Your name (100) | submission widget |
| Colour contrast | Inherited from the platform default theme, with **no custom CSS anywhere** — AAP Section 0.4.4 mandates the default theme with *"No custom CSS, no custom branding"* and Section 0.3.2 places theme and branding modifications out of scope, so a colour may be **chosen** here but never **overridden**. Every ratio below was computed from the stylesheet this portal actually serves (`styles/scss/sp-bootstrap-basic.scss`, fetched anonymously from the live portal) and reproduces the figures QA measured on the rendered page. Fixed by choosing a different default-theme token: the guidance and status paragraphs carry no colour class and inherit the theme body colour `#717171` = **4.88:1** (previously `.help-block` `#b1b1b1` = 2.14:1); each per-field error message carries the `.alert-danger` colour token `#a02622` on `#fdf7f7` = **7.09:1** (previously `.text-danger` `#d9534f` = 3.96:1); the lookup's not-found notice keeps `.alert` with no colour variant so its verbatim sentence inherits the body colour = **4.88:1** (previously `.alert-warning` `#c77c11` = 3.32:1). `.alert-danger` on the summary and service-failure panels (7.09:1) and `.alert-success` on the confirmation panel (`#357935` on `#eaf6ea` = 4.79:1) already passed and are unchanged. Rejected after measurement, because it would have changed the colour without fixing the defect: `.alert-info` `#2390b0` on white = **3.69:1**. **Still failing and NOT fixed here:** the `.btn-primary` label, white on `#428bca` = **3.63:1**, and the focus indicator `#66afe9` = **2.37:1**. Both are OPEN — see [Open accessibility limitations](#open-accessibility-limitations-blocked-by-aap-044--032) | portal surface |
| Target size | Interactive controls are **34px** tall, which is **below the 44×44px standard this checkpoint applies**, and this package does **not** fix it. The height is not authored here: no widget template sets a size by inline style or by a `width`/`height`/`size` attribute (the only dimensional attribute in the three templates is `rows="4"` on the Description textarea), so the figure comes from the theme's own `.form-control { height: 34px }` and `.btn { padding: 6px 12px; font-size: 14px; line-height: 1.42857 }`. Recorded as OPEN in [Open accessibility limitations](#open-accessibility-limitations-blocked-by-aap-044--032) with the exact change that would close it | portal surface |
| Known residual | Each control's `aria-describedby` names its error paragraph unconditionally while that paragraph is `ng-if`'d, so the reference is unresolved whenever the field is valid or untouched. WAI-ARIA requires an unresolvable IDREF to be ignored, and each message also carries `role="alert"` so it is announced on appearance regardless; the alternative — mounting an empty `help-block` per field — would add Bootstrap's help-block margins to the form in its normal, valid state. Recorded as a deliberate trade-off rather than an oversight. One further residual is platform-owned and outside these widgets: the Service Portal skip link measures 3.63:1 (white on `#428bca`) once focused. The confirmation link is deliberately a plain theme link rather than a `.btn`, because the theme paints `.btn:focus` with a fully transparent outline and that would have left the link with no keyboard focus indicator of its own | both widgets |

### Open accessibility limitations (blocked by AAP §0.4.4 / §0.3.2)

Every item in this table is **OPEN**. None of them is closed, waived, or judged acceptable here: each one names the
exact change that would make it true and the exact rule that stops this package from making that change, so the
decision sits with whoever owns that rule and not with this document. Delta QA4 Issues 9 and 10 raised them.

The blocking rules, quoted:

- **AAP §0.4.4** — *"Visual treatment: ServiceNow Experience Portal default theme. No custom CSS, no custom
  branding."*
- **AAP §0.3.2** — *"Global theme, branding, or chrome modifications"* and *"Global scope changes of any kind"*
  are out of scope.

All ratios below were computed from the stylesheet the live portal serves to anonymous callers
(`GET /x_casemgmt_case_portal/styles/scss/sp-bootstrap-basic.scss?portal_id=…`, HTTP 200) and match the values QA
measured in the browser.

| # | Item | Measured now | The exact change that would close it | Why this package cannot make it | Status |
| --- | --- | --- | --- | --- | --- |
| A-1 | Primary button label — `.btn-primary`, both pages | white `#fff` on `#428bca` = **3.63:1**, against a 4.5:1 AA minimum for normal text | Repaint the resting background to the theme's **own** darker blue `#3071a9`, which it already uses for `.btn-primary:hover` and which measures **5.17:1** with the same white label (`.btn-primary:active`'s `#285e8e` gives 6.81:1). One declaration, either in each widget's `css` element or in the portal theme record | Both mechanisms are excluded: a widget `css` rule is custom CSS (§0.4.4) and a theme record edit is a theme/branding modification (§0.3.2). No other default-theme button token both passes AA and means "primary action" — measured: `.btn-info` 2.09:1, `.btn-success` 2.48:1, `.btn-danger` 3.96:1, `.btn-warning` 1.95:1; only the neutral `.btn-default` passes (12.63:1) and it is the theme's **secondary** token, so using it would demote the page's primary action | **OPEN** — needs human authorisation for a §0.4.4 exception |
| A-2 | Not-found notice colour — lookup page | **4.88:1 (passes)** since the failing `.alert-warning` variant was dropped; the notice now has **no coloured treatment at all**, only `.alert` box metrics and `role="alert"` | Repaint the warning text with a colour the theme **already ships**: its own `.alert-warning .alert-link` value `#985f0d` measures **5.28:1** on the same white alert background, so `.alert-warning { color: #985f0d }` would restore the yellow treatment and pass AA | Same exclusion as A-1: it is a colour override. The measured alternatives inside the theme do not work — `.alert-info` is 3.69:1 and also fails, and `.alert-danger`/`.alert-success` pass but assert the wrong outcome ("something failed" / "something succeeded") for what is a successful answer of "no such case" | **OPEN** — the contrast defect is fixed; the loss of the warning colour is the open half, and needs the same §0.4.4 exception |
| A-3 | Keyboard focus indicator | theme glow `#66afe9` = **2.37:1** against white | Repaint the focus ring to a colour reaching 3:1 against both the control and the page (WCAG 1.4.11) | Colour override — §0.4.4 | **OPEN** — needs the same exception |
| A-4 | Control target size — inputs, selects, buttons on both pages | **34px high** — inputs, the select, the textarea's rows and both submit buttons — against the **44×44px** standard this checkpoint applies. Width is not the limiting dimension for the `.form-control`s, which are `width: 100%`; it is for the buttons, which are sized to their label plus the theme's 12px horizontal padding | Raise the theme's control metrics — `min-height: 44px` plus matching padding on `.form-control` and `.btn` within the portal | A rule in a widget `css` element is custom CSS (§0.4.4); raising it in the theme is a theme modification (§0.3.2). Nothing in these three widget records contributes to the height: there is no inline `style`, no `width`/`height`/`size` attribute, and the theme's own `.form-control { height: 34px }` is the whole of it | **OPEN** — needs human authorisation |
| A-5 | Pinch-zoom suppressed on mobile widths | The Service Portal shell emits, **only to mobile user agents**, `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`. Measured on the same URL: a desktop user agent gets `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (zoom permitted); an iPhone user agent gets the string above (zoom blocked) | Drop `maximum-scale` and `user-scalable` from the shell's viewport meta so WCAG 1.4.4 resize-text holds on a phone | The tag is emitted by the platform portal shell, not by any record in this repository — no `sp_widget`, `sp_page` or `sp_portal` record here contains the string `user-scalable` (grep: zero matches). Changing it is a platform/global chrome modification — §0.3.2 | **OPEN** — platform-owned; needs human authorisation |
| A-6 | Two level-1 headings per page | Each widget renders exactly **one** `<h1>` (*Submit a Case* / *Case Status Lookup*). The second one is the platform's: the Service Portal client bundle `/scripts/dist/sp_min.jsx` carries the directive template `<div class='sr-only' role='heading' aria-level='1'>{{pageTitle}}</div>`, rendered from `sp_page.title` — which holds the same text — and registered as the focus target of the shell's own *"Skip to page content"* link | Give the two `sp_page` records a `title` distinct from the widget heading, **or** suppress the platform heading | The `sp_page` records are outside this group's file boundary, and `sp_page.title` is also the browser tab title and the breadcrumb label, so changing it has consequences beyond the heading. The platform element cannot be removed from a widget, and removing it would break *"Skip to page content"*, whose focus target it is. Demoting the widget's `<h1>` to `<h2>` was rejected: it would leave the page's only level-1 heading invisible to sighted users, which is the defect the previous checkpoint fixed | **OPEN** — lesser semantic issue; needs an `sp_page.title` decision |

What was *not* left open, for contrast with the above — every accessibility item in Issues 9 and 10 that could be
reached from these widget records **is** fixed: the two failing colour tokens are swapped for passing ones from the
same theme (A-2's ratio, and the per-field error messages at 7.09:1), one `<h1>` per widget with no skipped level
below it, `role`/`aria-live`/`aria-invalid`/`aria-required`/`aria-describedby`/`aria-busy` wiring on every control
and region, a primary action that stays in the tab order and answers the press, and no size set anywhere in our own
markup.

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

| Control | Message shown when the client considers it invalid and it has been touched |
| --- | --- |
| Subject | `Subject is required.` |
| Case Type | `Select a case type.` |
| Description | `Description is required.` |
| Your Name | `Your name is required.` |
| Your Email | `Enter a valid email address, or leave the field empty. Email is optional, but an address that is not valid blocks Submit.` |
| Case Number *(lookup page)* | `Enter a case number to look up.` |

When the *endpoint* names a field instead, that same paragraph renders the endpoint's own sentence for it — e.g.
`Email must be a valid address.`, `Subject is required.`, `Type must be one of: General Inquiry, Complaint.`,
`Description must be 4000 characters or fewer (received 4001).` The two are mutually exclusive per field, and the
client's wording wins when both have something to say, because it describes the current value while the server's
describes a value already sent.

A press on an invalid form additionally raises a `role="alert"` summary next to the button, because the per-field
messages sit beside fields the requester has already scrolled past:

| Widget | Summary text |
| --- | --- |
| submission | `Your case has not been submitted yet. Correct the highlighted fields above, then choose Submit again.` |
| lookup | `Enter a case number, then choose Look Up Status.` |

The submission summary carries the **same** sentence when the *endpoint* refuses the payload with an HTTP 400 that
names the offending fields, because it states the same fact — nothing was submitted and the fields to fix are
marked — and which side did the checking is not something the requester can act on.

Neither summary is a substitute for the per-field messages: those say which field and why, the summary says the
press was received and refused. Both are cleared once the requester actually changes a value (see
[One email rule, and the endpoint's field errors on the page](#one-email-rule-and-the-endpoints-field-errors-on-the-page)
for why "actually" is load-bearing), and by a successful press.

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

No CSS was added at all. `has-error`, `alert`, `alert-danger` and `alert-success` are Bootstrap 3 classes the
platform's default Service Portal theme already provides, and the roles, `aria-live` regions, `aria-invalid`
bindings and heading levels are all markup. Every widget's `css` element is empty, which is what AAP §0.4.4's
*"No custom CSS, no custom branding"* requires; §0.3.2 places theme and branding modifications out of scope as
well. Where a colour measured below AA, the remedy taken was to apply a **different token from the same theme**,
never to restyle the theme: the guidance paragraphs dropped `.help-block` grey (2.14:1) for the inherited body
colour (4.88:1), the per-field error messages dropped `.text-danger` (3.96:1) for the `.alert-danger` colour
token (7.09:1), and the lookup's not-found notice dropped `.alert-warning` (3.32:1) for `.alert` with no colour
variant (4.88:1).

Two things follow, and both are stated as they stand rather than reconciled. First, what remains failing is
**OPEN, not disclosed-and-accepted**: the `.btn-primary` label at 3.63:1, the focus indicator at 2.37:1, the
34px control height against this checkpoint's 44×44px standard, the shell's mobile `user-scalable=no` viewport,
and the platform's second level-1 heading. Each one is listed in
[Open accessibility limitations](#open-accessibility-limitations-blocked-by-aap-044--032) with the exact change
that would close it and the exact rule — AAP §0.4.4 or §0.3.2 — that stops this package from making it, so the
decision belongs to whoever owns that rule. Second, everything reachable from these widget records **is** fixed:
the two failing colour tokens swapped for passing ones, a real `<h1>` per page with no skipped level below it,
the success panel inside an always-mounted `role="status" aria-live="polite"` region, a keyboard-reachable
primary action that validates on press, stale messages cleared only on a real edit, the endpoint's own field
errors surfaced per field, and the status-page link on the confirmation panel.
[`PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`](./PDI_LIMITATIONS_AND_KNOWN_ISSUES.md) INFO-3 records the same items
against an empty `css` field, which is the shipped state.

#### One email rule, and the endpoint's field errors on the page

Delta QA4 Issue 14 measured two halves of the same defect: the client and the server disagreed about what an email
address is, and when the server won, the page threw away what the server had said.

**The rule.** The email control now carries `ng-pattern="c.emailPattern"` alongside `type="email"`, and
`c.emailPattern` is the *same* expression the server applies in
[`../script_includes/x_casemgmt_CasePortalService.xml`](../script_includes/x_casemgmt_CasePortalService.xml)
(`_validateSubmission`, `requester_email` branch):

```text
/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
```

`type="email"` alone accepts an undotted domain, so `a@b` passed every client check, the press went out, and the
endpoint refused it — measured live: `POST /api/x_casemgmt/case_submit` with `"requester_email":"a@b"` answers
**400** `{"result":{"error":"The submission could not be accepted because one or more fields are invalid.","fields":{"requester_email":"Email must be a valid address."}}}`.
With the pattern bound, `a@b` is refused before any request is issued and the email field's own message renders.
`type="email"` is deliberately kept: it is what gives a phone the `@`-bearing keyboard and what states the field's
purpose programmatically, and Angular applies both validators, so the effective client rule is their intersection.
That intersection is stricter than the server only for addresses Angular's own validator already rejected before
this change, so nothing that used to be submittable stopped being submittable.

**The field errors.** An HTTP 400 that names the offending inputs is now rendered per field, in the same
`role="alert"` paragraph the client's own message uses, plus the refusal summary next to the button. What may be
rendered is deliberately narrow — the acceptance rule is `c.acceptFieldErrors()` in the widget's client script:

| Condition | Why it is there |
| --- | --- |
| HTTP status is **exactly 400** | 400 is the only status the submit operation returns for a refused **payload**. 429 is the flood guard, 401/403 authorization, 404/405 routing, 415 the content type, 5xx the platform, 0 the network |
| body carries a **`fields` object** — not an array, not a string | an array would let a responder push positional text; a string, one unfiltered sentence |
| only the keys **`subject`, `type`, `description`, `requester_name`, `requester_email`** | any other key, including every internal field name, is dropped silently |
| values must be **non-empty strings**, capped at **300 characters** | the endpoint's own messages are far shorter; the cap bounds a response that did not come from it |
| nothing survives → **generic message** | a 400 naming only internal keys is indistinguishable, at the UX, from a 500 |

Echoing exactly those five strings leaks nothing: they are the endpoint's own authored, caller-facing contract about
inputs the public form already publishes — the field names are in the widget source and the limits are HTML
attributes on the controls — and the Script Include can put no other key in the map. Values are rendered through
AngularJS interpolation (`{{ }}`), which escapes HTML, never through `ng-bind-html`. Every other outcome —
401, 403, 404, 405, 415, 429, any 5xx, a network failure, status 0, a 400 with no usable map, and a 2xx with no case
number — still paints only `Submission failed. Please try again.` with no server text, which is the
information-leakage hardening this widget has always carried.

**The summary no longer disappears on its own.** QA also observed the summary vanishing while the per-field errors
stayed, on a whitespace-only form. `ng-change` does not mean "the value changed": AngularJS trims text into the
model before `$setViewValue`, so a space typed into an empty control commits an unchanged `''`, and for a control
with native validators (`type="email"` has them) the view-change listeners fire anyway. `c.onInputChange()` now
compares the five model values against a snapshot taken when the outcome was raised, and clears the outcome only
when one of them has actually moved — so the summary is present whenever a press has been refused, and a
server field message about an **unedited** field survives an edit to a different field, because it is still true.

Verified by driving the widget's extracted controller against the live response bodies (90 assertions, all passing):
the live 400 surfaces its field message; the live 415 and 405 bodies, 401/403/404/429/5xx and status 0 all produce
the generic message with no field messages and no summary; a 400 whose map names `status`/`assigned_agent`/`sys_id`
yields nothing; a 5,000-character value is capped at 300; a no-op `ng-change` leaves the summary in place and a real
edit clears it.

### Input Fields

| Field | HTML Type | Maps To | Mandatory | Validation |
| --- | --- | --- | --- | --- |
| Subject | text input | `x_casemgmt_case.subject` | Yes | non-empty, max 255 chars |
| Case Type | dropdown | `x_casemgmt_case.type` | Yes | one of `General Inquiry`, `Complaint` |
| Description | textarea | `x_casemgmt_case.description` | Yes | non-empty, max 4000 chars |
| Your Name | text input | `x_casemgmt_case.requester_name` | Yes | non-empty, max 100 chars |
| Your Email | email input | `x_casemgmt_case.requester_email` | No | optional; if provided, must match the server's own address rule `/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/` (bound as `ng-pattern`, so `a@b` is refused on the page and not only by the endpoint) and max 100 chars |

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
> | a second identical submission inside 90 s | **201** with the **first** case's number, and the duplicate row is deleted. *This row is the only one in this table not yet confirmed by an anonymous `curl` against the live PDI — confirming it requires writing two cases to a shared instance. It is verified against an in-memory `GlideRecord` stub instead; see* [Identical submissions inside 90 seconds collapse onto one case](#identical-submissions-inside-90-seconds-collapse-onto-one-case) |
> | wrong `Content-Type` | **415** |
> | `GET` / `PUT` / `DELETE` on the submit path | **405** |
> | a valid submission | **201** `{"number":"CASE…","message":"Your case has been submitted"}`, row `status=Draft` |

- Server-side error → 500 Internal Server Error with generic "Submission failed; please try again." (do NOT expose internal stack traces).

#### Identical submissions inside 90 seconds collapse onto one case

Delta QA4 Issue 16 released two barrier-synchronised anonymous POSTs carrying the same valid body; both were
accepted and both persisted — `CASE0000226` and `CASE0000227`. The flood guard cannot help (ten submissions a
minute is what it permits) and the widget's in-flight button lock covers only the single page, not the public API.

`submitCase()` now reconciles after the insert:

1. insert, re-query, and run the round-trip check as before;
2. query `x_casemgmt_case` for rows that share **all five** whitelisted values, are still `status=Draft`, were
   created by the **same** caller as our row, and fall inside a **90-second** window;
3. order that candidate set by `sys_created_on`, then by `sys_id`;
4. if the first row is not the row we just inserted, **delete ours** and return the first row's number instead.

| Property | Behaviour |
| --- | --- |
| Window | **90 seconds**, chosen to sit just above the endpoint's own 60-second flood window — so the two mechanisms describe overlapping periods — and well below the time it takes to retype a case by hand. The submission POST deliberately has no client timeout, so a retry follows a stalled request by whatever the requester's patience is |
| Fingerprint | `subject`, `type`, `description`, `requester_name`, `requester_email` — exactly the five whitelisted values, plus `status=Draft` and the same `sys_created_by`. A case an agent has already advanced out of Draft is never handed back to an anonymous caller, and an internal user's identically-worded case is never returned to the public endpoint. `description` is compared in script rather than in the query, because a 4,000-character column is TEXT-backed and an equality predicate on it is neither reliably indexed nor portable |
| Why after the insert | A pre-insert check reads a window in which a simultaneous sibling has written nothing, so both callers see nothing and both insert — it settles retries only. Publishing our candidate first is what lets two simultaneous callers converge, and the total order (`sys_created_on`, then `sys_id`, which breaks the one-second-resolution tie) makes the winner **the same row for every caller** |
| Response shape | Unchanged — **201** `{"number":"CASE…","message":"Your case has been submitted"}` either way. A collapsed duplicate is not a distinguishable outcome, deliberately: the number returned identifies a real case carrying exactly the submitted values, and adding a second success shape would widen a response surface AAP §0.7.4 fixes at two keys |
| **Limit 1 — not prevention** | Two callers whose inserts are both still invisible to each other's query each declare themselves the winner and **two cases survive**. This is a property of reconciling after the fact; closing it needs a uniqueness constraint or a mutex, and adding a table, field or endpoint to carry one is refused by AAP §0.7.2's Minimal-Change Clause. The contract is *duplicates are collapsed, not prevented* |
| **Limit 2 — number gaps** | The platform allocates a case number during the insert, so a collapsed duplicate leaves a **gap** in the `CASE` sequence. Already true of the round-trip refusal and of every form load, so gaps carry no meaning here, but a reader comparing counts should expect them |
| Fail-safe | The check declines and keeps our row — logging `gs.warn` or `gs.error` rather than passing over it — when our row carries no `sys_created_by`, when our row is somehow no longer in `Draft` immediately after the insert (so a survivor "identical to what we submitted" can never displace a row holding something else), when the surviving row has no case number to quote, or when the delete of our own row fails |

Verified by driving the extracted method against an in-memory `GlideRecord` stub (47 assertions, all passing):
a sequential retry is answered with the first case's number and its own row is deleted; a simultaneous pair with an
identical `sys_created_on` converges on the same survivor **in both evaluation orders** with exactly one row left;
a change to any one of the five values, a survivor already advanced out of `Draft`, a survivor created by another
user, and a survivor older than the window are all left alone; two submissions with an empty optional email still
collapse; and both fail-safe branches keep our row and log.

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
| HTTP 404, or HTTP 400 (bad request) | `c.notFound = true`, `c.errorMessage = ''` | `alert`, `role="alert"`, containing the verbatim `No case found with that number.` — unchanged, still character-for-character, still the only place that string appears. The `alert-warning` colour variant was dropped under Delta QA4 Issue 9: it painted this sentence at 3.32:1, and no coloured variant in the theme both passes AA and means "no match" (see A-2 in [Open accessibility limitations](#open-accessibility-limitations-blocked-by-aap-044--032)) |
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

