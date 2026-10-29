export type Unit = 'C' | 'F';

export type City = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

export const DEFAULT_CITY: City = {
  name: 'Ho Chi Minh City',
  country: 'Vietnam',
  latitude: 10.8231,
  longitude: 106.6297,
};

export type Current = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  uvIndex: number;
  sunrise: string;
  sunset: string;
};

export type HourPoint = {
  time: string;
  temperature: number;
  precipitation: number;
};

export type DayPoint = {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
};

export type Forecast = {
  current: Current;
  hourly: HourPoint[];
  daily: DayPoint[];
};

type GeocodingResponse = {
  results?: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }[];
};

export type ForecastResponse = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
};

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const params = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' });
  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }
  const data = (await response.json()) as GeocodingResponse;
  return (data.results ?? []).map((result) => ({
    name: result.name,
    country: result.country ?? '',
    admin1: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

export async function fetchForecast(city: City, signal?: AbortSignal): Promise<Forecast> {
  // Always request metric units; the UI converts, so the unit toggle never refetches.
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    hourly: 'temperature_2m,precipitation',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  });
  const response = await fetch(`${FORECAST_URL}?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Forecast failed with status ${response.status}`);
  }
  return parseForecast((await response.json()) as ForecastResponse);
}

// Times come back in the city's local time as "YYYY-MM-DDTHH:MM", so slicing gives the clock time.
const clock = (time: string) => time.slice(11, 16);

export function parseForecast(raw: ForecastResponse): Forecast {
  const start = Math.max(0, raw.hourly.time.findIndex((time) => time >= raw.current.time));

  const hourly = raw.hourly.time.slice(start, start + 24).map((time, offset) => ({
    time: clock(time),
    temperature: raw.hourly.temperature_2m[start + offset],
    precipitation: raw.hourly.precipitation[start + offset],
  }));

  const daily = raw.daily.time.map((date, index) => ({
    date,
    weatherCode: raw.daily.weather_code[index],
    max: raw.daily.temperature_2m_max[index],
    min: raw.daily.temperature_2m_min[index],
  }));

  return {
    current: {
      temperature: raw.current.temperature_2m,
      apparentTemperature: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      windSpeed: raw.current.wind_speed_10m,
      weatherCode: raw.current.weather_code,
      isDay: raw.current.is_day === 1,
      uvIndex: raw.daily.uv_index_max[0],
      sunrise: clock(raw.daily.sunrise[0]),
      sunset: clock(raw.daily.sunset[0]),
    },
    hourly,
    daily,
  };
}

export type Category = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export type IconName = 'clear' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

export type Condition = {
  label: string;
  category: Category;
  icon: IconName;
};

// WMO weather interpretation codes used by Open-Meteo.
const CONDITIONS: Record<number, Condition> = {
  0: { label: 'Clear sky', category: 'clear', icon: 'clear' },
  1: { label: 'Mainly clear', category: 'clear', icon: 'partly' },
  2: { label: 'Partly cloudy', category: 'cloudy', icon: 'partly' },
  3: { label: 'Overcast', category: 'cloudy', icon: 'cloud' },
  45: { label: 'Fog', category: 'fog', icon: 'fog' },
  48: { label: 'Rime fog', category: 'fog', icon: 'fog' },
  51: { label: 'Light drizzle', category: 'rain', icon: 'rain' },
  53: { label: 'Drizzle', category: 'rain', icon: 'rain' },
  55: { label: 'Heavy drizzle', category: 'rain', icon: 'rain' },
  56: { label: 'Freezing drizzle', category: 'rain', icon: 'rain' },
  57: { label: 'Heavy freezing drizzle', category: 'rain', icon: 'rain' },
  61: { label: 'Light rain', category: 'rain', icon: 'rain' },
  63: { label: 'Rain', category: 'rain', icon: 'rain' },
  65: { label: 'Heavy rain', category: 'rain', icon: 'rain' },
  66: { label: 'Freezing rain', category: 'rain', icon: 'rain' },
  67: { label: 'Heavy freezing rain', category: 'rain', icon: 'rain' },
  71: { label: 'Light snow', category: 'snow', icon: 'snow' },
  73: { label: 'Snow', category: 'snow', icon: 'snow' },
  75: { label: 'Heavy snow', category: 'snow', icon: 'snow' },
  77: { label: 'Snow grains', category: 'snow', icon: 'snow' },
  80: { label: 'Light showers', category: 'rain', icon: 'rain' },
  81: { label: 'Showers', category: 'rain', icon: 'rain' },
  82: { label: 'Violent showers', category: 'rain', icon: 'rain' },
  85: { label: 'Snow showers', category: 'snow', icon: 'snow' },
  86: { label: 'Heavy snow showers', category: 'snow', icon: 'snow' },
  95: { label: 'Thunderstorm', category: 'storm', icon: 'storm' },
  96: { label: 'Thunderstorm with hail', category: 'storm', icon: 'storm' },
  99: { label: 'Thunderstorm with heavy hail', category: 'storm', icon: 'storm' },
};

export function describeWeather(code: number): Condition {
  return CONDITIONS[code] ?? { label: 'Unknown', category: 'cloudy', icon: 'cloud' };
}

export function toDisplayTemp(celsius: number, unit: Unit): number {
  return unit === 'C' ? celsius : (celsius * 9) / 5 + 32;
}

export function formatTemp(celsius: number, unit: Unit): string {
  return `${Math.round(toDisplayTemp(celsius, unit))}°${unit}`;
}

export function formatWind(kmh: number, unit: Unit): string {
  return unit === 'C' ? `${Math.round(kmh)} km/h` : `${Math.round(kmh / 1.609344)} mph`;
}

export function dayLabel(date: string, index: number): string {
  if (index === 0) {
    return 'Today';
  }
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}
