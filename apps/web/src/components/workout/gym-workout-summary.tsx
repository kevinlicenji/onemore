'use client';

import type { PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

import { GymStatGrid } from '@/components/gym-ui/gym-stat-grid';
import { GymStatTile } from '@/components/gym-ui/gym-stat-tile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatWorkoutDuration } from '@/lib/format-workout-duration';
import { formatPrValue } from '@/lib/format-pr-value';
import { computeWorkoutSessionStats } from '@/lib/workout-stats';

interface GymWorkoutSummaryProps {
  session: WorkoutSessionDetail;
  locale: string;
  records: PersonalRecordSummary[];
  editHref: string;
  labels: {
    title: string;
    subtitle: string;
    duration: string;
    sets: string;
    volume: string;
    prs: string;
    prTitle: string;
    done: string;
    dashboard: string;
    editSession: string;
    deleteSession: string;
  };
  translatePrType: (type: PersonalRecordSummary['prType']) => string;
  onDelete: () => void;
}

/**
 * Full-screen mobile summary shown after completing a workout.
 */
export function GymWorkoutSummary({
  session,
  locale,
  records,
  editHref,
  labels,
  translatePrType,
  onDelete,
}: GymWorkoutSummaryProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const stats = computeWorkoutSessionStats(session);
  const durationSeconds =
    session.durationSeconds ??
    Math.max(0, Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000));

  return (
    <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col px-4 py-6">
      <motion.div
        animate={reducedMotion ? undefined : { scale: 1, opacity: 1 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/12 text-primary"
        initial={reducedMotion ? false : { scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      >
        <Trophy aria-hidden className="h-8 w-8" />
      </motion.div>

      <h1 className="mt-5 text-center text-3xl font-bold tracking-tight">{labels.title}</h1>
      <p className="mt-2 text-center text-muted-foreground">
        {session.workoutDayLabel ?? labels.subtitle}
      </p>

      <div className="mt-8">
        <GymStatGrid>
          <GymStatTile label={labels.duration} value={formatWorkoutDuration(durationSeconds)} />
          <GymStatTile label={labels.sets} value={stats.completedSets} />
          <GymStatTile label={labels.volume} unit="kg" value={stats.totalVolumeKg} />
          <GymStatTile label={labels.prs} value={records.length} />
        </GymStatGrid>
      </div>

      {records.length > 0 ? (
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {labels.prTitle}
          </p>
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl border border-green-500/25 bg-card px-4 py-3"
            >
              <p className="font-medium">{record.exerciseName}</p>
              <p className="text-sm text-muted-foreground">{translatePrType(record.prType)}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-green-600 dark:text-green-400">
                {formatPrValue(record)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button asChild className="min-h-14 text-lg">
          <Link href={`/${locale}/dashboard`}>{labels.done}</Link>
        </Button>
        <Button asChild className="min-h-11" variant="outline">
          <Link href={editHref}>{labels.editSession}</Link>
        </Button>
        <Button asChild className="min-h-11" variant="outline">
          <Link href={`/${locale}/history`}>{labels.dashboard}</Link>
        </Button>
        <Button className="min-h-11" type="button" variant="ghost" onClick={onDelete}>
          {labels.deleteSession}
        </Button>
      </div>
    </div>
  );
}
