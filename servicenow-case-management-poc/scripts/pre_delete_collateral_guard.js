/*
 * x_casemgmt_case_management - Pre-Delete Collateral Guard
 *
 * READ-ONLY WITH RESPECT TO DATA AND METADATA. This script performs no insert,
 * no update and no delete on any business or metadata table, in any scope,
 * under any code path: it holds no write API call at all. Its whole output is a
 * verdict and an enumeration.
 *
 * IT IS NOT, HOWEVER, WRITE-FREE IN THE ABSOLUTE SENSE, and the distinction is
 * stated here rather than left to be discovered. Every line it emits goes
 * through `gs.info()` / `gs.warn()`, which the platform PERSISTS as `syslog`
 * rows - that is the retrieval path this header documents below. So a run of
 * this guard leaves N System Log records behind, where N is the line count it
 * reports as `log_records_emitted` in its summary. Those are the only rows any
 * run of it creates. Nothing it does touches the three scoped tables, their
 * dictionary rows, their data, the ACLs, the role links or any other
 * application record, and the summary reports that separately as
 * `data_and_metadata_writes=0`.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS, AND WHY IT EXISTS
 * ---------------------------------------------------------------------------
 * This is the implemented form of the corrective control specified in
 * ../docs/refine-run/PHASE1-REBUILD.md section 2.5 ("Corrective control - the
 * pre-delete collateral guard"). That specification was written after a
 * targeted deletion of the three scoped tables on a live, converged instance
 * cascaded far beyond what the authorisation covered: the platform's
 * table-delete dependency chain also removed 26 sys_security_acl records, 24
 * sys_choice rows, 7 business rules, 8 sys_report records, 3 sys_ui_list, 1
 * sys_ui_related_list, 2 sys_ui_policy and the 3 sys_number counters. The
 * application then stood on a live instance with no access control and no
 * transition guards for roughly 91 minutes, until a later commit restored
 * those records. Restoration mitigated the outcome; it did not authorise the
 * act, and it did not shorten that interval.
 *
 * The cascade was foreseeable. A read-only enumeration of the platform's
 * delete dependencies, run before the first delete, would have returned
 * non-zero counts in eight classes outside the authorised subset and stopped
 * the operation. That enumeration is what this script is.
 *
 * ANY future execution of an authorised targeted deletion of these tables MUST
 * run this guard first and MUST honour its verdict. A PROCEED verdict is the
 * only state in which deleting is permitted; an ABORT verdict means nothing is
 * deleted and the operation stops for human decision.
 *
 * ---------------------------------------------------------------------------
 * THE AUTHORISED DESTRUCTIVE SUBSET
 * ---------------------------------------------------------------------------
 * The authorisation this guard measures against covers exactly four things per
 * target table T:
 *
 *   1. T's own dictionary rows        (sys_dictionary where name = T)
 *   2. T's own data rows              (the rows in T itself)
 *   3. T's own label rows             (sys_documentation where name = T)
 *   4. the SCOPED role links on T's ACLs
 *      (sys_security_acl_role whose role is one of the three x_casemgmt roles)
 *
 * Everything else the platform would remove alongside T is COLLATERAL and
 * aborts the operation. That includes a role link on T's ACLs pointing at a
 * role outside the three scoped roles: the authorisation names the scoped role
 * links, so a link to any other role is outside it and is treated as
 * collateral. Where it is unclear whether a class belongs to the authorised
 * subset at all, the fail-closed reading is the correct one - treat it as
 * collateral and abort.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DOES, STEP BY STEP (mirrors section 2.5 Steps 0-4)
 * ---------------------------------------------------------------------------
 *   Step 0  Resolve the scope and the three roles BY QUERY. No sys_id is an
 *           input to this guard and none is embedded in it. An unresolvable
 *           scope aborts (fail-closed): a guard that cannot establish what it
 *           is measuring cannot clear a deletion.
 *   Step 1  Enumerate, per target table, every class the platform's
 *           table-delete dependency chain reaches. Each row is a read-only
 *           count and carries its own query text so the record is
 *           reproducible by hand.
 *   Step 2  Apply the abort rule: ANY non-zero count in a class marked
 *           collateral aborts the operation before the first delete, having
 *           deleted nothing. There is no partial variant - not "delete the
 *           tables and let a later commit restore the rest", not "delete what
 *           the authorisation covers and accept the cascade".
 *   Step 3  Record, on abort: the enumeration verbatim (class, query, count,
 *           the queried scope, the UTC timestamp of the measurement); the
 *           phase whose step required the deletion, recorded as UNMET with the
 *           destructive boundary named as the reason; and the fact that no data
 *           or metadata write took place (the syslog rows its own output
 *           creates are reported separately as log_records_emitted).
 *   Step 4  Name the fallback: leave the instance exactly as it stands - no
 *           rollback, no back-out, no deleteApplication, no scope deletion -
 *           ship the fallback package labelled for what it is, and hand the
 *           enumeration to a human as the decision item. Proceeding is
 *           permitted ONLY on an explicit human expansion of the destructive
 *           scope, recorded with who authorised it, what classes and counts it
 *           covers, and when; the enumeration is then re-run immediately
 *           before the delete and aborts again if it no longer matches what
 *           was authorised.
 *
 * ---------------------------------------------------------------------------
 * ONE EXCLUSION, STATED EXPLICITLY BECAUSE IT WOULD OTHERWISE BE MIS-APPLIED
 * ---------------------------------------------------------------------------
 * This control governs deletion on a LIVE, CONVERGED instance under a
 * narrower authorisation. It does NOT reclassify the documented two-commit
 * INSTALL path (../docs/HUMAN_DEPLOYMENT_RECREATE_GUIDE.md section 5/5a,
 * ../docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md section 9.5 step 2), which
 * deliberately relies on the same platform cascade against a target where the
 * second commit restores those records by design. That path stands as
 * documented. For the same reason this guard is deliberately NOT wired into
 * scripts/post_import_remediation.js: that script's rebuild path deletes only
 * provably metadata-only, provably package-owned rows, and the install path
 * depends on the cascade. Nothing here changes either document or that script.
 *
 * ---------------------------------------------------------------------------
 * HOW IT IS INVOKED
 * ---------------------------------------------------------------------------
 * System Definition -> Scripts - Background. It runs in either scope:
 *
 *   - "In scope" = Global            reads every class listed below
 *   - "In scope" = x_casemgmt        same reads; scoped contexts forbid
 *                                    gs.print(), which is why every line this
 *                                    script emits goes through gs.info()
 *
 * Output is retrieved from syslog by its marker:
 *
 *   GET /api/now/table/syslog?sysparm_query=messageLIKEX_CASEMGMT_PREDELETE_GUARD
 *       ^ORDERBYDESCsys_created_on&sysparm_limit=60
 *
 * The final line is the summary and begins with "VERDICT=". The function also
 * returns that summary string, so a caller can branch on it directly:
 *
 *   var verdict = preDeleteCollateralGuard();                 // the 3 tables
 *   var verdict = preDeleteCollateralGuard(['x_casemgmt_case']); // a subset
 *
 * ---------------------------------------------------------------------------
 * GUARANTEES
 * ---------------------------------------------------------------------------
 *   - No data or metadata write: no write API is called anywhere in this file.
 *     The `syslog` rows its own output creates are the single exception, and
 *     are counted and reported rather than claimed away (see the header note).
 *   - Repeatable: running it twice changes nothing about the instance's data or
 *     metadata and reports the same verdict for the same instance state.
 *   - No hard-coded sys_id: the scope and the three roles are resolved by
 *     name, per AAP section 0.7.2.
 *   - Fail-closed, without exception. Every one of these produces ABORT and
 *     none of them can produce PROCEED: an unresolvable scope; a missing scoped
 *     role; a class whose query throws; a class whose aggregate returns no row;
 *     a class whose aggregate returns a blank or non-numeric value; and a
 *     target table outside the authorised three. A count that was not
 *     successfully measured is never treated as a count of zero.
 *   - Targets are allowlisted: only `x_casemgmt_case`, `x_casemgmt_case_task`
 *     and `x_casemgmt_case_party` may be enumerated, because those are the only
 *     tables OVERRIDE-3's authorisation covers. Any other target aborts before
 *     enumeration begins.
 *
 * ---------------------------------------------------------------------------
 * ONE CORRECTION TO THE SPECIFICATION'S QUERY SHORTHAND
 * ---------------------------------------------------------------------------
 * Section 2.5 Step 1 row 3 writes the role-link condition as `roleIN<ROLES>`.
 * There is no `role` column on `sys_security_acl_role`; the reference to
 * `sys_user_role` is itself named `sys_user_role`. Measured on the target PDI
 * (Zurich Patch 10), the table's columns are `sys_security_acl`,
 * `sys_user_role`, `transaction_id` and the standard `sys_*` fields, and
 * querying `role` is rejected by the platform with "Unknown field role in
 * table sys_security_acl_role". This implementation therefore queries
 * `sys_user_role`, which is what the specification's shorthand means. Nothing
 * else in Step 1 is changed.
 */

