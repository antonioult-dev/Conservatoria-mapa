import React, { useState } from 'react';
import { Mail, Send, X, CheckCircle2, AlertCircle, HelpCircle, Lock } from 'lucide-react';
import { useApp } from '../services/store';
import { connectGmailWithGoogle, getCachedAccessToken } from '../services/firebase';
import { sendGmailSupportEmail, SendSupportEmailParams, SUPPORT_EMAIL } from '../services/gmail';

interface GmailContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: SendSupportEmailParams['category'];
  defaultSubject?: string;
}

export const GmailContactModal: React.FC<GmailContactModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'SUGESTAO',
  defaultSubject = '',
}) => {
  const { currentUser } = useApp();

  const [category, setCategory] = useState<SendSupportEmailParams['category']>(defaultCategory);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  
  // Status states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasAccessToken = !!getCachedAccessToken();

  const handleGoogleConnect = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await connectGmailWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Não foi possível conectar com a Conta Google.');
      } else {
        if (res.user?.displayName && !name) setName(res.user.displayName);
        if (res.user?.email && !email) setEmail(res.user.email);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Erro ao conectar.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Por favor, preencha o assunto e a mensagem.');
      return;
    }
    // Step required by Google Workspace guidelines: User confirmation for sending email on their behalf
    setShowConfirmDialog(true);
  };

  const handleExecuteSend = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setErrorMessage(null);

    const res = await sendGmailSupportEmail({
      category,
      userName: name.trim() || 'Usuário do Conservatória Turismo',
      userEmail: email.trim() || 'Sem e-mail informado',
      subject: subject.trim(),
      message: message.trim(),
      to: SUPPORT_EMAIL,
    });

    setIsSending(false);

    if (res.success) {
      setSuccessMessage('Sua mensagem foi enviada ao endereço de suporte configurado.');
      setTimeout(() => {
        setSuccessMessage(null);
        setMessage('');
        setSubject('');
        onClose();
      }, 3000);
    } else {
      setErrorMessage(res.error || 'Falha ao enviar e-mail. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0d3822] via-[#124b2e] to-[#0a2818] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif-header">Contato & Sugestões</h3>
              <p className="text-[11px] text-stone-200">Envio pelo Gmail após autorização Google</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Success banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5 text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{successMessage}</p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Enviado para: <strong>{SUPPORT_EMAIL}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Connection Card */}
          {!hasAccessToken ? (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0d3822] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Conecte sua Conta Google para enviar pelo Gmail
                </h4>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto mt-0.5">
                  O envio usa a API Gmail com sua autorização. A mensagem só é enviada depois da confirmação abaixo.
                </p>
              </div>

              {/* Official Google Button Style */}
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isLoggingIn || !SUPPORT_EMAIL}
                className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 shadow-2xs font-semibold text-xs transition active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>{isLoggingIn ? 'Conectando...' : 'Conectar com Google (Gmail)'}</span>
              </button>
              {!SUPPORT_EMAIL && <p role="status" className="text-[11px] text-amber-800">Contato indisponível até configurar VITE_SUPPORT_EMAIL no ambiente de build.</p>}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Conta Google Conectada ({currentUser?.email || email || 'Ativa'})</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                Gmail API Ativa
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleInitiateSend} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Tipo de Mensagem *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SendSupportEmailParams['category'])}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822] bg-white font-medium"
              >
                <option value="SUGESTAO">💡 Sugestão de Melhoria para o App</option>
                <option value="SUPORTE">🛠️ Suporte Técnico / Reportar Erro</option>
                <option value="GUIA">🧭 Dúvida ou Cadastro de Guia de Turismo</option>
                <option value="COMERCIO">🏪 Dúvida sobre Anúncio Comercial (R$ 49,90/mês)</option>
                <option value="OUTRO">✉️ Outro Assunto Geral</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Seu E-mail de Resposta *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Assunto *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Sugestão para inclusão de novo sarau histórico..."
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Mensagem Detalhada *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva sua sugestão, dúvida ou problema detalhadamente para nossa equipe de atendimento..."
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Destino: {SUPPORT_EMAIL || 'não configurado'}
              </span>

              <button
                type="submit"
                disabled={isSending || !hasAccessToken || !SUPPORT_EMAIL}
                className="px-5 py-2.5 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />
                <span>{isSending ? 'Enviando...' : 'Revisar & Enviar'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center gap-2 text-stone-900">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold">Confirmar Envio pelo Gmail?</h4>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Você autoriza o aplicativo a enviar este e-mail através da sua conta Google conectada para o endereço de suporte configurado (<strong>{SUPPORT_EMAIL}</strong>)?
            </p>

            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <div><strong>Assunto:</strong> {subject}</div>
              <div><strong>De:</strong> {name} ({email})</div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteSend}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white text-xs font-bold transition shadow-xs"
              >
                Confirmar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
