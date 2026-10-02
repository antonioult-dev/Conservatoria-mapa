import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { firebaseConfigurationError } from './services/firebase';
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

const root = createRoot(document.getElementById('root')!);
if (firebaseConfigurationError) {
  root.render(
    <main className="min-h-screen bg-stone-50 p-8 text-stone-900" role="alert">
      <h1 className="text-xl font-bold">Firebase ainda não configurado</h1>
      <p className="mt-3 max-w-xl text-sm">{firebaseConfigurationError}</p>
      <p className="mt-2 max-w-xl text-sm">Configure os identificadores públicos do Firebase no ambiente de build e gere novamente o bundle. Nenhum segredo do servidor deve ser informado aqui.</p>
    </main>,
  );
} else {
  root.render(<App />);
}

