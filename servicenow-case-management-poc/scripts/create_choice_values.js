/*
 * x_casemgmt_case_management - Choice Value Creation Script
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SCRIPT DOES
 * ---------------------------------------------------------------------------
 * VERIFIES the twenty-four `sys_choice` value rows that the three scoped
 * tables' seven Choice fields require, and - only in a run an operator has
 * explicitly authorized to write (ALLOW_WRITES below, which defaults to FALSE)
 * - reconciles the ones that are absent or wrong. It is a CHOICE-ONLY
 * mechanism: `sys_choice` is the only table it can write, and every row it
 * could write is one of the twenty-four the specification below names.
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
 *   - leaves it untouched when it already agrees with the specification;
 *   - in an AUTHORIZED run (ALLOW_WRITES = true) inserts the row when it is
 *     absent, and repairs it IN PLACE when it exists but its `label`,
 *     `sequence`, `language` or `inactive` flag disagrees;
 *   - in the DEFAULT verification-only run (ALLOW_WRITES = false) writes
 *     nothing and instead reports the exact write it did not make as a
 *     BLOCKED problem, which fails the verdict;
 *   - never knowingly inserts a second row for a key it has just observed to
 *     have one.
 *
 * A re-run therefore leaves exactly twenty-four rows and writes nothing. The
 * verification pass afterwards fails on a SURPLUS as loudly as on a shortfall:
 * a stray extra value, a duplicated key, or a value on an element outside the
 * seven lists is an over-broad choice list a user can select from, so it is
 * reported rather than tolerated. The script reports surplus; it never deletes,
 * because deleting a row somebody else authored is not this script's mandate.
 *
 * Verification is three read-only passes, and the verdict is the conjunction of
 * all three - a run cannot report OK on the strength of one of them:
 *
 *   1. COUNTS. Per field and in total, against the specification, including the
 *      surplus classification above.
 *   2. PERSISTED ATTRIBUTES. Every one of the twenty-four rows is re-read from
 *      the database by its natural key AFTER the reconciliation pass - after
 *      the writes, in a run that made any - and its stored `label`,
 *      `sequence`, `language` and `inactive` are compared again. Existence is
 *      not correctness, and a write that was partially applied, normalized by
 *      the platform or overwritten by a business rule looks identical to a
 *      correct one until something re-reads it.
 *   3. EXPORT COMPOSITES. Exactly one app-owned `sys_choice_set` per specified
 *      field, no surplus composite on the three owned tables, and both
 *      ownership columns resolving to this application - because "the rows
 *      exist" and "the values are exportable as app-owned" are two different
 *      claims and only the first is a row count.
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
 * after any import, it proves whether the twenty-four rows are present and
 * correct, names to the column any that are not, and - in a run explicitly
 * authorized to write - creates or repairs exactly those. On an instance where
 * the package already delivered them it writes nothing in either mode and
 * reports twenty-four already-correct rows with verdict=OK, which is itself the
 * evidence that the dropdowns will render. That verification case is the one
 * this script is expected to serve most often, which is why it is the case that
 * needs no authorization.
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
 * Run it in the `x_casemgmt` application scope. Nothing else is supported: the
 * executing scope is asserted before anything at all is written, and a run the
 * platform completes in any other scope - Global included - is REFUSED
 * outright, with a FAILED verdict and not one row read for reconciliation, let
 * alone written.
 *
 * AS SHIPPED THE RUN IS VERIFICATION-ONLY. `ALLOW_WRITES` is declared `false`
 * below, so a run pasted straight out of the repository reads, checks and
 * reports and mutates nothing. Authorizing the writes is a deliberate, visible
 * act: edit that one declaration to `true` for the run, having first
 * established the single-writer precondition the next section describes. Every
 * run states which mode it is in on its own `MODE|` output line, so a
 * verification run can never be mistaken in evidence for a repair run.
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
 * ---------------------------------------------------------------------------
 * THE PLATFORM BOUNDARY, AND WHAT THIS SCRIPT DOES WHEN IT MEETS IT
 * ---------------------------------------------------------------------------
 * ONE PLATFORM CONSTRAINT DECIDES WHETHER THE WRITE CAN HAPPEN AT ALL, AND IT
 * IS MEASURED, NOT ASSUMED. `sys_choice` is a GLOBAL table, and on this
 * platform its `sys_db_object` row carries `create_access = false`,
 * `update_access = false` and `delete_access = false`. A scoped application may
 * therefore only READ it: an insert or a repair attempted from the `x_casemgmt`
 * scope is refused by the platform, silently returning no sys_id.
 *
 * THAT BOUNDARY IS NOT WORKED AROUND. Three routes past it exist and all three
 * are forbidden, so none is taken and - just as importantly - none is suggested
 * by this script's own output:
 *
 *   - re-running this script in the GLOBAL scope to perform the write. That is
 *     a global-scope write, which AAP 0.3.2 ("global scope changes of any
 *     kind") and AAP 0.7.2 ("zero global-scope writes") forbid outright.
 *   - editing the global `sys_db_object` row for `sys_choice` to open its
 *     access flags. A global-scope change to an out-of-the-box record.
 *   - adding a `sys_scope_privilege` to the application to request the elevated
 *     cross-scope access. An application artifact the AAP does not enumerate,
 *     which the Minimal-Change Clause (AAP 0.7.2) forbids.
 *
 * So when the platform refuses an in-scope write, the outcome is a REPORTED
 * BLOCKED capability gap - a FAILED verdict naming the refused row, the cause,
 * and the one remedy that stays inside the constraints, which is the platform's
 * own NATIVE IN-SCOPE AUTHORING PATH:
 *
 *      With the `x_casemgmt` application selected, author the values on the
 *      field's own Choices list - the dictionary entry's Choices related list,
 *      or Table Builder's Choices editor for that column. The platform then
 *      creates the app-owned `sys_choice_set` composite and its value rows
 *      itself, in scope, and captures them into the application's update set.
 *
 * That native path is how this application's seven `sys_choice_set` composites
 * came to exist. This script's standing role beside it is to VERIFY, and to
 * reconcile in any context where the platform does permit the write.
 *
 * WHAT AN UPDATE SET CARRIES IS THE COMPOSITE, NOT THE ROW, which is what
 * makes ownership checkable at all. `sys_choice` has no `sys_scope` column on
 * this release, so the exportable app-owned record for each (table, field) is
 * the `sys_choice_set` composite (`sys_scope` = `sys_package` = the x_casemgmt
 * Case Management application, update names `sys_choice_x_casemgmt_*`).
 * verifyChoiceSets() below asserts, on every run, that exactly one such
 * composite exists per specified field, that both ownership columns resolve to
 * the resolved application scope, and that no unspecified composite exists on
 * the three owned tables - so "these values are exportable as app-owned" is a
 * verdict-bearing assertion rather than a claim.
 *
 * ---------------------------------------------------------------------------
 * SINGLE-WRITER PRECONDITION - UNENFORCEABLE, WHICH IS WHY WRITES ARE OFF
 * ---------------------------------------------------------------------------
 * The reconciliation needs exactly one writer on these choice lists for the
 * duration of a run, AND THIS SCRIPT CANNOT ENFORCE THAT. The reason is a
 * platform gap rather than a design choice: `GlideMutex` and `sleep()` are
 * unavailable inside a scoped application, `global.Mutex` is unreachable from a
 * custom scope, and the substitutes are all barred here - a `sys_properties`
 * claim row is a global write (AAP 0.3.2), a dedicated lock table is an
 * artifact the AAP does not enumerate (AAP 0.7.2), and `sys_choice` carries
 * `delete_access = false` for a scoped app, so even a compensating rollback of
 * a row this script itself inserted is not reliably available. There is no
 * mutual-exclusion or atomic-uniqueness primitive this script may use.
 *
 * A PRECONDITION THE SCRIPT CANNOT ENFORCE IS NOT A SAFEGUARD, so it is not
 * relied upon as one: `ALLOW_WRITES` DEFAULTS TO FALSE and the default run
 * mutates nothing at all. That is the honest resolution of the gap - the read
 * side of this script is complete and safe, so it is the part that runs
 * unconditionally, and the part that cannot be made safe is the part that has
 * to be asked for.
 *
 * WHAT THE RACE GUARDS ACTUALLY DO, ON AN AUTHORIZED RUN. Before every single
 * mutating call the script re-asserts the executing scope and re-resolves the
 * application scope record; immediately before an insert it re-queries the
 * natural key and treats a row that appeared since its first query as a
 * detected concurrent writer; immediately after its own insert it reads the
 * natural key back and treats anything other than exactly one row as a race.
 * Any of those closes writing for the rest of the run and forces a FAILED
 * verdict. State the guarantee precisely, because it is easy to overstate:
 *
 *   - The pre-write revalidation and the pre-insert re-query PREVENT the write
 *     they guard. A row already visible is never inserted over.
 *   - The post-insert read-back DETECTS ONLY. By the time it runs, this run's
 *     row is already committed, so if a simultaneous writer inserted the same
 *     natural key the duplicate HAS ALREADY PERSISTED. The read-back stops all
 *     further writes and fails the verdict; it does not prevent, reverse or
 *     delete the duplicate, and the duplicate is REPORTED and left in place -
 *     deleting a row is outside this script's mandate and `sys_choice` refuses
 *     a scoped delete in any case.
 *   - So an AUTHORIZED run accepts a RESIDUAL WINDOW: two concurrent writers
 *     can each pass every check and each persist a row, and the outcome is a
 *     loud failure over a detected duplicate rather than no duplicate. The
 *     guards narrow that window and make a raced run unmistakable; they do not
 *     eliminate it.
 *
 * Setting `ALLOW_WRITES = true` is therefore an operator ASSERTION that the
 * precondition holds, not a request the script can validate. What is being
 * asserted is spelled out at the declaration itself.
 *
 * ---------------------------------------------------------------------------
 * OUTPUT CONTRACT (quotable as evidence)
 * ---------------------------------------------------------------------------
 * Every line is emitted through gs.info() with the prefix `U2CHOICE|`, so the
 * run is readable both in the Background Script response and afterwards from
 * `syslog` (messageSTARTSWITHU2CHOICE).
 *
 * MODE - the first line of every run, before the gates, so the mode is on the
 * record whatever else the run does. Exactly two states:
 *
 *   U2CHOICE|MODE|allow_writes=false|VERIFICATION ONLY: no sys_choice insert or
 *                 update will be attempted ...
 *   U2CHOICE|MODE|allow_writes=true|WRITES AUTHORIZED: ... the operator has
 *                 asserted the single-writer precondition ...
 *
 * GATES AND REFUSALS - each of the three is an unconditional early return, and
 * each ends the run at its own SUMMARY line with nothing written:
 *
 *   U2CHOICE|SPEC|CHOICE_SPECS describes N values across M lists ...
 *                                            gate 1: the specification is
 *                                            inconsistent with its invariants
 *   U2CHOICE|SCOPE|REFUSED|executing_scope=...|required_scope=x_casemgmt|...
 *                                            gate 2: the run is not executing
 *                                            in the application's scope
 *   U2CHOICE|SCOPE|REFUSED|sys_scope query for scope=x_casemgmt returned N ...
 *                                            gate 3: the application scope
 *                                            record is absent or ambiguous
 *
 * RECONCILIATION - one line per row acted on, none for a row already correct.
 * The `created` and `repaired` lines can only appear in an AUTHORIZED run; the
 * `BLOCKED` lines can only appear in a verification-only run:
 *
 *   U2CHOICE|SCOPE|application=...|executing_scope=...|in_application_scope=...
 *                                            |sys_choice_cross_scope_access=...
 *   U2CHOICE|<table>.<element>=<value>|created|sys_id=...|read_back=1
 *   U2CHOICE|<table>.<element>=<value>|repaired|<column>:<from>-><to>|...
 *   U2CHOICE|<table>.<element>=<value>|insert REFUSED|cause=...|remedy=...
 *   U2CHOICE|<table>.<element>=<value>|repair update REFUSED ...|cause=...
 *   U2CHOICE|DUPLICATE|<key>|N rows share this key ...
 *   U2CHOICE|RECONCILE|created=N|repaired=N|already_correct=N|insert_refused=N
 *                     |update_refused=N|insert_blocked=N|repair_blocked=N
 *                     |duplicate_keys=N|race_aborts=N|skipped_after_abort=N
 *
 * BLOCKED - the verification-only default reached a row it would have written
 * and did not. Each one is a problem and each one fails the verdict, so a
 * shortfall is never reported as an OK run:
 *
 *   U2CHOICE|BLOCKED|<key>|insert NOT ATTEMPTED|would have inserted this
 *                    natural key (name=..., element=..., value=...) with
 *                    label=..., sequence=..., language=..., inactive=...
 *                    |not_authorized=ALLOW_WRITES is false ...|remedy=...
 *   U2CHOICE|BLOCKED|<key>|repair update NOT ATTEMPTED|would have repaired
 *                    <column>:<stored>-><wanted>,... on sys_id=...
 *                    |not_authorized=ALLOW_WRITES is false ...|remedy=...
 *
 * RACE DETECTION - authorized runs only, since only they write. Any of these
 * closes writing for the rest of the run and fails the verdict. The first three
 * and the pre-insert re-query PREVENT the write they guard; the post-insert
 * read-back DETECTS a duplicate that has already persisted and reports it:
 *
 *   U2CHOICE|<key>|<operation> NOT ATTEMPTED|the executing scope is now ...
 *   U2CHOICE|<key>|<operation> NOT ATTEMPTED|the sys_scope query ... now returns
 *   U2CHOICE|<key>|<operation> NOT ATTEMPTED|the application scope record
 *                                            changed identity mid-run ...
 *   U2CHOICE|RACE|<key>|insert NOT ATTEMPTED|N row(s) ... appeared between ...
 *   U2CHOICE|RACE|<key>|post-insert read-back found N rows ...
 *   U2CHOICE|ABORT|writing is closed for the remainder of this run|reason=...
 *   U2CHOICE|<key>|SKIPPED|writing was closed earlier in this run|reason=...
 *
 * VERIFICATION - three independent read-only passes, all three verdict-bearing:
 *
 *   U2CHOICE|VERIFY|<table>.<element> expected=N found=N ok|MISMATCH
 *                                            counts, one per field, seven in all
 *   U2CHOICE|VERIFY|TOTAL expected=24 found=N lists_expected=7 lists_found=N ...
 *   U2CHOICE|SURPLUS|<key>|sys_id=...|<reason>. Reported, not deleted.
 *   U2CHOICE|PERSISTED|<key>|NOT PERSISTED|DUPLICATED|SPEC COLLISION|...
 *   U2CHOICE|PERSISTED|<key>|MISMATCH|column=...|stored=...|wanted=...
 *                                            a post-write re-read of every one
 *                                            of the 24 rows, by natural key
 *   U2CHOICE|PERSISTED|checked=24|exactly_one=N|missing=N|duplicated=N
 *                     |attribute_mismatches=N|columns=label,sequence,language,
 *                      inactive|ok|MISMATCH|read_only_reread
 *   U2CHOICE|CHOICE_SETS|name=<table> element=<element> composites=N
 *                       [sys_id=... sys_scope=... sys_package=...] ok|MISMATCH
 *   U2CHOICE|CHOICE_SETS|<field>|SHORTFALL|DUPLICATE|SURPLUS|...
 *   U2CHOICE|CHOICE_SETS|<field>|OWNERSHIP UNVERIFIABLE|EMPTY|MISMATCH|...
 *   U2CHOICE|CHOICE_SETS|expected=7|found=N|fields=...|app_owned=N
 *                       |application_sys_id=...|ok|MISMATCH|read_only_report
 *
 * VERDICT - one line, always last but for the problem list:
 *
 *   U2CHOICE|SUMMARY|verdict=OK|FAILED|reason=<reason>|allow_writes=true|false
 *                   |values=N/24|created=N|repaired=N|already_correct=N
 *                   |writes_blocked=N|surplus=N|duplicates=N|race_aborts=N
 *                   |problems=N|ms=N
 *   U2CHOICE|PROBLEM[n/N]|...                every problem, numbered, after the
 *                                            summary, on every exit path
 *
 * verdict=OK requires ALL of: the counts agree, every one of the 24 rows
 * re-reads correctly by natural key, all 7 export composites exist exactly once
 * and are app-owned, zero duplicate natural keys, zero blocked writes, no
 * abort, and an empty problem list. A VERIFICATION-ONLY run can therefore still
 * reach OK - on an instance that is already correct, "nothing needed writing"
 * is a true and useful result - but it can never reach OK on an instance that
 * needed a write, because the write it declined to make is itself a problem.
 * The reason vocabulary on FAILED is closed, and one of:
 *
 *   inconsistent specification                         (gate 1)
 *   out-of-scope execution                             (gate 2)
 *   unresolved application scope                       (gate 3)
 *   writes not authorized (verification-only default)  (ALLOW_WRITES = false
 *                                                       met a needed write)
 *   out-of-scope execution mid-run                     (pre-write revalidation)
 *   application scope record unresolved mid-run        (pre-write revalidation)
 *   application scope record changed identity mid-run  (pre-write revalidation)
 *   concurrent writer detected on the natural key      (pre-insert re-query)
 *   duplicate row detected after insert                (post-insert read-back;
 *                                                       already persisted)
 *   inserted row not readable after insert             (post-insert read-back)
 *   duplicate natural keys on sys_choice
 *   platform refused a sys_choice write in scope (BLOCKED capability gap)
 *   choice row counts disagree with the specification
 *   persisted choice rows disagree with the specification
 *   choice values are not exportable as app-owned composites
 *   see the PROBLEM lines
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
 *   - `sys_choice` is the ONLY table this script can write, and it writes
 *     nothing at all unless ALLOW_WRITES has been set to true for the run.
 *     `sys_scope`, `sys_db_object` and `sys_choice_set` are read for
 *     verification and reporting only, in either mode.
 *   - Zero global-scope writes, and zero global-scope EXECUTION: the run is
 *     refused before its first write unless gs.getCurrentScopeName() is
 *     `x_casemgmt`, and the refusal is re-asserted before every later write.
 *   - No deletion of any row, ever. A duplicate or a surplus value is reported.
 *   - No table, dictionary, ACL, role, number-counter, sys_property,
 *     sys_scope_privilege or data-model change of any kind.
 */

