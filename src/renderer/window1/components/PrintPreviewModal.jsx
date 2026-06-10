import React, { useEffect } from 'react';
import { cropFr, displayDate, todayISO } from '../../shared/constants.js';

export default function PrintPreviewModal({ open, onClose, farmer, crops, onPrint }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const rows = (crops || []).filter(
    (c) => c.crop_category || c.superficie || c.product_nature || c.quantity_requested || c.period
  );

  return (
    <div
      className="print-overlay fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="mx-auto my-2 w-full max-w-4xl animate-modal-in" onClick={(e) => e.stopPropagation()}>
        {/* Toolbar — excluded from print */}
        <div className="no-print mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white drop-shadow">
            Aperçu d'impression — Demande de Semences Subventionnées
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-neutral">Fermer</button>
            <button onClick={onPrint} className="btn bg-forest-700 text-white hover:bg-forest-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
              </svg>
              Imprimer
            </button>
          </div>
        </div>

        {/* The official printable document */}
        <div className="printable mx-auto rounded-lg bg-white p-12 text-[12px] leading-relaxed text-black shadow-modal font-sans" style={{ minHeight: '297mm', width: '210mm' }}>
          
          {/* Header Section */}
          <div className="text-center">
            <p className="font-bold uppercase tracking-wider text-[11px] leading-tight">
              REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE
            </p>
            <p className="font-bold uppercase tracking-wider text-[10px] mt-1 leading-tight">
              MINISTERE DE L'AGRICULTURE ET DU DEVELOPPEMENT RURAL
            </p>
            <div className="mx-auto my-4 h-[1px] w-1/3 bg-black" />
            <h1 className="text-[13px] font-bold uppercase tracking-wide mt-2 px-4 leading-normal">
              DEMANDE D'OBTENTION DE SEMENCES ET INTRANTS AGRICOLES SUBVENTIONNES
            </h1>
          </div>

          {/* Subsidy Badge and Date */}
          <div className="mt-8 flex justify-between items-center text-[11px] border border-gray-400 p-2.5 rounded bg-gray-50/50">
            <span className="font-bold text-gray-800">
              Taux de Subvention de l'État: 50%
            </span>
            <span className="font-semibold text-gray-800">
              Date de la Demande: {displayDate(todayISO())}
            </span>
          </div>

          {/* SECTION 1: IDENTIFICATION */}
          <div className="mt-8">
            <h2 className="text-[12px] font-bold uppercase border-b-2 border-black pb-1 mb-4">
              SECTION 1: IDENTIFICATION DE L'AGRICULTEUR
            </h2>
            <div className="space-y-3.5 text-[11px]">
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="font-semibold">Nom de famille:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 min-w-[200px] px-1 font-medium text-gray-900">
                    {farmer.last_name || '\u00A0'}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold">Prénom:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 min-w-[200px] px-1 font-medium text-gray-900">
                    {farmer.first_name || '\u00A0'}
                  </span>
                </div>
              </div>

              <div className="flex">
                <span className="font-semibold">Raison Sociale:</span>
                <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                  {farmer.raison_sociale || '\u00A0'}
                </span>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="font-semibold">Numéro de Carte d'Identité Nationale:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 min-w-[150px] px-1 font-mono text-[10px] text-gray-900">
                    {farmer.nin || '\u00A0'}
                  </span>
                </div>
                <div className="flex-[0.8]">
                  <span className="font-semibold">Date d'Émission:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 min-w-[120px] px-1 font-medium text-gray-900">
                    {farmer.issue_date ? displayDate(farmer.issue_date) : '\u00A0'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="font-semibold">Date de Naissance:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 min-w-[120px] px-1 font-medium text-gray-900">
                    {farmer.dob ? displayDate(farmer.dob) : '\u00A0'}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold">Lieu de Naissance:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 min-w-[180px] px-1 font-medium text-gray-900">
                    {farmer.place_of_birth || '\u00A0'}
                  </span>
                </div>
              </div>

              <div className="flex">
                <span className="font-semibold">Adresse:</span>
                <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                  {farmer.address || '\u00A0'}
                </span>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex">
                  <span className="font-semibold">Commune:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                    {farmer.commune || '\u00A0'}
                  </span>
                </div>
                <div className="flex-1 flex">
                  <span className="font-semibold">Daïra:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                    {farmer.daira || '\u00A0'}
                  </span>
                </div>
                <div className="flex-1 flex">
                  <span className="font-semibold">Wilaya:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                    {farmer.wilaya || '\u00A0'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex">
                  <span className="font-semibold">Téléphone:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                    {farmer.phone || '\u00A0'}
                  </span>
                </div>
                <div className="flex-1 flex">
                  <span className="font-semibold">Fax:</span>
                  <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                    {farmer.fax || '\u00A0'}
                  </span>
                  <span className="text-[9px] text-gray-500 ml-1 mt-0.5">(Fax optionnel)</span>
                </div>
              </div>

              <div className="flex">
                <span className="font-semibold">Référence du Permis de Travail:</span>
                <span className="ml-2 border-b border-gray-400 inline-block flex-1 px-1 font-medium text-gray-900">
                  {farmer.work_permit_ref || '\u00A0'}
                </span>
                <span className="text-[9px] text-gray-500 ml-2 mt-0.5">(Optionnel)</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: DEMANDES */}
          <div className="mt-8">
            <h2 className="text-[12px] font-bold uppercase border-b-2 border-black pb-1 mb-4">
              SECTION 2: DEMANDES DE CULTURES ET SEMENCES
            </h2>
            <table className="w-full border-collapse border border-gray-400 text-[10.5px]">
              <thead>
                <tr className="bg-gray-100/70 text-center font-bold">
                  <th className="border border-gray-400 px-2 py-1.5 w-10">N°</th>
                  <th className="border border-gray-400 px-2 py-1.5 w-[160px]">
                    <div>Culture</div>
                    <div className="font-arabic text-[10px] font-normal mt-0.5 text-gray-600">(الصنف)</div>
                  </th>
                  <th className="border border-gray-400 px-2 py-1.5 w-[110px]">
                    <div>Superficie</div>
                    <div className="font-arabic text-[10px] font-normal mt-0.5 text-gray-600">(المساحة)</div>
                  </th>
                  <th className="border border-gray-400 px-2 py-1.5">
                    <div>Nature du Produit</div>
                    <div className="font-arabic text-[10px] font-normal mt-0.5 text-gray-600">(نوع المنتج)</div>
                  </th>
                  <th className="border border-gray-400 px-2 py-1.5 w-[80px]">Qté</th>
                  <th className="border border-gray-400 px-2 py-1.5 w-[80px]">Unité</th>
                  <th className="border border-gray-400 px-2 py-1.5 w-[100px]">Période</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={i} className="text-center h-8 font-medium">
                    <td className="border border-gray-400 px-2 py-1">{i + 1}</td>
                    <td className="border border-gray-400 px-2 py-1 text-left">{cropFr(c.crop_category) || '\u00A0'}</td>
                    <td className="border border-gray-400 px-2 py-1">{c.superficie || '\u00A0'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-left uppercase">{c.product_nature || '\u00A0'}</td>
                    <td className="border border-gray-400 px-2 py-1">{c.quantity_requested || '\u00A0'}</td>
                    <td className="border border-gray-400 px-2 py-1">{c.quantity_unit || '\u00A0'}</td>
                    <td className="border border-gray-400 px-2 py-1">{c.period || '\u00A0'}</td>
                  </tr>
                ))}
                {/* Pad with empty rows to have at least 3 rows visually */}
                {Array.from({ length: Math.max(0, 3 - rows.length) }).map((_, idx) => {
                  const rowNum = rows.length + idx + 1;
                  return (
                    <tr key={`empty-${idx}`} className="h-8 text-center text-gray-400">
                      <td className="border border-gray-400 px-2 py-1">{rowNum}</td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MENTIONS OBLIGATOIRES */}
          <div className="mt-8 border-t border-gray-400 pt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 mb-1">
              MENTIONS OBLIGATOIRES
            </h3>
            <p className="text-[9.5px] text-gray-600 leading-normal">
              L'agriculteur bénéficie d'une subvention de l'État à hauteur de 50% de la valeur des intrants agricoles demandés.
            </p>
          </div>

          {/* SIGNATURES */}
          <div className="mt-12">
            <div className="grid grid-cols-2 gap-8 text-[11px]">
              <div className="text-center h-28 flex flex-col justify-between">
                <div>
                  <p className="font-bold">Signature de l'Agriculteur</p>
                  <p className="text-gray-800 font-bold mt-1.5">{farmer.last_name || farmer.first_name ? `${farmer.last_name} ${farmer.first_name}`.trim() : ''}</p>
                </div>
                <div className="mt-auto border-t border-dashed border-gray-400 w-3/4 mx-auto pt-1 text-[9px] text-gray-400">
                  Signature de l'Agriculteur
                </div>
              </div>
              <div className="text-center h-28 flex flex-col justify-between">
                <p className="font-bold">Cachet et Signature du Service</p>
                <div className="mt-auto border-t border-dashed border-gray-400 w-3/4 mx-auto pt-1 text-[9px] text-gray-400">
                  [Office Stamp & Signature]
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="font-bold text-[11px]">Visa du Visionnaire de Permis</p>
              <div className="mt-14 border-b border-dashed border-gray-400 w-1/3 mx-auto" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
