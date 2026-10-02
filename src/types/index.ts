export type UserRole = 'TURISTA' | 'COMERCIANTE' | 'SUPER_ADMIN';

export type PlaceCategory = 
  | 'historico' 
  | 'museus' 
  | 'pousadas' 
  | 'gastronomia' 
  | 'cachoeiras' 
  | 'eventos' 
  | 'comercio' 
  | 'servicos';

export type BusinessStatus = 
  | 'PENDING_PAYMENT' 
  | 'PENDING_APPROVAL' 
  | 'ACTIVE' 
  | 'EXPIRED' 
  | 'CANCELLED' 
  | 'BLOCKED';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  categoryLabel?: string;
  type: 'tourist' | 'inn' | 'restaurant' | 'business' | 'service';
  description: string;
  shortDescription?: string;
  imageUrl: string;
  gallery: string[];
  latitude?: number;
  longitude?: number;
  coordinatesVerified?: boolean;
  coordinateSourceUrl?: string;
  address: string;
  hours: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  additionalInfo?: string;
  featured: boolean;
  verified: boolean;
  badgeText?: string;
  patrimonyYear?: string;
  rating: number;
  reviewCount: number;
  priceRange?: 'R$' | 'R$$' | 'R$$$' | 'R$$$$';
  audioNarrationTitle?: string;
  status: BusinessStatus;
  merchantId?: string;
  merchantName?: string;
  createdAt: string;
  isSponsored?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  whatsapp?: string;
  merchantBusinessId?: string;
  createdAt: string;
}

export interface TouristRoute {
  id: string;
  title: string;
  badge: string;
  timing: string;
  transportType: string;
  description: string;
  imageUrl: string;
  places: string[]; // Place IDs or names
  published: boolean;
  durationEstimate: string;
}

export interface Review {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  hidden: boolean;
}

export interface Report {
  id: string;
  placeId: string;
  userId: string;
  placeName: string;
  reason: 'endereco_errado' | 'negocio_inexistente' | 'informacao_incorreta' | 'conteudo_inadequado' | 'outro';
  reasonLabel: string;
  details: string;
  userContact?: string;
  createdAt: string;
  resolved: boolean;
}

export interface PaymentTransaction {
  id: string;
  merchantId: string;
  businessId: string;
  businessName: string;
  amount: number;
  method: 'PIX' | 'CREDIT_CARD';
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  pixCode?: string;
  pixQrCodeUrl?: string;
  createdAt: string;
  confirmedAt?: string;
  itemType?: 'BUSINESS' | 'GUIDE';
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  commercialPrice: number;
  subscriptionMonths: number;
  contactEmail: string;
  contactWhatsapp: string;
  bannerHeadline: string;
  bannerSubtext: string;
  bannerActive: boolean;
}

export type TourSpecialty =
  | 'seresta_historica'
  | 'fazendas_cafe'
  | 'ecoturismo_trilhas'
  | 'gastronomia_cultural'
  | 'roteiro_fotografico';

export interface TourGuide {
  id: string;
  name: string;
  cadastur: string;
  photoUrl: string;
  specialty: TourSpecialty;
  specialtyLabel: string;
  bio: string;
  experienceYears: number;
  languages: string[];
  phone: string;
  whatsapp: string;
  email: string;
  rating: number;
  reviewsCount: number;
  pricePerPerson: number;
  duration: string;
  groupPrice?: number;
  includedItems: string[];
  itineraryHighlights: string[];
  meetingPoint: string;
  availability: string;
  verified: boolean;
  featured?: boolean;
  status?: BusinessStatus;
  monthlySubscriptionPrice?: number;
  subscriptionPaidUntil?: string;
  merchantUserId?: string;
}

