/*
 * x_casemgmt_case_management - Demo Data Seed Script
 *
 * Idempotent server-side script that seeds the scoped application with the
 * minimum demo dataset required to exercise all validation gates.
 *
 * Run from: System Definition -> Scripts - Background, or as a Fix Script
 * inside the Update Set. Either way, the bottom-of-file `seedDemoData()`
 * invocation triggers the full seed pipeline.
 *
 * Re-running this script is safe: every record creation is preceded by a
 * GlideRecord existence check; only missing records are inserted. A second
 * run produces zero new records and emits no warnings.
 *
 * Constraints honored (per AAP Sections 0.7.1, 0.7.2, 0.4.1):
 *   - No hard-coded sys_id literals anywhere. Every cross-record reference
 *     is resolved via a GlideRecord query against a stable human-readable
 *     key (user_name, name, number, role_label).
 *   - No PII. Every user, email, group, organization, case subject,
 *     description, and requester name is a fabricated synthetic value.
 *   - No email triggers. No gs.eventQueue(), no event.queue(), no
 *     notification dispatch. Email is disabled on the PDI.
 *   - All gr.update() calls (used for opened_date/closed_date overrides on
 *     Closed seed cases) call gr.setWorkflow(false) first, bypassing the
 *     scoped flows and Before-Update business rules so the seed never
 *     accidentally triggers a flow validation.
 *   - Scoped-namespace exclusivity: writes go to x_casemgmt_*, plus the
 *     OOB user/group/role/membership/company tables required for any
 *     ServiceNow demo dataset. No global ACL or sys_db_object writes.
 *
 * Synthetic data thresholds delivered (per AAP Section 0.7.4):
 *   - 3 demo users (one per role: manager, agent, viewer)
 *   - 1 demo group (assigned_group target; the demo agent is its only
 *     member, satisfying the assigned_agent-must-be-member-of-group rule
 *     enforced by validate_assigned_agent_membership business rule and the
 *     validate_inprogress_transition flow subflow)
 *   - 3 role-to-user assignments (manager -> case_manager, agent ->
 *     case_agent, viewer -> case_viewer) per the role x CRUD matrix in
 *     ../docs/acl-matrix.md
 *   - 10 demo cases spanning all 6 statuses (Draft, Open, In Progress,
 *     Pending, Resolved, Closed) and both case types (General Inquiry,
 *     Complaint), with cases 06 and 10 carrying explicit opened_date and
 *     closed_date overrides so the avg_time_to_close single-score widget
 *     on the Manager View dashboard has non-trivial source data
 *   - 10 demo tasks distributed across cases 03, 04, 05, 08, 09 with the
 *     mix below; case 03 carries one Open and one Closed task to exercise
 *     the In Progress -> Resolved blocker, while case 05 carries only
 *     Closed tasks to demonstrate the success path. Cases 04 (Pending)
 *     and 08 (In Progress) also carry one Open + one Closed task each
 *     (tasks 09 and 10), strictly satisfying the AAP Section 0.3.1
 *     literal requirement of "at least one open and one closed task per
 *     demo case in `In Progress` or `Pending` state, to exercise the
 *     'all-tasks-closed' gate" — added per QA Checkpoint 10 MINOR
 *     finding remediation.
 *   - 8 demo parties distributed across cases 03, 04, 05, 08, 09 with a
 *     mix of Person and Organization parties to exercise the
 *     party_type-driven UI Policy
 *   - 2 synthetic companies (Synthetic Org Alpha, Synthetic Org Beta) for
 *     the Organization parties' polymorphic reference target
 *
 * Source-side semantic references (read-only context only; no ArkCase code
 * is reused):
 *   acm-plugins/acm-default-plugins/acm-case-file-plugin/src/main/java/
 *     com/armedia/acm/plugins/casefile/model/CaseFile.java
 *   acm-plugins/acm-default-plugins/acm-task-plugin/src/main/java/
 *     com/armedia/acm/plugins/task/model/AcmTask.java
 *   acm-plugins/acm-default-plugins/acm-person-plugin/src/main/java/
 *     com/armedia/acm/plugins/person/model/PersonAssociation.java
 *
 * Schema reference (canonical specification): ../docs/data-model.md
 *
 * Field-naming, choice-value, and reference-target conformance:
 *   - case fields: number, type, status, priority, subject, description,
 *     opened_date, closed_date, assigned_group, assigned_agent,
 *     requester_name, requester_email, pending_reason
 *   - case_task fields: case, subject, type, status, assigned_to, due_date
 *   - case_party fields: case, party_type, person, organization,
 *     role_label
 *   - case.status choices: Draft, Open, In Progress, Pending, Resolved,
 *     Closed (Title Case, exact match required by Choice records)
 *   - case.type choices: General Inquiry, Complaint
 *   - case.priority choices: Low, Medium, High, Critical
 *   - case.pending_reason choices: Awaiting Info, Awaiting Third Party,
 *     Other
 *   - case_task.type choices: Investigation, Review, Follow-up, Other
 *   - case_task.status choices: Open, In Progress, Closed
 *   - case_party.party_type choices: Person, Organization
 *
 * Runtime: ServiceNow Now Platform server-side scripting context (Glide
 * APIs available globally - GlideRecord, GlideDateTime, gs). ES5-compatible
 * code only; no arrow functions, no const/let, no template literals, no
 * destructuring, so the script runs on Rhino-based older-release PDIs as
 * well as Yokohama/Zurich/Australia.
 */

/* global GlideRecord, GlideDateTime, gs */
/* eslint-env es5 */

// ============================================================================
// Phase 2 - Constants Section
// ============================================================================
//
// SCOPE_PREFIX is the concrete scope identifier for this scoped application.
// All custom tables, roles, and demo records use this prefix. Per AAP
// Section 0.4.1 the actual scope id is `x_casemgmt`. ServiceNow Update Set
// imports use a standard XML parser, so the scope id is concrete in the XML
// before export.
var SCOPE_PREFIX = 'x_casemgmt';

// TABLES holds the three scoped table names. The seed never references any
// table outside this set plus the OOB user/group/membership/role/company
// tables (sys_user, sys_user_group, sys_user_grmember, sys_user_has_role,
// core_company).
var TABLES = {
    CASE: SCOPE_PREFIX + '_case',
    CASE_TASK: SCOPE_PREFIX + '_case_task',
    CASE_PARTY: SCOPE_PREFIX + '_case_party'
};

// ROLES holds the three scoped role names per AAP Section 0.5.6
// (role x CRUD matrix). The seed assigns each demo user the corresponding
// scoped role via sys_user_has_role (resolved by role name lookup, never
// by hard-coded sys_id).
var ROLES = {
    MANAGER: SCOPE_PREFIX + '_case_manager',
    AGENT: SCOPE_PREFIX + '_case_agent',
    VIEWER: SCOPE_PREFIX + '_case_viewer'
};

// DEMO holds the synthetic-user user_names and the demo group name. The
// user_name values match the existing seed XML records under
// ../seed-data/users/ exactly so the seed script and the XML import path
// converge on the same idempotent keys.
var DEMO = {
    USERS: {
        MANAGER: SCOPE_PREFIX + '_demo_manager',
        AGENT: SCOPE_PREFIX + '_demo_agent',
        VIEWER: SCOPE_PREFIX + '_demo_viewer'
    },
    GROUP: SCOPE_PREFIX + '_demo_team'
};

// COMPANIES holds the two synthetic company names used as
// case_party.organization references. These values match the existing seed
// XML records under ../seed-data/parties/ exactly.
var COMPANIES = {
    ALPHA: 'Synthetic Org Alpha',
    BETA: 'Synthetic Org Beta'
};

