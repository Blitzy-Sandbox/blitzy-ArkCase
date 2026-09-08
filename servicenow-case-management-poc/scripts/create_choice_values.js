/*
 * x_casemgmt_case_management - Choice Value Creation Script
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SCRIPT DOES
 * ---------------------------------------------------------------------------
 * Idempotently reconciles the twenty-four `sys_choice` value rows that the
 * three scoped tables' seven Choice fields require, and nothing else. It is a
 * CHOICE-ONLY mechanism: `sys_choice` is the only table it writes, and every
 * row it writes is one of the twenty-four the specification below names.
 *
 *   x_casemgmt_case.type            2 values
 *   x_casemgmt_case.status          6 values
 *   x_casemgmt_case.priority        4 values
 *   x_casemgmt_case.pending_reason  3 values
 *   x_casemgmt_case_task.type       4 values
 *   x_casemgmt_case_task.status     3 values
 *   x_casemgmt_case_party.party_type 2 values
 *                                  -- 24 values across 7 lists
 *
 * Reconciliation, not blind creation. For each of the twenty-four the script
 * queries `sys_choice` by the natural key `(name = table, element = field,
 * value = value)` and then:
 *
 *   - inserts the row when it is absent;
 *   - repairs it IN PLACE when it exists but its `label`, `sequence`,
 *     `language` or `inactive` flag disagrees with the specification;
 *   - leaves it untouched when it already agrees;
 *   - never inserts a second row for a key that already has one.
 *
 * A re-run therefore leaves exactly twenty-four rows and writes nothing. The
 * verification pass afterwards fails on a SURPLUS as loudly as on a shortfall:
 * a stray extra value, a duplicated key, or a value on an element outside the
 * seven lists is an over-broad choice list a user can select from, so it is
 * reported rather than tolerated. The script reports surplus; it never deletes,
 * because deleting a row somebody else authored is not this script's mandate.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS SCRIPT EXISTS
 * ---------------------------------------------------------------------------
 * An Update Set commit does not reliably materialize these rows. Measured on
 * this project's own PDI and recorded in ../docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md
 * (Defect C, the "choice half"): a package that carried seven DIRECT
 * `sys_choice` children committed cleanly and yet left `sys_choice` for the
 * three scoped tables at ZERO rows, because the commit engine applies payloads
 * with the target record's business rules suppressed and the choice rows are
 * produced by those rules. The consequence on the form is a Choice field whose
 * dropdown renders empty, so no case, task or party can be given a status, a
 * type, a priority, a pending reason or a party type.
 *
 * The same document records the packaging fix that closed the defect (the seven
 * platform-native, app-scoped `sys_choice_set` composites in place of the seven
 * direct children, measured taking `sys_choice` from 0 to 24 rows). This script
 * is the independent, mechanism-agnostic guarantee that stands beside it: run
 * after any import, it proves the twenty-four rows are present and correct, and
 * creates or repairs exactly the ones that are not. On an instance where the
 * package already delivered them it writes nothing and reports twenty-four
 * already-correct rows, which is itself the evidence that the dropdowns will
 * render.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE VALUES COME FROM
 * ---------------------------------------------------------------------------
 * The twenty-four value/label/sequence triples in CHOICE_SPECS below are taken
 * verbatim from the CHOICE_SPECS block of ../scripts/post_import_remediation.js,
 * which is this project's authoritative list and is itself derived from
 * ../choices/sys_choice_*.xml and ../docs/data-model.md. The attribute contract
 * (label, sequence, language `en`, inactive false) is the same one that file's
 * CHOICE_ATTRIBUTES declares, so the two agree row for row and attribute for
 * attribute. This script deliberately carries ONLY the choice half of that
 * file's work: its table, dictionary, access, number-counter, scripted-REST and
 * ACL-role-link branches are out of this script's scope by design.
 *
 * ---------------------------------------------------------------------------
 * HOW TO RUN IT
 * ---------------------------------------------------------------------------
 * Run it in the `x_casemgmt` application scope. That is the scope in which the
 * application owns the verification, and it is the scope this script reports
 * and asserts.
 *
 *   1. In the browser: System Definition -> Scripts - Background, with the
 *      application picker set to "x_casemgmt Case Management", paste this file
 *      and Run. The response must read "Script completed in scope x_casemgmt".
 *
 *   2. Headless, over an authenticated UI session:
 *
 *        curl -c jar -b jar \
 *          --data-urlencode "script@scripts/create_choice_values.js" \
 *          --data-urlencode "sysparm_ck=<fresh 72-char token>" \
 *          --data-urlencode "sys_scope=<sys_id of sys_scope where scope=x_casemgmt>" \
 *          --data-urlencode "runscript=Run script" \
 *          "<instance>/sys.scripts.do"
 *
 *      Resolve `sys_scope` at run time (GET /api/now/table/sys_scope?sysparm_query=scope=x_casemgmt);
 *      never carry a literal sys_id from a prior run or report.
 *
 * ONE PLATFORM CONSTRAINT DECIDES WHICH SCOPE CAN WRITE, AND IT IS MEASURED,
 * NOT ASSUMED. `sys_choice` is a GLOBAL table, and on this platform its
 * `sys_db_object` row carries `create_access = false`, `update_access = false`
 * and `delete_access = false`. A scoped application may therefore only READ it:
 * an insert or a repair attempted from the `x_casemgmt` scope is refused by the
 * platform, silently returning no sys_id. Lifting that would take either an
 * edit to the global `sys_db_object` row or a `sys_scope_privilege` artifact in
 * the application - a global-scope change and an application-manifest change
 * respectively, both of which this project forbids.
 *
 * So: run this script IN SCOPE to verify, and - only when it reports a row
 * missing or drifted and the write refused - re-run it in the GLOBAL scope
 * (`sys_scope=` empty, or the application picker set to Global) to perform the
 * write, then in scope again to confirm. The script detects the refusal,
 * names this cause, and prints that remedy itself rather than failing quietly.
 *
 * THE ROWS REMAIN EXPORTABLE EITHER WAY, and this was verified on the instance
 * rather than reasoned about. What an Update Set carries is not the individual
 * `sys_choice` row - that table has no `sys_scope` column at all on this
 * release - but the platform-native `sys_choice_set` composite for each
 * (table, field), and all seven of those ARE owned by this application
 * (`sys_scope` = `sys_package` = x_casemgmt Case Management, update names
 * `sys_choice_x_casemgmt_*`). Measured: a `sys_choice` write performed from a
 * global session was still captured as `sys_update_xml` name
 * `sys_choice_x_casemgmt_case_pending_reason`, type "Choice list", into the
 * x_casemgmt application's own Default update set. reportChoiceSets() below
 * prints that ownership on every run so the claim stays checkable.
 *
 * ---------------------------------------------------------------------------
 * OUTPUT CONTRACT (quotable as evidence)
 * ---------------------------------------------------------------------------
 * Every line is emitted through gs.info() with the prefix `U2CHOICE|`, so the
 * run is readable both in the Background Script response and afterwards from
 * `syslog` (messageSTARTSWITHU2CHOICE). The lines are:
 *
 *   U2CHOICE|SCOPE|...                       the scope this run executed in
 *   U2CHOICE|<table>.<element>=<value>|...   one per row created or repaired
 *   U2CHOICE|VERIFY|<table>.<element> expected=N found=N ok|MISMATCH
 *                                            one per field, seven in all
 *   U2CHOICE|VERIFY|TOTAL expected=24 found=N lists=7 ...
 *   U2CHOICE|SURPLUS|...                     one per unexpected or duplicate row
 *   U2CHOICE|SUMMARY|verdict=OK|FAILED ...   the single-line verdict
 *
 * ---------------------------------------------------------------------------
 * CONSTRAINTS HONORED
 * ---------------------------------------------------------------------------
 *   - No hard-coded sys_id anywhere. Choice rows are addressed only by
 *     (name, element, value); the application scope is resolved at run time
 *     from `sys_scope` by its `scope` name.
 *   - No PII. Every value and label is a synthetic classification term.
 *   - No email or SMTP interaction: no gs.eventQueue(), no event.queue(), no
 *     notification of any kind. Email is disabled on the PDI and stays that way.
 *   - `sys_choice` is the ONLY table written. `sys_scope`, `sys_dictionary` and
 *     `sys_choice_set` are read for verification and reporting only.
 *   - No table, dictionary, ACL, role, number-counter or data-model change of
 *     any kind.
 */

