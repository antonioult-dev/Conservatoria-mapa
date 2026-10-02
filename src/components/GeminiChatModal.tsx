import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  MapPin,
  Search,
  Zap,
  RotateCcw,
  ExternalLink,
  Bot,
  User,
  Music,
  Compass,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: { uri: string; title: string };
      maps?: { uri: string; title: string; placeId?: string };
    }>;
  } | null;
  modelUsed?: string;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Eu sou o **Guia Seresteiro de Conservatória**, alimentado com inteligência artificial do Google. Posso lhe contar histórias dos saraus, ajudar a encontrar restaurantes, pousadas, cachoeiras e consultar dados ao vivo com **Google Search** e **Google Maps**. O que você gostaria de explorar hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [groundingMode, setGroundingMode] = useState<'search' | 'maps' | 'none'>('search');
  const [fastMode, setFastMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (initialPrompt && messages.length === 1) {
        handleSendMessage(initialPrompt);
      }
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Formata histórico para o backend
      const payload = {
        messages: newHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        })),
        groundingMode,
        fastMode,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao processar mensagem com a IA.');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingMetadata: data.groundingMetadata,
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Falha no chat:', e);
      setErrorMsg(e.message || 'Não foi possível obter resposta no momento.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Histórico limpo! Como posso te ajudar na sua visita a Conservatória agora?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    { label: 'Horários da Seresta', icon: Music, prompt: 'Quando começam as serestas e a solarata este fim de semana em Conservatória?' },
    { label: 'Pontos Históricos a Pé', icon: Compass, prompt: 'Quais os principais pontos turísticos para visitar a pé no centro histórico?' },
    { label: 'Onde Comer', icon: MapPin, prompt: 'Recomende bons restaurantes e docerias em Conservatória com Google Maps.' },
    { label: 'Túnel Que Chora', icon: Search, prompt: 'Conte a lenda e como chegar ao Túnel Que Chora e à Ponte dos Arcos.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl h-[88vh] max-h-[720px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0d3822] text-white flex items-center justify-between border-b border-[#134e30]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Guia Seresteiro IA</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Gemini 3.5
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                Informações locais com Google Search & Maps Grounding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Limpar conversa"
              className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-900/60 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Fechar"
              className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-900/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grounding Mode Toggle Bar */}
        <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-stone-400 mr-1 hidden sm:inline">
              Recurso IA:
            </span>

            <button
              type="button"
              onClick={() => setGroundingMode('search')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                groundingMode === 'search'
                  ? 'bg-[#0d3822] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Search</span>
            </button>

            <button
              type="button"
              onClick={() => setGroundingMode('maps')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                groundingMode === 'maps'
                  ? 'bg-[#0d3822] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>

            <button
              type="button"
              onClick={() => setGroundingMode('none')}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition ${
                groundingMode === 'none'
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Direto
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFastMode(!fastMode)}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition ${
              fastMode
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'text-stone-400 hover:text-stone-600'
            }`}
            title="Modo Rápido (Flash Lite)"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Rápido</span>
          </button>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  m.role === 'user'
                    ? 'bg-stone-800 text-white'
                    : 'bg-[#0d3822] text-amber-300 shadow-xs'
                }`}
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-[#0d3822] text-white rounded-tr-xs'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Grounding sources / citations if available */}
                  {m.groundingMetadata?.webSearchQueries && m.groundingMetadata.webSearchQueries.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                      <span className="font-bold flex items-center gap-1 text-emerald-700 mb-1">
                        <Search className="w-3 h-3" /> Pesquisas realizadas:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {m.groundingMetadata.webSearchQueries.map((q, idx) => (
                          <span key={idx} className="bg-stone-100 px-2 py-0.5 rounded-md">
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.groundingMetadata?.groundingChunks && m.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                      <span className="font-bold flex items-center gap-1 text-emerald-700 mb-1">
                        <ExternalLink className="w-3 h-3" /> Fontes e Mapas:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {m.groundingMetadata.groundingChunks.map((chunk, idx) => {
                          const item = chunk.web || chunk.maps;
                          if (!item) return null;
                          return (
                            <a
                              key={idx}
                              href={item.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-50 text-emerald-800 hover:underline px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                            >
                              <span>{item.title || 'Ver fonte'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-stone-400 px-1 flex items-center justify-between">
                  <span>{m.timestamp}</span>
                  {m.modelUsed && (
                    <span className="text-[9px] uppercase tracking-wider text-stone-400">
                      {m.modelUsed}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center animate-pulse">
              <div className="w-7 h-7 rounded-xl bg-[#0d3822] text-amber-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-white border border-stone-200 rounded-2xl rounded-tl-xs text-xs text-stone-500 flex items-center gap-2">
                <span>O Guia Seresteiro está consultando {groundingMode === 'maps' ? 'o Google Maps' : 'o Google'}...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 bg-white border-t border-stone-100 flex items-center gap-2 overflow-x-auto">
            {quickPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition active:scale-95 flex-shrink-0"
                >
                  <Icon className="w-3.5 h-3.5 text-[#0d3822]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte sobre serestas, locais, pratos, horários..."
              disabled={isLoading}
              className="flex-1 text-xs p-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822] bg-stone-50 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 rounded-2xl bg-[#0d3822] text-white hover:bg-[#124b2e] disabled:opacity-40 transition active:scale-95 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