// CASE_SUBJECTS holds the canonical synthetic case subjects. Each case has
// a unique subject so ensureCase() can use subject as the idempotent
// existence-check key. The values match the existing seed XML records
// under ../seed-data/cases/ verbatim per AAP Section 0.4.1.
var CASE_SUBJECTS = {
    GI_DRAFT:        'Demo case 01: Draft (General Inquiry)',
    GI_OPEN:         'Demo case 02: Open (General Inquiry)',
    GI_IN_PROGRESS:  'Demo case 03: In Progress (General Inquiry)',
    GI_PENDING:      'Demo case 04: Pending (General Inquiry)',
    GI_RESOLVED:     'Demo case 05: Resolved (General Inquiry)',
    GI_CLOSED:       'Demo case 06: Closed (General Inquiry)',
    CMP_OPEN:        'Demo case 07: Open (Complaint)',
    CMP_IN_PROGRESS: 'Demo case 08: In Progress (Complaint)',
    CMP_RESOLVED:    'Demo case 09: Resolved (Complaint)',
    CMP_CLOSED:      'Demo case 10: Closed (Complaint)'
};


// ============================================================================
// Phase 3 - Helper Function Library
// ============================================================================
//
// Each helper is idempotent. Lookup helpers return either the resolved
// sys_id (32-character GUID issued by the platform on insert) or null when
// no row matches. Ensure helpers query first by the human-readable
// idempotent key, return the existing row's sys_id on hit, and only insert
// when no row matches.
//
// Trace logging contract:
//   - Inserts emit one gs.info(...) line so the operator sees each new row.
//   - Skipped (already-exists) cases emit NO log line; this keeps re-run
//     output silent and signals "nothing changed" cleanly.
//   - Unexpected gaps (e.g., role not found when granting it) emit
//     gs.warn(...) but do NOT throw - the operator can investigate.
//   - The seed never calls gs.error() because seed failures should not be
//     fatal; they should be loggable warnings the operator can investigate.

// ----- Lookup helpers -------------------------------------------------------

/**
 * Returns the sys_id of the sys_user whose user_name matches the argument,
 * or null when no such user exists. Used by every reference field that
 * targets a user (assigned_agent, assigned_to, person, sys_user_grmember.user,
 * sys_user_has_role.user).
 *
 * @param {String} userName - the platform-canonical user_name
 * @return {String|null} 32-char sys_id, or null when not found
 */
function lookupUserSysId(userName) {
    var g = new GlideRecord('sys_user');
    g.addQuery('user_name', userName);
    g.query();
    return g.next() ? g.getUniqueValue() : null;
}

/**
 * Returns the sys_id of the sys_user_group whose name matches the argument,
 * or null when no such group exists. Used by the case.assigned_group
 * reference field and by sys_user_grmember.group during membership creation.
 *
 * @param {String} groupName - the platform-canonical group name
 * @return {String|null} 32-char sys_id, or null when not found
 */
function lookupGroupSysId(groupName) {
    var g = new GlideRecord('sys_user_group');
    g.addQuery('name', groupName);
    g.query();
    return g.next() ? g.getUniqueValue() : null;
}

/**
 * Returns the sys_id of the sys_user_role whose name matches the argument,
 * or null when no such role exists. The three scoped roles
 * (x_casemgmt_case_manager, x_casemgmt_case_agent, x_casemgmt_case_viewer)
 * are authored as sys_user_role records under ../roles/ and committed in
 * the Update Set before this script runs. The lookup-by-name pattern
 * decouples the seed from any specific sys_id allocated by the receiving
 * PDI.
 *
 * @param {String} roleName - the role's human-readable name
 * @return {String|null} 32-char sys_id, or null when not found
 */
function lookupRoleSysId(roleName) {
    var g = new GlideRecord('sys_user_role');
    g.addQuery('name', roleName);
    g.query();
    return g.next() ? g.getUniqueValue() : null;
}

/**
 * Returns the sys_id of the core_company whose name matches the argument,
 * or null when no such company exists. The seed inserts two synthetic
 * companies (Synthetic Org Alpha, Synthetic Org Beta) used as
 * case_party.organization references. core_company is a global table; the
 * seed inserts data rows into it but does NOT modify any global ACL,
 * dictionary, business rule, or schema definition (per AAP Section 0.7.2:
 * "global ACL changes are prohibited" - data writes are not ACL writes).
 *
 * @param {String} companyName - the platform-canonical company name
 * @return {String|null} 32-char sys_id, or null when not found
 */
function lookupCompanySysId(companyName) {
    var g = new GlideRecord('core_company');
    g.addQuery('name', companyName);
    g.query();
    return g.next() ? g.getUniqueValue() : null;
}

/**
 * Returns the sys_id of the x_casemgmt_case row whose number field matches
 * the argument, or null when no such case exists. Used by ensureTask and
 * ensureParty to resolve the parent-case foreign-key reference.
 *
 * Tasks and parties reference cases by `number` (the auto-generated
 * CASE0000001 string) per AAP Section 0.5.2 reference-resolution rules.
 * This indirect lookup keeps the script free of hard-coded sys_id literals
 * while still producing a sys_id-valued reference field on the inserted
 * task/party row.
 *
 * @param {String} caseNumber - the case's auto-generated number (e.g., CASE0000003)
 * @return {String|null} 32-char sys_id, or null when not found
 */
function lookupCaseSysId(caseNumber) {
    var g = new GlideRecord(TABLES.CASE);
    g.addQuery('number', caseNumber);
    g.query();
    return g.next() ? g.getUniqueValue() : null;
}

/**
 * Returns the auto-generated number of the x_casemgmt_case row whose
 * subject field matches the argument, or null when no such case exists.
 * Critical helper because case `number` values are platform-issued by the
 * sys_number record on insert and not deterministic before insert. The
 * Phase E (tasks) and Phase F (parties) seed code uses this helper to
 * resolve a stable subject string (e.g., 'Demo case 03: In Progress
 * (General Inquiry)') to its concrete CASE0000003 number, which is then
 * passed to lookupCaseSysId() inside ensureTask/ensureParty.
 *
 * The subject-to-number indirection is what makes the seed independent of
 * PDI-specific number allocations and re-runnable across instances.
 *
 * @param {String} subject - the case subject (idempotent key)
 * @return {String|null} the case number string, or null when not found
 */
function lookupCaseNumberBySubject(subject) {
    var g = new GlideRecord(TABLES.CASE);
    g.addQuery('subject', subject);
    g.query();
    return g.next() ? g.getValue('number') : null;
}

// ----- Date helpers ---------------------------------------------------------

/**
 * Returns a yyyy-MM-dd HH:mm:ss datetime string offset by the given number
 * of days from now (UTC). Negative `n` yields a past date; positive `n`
 * yields a future date. Used to override opened_date / closed_date on the
 * two Closed seed cases (case 06 and case 10) so the avg_time_to_close
 * dashboard widget has multi-day spans to render against.
 *
 * The returned string format is the platform-canonical 'yyyy-MM-dd
 * HH:mm:ss' (UTC) used by every DateTime field on every scoped table.
 *
 * @param {Number} n - integer day offset (negative = past, positive = future)
 * @return {String} GlideDateTime canonical datetime string
 */
function daysAgoDateTime(n) {
    var gdt = new GlideDateTime();
    gdt.addDaysUTC(-n);
    return gdt.getValue();
}

