import React, { useState, useRef, useEffect } from 'react';
import { Phone, Shield, HeartHandshake, Flame, AlertTriangle, X, ShieldAlert, Info } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const [personalEmergencyActive, setPersonalEmergencyActive] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPersonalEmergencyActive(false);
      setHoldProgress(0);
      setIsHolding(false);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle 2-second press for personal emergency button
  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);
    const stepTime = 50; // every 50ms
    const totalTime = 1800; // ~1.8 seconds
    const increment = (stepTime / totalTime) * 100;

    holdIntervalRef.current = window.setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          window.location.href = 'tel:190';
          return 100;
        }
        return prev + increment;
      });
    }, stepTime);
  };

  const endHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const triggerCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-stone-900 text-white rounded-3xl p-5 shadow-2xl border border-red-900/40 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 text-red-400 flex items-center justify-center border border-red-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Acesso Gratuito e Imediato
              </div>
              <h2 className="text-xl font-bold font-serif-header text-white flex items-center gap-1.5">
                Central de Emergência
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar Central de Emergência"
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline & Real Dialer Notice */}
        <div className="mt-3.5 p-3 rounded-2xl bg-stone-800/80 border border-stone-700/60 flex items-start gap-2.5 text-xs text-stone-300">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Disponível sem internet:</span> Os botões abaixo abrem o discador oficial do seu aparelho celular. As ligações para serviços de emergência pública são 100% gratuitas em qualquer operadora.
          </div>
        </div>

        {/* 🚨 EMERGÊNCIA PESSOAL Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-red-950/80 via-stone-900 to-red-950/40 border-2 border-red-600/60 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-600 text-white mb-1.5">
                Risco Imediato
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">
                Emergência Pessoal
              </h3>
              <p className="text-xs text-red-200/80 mt-1">
                Você está em uma situação de perigo imediato?
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Hold-to-call button or direct confirm */}
          <div className="mt-3.5 space-y-2">
            <button
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              onClick={() => {
                if (window.confirm('Deseja ligar imediatamente para o 190 (Polícia Militar)?')) {
                  window.location.href = 'tel:190';
                }
              }}
              className="relative w-full overflow-hidden py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-red-700/40 flex items-center justify-center gap-2.5 transition select-none"
            >
              {/* Progress fill */}
              <div
                className="absolute inset-0 bg-red-800 transition-all duration-75 pointer-events-none"
                style={{ width: `${holdProgress}%` }}
              />
              <Phone className="w-5 h-5 relative z-10 animate-bounce" />
              <span className="relative z-10">
                {isHolding ? `SEGURE... ${Math.round(holdProgress)}%` : 'LIGAR PARA 190 (POLÍCIA)'}
              </span>
            </button>
            <p className="text-[11px] text-center text-stone-400">
              Segure pressionado por 2 segundos ou clique para discar direto.
            </p>
          </div>
        </div>

        {/* 4 Grand Emergency Channels */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* POLÍCIA - 190 */}
          <a
            href="tel:190"
            className="group p-4 rounded-2xl bg-stone-800/90 hover:bg-stone-750 border border-stone-700 hover:border-blue-500/60 transition active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-stone-400 uppercase font-semibold">Polícia Militar</div>
                <div className="text-2xl font-black text-white tracking-wide">190</div>
                <div className="text-[11px] text-stone-400">Crimes, assaltos e risco</div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Phone className="w-4 h-4" />
            </div>
          </a>

          {/* VIOLÊNCIA CONTRA A MULHER - 180 */}
          <a
            href="tel:180"
            className="group p-4 rounded-2xl bg-stone-800/90 hover:bg-stone-750 border border-stone-700 hover:border-purple-500/60 transition active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-stone-400 uppercase font-semibold">Mulher & Família</div>
                <div className="text-2xl font-black text-white tracking-wide">180</div>
                <div className="text-[11px] text-stone-400">Canal oficial de proteção</div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <Phone className="w-4 h-4" />
            </div>
          </a>

          {/* SAMU - 192 */}
          <a
            href="tel:192"
            className="group p-4 rounded-2xl bg-stone-800/90 hover:bg-stone-750 border border-stone-700 hover:border-emerald-500/60 transition active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-stone-400 uppercase font-semibold">SAMU Ambulância</div>
                <div className="text-2xl font-black text-white tracking-wide">192</div>
                <div className="text-[11px] text-stone-400">Emergência médica urgente</div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Phone className="w-4 h-4" />
            </div>
          </a>

          {/* BOMBEIROS - 193 */}
          <a
            href="tel:193"
            className="group p-4 rounded-2xl bg-stone-800/90 hover:bg-stone-750 border border-stone-700 hover:border-amber-500/60 transition active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-stone-400 uppercase font-semibold">Bombeiros</div>
                <div className="text-2xl font-black text-white tracking-wide">193</div>
                <div className="text-[11px] text-stone-400">Resgates, fogo e acidentes</div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-600/30 text-amber-300 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Phone className="w-4 h-4" />
            </div>
          </a>
        </div>

        {/* Local Valença / Conservatória Support Contacts */}
        <div className="mt-4 p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700">
          <div className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
            Postos Oficiais na Região de Conservatória:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900/60">
              <span>DPO Conservatória (Polícia Local)</span>
              <a href="tel:2424381200" className="font-bold text-blue-400 hover:underline">(24) 2438-1200</a>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900/60">
              <span>Posto de Saúde Conservatória</span>
              <a href="tel:2424381310" className="font-bold text-emerald-400 hover:underline">(24) 2438-1310</a>
            </div>
          </div>
        </div>

        {/* Situations Guidance */}
        <div className="mt-4 p-3.5 rounded-2xl bg-stone-800/40 border border-stone-800 text-stone-400 text-xs leading-relaxed space-y-1.5">
          <div className="font-semibold text-stone-300">Situações de segurança e orientação:</div>
          <ul className="list-disc list-inside space-y-0.5 text-stone-400 text-[11px]">
            <li><strong>Roubo, assalto, agressão ou ameaça:</strong> Ligue imediatamente para 190.</li>
            <li><strong>Violência doméstica ou mulher em risco:</strong> Ligue 180 (ou 190 em caso urgente).</li>
            <li><strong>Acidente com feridos ou mal súbito:</strong> Ligue para o SAMU 192.</li>
            <li><strong>Incêndio, salvamento em cachoeira ou resgate:</strong> Ligue para o 193.</li>
          </ul>
        </div>

        {/* Disclaimer / Responsabilidade Legal */}
        <div className="mt-4 p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-[11px] text-stone-400 leading-snug">
          <strong>Aviso de Responsabilidade:</strong> Em situações de emergência, utilize sempre os canais oficiais de atendimento. O aplicativo facilita o acesso aos números diretos no seu celular, mas não substitui os serviços de emergência nem monitora chamadas.
        </div>
      </div>
    </div>
  );
};
