'use client';

import type { ExerciseListItem } from '@onemore/shared';
import { EXERCISE_CATALOG_LIMIT } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useEffect, useState } from 'react';

import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';
import { GymSearchField } from '@/components/gym-ui/gym-search-field';
import { MetricInput } from '@/components/metric-input';
import { getExerciseDisplayName, sortExercisesByDisplayName } from '@/lib/exercise-display-name';
import { formatMuscleGroupsForLocale } from '@/lib/muscle-group-labels';
import { fetchExercises } from '@/lib/api-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export interface ProgramExerciseDraft {
  exerciseLibraryId: string;
  name: string;
  primaryMuscles: ExerciseListItem['primaryMuscles'];
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  targetWeightKg: number | null;
}

interface AddProgramExerciseModalProps {
  accessToken: string;
  locale: string;
  open: boolean;
  labels: {
    title: string;
    search: string;
    noResults: string;
    searching: string;
    add: string;
    cancel: string;
    targetSets: string;
    targetReps: string;
    restSeconds: string;
    targetWeight: string;
    failureReps: string;
  };
  translateMuscle: (key: ExerciseListItem['primaryMuscles'][number]) => string;
  onClose: () => void;
  onAdd: (draft: ProgramExerciseDraft) => void;
}

/**
 * Modal to pick an exercise and set prescription before adding it to a program day.
 */
export function AddProgramExerciseModal({
  accessToken,
  locale,
  open,
  labels,
  translateMuscle,
  onClose,
  onAdd,
}: AddProgramExerciseModalProps): React.ReactElement | null {
  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ExerciseListItem[]>([]);
  const [selected, setSelected] = useState<ExerciseListItem | null>(null);
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(8);
  const [restSeconds, setRestSeconds] = useState(90);
  const [targetWeightKg, setTargetWeightKg] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setSelected(null);
      setTargetSets(3);
      setTargetReps(8);
      setRestSeconds(90);
      setTargetWeightKg(null);
      setIsSearching(false);
      return;
    }

    const trimmed = search.trim();
    setIsSearching(true);
    const handle = window.setTimeout(
      () => {
        void fetchExercises(accessToken, {
          ...(trimmed.length > 0 ? { q: trimmed } : {}),
          limit: EXERCISE_CATALOG_LIMIT,
        })
          .then((items) => {
            setResults(sortExercisesByDisplayName(items, locale));
          })
          .catch(() => {
            setResults([]);
          })
          .finally(() => {
            setIsSearching(false);
          });
      },
      trimmed.length > 0 ? 250 : 0,
    );

    return () => {
      window.clearTimeout(handle);
    };
  }, [accessToken, locale, open, search]);

  if (!open) {
    return null;
  }

  function handleConfirm(): void {
    if (!selected) {
      return;
    }
    onAdd({
      exerciseLibraryId: selected.id,
      name: getExerciseDisplayName(selected, locale),
      primaryMuscles: selected.primaryMuscles,
      targetSets,
      targetReps,
      restSeconds,
      targetWeightKg,
    });
    onClose();
  }

  const listEmpty = !isSearching && results.length === 0;

  const searchInput = isDesktop ? (
    <input
      autoComplete="off"
      autoCorrect="off"
      className="w-full rounded-md border px-3 py-2 text-base"
      enterKeyHint="search"
      inputMode="search"
      placeholder={labels.search}
      type="search"
      value={search}
      onChange={(event) => {
        setSearch(event.target.value);
      }}
    />
  ) : (
    <GymSearchField placeholder={labels.search} value={search} onChange={setSearch} />
  );

  return (
    <GymAdaptiveOverlay
      ariaLabel={labels.title}
      open={open}
      tall={!isDesktop}
      title={labels.title}
      onClose={onClose}
    >
      <div className={isDesktop ? undefined : 'flex min-h-0 flex-1 flex-col gap-3'}>
        {searchInput}

        <ul
          className={
            isDesktop
              ? 'mt-3 max-h-60 overflow-y-auto rounded-md border'
              : 'min-h-[9rem] flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-gym-separator bg-gym-surface'
          }
        >
          {isSearching && (
            <li className="px-3 py-4 text-sm text-muted-foreground">{labels.searching}</li>
          )}
          {!isSearching && listEmpty && (
            <li className="px-3 py-4 text-sm text-muted-foreground">{labels.noResults}</li>
          )}
          {!isSearching &&
            results.map((exercise) => {
              const isSelected = selected?.id === exercise.id;
              return (
                <li key={exercise.id}>
                  <button
                    className="w-full px-3 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted/60 data-[selected=true]:bg-primary/10"
                    data-selected={isSelected}
                    type="button"
                    onClick={() => {
                      setSelected(exercise);
                    }}
                  >
                    <p className="font-medium">{getExerciseDisplayName(exercise, locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMuscleGroupsForLocale(exercise.primaryMuscles, translateMuscle)}
                    </p>
                  </button>
                </li>
              );
            })}
        </ul>

        {selected ? (
          <div className="shrink-0 grid grid-cols-2 gap-3">
            <MetricInput
              kind="sets"
              label={labels.targetSets}
              value={targetSets}
              onChange={(value) => {
                setTargetSets(value ?? 1);
              }}
            />
            <MetricInput
              failureLabel={labels.failureReps}
              kind="repsPrescription"
              label={labels.targetReps}
              value={targetReps}
              onChange={(value) => {
                setTargetReps(value ?? 8);
              }}
            />
            <MetricInput
              kind="weight"
              label={labels.targetWeight}
              value={targetWeightKg}
              onChange={setTargetWeightKg}
            />
            <MetricInput
              kind="rest"
              label={labels.restSeconds}
              value={restSeconds}
              onChange={(value) => {
                setRestSeconds(value ?? 0);
              }}
            />
          </div>
        ) : null}

        <div className="shrink-0 flex gap-2">
          <Button className="min-h-12 flex-1" type="button" variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            className="min-h-12 flex-1"
            disabled={!selected}
            type="button"
            onClick={handleConfirm}
          >
            {labels.add}
          </Button>
        </div>
      </div>
    </GymAdaptiveOverlay>
  );
}
