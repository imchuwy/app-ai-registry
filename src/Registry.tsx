import { useState } from 'react';
import { Plus, Search, Download, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { departments, currentResult, csv, type Role, type UseCase, type Policy } from './domain';
import { PageHeader, Risk, Flag, Floating, CasePreview, Confirm, download } from './ui';
import { type DemoStore } from './store';
export function Registry({
  cases,
  policy,
  role,
  store,
  report,
}: {
  cases: UseCase[];
  policy: Policy;
  role: Role;
  store: DemoStore;
  report: (f: () => void) => void;
}) {
  const [search, setSearch] = useState(''),
    [department, setDepartment] = useState('All'),
    [archive, setArchive] = useState('Active'),
    [risk, setRisk] = useState('All'),
    [review, setReview] = useState(
      location.hash.includes('review=awaiting') ? 'Awaiting review' : 'All',
    ),
    [sort, setSort] = useState<'title' | 'score'>('title'),
    [reverse, setReverse] = useState(false);
  const [menu, setMenu] = useState<{ record: UseCase; anchor: HTMLElement } | null>(null),
    [preview, setPreview] = useState<typeof menu>(null),
    [deleting, setDeleting] = useState<UseCase | null>(null);
  const rows = cases
    .filter(
      (c) =>
        (c.title + ' ' + c.description + ' ' + c.department)
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (department === 'All' || c.department === department) &&
        (archive === 'All' || c.archived === (archive === 'Archived')) &&
        (risk === 'All' || currentResult(c, policy)?.band === risk) &&
        (review === 'All' || c.status === review),
    )
    .sort(
      (a, b) =>
        (reverse ? -1 : 1) *
        (sort === 'title'
          ? a.title.localeCompare(b.title)
          : (currentResult(a, policy)?.score ?? -1) - (currentResult(b, policy)?.score ?? -1)),
    );
  function toggleSort(next: typeof sort) {
    if (sort === next) setReverse(!reverse);
    else {
      setSort(next);
      setReverse(false);
    }
  }
  function clear() {
    setSearch('');
    setDepartment('All');
    setArchive('Active');
    setRisk('All');
    setReview('All');
  }
  return (
    <>
      <PageHeader title="Registry">
        <a className="button primary" href="#/new">
          <Plus size={18} />
          Add use case
        </a>
      </PageHeader>
      <section className="panel registry-panel">
        <div className="filterbar">
          <label className="search">
            <Search size={18} />
            <span className="sr-only">Search use cases</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search names, descriptions…"
            />
          </label>
          <label>
            Department
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option>All</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            View
            <select value={archive} onChange={(e) => setArchive(e.target.value)}>
              {['Active', 'Archived', 'All'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <details className="more-filters">
            <summary>More filters{risk !== 'All' || review !== 'All' ? ' •' : ''}</summary>
            <div className="inline">
              <label>
                Risk
                <select value={risk} onChange={(e) => setRisk(e.target.value)}>
                  {['All', 'Low', 'Medium', 'High'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={review} onChange={(e) => setReview(e.target.value)}>
                  {[
                    'All',
                    'Draft',
                    'Awaiting review',
                    'Approved',
                    'Changes requested',
                    'Recorded',
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>
          </details>
          <button className="text-button" onClick={clear}>
            Clear filters
          </button>
        </div>
        <div className="table-toolbar">
          <span>
            {rows.length} of {cases.length} use cases
          </span>
          <button
            onClick={() => download('ai-registry.csv', csv(rows, policy), 'text/csv;charset=utf-8')}
          >
            <Download size={16} />
            Export filtered CSV
          </button>
        </div>
        <table className="registry-table">
          <thead>
            <tr>
              <th aria-sort={sort === 'title' ? (reverse ? 'descending' : 'ascending') : 'none'}>
                <button className="sort" onClick={() => toggleSort('title')}>
                  Use case <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="desktop-cell">Department / Owner</th>
              <th aria-sort={sort === 'score' ? (reverse ? 'descending' : 'ascending') : 'none'}>
                <button className="sort" onClick={() => toggleSort('score')}>
                  Risk <ArrowUpDown size={14} />
                </button>
              </th>
              <th>Review</th>
              <th className="desktop-cell">Lifecycle</th>
              <th className="desktop-cell">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <a className="case-name" href={`#/case/${c.id}`}>
                    {c.title}
                  </a>
                  <small>{c.status}</small>
                  <div className="mobile-meta">
                    <small>
                      {c.department} · {c.stage}
                    </small>
                    <details>
                      <summary>More details</summary>
                      <small>
                        {c.owner}
                        <br />
                        {c.visibility}
                        <br />
                        {c.archived ? 'Archived' : 'Active'}
                      </small>
                    </details>
                  </div>
                </td>
                <td className="desktop-cell">
                  {c.department}
                  <small>{c.owner}</small>
                </td>
                <td>
                  <Risk record={c} policy={policy} />
                </td>
                <td>
                  <Flag record={c} />
                  <button
                    className="icon-button mobile-action"
                    onClick={(e) => setMenu({ record: c, anchor: e.currentTarget })}
                    aria-label={`Actions for ${c.title}`}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </td>
                <td className="desktop-cell">{c.stage}</td>
                <td className="desktop-cell">
                  <button
                    className="icon-button"
                    onClick={(e) => setMenu({ record: c, anchor: e.currentTarget })}
                    aria-label={`Actions for ${c.title}`}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty">
            <h2>No matching use cases</h2>
            <p>Try a different search or clear the current filters.</p>
            <button onClick={clear}>Clear filters</button>
          </div>
        )}
      </section>
      {menu && (
        <Floating anchor={menu.anchor} onClose={() => setMenu(null)} label="Case actions">
          <div className="action-list">
            <button
              onClick={() => {
                setPreview(menu);
                setMenu(null);
              }}
            >
              Preview summary
            </button>
            <a href={`#/case/${menu.record.id}`} onClick={() => setMenu(null)}>
              Open case
            </a>
            {role !== 'Reviewer' && (
              <>
                {!menu.record.archived && <a href={`#/edit/${menu.record.id}`}>Edit assessment</a>}
                <button
                  onClick={() => {
                    report(() => store.archive(menu.record.id, menu.record.version, role));
                    setMenu(null);
                  }}
                >
                  {menu.record.archived ? 'Restore case' : 'Archive case'}
                </button>
              </>
            )}
            {role === 'Administrator' && (
              <button
                className="danger-text"
                onClick={() => {
                  setDeleting(menu.record);
                  setMenu(null);
                }}
              >
                Delete permanently
              </button>
            )}
          </div>
        </Floating>
      )}
      {preview && (
        <CasePreview
          records={[preview.record]}
          anchor={preview.anchor}
          policy={policy}
          title="Case preview"
          onClose={() => setPreview(null)}
        />
      )}
      {deleting && (
        <Confirm
          title="Delete this demo case?"
          description="This removes its local history as well. Reset demo can restore the original examples, but not your own additions."
          onClose={() => setDeleting(null)}
          onConfirm={() => report(() => store.delete(deleting.id, deleting.version, role))}
        />
      )}
    </>
  );
}
