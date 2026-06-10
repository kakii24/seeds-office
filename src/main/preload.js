'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure bridge between the renderer and the main process.
 * Renderers access only the methods defined here via window.api — there is
 * no direct Node or ipcRenderer access (contextIsolation: true).
 */
contextBridge.exposeInMainWorld('api', {
  // Farmers
  saveFarmer: (payload) => ipcRenderer.invoke('farmers:save', payload),
  getFarmers: () => ipcRenderer.invoke('farmers:list'),
  getFarmerDetail: (id) => ipcRenderer.invoke('farmers:detail', id),
  getFarmerByNIN: (nin) => ipcRenderer.invoke('farmers:getByNIN', nin),
  deleteFarmer: (id) => ipcRenderer.invoke('farmers:delete', id),

  // Crop requests
  getCropRequestsForFarmer: (farmerId) => ipcRenderer.invoke('crops:forFarmer', farmerId),

  // Deliveries
  getDeliveries: (farmerId) => ipcRenderer.invoke('deliveries:list', farmerId),
  saveDelivery: (delivery) => ipcRenderer.invoke('deliveries:save', delivery),
  deleteDelivery: (id) => ipcRenderer.invoke('deliveries:delete', id),

  // Utilities
  exportDeliveriesXlsx: (farmerId) => ipcRenderer.invoke('utils:exportDeliveriesXlsx', farmerId),
  printWindow: () => ipcRenderer.invoke('utils:print'),

  // Cross-window live refresh: fires whenever the database is mutated in any
  // window. Returns an unsubscribe function.
  onDataChanged: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('data-changed', handler);
    return () => ipcRenderer.removeListener('data-changed', handler);
  }
});
