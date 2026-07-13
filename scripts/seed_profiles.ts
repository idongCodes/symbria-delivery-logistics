import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROFILES_DATA = [
  { id: "39c7ffa7-646d-4f66-b986-fba5166267a6", first_name: "Idongesit", last_name: "Essien", email: "idongesit_essien@ymail.com", role: "Admin", job_title: "Developer & Admin", phone: "+17743126471" },
];

async function main() {
  for (const profile of PROFILES_DATA) {
    await prisma.profile.upsert({
      where: { id: profile.id },
      update: profile,
      create: profile,
    });
  }
  console.log('Seeded profiles successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