// ============================================================================
// Configuration - names only, never sys_ids
// ============================================================================

var LOG_MARKER = 'X_CASEMGMT_PREDELETE_GUARD';

/** The scoped application's namespace, resolved to a sys_id at Step 0. */
var SCOPE_NAME = 'x_casemgmt';

/** The three scoped roles whose ACL links the authorisation covers. */
var SCOPED_ROLE_NAMES = [
    'x_casemgmt_case_manager',
    'x_casemgmt_case_agent',
    'x_casemgmt_case_viewer'
];

/** Default targets: the three scoped tables of this application. */
var DEFAULT_TARGET_TABLES = [
    'x_casemgmt_case',
    'x_casemgmt_case_task',
    'x_casemgmt_case_party'
];

/**
 * The phase whose step required the deletion, named in the Step 3 record so an
 * abort is recorded against something. Callers running this guard for a
 * different phase should pass their own label as the second argument.
 */
var DEFAULT_PHASE_LABEL = 'Phase 1 S6 (delete the created tables/role links)';

// ============================================================================
// Output helpers
// ============================================================================

/**
 * Count of log records this run has emitted. Each one is a persisted `syslog`
 * row, so it is counted and reported rather than described as no write at all.
 */
var LOG_RECORDS_EMITTED = 0;

