import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Modal, Field, FieldLabel } from '../../shared/ui.jsx';
import { cropFr, cropAr, displayDate, todayDMY, fullName, formatDateInput } from '../../shared/constants.js';
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
    ['Immatriculation N° carte fellah', farmer.nin || '—'],
    ['NIN', farmer.num_carte_nationale || '—'],
    ['Date d\'émission', farmer.issue_date || '—'],
    ['Commune', farmer.commune || '—'],
    ['Daïra', farmer.daira || '—'],
    ['Wilaya', farmer.wilaya || '—'],
    ['Subdivision', farmer.subdivision || '—'],
    ['Adresse', farmer.address || '—'],
    ['Téléphone', farmer.phone || '—'],
    ['Fax', farmer.fax || '—'],
    ['Permis de Travail', farmer.work_permit_ref || '—'],
  ];
  return (
    <div className="rounded-xl border border-olive-700/30 bg-olive-700/5 px-6 py-5 mb-2">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-olive-700">
        Informations de l'agriculteur
      </p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
        {items.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{k}</p>
            <p className="text-sm font-semibold text-gray-800 break-words leading-snug">{v}</p>
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
    ['Type', crop.type || '—'],
    ['Superficie / ha', crop.superficie || '—'],
    ['Nature du produit', crop.product_nature || '—'],
    ['Quantité demandée', `${crop.quantity_requested || '—'} ${crop.quantity_unit || ''}`],
    ["Période d'utilisation", crop.period || '—']
  ];
  return (
    <div className="rounded-xl border border-olive-700/20 bg-olive-700/5 p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-olive-700">Détails de la demande</p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k} className="border-b border-olive-700/5 pb-1.5 last:border-0 sm:border-0 sm:pb-0">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{k}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{v}</p>
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

  const inputRef = useRef(null);

  // Autofocus the NIN search input field when opening in non-edit mode
  useEffect(() => {
    if (open && !isEdit) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, isEdit]);

  // Initialise the modal each time it opens or the edited row changes.
  useEffect(() => {
    if (!open) return;
    let active = true;
    if (editing) {
      setFarmerId(String(editing.farmer_id));
      setCropId(String(editing.crop_request_id));
      setCropOptions([]);
      setNinSearch(editing.nin || '');
      
      // Fetch details to show farmer card in edit mode
      window.api.getFarmerDetail(editing.farmer_id).then(({ farmer }) => {
        if (active) {
          setSearchedFarmer(farmer);
        }
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
    return () => {
      active = false;
    };
  }, [open, editing]);

  // Real-time suggestions list matching NIN or Name
  const suggestions = useMemo(() => {
    const query = ninSearch.trim().toLowerCase();
    if (!query || searchedFarmer) return [];
    return (farmers || []).filter((f) => {
      const ninMatch = (f.nin || '').toLowerCase().includes(query);
      const nameMatch = `${f.last_name || ''} ${f.first_name || ''}`.toLowerCase().includes(query);
      const revNameMatch = `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase().includes(query);
      return ninMatch || nameMatch || revNameMatch;
    });
  }, [farmers, ninSearch, searchedFarmer]);

  const handleSelectFarmer = async (f) => {
    setFarmerId(String(f.id));
    setSearchedFarmer(f);
    setNinSearch(`${f.last_name || ''} ${f.first_name || ''} (${f.nin || ''})`);
    try {
      const list = await window.api.getCropRequestsForFarmer(f.id);
      setCropOptions(list);
      setCropId('');
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  };

  const setField = (k) => (v) => setFields((f) => ({ ...f, [k]: v }));

  const handleNinSearch = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = ninSearch.trim();
      if (!val) return;
      if (suggestions.length > 0) {
        handleSelectFarmer(suggestions[0]);
        return;
      }
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
  const cropInfo = isEdit && editing
    ? {
        crop_category: editing.crop_category, type: editing.type, superficie: editing.superficie,
        product_nature: editing.product_nature, quantity_requested: editing.quantity_requested,
        quantity_unit: editing.quantity_unit, period: editing.period
      }
    : cropOptions.find((c) => String(c.id) === String(cropId)) || null;

  const handleSave = async () => {
    const isInvalidDate = (d) => !/^\d{2}\/\d{2}\/\d{4}$/.test(d);

    const missingFields = [];
    if (!farmerId) missingFields.push("Agriculteur");
    if (!cropId) missingFields.push("Culture");
    if (!String(fields.operator || '').trim()) missingFields.push("Opérateur");
    if (!String(fields.quantity_delivered || '').trim()) missingFields.push("Quantité livrée");

    if (!String(fields.delivery_date || '').trim()) missingFields.push("Date de livraison");

    if (missingFields.length > 0) {
      toast.warn(`Veuillez remplir les champs obligatoires suivants : ${missingFields.join(', ')}`);
      return;
    }

    if (isInvalidDate(fields.delivery_date)) {
      toast.warn('Le format de la date de livraison est invalide (JJ/MM/AAAA)');
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
      maxWidth="max-w-5xl"
    >
      {/* Outer wrapper — no overflow so the dropdown is never clipped */}
      <div className="flex flex-col gap-4">

        {/* ── Search section: overflow visible so dropdown floats freely ── */}
        {!isEdit && (
          <div className="relative z-10">
            <FieldLabel fr="Rechercher l'Agriculteur (NIN ou Nom)" ar="البحث عن الفلاح بواسطة رقم التعريف أو الاسم" required />
            <input
              ref={inputRef}
              type="text"
              value={ninSearch}
              onChange={(e) => {
                const val = e.target.value;
                setNinSearch(val);
                if (!val.trim()) {
                  setFarmerId('');
                  setSearchedFarmer(null);
                  setCropOptions([]);
                  setCropId('');
                }
              }}
              onKeyDown={handleNinSearch}
              placeholder="Entrez le nom, prénom ou NIN..."
              dir="ltr"
              className={`input-base focus:ring-2 ${ACCENT}`}
            />
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-[100] mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
                {suggestions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFarmer(f)}
                    className="flex w-full flex-col px-4 py-3 text-left hover:bg-olive-700/5 transition border-b border-gray-100 last:border-0"
                  >
                    <span className="font-bold text-gray-800 text-sm">
                      {f.last_name} {f.first_name}
                    </span>
                    <span className="text-xs text-gray-500 font-mono mt-0.5">
                      NIN: {f.nin || '—'} &nbsp;|&nbsp; Commune: {f.commune || '—'} &nbsp;|&nbsp; Wilaya: {f.wilaya || '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Rest of the form: scrollable ── */}
        <div className="flex flex-col gap-4">

        {searchedFarmer && <FarmerInfoCard farmer={searchedFarmer} />}

        {!isEdit && farmerId && (
          <div>
            <FieldLabel fr="Sélectionner la culture" ar="اختر المحصول" required />
            <select value={cropId} onChange={(e) => setCropId(e.target.value)} className={`input-base focus:ring-2 ${ACCENT}`}>
              <option value="">— Choisir une demande —</option>
              {cropOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {cropFr(c.crop_category) || 'Culture'} — {c.type || 'Type'} — {c.product_nature || 'produit'} ({c.quantity_requested} {c.quantity_unit || 'Kg'})
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
            <Field fr="Opérateur" ar="المزود" required value={fields.operator} onChange={setField('operator')} accentClass={ACCENT} />
            <Field fr="Quantité livrée" ar="الكمية المسلمة" required value={fields.quantity_delivered} onChange={setField('quantity_delivered')} accentClass={ACCENT} />
            <Field fr="Montant après subvention / DA" ar="المبلغ" value={fields.amount} onChange={setField('amount')} accentClass={ACCENT} />
            <Field fr="N° Facture" ar="رقم الفاتورة" value={fields.invoice_number} onChange={setField('invoice_number')} accentClass={ACCENT} />
            <Field fr="Date de livraison" ar="التاريخ" required type="text" placeholder="JJ/MM/AAAA" value={fields.delivery_date} onChange={(val) => setField('delivery_date')(formatDateInput(val))} accentClass={ACCENT} />
            <div>
              <FieldLabel fr="Service fait" ar="الخدمة" required />
              <select value={fields.service_done} onChange={(e) => setField('service_done')(e.target.value)} className={`input-base focus:ring-2 ${ACCENT}`}>
                <option value="Non">Non (لا)</option>
                <option value="Oui">Oui (نعم)</option>
              </select>
            </div>
          </div>
        )}
      </div>
      </div>
    </Modal>
  );
}
