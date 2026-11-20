import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Pencil, Archive } from 'lucide-react';
import {
  type UseCase,
  type Role,
  type Policy,
  factors,
  questions,
  currentResult,
  triggerLabels,
} from './domain';
import { type DemoStore } from './store';
import { Risk, Flag, PageHeader } from './ui';
export function CaseDetail({
  record: c,
  policy,
  role,
  store,
  report,
}: {
  record: UseCase;
  policy: Policy;
  role: Role;
  store: DemoStore;
  report: (f: () => void) => void;
}) {
  const [tab, setTab] = useState('Overview'),
    [note, setNote] = useState('');
  const current = currentResult(c, policy);
  return (
    <>
      <a className="back-link" href="#/registry">
        <ArrowLeft size={16} />
        All use cases
      </a>
      <PageHeader
        eyebrow={`${c.department} / ${c.archived ? 'Archived' : c.stage}`}
        title={c.title}
      >
        {role !== 'Reviewer' && !c.archived && (
          <a className="button primary" href={`#/edit/${c.id}`}>
            <Pencil size={16} />
            Edit assessment
          </a>
        )}
      </PageHeader>
      <section className="record-summary">
        <div>
          <small>Current risk</small>
          <Risk record={c} policy={policy} />
        </div>
        <div>
          <small>Review flag</small>
          <Flag record={c} />
        </div>
        <div>
          <small>Workflow</small>
          <strong>{c.status}</strong>
        </div>
        <div>
          <small>Owner</small>
          <strong>{c.owner}</strong>
        </div>
      </section>
      <div className="tabs" role="tablist" aria-label="Case information">
        {['Overview', 'Assessment', 'Activity'].map((t) => (
          <button
            role="tab"
            id={`tab-${t}`}
            aria-controls={`panel-${t}`}
            aria-selected={tab === t}
            key={t}
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const names = ['Overview', 'Assessment', 'Activity'];
                const next = names[(names.indexOf(t) + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <section
        className="panel detail-panel"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === 'Overview' && (
          <div className="detail-grid">
            <div>
              <h2>How it works</h2>
              <p>{c.description}</p>
              <h3>Tools</h3>
              <p>{c.tools || 'No tools recorded.'}</p>
              <h3>Human oversight</h3>
              <p>{c.controls || 'No controls recorded yet.'}</p>
              <h3>Supporting documentation</h3>
              <p className="preserve-lines">{c.documentation || 'No documentation notes yet.'}</p>
            </div>
            <aside>
              <h3>Record details</h3>
              <dl>
                <dt>Department</dt>
                <dd>{c.department}</dd>
                <dt>Lifecycle</dt>
                <dd>{c.stage}</dd>
                <dt>Demo visibility</dt>
                <dd>{c.visibility}</dd>
                <dt>Last updated</dt>
                <dd>{new Date(c.updatedAt).toLocaleString()}</dd>
              </dl>
              {role !== 'Reviewer' && (
                <button onClick={() => report(() => store.archive(c.id, c.version, role))}>
                  <Archive size={16} />
                  {c.archived ? 'Restore case' : 'Archive case'}
                </button>
              )}
            </aside>
          </div>
        )}
        {tab === 'Assessment' && (
          <>
            <h2>The reasoning behind the score</h2>
            <p>
              Current methodology v{policy.version}. Review flags are independent of the risk band.
            </p>
            {!c.isAI ? (
              <p className="notice">This is a rules-only system. No AI score is assigned.</p>
            ) : (
              <>
                <div className="factor-cards">
                  {factors.map((key) => (
                    <div key={key}>
                      <small>{key[0].toUpperCase() + key.slice(1)}</small>
                      <strong>
                        {c.answers[key] ?? '—'}
                        <span>/3</span>
                      </strong>
                      <p>
                        {c.answers[key] === null
                          ? 'Not answered'
                          : questions[key].choices[c.answers[key]!]}
                      </p>
                    </div>
                  ))}
                </div>
                <p>
                  {current
                    ? `Current score: ${current.score}/12 · ${current.band}`
                    : 'Complete and submit the draft to include it in the dashboard.'}
                </p>
              </>
            )}
            <h3>Review considerations</h3>
            <p>
              {c.flags.length
                ? c.flags.map((f) => triggerLabels[f]).join(' · ')
                : c.flagsConfirmed
                  ? 'No additional review flags.'
                  : 'Checklist not completed.'}
            </p>
            {c.saved && (
              <div className="notice">
                <strong>Saved assessment · methodology v{c.saved.policy.version}</strong>
                <p>
                  {c.saved.result
                    ? `${c.saved.result.score}/12 · ${c.saved.result.band}`
                    : 'Rules-only · no score'}{' '}
                  · {new Date(c.saved.at).toLocaleString()}
                </p>
                <p>
                  {c.saved.policy.version !== policy.version
                    ? 'The methodology has changed. The saved evidence is preserved; dashboard totals use current settings.'
                    : 'This is the evidence captured at submission.'}
                </p>
              </div>
            )}
            <a href="#/methodology">
              Explore the methodology <ArrowUpRight size={16} />
            </a>
          </>
        )}
        {tab === 'Activity' && (
          <>
            <h2>Local activity</h2>
            <p className="muted">
              Demo history stored in your browser. It is not a tamper-proof audit service.
            </p>
            <ol className="timeline">
              {[...c.history].reverse().map((e) => (
                <li key={e.id}>
                  <div className="timeline-dot" />
                  <div>
                    <strong>{e.actor}</strong>
                    <time>{new Date(e.at).toLocaleString()}</time>
                    <p className="preserve-lines">{e.text}</p>
                    {e.evidence && (
                      <details>
                        <summary>Assessment evidence</summary>
                        <p>
                          Methodology v{e.evidence.policy.version} ·{' '}
                          {e.evidence.result
                            ? `${e.evidence.result.score}/12 · ${e.evidence.result.band}`
                            : 'No AI score'}
                        </p>
                        <p>
                          {factors
                            .map((f) => `${f}: ${e.evidence!.answers[f] ?? 'unanswered'}`)
                            .join(' · ')}
                        </p>
                      </details>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
      <section className="panel review-panel">
        <h2>
          {c.status === 'Awaiting review' ? 'Add a review or comment' : 'Continue the conversation'}
        </h2>
        <label htmlFor="case-note">Decision explanation or comment</label>
        <textarea
          id="case-note"
          rows={3}
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Use fictional feedback in this demo."
        />
        <div className="inline">
          <button
            onClick={() =>
              report(() => {
                store.comment(c.id, c.version, role, note);
                setNote('');
              })
            }
          >
            Add comment
          </button>
          {c.status === 'Awaiting review' &&
            !c.archived &&
            (role === 'Owner' ? (
              <p className="muted">Switch to Demo Reviewer to record a decision.</p>
            ) : (
              <>
                <button
                  className="primary"
                  onClick={() =>
                    report(() => {
                      store.review(c.id, c.version, role, 'Approved', note);
                      setNote('');
                    })
                  }
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    report(() => {
                      store.review(c.id, c.version, role, 'Changes requested', note);
                      setNote('');
                    })
                  }
                >
                  Request changes
                </button>
              </>
            ))}
        </div>
      </section>
    </>
  );
}