// ============================================================================
// Specification
// ============================================================================

var LOG_PREFIX = 'U2CHOICE|';

// The application whose scope this script must run in. Resolved to a sys_id at
// run time by this name; never hard-coded.
var SCOPE_NAME = 'x_casemgmt';

var TABLE_CASE = 'x_casemgmt_case';
var TABLE_CASE_TASK = 'x_casemgmt_case_task';
var TABLE_CASE_PARTY = 'x_casemgmt_case_party';

// Every choice row is authored in English and active. Both are compared and
// repaired, because a row with the wrong language is invisible to a user in
// that language and an inactive row cannot be selected - either way the
// dropdown is wrong while the row count looks right.
var CHOICE_LANGUAGE = 'en';
var CHOICE_INACTIVE = false;

/*
 * The seven choice lists and their twenty-four values, verbatim from
 * ../scripts/post_import_remediation.js CHOICE_SPECS. `value` is the stored
 * value, `label` the text the form renders, `sequence` the display order.
 */
var CHOICE_SPECS = [
    { table: TABLE_CASE, element: 'type', value: 'General Inquiry', label: 'General Inquiry', sequence: '100' },
    { table: TABLE_CASE, element: 'type', value: 'Complaint', label: 'Complaint', sequence: '200' },

    { table: TABLE_CASE, element: 'status', value: 'Draft', label: 'Draft', sequence: '100' },
    { table: TABLE_CASE, element: 'status', value: 'Open', label: 'Open', sequence: '200' },
    { table: TABLE_CASE, element: 'status', value: 'In Progress', label: 'In Progress', sequence: '300' },
    { table: TABLE_CASE, element: 'status', value: 'Pending', label: 'Pending', sequence: '400' },
    { table: TABLE_CASE, element: 'status', value: 'Resolved', label: 'Resolved', sequence: '500' },
    { table: TABLE_CASE, element: 'status', value: 'Closed', label: 'Closed', sequence: '600' },

    { table: TABLE_CASE, element: 'priority', value: 'Low', label: 'Low', sequence: '100' },
    { table: TABLE_CASE, element: 'priority', value: 'Medium', label: 'Medium', sequence: '200' },
    { table: TABLE_CASE, element: 'priority', value: 'High', label: 'High', sequence: '300' },
    { table: TABLE_CASE, element: 'priority', value: 'Critical', label: 'Critical', sequence: '400' },

    { table: TABLE_CASE, element: 'pending_reason', value: 'Awaiting Info', label: 'Awaiting Info', sequence: '100' },
    { table: TABLE_CASE, element: 'pending_reason', value: 'Awaiting Third Party', label: 'Awaiting Third Party', sequence: '200' },
    { table: TABLE_CASE, element: 'pending_reason', value: 'Other', label: 'Other', sequence: '300' },

    { table: TABLE_CASE_TASK, element: 'type', value: 'Investigation', label: 'Investigation', sequence: '100' },
    { table: TABLE_CASE_TASK, element: 'type', value: 'Review', label: 'Review', sequence: '200' },
    { table: TABLE_CASE_TASK, element: 'type', value: 'Follow-up', label: 'Follow-up', sequence: '300' },
    { table: TABLE_CASE_TASK, element: 'type', value: 'Other', label: 'Other', sequence: '400' },

    { table: TABLE_CASE_TASK, element: 'status', value: 'Open', label: 'Open', sequence: '100' },
    { table: TABLE_CASE_TASK, element: 'status', value: 'In Progress', label: 'In Progress', sequence: '200' },
    { table: TABLE_CASE_TASK, element: 'status', value: 'Closed', label: 'Closed', sequence: '300' },

    { table: TABLE_CASE_PARTY, element: 'party_type', value: 'Person', label: 'Person', sequence: '100' },
    { table: TABLE_CASE_PARTY, element: 'party_type', value: 'Organization', label: 'Organization', sequence: '200' }
];

