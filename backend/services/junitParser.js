import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'testsuite' || name === 'testcase',
});

const STATUS_PASSED = 1;
const STATUS_FAILED = 2;
const STATUS_SKIPPED = 4;

const SEPARATOR = ' > ';

function mapTestcaseStatus(testcase) {
  if (testcase.failure !== undefined || testcase.error !== undefined) return STATUS_FAILED;
  if (testcase.skipped !== undefined) return STATUS_SKIPPED;
  return STATUS_PASSED;
}

function fallbackSuiteName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `JUnit Import ${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function parseHierarchy(fullName) {
  const segments = fullName.split(SEPARATOR);
  if (segments.length === 1) {
    return { folder: null, subfolder: null, title: segments[0] };
  }
  if (segments.length === 2) {
    return { folder: segments[0], subfolder: null, title: segments[1] };
  }
  // 3+ segments: folder=first, subfolder=second, title=rest joined
  return {
    folder: segments[0],
    subfolder: segments[1],
    title: segments.slice(2).join(SEPARATOR),
  };
}

function extractTestcases(suiteArray) {
  // Key: "folder::subfolder::title" to deduplicate (last result wins)
  const seen = new Map();

  for (const suite of suiteArray) {
    const cases = suite.testcase ?? [];
    for (const tc of cases) {
      const fullName = tc['@_name'];
      if (!fullName) continue;
      const { folder, subfolder, title } = parseHierarchy(fullName);
      const key = `${folder ?? ''}::${subfolder ?? ''}::${title}`;
      seen.set(key, { folder, subfolder, title, status: mapTestcaseStatus(tc) });
    }
    if (suite.testsuite) {
      const nested = Array.isArray(suite.testsuite) ? suite.testsuite : [suite.testsuite];
      for (const [key, entry] of extractTestcases(nested)) {
        seen.set(key, entry);
      }
    }
  }
  return seen;
}

export function parseJUnit(xmlString) {
  let parsed;
  try {
    parsed = parser.parse(xmlString);
  } catch {
    throw new Error('Invalid JUnit XML format');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JUnit XML format');
  }

  let suites;
  let suiteName;

  if (parsed.testsuites) {
    suiteName = parsed.testsuites['@_name'] || null;
    const inner = parsed.testsuites.testsuite ?? [];
    suites = Array.isArray(inner) ? inner : [inner];
    if (!suiteName && suites.length > 0) {
      suiteName = suites[0]['@_name'] || null;
    }
  } else if (parsed.testsuite) {
    const root = Array.isArray(parsed.testsuite) ? parsed.testsuite[0] : parsed.testsuite;
    suiteName = root['@_name'] || null;
    suites = [root];
  } else {
    throw new Error('Invalid JUnit XML format');
  }

  const seen = extractTestcases(suites);
  const testcases = Array.from(seen.values());

  return {
    suiteName: suiteName || fallbackSuiteName(),
    testcases,
  };
}
