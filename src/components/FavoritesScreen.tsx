import React, { useState } from 'react';
import { Heart, Navigation, Trash2, ChevronRight, Compass } from 'lucide-react';
import { useApp, calculateDistance, formatDistance } from '../services/store';
import { Place } from '../types';

interface FavoritesScreenProps {
  onSelectPlace: (place: Place) => void;
  onNavigateToTab: (tab: 'inicio' | 'mapa') => void;
  onOpenDetails: (place: Place) => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onSelectPlace,
  onNavigateToTab,
  onOpenDetails,
}) => {
  const { places, favorites, toggleFavorite, userLocation } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const favoritedPlaces = places.filter((p) => favorites.includes(p.id));

  const filteredPlaces = favoritedPlaces.filter((p) => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0d3822]">
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          <span>Locais Salvos</span>
        </div>
        <h2 className="text-2xl font-bold font-serif-header text-stone-900">
          Meus Favoritos
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Seus pontos turísticos, pousadas e restaurantes favoritos para sua viagem a Conservatória.
        </p>
      </div>

      {/* Filter chips */}
      {favoritedPlaces.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {[
            { id: 'all', label: `Todos (${favoritedPlaces.length})` },
            { id: 'historico', label: 'Histórico' },
            { id: 'pousadas', label: 'Pousadas' },
            { id: 'gastronomia', label: 'Gastronomia' },
            { id: 'museus', label: 'Museus' },
            { id: 'comercio', label: 'Comércio' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition active:scale-95 ${
                filterCategory === cat.id
                  ? 'bg-[#0d3822] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* List or Empty State */}
      {filteredPlaces.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-stone-900">
            Nenhum favorito encontrado
          </h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Navegue pelos pontos turísticos e toque no ícone de coração para salvar seus locais favoritos.
          </p>
          <button
            onClick={() => onNavigateToTab('mapa')}
            className="px-4 py-2.5 rounded-2xl bg-[#0d3822] text-white text-xs font-bold shadow-md hover:bg-[#124b2e] transition"
          >
            Explorar Mapa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlaces.map((place) => {
            const distance = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
              : 450;

            return (
              <div
                key={place.id}
                className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3 transition hover:shadow-md"
              >
                <div
                  onClick={() => onOpenDetails(place)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#0d3822] uppercase tracking-wider">
                      {place.categoryLabel || place.category}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {place.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {formatDistance(distance)} • {place.address.split(',')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      onSelectPlace(place);
                      onNavigateToTab('mapa');
                    }}
                    title="Ver no mapa"
                    className="w-9 h-9 rounded-xl bg-[#0d3822] text-white flex items-center justify-center hover:bg-[#124b2e] transition active:scale-95 shadow-sm"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleFavorite(place.id)}
                    title="Remover dos favoritos"
                    className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center transition active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
