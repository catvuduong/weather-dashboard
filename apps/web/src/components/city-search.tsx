'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { searchCities, type City } from '@/lib/weather';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

type SearchState = 'idle' | 'loading' | 'ready' | 'error';

type Props = {
  recent: City[];
  onSelect: (city: City) => void;
};

export function CitySearch({ recent, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<number | undefined>(undefined);
  const request = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current);
      request.current?.abort();
    };
  }, []);

  const searching = query.trim().length >= MIN_QUERY_LENGTH;
  const items = searching ? results : recent;
  const listOpen = open && (items.length > 0 || (searching && searchState !== 'idle'));

  function handleChange(value: string) {
    setQuery(value);
    setActive(-1);
    setOpen(true);
    window.clearTimeout(timer.current);
    request.current?.abort();

    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearchState('idle');
      return;
    }

    setSearchState('loading');
    timer.current = window.setTimeout(() => {
      const controller = new AbortController();
      request.current = controller;
      searchCities(trimmed, controller.signal).then(
        (found) => {
          setResults(found);
          setSearchState('ready');
        },
        () => {
          if (!controller.signal.aborted) {
            setSearchState('error');
          }
        },
      );
    }, DEBOUNCE_MS);
  }

  function choose(city: City) {
    window.clearTimeout(timer.current);
    request.current?.abort();
    onSelect(city);
    setQuery('');
    setResults([]);
    setSearchState('idle');
    setActive(-1);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, -1));
    } else if (event.key === 'Enter') {
      const pick = items[active] ?? (searching ? results[0] : undefined);
      if (pick) {
        event.preventDefault();
        choose(pick);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  let message: string | null = null;
  if (listOpen && searching && searchState === 'loading' && results.length === 0) {
    message = 'Searching…';
  } else if (listOpen && searching && searchState === 'error') {
    message = "Couldn't search cities. Try again in a moment.";
  } else if (listOpen && searching && searchState === 'ready' && results.length === 0) {
    message = 'No matching cities';
  }

  return (
    <div className="search">
      <input
        type="search"
        data-testid="city-search"
        role="combobox"
        aria-label="Search for a city"
        aria-autocomplete="list"
        aria-expanded={listOpen}
        aria-controls="city-suggestions"
        aria-activedescendant={listOpen && active >= 0 ? `city-option-${active}` : undefined}
        placeholder="Search for a city"
        autoComplete="off"
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {listOpen && (
        <div className="suggestions">
          {!searching && items.length > 0 && <p className="suggestions-label">Recent searches</p>}
          <ul id="city-suggestions" role="listbox" aria-label="Cities">
            {items.map((city, index) => (
              <li
                key={`${city.latitude},${city.longitude}`}
                id={`city-option-${index}`}
                role="option"
                aria-selected={index === active}
                data-testid="city-option"
                className="suggestion"
                // Keep focus in the input so the list is still open when the click lands.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(city)}
              >
                <span>{city.name}</span>
                <span className="suggestion-meta">{city.country}</span>
              </li>
            ))}
          </ul>
          {message && (
            <p className="suggestions-note" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