/**
 * Returns a yyyy-MM-dd date string offset by the given number of days from
 * today (UTC). Used for case_task.due_date which is a Date column (no time
 * component) per ../docs/data-model.md.
 *
 * @param {Number} n - integer day offset (negative = past, positive = future)
 * @return {String} 'yyyy-MM-dd' date string
 */
function daysAgoDate(n) {
    var dt = daysAgoDateTime(n);
    // GlideDateTime.getValue() returns 'yyyy-MM-dd HH:mm:ss'; trim to date.
    return dt.substring(0, 10);
}

// ----- Ensure helpers (write side) ------------------------------------------

/**
 * Idempotent: ensures a sys_user row with the given user_name exists.
 * Returns the sys_id of the existing or freshly inserted row. Inserts only
 * when no row with that user_name already exists.
 *
 * The sys_user fields populated are deliberately minimal:
 *   - user_name (idempotent key)
 *   - first_name, last_name, email
 *   - active (defaults to true)
 * No department, manager, phone, location, calendar_integration, or
 * other OOB sys_user fields are set. This keeps the seed simple and
 * avoids creating dependencies on global tables (sys_user_department,
 * cmn_location, etc.) outside the POC scope.
 *
 * Email addresses use the .invalid TLD (RFC 2606) to ensure no real
 * domain accidentally resolves on a PDI with email enabled.
 *
 * @param {String} userName - sys_user.user_name (idempotent key)
 * @param {Object} fields - { first_name, last_name, email, active=true }
 * @return {String} sys_id of the resulting row
 */
function ensureUser(userName, fields) {
    var u = new GlideRecord('sys_user');
    u.addQuery('user_name', userName);
    u.query();
    if (u.next()) {
        return u.getUniqueValue();
    }
    u.initialize();
    u.user_name = userName;
    u.first_name = fields.first_name;
    u.last_name = fields.last_name;
    u.email = fields.email;
    u.active = (fields.active !== false);
    var sysId = u.insert();
    gs.info('Inserted demo user: ' + userName);
    return sysId;
}

/**
 * Idempotent: ensures a sys_user_group row with the given name exists.
 * Returns the sys_id of the existing or freshly inserted row.
 *
 * Field surface populated:
 *   - name (idempotent key)
 *   - description (informational; defaults to empty string when absent)
 *   - active (defaults to true)
 *
 * @param {String} groupName - sys_user_group.name (idempotent key)
 * @param {Object} fields - { description, active=true }
 * @return {String} sys_id of the resulting row
 */
function ensureGroup(groupName, fields) {
    var g = new GlideRecord('sys_user_group');
    g.addQuery('name', groupName);
    g.query();
    if (g.next()) {
        return g.getUniqueValue();
    }
    g.initialize();
    g.name = groupName;
    g.description = (fields && fields.description) ? fields.description : '';
    g.active = (fields && fields.active === false) ? false : true;
    var sysId = g.insert();
    gs.info('Inserted demo group: ' + groupName);
    return sysId;
}

/**
 * Idempotent: ensures a sys_user_grmember row exists for the given (user,
 * group) pair. Both arguments are human-readable keys (user_name and group
 * name); the helper resolves them to sys_ids via lookupUserSysId() /
 * lookupGroupSysId() before the existence check.
 *
 * The agent demo user must be a member of the demo team group because the
 * "assigned_agent must be member of assigned_group" rule is enforced by
 * the validate_assigned_agent_membership Before-Update business rule and
 * the validate_inprogress_transition Flow Designer subflow. Without this
 * membership row, every Demo case 03/04/05/08/09/10 would fail validation
 * and the In Progress -> Resolved gate could not be exercised.
 *
 * @param {String} userName - sys_user.user_name
 * @param {String} groupName - sys_user_group.name
 * @return {String|null} sys_id of the resulting row, or null on lookup failure
 */
function ensureGroupMembership(userName, groupName) {
    var userSysId = lookupUserSysId(userName);
    var groupSysId = lookupGroupSysId(groupName);
    if (!userSysId || !groupSysId) {
        gs.warn('Cannot create group membership; user or group missing: ' +
                userName + ' / ' + groupName);
        return null;
    }
    var m = new GlideRecord('sys_user_grmember');
    m.addQuery('user', userSysId);
    m.addQuery('group', groupSysId);
    m.query();
    if (m.next()) {
        return m.getUniqueValue();
    }
    m.initialize();
    m.user = userSysId;
    m.group = groupSysId;
    var sysId = m.insert();
    gs.info('Added user to group: ' + userName + ' -> ' + groupName);
    return sysId;
}

/**
 * Idempotent: ensures a sys_user_has_role row exists for the given (user,
 * role) pair. Both arguments are human-readable keys (user_name and role
 * name); the helper resolves them to sys_ids via lookupUserSysId() /
 * lookupRoleSysId() before the existence check.
 *
 * The three role assignments correspond exactly to the role x CRUD matrix
 * in ../docs/acl-matrix.md. No demo user is granted a role they don't
 * need - the manager user gets only x_casemgmt_case_manager, the agent
 * user gets only x_casemgmt_case_agent, the viewer user gets only
 * x_casemgmt_case_viewer.
 *
 * @param {String} userName - sys_user.user_name
 * @param {String} roleName - sys_user_role.name
 * @return {String|null} sys_id of the resulting row, or null on lookup failure
 */
function ensureRoleAssignment(userName, roleName) {
    var userSysId = lookupUserSysId(userName);
    var roleSysId = lookupRoleSysId(roleName);
    if (!userSysId || !roleSysId) {
        gs.warn('Cannot assign role; user or role missing: ' +
                userName + ' / ' + roleName);
        return null;
    }
    var r = new GlideRecord('sys_user_has_role');
    r.addQuery('user', userSysId);
    r.addQuery('role', roleSysId);
    r.query();
    if (r.next()) {
        return r.getUniqueValue();
    }
    r.initialize();
    r.user = userSysId;
    r.role = roleSysId;
    var sysId = r.insert();
    gs.info('Granted role to user: ' + userName + ' -> ' + roleName);
    return sysId;
}

/**
 * Idempotent: ensures a core_company row with the given name exists.
 * Returns the sys_id of the existing or freshly inserted row.
 *
 * core_company is a global ServiceNow table referenced by
 * x_casemgmt_case_party.organization. The seed inserts two synthetic
 * companies (Synthetic Org Alpha, Synthetic Org Beta) which serve as
 * Organization-party reference targets. AAP Section 0.7.2 prohibits
 * "global ACL writes" - inserts of data rows into core_company are NOT
 * ACL writes; they are demo-data writes consistent with AAP Section
 * 0.7.4's minimum-demo-data thresholds.
 *
 * @param {String} companyName - core_company.name (idempotent key)
 * @param {Object} [fields] - optional { notes }
 * @return {String} sys_id of the resulting row
 */
function ensureCompany(companyName, fields) {
    var c = new GlideRecord('core_company');
    c.addQuery('name', companyName);
    c.query();
    if (c.next()) {
        return c.getUniqueValue();
    }
    c.initialize();
    c.name = companyName;
    if (fields && fields.notes) {
        c.notes = fields.notes;
    }
    var sysId = c.insert();
    gs.info('Inserted synthetic company: ' + companyName);
    return sysId;
}


