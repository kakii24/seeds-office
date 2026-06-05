import React, { useEffect, useState } from 'react';
import { Modal, Field, FieldLabel } from '../../shared/ui.jsx';
import { CROP_CATEGORIES, cropFr, cropAr, fullName } from '../../shared/constants.js';
import { useToast } from '../../shared/Toast.jsx';

const ACCENT = 'focus:border-olive-700 focus:ring-olive-700/25';
const today = () => new Date().toISOString().slice(0, 10);

const emptyFields = () => ({
  operator: '', quantity_delivered: '', amount: '', invoice_number: '',
  delivery_date: today(), service_done: 'Non'
});

function InfoCard({ crop }) {
  if (!crop) return null;
  const items = [
    ['Culture', `${cropFr(crop.crop_category) || '—'}${cropAr(crop.crop_category) ? ` (${cropAr(crop.crop_category)})` : ''}`],
    ['Superficie / ha', crop.superficie || '—'],
    ['Nature du produit', crop.product_nature || '—'],
    ['Quantité demandée', crop.quantity_requested || '—'],
    ["Période d'utilisation", crop.period || '—']
  ];
  return (
    <div className="rounded-xl border border-olive-700/20 bg-olive-700/5 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-olive-700">Détails de la demande</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] font-medium text-gray-500">{k}</p>
            <p className="font-semibold text-gray-800">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeliveryModal({ open, onClose, onSaved, farmers, editing }) {
  const toast = useToast();
  const isEdit = !!editing;

  const [farmerId, setFarmerId] = useState('');
  const [cropId, setCropId] = useState('');
  const [cropOptions, setCropOptions] = useState([]);
  const [fields, setFields] = useState(emptyFields());

  // Initialise the modal each time it opens or the edited row changes.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setFarmerId(String(editing.farmer_id));
      setCropId(String(editing.crop_request_id));
      setCropOptions([]);
      setFields({
        operator: editing.operator || '',
        quantity_delivered: editing.quantity_delivered || '',
        amount: editing.amount || '',
        invoice_number: editing.invoice_number || '',
        delivery_date: editing.delivery_date || today(),
        service_done: editing.service_done === 'Oui' ? 'Oui' : 'Non'
      });
    } else {
      setFarmerId('');
      setCropId('');
      setCropOptions([]);
      setFields(emptyFields());
    }
  }, [open, editing]);

  // When a farmer is picked (new delivery), load their crop requests.
  useEffect(() => {
    if (!open || isEdit || !farmerId) { return; }
    let cancelled = false;
    window.api.getCropRequestsForFarmer(Number(farmerId)).then((list) => {
      if (!cancelled) {
        setCropOptions(list);
        setCropId('');
      }
    });
    return () => { cancelled = true; };
  }, [open, isEdit, farmerId]);

  const setField = (k) => (v) => setFields((f) => ({ ...f, [k]: v }));

  // The crop details shown in the info card.
  const cropInfo = isEdit
    ? {
        crop_category: editing.crop_category, superficie: editing.superficie,
        product_nature: editing.product_nature, quantity_requested: editing.quantity_requested,
        period: editing.period
      }
    : cropOptions.find((c) => String(c.id) === String(cropId)) || null;

  const handleSave = async () => {
    if (!farmerId || !cropId) {
      toast.warn('Veuillez sélectionner un agriculteur et une culture');
      return;
    }
    try {
      const payload = {
        ...(isEdit ? { id: editing.id } : {}),
        farmer_id: Number(farmerId),
        crop_request_id: Number(cropId),
        ...fields
      };
      const res = await window.api.saveDelivery(payload);
      if (res?.success) {
        toast.success('Enregistré avec succès');
        onSaved();
      } else {
        toast.error('Erreur : enregistrement échoué');
      }
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  const footer = (
    <>
      <button onClick={onClose} className="btn-neutral">Annuler</button>
      <button onClick={handleSave} className="btn bg-amber2-500 text-white hover:brightness-110">
        {isEdit ? 'Mettre à jour' : 'Enregistrer'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier la livraison' : 'Enregistrer une livraison'}
      headerClass="bg-gradient-to-r from-olive-900 to-olive-700"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {!isEdit && (
          <>
            <div>
              <FieldLabel fr="Sélectionner l'agriculteur" ar="اختر الفلاح" required />
              <select value={farmerId} onChange={(e) => setFarmerId(e.target.value)} className={`input-base focus:ring-2 ${ACCENT}`}>
                <option value="">— Choisir un agriculteur —</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>{fullName(f)} — {f.nin}</option>
                ))}
              </select>
            </div>

            {farmerId && (
              <div>
                <FieldLabel fr="Sélectionner la culture" ar="اختر الصنف" required />
                <select value={cropId} onChange={(e) => setCropId(e.target.value)} className={`input-base focus:ring-2 ${ACCENT}`}>
                  <option value="">— Choisir une demande —</option>
                  {cropOptions.map((c) => (
                    <option key={c.id} value={c.id}>{cropFr(c.crop_category) || 'Culture'} — {c.product_nature || 'produit'}</option>
                  ))}
                </select>
                {cropOptions.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">Cet agriculteur n'a aucune demande de culture enregistrée.</p>
                )}
              </div>
            )}
          </>
        )}

        {cropInfo && <InfoCard crop={cropInfo} />}

        {(isEdit || cropId) && (
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field fr="Opérateur" ar="المزود" value={fields.operator} onChange={setField('operator')} accentClass={ACCENT} />
            <Field fr="Quantité livrée" ar="الكمية المسلمة" value={fields.quantity_delivered} onChange={setField('quantity_delivered')} accentClass={ACCENT} />
            <Field fr="Montant après subvention / DA" ar="المبلغ" value={fields.amount} onChange={setField('amount')} accentClass={ACCENT} />
            <Field fr="N° Facture" ar="رقم الفاتورة" value={fields.invoice_number} onChange={setField('invoice_number')} accentClass={ACCENT} />
            <Field fr="Date de livraison" ar="التاريخ" type="date" value={fields.delivery_date} onChange={setField('delivery_date')} accentClass={ACCENT} />
            <div>
              <FieldLabel fr="Service fait" ar="الخدمة" />
              <select value={fields.service_done} onChange={(e) => setField('service_done')(e.target.value)} className={`input-base focus:ring-2 ${ACCENT}`}>
                <option value="Non">Non (لا)</option>
                <option value="Oui">Oui (نعم)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
