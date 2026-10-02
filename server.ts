import express from 'express';
import path from 'path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
const trustProxyHops = process.env.TRUST_PROXY_HOPS?.trim();
if (process.env.VERCEL) {
  // Vercel overwrites X-Forwarded-For with the client IP before invoking the Function.
  app.set('trust proxy', 1);
} else if (trustProxyHops) {
  const hops = Number(trustProxyHops);
  if (Number.isInteger(hops) && hops >= 1 && hops <= 5) app.set('trust proxy', hops);
  else console.warn('[config] TRUST_PROXY_HOPS inválido; cabeçalhos encaminhados não serão confiados.');
}
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '64kb' }));

function getAdminAuth() {
  const serializedCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serializedCredentials) return null;
  try {
    const credentials = JSON.parse(serializedCredentials) as { project_id?: string; client_email?: string; private_key?: string };
    if (!credentials.project_id || !credentials.client_email || !credentials.private_key) return null;
    const adminApp = getApps().find((candidate) => candidate.name === 'conservatoria-admin') || initializeApp({
      credential: cert({ projectId: credentials.project_id, clientEmail: credentials.client_email, privateKey: credentials.private_key.replace(/\\n/g, '\n') }),
    }, 'conservatoria-admin');
    return getAuth(adminApp);
  } catch {
    console.error('[config] FIREBASE_SERVICE_ACCOUNT_JSON inválido; autorização administrativa indisponível.');
    return null;
  }
}

const serverAdminAuth = getAdminAuth();
if (!serverAdminAuth || !process.env.ADMIN_EMAILS?.split(',').some((email) => email.trim())) {
  console.warn('[config] Configure FIREBASE_SERVICE_ACCOUNT_JSON válido e ADMIN_EMAILS para habilitar o painel administrativo.');
}

const requestRates = new Map<string, { count: number; resetAt: number }>();
function isWithinRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  if (requestRates.size >= 10_000) {
    for (const [storedKey, value] of requestRates) if (value.resetAt <= now) requestRates.delete(storedKey);
    if (requestRates.size >= 10_000 && !requestRates.has(key)) return false;
  }
  const current = requestRates.get(key);
  if (current && current.resetAt > now) {
    if (current.count >= maxRequests) return false;
    current.count += 1;
    return true;
  }
  requestRates.set(key, { count: 1, resetAt: now + windowMs });
  return true;
}