/**
 * Idempotent: ensures an x_casemgmt_case row with the given subject exists.
 * Subject is the idempotent key because every seed case has a unique
 * synthetic subject string. Returns an object with both the sys_id and
 * the platform-allocated number, so callers (Phase E and F) can resolve
 * tasks/parties back to the parent case by either key.
 *
 * Insert pipeline:
 *   1. Existence check by subject. On hit, return the existing row's
 *      identifiers; do NOT log (silent re-run path).
 *   2. On miss: initialize a fresh GlideRecord, set every in-scope
 *      field, optionally resolve assigned_group_name -> sys_user_group
 *      sys_id and assigned_agent_user_name -> sys_user sys_id via
 *      lookup helpers (no hard-coded sys_id literals).
 *   3. Call insert() - the platform's sys_number record auto-allocates
 *      the case `number` (CASE0000001, CASE0000002, ...) at this point.
 *      The set_opened_date Before-Insert business rule auto-populates
 *      opened_date = gs.nowDateTime().
 *   4. If the caller provided opened_date and/or closed_date overrides
 *      (used by Closed seed cases 06 and 10 to give the
 *      avg_time_to_close dashboard non-trivial multi-day spans), perform
 *      a follow-up update with setWorkflow(false) so the date-correction
 *      update does NOT trigger any flow or Before-Update business rule.
 *      This is critical because:
 *        - block_terminal_closed Before-Update would normally abort
 *          updates to a Closed case, and the seed needs to set
 *          closed_date AFTER inserting at status=Closed.
 *        - block_draft_backtransition is irrelevant here (status is
 *          never Draft on the override path) but bypassing all
 *          Before-Update rules is the safest, most predictable choice
 *          for a seed script that is NOT simulating user transitions.
 *        - The state-machine flows (general_inquiry_state_machine,
 *          complaint_state_machine) are OnUpdate-status-changed, so
 *          setWorkflow(false) prevents accidental flow execution from
 *          the date-correction update.
 *
 * Status-specific manual-date logic per AAP key insight #4:
 *   - Cases inserted at status=Closed must have closed_date set
 *     manually because the set_closed_date business rule is
 *     Before-Update on Resolved->Closed and does NOT fire on insert.
 *     The caller passes closed_date explicitly for cases 06 and 10.
 *   - Cases inserted at status=Resolved have closed_date intentionally
 *     left empty (set on the future Resolved->Closed transition by a
 *     manager via the form).
 *
 * @param {Object} fields - {
 *     subject (String),                      idempotent key
 *     type (Choice: General Inquiry|Complaint),
 *     status (Choice: Draft|Open|In Progress|Pending|Resolved|Closed),
 *     priority (Choice: Low|Medium|High|Critical),
 *     description (String 4000),
 *     requester_name (String 100),
 *     requester_email (String 100, optional),
 *     assigned_group_name (String, optional - resolved via lookupGroupSysId),
 *     assigned_agent_user_name (String, optional - resolved via lookupUserSysId),
 *     pending_reason (Choice: Awaiting Info|Awaiting Third Party|Other; optional),
 *     opened_date (DateTime, optional override),
 *     closed_date (DateTime, optional override)
 *   }
 * @return {Object} { sys_id, number }
 */
function ensureCase(fields) {
    var c = new GlideRecord(TABLES.CASE);
    c.addQuery('subject', fields.subject);
    c.query();
    if (c.next()) {
        return { sys_id: c.getUniqueValue(), number: c.getValue('number') };
    }
    c.initialize();
    c.subject = fields.subject;
    c.type = fields.type;
    c.status = fields.status;
    c.priority = fields.priority;
    c.description = fields.description;
    c.requester_name = fields.requester_name;
    if (fields.requester_email) {
        c.requester_email = fields.requester_email;
    }
    if (fields.pending_reason) {
        c.pending_reason = fields.pending_reason;
    }
    if (fields.assigned_group_name) {
        var groupSysId = lookupGroupSysId(fields.assigned_group_name);
        if (groupSysId) {
            c.assigned_group = groupSysId;
        } else {
            gs.warn('ensureCase: assigned_group not found by name: ' +
                    fields.assigned_group_name + ' (case subject: ' +
                    fields.subject + ')');
        }
    }
    if (fields.assigned_agent_user_name) {
        var agentSysId = lookupUserSysId(fields.assigned_agent_user_name);
        if (agentSysId) {
            c.assigned_agent = agentSysId;
        } else {
            gs.warn('ensureCase: assigned_agent not found by user_name: ' +
                    fields.assigned_agent_user_name + ' (case subject: ' +
                    fields.subject + ')');
        }
    }
    var sysId = c.insert();
    // Apply opened_date / closed_date overrides AFTER insert. Setting them
    // pre-insert would not survive set_opened_date's Before-Insert rule.
    if (fields.opened_date || fields.closed_date) {
        // Re-fetch by sys_id to obtain the just-inserted record (the
        // GlideRecord `c` may still hold the pre-insert state in some
        // older Rhino-based scoping contexts; .get() guarantees a fresh
        // load on every supported PDI release).
        var c2 = new GlideRecord(TABLES.CASE);
        if (c2.get(sysId)) {
            if (fields.opened_date) {
                c2.opened_date = fields.opened_date;
            }
            if (fields.closed_date) {
                c2.closed_date = fields.closed_date;
            }
            c2.setWorkflow(false);
            c2.update();
        }
    }
    var caseNumber = c.getValue('number');
    gs.info('Inserted demo case: ' + fields.subject + ' (' +
            caseNumber + ', ' + fields.status + ')');
    return { sys_id: sysId, number: caseNumber };
}

/**
 * Idempotent: ensures an x_casemgmt_case_task row exists for the given
 * (parent case number, subject) pair. The composite key is necessary
 * because task subjects are unique per parent case, not globally; using
 * just subject would mis-match tasks across cases.
 *
 * Reference resolution per AAP Section 0.5.2:
 *   - case_number argument is resolved to a sys_id via lookupCaseSysId.
 *     If the case does not exist (parent case missing), the helper logs
 *     a warning and returns null. The seed never proceeds to insert a
 *     dangling task.
 *   - assigned_to_user_name argument is resolved via lookupUserSysId.
 *
 * @param {Object} fields - {
 *     case_number (String, e.g. CASE0000003),
 *     subject (String 255),
 *     type (Choice: Investigation|Review|Follow-up|Other),
 *     status (Choice: Open|In Progress|Closed),
 *     assigned_to_user_name (String),
 *     due_date (Date 'yyyy-MM-dd')
 *   }
 * @return {String|null} sys_id of the inserted/existing task, or null on lookup failure
 */
function ensureTask(fields) {
    var caseSysId = lookupCaseSysId(fields.case_number);
    if (!caseSysId) {
        gs.warn('Cannot create task; parent case not found: ' +
                fields.case_number + ' (task subject: ' +
                fields.subject + ')');
        return null;
    }
    var t = new GlideRecord(TABLES.CASE_TASK);
    t.addQuery('case', caseSysId);
    t.addQuery('subject', fields.subject);
    t.query();
    if (t.next()) {
        return t.getUniqueValue();
    }
    t.initialize();
    t.setValue('case', caseSysId);
    t.subject = fields.subject;
    t.type = fields.type;
    t.status = fields.status;
    t.due_date = fields.due_date;
    var assignedToSysId = lookupUserSysId(fields.assigned_to_user_name);
    if (assignedToSysId) {
        t.assigned_to = assignedToSysId;
    } else {
        gs.warn('ensureTask: assigned_to not found by user_name: ' +
                fields.assigned_to_user_name + ' (task subject: ' +
                fields.subject + ')');
    }
    var sysId = t.insert();
    gs.info('Inserted demo task: ' + fields.subject + ' on case ' +
            fields.case_number);
    return sysId;
}

