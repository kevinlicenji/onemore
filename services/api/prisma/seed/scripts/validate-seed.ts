/**
 * Validate exercise catalog and template seed integrity.
 * Run: pnpm --filter api seed:validate
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEquipmentType, isMachineEquipment, isMuscleGroup } from '@onemore/shared';

const TARGET_EXERCISES = 160;
const MIN_MACHINE = 25;
const MIN_BODYWEIGHT = 35;

interface ExerciseRow {
  slug: string;
  category: string;
  equipment: string;
  isBodyweight: boolean;
}

interface TemplateRow {
  slug: string;
  meta: { guide?: { en?: string }; daysPerWeek?: number };
  days: Array<{ exercises: Array<{ slug: string }> }>;
}

const seedDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(seedDir, '../data');

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf8')) as T;
}

function main(): void {
  const exercises = loadJson<ExerciseRow[]>('exercises.json');
  const templates = loadJson<TemplateRow[]>('templates.json');
  const exerciseSlugs = new Set(exercises.map((row) => row.slug));
  const errors: string[] = [];

  if (exercises.length !== TARGET_EXERCISES) {
    errors.push(
      `Expected ${String(TARGET_EXERCISES)} exercises, found ${String(exercises.length)}`,
    );
  }

  const machineCount = exercises.filter((row) => isMachineEquipment(row.equipment)).length;
  if (machineCount < MIN_MACHINE) {
    errors.push(
      `Expected at least ${String(MIN_MACHINE)} machine exercises, found ${String(machineCount)}`,
    );
  }

  const bodyweightCount = exercises.filter((row) => row.isBodyweight).length;
  if (bodyweightCount < MIN_BODYWEIGHT) {
    errors.push(
      `Expected at least ${String(MIN_BODYWEIGHT)} bodyweight exercises, found ${String(bodyweightCount)}`,
    );
  }

  for (const row of exercises) {
    if (!isEquipmentType(row.equipment) && row.equipment !== 'other') {
      errors.push(`Unknown equipment "${row.equipment}" on slug ${row.slug}`);
    }

    if (!row.primaryMuscles || row.primaryMuscles.length === 0) {
      errors.push(`Exercise ${row.slug} is missing muscle tags`);
    } else if (row.primaryMuscles.length > 3) {
      errors.push(`Exercise ${row.slug} has more than 3 muscle tags`);
    } else {
      for (const tag of row.primaryMuscles) {
        if (!isMuscleGroup(tag)) {
          errors.push(`Exercise ${row.slug} has invalid muscle tag "${tag}"`);
        }
      }
    }
  }

  const slugCounts = new Map<string, number>();
  for (const row of exercises) {
    slugCounts.set(row.slug, (slugCounts.get(row.slug) ?? 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      errors.push(`Duplicate exercise slug: ${slug}`);
    }
  }

  for (const template of templates) {
    if (!template.meta.guide?.en) {
      errors.push(`Template ${template.slug} is missing meta.guide.en`);
    }
    for (const day of template.days) {
      for (const exercise of day.exercises) {
        if (!exerciseSlugs.has(exercise.slug)) {
          errors.push(`Template ${template.slug} references missing exercise: ${exercise.slug}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('Seed validation failed:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Seed validation OK: ${String(exercises.length)} exercises, ${String(templates.length)} templates, ${String(machineCount)} machine, ${String(bodyweightCount)} bodyweight`,
  );
}

main();
