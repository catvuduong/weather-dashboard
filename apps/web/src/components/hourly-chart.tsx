'use client';

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toDisplayTemp, type HourPoint, type Unit } from '@/lib/weather';

type Props = {
  points: HourPoint[] | null;
  unit: Unit;
};

const TEMP_SERIES = 'Temperature';
const RAIN_SERIES = 'Precipitation';

export function HourlyChart({ points, unit }: Props) {
  const data = points?.map((point) => ({
    time: point.time,
    [TEMP_SERIES]: Math.round(toDisplayTemp(point.temperature, unit)),
    [RAIN_SERIES]: point.precipitation,
  }));

  return (
    <section className="card card-chart" aria-labelledby="chart-title">
      <div className="card-header">
        <h2 id="chart-title">Next 24 hours</h2>
        <ul className="legend">
          <li>
            <span className="swatch swatch-temp" />
            {TEMP_SERIES}
          </li>
          <li>
            <span className="swatch swatch-rain" />
            {RAIN_SERIES} (mm)
          </li>
        </ul>
      </div>

      {data ? (
        <div className="chart-wrap" data-testid="hourly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="temp-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd166" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#ffd166" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
              <XAxis
                dataKey="time"
                minTickGap={16}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
              />
              <YAxis
                yAxisId="temp"
                width={44}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(value: number) => `${value}°`}
                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
              />
              <YAxis yAxisId="rain" orientation="right" hide domain={[0, 'dataMax + 1']} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                contentStyle={{
                  background: 'rgba(9,16,36,0.92)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 12,
                  color: '#fff',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              <Bar
                yAxisId="rain"
                dataKey={RAIN_SERIES}
                fill="#60a5fa"
                barSize={10}
                radius={[4, 4, 0, 0]}
                animationDuration={600}
              />
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey={TEMP_SERIES}
                stroke="#ffd166"
                strokeWidth={2.5}
                fill="url(#temp-fill)"
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={600}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="skeleton chart-skeleton" data-testid="skeleton" />
      )}
    </section>
  );
}
