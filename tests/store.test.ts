import { describe, it, expect } from 'vitest';
import { DemoStore, storageKey, type StoragePort } from '../src/store';
import { seed } from '../src/seed';
class MemoryStorage implements StoragePort {
  value: string | null = null;
  getItem() {
    return this.value;
  }
  setItem(_key: string, value: string) {
    this.value = value;
  }
}
function make(storage: StoragePort | null = new MemoryStorage()) {
  let n = 0;
  return new DemoStore(
    storage,
    () => '2026-02-01T10:00:00.000Z',
    () => `test-id-${++n}`,
  );
}
describe('browser demo service', () => {
  it('seeds once and preserves changes across reload', () => {
    const memory = new MemoryStorage(),
      s = make(memory),
      c = s.getSnapshot().cases[0];
    s.save({ ...c, title: 'Edited example' }, 'Owner', false, c.id, c.version);
    expect(make(memory).getSnapshot().cases[0].title).toBe('Edited example');
  });
  it('allows drafts but rejects incomplete submission', () => {
    const s = make(),
      draft = s.getSnapshot().cases[2];
    s.save(draft, 'Owner', false, draft.id, draft.version);
    expect(() => s.save(draft, 'Owner', true, draft.id, 2)).toThrow('Answer:');
  });
  it('captures submission evidence and records a review', () => {
    const s = make(),
      c = s.getSnapshot().cases[0];
    s.save(c, 'Owner', true, c.id, 1);
    const submitted = s.getSnapshot().cases[0];
    expect(submitted.saved?.policy.version).toBe(1);
    s.review(c.id, 2, 'Reviewer', 'Approved', 'Controls checked.');
    expect(s.getSnapshot().cases[0].status).toBe('Approved');
    expect(s.getSnapshot().cases[0].history.at(-1)?.text).toContain('Controls checked.');
  });
  it('clears previous approval when a record is edited', () => {
    const s = make(),
      c = s.getSnapshot().cases[1];
    s.save(c, 'Owner', false, c.id, 1);
    expect(s.getSnapshot().cases[1].status).toBe('Draft');
    expect(s.getSnapshot().cases[1].saved).not.toBeNull();
  });
  it('enforces simulated roles and workflow transitions', () => {
    const s = make(),
      c = s.getSnapshot().cases[0];
    expect(() => s.save(c, 'Reviewer', false, c.id, 1)).toThrow('Switch');
    expect(() => s.review(c.id, 1, 'Owner', 'Approved', 'yes')).toThrow('Switch');
    expect(() => s.delete(c.id, 1, 'Owner')).toThrow('Administrator');
    expect(() => s.review(s.getSnapshot().cases[1].id, 1, 'Reviewer', 'Approved', 'again')).toThrow(
      'awaiting review',
    );
  });
  it('archives, restores and deletes explicitly', () => {
    const s = make(),
      c = s.getSnapshot().cases[0];
    s.archive(c.id, 1, 'Owner');
    expect(s.getSnapshot().cases[0].archived).toBe(true);
    expect(() => s.save(c, 'Owner', false, c.id, 2)).toThrow('Restore');
    s.archive(c.id, 2, 'Owner');
    expect(s.getSnapshot().cases[0].archived).toBe(false);
    s.delete(c.id, 3, 'Administrator');
    expect(s.getSnapshot().cases).toHaveLength(9);
  });
  it('refuses stale record edits', () => {
    const s = make(),
      c = s.getSnapshot().cases[0];
    s.comment(c.id, 1, 'Owner', 'First change');
    expect(() => s.save(c, 'Owner', false, c.id, 1)).toThrow('changed');
  });
  it('refuses a stale tab write and loads the newer snapshot', () => {
    const mem = new MemoryStorage(),
      a = make(mem),
      b = make(mem),
      c = a.getSnapshot().cases[0];
    a.save({ ...c, title: 'Newer title' }, 'Owner', false, c.id, 1);
    expect(() => b.save({ ...c, title: 'Stale title' }, 'Owner', false, c.id, 1)).toThrow(
      'Another tab',
    );
    expect(b.getSnapshot().cases[0].title).toBe('Newer title');
    expect(make(mem).getSnapshot().cases[0].title).toBe('Newer title');
  });
  it('keeps corrupt data intact until explicit reset', () => {
    const mem = new MemoryStorage();
    mem.value = '{bad';
    const s = make(mem);
    expect(s.notice).toContain('could not be read');
    expect(() => s.comment('demo-01', 1, 'Owner', 'hi')).toThrow('Reset');
    expect(mem.value).toBe('{bad');
    s.reset();
    expect(JSON.parse(mem.value!).cases).toHaveLength(10);
  });
  it('rejects incompatible saved schemas', () => {
    const mem = new MemoryStorage();
    mem.value = JSON.stringify({ ...seed(), schema: 99 });
    const s = make(mem);
    expect(s.notice).toContain('could not be read');
  });
  it('continues in memory when storage is not available', () => {
    const s = make(null);
    s.comment('demo-01', 1, 'Owner', 'Available offline');
    expect(s.getSnapshot().cases[0].history.at(-1)?.text).toBe('Available offline');
    expect(s.notice).toContain('session only');
  });
  it('retains a change in memory after quota failure', () => {
    const mem = new MemoryStorage(),
      s = make(mem);
    mem.setItem = () => {
      throw new Error('quota');
    };
    s.comment('demo-01', 1, 'Owner', 'Retained');
    expect(s.getSnapshot().cases[0].history.at(-1)?.text).toBe('Retained');
    expect(s.notice).toContain('full or unavailable');
  });
  it('changes policy without rewriting saved evidence', () => {
    const s = make(),
      before = structuredClone(s.getSnapshot().cases);
    s.setPolicy({ lowMax: 5, highMin: 9 }, 'Administrator');
    expect(s.getSnapshot().policy.version).toBe(2);
    expect(s.getSnapshot().cases).toEqual(before);
    expect(() => s.setPolicy({ lowMax: 8, highMin: 8 }, 'Administrator')).toThrow();
  });
  it('restores deterministic seed data on reset', () => {
    const s = make();
    s.delete('demo-01', 1, 'Administrator');
    s.reset();
    expect(s.getSnapshot()).toEqual(seed());
    expect(storageKey).toBe('oc-ai-registry-v1');
  });
  it('isolates separate browser storage', () => {
    const a = make(),
      b = make();
    a.comment('demo-01', 1, 'Owner', 'Only here');
    expect(b.getSnapshot().cases[0].history).toHaveLength(1);
  });
});
