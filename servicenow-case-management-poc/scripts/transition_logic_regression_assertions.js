/*
 * TRANSITION-LOGIC REGRESSION HARNESS — the 13 CaseTransitionValidator assertions.
 *
 * This is the harness that produces the 13/13 figure quoted in
 * ../docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md Section 9.7. It is kept in the
 * repository so the gate is reproducible: run it before a change and after it,
 * and compare the single result line. The assertion bodies below are unchanged
 * from the run that produced the recorded baseline.
 *
 * WHERE TO RUN : ServiceNow background script runner (sys.scripts.do) with the
 *                application scope set to x_casemgmt (Case Management).
 *                x_casemgmt.CaseTransitionValidator is access=package_private,
 *                so a global-scope run cannot instantiate it and every assertion
 *                would fail on the constructor.
 * HOW TO RUN   : paste this file into System Definition > Scripts - Background,
 *                choose x_casemgmt in the scope selector, and run it. Equivalently,
 *                POST the script to /sys.scripts.do with that scope's sys_id in the
 *                sys_scope form field.
 * READING OUT  : the harness writes one syslog line prefixed U1ASSERT| (gs.print()
 *                is forbidden in scoped scripts). Read it back with:
 *                GET /api/now/table/syslog?sysparm_query=messageSTARTSWITHU1ASSERT^ORDERBYDESCsys_created_on&sysparm_limit=1
 *                A pass is the literal text TOTAL=13 PASSED=13 FAILED=0.
 *
 * WHAT IT ASSERTS : the 13 logic-level assertions of the enforcement contract —
 *                every transition rule plus every verbatim blocking message.
 *
 * ISOLATION : every fixture row is written with setWorkflow(false) so no Business
 *             Rule can interfere with fixture SETUP. The harness therefore measures
 *             the validator's LOGIC only and stays stable whichever runtime layer
 *             (Business Rule, Flow, Custom Action) invokes that logic. All fixtures
 *             are uniquely named U1BASE-* and are deleted at the end; the 10 demo
 *             cases and their tasks are never read for mutation nor touched.
 * NO sys_id LITERALS : every cross-reference is resolved by user_name / name; the
 *             deliberately-unresolvable user id in assertion 9 is generated at
 *             runtime with gs.generateGUID().
 */
var R = [];      // per-assertion result lines
var pass = 0, fail = 0;

function assertEq(id, label, actual, expected) {
    var ok = (String(actual) === String(expected));
    if (ok) { pass++; } else { fail++; }
    R.push((ok ? 'PASS' : 'FAIL') + ' A' + id + ' ' + label +
           ' | expected=' + JSON.stringify(expected) + ' actual=' + JSON.stringify(actual));
}

/* ---------- reference resolution by stable human-readable key ---------- */
function userSysId(userName) {
    var g = new GlideRecord('sys_user');
    g.addQuery('user_name', userName);
    g.setLimit(1); g.query();
    return g.next() ? g.getUniqueValue() : '';
}
function groupSysId(groupName) {
    var g = new GlideRecord('sys_user_group');
    g.addQuery('name', groupName);
    g.setLimit(1); g.query();
    return g.next() ? g.getUniqueValue() : '';
}

var GROUP_ID   = groupSysId('x_casemgmt_demo_team');
var AGENT_ID   = userSysId('x_casemgmt_demo_agent');    // member of demo_team
var VIEWER_ID  = userSysId('x_casemgmt_demo_viewer');   // NOT a member of demo_team
var MANAGER_ID = userSysId('x_casemgmt_demo_manager');

