// Pure builder functions shared by generate.js and repair.js.
// No express, no sequelize — just content generation.

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildNodeScannerScript() {
  return `#!/usr/bin/env node
/**
 * UnitTCMS sync — scans test files for @unittcms:caseId annotations and
 * reports implementation status back to UnitTCMS.
 *
 * Required env vars:
 *   UNITTCMS_URL        e.g. http://localhost:8000
 *   UNITTCMS_TOKEN      Bearer token for a UnitTCMS user
 *   UNITTCMS_PROJECT_ID numeric project ID
 *
 * Run: node scripts/unittcms-sync.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

const { UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID } = process.env;
if (!UNITTCMS_URL || !UNITTCMS_TOKEN || !UNITTCMS_PROJECT_ID) {
  console.error('Missing env vars: UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID');
  process.exit(1);
}

let commitSha = '';
try { commitSha = execSync('git rev-parse HEAD').toString().trim(); } catch (_) {}

function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory() && entry !== 'node_modules') out.push(...walk(p, exts));
    else if (exts.some((e) => entry.endsWith(e))) out.push(p);
  }
  return out;
}

function isStub(lines, annotationIdx) {
  const meaningful = lines
    .slice(annotationIdx + 1)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && l !== '});' && l !== '}');
  return meaningful.length === 0;
}

const cases = [];
const testDir = join(process.cwd(), 'tests');
for (const file of walk(testDir, ['.spec.ts', '.spec.js'])) {
  const lines = readFileSync(file, 'utf-8').split('\\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\\/\\/ @unittcms:caseId:(\\d+)/);
    if (m) {
      cases.push({
        caseId: parseInt(m[1], 10),
        status: isStub(lines, i) ? 'stub' : 'implemented',
        filePath: relative(process.cwd(), file),
      });
    }
  }
}

const res = await fetch(\`\${UNITTCMS_URL}/api/automation-configs/sync-status\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${UNITTCMS_TOKEN}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId: UNITTCMS_PROJECT_ID, commitSha, cases }),
});
if (!res.ok) { console.error('Sync failed:', await res.text()); process.exit(1); }
const data = await res.json();
console.log(\`UnitTCMS sync: \${data.updated} cases updated (commit \${commitSha.slice(0, 7)})\`);
`;
}

export function buildPythonScannerScript() {
  return `#!/usr/bin/env python3
"""
UnitTCMS sync -- scans pytest files for @pytest.mark.unittcms annotations and
reports implementation status back to UnitTCMS.

Required env vars:
  UNITTCMS_URL        e.g. http://localhost:8000
  UNITTCMS_TOKEN      Bearer token for a UnitTCMS user
  UNITTCMS_PROJECT_ID numeric project ID

Run: python scripts/unittcms_sync.py
"""
import os, re, subprocess, json
from pathlib import Path
import urllib.request

UNITTCMS_URL = os.environ.get('UNITTCMS_URL', '')
UNITTCMS_TOKEN = os.environ.get('UNITTCMS_TOKEN', '')
UNITTCMS_PROJECT_ID = os.environ.get('UNITTCMS_PROJECT_ID', '')

if not all([UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID]):
    raise SystemExit('Missing env vars: UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID')

try:
    commit_sha = subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip()
except Exception:
    commit_sha = ''

MARK_RE = re.compile(r'@pytest\\.mark\\.unittcms\\(case_id=(\\d+)\\)')

def is_stub(lines, func_idx):
    indent = len(lines[func_idx]) - len(lines[func_idx].lstrip())
    for line in lines[func_idx + 1:]:
        s = line.strip()
        if not s or s.startswith('#'):
            continue
        if len(line) - len(line.lstrip()) <= indent:
            break
        if s != 'pass':
            return False
    return True

root = Path.cwd()
cases = []
for pyfile in root.rglob('test_*.py'):
    lines = pyfile.read_text().splitlines()
    for i, line in enumerate(lines):
        m = MARK_RE.search(line)
        if m:
            func_idx = next((j for j in range(i + 1, len(lines)) if lines[j].strip().startswith('def ')), None)
            stub = is_stub(lines, func_idx) if func_idx is not None else True
            cases.append({
                'caseId': int(m.group(1)),
                'status': 'stub' if stub else 'implemented',
                'filePath': str(pyfile.relative_to(root)),
            })

body = json.dumps({'projectId': UNITTCMS_PROJECT_ID, 'commitSha': commit_sha, 'cases': cases}).encode()
req = urllib.request.Request(
    f'{UNITTCMS_URL}/api/automation-configs/sync-status',
    data=body,
    headers={'Authorization': f'Bearer {UNITTCMS_TOKEN}', 'Content-Type': 'application/json'},
    method='POST',
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
print(f"UnitTCMS sync: {data['updated']} cases updated (commit {commit_sha[:7]})")
`;
}

