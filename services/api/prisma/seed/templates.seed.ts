import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

interface TemplateExerciseSeed {
  slug: string;
  sets: number;
  reps: number;
  rest: number;
  note?: string;
}

interface TemplateSeedRow {
  slug: string;
  objective: string;
  meta: {
    displayName: { en: string; it?: string };
    audience: string;
    daysPerWeek: number;
    equipmentProfile?: string;
    split?: string;
    tags?: string[];
    guide: { en: string; it?: string };
  };
  days: Array<{
    label: string;
    exercises: TemplateExerciseSeed[];
  }>;
}

const prisma = new PrismaClient();

async function ensureSystemOwner(): Promise<string> {
  const email = 'system@onemore.app';
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      username: 'system',
      locale: 'en',
      fitnessDataConsentedAt: new Date(),
    },
    update: {},
  });
  return user.id;
}

async function replaceTemplateDays(
  tx: Prisma.TransactionClient,
  versionId: string,
  template: TemplateSeedRow,
  slugToId: Map<string, string>,
): Promise<void> {
  await tx.programExercise.deleteMany({
    where: { workoutDay: { programVersionId: versionId } },
  });
  await tx.workoutDay.deleteMany({ where: { programVersionId: versionId } });

  for (const [dayIndex, day] of template.days.entries()) {
    const workoutDay = await tx.workoutDay.create({
      data: {
        programVersionId: versionId,
        label: day.label,
        sortOrder: dayIndex,
      },
    });

    for (const [exerciseIndex, exercise] of day.exercises.entries()) {
      const exerciseId = slugToId.get(exercise.slug);
      if (!exerciseId) {
        throw new Error(`Missing exercise slug for template: ${exercise.slug}`);
      }

      await tx.programExercise.create({
        data: {
          workoutDayId: workoutDay.id,
          exerciseLibraryId: exerciseId,
          sortOrder: exerciseIndex,
          targetSets: exercise.sets,
          targetReps: exercise.reps,
          restSeconds: exercise.rest,
          coachNote: exercise.note,
        },
      });
    }
  }
}

/**
 * Idempotent upsert of published program templates.
 */
export async function seedTemplates(): Promise<number> {
  const ownerUserId = await ensureSystemOwner();
  const seedDir = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(seedDir, 'data/templates.json'), 'utf8');
  const rows = JSON.parse(raw) as TemplateSeedRow[];

  const slugToId = new Map(
    (await prisma.exerciseLibrary.findMany({ select: { id: true, slug: true } })).map((row) => [
      row.slug,
      row.id,
    ]),
  );

  let count = 0;
  for (const template of rows) {
    const existing = await prisma.program.findFirst({
      where: { name: template.slug, isTemplate: true },
      include: {
        versions: {
          where: { status: 'published' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.program.update({
          where: { id: existing.id },
          data: {
            description: JSON.stringify(template.meta),
            objective: template.objective as Prisma.ProgramUpdateInput['objective'],
          },
        });

        const published = existing.versions[0];
        if (published) {
          await replaceTemplateDays(tx, published.id, template, slugToId);
        } else {
          const version = await tx.programVersion.create({
            data: {
              programId: existing.id,
              versionNumber: 1,
              status: 'published',
              publishedAt: new Date(),
              changeReason: 'manual',
            },
          });
          await replaceTemplateDays(tx, version.id, template, slugToId);
        }
      });
      count += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const program = await tx.program.create({
        data: {
          ownerUserId,
          name: template.slug,
          description: JSON.stringify(template.meta),
          objective: template.objective as Prisma.ProgramCreateInput['objective'],
          authorType: 'template',
          isTemplate: true,
        },
      });

      const version = await tx.programVersion.create({
        data: {
          programId: program.id,
          versionNumber: 1,
          status: 'published',
          publishedAt: new Date(),
          changeReason: 'manual',
        },
      });

      await replaceTemplateDays(tx, version.id, template, slugToId);
    });

    count += 1;
  }

  return count;
}

const isDirectRun = process.argv[1]?.includes('templates.seed');
if (isDirectRun) {
  seedTemplates()
    .then((count) => {
      console.log(`Seeded ${String(count)} templates`);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