/**
 * Emit one marked information line. gs.print() is deliberately not used: it is
 * forbidden in scoped contexts, whereas gs.info() lands in syslog in every
 * context - which is also why this is a persisted row and is counted.
 */
function log(message) {
    LOG_RECORDS_EMITTED += 1;
    gs.info(LOG_MARKER + '|' + message);
}

/**
 * Emit one marked warning line. Used for the abort verdict and for any class
 * that could not be read - both of which are decisions, not incidents.
 */
function logWarn(message) {
    LOG_RECORDS_EMITTED += 1;
    gs.warn(LOG_MARKER + '|' + message);
}

// ============================================================================
// Step 0 - resolve the scope and the roles by query
// ============================================================================

/**
 * Resolve the scoped application's sys_scope sys_id by its namespace.
 *
 * @return {string} the sys_id, or '' when the application is not installed
 */
function lookupScopeSysId() {
    var gr = new GlideRecord('sys_scope');
    gr.addQuery('scope', SCOPE_NAME);
    gr.setLimit(1);
    gr.query();
    return gr.next() ? gr.getUniqueValue() : '';
}

/**
 * Resolve the three scoped roles by name.
 *
 * @return {Object} { sysIds: string[], missing: string[] }
 */
function lookupScopedRoles() {
    var found = [];
    var missing = [];
    for (var i = 0; i < SCOPED_ROLE_NAMES.length; i++) {
        var gr = new GlideRecord('sys_user_role');
        gr.addQuery('name', SCOPED_ROLE_NAMES[i]);
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            found.push(gr.getUniqueValue());
        } else {
            missing.push(SCOPED_ROLE_NAMES[i]);
        }
    }
    return { sysIds: found, missing: missing };
}

