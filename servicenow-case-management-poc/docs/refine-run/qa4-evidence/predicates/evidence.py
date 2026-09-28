#!/usr/bin/env python3
"""Durable evidence capture for the QA4 remediation gate (F12).
Each predicate is recorded with: label, exact URL, UTC timestamp, HTTP status, raw body (truncated at 4000 chars),
and a derived observation. Output is JSON-lines appended to a bundle file so nothing depends on a scratch dir surviving.
"""
import os, sys, json, base64, urllib.request, urllib.error, datetime, argparse

U = os.environ['SERVICENOW_INSTANCE_ADMIN_URL'].rstrip('/')
AUTH = base64.b64encode(f"{os.environ['SERVICENOW_INSTANCE_ADMIN_USERNAME']}:{os.environ['SERVICENOW_INSTANCE_ADMIN_PASSWORD']}".encode()).decode()

def req(path, accept='application/json'):
    url = path if path.startswith('http') else U + path
    r = urllib.request.Request(url, headers={'Authorization': 'Basic ' + AUTH, 'Accept': accept})
    ts = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            return url, ts, resp.status, resp.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return url, ts, e.code, e.read().decode('utf-8', 'replace')
    except Exception as e:
        return url, ts, -1, 'EXC ' + str(e)

def count_of(body):
    try:
        d = json.loads(body)
        if isinstance(d.get('result'), dict) and 'stats' in d['result']:
            return int(d['result']['stats']['count'])
        if isinstance(d.get('result'), list):
            return len(d['result'])
    except Exception:
        return None
    return None

def run(preds, bundle, phase):
    out = []
    with open(bundle, 'a') as fh:
        for label, path, expect in preds:
            url, ts, status, body = req(path)
            n = count_of(body)
            is_json = body.lstrip().startswith('{')
            rec = {'phase': phase, 'label': label, 'url': url, 'utc': ts, 'http_status': status,
                   'count': n, 'json_body': is_json, 'expect': expect,
                   'body': body if len(body) <= 4000 else body[:4000] + '…[truncated]'}
            ok = None
            if expect.startswith('count='):
                ok = (n == int(expect.split('=')[1]))
            elif expect.startswith('http='):
                ok = (status == int(expect.split('=')[1]))
            elif expect == 'json':
                ok = is_json and status == 200
            rec['pass'] = ok
            fh.write(json.dumps(rec) + '\n')
            out.append((label, status, n, ok))
    return out
