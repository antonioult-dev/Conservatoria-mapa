/**
 * Service Worker — Conservatória Turismo PWA
 * Gerenciamento de suporte offline, pré-cache de ativos essenciais e garantia
 * de funcionamento dos links telefônicos (tel:) da Central de Emergência.
 */

const CACHE_NAME = 'conservatoria-pwa-v1.3';
const EMERGENCY_CACHE = 'conservatoria-emergency-v1';

// Arquivos locais usados para a tela inicial e a Central SOS offline.
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/offline-emergency.html'
];

// Base de contatos de emergência servida offline sem conexão à internet
const EMERGENCY_CONTACTS = {
  version: '2026-10-01',
  police: {
    name: 'Polícia Militar',
    number: '190',
    tel: 'tel:190',
    description: 'Emergência policial, proteção pública e segurança imediata'
  },
  womenHelp: {
    name: 'Central de Atendimento à Mulher',
    number: '180',
    tel: 'tel:180',
    description: 'Acolhimento e denúncias de violência doméstica'
  },
  samu: {
    name: 'SAMU (Ambulância)',
    number: '192',
    tel: 'tel:192',
    description: 'Emergência médica e socorro de urgência'
  },
  firefighters: {
    name: 'Corpo de Bombeiros',
    number: '193',
    tel: 'tel:193',
    description: 'Incêndios, resgates florestais, cachoeiras e salvamento'
  },
  localContacts: [
    { name: 'DPO Conservatória (Polícia Local)', number: '(24) 2438-1200', tel: 'tel:2424381200' },
    { name: 'Posto de Saúde Municipal', number: '(24) 2438-1310', tel: 'tel:2424381310' }
  ],
  notice: 'Chamadas telefônicas para os serviços públicos de emergência (190, 180, 192, 193) operam através da rede de telefonia celular e funcionam sem conexão à internet e sem créditos.'
};

// 1. Instalação: baixa e armazena os ativos essenciais no cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Aviso durante o pré-cache de ativos:', err);
        });
      }),
      caches.open(EMERGENCY_CACHE).then((cache) => {
        const emergencyResponse = new Response(JSON.stringify(EMERGENCY_CONTACTS), {
          headers: { 'Content-Type': 'application/json' }
        });
        return cache.put('/api/offline-emergency-contacts.json', emergencyResponse);
      })
    ])
  );
});

// 2. Ativação: assume controle imediato e purga caches legados
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== EMERGENCY_CACHE) {
            console.log('[SW] Limpando versão de cache antiga:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Gerenciamento de Requisições e Suporte Offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca intercepte requisições externas, ações de escrita ou protocolos do sistema.
  if (
    url.origin !== self.location.origin ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Interceptar requisições da Central de Emergência se a API falhar offline
  if (url.pathname === '/api/offline-emergency-contacts.json') {
    event.respondWith(
      caches.match('/api/offline-emergency-contacts.json').then((cached) => {
        return cached || new Response(JSON.stringify(EMERGENCY_CONTACTS), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Não armazene respostas de API/Firebase ou documentos privados no Cache Storage.
  const isStaticAsset = url.pathname.startsWith('/assets/') || [
    '/manifest.json', '/icon.svg', '/icon-192.png', '/icon-512.png', '/offline-emergency.html', '/sw.js',
  ].includes(url.pathname);
  if (!isStaticAsset && event.request.mode !== 'navigate') return;

  // Navegações de página (HTML): Network-First com fallback para a aplicação em cache ou página de emergência
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Quando estiver offline, tenta carregar o app em cache
          const cachedApp = (await caches.match('/')) || (await caches.match('/index.html'));
          if (cachedApp) return cachedApp;

          // Se por algum motivo o app não estiver em cache, entrega a Central de Emergência Offline
          const emergencyFallback = await caches.match('/offline-emergency.html');
          if (emergencyFallback) return emergencyFallback;

          return new Response('Offline - Conservatória Turismo', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Ativos estáticos (Scripts, CSS, Imagens, Fontes): Cache-First com atualização em segundo plano
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualização em background (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
          })
          .catch(() => {
            // Ignora falhas de background fetch quando offline
          });
        return cachedResponse;
      }

      // Se não estiver em cache, busca na rede e guarda no cache
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Imagens usam o ícone local; outros arquivos ausentes falham explicitamente.
          if (event.request.destination === 'image') {
            return caches.match('/icon.svg');
          }
          return Response.error();
        });
    })
  );
});
