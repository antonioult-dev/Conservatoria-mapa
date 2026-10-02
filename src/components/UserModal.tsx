import React, { useState } from 'react';
import { User, LogIn, LogOut, ShieldCheck, Store, Compass, X, Download } from 'lucide-react';
import { useApp } from '../services/store';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
  onOpenMerchant: () => void;
  onOpenLegal?: (tab?: 'terms' | 'privacy') => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
  onOpenMerchant,
  onOpenLegal,
}) => {
  const { currentUser, loginWithGoogle, logout } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async (targetRole: 'TURISTA' | 'COMERCIANTE' = 'TURISTA') => {
    setIsSubmitting(true);
    setMsg('');
    setHasError(false);
    try {
      const res = await loginWithGoogle(targetRole);
      if (res.success) {
        setMsg(`Conectado via Google: ${res.user?.name}!`);
        setTimeout(() => {
          setMsg('');
          onClose();
          if (res.user?.role === 'SUPER_ADMIN') onOpenAdmin();
          else if (targetRole === 'COMERCIANTE') onOpenMerchant();
        }, 1000);
      } else {
        setHasError(true);
        setMsg(res.error || 'Erro ao conectar com Google.');
      }
    } catch (error) {
      setHasError(true);
      setMsg(error instanceof Error ? error.message : 'Erro ao conectar com Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0d3822] text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {currentUser ? 'Minha Conta' : 'Acessar App'}
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
              <div className="text-[10px] uppercase font-bold text-stone-400">Usuário Ativo</div>
              <div className="text-sm font-bold text-stone-900">{currentUser.name}</div>
              <div className="text-stone-500">{currentUser.email}</div>
              <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#0d3822] text-white">
                Função: {currentUser.role}
              </div>
            </div>

            {/* Quick role shortcuts */}
            <div className="space-y-1.5">
              {currentUser.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Painel do Administrador Geral</span>
                </button>
              )}

              {currentUser.role === 'COMERCIANTE' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMerchant();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0d3822] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Store className="w-4 h-4" />
                  <span>Meu Negócio Comercial</span>
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Botão Oficial de Login com a Conta Google */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleGoogleAuth('TURISTA')}
              className="w-full py-3 px-4 rounded-2xl bg-white border border-stone-300 hover:bg-stone-50 active:scale-95 text-stone-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isSubmitting ? 'Conectando...' : 'Cadastrar ou Entrar com o Google'}</span>
            </button>

            {msg && (
              <div className={`p-2 rounded-xl text-xs font-bold text-center ${hasError ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`} role={hasError ? 'alert' : 'status'}>
                {msg}
              </div>
            )}

            <div className="pt-2 border-t border-stone-200 space-y-1.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="w-full py-2 px-3 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-black transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acesso SUPER_ADMIN (Administrador)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenMerchant();
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Anuncie seu Negócio (R$ 49,90)</span>
              </button>
            </div>

            {onOpenLegal && (
              <div className="pt-2 text-center border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLegal('terms');
                  }}
                  className="text-[11px] text-stone-500 hover:text-stone-800 underline transition"
                >
                  Termos de Uso & Política de Privacidade (LGPD)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
