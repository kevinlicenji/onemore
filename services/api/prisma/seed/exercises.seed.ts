import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

interface ExerciseSeedRow {
  slug: string;
  wgerId?: number;
  names: { en: string; it?: string };
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  isBodyweight: boolean;
}

const prisma = new PrismaClient();

/**
 * Idempotent upsert of curated exercise catalog from bundled JSON.
 */
export async function seedExercises(): Promise<number> {
  const seedDir = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(seedDir, 'data/exercises.json'), 'utf8');
  const rows = JSON.parse(raw) as ExerciseSeedRow[];

  let count = 0;
  for (const row of rows) {
    await prisma.exerciseLibrary.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        wgerId: row.wgerId,
        names: row.names,
        category: row.category,
        primaryMuscles: row.primaryMuscles,
        secondaryMuscles: row.secondaryMuscles,
        equipment: row.equipment,
        isBodyweight: row.isBodyweight,
      },
      update: {
        names: row.names,
        category: row.category,
        primaryMuscles: row.primaryMuscles,
        secondaryMuscles: row.secondaryMuscles,
        equipment: row.equipment,
        isBodyweight: row.isBodyweight,
        wgerId: row.wgerId ?? undefined,
        deletedAt: null,
      },
    });
    count += 1;
  }

  return count;
}

const isDirectRun = process.argv[1]?.includes('exercises.seed');
if (isDirectRun) {
  seedExercises()
    .then((count) => {
      console.log(`Seeded ${String(count)} exercises`);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
