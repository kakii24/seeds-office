import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import RegistrationForm from './components/RegistrationForm.jsx';
import PrintPreviewModal from './components/PrintPreviewModal.jsx';
import { useToast } from '../shared/Toast.jsx';
import { ConfirmModal } from '../shared/ui.jsx';
import { fullName, displayDate } from '../shared/constants.js';

const emptyFarmer = () => ({
  id: null, last_name: '', first_name: '', raison_sociale: '', dob: '', place_of_birth: '',
  nin: '', issue_date: '', address: '', commune: '', daira: '', wilaya: '', phone: '',
  fax: '', work_permit_ref: '', subdivision: '', num_carte_nationale: ''
});
const emptyCrop = () => ({
  crop_category: '', type: '', superficie: '', product_nature: '', quantity_requested: '', quantity_unit: '', period: '',
  validee_annee: '', chambre_agri_wilaya: '', activite_principale: '', adresse_exploitation: '', sat_ha: '', sau_ha: '',
  types_culture_fertiliser: '', superficie_fertiliser_ha: '', type_engrais_sollicite: '', qte_engrais_autorisee_ql: '', periode_epandage: ''
});

export default function App() {
  const toast = useToast();
  const [farmers, setFarmers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [farmer, setFarmer] = useState(emptyFarmer());
  const [crops, setCrops] = useState([emptyCrop()]);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadFarmers = useCallback(async () => {
    try {
      const list = await window.api.getFarmers();
      setFarmers(list);
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  }, [toast]);

  useEffect(() => {
    loadFarmers();
    const off = window.api.onDataChanged(loadFarmers);
    return off;
  }, [loadFarmers]);

  const onField = (field, value) => setFarmer((f) => ({ ...f, [field]: value }));

  const handleNew = () => {
    setSelectedId(null);
    setFarmer(emptyFarmer());
    setCrops([emptyCrop()]);
  };

  const handleSelect = async (id) => {
    try {
      const { farmer: f, crops: c } = await window.api.getFarmerDetail(id);
      if (!f) { toast.error('Erreur : agriculteur introuvable'); return; }
      setSelectedId(id);
      setFarmer({
        ...emptyFarmer(),
        ...f,
        dob: f.dob ? displayDate(f.dob) : '',
        issue_date: f.issue_date ? displayDate(f.issue_date) : '',
      });
      setCrops(c.length ? c.slice(0, 1).map((x) => ({ ...emptyCrop(), ...x })) : [emptyCrop()]);
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  const handleSave = async () => {
    const isInvalidDate = (d) => d && !/^\d{2}\/\d{2}\/\d{4}$/.test(d);
    
    // Check missing mandatory fields
    const missing = [];
    if (!String(farmer.last_name || '').trim()) missing.push('Nom');
    if (!String(farmer.first_name || '').trim()) missing.push('Prénom');
    if (!String(farmer.raison_sociale || '').trim()) missing.push('Raison Sociale');
    if (!String(farmer.nin || '').trim()) missing.push('NIN / Carte de fellah');

    if (missing.length > 0) {
      toast.warn(`Veuillez remplir les champs obligatoires suivants : ${missing.join(', ')}`);
      return;
    }

    // Check crop requests validation (each crop row must be completely filled)
    const hasInvalidCrop = crops.some(c => 
      !String(c.crop_category || '').trim() ||
      !String(c.type || '').trim() ||
      !String(c.superficie || '').trim() ||
      !String(c.product_nature || '').trim() ||
      !String(c.quantity_requested || '').trim() ||
      !String(c.quantity_unit || '').trim() ||
      !String(c.period || '').trim()
    );

    if (crops.length === 0 || hasInvalidCrop) {
      toast.warn('Veuillez remplir toutes les informations de culture obligatoires');
      return;
    }

    if (isInvalidDate(farmer.dob) || isInvalidDate(farmer.issue_date)) {
      toast.warn('Le format de la date est invalide (JJ/MM/AAAA)');
      return;
    }

    setSaving(true);
    try {
      const res = await window.api.saveFarmer({ farmer, crops });
      if (res?.success) {
        toast.success('Enregistré avec succès');
        await loadFarmers();
        setSelectedId(res.farmerId);
        const detail = await window.api.getFarmerDetail(res.farmerId);
        setFarmer({
          ...emptyFarmer(),
          ...detail.farmer,
          dob: detail.farmer.dob ? displayDate(detail.farmer.dob) : '',
          issue_date: detail.farmer.issue_date ? displayDate(detail.farmer.issue_date) : '',
        });
        setCrops(detail.crops.length ? detail.crops.slice(0, 1).map((x) => ({ ...emptyCrop(), ...x })) : [emptyCrop()]);
      } else {
        toast.error('Erreur : enregistrement échoué');
      }
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setDeleteConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!selectedId) return;
    try {
      await window.api.deleteFarmer(selectedId);
      toast.deleted('Supprimé');
      handleNew();
      await loadFarmers();
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  // NIN lookup auto-fill handler
  const handleNINLookup = async (ninVal) => {
    const nin = ninVal?.trim();
    if (!nin) return;
    try {
      const existing = await window.api.getFarmerByNIN(nin);
      if (existing) {
        toast.success('Agriculteur trouvé — Données chargées (nouvelle demande)');
        const { farmer: f } = await window.api.getFarmerDetail(existing.id);
        setSelectedId(null);
        setFarmer({
          ...emptyFarmer(),
          ...f,
          id: null,
          dob: f.dob ? displayDate(f.dob) : '',
          issue_date: f.issue_date ? displayDate(f.issue_date) : '',
        });
        setCrops([emptyCrop()]);
      }
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  const handleNINBlur = (e) => {
    handleNINLookup(e.target.value);
  };

  const handleNINKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      handleNINLookup(e.target.value);
    }
  };

  const handlePrint = () => setPreviewOpen(true);
  // Use the renderer's native print so the OS dialog appears and the user can
  // pick ANY installed printer — the most compatible path across PCs/printers.
  const handlePrintNow = () => {
    window.print();
  };

  return (
    <div className="flex h-full flex-col bg-canvas">
      <Header
        onNew={handleNew}
        onSave={handleSave}
        onPrint={handlePrint}
        onDelete={handleDelete}
        isEditing={!!selectedId}
        saving={saving}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          farmers={farmers}
          query={query}
          onQuery={setQuery}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {selectedId && (
            <div className="mx-auto mb-4 w-full max-w-5xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-forest-500/10 px-3 py-1 text-xs font-semibold text-forest-700">
                Modification : {fullName(farmer)}
              </span>
            </div>
          )}
          <RegistrationForm 
            farmer={farmer} 
            onField={onField} 
            crops={crops} 
            setCrops={setCrops} 
            onNINBlur={handleNINBlur}
            onNINKeyDown={handleNINKeyDown}
          />
        </main>
      </div>

      <PrintPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        farmer={farmer}
        crops={crops}
        onPrint={handlePrintNow}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={performDelete}
        title="Supprimer l'agriculteur"
        message="Êtes-vous sûr de vouloir supprimer cet agriculteur et toutes ses demandes associées ?"
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}
