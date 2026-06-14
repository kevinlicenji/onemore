import type { AnalyticsDashboard } from '../schemas/analytics.js';
import type { PersonalRecordSummary } from '../schemas/progress.js';
import type { NextWorkoutPreview } from '../schemas/workout.js';
import {
  getCurrentIsoWeekKey,
  getIsoWeekKey,
  getLocalDateKey,
  getLocalIsoWeekday,
  getPreviousIsoWeekKey,
} from './iso-week.js';

export type DashboardWeeklyTargetSource = 'program' | 'onboarding' | 'default';

/** Minimal session fields required for dashboard KPI aggregation. */
export interface DashboardSessionInput {
  id: string;
  completedAt: string;
  sessionType: 'free' | 'programmed';
  workoutDayId: string | null;
  workoutDayLabel: string | null;
  totalSets: number;
  totalVolumeKg: number;
}

/** Inputs for pure dashboard KPI computation (client or server). */
export interface DashboardComputeContext {
  timezone: string;
  locale: string;
  trainingDaysPerWeek: number | null;
  nextWorkout: NextWorkoutPreview;
  sessions: DashboardSessionInput[];
  personalRecords: PersonalRecordSummary[];
}

const DEFAULT_WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WEEKDAY_LABELS: Record<string, string[]> = {
  it: ['L', 'M', 'M', 'G', 'V', 'S', 'D'],
  en: DEFAULT_WEEKDAY_LABELS,
};

/**
 * Resolve the weekly workout target from active program or onboarding profile.
 *
 * @param nextWorkout - Next workout preview with program days.
 * @param trainingDaysPerWeek - Onboarding preference (nullable).
 */
export function resolveWeeklyTarget(
  nextWorkout: NextWorkoutPreview,
  trainingDaysPerWeek: number | null,
): { weeklyTarget: number; targetSource: DashboardWeeklyTargetSource } {
  if (nextWorkout.hasActiveAssignment && nextWorkout.days.length > 0) {
    return { weeklyTarget: nextWorkout.days.length, targetSource: 'program' };
  }
  if (trainingDaysPerWeek !== null && trainingDaysPerWeek > 0) {
    return { weeklyTarget: trainingDaysPerWeek, targetSource: 'onboarding' };
  }
  return { weeklyTarget: 3, targetSource: 'default' };
}

/**
 * Count consecutive ISO weeks (including current) with at least one completed workout.
 *
 * @param sessions - Completed sessions with timestamps.
 * @param timezone - User IANA timezone.
 */
