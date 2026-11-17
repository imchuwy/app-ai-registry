import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, ArrowUpRight } from 'lucide-react';
import { currentResult, requiresReview, type UseCase, type Policy } from './domain';

export function Risk({ record, policy }: { record: UseCase; policy: Policy }) {
  const r = currentResult(record, policy);
  return r ? (
    <span className={`risk risk-${r.band.toLowerCase()}`}>
      <strong>
        {r.score}
        <span className="risk-max">/12</span>
      </strong>{' '}
      {r.band}
    </span>
  ) : (
    <span className="muted">{!record.isAI ? 'Not AI' : 'Incomplete'}</span>
  );
}
export function Flag({ record }: { record: UseCase }) {
  return (
    <span className={requiresReview(record) ? 'flag' : ''}>
      {record.isAI && !record.flagsConfirmed
        ? 'Pending'
        : requiresReview(record)
          ? 'Required'
          : 'None'}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="header-actions">{children}</div>}
    </header>
  );
}
export function Floating({
  anchor,
  onClose,
  label,
  children,
}: {
  anchor: HTMLElement;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 16, top: 80 });
  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect();
    const box = ref.current!.getBoundingClientRect();
    setPosition({
      left: Math.max(12, Math.min(r.right - box.width, window.innerWidth - box.width - 12)),
      top: Math.max(12, Math.min(r.bottom + 8, window.innerHeight - box.height - 12)),
    });
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [anchor]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node) && !anchor.contains(event.target as Node))
        onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        anchor.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
      window.removeEventListener('resize', onClose);
    };
  }, [anchor, onClose]);
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={label}
      className="floating"
      style={position}
    >
      <div className="floating-heading">
        <strong>{label}</strong>
        <button
          className="icon-button"
          onClick={() => {
            onClose();
            anchor.focus();
          }}
          aria-label="Close popup"
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </div>,
    document.body,
  );
}
export function InfoButton({ label, children }: { label: string; children: ReactNode }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button
        className="info-button"
        aria-label={label}
        aria-expanded={!!anchor}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
      >
        <Info size={17} />
      </button>
      {anchor && (
        <Floating anchor={anchor} onClose={() => setAnchor(null)} label={label}>
          <div className="help-content">{children}</div>
        </Floating>
      )}
    </>
  );
}
export function CasePreview({
  records,
  policy,
  anchor,
  onClose,
  title,
}: {
  records: UseCase[];
  policy: Policy;
  anchor: HTMLElement;
  onClose: () => void;
  title: string;
}) {
  return (
    <Floating
      anchor={anchor}
      onClose={onClose}
      label={`${title} · ${records.length} ${records.length === 1 ? 'case' : 'cases'}`}
    >
      <div className="preview-list">
        {records.map((c) => (
          <article className="preview-case" key={c.id}>
            <a href={`#/case/${c.id}`} onClick={onClose}>
              {c.title}
              <ArrowUpRight size={15} />
            </a>
            <p>{c.description}</p>
            <div className="preview-meta">
              <span>
                {c.department} · {c.stage}
              </span>
              <span>{c.owner}</span>
            </div>
            <div className="inline">
              <Risk record={c} policy={policy} />
              <span>
                Review: <Flag record={c} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </Floating>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog ref={ref} className="confirm-dialog" onCancel={onClose} aria-labelledby="confirmation-title">
      <h2 id="confirmation-title">{title}</h2>
      <p>{description}</p>
      <div className="inline end">
        <button onClick={onClose} autoFocus>
          Cancel
        </button>
        <button
          className="danger-button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirm
        </button>
      </div>
    </dialog>
  );
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
