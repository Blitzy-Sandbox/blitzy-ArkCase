#!/usr/bin/env python3
"""Residue census for QA4 finding F01.

Captures, per table, the count and the row identities of every persistent row that
names the x_casemgmt application or was created by one of the three demo personas.
Run with mode=snapshot before teardown and mode=verify after, so the before/after
counts for F01 are provable rather than asserted.
"""
import base64, json, os, sys, urllib.parse, urllib.request, datetime

URL  = os.environ['SERVICENOW_INSTANCE_ADMIN_URL'].rstrip('/')
USER = os.environ['SERVICENOW_INSTANCE_ADMIN_USERNAME']
PASS = os.environ['SERVICENOW_INSTANCE_ADMIN_PASSWORD']
AUTH = 'Basic ' + base64.b64encode(f'{USER}:{PASS}'.encode()).decode()

DEMO_USERS = ['x_casemgmt_demo_manager', 'x_casemgmt_demo_agent', 'x_casemgmt_demo_viewer']

# (label, table, encoded_query, fields_to_capture)
PREDICATES = [
    # --- exact predicates quoted in QA finding F01's reproduction steps ---
    ('f01_sys_metadata_named',        'sys_metadata',             'sys_nameLIKEx_casemgmt',        'sys_id,sys_class_name,sys_name'),
    ('f01_sys_metadata_named_upper',  'sys_metadata',             'sys_nameLIKEX_CASEMGMT',        'sys_id,sys_class_name,sys_name'),
    ('f01_navigator_history',         'sys_ui_navigator_history', 'urlLIKEx_casemgmt',             'sys_id,url,sys_created_by'),
    ('f01_recent_selection',          'sys_ui_recent_selection',  'tableSTARTSWITHx_casemgmt',     'sys_id,table,sys_created_by'),
    # --- the individual classes the finding enumerates ---
    ('f01_report_chart_color',        'sys_report_chart_color',   'sys_nameLIKEx_casemgmt',        'sys_id,sys_name'),
    ('f01_metadata_delete',           'sys_metadata_delete',      'sys_nameLIKEx_casemgmt',        'sys_id,sys_name'),
    ('f01_ui_list',                   'sys_ui_list',              'sys_nameLIKEx_casemgmt^ORnameSTARTSWITHx_casemgmt', 'sys_id,name,sys_name,view'),
    ('f01_ui_bookmark',               'sys_ui_bookmark',          'urlLIKEx_casemgmt^ORtitleLIKEx_casemgmt', 'sys_id,title,url,user'),
    # --- demo-persona-owned rows (the actors the app created) ---
    ('f01_bookmark_demo_actor',       'sys_ui_bookmark',          'sys_created_byINx_casemgmt_demo_manager,x_casemgmt_demo_agent,x_casemgmt_demo_viewer', 'sys_id,title,url,sys_created_by'),
    ('f01_presence_demo_actor',       'sys_user_presence',        'sys_created_byINx_casemgmt_demo_manager,x_casemgmt_demo_agent,x_casemgmt_demo_viewer', 'sys_id,table,document,sys_created_by'),
    ('f01_ui_list_demo_actor',        'sys_ui_list',              'sys_created_byINx_casemgmt_demo_manager,x_casemgmt_demo_agent,x_casemgmt_demo_viewer', 'sys_id,name,sys_name,sys_created_by'),
    ('f01_navhist_demo_actor',        'sys_ui_navigator_history', 'sys_created_byINx_casemgmt_demo_manager,x_casemgmt_demo_agent,x_casemgmt_demo_viewer', 'sys_id,url,sys_created_by'),
    ('f01_recentsel_demo_actor',      'sys_ui_recent_selection',  'sys_created_byINx_casemgmt_demo_manager,x_casemgmt_demo_agent,x_casemgmt_demo_viewer', 'sys_id,table,sys_created_by'),
    ('f01_ui_list_element_app',       'sys_ui_list_element',      'list_id.nameSTARTSWITHx_casemgmt', 'sys_id,list_id,element'),
    ('f01_ui_list_element_demo_actor','sys_ui_list_element',      'sys_created_byINx_casemgmt_demo_manager,x_casemgmt_demo_agent,x_casemgmt_demo_viewer', 'sys_id,list_id,element,sys_created_by'),
    ('f01_metadata_delete_broad',     'sys_metadata_delete',      'sys_nameLIKEcasemgmt',          'sys_id,sys_name'),
    ('broad_user_preference',         'sys_user_preference',      'nameLIKEcasemgmt^ORvalueLIKEcasemgmt', 'sys_id,name,value,user'),
    ('guard_presence_all',            'sys_user_presence',        'sysparm_all',                   'sys_id,sys_created_by'),
    ('guard_bookmark_all',            'sys_ui_bookmark',          'sysparm_all',                   'sys_id,title,url,sys_created_by'),
    # --- broad sweep: anything anywhere naming the scope, case-insensitively ---
    ('broad_metadata_casemgmt',       'sys_metadata',             'sys_nameLIKEcasemgmt',          'sys_id,sys_class_name,sys_name'),
    ('broad_navhist_casemgmt',        'sys_ui_navigator_history', 'urlLIKEcasemgmt',               'sys_id,url'),
    ('broad_recentsel_casemgmt',      'sys_ui_recent_selection',  'tableLIKEcasemgmt',             'sys_id,table'),
    ('broad_bookmark_casemgmt',       'sys_ui_bookmark',          'urlLIKEcasemgmt^ORtitleLIKEcasemgmt', 'sys_id,title,url'),
    ('broad_ui_list_casemgmt',        'sys_ui_list',              'nameLIKEcasemgmt^ORsys_nameLIKEcasemgmt', 'sys_id,name,sys_name'),
    # --- evidence that MUST survive (preserved, never deleted) ---
    ('preserve_atf_attachments',      'sys_attachment',           'table_name=sys_atf_test_result', 'sys_id,file_name'),
    ('preserve_atf_suite_results',    'sys_atf_test_suite_result','sysparm_all',                    'sys_id,number,status'),
    ('preserve_syslog_u1assert',      'syslog',                   'messageSTARTSWITHU1ASSERT',      'sys_id,sys_created_on'),
]