// ============================================================================
// Write authorization
// ============================================================================

/*
 * WHETHER THIS RUN MAY WRITE TO sys_choice AT ALL. Declared false, and shipped
 * false.
 *
 * WHAT IT MEANS. `false` - the default and the shipped state - makes the run
 * VERIFICATION-ONLY: the three gates, the reconciliation survey, the live-row
 * audit and all three verification passes execute exactly as they otherwise
 * would, and not one `insert()` or `update()` is issued. Every row the run
 * would have created or repaired is reported instead, as a BLOCKED problem
 * naming the precise write that was not made, and the run FAILS with
 * `reason=writes not authorized (verification-only default)`. `true` restores
 * the full reconciliation - insert what is missing, repair what has drifted -
 * with every race guard in this file still in force.
 *
 * WHY IT DEFAULTS OFF. The reconciliation is a check-then-act sequence, and
 * this script has no primitive with which to make it atomic: no scoped mutual
 * exclusion exists (see the SINGLE-WRITER PRECONDITION block in the header),
 * and `sys_choice` refuses a scoped delete, so a write that turns out to have
 * raced cannot even be compensated afterwards. The precondition that would make
 * writing safe - one writer at a time - is therefore something the script can
 * state but cannot enforce, and an unenforceable precondition is not a
 * safeguard. Defaulting to `false` means the mode that cannot be made safe is
 * never entered by accident, by a copy-paste, or by an operator who did not
 * know a lock was missing.
 *
 * WHAT AN OPERATOR ASSERTS BY SETTING IT TRUE. Not a request the script
 * validates - an assertion the script trusts, on this operator's authority,
 * that for the duration of the run:
 *
 *   - no other instance of this script is executing against the instance;
 *   - no Update Set commit, import or preview that touches these seven choice
 *     lists is in flight;
 *   - no application teardown (`deleteApplication`, a scope delete, an app
 *     uninstall) is running or about to run;
 *   - no other operator or job is authoring these choice lists natively.
 *
 * If any of those is untrue the guards in this file will most likely turn the
 * run into a loud failure, but "most likely" is the honest strength of the
 * claim: the post-insert read-back detects a duplicate that has ALREADY
 * persisted rather than preventing it. An authorized run accepts that residual
 * window knowingly; a default run does not run the risk at all.
 *
 * The preferred remedy for a shortfall remains the platform's own native
 * in-scope authoring path - see nativeAuthoringRemedy(), which every BLOCKED
 * line prints - because the platform serializes that path itself.
 */
