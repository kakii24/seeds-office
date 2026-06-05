import React from 'react';
import { cropFr, cropAr, formatDA, displayDate, fullName } from '../../shared/constants.js';
import { EmptyState } from '../../shared/ui.jsx';

const COLS = [
  '#', 'Agriculteur', 'NIN', 'Culture (الصنف)', 'Produit (المنتج)', 'Qté demandée',
  'Période', 'Opérateur', 'Qté livrée', 'Montant (DA)', 'N° Facture', 'Date', 'Service fait', 'Actions'
];

function ServicePill({ value }) {
  const done = value === 'Oui';
  return (
    <span className={`pill ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      {done ? 'Oui ✓' : 'Non ✗'}
    </span>
  );
}

export default function DeliveryTable({ rows, onEdit, onDelete }) {
  return (
    <div className="printable flex-1 overflow-auto">
      <div className="hidden px-2 py-3 print:block">
        <h2 className="text-base font-bold">Suivi de Distribution et Facturation — Semences Subventionnées</h2>
        <p className="text-xs text-gray-600">Date d'impression : {displayDate(new Date().toISOString().slice(0, 10))}</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="📭" message="Aucune livraison à afficher" hint="Ajustez les filtres ou enregistrez une nouvelle livraison" />
      ) : (
        <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="sticky top-0 z-10 bg-olive-900 text-left text-xs font-semibold uppercase tracking-wide text-white">
              {COLS.map((c) => (
                <th key={c} className="whitespace-nowrap border-b border-olive-700 px-3 py-2.5">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="bg-white transition hover:bg-olive-700/5">
                <td className="border-b border-gray-100 px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 font-bold text-gray-800">{fullName(r)}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 font-mono text-xs text-gray-600">{r.nin || '—'}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2">
                  {cropFr(r.crop_category) || '—'}
                  {cropAr(r.crop_category) && <span className="font-arabic text-xs text-gray-400"> ({cropAr(r.crop_category)})</span>}
                </td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.product_nature || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.quantity_requested || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.period || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.operator || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.quantity_delivered || '—'}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 font-bold text-amber2-500">{formatDA(r.amount)}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 font-mono text-xs text-gray-700">{r.invoice_number || '—'}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-gray-700">{displayDate(r.delivery_date)}</td>
                <td className="border-b border-gray-100 px-3 py-2"><ServicePill value={r.service_done} /></td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2">
                  <div className="no-print flex items-center gap-1.5">
                    <button onClick={() => onEdit(r)} className="rounded-md border border-olive-700/30 px-2 py-1 text-xs font-semibold text-olive-700 transition hover:bg-olive-700/10">
                      Modifier
                    </button>
                    <button onClick={() => onDelete(r.id)} className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
