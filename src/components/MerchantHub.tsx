import React, { useEffect, useState } from 'react';
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [flowError, setFlowError] = useState('');

  const handleMerchantGoogleAuth = async () => {
    setGoogleLoading(true);
    setFlowError('');
    try {
      const res = await loginWithGoogle('COMERCIANTE');
      if (res.success && res.user) {
        setResponsibleName(res.user.name);
        setEmail(res.user.email);
      } else {
        setFlowError(res.error || 'Não foi possível conectar com o Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleExistingMerchantAccess = async () => {
    setFlowError('');
    setGoogleLoading(true);
    try {
      const result = currentUser ? { success: true, user: currentUser } : await loginWithGoogle('TURISTA');
      if (!result.success || !result.user) {
        setFlowError(result.error || 'Entre com a mesma Conta Google usada no cadastro do negócio.');
        return;
      }
      if (result.user.role !== 'COMERCIANTE') {
        setFlowError('Não encontramos um negócio vinculado a esta conta. Você pode iniciar um novo cadastro.');
        setViewState('register');
        return;
      }
      setViewState('dashboard');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Active Payment State

  // Merchant's business place
  const merchantBusiness = places.find(
    (p) => p.merchantId === currentUser?.id || (currentUser?.merchantBusinessId && p.id === currentUser.merchantBusinessId)
  );

  // Merchant-editable profile fields; geographic coordinates are validated by an administrator.
  const [editDesc, setEditDesc] = useState(merchantBusiness?.description || '');
  const [editAddress, setEditAddress] = useState(merchantBusiness?.address || '');
  const [editHours, setEditHours] = useState(merchantBusiness?.hours || '');
  const [editPhone, setEditPhone] = useState(merchantBusiness?.phone || '');
  const [editWhatsapp, setEditWhatsapp] = useState(merchantBusiness?.whatsapp || '');
  const [editEmail, setEditEmail] = useState(merchantBusiness?.email || '');
  const [editInstagram, setEditInstagram] = useState(merchantBusiness?.instagram || '');
  const [editWebsite, setEditWebsite] = useState(merchantBusiness?.website || '');
  const [editImageUrl, setEditImageUrl] = useState(merchantBusiness?.imageUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (viewState === 'landing' && currentUser?.role === 'COMERCIANTE') setViewState('dashboard');
  }, [currentUser?.role, viewState]);

  useEffect(() => {
    if (!merchantBusiness) return;
    setEditDesc(merchantBusiness.description || '');
    setEditAddress(merchantBusiness.address || '');
    setEditHours(merchantBusiness.hours || '');
    setEditPhone(merchantBusiness.phone || '');
    setEditWhatsapp(merchantBusiness.whatsapp || '');
    setEditEmail(merchantBusiness.email || '');
    setEditInstagram(merchantBusiness.instagram || '');
    setEditWebsite(merchantBusiness.website || '');
    setEditImageUrl(merchantBusiness.imageUrl || '');
  }, [merchantBusiness?.id]);

  // Handle register merchant
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsibleName || !businessName || !email) return;

    let user;
    try {
      user = await registerMerchant({
      name: responsibleName,
      email,
      businessName,
      phone,
      whatsapp,
      category,
      });
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : 'Não foi possível cadastrar o negócio.');
      return;
    }

    // No payment provider is configured; keep the business pending.
    if (user.merchantBusinessId) {
      setViewState('payment');
    }
  };

  const handleSaveDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantBusiness) return;

    setSaveError('');
    try { await updatePlace(merchantBusiness.id, {
      description: editDesc,
      address: editAddress,
      hours: editHours,
      phone: editPhone,
      whatsapp: editWhatsapp,
      email: editEmail,
      instagram: editInstagram,
      website: editWebsite,
      imageUrl: editImageUrl,
    }); } catch (error) { setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar as alterações.'); return; }

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
              Cadastre as informações do seu estabelecimento para que visitantes possam consultá-las após a revisão e publicação do perfil.
            </p>

            {/* Price Badge */}
            <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-stone-300">Anúncio Comercial:</span>
                <div className="text-2xl font-black text-amber-300">
                  R$ 49,90
                  <span className="text-xs font-normal text-white"> /mês</span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-300 font-semibold">
                Preço oficial • cobrança ainda indisponível
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
                <span><strong>Presença no mapa:</strong> O marcador só aparece após a equipe revisar e publicar as coordenadas informadas.</span>
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
                <span><strong>Painel do Comerciante:</strong> Atualize descrição, endereço, imagem, horários e contatos do cadastro.</span>
              </div>
            </div>

            <button
              onClick={() => setViewState('register')}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>QUERO CADASTRAR MEU NEGÓCIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {flowError && <p role="alert" className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-800">{flowError}</p>}
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
          {flowError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">{flowError}</p>}
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
                maxLength={120}
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
                maxLength={120}
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
                  maxLength={254}
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
                  maxLength={40}
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(DD) 00000-0000"
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
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(DD) 0000-0000"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
              />
            </div>

          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-sm shadow-md active:scale-95 transition"
            >
              Prosseguir (R$ 49,90/mês)
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

      {/* Payment remains unavailable until a real provider is configured. */}
      {viewState === 'payment' && (
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold text-[#0d3822] uppercase tracking-wider">
              Assinatura pendente de ativação
            </span>
            <h3 className="text-xl font-bold font-serif-header text-stone-900">
              Pagamento da Assinatura Mensal
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Valor oficial: <strong>R$ 49,90/mês</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-950">
            Pagamentos ainda não estão habilitados: falta configurar um provedor de cobrança e confirmação segura no servidor. Nenhum PIX foi gerado ou cobrado.
          </div>
        </div>
      )}

      {/* 4. Merchant Dashboard (MEU NEGÓCIO) */}
      {viewState === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in">
          {!merchantBusiness && !currentUser?.merchantBusinessId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
              <p>Não encontramos um cadastro de negócio carregado para esta conta. Confirme se entrou com a Conta Google usada no cadastro.</p>
              <button type="button" onClick={() => setViewState('register')} className="mt-3 font-bold underline">Iniciar cadastro do negócio</button>
            </div>
          )}
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
                    ⚠️ PAGAMENTO NÃO CONFIGURADO
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
                <strong>Cadastro enviado.</strong> Seu negócio aguarda conferência dos dados pela equipe.
              </div>
            )}

            {merchantBusiness?.status === 'PENDING_PAYMENT' && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between">
                <span>O cadastro aguarda uma integração de cobrança. Nenhum pagamento foi solicitado ou confirmado.</span>
                <button
                  onClick={() => setViewState('payment')}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                >
                  Ver situação
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

            <div className="pt-3 border-t border-stone-100 text-xs text-stone-600">
              Preço comercial definido: <strong>R$ 49,90 por mês</strong>. A plataforma ainda não processa cobranças nem registra vendas, comissões ou receita.
            </div>
          </div>

          {/* Edit Business Form */}
          {merchantBusiness && (
            <form onSubmit={handleSaveDashboard} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Editar Informações Comerciais
              </h4>

              <div className="space-y-3">
                {saveError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">{saveError}</p>}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Foto Principal (URL da Imagem):
                  </label>
                  <input
                    type="url"
                    maxLength={2048}
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
                    maxLength={4000}
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
                    maxLength={300}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>
                <p className="text-[10px] text-stone-500">A posição do estabelecimento é publicada no mapa depois que a equipe confere as coordenadas e sua fonte.</p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      WhatsApp:
                    </label>
                    <input
                      type="text"
                      maxLength={40}
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
                      maxLength={80}
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Telefone comercial:</label>
                  <input
                    type="tel"
                    maxLength={40}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">E-mail comercial:</label>
                  <input
                    type="email"
                    maxLength={254}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Horário de Funcionamento:
                  </label>
                  <input
                    type="text"
                    maxLength={300}
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
