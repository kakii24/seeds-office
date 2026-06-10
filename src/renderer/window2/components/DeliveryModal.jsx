import React, { useEffect, useState } from 'react';
import { Modal, Field, FieldLabel } from '../../shared/ui.jsx';
import { cropFr, cropAr, displayDate, todayDMY, fullName } from '../../shared/constants.js';
import { useToast } from '../../shared/Toast.jsx';

const ACCENT = 'focus:border-olive-700 focus:ring-olive-700/25';

const emptyFields = () => ({
  operator: '', quantity_delivered: '', amount: '', invoice_number: '',
  delivery_date: todayDMY(), service_done: 'Non'
});

function FarmerInfoCard({ farmer }) {
  if (!farmer) return null;
  const items = [
    ['Nom & Prénom', fullName(farmer)],
    ['Raison Sociale', farmer.raison_sociale || '—'],
    ['NIN', farmer.nin],
    ['Commune / Daïra / Wilaya', `${farmer.commune || '—'} / ${farmer.daira || '—'} / ${farmer.wilaya || '—'}`],
    ['Téléphone / Fax', `${farmer.phone || '—'} / ${farmer.fax || '—'}`],
    ['Permis de Travail', farmer.work_permit_ref || '—']
  ];
  return (
    <div className="rounded-xl border border-olive-700/20 bg-olive-700/5 p-4 mb-2">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-olive-700">Informations de l'agriculteur</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k}>
            <p className="text-[10px] font-medium text-gray-500">{k}</p>
            <p className="font-semibold text-gray-800">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ crop }) {
  if (!crop) return null;
  const items = [
    ['Culture', `${cropFr(crop.crop_category) || '—'}${cropAr(crop.crop_category) ? ` (${cropAr(crop.crop_category)})` : ''}`],
    ['Superficie / ha', crop.superficie || '—'],
    ['Nature du produit', crop.product_nature || '—'],
    ['Quantité demandée', `${crop.quantity_requested || '—'} ${crop.quantity_unit || ''}`],
    ["Période d'utilisation", crop.period || '—']
  ];
  return (
    <div className="rounded-xl border border-olive-700/20 bg-olive-700/5 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-olive-700">Détails de la demande</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k}>
            <p className="text-[10px] font-medium text-gray-500">{k}</p>
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
  const [ninSearch, setNinSearch] = useState('');
  const [searchedFarmer, setSearchedFarmer] = useState(null);

  // Initialise the modal each time it opens or the edited row changes.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setFarmerId(String(editing.farmer_id));
      setCropId(String(editing.crop_request_id));
      setCropOptions([]);
      setNinSearch(editing.nin || '');
      
      // Fetch details to show farmer card in edit mode
      window.api.getFarmerDetail(editing.farmer_id).then(({ farmer }) => {
        setSearchedFarmer(farmer);
      });

      setFields({
        operator: editing.operator || '',
        quantity_delivered: editing.quantity_delivered || '',
        amount: editing.amount || '',
        invoice_number: editing.invoice_number || '',
        delivery_date: editing.delivery_date ? displayDate(editing.delivery_date) : todayDMY(),
        service_done: editing.service_done === 'Oui' ? 'Oui' : 'Non'
      });
    } else {
      setFarmerId('');
      setCropId('');
      setCropOptions([]);
      setNinSearch('');
      setSearchedFarmer(null);
      setFields(emptyFields());
    }
  }, [open, editing]);

  const setField = (k) => (v) => setFields((f) => ({ ...f, [k]: v }));

  const handleNinSearch = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = ninSearch.trim();
      if (!val) return;
      try {
        const existing = await window.api.getFarmerByNIN(val);
        if (existing) {
          toast.success("Agriculteur trouvé — Données chargées");
          setFarmerId(String(existing.id));
          setSearchedFarmer(existing);
          const list = await window.api.getCropRequestsForFarmer(existing.id);
          setCropOptions(list);
          setCropId('');
        } else {
          toast.error("Agriculteur non trouvé");
          setFarmerId('');
          setSearchedFarmer(null);
          setCropOptions([]);
          setCropId('');
        }
      } catch (err) {
        toast.error(`Erreur : ${err.message}`);
      }
    }
  };

  // The crop details shown in the info card.
  const cropInfo = isEdit
    ? {
        crop_category: editing.crop_category, superficie: editing.superficie,
        product_nature: editing.product_nature, quantity_requested: editing.quantity_requested,
        quantity_unit: editing.quantity_unit, period: editing.period
      }
    : cropOptions.find((c) => String(c.id) === String(cropId)) || null;

  const handleSave = async () => {
    const isInvalidDate = (d) => !/^\d{2}\/\d{2}\/\d{4}$/.test(d);

    if (
      !farmerId ||
      !cropId ||
      !fields.operator?.trim() ||
      !fields.quantity_delivered?.trim() ||
      !fields.amount?.trim() ||
      !fields.invoice_number?.trim() ||
      !fields.delivery_date?.trim() ||
      isInvalidDate(fields.delivery_date) ||
      !fields.service_done
    ) {
      toast.warn('Veuillez remplir les champs obligatoires');
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
          <div>
            <FieldLabel fr="Rechercher l'Agriculteur par NIN" ar="البحث عن الفلاح بواسطة رقم التعريف الوطني" required />
            <input
              type="text"
              value={ninSearch}
              onChange={(e) => setNinSearch(e.target.value)}
              onKeyDown={handleNinSearch}
              placeholder="Entrez le NIN et appuyez sur Entrée..."
              dir="ltr"
              className={`input-base focus:ring-2 ${ACCENT}`}
            />
          </div>
        )}

        {searchedFarmer && <FarmerInfoCard farmer={searchedFarmer} />}

        {!isEdit && farmerId && (
          <div>
            <FieldLabel fr="Sélectionner la culture" ar="اختر الصنف" required />
            <select value={cropId} onChange={(e) => setCropId(e.target.value)} className={`input-base focus:ring-2 ${ACCENT}`}>
              <option value="">— Choisir une demande —</option>
              {cropOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {cropFr(c.crop_category) || 'Culture'} — {c.product_nature || 'produit'} ({c.quantity_requested} {c.quantity_unit || 'Kg'})
                </option>
              ))}
            </select>
            {cropOptions.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">Cet agriculteur n'a aucune demande de culture enregistrée.</p>
            )}
          </div>
        )}

        {cropInfo && <InfoCard crop={cropInfo} />}

        {(isEdit || cropId) && (
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field fr="Opérateur" ar="المزود" value={fields.operator} onChange={setField('operator')} accentClass={ACCENT} />
            <Field fr="Quantité livrée" ar="الكمية المسلمة" value={fields.quantity_delivered} onChange={setField('quantity_delivered')} accentClass={ACCENT} />
            <Field fr="Montant après subvention / DA" ar="المبلغ" value={fields.amount} onChange={setField('amount')} accentClass={ACCENT} />
            <Field fr="N° Facture" ar="رقم الفاتورة" value={fields.invoice_number} onChange={setField('invoice_number')} accentClass={ACCENT} />
            <Field fr="Date de livraison" ar="التاريخ" type="text" placeholder="JJ/MM/AAAA" value={fields.delivery_date} onChange={setField('delivery_date')} accentClass={ACCENT} />
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
