'use client';

import { cn } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useActiveWorkoutSession } from '@/hooks/use-active-workout-session';

interface GymActiveWorkoutBarProps {
  route: string;
}

/**
 * Persistent thin bar above the tab bar when a workout is in progress.
 */
export function GymActiveWorkoutBar({ route }: GymActiveWorkoutBarProps): React.ReactElement | null {
  const t = useTranslations('Workouts');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const { session } = useActiveWorkoutSession();

  if (!session || route.startsWith('workouts/')) {
    return null;
  }

  const completed = session.exercises.filter((exercise) => exercise.status === 'completed').length;

  return (
    <Link
      className={cn(
        'fixed inset-x-0 z-30 mx-auto flex max-w-lg items-center justify-between gap-3',
        'border-t border-primary/20 bg-primary px-4 py-2.5 text-primary-foreground shadow-lg',
        'bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]',
      )}
      href={`/${locale}/workouts/${session.id}`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{t('resumeTitle')}</p>
        <p className="truncate text-xs opacity-90">
          {session.workoutDayLabel ?? t('freeWorkoutTitle')}
          {' · '}
          {t('resumeProgress', { completed, total: session.exercises.length })}
        </p>
      </div>
      <span aria-hidden className="shrink-0 text-lg font-bold">
        ›
      </span>
    </Link>
  );
}
