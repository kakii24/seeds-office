import React from 'react';
import { CROP_CATEGORIES } from '../../shared/constants.js';

const ACCENT = 'focus:border-olive-700 focus:ring-olive-700/25';

export default function FilterBar({ filters, onChange, onReset }) {
  return (
    <div className="no-print flex flex-wrap items-end gap-3 border-b border-gray-200 bg-white px-6 py-3">
      <div className="min-w-[180px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Recherche par Agriculteur</label>
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={filters.searchName}
            onChange={(e) => onChange({ searchName: e.target.value })}
            placeholder="Nom de l'agriculteur..."
            dir="ltr"
            className={`input-base pl-9 focus:ring-2 ${ACCENT}`}
          />
        </div>
      </div>

      <div className="min-w-[140px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Recherche par NIN</label>
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={filters.searchNIN}
            onChange={(e) => onChange({ searchNIN: e.target.value })}
            placeholder="NIN..."
            dir="ltr"
            className={`input-base pl-9 focus:ring-2 ${ACCENT}`}
          />
        </div>
      </div>

      <div className="min-w-[150px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Recherche par Opérateur</label>
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={filters.searchOperator}
            onChange={(e) => onChange({ searchOperator: e.target.value })}
            placeholder="Opérateur..."
            dir="ltr"
            className={`input-base pl-9 focus:ring-2 ${ACCENT}`}
          />
        </div>
      </div>

      <div className="w-36">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Culture</label>
        <select value={filters.culture} onChange={(e) => onChange({ culture: e.target.value })} className={`input-base focus:ring-2 ${ACCENT}`}>
          <option value="">Toutes</option>
          {CROP_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.fr}</option>
          ))}
        </select>
      </div>

      <div className="w-32">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Statut</label>
        <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className={`input-base focus:ring-2 ${ACCENT}`}>
          <option value="">Tous</option>
          <option value="Oui">Effectué</option>
          <option value="Non">En attente</option>
        </select>
      </div>

      <div className="w-36">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Du</label>
        <input type="date" value={filters.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} dir="ltr" className={`input-base focus:ring-2 ${ACCENT}`} />
      </div>

      <div className="w-36">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Au</label>
        <input type="date" value={filters.dateTo} onChange={(e) => onChange({ dateTo: e.target.value })} dir="ltr" className={`input-base focus:ring-2 ${ACCENT}`} />
      </div>

      <button onClick={onReset} className="btn-neutral h-[38px] shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v6h6M3 13a9 9 0 1 0 3-7.7L3 8" />
        </svg>
        Réinitialiser
      </button>
    </div>
  );
}