// The inventory CHOICE_SPECS must describe, asserted as an invariant so a
// future edit that adds or drops a value without updating the counts is caught
// by the script itself rather than by a reader.
var EXPECTED_CHOICE_LISTS = 7;
var EXPECTED_CHOICE_VALUES = 24;

// The three tables whose choice rows this script owns. Used by the surplus
// audit, which has to look at every row on these tables - including rows on
// elements the specification does not name.
var OWNED_TABLES = [TABLE_CASE, TABLE_CASE_TASK, TABLE_CASE_PARTY];

var STATS = {
    created: 0,
    repaired: 0,
    already: 0,
    insertRefused: 0,
    updateRefused: 0,
    duplicateKeys: 0,
    surplusRows: 0
};

var PROBLEMS = [];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Emit one output line. Every line carries LOG_PREFIX so the whole run is
 * retrievable from `syslog` after the fact, not only from the response body.
 *
 * @param {string} line the message, without the prefix
 */
function log(line) {
    gs.info(LOG_PREFIX + line);
}

/**
 * Record a problem AND emit it. Problems are what turn the final verdict to
 * FAILED; nothing is counted as a problem without being said out loud.
 *
 * @param {string} line the message, without the prefix
 */
function logProblem(line) {
    PROBLEMS.push(line);
    gs.info(LOG_PREFIX + line);
}

