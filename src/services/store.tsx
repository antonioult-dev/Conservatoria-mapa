import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  collection, doc, getDoc, getDocs, onSnapshot, query, where, setDoc, updateDoc,
  deleteDoc, writeBatch, serverTimestamp, deleteField,
} from 'firebase/firestore';
import { Place, TouristRoute, User, Review, Report, PaymentTransaction, AppSettings, BusinessStatus, TourGuide } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { signInWithGoogle, signOutFromFirebase, auth, onIdTokenChanged, db, requestAdminClaim } from './firebase';

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m em linha reta` : `${(meters / 1000).toFixed(1).replace('.', ',')} km em linha reta`;
}

export function getReviewSummary(reviews: Review[], placeId: string) {
  const visible = reviews.filter((review) => review.placeId === placeId && !review.hidden);
  return { count: visible.length, rating: visible.length ? visible.reduce((sum, review) => sum + review.rating, 0) / visible.length : null };
}

interface AppContextType {
  places: Place[]; addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => Promise<Place>;
  updatePlace: (id: string, updates: Partial<Place>) => Promise<void>; deletePlace: (id: string) => Promise<void>; updateBusinessStatus: (id: string, status: BusinessStatus) => Promise<void>;
  routes: TouristRoute[]; addRoute: (route: Omit<TouristRoute, 'id'>) => Promise<void>; updateRoute: (id: string, updates: Partial<TouristRoute>) => Promise<void>; deleteRoute: (id: string) => Promise<void>;
  guides: TourGuide[]; addGuide: (guide: Omit<TourGuide, 'id' | 'rating' | 'reviewsCount' | 'verified'>) => Promise<TourGuide>; updateGuide: (id: string, updates: Partial<TourGuide>) => Promise<void>; deleteGuide: (id: string) => Promise<void>; updateGuideStatus: (id: string, status: BusinessStatus) => Promise<void>;
  currentUser: User | null; loginWithGoogle: (targetRole?: 'TURISTA' | 'COMERCIANTE' | 'SUPER_ADMIN') => Promise<{ success: boolean; error?: string; user?: User }>; logout: () => void;
  registerMerchant: (data: { name: string; email: string; businessName: string; phone: string; whatsapp: string; category: Place['category'] }) => Promise<User>;
  favorites: string[]; toggleFavorite: (placeId: string) => Promise<void>; isFavorite: (placeId: string) => boolean;
  userLocation: { lat: number; lng: number } | null; setUserLocation: (loc: { lat: number; lng: number } | null) => void; gpsAccuracy: number | null; setGpsAccuracy: (acc: number | null) => void; gpsActive: boolean; setGpsActive: (active: boolean) => void; gpsError: string | null; setGpsError: (error: string | null) => void; requestGpsPermission: (onSuccess?: (loc: { lat: number; lng: number }) => void, onError?: (err: string) => void) => void;
  selectedPlace: Place | null; setSelectedPlace: (place: Place | null) => void; activeRoute: TouristRoute | null; setActiveRoute: (route: TouristRoute | null) => void;
  reviews: Review[]; addReview: (placeId: string, rating: number, comment: string, userName: string) => Promise<void>; deleteReview: (reviewId: string) => Promise<void>;
  reports: Report[]; addReport: (report: Omit<Report, 'id' | 'userId' | 'createdAt' | 'resolved'>) => Promise<void>; resolveReport: (reportId: string) => Promise<void>;
  payments: PaymentTransaction[]; settings: AppSettings; updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>; connectionError: string | null;
}

const AppContext = createContext<AppContextType | null>(null);
const docs = <T,>(snapshot: { docs: Array<{ id: string; data: () => unknown }> }) => snapshot.docs.map((item) => {
  const data = item.data() as Record<string, unknown>;
  const normalized = Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return [key, (value.toDate as () => Date)().toISOString()];
    }
    return [key, value];
  }));
  return { ...normalized, id: item.id } as T & { id: string };
});
const mergeById = <T extends { id: string }>(...groups: T[][]): T[] => [...new Map(groups.flat().map((item) => [item.id, item])).values()];

function firestoreErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code.includes('permission-denied')) return 'O Firebase recusou o acesso a alguns dados. Confira as regras publicadas e o status do seu cadastro.';
  if (code.includes('unavailable') || code.includes('network')) return 'Não foi possível conectar ao Firestore. Verifique a conexão e tente novamente.';
  if (code.includes('unauthenticated')) return 'Sua sessão expirou. Entre novamente para continuar.';
  return 'Não foi possível carregar ou salvar dados no Firebase. Confira a configuração do projeto.';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [placeSources, setPlaceSources] = useState<{ public: Place[]; own: Place[]; admin: Place[] }>({ public: [], own: [], admin: [] });
  const [routeSources, setRouteSources] = useState<{ public: TouristRoute[]; admin: TouristRoute[] }>({ public: [], admin: [] });
  const [guideSources, setGuideSources] = useState<{ public: TourGuide[]; own: TourGuide[]; admin: TourGuide[] }>({ public: [], own: [], admin: [] });
  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<TouristRoute[]>([]);
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeRoute, setActiveRoute] = useState<TouristRoute | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [payments] = useState<PaymentTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [connectionErrors, setConnectionErrors] = useState<Record<string, string>>({});
  const connectionError = Object.values(connectionErrors)[0] || null;
  const reportError = (operation: string, error: unknown) => {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'unknown';
    console.error(`Firestore ${operation} failed (${code})`);
    setConnectionErrors((current) => ({ ...current, [operation]: firestoreErrorMessage(error) }));
  };
  const clearError = (operation: string) => setConnectionErrors((current) => {
    if (!(operation in current)) return current;
    const next = { ...current };
    delete next[operation];
    return next;
  });

  useEffect(() => setPlaces(mergeById(placeSources.admin, placeSources.public, placeSources.own)), [placeSources]);
  useEffect(() => setRoutes(mergeById(routeSources.admin, routeSources.public)), [routeSources]);
  useEffect(() => setGuides(mergeById(guideSources.admin, guideSources.public, guideSources.own)), [guideSources]);

  useEffect(() => {
    const isAdmin = currentUser?.role === 'SUPER_ADMIN';
    const unsubs: Array<() => void> = [];
    setPlaceSources({ public: [], own: [], admin: [] });
    setRouteSources({ public: [], admin: [] });
    setGuideSources({ public: [], own: [], admin: [] });

    const placesRef = collection(db, 'places');
    if (isAdmin) {
      unsubs.push(onSnapshot(placesRef, (snapshot) => { setPlaceSources({ public: [], own: [], admin: docs<Place>(snapshot) }); clearError('places subscription'); }, (error) => reportError('places subscription', error)));
    } else {
      unsubs.push(onSnapshot(query(placesRef, where('status', '==', 'ACTIVE')), (snapshot) => { setPlaceSources((current) => ({ ...current, public: docs<Place>(snapshot) })); clearError('places subscription'); }, (error) => reportError('places subscription', error)));
      if (currentUser) unsubs.push(onSnapshot(query(placesRef, where('merchantId', '==', currentUser.id)), (snapshot) => { setPlaceSources((current) => ({ ...current, own: docs<Place>(snapshot) })); clearError('places subscription'); }, (error) => reportError('places subscription', error)));
    }

    const routesRef = collection(db, 'routes');
    if (isAdmin) unsubs.push(onSnapshot(routesRef, (snapshot) => { setRouteSources({ public: [], admin: docs<TouristRoute>(snapshot) }); clearError('routes subscription'); }, (error) => reportError('routes subscription', error)));
    else unsubs.push(onSnapshot(query(routesRef, where('published', '==', true)), (snapshot) => { setRouteSources({ public: docs<TouristRoute>(snapshot), admin: [] }); clearError('routes subscription'); }, (error) => reportError('routes subscription', error)));

    const guidesRef = collection(db, 'guides');
    if (isAdmin) unsubs.push(onSnapshot(guidesRef, (snapshot) => { setGuideSources({ public: [], own: [], admin: docs<TourGuide>(snapshot) }); clearError('guides subscription'); }, (error) => reportError('guides subscription', error)));
    else {
      unsubs.push(onSnapshot(query(guidesRef, where('status', '==', 'ACTIVE')), (snapshot) => { setGuideSources((current) => ({ ...current, public: docs<TourGuide>(snapshot) })); clearError('guides subscription'); }, (error) => reportError('guides subscription', error)));
      if (currentUser) unsubs.push(onSnapshot(query(guidesRef, where('merchantUserId', '==', currentUser.id)), (snapshot) => { setGuideSources((current) => ({ ...current, own: docs<TourGuide>(snapshot) })); clearError('guides subscription'); }, (error) => reportError('guides subscription', error)));
    }

    const reviewRef = collection(db, 'reviews');
    unsubs.push(onSnapshot(isAdmin ? reviewRef : query(reviewRef, where('hidden', '==', false)), (snapshot) => { setReviews(docs<Review>(snapshot).filter((review) => !review.hidden)); clearError('reviews subscription'); }, (error) => reportError('reviews subscription', error)));
    unsubs.push(onSnapshot(doc(db, 'settings', 'public'), (snapshot) => { if (snapshot.exists()) setSettings({ ...INITIAL_SETTINGS, ...snapshot.data(), commercialPrice: 49.9 } as AppSettings); clearError('settings subscription'); }, (error) => reportError('settings subscription', error)));
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    let active = true;
    let authRevision = 0;
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      const revision = ++authRevision;
      if (!firebaseUser) { if (active && revision === authRevision) { setCurrentUser(null); setFavorites([]); } return; }
      try {
        const isCurrentAuthUpdate = () => active && revision === authRevision && auth.currentUser?.uid === firebaseUser.uid;
        const token = await firebaseUser.getIdTokenResult();
        if (!isCurrentAuthUpdate()) return;
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profile = await getDoc(profileRef);
        if (!isCurrentAuthUpdate()) return;
        const profileData = profile.data();
        if (!profile.exists()) await setDoc(profileRef, {
          name: firebaseUser.displayName || '', email: firebaseUser.email || '', phone: firebaseUser.phoneNumber || '',
          createdAt: serverTimestamp(),
        });
        const merchant = await getDocs(query(collection(db, 'places'), where('merchantId', '==', firebaseUser.uid)));
        if (!isCurrentAuthUpdate()) return;
        const business = merchant.docs.find((item) => item.data().status !== 'BLOCKED');
        const role: User['role'] = token.claims.admin === true ? 'SUPER_ADMIN' : business ? 'COMERCIANTE' : 'TURISTA';
        setCurrentUser({
          id: firebaseUser.uid, name: profileData?.name || firebaseUser.displayName || '', email: firebaseUser.email || '',
          phone: profileData?.phone || firebaseUser.phoneNumber || '', role, createdAt: profileData?.createdAt?.toDate?.().toISOString?.() || firebaseUser.metadata.creationTime || new Date().toISOString(),
          ...(business ? { merchantBusinessId: business.id } : {}),
        });
        clearError('profile load');
        if (role === 'SUPER_ADMIN') void migrateLegacyCatalog().catch((error) => reportError('legacy migration', error));
      } catch (error) { if (active && revision === authRevision) { reportError('profile load', error); setCurrentUser(null); } }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!currentUser) { setFavorites([]); return; }
    const favoritesRef = collection(db, 'users', currentUser.id, 'favorites');
    return onSnapshot(favoritesRef, (snapshot) => setFavorites(snapshot.docs.map((item) => item.id)), (error) => reportError('favorites subscription', error));
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) { setReports([]); return; }
    const reportsQuery = currentUser.role === 'SUPER_ADMIN'
      ? collection(db, 'reports')
      : query(collection(db, 'reports'), where('userId', '==', currentUser.id));
    return onSnapshot(reportsQuery, (snapshot) => setReports(docs<Report>(snapshot)), (error) => reportError('reports subscription', error));
  }, [currentUser?.id, currentUser?.role]);

  async function migrateLegacyCatalog() {
    if (typeof localStorage === 'undefined' || !auth.currentUser) return;
    const migration = doc(db, 'settings', 'legacy-migration-v3');
    if ((await getDoc(migration)).exists()) return;
    const batch = writeBatch(db);
    let writes = 0;
    const publicSettings = await getDoc(doc(db, 'settings', 'public'));
    let legacySettings: Partial<AppSettings> = {};
    try {
      const parsed = JSON.parse(localStorage.getItem('conservatoria_settings') || '{}') as Record<string, unknown>;
      const safeText = (key: string, fallback: string, max: number) => {
        const value = typeof parsed[key] === 'string' ? (parsed[key] as string).trim().slice(0, max) : '';
        return value || fallback;
      };
      legacySettings = {
        appName: safeText('appName', INITIAL_SETTINGS.appName, 80),
        appSubtitle: safeText('appSubtitle', INITIAL_SETTINGS.appSubtitle, 160),
        contactEmail: safeText('contactEmail', '', 200),
        contactWhatsapp: safeText('contactWhatsapp', '', 40),
        bannerHeadline: INITIAL_SETTINGS.bannerHeadline,
        bannerSubtext: INITIAL_SETTINGS.bannerSubtext,
        bannerActive: false,
        subscriptionMonths: 1,
      };
    } catch { /* discard invalid legacy settings */ }
    if (!publicSettings.exists()) batch.set(doc(db, 'settings', 'public'), { ...INITIAL_SETTINGS, ...legacySettings, commercialPrice: 49.9 });
    const legacy = [
      ['conservatoria_places', 'places'], ['conservatoria_routes', 'routes'], ['conservatoria_guides', 'guides'],
      ['conservatoria_reviews', 'reviews'], ['conservatoria_reports', 'reports'],
    ] as const;
    for (const [key, collectionName] of legacy) {
      try {
        const records = JSON.parse(localStorage.getItem(key) || '[]') as Array<Record<string, unknown>>;
        for (const record of records) {
          if (typeof record.id !== 'string' || writes >= 400) continue;
          const { latitude: _latitude, longitude: _longitude, coordinatesVerified: _coordinatesVerified, coordinateSourceUrl: _coordinateSourceUrl, role: _role, ...untrusted } = record;
          const { merchantId: _merchantId, merchantName: _merchantName, merchantUserId: _merchantUserId, userId: _userId, ...withoutClientOwnership } = untrusted;
          const { geometry: _geometry, polyline: _polyline, waypoints: _waypoints, distance: _distance, distanceMeters: _distanceMeters, distanceKm: _distanceKm, coordinates: _coordinates, path: _path, ...routeSafe } = withoutClientOwnership;
          const safe = collectionName === 'places'
            ? { ...withoutClientOwnership, status: 'PENDING_APPROVAL', verified: false, featured: false, isSponsored: false, rating: 0, reviewCount: 0 }
            : collectionName === 'guides'
              ? { ...withoutClientOwnership, status: 'PENDING_APPROVAL', verified: false, featured: false, rating: 0, reviewsCount: 0, monthlySubscriptionPrice: 49.9 }
              : collectionName === 'routes' ? { ...routeSafe, published: false, durationEstimate: 'Não informado' }
              : collectionName === 'reviews' ? null : withoutClientOwnership;
          if (safe) batch.set(doc(db, collectionName, record.id), safe, { merge: true });
          writes += 1;
        }
      } catch (error) { reportError(`legacy ${key} migration`, error); }
    }
    batch.set(migration, { migratedBy: auth.currentUser.uid, completedAt: serverTimestamp(), writes });
    await batch.commit();
    // Legacy values have no trustworthy ownership mapping. Keep the source keys so
    // skipped records (including reviews, users, favorites, and batches over 400)
    // remain available for a reviewed import instead of silently deleting data.
  }

  const requestGpsPermission = (onSuccess?: (loc: { lat: number; lng: number }) => void, onError?: (err: string) => void) => {
    if (!('geolocation' in navigator)) { const message = 'Geolocalização não suportada neste navegador.'; setGpsError(message); onError?.(message); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      const location = { lat: position.coords.latitude, lng: position.coords.longitude };
      setUserLocation(location); setGpsAccuracy(Math.round(position.coords.accuracy)); setGpsActive(true); setGpsError(null); onSuccess?.(location);
    }, (error) => { console.warn('Geolocation error:', error.code); setGpsActive(false); setUserLocation(null); const message = 'Localização indisponível. Confira a permissão do navegador.'; setGpsError(message); onError?.(message); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
  };

  const toggleFavorite = async (placeId: string) => {
    if (!auth.currentUser) { console.info('Entre na sua conta para salvar favoritos.'); return; }
    const favoriteRef = doc(db, 'users', auth.currentUser.uid, 'favorites', placeId);
    try { if (favorites.includes(placeId)) await deleteDoc(favoriteRef); else await setDoc(favoriteRef, { createdAt: serverTimestamp() }); }
    catch (error) { reportError('favorite update', error); }
  };
  const isFavorite = (placeId: string) => favorites.includes(placeId);
  const logout = () => { void signOutFromFirebase(); setCurrentUser(null); setFavorites([]); };
  const loginWithGoogle = async (targetRole: 'TURISTA' | 'COMERCIANTE' | 'SUPER_ADMIN' = 'TURISTA') => {
    try {
      const result = await signInWithGoogle();
      if (!result.success || !result.user) return { success: false, error: result.error || 'Falha na autenticação.' };
      if (targetRole === 'SUPER_ADMIN') await requestAdminClaim();
      const token = await result.user.getIdTokenResult(true);
      if (targetRole === 'SUPER_ADMIN' && token.claims.admin !== true) return { success: false, error: 'Esta conta não possui autorização administrativa.' };
      const profileRef = doc(db, 'users', result.user.uid);
      if (!(await getDoc(profileRef)).exists()) await setDoc(profileRef, { name: result.user.displayName || '', email: result.user.email || '', phone: result.user.phoneNumber || '', createdAt: serverTimestamp() });
      const user: User = { id: result.user.uid, name: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário', email: result.user.email || '', phone: result.user.phoneNumber || '', role: token.claims.admin === true ? 'SUPER_ADMIN' : targetRole === 'COMERCIANTE' ? 'COMERCIANTE' : 'TURISTA', createdAt: result.user.metadata.creationTime || new Date().toISOString() };
      setCurrentUser(user);
      return { success: true, user };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Falha na autenticação.' }; }
  };

  const registerMerchant = async (data: { name: string; email: string; businessName: string; phone: string; whatsapp: string; category: Place['category'] }): Promise<User> => {
    if (!auth.currentUser) throw new Error('Autentique-se com o Google antes de cadastrar seu negócio.');
    const businessId = doc(collection(db, 'places')).id;
    const merchantUser: User = { id: auth.currentUser.uid, name: data.name, email: auth.currentUser.email || data.email, role: 'COMERCIANTE', phone: data.phone, whatsapp: data.whatsapp, merchantBusinessId: businessId, createdAt: new Date().toISOString() };
    const business = {
      id: businessId, name: data.businessName, category: data.category, categoryLabel: data.category, type: 'business',
      description: 'Estabelecimento recém-cadastrado no Guia Comercial de Conservatória.', shortDescription: `${data.businessName} em Conservatória`,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80', gallery: [], address: '', hours: '', phone: data.phone, whatsapp: data.whatsapp,
      featured: false, verified: false, badgeText: 'COMÉRCIO', rating: 0, reviewCount: 0, status: 'PENDING_PAYMENT', merchantId: auth.currentUser.uid, merchantName: data.name, createdAt: serverTimestamp(), isSponsored: false,
    };
    await setDoc(doc(db, 'places', businessId), business);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { name: data.name, phone: data.phone });
    setCurrentUser(merchantUser);
    return merchantUser;
  };

  const addPlace = async (place: Omit<Place, 'id' | 'createdAt'>) => {
    const id = doc(collection(db, 'places')).id; const value = { ...place, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'places', id), value); return value;
  };
  const updatePlace = async (id: string, updates: Partial<Place>) => {
    const firestoreUpdates = Object.fromEntries(Object.entries(updates).map(([key, value]) => [key, value === undefined ? deleteField() : value]));
    await updateDoc(doc(db, 'places', id), firestoreUpdates);
  };
  const deletePlace = async (id: string) => deleteDoc(doc(db, 'places', id));
  const updateBusinessStatus = async (id: string, status: BusinessStatus) => updatePlace(id, { status });
  const addRoute = async (route: Omit<TouristRoute, 'id'>) => { const id = doc(collection(db, 'routes')).id; await setDoc(doc(db, 'routes', id), { ...route, id }); };
  const updateRoute = async (id: string, updates: Partial<TouristRoute>) => updateDoc(doc(db, 'routes', id), updates);
  const deleteRoute = async (id: string) => deleteDoc(doc(db, 'routes', id));
  const addGuide = async (guide: Omit<TourGuide, 'id' | 'rating' | 'reviewsCount' | 'verified'>) => {
    if (!auth.currentUser) throw new Error('Entre na sua conta para cadastrar seu perfil de guia.');
    const id = doc(collection(db, 'guides')).id;
    const value: TourGuide = { ...guide, id, rating: 0, reviewsCount: 0, verified: false, status: 'PENDING_PAYMENT', monthlySubscriptionPrice: 49.9, merchantUserId: auth.currentUser.uid };
    await setDoc(doc(db, 'guides', id), value); return value;
  };
  const updateGuide = async (id: string, updates: Partial<TourGuide>) => updateDoc(doc(db, 'guides', id), updates);
  const deleteGuide = async (id: string) => deleteDoc(doc(db, 'guides', id));
  const updateGuideStatus = async (id: string, status: BusinessStatus) => updateGuide(id, { status });
  const addReview = async (placeId: string, rating: number, comment: string, userName: string) => {
    if (!auth.currentUser) throw new Error('Entre na sua conta para avaliar.');
    const id = doc(collection(db, 'reviews')).id;
    await setDoc(doc(db, 'reviews', id), { placeId, userId: auth.currentUser.uid, userName: userName.trim() || auth.currentUser.displayName || 'Turista', rating, comment: comment.trim(), createdAt: serverTimestamp(), hidden: false });
  };
  const deleteReview = async (id: string) => deleteDoc(doc(db, 'reviews', id));
  const addReport = async (report: Omit<Report, 'id' | 'userId' | 'createdAt' | 'resolved'>) => {
    if (!auth.currentUser) throw new Error('Entre na sua conta para enviar uma denúncia.');
    const id = doc(collection(db, 'reports')).id; await setDoc(doc(db, 'reports', id), { ...report, userId: auth.currentUser.uid, id, createdAt: serverTimestamp(), resolved: false });
  };
  const resolveReport = async (id: string) => updateDoc(doc(db, 'reports', id), { resolved: true });
  const updateSettings = async (updates: Partial<AppSettings>) => setDoc(doc(db, 'settings', 'public'), { ...updates, commercialPrice: 49.9 }, { merge: true });

  return <AppContext.Provider value={{ places, addPlace, updatePlace, deletePlace, updateBusinessStatus, routes, addRoute, updateRoute, deleteRoute, guides, addGuide, updateGuide, deleteGuide, updateGuideStatus, currentUser, loginWithGoogle, logout, registerMerchant, favorites, toggleFavorite, isFavorite, userLocation, setUserLocation, gpsAccuracy, setGpsAccuracy, gpsActive, setGpsActive, gpsError, setGpsError, requestGpsPermission, selectedPlace, setSelectedPlace, activeRoute, setActiveRoute, reviews, addReview, deleteReview, reports, addReport, resolveReport, payments, settings, updateSettings, connectionError }}>{children}</AppContext.Provider>;
}

export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('useApp must be used within an AppProvider'); return context; }
