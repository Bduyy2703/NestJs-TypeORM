import { PrismaClient } from '@prisma/client';
import  users  from './seeds/users.seed';
import { Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const newUsers = users.map((user) => {
    return {
      ...user,
      roles: user.roles.map((role) => {
        return role as Role;
      }),
    };
  });

  await prisma.user.createMany({ data: newUsers });
}

main()
  .catch((err) => {
    console.log('Error', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
