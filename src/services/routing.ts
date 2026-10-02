export interface GeoPoint { latitude: number; longitude: number }
export interface RealRoute {
  geometry: Array<[latitude: number, longitude: number]>;
  distanceMeters: number;
  durationSeconds: number;
}

/** Adapter for a configured OSRM-compatible routing service. No straight-line fallback is returned. */
export async function requestRoadRoute(origin: GeoPoint, destination: GeoPoint, profile: 'driving' | 'foot' | 'cycling' = 'foot'): Promise<RealRoute> {
  const endpoint = import.meta.env.VITE_ROUTING_API_URL;
  if (!endpoint) throw new Error('Serviço de roteamento ainda não configurado.');
  const points = [origin, destination];
  if (points.some(({ latitude, longitude }) => !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
    throw new Error('As coordenadas para solicitar a rota são inválidas.');
  }
  const base = new URL(endpoint);
  if (base.protocol !== 'https:') throw new Error('O serviço de roteamento precisa usar HTTPS.');
  const coords = points.map(({ latitude, longitude }) => `${longitude},${latitude}`).join(';');
  const response = await fetch(new URL(`route/v1/${profile}/${coords}?overview=full&geometries=geojson`, `${base.href.replace(/\/?$/, '/')}`));
  if (!response.ok) throw new Error(`Roteamento indisponível (${response.status}).`);
  const result = await response.json() as {
    code?: string;
    routes?: Array<{ distance?: number; duration?: number; geometry?: { coordinates?: Array<[number, number]> } }>;
  };
  const route = result.code === 'Ok' ? result.routes?.[0] : undefined;
  const coordinates = route?.geometry?.coordinates;
  if (!route || !coordinates || coordinates.length < 2 || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)
    || coordinates.some(([longitude, latitude]) => !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
    throw new Error('O serviço não retornou uma rota válida.');
  }
  return { geometry: coordinates.map(([longitude, latitude]) => [latitude, longitude]), distanceMeters: route.distance!, durationSeconds: route.duration! };
}
