'use client';

import type { ExerciseListItem, MuscleGroup } from '@onemore/shared';
import { EXERCISE_CATALOG_LIMIT } from '@onemore/shared';
import { useEffect, useId, useRef, useState } from 'react';

import { MuscleGroupFilter } from '@/components/muscle-group-filter';
import { ThemedTextInput } from '@/components/themed-text-input';
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
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const searchRequestRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const shouldSearch = trimmed.length >= MIN_QUERY_LENGTH || muscle !== '';
    if (!shouldSearch) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    const handle = window.setTimeout(() => {
      void searchExercisesClient(accessToken, trimmed, {
        ...(muscle ? { muscle } : {}),
        limit: EXERCISE_CATALOG_LIMIT,
        locale,
      })
        .then((exercises) => {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setResults(exercises);
          setIsOpen(true);
        })
        .catch((error: unknown) => {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setResults([]);
          setSearchError(error instanceof Error ? error.message : noResultsLabel);
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
  }, [accessToken, locale, muscle, noResultsLabel, query]);

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

  async function loadBrowseResults(): Promise<void> {
    setIsSearching(true);
    setSearchError(null);
    try {
      const exercises = await searchExercisesClient(accessToken, '', {
        ...(muscle ? { muscle } : {}),
        limit: EXERCISE_CATALOG_LIMIT,
        locale,
      });
      setResults(exercises);
      setIsOpen(true);
    } catch (error: unknown) {
      setResults([]);
      setSearchError(error instanceof Error ? error.message : noResultsLabel);
      setIsOpen(true);
    } finally {
      setIsSearching(false);
    }
  }

  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= MIN_QUERY_LENGTH || muscle !== '';
  const showDropdown =
    isOpen && (shouldSearch || results.length > 0 || isSearching || searchError !== null);

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
        <ThemedTextInput
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
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
            if (!shouldSearch && results.length === 0) {
              void loadBrowseResults();
              return;
            }
            if (shouldSearch) {
              setIsOpen(true);
            }
          }}
        />

        {showDropdown && (
          <ul
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-input bg-background shadow-md"
            id={listboxId}
            role="listbox"
          >
            {isSearching && (
              <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                {searchingLabel}
              </li>
            )}
            {searchError ? (
              <li className="px-3 py-2 text-sm text-destructive" role="presentation">
                {searchError}
              </li>
            ) : null}
            {!isSearching && !searchError && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                {noResultsLabel}
              </li>
            )}
            {!isSearching &&
              !searchError &&
              results.map((exercise) => (
                <li key={exercise.id} role="presentation">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60"
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
