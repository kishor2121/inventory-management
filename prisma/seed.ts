import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed script...');

  // 1️⃣ Create default organization
  const organization = await prisma.organization.upsert({
    where: { email: 'prewedding.attire.onrent@gmail.com' }, // unique field
    update: {},
    create: {
      organizationName: 'Pre Wedding Attire',
      ownerName: 'admim',
      description: 'Pre wedding attire',
      isActive: true,
      email: 'prewedding.admin.onrent@gmail.com',
      contactNumber: '9113089501',
      address: '375 3rd main, 9th cross, RHCS layout annapurneswari nagar banglore-560091',
      logo: '',
      activeTill: new Date('2026-07-19'),
      billingRules: ['bjkbckj kjs c'],
    },
  });

  const email = 'prewedding.admin.onrent@gmail.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'admim',
      email,
      password: hashedPassword,
      role: 'superAdmin',
      isActive: true,
      organizationId: organization.id,
    },
  });

  console.log('Default organization and admin user seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
