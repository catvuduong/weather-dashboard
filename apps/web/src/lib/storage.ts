import type { City, Unit } from './weather';

const RECENT_KEY = 'weather-dashboard:recent-cities';
const UNIT_KEY = 'weather-dashboard:unit';

export const MAX_RECENT = 5;

const listeners = new Set<() => void>();

// Lets useSyncExternalStore re-read preferences after a write in this tab or another one.
export function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

// Storage can be unavailable (private mode, blocked site data), so every access is guarded.
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Persisting preferences is best effort.
    return;
  }
  listeners.forEach((listener) => listener());
}

export const readRecentSnapshot = () => read(RECENT_KEY);
export const readUnitSnapshot = () => read(UNIT_KEY);

function isCity(value: unknown): value is City {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const city = value as Record<string, unknown>;
  return (
    typeof city.name === 'string' &&
    typeof city.country === 'string' &&
    typeof city.latitude === 'number' &&
    typeof city.longitude === 'number'
  );
}

export function parseRecentCities(raw: string | null): City[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCity).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function parseUnit(raw: string | null): Unit {
  return raw === 'F' ? 'F' : 'C';
}

export function saveRecentCities(cities: City[]) {
  write(RECENT_KEY, JSON.stringify(cities.slice(0, MAX_RECENT)));
}

export function addRecentCity(recent: City[], city: City): City[] {
  const others = recent.filter((item) => item.latitude !== city.latitude || item.longitude !== city.longitude);
  return [city, ...others].slice(0, MAX_RECENT);
}

export function saveUnit(unit: Unit) {
  write(UNIT_KEY, unit);
}