export function buildCIWorkflow(tool, language, provider) {
  if (provider === 'github') {
    const syncStep =
      tool === 'pytest'
        ? `      - name: Sync status to UnitTCMS\n        if: always()\n        env:\n          UNITTCMS_URL: \${{ secrets.UNITTCMS_URL }}\n          UNITTCMS_TOKEN: \${{ secrets.UNITTCMS_TOKEN }}\n          UNITTCMS_PROJECT_ID: \${{ secrets.UNITTCMS_PROJECT_ID }}\n        run: python scripts/unittcms_sync.py`
        : `      - name: Sync status to UnitTCMS\n        if: always()\n        env:\n          UNITTCMS_URL: \${{ secrets.UNITTCMS_URL }}\n          UNITTCMS_TOKEN: \${{ secrets.UNITTCMS_TOKEN }}\n          UNITTCMS_PROJECT_ID: \${{ secrets.UNITTCMS_PROJECT_ID }}\n        run: npm run sync`;

    if (tool === 'pytest') {
      return {
        path: '.github/workflows/tests.yml',
        content: `name: Tests\n\non:\n  push:\n    branches: [main]\n  pull_request:\n  workflow_dispatch:\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'\n      - run: pip install -r requirements.txt\n      - run: playwright install --with-deps chromium\n      - run: pytest\n${syncStep}\n`,
      };
    }
    return {
      path: '.github/workflows/tests.yml',
      content: `name: Tests\n\non:\n  push:\n    branches: [main]\n  pull_request:\n  workflow_dispatch:\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n          cache: 'npm'\n      - run: npm ci\n      - run: npx playwright install --with-deps chromium\n      - run: npm test\n${syncStep}\n`,
    };
  }

  // GitLab CI
  const syncScript = tool === 'pytest' ? 'python scripts/unittcms_sync.py' : 'npm run sync';
  const setupScript =
    tool === 'pytest'
      ? 'pip install -r requirements.txt && playwright install --with-deps chromium'
      : 'npm ci && npx playwright install --with-deps chromium';
  const testScript = tool === 'pytest' ? 'pytest' : 'npm test';
  return {
    path: '.gitlab-ci.yml',
    content: `stages:\n  - test\n\nvariables:\n  UNITTCMS_URL: ""\n  UNITTCMS_TOKEN: ""\n  UNITTCMS_PROJECT_ID: ""\n\ntest:\n  stage: test\n  image: ${tool === 'pytest' ? 'python:3.11' : 'mcr.microsoft.com/playwright:v1.44.0-jammy'}\n  script:\n    - ${setupScript}\n    - ${testScript}\n  after_script:\n    - ${syncScript}\n`,
  };
}

// Returns only the infrastructure files (scanner + CI workflow).
// Safe to push at any time — never includes test stubs.
export function buildCoreFiles(tool, language, provider) {
  const files = [];
  const ciFile = buildCIWorkflow(tool, language, provider);
  if (ciFile) files.push(ciFile);
  if (tool === 'pytest') {
    files.push({ path: 'scripts/unittcms_sync.py', content: buildPythonScannerScript() });
  } else {
    files.push({ path: 'scripts/unittcms-sync.mjs', content: buildNodeScannerScript() });
  }
  return files;
}
