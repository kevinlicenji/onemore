import { PrismaClient } from '@prisma/client';

import { seedExercises } from './exercises.seed.js';
import { seedAdminUser } from './admin-user.seed.js';
import { seedTemplates } from './templates.seed.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedAdminUser();
  const exerciseCount = await seedExercises();
  const templateCount = await seedTemplates();
  console.log(
    `Seed complete: ${String(exerciseCount)} exercises, ${String(templateCount)} templates`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