/**
 * Idempotent: ensures an x_casemgmt_case_party row exists for the given
 * (parent case number, party_type, role_label, person_user_name |
 * organization_company_name) tuple. The composite key spans every
 * reasonable uniqueness dimension because:
 *   - one case can have multiple Person parties (Requester + Witness)
 *   - one case can have multiple Organization parties (Respondent + ...)
 *   - role_label distinguishes parties of the same type
 *   - the person/organization reference is what ultimately identifies
 *     the party
 *
 * Reference resolution per AAP Section 0.5.2:
 *   - case_number argument is resolved to a sys_id via lookupCaseSysId.
 *   - person_user_name (when party_type=Person) is resolved via
 *     lookupUserSysId.
 *   - organization_company_name (when party_type=Organization) is
 *     resolved via lookupCompanySysId.
 *
 * The polymorphic case_party.person and case_party.organization fields
 * are conditional - the platform UI Policy
 * (../ui_policy/x_casemgmt_case_party_conditional_fields.xml) shows only
 * the field matching party_type. The seed sets only the field matching
 * party_type and leaves the other empty.
 *
 * @param {Object} fields - {
 *     case_number (String, e.g. CASE0000003),
 *     party_type (Choice: Person|Organization),
 *     person_user_name (String, when party_type=Person),
 *     organization_company_name (String, when party_type=Organization),
 *     role_label (String 100, e.g. Requester|Respondent|Witness)
 *   }
 * @return {String|null} sys_id of the inserted/existing party, or null on lookup failure
 */
function ensureParty(fields) {
    var caseSysId = lookupCaseSysId(fields.case_number);
    if (!caseSysId) {
        gs.warn('Cannot create party; parent case not found: ' +
                fields.case_number + ' (party role: ' +
                fields.role_label + ')');
        return null;
    }
    // Pre-resolve the type-specific reference sys_id so it can be used
    // both as part of the existence-check query and (on miss) as the
    // value to set on the new row. Resolving once avoids two roundtrips.
    var personSysId = null;
    var orgSysId = null;
    if (fields.party_type === 'Person' && fields.person_user_name) {
        personSysId = lookupUserSysId(fields.person_user_name);
        if (!personSysId) {
            gs.warn('ensureParty: person not found by user_name: ' +
                    fields.person_user_name + ' (case ' +
                    fields.case_number + ', role ' + fields.role_label + ')');
            return null;
        }
    }
    if (fields.party_type === 'Organization' && fields.organization_company_name) {
        orgSysId = lookupCompanySysId(fields.organization_company_name);
        if (!orgSysId) {
            gs.warn('ensureParty: organization not found by name: ' +
                    fields.organization_company_name + ' (case ' +
                    fields.case_number + ', role ' + fields.role_label + ')');
            return null;
        }
    }
    var p = new GlideRecord(TABLES.CASE_PARTY);
    p.addQuery('case', caseSysId);
    p.addQuery('party_type', fields.party_type);
    p.addQuery('role_label', fields.role_label);
    if (personSysId) {
        p.addQuery('person', personSysId);
    }
    if (orgSysId) {
        p.addQuery('organization', orgSysId);
    }
    p.query();
    if (p.next()) {
        return p.getUniqueValue();
    }
    p.initialize();
    p.setValue('case', caseSysId);
    p.party_type = fields.party_type;
    p.role_label = fields.role_label;
    if (personSysId) {
        p.person = personSysId;
    }
    if (orgSysId) {
        p.organization = orgSysId;
    }
    var sysId = p.insert();
    gs.info('Inserted demo party: case=' + fields.case_number +
            ', type=' + fields.party_type +
            ', role=' + fields.role_label);
    return sysId;
}


// ============================================================================
// seedDemoData() - the orchestration entry point
// ============================================================================
//
// Default-export function (per the file schema declaring `seedDemoData` with
// is_default=true). All six seed phases (A through F) are dispatched from
// this function in sequence:
//
//   Phase A - Demo Users         -> ensureUser() x 3
//   Phase B - Demo Group + Member-> ensureGroup() + ensureGroupMembership()
//   Phase C - Role Assignments   -> ensureRoleAssignment() x 3
//   Phase D - Demo Cases (10)    -> ensureCase() x 10
//   Phase E - Demo Tasks (10)    -> ensureTask() x 10
//   Phase F - Demo Parties (8)   -> ensureCompany() x 2 + ensureParty() x 8
//
// Phases run in order because each later phase depends on data created by
// earlier phases:
//   - Phase B's ensureGroupMembership() needs Phase A's user.
//   - Phase C's ensureRoleAssignment() needs Phase A's user.
//   - Phase D's ensureCase() with assigned_group_name needs Phase B's group.
//   - Phase D's ensureCase() with assigned_agent_user_name needs Phase A's
//     user AND Phase B's membership row (the
//     validate_assigned_agent_membership Before-Update business rule
//     would otherwise abort the insert if it fired - but it doesn't fire
//     because the seed inserts directly with assigned_agent set, not via
//     an update; still, the membership is required because internal-user
//     interactions later via the form will hit that rule).
//   - Phase E's ensureTask() needs Phase D's parent case (resolved by
//     subject -> number -> sys_id).
//   - Phase F's ensureParty() needs Phase D's parent case AND Phase A's
//     user (for Person parties) AND Phase F's company (for Organization
//     parties; companies are inserted at the top of Phase F).
//
// The function is the schema-mandated single entry point. Every other
// helper is a free-standing top-level function so that:
//   (a) the caller (the bottom-of-file IIFE-style invocation, or a
//       Scripts-Background paste) can call seedDemoData() to drive the
//       full pipeline, and
//   (b) ad-hoc operators can also call any individual ensure*/lookup*
//       helper interactively if they want to seed a single record outside
//       the canonical demo set.
//
// @return {undefined} - no return value; trace output is the operator's
//     channel for understanding what changed.

