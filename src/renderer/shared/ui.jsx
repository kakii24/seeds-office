import React, { useEffect } from 'react';

/** Small muted Arabic supplementary hint shown beside a French label. */
export function ArabicHint({ children }) {
  if (!children) return null;
  return <span className="font-arabic text-xs text-gray-400">({children})</span>;
}

/** Field label: French primary text + optional Arabic hint + required star. */
export function FieldLabel({ fr, ar, required, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="label-base">
      <span>{fr}</span>
      <ArabicHint>{ar}</ArabicHint>
      {required && <span className="req-star">*</span>}
    </label>
  );
}

/**
 * Labelled text/date input. `accentClass` supplies the focus-ring colour for
 * the active window (passed as a Tailwind class string by each window).
 */
export function Field({
  fr, ar, required, type = 'text', value, onChange,
  placeholder, accentClass = 'focus:border-forest-500 focus:ring-forest-500/30',
  className = '', id
}) {
  return (
    <div className={className}>
      <FieldLabel fr={fr} ar={ar} required={required} htmlFor={id} />
      <input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="ltr"
        className={`input-base focus:ring-2 ${accentClass}`}
      />
    </div>
  );
}

/**
 * Modal shell with dark overlay, rounded corners, gradient header band, and a
 * close button. `headerClass` controls the gradient per window.
 */
export function Modal({ open, onClose, title, subtitle, headerClass, children, footer, maxWidth = 'max-w-3xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 animate-fade-in">
      <div
        className={`my-6 w-full ${maxWidth} animate-modal-in overflow-hidden rounded-2xl bg-white shadow-modal`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-start justify-between gap-4 px-6 py-4 text-white ${headerClass}`}>
          <div>
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Fermer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Empty-state block: emoji icon + French message. */
export function EmptyState({ icon, message, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="text-4xl opacity-70">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
