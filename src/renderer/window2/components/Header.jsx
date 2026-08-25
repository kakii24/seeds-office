import React from 'react';
import { formatDA } from '../../shared/constants.js';

function Stat({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex flex-col rounded-lg bg-white/10 px-4 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-white/60">{label}</span>
      <span className={`text-lg font-bold leading-tight ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function Header({ stats, onNew, onExport, onPrint }) {
  return (
    <header className="no-print z-20 bg-gradient-to-r from-olive-900 to-olive-700 px-6 pb-4 pt-3 text-white shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">📦</span>
          <div>
            <h1 className="text-base font-bold leading-tight md:text-lg">Suivi de Distribution et Facturation</h1>
            <p className="text-xs font-medium text-white/70">Fenêtre 2 — Livraison</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onNew} className="btn bg-amber2-500 text-white shadow-sm hover:brightness-110">
            <Icon path="M12 5v14M5 12h14" /> Enregistrer une livraison
          </button>
          <button onClick={onExport} className="btn bg-blue-600 text-white hover:bg-blue-700">
            <Icon path="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /> Exporter Excel
          </button>
          <button onClick={onPrint} className="btn-ghost">
            <Icon path="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /> Imprimer
          </button>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Effectué" value={stats.done} valueClass="text-emerald-300" />
        <Stat label="En attente" value={stats.pending} valueClass="text-amber-200" />
        <Stat label="Montant total" value={formatDA(stats.amountTotal)} valueClass="text-amber-300" />
      </div>
    </header>
  );
}

function Icon({ path }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
