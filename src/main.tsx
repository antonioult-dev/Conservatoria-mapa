import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Registrar Service Worker para PWA e funcionamento offline da Central de Emergência
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

