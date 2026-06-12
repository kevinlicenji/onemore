/**
 * Build the curated ~160 exercise catalog from wger.de (CC-BY-SA) plus manual entries.
 * Run: pnpm --filter api seed:import-exercises
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type EquipmentType, type ExerciseCategory, isMachineEquipment } from '@onemore/shared';

const WGER_BASE = 'https://wger.de/api/v2';
const TARGET_TOTAL = 160;
const LANG_EN = 2;
const LANG_IT = 13;

const CATEGORY_QUOTAS: Record<ExerciseCategory, number> = {
  legs: 28,
  chest: 16,
  back: 18,
  shoulders: 14,
  arms: 16,
  core: 14,
  cardio: 12,
  full_body: 8,
};

interface ManualExercise {
  slug: string;
  wgerId?: number;
  names: { en: string; it?: string };
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: EquipmentType;
  isBodyweight: boolean;
}

interface WgerTranslation {
  language: number;
  name: string;
}

interface WgerExerciseInfo {
  id: number;
  category: { name: string };
  muscles: Array<{ name_en: string }>;
  muscles_secondary: Array<{ name_en: string }>;
  equipment: Array<{ name: string }>;
  translations: WgerTranslation[];
}

interface ExerciseSeedRow {
  slug: string;
  wgerId?: number;
  names: { en: string; it?: string };
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: EquipmentType;
  isBodyweight: boolean;
}

const seedDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(seedDir, '../data');

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function mapWgerCategory(name: string): ExerciseCategory {
  const normalized = name.toLowerCase();
  if (normalized.includes('chest')) return 'chest';
  if (normalized.includes('back')) return 'back';
  if (normalized.includes('leg') || normalized.includes('calf')) return 'legs';
  if (normalized.includes('shoulder')) return 'shoulders';
  if (normalized.includes('arm') || normalized.includes('biceps')) return 'arms';
  if (normalized.includes('abs') || normalized.includes('core')) return 'core';
  if (normalized.includes('cardio')) return 'cardio';
  return 'full_body';
}

function mapMuscle(nameEn: string): string {
  const value = nameEn.toLowerCase().trim();
  if (!value) return 'core';
  if (value.includes('quad')) return 'quadriceps';
  if (value.includes('hamstring')) return 'hamstrings';
  if (value.includes('glute')) return 'glutes';
  if (value.includes('calf') || value.includes('calves')) return 'calves';
  if (value.includes('shoulder')) return 'shoulders';
  if (value.includes('bicep')) return 'biceps';
  if (value.includes('tricep')) return 'triceps';
  if (value.includes('chest')) return 'chest';
  if (value.includes('back') || value.includes('lat')) return 'back';
  if (value.includes('abs') || value.includes('abdom')) return 'core';
  return value.replace(/\s+/g, '_');
}

function mapWgerEquipment(
  equipmentNames: string[],
  exerciseName: string,
): { equipment: EquipmentType; isBodyweight: boolean } {
  const joined = equipmentNames.join(' ').toLowerCase();
  const name = exerciseName.toLowerCase();

  if (name.includes('smith')) {
    return { equipment: 'smith_machine', isBodyweight: false };
  }
  if (
    name.includes('machine') ||
    name.includes('leg press') ||
    name.includes('hack squat') ||
    name.includes('pec deck')
  ) {
    return { equipment: 'machine', isBodyweight: false };
  }
  if (joined.includes('barbell')) return { equipment: 'barbell', isBodyweight: false };
  if (joined.includes('dumbbell')) return { equipment: 'dumbbell', isBodyweight: false };
  if (joined.includes('kettlebell')) return { equipment: 'kettlebell', isBodyweight: false };
  if (joined.includes('sz-bar') || joined.includes('ez'))
    return { equipment: 'ez_bar', isBodyweight: false };
  if (joined.includes('pull-up bar')) return { equipment: 'pull_up_bar', isBodyweight: true };
  if (joined.includes('resistance band'))
    return { equipment: 'resistance_band', isBodyweight: false };
  if (joined.includes('swiss ball')) return { equipment: 'medicine_ball', isBodyweight: false };
  if (joined.includes('bodyweight') || joined.includes('none')) {
    return { equipment: 'bodyweight', isBodyweight: true };
  }
  if (name.includes('cable')) return { equipment: 'cable', isBodyweight: false };
  return { equipment: 'other', isBodyweight: false };
}

async function fetchAllExerciseInfo(): Promise<WgerExerciseInfo[]> {
  const results: WgerExerciseInfo[] = [];
  let url: string | null = `${WGER_BASE}/exerciseinfo/?limit=100&language=2`;

  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`wger fetch failed: ${response.status} ${url}`);
    }
    const payload = (await response.json()) as {
      next: string | null;
      results: WgerExerciseInfo[];
    };
    results.push(...payload.results);
    url = payload.next;
  }

  return results;
}

function toSeedRow(info: WgerExerciseInfo): ExerciseSeedRow | null {
  const en = info.translations.find((t) => t.language === LANG_EN)?.name?.trim();
  if (!en) {
    return null;
  }

  const it = info.translations.find((t) => t.language === LANG_IT)?.name?.trim();
  const slug = slugify(en);
  if (!slug) {
    return null;
  }

  const primaryMuscles = info.muscles
    .map((m) => mapMuscle(m.name_en))
    .filter((m, i, arr) => m && arr.indexOf(m) === i);
  const secondaryMuscles = info.muscles_secondary
    .map((m) => mapMuscle(m.name_en))
    .filter((m, i, arr) => m && arr.indexOf(m) === i && !primaryMuscles.includes(m));

  const category = mapWgerCategory(info.category.name);
  const { equipment, isBodyweight } = mapWgerEquipment(
    info.equipment.map((e) => e.name),
    en,
  );

  return {
    slug,
    wgerId: info.id,
    names: { en, ...(it ? { it } : {}) },
    category,
    primaryMuscles:
      primaryMuscles.length > 0 ? primaryMuscles : [category === 'cardio' ? 'full_body' : category],
    secondaryMuscles,
    equipment,
    isBodyweight,
  };
}

function selectionScore(row: ExerciseSeedRow): number {
  let score = 0;
  if (isMachineEquipment(row.equipment)) score += 100;
  if (row.isBodyweight) score += 20;
  if (row.names.it) score += 10;
  if (row.wgerId) score += 5;
  return score;
}

function buildCatalog(
  manual: ManualExercise[],
  pinned: ManualExercise[],
  wgerRows: ExerciseSeedRow[],
): ExerciseSeedRow[] {
  const bySlug = new Map<string, ExerciseSeedRow>();
  for (const row of [...manual, ...pinned]) {
    bySlug.set(row.slug, row);
  }

  const categoryCounts = new Map<ExerciseCategory, number>();
  for (const row of bySlug.values()) {
    categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1);
  }

  const sortedWger = [...wgerRows].sort((a, b) => selectionScore(b) - selectionScore(a));

  for (const candidate of sortedWger) {
    if (bySlug.size >= TARGET_TOTAL) break;
    if (bySlug.has(candidate.slug)) continue;

    const count = categoryCounts.get(candidate.category) ?? 0;
    const quota = CATEGORY_QUOTAS[candidate.category];
    if (count >= quota) continue;

    bySlug.set(candidate.slug, candidate);
    categoryCounts.set(candidate.category, count + 1);
  }

  // Second pass: fill remaining slots ignoring strict quotas if under target
  if (bySlug.size < TARGET_TOTAL) {
    for (const candidate of sortedWger) {
      if (bySlug.size >= TARGET_TOTAL) break;
      if (bySlug.has(candidate.slug)) continue;
      bySlug.set(candidate.slug, candidate);
    }
  }

  return [...bySlug.values()]
    .sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug))
    .slice(0, TARGET_TOTAL);
}

async function main(): Promise<void> {
  const manualRaw = readFileSync(join(dataDir, 'exercises.manual.json'), 'utf8');
  const pinnedRaw = readFileSync(join(dataDir, 'exercises.pinned.json'), 'utf8');
  const manual = JSON.parse(manualRaw) as ManualExercise[];
  const pinned = JSON.parse(pinnedRaw) as ManualExercise[];

  console.log('Fetching wger exercise catalog…');
  const wgerInfo = await fetchAllExerciseInfo();
  const wgerRows = wgerInfo.map(toSeedRow).filter((row): row is ExerciseSeedRow => row !== null);

  const catalog = buildCatalog(manual, pinned, wgerRows);
  writeFileSync(join(dataDir, 'exercises.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  const machineCount = catalog.filter((r) => isMachineEquipment(r.equipment)).length;
  const bodyweightCount = catalog.filter((r) => r.isBodyweight).length;
  const withIt = catalog.filter((r) => r.names.it).length;

  console.log(`Wrote ${String(catalog.length)} exercises to exercises.json`);
  console.log(`  machine/smith: ${String(machineCount)}`);
  console.log(`  bodyweight: ${String(bodyweightCount)}`);
  console.log(`  with IT name: ${String(withIt)}`);

  const byCategory = new Map<string, number>();
  for (const row of catalog) {
    byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
  }
  console.log('  by category:', Object.fromEntries(byCategory));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
