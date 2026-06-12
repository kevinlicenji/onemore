'use client';

import type { ExerciseListItem } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useEffect, useState } from 'react';

import { MetricInput } from '@/components/metric-input';
import { AnimatedDialog } from '@/components/motion/animated-dialog';
import { getExerciseDisplayName } from '@/lib/exercise-display-name';
import { formatMuscleGroupsForLocale } from '@/lib/muscle-group-labels';
import { fetchExercises } from '@/lib/api-auth';

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
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ExerciseListItem[]>([]);
  const [selected, setSelected] = useState<ExerciseListItem | null>(null);
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(8);
  const [restSeconds, setRestSeconds] = useState(90);
  const [targetWeightKg, setTargetWeightKg] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

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
      setViewportHeight(null);
      return;
    }

    const trimmed = search.trim();
    setIsSearching(true);
    const handle = window.setTimeout(() => {
      void fetchExercises(accessToken, {
        ...(trimmed.length > 0 ? { q: trimmed } : {}),
        limit: 50,
      })
        .then((items) => {
          setResults(items);
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, trimmed.length > 0 ? 250 : 0);

    return () => {
      window.clearTimeout(handle);
    };
  }, [accessToken, open, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    function syncViewportHeight(): void {
      setViewportHeight(viewport?.height ?? null);
    }

    syncViewportHeight();
    viewport.addEventListener('resize', syncViewportHeight);
    viewport.addEventListener('scroll', syncViewportHeight);

    return () => {
      viewport.removeEventListener('resize', syncViewportHeight);
      viewport.removeEventListener('scroll', syncViewportHeight);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
  const modalHeight = viewportHeight !== null ? `${viewportHeight}px` : 'min(92dvh, 100%)';

  return (
    <AnimatedDialog
      ariaLabelledby="add-program-exercise-title"
      className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl p-0 sm:rounded-2xl"
      overlayClassName="z-[60] flex items-end p-0 sm:items-center sm:p-4"
    >
      <div
        className="flex min-h-0 w-full flex-col bg-background p-4"
        style={{ height: modalHeight, maxHeight: modalHeight }}
      >
        <h2 id="add-program-exercise-title" className="shrink-0 text-lg font-semibold">
          {labels.title}
        </h2>

        <input
          autoComplete="off"
          autoCorrect="off"
          className="mt-4 shrink-0 w-full rounded-md border px-3 py-2 text-base"
          enterKeyHint="search"
          inputMode="search"
          placeholder={labels.search}
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />

        <ul
          className="mt-3 min-h-[9rem] flex-1 overflow-y-auto overscroll-contain rounded-md border [-webkit-overflow-scrolling:touch]"
          style={{ maxHeight: selected ? '38vh' : undefined }}
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
                    className="w-full px-3 py-3 text-left hover:bg-muted/50 data-[selected=true]:bg-primary/10"
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

        {selected && (
          <div className="mt-4 shrink-0 grid grid-cols-2 gap-3">
            <MetricInput
              kind="sets"
              label={labels.targetSets}
              showLabel={false}
              value={targetSets}
              onChange={(value) => {
                setTargetSets(value ?? 1);
              }}
            />
            <MetricInput
              failureLabel={labels.failureReps}
              kind="repsPrescription"
              label={labels.targetReps}
              showLabel={false}
              value={targetReps}
              onChange={(value) => {
                setTargetReps(value ?? 8);
              }}
            />
            <MetricInput
              kind="weight"
              label={labels.targetWeight}
              showLabel={false}
              value={targetWeightKg}
              onChange={setTargetWeightKg}
            />
            <MetricInput
              kind="rest"
              label={labels.restSeconds}
              showLabel={false}
              value={restSeconds}
              onChange={(value) => {
                setRestSeconds(value ?? 0);
              }}
            />
          </div>
        )}

        <div className="mt-4 shrink-0 flex gap-2 pb-[max(0px,env(safe-area-inset-bottom))]">
          <Button className="flex-1" type="button" variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button className="flex-1" disabled={!selected} type="button" onClick={handleConfirm}>
            {labels.add}
          </Button>
        </div>
      </div>
    </AnimatedDialog>
  );
}
