import { useEffect, useState, useSyncExternalStore, Component, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Table2,
  BookOpen,
  Menu,
  X,
  RotateCcw,
  ArrowUpRight,
  Download,
  Mountain,
} from 'lucide-react';
import { DemoStore, type StoragePort } from './store';
import { roles, visibleCases, type Role } from './domain';
import { Dashboard } from './Dashboard';
import { Registry } from './Registry';
import { CaseEditor } from './CaseEditor';
import { CaseDetail } from './CaseDetail';
import { Methodology } from './Methodology';
import { Confirm, InfoButton, download } from './ui';
declare global {
  interface Window {
    OCAITheme: { get: () => string; set: (value: string) => void };
  }
}
let storage: StoragePort | null = null;
try {
  storage = window.localStorage;
} catch {
  /* In-memory demo remains usable. */
}
const store = new DemoStore(storage);
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="empty">
        <h1>Something interrupted the demo</h1>
        <p>Your saved browser data has not been cleared. Reload to try again.</p>
        <button onClick={() => location.reload()}>Reload</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  const [role, setRole] = useState<Role>('Owner');
  const [theme, setTheme] = useState(window.OCAITheme.get());
  const [drawer, setDrawer] = useState(false);
  const [reset, setReset] = useState(false);
  const [message, setMessage] = useState('');
  const [about, setAbout] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const navigate = () => {
      setRoute(location.hash.slice(1) || '/');
      setDrawer(false);
      window.scrollTo(0, 0);
    };
    const changed = (e: StorageEvent) => {
      if (e.key === 'oc-ai-registry-v1' || e.key === null) store.refresh();
    };
    const themes = () => setTheme(window.OCAITheme.get());
    const network = () => setOnline(navigator.onLine);
    window.addEventListener('hashchange', navigate);
    window.addEventListener('storage', changed);
    window.addEventListener('oc-ai-theme-change', themes);
    window.addEventListener('online', network);
    window.addEventListener('offline', network);
    return () => {
      window.removeEventListener('hashchange', navigate);
      window.removeEventListener('storage', changed);
      window.removeEventListener('oc-ai-theme-change', themes);
      window.removeEventListener('online', network);
      window.removeEventListener('offline', network);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 9000);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (!drawer) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawer(false);
        document.getElementById('mobile-menu')?.focus();
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [drawer]);
  const cases = visibleCases(data.cases, role);
  const path = route.split('?')[0];
  const id = path.split('/')[2];
  const record = cases.find((c) => c.id === id);
  const editing = path === '/new' || path.startsWith('/edit/');
  function report(action: () => void) {
    try {
      action();
      setMessage('Saved in this demo.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The action could not be completed.');
    }
  }
  const links = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/registry', label: 'Registry', icon: Table2 },
    { href: '/methodology', label: 'Methodology', icon: BookOpen },
  ];
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="mobile-header">
        <a href="#/" aria-label="OC AI home">
          <img src={`${import.meta.env.BASE_URL}brand/mascot.webp`} width="40" height="40" alt="" />
          <strong>AI Registry</strong>
        </a>
        <button
          id="mobile-menu"
          className="icon-button"
          aria-expanded={drawer}
          aria-controls="sidebar"
          aria-label={drawer ? 'Close navigation' : 'Open navigation'}
          onClick={() => setDrawer(!drawer)}
        >
          {drawer ? <X /> : <Menu />}
        </button>
      </header>
      {drawer && (
        <button
          className="drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside className={`sidebar ${drawer ? 'is-open' : ''}`} id="sidebar">
        <a href="#/" className="brand-link" aria-label="OC AI home">
          <img
            className="logo-light"
            src={`${import.meta.env.BASE_URL}brand/logo-light.webp`}
            width="148"
            height="80"
            alt=""
          />
          <img
            className="logo-dark"
            src={`${import.meta.env.BASE_URL}brand/logo-dark.webp`}
            width="148"
            height="80"
            alt=""
          />
        </a>
        <div className="workspace-label">AI Registry</div>
        <nav aria-label="Main navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <a key={href} href={`#${href}`} aria-current={path === href ? 'page' : undefined}>
              <Icon size={19} />
              {label}
              {label === 'Registry' && <small>{cases.length}</small>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-indicator">
            <span />
            Demo
            <InfoButton label="About demo data">
              <p>
                Fictional data. Changes stay in your browser. Roles simulate a workflow; they do not
                provide security.
              </p>
            </InfoButton>
          </div>
          <label htmlFor="role">
            Preview as
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  Demo {r}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="theme">
            Appearance
            <select
              id="theme"
              value={theme}
              onChange={(e) => {
                window.OCAITheme.set(e.target.value);
                setTheme(e.target.value);
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <details className="demo-menu">
            <summary>Demo tools</summary>
            <button
              className="text-button"
              onClick={() =>
                download('ai-registry-demo.json', JSON.stringify(data, null, 2), 'application/json')
              }
            >
              <Download size={15} />
              Download local data
            </button>
            <button className="text-button" onClick={() => setReset(true)}>
              <RotateCcw size={15} />
              Reset demo
            </button>
            <button className="text-button" onClick={() => setAbout(!about)}>
              <Mountain size={15} />
              About this project
            </button>
          </details>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <span>
            OC AI /{' '}
            <strong>
              {editing
                ? 'Assessment'
                : path.startsWith('/case/')
                  ? 'Use case'
                  : (links.find((l) => l.href === path)?.label ?? 'Overview')}
            </strong>
          </span>
          <div>
            <span className="local-indicator" />
            <span className="topbar-role">Demo {role}</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {store.notice && (
            <div className="notice" role="status">
              {store.notice}
              <button className="text-button" onClick={() => setReset(true)}>
                Reset demo
              </button>
            </div>
          )}
          {!online && (
            <div className="notice">
              You are offline. This loaded demo continues to work locally; refreshing may require a
              connection.
            </div>
          )}
          {about && (
            <section className="notice">
              <div className="inline between">
                <h2>AI governance, made tangible.</h2>
                <button
                  className="icon-button"
                  aria-label="Close project information"
                  onClick={() => setAbout(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <p>
                A portfolio application demonstrating transparent scoring, assessment workflows,
                responsive data visualisation and local-first state. All ten examples and their
                histories are fictional. Roles and visibility simulate a workflow; they do not
                provide security. No real model, email service or database is connected.
              </p>
              <a href="#/methodology">
                Read the methodology <ArrowUpRight size={16} />
              </a>
            </section>
          )}
          {path === '/' ? (
            <Dashboard cases={cases} policy={data.policy} />
          ) : path === '/registry' ? (
            <Registry
              key={route}
              cases={cases}
              policy={data.policy}
              role={role}
              store={store}
              report={report}
            />
          ) : path === '/methodology' ? (
            <Methodology
              key={data.policy.version}
              policy={data.policy}
              role={role}
              store={store}
              report={report}
            />
          ) : path === '/new' || (path.startsWith('/edit/') && record) ? (
            <CaseEditor key={path} record={record} role={role} store={store} policy={data.policy} />
          ) : path.startsWith('/case/') && record ? (
            <CaseDetail
              key={record.id}
              record={record}
              policy={data.policy}
              role={role}
              store={store}
              report={report}
            />
          ) : (
            <section className="empty">
              <h1>Case not available</h1>
              <p>It may have been deleted or hidden for this simulated role.</p>
              <a className="button" href="#/registry">
                Return to registry
              </a>
            </section>
          )}
          {!editing && (
            <footer className="page-footer">
              <span>OC AI</span>
              <span>Synthetic data · Illustrative methodology v{data.policy.version}</span>
            </footer>
          )}
        </main>
      </div>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setMessage('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {reset && (
        <Confirm
          title="Start fresh?"
          description="This replaces all local edits, reviews and settings with the ten original fictional examples. Download local data first if you want to keep a copy."
          onClose={() => setReset(false)}
          onConfirm={() => {
            store.reset();
            location.hash = '/';
            setMessage('The original demo has been restored.');
          }}
        />
      )}
    </>
  );
}
