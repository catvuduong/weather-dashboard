import { WeatherIcon } from './weather-icon';
import { dayLabel, describeWeather, formatTemp, type DayPoint, type Unit } from '@/lib/weather';

type Props = {
  days: DayPoint[] | null;
  unit: Unit;
};

export function DailyForecast({ days, unit }: Props) {
  return (
    <section className="card card-forecast" aria-labelledby="forecast-title">
      <h2 id="forecast-title">7-day forecast</h2>

      {days ? (
        <ol className="forecast-row">
          {days.map((day, index) => {
            const condition = describeWeather(day.weatherCode);
            return (
              <li key={day.date} className="forecast-day" data-testid="forecast-day">
                <p className="forecast-name">{dayLabel(day.date, index)}</p>
                <WeatherIcon icon={condition.icon} isDay size={44} />
                <p className="forecast-temps">
                  <span className="forecast-max">{formatTemp(day.max, unit)}</span>
                  <span className="forecast-min">{formatTemp(day.min, unit)}</span>
                </p>
                <p className="forecast-label">{condition.label}</p>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="forecast-row">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="skeleton forecast-skeleton" data-testid="skeleton" />
          ))}
        </div>
      )}
    </section>
  );
}
