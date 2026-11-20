import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  type CaseInput,
  type UseCase,
  type Role,
  type Policy,
  emptyAnswers,
  departments,
  stages,
  factors,
  questions,
  triggerLabels,
  calculate,
  issues,
} from './domain';
import { type DemoStore } from './store';
import { InfoButton, PageHeader } from './ui';
export function CaseEditor({
  record,
  role,
  store,
  policy,
}: {
  record?: UseCase;
  role: Role;
  store: DemoStore;
  policy: Policy;
}) {
  const [values, setValues] = useState<CaseInput>(() =>
    record
      ? structuredClone(record)
      : {
          title: '',
          description: '',
          department: 'Other',
          stage: 'Idea',
          isAI: true,
          tools: '',
          documentation: '',
          controls: '',
          visibility: 'Demo members',
          answers: emptyAnswers(),
          flags: [],
          flagsConfirmed: false,
        },
  );
  const [step, setStep] = useState(1),
    [errors, setErrors] = useState<string[]>([]),
    [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(record?.version);
  const [id, setId] = useState(record?.id);
  const [saved, setSaved] = useState('');
  const footer = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(90);
  const heading = useRef<HTMLHeadingElement>(null);
  function change<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
    setSaved('');
  }
  useEffect(() => {
    const ro = new ResizeObserver((entries) =>
      setFooterHeight(entries[0].borderBoxSize?.[0]?.blockSize ?? entries[0].contentRect.height),
    );
    if (footer.current) ro.observe(footer.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const protect = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  useEffect(() => {
    const protect = (e: MouseEvent) => {
      const link = (e.target as Element).closest('a');
      if (
        dirty &&
        link?.getAttribute('href')?.startsWith('#/') &&
        !window.confirm('Leave without saving your latest changes?')
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', protect, true);
    return () => document.removeEventListener('click', protect, true);
  }, [dirty]);
  const result = values.isAI ? calculate(values.answers, policy) : null;
  const stale = !!id && store.getSnapshot().cases.find((c) => c.id === id)?.version !== version;
  function save(submit: boolean) {
    const missing = submit ? issues(values) : [];
    if (missing.length) {
      setErrors(missing);
      heading.current?.focus();
      return;
    }
    try {
      const nextId = store.save(values, role, submit, id, version);
      setId(nextId);
      setVersion(store.getSnapshot().cases.find((c) => c.id === nextId)?.version);
      setDirty(false);
      setErrors([]);
      setSaved('Draft saved in this browser.');
      if (submit) location.hash = `/case/${nextId}`;
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Unable to save.']);
      heading.current?.focus();
    }
  }
  if (role === 'Reviewer')
    return (
      <div className="empty">
        <h1>Switch to Demo Owner to edit</h1>
        <p>
          The role selector is in the sidebar. Roles simulate a workflow; they are not
          authentication.
        </p>
        <a href="#/registry">Back to registry</a>
      </div>
    );
  return (
    <div className="form-page" style={{ paddingBottom: footerHeight + 24 }}>
      <PageHeader title={record ? 'Edit use case' : 'New use case'} />
      <div className="steps" aria-label="Assessment stages">
        <button aria-current={step === 1 ? 'step' : undefined} onClick={() => setStep(1)}>
          1 <span>About</span>
        </button>
        <span className="step-line" />
        <button aria-current={step === 2 ? 'step' : undefined} onClick={() => setStep(2)}>
          2 <span>Assessment</span>
        </button>
      </div>
      <h2 className="sr-only" tabIndex={-1} ref={heading}>
        Assessment form
      </h2>
      {errors.length > 0 && (
        <div className="error-banner" role="alert">
          <strong>Check the following</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {stale && (
        <div className="error-banner" role="alert">
          This record changed in another tab. Your unsaved answers remain here, but saving is
          blocked to prevent overwriting newer work. Reopen the case to continue.
        </div>
      )}
      {step === 1 ? (
        <section className="panel form-panel">
          <div className="section-number">01 / The idea</div>
          <h2>What are you building?</h2>
          <label>
            Use case name <span className="required">Required to submit</span>
            <input
              maxLength={160}
              aria-required="true"
              aria-invalid={errors.length > 0 && !values.title.trim()}
              aria-describedby={
                errors.length > 0 && !values.title.trim() ? 'title-error' : undefined
              }
              value={values.title}
              onChange={(e) => change('title', e.target.value)}
              placeholder="e.g. Customer support reply assistant"
            />
          </label>
          {errors.length > 0 && !values.title.trim() && (
            <p className="field-error" id="title-error">
              Enter a use case name.
            </p>
          )}
          <label>
            Purpose and expected outcome <span className="required">Required to submit</span>
            <textarea
              maxLength={3000}
              aria-required="true"
              aria-invalid={errors.length > 0 && !values.description.trim()}
              aria-describedby={
                errors.length > 0 && !values.description.trim() ? 'description-error' : undefined
              }
              rows={4}
              value={values.description}
              onChange={(e) => change('description', e.target.value)}
              placeholder="What does it do, who uses it and what should improve?"
            />
          </label>
          {errors.length > 0 && !values.description.trim() && (
            <p className="field-error" id="description-error">
              Describe the purpose and expected outcome.
            </p>
          )}
          <div className="form-grid">
            <label>
              Department
              <select
                value={values.department}
                onChange={(e) => change('department', e.target.value as CaseInput['department'])}
              >
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Lifecycle
              <select
                value={values.stage}
                onChange={(e) => change('stage', e.target.value as CaseInput['stage'])}
              >
                {stages.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Tools used
            <input
              maxLength={400}
              value={values.tools}
              onChange={(e) => change('tools', e.target.value)}
              placeholder="Model, retrieval layer or rules engine"
            />
          </label>
          <label>
            Documentation notes
            <textarea
              rows={2}
              maxLength={2000}
              value={values.documentation}
              onChange={(e) => change('documentation', e.target.value)}
              placeholder="Describe the supporting documentation. Use fictional content in this demo."
            />
          </label>
          <div className="form-grid">
            <label>
              Owner
              <input value="Demo Owner" readOnly />
            </label>
            <label>
              Demo visibility
              <select
                value={values.visibility}
                onChange={(e) => change('visibility', e.target.value as CaseInput['visibility'])}
              >
                <option>Demo members</option>
                <option>Owner only</option>
              </select>
            </label>
          </div>
          <p className="muted caption">
            Visibility is simulated in your browser. Do not enter personal or confidential
            information.
          </p>
        </section>
      ) : (
        <div className="assessment-layout">
          <div>
            <section className="panel form-panel">
              <div className="section-number">02 / The assessment</div>
              <h2>Understand the system</h2>
              <fieldset>
                <legend>Does this use an AI model?</legend>
                <div className="inline">
                  <label className="check-label">
                    <input
                      type="radio"
                      name="ai"
                      checked={values.isAI}
                      onChange={() => change('isAI', true)}
                    />
                    Yes, it uses AI
                  </label>
                  <label className="check-label">
                    <input
                      type="radio"
                      name="ai"
                      checked={!values.isAI}
                      onChange={() => change('isAI', false)}
                    />
                    No, fixed rules only
                  </label>
                </div>
              </fieldset>
              {values.isAI ? (
                factors.map((key, index) => (
                  <fieldset className="question" key={key}>
                    <legend>
                      <span>
                        {index + 1}. {questions[key].label}
                      </span>
                      <InfoButton label={`About ${key}`}>
                        <p>
                          {questions[key].help} Each answer contributes 0–3 points to the
                          illustrative risk score.
                        </p>
                      </InfoButton>
                    </legend>
                    <div className="choices">
                      {questions[key].choices.map((choice, i) => (
                        <label className="choice" key={choice}>
                          <input
                            type="radio"
                            name={key}
                            checked={values.answers[key] === i}
                            onChange={() => change('answers', { ...values.answers, [key]: i })}
                          />
                          <span>{choice}</span>
                          <small>{i} pts</small>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))
              ) : (
                <p className="notice">
                  Rules-only systems stay in the registry. They receive no numerical AI risk score
                  and are excluded from AI charts.
                </p>
              )}
            </section>
            {values.isAI && (
              <section className="panel form-panel">
                <h2>Review considerations</h2>
                <p className="muted">These apply separately from the numerical score.</p>
                <fieldset className="checklist">
                  <legend className="sr-only">Review checklist</legend>
                  {Object.entries(triggerLabels).map(([key, label]) => (
                    <label className="check-label" key={key}>
                      <input
                        type="checkbox"
                        checked={values.flags.includes(key as keyof typeof triggerLabels)}
                        onChange={(e) => {
                          const trigger = key as keyof typeof triggerLabels;
                          setValues((v) => ({
                            ...v,
                            flags: e.target.checked
                              ? [...v.flags, trigger]
                              : v.flags.filter((f) => f !== trigger),
                            flagsConfirmed: true,
                          }));
                          setDirty(true);
                        }}
                      />
                      {label}
                    </label>
                  ))}
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={values.flagsConfirmed && values.flags.length === 0}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, flags: [], flagsConfirmed: e.target.checked }));
                        setDirty(true);
                      }}
                    />
                    None apply
                  </label>
                </fieldset>
                <label>
                  Controls and human oversight
                  <textarea
                    maxLength={2000}
                    rows={3}
                    value={values.controls}
                    onChange={(e) => change('controls', e.target.value)}
                    placeholder="How are outputs checked, and what happens if something goes wrong?"
                  />
                </label>
              </section>
            )}
          </div>
          <aside className="outcome panel" aria-live="polite">
            <div className="small-label">As you answer</div>
            <h2>
              {!values.isAI
                ? 'Rules-only system'
                : result
                  ? `${result.band} risk`
                  : 'Not enough information'}
            </h2>
            {result && (
              <div className="outcome-score">
                {result.score}
                <span>/12</span>
              </div>
            )}
            <p>
              {!values.isAI
                ? 'No AI score is assigned.'
                : result
                  ? 'Your answers produce this illustrative score.'
                  : 'Answer all four questions to calculate the score.'}
            </p>
            {values.isAI && (
              <div className="factor-list">
                {factors.map((key) => (
                  <div key={key}>
                    <span>{key[0].toUpperCase() + key.slice(1)}</span>
                    <strong>{values.answers[key] ?? '—'} / 3</strong>
                  </div>
                ))}
              </div>
            )}
            <p className={values.flags.length && values.isAI ? 'flag' : 'muted'}>
              {values.isAI && !values.flagsConfirmed
                ? 'Review checklist incomplete'
                : values.isAI && values.flags.length
                  ? 'Separate approval review required'
                  : 'No additional review flags selected'}
            </p>
            <small>
              Illustrative methodology v{policy.version}. This is a portfolio demonstration.
            </small>
          </aside>
        </div>
      )}
      <footer ref={footer} className="form-actions">
        <div>
          <strong>Step {step} of 2</strong>
          <p role="status">
            {saved || (dirty ? 'Unsaved changes' : 'Save a draft and return any time')}
          </p>
        </div>
        <div className="inline">
          <a href={id ? `#/case/${id}` : '#/registry'}>Cancel</a>
          <button onClick={() => save(false)}>
            <Check size={16} />
            Save draft
          </button>
          {step === 1 ? (
            <button
              className="primary"
              onClick={() => {
                setStep(2);
                window.scrollTo(0, 0);
              }}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                className="back-step icon-button"
                onClick={() => setStep(1)}
                aria-label="Back to About"
              >
                <ArrowLeft size={18} />
              </button>
              <button className="primary" onClick={() => save(true)}>
                Submit <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
