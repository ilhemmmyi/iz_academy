import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email    = process.argv[2] || 'admin@izacademy.com';
  const name     = process.argv[3] || 'Admin';
  const password = process.argv[4] || 'Admin@1234';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', isVerified: true },
    });
    console.log(`✓ User "${email}" promoted to ADMIN`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, password: hashed, role: 'ADMIN', isVerified: true },
  });
  console.log(`✓ Admin created — email: ${email}  password: ${password}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
