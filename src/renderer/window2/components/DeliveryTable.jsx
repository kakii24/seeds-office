import React, { useMemo } from 'react';
import { cropFr, cropAr, formatDA, displayDate, fullName } from '../../shared/constants.js';
import { EmptyState } from '../../shared/ui.jsx';

const COLS = [
  '#',
  'Agriculteur (الفلاح)',
  'NIN (رقم التعريف الوطني)',
  'Culture (المحصول)',
  'Type (النوع)',
  'Produit (نوع المنتج)',
  'Qté demandée (الكمية المطلوبة)',
  'Unité (الوحدة)',
  'Période (فترة الاستخدام)',
  'Opérateur (المزود)',
  'Qté livrée (الكمية المسلمة)',
  'Montant (DA) (المبلغ)',
  'N° Facture (رقم الفاتورة)',
  'Date (التاريخ)',
  'Service fait (الخدمة)',
  'Actions'
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
  // Group by unique farmer, sort by last name alphabetically, and flatten with rowSpan info
  const groupedRows = useMemo(() => {
    const groups = {};
    for (const r of rows) {
      const fId = r.farmer_id;
      if (!groups[fId]) {
        groups[fId] = {
          farmer_id: fId,
          last_name: r.last_name || '',
          first_name: r.first_name || '',
          nin: r.nin || '',
          deliveries: []
        };
      }
      groups[fId].deliveries.push(r);
    }

    const sortedGroups = Object.values(groups).sort((a, b) => {
      const nameA = a.last_name.toLowerCase();
      const nameB = b.last_name.toLowerCase();
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    const flat = [];
    for (const g of sortedGroups) {
      g.deliveries.forEach((d, idx) => {
        flat.push({
          ...d,
          isFirstOfGroup: idx === 0,
          groupSize: g.deliveries.length
        });
      });
    }
    return flat;
  }, [rows]);

  return (
    <div className="printable print-wide flex-1 overflow-auto">
      <div className="hidden px-2 py-3 print:block">
        <h2 className="text-base font-bold">Suivi de Distribution et Facturation — Semences Subventionnées</h2>
        <p className="text-xs text-gray-600">Date d'impression : {displayDate(new Date().toISOString().slice(0, 10))}</p>
      </div>

      {groupedRows.length === 0 ? (
        <EmptyState icon="📭" message="Aucune livraison à afficher" hint="Ajustez les filtres ou enregistrez une nouvelle livraison" />
      ) : (
        <table className="w-full min-w-[1250px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="sticky top-0 z-10 bg-olive-900 text-left text-xs font-semibold uppercase tracking-wide text-white">
              {COLS.map((c) => (
                <th
                  key={c}
                  className={`whitespace-nowrap border-b border-olive-700 px-3 py-2.5 ${c === 'Actions' ? 'no-print' : ''}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((r, i) => (
              <tr key={r.id} className="bg-white transition hover:bg-olive-700/5">
                <td className="border-b border-gray-100 px-3 py-2 text-gray-500">{i + 1}</td>
                
                {r.isFirstOfGroup ? (
                  <td
                    rowSpan={r.groupSize}
                    className="border-b border-gray-200 px-3 py-2 font-bold text-gray-800 bg-olive-700/5 align-top"
                  >
                    {fullName(r)}
                  </td>
                ) : null}

                {r.isFirstOfGroup ? (
                  <td
                    rowSpan={r.groupSize}
                    className="border-b border-gray-200 px-3 py-2 font-mono text-xs text-gray-600 bg-olive-700/5 align-top"
                  >
                    {r.nin || '—'}
                  </td>
                ) : null}

                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2">
                  {cropFr(r.crop_category) || '—'}
                  {cropAr(r.crop_category) && <span className="font-arabic text-xs text-gray-400"> ({cropAr(r.crop_category)})</span>}
                </td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.type || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.product_nature || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.quantity_requested || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.quantity_unit || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.period || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.operator || '—'}</td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{r.quantity_delivered || '—'}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 font-bold text-amber2-500">{formatDA(r.amount)}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 font-mono text-xs text-gray-700">{r.invoice_number || '—'}</td>
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-gray-700">{displayDate(r.delivery_date)}</td>
                <td className="border-b border-gray-100 px-3 py-2"><ServicePill value={r.service_done} /></td>
                <td className="no-print whitespace-nowrap border-b border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(r)}
                      className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                        r.delivery_id
                          ? 'border-olive-700/30 text-olive-700 hover:bg-olive-700/10'
                          : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {r.delivery_id ? 'Modifier' : 'Saisir livraison'}
                    </button>
                    {r.delivery_id ? (
                      <button
                        onClick={() => onDelete(r.delivery_id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    ) : (
                      <button
                        disabled
                        className="rounded-md border border-gray-100 px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-50 cursor-not-allowed"
                      >
                        Supprimer
                      </button>
                    )}
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
