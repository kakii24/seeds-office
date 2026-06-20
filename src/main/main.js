'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const XLSX = require('xlsx');
const dbApi = require('./database');

const isDev = process.env.NODE_ENV === 'development';
const DEV_SERVER = 'http://localhost:5173';

let mainWindow = null;

/* ------------------------------------------------------------------ */
/* Window creation — a single window; the renderer's nav bar switches  */
/* between the Enregistrement and Suivi de Distribution views.         */
/* ------------------------------------------------------------------ */

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1100,
    minHeight: 660,
    title: 'Bureau de Distribution des Semences Subventionnées',
    backgroundColor: '#f4faf6',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL(`${DEV_SERVER}/index.html`);
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools();
    });
  } else {
    const prodPath = path.join(__dirname, '../../dist/renderer/index.html');
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => { mainWindow = null; });
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
  ipcMain.handle('farmers:getByNIN', (_e, nin) => dbApi.getFarmerByNIN(nin));
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

function displayDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

async function exportDeliveriesXlsx(event, filteredIds) {
  let rows = dbApi.getDeliveries();

  // If filtered IDs are provided, only export those rows
  if (Array.isArray(filteredIds) && filteredIds.length > 0) {
    const idSet = new Set(filteredIds.map(Number));
    rows = rows.filter((r) => idSet.has(r.id));
  }

  const data = rows.map((r, i) => ({
    'N°': i + 1,
    'Agriculteur (الفلاح)': `${r.last_name} ${r.first_name}`.trim(),
    'NIN (رقم التعريف الوطني)': r.nin || '',
    'Culture (المحصول)': frenchCrop(r.crop_category),
    'Type (النوع)': r.type || '',
    'Produit (نوع المنتج)': r.product_nature || '',
    'Quantité demandée (الكمية المطلوبة)': r.quantity_requested || '',
    'Unité (الوحدة)': r.quantity_unit || 'Kg',
    'Période (فترة الاستخدام)': r.period || '',
    'Opérateur (المزود)': r.operator || '',
    'Quantité livrée (الكمية المسلمة)': r.quantity_delivered || '',
    'Montant (DA) (المبلغ)': r.amount || '',
    'N° Facture (رقم الفاتورة)': r.invoice_number || '',
    'Date de livraison (التاريخ)': r.delivery_date ? displayDate(r.delivery_date) : '',
    'Service fait (الخدمة)': r.service_done || 'Non'
  }));

  const headers = [
    'N°', 'Agriculteur (الفلاح)', 'NIN (رقم التعريف الوطني)', 'Culture (المحصول)',
    'Type (النوع)',
    'Produit (نوع المنتج)', 'Quantité demandée (الكمية المطلوبة)', 'Unité (الوحدة)',
    'Période (فترة الاستخدام)', 'Opérateur (المزود)', 'Quantité livrée (الكمية المسلمة)',
    'Montant (DA) (المبلغ)', 'N° Facture (رقم الفاتورة)', 'Date de livraison (التاريخ)',
    'Service fait (الخدمة)'
  ];

  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  ws['!cols'] = [
    { wch: 5 }, { wch: 24 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 20 },
    { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Livraisons');

  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exporter les livraisons',
    defaultPath: `Suivi_Distribution.xlsx`,
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
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