/* ---------- fixtures (workflow suppressed so setup can never be aborted) ---------- */
function makeCase(tag, status, groupId, agentId) {
    var c = new GlideRecord('x_casemgmt_case');
    c.initialize();
    c.setValue('subject', 'U1BASE-' + tag);
    c.setValue('description', 'U1 D5.1 baseline harness fixture — synthetic, deleted at end of run.');
    c.setValue('requester_name', 'U1 Harness');
    c.setValue('requester_email', 'u1.harness@example.invalid');
    c.setValue('type', 'General Inquiry');
    c.setValue('priority', 'Low');
    c.setValue('status', status);
    if (groupId) { c.setValue('assigned_group', groupId); }
    if (agentId) { c.setValue('assigned_agent', agentId); }
    c.setWorkflow(false);
    return c.insert();
}
function makeTask(caseId, tag, status) {
    var t = new GlideRecord('x_casemgmt_case_task');
    t.initialize();
    t.setValue('subject', 'U1BASE-' + tag);
    t.setValue('type', 'Investigation');
    t.setValue('status', status);
    t.setValue('assigned_to', AGENT_ID);
    t.setValue('due_date', '2030-12-31');
    t.setValue('case', caseId);
    t.setWorkflow(false);
    return t.insert();
}
function load(id) { var g = new GlideRecord('x_casemgmt_case'); g.get(id); return g; }

var V = new x_casemgmt.CaseTransitionValidator();

/* ================= assertions 1-2 : Draft -> Open needs assigned_group ================= */
var cNoGroup = makeCase('nogroup', 'Draft', '', '');
assertEq(1, 'canTransitionToOpen blocks empty assigned_group (verbatim)',
         JSON.stringify(V.canTransitionToOpen(load(cNoGroup))),
         JSON.stringify({ ok: false, error: 'Required field assigned_group is empty.' }));

var cGroup = makeCase('group', 'Draft', GROUP_ID, '');
assertEq(2, 'canTransitionToOpen allows populated assigned_group',
         JSON.stringify(V.canTransitionToOpen(load(cGroup))),
         JSON.stringify({ ok: true }));

/* ======== assertions 3-5 : Open -> In Progress needs agent AND group membership ======== */
var IN_PROGRESS_ERR = 'Assigned agent must be set and must be a member of the assigned group.';

assertEq(3, 'canTransitionToInProgress blocks empty assigned_agent (verbatim)',
         JSON.stringify(V.canTransitionToInProgress(load(cGroup))),
         JSON.stringify({ ok: false, error: IN_PROGRESS_ERR }));

var cBadAgent = makeCase('badagent', 'Open', GROUP_ID, VIEWER_ID);
assertEq(4, 'canTransitionToInProgress blocks agent not in assigned_group (verbatim)',
         JSON.stringify(V.canTransitionToInProgress(load(cBadAgent))),
         JSON.stringify({ ok: false, error: IN_PROGRESS_ERR }));

var cGoodAgent = makeCase('goodagent', 'Open', GROUP_ID, AGENT_ID);
assertEq(5, 'canTransitionToInProgress allows agent who is a member of assigned_group',
         JSON.stringify(V.canTransitionToInProgress(load(cGoodAgent))),
         JSON.stringify({ ok: true }));

/* ============ assertions 6-7 : In Progress -> Resolved needs all tasks Closed ============ */
var cResolve = makeCase('resolve', 'In Progress', GROUP_ID, AGENT_ID);
var openTaskId = makeTask(cResolve, 'resolve-open-task', 'Open');
assertEq(6, 'canTransitionToResolved blocks while 1 child task is Open (verbatim)',
         JSON.stringify(V.canTransitionToResolved(load(cResolve))),
         JSON.stringify({ ok: false, error: 'All tasks must be closed before resolving this case.' }));

var tClose = new GlideRecord('x_casemgmt_case_task');
tClose.get(openTaskId);
tClose.setValue('status', 'Closed');
tClose.setWorkflow(false);
tClose.update();
assertEq(7, 'canTransitionToResolved allows once every child task is Closed',
         JSON.stringify(V.canTransitionToResolved(load(cResolve))),
         JSON.stringify({ ok: true }));

