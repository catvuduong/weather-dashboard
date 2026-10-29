'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { CitySearch } from './city-search';
import { CurrentConditions, type LoadStatus } from './current-conditions';
import { DailyForecast } from './daily-forecast';
import { HourlyChart } from './hourly-chart';
import { SkyBackground } from './sky-background';
import { UnitToggle } from './unit-toggle';
import {
  addRecentCity,
  parseRecentCities,
  parseUnit,
  readRecentSnapshot,
  readUnitSnapshot,
  saveRecentCities,
  saveUnit,
  subscribe,
} from '@/lib/storage';
import {
  DEFAULT_CITY,
  describeWeather,
  fetchForecast,
  type City,
  type Forecast,
  type Unit,
} from '@/lib/weather';

type Outcome =
  | { key: string; status: 'ready'; forecast: Forecast }
  | { key: string; status: 'error'; offline: boolean };

const subscribeNothing = () => () => {};

export function WeatherDashboard() {
  // Stored preferences are only readable in the browser. The server (and the hydration pass)
  // sees empty snapshots, so the markup matches and the saved values appear right after.
  const recentRaw = useSyncExternalStore(subscribe, readRecentSnapshot, () => null);
  const storedUnitRaw = useSyncExternalStore(subscribe, readUnitSnapshot, () => null);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const recent = useMemo(() => parseRecentCities(recentRaw), [recentRaw]);

  // A city or unit chosen in this session wins over storage, so the UI still responds if storage is blocked.
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const city = selectedCity ?? recent[0] ?? DEFAULT_CITY;
  const unit = selectedUnit ?? parseUnit(storedUnitRaw);
  const requestKey = `${city.latitude},${city.longitude}#${attempt}`;

  // Wait for stored preferences first so the default city is never fetched needlessly.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const controller = new AbortController();
    fetchForecast(city, controller.signal).then(
      (forecast) => setOutcome({ key: requestKey, status: 'ready', forecast }),
      () => {
        if (!controller.signal.aborted) {
          setOutcome({ key: requestKey, status: 'error', offline: !navigator.onLine });
        }
      },
    );
    return () => controller.abort();
  }, [hydrated, city, requestKey]);

  // An outcome only counts for the request it was made for; anything else is still loading.
  const current = outcome?.key === requestKey ? outcome : null;
  const status: LoadStatus = current?.status ?? 'loading';
  const forecast = current?.status === 'ready' ? current.forecast : null;
  const offline = current?.status === 'error' && current.offline;
  const condition = forecast ? describeWeather(forecast.current.weatherCode) : null;

  function selectCity(next: City) {
    saveRecentCities(addRecentCity(recent, next));
    setSelectedCity(next);
  }

  function changeUnit(next: Unit) {
    saveUnit(next);
    setSelectedUnit(next);
  }

  return (
    <div className="dashboard">
      <SkyBackground category={condition?.category ?? 'clear'} isDay={forecast?.current.isDay ?? true} />

      <div className="dashboard-content">
        <header className="topbar">
          <p className="brand">Weather Dashboard</p>
          <CitySearch recent={recent} onSelect={selectCity} />
          <UnitToggle unit={unit} onChange={changeUnit} />
        </header>

        <div className="dashboard-grid" data-status={status}>
          <CurrentConditions
            city={city}
            status={status}
            current={forecast?.current ?? null}
            offline={offline}
            unit={unit}
            onRetry={() => setAttempt((count) => count + 1)}
          />
          {status !== 'error' && <HourlyChart points={forecast?.hourly ?? null} unit={unit} />}
          {status !== 'error' && <DailyForecast days={forecast?.daily ?? null} unit={unit} />}
        </div>
      </div>
    </div>
  );
}
