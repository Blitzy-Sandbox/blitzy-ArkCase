#!/usr/bin/env python3
"""Whole-table totals for the platform tables this teardown touches.

Run before the teardown and again after the residue deletion; the diff must show
only the app's own contribution leaving, and zero movement in any stock table
the app never wrote to. This is the evidence that F01's cleanup stayed inside
the application footprint.
"""
import base64,json,os,sys,urllib.parse,urllib.request,datetime
URL=os.environ['SERVICENOW_INSTANCE_ADMIN_URL'].rstrip('/')
A='Basic '+base64.b64encode(f"{os.environ['SERVICENOW_INSTANCE_ADMIN_USERNAME']}:{os.environ['SERVICENOW_INSTANCE_ADMIN_PASSWORD']}".encode()).decode()
TABLES=['sys_user','sys_user_group','sys_user_role','sys_user_has_role','sys_user_grmember','sys_group_has_role',
        'core_company','sys_app','sys_scope','sys_db_object','sys_dictionary','sys_documentation','sys_choice',
        'sys_number','sys_security_acl','sys_security_acl_role','sys_script','sys_script_include','sys_script_client',
        'sys_ui_policy','sys_ui_policy_action','sys_ui_action','sys_ui_list','sys_ui_list_element','sys_ui_bookmark',
        'sys_ui_navigator_history','sys_ui_recent_selection','sys_user_presence','sys_user_preference',
        'sys_report','sys_report_chart_color','pa_dashboards','sp_portal','sp_page','sp_widget','sys_ws_definition',
        'sys_hub_flow','sys_atf_test','sys_atf_step','sys_atf_test_suite','sys_metadata','sys_metadata_delete',
        'sys_update_set','sys_remote_update_set','sys_update_xml','sys_update_version','sys_upgrade_history',
        'sys_attachment','sys_atf_test_result','sys_atf_test_suite_result','syslog','sys_audit']
def cnt(t):
    p=f'/api/now/stats/{t}?sysparm_count=true'
    r=urllib.request.Request(URL+p,headers={'Authorization':A,'Accept':'application/json'})
    try:
        with urllib.request.urlopen(r,timeout=90) as x: b=x.read().decode()
    except urllib.error.HTTPError as e: return f'HTTP{e.code}'
    return int(json.loads(b)['result']['stats']['count']) if b.lstrip().startswith('{') else 'NONJSON'
label=sys.argv[1]; outf=sys.argv[2]
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
out={'label':label,'captured_at_utc':stamp,'totals':{t:cnt(t) for t in TABLES}}
os.makedirs(os.path.dirname(outf),exist_ok=True); json.dump(out,open(outf,'w'),indent=1)
print(f'{label} @ {stamp} -> {outf}')
for t,c in out['totals'].items(): print(f'  {t:28s} {c}')
