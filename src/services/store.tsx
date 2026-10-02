import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Place, TouristRoute, User, Review, Report, PaymentTransaction, AppSettings, BusinessStatus, TourGuide } from '../types';
import { INITIAL_PLACES, INITIAL_ROUTES, INITIAL_SETTINGS, INITIAL_USERS } from '../data/initialData';
import { INITIAL_GUIDES } from '../data/initialGuides';
import { signInWithGoogle, signOutFromFirebase } from './firebase';

// Haversine formula for real geographical distance in meters/km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m de você`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km de você`;
}

interface AppContextType {
  // Places
  places: Place[];
  addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => Promise<Place>;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  deletePlace: (id: string) => void;
  updateBusinessStatus: (id: string, status: BusinessStatus) => void;

  // Routes
  routes: TouristRoute[];
  addRoute: (route: Omit<TouristRoute, 'id'>) => void;
  updateRoute: (id: string, updates: Partial<TouristRoute>) => void;
  deleteRoute: (id: string) => void;

  // Tour Guides (Guias de Turismo)
  guides: TourGuide[];
  addGuide: (guide: Omit<TourGuide, 'id' | 'rating' | 'reviewsCount' | 'verified'>) => TourGuide;
  updateGuide: (id: string, updates: Partial<TourGuide>) => void;
  deleteGuide: (id: string) => void;
  updateGuideStatus: (id: string, status: BusinessStatus) => void;

  // User & Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginWithGoogle: (targetRole?: 'TURISTA' | 'COMERCIANTE' | 'SUPER_ADMIN') => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  registerMerchant: (data: { name: string; email: string; businessName: string; phone: string; whatsapp: string; category: Place['category'] }) => Promise<User>;

  // Favorites
  favorites: string[];
  toggleFavorite: (placeId: string) => void;
  isFavorite: (placeId: string) => boolean;

  // Geolocation
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  gpsAccuracy: number | null;
  setGpsAccuracy: (acc: number | null) => void;
  gpsActive: boolean;
  setGpsActive: (active: boolean) => void;
  gpsError: string | null;
  setGpsError: (error: string | null) => void;
  requestGpsPermission: (onSuccess?: (loc: { lat: number; lng: number }) => void, onError?: (err: string) => void) => void;

  // Selected Place & Route
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  activeRoute: TouristRoute | null;
  setActiveRoute: (route: TouristRoute | null) => void;

