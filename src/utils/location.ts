import { Place } from '../types';

export function hasVerifiedCoordinates(place: Place): place is Place & { latitude: number; longitude: number } {
  let hasHttpsSource = false;
  try { hasHttpsSource = typeof place.coordinateSourceUrl === 'string' && new URL(place.coordinateSourceUrl).protocol === 'https:'; } catch { /* invalid or missing source */ }
  return place.coordinatesVerified === true && hasHttpsSource
    && typeof place.latitude === 'number' && Number.isFinite(place.latitude) && place.latitude >= -90 && place.latitude <= 90
    && typeof place.longitude === 'number' && Number.isFinite(place.longitude) && place.longitude >= -180 && place.longitude <= 180;
}
