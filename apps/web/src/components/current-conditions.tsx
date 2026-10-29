import { WeatherIcon } from './weather-icon';
import {
  describeWeather,
  formatTemp,
  formatWind,
  type City,
  type Current,
  type Unit,
} from '@/lib/weather';

export type LoadStatus = 'loading' | 'ready' | 'error';

type Props = {
  city: City;
  status: LoadStatus;
  current: Current | null;
  offline: boolean;
  unit: Unit;
  onRetry: () => void;
};

export function CurrentConditions({ city, status, current, offline, unit, onRetry }: Props) {
  return (
    <section className="card card-now" aria-labelledby="city-name">
      <p className="eyebrow">Right now</p>
      <h1 id="city-name" className="city-name">
        {city.name}
      </h1>
      {city.country && <p className="country">{city.country}</p>}

      {status === 'loading' && (
        <div className="now-skeleton" role="status" aria-label="Loading current conditions">
          <div className="skeleton" data-testid="skeleton" style={{ height: 88, width: '60%' }} />
          <div className="skeleton" data-testid="skeleton" style={{ height: 20, width: '40%' }} />
          <div className="stats">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="skeleton" data-testid="skeleton" style={{ height: 58 }} />
            ))}
          </div>
        </div>
      )}

      {status === 'error' && <ErrorPanel offline={offline} onRetry={onRetry} />}

      {status === 'ready' && current && <Details current={current} unit={unit} />}
    </section>
  );
}

function Details({ current, unit }: { current: Current; unit: Unit }) {
  const condition = describeWeather(current.weatherCode);
  return (
    <>
      <div className="now-main">
        <WeatherIcon icon={condition.icon} isDay={current.isDay} size={96} />
        <div>
          <p className="now-temp" data-testid="current-temp">
            {formatTemp(current.temperature, unit)}
          </p>
          <p className="now-condition">{condition.label}</p>
        </div>
      </div>
      <dl className="stats">
        <Stat label="Feels like" value={formatTemp(current.apparentTemperature, unit)} />
        <Stat label="Wind" value={formatWind(current.windSpeed, unit)} />
        <Stat label="Humidity" value={`${Math.round(current.humidity)}%`} />
        <Stat label="UV index" value={String(Math.round(current.uvIndex))} />
        <Stat label="Sunrise" value={current.sunrise} />
        <Stat label="Sunset" value={current.sunset} />
      </dl>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ErrorPanel({ offline, onRetry }: { offline: boolean; onRetry: () => void }) {
  return (
    <div className="error-panel" role="alert" data-testid="error-panel">
      <p>
        {offline
          ? "You're offline. Check your connection, then try again."
          : "Weather data couldn't be loaded right now."}
      </p>
      <button type="button" className="button" data-testid="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