def get(path):
    req = urllib.request.Request(URL + path, headers={'Authorization': AUTH, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.status, r.read().decode()

def count(table, q):
    if q == 'sysparm_all':
        p = f'/api/now/stats/{table}?sysparm_count=true'
    else:
        p = f'/api/now/stats/{table}?sysparm_count=true&sysparm_query=' + urllib.parse.quote(q, safe='')
    st, body = get(p)
    if not body.lstrip().startswith('{'):
        return None, 'NON_JSON(hibernating?)'
    return int(json.loads(body)['result']['stats']['count']), None

def rows(table, q, fields, limit=1200):
    if q == 'sysparm_all':
        p = f'/api/now/table/{table}?sysparm_limit={limit}&sysparm_display_value=false&sysparm_fields={fields}'
    else:
        p = (f'/api/now/table/{table}?sysparm_limit={limit}&sysparm_display_value=false'
             f'&sysparm_fields={fields}&sysparm_query=' + urllib.parse.quote(q, safe=''))
    st, body = get(p)
    if not body.lstrip().startswith('{'):
        return []
    return json.loads(body)['result']

mode  = sys.argv[1] if len(sys.argv) > 1 else 'snapshot'
outf  = sys.argv[2] if len(sys.argv) > 2 else f'ev/residue_{mode}.json'
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

out = {'mode': mode, 'captured_at_utc': stamp, 'instance': URL, 'predicates': {}}
total_residue = 0
print(f'{"label":38s} {"table":28s} count')
print('-' * 82)
for label, table, q, fields in PREDICATES:
    c, err = count(table, q)
    rec = {'table': table, 'query': q, 'count': c, 'error': err}
    if c and c > 0 and not label.startswith('preserve_'):
        rec['rows'] = rows(table, q, fields)
    out['predicates'][label] = rec
    if label.startswith('f01_') and c:
        total_residue += c
    print(f'{label:38s} {table:28s} {c if c is not None else err}')
out['f01_predicate_sum'] = total_residue
os.makedirs(os.path.dirname(outf), exist_ok=True)
with open(outf, 'w') as fh:
    json.dump(out, fh, indent=1)
print('-' * 82)
print(f'F01 predicate sum (overlapping by design) = {total_residue}')
print(f'written {outf} at {stamp}')
