import React, { useState } from 'react';
import { 
  Store, 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  Copy, 
  MapPin, 
  Camera, 
  Clock, 
  Phone, 
  MessageCircle, 
  Instagram, 
  Globe, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../services/store';
import { Place, PlaceCategory } from '../types';

interface MerchantHubProps {
  onBackToHome: () => void;
  onOpenDetails: (place: Place) => void;
}

export const MerchantHub: React.FC<MerchantHubProps> = ({
  onBackToHome,
  onOpenDetails,
}) => {
  const {
    currentUser,
    places,
    registerMerchant,
    loginWithGoogle,
    updatePlace,
    createPixPayment,
    confirmPaymentWebhook,
    settings,
    payments,
  } = useApp();

  const [viewState, setViewState] = useState<'landing' | 'register' | 'payment' | 'dashboard'>(
    currentUser?.role === 'COMERCIANTE' ? 'dashboard' : 'landing'
  );

  // Registration Form State
  const [responsibleName, setResponsibleName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('gastronomia');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleMerchantGoogleAuth = async () => {
    setGoogleLoading(true);
    const res = await loginWithGoogle('COMERCIANTE');
    setGoogleLoading(false);
    if (res.success && res.user) {
      setResponsibleName(res.user.name);
      setEmail(res.user.email);
    }
  };

  // Active Payment State
  const [currentPaymentTx, setCurrentPaymentTx] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Merchant's business place
  const merchantBusiness = places.find(
    (p) => p.merchantId === currentUser?.id || (currentUser?.merchantBusinessId && p.id === currentUser.merchantBusinessId)
  );

  // Edit form in merchant dashboard
  const [editDesc, setEditDesc] = useState(merchantBusiness?.description || '');
  const [editAddress, setEditAddress] = useState(merchantBusiness?.address || '');
  const [editHours, setEditHours] = useState(merchantBusiness?.hours || '');
  const [editPhone, setEditPhone] = useState(merchantBusiness?.phone || '');
  const [editWhatsapp, setEditWhatsapp] = useState(merchantBusiness?.whatsapp || '');
  const [editInstagram, setEditInstagram] = useState(merchantBusiness?.instagram || '');
  const [editWebsite, setEditWebsite] = useState(merchantBusiness?.website || '');
  const [editLat, setEditLat] = useState(merchantBusiness?.latitude || -22.31644);
  const [editLng, setEditLng] = useState(merchantBusiness?.longitude || -43.81552);
  const [editImageUrl, setEditImageUrl] = useState(merchantBusiness?.imageUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle register merchant
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsibleName || !businessName || !email) return;

    const user = await registerMerchant({
      name: responsibleName,
      email,
      businessName,
      phone,
      whatsapp,
      category,
    });

    // Create PIX transaction for R$ 49,90
    if (user.merchantBusinessId) {
      const tx = createPixPayment(
        user.merchantBusinessId,
        businessName,
        settings.commercialPrice || 49.90
      );
      setCurrentPaymentTx(tx);
      setViewState('payment');
    }
  };

  // Simulate payment confirmation via webhook trigger
  const handleSimulateWebhookPayment = () => {
    if (!currentPaymentTx) return;
    setPaymentProcessing(true);
    setTimeout(() => {
      confirmPaymentWebhook(currentPaymentTx.id);
      setPaymentProcessing(false);
      setViewState('dashboard');
    }, 1500);
  };

  const handleCopyPix = () => {
    if (currentPaymentTx?.pixCode) {
      navigator.clipboard?.writeText(currentPaymentTx.pixCode);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    }
  };

  const handleSaveDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantBusiness) return;

    updatePlace(merchantBusiness.id, {
      description: editDesc,
      address: editAddress,
      hours: editHours,
      phone: editPhone,
      whatsapp: editWhatsapp,
      instagram: editInstagram,
      website: editWebsite,
      latitude: parseFloat(editLat as any),
      longitude: parseFloat(editLng as any),
      imageUrl: editImageUrl || merchantBusiness.imageUrl,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* 1. Commercial Landing View */}
      {viewState === 'landing' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d3822] via-[#0b331e] to-stone-900 p-6 text-white shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold mb-3 shadow-md">
              <Store className="w-6 h-6" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 mb-2">
              Guia Comercial de Conservatória
            </div>

            <h2 className="text-2xl font-bold font-serif-header leading-tight">
              Coloque seu negócio no mapa de Conservatória.
            </h2>
            <p className="mt-2 text-xs text-stone-200 leading-relaxed">
              Alcance milhares de turistas que visitam a Capital da Seresta todos os fins de semana em busca de pousadas, restaurantes, artesanatos e serviços.
            </p>

            {/* Price Badge */}
            <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-stone-300">Anúncio Comercial:</span>
                <div className="text-2xl font-black text-amber-300">
                  R$ {settings.commercialPrice?.toFixed(2) || '49,90'}
                  <span className="text-xs font-normal text-white"> /mês</span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-300 font-semibold">
                Assinatura mensal sem carência
              </span>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Vantagens para seu estabelecimento:
            </h3>

            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Destaque no Mapa Interativo:</strong> Marcador personalizado com foto e indicação de rota por GPS.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Botão direto de WhatsApp e Ligação:</strong> Turistas entram em contato com um toque.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Apareça nas Buscas Globais:</strong> Filtros por gastronomia, pousadas, lojas e serviços.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Painel Exclusivo do Comerciante:</strong> Atualize horários, fotos, cardápios e promoções a qualquer momento.</span>
              </div>
            </div>

            <button
              onClick={() => setViewState('register')}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>QUERO CADASTRAR MEU NEGÓCIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Already have an account */}
          <div className="text-center">
            <button
              onClick={() => setViewState('dashboard')}
              className="text-xs font-bold text-[#0d3822] hover:underline"
            >
              Já possui cadastro? Acesse o Painel do Comerciante
            </button>
          </div>
        </div>
      )}

      {/* 2. Merchant Registration Form */}
      {viewState === 'register' && (
        <form onSubmit={handleRegister} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold text-[#0d3822] uppercase tracking-wider">
              Passo 1 de 2
            </span>
            <h3 className="text-xl font-bold font-serif-header text-stone-900">
              Cadastro do Estabelecimento
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Preencha os dados do seu negócio em Conservatória.
            </p>
          </div>

          {/* Botão de Preenchimento via Conta Google */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleMerchantGoogleAuth}
            className="w-full py-2.5 px-4 rounded-2xl bg-white border border-stone-300 hover:bg-stone-50 active:scale-95 text-stone-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{googleLoading ? 'Conectando ao Google...' : 'Preencher dados com a Conta Google'}</span>
          </button>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-2 text-[10px] uppercase font-bold text-stone-400 absolute">
              ou preencha manualmente
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome do Responsável *
              </label>
              <input
                type="text"
                required
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ex: Maria Clara Fernandes"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome do Estabelecimento *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Pousada & Café das Flores"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Categoria Comercial *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              >
                <option value="gastronomia">Restaurante / Bar / Gastronomia</option>
                <option value="pousadas">Pousada / Hotel / Hospedagem</option>
                <option value="comercio">Comércio / Artesanato / Loja</option>
                <option value="servicos">Serviços / Fotografia / Mecânica</option>
                <option value="eventos">Eventos / Shows / Música</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  E-mail Comercial *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  WhatsApp com DDD *
                </label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(24) 99999-9999"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Telefone Fixo (opcional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(24) 2438-0000"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Senha de Acesso ao Painel *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-sm shadow-md active:scale-95 transition"
            >
              Prosseguir para Pagamento (R$ {settings.commercialPrice?.toFixed(2) || '49,90'})
            </button>

            <button
              type="button"
              onClick={() => setViewState('landing')}
              className="w-full py-2 text-stone-500 text-xs font-medium hover:text-stone-800"
            >
              Voltar
            </button>
          </div>
        </form>
      )}

      {/* 3. Real Payment Flow (PIX & Card Gateway) */}
      {viewState === 'payment' && (
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold text-[#0d3822] uppercase tracking-wider">
              Passo 2 de 2 • Pagamento Seguro
            </span>
            <h3 className="text-xl font-bold font-serif-header text-stone-900">
              Pagamento da Assinatura Mensal
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Valor do plano comercial: <strong>R$ {settings.commercialPrice?.toFixed(2) || '49,90'}/mês</strong>
            </p>
          </div>

          {/* PIX Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Pague via PIX com ativação rápida</span>
            </div>

            {/* QR Code */}
            <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-center">
              {currentPaymentTx?.pixQrCodeUrl ? (
                <img
                  src={currentPaymentTx.pixQrCodeUrl}
                  alt="PIX QR Code Conservatória Turismo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-stone-400 text-xs">Carregando QR Code...</div>
              )}
            </div>

            {/* Copy PIX Key */}
            <button
              onClick={handleCopyPix}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Copy className="w-3.5 h-3.5 text-[#0d3822]" />
              <span>{pixCopied ? 'Código PIX Copiado!' : 'Copiar Chave PIX Copia-e-Cola'}</span>
            </button>
          </div>

          {/* Webhook real trigger / confirmation simulator */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2 text-amber-900 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>Confirmação Real de Pagamento & Webhook:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              O sistema aguarda a notificação oficial do gateway bancário. Em ambiente de homologação, utilize o botão abaixo para disparar o webhook de confirmação automática:
            </p>
            <button
              onClick={handleSimulateWebhookPayment}
              disabled={paymentProcessing}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0d3822] text-white font-bold text-xs hover:bg-[#124b2e] active:scale-95 transition flex items-center justify-center gap-2"
            >
              {paymentProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando Webhook Bancário...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirmar Recebimento do PIX (Webhook)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Merchant Dashboard (MEU NEGÓCIO) */}
      {viewState === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header Status */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Painel do Comerciante
                </span>
                <h3 className="text-xl font-bold font-serif-header text-stone-900">
                  {merchantBusiness?.name || 'Meu Estabelecimento'}
                </h3>
              </div>

              {/* Status Badge */}
              <div>
                {merchantBusiness?.status === 'ACTIVE' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    ● ATIVO NO GUIA
                  </span>
                )}
                {merchantBusiness?.status === 'PENDING_APPROVAL' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    ⏳ AGUARDANDO APROVAÇÃO
                  </span>
                )}
                {merchantBusiness?.status === 'PENDING_PAYMENT' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    ⚠️ PAGAMENTO PENDENTE
                  </span>
                )}
                {merchantBusiness?.status === 'EXPIRED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700">
                    ASSINATURA EXPIRADA
                  </span>
                )}
              </div>
            </div>

            {/* Explanation on status */}
            {merchantBusiness?.status === 'PENDING_APPROVAL' && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Pagamento confirmado!</strong> Seu cadastro foi enviado aos administradores do Conservatória Turismo e será publicado em instantes após conferência dos dados.
              </div>
            )}

            {merchantBusiness?.status === 'PENDING_PAYMENT' && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between">
                <span>Pagamento de R$ 49,90 ainda não confirmado.</span>
                <button
                  onClick={() => setViewState('payment')}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                >
                  Pagar PIX
                </button>
              </div>
            )}

            {merchantBusiness?.status === 'EXPIRED' && (
              <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-800 flex items-center justify-between">
                <span>Renove sua presença no mapa por mais 30 dias.</span>
                <button
                  onClick={() => setViewState('payment')}
                  className="px-3 py-1 bg-[#0d3822] text-white rounded-lg text-xs font-bold hover:bg-[#124b2e]"
                >
                  RENOVAR POR R$ 49,90/mês
                </button>
              </div>
            )}

            {merchantBusiness && (
              <button
                onClick={() => onOpenDetails(merchantBusiness)}
                className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5 text-[#0d3822]" />
                <span>Visualizar Como o Turista Enxerga</span>
              </button>
            )}

            {/* Financial Performance, Expenses & Breakeven KPIs */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Indicadores Financeiros & Ponto de Equilíbrio
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-semibold block">Custo Fixo (Assinatura)</span>
                  <span className="text-sm font-black text-stone-900">R$ 49,90 <span className="text-[10px] font-normal text-stone-500">/mês</span></span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Sem taxas extras</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-semibold block">Comissão por Venda</span>
                  <span className="text-sm font-black text-emerald-900">0% <span className="text-[10px] font-normal text-emerald-700">(R$ 0,00)</span></span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">100% da margem é sua</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-800 text-xs">
                  <span>Ponto de Equilíbrio (Breakeven):</span>
                  <span className="text-emerald-800 font-black">1 cliente / mês</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  Com apenas 1 venda ou diária direta via WhatsApp (ticket médio de R$ 50), o custo de R$ 49,90/mês é 100% coberto. A economia estimada em comissão frente a marketplaces tradicionais (15% a 25%) preserva toda a sua margem de lucro líquido.
                </p>
              </div>
            </div>
          </div>

          {/* Edit Business Form */}
          {merchantBusiness && (
            <form onSubmit={handleSaveDashboard} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Editar Informações Comerciais
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Foto Principal (URL da Imagem):
                  </label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                  {editImageUrl && (
                    <img
                      src={editImageUrl}
                      alt="Prévia"
                      className="mt-2 h-24 w-full object-cover rounded-xl border border-stone-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Descrição do Estabelecimento:
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Endereço Completo em Conservatória:
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Latitude:
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editLat}
                      onChange={(e) => setEditLat(parseFloat(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Longitude:
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editLng}
                      onChange={(e) => setEditLng(parseFloat(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      WhatsApp:
                    </label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Instagram (@):
                    </label>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Horário de Funcionamento:
                  </label>
                  <input
                    type="text"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>
              </div>

              {saveSuccess ? (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
                  Dados atualizados com sucesso!
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-xs shadow transition active:scale-95"
                >
                  Salvar Alterações
                </button>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};
