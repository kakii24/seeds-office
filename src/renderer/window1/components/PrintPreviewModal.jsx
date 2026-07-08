import React, { useEffect } from 'react';
import { cropFr, displayDate } from '../../shared/constants.js';

export default function PrintPreviewModal({ open, onClose, farmer, crops, onPrint }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const rows = (crops || []).filter(
    (c) => c.crop_category || c.type || c.superficie || c.product_nature || c.quantity_requested || c.period
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
        <div className="printable mx-auto rounded-lg bg-white p-12 print:p-6 text-[12px] leading-relaxed text-black shadow-modal font-sans print:transform print:origin-top print:scale-[0.98]" style={{ minHeight: '297mm', width: '210mm' }}>
          
          {/* Header Section */}
          <div className="text-center">
            <p className="font-bold uppercase tracking-wider text-[11px] leading-tight">
              REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE
            </p>
            <p className="font-bold text-[13px] mt-1.5 leading-tight font-arabic" dir="rtl">
              وزارة الفلاحة والتنمية الريفية والصيد البحري
            </p>
            <p className="font-bold uppercase tracking-wider text-[9.5px] mt-1 leading-tight">
              MINISTERE DE L'AGRICULTURE ET DU DEVELOPPEMENT RURAL ET DE LA PECHE
            </p>
            <p className="font-bold text-[12px] mt-1 leading-tight font-arabic" dir="rtl">
              مديرية المصالح الفلاحية
            </p>
          </div>

          {/* Subdivision and Support Badge */}
          <div className="flex justify-between items-end mt-4 text-[11px]">
            <div className="flex items-end flex-1 min-w-[280px]">
              <span className="font-bold shrink-0">Subdivision de l'Agriculture :</span>
              <span className="ml-1 border-b border-dotted border-black inline-block flex-1 px-1 font-bold text-[12px]">
                {farmer.subdivision || ''}
              </span>
            </div>
            <div className="border border-black px-3 py-1 font-bold text-[10px] tracking-wide uppercase bg-gray-50 shrink-0 ml-4">
              CONCERNE PAR LE SOUTIEN DE 50%
            </div>
          </div>

          {/* Centered Title Box */}
          <div className="mt-6 border border-black p-3.5 text-center mx-auto max-w-[95%]">
            <h1 className="text-[12px] font-bold uppercase tracking-wide leading-normal">
              DEMANDE D'ACQUISITION EN MATIERES ET PRODUITS CHIMIQUES<br />
              CLASSES A USAGE AGRICOLE PAR LES AGRICULTEURS<br />
              <span className="text-[10px] font-bold">(List du MEM)</span>
            </h1>
          </div>

          {/* 1- Identification de l'agriculteur */}
          <div className="mt-6 print:mt-3">
            <h2 className="text-[11.5px] font-bold mb-2 print:mb-1">1- Identification de l'agriculteur</h2>
            <div className="space-y-3.5 print:space-y-2 text-[11px]">
              
              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Nom :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.last_name || ''}
                </span>
                <span className="shrink-0 font-medium">Prénom :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.first_name || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Date de naissance :</span>
                <span className="w-[180px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.dob ? displayDate(farmer.dob) : ''}
                </span>
                <span className="shrink-0 font-medium">lieu de naissance :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.place_of_birth || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Immatriculation N° nationale carte de fellah :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-mono text-[10px] font-semibold text-gray-900 min-h-[16px]">
                  {farmer.nin || ''}
                </span>
                <span className="shrink-0 font-medium">Délivrée le :</span>
                <span className="w-[120px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.issue_date ? displayDate(farmer.issue_date) : ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">NIN :</span>
                <span className="w-[250px] border-b border-dotted border-black/70 px-1 font-mono text-[10px] font-semibold text-gray-900 min-h-[16px]">
                  {farmer.num_carte_nationale || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Adresse :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.address || ''}
                </span>
                <span className="shrink-0 font-medium">commune :</span>
                <span className="w-[200px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.commune || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Daïra :</span>
                <span className="w-[140px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.daira || ''}
                </span>
                <span className="shrink-0 font-medium">wilaya :</span>
                <span className="w-[140px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.wilaya || ''}
                </span>
                <span className="shrink-0 font-medium">Tel :</span>
                <span className="w-[130px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.phone || ''}
                </span>
                <span className="shrink-0 font-medium">Fax :</span>
                <span className="w-[100px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.fax || ''}
                </span>
              </div>

            </div>
          </div>

          {/* 2- Raison sociale / exploitation */}
          <div className="mt-6 print:mt-3">
            <div className="space-y-3.5 print:space-y-2 text-[11px]">
              
              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-bold">2- Raison sociale :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.raison_sociale || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Adresse de l'exploitation :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.address || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Commune :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.commune || ''}
                </span>
                <span className="shrink-0 font-medium">Daïra :</span>
                <span className="w-[160px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.daira || ''}
                </span>
                <span className="shrink-0 font-medium">wilaya :</span>
                <span className="w-[160px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.wilaya || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Tel :</span>
                <span className="w-[220px] border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.phone || ''}
                </span>
                <span className="shrink-0 font-medium">Fax :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.fax || ''}
                </span>
              </div>

            </div>
          </div>

          {/* 3- Références permis de travail */}
          <div className="mt-6 print:mt-3">
            <h2 className="text-[11.5px] font-bold mb-2 print:mb-1">3-Références du permis de travail ou du contrat ( pour les étrangers ) :</h2>
            <div className="space-y-3.5 print:space-y-2 text-[11px]">
              
              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">N° :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                  {farmer.work_permit_ref || ''}
                </span>
              </div>

              <div className="flex items-end gap-2 w-full">
                <span className="shrink-0 font-medium">Date et lieu de délivrance :</span>
                <span className="flex-1 border-b border-dotted border-black/70 px-1 min-h-[16px]"></span>
              </div>

            </div>
          </div>

          {/* 4- Informations produits */}
          <div className="mt-6 print:mt-3">
            <h2 className="text-[11.5px] font-bold mb-2 print:mb-1">4-Informations sur les produits utilisés :</h2>
            <table className="w-full border-collapse border border-black text-center text-[10.5px]">
              <thead>
                <tr className="bg-gray-50 font-bold h-8">
                  <th className="border border-black px-2 py-1">Culture</th>
                  <th className="border border-black px-2 py-1">Type</th>
                  <th className="border border-black px-2 py-1 w-[100px]">Superficie</th>
                  <th className="border border-black px-2 py-1">Nature du produit</th>
                  <th className="border border-black px-2 py-1 w-[160px]">Quantités demandées en Kg ou en litre</th>
                  <th className="border border-black px-2 py-1 w-[130px]">Période d'utilisation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={i} className="text-center h-8 font-medium">
                    <td className="border border-black px-2 py-1 text-left">{cropFr(c.crop_category) || '\u00A0'}</td>
                    <td className="border border-black px-2 py-1 text-left">{c.type || '\u00A0'}</td>
                    <td className="border border-black px-2 py-1">{c.superficie || '\u00A0'}</td>
                    <td className="border border-black px-2 py-1 text-left uppercase">{c.product_nature || '\u00A0'}</td>
                    <td className="border border-black px-2 py-1 font-bold">
                      {c.quantity_requested ? `${c.quantity_requested} ${c.quantity_unit || ''}` : '\u00A0'}
                    </td>
                    <td className="border border-black px-2 py-1">{c.period || '\u00A0'}</td>
                  </tr>
                ))}
                {/* Pad with empty rows to have at least 1 row visually */}
                {Array.from({ length: Math.max(0, 1 - rows.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="h-8 text-center text-gray-400">
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5- Mesures obligatoires & Signatures */}
          <div className="mt-3 print:mt-2 text-[10px] leading-relaxed text-gray-800 print:break-inside-avoid">
            <h3 className="font-bold text-[11px] mb-1">5- Mesures obligatoires à prendre par l'agriculteur :</h3>
            <p>1-conserver en lieu sur ( sécurisé ) les produits achetés ;</p>
            <p>2-déclarer périodiquement les produits détenus et leur niveau de consommation ;</p>
            <p>3-disposer de pièces commerciales règlementaires (facture, bon de livraison, etc) justifiant cette acquisition</p>
            
            <p className="mt-2 font-bold text-[11px]">Je soussigné :</p>
            <div className="flex items-end gap-2 w-full mt-1">
              <span className="shrink-0 font-medium">Nom :</span>
              <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                {farmer.last_name || ''}
              </span>
              <span className="shrink-0 font-medium">Prénom :</span>
              <span className="flex-1 border-b border-dotted border-black/70 px-1 font-semibold text-gray-900 min-h-[16px]">
                {farmer.first_name || ''}
              </span>
            </div>
            
            <p className="mt-2 font-semibold text-gray-900 text-[10.5px]">
              Certifie sur l'honneur que les informations portées sur la présente demande sont exactes et que les quantités seront utilisées totalement pour les besoins des cultures déclarées.
            </p>

            <div className="text-right mt-6 print:mt-4 flex justify-end gap-2 text-[11px]">
              <span>Fait à</span>
              <span className="w-[150px] border-b border-dotted border-black"></span>
              <span>le</span>
              <span className="w-[150px] border-b border-dotted border-black"></span>
            </div>

            <div className="flex justify-between items-start mt-12 print:mt-6 text-[11px] font-bold pb-24 print:pb-8">
              <div className="text-left w-1/2">
                <p>Visa du subdivisionnaire/VISA.APC</p>
              </div>
              <div className="text-right w-1/2 pr-12">
                <p>Signature de l'agriculteur</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
