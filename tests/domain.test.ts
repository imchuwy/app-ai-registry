import { describe, it, expect } from 'vitest';
import {
  calculate,
  defaultPolicy,
  emptyAnswers,
  currentResult,
  plotGroups,
  csv,
  issues,
  visibleCases,
  snapshotSchema,
} from '../src/domain';
import { seed } from '../src/seed';
describe('illustrative methodology', () => {
  it('does not turn incomplete answers into low risk', () =>
    expect(calculate(emptyAnswers(), defaultPolicy)).toBeNull());
  it.each([
    [3, 'Low'],
    [4, 'Medium'],
    [7, 'Medium'],
    [8, 'High'],
    [12, 'High'],
  ])('classifies boundary score %s', (score, band) => {
    const n = Number(score);
    const a = {
      complexity: Math.min(3, n),
      impact: Math.min(3, Math.max(0, n - 3)),
      reach: Math.min(3, Math.max(0, n - 6)),
      reliance: Math.max(0, n - 9),
    };
    expect(calculate(a, defaultPolicy)).toMatchObject({ score: n, band });
  });
  it('keeps all ten fixtures valid with seven active plotted cases', () => {
    const s = seed();
    expect(snapshotSchema.parse(s).cases).toHaveLength(10);
    expect(s.cases.filter((c) => !c.archived)).toHaveLength(9);
    const groups = plotGroups(s.cases, s.policy);
    expect(groups.flatMap((g) => g.cases)).toHaveLength(7);
    expect(groups.some((g) => g.cases.length > 1)).toBe(true);
    expect(
      new Set(groups.flatMap((g) => g.cases).map((c) => currentResult(c, s.policy)?.band)),
    ).toEqual(new Set(['Low', 'Medium', 'High']));
  });
  it('excludes both draft and rules-only cases from numeric results', () => {
    const s = seed();
    expect(currentResult(s.cases[2], s.policy)).toBeNull();
    expect(currentResult(s.cases[9], s.policy)).toBeNull();
  });
  it('does not change saved assessment evidence when recalculating', () => {
    const c = seed().cases[0];
    const before = structuredClone(c.saved);
    expect(currentResult(c, { version: 2, lowMax: 6, highMin: 9 })?.band).toBe('Low');
    expect(c.saved).toEqual(before);
  });
  it('accounts for every grouped case exactly once', () => {
    const s = seed(),
      groups = plotGroups(s.cases, s.policy),
      ids = groups.flatMap((g) => g.cases.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of groups)
      for (const c of g.cases) expect(currentResult(c, s.policy)).toMatchObject({ x: g.x, y: g.y });
  });
  it('requires an explicit review checklist', () => {
    const c = seed().cases[0];
    expect(issues({ ...c, flagsConfirmed: false })).toContain(
      'Complete the review checklist, including None apply if appropriate.',
    );
  });
  it('applies simulated visibility before aggregation', () => {
    const s = seed();
    s.cases[0].visibility = 'Owner only';
    expect(visibleCases(s.cases, 'Reviewer')).toHaveLength(9);
    expect(visibleCases(s.cases, 'Owner')).toHaveLength(10);
  });
  it('escapes CSV quotes and formula injection', () => {
    const s = seed();
    s.cases[0].title = ' =HYPERLINK("sample")';
    const result = csv([s.cases[0]], s.policy);
    expect(result).toContain('"\' =HYPERLINK(""sample"")"');
    expect(result).not.toContain('undefined');
  });
  it('rejects duplicate IDs and invalid answers in saved data', () => {
    const s = seed();
    s.cases[1].id = s.cases[0].id;
    expect(() => snapshotSchema.parse(s)).toThrow();
    const bad = seed();
    bad.cases[0].answers.impact = 100;
    expect(() => snapshotSchema.parse(bad)).toThrow();
  });
});
