import React from 'react';
import { 
  X, 
  Navigation, 
  Info, 
  MapPin, 
  Star, 
  Volume2, 
  Play, 
  Square, 
  Heart,
  Compass
} from 'lucide-react';
import { Place } from '../types';
import { calculateDistance, formatDistance } from '../services/store';

interface LocalDetailsCardProps {
  place: Place;
  userLocation: { lat: number; lng: number } | null;
  isFavorite: boolean;
  onToggleFavorite: (placeId: string) => void;
  onOpenDetails: (place: Place) => void;
  onClose: () => void;
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
}

export const LocalDetailsCard: React.FC<LocalDetailsCardProps> = ({
  place,
  userLocation,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onClose,
  isPlayingAudio,
  onToggleAudio,
}) => {
  const hasCoordinates = typeof place.latitude === 'number' && typeof place.longitude === 'number' && !isNaN(place.latitude) && !isNaN(place.longitude);

  const distanceMeters = userLocation && hasCoordinates
    ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
    : null;

  const handleComoChegar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasCoordinates) return;
    const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}${origin}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenFullDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDetails(place);
  };

  return (
    <aside 
      aria-label={`Informações sobre ${place.name}`}
      className="bg-white/98 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl border border-stone-200/90 text-stone-900 transition-all animate-in slide-in-from-bottom-6 max-w-lg mx-auto pointer-events-auto relative focus:outline-none"
    >
      {/* Top Handle / Close Button */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto sm:hidden" />
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0d3822]">
          <Compass className="w-3.5 h-3.5" />
          <span>Local Selecionado</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar cartão de informações"
          title="Fechar cartão (Esc)"
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer active:scale-95 ml-auto"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3.5 items-start">
        {/* Thumbnail Image with Badges */}
        <div className="relative w-full sm:w-32 h-36 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-100 shadow-inner">
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {place.verified ? (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600/95 text-white shadow-xs">
              ✓ Verificado
            </span>
          ) : (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/95 text-white shadow-xs">
              ⏳ Em Verificação
            </span>
          )}

          {place.patrimonyYear && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 shadow-xs">
              Ano {place.patrimonyYear}
            </span>
          )}
        </div>

        {/* Details Column */}
        <div className="flex-1 min-w-0 w-full space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                {place.categoryLabel || place.category}
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-serif-header text-stone-900 leading-tight mt-1">
                {place.name}
              </h3>
            </div>

            {/* Favorite button */}
            <button
              onClick={() => onToggleFavorite(place.id)}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              title={isFavorite ? 'Salvo nos favoritos' : 'Adicionar aos favoritos'}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-red-500 transition active:scale-90 cursor-pointer flex-shrink-0"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-stone-400'
                }`}
              />
            </button>
          </div>

          {/* Rating & Distance */}
          <div className="flex items-center gap-3 text-xs text-stone-600 flex-wrap">
            {typeof place.rating === 'number' && place.rating > 0 && (
              <div className="flex items-center gap-1 font-bold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{place.rating.toFixed(1)}</span>
                {place.reviewCount > 0 && (
                  <span className="text-stone-400 font-normal">({place.reviewCount})</span>
                )}
              </div>
            )}

            {distanceMeters !== null && (
              <div className="flex items-center gap-1 font-semibold text-[#0d3822]">
                <Navigation className="w-3 h-3 text-[#0d3822]" />
                <span>{formatDistance(distanceMeters)} de você</span>
              </div>
            )}

            {place.priceRange && (
              <span className="text-stone-500 font-bold">
                {place.priceRange}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {place.shortDescription || place.description}
          </p>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <span className="truncate">{place.address}</span>
          </div>

          {/* Coordinates display */}
          {hasCoordinates ? (
            <div className="text-[10px] text-stone-400 font-mono">
              Coord: {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
            </div>
          ) : (
            <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block font-semibold">
              Coordenadas pendentes de homologação presencial
            </div>
          )}
        </div>
      </div>

      {/* Audio Narration Bar if available */}
      <div className="mt-3 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-amber-950 truncate">
              {place.audioNarrationTitle || 'Narrativa Histórica com Seresta'}
            </div>
            <div className="text-[10px] text-amber-700 truncate">
              Sonoridade com violão e cavaquinho de Conservatória
            </div>
          </div>
        </div>

        <button
          onClick={onToggleAudio}
          aria-label={isPlayingAudio ? 'Pausar áudio histórico' : 'Reproduzir áudio histórico'}
          title={isPlayingAudio ? 'Pausar áudio' : 'Ouvir narrativa da seresta'}
          className="px-3 py-1.5 rounded-xl bg-[#b48324] hover:bg-[#9a6f1d] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition flex-shrink-0 cursor-pointer"
        >
          {isPlayingAudio ? (
            <>
              <Square className="w-3 h-3 fill-white" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-white" />
              <span>Ouvir</span>
            </>
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-3">
        <button
          onClick={handleComoChegar}
          disabled={!hasCoordinates}
          aria-label="Abrir rota no Google Maps"
          title="Abrir trajeto no Google Maps"
          className="py-3 px-3 rounded-2xl bg-[#0d3822] hover:bg-[#144f31] disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
        >
          <Navigation className="w-4 h-4" />
          <span>COMO CHEGAR</span>
        </button>

        <button
          onClick={handleOpenFullDetails}
          aria-label="Ver detalhes completos do local"
          title="Ver fotos, horários e histórico completo"
          className="py-3 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
        >
          <Info className="w-4 h-4 text-[#0d3822]" />
          <span>VER DETALHES</span>
        </button>
      </div>
    </aside>
  );
};