// ============================================================================
// Counting primitives - every one of them read-only
// ============================================================================

/**
 * True when the named table is resolvable on this instance. A target table that
 * does not resolve has nothing to delete, which the caller reports rather than
 * silently counting as zero collateral.
 */
function tableIsResolvable(tableName) {
    try {
        return new GlideRecord(tableName).isValid();
    } catch (e) {
        return false;
    }
}

/**
 * Count rows with GlideAggregate. The query is applied by the caller's
 * callback so each enumeration row owns its own conditions.
 *
 * @param {string}   tableName  class to count
 * @param {Function} applyQuery receives the GlideAggregate and adds conditions
 * @return {Object} { readable: boolean, count: number, error: string }
 */
function countRows(tableName, applyQuery) {
    try {
        if (!tableIsResolvable(tableName)) {
            return { readable: false, count: 0, error: 'class not resolvable on this instance' };
        }
        var ga = new GlideAggregate(tableName);
        if (applyQuery) {
            applyQuery(ga);
        }
        ga.addAggregate('COUNT');
        ga.query();

        // Fail-closed, all three ways this can fail to produce a measurement.
        // A class that was not successfully measured is NOT a class counted at
        // zero: reporting 0 here would let the abort rule clear collateral that
        // was never looked at, which is the exact failure this guard exists to
        // prevent.
        if (!ga.next()) {
            return {
                readable: false,
                count: 0,
                error: 'aggregate returned no row, so the count is unmeasured'
            };
        }
        var raw = ga.getAggregate('COUNT');
        if (raw === null || raw === undefined || String(raw).trim() === '') {
            return {
                readable: false,
                count: 0,
                error: 'aggregate returned a blank value, so the count is unmeasured'
            };
        }
        // The WHOLE value must be a non-negative integer. parseInt() is
        // deliberately not the validator: it accepts a numeric prefix and
        // discards the rest, so parseInt('0oops', 10) is 0 and a malformed
        // value would clear the class as an honest zero. A count that cannot be
        // read in full is unmeasured, and unmeasured aborts.
        var normalized = String(raw).trim();
        if (!/^[0-9]+$/.test(normalized)) {
            return {
                readable: false,
                count: 0,
                error: 'aggregate returned the malformed value "' + raw +
                    '", which is not a whole non-negative integer, so the count is unmeasured'
            };
        }
        var total = parseInt(normalized, 10);
        if (isNaN(total) || total < 0) {
            return {
                readable: false,
                count: 0,
                error: 'aggregate value "' + raw + '" did not convert to a non-negative ' +
                    'integer, so the count is unmeasured'
            };
        }
        return { readable: true, count: total, error: '' };
    } catch (e) {
        return { readable: false, count: 0, error: '' + e };
    }
}

/**
 * The sys_ids of the scoped ACL records that guard a table - the table-level
 * ACLs (name = T) and its field-level ACLs (name starts with "T.").
 *
 * The two name conditions are OR-ed inside a single addQuery/addOrCondition
 * pair so the scope condition still applies to both branches. Writing this as
 * the encoded query "sys_scope=<SCOPE>^name=T^ORnameSTARTSWITHT." would drop
 * the scope filter from the second branch, because ^OR binds to the preceding
 * condition only.
 *
 * @return {Object} { readable: boolean, sysIds: string[], error: string }
 */
