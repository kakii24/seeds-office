import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import RegistrationForm from './components/RegistrationForm.jsx';
import PrintPreviewModal from './components/PrintPreviewModal.jsx';
import { useToast } from '../shared/Toast.jsx';
import { fullName } from '../shared/constants.js';

const emptyFarmer = () => ({
  id: null, last_name: '', first_name: '', dob: '', place_of_birth: '',
  nin: '', issue_date: '', address: '', commune: '', daira: '', wilaya: '', phone: ''
});
const emptyCrop = () => ({
  crop_category: '', superficie: '', product_nature: '', quantity_requested: '', period: ''
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
      setFarmer({ ...emptyFarmer(), ...f });
      setCrops(c.length ? c.map((x) => ({ ...emptyCrop(), ...x })) : [emptyCrop()]);
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  const handleSave = async () => {
    const missing = [];
    if (!farmer.last_name.trim()) missing.push('Nom');
    if (!farmer.first_name.trim()) missing.push('Prénom');
    if (!farmer.nin.trim()) missing.push('NIN');
    if (missing.length) {
      toast.warn(`Veuillez remplir les champs obligatoires : ${missing.join(', ')}`);
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
        setFarmer({ ...emptyFarmer(), ...detail.farmer });
        setCrops(detail.crops.length ? detail.crops.map((x) => ({ ...emptyCrop(), ...x })) : [emptyCrop()]);
      } else {
        toast.error('Erreur : enregistrement échoué');
      }
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) return;
    try {
      await window.api.deleteFarmer(selectedId);
      toast.deleted('Supprimé');
      handleNew();
      await loadFarmers();
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  const handlePrint = () => setPreviewOpen(true);
  const handlePrintNow = () => {
    window.api.printWindow();
  };

  return (
    <div className="flex h-screen flex-col bg-canvas">
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
          <RegistrationForm farmer={farmer} onField={onField} crops={crops} setCrops={setCrops} />
        </main>
      </div>

      <PrintPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        farmer={farmer}
        crops={crops}
        onPrint={handlePrintNow}
      />
    </div>
  );
}
