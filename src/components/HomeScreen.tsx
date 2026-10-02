import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Route as RouteIcon, 
  Volume2, 
  Mic, 
  ArrowRight, 
  Landmark, 
  Building2, 
  Hotel, 
  UtensilsCrossed, 
  Trees, 
  Theater, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  Share2,
  Store,
  Play,
  Square
} from 'lucide-react';
import { useApp, calculateDistance, formatDistance, getReviewSummary } from '../services/store';
import { hasVerifiedCoordinates } from '../utils/location';
import { Place, TouristRoute, PlaceCategory } from '../types';
import { toggleSerestaAudio } from '../services/audioService';
import { FAQSection } from './FAQSection';
import { PlaceImage } from './PlaceImage';

interface HomeScreenProps {
  onSelectPlace: (place: Place) => void;
  onNavigateToTab: (tab: 'inicio' | 'mapa' | 'roteiros' | 'guias' | 'favoritos' | 'painel') => void;
  onOpenMerchant: () => void;
  onOpenDetails: (place: Place) => void;
  onSelectRoute: (route: TouristRoute) => void;
  onOpenEmergency: () => void;
  onOpenChat?: (prompt?: string) => void;
  onOpenGmailContact?: () => void;
  onOpenLegal?: (tab?: 'terms' | 'privacy') => void;
  onRequestLogin?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPlace,
  onNavigateToTab,
  onOpenMerchant,
  onOpenDetails,
  onSelectRoute,
  onOpenEmergency,
  onOpenChat,
  onOpenGmailContact,
  onOpenLegal,
  onRequestLogin,
}) => {
  const {
    places,
    routes,
    reviews,
    userLocation,
    gpsActive,
    settings,
    currentUser,
    isFavorite,
    toggleFavorite,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayingSeresta, setIsPlayingSeresta] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Active public places
  const activePlaces = places.filter((p) => p.status === 'ACTIVE');

  // Filter based on search query (name, category, type of place)
  const searchResults = searchQuery.trim()
    ? activePlaces.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Filtered places according to selected category (TODOS, TURISMO, POUSADAS, RESTAURANTES, NEGÓCIOS, SERVIÇOS)
  const categoryFilteredPlaces = activePlaces.filter((p) => {
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'turismo') {
      return p.type === 'tourist' || p.category === 'historico' || p.category === 'museus' || p.category === 'cachoeiras' || p.category === 'eventos';
    }
    if (activeCategoryFilter === 'pousadas') {
      return p.type === 'inn' || p.category === 'pousadas';
    }
    if (activeCategoryFilter === 'restaurantes') {
      return p.type === 'restaurant' || p.category === 'gastronomia';
    }
    if (activeCategoryFilter === 'comercio') {
      return p.type === 'business' || p.category === 'comercio';
    }
    if (activeCategoryFilter === 'servicos') {
      return p.type === 'service' || p.category === 'servicos';
    }
    return p.category === activeCategoryFilter;
  });

  const handleComoChegarHome = (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    if (!hasVerifiedCoordinates(place)) {
      alert('Este local ainda não tem coordenadas verificadas.');
      return;
    }
    const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}${origin}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleSeresta = () => {
    const playing = toggleSerestaAudio((state) => setIsPlayingSeresta(state));
    setIsPlayingSeresta(playing);
  };

  // Categories config
  const categoriesList = [
    { id: 'historico', name: 'Histórico', icon: Landmark, color: 'bg-emerald-100 text-[#0d3822]' },
    { id: 'museus', name: 'Museus', icon: Building2, color: 'bg-blue-100 text-blue-900' },
    { id: 'pousadas', name: 'Pousadas', icon: Hotel, color: 'bg-teal-100 text-teal-900' },
    { id: 'gastronomia', name: 'Gastronomia', icon: UtensilsCrossed, color: 'bg-amber-100 text-amber-900' },
    { id: 'cachoeiras', name: 'Cachoeiras', icon: Trees, color: 'bg-green-100 text-green-900' },
    { id: 'eventos', name: 'Eventos', icon: Theater, color: 'bg-purple-100 text-purple-900' },
  ];

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* 1. Hero Welcome Card matching Image 3 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0d3822] via-[#0b301c] to-[#072214] p-5 text-white shadow-xl">
        {/* Glow & subtle pattern */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#c99732]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GPS {gpsActive ? 'ATIVO' : 'DESATIVADO'}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-amber-200">
            <MapPin className="h-3 w-3" />
            <span>Conservatória • RJ</span>
          </div>
        </div>

        {/* Headline & Subtext */}
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-header text-white leading-tight">
          {settings.bannerHeadline || 'Conheça Conservatória'}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-stone-200 leading-relaxed">
          {settings.bannerSubtext || 'Consulte locais e roteiros cadastrados e publicados no catálogo.'}
        </p>
      </div>

      {/* 2. Search Input matching Image 3 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white shadow-sm border border-stone-200">
          <span className="text-stone-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="O que você deseja conhecer hoje?"
            className="w-full bg-transparent text-sm text-stone-800 placeholder-stone-400 focus:outline-none"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} className="text-stone-400 text-xs">
              ✕
            </button>
          ) : (
            <button
              onClick={() => setSearchQuery('Túnel que Chora')}
              aria-label="Voz"
              className="text-stone-400 hover:text-stone-600"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Tag Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <button
            onClick={() => setActiveCategoryFilter('historico')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-2xs whitespace-nowrap active:scale-95 transition"
          >
            <span>🏛️</span>
            <span>Locais históricos</span>
          </button>
          <button
            onClick={() => setActiveCategoryFilter('eventos')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-2xs whitespace-nowrap active:scale-95 transition"
          >
            <span>🎟️</span>
            <span>Eventos cadastrados</span>
          </button>
          <button
            onClick={() => {
              onNavigateToTab('mapa');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-2xs whitespace-nowrap active:scale-95 transition"
          >
            <span>🗺️</span>
            <span>Locais publicados</span>
          </button>
          <button
            onClick={() => {
              onNavigateToTab('guias');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold shadow-2xs whitespace-nowrap active:scale-95 transition"
          >
            <span>🧭</span>
            <span>Ver guias publicados</span>
          </button>
        </div>

        {/* Guia IA Seresteiro Banner */}
        {onOpenChat && (
          <div className="p-3.5 rounded-3xl bg-gradient-to-r from-[#0d3822] to-[#14472c] text-white shadow-md border border-[#1b5e39] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 flex-shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold font-serif-header">Guia Seresteiro com IA</h3>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Google Maps & Search
                  </span>
                </div>
                <p className="text-[11px] text-stone-200 mt-0.5">
                  Respostas com busca quando disponível; confirme horários e serviços com fontes locais.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onOpenChat('Quais os horários das serestas e da solarata este fim de semana?')}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition active:scale-95 whitespace-nowrap"
              >
                🎵 Serestas
              </button>
              <button
                type="button"
                onClick={() => onOpenChat()}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-bold shadow-xs transition active:scale-95 whitespace-nowrap"
              >
                Conversar
              </button>
            </div>
          </div>
        )}

        {/* Search Results Dropdown when typing */}
        {searchResults.length > 0 && (
          <div className="p-2 rounded-2xl bg-white shadow-xl border border-stone-200 space-y-1">
            <div className="text-[10px] font-bold text-stone-400 uppercase px-2 py-1">
              Resultados ({searchResults.length})
            </div>
            {searchResults.map((res) => (
              <div
                key={res.id}
                onClick={() => {
                  onSelectPlace(res);
                  onOpenDetails(res);
                  setSearchQuery('');
                }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <PlaceImage src={res.imageUrl} alt={res.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <div className="text-xs font-bold text-stone-900">{res.name}</div>
                    <div className="text-[11px] text-stone-500">{res.categoryLabel || res.category}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Explorar Mapa com GPS Banner */}
      <button
        onClick={() => onNavigateToTab('mapa')}
        className="w-full p-4 rounded-3xl bg-[#0d3822] hover:bg-[#11442a] active:scale-[0.99] text-white flex items-center justify-between shadow-lg shadow-[#0d3822]/20 transition text-left"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-white">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Explorar Mapa com GPS</h3>
            <p className="text-xs text-stone-300">{activePlaces.length} locais publicados</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>

      {/* 4. Side-by-Side Cards: Como Chegar & Roteiros Prontos */}
      <div className="grid grid-cols-2 gap-3">
        {/* Como Chegar */}
        <button
          onClick={() => {
            const center = activePlaces[0];
            if (center) {
              onSelectPlace(center);
              onNavigateToTab('mapa');
            }
          }}
          className="p-4 rounded-3xl bg-white hover:bg-stone-50 active:scale-95 border border-stone-200 shadow-sm text-left transition flex flex-col justify-between h-28"
        >
          <div className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-[#0d3822]">
            <Navigation className="w-4 h-4 text-[#0d3822]" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900">Como Chegar</div>
            <div className="text-[11px] text-stone-500 leading-tight">Consultar locais publicados</div>
          </div>
        </button>

        {/* Roteiros Prontos */}
        <button
          onClick={() => onNavigateToTab('roteiros')}
          className="p-4 rounded-3xl bg-white hover:bg-stone-50 active:scale-95 border border-stone-200 shadow-sm text-left transition flex flex-col justify-between h-28"
        >
          <div className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-[#0d3822]">
            <RouteIcon className="w-4 h-4 text-[#0d3822]" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900">Roteiros Prontos</div>
            <div className="text-[11px] text-stone-500 leading-tight">Roteiros cadastrados</div>
          </div>
        </button>
      </div>

      {/* 5. Instrumental audio sample */}
      <div className="p-4 rounded-3xl bg-[#986815] text-white shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎵</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">Ouvir amostra instrumental</span>
            </div>
            <div className="text-[11px] text-amber-100 mt-0.5 line-clamp-1">
              Demonstração sintetizada; não é gravação de evento local.
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleSeresta}
          aria-label={isPlayingSeresta ? 'Pausar áudio' : 'Ouvir seresta'}
          className="w-9 h-9 rounded-full bg-white text-[#986815] flex items-center justify-center shadow-md active:scale-90 transition flex-shrink-0"
        >
          {isPlayingSeresta ? (
            <Square className="w-4 h-4 fill-[#986815]" />
          ) : (
            <Play className="w-4 h-4 fill-[#986815] ml-0.5" />
          )}
        </button>
      </div>

      {/* 6. Categorias Grid matching Image 3 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-serif-header text-stone-900">Categorias</h3>
          <button
            onClick={() => onNavigateToTab('mapa')}
            className="text-xs font-bold text-[#0d3822] hover:underline"
          >
            Ver mapa
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onNavigateToTab('mapa');
                }}
                className="p-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/80 shadow-2xs flex flex-col items-center justify-center text-center transition active:scale-95"
              >
                <div className={`w-10 h-10 rounded-2xl ${cat.color} flex items-center justify-center mb-1.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-stone-900">{cat.name}</div>
                <div className="text-[10px] text-stone-400">{activePlaces.filter((place) => place.category === cat.id).length} locais</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. "📍 Perto de Você" Horizontal Carousel matching Image 3 with Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-700">📍</span>
            <h3 className="text-lg font-bold font-serif-header text-stone-900">Explorar Locais</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('mapa')}
            className="text-xs font-bold text-[#0d3822] hover:underline"
          >
            Ver no mapa ({categoryFilteredPlaces.length})
          </button>
        </div>

        {/* 6 Category Filters (TODOS, TURISMO, POUSADAS, RESTAURANTES, NEGÓCIOS, SERVIÇOS) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {[
            { id: 'all', label: 'TODOS' },
            { id: 'turismo', label: 'TURISMO' },
            { id: 'pousadas', label: 'POUSADAS' },
            { id: 'restaurantes', label: 'RESTAURANTES' },
            { id: 'comercio', label: 'NEGÓCIOS' },
            { id: 'servicos', label: 'SERVIÇOS' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition active:scale-95 text-xs ${
                activeCategoryFilter === cat.id
                  ? 'bg-[#0d3822] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 snap-x">
          {categoryFilteredPlaces.map((place, idx) => {
            const hasCoordinates = hasVerifiedCoordinates(place);
            const distance = userLocation && hasCoordinates
              ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
              : null;
            const rating = getReviewSummary(reviews, place.id);

            return (
              <div
                key={place.id}
                onClick={() => onOpenDetails(place)}
                className="snap-start flex-shrink-0 w-64 rounded-3xl bg-white border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between cursor-pointer hover:border-[#0d3822]/40 transition"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-32 w-full bg-stone-100 overflow-hidden">
                    <PlaceImage src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />

                    {/* Badge top-left */}
                    <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>🛡️</span>
                      <span>{place.badgeText || place.categoryLabel?.toUpperCase() || 'ATRATIVO'}</span>
                    </div>

                    {/* Favorite Button top-right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) onRequestLogin?.();
                        else void toggleFavorite(place.id);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:text-red-500 active:scale-90 transition"
                      aria-label="Favoritar"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFavorite(place.id) ? 'fill-red-500 text-red-500' : 'text-white'
                        }`}
                      />
                    </button>

                    {/* Bottom distance & rating row */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-bold">
                      <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>🚶</span>
                        <span>{distance !== null ? formatDistance(distance) : hasCoordinates ? 'GPS indisponível' : 'Sem coordenadas'}</span>
                      </div>
                      {rating.rating !== null && <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 text-amber-300">
                        <span>★</span>
                        <span>{rating.rating.toFixed(1)} ({rating.count})</span>
                      </div>}
                    </div>
                  </div>

                  {/* Body text */}
                  <div className="p-3">
                    <h4 className="text-sm font-bold font-serif-header text-stone-900 line-clamp-1">
                      {place.name}
                    </h4>
                    <p className="mt-1 text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {place.shortDescription || place.description}
                    </p>
                  </div>
                </div>

                {/* Footer address and action button */}
                <div className="p-3 pt-0 flex items-center justify-between border-t border-stone-100 mt-1">
                  <span className="text-[10px] text-stone-500 truncate max-w-[140px]">
                    {place.address ? place.address.split(',')[0] : 'Informação não cadastrada.'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleComoChegarHome(e, place)}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#0d3822] text-[10px] font-bold border border-stone-200 transition active:scale-95 flex items-center gap-1"
                      title="Como Chegar"
                    >
                      <Navigation className="w-3 h-3 text-[#0d3822]" />
                      <span>Como Chegar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Descubra Conservatória (Roteiros) matching Image 3 */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-lg font-bold font-serif-header text-stone-900">Descubra Conservatória</h3>
          <p className="text-xs text-stone-500">
            Roteiros curados para vivenciar a verdadeira essência seresteira.
          </p>
        </div>

        <div className="space-y-2">
          {routes.map((route) => (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className="p-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 shadow-2xs flex items-center gap-3 cursor-pointer transition active:scale-[0.99]"
            >
              <img
                src={route.imageUrl}
                alt={route.title}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                  <span>⏱</span>
                  <span>{route.badge}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                  {route.title}
                </h4>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  {route.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* 9. Guia Colaborativo e Inteligente Banner matching Image 3 */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-50 to-stone-100 border border-emerald-200/70 text-center space-y-3 shadow-sm">
        <div className="w-10 h-10 rounded-2xl bg-[#0d3822] text-white flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>

        <div>
          <h4 className="text-base font-bold font-serif-header text-stone-900">
            Guia Colaborativo e Inteligente
          </h4>
          <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
            O catálogo mostra somente registros publicados. Coordenadas e rotas dependem de dados verificados e de serviços configurados.
          </p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-stone-200 pt-2 border-t border-emerald-200/50">
          <div>
            <div className="text-sm font-black text-[#0d3822]">{activePlaces.length}</div>
            <div className="text-[9px] font-bold text-stone-500 uppercase">Locais publicados</div>
          </div>
          <div>
            <div className="text-sm font-black text-[#0d3822]">{activePlaces.filter(hasVerifiedCoordinates).length}</div>
            <div className="text-[9px] font-bold text-stone-500 uppercase">Pontos verificados</div>
          </div>
          <div>
            <div className="text-sm font-black text-[#0d3822]">{gpsActive ? 'Ativo' : 'Desativado'}</div>
            <div className="text-[9px] font-bold text-stone-500 uppercase">GPS do navegador</div>
          </div>
        </div>
      </div>

      {/* 10. ANUNCIE SEU NEGÓCIO Commercial Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0d3822] to-[#144f31] text-white shadow-lg flex items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400 text-stone-950">
            Área Comercial
          </span>
          <h4 className="text-sm font-bold">Coloque seu negócio no mapa!</h4>
          <p className="text-[11px] text-emerald-100">
            Pousadas, restaurantes, lojas e serviços por R$ {(settings.commercialPrice || 49.9).toFixed(2).replace('.', ',')}/mês.
          </p>
        </div>
        <button
          onClick={onOpenMerchant}
          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow active:scale-95 transition flex-shrink-0"
        >
          Anunciar
        </button>
      </div>

      {/* 11. FAQ Component */}
      <FAQSection
        onOpenGmailContact={onOpenGmailContact}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 12. Sobre o Aplicativo & Informações Institucionais */}
      <footer className="pt-4 pb-2 text-center text-stone-500 space-y-2 border-t border-stone-200/80">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-stone-700">
          <span>Conservatória Turismo</span>
          <span>•</span>
          <span>Valença • RJ</span>
        </div>
        <p className="text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
          Guia cultural e turístico de Conservatória. O mapa usa a localização do navegador somente após autorização.
        </p>

        {onOpenLegal && (
          <div className="flex items-center justify-center gap-3 text-xs pt-1">
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="text-stone-600 hover:text-[#0d3822] font-semibold underline transition"
            >
              Termos de Uso
            </button>
            <span className="text-stone-300">|</span>
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="text-stone-600 hover:text-[#0d3822] font-semibold underline transition"
            >
              Política de Privacidade (LGPD)
            </button>
          </div>
        )}

        <div className="text-[10px] text-stone-400 pt-1">
          © {new Date().getFullYear()} Conservatória Turismo • Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};