/**
 * Glide booleans arrive as 'true'/'false'/'1'/'0'/''; normalize them.
 *
 * @param {*} value the stored value
 * @return {boolean} true when the value means true
 */
function isTrue(value) {
    var text = '' + (value === null || value === undefined ? '' : value);
    return text === 'true' || text === '1';
}

/**
 * Normalize a sequence for comparison. `sequence` is numeric on the platform
 * but arrives as text, and an absent value must not compare equal to 100.
 *
 * @param {*} value the stored or specified sequence
 * @return {string} a canonical decimal string, or '' when unusable
 */
function normalizeSequence(value) {
    var text = ('' + (value === null || value === undefined ? '' : value)).replace(/^\s+|\s+$/g, '');
    if (text === '') {
        return '';
    }
    var n = parseInt(text, 10);
    return isNaN(n) ? '' : ('' + n);
}

/**
 * The natural key of a choice row, used for indexing and for reporting.
 *
 * @param {string} table sys_choice.name
 * @param {string} element sys_choice.element
 * @param {string} value sys_choice.value
 * @return {string} the key
 */
function choiceKey(table, element, value) {
    return table + '.' + element + '=' + value;
}

/**
 * Resolve the application scope by name.
 *
 * The sys_id is looked up rather than written down: this script must be
 * portable to any instance where the application is installed, and the AAP
 * forbids a hard-coded sys_id anywhere.
 *
 * @return {Object} { sysId, count } - sysId is '' when the scope is absent or
 *                  ambiguous, count is how many sys_scope rows matched
 */
function resolveScope() {
    var found = '';
    var count = 0;
    var gr = new GlideRecord('sys_scope');
    gr.addQuery('scope', SCOPE_NAME);
    gr.query();
    while (gr.next()) {
        count++;
        if (count === 1) {
            found = '' + gr.getUniqueValue();
        }
    }
    if (count !== 1 || !/^[0-9a-f]{32}$/.test(found)) {
        return { sysId: '', count: count };
    }
    return { sysId: found, count: count };
}

/**
 * Read the cross-scope access posture the platform enforces on sys_choice.
 *
 * This is the fact that decides whether the scope this run is executing in can
 * write at all. It is read from the target table's own `sys_db_object` row
 * rather than inferred from a failure, so the diagnosis is available BEFORE the
 * first write is attempted. GlideRecord's canCreate()/canWrite() are not usable
 * for this: measured on this instance, both answer true in a scoped run whose
 * insert is then refused, because they evaluate ACLs and not scope privileges.
 *
 * @return {Object} { create, update, remove, read, known } - `known` is false
 *                  when the sys_db_object row could not be read
 */
function choiceTableAccess() {
    var gr = new GlideRecord('sys_db_object');
    gr.addQuery('name', 'sys_choice');
    gr.query();
    if (!gr.next()) {
        return { create: null, update: null, remove: null, read: null, known: false };
    }
    return {
        create: isTrue(gr.getValue('create_access')),
        update: isTrue(gr.getValue('update_access')),
        remove: isTrue(gr.getValue('delete_access')),
        read: isTrue(gr.getValue('read_access')),
        known: true
    };
}

/**
 * Report the scope this run is actually executing in, and what that scope is
 * permitted to do to sys_choice.
 *
 * The execution scope is read from gs.getCurrentScopeName(), NOT from
 * gs.getCurrentApplicationId(): measured on this instance, the latter reports
 * the session's application picker and answers with the application's sys_id
 * even in a run the platform completed in the global scope, which would make a
 * global run misreport itself as in-scope.
 *
 * @param {string} scopeSysId the application scope resolved by name
 * @param {Object} access the output of choiceTableAccess()
 * @return {boolean} true when this run is executing in the application's scope
 */
