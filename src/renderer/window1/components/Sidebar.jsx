import React, { useMemo } from 'react';
import { fullName } from '../../shared/constants.js';
import { EmptyState } from '../../shared/ui.jsx';

export default function Sidebar({ farmers, query, onQuery, selectedId, onSelect }) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return farmers;
    return farmers.filter((f) => {
      const name = fullName(f).toLowerCase();
      return name.includes(q) || (f.nin || '').toLowerCase().includes(q);
    });
  }, [farmers, query]);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-forest-900">
            Agriculteurs enregistrés
            <span className="font-arabic text-xs font-normal text-gray-400">(الفلاحون)</span>
          </h2>
          <span className="rounded-full bg-forest-500/10 px-2.5 py-0.5 text-xs font-bold text-forest-700">
            {filtered.length}
          </span>
        </div>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Rechercher par nom ou NIN..."
            dir="ltr"
            className="input-base pl-9 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🌱"
            message={query ? 'Aucun résultat' : 'Aucun agriculteur enregistré'}
            hint={query ? 'Essayez un autre nom ou NIN' : 'Utilisez « Nouveau » pour commencer'}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((f) => {
              const active = f.id === selectedId;
              return (
                <li key={f.id}>
                  <button
                    onClick={() => onSelect(f.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-forest-500 bg-forest-500/10 shadow-sm'
                        : 'border-transparent bg-gray-50 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <p className="truncate text-sm font-bold text-gray-800">{fullName(f) || '—'}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-gray-500">NIN: {f.nin || '—'}</p>
                    <p className="truncate text-xs text-forest-700">{f.wilaya || '—'}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
