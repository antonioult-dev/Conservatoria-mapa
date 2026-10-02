import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Search, 
  Navigation, 
  Plus, 
  Minus, 
  Crosshair, 
  Layers, 
  Maximize, 
  Minimize, 
  MapPin, 
  Compass, 
  List, 
  RotateCcw, 
  AlertCircle,
  X,
  Sparkles,
  Route as RouteIcon
} from 'lucide-react';
import { useApp, calculateDistance } from '../services/store';
import { Place, TouristRoute } from '../types';
import { toggleSerestaAudio } from '../services/audioService';
import { LocalDetailsCard } from './LocalDetailsCard';
import { PlacesListDrawer } from './PlacesListDrawer';

interface InteractiveMapProps {
  onOpenDetails: (place: Place) => void;
  onOpenSearch?: () => void;
}

// Category filter type
type MapCategoryFilter = 
  | 'todos'
  | 'turismo'
  | 'pousadas'
  | 'restaurantes'
  | 'comercio'
  | 'alimentacao'
  | 'cultura'
  | 'natureza';

interface PlaceCluster {
  id: string;
  lat: number;
  lng: number;
  places: Place[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onOpenDetails,
}) => {
  const {
    places,
    routes,
    selectedPlace,
    setSelectedPlace,
    userLocation,
    setUserLocation,
    gpsActive,
    setGpsActive,
    isFavorite,
    toggleFavorite,
  } = useApp();

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // UI Control references to disable map click propagation
  const headerControlsRef = useRef<HTMLDivElement>(null);
  const floatingControlsRef = useRef<HTMLDivElement>(null);
  const bottomCardWrapperRef = useRef<HTMLDivElement>(null);

  // States
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MapCategoryFilter>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [activeMapType, setActiveMapType] = useState<'padrao' | 'satelite'>('padrao');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPlacesDrawer, setShowPlacesDrawer] = useState<boolean>(false);
  const [activeTouristRoute, setActiveTouristRoute] = useState<TouristRoute | null>(null);
  const [clusterPicker, setClusterPicker] = useState<PlaceCluster | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Active verified or registered places
  const activePlaces = useMemo(() => {
    return places.filter((p) => p.status === 'ACTIVE');
  }, [places]);

  // Places with valid geographical coordinates
  const validPlaces = useMemo(() => {
    return activePlaces.filter((p) => 
      typeof p.latitude === 'number' && 
      typeof p.longitude === 'number' && 
      !isNaN(p.latitude) && 
      !isNaN(p.longitude) &&
      p.latitude !== 0 && 
      p.longitude !== 0
    );
  }, [activePlaces]);

  // Category matching helper
  const filterPlaceByCategory = (place: Place, category: MapCategoryFilter): boolean => {
    if (category === 'todos') return true;
    if (category === 'turismo') {
      return place.type === 'tourist' || ['historico', 'museus', 'cachoeiras', 'eventos'].includes(place.category);
    }
    if (category === 'pousadas') {
      return place.type === 'inn' || place.category === 'pousadas';
    }
    if (category === 'restaurantes') {
      return place.type === 'restaurant' || place.category === 'gastronomia';
    }
    if (category === 'comercio') {
      return place.type === 'business' || place.category === 'comercio';
    }
    if (category === 'alimentacao') {
      return place.category === 'gastronomia' || place.type === 'restaurant';
    }
    if (category === 'cultura') {
      return ['museus', 'eventos', 'historico'].includes(place.category) || place.type === 'tourist';
    }
    if (category === 'natureza') {
      return place.category === 'cachoeiras' || place.description.toLowerCase().includes('cachoeira') || place.description.toLowerCase().includes('serra');
    }
    return true;
  };

  // Filtered places according to category and route
  const filteredPlaces = useMemo(() => {
    let result = validPlaces.filter((p) => filterPlaceByCategory(p, activeCategory));

    // If a tourist route is active, restrict or prioritize route places
    if (activeTouristRoute) {
      result = result.filter((p) => activeTouristRoute.places.includes(p.id));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q))
      );
    }

    return result;
  }, [validPlaces, activeCategory, activeTouristRoute, searchQuery]);

  // Real-time search suggestions dropdown list
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return activePlaces.filter((p) => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [activePlaces, searchQuery]);

  // Clustered places for coincident / overlapping coordinates
  const clusteredPlaces = useMemo<PlaceCluster[]>(() => {
    const clusters: PlaceCluster[] = [];

    filteredPlaces.forEach((place) => {
      // Find if an existing cluster is very close (< 25 meters)
      const existing = clusters.find((c) => {
        const dist = calculateDistance(c.lat, c.lng, place.latitude, place.longitude);
        return dist < 25; // less than 25 meters
      });

      if (existing) {
        existing.places.push(place);
      } else {
        clusters.push({
          id: `cluster-${place.id}`,
          lat: place.latitude,
          lng: place.longitude,
          places: [place],
        });
      }
    });

    return clusters;
  }, [filteredPlaces]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      todos: validPlaces.length,
      turismo: validPlaces.filter((p) => filterPlaceByCategory(p, 'turismo')).length,
      pousadas: validPlaces.filter((p) => filterPlaceByCategory(p, 'pousadas')).length,
      restaurantes: validPlaces.filter((p) => filterPlaceByCategory(p, 'restaurantes')).length,
      comercio: validPlaces.filter((p) => filterPlaceByCategory(p, 'comercio')).length,
      alimentacao: validPlaces.filter((p) => filterPlaceByCategory(p, 'alimentacao')).length,
      cultura: validPlaces.filter((p) => filterPlaceByCategory(p, 'cultura')).length,
      natureza: validPlaces.filter((p) => filterPlaceByCategory(p, 'natureza')).length,
    };
  }, [validPlaces]);

  // 1. Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;
    let t1: any, t2: any, t3: any;

    try {
      // Centro Histórico de Conservatória (Praça da Matriz de Santo Antônio)
      const CONSERVATORIA_CENTER: [number, number] = [-22.31644, -43.81552];

      // Limpar instância anterior ou id dangling do Leaflet
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }

      const map = L.map(container, {
        center: CONSERVATORIA_CENTER,
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
      });

      // Default tiles: OpenStreetMap padrão mundial (estável e rápido)
      const standardTileLayer = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }
      ).addTo(map);

      tileLayerRef.current = standardTileLayer;

      // Layer group for markers
      const markersGroup = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = markersGroup;

      mapInstanceRef.current = map;
      setMapReady(true);
      setMapError(null);

      // Invalidate size immediately and in progressive timeouts to guarantee render
      map.invalidateSize();
      t1 = setTimeout(() => map.invalidateSize(), 100);
      t2 = setTimeout(() => map.invalidateSize(), 300);
      t3 = setTimeout(() => map.invalidateSize(), 600);

      // Observe container resize to auto-adapt
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(container);
      }
    } catch (err: any) {
      console.error('Erro ao inicializar mapa Leaflet:', err);
      setMapError('Não foi possível carregar o mapa. Tente novamente.');
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (container) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // Listen to fullscreen changes to update state & invalidate size
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 2. Prevent Leaflet from intercepting clicks on UI control overlays
  useEffect(() => {
    const disablePropagation = (el: HTMLElement | null) => {
      if (el) {
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
      }
    };

    disablePropagation(headerControlsRef.current);
    disablePropagation(floatingControlsRef.current);
    disablePropagation(bottomCardWrapperRef.current);
  });

  // 3. Tile Layer switcher (Padrão vs Satélite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (activeMapType === 'satelite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Tiles &copy; Esri',
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }
      ).addTo(map);
    }
  }, [activeMapType]);

  // 4. Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center pointer-events-auto">
            <div class="w-6 h-6 rounded-full bg-[#0d3822] border-2 border-white shadow-xl flex items-center justify-center user-gps-pulse">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            </div>
            <div class="absolute -bottom-6 bg-[#0d3822] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              Você está aqui
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1200,
      }).addTo(map);
    }
  }, [userLocation]);

  // 5. Update Markers and Clustered Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    clusteredPlaces.forEach((cluster) => {
      // If multiple places at the same spot: show smart cluster badge
      if (cluster.places.length > 1) {
        const isClusterSelected = cluster.places.some((p) => p.id === selectedPlace?.id);
        const firstPlace = cluster.places[0];

        const clusterIcon = L.divIcon({
          className: 'stacked-cluster-marker',
          html: `
            <div class="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
              <div class="relative flex items-center justify-center">
                <div style="background-color: ${isClusterSelected ? '#b48324' : '#0d3822'};" class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white text-white font-black text-xs ${isClusterSelected ? 'scale-110 ring-4 ring-amber-400/50' : ''}">
                  🏛️
                </div>
                <span class="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-950 font-black text-[10px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                  ${cluster.places.length}
                </span>
              </div>
              <div class="mt-1 bg-white/95 text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-stone-200 whitespace-nowrap">
                ${cluster.places.length} locais juntos
              </div>
            </div>
          `,
          iconSize: [40, 48],
          iconAnchor: [20, 42],
        });

        const clusterMarker = L.marker([cluster.lat, cluster.lng], {
          icon: clusterIcon,
          zIndexOffset: isClusterSelected ? 900 : 500,
        })
          .addTo(group)
          .on('click', () => {
            setClusterPicker(cluster);
            map.flyTo([cluster.lat, cluster.lng], Math.max(map.getZoom(), 17), { duration: 0.8 });
          });

        return;
      }

      // Single place marker
      const place = cluster.places[0];
      const isSelected = selectedPlace?.id === place.id;

      let markerBg = '#0d3822';
      let iconSymbol = '📍';

      // Professional icon mapping
      if (place.type === 'inn' || place.category === 'pousadas') {
        markerBg = '#0f766e'; // 🏨 Pousadas
        iconSymbol = '🏨';
      } else if (place.type === 'restaurant' || place.category === 'gastronomia') {
        markerBg = '#c2410c'; // 🍽️ Restaurantes
        iconSymbol = '🍽️';
      } else if (place.type === 'business' || place.category === 'comercio') {
        markerBg = '#4338ca'; // 🛍️ Comércio
        iconSymbol = '🛍️';
      } else if (place.type === 'service' || place.category === 'servicos') {
        markerBg = '#374151'; // 🛠️ Serviços
        iconSymbol = '🛠️';
      } else if (place.category === 'cachoeiras') {
        markerBg = '#0369a1'; // 🌳 Natureza / Cachoeiras
        iconSymbol = '🌳';
      } else if (place.category === 'museus' || place.category === 'eventos') {
        markerBg = '#7c2d12'; // 🎭 Cultura
        iconSymbol = '🎭';
      } else {
        // Histórico
        markerBg = '#0d3822';
        iconSymbol = '🏛️';
        if (place.name.includes('Locomotiva')) iconSymbol = '🚂';
        else if (place.name.includes('Túnel')) iconSymbol = '💧';
        else if (place.name.includes('Igreja')) iconSymbol = '⛪';
        else if (place.name.includes('Cine')) iconSymbol = '🎬';
      }

      const placeIcon = L.divIcon({
        className: 'single-place-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
            <div style="background-color: ${isSelected ? '#b48324' : markerBg};" class="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white text-base text-white transition-all transform ${isSelected ? 'scale-125 ring-4 ring-[#b48324]/40 shadow-xl' : ''}">
              ${iconSymbol}
            </div>
            <div class="mt-1 bg-white/95 text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-stone-200 whitespace-nowrap max-w-[120px] truncate">
              ${place.name}
            </div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 38],
      });

      L.marker([place.latitude, place.longitude], {
        icon: placeIcon,
        zIndexOffset: isSelected ? 1000 : 400,
      })
        .addTo(group)
        .on('click', () => {
          setSelectedPlace(place);
          setClusterPicker(null);
          map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 16), {
            duration: 0.8,
          });
        });
    });

    // 6. Draw Polyline for Active Tourist Route or Destination Path
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (activeTouristRoute) {
      // Connect all places on route
      const routePoints = activeTouristRoute.places
        .map((pId) => validPlaces.find((p) => p.id === pId))
        .filter((p): p is Place => !!p)
        .map((p) => [p.latitude, p.longitude] as [number, number]);

      if (routePoints.length > 1) {
        routePolylineRef.current = L.polyline(routePoints, {
          color: '#b48324',
          weight: 4,
          opacity: 0.9,
          dashArray: '6, 8',
        }).addTo(map);
      }
    } else if (userLocation && selectedPlace && selectedPlace.latitude && selectedPlace.longitude) {
      // Direct path line to selected place
      const latlngs: L.LatLngExpression[] = [
        [userLocation.lat, userLocation.lng],
        [
          (userLocation.lat + selectedPlace.latitude) / 2 + 0.0003,
          (userLocation.lng + selectedPlace.longitude) / 2 - 0.0002,
        ],
        [selectedPlace.latitude, selectedPlace.longitude],
      ];

      routePolylineRef.current = L.polyline(latlngs, {
        color: '#0d3822',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 6',
      }).addTo(map);
    }
  }, [clusteredPlaces, selectedPlace, activeTouristRoute, userLocation, validPlaces]);

  // CONTROLE: ZOOM +
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  // CONTROLE: ZOOM -
  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // CONTROLE: MINHA LOCALIZAÇÃO REAL
  const handleMyCurrentLocation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setStatusNotice('Obtendo sinal GPS do aparelho...');

    if (!('geolocation' in navigator)) {
      setStatusNotice('Não foi possível acessar sua localização. Verifique a permissão do navegador.');
      setTimeout(() => setStatusNotice(null), 4000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setGpsActive(true);
        setStatusNotice('Localização obtida! Mostrando "Você está aqui".');
        setTimeout(() => setStatusNotice(null), 3000);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGpsActive(false);
        setStatusNotice('Não foi possível acessar sua localização. Verifique a permissão do navegador.');
        setTimeout(() => setStatusNotice(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // CONTROLE: TELA CHEIA
  const handleToggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const elem = mapContainerRef.current?.parentElement || mapContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // CONTROLE: ALTERNAR CAMADAS (PADRÃO / SATÉLITE)
  const handleToggleMapLayer = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setActiveMapType((prev) => (prev === 'padrao' ? 'satelite' : 'padrao'));
    setStatusNotice(
      activeMapType === 'padrao'
        ? 'Camada: Imagem de Satélite ativada'
        : 'Camada: Mapa Turístico Padrão ativado'
    );
    setTimeout(() => setStatusNotice(null), 2500);
  };

  // CONTROLE: CENTRALIZAR CONSERVATÓRIA
  const handleCenterConservatoria = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-22.31644, -43.81552], 16, { duration: 1.2 });
      setStatusNotice('Mapa centralizado na Praça da Matriz de Conservatória');
      setTimeout(() => setStatusNotice(null), 2500);
    }
  };

  // SELEÇÃO PELA PESQUISA
  const handleSelectSearchResult = (place: Place) => {
    setSelectedPlace(place);
    setSearchQuery('');
    setIsSearchFocused(false);
    setClusterPicker(null);

    if (mapInstanceRef.current && place.latitude && place.longitude) {
      mapInstanceRef.current.flyTo([place.latitude, place.longitude], 17, { duration: 1.2 });
    }
  };

  // SELEÇÃO PELA LISTA DE LOCAIS
  const handleSelectFromDrawer = (place: Place) => {
    setSelectedPlace(place);
    setShowPlacesDrawer(false);
    setClusterPicker(null);

    if (mapInstanceRef.current && place.latitude && place.longitude) {
      mapInstanceRef.current.flyTo([place.latitude, place.longitude], 17, { duration: 1.2 });
    }
  };

  // Toggle seresta audio player
  const handleToggleAudio = () => {
    const playing = toggleSerestaAudio((state) => setIsPlayingAudio(state));
    setIsPlayingAudio(playing);
  };

  return (
    <div 
      className="relative w-full overflow-hidden bg-[#f4efe6] select-none font-sans"
      style={{ height: 'calc(100dvh - 120px)', minHeight: '520px' }}
    >
      {/* 1. TOP HEADER OVER MAP (Search, Category Chips & Branding) */}
      <div 
        ref={headerControlsRef}
        className="absolute top-2 left-2 right-2 sm:left-4 sm:right-4 z-[1000] space-y-2 pointer-events-none"
      >
        {/* Modern Header Banner */}
        <div className="pointer-events-auto flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-stone-200/90 text-stone-900">
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-[#0d3822] uppercase">
              Conservatória Turismo
            </h1>
            <p className="text-[10px] text-stone-500 font-medium">
              Explore a Capital da Seresta • Vale do Café
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlacesDrawer(true)}
              aria-label="Ver lista de locais cadastrados"
              title="Abrir lista de pontos e comércios"
              className="py-1.5 px-3 rounded-xl bg-[#0d3822] hover:bg-[#144f31] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <List className="w-3.5 h-3.5" />
              <span>Ver locais ({validPlaces.length})</span>
            </button>
          </div>
        </div>

        {/* Status Notice Notification */}
        {statusNotice && (
          <div className="pointer-events-auto p-2.5 rounded-2xl bg-stone-900/95 text-white text-xs backdrop-blur-md shadow-xl flex items-center justify-between gap-2 border border-stone-700 animate-in fade-in">
            <span>{statusNotice}</span>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-stone-400 hover:text-white text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search Bar Input [ 🔎 O que você procura? ] */}
        <div className="pointer-events-auto relative">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-stone-200 text-stone-900">
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que você procura? (ex: Locomotiva, Túnel, Pousada Horizonte Verde)..."
              className="w-full bg-transparent text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                }}
                aria-label="Limpar pesquisa"
                className="text-stone-400 hover:text-stone-600 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Real-time search suggestions dropdown */}
          {searchQuery.trim().length > 0 && isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100 z-[1001] max-h-64 overflow-y-auto">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handleSelectSearchResult(place)}
                    className="p-3 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition active:bg-stone-100"
                  >
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-stone-100 shadow-inner"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {place.name}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {place.categoryLabel || place.category} • {place.address}
                      </div>
                    </div>
                    <MapPin className="w-4 h-4 text-[#0d3822] flex-shrink-0" />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-stone-500 space-y-1">
                  <div className="font-semibold text-stone-700">Nenhum resultado direto</div>
                  <div>Não encontramos nenhum ponto cadastrado para "{searchQuery}".</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 8 Category Filter Chips */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'todos', label: `📍 Todos (${categoryCounts.todos})` },
            { id: 'turismo', label: `🏛️ Turismo (${categoryCounts.turismo})` },
            { id: 'pousadas', label: `🏨 Pousadas (${categoryCounts.pousadas})` },
            { id: 'restaurantes', label: `🍽️ Restaurantes (${categoryCounts.restaurantes})` },
            { id: 'comercio', label: `🛍️ Comércio (${categoryCounts.comercio})` },
            { id: 'alimentacao', label: `☕ Alimentação (${categoryCounts.alimentacao})` },
            { id: 'cultura', label: `🎭 Cultura (${categoryCounts.cultura})` },
            { id: 'natureza', label: `🌳 Natureza (${categoryCounts.natureza})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as MapCategoryFilter);
                setActiveTouristRoute(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition active:scale-95 cursor-pointer ${
                activeCategory === cat.id && !activeTouristRoute
                  ? 'bg-[#0d3822] text-white ring-2 ring-[#0d3822]/20'
                  : 'bg-white/95 text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Roteiros Thematic Horizontal Bar */}
        {routes && routes.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
              <RouteIcon className="w-3 h-3" />
              <span>Roteiros:</span>
            </span>
            {routes.map((route) => {
              const isSelected = activeTouristRoute?.id === route.id;
              return (
                <button
                  key={route.id}
                  onClick={() => {
                    if (isSelected) {
                      setActiveTouristRoute(null);
                    } else {
                      setActiveTouristRoute(route);
                      setStatusNotice(`Roteiro ativado: ${route.title}`);
                      setTimeout(() => setStatusNotice(null), 3000);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap shadow-xs transition active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-600/30'
                      : 'bg-white/90 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  ⭐ {route.title}
                </button>
              );
            })}
            {activeTouristRoute && (
              <button
                onClick={() => setActiveTouristRoute(null)}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 cursor-pointer"
              >
                Limpar Roteiro ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. LEAFLET MAP TARGET CONTAINER */}
      <div 
        ref={mapContainerRef} 
        tabIndex={0}
        aria-label="Mapa Interativo de Conservatória"
        className="w-full h-full focus:outline-none" 
        style={{ width: '100%', height: '100%', minHeight: '520px' }}
      />

      {/* Map Error Fallback */}
      {mapError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-100/95 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm text-center space-y-3 border border-stone-200">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <h3 className="font-bold text-stone-900 text-base">{mapError}</h3>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#0d3822] text-white font-bold text-xs shadow hover:bg-[#144f31]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* 3. FLOATING ACTION CONTROLS ON RIGHT */}
      <div 
        ref={floatingControlsRef}
        className={`absolute right-3 z-[1000] flex flex-col gap-2 transition-all duration-300 pointer-events-auto ${
          selectedPlace ? 'bottom-84 sm:bottom-72' : 'bottom-20 sm:bottom-16'
        }`}
      >
        {/* Zoom In (+) */}
        <button
          onClick={handleZoomIn}
          aria-label="Aumentar zoom (+)"
          title="Aumentar zoom (+)"
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-5 h-5 text-stone-800" />
        </button>

        {/* Zoom Out (-) */}
        <button
          onClick={handleZoomOut}
          aria-label="Diminuir zoom (-)"
          title="Diminuir zoom (-)"
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition cursor-pointer"
        >
          <Minus className="w-5 h-5 text-stone-800" />
        </button>

        {/* Minha Localização [ ◎ ] */}
        <button
          onClick={handleMyCurrentLocation}
          aria-label="Minha localização"
          title="Minha localização (GPS)"
          className={`w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition cursor-pointer ${
            gpsActive
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-[#0d3822] text-white shadow-[#0d3822]/30 hover:bg-[#134e30]'
          }`}
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Alternar Camadas (Padrão vs Satélite) [ 🗺️ ] */}
        <button
          onClick={handleToggleMapLayer}
          aria-label="Alternar camadas do mapa"
          title={`Alternar camadas (${activeMapType === 'padrao' ? 'Satélite' : 'Padrão'})`}
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition cursor-pointer"
        >
          <Layers className="w-5 h-5 text-stone-800" />
        </button>

        {/* Tela Cheia [ ⛶ ] */}
        <button
          onClick={handleToggleFullscreen}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Abrir em tela cheia'}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition cursor-pointer"
        >
          {isFullscreen ? <Minimize className="w-5 h-5 text-stone-800" /> : <Maximize className="w-5 h-5 text-stone-800" />}
        </button>

        {/* Centralizar Conservatória [ 🏛️ ] */}
        <button
          onClick={handleCenterConservatoria}
          aria-label="Voltar a Conservatória"
          title="Centralizar na Praça da Matriz de Conservatória"
          className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <Compass className="w-5 h-5 text-stone-950" />
        </button>
      </div>

      {/* 4. CLUSTER STACKING PICKER MODAL (When multiple places share coordinates) */}
      {clusterPicker && (
        <div 
          className="absolute inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setClusterPicker(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl border border-stone-200 space-y-3 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">
                  Locais neste Ponto ({clusterPicker.places.length})
                </h4>
                <p className="text-[11px] text-stone-500">
                  Selecione o atrativo que deseja inspecionar:
                </p>
              </div>
              <button
                onClick={() => setClusterPicker(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {clusterPicker.places.map((place) => (
                <div
                  key={place.id}
                  onClick={() => {
                    setSelectedPlace(place);
                    setClusterPicker(null);
                  }}
                  className="p-2.5 rounded-2xl border border-stone-200 hover:bg-stone-50 flex items-center gap-3 cursor-pointer transition"
                >
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-inner"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-stone-900 truncate">
                      {place.name}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">
                      {place.categoryLabel || place.category}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-[#0d3822] flex-shrink-0">
                    Abrir →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. BOTTOM SHEET CARD: LocalDetailsCard */}
      {selectedPlace && (
        <div 
          ref={bottomCardWrapperRef}
          className="absolute bottom-3 left-2 right-2 sm:left-4 sm:right-4 z-[1000] pointer-events-none"
        >
          <LocalDetailsCard
            place={selectedPlace}
            userLocation={userLocation}
            isFavorite={isFavorite(selectedPlace.id)}
            onToggleFavorite={toggleFavorite}
            onOpenDetails={onOpenDetails}
            onClose={() => setSelectedPlace(null)}
            isPlayingAudio={isPlayingAudio}
            onToggleAudio={handleToggleAudio}
          />
        </div>
      )}

      {/* 6. SLIDE-OVER DRAWER: PlacesListDrawer ("☰ Ver locais") */}
      <PlacesListDrawer
        isOpen={showPlacesDrawer}
        onClose={() => setShowPlacesDrawer(false)}
        places={filteredPlaces}
        selectedPlaceId={selectedPlace?.id}
        onSelectPlace={handleSelectFromDrawer}
        userLocation={userLocation}
        activeCategoryLabel={activeCategory !== 'todos' ? activeCategory.toUpperCase() : undefined}
      />
    </div>
  );
};
