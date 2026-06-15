import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SupplementUnit } from '@prisma/client';
import { Prisma, PrismaClient } from '@prisma/client';

interface SupplementSeedRow {
  name: { en: string; it: string };
  brand: string | null;
  unit: SupplementUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const prisma = new PrismaClient();

/**
 * Idempotent seed of global supplements (userId = null).
 * Deletes all existing global supplements first, then inserts fresh.
 */
export async function seedSupplements(): Promise<number> {
  const seedDir = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(seedDir, 'data/supplements.json'), 'utf8');
  const rows = JSON.parse(raw) as SupplementSeedRow[];

  try {
    await prisma.supplement.deleteMany({ where: { userId: null } });
    await prisma.supplement.createMany({ data: rows });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      console.warn('⚠ supplement table does not exist yet — skipping supplement seed');
      return 0;
    }
    throw err;
  }

  return rows.length;
}

const isDirectRun = process.argv[1]?.includes('supplements.seed');
if (isDirectRun) {
  seedSupplements()
    .then((count) => {
      console.log(`Seeded ${String(count)} supplements`);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
