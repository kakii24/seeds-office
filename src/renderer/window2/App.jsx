import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import DeliveryTable from './components/DeliveryTable.jsx';
import DeliveryModal from './components/DeliveryModal.jsx';
import { useToast } from '../shared/Toast.jsx';
import { ConfirmModal } from '../shared/ui.jsx';
import { fullName } from '../shared/constants.js';

const emptyFilters = () => ({ searchName: '', searchNIN: '', searchOperator: '', culture: '', status: 'Tout', dateFrom: '', dateTo: '' });

function parseAmount(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
}

export default function App() {
  const toast = useToast();
  const [deliveries, setDeliveries] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [filters, setFilters] = useState(emptyFilters());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [d, f] = await Promise.all([window.api.getDeliveries(), window.api.getFarmers()]);
      setDeliveries(d);
      setFarmers(f);
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const off = window.api.onDataChanged(load);
    return off;
  }, [load]);

  const filtered = useMemo(() => {
    const qName = filters.searchName.trim().toLowerCase();
    const qNin = filters.searchNIN.trim().toLowerCase();
    const qOp = filters.searchOperator.trim().toLowerCase();

    return deliveries.filter((r) => {
      if (qName) {
        const hay = fullName(r).toLowerCase();
        if (!hay.includes(qName)) return false;
      }
      if (qNin) {
        const ninHay = (r.nin || '').toLowerCase();
        const carteHay = (r.num_carte_nationale || '').toLowerCase();
        if (!ninHay.includes(qNin) && !carteHay.includes(qNin)) return false;
      }
      if (qOp) {
        const hay = (r.operator || '').toLowerCase();
        if (!hay.includes(qOp)) return false;
      }
      if (filters.culture) {
        const norm = (c) => (c === 'Céréales' || c === 'Cereal') ? 'Cereal' : c;
        if (norm(r.crop_category) !== norm(filters.culture)) return false;
      }
      if (filters.status && filters.status !== 'Tout') {
        if ((r.service_done || 'Non') !== filters.status) return false;
      }
      if (filters.dateFrom || filters.dateTo) {
        // Convert stored DD/MM/YYYY to YYYY-MM-DD for comparison
        const toISO = (d) => {
          if (!d) return '';
          const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
          return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
        };
        const isoDate = toISO(r.delivery_date) || r.delivery_date;
        if (filters.dateFrom && (!isoDate || isoDate < filters.dateFrom)) return false;
        if (filters.dateTo && (!isoDate || isoDate > filters.dateTo)) return false;
      }
      return true;
    });
  }, [deliveries, filters]);

  const stats = useMemo(() => {
    const done = filtered.filter((r) => r.service_done === 'Oui').length;
    const amountTotal = filtered.reduce((sum, r) => sum + parseAmount(r.amount), 0);
    return { total: filtered.length, done, pending: filtered.length - done, amountTotal };
  }, [filtered]);

  const onChangeFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const onReset = () => setFilters(emptyFilters());

  const handleNew = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const performDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await window.api.deleteDelivery(deleteConfirmId);
      toast.deleted('Supprimé');
      await load();
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  const handleSaved = async () => {
    setModalOpen(false);
    setEditing(null);
    await load();
  };

  const handleExport = async () => {
    try {
      const filteredIds = filtered.map(r => r.id);
      const res = await window.api.exportDeliveriesXlsx(filteredIds);
      if (res?.success) toast.success('Fichier Excel exporté');
      else if (res && !res.canceled) toast.error(`Erreur : ${res.error || 'export échoué'}`);
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  // Native print → OS dialog → works with any installed printer.
  const handlePrint = () => window.print();

  return (
    <div className="flex h-full flex-col bg-canvas">
      <Header stats={stats} onNew={handleNew} onExport={handleExport} onPrint={handlePrint} />
      <FilterBar filters={filters} onChange={onChangeFilters} onReset={onReset} />
      <DeliveryTable rows={filtered} onEdit={handleEdit} onDelete={handleDelete} />

      <DeliveryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        farmers={farmers}
        editing={editing}
      />

      <ConfirmModal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={performDelete}
        title="Supprimer la livraison"
        message="Êtes-vous sûr de vouloir supprimer cet enregistrement de livraison ?"
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}
