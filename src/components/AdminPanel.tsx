import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Store, 
  MapPin, 
  DollarSign, 
  Star, 
  AlertTriangle, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Eye, 
  Layers, 
  Route as RouteIcon,
  LogOut,
  Sliders,
  BellRing
} from 'lucide-react';
import { useApp } from '../services/store';
import { Place, BusinessStatus, TouristRoute } from '../types';

interface AdminPanelProps {
  onBackToApp: () => void;
  onOpenDetails: (place: Place) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToApp, onOpenDetails }) => {
  const {
    currentUser,
    login,
    loginWithGoogle,
    logout,
    places,
    addPlace,
    updatePlace,
    deletePlace,
    updateBusinessStatus,
    routes,
    addRoute,
    deleteRoute,
    reviews,
    deleteReview,
    reports,
    resolveReport,
    payments,
    settings,
    updateSettings,
    guides,
    updateGuide,
    updateGuideStatus,
    deleteGuide,
  } = useApp();

  // Login form state if not authenticated as SUPER_ADMIN
  const [adminEmail, setAdminEmail] = useState('horizonteverdepousada@gmail.com');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'pontos' | 'pousadas' | 'restaurantes' | 'negocios' | 'guias' | 'roteiros' | 'pagamentos' | 'avaliacoes' | 'denuncias' | 'configuracoes'
  >('dashboard');

  // Place form modal state
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Place['category']>('historico');
  const [formType, setFormType] = useState<Place['type']>('tourist');
  const [formDescription, setFormDescription] = useState('');
  const [formAddress, setFormAddress] = useState('Conservatória - RJ');
  const [formHours, setFormHours] = useState('Segunda a Domingo: 09h às 18h');
  const [formLat, setFormLat] = useState(-22.31644);
  const [formLng, setFormLng] = useState(-43.81552);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formVerified, setFormVerified] = useState(true);
  const [formStatus, setFormStatus] = useState<Place['status']>('ACTIVE');

  // Settings form state
  const [appName, setAppName] = useState(settings.appName);
  const [commercialPrice, setCommercialPrice] = useState(settings.commercialPrice);
  const [bannerHeadline, setBannerHeadline] = useState(settings.bannerHeadline);
  const [bannerSubtext, setBannerSubtext] = useState(settings.bannerSubtext);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' && (
    currentUser?.email.toLowerCase() === 'horizonteverdepousada@gmail.com' ||
    currentUser?.email.toLowerCase() === 'antoniou.lt@gmail.com'
  );

  const handleAdminGoogleLogin = async () => {
    setLoginError('');
    const res = await loginWithGoogle('SUPER_ADMIN');
    if (!res.success) {
      setLoginError(res.error || 'Falha ao autenticar com o Google.');
    } else {
      const email = res.user?.email.toLowerCase();
      if (email !== 'horizonteverdepousada@gmail.com' && email !== 'antoniou.lt@gmail.com') {
        setLoginError('A conta Google conectada não possui privilégios de Administrador Geral.');
      }
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = adminEmail.trim().toLowerCase();
    if (email !== 'horizonteverdepousada@gmail.com' && email !== 'antoniou.lt@gmail.com') {
      setLoginError('Apenas o e-mail oficial do SUPER_ADMIN possui permissão de acesso.');
      return;
    }
    if (adminPass !== '81216610Lm.' && adminPass !== '123456') {
      setLoginError('Senha incorreta do Super Administrador.');
      return;
    }
    const res = await login(adminEmail, adminPass);
    if (!res.success) {
      setLoginError(res.error || 'Credenciais inválidas.');
    } else {
      setLoginError('');
    }
  };

  // If not logged in as SUPER_ADMIN, show protected login gate
  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 pt-8 pb-24 space-y-4">
        <div className="p-6 rounded-3xl bg-stone-900 text-white shadow-2xl border border-stone-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Acesso Restrito • Painel de Controle
            </div>
            <h2 className="text-xl font-bold font-serif-header text-white">
              Login do Administrador
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              O painel administrativo é protegido e requer permissão SUPER_ADMIN.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3 pt-2">
            {/* Google Sign-in for Super Admin */}
            <button
              type="button"
              onClick={handleAdminGoogleLogin}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition active:scale-95"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Entrar com a Conta Google Oficial</span>
            </button>

            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-stone-800 w-full" />
              <span className="bg-stone-900 px-2 text-[10px] uppercase font-bold text-stone-500 absolute">
                ou com e-mail e senha
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                E-mail do Administrador Principal
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="horizonteverdepousada@gmail.com"
                className="w-full text-xs p-3 rounded-xl bg-stone-800 border border-stone-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Digite sua senha..."
                className="w-full text-xs p-3 rounded-xl bg-stone-800 border border-stone-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs tracking-wide shadow-md transition active:scale-95"
            >
              ENTRAR COMO SUPER_ADMIN
            </button>

            <button
              type="button"
              onClick={onBackToApp}
              className="w-full py-2 text-stone-400 hover:text-stone-200 text-xs font-medium"
            >
              Voltar ao Aplicativo Turístico
            </button>
          </form>
        </div>
      </div>
    );
  }

  // KPIs calculation
  const totalBusinesses = places.filter((p) => p.type === 'business' || p.merchantId);
  const activeBusinesses = totalBusinesses.filter((p) => p.status === 'ACTIVE');
  const pendingApprovalBusinesses = totalBusinesses.filter((p) => p.status === 'PENDING_APPROVAL');
  const pendingPaymentBusinesses = totalBusinesses.filter((p) => p.status === 'PENDING_PAYMENT');
  const expiredBusinesses = totalBusinesses.filter((p) => p.status === 'EXPIRED');

  const touristSpotsCount = places.filter((p) => p.type === 'tourist').length;
  const innsCount = places.filter((p) => p.category === 'pousadas').length;
  const restaurantsCount = places.filter((p) => p.category === 'gastronomia').length;

  const totalRevenue = payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingReportsCount = reports.filter((r) => !r.resolved).length;

  // Handle open create/edit place form
  const handleOpenPlaceForm = (place?: Place) => {
    if (place) {
      setEditingPlaceId(place.id);
      setFormName(place.name);
      setFormCategory(place.category);
      setFormType(place.type);
      setFormDescription(place.description);
      setFormAddress(place.address);
      setFormHours(place.hours);
      setFormLat(place.latitude);
      setFormLng(place.longitude);
      setFormImageUrl(place.imageUrl);
      setFormPhone(place.phone || '');
      setFormWhatsapp(place.whatsapp || '');
      setFormFeatured(place.featured);
      setFormVerified(place.verified ?? true);
      setFormStatus(place.status || 'ACTIVE');
    } else {
      setEditingPlaceId(null);
      setFormName('');
      setFormCategory('historico');
      setFormType('tourist');
      setFormDescription('');
      setFormAddress('Conservatória - RJ');
      setFormHours('Segunda a Domingo: 09h às 18h');
      setFormLat(-22.31644);
      setFormLng(-43.81552);
      setFormImageUrl('https://images.unsplash.com/photo-1549421263-5ec394a5ad4c?auto=format&fit=crop&w=900&q=80');
      setFormPhone('');
      setFormWhatsapp('');
      setFormFeatured(false);
      setFormVerified(true);
      setFormStatus('ACTIVE');
    }
    setShowPlaceForm(true);
  };

  const handleSavePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPlaceId) {
      updatePlace(editingPlaceId, {
        name: formName,
        category: formCategory,
        type: formType,
        description: formDescription,
        address: formAddress,
        hours: formHours,
        latitude: parseFloat(formLat as any),
        longitude: parseFloat(formLng as any),
        imageUrl: formImageUrl,
        phone: formPhone,
        whatsapp: formWhatsapp,
        featured: formFeatured,
        verified: formVerified,
        status: formStatus,
      });
    } else {
      addPlace({
        name: formName,
        category: formCategory,
        categoryLabel: formCategory.toUpperCase(),
        type: formType,
        description: formDescription,
        shortDescription: formDescription.slice(0, 100),
        address: formAddress,
        hours: formHours,
        latitude: parseFloat(formLat as any),
        longitude: parseFloat(formLng as any),
        imageUrl: formImageUrl,
        gallery: [formImageUrl],
        phone: formPhone,
        whatsapp: formWhatsapp,
        featured: formFeatured,
        verified: formVerified,
        rating: 5.0,
        reviewCount: 0,
        status: formStatus,
      });
    }

    setShowPlaceForm(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      appName,
      commercialPrice: parseFloat(commercialPrice as any),
      bannerHeadline,
      bannerSubtext,
    });
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 2500);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* Admin Top Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
            ADM
          </div>
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              SUPER_ADMIN CONECTADO
            </div>
            <div className="text-xs font-bold truncate max-w-[180px]">
              {currentUser?.email}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sair do painel"
          className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center gap-1 text-xs"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Sair</span>
        </button>
      </div>

      {/* Admin Submenu Navigation */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'pontos', label: `Turismo (${touristSpotsCount})` },
          { id: 'pousadas', label: `Pousadas (${innsCount})` },
          { id: 'restaurantes', label: `Restaurantes (${restaurantsCount})` },
          { id: 'negocios', label: `Comércio (${totalBusinesses.length})` },
          { id: 'guias', label: `Guias (${guides.length})` },
          { id: 'denuncias', label: `Denúncias (${pendingReportsCount})` },
          { id: 'pagamentos', label: 'Pagamentos' },
          { id: 'configuracoes', label: 'Configurações' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
              activeTab === tab.id
                ? 'bg-[#0d3822] text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Dashboard View with KPIs */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Revenue & Overview KPIs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase">Receita Confirmada</span>
              <div className="text-xl font-black text-emerald-800 mt-0.5">
                R$ {totalRevenue.toFixed(2)}
              </div>
              <span className="text-[10px] text-stone-400">Total arrecadado</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase">Negócios Ativos</span>
              <div className="text-xl font-black text-[#0d3822] mt-0.5">
                {activeBusinesses.length}
              </div>
              <span className="text-[10px] text-stone-400">Exibidos no mapa</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Aguardando Aprovação</span>
              <div className="text-xl font-black text-amber-600 mt-0.5">
                {pendingApprovalBusinesses.length}
              </div>
              <span className="text-[10px] text-stone-400">Pagamento confirmado</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-red-600 uppercase">Denúncias Pendentes</span>
              <div className="text-xl font-black text-red-600 mt-0.5">
                {pendingReportsCount}
              </div>
              <span className="text-[10px] text-stone-400">Revisar endereços/erros</span>
            </div>
          </div>

          {/* Pending Approval Businesses Alert */}
          {pendingApprovalBusinesses.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>Existem estabelecimentos pagos aguardando aprovação:</span>
              </div>
              <div className="space-y-1.5">
                {pendingApprovalBusinesses.map((b) => (
                  <div key={b.id} className="p-2 rounded-xl bg-white border border-amber-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-900">{b.name}</div>
                      <div className="text-[10px] text-stone-500">{b.category} • {b.merchantName}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateBusinessStatus(b.id, 'ACTIVE')}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => updateBusinessStatus(b.id, 'BLOCKED')}
                        className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2.5">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Ações Administrativas Rápidas
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenPlaceForm()}
                className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-xs font-bold text-stone-800 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 text-[#0d3822]" />
                <span>+ Novo Ponto Turístico</span>
              </button>

              <button
                onClick={() => setActiveTab('configuracoes')}
                className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-xs font-bold text-stone-800 flex items-center gap-2 transition"
              >
                <Sliders className="w-4 h-4 text-[#0d3822]" />
                <span>Ajustar Preço & Banners</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Management for Places (Pontos Turísticos, Pousadas, Restaurantes, Negócios) */}
      {(activeTab === 'pontos' || activeTab === 'pousadas' || activeTab === 'restaurantes' || activeTab === 'negocios') && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Gerenciar Conteúdo
            </h3>
            <button
              onClick={() => handleOpenPlaceForm()}
              className="px-3 py-1.5 rounded-xl bg-[#0d3822] text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Local</span>
            </button>
          </div>

          <div className="space-y-2">
            {places
              .filter((p) => {
                if (activeTab === 'pontos') return p.type === 'tourist';
                if (activeTab === 'pousadas') return p.category === 'pousadas';
                if (activeTab === 'restaurantes') return p.category === 'gastronomia';
                if (activeTab === 'negocios') return p.type === 'business' || p.merchantId;
                return true;
              })
              .map((place) => (
                <div
                  key={place.id}
                  className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={place.imageUrl} alt={place.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">{place.name}</div>
                      <div className="text-[10px] text-stone-500 truncate">{place.address}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          place.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {place.status}
                        </span>
                        {place.featured && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-stone-950">
                            ★ DESTAQUE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenPlaceForm(place)}
                      title="Editar"
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir "${place.name}"?`)) {
                          deletePlace(place.id);
                        }
                      }}
                      title="Excluir"
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Guias de Turismo View (R$ 49,90/mês) */}
      {activeTab === 'guias' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Guias de Turismo Cadastrados ({guides.length})
              </h3>
              <p className="text-xs text-stone-500">
                Assinatura mensal: R$ 49,90/mês • Credenciamento CADASTUR
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={guide.photoUrl}
                      alt={guide.name}
                      className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900">{guide.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          guide.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : guide.status === 'PENDING_APPROVAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {guide.status === 'ACTIVE'
                            ? 'Ativo'
                            : guide.status === 'PENDING_APPROVAL'
                            ? 'Aguardando Aprovação'
                            : 'Aguardando Pagamento'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        CADASTUR: {guide.cadastur} • {guide.specialtyLabel}
                      </div>
                      <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                        Mensalidade: R$ {guide.monthlySubscriptionPrice || 49.9},00/mês • WhatsApp: {guide.whatsapp}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {guide.status !== 'ACTIVE' ? (
                      <button
                        onClick={() => updateGuideStatus(guide.id, 'ACTIVE')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                        title="Ativar e Aprovar Guia"
                      >
                        Aprovar
                      </button>
                    ) : (
                      <button
                        onClick={() => updateGuideStatus(guide.id, 'BLOCKED')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                        title="Suspender Guia"
                      >
                        Suspender
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o perfil do guia "${guide.name}"?`)) {
                          deleteGuide(guide.id);
                        }
                      }}
                      title="Excluir Guia"
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Denúncias & Erros View */}
      {activeTab === 'denuncias' && (
        <div className="space-y-3 animate-in fade-in">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Denúncias Recebidas ({reports.length})
          </h3>

          {reports.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-xs text-stone-500">
              Nenhuma denúncia pendente. Todos os locais estão verificados.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">{rep.placeName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      {rep.reasonLabel}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-100">
                    "{rep.details}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                    <span>Contato: {rep.userContact || 'Não informado'}</span>
                    {!rep.resolved && (
                      <button
                        onClick={() => resolveReport(rep.id)}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                      >
                        Marcar Resolvido
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Pagamentos View */}
      {activeTab === 'pagamentos' && (
        <div className="space-y-3 animate-in fade-in">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Transações Financeiras ({payments.length})
          </h3>

          {payments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-xs text-stone-500">
              Nenhuma transação registrada até o momento.
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="p-3 rounded-2xl bg-white border border-stone-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-900">{p.businessName}</div>
                    <div className="text-[10px] text-stone-500">{p.method} • {new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-stone-900">R$ {p.amount.toFixed(2)}</div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      p.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Configurações View */}
      {activeTab === 'configuracoes' && (
        <form onSubmit={handleSaveSettings} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Configurações Globais do App
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome do Aplicativo:
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Valor do Anúncio Comercial Mensal (R$/mês):
              </label>
              <input
                type="number"
                step="0.01"
                value={commercialPrice}
                onChange={(e) => setCommercialPrice(parseFloat(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Título do Banner Principal:
              </label>
              <input
                type="text"
                value={bannerHeadline}
                onChange={(e) => setBannerHeadline(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Subtítulo do Banner Principal:
              </label>
              <textarea
                rows={2}
                value={bannerSubtext}
                onChange={(e) => setBannerSubtext(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
              />
            </div>
          </div>

          {savedSettingsSuccess ? (
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
              Configurações salvas com sucesso!
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0d3822] text-white font-bold text-xs hover:bg-[#124b2e] transition"
            >
              Salvar Configurações
            </button>
          )}
        </form>
      )}

      {/* Place Form Modal (Create / Edit) */}
      {showPlaceForm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleSavePlace} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-base font-bold text-stone-900">
                {editingPlaceId ? 'Editar Local' : 'Novo Ponto Turístico'}
              </h4>
              <button
                type="button"
                onClick={() => setShowPlaceForm(false)}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-stone-700">Nome:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700">Categoria:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                  >
                    <option value="historico">Histórico</option>
                    <option value="museus">Museus</option>
                    <option value="pousadas">Pousadas</option>
                    <option value="gastronomia">Gastronomia</option>
                    <option value="cachoeiras">Cachoeiras</option>
                    <option value="eventos">Eventos</option>
                    <option value="comercio">Comércio</option>
                    <option value="servicos">Serviços</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700">Tipo:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                  >
                    <option value="tourist">Turístico</option>
                    <option value="inn">Pousada</option>
                    <option value="restaurant">Restaurante</option>
                    <option value="business">Negócio</option>
                    <option value="service">Serviço</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Foto URL:</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700">Descrição:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700">Latitude:</label>
                  <input
                    type="number"
                    step="any"
                    value={formLat}
                    onChange={(e) => setFormLat(parseFloat(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">Longitude:</label>
                  <input
                    type="number"
                    step="any"
                    value={formLng}
                    onChange={(e) => setFormLng(parseFloat(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Endereço:</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-300 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700">Status de Publicação:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as Place['status'])}
                  className="w-full p-2 rounded-xl border border-stone-300 mt-1 bg-white"
                >
                  <option value="ACTIVE">● Publicado / Ativo no Guia e Mapa</option>
                  <option value="PENDING_APPROVAL">⏳ Pendente de Homologação</option>
                  <option value="BLOCKED">🚫 Despublicado / Oculto</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chkVerified"
                    checked={formVerified}
                    onChange={(e) => setFormVerified(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <label htmlFor="chkVerified" className="font-bold text-stone-700">
                    Coordenadas & Localização Verificadas Oficialmente
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chkFeatured"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#0d3822] rounded"
                  />
                  <label htmlFor="chkFeatured" className="font-bold text-stone-700">
                    Marcar como Destaque na Página Inicial
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#0d3822] text-white font-bold text-xs hover:bg-[#124b2e]"
              >
                Salvar Local
              </button>
              <button
                type="button"
                onClick={() => setShowPlaceForm(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
