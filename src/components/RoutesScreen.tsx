import React, { useState } from 'react';
import { Route as RouteIcon, Clock, Navigation, CheckCircle, ChevronRight, MapPin, Sparkles, Compass, Users } from 'lucide-react';
import { useApp } from '../services/store';
import { TouristRoute, Place } from '../types';

interface RoutesScreenProps {
  onStartRoute: (route: TouristRoute, initialPlace?: Place) => void;
  onOpenDetails: (place: Place) => void;
  onNavigateToGuides?: () => void;
}

export const RoutesScreen: React.FC<RoutesScreenProps> = ({
  onStartRoute,
  onOpenDetails,
  onNavigateToGuides,
}) => {
  const { routes, places, setActiveRoute, userLocation } = useApp();
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  // Resolve places for the active route
  const routePlaces: Place[] = activeRoute
    ? activeRoute.places
        .map((pId) => places.find((p) => p.id === pId))
        .filter((p): p is Place => !!p)
    : [];

  const handleComoChegarStop = (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    if (!place.latitude || !place.longitude) {
      setToastMsg('Localização geográfica deste ponto não cadastrada.');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }
    const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}${origin}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* Header title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0d3822]">
          <Compass className="w-4 h-4 text-[#0d3822]" />
          <span>Experiências Curadas</span>
        </div>
        <h2 className="text-2xl font-bold font-serif-header text-stone-900">
          Roteiros Turísticos
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Descubra Conservatória com itinerários prontos para caminhar, ouvir serestas e explorar cachoeiras.
        </p>

        {toastMsg && (
          <div className="mt-2 p-2.5 rounded-xl bg-stone-900 text-white text-xs text-center animate-in fade-in">
            {toastMsg}
          </div>
        )}
      </div>

      {/* Routes Horizontal Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {routes.map((route) => {
          const isSelected = route.id === activeRoute?.id;
          return (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                isSelected
                  ? 'bg-[#0d3822] text-white shadow-md'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              {route.title}
            </button>
          );
        })}
      </div>

      {/* Active Route Hero Card */}
      {activeRoute && (
        <div className="rounded-3xl bg-white border border-stone-200 shadow-sm overflow-hidden space-y-4">
          <div className="relative h-44 w-full bg-stone-100">
            <img
              src={activeRoute.imageUrl}
              alt={activeRoute.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 mb-1.5 inline-block">
                {activeRoute.badge}
              </span>
              <h3 className="text-xl font-bold font-serif-header leading-snug">
                {activeRoute.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-stone-200 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  {activeRoute.durationEstimate}
                </span>
                <span>•</span>
                <span>{activeRoute.timing}</span>
              </div>
            </div>
          </div>

          <div className="p-4 pt-0 space-y-4">
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {activeRoute.description}
            </p>

            {/* Primary Action: COMEÇAR ROTEIRO */}
            <button
              onClick={() => {
                setActiveRoute(activeRoute);
                onStartRoute(activeRoute, routePlaces[0]);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0d3822] hover:bg-[#124b2e] active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-[#0d3822]/20 flex items-center justify-center gap-2 transition"
            >
              <Navigation className="w-4 h-4" />
              <span>COMEÇAR ROTEIRO</span>
            </button>

            {/* Stops list */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Paradas Deste Roteiro ({routePlaces.length})
              </div>

              <div className="space-y-2.5">
                {routePlaces.map((place, idx) => (
                  <div
                    key={place.id}
                    onClick={() => onOpenDetails(place)}
                    className="p-3 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 flex items-center justify-between cursor-pointer transition active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#0d3822] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-stone-900 truncate">
                          {place.name}
                        </h5>
                        <p className="text-[11px] text-stone-500 truncate">
                          {place.address ? place.address.split(',')[0] : 'Informação não cadastrada.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button
                        onClick={(e) => handleComoChegarStop(e, place)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-[#0d3822] text-[11px] font-bold border border-stone-200 shadow-2xs transition active:scale-95 flex items-center gap-1"
                        title="Como chegar neste local"
                      >
                        <Navigation className="w-3 h-3 text-[#0d3822]" />
                        <span className="hidden sm:inline">Como Chegar</span>
                      </button>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Hire a Guide for this Route CTA */}
              {onNavigateToGuides && (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0d3822] text-amber-300 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-[#0d3822]">Visita com Guia Especializado</h6>
                      <p className="text-[11px] text-stone-600">
                        Prefere fazer este roteiro com um guia local credenciado pelo CADASTUR?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToGuides}
                    className="px-3 py-1.5 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition"
                  >
                    Ver Guias
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
