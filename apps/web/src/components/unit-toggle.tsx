import type { Unit } from '@/lib/weather';

type Props = {
  unit: Unit;
  onChange: (unit: Unit) => void;
};

export function UnitToggle({ unit, onChange }: Props) {
  const next: Unit = unit === 'C' ? 'F' : 'C';
  return (
    <button
      type="button"
      data-testid="unit-toggle"
      className="unit-toggle"
      aria-label={`Show temperatures in ${next === 'C' ? 'Celsius' : 'Fahrenheit'}`}
      onClick={() => onChange(next)}
    >
      <span className={unit === 'C' ? 'active' : undefined}>°C</span>
      <span className={unit === 'F' ? 'active' : undefined}>°F</span>
    </button>
  );
}