function reportExecutionScope(scopeSysId, access) {
    var scopeName = '' + gs.getCurrentScopeName();
    var inScope = (scopeName === SCOPE_NAME);
    log('SCOPE|application=' + SCOPE_NAME + '|application_sys_id=' + (scopeSysId || 'UNRESOLVED') +
        '|executing_scope=' + scopeName + '|in_application_scope=' + inScope +
        '|sys_choice_cross_scope_access=' + (access.known
            ? ('create=' + access.create + ',update=' + access.update + ',delete=' + access.remove +
               ',read=' + access.read)
            : 'unreadable'));
    if (!inScope) {
        log('SCOPE|this run is executing in ' + scopeName + ' rather than ' + SCOPE_NAME +
            '. Row writes are still captured against the application, because the record an Update Set' +
            ' carries is the app-owned sys_choice_set composite (see CHOICE_SETS below), but the' +
            ' verification is not attributed to the application. Prefer an in-scope run for verification.');
    }
    if (inScope && access.known && !access.create) {
        log('SCOPE|sys_choice is a global table with create_access=false, so an INSERT from the ' +
            SCOPE_NAME + ' scope will be refused by the platform. This run can verify and report, but a' +
            ' missing row has to be written by a GLOBAL-scope run of this same script.');
    }
    return inScope;
}

// ============================================================================
// Reconciliation
// ============================================================================

/**
 * Explain a refused write, so the operator gets a cause and a remedy instead of
 * only the fact that nothing happened.
 *
 * A GlideRecord insert/update that the platform refuses on scope grounds simply
 * returns no sys_id - no exception, no message. Left at that, a run reports a
 * shortfall it cannot account for.
 *
 * @param {string} operation 'create' or 'update'
 * @param {Object} access the output of choiceTableAccess()
 * @return {string} the diagnosis and the remedy
 */
function refusalDiagnosis(operation, access) {
    var scopeName = '' + gs.getCurrentScopeName();
    if (access && access.known && ((operation === 'create' && !access.create) ||
            (operation === 'update' && !access.update))) {
        return 'cause=sys_choice is a global table whose sys_db_object row carries ' + operation +
            '_access=false, so the platform refuses this ' + operation + ' from the ' + scopeName +
            ' scope|remedy=re-run this same script in the GLOBAL scope (sys_scope empty, or the' +
            ' application picker set to Global) to perform the write, then re-run it in ' + SCOPE_NAME +
            ' to verify. The values stay exportable either way: the record an Update Set carries is the' +
            ' app-owned sys_choice_set composite, not the row. Do NOT edit the global sys_db_object row' +
            ' and do NOT add a sys_scope_privilege artifact to work around this.';
    }
    return 'cause=not the documented cross-scope restriction (sys_choice ' + operation + '_access=' +
        (access && access.known ? ('' + (operation === 'create' ? access.create : access.update)) : 'unreadable') +
        ' in the ' + scopeName + ' scope); investigate an ACL, a data policy or a business rule on' +
        ' sys_choice before re-running';
}

/**
 * Compare one live choice row against its specification.
 *
 * The comparison covers every attribute this script owns. Existence alone is
 * not correctness: a row whose label was edited, whose sequence drifted, whose
 * language is wrong or which was deactivated is exactly the state that makes a
 * dropdown render in the wrong order, with the wrong text, or without the value
 * at all - while the row count still looks right.
 *
 * @param {GlideRecord} gr a positioned sys_choice record
 * @param {Object} spec one entry of CHOICE_SPECS
 * @return {Array} list of { column, stored, wanted } for each mismatch
 */
function choiceMismatches(gr, spec) {
    var out = [];

    var storedLabel = '' + (gr.getValue('label') === null ? '' : gr.getValue('label'));
    if (storedLabel !== spec.label) {
        out.push({ column: 'label', stored: storedLabel, wanted: spec.label });
    }

    var storedSequence = normalizeSequence(gr.getValue('sequence'));
    var wantedSequence = normalizeSequence(spec.sequence);
    if (storedSequence !== wantedSequence) {
        out.push({ column: 'sequence', stored: storedSequence, wanted: wantedSequence });
    }

    var storedLanguage = '' + (gr.getValue('language') === null ? '' : gr.getValue('language'));
    if (storedLanguage !== CHOICE_LANGUAGE) {
        out.push({ column: 'language', stored: storedLanguage, wanted: CHOICE_LANGUAGE });
    }

    if (isTrue(gr.getValue('inactive')) !== CHOICE_INACTIVE) {
        out.push({
            column: 'inactive',
            stored: isTrue(gr.getValue('inactive')) ? 'true' : 'false',
            wanted: CHOICE_INACTIVE ? 'true' : 'false'
        });
    }

    return out;
}

