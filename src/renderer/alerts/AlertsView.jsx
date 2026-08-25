import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fullName, displayDate, todayISO } from '../shared/constants.js';
import { EmptyState } from '../shared/ui.jsx';
import { useToast } from '../shared/Toast.jsx';

function StatCard({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex flex-col rounded-lg bg-white/10 px-4 py-2 border border-white/5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/70">
        {label}
      </span>
      <span className={`text-lg font-bold leading-tight ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function AlertsView() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const deliveries = await window.api.getDeliveries();
      setData(deliveries);
    } catch (e) {
      toast.error(`Erreur lors du chargement des alertes : ${e.message}`);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    const off = window.api.onDataChanged(loadData);
    return off;
  }, [loadData]);

  // Month extraction logic
  const MONTHS = {
    'janvier': 1, 'janv': 1, '01': 1, '1': 1,
    'février': 2, 'fevrier': 2, 'fev': 2, '02': 2, '2': 2,
    'mars': 3, 'mar': 3, '03': 3, '3': 3,
    'avril': 4, 'avr': 4, '04': 4, '4': 4,
    'mai': 5, '05': 5, '5': 5,
    'juin': 6, 'jun': 6, '06': 6, '6': 6,
    'juillet': 7, 'juil': 7, '07': 7, '7': 7,
    'août': 8, 'aout': 8, '08': 8, '8': 8,
    'septembre': 9, 'sept': 9, '09': 9, '9': 9,
    'octobre': 10, 'oct': 10, '10': 10,
    'novembre': 11, 'nov': 11, '11': 11,
    'décembre': 12, 'decembre': 12, 'dec': 12, '12': 12
  };

  const extractLimitMonth = useCallback((periodStr) => {
    if (!periodStr) return null;
    const s = String(periodStr).toLowerCase();
    const tokens = s.split(/[\s/\-]+/);
    let lastMonth = null;
    for (const token of tokens) {
      if (MONTHS[token]) {
        lastMonth = MONTHS[token];
      } else {
        for (const [key, val] of Object.entries(MONTHS)) {
          if (key.length >= 3 && token.includes(key)) {
            lastMonth = val;
          }
        }
      }
    }
    return lastMonth;
  }, []);

  // Overdue logic filtering
  const overdueRecords = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;

    return data
      .filter((r) => {
        const limitMonth = extractLimitMonth(r.period);
        if (limitMonth === null) return false;
        
        // Overdue if current month is AFTER the Période d'utilisation
        return currentMonth > limitMonth;
      })
      .map((r) => {
        const limitMonth = extractLimitMonth(r.period);
        const monthsOverdue = currentMonth - limitMonth;
        return {
          ...r,
          monthsOverdue,
        };
      })
      // Sort descending by months overdue
      .sort((a, b) => b.monthsOverdue - a.monthsOverdue);
  }, [data, extractLimitMonth]);

  // Search filtering
  const filteredOverdue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return overdueRecords;

    return overdueRecords.filter((r) => {
      const name = fullName(r).toLowerCase();
      const nin = (r.nin || '').toLowerCase();
      const carte = (r.num_carte_nationale || '').toLowerCase();
      return name.includes(q) || nin.includes(q) || carte.includes(q);
    });
  }, [overdueRecords, search]);

  const maxOverdueMonths = useMemo(() => {
    if (overdueRecords.length === 0) return 0;
    return Math.max(...overdueRecords.map((r) => r.monthsOverdue));
  }, [overdueRecords]);

  // Native print function
  const handlePrint = () => window.print();

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Header bar */}
      <header className="no-print z-20 bg-gradient-to-r from-red-950 to-red-800 px-6 pb-4 pt-3 text-white shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">🚨</span>
            <div>
              <h1 className="text-base font-bold leading-tight md:text-lg">
                Tableau des Alertes de Dépassement
              </h1>
              <p className="text-xs font-medium text-white/70">
                Suivi des délais d'épandage des engrais réglementés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-ghost flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
              </svg> 
              Imprimer les alertes
            </button>
          </div>
        </div>

        {/* Live stats */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Dépassements Actifs" value={overdueRecords.length} valueClass="text-red-200" />
          <StatCard label="Plus Long Retard" value={maxOverdueMonths > 0 ? `${maxOverdueMonths} mois` : '—'} valueClass="text-amber-300" />
          <StatCard label="Filtré par recherche" value={filteredOverdue.length} valueClass="text-white" />
        </div>
      </header>

      {/* Filter and Content section */}
      <div className="no-print flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-xs">
        <div className="relative w-full max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom d'agriculteur ou NIN..."
            dir="ltr"
            className="input-base pl-9 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>
        <div className="text-xs text-gray-500">
          Date système : {displayDate(todayISO())}
        </div>
      </div>

      {/* Main Table view */}
      <div className="printable flex-1 overflow-auto p-6">
        {/* Printable title */}
        <div className="hidden pb-4 print:block">
          <h2 className="text-lg font-bold text-red-950">Liste des Agriculteurs en Dépassement de Délai d'Utilisation</h2>
          <p className="text-xs text-gray-600">Date d'édition : {displayDate(todayISO())}</p>
        </div>

        {filteredOverdue.length === 0 ? (
          <EmptyState
            icon="🎉"
            message={search ? "Aucun résultat pour cette recherche" : "Aucun dépassement de délai détecté"}
            hint={search ? "Modifiez votre recherche" : "Tous les agriculteurs sont dans les délais d'utilisation réglementaires"}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="bg-red-950 text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3 border-b border-red-900 w-12">#</th>
                  <th className="px-4 py-3 border-b border-red-900">Agriculteur</th>
                  <th className="px-4 py-3 border-b border-red-900">NIN</th>
                  <th className="px-4 py-3 border-b border-red-900">N° Téléphone</th>
                  <th className="px-4 py-3 border-b border-red-900">Type d'engrais</th>
                  <th className="px-4 py-3 border-b border-red-900">Quantité</th>
                  <th className="px-4 py-3 border-b border-red-900">Période d'utilisation</th>
                  <th className="px-4 py-3 border-b border-red-900 text-center w-40">Mois de retard</th>
                </tr>
              </thead>
              <tbody>
                {filteredOverdue.map((r, index) => {
                  const nameStr = fullName(r) || '—';
                  const fertilizerType = r.type_engrais_sollicite || r.type || '—';
                  const qty = r.qte_engrais_autorisee_ql || r.quantity_requested || '—';
                  
                  return (
                    <tr
                      key={r.id}
                      className="bg-red-50/50 transition hover:bg-red-100/40 border-b border-red-100/50"
                    >
                      <td className="px-4 py-3 text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{nameStr}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {r.nin || r.num_carte_nationale || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.phone ? (
                          <a
                            href={`tel:${r.phone}`}
                            className="no-print inline-flex items-center gap-1 text-red-700 hover:text-red-900 hover:underline font-mono"
                          >
                            <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {r.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400 font-mono">—</span>
                        )}
                        {/* Printable version of phone number (non-clickable) */}
                        <span className="hidden print:inline font-mono">{r.phone || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{fertilizerType}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {qty} {qty !== '—' && (r.quantity_unit || 'ql')}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {r.period || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="pill bg-red-100 text-red-700 font-bold border border-red-200">
                          {r.monthsOverdue} mois
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
