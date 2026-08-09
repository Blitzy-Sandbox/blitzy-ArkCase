#!/usr/bin/env node
/*
 * verify_artifact_references.js
 * =============================
 * Repository-relative reference validator for `servicenow-case-management-poc/`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every serialized record-definition in this deliverable carries a header comment
 * that cross-references its siblings by relative path - the Update Set load order
 * of AAP Section 0.5.2 is documented that way, and it is how a human navigates the
 * package. Those paths are prose: nothing in an XML parser or in ServiceNow checks
 * them. Twice in this project's history an artifact was deleted or moved and the
 * references to it were left behind:
 *
 *   - the standalone scope record artifact (`x_casemgmt.xml`, formerly under
 *     `app/sys_scope/`) was removed as Defect A - the duplicate Application/scope
 *     record - and 135 references to it survived across 108 files;
 *   - a `sys_script_x_casemgmt_post_import_bootstrap.xml` artifact was removed for
 *     the security reason recorded in `docs/PDI_LIMITATIONS_AND_KNOWN_ISSUES.md`,
 *     and 3 references to it survived.
 *
 * Wrong relative depth is the same class of defect and just as invisible: header
 * comments in `portal/rest/` used `../app/...` where the file's own directory is two
 * levels down, so the path pointed at nothing.
 *
 * Run this after ANY artifact is added, deleted, renamed or moved. It exits non-zero
 * when a reference does not resolve, so it can be wired into a pre-commit or CI gate.
 *
 * USAGE
 * -----
 *   node scripts/verify_artifact_references.js            # run from the POC root
 *   node scripts/verify_artifact_references.js <poc-root>  # or point it explicitly
 *
 * Exit status: 0 = every reference resolves; 1 = at least one is broken (each is
 * printed with its file, line number and the unresolved path).
 *
 * RESOLUTION RULES (these mirror how the documentation actually writes paths)
 * --------------------------------------------------------------------------
 *  1. A reference that starts with `./` or `../` is an explicit relative path and is
 *     resolved ONLY against the referring file's own directory. This is what catches
 *     wrong-depth references.
 *  2. Any other reference containing a slash is accepted if it resolves against the
 *     referring file's directory, the POC root, or the repository root - documents
 *     legitimately quote POC-root-relative and repo-root-relative paths.
 *  3. A token is not a reference when the previous line ends in `/`: the path was
 *     wrapped across two lines and the fragment on this line is only its tail.
 *  4. A token is not a reference when it sits inside an explicitly labelled
 *     AAP-verbatim quotation. AAP Section 0.3.1 names several artifacts differently
 *     from their delivered filenames (for example `reports/sys_report_x_..._.xml`
 *     against the delivered `reports/x_..._.xml`); those quotations MUST stay
 *     verbatim, so they are quoted text rather than navigable references.
 *  5. Paths into the read-only ArkCase source tree are skipped: they are semantic
 *     references to a codebase this deliverable never modifies, and they are not
 *     guaranteed to be present in every checkout.
 *  6. `update-set/` is skipped. It is the generated package; its `<payload>` blocks
 *     are record data rather than documentation and carry no relative references.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POC_ROOT = path.resolve(process.argv[2] || '.');
const REPO_ROOT = path.dirname(POC_ROOT);

/** File types whose text is scanned for references. */
const SCAN_EXT = new Set(['.xml', '.md', '.js']);

/** A slash-containing path ending in one of the extensions this package uses. */
const REF_RE = /(?<![\w.\-/])((?:\.{1,2}\/)*(?:[A-Za-z0-9_.\-]+\/)+[A-Za-z0-9_.\-]+\.(?:xml|md|js|json))/g;

/** Rule 5: the read-only ArkCase source tree and other non-navigable prefixes. */
const SKIP_SUBSTR = [
  'src/main/', 'com/armedia/', '/plugin/', 'acm-plugins/', 'acm-services/',
  'acm-standard-applications/', 'acm-forms/', 'acm-core-api/', 'node_modules/',
  'META-INF/', 'http://', 'https://',
];

/** Rule 4: markers that identify an explicitly labelled verbatim quotation. */
const AAP_QUOTE_RE = /AAP\s+Section\s+[0-9.]+|agent prompt/i;
const QUOTE_HINT_RE = /verbatim|in-scope|specification/i;

function isQuotation(lines, idx) {
  for (let k = Math.max(0, idx - 3); k < idx; k += 1) {
    if (AAP_QUOTE_RE.test(lines[k]) && QUOTE_HINT_RE.test(lines[k])) return true;
  }
  return false;
}

function isWrappedContinuation(lines, idx) {
  return idx > 0 && /\/\s*$/.test(lines[idx - 1]);
}

function resolves(ref, fileDir) {
  if (ref.startsWith('./') || ref.startsWith('../')) {
    return fs.existsSync(path.resolve(fileDir, ref));
  }
  return [fileDir, POC_ROOT, REPO_ROOT]
    .some((base) => fs.existsSync(path.resolve(base, ref)));
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      if (path.relative(POC_ROOT, full) === 'update-set') continue; // rule 6
      walk(full, out);
    } else if (SCAN_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(path.join(POC_ROOT, 'update-set'))) {
    console.error(`Not a POC root (no update-set/ directory): ${POC_ROOT}`);
    return 2;
  }

  const broken = [];
  let checked = 0;

  for (const file of walk(POC_ROOT, []).sort()) {
    const rel = path.relative(POC_ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const match of line.matchAll(REF_RE)) {
        const ref = match[1];
        if (SKIP_SUBSTR.some((s) => ref.includes(s))) continue;
        if (isWrappedContinuation(lines, i)) continue;
        if (isQuotation(lines, i)) continue;
        checked += 1;
        if (!resolves(ref, path.dirname(file))) {
          broken.push({ file: rel, line: i + 1, ref });
        }
      }
    });
  }

  console.log(`POC root:              ${POC_ROOT}`);
  console.log(`references checked:    ${checked}`);
  console.log(`broken references:     ${broken.length}`);
  if (broken.length) {
    console.log('');
    let current = null;
    for (const b of broken) {
      if (b.file !== current) {
        current = b.file;
        console.log(current);
      }
      console.log(`    L${b.line}: ${b.ref}`);
    }
    console.log('');
    console.log('Each path above does not exist. Repoint it at the surviving artifact,');
    console.log('correct its relative depth, or remove the reference.');
    return 1;
  }
  console.log('OK - every relative reference in the deliverable resolves.');
  return 0;
}

process.exit(main());
