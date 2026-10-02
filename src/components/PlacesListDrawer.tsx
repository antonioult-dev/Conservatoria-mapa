import React from 'react';
import { X, MapPin, Navigation, Star, Search, Compass, AlertCircle } from 'lucide-react';
import { Place } from '../types';
import { calculateDistance, formatDistance } from '../services/store';

interface PlacesListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  selectedPlaceId?: string;
  onSelectPlace: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
  activeCategoryLabel?: string;
}

export const PlacesListDrawer: React.FC<PlacesListDrawerProps> = ({
  isOpen,
  onClose,
  places,
  selectedPlaceId,
  onSelectPlace,
  userLocation,
  activeCategoryLabel,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1200] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0d3822] text-white p-4 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif-header leading-tight">
                Locais em Conservatória
              </h3>
              <p className="text-[11px] text-emerald-200">
                {activeCategoryLabel ? `Categoria: ${activeCategoryLabel}` : 'Todos os estabelecimentos'} ({places.length} locais)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar lista de locais"
            title="Fechar painel"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Places List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-stone-100">
          {places.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-800 text-sm">Nenhum local encontrado</h4>
              <p className="text-xs text-stone-500">
                Não encontramos estabelecimentos ou atrativos nesta categoria no momento.
              </p>
            </div>
          ) : (
            places.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              const hasCoordinates = typeof place.latitude === 'number' && typeof place.longitude === 'number' && !isNaN(place.latitude) && !isNaN(place.longitude);
              const distanceMeters = userLocation && hasCoordinates
                ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                : null;

              return (
                <div
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectPlace(place);
                    }
                  }}
                  className={`pt-2.5 first:pt-0 flex gap-3 items-start p-2 rounded-2xl cursor-pointer transition-all hover:bg-stone-50 ${
                    isSelected ? 'ring-2 ring-[#0d3822] bg-emerald-50/60' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 shadow-inner relative">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {place.verified && (
                      <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white" title="Verificado" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {place.categoryLabel || place.category}
                      </span>
                      {place.patrimonyYear && (
                        <span className="text-[10px] font-black text-amber-800">
                          {place.patrimonyYear}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {place.name}
                    </h4>

                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {place.shortDescription || place.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                      <div className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{place.address}</span>
                      </div>

                      {distanceMeters !== null ? (
                        <span className="font-bold text-[#0d3822] flex-shrink-0 flex items-center gap-0.5">
                          <Navigation className="w-2.5 h-2.5" />
                          {formatDistance(distanceMeters)}
                        </span>
                      ) : !hasCoordinates ? (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Sem GPS
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500 flex-shrink-0">
          Toque em qualquer local para localizá-lo e ver a rota no mapa.
        </div>
      </div>
    </div>
  );
};
