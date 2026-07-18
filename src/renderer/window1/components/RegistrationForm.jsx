import React from 'react';
import { Field, FieldLabel, ArabicHint } from '../../shared/ui.jsx';
import { CROP_CATEGORIES, formatDateInput } from '../../shared/constants.js';

const ACCENT = 'focus:border-forest-500 focus:ring-forest-500/30';

function SectionCard({ title, ar, badge, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-forest-700 to-forest-500 px-5 py-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          {title}
          <span className="font-arabic text-sm font-normal text-white/75">{ar}</span>
        </h3>
        {badge && (
          <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-forest-900">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function RegistrationForm({ farmer, onField, crops, setCrops, onNINBlur, onNINKeyDown }) {
  const set = (field) => (val) => onField(field, val);

  const updateCrop = (i, field, val) => {
    setCrops((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Section 1 — Identification */}
      <SectionCard title="Identification de l'Agriculteur" ar="معلومات الفلاح">
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
          <Field fr="Nom de famille" ar="اللقب" required value={farmer.last_name} onChange={set('last_name')} accentClass={ACCENT} />
          <Field fr="Prénom" ar="الاسم" required value={farmer.first_name} onChange={set('first_name')} accentClass={ACCENT} />
          <Field fr="Raison Sociale" ar="الاسم الاجتماعي" required value={farmer.raison_sociale} onChange={set('raison_sociale')} accentClass={ACCENT} />
          
          <Field fr="Date de naissance" ar="تاريخ الميلاد" type="text" placeholder="JJ/MM/AAAA" value={farmer.dob} onChange={(val) => set('dob')(formatDateInput(val))} accentClass={ACCENT} />
          <Field fr="Lieu de naissance" ar="مكان الميلاد" value={farmer.place_of_birth} onChange={set('place_of_birth')} accentClass={ACCENT} />
          
          <Field 
            fr="Immatriculation N° nationale carte de fellah" 
            ar="رقم التعريف الوطني / رقم بطاقة الفلاح" 
            required 
            value={farmer.nin} 
            onChange={set('nin')} 
            accentClass={ACCENT} 
            onBlur={onNINBlur}
            onKeyDown={onNINKeyDown}
          />

          <Field
            fr="NIN"
            ar="رقم التعريف الوطني"
            value={farmer.num_carte_nationale}
            onChange={set('num_carte_nationale')}
            accentClass={ACCENT}
            onBlur={onNINBlur}
            onKeyDown={onNINKeyDown}
          />
          
          <Field fr="Date d'émission" ar="تاريخ الإصدار" type="text" placeholder="JJ/MM/AAAA" value={farmer.issue_date} onChange={(val) => set('issue_date')(formatDateInput(val))} accentClass={ACCENT} />
          <Field fr="Adresse" ar="العنوان" value={farmer.address} onChange={set('address')} accentClass={ACCENT} className="md:col-span-2" />
          
          <Field fr="Commune" ar="البلدية" value={farmer.commune} onChange={set('commune')} accentClass={ACCENT} />
          <Field fr="Daïra" ar="الدائرة" value={farmer.daira} onChange={set('daira')} accentClass={ACCENT} />
          <Field fr="Wilaya" ar="الولاية" value={farmer.wilaya} onChange={set('wilaya')} accentClass={ACCENT} />
          
          <Field fr="Subdivision de l'Agriculture" ar="الفرع الفلاحي" value={farmer.subdivision} onChange={set('subdivision')} accentClass={ACCENT} />
          <Field fr="Téléphone" ar="رقم الهاتف" value={farmer.phone} onChange={set('phone')} accentClass={ACCENT} />
          <Field fr="Fax" ar="الفاكس" value={farmer.fax} onChange={set('fax')} accentClass={ACCENT} />
          <Field fr="Références du permis de travail ou du contrat (pour les étrangers) / N° / Date et lieu de délivrance" ar="مرجع رخصة أو عقد العمل" value={farmer.work_permit_ref} onChange={set('work_permit_ref')} accentClass={ACCENT} className="md:col-span-3" />
        </div>
      </SectionCard>

      {/* Section 2 — Crop & seed requests */}
      <SectionCard title="Demandes de Cultures et Semences" ar="جدول الطلبات" badge="Subvention: 50%">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-forest-700">
                <th className="w-12 border-b border-gray-200 px-2 py-2">N°</th>
                <th className="border-b border-gray-200 px-2 py-2">
                  Culture <ArabicHint>المحصول</ArabicHint>
                </th>
                <th className="border-b border-gray-200 px-2 py-2">
                  Type <ArabicHint>النوع</ArabicHint>
                </th>
                <th className="border-b border-gray-200 px-2 py-2">
                  Superficie / ha <ArabicHint>المساحة</ArabicHint>
                </th>
                <th className="border-b border-gray-200 px-2 py-2">
                  Nature du produit <ArabicHint>نوع المنتج</ArabicHint>
                </th>
                <th className="border-b border-gray-200 px-2 py-2">
                  Quantité demandée <ArabicHint>الكمية المطلوبة</ArabicHint>
                </th>
                <th className="border-b border-gray-200 px-2 py-2">
                  Unité <ArabicHint>الوحدة</ArabicHint>
                </th>
                <th className="border-b border-gray-200 px-2 py-2">
                  Période d'utilisation <ArabicHint>فترة الاستخدام</ArabicHint>
                </th>
              </tr>
            </thead>
            <tbody>
              {crops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-6 text-center text-sm text-gray-400">
                    Aucune demande
                  </td>
                </tr>
              ) : (
                crops.map((row, i) => (
                  <tr key={i} className="align-top">
                    <td className="border-b border-gray-100 px-2 py-2 text-gray-500">{i + 1}</td>
                    <td className="border-b border-gray-100 px-2 py-2">
                      <select
                        value={row.crop_category}
                        onChange={(e) => updateCrop(i, 'crop_category', e.target.value)}
                        className={`input-base focus:ring-2 ${ACCENT}`}
                      >
                        <option value="">— Choisir —</option>
                        {CROP_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.fr} ({c.ar})</option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-gray-100 px-2 py-2">
                      <input 
                        value={row.type || ''} 
                        onChange={(e) => updateCrop(i, 'type', e.target.value)} 
                        dir="ltr" 
                        className={`input-base focus:ring-2 ${ACCENT}`} 
                        placeholder="Type..."
                      />
                    </td>
                    <td className="border-b border-gray-100 px-2 py-2">
                      <input value={row.superficie} onChange={(e) => updateCrop(i, 'superficie', e.target.value)} dir="ltr" className={`input-base focus:ring-2 ${ACCENT}`} />
                    </td>
                    <td className="border-b border-gray-100 px-2 py-2">
                      <input 
                        value={row.product_nature ? row.product_nature.toUpperCase() : ''} 
                        onChange={(e) => updateCrop(i, 'product_nature', e.target.value.toUpperCase())} 
                        dir="ltr" 
                        className={`input-base focus:ring-2 ${ACCENT}`} 
                      />
                    </td>
                    <td className="border-b border-gray-100 px-2 py-2">
                      <input value={row.quantity_requested} onChange={(e) => updateCrop(i, 'quantity_requested', e.target.value)} dir="ltr" className={`input-base focus:ring-2 ${ACCENT}`} />
                    </td>
                    <td className="border-b border-gray-100 px-2 py-2">
                      <select
                        value={row.quantity_unit || ''}
                        onChange={(e) => updateCrop(i, 'quantity_unit', e.target.value)}
                        className={`input-base focus:ring-2 ${ACCENT}`}
                      >
                        <option value="">— Unité —</option>
                        <option value="L">L (Litres)</option>
                        <option value="Kg">Kg (Kilogrammes)</option>
                        <option value="Qx">Qx (Quintaux)</option>
                      </select>
                    </td>
                    <td className="border-b border-gray-100 px-2 py-2">
                      <input value={row.period} onChange={(e) => updateCrop(i, 'period', e.target.value)} dir="ltr" className={`input-base focus:ring-2 ${ACCENT}`} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
