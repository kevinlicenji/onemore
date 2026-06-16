'use client';

import type { ProgramDetail } from '@onemore/shared';
import { localizeWorkoutDayLabel } from '@onemore/shared';
import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';

import { DifficultyStepsIcon } from '@/components/difficulty-steps-icon';
import { formatMuscleGroupsForLocale } from '@/lib/muscle-group-labels';
import { formatProgramExerciseSummary } from '@/lib/program-exercise-display';

interface ProgramDayListProps {
  days: ProgramDetail['days'];
  locale: string;
  className?: string;
  onDayClick?: (dayIndex: number) => void;
}

function exerciseName(names: { en: string; it?: string }, locale: string): string {
  if (locale === 'it' && names.it) {
    return names.it;
  }
  return names.en;
}

/**
 * Read-only day-by-day program breakdown (exercises, sets, reps, rest).
 */
export function ProgramDayList({
  days,
  locale,
  className,
  onDayClick,
}: ProgramDayListProps): React.ReactElement {
  const t = useTranslations('Programs');
  const tMuscle = useTranslations('MuscleGroups');

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {days.map((day, dayIndex) => {
        const content = (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 font-semibold">
                {localizeWorkoutDayLabel(day.label, locale)}
                {day.muscleGroups.length > 0 && (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    — {formatMuscleGroupsForLocale(day.muscleGroups, tMuscle)}
                  </span>
                )}
              </h2>
              <DifficultyStepsIcon className="shrink-0" level={day.difficultyLevel} />
            </div>
            <ul className="mt-3 flex flex-col gap-3">
              {day.exercises.map((row) => (
                <li key={row.id} className="text-sm">
                  <p className="font-medium">{exerciseName(row.exercise.names, locale)}</p>
                  <p className="text-muted-foreground">
                    {formatProgramExerciseSummary(
                      row.targetSets,
                      row.targetReps,
                      row.targetWeightKg,
                      row.restSeconds,
                      t('failureReps'),
                      row.weightPrescriptionMode,
                      row.targetPercentOfMax,
                    )}
                  </p>
                  {row.coachNote && (
                    <p className="mt-1 text-xs text-muted-foreground">{row.coachNote}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        );

        if (onDayClick) {
          return (
            <button
              key={day.id}
              className="rounded-lg border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/20 active:bg-muted/30"
              type="button"
              onClick={() => {
                onDayClick(dayIndex);
              }}
            >
              {content}
            </button>
          );
        }

        return (
          <section key={day.id} className="rounded-lg border p-4">
            {content}
          </section>
        );
      })}
    </div>
  );
}
