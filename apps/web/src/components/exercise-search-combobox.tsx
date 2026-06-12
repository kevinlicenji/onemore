'use client';

import type { ExerciseListItem, MuscleGroup } from '@onemore/shared';
import { useEffect, useId, useRef, useState } from 'react';

import { MuscleGroupFilter } from '@/components/muscle-group-filter';
import { getExerciseDisplayName } from '@/lib/exercise-display-name';
import { searchExercisesClient } from '@/lib/offline/workout-client';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

interface ExerciseSearchComboboxProps {
  accessToken: string;
  locale: string;
  placeholder: string;
  noResultsLabel: string;
  searchingLabel: string;
  disabled?: boolean;
  showMuscleFilter?: boolean;
  onSelect: (exercise: ExerciseListItem) => void;
}

/**
 * Typeahead exercise picker with debounced API search and dropdown results.
 */
export function ExerciseSearchCombobox({
  accessToken,
  locale,
  placeholder,
  noResultsLabel,
  searchingLabel,
  disabled = false,
  showMuscleFilter = true,
  onSelect,
}: ExerciseSearchComboboxProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | ''>('');
  const [results, setResults] = useState<ExerciseListItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const searchRequestRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const shouldSearch = trimmed.length >= MIN_QUERY_LENGTH || muscle !== '';
    if (!shouldSearch) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    const handle = window.setTimeout(() => {
      void searchExercisesClient(accessToken, trimmed, {
        ...(muscle ? { muscle } : {}),
        limit: 20,
      })
        .then((exercises) => {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setResults(exercises);
          setIsOpen(true);
        })
        .catch(() => {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setResults([]);
          setIsOpen(true);
        })
        .finally(() => {
          if (searchRequestRef.current === requestId) {
            setIsSearching(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, [accessToken, muscle, query]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= MIN_QUERY_LENGTH || muscle !== '';
  const showDropdown = isOpen && shouldSearch;

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {showMuscleFilter && (
        <MuscleGroupFilter
          value={muscle}
          onChange={(nextMuscle) => {
            setMuscle(nextMuscle);
            setIsOpen(true);
          }}
        />
      )}

      <div className="relative">
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted/30"
          disabled={disabled}
          placeholder={placeholder}
          role="combobox"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (shouldSearch) {
              setIsOpen(true);
            }
          }}
        />

        {showDropdown && (
          <ul
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background shadow-md"
            id={listboxId}
            role="listbox"
          >
            {isSearching && (
              <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                {searchingLabel}
              </li>
            )}
            {!isSearching && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                {noResultsLabel}
              </li>
            )}
            {!isSearching &&
              results.map((exercise) => (
                <li key={exercise.id} role="presentation">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
                    type="button"
                    onClick={() => {
                      onSelect(exercise);
                      setQuery('');
                      setResults([]);
                      setIsOpen(false);
                    }}
                  >
                    {getExerciseDisplayName(exercise, locale)}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
