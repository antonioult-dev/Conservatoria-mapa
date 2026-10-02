import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Inicialização segura do SDK Gemini no backend
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `Você é o "Guia Seresteiro Oficial de Conservatória (RJ)" — a Capital Nacional da Seresta.
Sua missão é encantar e orientar turistas e moradores com precisão, calor humano e poesia.
Você conhece em detalhes:
1. Atrações imperdíveis: Casa de Cultura, Museu da Seresta, Túnel Que Chora, Ponte dos Arcos, Igreja Matriz de Santo Antônio, Praça da Matriz, Cachoeira da Índia, Serra da Beleza.
2. A tradição musical: Noites de Seresta (sextas e sábados), Serenatas sob as janelas floridas com placas de modinhas, e a Solarata aos domingos de manhã.
3. Gastronomia e Pousadas: comida colonial, queijos, doces caseiros, cachaças artesanais e aconchegantes pousadas coloniais.
4. Logística e Localização: distâncias a pé no centro histórico, telefones de socorro e orientações de segurança.

Seja sempre prestativo, acolhedor e forneça respostas práticas em português do Brasil com formatação clara e agradável.`;

// Rota de Chat com Gemini Multi-Turn e Grounding (Google Search ou Google Maps)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, groundingMode = 'search', fastMode = false } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Nenhuma mensagem fornecida.' });
    }

    // Formata o histórico multi-turn
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Configuração de ferramentas (Google Search ou Google Maps Grounding)
    // Nota: De acordo com a especificação, googleMaps e googleSearch não podem ser usados juntos na mesma chamada.
    const tools: Array<{ googleSearch?: {}; googleMaps?: {} }> = [];
    if (groundingMode === 'maps') {
      tools.push({ googleMaps: {} });
    } else if (groundingMode === 'search') {
      tools.push({ googleSearch: {} });
    }

    // Modelo selecionado (Gratuito: gemini-3.5-flash para grounding ou gemini-3.1-flash-lite para respostas ultra rápidas)
    const model = fastMode && groundingMode === 'none' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

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
    console.error('Erro na API de Chat Gemini:', error);
    res.status(500).json({
      error: error?.message || 'Erro ao consultar a inteligência artificial do Gemini.',
    });
  }
});

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
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Conservatória Turismo ativo na porta ${PORT}`);
  });
}

startServer();