/**
 * Ensure one choice row exists and matches its specification.
 *
 * Idempotency: the row is addressed by its natural key (name, element, value),
 * so a re-run finds the row it created last time and writes nothing. A second
 * row for the same key is never inserted; if the instance already holds more
 * than one, that is reported as a duplicate rather than compounded.
 *
 * @param {Object} spec one entry of CHOICE_SPECS
 * @param {string} scopeSysId the application scope resolved by name, used only
 *                 where the platform actually defines a scope column on
 *                 sys_choice (it does not on every release)
 * @param {Object} access the output of choiceTableAccess(), used to explain a
 *                 refusal instead of merely reporting one
 */
function reconcileChoice(spec, scopeSysId, access) {
    var key = choiceKey(spec.table, spec.element, spec.value);

    var existing = new GlideRecord('sys_choice');
    existing.addQuery('name', spec.table);
    existing.addQuery('element', spec.element);
    existing.addQuery('value', spec.value);
    existing.query();

    var rowCount = existing.getRowCount();
    if (rowCount > 1) {
        STATS.duplicateKeys++;
        logProblem('DUPLICATE|' + key + '|' + rowCount + ' rows share this key; a choice list must hold each' +
            ' value once. Reported, not deleted - removing a row this script did not author is outside' +
            ' its mandate.');
    }

    if (existing.next()) {
        var drift = choiceMismatches(existing, spec);
        if (drift.length === 0) {
            STATS.already++;
            return;
        }
        var repaired = [];
        for (var d = 0; d < drift.length; d++) {
            existing.setValue(drift[d].column, drift[d].wanted);
            repaired.push(drift[d].column + ':' + drift[d].stored + '->' + drift[d].wanted);
        }
        if (!existing.update()) {
            STATS.updateRefused++;
            logProblem(key + '|repair update REFUSED for ' + repaired.join(',') + '|' + refusalDiagnosis('update', access));
            return;
        }
        STATS.repaired++;
        log(key + '|repaired|' + repaired.join('|'));
        return;
    }

    var gr = new GlideRecord('sys_choice');
    gr.initialize();
    gr.setValue('name', spec.table);
    gr.setValue('element', spec.element);
    gr.setValue('value', spec.value);
    gr.setValue('label', spec.label);
    gr.setValue('sequence', spec.sequence);
    gr.setValue('language', CHOICE_LANGUAGE);
    gr.setValue('inactive', CHOICE_INACTIVE);
    // Only where the release defines them. On a release where sys_choice carries
    // no scope columns the application attribution comes from the executing
    // scope instead, which reportExecutionScope() has already asserted.
    if (gr.isValidField('sys_scope') && scopeSysId) {
        gr.setValue('sys_scope', scopeSysId);
    }
    if (gr.isValidField('sys_package') && scopeSysId) {
        gr.setValue('sys_package', scopeSysId);
    }
    var id = gr.insert();

    if (!id) {
        STATS.insertRefused++;
        logProblem(key + '|insert REFUSED|' + refusalDiagnosis('create', access));
        return;
    }
    STATS.created++;
    log(key + '|created|sys_id=' + id + '|label=' + spec.label + '|sequence=' + spec.sequence);
}

// ============================================================================
// Verification
// ============================================================================

/**
 * Index the specification by field and by natural key, so verification can ask
 * both "how many values does this field want" and "is this live row wanted".
 *
 * @return {Object} { byField: { 'table.element': {value: spec} }, byKey: {key: spec}, fields: [ 'table.element' ] }
 */
function buildSpecIndex() {
    var byField = {};
    var byKey = {};
    var fields = [];
    for (var i = 0; i < CHOICE_SPECS.length; i++) {
        var spec = CHOICE_SPECS[i];
        var fieldKey = spec.table + '.' + spec.element;
        if (!byField[fieldKey]) {
            byField[fieldKey] = {};
            fields.push(fieldKey);
        }
        byField[fieldKey][spec.value] = spec;
        byKey[choiceKey(spec.table, spec.element, spec.value)] = spec;
    }
    return { byField: byField, byKey: byKey, fields: fields };
}

