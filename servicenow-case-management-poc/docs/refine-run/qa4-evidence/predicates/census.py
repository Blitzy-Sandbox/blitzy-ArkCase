#!/usr/bin/env python3
"""Post-commit census: what the committed package actually installed, by direct query."""
import sys, os, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from evidence import run
phase, bundle, RID = sys.argv[1], sys.argv[2], sys.argv[3]
APP = '82b99028936f74320d74d6f88357a5af'
T, S = '/api/now/table/', '/api/now/stats/'
def st(t, q, n): return (None, f"{S}{t}?sysparm_count=true&sysparm_query={urllib.parse.quote(q, safe='')}", f'count={n}')
def named(label, t, q, n):
    _, u, e = st(t, q, n); return (label, u, e)
P = [
 ('commit_state_committed', T+'sys_remote_update_set/'+RID+'?sysparm_fields=state,inserted,updated,deleted,skipped,commit_date', 'json'),
 ('table_case_readable',      T+'x_casemgmt_case?sysparm_limit=1', 'http=200'),
 ('table_case_task_readable', T+'x_casemgmt_case_task?sysparm_limit=1', 'http=200'),
 ('table_case_party_readable',T+'x_casemgmt_case_party?sysparm_limit=1', 'http=200'),
 named('scope_row',           'sys_scope', 'scope=x_casemgmt', 1),
 named('role_manager',        'sys_user_role', 'name=x_casemgmt_case_manager', 1),
 named('role_agent',          'sys_user_role', 'name=x_casemgmt_case_agent', 1),
 named('role_viewer',         'sys_user_role', 'name=x_casemgmt_case_viewer', 1),
 named('seed_cases_10',       'x_casemgmt_case', 'numberSTARTSWITHCASE9', 10),
 named('seed_tasks_10',       'x_casemgmt_case_task', 'caseISNOTEMPTY', 10),
 named('seed_parties_8',      'x_casemgmt_case_party', 'caseISNOTEMPTY', 8),
 named('status_draft_1',      'x_casemgmt_case', 'numberSTARTSWITHCASE9^status=Draft', 1),
 named('status_open_2',       'x_casemgmt_case', 'numberSTARTSWITHCASE9^status=Open', 2),
 named('status_inprogress_2', 'x_casemgmt_case', 'numberSTARTSWITHCASE9^status=In Progress', 2),
 named('status_pending_1',    'x_casemgmt_case', 'numberSTARTSWITHCASE9^status=Pending', 1),
 named('status_resolved_2',   'x_casemgmt_case', 'numberSTARTSWITHCASE9^status=Resolved', 2),
 named('status_closed_2',     'x_casemgmt_case', 'numberSTARTSWITHCASE9^status=Closed', 2),
 named('both_case_types',     'x_casemgmt_case', 'numberSTARTSWITHCASE9^type=Complaint', 4),
 named('dictionary_48',       'sys_dictionary', 'nameSTARTSWITHx_casemgmt', 48),
 named('documentation_48',    'sys_documentation', 'nameSTARTSWITHx_casemgmt', 48),
 named('choices_24',          'sys_choice', 'nameSTARTSWITHx_casemgmt', 24),
 named('acls_29',             'sys_security_acl', 'sys_scope='+APP, 29),
 named('acl_role_links_36',   'sys_security_acl_role', 'sys_scope='+APP, 36),
 named('flows_active_7',      'sys_hub_flow', 'sys_scope='+APP+'^active=true', 7),
 named('flows_published_7',   'sys_hub_flow', 'sys_scope='+APP+'^status=published', 7),
 named('business_rules_12',   'sys_script', 'sys_scope='+APP, 12),
 named('client_scripts_3',    'sys_script_client', 'sys_scope='+APP, 3),
 named('script_includes_2',   'sys_script_include', 'sys_scope='+APP, 2),
 named('ui_policies_3',       'sys_ui_policy', 'sys_scope='+APP, 3),
 named('ui_policy_actions_12','sys_ui_policy_action', 'sys_scope='+APP, 12),
 named('ui_actions_6',        'sys_ui_action', 'sys_scope='+APP, 6),
 named('reports_8',           'sys_report', 'sys_scope='+APP, 8),
 named('dashboards_2',        'pa_dashboards', 'sys_scope='+APP, 2),
 named('portal_1',            'sp_portal', 'sys_scope='+APP, 1),
 named('portal_pages_2',      'sp_page', 'sys_scope='+APP, 2),
 named('portal_widgets_3',    'sp_widget', 'sys_scope='+APP, 3),
 named('scripted_rest_2',     'sys_ws_definition', 'sys_scope='+APP, 2),
 named('atf_tests_20',        'sys_atf_test', 'sys_scope='+APP, 20),
 named('atf_steps_179',       'sys_atf_step', 'sys_scope='+APP, 179),
 named('atf_suite_1',         'sys_atf_test_suite', 'sys_scope='+APP, 1),
 named('demo_users_3',        'sys_user', 'user_nameSTARTSWITHx_casemgmt_demo', 3),
 named('demo_groups_3',       'sys_user_group', 'nameSTARTSWITHx_casemgmt_demo', 3),
 named('group_has_role_3',    'sys_group_has_role', 'group.nameSTARTSWITHx_casemgmt_demo', 3),
 named('group_members_3',     'sys_user_grmember', 'group.nameSTARTSWITHx_casemgmt_demo', 3),
 named('derived_user_roles_3','sys_user_has_role', 'user.user_nameSTARTSWITHx_casemgmt_demo^role.nameSTARTSWITHx_casemgmt', 3),
 named('synthetic_companies_2','core_company', 'nameSTARTSWITHSynthetic Org', 2),
 named('numbers_3',           'sys_number', 'sys_scope='+APP, 3),
 named('query_range_acls_3',  'sys_security_acl', 'sys_scope='+APP+'^operation=e66cf897b7300210240b06dd1e11a9fd', 3),
 named('acl_isnewrecord_2',   'sys_security_acl', 'sys_scope='+APP+'^scriptLIKEisNewRecord', 2),
 named('ui_action_guard_2',   'sys_ui_action', 'sys_scope='+APP+'^conditionLIKEcanShowManagerAction', 2),
 named('atf_display_assert_1','sys_variable_value', 'valueLIKEdisplay rendering of the stored opened_date', 1),
 named('atf_roundtrip_2',     'sys_variable_value', 'valueLIKEdenotes the same instant as the stored UTC column', 2),
 named('atf_raw_expect_gone', 'sys_variable_value', 'valueLIKEF7 - EXACT VALUE', 0),
 ('app_metadata_files',       f"{S}sys_metadata?sysparm_count=true&sysparm_query=sys_scope%3D{APP}", 'json'),
 ('app_can_edit_in_studio',   T+'sys_app/'+APP+'?sysparm_fields=can_edit_in_studio,version,scope', 'json'),
]
res = run(P, bundle, phase)
bad = [r for r in res if r[3] is False]
for label, status, n, ok in res:
    print(('PASS ' if ok else 'FAIL ') + f"{label:28s} http={status} count={n}")
print(f"\n{phase}: {len(res)} predicates, {len(bad)} FAIL")