function aclSysIdsForTable(tableName, scopeSysId) {
    try {
        var ids = [];
        var gr = new GlideRecord('sys_security_acl');
        gr.addQuery('sys_scope', scopeSysId);
        var nameCondition = gr.addQuery('name', tableName);
        nameCondition.addOrCondition('name', 'STARTSWITH', tableName + '.');
        gr.query();
        while (gr.next()) {
            ids.push(gr.getUniqueValue());
        }
        return { readable: true, sysIds: ids, error: '' };
    } catch (e) {
        return { readable: false, sysIds: [], error: '' + e };
    }
}

// ============================================================================
// Step 1 - the enumeration
// ============================================================================

/**
 * Enumerate every class the platform's table-delete dependency chain reaches
 * for one target table.
 *
 * Row order and queries follow ../docs/refine-run/PHASE1-REBUILD.md section 2.5
 * Step 1 exactly, so the record this produces can be checked against the
 * specification line by line. `authorised` marks the four things the
 * authorisation covers; every other row is collateral and aborts.
 *
 * @param {string} tableName  the table proposed for deletion
 * @param {string} scopeSysId the sys_scope sys_id resolved at Step 0
 * @param {string[]} roleSysIds the three scoped role sys_ids from Step 0
 * @return {Object[]} one entry per class: name, query, count, authorised,
 *                    readable, error
 */
