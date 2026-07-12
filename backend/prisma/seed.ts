import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Prisma Seed] Starting seed execution...');
  // Seed logic for Master Data will go here in the future
  console.log('[Prisma Seed] Seed execution completed (stub).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