  // Emergency & Reviews & Reports
  reviews: Review[];
  addReview: (placeId: string, rating: number, comment: string, userName: string) => void;
  deleteReview: (reviewId: string) => void;
  reports: Report[];
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'resolved'>) => void;
  resolveReport: (reportId: string) => void;

  // Payments & Monetization
  payments: PaymentTransaction[];
  createPixPayment: (businessId: string, businessName: string, amount: number, itemType?: 'BUSINESS' | 'GUIDE') => PaymentTransaction;
  confirmPaymentWebhook: (paymentId: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Places state with LocalStorage persistence
  const [places, setPlaces] = useState<Place[]>(() => {
    const saved = localStorage.getItem('conservatoria_places');
    return saved ? JSON.parse(saved) : INITIAL_PLACES;
  });

  // Routes state
  const [routes, setRoutes] = useState<TouristRoute[]>(() => {
    const saved = localStorage.getItem('conservatoria_routes');
    return saved ? JSON.parse(saved) : INITIAL_ROUTES;
  });

  // Tour Guides (Guias de Turismo) state
  const [guides, setGuides] = useState<TourGuide[]>(() => {
    const saved = localStorage.getItem('conservatoria_guides');
    return saved ? JSON.parse(saved) : INITIAL_GUIDES;
  });

  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('conservatoria_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Current session user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('conservatoria_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('conservatoria_favorites');
    return saved ? JSON.parse(saved) : ['tunel-que-chora', 'locomotiva-206'];
  });

  // GPS User Location (Defaults to Praça da Matriz Conservatória when initializing)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: -22.31644,
    lng: -43.81552,
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(4);
  const [gpsActive, setGpsActive] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Selected Place for details view / bottom sheet
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(INITIAL_PLACES[1]); // Default to Túnel que Chora matching Image 5
  const [activeRoute, setActiveRoute] = useState<TouristRoute | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('conservatoria_reviews');
    return saved ? JSON.parse(saved) : [
      {
        id: 'rev_1',
        placeId: 'tunel-que-chora',
        userName: 'Ana Paula Rocha',
        rating: 5,
        comment: 'Lugar mágico! As gotas pingando do teto de pedra criam um som sereno inesquecível.',
        createdAt: '2026-02-14T10:00:00Z',
        hidden: false,
      },
      {
        id: 'rev_2',
        placeId: 'locomotiva-206',
        userName: 'Roberto Guimarães',
        rating: 5,
        comment: 'A Maria Fumaça é linda e muito bem cuidada no centro da cidade.',
        createdAt: '2026-02-20T16:30:00Z',
        hidden: false,
      }
    ];
  });

  // Reports
  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('conservatoria_reports');
    return saved ? JSON.parse(saved) : [];
  });

  // Payments
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('conservatoria_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('conservatoria_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Save to localStorage whenever state updates
  useEffect(() => {
    localStorage.setItem('conservatoria_places', JSON.stringify(places));
  }, [places]);

  useEffect(() => {
    localStorage.setItem('conservatoria_routes', JSON.stringify(routes));
  }, [routes]);

  useEffect(() => {
    localStorage.setItem('conservatoria_guides', JSON.stringify(guides));
  }, [guides]);

  useEffect(() => {
    localStorage.setItem('conservatoria_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('conservatoria_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('conservatoria_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('conservatoria_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('conservatoria_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('conservatoria_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('conservatoria_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('conservatoria_settings', JSON.stringify(settings));
  }, [settings]);

  // Real Geolocation Watcher
  const requestGpsPermission = (
    onSuccess?: (loc: { lat: number; lng: number }) => void,
    onError?: (err: string) => void
  ) => {
    if (!('geolocation' in navigator)) {
      const msg = 'Geolocalização não suportada no seu navegador.';
      setGpsError(msg);
      onError?.(msg);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(loc);
        setGpsAccuracy(Math.round(pos.coords.accuracy || 4));
        setGpsActive(true);
        setGpsError(null);
        onSuccess?.(loc);
      },
      (err) => {
        console.warn('Geolocation prompt response:', err.message);
        setGpsActive(false);
        const msg = 'Acesso à localização foi recusado. O aplicativo e o mapa continuam funcionando normalmente a partir do Centro de Conservatória.';
        setGpsError(msg);
        onError?.(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    // Attempt gentle background geolocation
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsAccuracy(Math.round(pos.coords.accuracy || 4));
          setGpsActive(true);
        },
        () => {
          // Keep default Conservatória position without blocking
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 20000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const toggleFavorite = (placeId: string) => {
    setFavorites((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const isFavorite = (placeId: string) => favorites.includes(placeId);

  // Auth
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    const normalized = email.trim().toLowerCase();
    
    // Super admin authentication
    if (normalized === 'horizonteverdepousada@gmail.com') {
      if (pass !== '81216610Lm.') {
        return { success: false, error: 'Senha incorreta do Super Administrador.' };
      }
      const adminUser: User = {
        id: 'admin_super_1',
        name: 'Super Administrador',
        email: 'horizonteverdepousada@gmail.com',
        role: 'SUPER_ADMIN',
        phone: '(24) 2438-1234',
        createdAt: '2026-01-01T00:00:00Z',
      };
      setCurrentUser(adminUser);
      return { success: true, user: adminUser };
    }

    // Check existing users
    const matched = users.find((u) => u.email.toLowerCase() === normalized);
    if (matched) {
      setCurrentUser(matched);
      return { success: true, user: matched };
    }

    // Auto-create tourist user if signing in
    const newTourist: User = {
      id: `user_${Date.now()}`,
      name: normalized.split('@')[0],
      email: normalized,
      role: 'TURISTA',
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newTourist]);
    setCurrentUser(newTourist);
    return { success: true, user: newTourist };
  };

  const logout = () => {
    signOutFromFirebase();
    setCurrentUser(null);
  };

  const loginWithGoogle = async (
    targetRole: 'TURISTA' | 'COMERCIANTE' | 'SUPER_ADMIN' = 'TURISTA'
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await signInWithGoogle();
      if (!res.success || !res.user) {
        return { success: false, error: res.error || 'Falha ao autenticar com a Conta Google.' };
      }

      const gUser = res.user;
      const normalizedEmail = (gUser.email || '').trim().toLowerCase();

      // Super admin check
      if (normalizedEmail === 'horizonteverdepousada@gmail.com') {
        const adminUser: User = {
          id: gUser.uid,
          name: gUser.displayName || 'Super Administrador',
          email: 'horizonteverdepousada@gmail.com',
          role: 'SUPER_ADMIN',
          phone: gUser.phoneNumber || '(24) 2438-1234',
          createdAt: '2026-01-01T00:00:00Z',
        };
        setCurrentUser(adminUser);
        return { success: true, user: adminUser };
      }

      // Check existing user in local list
      const matched = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (matched) {
        setCurrentUser(matched);
        return { success: true, user: matched };
      }

      // Create new user profile with Google account data
      const newUser: User = {
        id: gUser.uid || `user_${Date.now()}`,
        name: gUser.displayName || normalizedEmail.split('@')[0] || 'Usuário Google',
        email: normalizedEmail,
        role: targetRole,
        phone: gUser.phoneNumber || '',
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      return { success: true, user: newUser };
    } catch (err: unknown) {
      const e = err as Error;
      return { success: false, error: e?.message || 'Erro inesperado ao conectar com a Conta Google.' };
    }
  };

  const registerMerchant = async (data: {
    name: string;
    email: string;
    businessName: string;
    phone: string;
    whatsapp: string;
    category: Place['category'];
  }): Promise<User> => {
    const businessId = `biz_${Date.now()}`;
    const merchantUser: User = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: 'COMERCIANTE',
      phone: data.phone,
      whatsapp: data.whatsapp,
      merchantBusinessId: businessId,
      createdAt: new Date().toISOString(),
    };

    // Create the business with PENDING_PAYMENT status
    const newBusinessPlace: Place = {
      id: businessId,
      name: data.businessName,
      category: data.category,
      categoryLabel: data.category.charAt(0).toUpperCase() + data.category.slice(1),
      type: 'business',
      description: 'Estabelecimento recém-cadastrado no Guia Comercial de Conservatória.',
      shortDescription: `${data.businessName} em Conservatória`,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
      gallery: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'],
      latitude: -22.31644,
      longitude: -43.81552,
      address: 'Centro Histórico, Conservatória - RJ',
      hours: 'Segunda a Sábado: 09h às 19h',
      phone: data.phone,
      whatsapp: data.whatsapp,
      featured: false,
      verified: false,
      badgeText: 'COMÉRCIO',
      rating: 5.0,
      reviewCount: 0,
      status: 'PENDING_PAYMENT',
      merchantId: merchantUser.id,
      merchantName: data.name,
      createdAt: new Date().toISOString(),
      isSponsored: true,
    };

    setUsers((prev) => [...prev, merchantUser]);
    setPlaces((prev) => [newBusinessPlace, ...prev]);
    setCurrentUser(merchantUser);

    return merchantUser;
  };

  // Place operations
  const addPlace = async (placeData: Omit<Place, 'id' | 'createdAt'>): Promise<Place> => {
    const newPlace: Place = {
      ...placeData,
      id: `place_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPlaces((prev) => [newPlace, ...prev]);
    return newPlace;
  };

  const updatePlace = (id: string, updates: Partial<Place>) => {
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (selectedPlace && selectedPlace.id === id) {
      setSelectedPlace((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deletePlace = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlace && selectedPlace.id === id) {
      setSelectedPlace(null);
    }
  };

  const updateBusinessStatus = (id: string, status: BusinessStatus) => {
    updatePlace(id, { status });
  };

  // Route operations
  const addRoute = (routeData: Omit<TouristRoute, 'id'>) => {
    const newRoute: TouristRoute = {
      ...routeData,
      id: `route_${Date.now()}`,
    };
    setRoutes((prev) => [...prev, newRoute]);
  };

  const updateRoute = (id: string, updates: Partial<TouristRoute>) => {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRoute = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  // Guide Management
  const addGuide = (guideData: Omit<TourGuide, 'id' | 'rating' | 'reviewsCount' | 'verified'>): TourGuide => {
    const newGuide: TourGuide = {
      ...guideData,
      id: `guia_${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
      verified: true,
      status: guideData.status || 'PENDING_PAYMENT',
      monthlySubscriptionPrice: guideData.monthlySubscriptionPrice || 49.9,
    };
    setGuides((prev) => [newGuide, ...prev]);
    return newGuide;
  };

  const updateGuide = (id: string, updates: Partial<TourGuide>) => {
    setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGuide = (id: string) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  };

  const updateGuideStatus = (id: string, status: BusinessStatus) => {
    updateGuide(id, { status });
  };

  // Reviews
  const addReview = (placeId: string, rating: number, comment: string, userName: string) => {
    const newReview: Review = {
      id: `rev_${Date.now()}`,
      placeId,
      userName: userName.trim() || 'Turista em Conservatória',
      rating,
      comment,
      createdAt: new Date().toISOString(),
      hidden: false,
    };
    setReviews((prev) => [newReview, ...prev]);

    // Update place rating average
    const placeReviews = [...reviews.filter((r) => r.placeId === placeId && !r.hidden), newReview];
    const avg = placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length;
    updatePlace(placeId, {
      rating: parseFloat(avg.toFixed(1)),
      reviewCount: placeReviews.length,
    });
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  // Reports
  const addReport = (reportData: Omit<Report, 'id' | 'createdAt' | 'resolved'>) => {
    const newReport: Report = {
      ...reportData,
      id: `rep_${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const resolveReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, resolved: true } : r))
    );
  };

  // Payments
  const createPixPayment = (
    businessId: string,
    businessName: string,
    amount: number,
    itemType: 'BUSINESS' | 'GUIDE' = 'BUSINESS'
  ): PaymentTransaction => {
    const txId = `pix_${Date.now()}`;
    const pixPayload = `00020126580014BR.GOV.BCB.PIX0136horizonteverdepousada@gmail.com5204000053039865405${amount.toFixed(2)}5802BR5921CONSERVATORIA TURISMO6012VALENCA RJ62070503***6304${txId.slice(-4).toUpperCase()}`;
    
    const newPayment: PaymentTransaction = {
      id: txId,
      merchantId: currentUser?.id || 'anon',
      businessId,
      businessName,
      amount,
      method: 'PIX',
      status: 'PENDING',
      itemType,
      pixCode: pixPayload,
      pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}`,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  const confirmPaymentWebhook = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: 'CONFIRMED', confirmedAt: new Date().toISOString() }
          : p
      )
    );

    // If guide payment
    const isGuide = payment.itemType === 'GUIDE' || guides.some((g) => g.id === payment.businessId);
    if (isGuide) {
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      updateGuide(payment.businessId, {
        status: 'ACTIVE',
        subscriptionPaidUntil: in30Days,
      });
    } else {
      // Business goes to PENDING_APPROVAL
      updateBusinessStatus(payment.businessId, 'PENDING_APPROVAL');
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider
      value={{
        places,
        addPlace,
        updatePlace,
        deletePlace,
        updateBusinessStatus,
        routes,
        addRoute,
        updateRoute,
        deleteRoute,
        guides,
        addGuide,
        updateGuide,
        deleteGuide,
        updateGuideStatus,
        currentUser,
        setCurrentUser,
        login,
        loginWithGoogle,
        logout,
        registerMerchant,
        favorites,
        toggleFavorite,
        isFavorite,
        userLocation,
        setUserLocation,
        gpsAccuracy,
        setGpsAccuracy,
        gpsActive,
        setGpsActive,
        gpsError,
        setGpsError,
        requestGpsPermission,
        selectedPlace,
        setSelectedPlace,
        activeRoute,
        setActiveRoute,
        reviews,
        addReview,
        deleteReview,
        reports,
        addReport,
        resolveReport,
        payments,
        createPixPayment,
        confirmPaymentWebhook,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