function enumerateForTable(tableName, scopeSysId, roleSysIds) {
    var rows = [];

    function push(className, queryText, authorised, result) {
        rows.push({
            table: tableName,
            className: className,
            query: queryText,
            count: result.count,
            authorised: authorised,
            readable: result.readable,
            error: result.error
        });
    }

    // Row 1 - the table's own dictionary rows (fields plus the collection row).
    push('sys_dictionary', 'name=' + tableName, true,
        countRows('sys_dictionary', function (ga) {
            ga.addQuery('name', tableName);
        }));

    // Row 1a - the label rows that accompany the dictionary rows. Counted for
    // the record; inside the authorised subset with the rows they describe.
    push('sys_documentation', 'name=' + tableName, true,
        countRows('sys_documentation', function (ga) {
            ga.addQuery('name', tableName);
        }));

    // Row 2 - the table's own data rows.
    push(tableName + ' (data rows)', 'all rows in ' + tableName, true,
        countRows(tableName, null));

    // Rows 3 and 3a - the role links on this table's ACLs, split by whether the
    // role is one of the three scoped roles. A link to any other role is
    // outside the authorisation and therefore collateral.
    var acls = aclSysIdsForTable(tableName, scopeSysId);
    if (!acls.readable) {
        push('sys_security_acl_role (scoped roles)',
            'sys_user_role IN <3 scoped roles> AND acl IN (ACLs of ' + tableName + ')', true,
            { readable: false, count: 0, error: acls.error });
        push('sys_security_acl_role (roles outside the scoped three)',
            'sys_user_role NOT IN <3 scoped roles> AND acl IN (ACLs of ' + tableName + ')', false,
            { readable: false, count: 0, error: acls.error });
    } else if (acls.sysIds.length === 0) {
        push('sys_security_acl_role (scoped roles)',
            'sys_user_role IN <3 scoped roles> AND acl IN (0 ACLs of ' + tableName + ')', true,
            { readable: true, count: 0, error: '' });
        push('sys_security_acl_role (roles outside the scoped three)',
            'sys_user_role NOT IN <3 scoped roles> AND acl IN (0 ACLs of ' + tableName + ')', false,
            { readable: true, count: 0, error: '' });
    } else {
        push('sys_security_acl_role (scoped roles)',
            'sys_user_role IN <3 scoped roles> AND acl IN (' + acls.sysIds.length +
            ' ACLs of ' + tableName + ')', true,
            countRows('sys_security_acl_role', function (ga) {
                ga.addQuery('sys_security_acl', 'IN', acls.sysIds.join(','));
                ga.addQuery('sys_user_role', 'IN', roleSysIds.join(','));
            }));
        push('sys_security_acl_role (roles outside the scoped three)',
            'sys_user_role NOT IN <3 scoped roles> AND acl IN (' + acls.sysIds.length +
            ' ACLs of ' + tableName + ')', false,
            countRows('sys_security_acl_role', function (ga) {
                ga.addQuery('sys_security_acl', 'IN', acls.sysIds.join(','));
                ga.addQuery('sys_user_role', 'NOT IN', roleSysIds.join(','));
            }));
    }

    // Row 4 - the ACL records themselves. Outside the subset: aborts.
    push('sys_security_acl',
        'sys_scope=<SCOPE> AND (name=' + tableName + ' OR name STARTSWITH ' +
        tableName + '.)', false,
        acls.readable
            ? { readable: true, count: acls.sysIds.length, error: '' }
            : { readable: false, count: 0, error: acls.error });

    // Row 5 - choice lists. Outside the subset: aborts.
    push('sys_choice', 'name=' + tableName, false,
        countRows('sys_choice', function (ga) {
            ga.addQuery('name', tableName);
        }));

    // Row 6 - business rules. Outside the subset: aborts.
    push('sys_script (business rules)', 'sys_scope=<SCOPE> AND collection=' + tableName, false,
        countRows('sys_script', function (ga) {
            ga.addQuery('sys_scope', scopeSysId);
            ga.addQuery('collection', tableName);
        }));

    // Row 7 - reports. Outside the subset: aborts.
    push('sys_report', 'sys_scope=<SCOPE> AND table=' + tableName, false,
        countRows('sys_report', function (ga) {
            ga.addQuery('sys_scope', scopeSysId);
            ga.addQuery('table', tableName);
        }));

    // Row 8 - list layouts. Outside the subset: aborts.
    push('sys_ui_list', 'name=' + tableName, false,
        countRows('sys_ui_list', function (ga) {
            ga.addQuery('name', tableName);
        }));

    // Row 9 - related lists. Outside the subset: aborts.
    push('sys_ui_related_list', 'name=' + tableName, false,
        countRows('sys_ui_related_list', function (ga) {
            ga.addQuery('name', tableName);
        }));

    // Row 10 - UI policies. Outside the subset: aborts.
    push('sys_ui_policy', 'sys_scope=<SCOPE> AND table=' + tableName, false,
        countRows('sys_ui_policy', function (ga) {
            ga.addQuery('sys_scope', scopeSysId);
            ga.addQuery('table', tableName);
        }));

    // Row 11 - number counters. Outside the subset: aborts.
    push('sys_number', 'category=' + tableName, false,
        countRows('sys_number', function (ga) {
            ga.addQuery('category', tableName);
        }));

    return rows;
}

// ============================================================================
// Entry point - Steps 0 through 4
// ============================================================================

/**
 * Run the guard.
 *
 * @param {string[]} [targetTables] tables proposed for deletion; defaults to
 *                                  the three scoped tables
 * @param {string}   [phaseLabel]   the phase whose step required the deletion,
 *                                  named in the Step 3 abort record
 * @return {string} the summary line, beginning "VERDICT=PROCEED" or
 *                  "VERDICT=ABORT"
 */
