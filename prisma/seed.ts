import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed script...');

  const email = 'admin@example.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Admin',
      email,
      password: hashedPassword,
      role: 'superAdmin',
      isActive: true,
      organizationId: 'default-org', 
    },
  });

  console.log('Admin user seeded:', email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
