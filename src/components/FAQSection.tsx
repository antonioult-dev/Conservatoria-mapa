import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  Award,
  DollarSign,
  MapPin,
  ShieldAlert,
  Mail,
  Sparkles,
  WifiOff,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'geral' | 'guias' | 'comercial' | 'mapa' | 'emergencia';
  question: string;
  answer: string;
  badge?: string;
}

interface FAQSectionProps {
  onOpenGmailContact?: () => void;
  onNavigateToTab?: (tab: 'inicio' | 'mapa' | 'roteiros' | 'guias' | 'favoritos' | 'painel') => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  onOpenGmailContact,
  onNavigateToTab,
}) => {
  const [openItem, setOpenItem] = useState<string | null>('faq_1');
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  const faqData: FAQItem[] = [
    {
      id: 'faq_1',
      category: 'geral',
      question: 'O que é o aplicativo Conservatória Turismo?',
      answer:
        'O Conservatória Turismo é um catálogo digital de locais e serviços de Conservatória, Valença (RJ). Ele exibe registros publicados no Firebase; o conteúdo depende de cadastro e revisão. O GPS usa apenas a localização autorizada pelo navegador, e a disponibilidade de rotas depende de dados e serviços reais.',
      badge: 'Principal',
    },
    {
      id: 'faq_2',
      category: 'guias',
      question: 'Como funciona a contratação de guias turísticos?',
      answer:
        'Na aba "Guias", consulte os perfis que foram publicados após análise. Confirme credenciais, preço, disponibilidade e local de encontro diretamente com o profissional antes de contratar.',
      badge: 'Perfis publicados',
    },
    {
      id: 'faq_3',
      category: 'comercial',
      question: 'Quanto custa para guias e comércios se cadastrarem no aplicativo?',
      answer:
        'O preço oficial é R$ 49,90 por mês. A cobrança ainda depende da configuração de um gateway e de confirmação segura no servidor; o app não gera PIX nem confirma pagamentos enquanto isso não estiver disponível.',
      badge: 'R$ 49,90 / mês',
    },
    {
      id: 'faq_4',
      category: 'guias',
      question: 'Sou guia turístico em Conservatória, como faço meu cadastro?',
      answer:
        'Acesse a aba "Guias" e envie seus dados e número de CADASTUR. O cadastro exige login Google e fica pendente até análise. A assinatura custa R$ 49,90 por mês; não há cobrança nem confirmação de pagamento enquanto um gateway real não estiver integrado.',
      badge: 'Cadastro sujeito à análise',
    },
    {
      id: 'faq_5',
      category: 'mapa',
      question: 'Como funciona a navegação GPS e o botão "Como Chegar"?',
      answer:
        'Ao autorizar a geolocalização, o app pode calcular a distância em linha reta entre sua posição atual e locais com coordenadas verificadas. "Como Chegar" abre o Google Maps somente para esses locais; sem GPS ou coordenadas aprovadas, não mostra distância nem inicia navegação.',
      badge: 'Permissão do navegador',
    },
    {
      id: 'faq_6',
      category: 'geral',
      question: 'O aplicativo funciona se eu ficar sem sinal de internet (offline)?',
      answer:
        'A interface instalada pode abrir offline, mas o catálogo Firebase exige conexão e não é garantido que os dados estejam disponíveis sem rede. Chamadas para números de emergência dependem de cobertura móvel e disponibilidade do serviço telefônico.',
      badge: 'Dados online',
    },
    {
      id: 'faq_7',
      category: 'emergencia',
      question: 'Como funciona a Central de Emergência e SOS?',
      answer:
        'O acesso à Central de Emergência é 100% gratuito e não exige nenhum cadastro ou login. Toque no botão vermelho "SOS" no menu inferior para discagem rápida imediata para Polícia (190), Mulher (180), SAMU (192) e Bombeiros (193). A função de Emergência Pessoal exige confirmação de 2 segundos para evitar ligações acidentais.',
      badge: '100% Gratuito',
    },
    {
      id: 'faq_8',
      category: 'geral',
      question: 'Como enviar uma sugestão ou relatar um problema no app?',
      answer:
        'O envio por Gmail pede uma autorização Google separada quando você conecta esse recurso. Se a autorização ou a API não estiver configurada, use outro canal de contato disponível.',
      badge: 'Autorização necessária',
    },
  ];

  const filteredFaqs = activeFilter === 'todos'
    ? faqData
    : faqData.filter((f) => f.category === activeFilter);

  const filterButtons = [
    { id: 'todos', label: 'Todas as Dúvidas' },
    { id: 'guias', label: '🧭 Guias & Passeios' },
    { id: 'comercial', label: '💰 Mensalidade R$ 49,90' },
    { id: 'mapa', label: '📍 Mapa & Rotas' },
    { id: 'emergencia', label: '🚨 Emergência SOS' },
  ];

  return (
    <div className="rounded-3xl bg-white border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0d3822] text-[10px] font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tira-Dúvidas Oficial</span>
          </div>
          <h3 className="text-lg font-bold font-serif-header text-stone-900 leading-tight">
            Perguntas Frequentes (FAQ)
          </h3>
          <p className="text-xs text-stone-500">
            Tudo sobre o funcionamento do app, passeios, guias credenciados e anúncios.
          </p>
        </div>

        {onOpenGmailContact && (
          <button
            onClick={onOpenGmailContact}
            className="flex-shrink-0 p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center gap-1.5"
            title="Enviar e-mail de suporte pelo Gmail"
          >
            <Mail className="w-4 h-4 text-emerald-800" />
            <span className="hidden sm:inline">Suporte Gmail</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveFilter(btn.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
              activeFilter === btn.id
                ? 'bg-[#0d3822] text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-2">
        {filteredFaqs.map((item) => {
          const isOpen = openItem === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? 'border-emerald-700/30 bg-emerald-50/20 shadow-2xs'
                  : 'border-stone-200/80 bg-stone-50/50 hover:bg-stone-50'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenItem(isOpen ? null : item.id)}
                className="w-full text-left p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-stone-900 leading-snug">
                    {item.question}
                  </span>
                  {item.badge && (
                    <span className="hidden sm:inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-stone-200 shadow-2xs text-stone-600">
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-200/50 space-y-2 animate-in fade-in">
                  <p>{item.answer}</p>

                  {/* Contextual Action Buttons */}
                  {item.category === 'guias' && onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('guias')}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0d3822] hover:underline"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Ir para a aba de Guias Turísticos →</span>
                    </button>
                  )}

                  {item.category === 'mapa' && onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('mapa')}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0d3822] hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Explorar o Mapa Interativo de Conservatória →</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gmail Contact CTA Card */}
      {onOpenGmailContact && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Não encontrou sua resposta?</h4>
              <p className="text-[11px] text-stone-300">
                Fale com a equipe do app pelo Gmail (antoniou.lt@gmail.com).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenGmailContact}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap shadow-xs transition active:scale-95 flex items-center gap-1"
          >
            <span>Falar Conosco</span>
          </button>
        </div>
      )}
    </div>
  );
};
