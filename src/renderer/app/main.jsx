import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '../shared/Toast.jsx';
import App from './App.jsx';
import '../shared/index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
