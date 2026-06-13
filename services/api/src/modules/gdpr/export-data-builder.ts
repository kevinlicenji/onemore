import type { PrismaClient } from '@prisma/client';

export interface GdprExportBundle {
  json: string;
  csv: string;
}

/**
 * Build GDPR export payload (JSON + workouts CSV) for a user.
 *
 * @param prisma - Database client.
 * @param userId - User to export.
 */
export async function buildGdprExportBundle(
  prisma: PrismaClient,
  userId: string,
): Promise<GdprExportBundle> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      consentRecords: true,
      workoutSessions: {
        include: {
          exerciseExecutions: {
            include: {
              setLogs: true,
              exerciseLibrary: true,
            },
          },
        },
      },
      personalRecords: { include: { exerciseLibrary: true } },
      bodyWeightLogs: true,
      programs: true,
    },
  });

  if (!user) {
    throw new Error('User not found for export');
  }

  const safeUser = user;

  const payload = {
    exportVersion: '1',
    exportedAt: new Date().toISOString(),
    user: {
      id: safeUser.id,
      email: safeUser.email,
      firstName: safeUser.firstName,
      lastName: safeUser.lastName,
      displayName: safeUser.displayName,
      username: safeUser.username,
      locale: safeUser.locale,
      birthYear: safeUser.birthYear,
      timezone: safeUser.timezone,
      trainingGoal: safeUser.trainingGoal,
      trainingLevel: safeUser.trainingLevel,
      trainingEnvironment: safeUser.trainingEnvironment,
      trainingDaysPerWeek: safeUser.trainingDaysPerWeek,
      settings: safeUser.settings,
      createdAt: safeUser.createdAt.toISOString(),
    },
    consentRecords: safeUser.consentRecords.map((record) => ({
      consentType: record.consentType,
      consentVersion: record.consentVersion,
      granted: record.granted,
      recordedAt: record.recordedAt.toISOString(),
      revokedAt: record.revokedAt?.toISOString() ?? null,
    })),
    workoutSessions: safeUser.workoutSessions.map((session) => ({
      id: session.id,
      status: session.status,
      sessionType: session.sessionType,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      durationSeconds: session.durationSeconds,
      exercises: session.exerciseExecutions.map((execution) => ({
        exerciseSlug: execution.exerciseLibrary.slug,
        sets: execution.setLogs.map((set) => ({
          setNumber: set.setNumber,
          weightKg: set.weightKg !== null ? Number(set.weightKg) : null,
          reps: set.reps,
          isCompleted: set.isCompleted,
          clientTimestamp: set.clientTimestamp.toISOString(),
        })),
      })),
    })),
    personalRecords: safeUser.personalRecords.map((record) => ({
      prType: record.prType,
      exerciseSlug: record.exerciseLibrary.slug,
      reps: record.reps,
      value: Number(record.value),
      achievedAt: record.achievedAt.toISOString(),
    })),
    bodyWeightLogs: safeUser.bodyWeightLogs.map((log) => ({
      weightKg: Number(log.weightKg),
      recordedAt: log.recordedAt.toISOString(),
      source: log.source,
    })),
    programs: safeUser.programs.map((program) => ({
      id: program.id,
      name: program.name,
      createdAt: program.createdAt.toISOString(),
    })),
  };

  const csvLines = [
    'session_id,started_at,completed_at,exercise_slug,set_number,weight_kg,reps,is_completed',
  ];

  for (const session of safeUser.workoutSessions) {
    for (const execution of session.exerciseExecutions) {
      for (const set of execution.setLogs) {
        csvLines.push(
          [
            session.id,
            session.startedAt.toISOString(),
            session.completedAt?.toISOString() ?? '',
            execution.exerciseLibrary.slug,
            String(set.setNumber),
            set.weightKg !== null ? String(Number(set.weightKg)) : '',
            set.reps !== null ? String(set.reps) : '',
            set.isCompleted ? 'true' : 'false',
          ].join(','),
        );
      }
    }
  }

  return {
    json: JSON.stringify(payload, null, 2),
    csv: csvLines.join('\n'),
  };
}
