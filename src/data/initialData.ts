import { AppSettings } from '../types';

// Empty catalogues must remain empty until an administrator publishes verified Firestore records.
export const INITIAL_SETTINGS: AppSettings = {
  appName: 'Conservatória Turismo',
  appSubtitle: 'Guia turístico digital de Conservatória',
  commercialPrice: 49.9,
  subscriptionMonths: 1,
  contactEmail: '',
  contactWhatsapp: '',
  bannerHeadline: 'Conheça Conservatória',
  bannerSubtext: 'As informações turísticas serão exibidas após cadastro e publicação no catálogo.',
  bannerActive: false,
};
