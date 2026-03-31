const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Set ADMIN_PASSWORD env var before seeding');
  const hash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@izacademy.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Administrateur',
      email: 'admin@izacademy.com',
      password: hash,
      role: 'ADMIN',
    },
  });
  console.log('Admin cree:', JSON.stringify(admin, null, 2));
  await prisma.$disconnect();
}

main();
