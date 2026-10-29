import type { Category } from '@/lib/weather';

type Props = {
  category: Category;
  isDay: boolean;
};

// Pure CSS: gradients and layers are styled in globals.css; no JS animation loop.
export function SkyBackground({ category, isDay }: Props) {
  const cloudy = category !== 'clear';
  return (
    <div
      aria-hidden="true"
      data-testid="sky"
      className={`sky sky--${isDay ? 'day' : 'night'} sky--${category}`}
    >
      {category === 'clear' && isDay && <div className="sky-layer sky-sun" />}
      {category === 'clear' && !isDay && <div className="sky-layer sky-stars" />}
      {cloudy && <div className="sky-layer sky-clouds" />}
      {(category === 'rain' || category === 'storm') && <div className="sky-layer sky-rain" />}
      {category === 'snow' && <div className="sky-layer sky-snow" />}
      {category === 'storm' && <div className="sky-layer sky-flash" />}
    </div>
  );
}