export function computeStreakWeeks(
  sessions: Array<{ completedAt: string }>,
  timezone: string,
): number {
  const weekKeys = new Set<string>();
  for (const session of sessions) {
    weekKeys.add(getIsoWeekKey(new Date(session.completedAt), timezone));
  }

  if (weekKeys.size === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = getCurrentIsoWeekKey(timezone);

  while (weekKeys.has(cursor)) {
    streak += 1;
    cursor = getPreviousIsoWeekKey(cursor);
  }

  return streak;
}

function getWeekdayLabels(locale: string): string[] {
  return WEEKDAY_LABELS[locale] ?? DEFAULT_WEEKDAY_LABELS;
}

/**
 * Build Mon–Sun day statuses for the current calendar week in the user's timezone.
 *
 * @param sessions - Completed sessions in the current week.
 * @param timezone - User IANA timezone.
 * @param locale - BCP-47 locale for weekday labels.
 */
function buildCurrentWeekDays(
  sessions: DashboardSessionInput[],
  timezone: string,
  locale: string,
): AnalyticsDashboard['weeklyConsistency']['weekDays'] {
  const now = new Date();
  const todayKey = getLocalDateKey(now, timezone);
  const todayWeekday = getLocalIsoWeekday(now, timezone);
  const { year, month, day } = parseDateKey(todayKey);
  const mondayOffset = 1 - todayWeekday;

  const completedDateKeys = new Set<string>();
  for (const session of sessions) {
    completedDateKeys.add(getLocalDateKey(new Date(session.completedAt), timezone));
  }

  const labels = getWeekdayLabels(locale);

  return Array.from({ length: 7 }, (_, index) => {
    const isoWeekday = index + 1;
    const dateKey = formatDateKey(addDaysUtc(year, month, day, mondayOffset + index));
    const label = labels[index] ?? String(isoWeekday);
    return {
      weekday: index,
      label,
      completed: completedDateKeys.has(dateKey),
      isToday: dateKey === todayKey,
    };
  });
}

/**
 * Aggregate dashboard KPIs from session summaries and profile context.
 *
 * @param context - Sessions, PRs, timezone, and program preview.
 */
export function computeDashboardKpis(context: DashboardComputeContext): AnalyticsDashboard {
  const {
    timezone,
    locale,
    trainingDaysPerWeek,
    nextWorkout,
    sessions,
    personalRecords,
  } = context;

  const completedSessions = sessions
    .filter((session) => session.completedAt)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));

  const currentWeekKey = getCurrentIsoWeekKey(timezone);
  const previousWeekKey = getPreviousIsoWeekKey(currentWeekKey);

  const sessionsThisWeek = completedSessions.filter(
    (session) => getIsoWeekKey(new Date(session.completedAt), timezone) === currentWeekKey,
  );
  const sessionsLastWeek = completedSessions.filter(
    (session) => getIsoWeekKey(new Date(session.completedAt), timezone) === previousWeekKey,
  );

  const workoutsThisWeek = sessionsThisWeek.length;
  const weeklySetsCompleted = sessionsThisWeek.reduce((sum, session) => sum + session.totalSets, 0);
  const weeklyVolumeKg = roundKg(
    sessionsThisWeek.reduce((sum, session) => sum + session.totalVolumeKg, 0),
  );

  const lastWeekKg = roundKg(
    sessionsLastWeek.reduce((sum, session) => sum + session.totalVolumeKg, 0),
  );
  const thisWeekKg = weeklyVolumeKg;
  const progressToMatchLastWeek =
    lastWeekKg > 0 ? Math.min(100, Math.round((thisWeekKg / lastWeekKg) * 100)) : 0;

  const { weeklyTarget, targetSource } = resolveWeeklyTarget(nextWorkout, trainingDaysPerWeek);

  const lastProgrammed = completedSessions.find(
    (session) => session.sessionType === 'programmed' && session.workoutDayLabel,
  );

  const monthBounds = getCurrentMonthBounds(timezone);
  const sessionsThisMonth = completedSessions.filter((session) => {
    const completedAt = Date.parse(session.completedAt);
    return completedAt >= monthBounds.startMs && completedAt < monthBounds.endMs;
  });

  const prsThisMonth = personalRecords.filter((record) => {
    const achievedAt = Date.parse(record.achievedAt);
    return achievedAt >= monthBounds.startMs && achievedAt < monthBounds.endMs;
  });

  const last = completedSessions[0];

  return {
    streakWeeks: computeStreakWeeks(completedSessions, timezone),
    generatedAt: new Date().toISOString(),
    weeklyConsistency: {
      weekDays: buildCurrentWeekDays(sessionsThisWeek, timezone, locale),
      workoutsCompleted: workoutsThisWeek,
      weeklyTarget,
      targetSource,
    },
    volumeComparison: {
      lastWeekKg,
      thisWeekKg,
      progressToMatchLastWeek,
    },
    programNavigation: {
      lastCompletedDayLabel: lastProgrammed?.workoutDayLabel ?? null,
      nextDayLabel: nextWorkout.workoutDayLabel,
      nextWorkoutDayId: nextWorkout.workoutDayId,
      programName: nextWorkout.programName,
      hasActiveProgram: nextWorkout.hasActiveAssignment,
    },
    monthlyStats: {
      personalRecordsCount: prsThisMonth.length,
      completedSetsCount: sessionsThisMonth.reduce((sum, session) => sum + session.totalSets, 0),
    },
    workoutsThisWeek,
    weeklySetsCompleted,
    weeklyVolumeKg,
    lastWorkout: last
      ? {
          id: last.id,
          label: last.workoutDayLabel,
          completedAt: last.completedAt,
          durationSeconds: null,
        }
      : null,
    nextWorkout,
    recentPersonalRecords: personalRecords.slice(0, 5),
  };
}

function roundKg(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const parts = dateKey.split('-');
  const year = Number(parts[0] ?? '1970');
  const month = Number(parts[1] ?? '1');
  const day = Number(parts[2] ?? '1');
  return { year, month, day };
}

function formatDateKey(parts: { year: number; month: number; day: number }): string {
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${String(parts.year)}-${month}-${day}`;
}

function addDaysUtc(year: number, month: number, day: number, offset: number): {
  year: number;
  month: number;
  day: number;
} {
  const date = new Date(Date.UTC(year, month - 1, day + offset, 12, 0, 0));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getCurrentMonthBounds(timezone: string): { startMs: number; endMs: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '1970');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { startMs: start.getTime(), endMs: end.getTime() };
}
