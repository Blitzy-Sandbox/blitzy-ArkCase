#!/usr/bin/env python3
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from evidence import run
phase = sys.argv[1]
bundle = sys.argv[2]
T = '/api/now/table/'
S = '/api/now/stats/'
def st(tbl, q): return f"{S}{tbl}?sysparm_count=true&sysparm_query={q}"
preds = [
 ('liveness_json',              T+'sys_user?sysparm_limit=1&sysparm_fields=user_name', 'json'),
 ('no_upgrade_in_progress',     T+'sys_upgrade_history?sysparm_limit=1&sysparm_query=upgrade_finishedISEMPTY&sysparm_fields=sys_id', 'count=0'),
 ('scope_x_casemgmt',           st('sys_scope','scope%3Dx_casemgmt'), 'count=0'),
 ('table_case_endpoint',        T+'x_casemgmt_case?sysparm_limit=1', 'http=400'),
 ('table_case_task_endpoint',   T+'x_casemgmt_case_task?sysparm_limit=1', 'http=400'),
 ('table_case_party_endpoint',  T+'x_casemgmt_case_party?sysparm_limit=1', 'http=400'),
 ('scoped_roles',               st('sys_user_role','nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('scoped_acls',                st('sys_security_acl','nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('scoped_acl_role_links',      st('sys_security_acl_role','sys_scope.scope%3Dx_casemgmt'), 'count=0'),
 ('scoped_role_grants',         st('sys_user_has_role','role.nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('scoped_group_role_links',    st('sys_group_has_role','role.nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('sys_app_record',             st('sys_app','scope%3Dx_casemgmt'), 'count=0'),
 ('sys_choice_rows',            st('sys_choice','nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('sys_number_counters',        st('sys_number','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('sys_dictionary_rows',        st('sys_dictionary','nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('sys_db_object_rows',         st('sys_db_object','nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('sys_documentation_rows',     st('sys_documentation','nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('flows',                      st('sys_hub_flow','sys_scope.scope%3Dx_casemgmt'), 'count=0'),
 ('business_rules',             st('sys_script','collectionSTARTSWITHx_casemgmt'), 'count=0'),
 ('client_scripts',             st('sys_script_client','tableSTARTSWITHx_casemgmt'), 'count=0'),
 ('script_includes',            st('sys_script_include','nameLIKECase'+'TransitionValidator'), 'count=0'),
 ('ui_policies',                st('sys_ui_policy','tableSTARTSWITHx_casemgmt'), 'count=0'),
 ('ui_actions',                 st('sys_ui_action','tableSTARTSWITHx_casemgmt'), 'count=0'),
 ('reports',                    st('sys_report','tableSTARTSWITHx_casemgmt'), 'count=0'),
 ('dashboards',                 st('pa_dashboards','nameLIKEx_casemgmt'), 'count=0'),
 ('portal',                     st('sp_portal','url_suffixLIKEx_casemgmt'), 'count=0'),
 ('portal_pages',               st('sp_page','idSTARTSWITHx_casemgmt'), 'count=0'),
 ('portal_widgets',             st('sp_widget','idSTARTSWITHx_casemgmt'), 'count=0'),
 ('scripted_rest',              st('sys_ws_definition','service_idSTARTSWITHcase'), 'count=0'),
 ('atf_tests',                  st('sys_atf_test','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('atf_suite',                  st('sys_atf_test_suite','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('demo_users',                 st('sys_user','user_nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('demo_groups',                st('sys_user_group','nameSTARTSWITHx_casemgmt'), 'count=0'),
 ('synthetic_companies',        st('core_company','nameSTARTSWITHSynthetic%20Org'), 'count=0'),
 ('local_update_sets_this_task',st('sys_update_set','nameLIKEx_casemgmt'), 'count=0'),
 ('local_set_children_scoped',  st('sys_update_xml','nameLIKEx_casemgmt%5Eremote_update_setISEMPTY'), 'count=0'),
 ('update_versions_scoped',     st('sys_update_version','nameLIKEx_casemgmt'), 'count=0'),
 ('atf_steps',                  st('sys_atf_step','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('app_metadata_files',         st('sys_metadata','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('metadata_delete_rows',       st('sys_metadata_delete','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('flow_snapshots',             st('sys_hub_flow_snapshot','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('flow_blocks',                st('sys_hub_flow_block','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('action_type_snapshots',      st('sys_hub_action_type_snapshot','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('table_licensing_config',     st('ua_table_licensing_config','sys_scope%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('update_versions_by_app',     st('sys_update_version','application%3D82b99028936f74320d74d6f88357a5af'), 'count=0'),
 ('local_children_by_app',      st('sys_update_xml','application%3D82b99028936f74320d74d6f88357a5af%5Eremote_update_setISEMPTY'), 'count=0'),
 ('my_retrieved_descriptors',   st('sys_remote_update_set','sys_created_on%3E%3D2026-09-09%5EnameLIKEx_casemgmt'), 'count=0'),
]
res = run(preds, bundle, phase)
bad = [r for r in res if r[3] is False]
for label, status, n, ok in res:
    print(f"{'PASS' if ok else 'FAIL'}  {label:32s} http={status} count={n}")
print(f"\n{phase}: {len(res)} predicates, {len(bad)} FAIL")
