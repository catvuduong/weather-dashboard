import type { Page, Route } from '@playwright/test';

// Fixed Open-Meteo responses so the e2e suite never depends on the network or on the current time.
// Everything is keyed off the city's latitude, which is what the app sends with each forecast request.

export const GEOCODING_PATTERN = 'https://geocoding-api.open-meteo.com/**';
export const FORECAST_PATTERN = 'https://api.open-meteo.com/**';

type MockCity = {
  name: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  temperature: number;
  weatherCode: number;
  uvIndex: number;
};

export const CITIES: MockCity[] = [
  { name: 'Ho Chi Minh City', country: 'Vietnam', admin1: 'Ho Chi Minh City', latitude: 10.8231, longitude: 106.6297, temperature: 30, weatherCode: 2, uvIndex: 9.4 },
  { name: 'Hanoi', country: 'Vietnam', admin1: 'Hanoi', latitude: 21.0285, longitude: 105.8542, temperature: 22, weatherCode: 61, uvIndex: 4.1 },
  { name: 'Da Nang', country: 'Vietnam', admin1: 'Da Nang', latitude: 16.0544, longitude: 108.2022, temperature: 27, weatherCode: 1, uvIndex: 8.2 },
  { name: 'Hue', country: 'Vietnam', admin1: 'Thua Thien Hue', latitude: 16.4637, longitude: 107.5909, temperature: 26, weatherCode: 3, uvIndex: 6.0 },
  { name: 'Can Tho', country: 'Vietnam', admin1: 'Can Tho', latitude: 10.0452, longitude: 105.7469, temperature: 31, weatherCode: 0, uvIndex: 9.9 },
  { name: 'Nha Trang', country: 'Vietnam', admin1: 'Khanh Hoa', latitude: 12.2388, longitude: 109.1967, temperature: 28, weatherCode: 1, uvIndex: 10.2 },
  { name: 'Hai Phong', country: 'Vietnam', admin1: 'Hai Phong', latitude: 20.8449, longitude: 106.6881, temperature: 23, weatherCode: 3, uvIndex: 3.7 },
];

const CORS = { 'access-control-allow-origin': '*' };

// The mock "now" is 14:00 on 30 Oct 2026, so the hourly window starts at index 14.
const isoDate = (offset: number) => new Date(Date.UTC(2026, 9, 30) + offset * 86_400_000).toISOString().slice(0, 10);
const pad = (value: number) => String(value).padStart(2, '0');

function geocodingResponse(name: string) {
  const query = name.toLowerCase();
  const results = CITIES.filter((city) => city.name.toLowerCase().includes(query)).map((city, index) => ({
    id: index + 1,
    name: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    country: city.country,
    admin1: city.admin1,
    timezone: 'Asia/Ho_Chi_Minh',
  }));
  // Open-Meteo leaves `results` out entirely when nothing matches.
  return results.length > 0 ? { results } : {};
}

function forecastResponse(city: MockCity) {
  const days = Array.from({ length: 7 }, (_, day) => isoDate(day));
  const hours = Array.from({ length: 168 }, (_, index) => index);

  return {
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: 'Asia/Ho_Chi_Minh',
    current: {
      time: '2026-10-30T14:00',
      interval: 900,
      temperature_2m: city.temperature,
      apparent_temperature: city.temperature + 4,
      relative_humidity_2m: 74,
      wind_speed_10m: 12,
      weather_code: city.weatherCode,
      is_day: 1,
    },
    hourly: {
      time: hours.map((index) => `${days[Math.floor(index / 24)]}T${pad(index % 24)}:00`),
      temperature_2m: hours.map((index) => Number((city.temperature + 3 * Math.sin((((index % 24) - 9) / 24) * 2 * Math.PI)).toFixed(1))),
      precipitation: hours.map((index) => (city.weatherCode >= 51 && index % 24 >= 12 && index % 24 < 18 ? 0.6 : 0)),
    },
    daily: {
      time: days,
      weather_code: [city.weatherCode, 1, 2, 3, 61, 0, 2],
      temperature_2m_max: days.map((_, day) => city.temperature + 3 - (day % 3)),
      temperature_2m_min: days.map((_, day) => city.temperature - 4 + (day % 2)),
      sunrise: days.map((date) => `${date}T05:44`),
      sunset: days.map((date) => `${date}T17:52`),
      uv_index_max: days.map((_, day) => (day === 0 ? city.uvIndex : Math.max(city.uvIndex - day, 0))),
    },
  };
}

function fulfillGeocoding(route: Route) {
  const name = new URL(route.request().url()).searchParams.get('name') ?? '';
  return route.fulfill({ json: geocodingResponse(name), headers: CORS });
}

function fulfillForecast(route: Route) {
  const latitude = Number(new URL(route.request().url()).searchParams.get('latitude'));
  const city = CITIES.find((item) => Math.abs(item.latitude - latitude) < 0.0001);
  if (!city) {
    return route.fulfill({ status: 400, json: { error: true, reason: 'Unknown mock location' }, headers: CORS });
  }
  return route.fulfill({ json: forecastResponse(city), headers: CORS });
}

export async function mockOpenMeteo(page: Page) {
  await page.route(GEOCODING_PATTERN, fulfillGeocoding);
  await page.route(FORECAST_PATTERN, fulfillForecast);
}
