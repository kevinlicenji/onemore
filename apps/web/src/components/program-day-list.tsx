'use client';

import type { ProgramDetail } from '@onemore/shared';
import { useTranslations } from 'next-intl';

interface ProgramDayListProps {
  days: ProgramDetail['days'];
  locale: string;
}

function exerciseName(
  names: { en: string; it?: string },
  locale: string,
): string {
  if (locale === 'it' && names.it) {
    return names.it;
  }
  return names.en;
}

/**
 * Read-only day-by-day program breakdown (exercises, sets, reps, rest).
 */
export function ProgramDayList({ days, locale }: ProgramDayListProps): React.ReactElement {
  const t = useTranslations('Programs');

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <section key={day.id} className="rounded-lg border p-4">
          <h2 className="font-semibold">{day.label}</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {day.exercises.map((row) => (
              <li key={row.id} className="text-sm">
                <p className="font-medium">{exerciseName(row.exercise.names, locale)}</p>
                <p className="text-muted-foreground">
                  {t('exercisePrescription', {
                    sets: row.targetSets,
                    reps: row.targetReps,
                    rest: row.restSeconds,
                    weight:
                      row.targetWeightKg !== null ? `${String(row.targetWeightKg)} kg` : '—',
                  })}
                </p>
                {row.coachNote && (
                  <p className="mt-1 text-xs text-muted-foreground">{row.coachNote}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
