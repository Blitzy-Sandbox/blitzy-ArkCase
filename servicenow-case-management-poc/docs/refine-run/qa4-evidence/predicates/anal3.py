"""Correct update-set analyser: payloads may wrap the real record inside a keyed container
element of the same tag, so records must be collected recursively (a record = any element with a
direct <sys_id> child holding text)."""
import sys, json, re, collections
import xml.etree.ElementTree as ET

def records(node, out):
    for ch in list(node):
        sid = ch.find('sys_id')
        if sid is not None and (sid.text or '').strip():
            out.append(ch)
        records(ch, out)
    return out

def load(path):
    root = ET.parse(path).getroot()
    blocks = root.findall('sys_update_xml')
    recs = []
    bad = 0
    for b in blocks:
        txt = (b.find('payload').text or '')
        try:
            pr = ET.fromstring(txt)
        except Exception:
            bad += 1
            continue
        records(pr, recs)
    return root, blocks, recs, bad

def analyse(path, verbose=True):
    root, blocks, recs, bad = load(path)
    carried = {}
    for k in recs:
        carried[k.find('sys_id').text.strip()] = k
    cls = collections.Counter(k.tag for k in recs)
    hexre = re.compile(r'^[0-9a-f]{32}$')
    recset = {id(k) for k in recs}
    dang = collections.Counter(); dset = collections.defaultdict(set)
    for k in recs:
        for f in list(k):
            if id(f) in recset:          # nested record, not a field
                continue
            t = (f.text or '').strip()
            if f.tag == 'sys_id':
                continue
            if hexre.match(t) and t not in carried:
                dang[f"{k.tag}.{f.tag}"] += 1
                dset[f"{k.tag}.{f.tag}"].add(t)
    if verbose:
        print(f"file={path}")
        print(f"  blocks={len(blocks)} records={len(recs)} distinct_sys_ids={len(carried)} unparseable={bad}")
    return {'root': root, 'blocks': blocks, 'recs': recs, 'carried': carried, 'cls': cls, 'dang': dang, 'dset': dset}

if __name__ == '__main__':
    a = analyse(sys.argv[1])
    print("\n--- record counts by table ---")
    for t, n in a['cls'].most_common(): print(f"  {n:5d}  {t}")
    print("\n--- dangling references (occurrences / distinct) ---")
    for k, n in a['dang'].most_common(): print(f"  {n:5d} / {len(a['dset'][k]):3d}   {k}")
    json.dump({'carried': sorted(a['carried']), 'dangling': {k: sorted(v) for k, v in a['dset'].items()}},
              open(sys.argv[2] if len(sys.argv) > 2 else 'anal3_out.json', 'w'))
