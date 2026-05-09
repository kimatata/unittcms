import { describe, it, expect } from 'vitest';
import { parseJUnit } from './junitParser.js';

const xml = (body) => `<?xml version="1.0" encoding="UTF-8"?>${body}`;

describe('parseJUnit', () => {
  it('parses flat testcase name (no separator) as CI Imports fallback', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="MySuite">
        <testcase name="plain test name"/>
      </testsuite>
    `)
    );
    expect(result.suiteName).toBe('MySuite');
    expect(result.testcases[0]).toMatchObject({ folder: null, subfolder: null, title: 'plain test name', status: 1 });
  });

  it('parses 2-segment name into folder + title', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="Auth > login should work"/>
      </testsuite>
    `)
    );
    expect(result.testcases[0]).toMatchObject({ folder: 'Auth', subfolder: null, title: 'login should work' });
  });

  it('parses 3-segment name (Vitest pattern) into folder + subfolder + title', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="src/math.test.js">
        <testcase name="Funções Matemáticas > multiply > deve multiplicar dois números positivos corretamente"/>
      </testsuite>
    `)
    );
    expect(result.testcases[0]).toMatchObject({
      folder: 'Funções Matemáticas',
      subfolder: 'multiply',
      title: 'deve multiplicar dois números positivos corretamente',
      status: 1,
    });
  });

  it('flattens 4+ segments into folder + subfolder + joined title', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="A > B > C > D > E"/>
      </testsuite>
    `)
    );
    expect(result.testcases[0]).toMatchObject({
      folder: 'A',
      subfolder: 'B',
      title: 'C > D > E',
    });
  });

  it('maps <failure> to status 2', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="Suite > scenario > deve falhar"><failure message="oops"/></testcase>
      </testsuite>
    `)
    );
    expect(result.testcases[0].status).toBe(2);
  });

  it('maps <error> to status 2', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="Suite > scenario > erro"><error/></testcase>
      </testsuite>
    `)
    );
    expect(result.testcases[0].status).toBe(2);
  });

  it('maps <skipped> to status 4', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="Suite > scenario > pulado"><skipped/></testcase>
      </testsuite>
    `)
    );
    expect(result.testcases[0].status).toBe(4);
  });

  it('treats <system-out> as passed', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="Suite > x > teste"><system-out>log</system-out></testcase>
      </testsuite>
    `)
    );
    expect(result.testcases[0].status).toBe(1);
  });

  it('uses fallback suiteName when name attribute is absent', () => {
    const result = parseJUnit(xml(`<testsuite><testcase name="A > B > c"/></testsuite>`));
    expect(result.suiteName).toMatch(/^JUnit Import \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('last duplicate (same folder+subfolder+title) wins', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="Suite > sub > dup"><failure/></testcase>
        <testcase name="Suite > sub > dup"/>
      </testsuite>
    `)
    );
    const dup = result.testcases.find((t) => t.title === 'dup');
    expect(dup.status).toBe(1);
  });

  it('same title in different subfolders are separate cases', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="S">
        <testcase name="Math > add > deve lidar com negativos"/>
        <testcase name="Math > subtract > deve lidar com negativos"/>
      </testsuite>
    `)
    );
    expect(result.testcases).toHaveLength(2);
    expect(result.testcases[0].subfolder).toBe('add');
    expect(result.testcases[1].subfolder).toBe('subtract');
  });

  it('parses <testsuites> root and derives suiteName', () => {
    const result = parseJUnit(
      xml(`
      <testsuites name="All">
        <testsuite name="A">
          <testcase name="Suite > sub > test_a"/>
        </testsuite>
      </testsuites>
    `)
    );
    expect(result.suiteName).toBe('All');
    expect(result.testcases).toHaveLength(1);
  });

  it('throws on malformed XML', () => {
    expect(() => parseJUnit('not xml <<<')).toThrow('Invalid JUnit XML format');
  });

  it('throws when no <testsuite> element present', () => {
    expect(() => parseJUnit(xml('<root><item/></root>'))).toThrow('Invalid JUnit XML format');
  });

  it('parses full Vitest example with multiple describes', () => {
    const result = parseJUnit(
      xml(`
      <testsuite name="src/math.test.js">
        <testcase name="Funções Matemáticas > multiply > deve multiplicar dois números positivos corretamente"/>
        <testcase name="Funções Matemáticas > multiply > deve lidar com números negativos"/>
        <testcase name="Funções Matemáticas > findMax > deve lidar com números negativos"/>
        <testcase name="Funções Matemáticas > findMax > deve lançar erro para array vazio"><failure/></testcase>
      </testsuite>
    `)
    );

    expect(result.testcases).toHaveLength(4);
    // multiply cases
    const multiplyNeg = result.testcases.find(
      (t) => t.subfolder === 'multiply' && t.title === 'deve lidar com números negativos'
    );
    const findMaxNeg = result.testcases.find(
      (t) => t.subfolder === 'findMax' && t.title === 'deve lidar com números negativos'
    );
    expect(multiplyNeg).toBeDefined();
    expect(findMaxNeg).toBeDefined();
    // both have same title but are separate entries
    expect(multiplyNeg.folder).toBe('Funções Matemáticas');
    expect(findMaxNeg.folder).toBe('Funções Matemáticas');
    // failure
    const failure = result.testcases.find((t) => t.title === 'deve lançar erro para array vazio');
    expect(failure.status).toBe(2);
  });
});
