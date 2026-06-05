'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const XLSX = require('xlsx');
const dbApi = require('./database');

const isDev = process.env.NODE_ENV === 'development';
const DEV_SERVER = 'http://localhost:5173';

let window1 = null;
let window2 = null;

/* ------------------------------------------------------------------ */
/* Window creation                                                     */
/* ------------------------------------------------------------------ */

const commonWebPrefs = {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false
};

function loadRenderer(win, name) {
  if (isDev) {
    win.loadURL(`${DEV_SERVER}/${name}/index.html`);
  } else {
    win.loadFile(path.join(__dirname, `../../dist/renderer/${name}/index.html`));
  }
}

function createWindow1() {
  window1 = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    title: 'Enregistrement — Semences Subventionnées',
    backgroundColor: '#f4faf6',
    autoHideMenuBar: true,
    webPreferences: commonWebPrefs
  });
  loadRenderer(window1, 'window1');
  window1.on('closed', () => { window1 = null; });
}

function createWindow2() {
  window2 = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 640,
    title: 'Suivi de Distribution et Facturation',
    backgroundColor: '#f4faf6',
    autoHideMenuBar: true,
    webPreferences: commonWebPrefs
  });
  loadRenderer(window2, 'window2');
  window2.on('closed', () => { window2 = null; });
}

function createWindows() {
  createWindow1();
  createWindow2();
  if (window1 && window2) {
    // Offset the second window so both are visible on first launch.
    const [x, y] = window1.getPosition();
    window2.setPosition(x + 48, y + 48);
  }
}

/** Tell every open window that the database changed so they can refresh. */
function broadcastDataChanged() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('data-changed');
  }
}

/* ------------------------------------------------------------------ */
/* IPC handlers                                                        */
/* ------------------------------------------------------------------ */

function registerIpc() {
  // Farmers
  ipcMain.handle('farmers:save', (_e, payload) => {
    const res = dbApi.saveFarmer(payload);
    broadcastDataChanged();
    return res;
  });
  ipcMain.handle('farmers:list', () => dbApi.getFarmers());
  ipcMain.handle('farmers:detail', (_e, id) => dbApi.getFarmerDetail(id));
  ipcMain.handle('farmers:delete', (_e, id) => {
    const res = dbApi.deleteFarmer(id);
    broadcastDataChanged();
    return res;
  });

  // Crop requests
  ipcMain.handle('crops:forFarmer', (_e, farmerId) => dbApi.getCropRequestsForFarmer(farmerId));

  // Deliveries
  ipcMain.handle('deliveries:list', (_e, farmerId) => dbApi.getDeliveries(farmerId));
  ipcMain.handle('deliveries:save', (_e, delivery) => {
    const res = dbApi.saveDelivery(delivery);
    broadcastDataChanged();
    return res;
  });
  ipcMain.handle('deliveries:delete', (_e, id) => {
    const res = dbApi.deleteDelivery(id);
    broadcastDataChanged();
    return res;
  });

  // Utilities
  ipcMain.handle('utils:exportDeliveriesXlsx', (event, farmerId) =>
    exportDeliveriesXlsx(event, farmerId)
  );
  ipcMain.handle('utils:print', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.webContents.print({ silent: false, printBackground: true });
    return { success: true };
  });
}

/* ------------------------------------------------------------------ */
/* Excel export                                                        */
/* ------------------------------------------------------------------ */

async function exportDeliveriesXlsx(event, farmerId) {
  const rows = dbApi.getDeliveries(farmerId);

  const data = rows.map((r, i) => ({
    'N°': i + 1,
    'Agriculteur': `${r.last_name} ${r.first_name}`.trim(),
    'NIN': r.nin || '',
    'Culture': frenchCrop(r.crop_category),
    'Produit': r.product_nature || '',
    'Quantité demandée': r.quantity_requested || '',
    'Période': r.period || '',
    'Opérateur': r.operator || '',
    'Quantité livrée': r.quantity_delivered || '',
    'Montant (DA)': r.amount || '',
    'N° Facture': r.invoice_number || '',
    'Date de livraison': r.delivery_date || '',
    'Service fait': r.service_done || 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data, {
    header: [
      'N°', 'Agriculteur', 'NIN', 'Culture', 'Produit', 'Quantité demandée',
      'Période', 'Opérateur', 'Quantité livrée', 'Montant (DA)', 'N° Facture',
      'Date de livraison', 'Service fait'
    ]
  });
  ws['!cols'] = [
    { wch: 5 }, { wch: 24 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Livraisons');

  const win = BrowserWindow.fromWebContents(event.sender);
  const stamp = new Date().toISOString().slice(0, 10);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exporter les livraisons',
    defaultPath: `livraisons_semences_${stamp}.xlsx`,
    filters: [{ name: 'Classeur Excel', extensions: ['xlsx'] }]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  try {
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buf);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function frenchCrop(category) {
  const map = {
    Forage: 'Forage',
    Cereal: 'Céréales',
    'Céréales': 'Céréales',
    'Maraîchage': 'Maraîchage',
    Maraichage: 'Maraîchage',
    Arboriculture: 'Arboriculture',
    Autre: 'Autre'
  };
  return map[category] || category || '';
}

/* ------------------------------------------------------------------ */
/* App lifecycle                                                       */
/* ------------------------------------------------------------------ */

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'seeds_office.db');
  dbApi.initDatabase(dbPath);
  registerIpc();
  createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