function preDeleteCollateralGuard(targetTables, phaseLabel) {
    var tables = (targetTables && targetTables.length) ? targetTables : DEFAULT_TARGET_TABLES;
    var phase = phaseLabel || DEFAULT_PHASE_LABEL;
    var measuredAt = new GlideDateTime();
    var measuredAtUtc = measuredAt.getValue();
    var i;

    log('START|no data or metadata write; emits syslog rows only|measured_at_utc=' +
        measuredAtUtc + '|phase=' + phase + '|targets=' + tables.join(','));

    // ---- Target allowlist, before any enumeration ---------------------------
    // OVERRIDE-3's authorisation covers exactly three tables. A target outside
    // that set is outside the authorisation this guard measures against, so it
    // aborts here rather than being enumerated - a table the guard does not
    // know cannot be cleared by it, whatever its dependent classes count.
    var rejected = [];
    for (i = 0; i < tables.length; i++) {
        if (DEFAULT_TARGET_TABLES.indexOf(tables[i]) === -1) {
            rejected.push(tables[i]);
        }
    }
    if (rejected.length > 0) {
        logWarn('STEP0|target(s) outside the authorised three: ' + rejected.join(','));
        return abort(
            ['these target(s) are outside the authorised destructive subset and cannot be ' +
             'cleared by this guard: ' + rejected.join(', ') + '. The authorisation covers ' +
             DEFAULT_TARGET_TABLES.join(', ') + ' only; deleting anything else requires an ' +
             'explicit human expansion of the destructive scope first.'],
            [], tables, phase, measuredAtUtc, '(not queried - target rejected)');
    }

    // ---- Step 0 -------------------------------------------------------------
    var scopeSysId = lookupScopeSysId();
    if (!scopeSysId) {
        logWarn('STEP0|scope "' + SCOPE_NAME + '" could not be resolved by query');
        return abort(
            ['scope "' + SCOPE_NAME + '" is not present on this instance, so the guard ' +
             'cannot establish what the deletion would reach'],
            [], tables, phase, measuredAtUtc, '(unresolved)');
    }
    log('STEP0|scope resolved by query|scope=' + SCOPE_NAME);

    var roles = lookupScopedRoles();
    if (roles.missing.length > 0) {
        logWarn('STEP0|scoped roles missing: ' + roles.missing.join(','));
        return abort(
            ['these scoped roles could not be resolved by query: ' + roles.missing.join(', ') +
             ' - the authorised subset cannot be delimited without them'],
            [], tables, phase, measuredAtUtc, scopeSysId);
    }
    log('STEP0|roles resolved by query|' + SCOPED_ROLE_NAMES.join(','));

    // ---- Step 1 -------------------------------------------------------------
    var allRows = [];
    var row;
    for (i = 0; i < tables.length; i++) {
        if (!tableIsResolvable(tables[i])) {
            log('STEP1|' + tables[i] + '|table does not resolve on this instance - ' +
                'nothing to delete; its dependent classes are still enumerated below');
        }
        allRows = allRows.concat(enumerateForTable(tables[i], scopeSysId, roles.sysIds));
    }

    for (i = 0; i < allRows.length; i++) {
        row = allRows[i];
        log('STEP1|' + row.table + '|class=' + row.className +
            '|query=' + row.query +
            '|count=' + (row.readable ? row.count : 'UNREADABLE') +
            '|authorised=' + row.authorised +
            (row.error ? '|error=' + row.error : ''));
    }

    // ---- Step 2 -------------------------------------------------------------
    // Any non-zero count in a collateral class aborts. So does any class the
    // guard could not read: an unmeasured class is not a cleared one.
    var reasons = [];
    for (i = 0; i < allRows.length; i++) {
        row = allRows[i];
        if (!row.readable) {
            reasons.push(row.table + ': class ' + row.className +
                ' could not be read, so it is not cleared (fail-closed)' +
                (row.error ? ' - ' + row.error : ''));
            continue;
        }
        if (!row.authorised && row.count > 0) {
            reasons.push(row.table + ': ' + row.count + ' ' + row.className +
                ' record(s) sit outside the authorised destructive subset (query: ' +
                row.query + ')');
        }
    }

    if (reasons.length > 0) {
        return abort(reasons, allRows, tables, phase, measuredAtUtc, scopeSysId);
    }

    var summary = 'VERDICT=PROCEED|no collateral class holds a record|targets=' +
        tables.join(',') + '|classes_enumerated=' + allRows.length +
        '|scope=' + SCOPE_NAME + '|measured_at_utc=' + measuredAtUtc +
        '|phase=' + phase + '|data_and_metadata_writes=0|deleted=0' +
        '|log_records_emitted=' + (LOG_RECORDS_EMITTED + 2);
    log(summary);
    log('STEP2|the deletion is permitted for the enumerated targets, and ONLY for them. ' +
        'Re-run this guard immediately before the first delete if any time has passed: ' +
        'a PROCEED verdict describes the instance at measured_at_utc, not later.');
    return summary;
}

