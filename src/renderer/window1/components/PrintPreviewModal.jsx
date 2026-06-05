import React from 'react';
import { Modal } from '../../shared/ui.jsx';
import { cropFr, cropAr, displayDate, todayISO } from '../../shared/constants.js';

const INFO_FIELDS = [
  ['Nom de famille', 'اللقب', 'last_name'],
  ['Prénom', 'الاسم', 'first_name'],
  ['Date de naissance', 'تاريخ الميلاد', 'dob', true],
  ['Lieu de naissance', 'مكان الميلاد', 'place_of_birth'],
  ['N° Carte Fellah / NIN', 'رقم بطاقة الفلاح', 'nin'],
  ["Date d'émission", 'تاريخ الإصدار', 'issue_date', true],
  ['Adresse', 'العنوان', 'address'],
  ['Téléphone', 'رقم الهاتف', 'phone'],
  ['Commune', 'البلدية', 'commune'],
  ['Daïra', 'الدائرة', 'daira'],
  ['Wilaya', 'الولاية', 'wilaya', false, true]
];

function val(farmer, key, isDate) {
  const v = farmer[key];
  if (!v) return '—';
  return isDate ? displayDate(v) : v;
}

export default function PrintPreviewModal({ open, onClose, farmer, crops, onPrint }) {
  const rows = (crops || []).filter(
    (c) => c.crop_category || c.superficie || c.product_nature || c.quantity_requested || c.period
  );

  const footer = (
    <>
      <button onClick={onClose} className="btn-neutral">Fermer</button>
      <button onClick={onPrint} className="btn bg-forest-700 text-white hover:bg-forest-900">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
        </svg>
        Imprimer
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aperçu d'impression — Demande de Semences Subventionnées"
      headerClass="bg-gradient-to-r from-forest-900 to-forest-700"
      footer={footer}
      maxWidth="max-w-4xl"
    >
      <div className="printable bg-white p-8 text-[12px] leading-relaxed text-black">
        {/* Official header */}
        <div className="text-center">
          <p className="font-bold">République Algérienne Démocratique et Populaire</p>
          <p className="font-arabic text-[13px] font-bold" dir="rtl">الجمهورية الجزائرية الديمقراطية الشعبية</p>
          <p className="mt-1">Ministère de l'Agriculture et du Développement Rural</p>
          <p className="font-arabic" dir="rtl">وزارة الفلاحة والتنمية الريفية</p>
          <div className="mx-auto my-3 h-px w-2/3 bg-black/40" />
          <h1 className="text-[15px] font-extrabold uppercase tracking-wide">
            Demande d'obtention de semences et intrants agricoles subventionnés
          </h1>
          <p className="font-arabic text-[14px] font-bold" dir="rtl">طلب الحصول على البذور والمدخلات الفلاحية المدعومة</p>
        </div>

        {/* Subsidy badge + date */}
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-md border border-amber-500 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
            Taux de Subvention de l'État: 50% — نسبة دعم الدولة: 50%
          </span>
          <span className="text-[11px] font-semibold">
            Date de la demande: {displayDate(todayISO())}
          </span>
        </div>

        {/* Section 1 — Identification */}
        <h2 className="mt-5 border-b-2 border-forest-700 pb-1 text-[13px] font-bold text-forest-900">
          1. Identification de l'Agriculteur <span className="font-arabic font-normal">— معلومات الفلاح</span>
        </h2>
        <table className="mt-2 w-full border-collapse text-[11.5px]">
          <tbody>
            {chunk(INFO_FIELDS, 2).map((pair, ri) => (
              <tr key={ri}>
                {pair.map(([fr, ar, key, isDate, full]) => (
                  <React.Fragment key={key}>
                    <td className="w-[22%] border border-gray-400 bg-gray-50 px-2 py-1 align-top font-semibold">
                      {fr} <span className="font-arabic text-[10px] text-gray-500">({ar})</span>
                    </td>
                    <td className={`border border-gray-400 px-2 py-1 align-top ${full ? '' : ''}`} colSpan={pair.length === 1 ? 3 : 1}>
                      {val(farmer, key, isDate)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Section 2 — Crop requests */}
        <h2 className="mt-5 border-b-2 border-forest-700 pb-1 text-[13px] font-bold text-forest-900">
          2. Demandes de Cultures et Semences <span className="font-arabic font-normal">— جدول الطلبات</span>
        </h2>
        <table className="mt-2 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-forest-700 text-white">
              <th className="border border-gray-500 px-2 py-1 text-left">N°</th>
              <th className="border border-gray-500 px-2 py-1 text-left">Culture (الصنف)</th>
              <th className="border border-gray-500 px-2 py-1 text-left">Superficie / ha (المساحة)</th>
              <th className="border border-gray-500 px-2 py-1 text-left">Nature du produit (نوع المنتج)</th>
              <th className="border border-gray-500 px-2 py-1 text-left">Quantité demandée (الكمية المطلوبة)</th>
              <th className="border border-gray-500 px-2 py-1 text-left">Période (فترة الاستخدام)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="border border-gray-400 px-2 py-3 text-center text-gray-500">Aucune demande</td></tr>
            ) : (
              rows.map((c, i) => (
                <tr key={i}>
                  <td className="border border-gray-400 px-2 py-1">{i + 1}</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {cropFr(c.crop_category) || '—'}
                    {cropAr(c.crop_category) && <span className="font-arabic text-[10px] text-gray-500"> ({cropAr(c.crop_category)})</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">{c.superficie || '—'}</td>
                  <td className="border border-gray-400 px-2 py-1">{c.product_nature || '—'}</td>
                  <td className="border border-gray-400 px-2 py-1">{c.quantity_requested || '—'}</td>
                  <td className="border border-gray-400 px-2 py-1">{c.period || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Legal note */}
        <div className="mt-5 rounded-md border border-gray-400 bg-gray-50 p-3 text-[11px]">
          <p className="font-semibold">
            L'agriculteur bénéficie d'une subvention de l'État à hauteur de 50% de la valeur des intrants agricoles demandés.
          </p>
          <p className="font-arabic mt-1 text-right" dir="rtl">يستفيد الفلاح من دعم الدولة بنسبة 50% من قيمة المدخلات الفلاحية المطلوبة.</p>
        </div>

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[11.5px]">
          <div>
            <p className="font-semibold">Signature de l'Agriculteur</p>
            <p className="font-arabic text-[11px] text-gray-600">توقيع الفلاح</p>
            <div className="mt-12 border-t border-dashed border-gray-500" />
          </div>
          <div>
            <p className="font-semibold">Cachet et Signature du Service</p>
            <p className="font-arabic text-[11px] text-gray-600">ختم وتوقيع المصلحة</p>
            <div className="mt-12 border-t border-dashed border-gray-500" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
