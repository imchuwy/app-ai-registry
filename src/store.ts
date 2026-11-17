import {
  type CaseInput,
  type Role,
  type Snapshot,
  type UseCase,
  type Policy,
  caseSchema,
  snapshotSchema,
  policySchema,
  calculate,
  issues,
} from './domain';
import { seed } from './seed';
export const storageKey = 'oc-ai-registry-v1';
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class DemoStore {
  private data: Snapshot;
  private listeners = new Set<() => void>();
  notice = '';
  private blocked = false;
  private persisted: string | null = null;
  constructor(
    private storage: StoragePort | null,
    private now: () => string = () => new Date().toISOString(),
    private id: () => string = () => crypto.randomUUID(),
  ) {
    this.data = seed();
    if (!storage) {
      this.notice = 'Storage is unavailable. Changes last for this session only.';
      return;
    }
    try {
      const raw = storage.getItem(storageKey);
      this.persisted = raw;
      if (raw) this.data = snapshotSchema.parse(JSON.parse(raw));
      else {
        storage.setItem(storageKey, JSON.stringify(this.data));
        this.persisted = JSON.stringify(this.data);
      }
    } catch (error) {
      if (error instanceof SyntaxError || (error instanceof Error && error.name === 'ZodError')) {
        this.blocked = true;
        this.notice =
          'Saved data could not be read. A fresh preview is shown; reset the demo to replace the incompatible data.';
      } else {
        this.storage = null;
        this.notice = 'Storage is unavailable. Changes last for this session only.';
      }
    }
  }
  getSnapshot = () => this.data;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    this.listeners.forEach((fn) => fn());
  }
  refresh() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(storageKey);
      if (raw === this.persisted) return;
      if (!raw) throw new Error('Saved demo was removed in another tab. Reset to continue.');
      this.data = snapshotSchema.parse(JSON.parse(raw));
      this.persisted = raw;
      this.notice = 'Updated from another tab. Reopen any form you were editing before saving.';
      this.emit();
    } catch {
      this.blocked = true;
      this.notice = 'Saved data changed and cannot be read. Reset the demo to recover.';
      this.data = {...this.data};
      this.emit();
    }
  }
  private commit(next: Snapshot) {
    if (this.blocked) throw new Error('Reset the incompatible saved data before making changes.');
    next = snapshotSchema.parse({ ...next, revision: this.data.revision + 1 });
    if (this.storage) {
      let current: string | null;
      try {
        current = this.storage.getItem(storageKey);
      } catch {
        this.storage = null;
        current = this.persisted;
        this.notice = 'Storage is unavailable. Changes last for this session only.';
      }
      if (current !== this.persisted) {
        this.refresh();
        throw new Error(
          'Another tab changed the demo. Your edit was not saved. Reopen the case and try again.',
        );
      }
      if (this.storage)
        try {
          const raw = JSON.stringify(next);
          this.storage.setItem(storageKey, raw);
          this.persisted = raw;
        } catch {
          this.storage = null;
          this.notice =
            'Browser storage is full or unavailable. Changes last for this session only; export before leaving.';
        }
    }
    this.data = next;
    this.emit();
  }
  private edit(id: string, version: number, role: Role, action: (record: UseCase) => UseCase) {
    const old = this.data.cases.find((c) => c.id === id);
    if (!old) throw new Error('This case no longer exists.');
    if (old.version !== version) throw new Error('This case has changed. Reopen it before saving.');
    if (role === 'Reviewer' && old.visibility === 'Owner only')
      throw new Error('This case is hidden from the simulated reviewer.');
    const changed = action(structuredClone(old));
    this.commit({
      ...this.data,
      cases: this.data.cases.map((c) =>
        c.id === id
          ? caseSchema.parse({ ...changed, version: old.version + 1, updatedAt: this.now() })
          : c,
      ),
    });
    return changed.id;
  }
  private event(
    role: Role,
    kind: UseCase['history'][number]['kind'],
    text: string,
  ): UseCase['history'][number] {
    return { id: this.id(), at: this.now(), actor: role, kind, text };
  }
  save(input: CaseInput, role: Role, submit: boolean, id?: string, version?: number) {
    if (role === 'Reviewer')
      throw new Error('Switch to Demo Owner or Administrator to edit cases.');
    if (submit && issues(input).length) throw new Error(issues(input).join(' '));
    const at = this.now();
    const transform = (c: UseCase): UseCase => {
      if (c.archived) throw new Error('Restore an archived case before editing.');
      const saved = submit
        ? {
            answers: structuredClone(input.answers),
            flags: [...input.flags],
            isAI: input.isAI,
            result: input.isAI ? calculate(input.answers, this.data.policy) : null,
            policy: { ...this.data.policy },
            at,
          }
        : c.saved;
      return {
        ...c,
        ...input,
        title: input.title.trim() || 'Untitled draft',
        status: submit ? (input.isAI ? 'Awaiting review' : 'Recorded') : 'Draft',
        saved,
        history: [
          ...c.history,
          {
            ...this.event(
              role,
              submit ? 'submitted' : 'edited',
              submit ? 'Assessment submitted.' : 'Draft saved. Previous review no longer applies.',
            ),
            ...(submit && saved ? { evidence: saved } : {}),
          },
        ],
      };
    };
    if (id) return this.edit(id, version ?? 0, role, transform);
    const record = caseSchema.parse(
      transform({
        id: this.id(),
        version: 1,
        ...input,
        title: input.title.trim() || 'Untitled draft',
        owner: 'Demo Owner',
        status: 'Draft',
        archived: false,
        createdAt: at,
        updatedAt: at,
        saved: null,
        history: [this.event(role, 'created', 'Use case created.')],
      }),
    );
    this.commit({ ...this.data, cases: [record, ...this.data.cases] });
    return record.id;
  }
  archive(id: string, version: number, role: Role) {
    if (role === 'Reviewer') throw new Error('Owners and administrators manage archives.');
    this.edit(id, version, role, (c) => ({
      ...c,
      archived: !c.archived,
      history: [
        ...c.history,
        this.event(
          role,
          c.archived ? 'restored' : 'archived',
          c.archived ? 'Restored to the registry.' : 'Archived from the active registry.',
        ),
      ],
    }));
  }
  delete(id: string, version: number, role: Role) {
    if (role !== 'Administrator') throw new Error('Switch to Demo Administrator to delete a case.');
    const record = this.data.cases.find((c) => c.id === id);
    if (!record || record.version !== version)
      throw new Error('Case changed; reopen it before deleting.');
    this.commit({ ...this.data, cases: this.data.cases.filter((c) => c.id !== id) });
  }
  review(
    id: string,
    version: number,
    role: Role,
    decision: 'Approved' | 'Changes requested',
    note: string,
  ) {
    if (role === 'Owner')
      throw new Error('Switch to Demo Reviewer or Administrator to record a decision.');
    if (!note.trim()) throw new Error('Add a short explanation for the decision.');
    this.edit(id, version, role, (c) => {
      if (c.archived || c.status !== 'Awaiting review')
        throw new Error('Only active cases awaiting review can receive a decision.');
      return {
        ...c,
        status: decision,
        history: [...c.history, this.event(role, 'review', `${decision}: ${note.trim()}`)],
      };
    });
  }
  comment(id: string, version: number, role: Role, note: string) {
    if (!note.trim()) throw new Error('Enter a comment.');
    this.edit(id, version, role, (c) => ({
      ...c,
      history: [...c.history, this.event(role, 'comment', note.trim())],
    }));
  }
  setPolicy(input: Omit<Policy, 'version'>, role: Role) {
    if (role !== 'Administrator')
      throw new Error('Switch to Demo Administrator to change methodology.');
    const policy = policySchema.parse({ ...input, version: this.data.policy.version + 1 });
    this.commit({ ...this.data, policy });
  }
  reset() {
    const next = seed();
    if (this.storage)
      try {
        const raw = JSON.stringify(next);
        this.storage.setItem(storageKey, raw);
        this.persisted = raw;
      } catch {
        this.storage = null;
      }
    this.blocked = false;
    this.data = next;
    this.notice = this.storage
      ? 'Demo reset to the ten original fictional cases.'
      : 'Demo reset. Changes last for this session only.';
    this.emit();
  }
}
