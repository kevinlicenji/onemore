import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

const ADMIN_USERNAME = 'kevinlicenji00';
const ADMIN_EMAIL = 'kevinlicenji00@onemore.app';

/**
 * Ensure the bootstrap admin account exists with credentials from env.
 */
export async function seedAdminUser(): Promise<void> {
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password) {
    console.warn('ADMIN_SEED_PASSWORD not set — skipping admin user seed');
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const now = new Date();

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      firstName: 'Kevin',
      lastName: 'Licenji',
      displayName: 'Kevin Licenji',
      locale: 'it',
      isAdmin: true,
      fitnessDataConsentedAt: now,
      credential: {
        create: { passwordHash },
      },
    },
    update: {
      username: ADMIN_USERNAME,
      isAdmin: true,
      deletedAt: null,
      credential: {
        upsert: {
          create: { passwordHash },
          update: { passwordHash },
        },
      },
    },
  });

  console.log(`Admin user ready: ${ADMIN_USERNAME} (${ADMIN_EMAIL})`);
}
