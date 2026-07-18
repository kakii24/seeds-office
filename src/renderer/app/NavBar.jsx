import React from 'react';

const TABS = [
  { id: 'registration', icon: '🌾', fr: 'Enregistrement', ar: 'التسجيل' },
  { id: 'distribution', icon: '📦', fr: 'Suivi de Distribution', ar: 'التوزيع' },
  { id: 'alerts', icon: '⚠️', fr: "Alertes d'utilisation", ar: 'تنبيهات الاستعمال' }
];

/** Top navigation bar that switches between the two in-app views. */
export default function NavBar({ view, onChange }) {
  return (
    <nav className="no-print flex items-center justify-between gap-4 bg-[#10231a] px-5 py-2 text-white shadow-lg">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-xl leading-none">🌾</span>
        <span className="truncate text-sm font-bold text-white/90">
          Bureau de Distribution des Semences Subventionnées
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 p-1">
        {TABS.map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                active ? 'bg-white text-[#10231a] shadow-sm' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.fr}</span>
              <span className={`font-arabic text-xs ${active ? 'text-gray-400' : 'text-white/50'}`}>({t.ar})</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