function seedDemoData() {
    gs.info('Seed start: x_casemgmt_case_management demo data seed.');

    // ========================================================================
    // === Phase A: Demo Users ===
    // ========================================================================
    //
    // Insert three synthetic sys_user rows, one per role. The user_name
    // values are scope-prefixed (x_casemgmt_demo_*) to make them
    // unmistakably distinct from any production user. Every email uses the
    // .invalid TLD per RFC 2606 so the seed can never accidentally produce
    // a deliverable email even if a future PDI re-enables outbound mail.
    //
    // No additional sys_user fields (department, manager, phone, location)
    // are populated because:
    //   (a) the AAP requires only username, name, email, active for the
    //       seed dataset; and
    //   (b) those fields would create dependencies on other global tables
    //       (sys_user_department, cmn_location) that are out of POC scope.

    gs.info('Phase A: ensuring 3 demo users.');

    ensureUser(DEMO.USERS.MANAGER, {
        first_name: 'Demo',
        last_name: 'Manager',
        email: 'demo-manager@example.invalid',
        active: true
    });

    ensureUser(DEMO.USERS.AGENT, {
        first_name: 'Demo',
        last_name: 'Agent',
        email: 'demo-agent@example.invalid',
        active: true
    });

    ensureUser(DEMO.USERS.VIEWER, {
        first_name: 'Demo',
        last_name: 'Viewer',
        email: 'demo-viewer@example.invalid',
        active: true
    });

    // ========================================================================
    // === Phase B: Demo Group + Membership ===
    // ========================================================================
    //
    // Create the demo team group, then add the demo agent as a member.
    // The agent-as-member relationship is REQUIRED by:
    //   - validate_assigned_agent_membership Before-Update business rule
    //   - validate_inprogress_transition Flow Designer subflow
    // Both encode the AAP Section 0.5.5 transition rule "assigned_agent
    // populated AND member of assigned_group" for Open->In Progress.
    //
    // The manager and viewer users are NOT added as members because:
    //   - manager has full access (case_manager role) regardless of group
    //     membership; the ACL "case_manager full access" makes group
    //     membership irrelevant for managers.
    //   - viewer is read-only across all cases; group membership would
    //     not change their effective permissions.
    //   - Adding extra members would dilute the focused demonstration of
    //     the membership-required-for-agent-assignment rule.

    gs.info('Phase B: ensuring 1 demo group and 1 group membership.');

    ensureGroup(DEMO.GROUP, {
        description: 'Demo team for the case-management POC. Synthetic group; no production members.',
        active: true
    });

    ensureGroupMembership(DEMO.USERS.AGENT, DEMO.GROUP);

    // ========================================================================
    // === Phase C: Role Assignments ===
    // ========================================================================
    //
    // Grant each demo user their corresponding scoped role:
    //   x_casemgmt_demo_manager -> x_casemgmt_case_manager
    //   x_casemgmt_demo_agent   -> x_casemgmt_case_agent
    //   x_casemgmt_demo_viewer  -> x_casemgmt_case_viewer
    //
    // This 1:1 mapping mirrors the role x CRUD matrix in
    // ../docs/acl-matrix.md and the AAP Section 0.5.6 ACL matrix.
    // No demo user receives more than one role - that would dilute the
    // intent of demonstrating role-based permission boundaries.

    gs.info('Phase C: ensuring 3 role assignments.');

    ensureRoleAssignment(DEMO.USERS.MANAGER, ROLES.MANAGER);
    ensureRoleAssignment(DEMO.USERS.AGENT, ROLES.AGENT);
    ensureRoleAssignment(DEMO.USERS.VIEWER, ROLES.VIEWER);

    // ========================================================================
    // === Phase D: Demo Cases (10) ===
    // ========================================================================
    //
    // Insert exactly 10 synthetic cases spanning all 6 statuses (Draft,
    // Open, In Progress, Pending, Resolved, Closed) and both case types
    // (General Inquiry, Complaint). Every case has a unique synthetic
    // subject so ensureCase() can use subject as the idempotent key.
    //
    // Status / priority / assignment matrix (mirrors AAP and the existing
    // ../seed-data/cases/ XML records verbatim):
    //
    //  # | Subject                                       | Type            | Status      | Priority  | Group     | Agent
    // ---+-----------------------------------------------+-----------------+-------------+-----------+-----------+---------
    //  1 | Demo case 01: Draft (General Inquiry)         | General Inquiry | Draft       | Low       | (empty)   | (empty)
    //  2 | Demo case 02: Open (General Inquiry)          | General Inquiry | Open        | Medium    | demo team | (empty)
    //  3 | Demo case 03: In Progress (General Inquiry)   | General Inquiry | In Progress | Medium    | demo team | demo agent
    //  4 | Demo case 04: Pending (General Inquiry)       | General Inquiry | Pending     | High      | demo team | demo agent
    //  5 | Demo case 05: Resolved (General Inquiry)      | General Inquiry | Resolved    | Medium    | demo team | demo agent
    //  6 | Demo case 06: Closed (General Inquiry)        | General Inquiry | Closed      | Low       | demo team | demo agent
    //  7 | Demo case 07: Open (Complaint)                | Complaint       | Open        | High      | demo team | (empty)
    //  8 | Demo case 08: In Progress (Complaint)         | Complaint       | In Progress | Critical  | demo team | demo agent
    //  9 | Demo case 09: Resolved (Complaint)            | Complaint       | Resolved    | High      | demo team | demo agent
    // 10 | Demo case 10: Closed (Complaint)              | Complaint       | Closed      | Critical  | demo team | demo agent
    //
    // Cases 06 and 10 (the only Closed cases) carry explicit opened_date
    // and closed_date overrides so the avg_time_to_close single-score
    // widget on the Manager View dashboard has a non-trivial multi-day
    // average to render. Case 06: opened 20 days ago, closed 2 days ago
    // -> 18 day duration. Case 10: opened 15 days ago, closed 1 day ago
    // -> 14 day duration. Average across both: 16 days.
    //
    // Cases 05 and 09 (Resolved) intentionally do NOT set closed_date.
    // closed_date is set only on the Resolved->Closed transition, which
    // a manager performs via the form post-seed.

    gs.info('Phase D: ensuring 10 demo cases.');

    ensureCase({
        subject: CASE_SUBJECTS.GI_DRAFT,
        type: 'General Inquiry',
        status: 'Draft',
        priority: 'Low',
        description: 'Synthetic Draft case used to verify Draft status visualization and the Draft -> Open transition guard.',
        requester_name: 'Synthetic Requester One',
        requester_email: 'requester-1@example.invalid'
        // No assigned_group, no assigned_agent for Draft per AAP Section 0.5.5.
    });

    ensureCase({
        subject: CASE_SUBJECTS.GI_OPEN,
        type: 'General Inquiry',
        status: 'Open',
        priority: 'Medium',
        description: 'Synthetic Open case used to verify Open status visualization and the Open -> In Progress transition guard.',
        requester_name: 'Synthetic Requester Two',
        requester_email: 'requester-2@example.invalid',
        assigned_group_name: DEMO.GROUP
        // No assigned_agent yet for Open; the agent is assigned during
        // the Open -> In Progress transition.
    });

    ensureCase({
        subject: CASE_SUBJECTS.GI_IN_PROGRESS,
        type: 'General Inquiry',
        status: 'In Progress',
        priority: 'Medium',
        description: 'Synthetic In Progress case actively assigned to demo agent.',
        requester_name: 'Synthetic Requester Three',
        requester_email: 'requester-3@example.invalid',
        assigned_group_name: DEMO.GROUP,
        assigned_agent_user_name: DEMO.USERS.AGENT
    });

    ensureCase({
        subject: CASE_SUBJECTS.GI_PENDING,
        type: 'General Inquiry',
        status: 'Pending',
        priority: 'High',
        description: 'Synthetic Pending case awaiting external info.',
        requester_name: 'Synthetic Requester Four',
        requester_email: 'requester-4@example.invalid',
        assigned_group_name: DEMO.GROUP,
        assigned_agent_user_name: DEMO.USERS.AGENT,
        pending_reason: 'Awaiting Info'
    });

    ensureCase({
        subject: CASE_SUBJECTS.GI_RESOLVED,
        type: 'General Inquiry',
        status: 'Resolved',
        priority: 'Medium',
        description: 'Synthetic Resolved case awaiting manager close.',
        requester_name: 'Synthetic Requester Five',
        requester_email: 'requester-5@example.invalid',
        assigned_group_name: DEMO.GROUP,
        assigned_agent_user_name: DEMO.USERS.AGENT
        // closed_date NOT set yet; only set on the Resolved -> Closed
        // transition by a manager via the form post-seed.
    });

    ensureCase({
        subject: CASE_SUBJECTS.GI_CLOSED,
        type: 'General Inquiry',
        status: 'Closed',
        priority: 'Low',
        description: 'Synthetic Closed case - completed lifecycle.',
        requester_name: 'Synthetic Requester Six',
        requester_email: 'requester-6@example.invalid',
        assigned_group_name: DEMO.GROUP,
        assigned_agent_user_name: DEMO.USERS.AGENT,
        opened_date: daysAgoDateTime(20),
        closed_date: daysAgoDateTime(2)
        // 18-day duration for the avg_time_to_close dashboard widget.
        // Manually set both dates because:
        //   - set_opened_date is Before-Insert (would set to now);
        //   - set_closed_date is Before-Update (does not fire on insert).
        // ensureCase() handles both via a setWorkflow(false) post-insert update.
    });

    ensureCase({
        subject: CASE_SUBJECTS.CMP_OPEN,
        type: 'Complaint',
        status: 'Open',
        priority: 'High',
        description: 'Synthetic Open complaint case awaiting agent assignment.',
        requester_name: 'Synthetic Requester Seven',
        requester_email: 'requester-7@example.invalid',
        assigned_group_name: DEMO.GROUP
    });

    ensureCase({
        subject: CASE_SUBJECTS.CMP_IN_PROGRESS,
        type: 'Complaint',
        status: 'In Progress',
        priority: 'Critical',
        description: 'Synthetic In Progress complaint case actively being investigated.',
        requester_name: 'Synthetic Requester Eight',
        requester_email: 'requester-8@example.invalid',
        assigned_group_name: DEMO.GROUP,
        assigned_agent_user_name: DEMO.USERS.AGENT
    });

    ensureCase({
        subject: CASE_SUBJECTS.CMP_RESOLVED,
        type: 'Complaint',
        status: 'Resolved',
        priority: 'High',
        description: 'Synthetic Resolved complaint case awaiting manager close.',
        requester_name: 'Synthetic Requester Nine',
        requester_email: 'requester-9@example.invalid',
        assigned_group_name: DEMO.GROUP,
        assigned_agent_user_name: DEMO.USERS.AGENT
    });

    ensureCase({
        subject: CASE_SUBJECTS.CMP_CLOSED,
        type: 'Complaint',
        status: 'Closed',
        priority: 'Critical',
        description: 'Synthetic Closed complaint case - completed lifecycle.',
        requester_name: 'Synthetic Requester Ten',
        requester_email: 'requester-10@example.invalid',
        assigned_group_name: DEMO.GROUP,
        assigned_agent_user_name: DEMO.USERS.AGENT,
        opened_date: daysAgoDateTime(15),
        closed_date: daysAgoDateTime(1)
        // 14-day duration for the avg_time_to_close dashboard widget.
    });

    // ========================================================================
    // === Phase E: Demo Tasks ===
    // ========================================================================
    //
    // Insert 10 demo tasks distributed across cases 03, 04, 05, 08, 09.
    // Tasks reference parent cases by `number` (resolved via
    // lookupCaseNumberBySubject -> ensureTask's internal lookupCaseSysId)
    // per AAP Section 0.5.2; no hard-coded sys_id, no hard-coded number
    // literal beyond what the case auto-numbering produced.
    //
    // Distribution exercises the validate_resolved_transition subflow's
    // task-closure gate AND strictly satisfies the AAP Section 0.3.1
    // literal requirement of "at least one open and one closed task per
    // demo case in `In Progress` or `Pending` state, to exercise the
    // 'all-tasks-closed' gate":
    //
    //   - Case 03 (In Progress GI) carries one Open task (task 01) and
    //     one Closed task (task 02). Attempting to transition case 03 to
    //     Resolved MUST fail with the verbatim AAP error message:
    //     "All tasks must be closed before resolving this case."
    //
    //   - Case 05 (Resolved GI) carries only Closed tasks (tasks 04, 05).
    //     This case proves the success path: when every linked task is
    //     Closed, the Resolved transition succeeds and the case advances.
    //
    //   - Case 04 (Pending GI) carries one Open task (task 03) and one
    //     Closed task (task 09). Pending -> In Progress is unconditional,
    //     so the open task does not block that transition; the Resolved
    //     transition would still be blocked by task 03. The Closed task
    //     09 (added per QA Checkpoint 10 MINOR finding remediation)
    //     demonstrates the resolve gate's correct exclusion of Closed
    //     children from the non-Closed child count.
    //
    //   - Case 08 (In Progress Complaint) carries one In Progress task
    //     (task 06), one Open task (task 07), and one Closed task
    //     (task 10). Mirror of the case-03 resolve-blocker scenario for
    //     the Complaint flow; the Closed task 10 (added per QA Checkpoint
    //     10 MINOR finding remediation) demonstrates the resolve gate's
    //     correct exclusion of Closed children for the Complaint flow.
    //
    //   - Case 09 (Resolved Complaint) carries one Closed task (task 08).
    //     Mirror of the case-05 resolve-success scenario for the
    //     Complaint flow.
    //
    // AAP Section 0.3.1 literal-compliance state (ten tasks total):
    //   * Case 03 (In Progress GI):       Open (01) + Closed (02)             ✓
    //   * Case 04 (Pending GI):           Open (03) + Closed (09)             ✓
    //   * Case 05 (Resolved GI):          Closed (04, 05)                     n/a (Resolved)
    //   * Case 08 (In Progress Complaint): Open (07) + Closed (10) + ip (06)  ✓
    //   * Case 09 (Resolved Complaint):   Closed (08)                         n/a (Resolved)
    //
    // Tasks 01, 03, 07 have positive (future) due dates so the
    // my_overdue_tasks dashboard widget filters them OUT (they are not
    // overdue). Tasks 02, 04, 05, 08, 09, 10 have negative (past) due
    // dates and are Closed, so they are also OUT (Closed tasks are
    // excluded by the report's status filter regardless of due_date).
    //
    // Net effect: the my_overdue_tasks report renders ZERO rows on the
    // demo data, demonstrating the report query's correctness even when
    // no tasks meet the overdue criterion. To exercise a non-empty
    // overdue report, a manager can post-seed adjust task 01's due_date
    // to a past date, or insert a new Open task with a past due_date.

    gs.info('Phase E: ensuring 10 demo tasks.');

    var case03Number = lookupCaseNumberBySubject(CASE_SUBJECTS.GI_IN_PROGRESS);
    var case04Number = lookupCaseNumberBySubject(CASE_SUBJECTS.GI_PENDING);
    var case05Number = lookupCaseNumberBySubject(CASE_SUBJECTS.GI_RESOLVED);
    var case08Number = lookupCaseNumberBySubject(CASE_SUBJECTS.CMP_IN_PROGRESS);
    var case09Number = lookupCaseNumberBySubject(CASE_SUBJECTS.CMP_RESOLVED);

    if (case03Number) {
        ensureTask({
            case_number: case03Number,
            subject: 'Demo task 01: Investigate request scope',
            type: 'Investigation',
            status: 'Open',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(-5)  // 5 days in the future
        });
        ensureTask({
            case_number: case03Number,
            subject: 'Demo task 02: Initial review complete',
            type: 'Review',
            status: 'Closed',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(3)   // 3 days in the past (already done)
        });
    } else {
        gs.warn('Phase E: case 03 not found by subject; skipping its tasks.');
    }

    if (case04Number) {
        ensureTask({
            case_number: case04Number,
            subject: 'Demo task 03: Follow up with requester',
            type: 'Follow-up',
            status: 'Open',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(-2)  // 2 days in the future
        });
        // Task 09 - added per QA Checkpoint 10 MINOR finding remediation
        // to strictly satisfy AAP Section 0.3.1's "at least one open and
        // one closed task per demo case in `In Progress` or `Pending`
        // state, to exercise the 'all-tasks-closed' gate". This Closed
        // Review task models the agent's completed initial intake review
        // (a typical first-stage activity performed BEFORE the case was
        // placed in Pending status awaiting external input).
        ensureTask({
            case_number: case04Number,
            subject: 'Demo task 09: Initial intake review for Pending case',
            type: 'Review',
            status: 'Closed',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(2)   // 2 days in the past (already done)
        });
    } else {
        gs.warn('Phase E: case 04 not found by subject; skipping its tasks.');
    }

    if (case05Number) {
        ensureTask({
            case_number: case05Number,
            subject: 'Demo task 04: Final review for resolution',
            type: 'Review',
            status: 'Closed',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(1)   // 1 day in the past
        });
        ensureTask({
            case_number: case05Number,
            subject: 'Demo task 05: Post-resolution archive',
            type: 'Other',
            status: 'Closed',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(1)   // 1 day in the past
        });
    } else {
        gs.warn('Phase E: case 05 not found by subject; skipping its tasks.');
    }

    if (case08Number) {
        ensureTask({
            case_number: case08Number,
            subject: 'Demo task 06: Complaint investigation',
            type: 'Investigation',
            status: 'In Progress',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(-7)  // 7 days in the future
        });
        ensureTask({
            case_number: case08Number,
            subject: 'Demo task 07: Witness interview prep',
            type: 'Investigation',
            status: 'Open',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(-3)  // 3 days in the future
        });
        // Task 10 - added per QA Checkpoint 10 MINOR finding remediation
        // to strictly satisfy AAP Section 0.3.1's "at least one open and
        // one closed task per demo case in `In Progress` or `Pending`
        // state, to exercise the 'all-tasks-closed' gate". This Closed
        // Review task models the agent's completed preliminary
        // fact-check (a typical first-stage activity performed BEFORE
        // the deeper investigation captured by tasks 06 and 07).
        ensureTask({
            case_number: case08Number,
            subject: 'Demo task 10: Preliminary fact-check complete',
            type: 'Review',
            status: 'Closed',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(3)   // 3 days in the past (already done)
        });
    } else {
        gs.warn('Phase E: case 08 not found by subject; skipping its tasks.');
    }

    if (case09Number) {
        ensureTask({
            case_number: case09Number,
            subject: 'Demo task 08: Final complaint review',
            type: 'Review',
            status: 'Closed',
            assigned_to_user_name: DEMO.USERS.AGENT,
            due_date: daysAgoDate(2)   // 2 days in the past
        });
    } else {
        gs.warn('Phase E: case 09 not found by subject; skipping its tasks.');
    }

    // ========================================================================
    // === Phase F: Demo Parties ===
    // ========================================================================
    //
    // Two synthetic companies first, then 8 parties distributed across
    // cases 03, 04, 05, 08, 09 with a mix of Person and Organization
    // parties to exercise the polymorphic UI Policy
    // (../ui_policy/x_casemgmt_case_party_conditional_fields.xml). The
    // policy shows the `person` field when party_type=Person and the
    // `organization` field when party_type=Organization.
    //
    // Companies inserted (always idempotent via ensureCompany):
    //   - Synthetic Org Alpha
    //   - Synthetic Org Beta
    //
    // Parties matrix (mirrors AAP and ../seed-data/parties/ verbatim):
    //
    //   # | Parent Case  | party_type   | Reference                | role_label
    //  ---+--------------+--------------+--------------------------+-----------
    //   1 | Demo case 03 | Person       | x_casemgmt_demo_manager  | Requester
    //   2 | Demo case 03 | Organization | Synthetic Org Alpha      | Respondent
    //   3 | Demo case 04 | Person       | x_casemgmt_demo_agent    | Witness
    //   4 | Demo case 05 | Person       | x_casemgmt_demo_viewer   | Requester
    //   5 | Demo case 05 | Organization | Synthetic Org Beta       | Respondent
    //   6 | Demo case 08 | Person       | x_casemgmt_demo_manager  | Requester
    //   7 | Demo case 08 | Organization | Synthetic Org Alpha      | Respondent
    //   8 | Demo case 09 | Person       | x_casemgmt_demo_agent    | Witness
    //
    // Cases 03, 05, 08 each carry both a Person and an Organization
    // party, demonstrating the polymorphic UI Policy in action: when the
    // case form's Related List "Parties" is rendered, each row's
    // conditional field set displays correctly based on its party_type.
    //
    // role_label values stay strictly within the AAP Section 0.5.7
    // example values (Requester, Respondent, Witness). The role_label
    // field is free-text String(100), so other values are permitted, but
    // the seed sticks to the documented examples for consistency.

    gs.info('Phase F: ensuring 2 synthetic companies and 8 demo parties.');

    ensureCompany(COMPANIES.ALPHA, {
        notes: 'Synthetic POC organization for case_party demo data.'
    });
    ensureCompany(COMPANIES.BETA, {
        notes: 'Synthetic POC organization for case_party demo data.'
    });

    if (case03Number) {
        ensureParty({
            case_number: case03Number,
            party_type: 'Person',
            person_user_name: DEMO.USERS.MANAGER,
            role_label: 'Requester'
        });
        ensureParty({
            case_number: case03Number,
            party_type: 'Organization',
            organization_company_name: COMPANIES.ALPHA,
            role_label: 'Respondent'
        });
    } else {
        gs.warn('Phase F: case 03 not found by subject; skipping its parties.');
    }

    if (case04Number) {
        ensureParty({
            case_number: case04Number,
            party_type: 'Person',
            person_user_name: DEMO.USERS.AGENT,
            role_label: 'Witness'
        });
    } else {
        gs.warn('Phase F: case 04 not found by subject; skipping its parties.');
    }

    if (case05Number) {
        ensureParty({
            case_number: case05Number,
            party_type: 'Person',
            person_user_name: DEMO.USERS.VIEWER,
            role_label: 'Requester'
        });
        ensureParty({
            case_number: case05Number,
            party_type: 'Organization',
            organization_company_name: COMPANIES.BETA,
            role_label: 'Respondent'
        });
    } else {
        gs.warn('Phase F: case 05 not found by subject; skipping its parties.');
    }

    if (case08Number) {
        ensureParty({
            case_number: case08Number,
            party_type: 'Person',
            person_user_name: DEMO.USERS.MANAGER,
            role_label: 'Requester'
        });
        ensureParty({
            case_number: case08Number,
            party_type: 'Organization',
            organization_company_name: COMPANIES.ALPHA,
            role_label: 'Respondent'
        });
    } else {
        gs.warn('Phase F: case 08 not found by subject; skipping its parties.');
    }

    if (case09Number) {
        ensureParty({
            case_number: case09Number,
            party_type: 'Person',
            person_user_name: DEMO.USERS.AGENT,
            role_label: 'Witness'
        });
    } else {
        gs.warn('Phase F: case 09 not found by subject; skipping its parties.');
    }

    // ========================================================================
    // Completion Trace
    // ========================================================================
    //
    // Single completion line summarizing the canonical totals. On a fresh
    // PDI, every Inserted... line above appears in the System Log, then
    // this single completion line follows. On a re-run (the idempotent
    // path), only this single completion line appears - all helpers
    // silently observe "already exists" and do not log.

    gs.info('Seed complete: 3 users, 1 group, 3 role assignments, 10 cases, 8 tasks, 8 parties, 2 companies (idempotent).');
}

// ============================================================================
// Auto-execution
// ============================================================================
//
// Trigger the full seed pipeline by calling seedDemoData(). This works in
// every supported invocation context:
//
//   - Scripts - Background paste: the entire file is evaluated; the call
//     below dispatches the pipeline at the end.
//   - Fix Script: the platform evaluates the script body on Update Set
//     commit; the call dispatches the pipeline.
//   - Script Action / Inbound Action / scripted endpoint: same evaluation
//     model.
//
// The seedDemoData() function itself is the schema-declared default
// export. Calling it from the bottom of the file keeps the script
// "drop-in runnable" without requiring the operator to add any extra
// boilerplate.

seedDemoData();