/**
 * Read every live sys_choice row on the three owned tables and classify it.
 *
 * This is the pass that catches a SURPLUS. A shortfall is what a naive
 * "create the values" script looks for; a surplus - a stray value, a
 * duplicated key, or a value on an element outside the seven lists - is just as
 * much a failure, because sys_choice is what a user picks from, so an extra row
 * is an option the specification never authorized.
 *
 * @param {Object} index the output of buildSpecIndex()
 * @return {Object} { perField: { 'table.element': count }, total, surplus: [ ... ], seen: { key: count } }
 */
function auditLiveRows(index) {
    var perField = {};
    var seen = {};
    var surplus = [];
    var total = 0;

    var gr = new GlideRecord('sys_choice');
    gr.addQuery('name', 'IN', OWNED_TABLES.join(','));
    gr.orderBy('name');
    gr.orderBy('element');
    gr.orderBy('sequence');
    gr.query();

    while (gr.next()) {
        total++;
        var table = '' + gr.getValue('name');
        var element = '' + gr.getValue('element');
        var value = '' + (gr.getValue('value') === null ? '' : gr.getValue('value'));
        var fieldKey = table + '.' + element;
        var key = choiceKey(table, element, value);

        perField[fieldKey] = (perField[fieldKey] || 0) + 1;
        seen[key] = (seen[key] || 0) + 1;

        if (!index.byField[fieldKey]) {
            surplus.push({ key: key, sysId: '' + gr.getUniqueValue(), reason: 'element outside the ' +
                EXPECTED_CHOICE_LISTS + ' specified choice lists' });
        } else if (!index.byKey[key]) {
            surplus.push({ key: key, sysId: '' + gr.getUniqueValue(), reason: 'value not in the specification for this field' });
        } else if (seen[key] > 1) {
            surplus.push({ key: key, sysId: '' + gr.getUniqueValue(), reason: 'duplicate of an already-counted row' });
        }
    }

    return { perField: perField, total: total, surplus: surplus, seen: seen };
}

/**
 * Emit the per-field and total verification lines, and turn any disagreement
 * into a problem.
 *
 * @param {Object} index the output of buildSpecIndex()
 * @param {Object} live the output of auditLiveRows()
 * @return {boolean} true when every field and the total agree with the specification
 */
function verifyCounts(index, live) {
    var ok = true;

    for (var f = 0; f < index.fields.length; f++) {
        var fieldKey = index.fields[f];
        var expected = 0;
        for (var v in index.byField[fieldKey]) {
            if (Object.prototype.hasOwnProperty.call(index.byField[fieldKey], v)) {
                expected++;
            }
        }
        var found = live.perField[fieldKey] || 0;
        var verdict = (found === expected) ? 'ok' : 'MISMATCH';
        if (found !== expected) {
            ok = false;
        }
        log('VERIFY|' + fieldKey + ' expected=' + expected + ' found=' + found + ' ' + verdict);
        if (found !== expected) {
            logProblem('VERIFY|' + fieldKey + '|expected ' + expected + ' values, found ' + found +
                (found < expected ? ' (shortfall)' : ' (surplus)'));
        }
    }

    var listsFound = 0;
    for (var seenField in live.perField) {
        if (Object.prototype.hasOwnProperty.call(live.perField, seenField)) {
            listsFound++;
        }
    }

    log('VERIFY|TOTAL expected=' + EXPECTED_CHOICE_VALUES + ' found=' + live.total +
        ' lists_expected=' + EXPECTED_CHOICE_LISTS + ' lists_found=' + listsFound +
        ' ' + ((live.total === EXPECTED_CHOICE_VALUES && listsFound === EXPECTED_CHOICE_LISTS) ? 'ok' : 'MISMATCH'));

    if (live.total !== EXPECTED_CHOICE_VALUES) {
        ok = false;
        logProblem('VERIFY|TOTAL|expected exactly ' + EXPECTED_CHOICE_VALUES + ' rows across the ' +
            EXPECTED_CHOICE_LISTS + ' lists, found ' + live.total);
    }
    if (listsFound !== EXPECTED_CHOICE_LISTS) {
        ok = false;
        logProblem('VERIFY|LISTS|expected exactly ' + EXPECTED_CHOICE_LISTS + ' choice lists on the three tables,' +
            ' found ' + listsFound);
    }

    for (var s = 0; s < live.surplus.length; s++) {
        ok = false;
        STATS.surplusRows++;
        logProblem('SURPLUS|' + live.surplus[s].key + '|sys_id=' + live.surplus[s].sysId + '|' +
            live.surplus[s].reason + '. Reported, not deleted.');
    }

    return ok;
}

