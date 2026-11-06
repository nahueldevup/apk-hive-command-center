import { PHONES } from './proteo-mock';

export type GroupColor = 'primary' | 'success' | 'warning' | 'rose';
export type LocationGroup = { id: string; name: string; description: string; color: GroupColor };
export type Location = { id: string; name: string; city: string; latitude: number; longitude: number; altitude: number; accuracy: number; timezone: string; group_id: string; is_pinned: boolean };
export const GROUPS: LocationGroup[] = [
  { id: 'ar', name: 'Argentina', description: 'Operación local', color: 'primary' },
  { id: 'latam', name: 'Latinoamérica', description: 'Operación regional', color: 'success' },
  { id: 'global', name: 'Internacional', description: 'Operación global', color: 'warning' },
];
const location = (id: string, name: string, city: string, latitude: number, longitude: number, timezone: string, group_id: string, is_pinned = false): Location => ({ id, name, city, latitude, longitude, timezone, group_id, is_pinned, altitude: 25, accuracy: 4.2 });
export const LOCATIONS = [
  location('ba', 'Buenos Aires · Centro', 'Buenos Aires, Argentina', -34.603722, -58.381592, 'America/Argentina/Buenos_Aires', 'ar', true),
  location('palermo', 'Palermo', 'Buenos Aires, Argentina', -34.5889, -58.4306, 'America/Argentina/Buenos_Aires', 'ar', true),
  location('cordoba', 'Córdoba', 'Córdoba, Argentina', -31.4201, -64.1888, 'America/Argentina/Cordoba', 'ar'),
  location('santiago', 'Santiago', 'Santiago, Chile', -33.4489, -70.6693, 'America/Santiago', 'latam', true),
  location('saopaulo', 'São Paulo', 'São Paulo, Brasil', -23.5505, -46.6333, 'America/Sao_Paulo', 'latam'),
  location('miami', 'Miami', 'Miami, Estados Unidos', 25.7617, -80.1918, 'America/New_York', 'global', true),
  location('madrid', 'Madrid', 'Madrid, España', 40.4168, -3.7038, 'Europe/Madrid', 'global'),
];
export const INITIAL_ASSIGNMENTS: Record<string, string> = { 'phone-80': 'ba', 'phone-82': 'palermo', 'phone-83': 'santiago', 'phone-85': 'ba' };
export function canAssign(id: string) { return PHONES.some(p => p.id === id && p.online); }
export function validateLocation(value: Location): string | null {
  if (!value.name.trim() || !value.city.trim()) return 'Completá el nombre y la ciudad.';
  if (!Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90) return 'La latitud debe estar entre -90 y 90.';
  if (!Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) return 'La longitud debe estar entre -180 y 180.';
  if (!Number.isFinite(value.altitude)) return 'Ingresá una altitud válida.';
  if (!Number.isFinite(value.accuracy) || value.accuracy <= 0) return 'La precisión debe ser mayor que cero.';
  try { new Intl.DateTimeFormat('es', { timeZone: value.timezone }); } catch { return 'Ingresá una zona horaria válida.'; }
  return null;
}
export function removeGroup(locations: Location[], id: string) { return locations.map(l => l.group_id === id ? { ...l, group_id: '' } : l); }