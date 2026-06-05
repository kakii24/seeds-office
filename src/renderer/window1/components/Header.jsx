import React from 'react';

export default function Header({ onNew, onSave, onPrint, onDelete, isEditing, saving }) {
  return (
    <header className="no-print z-20 flex items-center justify-between gap-4 border-b border-forest-900/20 bg-gradient-to-r from-forest-900 to-forest-700 px-6 py-3 text-white shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none">🌾</span>
        <div>
          <h1 className="text-base font-bold leading-tight md:text-lg">
            Bureau de Distribution des Semences Subventionnées
          </h1>
          <p className="text-xs font-medium text-white/70">Fenêtre 1 — Enregistrement</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onNew} className="btn-ghost" title="Nouveau formulaire">
          <Icon path="M12 5v14M5 12h14" /> Nouveau
        </button>
        <button onClick={onPrint} className="btn-ghost" title="Aperçu d'impression">
          <Icon path="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
          Imprimer
        </button>
        {isEditing && (
          <button
            onClick={onDelete}
            className="btn bg-red-600 text-white hover:bg-red-700"
            title="Supprimer l'agriculteur"
          >
            <Icon path="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            Supprimer
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="btn bg-gold-500 text-forest-900 shadow-sm hover:brightness-105"
          title="Enregistrer"
        >
          <Icon path="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </header>
  );
}

function Icon({ path }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
