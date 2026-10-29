import { useId, type ReactNode } from 'react';
import type { IconName } from '@/lib/weather';

type Props = {
  icon: IconName;
  isDay: boolean;
  size?: number;
};

const SUN = '#ffd23f';
const MOON = '#e4ebff';
const CLOUD = '#f4f7fb';

function Sun({ x, y, r }: { x: number; y: number; r: number }) {
  const rays = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4;
    return {
      x1: x + Math.cos(angle) * (r + 3),
      y1: y + Math.sin(angle) * (r + 3),
      x2: x + Math.cos(angle) * (r + 7),
      y2: y + Math.sin(angle) * (r + 7),
    };
  });
  return (
    <g>
      {rays.map((ray, index) => (
        <line key={index} {...ray} stroke={SUN} strokeWidth={2.5} strokeLinecap="round" />
      ))}
      <circle cx={x} cy={y} r={r} fill={SUN} />
    </g>
  );
}

function Moon({ x, y, r, maskId }: { x: number; y: number; r: number; maskId: string }) {
  return (
    <g>
      <mask id={maskId}>
        <rect width="48" height="48" fill="#fff" />
        <circle cx={x + r * 0.5} cy={y - r * 0.35} r={r * 0.9} fill="#000" />
      </mask>
      <circle cx={x} cy={y} r={r} fill={MOON} mask={`url(#${maskId})`} />
    </g>
  );
}

function Cloud({ dy = 0 }: { dy?: number }) {
  return (
    <g fill={CLOUD} transform={`translate(0 ${dy})`}>
      <circle cx="18" cy="31" r="6" />
      <circle cx="27" cy="26" r="9" />
      <circle cx="35" cy="31" r="5" />
      <rect x="12" y="30" width="28" height="7" rx="3.5" />
    </g>
  );
}

export function WeatherIcon({ icon, isDay, size = 48 }: Props) {
  const maskId = `moon-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  let art: ReactNode;
  switch (icon) {
    case 'clear':
      art = isDay ? <Sun x={24} y={24} r={9} /> : <Moon x={24} y={24} r={12} maskId={maskId} />;
      break;
    case 'partly':
      art = (
        <>
          {isDay ? <Sun x={16} y={16} r={5} /> : <Moon x={16} y={16} r={7} maskId={maskId} />}
          <Cloud dy={3} />
        </>
      );
      break;
    case 'cloud':
      art = <Cloud />;
      break;
    case 'fog':
      art = (
        <g stroke="#cfd8e3" strokeWidth={3} strokeLinecap="round">
          <line x1="10" y1="17" x2="38" y2="17" />
          <line x1="14" y1="25" x2="42" y2="25" />
          <line x1="8" y1="33" x2="36" y2="33" />
        </g>
      );
      break;
    case 'rain':
      art = (
        <>
          <Cloud dy={-4} />
          <g stroke="#7cc4ff" strokeWidth={2.5} strokeLinecap="round">
            <line x1="18" y1="39" x2="16" y2="45" />
            <line x1="26" y1="39" x2="24" y2="45" />
            <line x1="34" y1="39" x2="32" y2="45" />
          </g>
        </>
      );
      break;
    case 'snow':
      art = (
        <>
          <Cloud dy={-4} />
          <g fill="#ffffff">
            <circle cx="18" cy="42" r="2" />
            <circle cx="26" cy="44" r="2" />
            <circle cx="34" cy="42" r="2" />
          </g>
        </>
      );
      break;
    case 'storm':
      art = (
        <>
          <Cloud dy={-4} />
          <polygon points="27,34 20,43 25,43 22,48 31,39 26,39 29,34" fill={SUN} />
        </>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="weather-icon"
      data-icon={icon}
    >
      {art}
    </svg>
  );
}