app.post('/api/auth/admin-claim', async (req, res) => {
  const adminAuth = serverAdminAuth;
  if (!adminAuth || !process.env.ADMIN_EMAILS?.split(',').some((email) => email.trim())) {
    return res.status(503).json({ error: 'Administração não configurada. O servidor precisa de FIREBASE_SERVICE_ACCOUNT_JSON válido e ADMIN_EMAILS.' });
  }
  const address = req.ip || req.socket.remoteAddress || 'unknown';
  if (!isWithinRateLimit(`admin:${address}`, 10, 60_000)) {
    return res.status(429).json({ error: 'Muitas tentativas de autorização. Aguarde um minuto e tente novamente.' });
  }
  const authorization = req.header('authorization') || '';
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!idToken) return res.status(401).json({ error: 'Sessão Firebase necessária.' });
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Token Firebase inválido ou expirado.' });
  }
  const email = (decoded.email || '').trim().toLowerCase();
  const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (decoded.firebase?.sign_in_provider !== 'google.com' || decoded.email_verified !== true || !allowedAdmins.includes(email)) {
    return res.status(403).json({ error: 'Esta conta Google verificada não está autorizada como administradora.' });
  }
  try {
    const user = await adminAuth.getUser(decoded.uid);
    await adminAuth.setCustomUserClaims(decoded.uid, { ...user.customClaims, admin: true });
    return res.json({ success: true });
  } catch {
    console.error('[auth] Não foi possível atualizar a custom claim administrativa.');
    return res.status(503).json({ error: 'O servidor não conseguiu atualizar a autorização administrativa. Confira a permissão IAM da conta de serviço.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const SYSTEM_INSTRUCTION = `Você é um assistente turístico de Conservatória (RJ), prestativo e claro, e responde em português do Brasil.
Não invente horários, preços, endereços, coordenadas, distâncias, atrações, eventos, credenciais ou disponibilidade. Use fatos turísticos somente quando estiverem em dados confiáveis fornecidos na conversa ou em resultados atuais da ferramenta de pesquisa/mapas. Sem uma fonte, diga que não pode confirmar e sugira consultar o estabelecimento ou uma fonte oficial. Não apresente trajeto ou duração como reais sem resposta de um serviço de roteamento.`;

// Rota de Chat com Gemini Multi-Turn e Grounding (Google Search ou Google Maps)
app.post('/api/chat', async (req, res) => {
  try {
    const address = req.ip || req.socket.remoteAddress || 'unknown';
    if (!isWithinRateLimit(`chat:${address}`, 20, 60_000)) {
      return res.status(429).json({ error: 'Limite temporário de mensagens atingido. Tente novamente em um minuto.' });
    }

    const { messages, groundingMode = 'search', fastMode = false } = req.body;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20 ||
      messages.some((m: unknown) => !m || typeof m !== 'object' ||
        !['user', 'assistant', 'model'].includes((m as { role?: string }).role || '') ||
        typeof (m as { content?: unknown }).content !== 'string' ||
        ((m as { content: string }).content.length > 4000))) {
      return res.status(400).json({ error: 'Histórico inválido: envie até 20 mensagens de texto, com no máximo 4.000 caracteres cada.' });
    }

    const grounding = ['search', 'maps', 'none'].includes(groundingMode) ? groundingMode : null;
    if (!grounding) return res.status(400).json({ error: 'Modo de pesquisa inválido.' });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Serviço de IA não configurado. Configure GEMINI_API_KEY no servidor.' });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Formata o histórico multi-turn
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Configuração de ferramentas (Google Search ou Google Maps Grounding)
    // Nota: De acordo com a especificação, googleMaps e googleSearch não podem ser usados juntos na mesma chamada.
    const tools: Array<{ googleSearch?: {}; googleMaps?: {} }> = [];
    if (grounding === 'maps') {
      tools.push({ googleMaps: {} });
    } else if (grounding === 'search') {
      tools.push({ googleSearch: {} });
    }

    // Modelo selecionado (Gratuito: gemini-3.5-flash para grounding ou gemini-3.1-flash-lite para respostas ultra rápidas)
    const model = fastMode === true && grounding === 'none' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    const reply = response.text || 'Não consegui formular uma resposta neste momento.';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

    res.json({
      reply,
      groundingMetadata,
      modelUsed: model,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Erro na API de Chat Gemini:', error?.name || 'UnknownError');
    res.status(500).json({
      error: 'Erro ao consultar a inteligência artificial do Gemini.',
    });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint de API não encontrado.' }));

function installErrorHandler() {
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;
    const status = typeof error === 'object' && error !== null && 'status' in error && error.status === 400 ? 400 : 500;
    res.status(status).json({ error: status === 400 ? 'Corpo da requisição inválido.' : 'Erro interno do servidor.' });
  });
}

// Inicialização com middleware do Vite em desenvolvimento e arquivos estáticos em produção
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distributionDirectory = path.resolve(__dirname, 'dist');
    const entryFile = path.join(distributionDirectory, 'index.html');
    if (!existsSync(entryFile)) throw new Error('Build de produção ausente. Execute pnpm build antes de iniciar o servidor em produção.');
    app.use(express.static(distributionDirectory, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else res.setHeader('Cache-Control', 'no-cache');
      },
    }));
    app.get('*', (_req, res) => {
      res.sendFile(entryFile);
    });
  }

  installErrorHandler();

  const configuredPort = Number(process.env.PORT || 3000);
  if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
    throw new Error('PORT precisa ser um número inteiro entre 1 e 65535.');
  }

  app.listen(configuredPort, '0.0.0.0', () => {
    console.log(`Servidor Conservatória Turismo ativo na porta ${configuredPort}`);
    if (!process.env.GEMINI_API_KEY) console.warn('[config] GEMINI_API_KEY ausente; o endpoint de IA responderá com HTTP 503.');
  });
}

if (process.env.VERCEL) {
  installErrorHandler();
  if (!process.env.GEMINI_API_KEY) console.warn('[config] GEMINI_API_KEY ausente; o endpoint de IA responderá com HTTP 503.');
} else {
  void startServer().catch((error: unknown) => {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[startup] Falha ao iniciar o servidor (${errorName}).`);
    process.exitCode = 1;
  });
}

export default app;
