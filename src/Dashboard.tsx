import { useEffect, useRef, useState } from 'react';
import { Plus, Activity, Layers3, ClipboardCheck } from 'lucide-react';
import { currentResult, plotGroups, type Policy, type UseCase } from './domain';
import { CasePreview, InfoButton, PageHeader, Risk, Flag } from './ui';
export function Dashboard({ cases, policy }: { cases: UseCase[]; policy: Policy }) {
  const active = cases.filter((c) => !c.archived),
    plotted = active.filter((c) => currentResult(c, policy));
  const groups = plotGroups(cases, policy);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  const [selected, setSelected] = useState<{
    key: string;
    cases: UseCase[];
    anchor: HTMLElement;
    title: string;
  } | null>(null);
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(200, entries[0].contentRect.width)),
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const height = 330,
    left = 44,
    right = 20,
    top = 22,
    bottom = 48,
    w = width - left - right,
    h = height - top - bottom;
  const bands = ['Low', 'Medium', 'High'] as const;
  const counts = bands.map((band) =>
    plotted.filter((c) => currentResult(c, policy)?.band === band),
  );
  const max = Math.max(1, ...counts.map((c) => c.length));
  return (
    <>
      <PageHeader title="Overview">
        <a className="button primary" href="#/new">
          <Plus size={18} />
          Add use case
        </a>
      </PageHeader>
      <div className="stat-grid">
        <div>
          <Layers3 />
          <span>Active use cases</span>
          <strong>{active.length}</strong>
          <small>{cases.length - active.length} archived</small>
        </div>
        <div>
          <Activity />
          <span>Assessed</span>
          <strong>{plotted.length}</strong>
          <small>{active.length - plotted.length} draft or rules-only</small>
        </div>
        <div>
          <ClipboardCheck />
          <span>Awaiting review</span>
          <strong>{active.filter((c) => c.status === 'Awaiting review').length}</strong>
          <a href="#/registry?review=awaiting">View review queue →</a>
        </div>
      </div>
      <div className="chart-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Risk map</h2>
            </div>
            <InfoButton label="Reading the risk map">
              <p>
                Horizontal: potential impact + audience reach. Vertical: complexity + reliance. Each
                axis ranges from 0 to 6. Numbers inside dots count cases at the same coordinates. A
                grouped dot uses the highest risk band in the group.
              </p>
              <p>Current methodology v{policy.version}. Select a dot to inspect its cases.</p>
            </InfoButton>
          </div>
          <div ref={ref} className="scatter" style={{ height }}>
            <svg
              width="100%"
              height={height}
              role="img"
              aria-label={`Risk map of ${plotted.length} assessed cases. Use the case-count buttons or the comparison table below.`}
            >
              {[0, 2, 4, 6].map((t) => (
                <g key={t}>
                  <line
                    x1={left}
                    y1={top + h - (t / 6) * h}
                    x2={width - right}
                    y2={top + h - (t / 6) * h}
                    className="grid-line"
                  />
                  <line
                    x1={left + (t / 6) * w}
                    y1={top}
                    x2={left + (t / 6) * w}
                    y2={top + h}
                    className="grid-line"
                  />
                  <text x={left - 12} y={top + h - (t / 6) * h + 4} textAnchor="end">
                    {t}
                  </text>
                  <text x={left + (t / 6) * w} y={top + h + 22} textAnchor="middle">
                    {t}
                  </text>
                </g>
              ))}
              <text x={left + w / 2} y={height - 6} textAnchor="middle">
                Impact + reach
              </text>
              <text transform={`translate(13 ${top + h / 2}) rotate(-90)`} textAnchor="middle">
                Complexity + reliance
              </text>
            </svg>
            {groups.map((g) => {
              const highest = Math.max(...g.cases.map((c) => currentResult(c, policy)!.score));
              const band =
                highest >= policy.highMin ? 'high' : highest <= policy.lowMax ? 'low' : 'medium';
              return (
                <button
                  key={`${g.x}-${g.y}`}
                  aria-haspopup="dialog"
                  aria-expanded={selected?.key === `${g.x}-${g.y}`}
                  className={`chart-dot dot-${band}`}
                  style={{ left: left + (g.x / 6) * w - 22, top: top + h - (g.y / 6) * h - 22 }}
                  aria-label={`${g.cases.length} cases: impact and reach ${g.x}, complexity and reliance ${g.y}`}
                  onClick={(e) =>
                    setSelected({
                      key: `${g.x}-${g.y}`,
                      cases: g.cases,
                      anchor: e.currentTarget,
                      title: 'Risk map selection',
                    })
                  }
                >
                  <span>{g.cases.length}</span>
                </button>
              );
            })}
          </div>
          <div className="legend">
            {bands.map((b) => (
              <span key={b}>
                <i className={`legend-${b.toLowerCase()}`} />
                {b}
              </span>
            ))}
            <span>Number = cases</span>
          </div>
        </section>
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Risk distribution</h2>
            </div>
            <InfoButton label="Understanding risk bands">
              <p>
                Four equally weighted factors add to a score out of 12. Low: 0–{policy.lowMax};
                Medium: {policy.lowMax + 1}–{policy.highMin - 1}; High: {policy.highMin}–12. Review
                flags are assessed separately.
              </p>
              <p>Select a bar to see all cases in that band, including individual scores.</p>
            </InfoButton>
          </div>
          <div className="bar-chart" role="group" aria-label="Number of cases by risk band">
            <span className="bar-axis">Cases</span>
            <div className="bars">
              {bands.map((b, i) => (
                <div className="bar-column" key={b}>
                  <span className="bar-value">{counts[i].length}</span>
                  <button
                    aria-haspopup="dialog"
                    aria-expanded={selected?.key === b}
                    aria-label={`${b} risk: ${counts[i].length} cases`}
                    className={`bar bar-${b.toLowerCase()}`}
                    style={{ height: `${Math.max(3, (counts[i].length / max) * 220)}px` }}
                    onClick={(e) =>
                      setSelected({
                        key: b,
                        cases: counts[i],
                        anchor: e.currentTarget,
                        title: `${b} risk`,
                      })
                    }
                  />
                  <strong>{b}</strong>
                  <small>
                    {i === 0
                      ? `0–${policy.lowMax}`
                      : i === 1
                        ? `${policy.lowMax + 1}–${policy.highMin - 1}`
                        : `${policy.highMin}–12`}
                  </small>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-caption">{plotted.length} assessed cases · score out of 12</div>
        </section>
      </div>
      <section className="panel comparison">
        <div className="panel-heading">
          <div>
            <h2>Compare use cases</h2>
          </div>
          <span className="muted">Methodology v{policy.version}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Use case</th>
              <th>Risk</th>
              <th>Review</th>
              <th className="desktop-cell">C / I / R / R*</th>
            </tr>
          </thead>
          <tbody>
            {active.map((c) => (
              <tr key={c.id}>
                <td>
                  <a href={`#/case/${c.id}`}>{c.title}</a>
                  <small>{c.department}</small>
                </td>
                <td>
                  <Risk record={c} policy={policy} />
                </td>
                <td>
                  <Flag record={c} />
                </td>
                <td className="desktop-cell tabular">
                  {currentResult(c, policy) ? Object.values(c.answers).join(' / ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="table-note">
          *Complexity / Impact / Reach / Reliance. Drafts and rules-only cases remain in the table
          and are excluded from charts.
        </p>
      </section>
      {selected && (
        <CasePreview
          records={selected.cases}
          policy={policy}
          anchor={selected.anchor}
          title={selected.title}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
