import React, { useState } from 'react';
import { Shield, FileText, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [tab, setTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-[#0d3822] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif-header">Transparência & Segurança</h3>
              <p className="text-[11px] text-emerald-200">Conservatória Turismo • Valença - RJ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2">
          <button
            onClick={() => setTab('terms')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              tab === 'terms'
                ? 'border-[#0d3822] text-[#0d3822]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Termos de Uso</span>
          </button>
          <button
            onClick={() => setTab('privacy')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              tab === 'privacy'
                ? 'border-[#0d3822] text-[#0d3822]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Política de Privacidade (LGPD)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed">
          {/* Note on legal revision */}
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px]">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Aviso de Conformidade:</strong> Versão preliminar das diretrizes do aplicativo, sujeita à revisão jurídica final antes do lançamento público.
            </span>
          </div>

          {tab === 'terms' ? (
            <div className="space-y-3">
              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">1. Natureza do Serviço</h4>
                <p>
                  O aplicativo <strong>Conservatória Turismo</strong> é uma plataforma digital desenvolvida para orientar e promover o turismo cultural, histórico e ecológico no distrito de Conservatória (município de Valença, Estado do Rio de Janeiro). O acesso às informações de pontos turísticos públicos e à Central de Emergência é <strong>100% gratuito</strong> para visitantes e moradores.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">2. Cadastro de Comércios e Guias de Turismo</h4>
                <p>
                  Estabelecimentos comerciais (pousadas, restaurantes, lojas e serviços) e guias de turismo cadastrados participam mediante adesão voluntária a planos de divulgação (com mensalidade a partir de R$ 29,90, sujeita à parametrização da administração).
                </p>
                <p>
                  O aplicativo não cobra comissão sobre passeios ou reservas diretas realizadas entre turistas e prestadores de serviços, atuando exclusivamente como vitrine digital e facilitador de contato.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">3. Informações Geográficas e Deslocamentos</h4>
                <p>
                  As rotas e trajetos sugeridos conectam-se a serviços externos de navegação (como Google Maps). O usuário é o único responsável por verificar as condições reais das vias públicas, trilhas ecológicas, sinalização de trânsito e condições meteorológicas locais. O aplicativo não substitui a prudência e o respeito à legislação de trânsito.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">4. Central de Emergência e Serviços Públicos</h4>
                <p>
                  Os números de emergência (190 - Polícia Militar, 180 - Central da Mulher, 192 - SAMU e 193 - Bombeiros) são canais de utilidade pública do Estado brasileiro. O aplicativo não realiza chamadas ocultas e não monitora o conteúdo das ligações, apenas aciona o discador telefônico do aparelho do próprio usuário.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-3">
              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">1. Compromisso com a Privacidade e a LGPD</h4>
                <p>
                  Em conformidade com a Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018), o Conservatória Turismo preza pela transparência total e pela minimização da coleta de dados pessoais.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">2. Dados de Geolocalização (GPS)</h4>
                <p>
                  A localização geográfica do visitante é solicitada <strong>exclusivamente mediante consentimento expresso</strong> no navegador e utilizada no próprio dispositivo para:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Calcular a distância estimada até os pontos turísticos e estabelecimentos;</li>
                  <li>Indicar o botão "Como Chegar" com a sua posição atual como ponto de partida.</li>
                </ul>
                <p className="mt-1">
                  <strong>Não realizamos rastreamento contínuo em segundo plano</strong> nem gravamos o histórico de deslocamento do usuário em nossos servidores. Caso a permissão seja negada, o aplicativo funciona plenamente permitindo buscas manuais.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">3. Autenticação e Dados de Contato</h4>
                <p>
                  Ao realizar login com a Conta Google (OAuth) ou registrar um estabelecimento comercial, coletamos apenas nome público, e-mail e telefone de contato informados pelo usuário para fins de identificação no painel, gestão da assinatura e suporte técnico.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">4. Direitos do Titular</h4>
                <p>
                  O titular dos dados poderá solicitar a qualquer momento a confirmação, correção ou exclusão de seus dados cadastrais enviando solicitação através do canal oficial de suporte via Gmail integrado no aplicativo ou para o e-mail: <strong>horizonteverdepousada@gmail.com</strong>.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-stone-500">Última atualização: Outubro de 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold transition active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
