import React from 'react';
import { Search, User, ShieldAlert, ArrowLeft, Sparkles, Mail } from 'lucide-react';
import { useApp } from '../services/store';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  onOpenEmergency?: () => void;
  onOpenChat?: () => void;
  onOpenGmailContact?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Início',
  subtitle = 'CONSERVATÓRIA, RJ',
  showBack = false,
  onBack,
  onOpenSearch,
  onOpenProfile,
  onOpenEmergency,
  onOpenChat,
  onOpenGmailContact,
}) => {
  const { currentUser } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#f7f5f0]/95 backdrop-blur-md border-b border-stone-200/70 px-4 py-2.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Back or Brand Logo + Title */}
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="p-1.5 -ml-1 text-stone-800 hover:text-[#0d3822] active:scale-95 transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-[#0d3822] p-1.5 flex items-center justify-center shadow-md shadow-[#0d3822]/20 flex-shrink-0">
              <svg viewBox="0 0 512 512" className="w-full h-full" fill="none">
                <circle cx="256" cy="256" r="180" stroke="#c99732" strokeWidth="12" strokeDasharray="18 18" />
                <path d="M256 100 C205 100 165 145 165 200 C165 270 256 380 256 380 C256 380 347 270 347 200 C347 145 307 100 256 100 Z" fill="#ffffff" />
                <ellipse cx="256" cy="195" rx="20" ry="26" fill="#c99732" />
                <line x1="251" y1="172" x2="251" y2="218" stroke="#0d3822" strokeWidth="4" />
                <line x1="256" y1="170" x2="256" y2="220" stroke="#0d3822" strokeWidth="4" />
                <line x1="261" y1="172" x2="261" y2="218" stroke="#0d3822" strokeWidth="4" />
              </svg>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#0d3822] uppercase">
              <span>📍</span>
              <span>{subtitle}</span>
            </div>
            <h1 className="text-xl font-bold font-serif-header text-stone-900 leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right actions: Emergency badge, Search, Profile */}
        <div className="flex items-center gap-1.5">
          {onOpenEmergency && (
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold shadow-sm shadow-red-600/30 transition active:scale-95"
              title="Central de Emergência 190 / 180 / 192 / 193"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">190</span>
            </button>
          )}

          {onOpenChat && (
            <button
              onClick={onOpenChat}
              aria-label="Guia IA de Conservatória"
              className="w-9 h-9 rounded-full bg-emerald-100 hover:bg-emerald-200 text-[#0d3822] flex items-center justify-center transition active:scale-95 border border-emerald-300 shadow-xs"
              title="Pergunte ao Guia Seresteiro (IA)"
            >
              <Sparkles className="w-4 h-4 text-emerald-800" />
            </button>
          )}

          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              aria-label="Pesquisar"
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition active:scale-95"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {onOpenGmailContact && (
            <button
              onClick={onOpenGmailContact}
              aria-label="Fale Conosco via Gmail"
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition active:scale-95"
              title="Fale Conosco / Sugestões via Gmail"
            >
              <Mail className="w-4 h-4 text-stone-700" />
            </button>
          )}

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              aria-label="Perfil do usuário"
              className="w-9 h-9 rounded-full bg-[#0d3822] text-white flex items-center justify-center transition shadow-sm active:scale-95 relative"
            >
              {currentUser ? (
                currentUser.role === 'SUPER_ADMIN' ? (
                  <span className="text-[10px] font-black text-amber-300">ADM</span>
                ) : currentUser.role === 'COMERCIANTE' ? (
                  <span className="text-[10px] font-black text-emerald-200">LOJA</span>
                ) : (
                  <User className="w-4 h-4" />
                )
              ) : (
                <User className="w-4 h-4" />
              )}
              {currentUser && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