/**
 * Step 3 and Step 4 - the abort record.
 *
 * Emits the enumeration verbatim, records the phase as UNMET with the
 * destructive boundary as the reason, states that no data or metadata write took
 * place, and names the fallback path. Issues no write API call; the syslog rows
 * its own output creates are counted in the summary as log_records_emitted.
 *
 * @return {string} the summary line, beginning "VERDICT=ABORT"
 */
function abort(reasons, allRows, tables, phase, measuredAtUtc, scopeSysId) {
    var i;

    logWarn('STEP2|ABORT|' + reasons.length + ' reason(s); nothing has been deleted');
    for (i = 0; i < reasons.length; i++) {
        logWarn('STEP2|ABORT|reason ' + (i + 1) + '/' + reasons.length + '|' + reasons[i]);
    }

    // Step 3 (a) - the enumeration verbatim, so the record stands on its own.
    log('STEP3|enumeration follows verbatim|scope_queried=' + SCOPE_NAME +
        '|scope_sys_id_resolved=' + (scopeSysId === '(unresolved)' ? 'no' : 'yes') +
        '|measured_at_utc=' + measuredAtUtc);
    for (i = 0; i < allRows.length; i++) {
        log('STEP3|' + allRows[i].table + '|class=' + allRows[i].className +
            '|query=' + allRows[i].query +
            '|count=' + (allRows[i].readable ? allRows[i].count : 'UNREADABLE') +
            '|authorised=' + allRows[i].authorised);
    }

    // Step 3 (b) - the phase is unmet, and why.
    log('STEP3|phase=' + phase + '|exit_condition=UNMET' +
        '|reason=the deletion its step required would exceed the authorised destructive ' +
        'boundary, so it was not performed');

    // Step 3 (c) - no data or metadata write happened.
    log('STEP3|data_and_metadata_writes=0|no insert, update or delete was issued by this ' +
        'guard against any business or metadata table. The syslog rows this run emitted are ' +
        'its own output and are counted in the summary as log_records_emitted.');

    // Step 4 - the fallback, named rather than implied.
    log('STEP4|fallback=leave the instance exactly as it stands: no rollback, no back-out, ' +
        'no deleteApplication, no scope deletion. Ship the fallback package labelled for ' +
        'what it is and hand this enumeration to a human as the decision item.');
    log('STEP4|proceeding is permitted ONLY on an explicit human expansion of the ' +
        'destructive scope, recorded with who authorised it, what classes and counts it ' +
        'covers, and when - after which this guard is re-run immediately before the delete ' +
        'and aborts again if the enumeration no longer matches what was authorised.');

    var summary = 'VERDICT=ABORT|reasons=' + reasons.length + '|targets=' + tables.join(',') +
        '|classes_enumerated=' + allRows.length + '|scope=' + SCOPE_NAME +
        '|measured_at_utc=' + measuredAtUtc + '|phase=' + phase +
        '|phase_exit_condition=UNMET|data_and_metadata_writes=0|deleted=0' +
        '|log_records_emitted=' + (LOG_RECORDS_EMITTED + 1);
    logWarn(summary);
    return summary;
}

// ============================================================================
// Auto-execution
// ============================================================================
//
// Calling the entry point from the bottom of the file keeps it drop-in runnable
// in System Definition -> Scripts - Background with no extra boilerplate, in
// either scope. The call is read-only and safe to repeat: two runs against the
// same instance state produce the same verdict and change nothing.

preDeleteCollateralGuard();