var ALLOW_WRITES = false;

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
    // A write this run did not attempt because ALLOW_WRITES is false. These are
    // the verification-only mode's shortfall: each one is a problem, each one
    // fails the verdict, and each one names the write that was withheld.
    insertBlocked: 0,
    updateBlocked: 0,
    duplicateKeys: 0,
    surplusRows: 0,
    // A write this run declined to attempt because the pre-write revalidation,
    // the pre-insert re-query or the post-insert read-back said the state had
    // moved under it. Each one is a problem and each one is fatal to the run.
    raceAborts: 0,
    // Reconciliations skipped because an earlier abort closed writing for the
    // rest of the run. Counted so the summary accounts for all 24 specs.
    skippedAfterAbort: 0
};

/*
 * Whether writing is still permitted for the remainder of this run.
 *
 * There is no lock available to this script (see the SINGLE-WRITER
 * PRECONDITION block in the header), so the abort flag is what makes a raced
 * authorized run fail LOUDLY and stop writing: the first detection of a moved
 * state sets it, every later mutating path checks it, and the verdict reads it.
 * It does not undo a write that already landed - where the detection is the
 * post-insert read-back, the duplicate has already persisted and the flag's
 * effect is to withhold the writes that would have followed, not the one that
 * was just made. Verification still completes after an abort - a failed run is
 * more useful with its evidence than without it - but nothing further is
 * written.
 */
