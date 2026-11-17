import { useState } from 'react';
import { type Policy, type Role, factors, questions } from './domain';
import { type DemoStore } from './store';
import { PageHeader } from './ui';
export function Methodology({
  policy,
  role,
  store,
  report,
}: {
  policy: Policy;
  role: Role;
  store: DemoStore;
  report: (f: () => void) => void;
}) {
  const [low, setLow] = useState(policy.lowMax),
    [high, setHigh] = useState(policy.highMin);
  return (
    <>
      <PageHeader
        eyebrow={`Illustrative methodology / v${policy.version}`}
        title="No black box here."
        description="Four factors. A transparent score. Separate review considerations."
      />
      <section className="panel methodology">
        <h2>How the demo calculates risk</h2>
        <p>
          Each factor contributes 0–3 points. The sum is a score out of 12. These example rules help
          demonstrate a governance workflow; they are not legal guidance, certification or a
          validated risk model.
        </p>
        <div className="factor-cards">
          {factors.map((f) => (
            <div key={f}>
              <h3>{f[0].toUpperCase() + f.slice(1)}</h3>
              <p>{questions[f].help}</p>
              <ol start={0}>
                {questions[f].choices.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="band-guide">
          <div>
            <span className="risk risk-low">Low</span>
            <strong>0–{policy.lowMax}</strong>
          </div>
          <div>
            <span className="risk risk-medium">Medium</span>
            <strong>
              {policy.lowMax + 1}–{policy.highMin - 1}
            </strong>
          </div>
          <div>
            <span className="risk risk-high">High</span>
            <strong>{policy.highMin}–12</strong>
          </div>
        </div>
        <h2>Review is a separate decision</h2>
        <p>
          Sensitive information, consequential decisions about people and autonomous external
          actions are independent review considerations. A low score does not remove a selected
          review flag. A required flag also remains visible after a reviewer approves a case: the
          flag describes the use; the workflow status records the decision.
        </p>
        <h2>What appears on the dashboard?</h2>
        <p>
          Active, submitted AI cases with all four answers are plotted. Drafts, archived records and
          rules-only systems are excluded from charts and clearly accounted for in the table. The
          risk map uses impact + reach horizontally and complexity + reliance vertically, on fixed
          0–6 scales.
        </p>
        <h2>Saved evidence and current settings</h2>
        <p>
          Submission captures the answers, review flags, score and methodology version. Changing the
          thresholds below recalculates current dashboard bands; it never rewrites saved evidence or
          previous review decisions.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            report(() => store.setPolicy({ lowMax: low, highMin: high }, role));
          }}
          className="policy-form"
        >
          <h3>Try different thresholds</h3>
          <p className="muted">
            {role === 'Administrator'
              ? 'Changes affect only this browser’s demo.'
              : 'Select Demo Administrator in the sidebar to change the thresholds.'}
          </p>
          <div className="inline">
            <label>
              Low risk maximum
              <input
                type="number"
                min={0}
                max={10}
                required
                value={low}
                onChange={(e) => setLow(Number(e.target.value))}
              />
            </label>
            <label>
              High risk minimum
              <input
                type="number"
                min={2}
                max={12}
                required
                value={high}
                onChange={(e) => setHigh(Number(e.target.value))}
              />
            </label>
            <button className="primary" disabled={role !== 'Administrator'}>
              Save methodology
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