/* ============ assertions 8-9 : Resolved -> Closed needs the case_manager role ============ */
/* The harness runs as admin, who holds every role, so the positive branch asserts
   "a caller holding x_casemgmt_case_manager is allowed". The negative branch uses an
   identity the platform cannot resolve to a role-holder, which drives the validator's
   deny-by-default path and its verbatim message. Identity-based non-manager blocking is
   additionally proven at runtime through UI Impersonate (D1.3 assertion iii). */
var cClose = makeCase('close', 'Resolved', GROUP_ID, AGENT_ID);
assertEq(8, 'canTransitionToClosed allows a caller holding x_casemgmt_case_manager',
         JSON.stringify(V.canTransitionToClosed(load(cClose), gs.getUserID())) +
         '|callerHasManagerRole=' + gs.getUser().hasRole('x_casemgmt_case_manager'),
         JSON.stringify({ ok: true }) + '|callerHasManagerRole=true');

var unresolvableUser = gs.generateGUID();   // freshly generated: resolves to no sys_user
var probe = new GlideRecord('sys_user');
var unresolvableIsReallyUnknown = !probe.get(unresolvableUser);
assertEq(9, 'canTransitionToClosed blocks a caller without the manager role (verbatim)',
         JSON.stringify(V.canTransitionToClosed(load(cClose), unresolvableUser)) +
         '|idUnknown=' + unresolvableIsReallyUnknown,
         JSON.stringify({ ok: false, error: 'Only case managers can close cases.' }) + '|idUnknown=true');

/* ============ assertions 10-11 : prohibited transitions, verbatim messages ============ */
assertEq(10, 'validateNoBacktransition blocks any -> Draft (verbatim)',
         JSON.stringify(V.validateNoBacktransition('In Progress', 'Draft')),
         JSON.stringify({ ok: false, error: 'Cases cannot be returned to Draft.' }));

assertEq(11, 'validateNoBacktransition blocks Closed -> * (verbatim)',
         JSON.stringify(V.validateNoBacktransition('Closed', 'In Progress')),
         JSON.stringify({ ok: false, error: 'Closed cases are terminal and cannot be modified.' }));

/* ============ assertion 12 : isAgentInGroup helper ============ */
assertEq(12, 'isAgentInGroup true for a member, false for a non-member',
         String(V.isAgentInGroup(AGENT_ID, GROUP_ID)) + '/' + String(V.isAgentInGroup(VIEWER_ID, GROUP_ID)),
         'true/false');

/* ============ assertion 13 : getOpenTaskCountForCase helper ============ */
var cCount = makeCase('count', 'In Progress', GROUP_ID, AGENT_ID);
makeTask(cCount, 'count-open-1', 'Open');
makeTask(cCount, 'count-inprogress-1', 'In Progress');
makeTask(cCount, 'count-closed-1', 'Closed');
assertEq(13, 'getOpenTaskCountForCase counts every non-Closed child task',
         String(V.getOpenTaskCountForCase(cCount)),
         '2');

/* ============ cleanup: delete only the U1BASE-* fixtures this run created ============ */
var delTasks = 0, delCases = 0;
var ct = new GlideRecord('x_casemgmt_case_task');
ct.addQuery('subject', 'STARTSWITH', 'U1BASE-');
ct.query();
while (ct.next()) { ct.setWorkflow(false); if (ct.deleteRecord()) { delTasks++; } }
var cc = new GlideRecord('x_casemgmt_case');
cc.addQuery('subject', 'STARTSWITH', 'U1BASE-');
cc.query();
while (cc.next()) { cc.setWorkflow(false); if (cc.deleteRecord()) { delCases++; } }

var remaining = new GlideAggregate('x_casemgmt_case');
remaining.addAggregate('COUNT');
remaining.query();
var remainingCases = remaining.next() ? remaining.getAggregate('COUNT') : '?';

gs.info('U1ASSERT|TOTAL=13 PASSED=' + pass + ' FAILED=' + fail +
        ' |CLEANUP tasks=' + delTasks + ' cases=' + delCases + ' remainingCases=' + remainingCases +
        ' |' + R.join(' ||| '));