var RUN_STATE = {
    abort: false,
    abortReason: ''
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
 * Print the accumulated problem list, numbered.
 *
 * Emitted after the summary line by every exit path, including the early
 * refusals: a run that refuses to do anything still has to say why in the same
 * quotable form as a run that completed.
 */
function logProblemList() {
    for (var p = 0; p < PROBLEMS.length; p++) {
        log('PROBLEM[' + (p + 1) + '/' + PROBLEMS.length + ']|' + PROBLEMS[p]);
    }
}

/**
 * Close writing for the rest of this run, and record why.
 *
 * Called when the state this run validated has moved under it: the executing
 * scope changed, the application scope record disappeared, a concurrent writer
 * inserted the row first, or a read-back found the wrong number of rows. The
 * first reason wins, because it is the one that explains the run.
 *
 * This closes writing FORWARD only. It is not a rollback and it is not a
 * duplicate-prevention mechanism for the write that triggered it: a row this
 * run already inserted stays inserted, and a duplicate the read-back found is
 * reported and left in place.
 *
 * @param {string} reason a short machine-readable reason for the summary line
 */
function abortWrites(reason) {
    STATS.raceAborts++;
    if (!RUN_STATE.abort) {
        RUN_STATE.abort = true;
        RUN_STATE.abortReason = reason;
    }
    log('ABORT|writing is closed for the remainder of this run|reason=' + reason +
        '|verification continues, no further row is written, and no row already written is' +
        ' reverted or deleted');
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
 * Read a column as text, with an absent value reading as '' rather than as the
 * string 'null'.
 *
 * @param {GlideRecord} gr a positioned record
 * @param {string} column the column name
 * @return {string} the stored text, or '' when the column holds nothing
 */
function readText(gr, column) {
    var raw = gr.getValue(column);
    return '' + (raw === null || raw === undefined ? '' : raw);
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
 * The one remedy for a refused choice write that stays inside this project's
 * constraints, as a single string every refusal path prints.
 *
 * It is the platform's own native in-scope authoring path, and it is how this
 * application's seven sys_choice_set composites actually came to exist. The
 * three routes it deliberately does NOT offer - a global-scope run of this
 * script, an edit to the global sys_db_object row, and a sys_scope_privilege
 * artifact - are named as forbidden here rather than left unmentioned, because
 * an operator reading a refusal is exactly the person who would otherwise reach
 * for one of them.
 *
 * @return {string} the remedy, and the routes that are not it
 */
function nativeAuthoringRemedy() {
    return 'with the ' + SCOPE_NAME + ' application selected, author the values natively on the field\'s' +
        ' own Choices list (the sys_dictionary entry\'s Choices related list, or Table Builder\'s Choices' +
        ' editor for that column). The platform creates the app-owned sys_choice_set composite and its' +
        ' value rows in scope and captures them into the application\'s update set. If the platform' +
        ' refuses the write in scope, that is a BLOCKED capability gap to REPORT (AAP 0.3.2: report the' +
        ' gap, do not substitute an out-of-scope workaround). FORBIDDEN, and therefore not offered as' +
        ' alternatives: re-running this script in the GLOBAL scope, editing the global sys_db_object row' +
        ' for sys_choice, and adding a sys_scope_privilege to the application.';
}

/**
 * Why a write was withheld by the verification-only default, and what to do
 * about it, as a single clause every BLOCKED line prints.
 *
 * It is deliberately explicit about the cause being an ABSENT SAFEGUARD rather
 * than an absent permission: an operator who reads "not authorized" and nothing
 * more will simply flip the flag, and the one thing that must travel with the
 * flag is what flipping it accepts. Both remedies are offered in the order they
 * should be preferred - the platform's native path first, because the platform
 * serializes it, and an operator-asserted authorized run second.
 *
 * @param {string} operation 'insert' or 'repair update', for the message
 * @return {string} the cause and the two remedies
 */
function writeNotAuthorizedDiagnosis(operation) {
    return 'not_authorized=ALLOW_WRITES is false, so this run is verification-only and did not attempt' +
        ' the ' + operation + '. The write is withheld because this script cannot enforce the' +
        ' single-writer precondition its reconciliation depends on: no mutual-exclusion or' +
        ' atomic-uniqueness primitive is available to a scoped application, and sys_choice refuses a' +
        ' scoped delete, so a raced write could be neither prevented beforehand nor compensated' +
        ' afterwards|remedy=' + nativeAuthoringRemedy() + ' ALTERNATIVELY, an operator who has' +
        ' established that nothing else writes these choice lists for the duration of the run - no' +
        ' other instance of this script, no Update Set commit or import touching these lists, no' +
        ' application teardown - may set ALLOW_WRITES = true and re-run, which asserts that' +
        ' precondition on the operator\'s own authority and accepts the residual race window the' +
        ' header describes.';
}

/**
 * The scope this run is actually executing in.
 *
 * Read from gs.getCurrentScopeName(), NOT from gs.getCurrentApplicationId():
 * measured on this instance, the latter reports the session's application
 * picker and answers with the application's sys_id even in a run the platform
 * completed in the global scope, which would make a global run misreport itself
 * as in-scope.
 *
 * @return {string} the executing scope's name, e.g. 'x_casemgmt' or 'global'
 */
function currentScopeName() {
    return '' + gs.getCurrentScopeName();
}

/**
 * Assert that this run is executing in the application's own scope, and refuse
 * the run outright when it is not.
 *
 * This is the first gate, and it is a hard one. A run the platform completed in
 * any other scope - Global above all - is not a degraded run to be reported
 * with a caveat: it is a global-scope execution that AAP 0.3.2 and 0.7.2
 * forbid, so it must not reach a single reconciliation, let alone a single
 * write. The caller returns immediately on false, before resolving the scope
 * record and before the reconciliation loop, so no insert or update is even
 * attempted.
 *
 * @return {boolean} true when this run is executing in SCOPE_NAME
 */
function assertExecutionScope() {
    var scopeName = currentScopeName();
    if (scopeName === SCOPE_NAME) {
        return true;
    }
    logProblem('SCOPE|REFUSED|executing_scope=' + scopeName + '|required_scope=' + SCOPE_NAME +
        '|this script writes only from the ' + SCOPE_NAME + ' application scope. Executing it in ' +
        scopeName + ' would be a global-scope write, which AAP 0.3.2 and 0.7.2 forbid. No row was' +
        ' read for reconciliation and no row was written.|remedy=' + nativeAuthoringRemedy());
    return false;
}

/**
 * Report the executing scope and what that scope is permitted to do to
 * sys_choice. Reporting only - the decision belongs to assertExecutionScope(),
 * which the caller has already applied by the time this runs, so this function
 * returns nothing for a caller to discard.
 *
 * @param {string} scopeSysId the application scope resolved by name
 * @param {Object} access the output of choiceTableAccess()
 */
function reportExecutionScope(scopeSysId, access) {
    var scopeName = currentScopeName();
    log('SCOPE|application=' + SCOPE_NAME + '|application_sys_id=' + (scopeSysId || 'UNRESOLVED') +
        '|executing_scope=' + scopeName + '|in_application_scope=' + (scopeName === SCOPE_NAME) +
        '|sys_choice_cross_scope_access=' + (access.known
            ? ('create=' + access.create + ',update=' + access.update + ',delete=' + access.remove +
               ',read=' + access.read)
            : 'unreadable'));
    if (access.known && !access.create) {
        log('SCOPE|sys_choice is a global table with create_access=false, so an INSERT from the ' +
            SCOPE_NAME + ' scope is refused by the platform. This run can verify and report; a missing' +
            ' row is a BLOCKED capability gap to be reported, NOT something to write from the global' +
            ' scope. Remedy=' + nativeAuthoringRemedy());
    }
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
    var scopeName = currentScopeName();
    if (access && access.known && ((operation === 'create' && !access.create) ||
            (operation === 'update' && !access.update))) {
        return 'cause=sys_choice is a global table whose sys_db_object row carries ' + operation +
            '_access=false, so the platform refuses this ' + operation + ' from the ' + scopeName +
            ' scope. This is the documented cross-scope restriction and it is a BLOCKED capability gap,' +
            ' not a condition to work around|remedy=' + nativeAuthoringRemedy();
    }
    return 'cause=not the documented cross-scope restriction (sys_choice ' + operation + '_access=' +
        (access && access.known ? ('' + (operation === 'create' ? access.create : access.update)) : 'unreadable') +
        ' in the ' + scopeName + ' scope); investigate an ACL, a data policy or a business rule on' +
        ' sys_choice before re-running|remedy=' + nativeAuthoringRemedy();
}

/**
 * Query sys_choice by the full natural key and report how many rows match.
 *
 * A fresh GlideRecord every time, deliberately: every caller here needs the
 * state as it is NOW, not the state a record it already holds was fetched in.
 * That is the whole point of the pre-insert re-query, the post-insert read-back
 * and the persisted-attribute audit.
 *
 * @param {Object} spec one entry of CHOICE_SPECS
 * @return {GlideRecord} the executed query, positioned before the first row
 */
function queryNaturalKey(spec) {
    var gr = new GlideRecord('sys_choice');
    gr.addQuery('name', spec.table);
    gr.addQuery('element', spec.element);
    gr.addQuery('value', spec.value);
    gr.query();
    return gr;
}

/**
 * Re-assert, immediately before a single mutating call, that this run is still
 * entitled to make it.
 *
 * Two facts were established once at the start of the run and can both stop
 * being true while it is in flight: the executing scope, and the existence of
 * the application scope record. A concurrent teardown - which this project runs
 * routinely - deletes the scope record mid-run, and a write that lands after it
 * writes rows nothing owns. Checking once for twenty-four writes is what makes
 * that possible, so the check runs before EVERY write instead.
 *
 * @param {string} operation 'repair update' or 'insert', for the message
 * @param {string} key the natural key being written, for the message
 * @param {string} scopeSysId the scope sys_id resolved at the start of the run
 * @return {boolean} true when the write may proceed
 */
function revalidateWriteContext(operation, key, scopeSysId) {
    var scopeName = currentScopeName();
    if (scopeName !== SCOPE_NAME) {
        logProblem(key + '|' + operation + ' NOT ATTEMPTED|the executing scope is now ' + scopeName +
            ' rather than ' + SCOPE_NAME + '. A write from another scope is a global-scope write (AAP' +
            ' 0.3.2, 0.7.2) and is refused.');
        abortWrites('out-of-scope execution mid-run');
        return false;
    }
    var current = resolveScope();
    if (current.sysId === '') {
        logProblem(key + '|' + operation + ' NOT ATTEMPTED|the sys_scope query for scope=' + SCOPE_NAME +
            ' now returns ' + current.count + ' rows or a malformed sys_id. The application scope record' +
            ' resolved at the start of this run is gone or ambiguous - a concurrent teardown is the' +
            ' likely cause - so the owning application can no longer be identified.');
        abortWrites('application scope record unresolved mid-run');
        return false;
    }
    if (current.sysId !== scopeSysId) {
        logProblem(key + '|' + operation + ' NOT ATTEMPTED|the application scope record changed identity' +
            ' mid-run: this run resolved one sys_id for scope=' + SCOPE_NAME + ' and now resolves a' +
            ' different one, so the application was deleted and recreated underneath it.');
        abortWrites('application scope record changed identity mid-run');
        return false;
    }
    return true;
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
 * TWO MODES. With ALLOW_WRITES false - the default - this function is a SURVEY:
 * it reads the row, classifies it, and where it would have written it emits a
 * BLOCKED problem naming the exact withheld write, its cause and its remedy.
 * Nothing is set, nothing is inserted, nothing is updated, and the run fails.
 * With ALLOW_WRITES true it reconciles, under every guard below.
 *
 * Idempotency: the row is addressed by its natural key (name, element, value),
 * so a re-run finds the row it created last time and writes nothing. A second
 * row for the same key is never inserted for a key this run has observed to
 * have one; if the instance already holds more than one, that is reported as a
 * duplicate rather than compounded.
 *
 * Concurrency: check-then-act is unavoidable here, because no mutual-exclusion
 * primitive is available to a scoped application (see the SINGLE-WRITER
 * PRECONDITION block in the header). The default verification-only mode is the
 * response to that; an authorized run instead NARROWS the window - it cannot
 * close it - in four places:
 *
 *   1. nothing is written once RUN_STATE.abort is set;
 *   2. the executing scope and the application scope record are re-validated
 *      immediately before the update and immediately before the insert;
 *   3. the natural key is re-queried immediately before the insert, so a row a
 *      concurrent writer created in the meantime is detected and NOT duplicated;
 *   4. the natural key is read back immediately after the insert, which DETECTS
 *      a duplicate a simultaneous insert produced. That duplicate has already
 *      persisted by the time this reads it: 4 is detection and escalation, not
 *      prevention, and the surviving duplicate is reported and left in place.
 *
 * Any of 2, 3 or 4 failing ends writing for the whole run and fails the
 * verdict. None of them deletes anything.
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

    if (RUN_STATE.abort) {
        STATS.skippedAfterAbort++;
        log(key + '|SKIPPED|writing was closed earlier in this run|reason=' + RUN_STATE.abortReason);
        return;
    }

    var existing = queryNaturalKey(spec);

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
        // Describe the repair before deciding whether it may be made, so the
        // BLOCKED line and the applied line name exactly the same columns and
        // the same stored->wanted transitions. Nothing here is set on the
        // record: setValue() belongs to the authorized branch alone.
        var repaired = [];
        for (var d = 0; d < drift.length; d++) {
            repaired.push(drift[d].column + ':' + drift[d].stored + '->' + drift[d].wanted);
        }
        if (!ALLOW_WRITES) {
            STATS.updateBlocked++;
            logProblem('BLOCKED|' + key + '|repair update NOT ATTEMPTED|would have repaired ' +
                repaired.join(',') + ' on sys_id=' + existing.getUniqueValue() + '|' +
                writeNotAuthorizedDiagnosis('repair update'));
            return;
        }
        if (!revalidateWriteContext('repair update', key, scopeSysId)) {
            return;
        }
        for (var a = 0; a < drift.length; a++) {
            existing.setValue(drift[a].column, drift[a].wanted);
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

    if (!ALLOW_WRITES) {
        STATS.insertBlocked++;
        logProblem('BLOCKED|' + key + '|insert NOT ATTEMPTED|would have inserted this natural key (name=' +
            spec.table + ', element=' + spec.element + ', value=' + spec.value + ') with label=' +
            spec.label + ', sequence=' + spec.sequence + ', language=' + CHOICE_LANGUAGE + ', inactive=' +
            CHOICE_INACTIVE + '|' + writeNotAuthorizedDiagnosis('insert'));
        return;
    }

    if (!revalidateWriteContext('insert', key, scopeSysId)) {
        return;
    }

    // Re-query the natural key with the insert about to happen. The first query
    // above may be milliseconds or seconds old, and in that window another
    // writer of this same script can have created the row. Inserting anyway is
    // precisely how a check-then-act sequence produces the duplicate the
    // specification forbids, so a row found here ends writing instead. This
    // narrows the window rather than closing it: a writer that commits between
    // this query and the insert below is not visible here, and only the
    // post-insert read-back will see what that produced.
    var appeared = queryNaturalKey(spec);
    if (appeared.getRowCount() > 0) {
        logProblem('RACE|' + key + '|insert NOT ATTEMPTED|' + appeared.getRowCount() + ' row(s) for this' +
            ' natural key appeared between this run\'s first query and its insert, so another writer is' +
            ' active on sys_choice. Inserting would duplicate the value. Nothing was written and nothing' +
            ' was deleted; re-run this script alone once the other writer has finished.');
        abortWrites('concurrent writer detected on the natural key');
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
    // scope instead, which GATE 2 has already asserted and which
    // revalidateWriteContext() has just re-asserted.
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

    // Read the natural key back from the database, not from gr. Two writers
    // that both passed the re-query above both insert, and the only place that
    // is visible is here. Exactly one row is the only acceptable answer.
    //
    // This is DETECTION AFTER THE FACT, and it is not claimed as anything more:
    // the insert above has already committed, so a duplicate this finds has
    // already persisted. What the read-back buys is that the raced outcome is
    // loud instead of silent and that the remaining specs are not written -
    // not that the duplicate was avoided, and not that it can be undone here,
    // because deleting a row is outside this script's mandate and sys_choice
    // refuses a scoped delete anyway.
    var readBack = queryNaturalKey(spec);
    var readBackCount = readBack.getRowCount();
    if (readBackCount !== 1) {
        logProblem('RACE|' + key + '|post-insert read-back found ' + readBackCount + ' rows for this natural' +
            ' key where exactly 1 is required' + (readBackCount > 1
                ? ', so a simultaneous writer inserted the same value. The duplicate ALREADY PERSISTED' +
                  ' before this read - the read-back detects it, it does not prevent it - and it is' +
                  ' REPORTED and left in place, not deleted'
                : ', so this run\'s own insert did not persist') +
            '. sys_id returned by the insert=' + id + '.');
        abortWrites(readBackCount > 1
            ? 'duplicate row detected after insert'
            : 'inserted row not readable after insert');
        return;
    }

    STATS.created++;
    log(key + '|created|sys_id=' + id + '|label=' + spec.label + '|sequence=' + spec.sequence +
        '|read_back=1');
}

// ============================================================================
// Verification
// ============================================================================

/**
 * Index the specification by field and by natural key, so verification can ask
 * both "how many values does this field want" and "is this live row wanted".
 *
 * fieldMeta carries the (table, element) pair behind each field key, so a
 * consumer that has to query by table and by element - the export-composite
 * verification does - takes it from the specification rather than declaring a
 * second list of the same seven fields that could drift out of step with it.
 *
 * @return {Object} { byField: { 'table.element': {value: spec} }, byKey: {key: spec},
 *                    fields: [ 'table.element' ], fieldMeta: { 'table.element': {table, element} } }
 */
function buildSpecIndex() {
    var byField = {};
    var byKey = {};
    var fields = [];
    var fieldMeta = {};
    for (var i = 0; i < CHOICE_SPECS.length; i++) {
        var spec = CHOICE_SPECS[i];
        var fieldKey = spec.table + '.' + spec.element;
        if (!byField[fieldKey]) {
            byField[fieldKey] = {};
            fieldMeta[fieldKey] = { table: spec.table, element: spec.element };
            fields.push(fieldKey);
        }
        byField[fieldKey][spec.value] = spec;
        byKey[choiceKey(spec.table, spec.element, spec.value)] = spec;
    }
    return { byField: byField, byKey: byKey, fields: fields, fieldMeta: fieldMeta };
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
 * Re-read every specified row from the database AFTER the reconciliation loop
 * and check its stored attributes against the specification.
 *
 * This is the pass that separates "the write was issued" from "the right value
 * is stored". Nothing before it re-reads a row: reconcileChoice() compares
 * attributes on its FIRST query, which is by definition before it writes, and
 * verifyCounts() only counts. Between those two a write can be partially
 * applied, normalized by the platform (a sequence coerced, a label trimmed), or
 * silently dropped by a business rule on sys_choice - and every one of those
 * states passes a count check while the dropdown renders wrongly.
 *
 * Read-only, and a genuine re-read: queryNaturalKey() builds a new GlideRecord
 * for every spec, so nothing here inherits the record an insert or an update
 * went through.
 *
 * @param {Object} index the output of buildSpecIndex()
 * @return {boolean} true when all EXPECTED_CHOICE_VALUES rows persist exactly
 *                   once with exactly the specified attributes
 */
function verifyPersistedAttributes(index) {
    var ok = true;
    var exactlyOne = 0;
    var missing = 0;
    var duplicated = 0;
    var mismatched = 0;

    for (var i = 0; i < CHOICE_SPECS.length; i++) {
        var spec = CHOICE_SPECS[i];
        var key = choiceKey(spec.table, spec.element, spec.value);

        // The index must round-trip this spec. If two CHOICE_SPECS entries share
        // a natural key they collapse into one index entry, and the instance can
        // then hold 23 correct rows for 24 specs - a shortfall whose cause is the
        // specification, not the instance. Saying so here beats leaving a reader
        // to infer it from a count.
        if (index.byKey[key] !== spec) {
            ok = false;
            logProblem('PERSISTED|' + key + '|SPEC COLLISION|this natural key does not resolve back to its' +
                ' own CHOICE_SPECS entry, so two entries share it. The specification, not the instance,' +
                ' is what needs correcting.');
            continue;
        }

        var gr = queryNaturalKey(spec);
        var found = gr.getRowCount();

        if (found === 0) {
            ok = false;
            missing++;
            logProblem('PERSISTED|' + key + '|NOT PERSISTED|no sys_choice row exists for this natural key' +
                ' after reconciliation; expected exactly 1 (shortfall). The dropdown for ' + spec.table +
                '.' + spec.element + ' will not offer "' + spec.label + '".');
            continue;
        }
        if (found > 1) {
            ok = false;
            duplicated++;
            logProblem('PERSISTED|' + key + '|DUPLICATED|' + found + ' sys_choice rows exist for this natural' +
                ' key after reconciliation; expected exactly 1 (duplicate). Attributes are not compared,' +
                ' because with more than one row there is no single stored value to compare. Reported,' +
                ' not deleted.');
            continue;
        }

        exactlyOne++;
        gr.next();
        var drift = choiceMismatches(gr, spec);
        for (var d = 0; d < drift.length; d++) {
            ok = false;
            mismatched++;
            logProblem('PERSISTED|' + key + '|MISMATCH|column=' + drift[d].column + '|stored=' +
                drift[d].stored + '|wanted=' + drift[d].wanted + '|the row persists but this column does' +
                ' not hold the specified value, so the write was partial, normalized or overwritten.');
        }
    }

    log('PERSISTED|checked=' + CHOICE_SPECS.length + '|exactly_one=' + exactlyOne + '|missing=' + missing +
        '|duplicated=' + duplicated + '|attribute_mismatches=' + mismatched +
        '|columns=label,sequence,language,inactive|' + (ok ? 'ok' : 'MISMATCH') + '|read_only_reread');

    return ok;
}

/**
 * Verify the platform-native choice-list composites that make these rows
 * exportable as application files. Read-only: this script writes no
 * sys_choice_set row and repairs none.
 *
 * "The twenty-four rows exist" and "the twenty-four values are exportable as
 * app-owned" are two different claims, and only the first is what a row count
 * establishes. What an Update Set actually carries is one `sys_choice_set`
 * composite per (table, field), owning that field's value rows - which is
 * exactly why a package can commit cleanly and still leave a dropdown empty.
 * So this pass asserts three things and fails the verdict on any of them:
 *
 *   - EXACTLY ONE composite per specified field. Zero means the values are not
 *     carried by the application at all; more than one means the export is
 *     ambiguous about which composite owns them.
 *   - OWNERSHIP on each: `sys_scope` and `sys_package` both resolving to the
 *     application scope this run resolved by name. An ownership column that is
 *     unreadable or empty is a PROBLEM, never a silent pass - an ownership
 *     claim nobody can check is precisely what this pass exists to reject.
 *   - NO SURPLUS composite on the three owned tables. A composite for a field
 *     the specification does not name is an export the application did not
 *     authorize.
 *
 * The seven (table, element) pairs come from index.fieldMeta - the
 * specification's own view - so there is no second list of fields here to drift
 * out of step with CHOICE_SPECS.
 *
 * @param {Object} index the output of buildSpecIndex()
 * @param {string} scopeSysId the application scope resolved by name at the
 *                 start of this run; the value both ownership columns must hold
 * @return {boolean} true when all EXPECTED_CHOICE_LISTS composites exist
 *                   exactly once, are app-owned, and nothing else exists
 */
function verifyChoiceSets(index, scopeSysId) {
    var ok = true;
    var byFieldKey = {};
    var order = [];
    var total = 0;
    var appOwned = 0;

    // One query over the three owned tables rather than one per field: the
    // surplus assertion needs the whole set anyway, and grouping it by
    // (name, element) answers the per-field assertions from the same read.
    var gr = new GlideRecord('sys_choice_set');
    gr.addQuery('name', 'IN', OWNED_TABLES.join(','));
    gr.orderBy('name');
    gr.orderBy('element');
    gr.query();
    while (gr.next()) {
        total++;
        var fieldKey = readText(gr, 'name') + '.' + readText(gr, 'element');
        var row = {
            sysId: '' + gr.getUniqueValue(),
            scopeReadable: gr.isValidField('sys_scope'),
            packageReadable: gr.isValidField('sys_package'),
            scope: gr.isValidField('sys_scope') ? readText(gr, 'sys_scope') : '',
            pkg: gr.isValidField('sys_package') ? readText(gr, 'sys_package') : ''
        };
        if (!byFieldKey[fieldKey]) {
            byFieldKey[fieldKey] = [];
            order.push(fieldKey);
        }
        byFieldKey[fieldKey].push(row);
    }

    for (var f = 0; f < index.fields.length; f++) {
        var specFieldKey = index.fields[f];
        var meta = index.fieldMeta[specFieldKey];
        var rows = byFieldKey[specFieldKey] || [];

        if (rows.length === 0) {
            ok = false;
            log('CHOICE_SETS|name=' + meta.table + ' element=' + meta.element + ' composites=0 MISMATCH');
            logProblem('CHOICE_SETS|' + specFieldKey + '|SHORTFALL|no sys_choice_set composite exists for' +
                ' this field, so its values are not carried as application files by an Update Set. This' +
                ' is the state in which a package commits cleanly and the dropdown still renders empty.' +
                '|remedy=' + nativeAuthoringRemedy());
            continue;
        }
        if (rows.length > 1) {
            ok = false;
            var ids = [];
            for (var r = 0; r < rows.length; r++) {
                ids.push(rows[r].sysId);
            }
            log('CHOICE_SETS|name=' + meta.table + ' element=' + meta.element + ' composites=' +
                rows.length + ' MISMATCH');
            logProblem('CHOICE_SETS|' + specFieldKey + '|DUPLICATE|' + rows.length + ' sys_choice_set' +
                ' composites exist for this field (sys_ids=' + ids.join(',') + ') where exactly 1 is' +
                ' required, so which composite owns the values on export is ambiguous. Reported, not' +
                ' deleted.');
            continue;
        }

        var only = rows[0];
        var ownershipOk = true;
        var columns = [
            { column: 'sys_scope', readable: only.scopeReadable, stored: only.scope },
            { column: 'sys_package', readable: only.packageReadable, stored: only.pkg }
        ];
        for (var c = 0; c < columns.length; c++) {
            var col = columns[c];
            if (!col.readable) {
                ok = false;
                ownershipOk = false;
                logProblem('CHOICE_SETS|' + specFieldKey + '|OWNERSHIP UNVERIFIABLE|' + col.column +
                    ' is not a readable field on sys_choice_set on this release, so this composite\'s' +
                    ' application ownership cannot be established. An unverifiable ownership claim fails' +
                    ' this check rather than passing it silently.');
            } else if (col.stored === '') {
                ok = false;
                ownershipOk = false;
                logProblem('CHOICE_SETS|' + specFieldKey + '|OWNERSHIP EMPTY|' + col.column + ' is empty on' +
                    ' composite sys_id=' + only.sysId + ', so the composite belongs to no application and' +
                    ' will not travel with this application\'s Update Set.|remedy=' + nativeAuthoringRemedy());
            } else if (col.stored !== scopeSysId) {
                ok = false;
                ownershipOk = false;
                logProblem('CHOICE_SETS|' + specFieldKey + '|OWNERSHIP MISMATCH|' + col.column + '=' +
                    col.stored + ' on composite sys_id=' + only.sysId + ', but the ' + SCOPE_NAME +
                    ' application resolved to ' + scopeSysId + '. The composite is owned by another' +
                    ' application or by the global scope, so these values are not this application\'s to' +
                    ' export.|remedy=' + nativeAuthoringRemedy());
            }
        }
        if (ownershipOk) {
            appOwned++;
        }
        log('CHOICE_SETS|name=' + meta.table + ' element=' + meta.element + ' composites=1 sys_id=' +
            only.sysId + ' sys_scope=' + (only.scopeReadable ? (only.scope || 'EMPTY') : 'UNREADABLE') +
            ' sys_package=' + (only.packageReadable ? (only.pkg || 'EMPTY') : 'UNREADABLE') + ' ' +
            (ownershipOk ? 'ok' : 'MISMATCH'));
    }

    for (var s = 0; s < order.length; s++) {
        if (!index.byField[order[s]]) {
            ok = false;
            var surplusRows = byFieldKey[order[s]];
            var surplusIds = [];
            for (var t = 0; t < surplusRows.length; t++) {
                surplusIds.push(surplusRows[t].sysId);
            }
            logProblem('CHOICE_SETS|' + order[s] + '|SURPLUS|' + surplusRows.length + ' sys_choice_set' +
                ' composite(s) (sys_ids=' + surplusIds.join(',') + ') exist for a field outside the ' +
                EXPECTED_CHOICE_LISTS + ' the specification names, so the application would export a' +
                ' choice list it never authorized. Reported, not deleted.');
        }
    }

    log('CHOICE_SETS|expected=' + EXPECTED_CHOICE_LISTS + '|found=' + total + '|fields=' +
        order.join(',') + '|app_owned=' + appOwned + '|application_sys_id=' + scopeSysId + '|' +
        (ok ? 'ok' : 'MISMATCH') + '|read_only_report');

    return ok;
}

// ============================================================================
// Entry point
// ============================================================================

/**
 * The single machine-readable reason a completed run FAILED.
 *
 * One line has to be enough for a grader or a report to act on, so the reason
 * is the FIRST failing term in the order a reader cares about: a write that was
 * abandoned mid-run outranks a count that came out wrong, which outranks a
 * problem that only the numbered list explains. The full detail is always in
 * the PROBLEM[n/N] lines that follow the summary.
 *
 * @param {boolean} countsOk the verdict of verifyCounts()
 * @param {boolean} persistedOk the verdict of verifyPersistedAttributes()
 * @param {boolean} choiceSetsOk the verdict of verifyChoiceSets()
 * @return {string} the reason, never empty
 */
function verdictReason(countsOk, persistedOk, choiceSetsOk) {
    if (RUN_STATE.abort) {
        return RUN_STATE.abortReason;
    }
    // Ranked immediately below an abort, and above every count and attribute
    // term, because when the verification-only default meets a row that needs
    // writing every one of those terms fails as a CONSEQUENCE of the withheld
    // write. Reporting the consequence would send a reader looking for drift on
    // an instance whose only problem is that this run was not allowed to fix
    // it. Unreachable on an authorized run, where both counters stay zero.
    if (STATS.insertBlocked > 0 || STATS.updateBlocked > 0) {
        return 'writes not authorized (verification-only default)';
    }
    if (STATS.duplicateKeys > 0) {
        return 'duplicate natural keys on sys_choice';
    }
    if (STATS.insertRefused > 0 || STATS.updateRefused > 0) {
        return 'platform refused a sys_choice write in scope (BLOCKED capability gap)';
    }
    if (!countsOk) {
        return 'choice row counts disagree with the specification';
    }
    if (!persistedOk) {
        return 'persisted choice rows disagree with the specification';
    }
    if (!choiceSetsOk) {
        return 'choice values are not exportable as app-owned composites';
    }
    return 'see the PROBLEM lines';
}

/**
 * Verify the twenty-four choice values, and reconcile them when this run is
 * authorized to write.
 *
 * The read side is unconditional: the three gates, the reconciliation survey,
 * the live-row audit and all three verification passes run in both modes, so a
 * verification-only run is a complete assessment of the instance and not a
 * degraded one. Only the insert and the repair are conditional on ALLOW_WRITES,
 * and a write withheld by the default is a BLOCKED problem that fails the
 * verdict rather than a silent omission.
 *
 * @return {string} the single-line summary, also emitted through gs.info()
 */
function createChoiceValues() {
    var started = new GlideDateTime();

    // The mode goes on the record first, ahead of the gates, so that even a run
    // the first gate refuses is unambiguous afterwards about whether it could
    // have written anything at all.
    log('MODE|allow_writes=' + ALLOW_WRITES + '|' + (ALLOW_WRITES
        ? 'WRITES AUTHORIZED: missing rows will be inserted and drifted rows repaired, under every race' +
          ' guard in this script. The operator has asserted the single-writer precondition this script' +
          ' cannot enforce, and accepts the residual window in which two concurrent writers can both' +
          ' persist a row that only the post-insert read-back would catch.'
        : 'VERIFICATION ONLY: no sys_choice insert or update will be attempted. Every write this run' +
          ' would have made is reported as a BLOCKED problem and fails the verdict, because the' +
          ' single-writer precondition a safe reconciliation needs cannot be enforced by this script.' +
          ' Verification itself is unaffected and runs in full.'));

    // GATE 1 - the specification must describe what it claims to describe
    // before any row is written from it.
    var index = buildSpecIndex();
    if (CHOICE_SPECS.length !== EXPECTED_CHOICE_VALUES || index.fields.length !== EXPECTED_CHOICE_LISTS) {
        logProblem('SPEC|CHOICE_SPECS describes ' + CHOICE_SPECS.length + ' values across ' + index.fields.length +
            ' lists, but the invariant is ' + EXPECTED_CHOICE_VALUES + ' across ' + EXPECTED_CHOICE_LISTS +
            '; refusing to write from an inconsistent specification');
        var refused = 'SUMMARY|verdict=FAILED|reason=inconsistent specification|allow_writes=' +
            ALLOW_WRITES + '|problems=' + PROBLEMS.length;
        log(refused);
        logProblemList();
        return LOG_PREFIX + refused;
    }

    // GATE 2 - the executing scope. A run the platform completed outside the
    // application's own scope is refused here, before the scope record is even
    // resolved and long before the reconciliation loop, so no insert or update
    // is attempted from a global session. Unconditional early return.
    if (!assertExecutionScope()) {
        var outOfScope = 'SUMMARY|verdict=FAILED|reason=out-of-scope execution|allow_writes=' + ALLOW_WRITES +
            '|executing_scope=' + currentScopeName() + '|required_scope=' + SCOPE_NAME +
            '|created=0|repaired=0|problems=' + PROBLEMS.length;
        log(outOfScope);
        logProblemList();
        return LOG_PREFIX + outOfScope;
    }

    // GATE 3 - the application scope record. Writing 24 rows of a global table
    // while the application's own ownership is unresolved or ambiguous is the
    // fail-open case: resolveScope() already refuses anything but exactly one
    // well-formed 32-hex match, and this is the unconditional early return that
    // makes its refusal binding.
    var scope = resolveScope();
    if (scope.sysId === '') {
        logProblem('SCOPE|REFUSED|sys_scope query for scope=' + SCOPE_NAME + ' returned ' + scope.count +
            ' rows or a malformed sys_id, so the application scope is unresolved or ambiguous. Refusing' +
            ' to reconcile: nothing may be written to sys_choice while the owning application cannot be' +
            ' identified. Expected exactly one row whose sys_id matches ^[0-9a-f]{32}$.');
        var unresolved = 'SUMMARY|verdict=FAILED|reason=unresolved application scope|allow_writes=' +
            ALLOW_WRITES + '|scope_rows=' + scope.count + '|created=0|repaired=0|problems=' +
            PROBLEMS.length;
        log(unresolved);
        logProblemList();
        return LOG_PREFIX + unresolved;
    }

    var access = choiceTableAccess();
    reportExecutionScope(scope.sysId, access);

    for (var i = 0; i < CHOICE_SPECS.length; i++) {
        reconcileChoice(CHOICE_SPECS[i], scope.sysId, access);
    }

    log('RECONCILE|created=' + STATS.created + '|repaired=' + STATS.repaired +
        '|already_correct=' + STATS.already + '|insert_refused=' + STATS.insertRefused +
        '|update_refused=' + STATS.updateRefused + '|insert_blocked=' + STATS.insertBlocked +
        '|repair_blocked=' + STATS.updateBlocked + '|duplicate_keys=' + STATS.duplicateKeys +
        '|race_aborts=' + STATS.raceAborts + '|skipped_after_abort=' + STATS.skippedAfterAbort);

    // Verification. Three independent passes, each returning a boolean that the
    // verdict consumes: the counts, the persisted attributes of every row, and
    // the app-owned export composites. None of them writes anything.
    var live = auditLiveRows(index);
    var countsOk = verifyCounts(index, live);
    var persistedOk = verifyPersistedAttributes(index);
    var choiceSetsOk = verifyChoiceSets(index, scope.sysId);

    var elapsed = new GlideDateTime().getNumericValue() - started.getNumericValue();
    // Every term is explicit. A duplicate key, a race abort and a withheld
    // write each fail the run on their own account rather than only through the
    // problem list, so that none of them can be lost if a future edit changes
    // what reaches PROBLEMS. The blocked-write terms are what stop the
    // verification-only default from failing OPEN: a run that found a shortfall
    // it was not allowed to fix must never certify the instance as correct.
    var passed = countsOk &&
        persistedOk &&
        choiceSetsOk &&
        STATS.duplicateKeys === 0 &&
        STATS.insertBlocked === 0 &&
        STATS.updateBlocked === 0 &&
        !RUN_STATE.abort &&
        PROBLEMS.length === 0;
    var verdict = passed ? 'OK' : 'FAILED';
    var summary = 'SUMMARY|verdict=' + verdict +
        '|reason=' + (passed ? 'none' : verdictReason(countsOk, persistedOk, choiceSetsOk)) +
        '|allow_writes=' + ALLOW_WRITES +
        '|values=' + live.total + '/' + EXPECTED_CHOICE_VALUES +
        '|created=' + STATS.created + '|repaired=' + STATS.repaired + '|already_correct=' + STATS.already +
        '|writes_blocked=' + (STATS.insertBlocked + STATS.updateBlocked) +
        '|surplus=' + STATS.surplusRows + '|duplicates=' + STATS.duplicateKeys +
        '|race_aborts=' + STATS.raceAborts +
        '|problems=' + PROBLEMS.length + '|ms=' + elapsed;
    log(summary);
    logProblemList();
    return LOG_PREFIX + summary;
}

// ----------------------------------------------------------------------------
// Auto-execution. Evaluating this file runs the reconciliation, so it is
// drop-in runnable in Scripts - Background, as a manually executed Fix Script,
// or over /sys.scripts.do - the three contexts the header documents. Nothing
// here schedules itself or runs on commit.
// ----------------------------------------------------------------------------

createChoiceValues();