/**
 * Report the platform-native choice-list composites that make these rows
 * exportable. Read-only: this script writes no sys_choice_set row.
 *
 * The composite is the record an Update Set actually carries - one
 * `sys_choice_set` per (table, field) owning that field's value rows - so its
 * absence is why a package can commit and still leave the dropdown empty. It is
 * reported here for the export inventory that follows this run, not repaired.
 */
function reportChoiceSets() {
    var count = 0;
    var names = [];
    var gr = new GlideRecord('sys_choice_set');
    gr.addQuery('name', 'IN', OWNED_TABLES.join(','));
    gr.orderBy('name');
    gr.orderBy('element');
    gr.query();
    while (gr.next()) {
        count++;
        names.push(gr.getValue('name') + '.' + gr.getValue('element'));
    }
    log('CHOICE_SETS|expected=' + EXPECTED_CHOICE_LISTS + '|found=' + count + '|' + names.join(',') +
        '|read_only_report');
}

// ============================================================================
// Entry point
// ============================================================================

/**
 * Reconcile the twenty-four choice values and verify the result.
 *
 * @return {string} the single-line summary, also emitted through gs.info()
 */
function createChoiceValues() {
    var started = new GlideDateTime();

    // The specification must describe what it claims to describe before any
    // row is written from it.
    var index = buildSpecIndex();
    if (CHOICE_SPECS.length !== EXPECTED_CHOICE_VALUES || index.fields.length !== EXPECTED_CHOICE_LISTS) {
        logProblem('SPEC|CHOICE_SPECS describes ' + CHOICE_SPECS.length + ' values across ' + index.fields.length +
            ' lists, but the invariant is ' + EXPECTED_CHOICE_VALUES + ' across ' + EXPECTED_CHOICE_LISTS +
            '; refusing to write from an inconsistent specification');
        var refused = 'SUMMARY|verdict=FAILED|reason=inconsistent specification|problems=' + PROBLEMS.length;
        log(refused);
        return LOG_PREFIX + refused;
    }

    var scope = resolveScope();
    if (scope.sysId === '') {
        logProblem('SCOPE|sys_scope query for scope=' + SCOPE_NAME + ' returned ' + scope.count +
            ' rows or a malformed sys_id; the application is not installed on this instance');
    }
    var access = choiceTableAccess();
    reportExecutionScope(scope.sysId, access);

    for (var i = 0; i < CHOICE_SPECS.length; i++) {
        reconcileChoice(CHOICE_SPECS[i], scope.sysId, access);
    }

    log('RECONCILE|created=' + STATS.created + '|repaired=' + STATS.repaired +
        '|already_correct=' + STATS.already + '|insert_refused=' + STATS.insertRefused +
        '|update_refused=' + STATS.updateRefused + '|duplicate_keys=' + STATS.duplicateKeys);

    var live = auditLiveRows(index);
    var countsOk = verifyCounts(index, live);
    reportChoiceSets();

    var elapsed = new GlideDateTime().getNumericValue() - started.getNumericValue();
    var verdict = (countsOk && PROBLEMS.length === 0) ? 'OK' : 'FAILED';
    var summary = 'SUMMARY|verdict=' + verdict +
        '|values=' + live.total + '/' + EXPECTED_CHOICE_VALUES +
        '|created=' + STATS.created + '|repaired=' + STATS.repaired + '|already_correct=' + STATS.already +
        '|surplus=' + STATS.surplusRows + '|duplicates=' + STATS.duplicateKeys +
        '|problems=' + PROBLEMS.length + '|ms=' + elapsed;
    log(summary);
    if (PROBLEMS.length > 0) {
        for (var p = 0; p < PROBLEMS.length; p++) {
            log('PROBLEM[' + (p + 1) + '/' + PROBLEMS.length + ']|' + PROBLEMS[p]);
        }
    }
    return LOG_PREFIX + summary;
}

// ----------------------------------------------------------------------------
// Auto-execution. Evaluating this file runs the reconciliation, so it is
// drop-in runnable in Scripts - Background, as a manually executed Fix Script,
// or over /sys.scripts.do - the three contexts the header documents. Nothing
// here schedules itself or runs on commit.
// ----------------------------------------------------------------------------

createChoiceValues();
